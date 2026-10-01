/**
 * =================================================================
 * ACTION 23 — ARCHITECTURE HYBRIDE A22B → A22 → LOCAL
 * =================================================================
 * Fichier source du Worker Cloudflare — NON DÉPLOYÉ dans cette action.
 * Déploiement futur (ACTION séparée) :
 *   1. wrangler deploy (ou tableau Cloudflare) avec ce fichier ;
 *   2. définir le secret du Worker : GROQ_API_KEY (dashboard Cloudflare →
 *      Workers → Settings → Variables → Secret). La clé ne figure
 *      JAMAIS dans ce fichier ni dans le dépôt ;
 *   3. renseigner window.AI_WORKER_URL côté client (main.js) avec
 *      l'URL publique du Worker.
 *
 * SÉCURITÉ :
 *   - la clé Groq vit uniquement dans les secrets du Worker ;
 *   - CORS limité à l'origine GitHub Pages du projet ;
 *   - POST uniquement ; JSON validé ; tailles maximales imposées ;
 *   - timeout sur chaque appel Groq ; Retry-After respecté (pas de
 *     boucle de retry agressive) ; erreurs internes jamais exposées.
 *
 * ARCHITECTURE HYBRIDE (ACTION 23) :
 *   A22B (principal) : Pipeline 3 étapes spécialisées
 *     Étape 1 — ANALYSE  : diagnostic technique compact (~220 tok max)
 *     Étape 2 — TUTEUR   : explication pédagogique (~280 tok max)
 *     Étape 3 — COURS    : règle/référence + vérification (~200 tok max)
 *
 *   A22 (fallback) : Un seul appel compact (~500 tok max)
 *     Activé automatiquement sur erreur transitoire de A22B
 *     429, timeout, 5xx → déclenchent A22
 *     400, 401, 403, 413 → erreur permanente, pas de fallback
 *
 *   LOCAL (dernier recours) : 275 règles locales côté client
 *     Activé si A22B ET A22 échouent
 *     Les 275 règles locales restent la source de vérité grammaticale
 *
 * PROVENANCE DES RÉPONSES :
 *   - remote_a22b : Pipeline 3 étapes réussi
 *   - remote_a22_fallback : Fallback A22 activé
 *   - local_requis : Fallback local requis côté client
 * =================================================================
 */

// =================================================================
// CONTRAT V2 — Import du module de validation
// =================================================================
import {
    validateRequestV2,
    validateResponseV2,
    isRequestV2,
    buildEmptyResponseV2,
    buildResponseV2,
    CONTRACT_VERSION,
    V2_MAX_DIAGNOSTIC_CHARS
} from './contract-v2.js';

const ALLOWED_ORIGIN = 'https://kamel1976kamel-hub.github.io';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-20b';
const MAX_STUDENT_CHARS = 2000;
const MAX_CONTEXT_CHARS = 4000;
const MAX_REGLES = 8;
const MAX_REGLE_CHARS = 200;
const GROQ_TIMEOUT_MS = 15000;
const MAX_TOKENS_MIN = 100;
const MAX_TOKENS_MAX = 1000;
const MAX_TOKENS_DEFAULT = 300;
const TEMPERATURE_DEFAULT = 0.5;

// LOT C2 — Borne du diagnostic par mode.
// En CHAT, analysis.diagnostic porte TOUTE la réponse conversationnelle (les étapes
// TUTEUR/COURS sont sautées depuis C1) : la borne du contrat (300) coupait la réponse.
// En ACTIVITÉ, le diagnostic reste un court résumé d'analyse : borne inchangée (300).
const MAX_DIAGNOSTIC_CHARS_CHAT = 1500;

function borneDiagnostic(mode) {
    return mode === 'chat' ? MAX_DIAGNOSTIC_CHARS_CHAT : V2_MAX_DIAGNOSTIC_CHARS;
}

// ACTION 28 : Protection anti-rafale locale par instance Worker
const MAX_CONCURRENT_REQUESTS = 10;
let concurrentRequests = 0;

// =================================================================
// AUTHENTIFICATION — Constantes
// =================================================================
const AUTH_REQUIRED = true; // Production : auth obligatoire. Si DB absente → 503.
const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const SESSION_TOKEN_BYTES = 32;
const SESSION_EXPIRY_SECONDS = 4 * 60 * 60; // 4 heures
const MAX_LOGIN_ATTEMPTS = 15;
const LOCKOUT_WINDOW_SECONDS = 1800; // 30 minutes
const GLOBAL_IP_MAX_ATTEMPTS = 50; // Max tentatives (tous usernames) par IP dans la fenêtre
const BRUTE_FORCE_THRESHOLDS = [
    { attempts: 3, delay: 5 },
    { attempts: 5, delay: 30 },
    { attempts: 10, delay: 300 }
];
const RESET_RATE_LIMIT = 20; // Max resets par session concepteur
const RESET_RATE_WINDOW_SECONDS = 600; // Fenêtre de 10 minutes
// P3 : plafond de studentIds par opération bulk (D-L). Reste largement sous la
// limite D1 de 100 paramètres liés / statement même avec la CTE commune.
const PEDAGOGY_BULK_LIMIT = 25;

// =================================================================
// AUTHENTIFICATION — Fonctions utilitaires
// =================================================================

function hexEncode(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateRandomHex(bytes) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return hexEncode(arr.buffer);
}

async function sha256Hex(data) {
    const encoded = new TextEncoder().encode(data);
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    return hexEncode(hash);
}

async function hashPassword(password, pepper) {
    const salt = generateRandomHex(SALT_BYTES);
    const keyMaterial = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(password + pepper),
        'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: new TextEncoder().encode(salt),
          iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial, 256
    );
    return PBKDF2_ITERATIONS + ':' + salt + ':' + hexEncode(bits);
}

async function verifyPassword(password, pepper, storedHash) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const iterations = parseInt(parts[0], 10);
    const salt = parts[1];
    const expectedHash = parts[2];
    const keyMaterial = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(password + pepper),
        'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: new TextEncoder().encode(salt),
          iterations: iterations, hash: 'SHA-256' },
        keyMaterial, 256
    );
    const computed = hexEncode(bits);
    // Constant-time comparison
    if (computed.length !== expectedHash.length) return false;
    let result = 0;
    for (let i = 0; i < computed.length; i++) {
        result |= computed.charCodeAt(i) ^ expectedHash.charCodeAt(i);
    }
    return result === 0;
}

function generateSessionToken() {
    return generateRandomHex(SESSION_TOKEN_BYTES);
}

// Génère un mot de passe temporaire cryptographiquement aléatoire.
// Retourne UNE SEULE FOIS — ne jamais logger, stocker ou persister.
function generateTempPassword() {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars[bytes[i % bytes.length] % chars.length];
    }
    return password;
}

async function hashSessionToken(token) {
    return await sha256Hex(token);
}

function extractSessionToken(request) {
    if (!request.headers || typeof request.headers.get !== 'function') return null;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7).trim();
}

function getIPHash(request) {
    const ip = (request.headers && typeof request.headers.get === 'function')
        ? (request.headers.get('CF-Connecting-IP') || 'unknown')
        : 'unknown';
    return sha256Hex(ip);
}

function getDelayForAttempts(failCount) {
    let delay = 0;
    for (const t of BRUTE_FORCE_THRESHOLDS) {
        if (failCount >= t.attempts) delay = t.delay;
    }
    return delay;
}

async function checkBruteForce(db, username, ipHash) {
    const cutoff = new Date(Date.now() - LOCKOUT_WINDOW_SECONDS * 1000).toISOString();
    // 1. Verrouillage par username (cible spécifique)
    const byUser = await db.prepare(
        'SELECT COUNT(*) as count FROM login_attempts WHERE username = ? AND success = 0 AND attempted_at > ?'
    ).bind(username, cutoff).first();
    if (byUser.count >= MAX_LOGIN_ATTEMPTS) {
        return { locked: true, delay: 0, reason: 'locked' };
    }
    // 2. Limite globale par IP (tous usernames confondus)
    //    Empêche un attaquant de contourner la limite par username en changeant de cible.
    const globalByIP = await db.prepare(
        'SELECT COUNT(*) as count FROM login_attempts WHERE ip_hash = ? AND success = 0 AND attempted_at > ?'
    ).bind(ipHash, cutoff).first();
    if (globalByIP.count >= GLOBAL_IP_MAX_ATTEMPTS) {
        return { locked: true, delay: 0, reason: 'ip_locked' };
    }
    // 3. Délai progressif par IP
    const delay = getDelayForAttempts(globalByIP.count);
    if (delay > 0) return { locked: false, delay: delay, reason: 'throttled' };
    return { locked: false, delay: 0, reason: null };
}

async function recordLoginAttempt(db, username, ipHash, success) {
    await db.prepare(
        'INSERT INTO login_attempts (username, ip_hash, success) VALUES (?, ?, ?)'
    ).bind(username, ipHash, success ? 1 : 0).run();
}

async function validateSession(db, token) {
    const tokenHash = await hashSessionToken(token);
    const session = await db.prepare(
        'SELECT user_id, expires_at FROM sessions WHERE token_hash = ?'
    ).bind(tokenHash).first();
    if (!session) return null;
    if (new Date(session.expires_at) < new Date()) {
        await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
        return null;
    }
    return session;
}

async function cleanupExpiredSessions(db) {
    try {
        await db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(new Date().toISOString()).run();
        await db.prepare(
            'DELETE FROM login_attempts WHERE attempted_at < ?'
        ).bind(new Date(Date.now() - 86400000).toISOString()).run();
    } catch (e) { /* best-effort */ }
}

// =================================================================
// AUTHENTIFICATION — Handlers
// =================================================================

async function handleLogin(request, env) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service authentification non configuré' }, 503);
    const pepper = env.AUTH_PEPPER;
    if (!pepper) return reponseJSON({ erreur: 'Service authentification non configuré' }, 503);
    const ipHash = await getIPHash(request);
    let corps;
    try { corps = await request.json(); } catch (e) {
        return reponseJSON({ erreur: 'JSON invalide' }, 400);
    }
    const { username, password } = corps || {};
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return reponseJSON({ erreur: 'Identifiants requis' }, 400);
    }
    // Anti-brute-force
    const bf = await checkBruteForce(db, username, ipHash);
    if (bf.locked) {
        return reponseJSON({ erreur: 'Compte temporairement verrouillé' }, 429);
    }
    if (bf.delay > 0) {
        await new Promise(r => setTimeout(r, bf.delay * 1000));
    }
    // Lookup utilisateur
    const user = await db.prepare(
        'SELECT id, username, password_hash, display_name, role, concepteur, actif, must_change FROM users WHERE username = ?'
    ).bind(username.toLowerCase().trim()).first();
    if (!user) {
        await recordLoginAttempt(db, username, ipHash, false);
        return reponseJSON({ erreur: 'Identifiants invalides' }, 401);
    }
    // Vérifier mot de passe
    const valid = await verifyPassword(password, pepper, user.password_hash);
    if (!valid) {
        await recordLoginAttempt(db, username, ipHash, false);
        return reponseJSON({ erreur: 'Identifiants invalides' }, 401);
    }
    if (!user.actif) {
        await recordLoginAttempt(db, username, ipHash, false);
        return reponseJSON({ erreur: 'Compte désactivé' }, 403);
    }
    // Succès — nettoyer tentatives et créer session
    await recordLoginAttempt(db, username, ipHash, true);
    await db.prepare('DELETE FROM login_attempts WHERE username = ? AND success = 0').bind(username).run();
    const sessionToken = generateSessionToken();
    const tokenHash = await hashSessionToken(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_SECONDS * 1000).toISOString();
    await db.prepare(
        'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(tokenHash, user.id, expiresAt).run();
    return reponseJSON({
        session: sessionToken,
        user: {
            id: user.id,
            username: user.username,
            displayName: user.display_name,
            role: user.role,
            concepteur: !!user.concepteur
        },
        mustChangePassword: !!user.must_change,
        expiresAt: expiresAt
    }, 200);
}

async function handleLogout(request, env) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service authentification non configuré' }, 503);
    const token = extractSessionToken(request);
    if (token) {
        const tokenHash = await hashSessionToken(token);
        await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    }
    return reponseJSON({ message: 'Déconnexion réussie' }, 200);
}

async function handleChangePassword(request, env, session) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service authentification non configuré' }, 503);
    const pepper = env.AUTH_PEPPER;
    if (!pepper) return reponseJSON({ erreur: 'Service authentification non configuré' }, 503);
    let corps;
    try { corps = await request.json(); } catch (e) {
        return reponseJSON({ erreur: 'JSON invalide' }, 400);
    }
    const { oldPassword, newPassword } = corps || {};
    if (!oldPassword || !newPassword || typeof newPassword !== 'string') {
        return reponseJSON({ erreur: 'Ancien et nouveau mot de passe requis' }, 400);
    }
    if (newPassword.length < 8) {
        return reponseJSON({ erreur: 'Mot de passe trop court (minimum 8 caractères)' }, 400);
    }
    // Vérifier ancien mot de passe
    const user = await db.prepare(
        'SELECT id, password_hash FROM users WHERE id = ?'
    ).bind(session.user_id).first();
    if (!user) return reponseJSON({ erreur: 'Utilisateur introuvable' }, 404);
    const valid = await verifyPassword(oldPassword, pepper, user.password_hash);
    if (!valid) return reponseJSON({ erreur: 'Mot de passe incorrect' }, 401);
    // Hasher nouveau mot de passe
    const newHash = await hashPassword(newPassword, pepper);
    await db.prepare(
        'UPDATE users SET password_hash = ?, must_change = 0, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(newHash, user.id).run();
    return reponseJSON({ message: 'Mot de passe modifié' }, 200);
}

// Liste tous les utilisateurs actifs (sans password_hash).
// Réservé au concepteur authentifié.
async function handleAdminListUsers(env, concepteur) {
    const db = env.DB;
    const result = await db.prepare(
        'SELECT id, username, display_name, role, concepteur, actif, must_change, created_at, updated_at FROM users ORDER BY role DESC, display_name ASC'
    ).all();
    return reponseJSON({ users: result.results || [] }, 200);
}

// Réinitialise le mot de passe d'un utilisateur cible.
// Génère un mot de passe temporaire, stocke le hash, met must_change=1, invalide les sessions.
// Retourne le mot de passe temporaire UNE SEULE FOIS dans la réponse.
async function handleAdminResetPassword(request, env, concepteur) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    const pepper = env.AUTH_PEPPER;
    if (!pepper) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    let corps;
    try { corps = await request.json(); } catch (e) {
        return reponseJSON({ erreur: 'JSON invalide' }, 400);
    }
    const { targetUserId } = corps || {};
    if (!targetUserId || typeof targetUserId !== 'string') {
        return reponseJSON({ erreur: 'Utilisateur cible requis' }, 400);
    }
    // Interdire le reset de son propre compte via cette API
    if (targetUserId === concepteur.id) {
        return reponseJSON({ erreur: 'Opération non autorisée' }, 403);
    }
    // Rate limiting
    if (await checkResetRateLimit(db, concepteur.id)) {
        return reponseJSON({ erreur: 'Trop de réinitialisations récentes, réessayez plus tard' }, 429);
    }
    // Vérifier que la cible existe
    const target = await db.prepare(
        'SELECT id, username, display_name FROM users WHERE id = ? AND actif = 1'
    ).bind(targetUserId).first();
    if (!target) {
        return reponseJSON({ erreur: 'Utilisateur introuvable ou désactivé' }, 404);
    }
    // Générer mot de passe temporaire + hasher
    const tempPassword = generateTempPassword();
    const newHash = await hashPassword(tempPassword, pepper);
    // Stocker le hash (JAMAIS le mot de passe en clair)
    await db.prepare(
        "UPDATE users SET password_hash = ?, must_change = 1, updated_at = datetime('now') WHERE id = ?"
    ).bind(newHash, target.id).run();
    // Invalider toutes les sessions existantes de la cible
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id).run();
    // Enregistrer l'opération pour le rate limiting
    await recordResetOperation(db, concepteur.id);
    // Retourner le mot de passe temporaire UNE SEULE FOIS
    return reponseJSON({
        message: 'Mot de passe réinitialisé',
        userId: target.id,
        username: target.username,
        displayName: target.display_name,
        temporaryPassword: tempPassword
    }, 200);
}

// Réinitialise les mots de passe de plusieurs utilisateurs sélectionnés.
// Chaque utilisateur reçoit un mot de passe différent.
//
// Contrat batch :
//   1. Déduplique les IDs côté serveur.
//   2. Exclut le propre compte du concepteur.
//   3. Valide toutes les cibles AVANT toute écriture (actif, existant).
//   4. Vérifie la capacité restante du rate limiter AVANT toute écriture.
//      Si la capacité est insuffisante, le batch entier est refusé (429).
//   5. Exécute les resets uniquement si toutes les validations passent.
//
// Cibles invalides :
//   - ID non-string ou null → ignoré silencieusement (filtré par déduplication).
//   - Cible inexistante → ignorée (ne compte pas dans le capacity check).
//   - Cible inactive → ignorée (ne compte pas dans le capacity check).
//   - Propre compte du concepteur → exclu avant validation.
//   - Autre enseignant/concepteur → autorisé (même politique que le reset simple).
async function handleAdminResetBatch(request, env, concepteur) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    const pepper = env.AUTH_PEPPER;
    if (!pepper) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    let corps;
    try { corps = await request.json(); } catch (e) {
        return reponseJSON({ erreur: 'JSON invalide' }, 400);
    }
    const { targetUserIds } = corps || {};
    if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        return reponseJSON({ erreur: 'Liste d\'utilisateurs requise' }, 400);
    }
    if (targetUserIds.length > 50) {
        return reponseJSON({ erreur: 'Trop d\'utilisateurs sélectionnés (max 50)' }, 400);
    }
    // ── Étape 1 : Dédupliquer les IDs (côté Worker) ──
    const seenIds = new Set();
    const uniqueIds = [];
    for (const id of targetUserIds) {
        if (typeof id === 'string' && id !== concepteur.id && !seenIds.has(id)) {
            seenIds.add(id);
            uniqueIds.push(id);
        }
    }
    if (uniqueIds.length === 0) {
        return reponseJSON({ erreur: 'Opération non autorisée' }, 403);
    }
    // ── Étape 2 : Valider toutes les cibles AVANT toute écriture ──
    const validTargets = [];
    for (const targetId of uniqueIds) {
        const target = await db.prepare(
            'SELECT id, username, display_name FROM users WHERE id = ? AND actif = 1'
        ).bind(targetId).first();
        if (target) {
            validTargets.push(target);
        }
    }
    if (validTargets.length === 0) {
        return reponseJSON({ erreur: 'Aucun utilisateur valide à réinitialiser' }, 400);
    }
    // ── Étape 3 : Vérifier la capacité restante (fail-before-write) ──
    const currentCount = await getResetCount(db, concepteur.id);
    const remainingCapacity = RESET_RATE_LIMIT - currentCount;
    if (validTargets.length > remainingCapacity) {
        return reponseJSON({
            erreur: 'Capacité insuffisante : ' + validTargets.length + ' reset(s) demandé(s), ' + remainingCapacity + ' disponible(s). Réessayez plus tard.'
        }, 429);
    }
    // ── Étape 4 : Exécuter les resets (tous validés, capacité suffisante) ──
    const results = [];
    for (const target of validTargets) {
        const tempPassword = generateTempPassword();
        const newHash = await hashPassword(tempPassword, pepper);
        await db.prepare(
            "UPDATE users SET password_hash = ?, must_change = 1, updated_at = datetime('now') WHERE id = ?"
        ).bind(newHash, target.id).run();
        await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id).run();
        await recordResetOperation(db, concepteur.id);
        results.push({
            userId: target.id,
            username: target.username,
            displayName: target.display_name,
            temporaryPassword: tempPassword
        });
    }
    return reponseJSON({
        message: results.length + ' mot(s) de passe réinitialisé(s)',
        results: results
    }, 200);
}

async function handleMe(env, session) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service authentification non configuré' }, 503);
    const user = await db.prepare(
        'SELECT id, username, display_name, role, concepteur, actif, must_change FROM users WHERE id = ?'
    ).bind(session.user_id).first();
    if (!user) return reponseJSON({ erreur: 'Utilisateur introuvable' }, 404);
    if (!user.actif) return reponseJSON({ erreur: 'Compte désactivé' }, 403);
    return reponseJSON({
        user: {
            id: user.id,
            username: user.username,
            displayName: user.display_name,
            role: user.role,
            concepteur: !!user.concepteur
        },
        mustChangePassword: !!user.must_change
    }, 200);
}

async function requireSession(request, env) {
    const db = env.DB;
    if (!db) return { error: reponseJSON({ erreur: 'Authentification requise' }, 401) };
    const token = extractSessionToken(request);
    if (!token) return { error: reponseJSON({ erreur: 'Authentification requise' }, 401) };
    const session = await validateSession(db, token);
    if (!session) return { error: reponseJSON({ erreur: 'Session expirée' }, 401) };
    return { session: session };
}

// Vérifie que l'utilisateur authentifié est un concepteur (role=teacher, concepteur=1).
// Retourne soit { user } avec les données utilisateur, soit { error } avec une réponse 403.
async function requireConcepteur(request, env) {
    const db = env.DB;
    if (!db) return { error: reponseJSON({ erreur: 'Service non configuré' }, 503) };
    const { session, error } = await requireSession(request, env);
    if (error) return { error };
    const user = await db.prepare(
        'SELECT id, username, role, concepteur FROM users WHERE id = ?'
    ).bind(session.user_id).first();
    if (!user || user.role !== 'teacher' || !user.concepteur) {
        return { error: reponseJSON({ erreur: 'Accès refusé' }, 403) };
    }
    return { session, user };
}

async function requirePedagogieAdmin(request, env) {
    const db = env.DB;
    if (!db) return { error: reponseJSON({ erreur: 'Service non configuré' }, 503) };

    const { session, error } = await requireSession(request, env);
    if (error) return { error };

    if (!PEDAGOGIE_ADMIN_IDS.includes(session.user_id)) {
        return { error: reponseJSON({ erreur: 'Accès refusé' }, 403) };
    }

    const user = await db.prepare(
        'SELECT id, username, display_name, role, concepteur, actif FROM users WHERE id = ?'
    ).bind(session.user_id).first();

    if (!user || !user.actif) {
        return { error: reponseJSON({ erreur: 'Compte désactivé ou introuvable' }, 403) };
    }

    return { session, user };
}

// Helper : parse et valide limit/offset pour les routes pedagogie.
function parsePagination(body) {
    let limit = (body.limit === undefined || body.limit === null) ? 100 : body.limit;
    let offset = (body.offset === undefined || body.offset === null) ? 0 : body.offset;
    if (!Number.isInteger(limit) || limit < 1) return { error: 'limit doit être un entier positif' };
    if (!Number.isInteger(offset) || offset < 0) return { error: 'offset doit être un entier ≥ 0' };
    if (limit > 500) limit = 500;
    return { limit, offset };
}

// Helper : valide le paramètre status contre la liste autorisée.
function validateStatus(body, allowed) {
    let status = (body.status === undefined || body.status === null) ? 'active' : body.status;
    if (typeof status !== 'string' || !allowed.includes(status)) {
        return { error: 'status invalide (valeurs autorisées: ' + allowed.join(', ') + ')' };
    }
    return { status };
}

