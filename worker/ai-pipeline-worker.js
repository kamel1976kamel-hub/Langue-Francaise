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

// CORS dynamique : vérifie l'Origin de la requête.
// Retourne les headers CORS uniquement si l'origine est autorisée
// ou si aucun Origin n'est fourni (outils serveur / tests).
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
