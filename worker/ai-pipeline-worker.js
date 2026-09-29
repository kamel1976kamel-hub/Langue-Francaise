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
    CONTRACT_VERSION
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
function validateAnalyseV2(raw, localRuleIds) {
    var result = extraireJSON(raw);
    var diagnostic = typeof result.diagnostic === 'string' ? result.diagnostic.slice(0, 300) : '';
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
        { role: 'system', content: promptSystemeAnalyseV2() },
        {
            role: 'user',
            content: 'Texte original de l\'élève : "' + textOriginal + '"\n' +
                contextPrompt +
                (detectionsPrompt ? detectionsPrompt + '\n' : '')
        }
    ], 500, 0.2);
    console.log('WORKER_V2: Fin étape 1 (ANALYSE)', { dureeMs: Date.now() - debut1 });
    var analyse = validateAnalyseV2(r1.contenu, localRuleIds);

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
    var tuteur = validateTuteurV2(r2.contenu);

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
    var cours = validateCoursV2(r3.contenu, localRuleIds);

    // Construire la ResponseV2
    return buildResponseV2({
        source: 'remote_a22b',
        status: 'ok',
        diagnostic: analyse.diagnostic,
        errors: analyse.erreurs,
        priority: analyse.priorite,
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
    var textOriginal = request.student.text_original;
    var contextPrompt = buildV2ContextPrompt(request);
    var detectionsPrompt = buildV2DetectionsPrompt(request);
    var localRuleIds = buildLocalRuleIdSet(request);
    var localRulesUsed = Array.isArray(request.local_detections)
        ? request.local_detections.map(function(d) { return d.rule_id; }).filter(Boolean)
        : [];

    var rA = await appelerGroq(cle, [
        { role: 'system', content: promptSystemeA22() },
        {
            role: 'user',
            content: 'Texte original de l\'élève : "' + textOriginal + '"\n' +
                contextPrompt +
                (detectionsPrompt ? detectionsPrompt + '\n' : '')
        }
    ], 700, 0.5);

    var a22 = extraireJSON(rA.contenu);

    // Mapper A22 → ResponseV2
    var analysePart = typeof a22.analyse === 'string' ? a22.analyse : '';
    var tutorPart = typeof a22.pedagogie === 'string' ? a22.pedagogie : '';
    var coursePart = typeof a22.reference === 'string' ? a22.reference : '';

    return buildResponseV2({
        source: 'remote_a22_fallback',
        status: 'ok',
        diagnostic: analysePart.slice(0, 300),
        errors: [],
        priority: '',
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