// Helper : valide une date stricte YYYY-MM-DD (calendrier grégorien proleptique).
function isValidDate(str) {
    if (typeof str !== 'string') return false;
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (month < 1 || month > 12 || day < 1) return false;
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

// Helper : normalise un nom d'affichage (trim + réduction des espaces internes).
// Retourne null si la valeur n'est pas une chaîne.
function normalizeDisplayName(value) {
    if (typeof value !== 'string') return null;
    return value.trim().replace(/\s+/g, ' ');
}

// Allowlist canonique des 43 chapter_id du référentiel PEP de la Gestion pédagogique.
// IDs fonctionnels stables 'pep-y{1|2}s{1|2}-NN' (année + semestre + ordre). Ce référentiel
// ne s'applique qu'aux actions pedagogie-* : les 20 IDs discours (narratif-1..resume-4)
// du contenu étudiant ne sont plus acceptés ici. Les codes visuels 'p1s1-*' de
// l'arborescence C6 restent réservés à la navigation et ne sont jamais des chapter_id.
const PEDAGOGY_CHAPTER_IDS = [
    'pep-y1s1-01', 'pep-y1s1-02', 'pep-y1s1-03', 'pep-y1s1-04', 'pep-y1s1-05',
    'pep-y1s1-06', 'pep-y1s1-07', 'pep-y1s1-08', 'pep-y1s1-09', 'pep-y1s1-10',
    'pep-y1s1-11', 'pep-y1s1-12', 'pep-y1s1-13',
    'pep-y1s2-01', 'pep-y1s2-02', 'pep-y1s2-03', 'pep-y1s2-04', 'pep-y1s2-05',
    'pep-y1s2-06', 'pep-y1s2-07', 'pep-y1s2-08', 'pep-y1s2-09', 'pep-y1s2-10',
    'pep-y1s2-11', 'pep-y1s2-12', 'pep-y1s2-13',
    'pep-y2s1-01', 'pep-y2s1-02', 'pep-y2s1-03', 'pep-y2s1-04', 'pep-y2s1-05',
    'pep-y2s1-06', 'pep-y2s1-07', 'pep-y2s1-08', 'pep-y2s1-09',
    'pep-y2s2-01', 'pep-y2s2-02', 'pep-y2s2-03', 'pep-y2s2-04', 'pep-y2s2-05',
    'pep-y2s2-06', 'pep-y2s2-07', 'pep-y2s2-08'
];

// Rate limiting pour les opérations de reset (par session concepteur).
// Retourne le nombre de resets effectués dans la fenêtre glissante.
async function getResetCount(db, concepteurId) {
    const cutoff = new Date(Date.now() - RESET_RATE_WINDOW_SECONDS * 1000).toISOString();
    const result = await db.prepare(
        "SELECT COUNT(*) as count FROM login_attempts WHERE ip_hash = ? AND attempted_at > ? AND success = 1 AND username LIKE 'reset:%'"
    ).bind(await sha256Hex('reset:' + concepteurId), cutoff).first();
    return result.count;
}

// Vérifie si la limite est atteinte (compatibilité avec handleAdminResetPassword).
async function checkResetRateLimit(db, concepteurId) {
    return (await getResetCount(db, concepteurId)) >= RESET_RATE_LIMIT;
}

async function recordResetOperation(db, concepteurId) {
    const ipHash = await sha256Hex('reset:' + concepteurId);
    await db.prepare(
        "INSERT INTO login_attempts (username, ip_hash, success) VALUES (?, ?, 1)"
    ).bind('reset:' + concepteurId, ipHash).run();
}

// CORS dynamique : vérifie l'Origin de la requête.
// Retourne les headers CORS uniquement si l'origine est autorisée
// ou si aucun Origin n'est fourni (outils serveur / tests).

// ─── BOOTSTRAP — Mécanisme temporaire à usage unique ───
// Réservé au compte teacher_001 (kamel.chellouai).
// Autorisation via secret Worker BOOTSTRAP_KEY (header X-Bootstrap-Key).
// SUPPRIMER le secret BOOTSTRAP_KEY après utilisation pour désactiver définitivement.
const BOOTSTRAP_TARGET_ID = 'teacher_001';
const PEDAGOGIE_ADMIN_IDS = ['teacher_001'];

async function handleBootstrapSetPassword(request, env) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    const pepper = env.AUTH_PEPPER;
    if (!pepper) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    // Autorisation : clé bootstrap requise
    const bootstrapKey = env.BOOTSTRAP_KEY;
    if (!bootstrapKey) return reponseJSON({ erreur: 'Bootstrap non configuré' }, 503);
    const providedKey = request.headers.get('X-Bootstrap-Key');
    if (!providedKey || providedKey !== bootstrapKey) {
        return reponseJSON({ erreur: 'Autorisation refusée' }, 403);
    }
    // Corps de la requête
    let corps;
    try { corps = await request.json(); } catch (e) {
        return reponseJSON({ erreur: 'JSON invalide' }, 400);
    }
    const { targetUserId } = corps || {};
    // Cible strictement limitée à teacher_001
    if (targetUserId !== BOOTSTRAP_TARGET_ID) {
        return reponseJSON({ erreur: 'Cible non autorisée' }, 403);
    }
    // Vérifier que la cible existe
    const target = await db.prepare(
        'SELECT id, username FROM users WHERE id = ?'
    ).bind(BOOTSTRAP_TARGET_ID).first();
    if (!target) {
        return reponseJSON({ erreur: 'Compte cible introuvable' }, 404);
    }
    // Générer mot de passe temporaire + hasher
    const tempPassword = generateTempPassword();
    const newHash = await hashPassword(tempPassword, pepper);
    // Mettre à jour le hash + must_change=1
    await db.prepare(
        "UPDATE users SET password_hash = ?, must_change = 1, updated_at = datetime('now') WHERE id = ?"
    ).bind(newHash, target.id).run();
    // Invalider toutes les sessions existantes
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id).run();
    // Retourner le mot de passe UNE SEULE FOIS
    return reponseJSON({
        message: 'Bootstrap réussi',
        userId: target.id,
        username: target.username,
        temporaryPassword: tempPassword
    }, 200);
}
function getCorsHeaders(request) {
    const origin = request.headers && typeof request.headers.get === 'function'
        ? request.headers.get('Origin') : null;
    if (!origin || origin === ALLOWED_ORIGIN) {
        return {
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        };
    }
    return {};
}

function reponseJSON(corps, statut) {
    const entetes = { 'Content-Type': 'application/json' };
    return new Response(JSON.stringify(corps), { status: statut, headers: entetes });
}

// Prompts des 3 étapes — sorties JSON strictes et bornées.
function promptSystemeAnalyse() {
    return 'Tu es un évaluateur logique rigoureux pour un élève de français. ' +
        'Réponds UNIQUEMENT avec un JSON compact valide, sans aucun texte hors JSON, en moins de 220 tokens. ' +
        'Format exact : {"diagnostic":"...","erreurs":[{"extrait":"...","type":"grammaticale|lexicale|syntaxique|formulation","correction":"..."}],"priorite":"..."} . ' +
        'Maximum 3 erreurs. Ne développe pas, n\'explique pas.';
}

function promptSystemeTuteur() {
    return 'Tu es un tuteur pédagogue empathique pour un élève de français. ' +
        'Explique l\'erreur SANS donner directement la réponse complète : utilise des questions guidées si utile. ' +
        'Réponds UNIQUEMENT avec un JSON compact valide, en moins de 280 tokens. ' +
        'Format exact : {"explication":"...","conseil":"...","exemple":"..."}.';
}

function promptSystemeCours() {
    return 'Tu rattaches l\'erreur au point de cours correspondant. ' +
        'N\'invente JAMAIS une règle : si les règles locales fournies couvrent le cas, appuie-toi dessus ; ' +
        'sinon reste générique et mets "verifie": false. ' +
        'Réponds UNIQUEMENT avec un JSON compact valide, en moins de 200 tokens. ' +
        'Format exact : {"point_cours":"...","regle":"...","exemple":"...","verifie":true}.';
}

function extraireJSON(texte) {
    try {
        return JSON.parse(texte);
    } catch (e) {
        // Tolérance : extraire le premier objet {...} embarqué.
        const debut = texte.indexOf('{');
        const fin = texte.lastIndexOf('}');
        if (debut !== -1 && fin > debut) {
            try { return JSON.parse(texte.slice(debut, fin + 1)); } catch (e2) { /* ignoré */ }
        }
        return { brut: String(texte).slice(0, 200) };
    }
}

async function appelerGroq(cle, messages, maxTokens, temperature) {
    let resp;
    try {
        resp = await fetch(GROQ_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cle },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens
            }),
            signal: AbortSignal.timeout(GROQ_TIMEOUT_MS)
        });
    } catch (e) {
        // timeout réseau / connexion : transitoire → justifie le plan B A22 (ACTION 23).
        e.transitoire = true;
        throw e;
    }

    if (resp.status === 429) {
        const retryAfter = resp.headers.get('retry-after');
        const err = new Error('Groq: quota atteint');
        err.statut = 429;
        err.retryAfter = retryAfter ? Number(retryAfter) : null;
        throw err;
    }
    if (resp.status === 401 || resp.status === 403) {
        const err = new Error('Groq: authentification refusée (clé à vérifier/révoquer)');
        err.statut = 401;
        throw err;
    }
    if (!resp.ok) {
        const err = new Error('Groq: erreur ' + resp.status);
        err.statut = resp.status;
        throw err;
    }
    let data;
    try {
        data = await resp.json();
    } catch (jsonErr) {
        // Réponse Groq non JSON : classer selon le statut HTTP pour le fallback.
        const err = new Error('Groq: réponse non JSON (statut ' + resp.status + ')');
        err.statut = resp.status;
        // Erreurs serveur Groq (5xx) = transitoires ; 4xx = permanentes.
        if (resp.status >= 500) {
            err.transitoire = true;
        }
        throw err;
    }
    const choix = data.choices && data.choices[0];
    const finishReason = choix ? choix.finish_reason : null;
    // finish_reason = 'length' → sortie tronquée : ne pas traiter comme une réponse valide.
    if (finishReason === 'length') {
        const err = new Error('Groq: sortie tronquée (finish_reason=length)');
        err.transitoire = true;
        throw err;
    }
    const contenu = choix && choix.message ? choix.message.content : '';
    return { contenu: contenu, usage: data.usage || null, finish_reason: finishReason };
}

// ACTION 23 — Classification : seules les erreurs TRANSITOIRES justifient le plan B (A22).
// 429 (quota) / timeout / 5xx = transitoires ; 400/413 (entrée) et 401/403 (clé) = permanents.
function estTransitoire(err) {
    return !!(err && (err.statut === 429 || err.statut >= 500 || err.transitoire === true));
}

// A22 — plan B : un seul appel Groq, pédagogie compacte (rôles fusionnés).
// Une seule tentative, sans boucle : si A22 échoue, le client retombe sur le local.
function promptSystemeA22() {
    return 'Tu cumules quatre rôles pédagogiques en une réponse unique et compacte : ' +
        '1) évaluateur logique (erreurs de raisonnement et de grammaire), ' +
        '2) tuteur pédagogue (explication bienveillante SANS donner la réponse directement), ' +
        '3) documentaliste (référence courte au point de cours), ' +
        '4) contrôleur qualité (aucune hallucination, aucune règle inventée). ' +
        'Réponds en français, en moins de 500 tokens, au format JSON : {"analyse":"...","pedagogie":"...","reference":"..."}.';
}

// LOT C1 — Prompt système A22 dédié au CHAT.
function promptSystemeChatA22() {
    return 'Tu es un assistant expert en français et en pédagogie pour un élève. ' +
        'Réponds à la QUESTION de l\'élève de manière claire, utile et encourageante, ' +
        'en t\'appuyant sur le contexte pédagogique fourni. ' +
        'N\'évalue pas la question et ne la traite pas comme une production à corriger : ' +
        'aucune liste d\'erreurs, aucune correction grammaticale, aucune référence de cours. ' +
        'Réponds en français, en moins de 500 tokens, au format JSON : {"diagnostic":"..."}.';
}

async function appelerA22(cle, reponseEleve, contexte, reglesLocales, systemPrompt) {
    return await appelerGroq(cle, [
        { role: 'system', content: promptSystemeA22() },
        {
            role: 'user',
            content: 'Réponse de l\'élève : ' + reponseEleve +
                (systemPrompt ? '\nInstructions : ' + systemPrompt : '') +
                (contexte ? '\nContexte : ' + contexte : '') +
                (reglesLocales.length ? '\nRègles locales déclenchées : ' + reglesLocales.join(' ; ') : '')
        }
    ], 700, 0.5);
}

// Synthétiser une réponse pédagogique textuelle à partir des étapes du pipeline.
// Le client (main.js) lit : data.choices?.[0]?.message?.content || data.analysis
function synthetiserReponsePedagogique(etapes) {
    var parts = [];
    if (etapes.analyse) {
        if (etapes.analyse.diagnostic) parts.push(etapes.analyse.diagnostic);
        if (etapes.analyse.erreurs && etapes.analyse.erreurs.length) {
            var erreursArr = Array.isArray(etapes.analyse.erreurs) ? etapes.analyse.erreurs : [];
            var erreurs = erreursArr.map(function (e) {
                return (e.extrait || '') + ' → ' + (e.correction || 'à revoir');
            });
            parts.push('Erreurs détectées : ' + erreurs.join(' ; '));
        }
    }
    if (etapes.tuteur) {
        if (etapes.tuteur.explication) parts.push(etapes.tuteur.explication);
        if (etapes.tuteur.conseil) parts.push('Conseil : ' + etapes.tuteur.conseil);
    }
    if (etapes.cours) {
        if (etapes.cours.point_cours) parts.push('Point de cours : ' + etapes.cours.point_cours);
        if (etapes.cours.regle) parts.push('Règle : ' + etapes.cours.regle);
    }
    if (etapes.a22) {
        if (etapes.a22.analyse) parts.push(etapes.a22.analyse);
        if (etapes.a22.pedagogie) parts.push(etapes.a22.pedagogie);
        if (etapes.a22.reference) parts.push('Référence : ' + etapes.a22.reference);
    }
    return parts.length > 0 ? parts.join('\n\n') : 'Analyse effectuée.';
}

// =================================================================
// PIPELINE V2 — Prompts, helpers, et pipeline A22B/Tuteur/Cours
// =================================================================

// Construit la description du contexte pour les prompts V2
function buildV2ContextPrompt(request) {
    if (request.mode === 'chat' && request.context && request.context.chat) {
        var c = request.context.chat;
        return 'Contexte : discussion sur le thème « ' + (c.topic_title || c.topic) + ' ».\n' +
            (c.topic_context ? c.topic_context + '\n' : '');
    }
    if (request.mode === 'activity' && request.context && request.context.activity) {
        var a = request.context.activity;
        return 'Contexte : activité « ' + (a.title || '') + ' » (type: ' + (a.type || 'général') + ').\n' +
            (a.instructions ? 'Consignes : ' + a.instructions + '\n' : '');
    }
    return '';
}

// Construit la description des détections locales pour les prompts V2
function buildV2DetectionsPrompt(request) {
    if (request.mode === 'chat') return '';

    if (!Array.isArray(request.local_detections) || request.local_detections.length === 0) {
        return '';
    }
    var parts = ['Indications du moteur local (à vérifier, ne pas considérer comme des vérités absolues) :'];
    for (var i = 0; i < request.local_detections.length; i++) {
        var d = request.local_detections[i];
        var line = '- « ' + (d.excerpt || '') + ' »';
        if (d.correction) line += ' → correction suggérée : « ' + d.correction + ' »';
        if (d.category) line += ' [' + d.category + ']';
        parts.push(line);
    }
    return parts.join('\n');
}

// Ensemble des rule_id envoyés dans local_detections
function buildLocalRuleIdSet(request) {
    var set = {};
    if (Array.isArray(request.local_detections)) {
        for (var i = 0; i < request.local_detections.length; i++) {
            var rid = request.local_detections[i] && request.local_detections[i].rule_id;
            if (typeof rid === 'string' && rid) {
                set[rid] = true;
            }
        }
    }
    return set;
}

// Sanitize un rule_id : ne garder que s'il est dans local_detections, sinon null
function sanitizeRuleId(ruleId, localRuleIds) {
    if (typeof ruleId !== 'string' || !ruleId) return null;
    return localRuleIds[ruleId] ? ruleId : null;
}

// LOT C1 — Prompt système CHAT V2 : rôle conversationnel.
function promptSystemeChatV2() {
    return 'Tu es un assistant expert en français et en pédagogie pour un élève. ' +
        'Réponds à la QUESTION de l\'élève de manière claire, utile et encourageante, ' +
        'en t\'appuyant sur le contexte pédagogique fourni. ' +
        'N\'évalue pas la question et ne la traite pas comme une production à corriger : ' +
        'aucune liste d\'erreurs, aucune correction orthographique de la question. ' +
        'Réponds UNIQUEMENT avec un JSON compact valide, sans texte hors JSON. ' +
        'Format : {"diagnostic":"..."} — diagnostic contient ta réponse complète. ' +
        'diagnostic ≤ 1500 caractères.';
}

// Prompt système pour l'étape 1 — ANALYSE V2
function promptSystemeAnalyseV2() {
    return 'Tu es un évaluateur rigoureux pour un élève de français.\n' +
        'Analyse le texte original de l\'élève. Les indications locales sont des suggestions à vérifier.\n' +
        'Réponds UNIQUEMENT avec un JSON compact valide, sans texte hors JSON.\n' +
        'Format : {"diagnostic":"...","erreurs":[{"extrait":"...","type":"grammaire|orthographe|vocabulaire|conjugaison|style","correction":"..." ou null,"rule_id":"..." ou null,"model_confidence":0.0-1.0}],"priorite":"..."}\n' +
        'Maximum 5 erreurs. rule_id uniquement si tu es sûr de la règle, sinon null.\n' +
        'diagnostic ≤ 300 caractères. priorite ≤ 200 caractères.';
}

// Prompt système pour l'étape 2 — TUTEUR V2
function promptSystemeTuteurV2() {
    return 'Tu es un tuteur pédagogue empathique pour un élève de français.\n' +
        'Explique pourquoi les erreurs sont importantes et comment les éviter.\n' +
        'Ne répète pas simplement l\'analyse. Guide l\'élève vers la compréhension.\n' +
        'Réponds UNIQUEMENT avec un JSON compact valide.\n' +
        'Format : {"explanation":"...","advice":"...","example":"..."}\n' +
        'explanation ≤ 400 caractères. advice ≤ 200 caractères. example ≤ 200 caractères.';
}

// Prompt système pour l'étape 3 — COURS V2
function promptSystemeCoursV2() {
    return 'Tu rattaches les erreurs au point de cours correspondant.\n' +
        'N\'invente JAMAIS une règle : si les règles locales fournies couvrent le cas, appuie-toi dessus ;\n' +
        'sinon reste générique.\n' +
        'Réponds UNIQUEMENT avec un JSON compact valide.\n' +
        'Format : {"point_cours":"...","regle":"...","exemple":"...","rule_id":"..." ou null}\n' +
        'rule_id uniquement si c\'est une règle locale fournie. Sinon null.\n' +
        'point_cours ≤ 300 caractères. regle ≤ 200 caractères. exemple ≤ 200 caractères.';
}

// Valide et normalise le résultat de l'étape Analyse
// LOT C2 — `borne` : longueur maximale du diagnostic (300 par défaut, 1500 en CHAT).
function validateAnalyseV2(raw, localRuleIds, borne) {
    var maxDiag = (typeof borne === 'number' && borne > 0) ? borne : V2_MAX_DIAGNOSTIC_CHARS;
    var result = extraireJSON(raw);
    var diagnostic = typeof result.diagnostic === 'string' ? result.diagnostic.slice(0, maxDiag) : '';
    var priorite = typeof result.priorite === 'string' ? result.priorite.slice(0, 200) : '';
    var erreurs = [];
    if (Array.isArray(result.erreurs)) {
        var max = Math.min(result.erreurs.length, 5);
        for (var i = 0; i < max; i++) {
            var e = result.erreurs[i];
            if (!e || typeof e !== 'object') continue;
            var excerpt = typeof e.extrait === 'string' ? e.extrait.slice(0, 100) : '';
            var type = typeof e.type === 'string' ? e.type.slice(0, 30) : '';
            var correction = (e.correction === null || e.correction === undefined) ? null : String(e.correction).slice(0, 150);
            var ruleId = sanitizeRuleId(e.rule_id, localRuleIds);
            var confidence = null;
            if (typeof e.model_confidence === 'number' && e.model_confidence >= 0 && e.model_confidence <= 1) {
                confidence = e.model_confidence;
            }
            erreurs.push({
                excerpt: excerpt,
                type: type,
                correction: correction,
                rule_id: ruleId,
                model_confidence: confidence,
                rule_known_locally: false, // Le Worker n'a PAS les 275 règles — ne peut pas savoir
                local_detected: ruleId !== null, // Présent dans local_detections envoyées
                model_suggested: ruleId !== null,
                validated: false // Validation finale côté frontend uniquement
            });
        }
    }
    return { diagnostic: diagnostic, erreurs: erreurs, priorite: priorite };
}

// Valide et normalise le résultat de l'étape Tuteur
function validateTuteurV2(raw) {
    var result = extraireJSON(raw);
    return {
        explanation: typeof result.explication === 'string' ? result.explication.slice(0, 400) : '',
        advice: typeof result.conseil === 'string' ? result.conseil.slice(0, 200) : '',
        example: typeof result.exemple === 'string' ? result.exemple.slice(0, 200) : ''
    };
}

// Valide et normalise le résultat de l'étape Cours
function validateCoursV2(raw, localRuleIds) {
    var result = extraireJSON(raw);
    var ruleId = sanitizeRuleId(result.rule_id, localRuleIds);
    return {
        point_cours: typeof result.point_cours === 'string' ? result.point_cours.slice(0, 300) : '',
        rule: typeof result.regle === 'string' ? result.regle.slice(0, 200) : '',
        example: typeof result.exemple === 'string' ? result.exemple.slice(0, 200) : '',
        rule_id: ruleId,
        validated: false // Validation finale côté frontend uniquement
    };
}

// Pipeline A22B V2 — 3 étapes
async function pipelineA22BV2(request, cle) {
    var estChat = (request.mode === 'chat');
    var textOriginal = request.student.text_original;
    var contextPrompt = buildV2ContextPrompt(request);
    var detectionsPrompt = buildV2DetectionsPrompt(request);
    var localRuleIds = buildLocalRuleIdSet(request);
    var localRulesUsed = Array.isArray(request.local_detections)
        ? request.local_detections.map(function(d) { return d.rule_id; }).filter(Boolean)
        : [];

    // ÉTAPE 1 — ANALYSE
    console.log('WORKER_V2: Début étape 1 (ANALYSE)');
    var debut1 = Date.now();
    var r1 = await appelerGroq(cle, [
        { role: 'system', content: estChat ? promptSystemeChatV2() : promptSystemeAnalyseV2() },
        {
            role: 'user',
            content: (estChat
                ? 'Question de l\'étudiant : "' + textOriginal + '"\n' + contextPrompt
                : 'Texte original de l\'élève : "' + textOriginal + '"\n' +
                    contextPrompt +
                    (detectionsPrompt ? detectionsPrompt + '\n' : ''))
        }
    ], 500, 0.2);
    console.log('WORKER_V2: Fin étape 1 (ANALYSE)', { dureeMs: Date.now() - debut1 });
    var analyse = validateAnalyseV2(r1.contenu, localRuleIds, borneDiagnostic(request.mode));

    var tuteur = { explanation: '', advice: '', example: '' };
    var cours = { point_cours: '', rule: '', example: '', rule_id: null, validated: false };

    if (!estChat) {
        // ÉTAPE 2 — TUTEUR
        console.log('WORKER_V2: Début étape 2 (TUTEUR)');
        var debut2 = Date.now();
        var r2 = await appelerGroq(cle, [
            { role: 'system', content: promptSystemeTuteurV2() },
            {
                role: 'user',
                content: 'Texte original de l\'élève : "' + textOriginal + '"\n' +
                    contextPrompt +
                    'Résultat de l\'analyse : ' + JSON.stringify(analyse) + '\n' +
                    (detectionsPrompt ? detectionsPrompt + '\n' : '')
            }
        ], 500, 0.7);
        console.log('WORKER_V2: Fin étape 2 (TUTEUR)', { dureeMs: Date.now() - debut2 });
        tuteur = validateTuteurV2(r2.contenu);

        // ÉTAPE 3 — COURS
        console.log('WORKER_V2: Début étape 3 (COURS)');
        var debut3 = Date.now();
        var r3 = await appelerGroq(cle, [
            { role: 'system', content: promptSystemeCoursV2() },
            {
                role: 'user',
                content: 'Texte original de l\'élève : "' + textOriginal + '"\n' +
                    contextPrompt +
                    'Résultat de l\'analyse : ' + JSON.stringify(analyse) + '\n' +
                    'Explication du tuteur : ' + JSON.stringify(tuteur) + '\n' +
                    (detectionsPrompt ? detectionsPrompt + '\n' : '')
            }
        ], 400, 0.3);
        console.log('WORKER_V2: Fin étape 3 (COURS)', { dureeMs: Date.now() - debut3 });
        cours = validateCoursV2(r3.contenu, localRuleIds);
    }

    // Construire la ResponseV2
    return buildResponseV2({
        source: 'remote_a22b',
        status: 'ok',
        diagnostic: analyse.diagnostic,
        errors: analyse.erreurs,
        priority: analyse.priorite,
        maxDiagnosticChars: borneDiagnostic(request.mode),
        tutorExplanation: tuteur.explanation,
        tutorAdvice: tuteur.advice,
        tutorExample: tuteur.example,
        coursePoint: cours.point_cours,
        courseRule: cours.rule,
        courseExample: cours.example,
        courseValidated: cours.validated,
        courseRuleId: cours.rule_id,
        model: GROQ_MODEL,
        localRulesUsed: localRulesUsed
    });
}

// Pipeline A22 V2 — fallback (1 seul appel)
async function pipelineA22V2(request, cle) {
    var estChat = (request.mode === 'chat');
    var textOriginal = request.student.text_original;
    var contextPrompt = buildV2ContextPrompt(request);
    var detectionsPrompt = buildV2DetectionsPrompt(request);
    var localRuleIds = buildLocalRuleIdSet(request);
    var localRulesUsed = Array.isArray(request.local_detections)
        ? request.local_detections.map(function(d) { return d.rule_id; }).filter(Boolean)
        : [];

    var rA = await appelerGroq(cle, [
        { role: 'system', content: estChat ? promptSystemeChatA22() : promptSystemeA22() },
        {
            role: 'user',
            content: (estChat
                ? 'Question de l\'étudiant : "' + textOriginal + '"\n' + contextPrompt
                : 'Texte original de l\'élève : "' + textOriginal + '"\n' +
                    contextPrompt +
                    (detectionsPrompt ? detectionsPrompt + '\n' : ''))
        }
    ], 700, 0.5);

    var a22 = extraireJSON(rA.contenu);

    // Mapper A22 → ResponseV2
    var analysePart = estChat
        ? (typeof a22.diagnostic === 'string' ? a22.diagnostic : '')
        : (typeof a22.analyse === 'string' ? a22.analyse : '');

    var tutorPart = estChat
        ? ''
        : (typeof a22.pedagogie === 'string' ? a22.pedagogie : '');

    var coursePart = estChat
        ? ''
        : (typeof a22.reference === 'string' ? a22.reference : '');

    return buildResponseV2({
        source: 'remote_a22_fallback',
        status: 'ok',
        diagnostic: analysePart,
        errors: [],
        priority: '',
        maxDiagnosticChars: borneDiagnostic(request.mode),
        tutorExplanation: tutorPart.slice(0, 400),
        tutorAdvice: '',
        tutorExample: '',
        coursePoint: coursePart.slice(0, 300),
        courseRule: '',
        courseExample: '',
        courseValidated: false,
        courseRuleId: null,
        model: GROQ_MODEL,
        localRulesUsed: localRulesUsed
    });
}

// Fallback local V2 — exploite les détections locales
function fallbackLocalV2(request) {
    var localRulesUsed = Array.isArray(request.local_detections)
        ? request.local_detections.map(function(d) { return d.rule_id; }).filter(Boolean)
        : [];

    if (request.mode === 'chat') {
        return buildResponseV2({
            source: 'local_rules',
            status: 'ok',
            diagnostic: 'La réponse conversationnelle n\'a pas pu être générée (service IA momentanément indisponible). Vous pouvez réessayer dans quelques instants.',
            errors: [],
            priority: '',
            tutorExplanation: '',
            tutorAdvice: '',
            tutorExample: '',
            coursePoint: '',
            courseRule: '',
            courseExample: '',
            courseValidated: false,
            courseRuleId: null,
            model: null,
            localRulesUsed: localRulesUsed
        });
    }

    var erreurs = [];
    if (Array.isArray(request.local_detections)) {
        for (var i = 0; i < request.local_detections.length && i < 5; i++) {
            var d = request.local_detections[i];
            if (!d) continue;
            erreurs.push({
                excerpt: typeof d.excerpt === 'string' ? d.excerpt : '',
                type: typeof d.category === 'string' ? d.category : '',
                correction: typeof d.correction === 'string' ? d.correction : null,
                rule_id: typeof d.rule_id === 'string' ? d.rule_id : null,
                model_confidence: null,
                rule_known_locally: false, // Worker n'a pas les 275 règles
                local_detected: true,
                model_suggested: false,
                validated: false // Validation finale côté frontend
            });
        }
    }

    var diagnostic = erreurs.length > 0
        ? erreurs.length + ' erreur(s) détectée(s) par l\'analyse locale.'
        : 'Aucune erreur détectée par l\'analyse locale.';

    return buildResponseV2({
        source: 'local_rules',
        status: 'ok',
        diagnostic: diagnostic,
        errors: erreurs,
        priority: '',
        tutorExplanation: '',
        tutorAdvice: '',
        tutorExample: '',
        coursePoint: '',
        courseRule: '',
        courseExample: '',
        courseValidated: false,
        courseRuleId: null,
        model: null,
        localRulesUsed: localRulesUsed
    });
}

// ─── GESTION PÉDAGOGIQUE — Handlers de lecture ───

async function handlePedagogieListAcademicYears(env, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};
    const statusResult = validateStatus(body, ['active', 'archived', 'all']);
    if (statusResult.error) return reponseJSON({ erreur: statusResult.error }, 400);
    const pag = parsePagination(body);
    if (pag.error) return reponseJSON({ erreur: pag.error }, 400);
    const { status } = statusResult;

    const where = status !== 'all' ? 'WHERE status = ?' : '';
    const filterParams = status !== 'all' ? [status] : [];

    const countResult = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM academic_years ${where}`
    ).bind(...filterParams).first();
    const total = countResult ? countResult.cnt : 0;

    const rows = await db.prepare(
        `SELECT id, label, starts_on, ends_on, status, created_at, updated_at FROM academic_years ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(...filterParams, pag.limit, pag.offset).all();

    const academicYears = (rows.results || []).map(r => ({
        id: r.id, label: r.label, startsOn: r.starts_on, endsOn: r.ends_on,
        status: r.status, createdAt: r.created_at, updatedAt: r.updated_at
    }));
    return reponseJSON({ academicYears, total, limit: pag.limit, offset: pag.offset }, 200);
}

async function handlePedagogieListTeachers(env, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};
    const statusResult = validateStatus(body, ['active', 'inactive', 'all']);
    if (statusResult.error) return reponseJSON({ erreur: statusResult.error }, 400);
    const pag = parsePagination(body);
    if (pag.error) return reponseJSON({ erreur: pag.error }, 400);
    const { status } = statusResult;

    const where = status !== 'all' ? 'WHERE status = ?' : '';
    const filterParams = status !== 'all' ? [status] : [];

    const countResult = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM teachers ${where}`
    ).bind(...filterParams).first();
    const total = countResult ? countResult.cnt : 0;

    const rows = await db.prepare(
        `SELECT id, user_id, display_name, status, created_at, updated_at FROM teachers ${where} ORDER BY display_name ASC LIMIT ? OFFSET ?`
    ).bind(...filterParams, pag.limit, pag.offset).all();

    const teachers = (rows.results || []).map(r => ({
        id: r.id, userId: r.user_id, displayName: r.display_name,
        status: r.status, createdAt: r.created_at, updatedAt: r.updated_at
    }));
    return reponseJSON({ teachers, total, limit: pag.limit, offset: pag.offset }, 200);
}

async function handlePedagogieListStudents(env, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};
    const statusResult = validateStatus(body, ['active', 'inactive', 'all']);
    if (statusResult.error) return reponseJSON({ erreur: statusResult.error }, 400);
    const pag = parsePagination(body);
    if (pag.error) return reponseJSON({ erreur: pag.error }, 400);
    const { status } = statusResult;

    // group_id : optional filter, must be integer > 0 if present
    let groupId = null;
    if (body.group_id !== undefined && body.group_id !== null) {
        if (!Number.isInteger(body.group_id) || body.group_id < 1) {
            return reponseJSON({ erreur: 'group_id doit être un entier > 0' }, 400);
        }
        groupId = body.group_id;
    }

    const conditions = [];
    const params = [];
    if (status !== 'all') { conditions.push('s.status = ?'); params.push(status); }

    let sql, countSql;
    if (groupId !== null) {
        conditions.push(`EXISTS (SELECT 1 FROM student_group_memberships m WHERE m.student_id = s.id AND m.group_id = ? AND m.valid_to IS NULL AND m.status = 'active')`);
        params.push(groupId);
        const whereStr = 'WHERE ' + conditions.join(' AND ');
        countSql = `SELECT COUNT(*) AS cnt FROM students s ${whereStr}`;
        sql = `SELECT s.id, s.user_id, s.matricule, s.display_name, s.status, s.created_at, s.updated_at FROM students s ${whereStr} ORDER BY s.display_name ASC LIMIT ? OFFSET ?`;
    } else {
        const whereStr = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        countSql = `SELECT COUNT(*) AS cnt FROM students s ${whereStr}`;
        sql = `SELECT s.id, s.user_id, s.matricule, s.display_name, s.status, s.created_at, s.updated_at FROM students s ${whereStr} ORDER BY s.display_name ASC LIMIT ? OFFSET ?`;
    }

    const countResult = await db.prepare(countSql).bind(...params).first();
    const total = countResult ? countResult.cnt : 0;

    const rows = await db.prepare(sql).bind(...params, pag.limit, pag.offset).all();

    const students = (rows.results || []).map(r => ({
        id: r.id, userId: r.user_id, matricule: r.matricule, displayName: r.display_name,
        status: r.status, createdAt: r.created_at, updatedAt: r.updated_at
    }));
    return reponseJSON({ students, total, limit: pag.limit, offset: pag.offset }, 200);
}

// READ-only : liste les comptes users actifs pour alimenter les selects userId
// des formulaires « Nouvel étudiant » / « Nouvel enseignant ».
// N'expose que { id, username, displayName }. Aucune écriture D1. Garde requirePedagogieAdmin.
async function handlePedagogieListUsers(env, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    // role obligatoire et borné : évite de divulguer les autres comptes.
    if (body.role !== 'student' && body.role !== 'teacher') {
        return reponseJSON({ erreur: "role invalide (valeurs autorisées: student, teacher)" }, 400);
    }
    const pag = parsePagination(body);
    if (pag.error) return reponseJSON({ erreur: pag.error }, 400);

    // excludeLinked (défaut true) : masque les users déjà liés à un profil.
    const excludeLinked = (body.excludeLinked === undefined || body.excludeLinked === null) ? true : (body.excludeLinked === true);
    const profileTable = body.role === 'teacher' ? 'teachers' : 'students';

    const conditions = ["u.role = ?", "u.actif = 1"];
    const params = [body.role];
    if (excludeLinked) {
        conditions.push(`NOT EXISTS (SELECT 1 FROM ${profileTable} p WHERE p.user_id = u.id)`);
    }
    const whereStr = 'WHERE ' + conditions.join(' AND ');

    const countSql = `SELECT COUNT(*) AS cnt FROM users u ${whereStr}`;
    const sql = `SELECT u.id, u.username, u.display_name FROM users u ${whereStr} ORDER BY u.username ASC LIMIT ? OFFSET ?`;

    const countResult = await db.prepare(countSql).bind(...params).first();
    const total = countResult ? countResult.cnt : 0;

    const rows = await db.prepare(sql).bind(...params, pag.limit, pag.offset).all();
    const users = (rows.results || []).map(r => ({ id: r.id, username: r.username, displayName: r.display_name }));
    return reponseJSON({ users, total, limit: pag.limit, offset: pag.offset }, 200);
}

async function handlePedagogieListGroups(env, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};
    const statusResult = validateStatus(body, ['active', 'inactive', 'archived', 'all']);
    if (statusResult.error) return reponseJSON({ erreur: statusResult.error }, 400);
    const pag = parsePagination(body);
    if (pag.error) return reponseJSON({ erreur: pag.error }, 400);
    const { status } = statusResult;

    // Validate optional filters strictly
    if (body.parcours !== undefined && body.parcours !== null) {
        if (!['pep', 'pem', 'pes'].includes(body.parcours)) {
            return reponseJSON({ erreur: 'parcours invalide (pep, pem ou pes attendu)' }, 400);
        }
    }
    if (body.year_number !== undefined && body.year_number !== null) {
        if (!Number.isInteger(body.year_number) || body.year_number < 1 || body.year_number > 2) {
            return reponseJSON({ erreur: 'year_number invalide (1 ou 2 attendu)' }, 400);
        }
    }
    if (body.semester_number !== undefined && body.semester_number !== null) {
        if (!Number.isInteger(body.semester_number) || body.semester_number < 1 || body.semester_number > 2) {
            return reponseJSON({ erreur: 'semester_number invalide (1 ou 2 attendu)' }, 400);
        }
    }
    if (body.academic_year_id !== undefined && body.academic_year_id !== null) {
        if (!Number.isInteger(body.academic_year_id) || body.academic_year_id < 1) {
            return reponseJSON({ erreur: 'academic_year_id doit être un entier > 0' }, 400);
        }
    }

    const conditions = [];
    const params = [];
    if (status !== 'all') { conditions.push('g.status = ?'); params.push(status); }
    if (body.academic_year_id != null) { conditions.push('g.academic_year_id = ?'); params.push(body.academic_year_id); }
    if (body.parcours != null) { conditions.push('g.parcours = ?'); params.push(body.parcours); }
    if (body.year_number != null) { conditions.push('g.year_number = ?'); params.push(body.year_number); }
    if (body.semester_number != null) { conditions.push('g.semester_number = ?'); params.push(body.semester_number); }

    const whereStr = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM groups g ${whereStr}`
    ).bind(...params).first();
    const total = countResult ? countResult.cnt : 0;

    const rows = await db.prepare(
        `SELECT g.id, g.academic_year_id, ay.label AS academic_year_label, g.parcours, g.year_number, g.semester_number, g.name, g.code, g.status, g.capacity, g.created_at, g.updated_at, (SELECT COUNT(*) FROM student_group_memberships am WHERE am.group_id = g.id AND am.status = 'active' AND am.valid_to IS NULL) AS active_members FROM groups g LEFT JOIN academic_years ay ON ay.id = g.academic_year_id ${whereStr} ORDER BY ay.label DESC, g.parcours ASC, g.year_number ASC, g.semester_number ASC, g.name ASC LIMIT ? OFFSET ?`
    ).bind(...params, pag.limit, pag.offset).all();

    const groups = (rows.results || []).map(r => ({
        id: r.id, academicYearId: r.academic_year_id, academicYearLabel: r.academic_year_label,
        parcours: r.parcours, yearNumber: r.year_number, semesterNumber: r.semester_number,
        name: r.name, code: r.code, status: r.status, capacity: r.capacity,
        activeMembers: r.active_members,
        createdAt: r.created_at, updatedAt: r.updated_at
    }));
    return reponseJSON({ groups, total, limit: pag.limit, offset: pag.offset }, 200);
}

// Lit les membres d'un groupe. Filtre de lecture uniquement (route deja garde
// par requirePedagogieAdmin). JOIN 1:1 sur students (PK) -> pas de duplication.
async function handlePedagogieListGroupMembers(env, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};
    const statusResult = validateStatus(body, ['active', 'ended', 'all']);
    if (statusResult.error) return reponseJSON({ erreur: statusResult.error }, 400);
    const pag = parsePagination(body);
    if (pag.error) return reponseJSON({ erreur: pag.error }, 400);
    if (!Number.isInteger(body.groupId) || body.groupId < 1) {
        return reponseJSON({ erreur: 'groupId doit être un entier > 0' }, 400);
    }
    const { status } = statusResult;

    const conditions = ['m.group_id = ?'];
    const params = [body.groupId];
    if (status !== 'all') { conditions.push('m.status = ?'); params.push(status); }
    const whereStr = 'WHERE ' + conditions.join(' AND ');

    const countResult = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM student_group_memberships m JOIN students s ON s.id = m.student_id ${whereStr}`
    ).bind(...params).first();
    const total = countResult ? countResult.cnt : 0;

    const rows = await db.prepare(
        `SELECT m.id, m.student_id, m.group_id, m.status, m.valid_from, m.valid_to, s.display_name AS student_display_name, s.matricule AS matricule FROM student_group_memberships m JOIN students s ON s.id = m.student_id ${whereStr} ORDER BY m.id ASC LIMIT ? OFFSET ?`
    ).bind(...params, pag.limit, pag.offset).all();

    const members = (rows.results || []).map(r => ({
        id: r.id, studentId: r.student_id, groupId: r.group_id, status: r.status,
        validFrom: r.valid_from, validTo: r.valid_to,
        studentDisplayName: r.student_display_name, matricule: r.matricule
    }));
    return reponseJSON({ members, total, limit: pag.limit, offset: pag.offset }, 200);
}

// Liste les affectations enseignant/module. Filtres optionnels ; chapterId valide
// contre PEDAGOGY_CHAPTER_IDS. Ordre stable id ASC.
async function handlePedagogieListTeacherAssignments(env, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};
    const statusResult = validateStatus(body, ['active', 'archived', 'orphan', 'all']);
    if (statusResult.error) return reponseJSON({ erreur: statusResult.error }, 400);
    const pag = parsePagination(body);
    if (pag.error) return reponseJSON({ erreur: pag.error }, 400);
    const { status } = statusResult;

    const conditions = [];
    const params = [];
    if (body.teacherUserId !== undefined && body.teacherUserId !== null) {
        if (typeof body.teacherUserId !== 'string' || !body.teacherUserId.trim()) {
            return reponseJSON({ erreur: 'teacherUserId invalide' }, 400);
        }
        conditions.push('teacher_user_id = ?'); params.push(body.teacherUserId.trim());
    }
    if (body.chapterId !== undefined && body.chapterId !== null) {
        if (typeof body.chapterId !== 'string' || !PEDAGOGY_CHAPTER_IDS.includes(body.chapterId)) {
            return reponseJSON({ erreur: 'chapterId invalide (ID technique attendu)' }, 400);
        }
        conditions.push('chapter_id = ?'); params.push(body.chapterId);
    }
    if (body.academicYearId !== undefined && body.academicYearId !== null) {
        if (!Number.isInteger(body.academicYearId) || body.academicYearId < 1) {
            return reponseJSON({ erreur: 'academicYearId doit être un entier > 0' }, 400);
        }
        conditions.push('academic_year_id = ?'); params.push(body.academicYearId);
    }
    if (status !== 'all') { conditions.push('status = ?'); params.push(status); }
    const whereStr = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM teacher_module_assignments ${whereStr}`
    ).bind(...params).first();
    const total = countResult ? countResult.cnt : 0;

    const rows = await db.prepare(
        `SELECT id, teacher_user_id, chapter_id, academic_year_id, status, valid_from, valid_to, created_at FROM teacher_module_assignments ${whereStr} ORDER BY id ASC LIMIT ? OFFSET ?`
    ).bind(...params, pag.limit, pag.offset).all();

    const assignments = (rows.results || []).map(r => ({
        id: r.id, teacherUserId: r.teacher_user_id, chapterId: r.chapter_id,
        academicYearId: r.academic_year_id, status: r.status, validFrom: r.valid_from,
        validTo: r.valid_to, createdAt: r.created_at
    }));
    return reponseJSON({ assignments, total, limit: pag.limit, offset: pag.offset }, 200);
}

// Liste les offerings. academicYearId filtre via JOIN groups (offering ne stocke
// pas l'annee). JOIN 1:1 sur groups (PK) -> pas de duplication. teacher_user_id
// nullable reste null. Ordre stable o.id ASC.
async function handlePedagogieListModuleOfferings(env, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};
    const statusResult = validateStatus(body, ['active', 'archived', 'orphan', 'all']);
    if (statusResult.error) return reponseJSON({ erreur: statusResult.error }, 400);
    const pag = parsePagination(body);
    if (pag.error) return reponseJSON({ erreur: pag.error }, 400);
    const { status } = statusResult;

    const conditions = [];
    const params = [];
    if (body.groupId !== undefined && body.groupId !== null) {
        if (!Number.isInteger(body.groupId) || body.groupId < 1) {
            return reponseJSON({ erreur: 'groupId doit être un entier > 0' }, 400);
        }
        conditions.push('o.group_id = ?'); params.push(body.groupId);
    }
    if (body.chapterId !== undefined && body.chapterId !== null) {
        if (typeof body.chapterId !== 'string' || !PEDAGOGY_CHAPTER_IDS.includes(body.chapterId)) {
            return reponseJSON({ erreur: 'chapterId invalide (ID technique attendu)' }, 400);
        }
        conditions.push('o.chapter_id = ?'); params.push(body.chapterId);
    }
    if (body.teacherUserId !== undefined && body.teacherUserId !== null) {
        if (typeof body.teacherUserId !== 'string' || !body.teacherUserId.trim()) {
            return reponseJSON({ erreur: 'teacherUserId invalide' }, 400);
        }
        conditions.push('o.teacher_user_id = ?'); params.push(body.teacherUserId.trim());
    }
    if (body.academicYearId !== undefined && body.academicYearId !== null) {
        if (!Number.isInteger(body.academicYearId) || body.academicYearId < 1) {
            return reponseJSON({ erreur: 'academicYearId doit être un entier > 0' }, 400);
        }
        conditions.push('g.academic_year_id = ?'); params.push(body.academicYearId);
    }
    if (status !== 'all') { conditions.push('o.status = ?'); params.push(status); }
    const whereStr = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM group_module_offerings o JOIN groups g ON g.id = o.group_id ${whereStr}`
    ).bind(...params).first();
    const total = countResult ? countResult.cnt : 0;

    const rows = await db.prepare(
        `SELECT o.id, o.group_id, o.chapter_id, o.teacher_user_id, o.status, o.valid_from, o.valid_to, o.created_at, g.academic_year_id AS academic_year_id FROM group_module_offerings o JOIN groups g ON g.id = o.group_id ${whereStr} ORDER BY o.id ASC LIMIT ? OFFSET ?`
    ).bind(...params, pag.limit, pag.offset).all();

    const offerings = (rows.results || []).map(r => ({
        id: r.id, groupId: r.group_id, chapterId: r.chapter_id, teacherUserId: r.teacher_user_id,
        academicYearId: r.academic_year_id, status: r.status, validFrom: r.valid_from,
        validTo: r.valid_to, createdAt: r.created_at
    }));
    return reponseJSON({ offerings, total, limit: pag.limit, offset: pag.offset }, 200);
}

// Lit l'audit log (traceabilite admin). Filtres optionnels ; ces valeurs sont des
// filtres de lecture, JAMAIS une identite d'acteur. Ordre at DESC, id DESC.
async function handlePedagogieListAuditLog(env, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};
    const pag = parsePagination(body);
    if (pag.error) return reponseJSON({ erreur: pag.error }, 400);

    const conditions = [];
    const params = [];
    if (body.actorUserId !== undefined && body.actorUserId !== null) {
        if (typeof body.actorUserId !== 'string' || !body.actorUserId.trim()) {
            return reponseJSON({ erreur: 'actorUserId invalide' }, 400);
        }
        conditions.push('actor_user_id = ?'); params.push(body.actorUserId.trim());
    }
    if (body.entityType !== undefined && body.entityType !== null) {
        if (typeof body.entityType !== 'string' || !body.entityType.trim()) {
            return reponseJSON({ erreur: 'entityType invalide' }, 400);
        }
        conditions.push('entity_type = ?'); params.push(body.entityType.trim());
    }
    if (body.entityId !== undefined && body.entityId !== null) {
        if (typeof body.entityId !== 'string' && typeof body.entityId !== 'number') {
            return reponseJSON({ erreur: 'entityId invalide' }, 400);
        }
        const v = String(body.entityId).trim();
        if (!v) return reponseJSON({ erreur: 'entityId invalide' }, 400);
        conditions.push('entity_id = ?'); params.push(v);
    }
    const whereStr = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM audit_log ${whereStr}`
    ).bind(...params).first();
    const total = countResult ? countResult.cnt : 0;

    const rows = await db.prepare(
        `SELECT id, actor_user_id, action, entity_type, entity_id, old_values, new_values, at FROM audit_log ${whereStr} ORDER BY at DESC, id DESC LIMIT ? OFFSET ?`
    ).bind(...params, pag.limit, pag.offset).all();

    const auditEntries = (rows.results || []).map(r => ({
        id: r.id, actorUserId: r.actor_user_id, action: r.action, entityType: r.entity_type,
        entityId: r.entity_id, oldValues: r.old_values, newValues: r.new_values, at: r.at
    }));
    return reponseJSON({ auditEntries, total, limit: pag.limit, offset: pag.offset }, 200);
}

// ─── GESTION PÉDAGOGIQUE — Handlers d'écriture ───

// Crée une année académique avec le rôle 'active' forcé côté serveur.
// Concurrence : un seul INSERT conditionnel (INSERT ... SELECT ... WHERE NOT EXISTS)
// garantit qu'au plus une année active peut exister. L'INSERT, l'audit et la
// relecture sont regroupés dans db.batch() (même transaction D1) : si l'audit
// échoue, la création est annulée. L'audit est lui-même conditionné par
// `WHERE changes() = 1` afin de ne rien journaliser si l'INSERT n'a rien inséré
// (année active déjà présente).
async function handlePedagogieCreateAcademicYear(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    // label : chaîne obligatoire, trimée, non vide, <= 50 caractères.
    if (typeof body.label !== 'string') {
        return reponseJSON({ erreur: 'label doit être une chaîne de caractères' }, 400);
    }
    const label = body.label.trim();
    if (!label) {
        return reponseJSON({ erreur: 'label ne peut pas être vide' }, 400);
    }
    if (label.length > 50) {
        return reponseJSON({ erreur: 'label ne peut pas dépasser 50 caractères' }, 400);
    }

    // startsOn / endsOn : optionnels (null autorisé) mais format strict YYYY-MM-DD.
    const startsOn = (body.startsOn === undefined) ? null : body.startsOn;
    const endsOn = (body.endsOn === undefined) ? null : body.endsOn;
    if (startsOn !== null && (typeof startsOn !== 'string' || !isValidDate(startsOn))) {
        return reponseJSON({ erreur: 'startsOn doit être une date valide au format YYYY-MM-DD' }, 400);
    }
    if (endsOn !== null && (typeof endsOn !== 'string' || !isValidDate(endsOn))) {
        return reponseJSON({ erreur: 'endsOn doit être une date valide au format YYYY-MM-DD' }, 400);
    }
    if (startsOn !== null && endsOn !== null && startsOn > endsOn) {
        return reponseJSON({ erreur: 'startsOn ne peut pas être postérieure à endsOn' }, 400);
    }

    // 'active' est une constante SQL (non issue de l'utilisateur). Toutes les
    // valeurs utilisateur passent par .bind().
    const newValues = JSON.stringify({ label, startsOn, endsOn, status: 'active' });

    const insertStmt = db.prepare(
        `INSERT INTO academic_years (label, starts_on, ends_on, status)
         SELECT ?, ?, ?, 'active'
         WHERE NOT EXISTS (SELECT 1 FROM academic_years WHERE status = 'active')`
    ).bind(label, startsOn, endsOn);

    // actor = user.id (exclusivement, fourni par le dispatcher après
    // requirePedagogieAdmin). entity_id = identifiant de la nouvelle année via
    // last_insert_rowid() (évalue l'INSERT academic_years qui précède). Le
    // timestamp de audit_log est laissé à sa valeur DEFAULT.
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'create_academic_year', 'academic_year', CAST(last_insert_rowid() AS TEXT), NULL, ?
         WHERE changes() = 1`
    ).bind(String(user.id), newValues);

    // Relecture par label (colonne UNIQUE) : last_insert_rowid() ne serait plus
    // fiable ici car auditStmt vient de s'exécuter.
    const selectStmt = db.prepare(
        `SELECT id, label, starts_on, ends_on, status, created_at, updated_at FROM academic_years WHERE label = ?`
    ).bind(label);

    let results;
    try {
        results = await db.batch([insertStmt, auditStmt, selectStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        // Seule contrainte UNIQUE impliquée ici : academic_years.label.
        if (/UNIQUE constraint failed/i.test(msg)) {
            return reponseJSON({ erreur: 'Une année portant ce label existe déjà' }, 409);
        }
        console.log('WORKER_ERROR pedagogie-create-academic-year (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const insertMeta = (results && results[0] && results[0].meta) ? results[0].meta : {};
    const changes = insertMeta.changes || 0;
    if (changes === 0) {
        // Une année active existe déjà : rien inséré, rien journalisé (transaction valide).
        return reponseJSON({ erreur: 'Une année académique active existe déjà' }, 409);
    }

    const fetched = (results && results[2] && Array.isArray(results[2].results)) ? results[2].results : [];
    const row = fetched[0];
    if (!row) {
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const academicYear = {
        id: row.id,
        label: row.label,
        startsOn: row.starts_on,
        endsOn: row.ends_on,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
    return reponseJSON({ academicYear }, 201);
}

// P5 (D2) — Archive une année académique : soft archive 'active' -> 'archived'.
// Décisions figées P5 : D-P5-1 pas de réactivation ; D-P5-2 payload { yearId } ;
// D-P5-3 année déjà archivée = 200 idempotent (aucune obligation d'une active) ;
// D-P5-4 aucune cascade, historique intégralement conservé (aucun DELETE, aucune
// modification des groupes/memberships/offrings liés). L'autorité d'écriture est
// le WHERE id=? AND status='active' (jamais de réécriture en course concurrente),
// selon le pattern P4 end-membership. La rotation est un enchaînement de DEUX
// opérations distinctes (archive puis create) : create-academic-year est inchangé
// et porte déjà l'unicité active atomique (WHERE NOT EXISTS active) — jamais plus
// d'une année active. Rate limiting (D-P5-8) : même mécanisme que P2/P3, clé
// 'archive-year:<actorId>' dans login_attempts, fenêtre RESET_RATE_*.
async function handlePedagogieArchiveAcademicYear(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.yearId) || body.yearId < 1) {
        return reponseJSON({ erreur: 'yearId doit être un entier > 0' }, 400);
    }
    const yearId = body.yearId;

    // Pré-lecture : 404 si inexistant + détection idempotente (statut courant).
    const existing = await db.prepare(
        `SELECT id, label, starts_on, ends_on, status, created_at, updated_at FROM academic_years WHERE id = ?`
    ).bind(yearId).first();
    if (!existing) return reponseJSON({ erreur: 'Année académique introuvable' }, 404);

    const mapYear = (r) => ({
        id: r.id, label: r.label, startsOn: r.starts_on, endsOn: r.ends_on,
        status: r.status, createdAt: r.created_at, updatedAt: r.updated_at
    });

    if (existing.status === 'archived') {
        // Déjà archivée : 200 idempotent, aucune réécriture, aucune trace d'audit.
        return reponseJSON({ academicYear: mapYear(existing) }, 200);
    }

    // Rate limiting (D-P5-8) : même mécanisme que P2/P3 avant toute écriture.
    const rlKey = 'archive-year:' + user.id;
    const rlHash = await sha256Hex(rlKey);
    const cutoff = new Date(Date.now() - RESET_RATE_WINDOW_SECONDS * 1000).toISOString();
    const rlCount = await db.prepare(
        "SELECT COUNT(*) AS c FROM login_attempts WHERE ip_hash = ? AND attempted_at > ? AND success = 1 AND username LIKE 'archive-year:%'"
    ).bind(rlHash, cutoff).first();
    if (rlCount && rlCount.c >= RESET_RATE_LIMIT) {
        return reponseJSON({ erreur: 'Trop d\u0027opérations récentes. Réessayez plus tard.' }, 429);
    }

    const oldValues = JSON.stringify({ status: 'active' });
    const newValues = JSON.stringify({ status: 'archived' });

    const updateStmt = db.prepare(
        `UPDATE academic_years
         SET status = 'archived', updated_at = datetime('now')
         WHERE id = ? AND status = 'active'`
    ).bind(yearId);

    const selectStmt = db.prepare(
        `SELECT id, label, starts_on, ends_on, status, created_at, updated_at FROM academic_years WHERE id = ?`
    ).bind(yearId);

    // Audit gardé par changes()=1 : aucune trace si une course a déjà archivé.
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'archive_academic_year', 'academic_year', ?, ?, ?
         WHERE changes() = 1`
    ).bind(String(user.id), String(yearId), oldValues, newValues);

    let results;
    try {
        results = await db.batch([updateStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log('WORKER_ERROR pedagogie-archive-academic-year (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Année académique introuvable' }, 404);

    // changes===0 ici = archivée par une course concurrente ; on renvoie
    // idempotemment l'état 'archived' courant.
    const academicYear = mapYear(row);

    if (academicYear.status === 'archived') {
        // Compteur rate-limit : best-effort après archivage réellement effectué.
        try {
            await db.prepare('INSERT INTO login_attempts (username, ip_hash, success) VALUES (?, ?, 1)').bind('archive-year:' + user.id, await sha256Hex('archive-year:' + user.id)).run();
        } catch (e) { /* ne bloque pas le résultat */ }
    }

    return reponseJSON({ academicYear }, 200);
}

// Crée un compte utilisateur (users uniquement) pour l'administration pédagogique.
// Décisions P2 : id opaque généré côté serveur (D-2), username normalisé trim+lowercase
// (D-3), mot de passe temporaire généré puis hashé et retourné UNE SEULE FOIS (D-1),
// must_change=1 (D-5), actif=1 (D-6), audit sans secret (D-7), rate limiting identique
// au reset (D-9). N'insère JAMAIS de profil teachers/students (laissé à create-teacher /
// create-student). Concurrence portée par la contrainte UNIQUE(users.username) (D-4).
async function handlePedagogieCreateUser(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    const pepper = env.AUTH_PEPPER;
    if (!pepper) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    // role : uniquement teacher ou student (jamais concepteur ici).
    const role = body.role;
    if (role !== 'teacher' && role !== 'student') {
        return reponseJSON({ erreur: 'role invalide (valeurs autorisées: teacher, student)' }, 400);
    }

    // username : trim().toLowerCase(), non vide. Aucune autre validation (pas de regex
    // inventée). La UNIQUE existante sert de garde ; le lowercase garantit la cohérence
    // avec la recherche de login (handleLogin normalise déjà en minuscules).
    const username = (typeof body.username === 'string') ? body.username.trim().toLowerCase() : '';
    if (!username) {
        return reponseJSON({ erreur: 'username requis (chaîne non vide)' }, 400);
    }

    // displayName : chaîne obligatoire, normalisée, longueur 1..120.
    const displayName = normalizeDisplayName(body.displayName);
    if (displayName === null || displayName.length < 1 || displayName.length > 120) {
        return reponseJSON({ erreur: 'displayName invalide (1 à 120 caractères)' }, 400);
    }

    // Rate limiting : même mécanisme que le reset (par session admin, fenêtre glissante).
    if (await checkResetRateLimit(db, user.id)) {
        return reponseJSON({ erreur: 'Trop de créations récentes, réessayez plus tard' }, 429);
    }

    // id opaque (équivalent lower(hex(randomblob(16)))) + mot de passe temporaire hashé.
    const newId = generateRandomHex(16);
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword, pepper);

    // INSERT limité à users. concepteur=0 / actif=1 / must_change=1 imposés côté serveur.
    // La contrainte UNIQUE(users.username) est la garde de concurrence : doublon → 409.
    const insertStmt = db.prepare(
        `INSERT INTO users (id, username, password_hash, display_name, role, concepteur, actif, must_change)
         VALUES (?, ?, ?, ?, ?, 0, 1, 1)`
    ).bind(newId, username, passwordHash, displayName, role);

    // Audit sans secret : new_values = {username, role, displayName} uniquement.
    // actor = user.id (session), entity_id = users.id. Gardé par changes() = 1.
    const auditValues = JSON.stringify({ username, role, displayName });
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'create_user', 'user', ?, NULL, ?
         WHERE changes() = 1`
    ).bind(String(user.id), newId, auditValues);

    // Relecture par id ; ne projette JAMAIS password_hash.
    const selectStmt = db.prepare(
        `SELECT id, username, display_name, role, actif, must_change FROM users WHERE id = ?`
    ).bind(newId);

    let results;
    try {
        results = await db.batch([insertStmt, auditStmt, selectStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        if (/UNIQUE constraint failed/i.test(msg)) {
            return reponseJSON({ erreur: "Ce nom d'utilisateur est déjà utilisé" }, 409);
        }
        console.log('WORKER_ERROR pedagogie-create-user (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const changes = (results && results[0] && results[0].meta) ? (results[0].meta.changes || 0) : 0;
    if (changes === 0) {
        return reponseJSON({ erreur: "Ce nom d'utilisateur est déjà utilisé" }, 409);
    }

    const fetched = (results && results[2] && Array.isArray(results[2].results)) ? results[2].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Erreur de base de données' }, 500);

    // Comptabiliser l'opération réussie pour le rate limiting.
    await recordResetOperation(db, user.id);

    // Retourner le mot de passe temporaire UNE SEULE FOIS. Jamais le hash.
    return reponseJSON({
        user: {
            id: row.id,
            username: row.username,
            displayName: row.display_name,
            role: row.role,
            actif: row.actif,
            mustChange: row.must_change
        },
        temporaryPassword: tempPassword
    }, 201);
}

// Crée un profil enseignant lié à un users.id existant avec role='teacher'.
// Intégrité/concurrence : INSERT conditionnel (WHERE EXISTS user teacher) +
// audit gardé par `WHERE changes() = 1`, le tout dans une transaction db.batch().
// La relecture se fait par user_id (colonne UNIQUE), insensible à last_insert_rowid().
async function handlePedagogieCreateTeacher(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    // userId : chaîne non vide après trim.
    const userId = (typeof body.userId === 'string') ? body.userId.trim() : '';
    if (!userId) {
        return reponseJSON({ erreur: 'userId doit être une chaîne non vide' }, 400);
    }

    // displayName : chaîne obligatoire, normalisée, longueur 1..120.
    const displayName = normalizeDisplayName(body.displayName);
    if (displayName === null || displayName.length < 1 || displayName.length > 120) {
        return reponseJSON({ erreur: 'displayName invalide (1 à 120 caractères)' }, 400);
    }

    // status jamais accepté depuis le client : 'active' est imposé côté serveur.
    // Pré-lecture de classification : users.id existe-t-il ? role = teacher ?
    const target = await db.prepare('SELECT id, role FROM users WHERE id = ?').bind(userId).first();
    if (!target) {
        return reponseJSON({ erreur: 'Utilisateur introuvable' }, 404);
    }
    if (target.role !== 'teacher') {
        return reponseJSON({ erreur: 'Rôle teacher requis pour cet utilisateur' }, 400);
    }

    const newValues = JSON.stringify({ userId, displayName, status: 'active' });

    const insertStmt = db.prepare(
        `INSERT INTO teachers (user_id, display_name, status)
         SELECT ?, ?, 'active'
         WHERE EXISTS (SELECT 1 FROM users WHERE id = ? AND role = 'teacher')`
    ).bind(userId, displayName, userId);

    // actor = user.id (session), jamais depuis le body. entity_id = teachers.id.
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'create_teacher', 'teacher', CAST(last_insert_rowid() AS TEXT), NULL, ?
         WHERE changes() = 1`
    ).bind(String(user.id), newValues);

    const selectStmt = db.prepare(
        `SELECT id, user_id, display_name, status, created_at, updated_at FROM teachers WHERE user_id = ?`
    ).bind(userId);

    let results;
    try {
        results = await db.batch([insertStmt, auditStmt, selectStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        if (/UNIQUE constraint failed/i.test(msg)) {
            return reponseJSON({ erreur: 'Ce userId a déjà un profil enseignant' }, 409);
        }
        console.log('WORKER_ERROR pedagogie-create-teacher (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const changes = (results && results[0] && results[0].meta) ? (results[0].meta.changes || 0) : 0;
    if (changes === 0) {
        // Course : le target n'est plus un enseignant éligible à l'écriture.
        return reponseJSON({ erreur: 'Utilisateur introuvable' }, 404);
    }

    const fetched = (results && results[2] && Array.isArray(results[2].results)) ? results[2].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Erreur de base de données' }, 500);

    const teacher = {
        id: row.id, userId: row.user_id, displayName: row.display_name,
        status: row.status, createdAt: row.created_at, updatedAt: row.updated_at
    };
    return reponseJSON({ teacher }, 201);
}

// Crée un profil étudiant. userId et matricule optionnels (NULL autorisé).
// Relecture par id = last_insert_rowid() AVANT l'audit (le SELECT intermédiaire ne
// modifie ni last_insert_rowid() ni changes()), puis audit gardé par changes() = 1.
async function handlePedagogieCreateStudent(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    // displayName : chaîne obligatoire, normalisée, 1..120.
    const displayName = normalizeDisplayName(body.displayName);
    if (displayName === null || displayName.length < 1 || displayName.length > 120) {
        return reponseJSON({ erreur: 'displayName invalide (1 à 120 caractères)' }, 400);
    }

    // userId : absent/null -> NULL ; fourni -> chaîne non vide après trim.
    let userId = null;
    if (body.userId !== undefined && body.userId !== null) {
        if (typeof body.userId !== 'string') {
            return reponseJSON({ erreur: 'userId doit être une chaîne' }, 400);
        }
        const trimmed = body.userId.trim();
        if (!trimmed) {
            return reponseJSON({ erreur: 'userId ne peut pas être vide' }, 400);
        }
        userId = trimmed;
    }

    // matricule : absent/null -> NULL ; fourni -> chaîne non vide après trim, <= 64.
    let matricule = null;
    if (body.matricule !== undefined && body.matricule !== null) {
        if (typeof body.matricule !== 'string') {
            return reponseJSON({ erreur: 'matricule doit être une chaîne' }, 400);
        }
        const trimmed = body.matricule.trim();
        if (!trimmed) {
            return reponseJSON({ erreur: 'matricule ne peut pas être vide' }, 400);
        }
        if (trimmed.length > 64) {
            return reponseJSON({ erreur: 'matricule ne peut pas dépasser 64 caractères' }, 400);
        }
        matricule = trimmed;
    }

    // Si userId fourni : doit exister dans users (aucune exigence de rôle).
    if (userId !== null) {
        const target = await db.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
        if (!target) {
            return reponseJSON({ erreur: 'Utilisateur introuvable' }, 404);
        }
    }

    const newValues = JSON.stringify({ userId, matricule, displayName, status: 'active' });

    // INSERT : conditionné par l'existence users.id si userId fourni, sinon simple.
    const insertStmt = (userId !== null)
        ? db.prepare(
            `INSERT INTO students (user_id, matricule, display_name, status)
             SELECT ?, ?, ?, 'active'
             WHERE EXISTS (SELECT 1 FROM users WHERE id = ?)`
        ).bind(userId, matricule, displayName, userId)
        : db.prepare(
            `INSERT INTO students (user_id, matricule, display_name, status)
             VALUES (NULL, ?, ?, 'active')`
        ).bind(matricule, displayName);

    // Relecture par id = last_insert_rowid() (= students.id), AVANT l'audit.
    const selectStmt = db.prepare(
        `SELECT id, user_id, matricule, display_name, status, created_at, updated_at FROM students WHERE id = last_insert_rowid()`
    );

    // Audit gardé par changes() = 1 ; entity_id = students.id (last_insert_rowid()).
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'create_student', 'student', CAST(last_insert_rowid() AS TEXT), NULL, ?
         WHERE changes() = 1`
    ).bind(String(user.id), newValues);

    let results;
    try {
        results = await db.batch([insertStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        if (/students\.user_id/i.test(msg)) {
            return reponseJSON({ erreur: 'Ce userId est déjà associé à un profil étudiant' }, 409);
        }
        if (/students\.matricule/i.test(msg)) {
            return reponseJSON({ erreur: 'Ce matricule est déjà utilisé' }, 409);
        }
        if (/UNIQUE constraint failed/i.test(msg)) {
            return reponseJSON({ erreur: 'Valeur déjà utilisée' }, 409);
        }
        console.log('WORKER_ERROR pedagogie-create-student (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const changes = (results && results[0] && results[0].meta) ? (results[0].meta.changes || 0) : 0;
    if (changes === 0) {
        // Course : userId fourni mais disparu entre pré-lecture et batch.
        return reponseJSON({ erreur: 'Utilisateur introuvable' }, 404);
    }

    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Erreur de base de données' }, 500);

    const student = {
        id: row.id, userId: row.user_id, matricule: row.matricule, displayName: row.display_name,
        status: row.status, createdAt: row.created_at, updatedAt: row.updated_at
    };
    return reponseJSON({ student }, 201);
}

// ─── P6.2 — CYCLE DE VIE DES PROFILS (GO GLOBAL P6) ────────────────────────
// teachers/students : CHECK statut 'active|inactive' uniquement (aucune
// migration D1 autorisée -> pas d'archived). Champs éditables : display_name
// (+ matricule pour students, unicité maintenue par la contrainte UNIQUE).
// user_id JAMAIS modifiable. Cycle active ↔ inactive : la réactivation passe
// par update_* (champ status), la désactivation par inactivate_* (motif P5).
// users.actif n'est jamais touché. Aucune cascade : inactiver un student ne
// clôture pas ses memberships ; les gardes d'éligibilité P3 (st.status=
// 'active') bloquent déjà les nouvelles opérations sur profils inactifs.
const P6_TEACHER_SELECT_SQL = `SELECT id, user_id, display_name, status, created_at, updated_at FROM teachers WHERE id = ?`;
const P6_STUDENT_SELECT_SQL = `SELECT id, user_id, matricule, display_name, status, created_at, updated_at FROM students WHERE id = ?`;

function _p6MapTeacherRow(row) {
    return { id: row.id, userId: row.user_id, displayName: row.display_name, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}
function _p6MapStudentRow(row) {
    return { id: row.id, userId: row.user_id, matricule: row.matricule, displayName: row.display_name, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at };
}

// displayName : mêmes règles que la création (miroir exact).
function _p6ValidDisplayName(raw) {
    const displayName = normalizeDisplayName(raw);
    if (displayName === null || displayName.length < 1 || displayName.length > 120) return { error: 'displayName invalide (1 à 120 caractères)' };
    return { value: displayName };
}
// matricule : même règle que la création ; null = retirer (UNIQUE admet NULL).
function _p6ValidMatricule(raw) {
    if (raw === null) return { value: null };
    if (typeof raw !== 'string') return { error: 'matricule doit être une chaîne' };
    const trimmed = raw.trim();
    if (!trimmed) return { error: 'matricule ne peut pas être vide' };
    if (trimmed.length > 64) return { error: 'matricule ne peut pas dépasser 64 caractères' };
    return { value: trimmed };
}
// status dans update_* : uniquement 'active' (réactivation) ou 'inactive' —
// mêmes valeurs que le CHECK ; jamais 'archived' (impossible sans migration).
function _p6ValidStatus(raw) {
    if (raw !== 'active' && raw !== 'inactive') return { error: 'status invalide (active ou inactive attendu)' };
    return { value: raw };
}

async function handlePedagogieUpdateTeacher(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.teacherId) || body.teacherId < 1) {
        return reponseJSON({ erreur: 'teacherId doit être un entier > 0' }, 400);
    }
    const teacherId = body.teacherId;

    let displayName = null;
    if (_p6Present(body.displayName)) {
        const chk = _p6ValidDisplayName(body.displayName);
        if (chk.error) return reponseJSON({ erreur: chk.error }, 400);
        displayName = chk.value;
    }
    const statusPresent = _p6Present(body.status);
    let status = null;
    if (statusPresent) {
        const chk = _p6ValidStatus(body.status);
        if (chk.error) return reponseJSON({ erreur: chk.error }, 400);
        status = chk.value;
    }
    if (!_p6Present(body.displayName) && !statusPresent) {
        return reponseJSON({ erreur: 'Rien à mettre à jour (displayName ou status attendu)' }, 400);
    }

    const existing = await db.prepare(P6_TEACHER_SELECT_SQL).bind(teacherId).first();
    if (!existing) return reponseJSON({ erreur: 'Profil enseignant introuvable' }, 404);

    // Idempotence honnête : comparer valeurs demandées/valeurs courantes.
    const changed = [];
    const oldValues = {};
    const newValues = {};
    if (_p6Present(body.displayName) && displayName !== existing.display_name) {
        changed.push('display_name');
        oldValues.displayName = existing.display_name; newValues.displayName = displayName;
    }
    if (statusPresent && status !== existing.status) {
        changed.push('status');
        oldValues.status = existing.status; newValues.status = status;
    }
    if (changed.length === 0) return reponseJSON({ teacher: _p6MapTeacherRow(existing) }, 200);

    const setParts = changed.map((c) => (c === 'display_name' ? 'display_name = ?' : 'status = ?'));
    const setValues = changed.map((c) => (c === 'display_name' ? displayName : status));
    // UPDATE conditionnel : id existant ; user_id jamais dans le SET.
    const updateStmt = db.prepare(
        `UPDATE teachers SET ${setParts.join(', ')}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...setValues, teacherId);

    const selectStmt = db.prepare(P6_TEACHER_SELECT_SQL).bind(teacherId);
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'update_teacher', 'teacher', ?, ?, ?
         WHERE changes() = 1`
    ).bind(String(user.id), String(teacherId), JSON.stringify(oldValues), JSON.stringify(newValues));

    let results;
    try {
        results = await db.batch([updateStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log('WORKER_ERROR pedagogie-update-teacher (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }
    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Profil enseignant introuvable' }, 404);
    // Réponse uniforme 200 : état courant après la mutation effective (audit
    // déjà gardé par changes()=1 — pas d'audit fantôme si course).
    return reponseJSON({ teacher: _p6MapTeacherRow(row) }, 200);
}

async function handlePedagogieUpdateStudent(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.studentId) || body.studentId < 1) {
        return reponseJSON({ erreur: 'studentId doit être un entier > 0' }, 400);
    }
    const studentId = body.studentId;

    let displayName = null;
    if (_p6Present(body.displayName)) {
        const chk = _p6ValidDisplayName(body.displayName);
        if (chk.error) return reponseJSON({ erreur: chk.error }, 400);
        displayName = chk.value;
    }
    const matriculePresent = _p6Present(body.matricule);
    let matricule = null;
    if (matriculePresent) {
        const chk = _p6ValidMatricule(body.matricule);
        if (chk.error) return reponseJSON({ erreur: chk.error }, 400);
        matricule = chk.value;
    }
    const statusPresent = _p6Present(body.status);
    let status = null;
    if (statusPresent) {
        const chk = _p6ValidStatus(body.status);
        if (chk.error) return reponseJSON({ erreur: chk.error }, 400);
        status = chk.value;
    }
    if (!_p6Present(body.displayName) && !matriculePresent && !statusPresent) {
        return reponseJSON({ erreur: 'Rien à mettre à jour (displayName, matricule ou status attendu)' }, 400);
    }

    const existing = await db.prepare(P6_STUDENT_SELECT_SQL).bind(studentId).first();
    if (!existing) return reponseJSON({ erreur: 'Profil étudiant introuvable' }, 404);

    const changed = [];
    const oldValues = {};
    const newValues = {};
    if (_p6Present(body.displayName) && displayName !== existing.display_name) {
        changed.push('display_name');
        oldValues.displayName = existing.display_name; newValues.displayName = displayName;
    }
    if (matriculePresent && matricule !== (existing.matricule === null || existing.matricule === undefined ? null : existing.matricule)) {
        changed.push('matricule');
        oldValues.matricule = existing.matricule; newValues.matricule = matricule;
    }
    if (statusPresent && status !== existing.status) {
        changed.push('status');
        oldValues.status = existing.status; newValues.status = status;
    }
    if (changed.length === 0) return reponseJSON({ student: _p6MapStudentRow(existing) }, 200);

    const colFor = { display_name: 'display_name = ?', matricule: 'matricule = ?', status: 'status = ?' };
    const valFor = { display_name: displayName, matricule: matricule, status: status };
    const setParts = changed.map((c) => colFor[c]);
    const setValues = changed.map((c) => valFor[c]);
    // UPDATE conditionnel : id existant ; user_id jamais dans le SET ; unicité
    // matricule portée par la contrainte UNIQUE (doublon -> 409 via catch).
    const updateStmt = db.prepare(
        `UPDATE students SET ${setParts.join(', ')}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...setValues, studentId);

    const selectStmt = db.prepare(P6_STUDENT_SELECT_SQL).bind(studentId);
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'update_student', 'student', ?, ?, ?
         WHERE changes() = 1`
    ).bind(String(user.id), String(studentId), JSON.stringify(oldValues), JSON.stringify(newValues));

    let results;
    try {
        results = await db.batch([updateStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        if (/students\.matricule/i.test(msg)) {
            return reponseJSON({ erreur: 'Ce matricule est déjà utilisé' }, 409);
        }
        if (/UNIQUE constraint failed/i.test(msg)) {
            return reponseJSON({ erreur: 'Valeur déjà utilisée' }, 409);
        }
        console.log('WORKER_ERROR pedagogie-update-student (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }
    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Profil étudiant introuvable' }, 404);
    // Réponse uniforme 200 : état courant après la mutation effective.
    return reponseJSON({ student: _p6MapStudentRow(row) }, 200);
}

// Désactivation : active→inactive (motif P5 : idempotent 200 si déjà inactif,
// sans écriture ni audit). Réactivation inactive→active via update_* (status).
async function handlePedagogieInactivateTeacher(env, user, body) {
    return await _pedagogieProfileInactivate(env, user, body, 'teacher');
}
async function handlePedagogieInactivateStudent(env, user, body) {
    return await _pedagogieProfileInactivate(env, user, body, 'student');
}

async function _pedagogieProfileInactivate(env, user, body, kind) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};
    const isTeacher = kind === 'teacher';
    const idKey = isTeacher ? 'teacherId' : 'studentId';
    if (!Number.isInteger(body[idKey]) || body[idKey] < 1) {
        return reponseJSON({ erreur: idKey + ' doit être un entier > 0' }, 400);
    }
    const id = body[idKey];
    const selectSql = isTeacher ? P6_TEACHER_SELECT_SQL : P6_STUDENT_SELECT_SQL;
    const mapFn = isTeacher ? _p6MapTeacherRow : _p6MapStudentRow;
    const notFound = isTeacher ? 'Profil enseignant introuvable' : 'Profil étudiant introuvable';

    const existing = await db.prepare(selectSql).bind(id).first();
    if (!existing) return reponseJSON({ erreur: notFound }, 404);
    if (existing.status === 'inactive') {
        // Déjà inactif : 200 idempotent, aucune écriture, aucun audit.
        return reponseJSON(isTeacher ? { teacher: mapFn(existing) } : { student: mapFn(existing) }, 200);
    }

    const oldValues = JSON.stringify({ status: 'active' });
    const newValues = JSON.stringify({ status: 'inactive' });
    // UPDATE conditionnel : mutation effective seulement si encore actif
    // (ferme la TOCTOU ; aucune cascade — memberships des students intactes).
    const updateStmt = db.prepare(
        `UPDATE ${isTeacher ? 'teachers' : 'students'} SET status = 'inactive', updated_at = datetime('now')
         WHERE id = ? AND status = 'active'`
    ).bind(id);
    const selectStmt = db.prepare(selectSql).bind(id);
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, '${isTeacher ? 'inactivate_teacher' : 'inactivate_student'}', '${kind}', ?, ?, ?
         WHERE changes() = 1`
    ).bind(String(user.id), String(id), oldValues, newValues);

    let results;
    try {
        results = await db.batch([updateStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log('WORKER_ERROR pedagogie-inactivate-' + kind + ' (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }
    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: notFound }, 404);
    return reponseJSON(isTeacher ? { teacher: mapFn(row) } : { student: mapFn(row) }, 200);
}

// Crée un groupe pédagogique dans une année académique ACTIVE.
// Intégrité : INSERT conditionnel (WHERE EXISTS année active) ; l'unicité du code est
// portée par la contrainte DDL UNIQUE(academic_year_id, parcours, year_number,
// semester_number, code) -> doublon = 409. Audit gardé par changes() = 1 dans le même batch.
async function handlePedagogieCreateGroup(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.academicYearId) || body.academicYearId < 1) {
        return reponseJSON({ erreur: 'academicYearId doit être un entier > 0' }, 400);
    }
    const academicYearId = body.academicYearId;
    const parcours = body.parcours;
    if (!['pep', 'pem', 'pes'].includes(parcours)) {
        return reponseJSON({ erreur: 'parcours invalide (pep, pem ou pes attendu)' }, 400);
    }
    const yearNumber = body.yearNumber;
    if (!Number.isInteger(yearNumber) || (yearNumber !== 1 && yearNumber !== 2)) {
        return reponseJSON({ erreur: 'yearNumber invalide (1 ou 2 attendu)' }, 400);
    }
    const semesterNumber = body.semesterNumber;
    if (!Number.isInteger(semesterNumber) || (semesterNumber !== 1 && semesterNumber !== 2)) {
        return reponseJSON({ erreur: 'semesterNumber invalide (1 ou 2 attendu)' }, 400);
    }
    const name = normalizeDisplayName(body.name);
    if (name === null || name.length < 1 || name.length > 120) {
        return reponseJSON({ erreur: 'name invalide (1 à 120 caractères)' }, 400);
    }
    const code = normalizeDisplayName(body.code);
    if (code === null || code.length < 1 || code.length > 50) {
        return reponseJSON({ erreur: 'code invalide (1 à 50 caractères)' }, 400);
    }
    let capacity = null;
    if (body.capacity !== undefined && body.capacity !== null) {
        if (!Number.isInteger(body.capacity) || body.capacity <= 0) {
            return reponseJSON({ erreur: 'capacity doit être un entier strictement positif' }, 400);
        }
        capacity = body.capacity;
    }
    // status jamais accepté depuis le client : 'active' imposé côté serveur.

    // Pré-lecture de classification uniquement (choix du code HTTP) ; la décision
    // d'insertion est reprise dans l'INSERT conditionnel ci-dessous.
    const year = await db.prepare('SELECT id, status FROM academic_years WHERE id = ?').bind(academicYearId).first();
    if (!year) return reponseJSON({ erreur: 'Année académique introuvable' }, 404);
    if (year.status !== 'active') return reponseJSON({ erreur: 'Création impossible dans une année non active' }, 409);

    const newValues = JSON.stringify({ academicYearId, parcours, yearNumber, semesterNumber, name, code, status: 'active', capacity });

    const insertStmt = db.prepare(
        `INSERT INTO groups (academic_year_id, parcours, year_number, semester_number, name, code, status, capacity)
         SELECT ?, ?, ?, ?, ?, ?, 'active', ?
         WHERE EXISTS (SELECT 1 FROM academic_years WHERE id = ? AND status = 'active')`
    ).bind(academicYearId, parcours, yearNumber, semesterNumber, name, code, capacity, academicYearId);

    const selectStmt = db.prepare(
        `SELECT g.id, g.academic_year_id, ay.label AS academic_year_label, g.parcours, g.year_number, g.semester_number, g.name, g.code, g.status, g.capacity, g.created_at, g.updated_at
         FROM groups g LEFT JOIN academic_years ay ON ay.id = g.academic_year_id
         WHERE g.id = last_insert_rowid()`
    );

    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'create_group', 'group', CAST(last_insert_rowid() AS TEXT), NULL, ?
         WHERE changes() = 1`
    ).bind(String(user.id), newValues);

    let results;
    try {
        results = await db.batch([insertStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        if (/UNIQUE constraint failed/i.test(msg)) {
            return reponseJSON({ erreur: 'Un groupe avec ce code existe déjà pour cette période' }, 409);
        }
        console.log('WORKER_ERROR pedagogie-create-group (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const changes = (results && results[0] && results[0].meta) ? (results[0].meta.changes || 0) : 0;
    if (changes === 0) {
        return reponseJSON({ erreur: 'Création impossible dans une année non active' }, 409);
    }
    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    const group = {
        id: row.id, academicYearId: row.academic_year_id, academicYearLabel: row.academic_year_label,
        parcours: row.parcours, yearNumber: row.year_number, semesterNumber: row.semester_number,
        name: row.name, code: row.code, status: row.status, capacity: row.capacity,
        createdAt: row.created_at, updatedAt: row.updated_at
    };
    return reponseJSON({ group }, 201);
}

// ─── P6.1 — CYCLE DE VIE DES GROUPES (GO GLOBAL P6) ─────────────────────────
// Champs éditables : name et capacity UNIQUEMENT. year/parcours/y/s/code sont
// immuables (aucune récréation implicite). Cycle : active→inactive et
// active→archived. Jamais de DELETE, jamais de cascade (memberships et
// offerings restent intactes ; les gardes serveur existantes testent déjà
// g.status='active' pour toute nouvelle opération). Pas de rate limiting
// ajouté : cohérent avec les mutations unitaires admin existantes (P2–P5).
function _p6Present(v) { return v !== undefined; }

const P6_GROUP_SELECT_SQL = `SELECT g.id, g.academic_year_id, ay.label AS academic_year_label, g.parcours, g.year_number, g.semester_number, g.name, g.code, g.status, g.capacity, g.created_at, g.updated_at
         FROM groups g LEFT JOIN academic_years ay ON ay.id = g.academic_year_id WHERE g.id = ?`;

function _p6MapGroupRow(row) {
    return {
        id: row.id, academicYearId: row.academic_year_id, academicYearLabel: row.academic_year_label,
        parcours: row.parcours, yearNumber: row.year_number, semesterNumber: row.semester_number,
        name: row.name, code: row.code, status: row.status, capacity: row.capacity,
        createdAt: row.created_at, updatedAt: row.updated_at
    };
}

async function handlePedagogieUpdateGroup(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.groupId) || body.groupId < 1) {
        return reponseJSON({ erreur: 'groupId doit être un entier > 0' }, 400);
    }
    const groupId = body.groupId;

    // Validation miroir de la création (mêmes règles, mêmes messages).
    let name = null;
    if (_p6Present(body.name)) {
        name = normalizeDisplayName(body.name);
        if (name === null || name.length < 1 || name.length > 120) {
            return reponseJSON({ erreur: 'name invalide (1 à 120 caractères)' }, 400);
        }
    }
    // capacity : entier > 0 OU null (null = retirer la limite, autorisé par le
    // CHECK 'capacity IS NULL OR capacity > 0'). Présence = modification voulue.
    const capacityPresent = _p6Present(body.capacity);
    let capacity = null;
    if (capacityPresent) {
        if (body.capacity !== null && (!Number.isInteger(body.capacity) || body.capacity <= 0)) {
            return reponseJSON({ erreur: 'capacity doit être un entier strictement positif' }, 400);
        }
        capacity = body.capacity;
    }
    if (!_p6Present(body.name) && !capacityPresent) {
        return reponseJSON({ erreur: 'Rien à mettre à jour (name ou capacity attendu)' }, 400);
    }

    const existing = await db.prepare(P6_GROUP_SELECT_SQL).bind(groupId).first();
    if (!existing) return reponseJSON({ erreur: 'Groupe introuvable' }, 404);
    if (existing.status !== 'active') {
        return reponseJSON({ erreur: 'Modification impossible : groupe non actif' }, 409);
    }

    // Idempotence honnête : changes() compte les lignes correspondues même si les
    // valeurs sont identiques ; on compare donc les valeurs demandées aux valeurs
    // courantes pour ne muter/auditer que le réellement changé.
    const changed = [];
    const oldValues = {};
    const newValues = {};
    if (_p6Present(body.name) && name !== existing.name) {
        changed.push('name');
        oldValues.name = existing.name; newValues.name = name;
    }
    if (capacityPresent && (capacity === null ? existing.capacity !== null : capacity !== existing.capacity)) {
        changed.push('capacity');
        oldValues.capacity = existing.capacity; newValues.capacity = capacity;
    }
    if (changed.length === 0) {
        return reponseJSON({ group: _p6MapGroupRow(existing) }, 200);
    }

    // Contrôle capacité convivial avant écriture (le contrôle TOCTOU authoritative
    // est intégré à l'UPDATE ci-dessous) : refuser si new_capacity < memberships
    // actives. Jamais de modification automatique des memberships.
    if (changed.includes('capacity') && capacity !== null) {
        const cntRow = await db.prepare(
            `SELECT COUNT(*) AS c FROM student_group_memberships WHERE group_id = ? AND status = 'active' AND valid_to IS NULL`
        ).bind(groupId).first();
        const activeCount = (cntRow && typeof cntRow.c === 'number') ? cntRow.c : 0;
        if (capacity < activeCount) {
            return reponseJSON({ erreur: 'Capacité inférieure au nombre de memberships actives' }, 409);
        }
    }

    const setParts = changed.map((c) => (c === 'name' ? 'name = ?' : 'capacity = ?'));
    const setValues = changed.map((c) => (c === 'name' ? name : capacity));
    // UPDATE conditionnel atomique : groupe encore actif + garde capacité intégrée
    // (comptage des memberships actives au moment de l'écriture → TOCTOU fermé).
    const capGuard = changed.includes('capacity') && capacity !== null
        ? ` AND (? IS NULL OR (SELECT COUNT(*) FROM student_group_memberships am WHERE am.group_id = groups.id AND am.status = 'active' AND am.valid_to IS NULL) <= ?)`
        : '';
    const updateStmt = db.prepare(
        `UPDATE groups SET ${setParts.join(', ')}, updated_at = datetime('now')
         WHERE id = ? AND status = 'active'${capGuard}`
    ).bind(...setValues, groupId, ...(capGuard ? [capacity, capacity] : []));

    const selectStmt = db.prepare(P6_GROUP_SELECT_SQL).bind(groupId);

    // Audit gardé par changes()=1 : pas d'audit fantôme si course.
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'update_group', 'group', ?, ?, ?
         WHERE changes() = 1`
    ).bind(String(user.id), String(groupId), JSON.stringify(oldValues), JSON.stringify(newValues));

    let results;
    try {
        results = await db.batch([updateStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        if (/CHECK constraint failed.*capacity|capacity IS NULL/i.test(msg)) {
            return reponseJSON({ erreur: 'capacity doit être un entier strictement positif' }, 400);
        }
        console.log('WORKER_ERROR pedagogie-update-group (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const changesCount = (results && results[0] && results[0].meta) ? (results[0].meta.changes || 0) : 0;
    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Groupe introuvable' }, 404);

    if (changesCount === 0) {
        // L'UPDATE n'a rien muté : soit le groupe a changé d'état en course
        // (pré-relecture active), soit la garde capacité a bloqué.
        if (row.status !== 'active') {
            return reponseJSON({ erreur: 'Modification impossible : groupe non actif' }, 409);
        }
        if (changed.includes('capacity')) {
            return reponseJSON({ erreur: 'Capacité inférieure au nombre de memberships actives' }, 409);
        }
        return reponseJSON({ erreur: 'Mise à jour impossible (état du groupe)' }, 409);
    }
    return reponseJSON({ group: _p6MapGroupRow(row) }, 200);
}

// Désactivation : active→inactive uniquement (Groupe déjà inactive → 200
// idempotent sans écriture ni audit ; archived → 409 état incompatible).
async function handlePedagogieInactivateGroup(env, user, body) {
    return await _pedagogieGroupStatusTransition(env, user, body, 'inactive',
        'handlePedagogieInactivateGroup', 'inactivate_group');
}

// Archivage : active→archived uniquement (déjà archived → 200 idempotent ;
// inactive → 409 état incompatible, pas de transition inactive→archived).
async function handlePedagogieArchiveGroup(env, user, body) {
    return await _pedagogieGroupStatusTransition(env, user, body, 'archived',
        'handlePedagogieArchiveGroup', 'archive_group');
}

async function _pedagogieGroupStatusTransition(env, user, body, targetStatus, handlerName, auditAction) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.groupId) || body.groupId < 1) {
        return reponseJSON({ erreur: 'groupId doit être un entier > 0' }, 400);
    }
    const groupId = body.groupId;

    const existing = await db.prepare(P6_GROUP_SELECT_SQL).bind(groupId).first();
    if (!existing) return reponseJSON({ erreur: 'Groupe introuvable' }, 404);
    if (existing.status === targetStatus) {
        // Idempotent : déjà dans l'état demandé — aucune écriture, aucun audit.
        return reponseJSON({ group: _p6MapGroupRow(existing) }, 200);
    }
    if (existing.status !== 'active') {
        return reponseJSON({ erreur: 'Transition impossible : état incompatible' }, 409);
    }

    const oldValues = JSON.stringify({ status: 'active' });
    const newValues = JSON.stringify({ status: targetStatus });

    const updateStmt = db.prepare(
        `UPDATE groups SET status = ?, updated_at = datetime('now')
         WHERE id = ? AND status = 'active'`
    ).bind(targetStatus, groupId);

    const selectStmt = db.prepare(P6_GROUP_SELECT_SQL).bind(groupId);

    // Motif P5 validé : audit inséré uniquement si une mutation effective a eu
    // lieu (changes()=1). Aucune cascade : memberships et offerings intactes.
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, '${auditAction}', 'group', ?, ?, ?
         WHERE changes() = 1`
    ).bind(String(user.id), String(groupId), oldValues, newValues);

    let results;
    try {
        results = await db.batch([updateStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log(`WORKER_ERROR pedagogie-${handlerName} (D1):`, msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Groupe introuvable' }, 404);
    // changes===0 après pré-lecture active = transition concurrente déjà faite ;
    // on renvoie idempotemment l'état courant.
    return reponseJSON({ group: _p6MapGroupRow(row) }, 200);
}

// ÉLIGIBILITÉ Commune (D-B) — SOURCE UNIQUE pour le single-add ET le bulk.
// Un étudiant n'est admissible que si : profil students.existant AND
// students.status='active' AND students.user_id renseigné AND user lié
// role='student' AND user.actif=1, ET le groupe cible + son année sont actifs.
// La regle n'est ENCODEE QU'UNE SEULE FOIS ici. studentIdExpr est une expression
// CORRELEE a l'etudiant courant : '?' (single, via parametre) ou 's.sid' (ligne
// candidate de la CTE req du bulk). Le bloc porte TOUJOURS exactement UN
// placeholder (g.id = groupId), independamment de studentIdExpr.
function _pedagogyEligibilityExists(studentIdExpr) {
    return `EXISTS (SELECT 1 FROM students st JOIN users su ON su.id = st.user_id `
        + `WHERE st.id = ${studentIdExpr} AND st.status = 'active' AND st.user_id IS NOT NULL `
        + `AND su.role = 'student' AND su.actif = 1 `
        + `AND EXISTS (SELECT 1 FROM groups g JOIN academic_years ay ON ay.id = g.academic_year_id `
        + `WHERE g.id = ? AND g.status = 'active' AND ay.status = 'active'))`;
}
// Version single : identifiant etudiant corrélé via un parametre '?'.
const PEDAGOGY_ELIGIBILITY_SQL = _pedagogyEligibilityExists('?');
// Ordre des paramètres lié au bloc ci-dessus : [studentId, groupId] (2 placeholders).
function pedagogyEligibilityParams(studentId, groupId) {
    return [studentId, groupId];
}
// Bloc periode : interdit deux memberships actifs sur la MEME periode
// (academic_year_id, parcours, year_number, semester_number). 1 parametre : groupId (gt).
function _PERIODE_NOT_EXISTS_BLOCK(colSid) {
    return 'AND NOT EXISTS (SELECT 1 FROM student_group_memberships m '
        + 'JOIN groups g2 ON g2.id = m.group_id JOIN groups gt ON gt.id = ? '
        + 'WHERE m.student_id = ' + colSid + ' AND m.status = \'active\' AND m.valid_to IS NULL '
        + 'AND g2.academic_year_id = gt.academic_year_id AND g2.parcours = gt.parcours '
        + 'AND g2.year_number = gt.year_number AND g2.semester_number = gt.semester_number)';
}
// CTE 'admissible' du bulk : chaque ligne candidate de req(sid) est testee avec LA
// MEME regle que le single (eligibilite corrélé e) + periode libre. references la
// CTE req(sid) prealablement declaree. 2 parametres lies apres les valeurs req :
// [groupId (eligibilite g.id), groupId (periode gt)].
function _pedagogyAdmissibleCte() {
    return 'admissible AS (SELECT s.sid AS sid FROM req s '
        + 'WHERE ' + _pedagogyEligibilityExists('s.sid') + ' '
        + _PERIODE_NOT_EXISTS_BLOCK('s.sid') + ')';
}
function pedagogyAdmissibleCteBind(groupId) { return [groupId, groupId]; }
// Bloc gate capacite (P3-ready) : capacity IS NULL OR capacity >= activeMembers +
// incoming. 3 parametres : groupId (cap), groupId (cmp), groupId (am). L'appelant
// ajoute '(SELECT COUNT(*) FROM <cte>)' via _INSERT_GATE_BLOCK.
function _GATE_CAPACITY_BLOCK() {
    return '(SELECT cg.capacity FROM groups cg WHERE cg.id = ?) IS NULL OR '
        + '(SELECT cg.capacity FROM groups cg WHERE cg.id = ?) >= '
        + '(SELECT COUNT(*) FROM student_group_memberships am WHERE am.group_id = ? AND am.status = \'active\' AND am.valid_to IS NULL) + ';
}
// Bloc gate complet pour l'INSERT bulk : ajoute COUNT(cte admissible). 3 parametres.
function _INSERT_GATE_BLOCK(cteAdmissible) {
    return _GATE_CAPACITY_BLOCK() + '(SELECT COUNT(*) FROM ' + cteAdmissible + ')';
}
function pedagogyGateBind(groupId) { return [groupId, groupId, groupId]; }

// Ajoute un étudiant à un groupe. Règle critique : un seul membership actif
// (status='active' AND valid_to IS NULL) par (année + parcours + année + semestre).
// Le contrôle NOT EXISTS est INTÉGRÉ à l'INSERT conditionnel (atomique, résistant
// à la concurrence D1). Audit gardé par changes() = 1 dans le même batch.
async function handlePedagogieAddStudentToGroup(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.studentId) || body.studentId < 1) {
        return reponseJSON({ erreur: 'studentId doit être un entier > 0' }, 400);
    }
    if (!Number.isInteger(body.groupId) || body.groupId < 1) {
        return reponseJSON({ erreur: 'groupId doit être un entier > 0' }, 400);
    }
    const studentId = body.studentId;
    const groupId = body.groupId;

    // Pré-lecture de classification uniquement (codes HTTP) ; décision d'insertion dans l'INSERT.
    const student = await db.prepare('SELECT id FROM students WHERE id = ?').bind(studentId).first();
    if (!student) return reponseJSON({ erreur: 'Étudiant introuvable' }, 404);

    const grp = await db.prepare(
        `SELECT g.id, g.status, ay.status AS year_status
         FROM groups g LEFT JOIN academic_years ay ON ay.id = g.academic_year_id
         WHERE g.id = ?`
    ).bind(groupId).first();
    if (!grp) return reponseJSON({ erreur: 'Groupe introuvable' }, 404);
    if (grp.status !== 'active') return reponseJSON({ erreur: 'Groupe non actif' }, 409);
    if (grp.year_status !== 'active') return reponseJSON({ erreur: 'Année académique du groupe non active' }, 409);

    const newValues = JSON.stringify({ studentId, groupId, status: 'active' });

    // Éligibilité commune (D-B) : profil actif + compte student actif (source unique).
    const insertStmt = db.prepare(
        `INSERT INTO student_group_memberships (student_id, group_id, status, valid_from, valid_to)
         SELECT ?, ?, 'active', datetime('now'), NULL
         WHERE ${PEDAGOGY_ELIGIBILITY_SQL}
         AND NOT EXISTS (
             SELECT 1 FROM student_group_memberships m
             JOIN groups g2 ON g2.id = m.group_id
             JOIN groups gt ON gt.id = ?
             WHERE m.student_id = ? AND m.status = 'active' AND m.valid_to IS NULL
               AND g2.academic_year_id = gt.academic_year_id
               AND g2.parcours = gt.parcours
               AND g2.year_number = gt.year_number
               AND g2.semester_number = gt.semester_number
         )
         AND (
             -- Capacité : autorite serveur, evaluee dans le MEME statement (aucun TOCTOU).
             -- Predicat actif identique partout : status='active' AND valid_to IS NULL.
             -- Forme P3-ready : capacity >= activeMembers + :incoming (ici :incoming = 1).
             (SELECT cg.capacity FROM groups cg WHERE cg.id = ?) IS NULL
             OR (SELECT cg.capacity FROM groups cg WHERE cg.id = ?) >=
                (SELECT COUNT(*) FROM student_group_memberships am
                  WHERE am.group_id = ? AND am.status = 'active' AND am.valid_to IS NULL) + 1
         )`
    ).bind(studentId, groupId, ...pedagogyEligibilityParams(studentId, groupId), groupId, studentId, groupId, groupId, groupId);

    const selectStmt = db.prepare(
        `SELECT id, student_id, group_id, status, valid_from, valid_to FROM student_group_memberships WHERE id = last_insert_rowid()`
    );

    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'add_student_to_group', 'student_group_membership', CAST(last_insert_rowid() AS TEXT), NULL, ?
         WHERE changes() = 1`
    ).bind(String(user.id), newValues);

    let results;
    try {
        results = await db.batch([insertStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log('WORKER_ERROR pedagogie-add-student-to-group (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const changes = (results && results[0] && results[0].meta) ? (results[0].meta.changes || 0) : 0;
    if (changes === 0) {
        // Le refus est DEJA acquis (WHERE de l'INSERT). Cette relecture ne sert
        // qu'a choisir le message explicite ; elle n'est jamais l'autorite.
        // Diagnostic : meme definition d'eligibilite que la source unique (D-B).
        const eligibleNow = await db.prepare(
            `SELECT ${PEDAGOGY_ELIGIBILITY_SQL} AS ok`
        ).bind(...pedagogyEligibilityParams(studentId, groupId)).first();
        const diag = await db.prepare(
            `SELECT
               (SELECT g.capacity FROM groups g WHERE g.id = ?) AS capacity,
               (SELECT COUNT(*) FROM student_group_memberships am
                  WHERE am.group_id = ? AND am.status = 'active' AND am.valid_to IS NULL) AS active_members,
               (SELECT COUNT(*) FROM student_group_memberships m
                  JOIN groups g2 ON g2.id = m.group_id
                  JOIN groups gt ON gt.id = ?
                 WHERE m.student_id = ? AND m.status = 'active' AND m.valid_to IS NULL
                   AND g2.academic_year_id = gt.academic_year_id
                   AND g2.parcours = gt.parcours
                   AND g2.year_number = gt.year_number
                   AND g2.semester_number = gt.semester_number) AS already_active`
        ).bind(groupId, groupId, groupId, studentId).first();
        if (!eligibleNow || eligibleNow.ok !== 1) {
            return reponseJSON({ erreur: '\u00c9tudiant non \u00e9ligible (profil inactif, compte \u00e9tudiant absent/inactif, ou groupe/ann\u00e9e non actifs)' }, 409);
        }
        if (diag && diag.already_active > 0) {
            return reponseJSON({ erreur: "L'étudiant a déjà un groupe actif pour cette période" }, 409);
        }
        if (diag && diag.capacity !== null && diag.capacity !== undefined && diag.active_members >= diag.capacity) {
            return reponseJSON({ erreur: 'Capacité du groupe atteinte (' + diag.active_members + '/' + diag.capacity + ')' }, 409);
        }
        return reponseJSON({ erreur: 'Ajout impossible (groupe ou année non actif, ou période déjà couverte)' }, 409);
    }
    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    const membership = {
        id: row.id, studentId: row.student_id, groupId: row.group_id,
        status: row.status, validFrom: row.valid_from, validTo: row.valid_to
    };
    return reponseJSON({ membership }, 201);
}

// P3 — Ajout BULK atomique (tout-ou-rien) d'étudiants à un groupe.
// D-C : inadmissibles classés/retournés, admissibles ajoutés si capacité OK ;
//       capacité globale insuffisante => 409 et 0 insertion.
// D-B : éligibilité identique au single-add (PEDAGOGY_ELIGIBILITY_SQL, source unique).
// Atomicité : UN seul INSERT...SELECT dont le gate compare capacity à
//       (activeBefore + COUNT(admissibles)). Aucun SELECT-COUNT->JS->boucle d'INSERT.
// Rate limiting : même mécanisme que P2/reset (login_attempts, RESET_RATE_*), D-G.
async function handlePedagogieAddStudentsToGroup(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.groupId) || body.groupId < 1) {
        return reponseJSON({ erreur: 'groupId doit être un entier > 0' }, 400);
    }
    const groupId = body.groupId;

    if (!Array.isArray(body.studentIds) || body.studentIds.length === 0) {
        return reponseJSON({ erreur: 'studentIds doit être un tableau non vide' }, 400);
    }
    if (body.studentIds.length > PEDAGOGY_BULK_LIMIT) {
        return reponseJSON({ erreur: 'studentIds limité à ' + PEDAGOGY_BULK_LIMIT + ' par opération' }, 400);
    }
    for (const sid of body.studentIds) {
        if (!Number.isInteger(sid) || sid < 1) {
            return reponseJSON({ erreur: 'chaque studentId doit être un entier > 0' }, 400);
        }
    }
    const uniqueIds = [...new Set(body.studentIds)]; // dédup intra-payload

    const grp = await db.prepare(
        `SELECT g.id, g.capacity, g.status, ay.status AS year_status
         FROM groups g LEFT JOIN academic_years ay ON ay.id = g.academic_year_id
         WHERE g.id = ?`
    ).bind(groupId).first();
    if (!grp) return reponseJSON({ erreur: 'Groupe introuvable' }, 404);
    if (grp.status !== 'active') return reponseJSON({ erreur: 'Groupe non actif' }, 409);
    if (grp.year_status !== 'active') return reponseJSON({ erreur: 'Année académique du groupe non active' }, 409);

    // Rate limiting (D-G) : même mécanisme que P2/reset. Clé 'bulk-add:<actorId>'
    // dans login_attempts (username + ip_hash NOT NULL), fenêtre RESET_RATE_*.
    const rlKey = 'bulk-add:' + user.id;
    const rlHash = await sha256Hex(rlKey);
    const cutoff = new Date(Date.now() - RESET_RATE_WINDOW_SECONDS * 1000).toISOString();
    const rlCount = await db.prepare(
        "SELECT COUNT(*) AS c FROM login_attempts WHERE ip_hash = ? AND attempted_at > ? AND success = 1 AND username LIKE 'bulk-add:%'"
    ).bind(rlHash, cutoff).first();
    if (rlCount && rlCount.c >= RESET_RATE_LIMIT) {
        return reponseJSON({ erreur: 'Trop d\'op\u00e9rations r\u00e9centes. R\u00e9essayez plus tard.' }, 429);
    }

    // Fragments SQL partages (source unique d'eligibilite, D-B). valuesPh produit
    // la CTE req(sid) : une rangee (1 colonne 'sid') par etudiant demande.
    const valuesPh = uniqueIds.map(() => 'SELECT ? AS sid').join(' UNION ALL ');
    // CTE 'admissible' : MEME regle corrélée que le single (D-B) + periode libre.
    const admissibleCte = _pedagogyAdmissibleCte();
    // Placeholders req + admissible : values(N) + eligibilite(1) + periode(1) = N+2.
    const admissibleCteBind = [].concat(uniqueIds, pedagogyAdmissibleCteBind(groupId));

    // INSERT unique et atomique : le gate capacity porte sur TOUT l'ensemble
    // admissible (tout-ou-rien, resistant a la concurrence D1). Placeholders :
    // (N+2) + 1 (group_id) + 3 (gate) = N+6.
    const gateSql = _INSERT_GATE_BLOCK('admissible');
    const insertSql = 'WITH req(sid) AS (' + valuesPh + '), ' + admissibleCte
        + ' INSERT INTO student_group_memberships (student_id, group_id, status, valid_from, valid_to)'
        + ' SELECT a.sid, ?, \'active\', datetime(\'now\'), NULL FROM admissible a WHERE (' + gateSql + ')';
    const insertBind = [].concat(admissibleCteBind, [groupId], pedagogyGateBind(groupId));

    const auditSql = 'INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values) SELECT ?, \'add_students_to_group\', \'group\', ?, NULL, ? WHERE changes() > 0';

    // Classification PRE-insertion (lit l'etat AVANT toute mutation), repartage LA
    // MEME CTE admissible : pour chaque id demande -> adm (admissible, insere si
    // gate OK), alr (deja membre ACTIF de CE groupe), per (membre actif MEME periode
    // dans un autre groupe). Le reste => invalid. Placeholders : values(N) +
    // admissible(2) + alreadyActive(1) + inPeriod(1) = N+4.
    const classSql = 'WITH req(sid) AS (' + valuesPh + '), ' + admissibleCte
        + ', alreadyActive AS (SELECT r.sid FROM req r WHERE EXISTS (SELECT 1 FROM student_group_memberships m WHERE m.student_id = r.sid AND m.group_id = ? AND m.status = \'active\' AND m.valid_to IS NULL)) '
        + ', inPeriod AS (SELECT r.sid FROM req r WHERE EXISTS (SELECT 1 FROM student_group_memberships m JOIN groups g2 ON g2.id = m.group_id JOIN groups gt ON gt.id = ? WHERE m.student_id = r.sid AND m.status = \'active\' AND m.valid_to IS NULL AND g2.academic_year_id = gt.academic_year_id AND g2.parcours = gt.parcours AND g2.year_number = gt.year_number AND g2.semester_number = gt.semester_number)) '
        + 'SELECT s.sid AS sid, CASE WHEN s.sid IN (SELECT sid FROM admissible) THEN 1 ELSE 0 END AS adm, '
        + 'CASE WHEN s.sid IN (SELECT sid FROM alreadyActive) THEN 1 ELSE 0 END AS alr, '
        + 'CASE WHEN s.sid IN (SELECT sid FROM inPeriod) THEN 1 ELSE 0 END AS per '
        + 'FROM req s ORDER BY s.sid';
    const classBind = [].concat(uniqueIds, pedagogyAdmissibleCteBind(groupId), [groupId], [groupId]);

    const capSql = 'SELECT (SELECT COUNT(*) FROM student_group_memberships am WHERE am.group_id = ? AND am.status = \'active\' AND am.valid_to IS NULL) AS v';

    let results;
    try {
        results = await db.batch([
            db.prepare(capSql).bind(groupId),
            db.prepare(classSql).bind(classBind),   // PRE-insertion : etat avant mutation
            db.prepare(insertSql).bind(insertBind), // gate tout-ou-rien
            db.prepare(auditSql).bind([String(user.id), String(groupId), JSON.stringify({ groupId: groupId, requested: uniqueIds.length })]),
        ]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log('WORKER_ERROR pedagogie-add-students-to-group (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const activeBefore = (results[0].results && results[0].results[0]) ? results[0].results[0].v : 0;
    const crows = (results[1] && results[1].results) ? results[1].results : [];
    const changes = (results[2] && results[2].meta && typeof results[2].meta.changes === 'number') ? results[2].meta.changes : 0;

    // Le gate est un booleen unique sur tout l'INSERT : changes() ∈ {0, admissible}.
    const addedSids = [];
    const alreadyMembers = [], incompatible = [], invalid = [];
    for (const r of crows) {
        if (r.adm === 1) { addedSids.push(r.sid); continue; }
        if (r.alr === 1) { alreadyMembers.push(r.sid); continue; }
        if (r.per === 1) { incompatible.push(r.sid); continue; }
        invalid.push(r.sid);
    }
    const admissibleCount = addedSids.length;
    const capacityInfo = {
        limit: (grp.capacity === undefined ? null : grp.capacity),
        activeBefore: activeBefore,
        requested: uniqueIds.length,
        admissible: admissibleCount,
        available: (grp.capacity === null || grp.capacity === undefined) ? null : Math.max(0, grp.capacity - activeBefore)
    };

    // Aucune insertion (changes()=0) : gate capacite (admissibles>0) => 409 / 0 ligne ;
    // aucun admissible => 400.
    if (changes === 0) {
        if (admissibleCount > 0) {
            return reponseJSON({ erreur: 'Capacité insuffisante pour ajouter tous les étudiants admissibles', added: [], alreadyMembers: [], incompatible: [], invalid: [], refused: 'capacity', capacity: capacityInfo }, 409);
        }
        return reponseJSON({ erreur: 'Aucun étudiant admissible à ajouter' }, 400);
    }

    // Insertion reussie : addedSids == l'ensemble insere (gate passe pour tous les
    // admissibles). Relecture des membershipIds crees pour ces seuls etudiants.
    let added = [];
    if (addedSids.length > 0) {
        const addedPh = addedSids.map(() => '?').join(',');
        const addedRes = await db.prepare('SELECT id AS membershipId, student_id AS studentId FROM student_group_memberships WHERE group_id = ? AND status = \'active\' AND valid_to IS NULL AND student_id IN (' + addedPh + ') ORDER BY id ASC').bind(groupId, ...addedSids).all();
        added = (addedRes && addedRes.results) ? addedRes.results : [];
    }

    // Compteur rate-limit (D-G) : best-effort apres insertion reussie.
    try {
        await db.prepare('INSERT INTO login_attempts (username, ip_hash, success) VALUES (?, ?, 1)').bind('bulk-add:' + user.id, await sha256Hex('bulk-add:' + user.id)).run();
    } catch (e) { /* ne bloque pas le resultat */ }

    return reponseJSON({ added: added, alreadyMembers: alreadyMembers, incompatible: incompatible, invalid: invalid, refused: null, capacity: capacityInfo }, 200);
}
// D-1 : valid_to = datetime('now') cote serveur uniquement. D-2 : idempotent (deja
// termine -> 200, valid_to conserve). D-3 : cible par membershipId ; groupe/annee NON
// controles (un actif peut etre termine meme si le groupe/annee n'est plus actif).
// Autorite de l'ecriture = WHERE id=? AND status='active' (aucune reecriture en course).
async function handlePedagogieEndMembership(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.membershipId) || body.membershipId < 1) {
        return reponseJSON({ erreur: 'membershipId doit être un entier > 0' }, 400);
    }
    const membershipId = body.membershipId;

    // Pre-lecture : 404 si inexistant + detection idempotente (statut courant).
    const existing = await db.prepare(
        `SELECT id, student_id, group_id, status, valid_from, valid_to FROM student_group_memberships WHERE id = ?`
    ).bind(membershipId).first();
    if (!existing) return reponseJSON({ erreur: 'Membership introuvable' }, 404);

    if (existing.status !== 'active') {
        // Deja termine : 200, aucune reecriture, valid_to conserve.
        return reponseJSON({
            membership: {
                id: existing.id, studentId: existing.student_id, groupId: existing.group_id,
                status: existing.status, validFrom: existing.valid_from, validTo: existing.valid_to
            }
        }, 200);
    }

    const oldValues = JSON.stringify({ status: 'active' });
    const newValues = JSON.stringify({ status: 'ended' });

    const updateStmt = db.prepare(
        `UPDATE student_group_memberships
         SET status = 'ended', valid_to = datetime('now')
         WHERE id = ? AND status = 'active'`
    ).bind(membershipId);

    const selectStmt = db.prepare(
        `SELECT id, student_id, group_id, status, valid_from, valid_to FROM student_group_memberships WHERE id = ?`
    ).bind(membershipId);

    // Audit garde par changes()=1 : aucune trace si une course a deja termine la ligne.
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'end_membership', 'student_group_membership', ?, ?, ?
         WHERE changes() = 1`
    ).bind(String(user.id), String(membershipId), oldValues, newValues);

    let results;
    try {
        results = await db.batch([updateStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log('WORKER_ERROR pedagogie-end-membership (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Membership introuvable' }, 404);

    // changes===0 ici = termine par une course concurrente ; on renvoie idempotemment
    // l'etat 'ended' courant (valid_to conservé).
    return reponseJSON({
        membership: {
            id: row.id, studentId: row.student_id, groupId: row.group_id,
            status: row.status, validFrom: row.valid_from, validTo: row.valid_to
        }
    }, 200);
}

// Affecte un module (chapter_id) à un enseignant pour une année académique.
// teacher_user_id = users.id (JAMAIS teachers.id). Validation : users existe,
// role='teacher', profil teachers présent, chapter_id dans l'allowlist, année active.
// Doublon actif (teacher+chapter+année) -> 409, contrôlé dans l'INSERT conditionnel.
async function handlePedagogieAssignTeacherModule(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    const teacherUserId = (typeof body.teacherUserId === 'string') ? body.teacherUserId.trim() : '';
    if (!teacherUserId) return reponseJSON({ erreur: 'teacherUserId doit être une chaîne non vide' }, 400);
    const chapterId = body.chapterId;
    if (typeof chapterId !== 'string' || !PEDAGOGY_CHAPTER_IDS.includes(chapterId)) {
        return reponseJSON({ erreur: 'chapterId invalide (ID technique attendu)' }, 400);
    }
    if (!Number.isInteger(body.academicYearId) || body.academicYearId < 1) {
        return reponseJSON({ erreur: 'academicYearId doit être un entier > 0' }, 400);
    }
    const academicYearId = body.academicYearId;

    const t = await db.prepare(
        `SELECT u.id, u.role, (SELECT 1 FROM teachers tt WHERE tt.user_id = u.id AND tt.status = 'active' LIMIT 1) AS has_profile
         FROM users u WHERE u.id = ?`
    ).bind(teacherUserId).first();
    if (!t) return reponseJSON({ erreur: 'Utilisateur enseignant introuvable' }, 404);
    if (t.role !== 'teacher') return reponseJSON({ erreur: 'Rôle teacher requis pour cet utilisateur' }, 400);
    if (!t.has_profile) return reponseJSON({ erreur: "Profil enseignant inexistant ou inactif pour cet utilisateur" }, 404);

    const year = await db.prepare('SELECT id, status FROM academic_years WHERE id = ?').bind(academicYearId).first();
    if (!year) return reponseJSON({ erreur: 'Année académique introuvable' }, 404);
    if (year.status !== 'active') return reponseJSON({ erreur: 'Affectation impossible dans une année non active' }, 409);

    const newValues = JSON.stringify({ teacherUserId, chapterId, academicYearId, status: 'active' });

    const insertStmt = db.prepare(
        `INSERT INTO teacher_module_assignments (teacher_user_id, chapter_id, academic_year_id, status, valid_from, valid_to)
         SELECT ?, ?, ?, 'active', datetime('now'), NULL
         WHERE EXISTS (
             SELECT 1 FROM users u JOIN teachers te ON te.user_id = u.id
             WHERE u.id = ? AND u.role = 'teacher' AND te.status = 'active'
         )
         AND EXISTS (SELECT 1 FROM academic_years WHERE id = ? AND status = 'active')
         AND NOT EXISTS (
             SELECT 1 FROM teacher_module_assignments
             WHERE teacher_user_id = ? AND chapter_id = ? AND academic_year_id = ? AND status = 'active'
         )`
    ).bind(teacherUserId, chapterId, academicYearId, teacherUserId, academicYearId, teacherUserId, chapterId, academicYearId);

    const selectStmt = db.prepare(
        `SELECT id, teacher_user_id, chapter_id, academic_year_id, status, valid_from, valid_to FROM teacher_module_assignments WHERE id = last_insert_rowid()`
    );

    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'assign_teacher_module', 'teacher_module_assignment', CAST(last_insert_rowid() AS TEXT), NULL, ?
         WHERE changes() = 1`
    ).bind(String(user.id), newValues);

    let results;
    try {
        results = await db.batch([insertStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log('WORKER_ERROR pedagogie-assign-teacher-module (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const changes = (results && results[0] && results[0].meta) ? (results[0].meta.changes || 0) : 0;
    if (changes === 0) {
        return reponseJSON({ erreur: 'Affectation active déjà existante pour ce teacher/module/année' }, 409);
    }
    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    const assignment = {
        id: row.id, teacherUserId: row.teacher_user_id, chapterId: row.chapter_id,
        academicYearId: row.academic_year_id, status: row.status, validFrom: row.valid_from, validTo: row.valid_to
    };
    return reponseJSON({ assignment }, 201);
}

// ─── P6.3 — CYCLE DE VIE DES AFFECTATIONS (GO GLOBAL P6) ────────────────
// Cycle : active→archived uniquement. Pas de DELETE, pas de cascade implicite
// vers 'orphan' : si au moins une offering ACTIVE dépend de l'affectation
// (même teacher + chapter + année académique que le groupe de l'offering),
// l'archivage est REFUSÉ (409). Pas d'update : teacher/chapter/year sont les
// clés sémantiques de l'affectation — un changement se traite par création
// d'une nouvelle affectation + archivage de l'ancienne (motif P5 rotation).
// La dépendance offering→assignment est reprise DANS le WHERE de l'UPDATE
// (TOCTOU fermé) : une offering activée en course bloque l'archivage.
const P6_ASSIGNMENT_SELECT_SQL = `SELECT id, teacher_user_id, chapter_id, academic_year_id, status, valid_from, valid_to, created_at FROM teacher_module_assignments WHERE id = ?`;

function _p6MapAssignmentRow(row) {
    return {
        id: row.id, teacherUserId: row.teacher_user_id, chapterId: row.chapter_id,
        academicYearId: row.academic_year_id, status: row.status,
        validFrom: row.valid_from, validTo: row.valid_to, createdAt: row.created_at
    };
}

// Dependence : offering active dont le groupe porte l'année de l'affectation et
// qui reprend le même (teacher, chapter) — motif de l'autorisation P1/offering.
const P6_ACTIVE_OFFERING_DEPENDENCY_SQL = `SELECT COUNT(*) AS c FROM group_module_offerings o
         JOIN groups g ON g.id = o.group_id
         JOIN teacher_module_assignments a
           ON a.teacher_user_id = o.teacher_user_id AND a.chapter_id = o.chapter_id
          AND a.academic_year_id = g.academic_year_id
         WHERE a.id = ? AND o.status = 'active'`;

async function handlePedagogieArchiveTeacherAssignment(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.assignmentId) || body.assignmentId < 1) {
        return reponseJSON({ erreur: 'assignmentId doit être un entier > 0' }, 400);
    }
    const assignmentId = body.assignmentId;

    const existing = await db.prepare(P6_ASSIGNMENT_SELECT_SQL).bind(assignmentId).first();
    if (!existing) return reponseJSON({ erreur: 'Affectation introuvable' }, 404);
    if (existing.status === 'archived') {
        // Déjà archivée : 200 idempotent, aucune écriture, aucun audit.
        return reponseJSON({ assignment: _p6MapAssignmentRow(existing) }, 200);
    }
    if (existing.status !== 'active') {
        // 'orphan' (état disponible dans le schéma) : hors cycle P6 -> 409.
        return reponseJSON({ erreur: 'Transition impossible : état incompatible' }, 409);
    }

    // Contrôle convivial AVANT écriture (message explicite) ; la garde
    // authoritative est intégrée à l'UPDATE ci-dessous.
    const dep = await db.prepare(P6_ACTIVE_OFFERING_DEPENDENCY_SQL).bind(assignmentId).first();
    if (dep && dep.c > 0) {
        return reponseJSON({ erreur: 'Archivage refusé : au moins une offering active dépend de cette affectation' }, 409);
    }

    const oldValues = JSON.stringify({ status: 'active' });
    const newValues = JSON.stringify({ status: 'archived' });

    // UPDATE conditionnel atomique : encore active + AUCUNE offering active
    // dependency au moment de l'écriture (pas de cascade : les offerings ne
    // sont ni archivées ni modifiées ; état 'orphan' jamais produit ici).
    const updateStmt = db.prepare(
        `UPDATE teacher_module_assignments SET status = 'archived'
         WHERE id = ? AND status = 'active'
           AND NOT EXISTS (
             SELECT 1 FROM group_module_offerings o
             JOIN groups g ON g.id = o.group_id
             WHERE o.teacher_user_id = teacher_module_assignments.teacher_user_id
               AND o.chapter_id = teacher_module_assignments.chapter_id
               AND g.academic_year_id = teacher_module_assignments.academic_year_id
               AND o.status = 'active'
           )`
    ).bind(assignmentId);

    const selectStmt = db.prepare(P6_ASSIGNMENT_SELECT_SQL).bind(assignmentId);

    // Motif P5 : audit uniquement si mutation effective (changes()=1).
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'archive_teacher_assignment', 'teacher_module_assignment', ?, ?, ?
         WHERE changes() = 1`
    ).bind(String(user.id), String(assignmentId), oldValues, newValues);

    let results;
    try {
        results = await db.batch([updateStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log('WORKER_ERROR pedagogie-archive-teacher-assignment (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const changesCount = (results && results[0] && results[0].meta) ? (results[0].meta.changes || 0) : 0;
    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Affectation introuvable' }, 404);
    if (changesCount === 0) {
        // Course : soit archivée entre-temps (idempotent), soit une offering
        // active dépendante est apparue -> 409 métier.
        if (row.status === 'archived') return reponseJSON({ assignment: _p6MapAssignmentRow(row) }, 200);
        if (row.status === 'active') {
            return reponseJSON({ erreur: 'Archivage refusé : au moins une offering active dépend de cette affectation' }, 409);
        }
        return reponseJSON({ erreur: 'Transition impossible : état incompatible' }, 409);
    }
    return reponseJSON({ assignment: _p6MapAssignmentRow(row) }, 200);
}

// Crée une offering (groupe/module, enseignant optionnel).
// Règle : offering ⊆ teacher_module_assignments — si un teacher est fourni, il doit
// avoir une affectation active (teacher + chapter + année du groupe). Une seule
// offering active par (group_id, chapter_id). Contrôles INTÉGRÉS à l'INSERT conditionnel.
async function handlePedagogieCreateModuleOffering(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.groupId) || body.groupId < 1) {
        return reponseJSON({ erreur: 'groupId doit être un entier > 0' }, 400);
    }
    const groupId = body.groupId;
    const chapterId = body.chapterId;
    if (typeof chapterId !== 'string' || !PEDAGOGY_CHAPTER_IDS.includes(chapterId)) {
        return reponseJSON({ erreur: 'chapterId invalide (ID technique attendu)' }, 400);
    }
    if (typeof body.teacherUserId !== 'string') {
        return reponseJSON({ erreur: 'teacherUserId est requis' }, 400);
    }
    const teacherTrimmed = body.teacherUserId.trim();
    if (!teacherTrimmed) return reponseJSON({ erreur: 'teacherUserId ne peut pas être vide' }, 400);
    const teacherUserId = teacherTrimmed;

    const grp = await db.prepare(
        `SELECT g.id, g.academic_year_id, g.status, g.parcours, g.year_number, g.semester_number, ay.status AS year_status
         FROM groups g LEFT JOIN academic_years ay ON ay.id = g.academic_year_id
         WHERE g.id = ?`
    ).bind(groupId).first();
    if (!grp) return reponseJSON({ erreur: 'Groupe introuvable' }, 404);
    if (grp.status !== 'active') return reponseJSON({ erreur: 'Groupe non actif' }, 409);
    if (grp.year_status !== 'active') return reponseJSON({ erreur: 'Année académique du groupe non active' }, 409);
    if (grp.parcours !== 'pep') {
        return reponseJSON({ erreur: 'Les offerings sont réservées aux groupes PEP' }, 400);
    }
    const pepMatch = /^pep-y(\d)s(\d)-\d+$/.exec(chapterId);
    if (!pepMatch) {
        return reponseJSON({ erreur: 'chapterId PEP invalide (format pep-yYsS-NN attendu)' }, 400);
    }
    const chapterYear = parseInt(pepMatch[1], 10);
    const chapterSemester = parseInt(pepMatch[2], 10);
    if (chapterYear !== grp.year_number || chapterSemester !== grp.semester_number) {
        return reponseJSON({ erreur: 'Incohérence module/groupe : le module pep-y' + chapterYear + 's' + chapterSemester + " ne correspond pas à l'année/semestre du groupe" }, 400);
    }

    const t = await db.prepare(
        `SELECT u.id, u.role, u.actif, (SELECT 1 FROM teachers tt WHERE tt.user_id = u.id AND tt.status = 'active' LIMIT 1) AS has_profile
         FROM users u WHERE u.id = ?`
    ).bind(teacherUserId).first();
    if (!t) return reponseJSON({ erreur: 'Utilisateur enseignant introuvable' }, 404);
    if (t.role !== 'teacher') return reponseJSON({ erreur: 'Rôle teacher requis pour cet utilisateur' }, 400);
    if (!t.actif) return reponseJSON({ erreur: 'Utilisateur enseignant inactif' }, 403);
    if (!t.has_profile) return reponseJSON({ erreur: 'Profil enseignant inexistant ou inactif pour cet utilisateur' }, 404);

    const authorized = await db.prepare(
        `SELECT 1 AS ok FROM teacher_module_assignments
         WHERE teacher_user_id = ? AND chapter_id = ? AND academic_year_id = ? AND status = 'active'`
    ).bind(teacherUserId, chapterId, grp.academic_year_id).first();
    if (!authorized) return reponseJSON({ erreur: "Ce teacher n'est pas autorisé sur ce module pour cette année" }, 409);

    const newValues = JSON.stringify({ groupId, chapterId, teacherUserId, status: 'active' });

    const insertStmt = db.prepare(
        `INSERT INTO group_module_offerings (group_id, chapter_id, teacher_user_id, status, valid_from, valid_to)
         SELECT ?, ?, ?, 'active', datetime('now'), NULL
         WHERE EXISTS (
             SELECT 1 FROM groups g JOIN academic_years ay ON ay.id = g.academic_year_id
             WHERE g.id = ? AND g.status = 'active' AND ay.status = 'active' AND g.parcours = 'pep'
         )
         AND NOT EXISTS (
             SELECT 1 FROM group_module_offerings
             WHERE group_id = ? AND chapter_id = ? AND status = 'active'
         )
         AND EXISTS (
             SELECT 1 FROM teacher_module_assignments tma
             JOIN users u ON u.id = tma.teacher_user_id
             JOIN teachers te ON te.user_id = u.id
             WHERE tma.teacher_user_id = ? AND tma.chapter_id = ?
               AND tma.academic_year_id = (SELECT academic_year_id FROM groups WHERE id = ?)
               AND tma.status = 'active' AND u.role = 'teacher' AND u.actif = 1 AND te.status = 'active'
         )`
    ).bind(groupId, chapterId, teacherUserId, groupId, groupId, chapterId, teacherUserId, chapterId, groupId);

    const selectStmt = db.prepare(
        `SELECT id, group_id, chapter_id, teacher_user_id, status, valid_from, valid_to FROM group_module_offerings WHERE id = last_insert_rowid()`
    );

    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'create_module_offering', 'group_module_offering', CAST(last_insert_rowid() AS TEXT), NULL, ?
         WHERE changes() = 1`
    ).bind(String(user.id), newValues);

    let results;
    try {
        results = await db.batch([insertStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log('WORKER_ERROR pedagogie-create-module-offering (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const changes = (results && results[0] && results[0].meta) ? (results[0].meta.changes || 0) : 0;
    if (changes === 0) {
        return reponseJSON({ erreur: 'Une offering active existe déjà pour ce groupe et ce module' }, 409);
    }
    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    const offering = {
        id: row.id, groupId: row.group_id, chapterId: row.chapter_id,
        teacherUserId: row.teacher_user_id, status: row.status, validFrom: row.valid_from, validTo: row.valid_to
    };
    return reponseJSON({ offering }, 201);
}

// ─── P6.4 — CYCLE DE VIE DES OFFERINGS (GO GLOBAL P6) ────────────────────
// Cycle : active→archived (jamais la affectation ; pas de DELETE ; 'orphan'
// jamais produit automatiquement). Update : SEUL champ modifiable =
// teacher_user_id — Jamais NULL. Un changement de teacher RÉAPPLIQUE
// INTÉGRALEMENT les règles P1 : PEP-only (groupe), teacher obligatoire,
// compte teacher valide + actif, profil teacher valide + ACTIF, affectation
// correspondante active, offering ⊆ assignment, cohérence année/semestre,
// absence de doublon actif. Gardes authoritative reprise dans le WHERE de
// l'UPDATE (TOCTOU fermé), sur le modèle de l'INSERT de création.
const P6_OFFERING_SELECT_SQL = `SELECT id, group_id, chapter_id, teacher_user_id, status, valid_from, valid_to, created_at FROM group_module_offerings WHERE id = ?`;

function _p6MapOfferingRow(row) {
    return {
        id: row.id, groupId: row.group_id, chapterId: row.chapter_id,
        teacherUserId: row.teacher_user_id, status: row.status,
        validFrom: row.valid_from, validTo: row.valid_to, createdAt: row.created_at
    };
}

async function handlePedagogieUpdateModuleOffering(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.offeringId) || body.offeringId < 1) {
        return reponseJSON({ erreur: 'offeringId doit être un entier > 0' }, 400);
    }
    const offeringId = body.offeringId;
    // teacher obligatoire, jamais NULL (règle P1 maintenue en P6.4).
    if (typeof body.teacherUserId !== 'string') {
        return reponseJSON({ erreur: 'teacherUserId est requis' }, 400);
    }
    const teacherTrimmed = body.teacherUserId.trim();
    if (!teacherTrimmed) return reponseJSON({ erreur: 'teacherUserId ne peut pas être vide' }, 400);
    const teacherUserId = teacherTrimmed;

    const existing = await db.prepare(P6_OFFERING_SELECT_SQL).bind(offeringId).first();
    if (!existing) return reponseJSON({ erreur: 'Offering introuvable' }, 404);
    if (existing.status !== 'active') {
        return reponseJSON({ erreur: 'Modification impossible : offering non active' }, 409);
    }
    // Idempotence honnête : même teacher -> 200 sans écriture ni audit.
    if (existing.teacher_user_id === teacherUserId) {
        return reponseJSON({ offering: _p6MapOfferingRow(existing) }, 200);
    }

    // ── Règles P1 réapliquées intégralement (classification conviviale) ──
    const grp = await db.prepare(
        `SELECT g.id, g.academic_year_id, g.status, g.parcours, g.year_number, g.semester_number, ay.status AS year_status
         FROM groups g LEFT JOIN academic_years ay ON ay.id = g.academic_year_id
         WHERE g.id = ?`
    ).bind(existing.group_id).first();
    if (!grp) return reponseJSON({ erreur: 'Groupe introuvable' }, 404);
    if (grp.status !== 'active') return reponseJSON({ erreur: 'Groupe non actif' }, 409);
    if (grp.year_status !== 'active') return reponseJSON({ erreur: 'Année académique du groupe non active' }, 409);
    if (grp.parcours !== 'pep') return reponseJSON({ erreur: 'Les offerings sont réservées aux groupes PEP' }, 400);
    const pepMatch = /^pep-y(\d)s(\d)-\d+$/.exec(existing.chapter_id);
    if (!pepMatch) return reponseJSON({ erreur: 'chapterId PEP invalide (format pep-yYsS-NN attendu)' }, 400);
    if (parseInt(pepMatch[1], 10) !== grp.year_number || parseInt(pepMatch[2], 10) !== grp.semester_number) {
        return reponseJSON({ erreur: 'Incohérence module/groupe : le module pep-y' + pepMatch[1] + 's' + pepMatch[2] + " ne correspond pas à l'année/semestre du groupe" }, 400);
    }
    const t = await db.prepare(
        `SELECT u.id, u.role, u.actif, (SELECT 1 FROM teachers tt WHERE tt.user_id = u.id AND tt.status = 'active' LIMIT 1) AS has_profile
         FROM users u WHERE u.id = ?`
    ).bind(teacherUserId).first();
    if (!t) return reponseJSON({ erreur: 'Utilisateur enseignant introuvable' }, 404);
    if (t.role !== 'teacher') return reponseJSON({ erreur: 'Rôle teacher requis pour cet utilisateur' }, 400);
    if (!t.actif) return reponseJSON({ erreur: 'Utilisateur enseignant inactif' }, 403);
    if (!t.has_profile) return reponseJSON({ erreur: 'Profil enseignant inexistant ou inactif pour cet utilisateur' }, 404);
    const authorized = await db.prepare(
        `SELECT 1 AS ok FROM teacher_module_assignments
         WHERE teacher_user_id = ? AND chapter_id = ? AND academic_year_id = ? AND status = 'active'`
    ).bind(teacherUserId, existing.chapter_id, grp.academic_year_id).first();
    if (!authorized) return reponseJSON({ erreur: "Ce teacher n'est pas autorisé sur ce module pour cette année" }, 409);

    const oldValues = JSON.stringify({ teacherUserId: existing.teacher_user_id });
    const newValues = JSON.stringify({ teacherUserId });

    // UPDATE conditionnel atomique : offering encore active + mêmes gardes que
    // l'INSERT de création (groupe actif/PEP, année active, teacher compte+profil
    // actifs, affectation active offering⊆assignment, pas de doublon actif).
    // NOTE : group_module_offerings n'a PAS de colonne updated_at (schéma)
    // -> mutation limitée aux colonnes existantes (teacher_user_id).
    const updateGuarded = db.prepare(
        `UPDATE group_module_offerings SET teacher_user_id = ?
         WHERE id = ? AND status = 'active'
           AND EXISTS (
             SELECT 1 FROM groups g JOIN academic_years ay ON ay.id = g.academic_year_id
             WHERE g.id = group_module_offerings.group_id AND g.status = 'active' AND ay.status = 'active' AND g.parcours = 'pep'
           )
           AND NOT EXISTS (
             SELECT 1 FROM group_module_offerings
             WHERE group_id = (SELECT group_id FROM group_module_offerings WHERE id = ?) AND chapter_id = (SELECT chapter_id FROM group_module_offerings WHERE id = ?)
               AND status = 'active' AND id != ?
           )
           AND EXISTS (
             SELECT 1 FROM teacher_module_assignments tma
             JOIN users u ON u.id = tma.teacher_user_id
             JOIN teachers te ON te.user_id = u.id
             WHERE tma.teacher_user_id = ? AND tma.chapter_id = (SELECT chapter_id FROM group_module_offerings WHERE id = ?)
               AND tma.academic_year_id = (SELECT g2.academic_year_id FROM groups g2 WHERE g2.id = (SELECT group_id FROM group_module_offerings WHERE id = ?))
               AND tma.status = 'active' AND u.role = 'teacher' AND u.actif = 1 AND te.status = 'active'
           )`
    ).bind(teacherUserId, offeringId, offeringId, offeringId, offeringId, teacherUserId, offeringId, offeringId);

    const selectStmt = db.prepare(P6_OFFERING_SELECT_SQL).bind(offeringId);
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'update_module_offering', 'group_module_offering', ?, ?, ?
         WHERE changes() = 1`
    ).bind(String(user.id), String(offeringId), oldValues, newValues);

    let results;
    try {
        results = await db.batch([updateGuarded, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log('WORKER_ERROR pedagogie-update-module-offering (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }

    const changesCount = (results && results[0] && results[0].meta) ? (results[0].meta.changes || 0) : 0;
    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Offering introuvable' }, 404);
    if (changesCount === 0) {
        // Course : état devenu non-active, ou garde réévaluée fausse à l'écriture.
        if (row.status !== 'active') return reponseJSON({ erreur: 'Modification impossible : offering non active' }, 409);
        if (row.teacher_user_id === teacherUserId) return reponseJSON({ offering: _p6MapOfferingRow(row) }, 200);
        return reponseJSON({ erreur: "Changement refusé : gardes P1 non satisfaites au moment de l'écriture (affectation active requise, pas de doublon)" }, 409);
    }
    return reponseJSON({ offering: _p6MapOfferingRow(row) }, 200);
}

// Archivage : active→archived, idempotent ; ne touche JAMAIS l'affectation
// (pas de cascade) ; 'orphan' jamais produit ici.
async function handlePedagogieArchiveModuleOffering(env, user, body) {
    const db = env.DB;
    if (!db) return reponseJSON({ erreur: 'Service non configuré' }, 503);
    body = body || {};

    if (!Number.isInteger(body.offeringId) || body.offeringId < 1) {
        return reponseJSON({ erreur: 'offeringId doit être un entier > 0' }, 400);
    }
    const offeringId = body.offeringId;

    const existing = await db.prepare(P6_OFFERING_SELECT_SQL).bind(offeringId).first();
    if (!existing) return reponseJSON({ erreur: 'Offering introuvable' }, 404);
    if (existing.status === 'archived') {
        // Déjà archivée : 200 idempotent, aucune écriture, aucun audit.
        return reponseJSON({ offering: _p6MapOfferingRow(existing) }, 200);
    }
    if (existing.status !== 'active') {
        return reponseJSON({ erreur: 'Transition impossible : état incompatible' }, 409);
    }

    const oldValues = JSON.stringify({ status: 'active' });
    const newValues = JSON.stringify({ status: 'archived' });

    const updateStmt = db.prepare(
        `UPDATE group_module_offerings SET status = 'archived'
         WHERE id = ? AND status = 'active'`
    ).bind(offeringId);
    const selectStmt = db.prepare(P6_OFFERING_SELECT_SQL).bind(offeringId);
    const auditStmt = db.prepare(
        `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, old_values, new_values)
         SELECT ?, 'archive_module_offering', 'group_module_offering', ?, ?, ?
         WHERE changes() = 1`
    ).bind(String(user.id), String(offeringId), oldValues, newValues);

    let results;
    try {
        results = await db.batch([updateStmt, selectStmt, auditStmt]);
    } catch (err) {
        const msg = (err && err.message) ? String(err.message) : '';
        console.log('WORKER_ERROR pedagogie-archive-module-offering (D1):', msg);
        return reponseJSON({ erreur: 'Erreur de base de données' }, 500);
    }
    const fetched = (results && results[1] && Array.isArray(results[1].results)) ? results[1].results : [];
    const row = fetched[0];
    if (!row) return reponseJSON({ erreur: 'Offering introuvable' }, 404);
    // changes===0 après pré-lecture active = archivée en course -> idempotent.
    return reponseJSON({ offering: _p6MapOfferingRow(row) }, 200);
}

export default {
    async fetch(request, env, ctx) {
        // ─── Contrôle strict de l'origine CORS ───
        const origin = request.headers && typeof request.headers.get === 'function'
            ? request.headers.get('Origin') : null;
        const originAllowed = !origin || origin === ALLOWED_ORIGIN;

        // Prévol CORS — uniquement pour l'origine autorisée
        if (request.method === 'OPTIONS') {
            if (!originAllowed) {
                return new Response(null, { status: 403 });
            }
            return new Response(null, { status: 204, headers: getCorsHeaders(request) });
        }
        if (request.method !== 'POST') {
            const corsH = originAllowed ? getCorsHeaders(request) : {};
            return new Response(JSON.stringify({ erreur: 'Méthode non autorisée (POST uniquement)' }),
                { status: 405, headers: Object.assign({ 'Content-Type': 'application/json' }, corsH) });
        }
        // Origine non autorisée → 403 sans headers CORS
        if (!originAllowed) {
            return new Response(JSON.stringify({ erreur: 'Origine non autorisée' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        // CATCH GLOBAL : capturer toute exception non gérée pour retourner une réponse structurée
        try {
            const result = await this._handlePostRequest(request, env);
            // Ajouter les headers CORS à toutes les réponses (origine déjà validée)
            const corsH = getCorsHeaders(request);
            for (const [k, v] of Object.entries(corsH)) {
                result.headers.set(k, v);
            }
            return result;
        } catch (globalError) {
            // Exception non capturée par les blocs internes
            console.error('WORKER_GLOBAL_ERROR:', {
                type: globalError.constructor.name,
                message: globalError.message,
                stack: globalError.stack
            });
            return new Response(JSON.stringify({
                erreur: 'Erreur interne du Worker',
                source: 'worker_error',
                code: 'UNCAUGHT_EXCEPTION',
                details: globalError.message
            }), {
                status: 502,
                headers: Object.assign({ 'Content-Type': 'application/json' }, getCorsHeaders(request))
            });
        }
    },

    async _handlePostRequest(request, env) {

        // Extraction du token de session (pour toutes les actions)
        const sessionToken = extractSessionToken(request);

        // ─── ROUTING AUTHENTIFICATION (pas besoin de GROQ_API_KEY) ───
        let corpsBrut = null;
        try {
            const cloneable = typeof request.clone === 'function' ? request.clone() : request;
            corpsBrut = await cloneable.json();
        } catch (e) { /* corps non-JSON ou clone non supporté */ }
        const actionAuth = (corpsBrut && typeof corpsBrut === 'object') ? corpsBrut.action : undefined;

        if (actionAuth === 'login') {
            return await handleLogin(request, env);
        }
        if (actionAuth === 'logout') {
            return await handleLogout(request, env);
        }
        if (actionAuth === 'change-password') {
            if (!sessionToken) return reponseJSON({ erreur: 'Authentification requise' }, 401);
            const { session, error } = await requireSession(request, env);
            if (error) return error;
            return await handleChangePassword(request, env, session);
        }
        if (actionAuth === 'me') {
            if (!sessionToken) return reponseJSON({ erreur: 'Authentification requise' }, 401);
            const { session, error } = await requireSession(request, env);
            if (error) return error;
            return await handleMe(env, session);
        }

        // ─── ADMIN — Réservé au concepteur (role=teacher, concepteur=1) ───

        // ─── BOOTSTRAP — Mécanisme temporaire (BOOTSTRAP_KEY requis) ───
        if (actionAuth === 'bootstrap-set-password') {
            return await handleBootstrapSetPassword(request, env);
        }

        if (actionAuth === 'admin-list-users') {
            const { user, error } = await requireConcepteur(request, env);
            if (error) return error;
            return await handleAdminListUsers(env, user);
        }
        if (actionAuth === 'admin-reset-password') {
            const { user, error } = await requireConcepteur(request, env);
            if (error) return error;
            return await handleAdminResetPassword(request, env, user);
        }
        if (actionAuth === 'admin-reset-batch') {
            const { user, error } = await requireConcepteur(request, env);
            if (error) return error;
            return await handleAdminResetBatch(request, env, user);
        }

        // ─── GESTION PÉDAGOGIQUE — Lecture (allowlist users.id) ───
        if (actionAuth === 'pedagogie-list-academic-years') {
            const { error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieListAcademicYears(env, corpsBrut);
        }
        if (actionAuth === 'pedagogie-list-teachers') {
            const { error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieListTeachers(env, corpsBrut);
        }
        if (actionAuth === 'pedagogie-list-students') {
            const { error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieListStudents(env, corpsBrut);
        }
        if (actionAuth === 'pedagogie-list-users') {
            const { error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieListUsers(env, corpsBrut);
        }
        if (actionAuth === 'pedagogie-list-groups') {
            const { error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieListGroups(env, corpsBrut);
        }
        if (actionAuth === 'pedagogie-list-group-members') {
            const { error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieListGroupMembers(env, corpsBrut);
        }
        if (actionAuth === 'pedagogie-list-teacher-assignments') {
            const { error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieListTeacherAssignments(env, corpsBrut);
        }
        if (actionAuth === 'pedagogie-list-module-offerings') {
            const { error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieListModuleOfferings(env, corpsBrut);
        }
        if (actionAuth === 'pedagogie-list-audit-log') {
            const { error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieListAuditLog(env, corpsBrut);
        }

        // ─── GESTION PÉDAGOGIQUE — Écriture (allowlist users.id) ───
        if (actionAuth === 'pedagogie-create-academic-year') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieCreateAcademicYear(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-archive-academic-year') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieArchiveAcademicYear(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-create-teacher') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieCreateTeacher(env, user, corpsBrut);
        }
        // ─── P6.2 — cycle de vie des profils (GO GLOBAL P6) ───
        if (actionAuth === 'pedagogie-update-teacher') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieUpdateTeacher(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-inactivate-teacher') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieInactivateTeacher(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-create-student') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieCreateStudent(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-update-student') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieUpdateStudent(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-inactivate-student') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieInactivateStudent(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-create-group') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieCreateGroup(env, user, corpsBrut);
        }
        // ─── P6.1 — cycle de vie des groupes (GO GLOBAL P6) ───
        if (actionAuth === 'pedagogie-update-group') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieUpdateGroup(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-inactivate-group') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieInactivateGroup(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-archive-group') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieArchiveGroup(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-add-student-to-group') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieAddStudentToGroup(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-add-students-to-group') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieAddStudentsToGroup(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-assign-teacher-module') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieAssignTeacherModule(env, user, corpsBrut);
        }
        // ─── P6.3 — cycle de vie des affectations (GO GLOBAL P6) ───
        if (actionAuth === 'pedagogie-archive-teacher-assignment') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieArchiveTeacherAssignment(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-create-module-offering') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieCreateModuleOffering(env, user, corpsBrut);
        }
        // ─── P6.4 — cycle de vie des offerings (GO GLOBAL P6) ───
        if (actionAuth === 'pedagogie-update-module-offering') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieUpdateModuleOffering(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-archive-module-offering') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieArchiveModuleOffering(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-create-user') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieCreateUser(env, user, corpsBrut);
        }
        if (actionAuth === 'pedagogie-end-membership') {
            const { user, error } = await requirePedagogieAdmin(request, env);
            if (error) return error;
            return await handlePedagogieEndMembership(env, user, corpsBrut);
        }

        // ─── PIPELINE IA — Session requise ───
        if (AUTH_REQUIRED) {
            if (!env.DB) {
                return reponseJSON({ erreur: 'Service authentification non configuré', source: 'auth_unavailable' }, 503);
            }
            if (!sessionToken) {
                return reponseJSON({ erreur: 'Authentification requise', source: 'auth_required' }, 401);
            }
            const { session, error } = await requireSession(request, env);
            if (error) return error;
            // Nettoyage périodique des sessions expirées (best-effort)
            await cleanupExpiredSessions(env.DB);
        }

        // Secret présent ? (jamais exposé au navigateur)
        const cle = env && env.GROQ_API_KEY;
        if (!cle) {
            console.log('WORKER_INFO: Secret GROQ_API_KEY manquant');
            return reponseJSON({ erreur: 'Service IA non configuré' }, 503);
        }

        console.log('WORKER_INFO: Début traitement requête POST');
        const debutTotal = Date.now();

        // Validation du corps
        let corps = null;
        try {
            corps = await request.json();
        } catch (e) {
            return reponseJSON({ erreur: 'JSON invalide' }, 400);
        }
        if (!corps || typeof corps !== 'object') {
            return reponseJSON({ erreur: 'Corps de requête invalide' }, 400);
        }

        // ─── CONTRAT V2 — Pipeline A22B complet ───
        if (isRequestV2(corps)) {
            console.log('WORKER_V2: Requête V2 détectée (contractVersion: "2.0")');
            const v2Validation = validateRequestV2(corps);
            if (!v2Validation.valid) {
                console.log('WORKER_V2: Validation RequestV2 échouée', { errors: v2Validation.errors });
                return reponseJSON({
                    contractVersion: CONTRACT_VERSION,
                    erreur: 'RequestV2 invalide',
                    details: v2Validation.errors
                }, 400);
            }
            console.log('WORKER_V2: RequestV2 validée', { mode: corps.mode });

            // Protection anti-rafale
            if (concurrentRequests >= MAX_CONCURRENT_REQUESTS) {
                return reponseJSON(buildEmptyResponseV2(null, 'throttled', 'anti_rafale'), 429);
            }
            concurrentRequests++;

            // ─── B1-A : libération idempotente du slot de concurrence ───
            // Une réservation (ligne ci-dessus) doit avoir EXACTEMENT une libération.
            // `slotLibere` rend la libération idempotente : le chemin d'erreur libère AVANT
            // l'attente de retry (sinon le slot serait retenu artificiellement pendant
            // jusqu'à 10 s — défaut P1 de l'audit B0), et le `finally` reste un filet de
            // sécurité pour tout chemin non anticipé.
            let slotLibere = false;

            try {
                const debutV2 = Date.now();
                try {
                    const v2Result = await pipelineA22BV2(corps, cle);
                    console.log('WORKER_V2: Pipeline A22B V2 réussi', {
                        dureeMs: Date.now() - debutV2,
                        source: v2Result.source
                    });

                    // Valider la réponse avant envoi
                    const respValidation = validateResponseV2(v2Result);
                    if (!respValidation.valid) {
                        console.error('WORKER_V2: ResponseV2 invalide construite', { errors: respValidation.errors });
                    }
                    return reponseJSON(v2Result, 200);

                } catch (errV2) {
                    console.error('WORKER_V2: Échec pipeline A22B V2', {
                        type: errV2.constructor.name,
                        message: errV2.message,
                        dureeTotaleMs: Date.now() - debutTotal
                    });

                    // ─── B1-A : libérer le slot AVANT l'attente de retry ───
                    // Le slot de concurrence protège l'accès concurrent aux appels Groq ;
                    // il ne doit PAS couvrir une temporisation. Sans cette libération, une
                    // attente de `retryAfter` (jusqu'à 10 s) immobilisait un slot sur
                    // MAX_CONCURRENT_REQUESTS = 10 et aggravait la saturation (audit B0, P1).
                    // Aligne la branche V2 sur le comportement de la branche legacy, qui libère
                    // déjà son slot dans le `catch` avant l'attente équivalente.
                    if (!slotLibere) {
                        slotLibere = true;
                        concurrentRequests--;
                    }

                    // Fallback A22 si erreur transitoire
                    if (estTransitoire(errV2)) {
                        const retryAfter = errV2.retryAfter || 5;
                        if (retryAfter <= 10) {
                            await new Promise(function(resolve) { setTimeout(resolve, retryAfter * 1000); });
                            try {
                                console.log('WORKER_V2: Fallback A22 V2');
                                const v2A22 = await pipelineA22V2(corps, cle);
                                console.log('WORKER_V2: Fallback A22 V2 réussi');
                                return reponseJSON(v2A22, 200);
                            } catch (errA22V2) {
                                console.error('WORKER_V2: Échec fallback A22 V2');
                            }
                        }
                    }

                    // Fallback local
                    console.log('WORKER_V2: Fallback local V2');
                    const v2Local = fallbackLocalV2(corps);
                    return reponseJSON(v2Local, 200);
                }
            } finally {
                // B1-A : filet de sécurité — ne décrémente que si le slot n'a pas déjà été
                // libéré avant l'attente de retry. Garantit exactement une libération par
                // réservation, sans double décrément ni slot perdu.
                if (!slotLibere) {
                    slotLibere = true;
                    concurrentRequests--;
                }
            }
        }

        // ─── CONTRAT LEGACY (V1) — Comportement existant ───

        // action : doit être "analyze" si présent
        if (corps.action !== undefined && corps.action !== 'analyze') {
            return reponseJSON({ erreur: 'Action non supportée' }, 400);
        }

        // userPrompt : requis, chaîne non vide
        const userPrompt = typeof corps.userPrompt === 'string' ? corps.userPrompt.trim() : '';
        if (!userPrompt) {
            return reponseJSON({ erreur: 'Champ "userPrompt" (chaîne non vide) requis' }, 400);
        }
        if (userPrompt.length > MAX_STUDENT_CHARS) {
            return reponseJSON({ erreur: 'userPrompt trop long (maximum ' + MAX_STUDENT_CHARS + ' caractères)' }, 413);
        }

        // systemPrompt : optionnel, borné
        const systemPrompt = typeof corps.systemPrompt === 'string' ? corps.systemPrompt.slice(0, MAX_CONTEXT_CHARS) : '';

        // context : optionnel, borné
        const contexte = typeof corps.context === 'string' ? corps.context.slice(0, MAX_CONTEXT_CHARS) : '';

        // maxTokens : optionnel, borné (validé, pipeline utilise ses propres budgets optimisés)
        if (corps.maxTokens !== undefined) {
            const mt = Number(corps.maxTokens);
            if (!Number.isFinite(mt) || mt < MAX_TOKENS_MIN || mt > MAX_TOKENS_MAX) {
                return reponseJSON({ erreur: 'maxTokens hors limites (' + MAX_TOKENS_MIN + '–' + MAX_TOKENS_MAX + ')' }, 400);
            }
        }

        // temperature : optionnel, borné 0–1
        let temperatureClient = TEMPERATURE_DEFAULT;
        if (corps.temperature !== undefined) {
            const t = Number(corps.temperature);
            if (!Number.isFinite(t) || t < 0 || t > 1) {
                return reponseJSON({ erreur: 'temperature hors limites (0–1)' }, 400);
            }
            temperatureClient = t;
        }

        // reglesLocales : optionnel, rétrocompatible
        const reglesLocales = Array.isArray(corps.reglesLocales)
            ? corps.reglesLocales.filter(function (x) { return typeof x === 'string'; }).slice(0, MAX_REGLES).map(function (x) { return x.slice(0, MAX_REGLE_CHARS); })
            : [];

        // ACTION 28 : Protection anti-rafale locale par instance Worker
        if (concurrentRequests >= MAX_CONCURRENT_REQUESTS) {
            return reponseJSON({ 
                erreur: 'Service IA temporairement saturé (trop de requêtes simultanées)', 
                source: 'local_requis',
                retryAfter: 5
            }, 429);
        }
        concurrentRequests++;

        const debut = Date.now();
        const usages = [];

        try {
            // ÉTAPE 1 — ANALYSE
            console.log('WORKER_PIPELINE: Début étape 1 (ANALYSE)');
            const debutEtape1 = Date.now();
            const r1 = await appelerGroq(cle, [
                { role: 'system', content: promptSystemeAnalyse() },
                {
                    role: 'user',
                    content: 'Réponse de l\'élève : ' + userPrompt +
                        (systemPrompt ? '\nInstructions : ' + systemPrompt : '') +
                        (contexte ? '\nContexte de l\'activité : ' + contexte : '') +
                        (reglesLocales.length ? '\nIndications des règles locales déclenchées : ' + reglesLocales.join(' ; ') : '')
                }
            ], 500, 0.1);
            usages.push(r1.usage);
            const etape1 = extraireJSON(r1.contenu);
            console.log('WORKER_PIPELINE: Fin étape 1 (ANALYSE)', {
                dureeMs: Date.now() - debutEtape1,
                finish_reason: r1.finish_reason,
                usage_tokens: r1.usage?.total_tokens
            });

            // ÉTAPE 2 — TUTEUR (reçoit la réponse originale + le JSON compact de l'étape 1)
            console.log('WORKER_PIPELINE: Début étape 2 (TUTEUR)');
            const debutEtape2 = Date.now();
            const r2 = await appelerGroq(cle, [
                { role: 'system', content: promptSystemeTuteur() },
                {
                    role: 'user',
                    content: 'Réponse originale de l\'élève : ' + userPrompt +
                        '\nAnalyse (JSON étape 1) : ' + JSON.stringify(etape1)
                }
            ], 500, 0.7);
            usages.push(r2.usage);
            const etape2 = extraireJSON(r2.contenu);
            console.log('WORKER_PIPELINE: Fin étape 2 (TUTEUR)', {
                dureeMs: Date.now() - debutEtape2,
                finish_reason: r2.finish_reason,
                usage_tokens: r2.usage?.total_tokens
            });

            // ÉTAPE 3 — COURS (reçoit les JSON compacts des étapes 1 et 2 + règles locales)
            console.log('WORKER_PIPELINE: Début étape 3 (COURS)');
            const debutEtape3 = Date.now();
            const r3 = await appelerGroq(cle, [
                { role: 'system', content: promptSystemeCours() },
                {
                    role: 'user',
                    content: 'Analyse (JSON étape 1) : ' + JSON.stringify(etape1) +
                        '\nExplication (JSON étape 2) : ' + JSON.stringify(etape2) +
                        (reglesLocales.length ? '\nRègles locales déclenchées : ' + reglesLocales.join(' ; ') : '')
                }
            ], 500, 0.3);
            usages.push(r3.usage);
            const etape3 = extraireJSON(r3.contenu);
            console.log('WORKER_PIPELINE: Fin étape 3 (COURS)', {
                dureeMs: Date.now() - debutEtape3,
                finish_reason: r3.finish_reason,
                usage_tokens: r3.usage?.total_tokens
            });

            // Tokens réels (fournis par Groq) — mesure, pas estimation.
            const usageTotal = usages.reduce(function (acc, u) {
                if (!u) return acc;
                acc.prompt_tokens += u.prompt_tokens || 0;
                acc.completion_tokens += u.completion_tokens || 0;
                acc.total_tokens += u.total_tokens || 0;
                return acc;
            }, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });

            // ACTION 28 : Libérer le compteur de requêtes concurrentes (succès — une seule fois)
            concurrentRequests--;

            const etapesA22B = { analyse: etape1, tuteur: etape2, cours: etape3 };
            const contenuSynthetise = synthetiserReponsePedagogique(etapesA22B);

            console.log('WORKER_PIPELINE: A22B réussi', {
                dureeTotaleMs: Date.now() - debutTotal,
                source: 'remote_a22b'
            });

            return reponseJSON({
                source: 'remote_a22b',
                modele: GROQ_MODEL,
                etapes: etapesA22B,
                usage: usageTotal,
                traitementMs: Date.now() - debut,
                choices: [{ message: { content: contenuSynthetise } }],
                analysis: contenuSynthetise
            }, 200);

        } catch (errA22B) {
            // ACTION 28 : Libérer le compteur de requêtes concurrentes en cas d'erreur
            concurrentRequests--;
            
            console.error('WORKER_PIPELINE: Échec A22B', {
                type: errA22B.constructor.name,
                message: errA22B.message,
                statut: errA22B.statut,
                transitoire: errA22B.transitoire,
                dureeTotaleMs: Date.now() - debutTotal
            });
            
            // ACTION 23 — classification : seules les erreurs transitoires (429/timeout/5xx)
            // justifient le plan B A22. Les erreurs d'entrée (400/413/405/CORS) ont déjà été
            // traitées avant ce bloc ; une erreur de clé (401/403) est permanente : pas de A22.
            if (estTransitoire(errA22B)) {
                // ACTION 28 : Respecter Retry-After pour éviter d'aggraver les rafales
                const retryAfter = errA22B.retryAfter || 5; // Défaut 5 secondes
                
                if (retryAfter <= 10) {
                    // Délai court : attendre puis tenter A22
                    console.log('WORKER_PIPELINE: Attente avant fallback A22', { retryAfter });
                    await new Promise(function(resolve) { setTimeout(resolve, retryAfter * 1000); });
                    
                    try {
                        // Plan B : UNE seule tentative A22, sans retry ni boucle.
                        console.log('WORKER_PIPELINE: Début fallback A22');
                        const debutA22 = Date.now();
                        const rA = await appelerA22(cle, userPrompt, contexte, reglesLocales, systemPrompt);
                        const a22 = extraireJSON(rA.contenu);
                        const etapesA22 = { a22: a22 };
                        const contenuA22 = synthetiserReponsePedagogique(etapesA22);
                        console.log('WORKER_PIPELINE: Fallback A22 réussi', {
                            dureeMs: Date.now() - debutA22,
                            dureeTotaleMs: Date.now() - debutTotal,
                            finish_reason: rA.finish_reason,
                            usage_tokens: rA.usage?.total_tokens
                        });
                        return reponseJSON({
                            source: 'remote_a22_fallback',
                            modele: GROQ_MODEL,
                            etapes: etapesA22,
                            usage: rA.usage || null,
                            traitementMs: Date.now() - debut,
                            bascule: 'a22b_vers_a22:' + (errA22B.statut || 'transitoire'),
                            choices: [{ message: { content: contenuA22 } }],
                            analysis: contenuA22
                        }, 200);
                    } catch (errA22) {
                        console.error('WORKER_PIPELINE: Échec fallback A22', {
                            type: errA22.constructor.name,
                            message: errA22.message,
                            statut: errA22.statut,
                            transitoire: errA22.transitoire,
                            dureeTotaleMs: Date.now() - debutTotal
                        });
                        // A22 a échoué à son tour (ex: quota épuisé même pour 1 appel) :
                        // 429 si quota (avec retryAfter Groq le cas échéant).
                        // Sinon, fallback local propre en HTTP 200 pour que Cloudflare
                        // ne strippe pas le body (les 502 sont dépouillés par le edge).
                        // Le client retombera sur l'analyse locale (275 règles).
                        if (errA22 && errA22.statut === 429) {
                            return reponseJSON({ erreur: 'Service IA saturé, réessayez plus tard', retryAfter: errA22.retryAfter || errA22B.retryAfter || null, source: 'local_requis' }, 429);
                        }
                        console.log('WORKER_PIPELINE: Bascule vers fallback local (A22B+A22 échoués)');
                        return reponseJSON({ erreur: 'Service IA indisponible', source: 'local_requis' }, 200);
                    }
                } else {
                    // Délai long ou absent : fallback local immédiat
                    return reponseJSON({ 
                        erreur: 'Service IA temporairement saturé', 
                        retryAfter: retryAfter,
                        source: 'local_requis' 
                    }, 200);
                }
            }
            // Erreur permanente (clé invalide/absente côté Groq, etc.) : fallback local
            // propre en HTTP 200 pour que Cloudflare ne strippe pas le body.
            // Le client active son fallback local (275 règles). Jamais de détail interne ni de clé.
            console.log('WORKER_PIPELINE: Erreur permanente, bascule vers fallback local');
            return reponseJSON({ erreur: 'Service IA indisponible', source: 'local_requis' }, 200);
        }
    }
};
