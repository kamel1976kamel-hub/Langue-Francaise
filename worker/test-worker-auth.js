/**
 * =================================================================
 * TESTS D'AUTHENTIFICATION — WORKER + D1
 * =================================================================
 * Tests les endpoints auth : /login, /logout, /change-password, /me
 * Mock D1 + Web Crypto API (Node.js natif)
 * =================================================================
 */

let pass = 0, fail = 0;
function assert(cond, label) {
    if (cond) { pass++; console.log('  ✅ ' + label); }
    else { fail++; console.error('  ❌ ' + label); }
}
function assertEq(actual, expected, label) {
    assert(actual === expected, label + ' (attendu: ' + JSON.stringify(expected) + ', obtenu: ' + JSON.stringify(actual) + ')');
}

// =================================================================
// MOCK D1 DATABASE
// =================================================================
class MockD1Database {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
        this.loginAttempts = [];
    }

    addUser(user) {
        this.users.set(user.username, { ...user });
    }

    _match(sql, patterns) {
        const s = sql.replace(/\s+/g, ' ').trim().toLowerCase();
        return patterns.every(p => s.includes(p));
    }

    prepare(sql) {
        const self = this;
        const params = [];
        return {
            bind: function(...args) {
                params.push(...args);
                return this;
            },
            first: async function() {
                // SELECT user by username (WHERE username =)
                if (self._match(sql, ['select', 'users', 'where username'])) {
                    return self.users.get(params[0]) || null;
                }
                // SELECT user by id (WHERE id =)
                if (self._match(sql, ['select', 'users', 'where id'])) {
                    const checkActif = sql.toLowerCase().includes('actif');
                    for (const u of self.users.values()) {
                        if (u.id === params[0]) {
                            if (checkActif && !u.actif) return null;
                            return { ...u };
                        }
                    }
                    return null;
                }
                // SELECT session by token_hash
                if (self._match(sql, ['select', 'sessions', 'token_hash'])) {
                    return self.sessions.get(params[0]) || null;
                }
                // SELECT COUNT login_attempts by username
                if (self._match(sql, ['select', 'count', 'login_attempts', 'where username'])) {
                    const cutoff = params[1];
                    let count = 0;
                    for (const a of self.loginAttempts) {
                        if (a.username === params[0] && !a.success && a.attempted_at > cutoff) count++;
                    }
                    return { count };
                }
                // SELECT COUNT login_attempts by ip_hash
                if (self._match(sql, ['select', 'count', 'login_attempts', 'where ip_hash'])) {
                    const cutoff = params[1];
                    let count = 0;
                    // Distinguer : rate limit (reset:%) vs global IP check (success=0)
                    const isRateLimitQuery = sql.toLowerCase().includes("'reset:%'") || sql.toLowerCase().includes('reset:%');
                    for (const a of self.loginAttempts) {
                        if (a.ip_hash === params[0] && a.attempted_at > cutoff) {
                            if (isRateLimitQuery) {
                                // Rate limit : compte les resets (success=1, username reset:*)
                                if (a.success && a.username.startsWith('reset:')) count++;
                            } else {
                                // Global IP check : compte les échecs de login (success=0)
                                if (!a.success) count++;
                            }
                        }
                    }
                    return { count };
                }
                return null;
            },
            all: async function() {
                // SELECT all users (for admin-list-users)
                if (self._match(sql, ['select', 'users', 'order'])) {
                    // Filtrer pour exclure password_hash (comme le fait la vraie requête SQL)
                    return { results: Array.from(self.users.values()).map(u => ({
                        id: u.id, username: u.username, display_name: u.display_name,
                        role: u.role, concepteur: u.concepteur, actif: u.actif,
                        must_change: u.must_change, created_at: u.created_at || '', updated_at: u.updated_at || ''
                    })) };
                }
                return { results: [] };
            },
            run: async function() {
                // INSERT INTO users
                if (self._match(sql, ['insert', 'users'])) {
                    const [id, username, hash, name, role, concepteur, actif, must_change] = params;
                    self.users.set(username, {
                        id, username, password_hash: hash, display_name: name,
                        role, concepteur, actif, must_change
                    });
                    return;
                }
                // INSERT INTO sessions
                if (self._match(sql, ['insert', 'sessions'])) {
                    const [token_hash, user_id, expires_at] = params;
                    self.sessions.set(token_hash, { user_id, expires_at });
                    return;
                }
                // INSERT INTO login_attempts
                if (self._match(sql, ['insert', 'login_attempts'])) {
                    // SQL: VALUES (?, ?, 1) — success est un literal dans le SQL
                    const successIsLiteral = sql.includes('= 1') || sql.includes(', 1)');
                    const [username, ip_hash] = params;
                    const success = successIsLiteral ? 1 : (params[2] || 0);
                    self.loginAttempts.push({
                        username, ip_hash, success: !!success,
                        attempted_at: new Date().toISOString()
                    });
                    return;
                }
                // DELETE sessions by token_hash
                if (self._match(sql, ['delete', 'sessions', 'token_hash'])) {
                    self.sessions.delete(params[0]);
                    return;
                }
                // DELETE sessions by user_id (admin reset)
                if (self._match(sql, ['delete', 'sessions', 'user_id'])) {
                    const targetId = params[0];
                    for (const [k, v] of self.sessions) {
                        if (v.user_id === targetId) self.sessions.delete(k);
                    }
                    return;
                }
                // DELETE sessions expired
                if (self._match(sql, ['delete', 'sessions', 'expires_at'])) {
                    const cutoff = params[0];
                    for (const [k, v] of self.sessions) {
                        if (v.expires_at < cutoff) self.sessions.delete(k);
                    }
                    return;
                }
                // DELETE login_attempts by username (success=0)
                if (self._match(sql, ['delete', 'login_attempts', 'username'])) {
                    self.loginAttempts = self.loginAttempts.filter(a => a.username !== params[0] || a.success);
                    return;
                }
                // DELETE login_attempts old
                if (self._match(sql, ['delete', 'login_attempts', 'attempted_at'])) {
                    const cutoff = params[0];
                    self.loginAttempts = self.loginAttempts.filter(a => a.attempted_at > cutoff);
                    return;
                }
                // UPDATE users password
                if (self._match(sql, ['update', 'users', 'password_hash'])) {
                    const [newHash, userId] = params;
                    // Distinguer must_change=0 (change-password) vs must_change=1 (admin reset)
                    const setMustChangeZero = sql.includes('must_change = 0');
                    for (const [k, u] of self.users) {
                        if (u.id === userId) {
                            u.password_hash = newHash;
                            u.must_change = setMustChangeZero ? 0 : 1;
                        }
                    }
                    return;
                }
            }
        };
    }
}

// =================================================================
// HELPERS
// =================================================================
let workerModule = null;

async function sha256Hex(data) {
    const encoded = new TextEncoder().encode(data);
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function makeRequest(body, method, headers) {
    const hdrs = new Map();
    if (headers) {
        for (const [k, v] of Object.entries(headers)) {
            hdrs.set(k.toLowerCase(), v);
        }
    }
    if (!hdrs.has('cf-connecting-ip')) hdrs.set('cf-connecting-ip', '1.2.3.4');
    return {
        method: method || 'POST',
        headers: {
            get: function(k) { return hdrs.get(k.toLowerCase()) || null; }
        },
        json: async function() {
            if (typeof body === 'string') throw new Error('invalid json');
            return body;
        },
        clone: function() { return this; }
    };
}

async function makeMockEnv(db) {
    // Créer un utilisateur de test avec mot de passe hashé
    const pepper = 'test-pepper-secret';
    const password = 'TestPassword123';
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    const keyMaterial = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(password + pepper), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
    );
    const hash = Array.from(new Uint8Array(bits))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    const passwordHash = '100000:' + salt + ':' + hash;

    // Créer un deuxième utilisateur (must_change=1)
    const password2 = 'TempPass456!';
    const salt2 = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    const keyMaterial2 = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(password2 + pepper), 'PBKDF2', false, ['deriveBits']
    );
    const bits2 = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: new TextEncoder().encode(salt2), iterations: 100000, hash: 'SHA-256' },
        keyMaterial2, 256
    );
    const hash2 = Array.from(new Uint8Array(bits2))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    const passwordHash2 = '100000:' + salt2 + ':' + hash2;

    if (!db) db = new MockD1Database();
    db.addUser({
        id: 'student_001', username: 'amira.hamdaoui',
        password_hash: passwordHash, display_name: 'AMIRA CHAHD HAMDAOUI',
        role: 'student', concepteur: 0, actif: 1, must_change: 0
    });
    db.addUser({
        id: 'student_002', username: 'wissal.hamza',
        password_hash: passwordHash2, display_name: 'WISSAL HAMZA',
        role: 'student', concepteur: 0, actif: 1, must_change: 1
    });
    db.addUser({
        id: 'teacher_001', username: 'kamel.chellouai',
        password_hash: passwordHash, display_name: 'KAMEL CHELLOUAI',
        role: 'teacher', concepteur: 1, actif: 1, must_change: 0
    });
    db.addUser({
        id: 'student_003', username: 'disabled.user',
        password_hash: passwordHash, display_name: 'DISABLED USER',
        role: 'student', concepteur: 0, actif: 0, must_change: 0
    });

    return {
        DB: db,
        GROQ_API_KEY: 'test-key-mock',
        AUTH_PEPPER: pepper,
        BOOTSTRAP_KEY: 'test-bootstrap-key-12345',
        _testPasswords: {
            'amira.hamdaoui': 'TestPassword123',
            'wissal.hamza': 'TempPass456!',
            'kamel.chellouai': 'TestPassword123',
            'disabled.user': 'TestPassword123'
        }
    };
}

// =================================================================
// TESTS
// =================================================================
async function runTests() {
    console.log('🧪 Tests d\'authentification Worker\n');

    try {
        workerModule = await import('./ai-pipeline-worker.js');
    } catch (e) {
        console.error('FATAL: Impossible d\'importer le Worker:', e.message);
        process.exit(2);
    }
    const handler = workerModule.default;
    assert(handler && typeof handler.fetch === 'function', 'Worker importé');

    // ─── TEST 1 : Login valide ───
    console.log('\n📋 Test 1 : Login valide');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({
            action: 'login',
            username: 'amira.hamdaoui',
            password: env._testPasswords['amira.hamdaoui']
        });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assert(data.session && data.session.length === 64, 'Token de session (64 hex chars)');
        assertEq(data.user.username, 'amira.hamdaoui', 'Username correct');
        assertEq(data.user.role, 'student', 'Rôle correct');
        assertEq(data.mustChangePassword, false, 'must_change = false');
        assert(data.expiresAt, 'expiresAt présent');
    }

    // ─── TEST 2 : Mauvais username ───
    console.log('\n📋 Test 2 : Mauvais username');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({ action: 'login', username: 'nonexistent', password: 'whatever' });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 401, 'Statut 401');
        assertEq(data.erreur, 'Identifiants invalides', 'Message générique');
        assert(!data.session, 'Pas de session');
    }

    // ─── TEST 3 : Mauvais mot de passe ───
    console.log('\n📋 Test 3 : Mauvais mot de passe');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: 'WrongPassword' });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 401, 'Statut 401');
        assertEq(data.erreur, 'Identifiants invalides', 'Message générique');
    }

    // ─── TEST 4 : Compte désactivé ───
    console.log('\n📋 Test 4 : Compte désactivé');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({ action: 'login', username: 'disabled.user', password: env._testPasswords['disabled.user'] });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 403, 'Statut 403');
        assertEq(data.erreur, 'Compte désactivé', 'Compte désactivé');
    }

    // ─── TEST 5 : must_change = 1 ───
    console.log('\n📋 Test 5 : must_change = 1 (première connexion)');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({ action: 'login', username: 'wissal.hamza', password: env._testPasswords['wissal.hamza'] });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assertEq(data.mustChangePassword, true, 'must_change = true');
        assert(data.session, 'Session créée malgré must_change');
    }

    // ─── TEST 6 : Session valide — /me ───
    console.log('\n📋 Test 6 : Session valide — /me');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // D'abord login
        const loginReq = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: env._testPasswords['amira.hamdaoui'] });
        const loginResp = await handler.fetch(loginReq, env, {});
        const loginData = await loginResp.json();
        const token = loginData.session;
        // Ensuite /me
        const meReq = makeRequest({ action: 'me' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const meResp = await handler.fetch(meReq, env, {});
        const meData = await meResp.json();
        assertEq(meResp.status, 200, 'Statut 200');
        assertEq(meData.user.username, 'amira.hamdaoui', 'Username via /me');
        assertEq(meData.user.role, 'student', 'Rôle via /me');
    }

    // ─── TEST 7 : Session expirée ───
    console.log('\n📋 Test 7 : Session expirée');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Login
        const loginReq = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: env._testPasswords['amira.hamdaoui'] });
        const loginResp = await handler.fetch(loginReq, env, {});
        const loginData = await loginResp.json();
        const token = loginData.session;
        // Expirer la session manuellement
        for (const [k, v] of db.sessions) {
            v.expires_at = new Date(Date.now() - 1000).toISOString();
        }
        // Tenter /me
        const meReq = makeRequest({ action: 'me' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const meResp = await handler.fetch(meReq, env, {});
        const meData = await meResp.json();
        assertEq(meResp.status, 401, 'Statut 401');
        assertEq(meData.erreur, 'Session expirée', 'Session expirée');
    }

    // ─── TEST 8 : Logout ───
    console.log('\n📋 Test 8 : Logout');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Login
        const loginReq = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: env._testPasswords['amira.hamdaoui'] });
        const loginResp = await handler.fetch(loginReq, env, {});
        const loginData = await loginResp.json();
        const token = loginData.session;
        // Logout
        const logoutReq = makeRequest({ action: 'logout' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const logoutResp = await handler.fetch(logoutReq, env, {});
        const logoutData = await logoutResp.json();
        assertEq(logoutResp.status, 200, 'Logout 200');
        // Vérifier session supprimée
        const meReq = makeRequest({ action: 'me' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const meResp = await handler.fetch(meReq, env, {});
        const meData = await meResp.json();
        assertEq(meResp.status, 401, 'Session invalidée après logout');
    }

    // ─── TEST 9 : Changement de mot de passe ───
    console.log('\n📋 Test 9 : Changement de mot de passe');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Login
        const loginReq = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: env._testPasswords['amira.hamdaoui'] });
        const loginResp = await handler.fetch(loginReq, env, {});
        const loginData = await loginResp.json();
        const token = loginData.session;
        // Change password
        const changeReq = makeRequest({
            action: 'change-password',
            oldPassword: env._testPasswords['amira.hamdaoui'],
            newPassword: 'NewPassword789!'
        }, 'POST', { 'Authorization': 'Bearer ' + token });
        const changeResp = await handler.fetch(changeReq, env, {});
        const changeData = await changeResp.json();
        assertEq(changeResp.status, 200, 'Change password 200');
        // Login avec nouveau mot de passe
        const login2Req = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: 'NewPassword789!' });
        const login2Resp = await handler.fetch(login2Req, env, {});
        const login2Data = await login2Resp.json();
        assertEq(login2Resp.status, 200, 'Login avec nouveau mot de passe');
        // Ancien mot de passe doit échouer
        const login3Req = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: env._testPasswords['amira.hamdaoui'] });
        const login3Resp = await handler.fetch(login3Req, env, {});
        assertEq(login3Resp.status, 401, 'Ancien mot de passe rejeté');
    }

    // ─── TEST 10 : /analyze sans authentification ───
    console.log('\n📋 Test 10 : /analyze sans authentification (DB configurée)');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({
            action: 'analyze',
            userPrompt: 'Test texte',
            systemPrompt: 'Expert',
            context: 'activité'
        });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 401, 'Statut 401');
        assertEq(data.source, 'auth_required', 'Source = auth_required');
    }

    // ─── TEST 11 : /analyze avec session valide ───
    console.log('\n📋 Test 11 : /analyze avec session valide');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Login
        const loginReq = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: env._testPasswords['amira.hamdaoui'] });
        const loginResp = await handler.fetch(loginReq, env, {});
        const loginData = await loginResp.json();
        const token = loginData.session;
        // /analyze avec session
        const analyzeReq = makeRequest({
            action: 'analyze',
            userPrompt: 'la texte est important',
            systemPrompt: 'Expert en français',
            context: 'activité',
            maxTokens: 300,
            temperature: 0.7
        }, 'POST', { 'Authorization': 'Bearer ' + token });
        // Mock fetch pour Groq
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async function() {
            return {
                status: 200, ok: true,
                headers: { get: function() { return null; } },
                json: async function() {
                    return {
                        choices: [{ message: { content: '{"diagnostic":"test","erreurs":[],"priorite":"basse"}' }, finish_reason: 'stop' }],
                        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
                    };
                }
            };
        };
        const analyzeResp = await handler.fetch(analyzeReq, env, {});
        const analyzeData = await analyzeResp.json();
        globalThis.fetch = originalFetch;
        assertEq(analyzeResp.status, 200, '/analyze avec session = 200');
        assert(analyzeData.source === 'remote_a22b' || analyzeData.source === 'remote_a22_fallback' || analyzeData.source === 'local_requis',
            'Source pipeline préservée');
    }

    // ─── TEST 12 : Absence de secrets dans les réponses ───
    console.log('\n📋 Test 12 : Absence de secrets dans les réponses');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: env._testPasswords['amira.hamdaoui'] });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        const responseStr = JSON.stringify(data);
        assert(!responseStr.includes('TestPassword123'), 'Mot de passe absent de la réponse');
        assert(!responseStr.includes(env.AUTH_PEPPER), 'Pepper absent de la réponse');
        assert(!responseStr.includes('100000:'), 'Hash PBKDF2 absent de la réponse');
    }

    // ─── TEST 13 : /analyze sans DB → 503 (AUTH_REQUIRED) ───
    console.log('\n📋 Test 13 : /analyze sans DB → 503 (AUTH_REQUIRED)');
    {
        const env = { GROQ_API_KEY: 'test-key-mock', AUTH_PEPPER: 'pepper' }; // Pas de DB
        const req = makeRequest({
            action: 'analyze',
            userPrompt: 'Test sans DB',
            systemPrompt: 'Expert',
            context: 'activité'
        });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 503, '/analyze sans DB = 503');
        assertEq(data.source, 'auth_unavailable', 'Source = auth_unavailable');
    }

    // ─── TEST 14 : Login sans username/password ───
    console.log('\n📋 Test 14 : Login sans username/password');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({ action: 'login' });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 400, 'Statut 400');
        assert(data.erreur.includes('requis'), 'Message erreur champs requis');
    }

    // ─── TEST 15 : Changement mot de passe trop court ───
    console.log('\n📋 Test 15 : Changement mot de passe trop court');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Login
        const loginReq = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: env._testPasswords['amira.hamdaoui'] });
        const loginResp = await handler.fetch(loginReq, env, {});
        const loginData = await loginResp.json();
        const token = loginData.session;
        // Change avec mot de passe court
        const changeReq = makeRequest({
            action: 'change-password',
            oldPassword: env._testPasswords['amira.hamdaoui'],
            newPassword: 'short'
        }, 'POST', { 'Authorization': 'Bearer ' + token });
        const changeResp = await handler.fetch(changeReq, env, {});
        const changeData = await changeResp.json();
        assertEq(changeResp.status, 400, 'Statut 400');
        assert(changeData.erreur.includes('court'), 'Message mot de passe trop court');
    }

    // ─── TEST 16 : /me sans session ───
    console.log('\n📋 Test 16 : /me sans session');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({ action: 'me' });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 401, 'Statut 401');
        assertEq(data.erreur, 'Authentification requise', 'Authentification requise');
    }

    // ─── TEST 17 : CORS Authorization header ───
    console.log('\n📋 Test 17 : CORS Authorization header');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({}, 'OPTIONS');
        const resp = await handler.fetch(req, env, {});
        const corsHeaders = resp.headers.get('Access-Control-Allow-Headers');
        assert(corsHeaders.includes('Authorization'), 'CORS permet Authorization');
    }

    // ─── TEST 18 : must_change mis à 0 après changement ───
    console.log('\n📋 Test 18 : must_change mis à 0 après changement');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Login avec must_change=1
        const loginReq = makeRequest({ action: 'login', username: 'wissal.hamza', password: env._testPasswords['wissal.hamza'] });
        const loginResp = await handler.fetch(loginReq, env, {});
        const loginData = await loginResp.json();
        assertEq(loginData.mustChangePassword, true, 'must_change=1 au login');
        const token = loginData.session;
        // Change password
        const changeReq = makeRequest({
            action: 'change-password',
            oldPassword: env._testPasswords['wissal.hamza'],
            newPassword: 'NewSecurePass!'
        }, 'POST', { 'Authorization': 'Bearer ' + token });
        await handler.fetch(changeReq, env, {});
        // Re-login
        const login2Req = makeRequest({ action: 'login', username: 'wissal.hamza', password: 'NewSecurePass!' });
        const login2Resp = await handler.fetch(login2Req, env, {});
        const login2Data = await login2Resp.json();
        assertEq(login2Data.mustChangePassword, false, 'must_change=0 après changement');
    }

    // ─── TEST 19 : /login sans AUTH_PEPPER → 503 ───
    console.log('\n📋 Test 19 : /login sans AUTH_PEPPER → 503');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        delete env.AUTH_PEPPER; // Supprimer le pepper
        const req = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: 'TestPassword123' });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 503, 'Statut 503 sans pepper');
        assert(data.erreur.includes('non configuré'), 'Message service non configuré');
    }

    // ─── TEST 20 : /change-password sans AUTH_PEPPER → 503 ───
    console.log('\n📋 Test 20 : /change-password sans AUTH_PEPPER → 503');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Login avec pepper
        const loginReq = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: env._testPasswords['amira.hamdaoui'] });
        const loginResp = await handler.fetch(loginReq, env, {});
        const loginData = await loginResp.json();
        const token = loginData.session;
        // Supprimer le pepper
        delete env.AUTH_PEPPER;
        const changeReq = makeRequest({
            action: 'change-password',
            oldPassword: 'TestPassword123',
            newPassword: 'NewPassword789!'
        }, 'POST', { 'Authorization': 'Bearer ' + token });
        const changeResp = await handler.fetch(changeReq, env, {});
        const changeData = await changeResp.json();
        assertEq(changeResp.status, 503, 'Statut 503 sans pepper');
    }

    // ─── TEST 21 : Verrouillage 30 minutes ───
    console.log('\n📋 Test 21 : Verrouillage 30 minutes (LOCKOUT_WINDOW_SECONDS = 1800)');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Simuler 15 échecs en insérant des tentatives récentes
        for (let i = 0; i < 15; i++) {
            db.loginAttempts.push({
                username: 'amira.hamdaoui',
                ip_hash: 'ip1',
                success: false,
                attempted_at: new Date().toISOString()
            });
        }
        // Tenter un login → doit être verrouillé
        const req = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: 'WrongPass' });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 429, 'Statut 429 (verrouillé)');
        assertEq(data.erreur, 'Compte temporairement verrouillé', 'Compte verrouillé');
        // Simuler une tentative il y a 31 minutes (hors fenêtre 30 min)
        db.loginAttempts = [];
        for (let i = 0; i < 15; i++) {
            db.loginAttempts.push({
                username: 'amira.hamdaoui',
                ip_hash: 'ip1',
                success: false,
                attempted_at: new Date(Date.now() - 31 * 60 * 1000).toISOString()
            });
        }
        // Tenter un login → ne devrait PAS être verrouillé (hors fenêtre)
        const req2 = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: 'WrongPass' });
        const resp2 = await handler.fetch(req2, env, {});
        assertEq(resp2.status, 401, 'Statut 401 (hors fenêtre 30 min, pas verrouillé)');
    }

    // ─── TEST 22 : Limite globale par IP (tous usernames) ───
    console.log('\n📋 Test 22 : Limite globale par IP (GLOBAL_IP_MAX_ATTEMPTS = 50)');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Le Worker calcule sha256(IP) — on doit utiliser le même hash
        const attackerIP = '10.0.0.99';
        const attackerIPHash = await sha256Hex(attackerIP);
        // Simuler 50 échecs depuis la même IP sur des usernames différents
        for (let i = 0; i < 50; i++) {
            db.loginAttempts.push({
                username: 'user_' + i,
                ip_hash: attackerIPHash,
                success: false,
                attempted_at: new Date().toISOString()
            });
        }
        // Tenter un login depuis la même IP
        const req = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: 'WrongPass' },
            'POST', { 'cf-connecting-ip': attackerIP });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 429, 'Statut 429 (IP bloquée globalement)');
    }

    // ─── TEST 23 : Changer de username ne contourne pas la limite IP ───
    console.log('\n📋 Test 23 : Changer de username ne contourne pas la limite IP');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const sharedIP = '192.168.1.50';
        const sharedIPHash = await sha256Hex(sharedIP);
        // 50 échecs sur 50 usernames différents (1 chacun, sous la limite de 15 par username)
        for (let i = 0; i < 50; i++) {
            db.loginAttempts.push({
                username: 'target_' + i,
                ip_hash: sharedIPHash,
                success: false,
                attempted_at: new Date().toISOString()
            });
        }
        // Tenter un login avec un nouveau username depuis la même IP
        const req = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: 'WrongPass' },
            'POST', { 'cf-connecting-ip': sharedIP });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 429, 'Statut 429 (limite IP globale atteinte malgré username différent)');
    }

    // =================================================================
    // TESTS ADMIN — Gestion des comptes par le concepteur
    // =================================================================
    console.log('\n' + '═'.repeat(60));
    console.log('🔐 TESTS ADMIN — Gestion des comptes');
    console.log('═'.repeat(60));

    // Helper : créer une session pour un utilisateur et retourner le token
    async function createSessionForUser(env, userId) {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        const tokenHash = await sha256Hex(token);
        const expiresAt = new Date(Date.now() + 14400000).toISOString();
        env.DB.sessions.set(tokenHash, { user_id: userId, expires_at: expiresAt });
        return token;
    }

    // ─── TEST A1 : concepteur → list users → autorisé ───
    console.log('\n📋 Test A1 : concepteur → admin-list-users');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-list-users' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assert(Array.isArray(data.users), 'users est un tableau');
        assert(data.users.length >= 3, 'Au moins 3 utilisateurs');
        // Vérifier qu'aucun password_hash n'est retourné
        let leakFound = false;
        for (const u of data.users) {
            if (u.password_hash) leakFound = true;
        }
        assert(!leakFound, 'Aucun password_hash dans la réponse');
    }

    // ─── TEST A2 : concepteur → reset étudiant → autorisé ───
    console.log('\n📋 Test A2 : concepteur → reset étudiant');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const oldHash = db.users.get('amira.hamdaoui').password_hash;
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'student_001' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assert(data.temporaryPassword && data.temporaryPassword.length === 16, 'Mot de passe temporaire (16 chars)');
        assertEq(data.userId, 'student_001', 'userId cible correct');
        // Vérifier que le hash a changé
        const newHash = db.users.get('amira.hamdaoui').password_hash;
        assert(newHash !== oldHash, 'Nouveau hash différent de l\'ancien');
        // Vérifier must_change=1
        assertEq(db.users.get('amira.hamdaoui').must_change, 1, 'must_change=1 après reset');
    }

    // ─── TEST A3 : concepteur → reset enseignant → autorisé ───
    console.log('\n📋 Test A3 : concepteur → reset autre enseignant');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Ajouter un autre enseignant non-concepteur
        db.addUser({
            id: 'teacher_002', username: 'autre.enseignant',
            password_hash: '100000:aa:bb', display_name: 'AUTRE ENSEIGNANT',
            role: 'teacher', concepteur: 0, actif: 1, must_change: 0
        });
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'teacher_002' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200 — reset enseignant autorisé');
        assert(!!data.temporaryPassword, 'Mot de passe temporaire retourné');
    }

    // ─── TEST A4 : concepteur → reset propre compte → 403 ───
    console.log('\n📋 Test A4 : concepteur → reset soi-même → 403');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'teacher_001' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 403, 'Statut 403 — reset de soi-même interdit');
    }

    // ─── TEST A5 : enseignant non-concepteur → reset → 403 ───
    console.log('\n📋 Test A5 : enseignant non-concepteur → reset → 403');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        db.addUser({
            id: 'teacher_003', username: 'non.concepteur',
            password_hash: '100000:aa:bb', display_name: 'NON CONCEPT',
            role: 'teacher', concepteur: 0, actif: 1, must_change: 0
        });
        const token = await createSessionForUser(env, 'teacher_003');
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'student_001' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 403, 'Statut 403 — non-concepteur refusé');
    }

    // ─── TEST A6 : étudiant → reset → 403 ───
    console.log('\n📋 Test A6 : étudiant → reset → 403');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'student_001');
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'student_002' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 403, 'Statut 403 — étudiant refusé');
    }

    // ─── TEST A7 : non authentifié → reset → 401 ───
    console.log('\n📋 Test A7 : non authentifié → reset → 401');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'student_001' });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 401, 'Statut 401 — non authentifié');
    }

    // ─── TEST A8 : cible inexistante → 404 ───
    console.log('\n📋 Test A8 : cible inexistante → 404');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'nonexistent_user' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 404, 'Statut 404 — utilisateur inexistant');
    }

    // ─── TEST A9 : sessions invalidées après reset ───
    console.log('\n📋 Test A9 : sessions invalidées après reset');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Créer une session pour l'étudiant cible
        const studentToken = await createSessionForUser(env, 'student_001');
        assert(db.sessions.size >= 1, 'Session étudiant créée');
        // Reset par le concepteur
        const concepteurToken = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'student_001' }, 'POST', { 'Authorization': 'Bearer ' + concepteurToken });
        await handler.fetch(req, env, {});
        // Vérifier que les sessions de l'étudiant sont supprimées
        let studentSessions = 0;
        for (const [k, v] of db.sessions) {
            if (v.user_id === 'student_001') studentSessions++;
        }
        assertEq(studentSessions, 0, 'Toutes les sessions étudiant invalidées');
    }

    // ─── TEST A10 : mot de passe temporaire absent de D1 en clair ───
    console.log('\n📋 Test A10 : password temporaire absent de D1');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'student_001' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        const tempPw = data.temporaryPassword;
        // Vérifier que le mot de passe en clair n'est nulle part dans la DB
        let foundInDB = false;
        for (const [k, u] of db.users) {
            if (u.password_hash === tempPw) foundInDB = true;
            if (u.password_hash.includes(tempPw)) foundInDB = true;
        }
        assert(!foundInDB, 'Mot de passe temporaire absent de D1 en clair');
        // Vérifier que le hash stocké est au format PBKDF2
        const storedHash = db.users.get('amira.hamdaoui').password_hash;
        assert(storedHash.startsWith('100000:'), 'Hash stocké au format PBKDF2');
    }

    // ─── TEST A11 : chaque reset produit un mot de passe différent ───
    console.log('\n📋 Test A11 : chaque reset → mot de passe différent');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const passwords = new Set();
        for (let i = 0; i < 5; i++) {
            const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'student_001' }, 'POST', { 'Authorization': 'Bearer ' + token });
            const resp = await handler.fetch(req, env, {});
            const data = await resp.json();
            passwords.add(data.temporaryPassword);
        }
        assertEq(passwords.size, 5, '5 mots de passe différents sur 5 resets');
    }

    // ─── TEST A12 : batch reset ───
    console.log('\n📋 Test A12 : batch reset');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: ['student_001', 'student_002'] }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assertEq(data.results.length, 2, '2 résultats');
        // Vérifier mots de passe différents
        assert(data.results[0].temporaryPassword !== data.results[1].temporaryPassword, 'Mots de passe différents');
        // Vérifier must_change=1 pour les deux
        assertEq(db.users.get('amira.hamdaoui').must_change, 1, 'must_change=1 pour student_001');
        assertEq(db.users.get('wissal.hamza').must_change, 1, 'must_change=1 pour student_002');
    }

    // ─── TEST A13 : batch exclut le propre compte du concepteur ───
    console.log('\n📋 Test A13 : batch exclut le propre compte');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: ['student_001', 'teacher_001'] }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assertEq(data.results.length, 1, '1 seul résultat (concepteur exclu)');
        assertEq(data.results[0].userId, 'student_001', 'Seul student_001 est réinitialisé');
    }

    // ─── TEST A14 : login avec mot de passe temporaire après reset ───
    console.log('\n📋 Test A14 : login avec temp password après reset');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const concepteurToken = await createSessionForUser(env, 'teacher_001');
        // Reset
        const resetReq = makeRequest({ action: 'admin-reset-password', targetUserId: 'student_001' }, 'POST', { 'Authorization': 'Bearer ' + concepteurToken });
        const resetResp = await handler.fetch(resetReq, env, {});
        const resetData = await resetResp.json();
        const tempPw = resetData.temporaryPassword;
        // Login avec le temp password
        const loginReq = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: tempPw });
        const loginResp = await handler.fetch(loginReq, env, {});
        const loginData = await loginResp.json();
        assertEq(loginResp.status, 200, 'Login avec temp password → 200');
        assertEq(loginData.mustChangePassword, true, 'must_change=1 après login avec temp password');
    }

    // ─── TEST A15 : ancien mot de passe ne fonctionne plus après reset ───
    console.log('\n📋 Test A15 : ancien password ne fonctionne plus');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const concepteurToken = await createSessionForUser(env, 'teacher_001');
        const oldPw = env._testPasswords['amira.hamdaoui'];
        // Reset
        const resetReq = makeRequest({ action: 'admin-reset-password', targetUserId: 'student_001' }, 'POST', { 'Authorization': 'Bearer ' + concepteurToken });
        await handler.fetch(resetReq, env, {});
        // Login avec l'ancien mot de passe
        const loginReq = makeRequest({ action: 'login', username: 'amira.hamdaoui', password: oldPw });
        const loginResp = await handler.fetch(loginReq, env, {});
        assertEq(loginResp.status, 401, 'Ancien password → 401');
    }

    // ─── TEST A16 : admin-list-users sans auth → 401 ───
    console.log('\n📋 Test A16 : admin-list-users sans auth → 401');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({ action: 'admin-list-users' });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 401, 'Statut 401 sans authentification');
    }

    // ─── TEST A17 : admin-reset-batch sans auth → 401 ───
    console.log('\n📋 Test A17 : admin-reset-batch sans auth → 401');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: ['student_001'] });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 401, 'Statut 401 sans authentification');
    }

    // ─── TEST A18 : batch tableau vide → 400 ───
    console.log('\n📋 Test A18 : batch tableau vide → 400');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: [] }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 400, 'Statut 400 pour tableau vide');
    }

    // ─── TEST A19 : batch avec IDs en doublon → dédupliqué côté Worker ───
    console.log('\n📋 Test A19 : batch avec doublons → dédupliqué');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: ['student_001', 'student_001'] }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        // Dédupliqué côté Worker → 1 seul résultat
        assertEq(data.results.length, 1, '1 résultat après déduplication');
        assertEq(data.results[0].userId, 'student_001', 'student_001 réinitialisé une fois');
    }

    // ─── TEST A20 : batch avec type incorrect → cible ignorée ───
    console.log('\n📋 Test A20 : batch avec ID non-string');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: [123, null, 'student_001'] }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        // Seuls les IDs valides et existants sont traités
        assertEq(data.results.length, 1, '1 seul résultat (IDs invalides ignorés)');
        assertEq(data.results[0].userId, 'student_001', 'Seul student_001 traité');
    }

    // ─── TEST A21 : batch trop grand (>50) → 400 ───
    console.log('\n📋 Test A21 : batch >50 → 400');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const bigArray = Array.from({ length: 51 }, (_, i) => 'user_' + i);
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: bigArray }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 400, 'Statut 400 pour >50 utilisateurs');
    }

    // ─── TEST A22 : batch avec cible inactive → ignorée ───
    console.log('\n📋 Test A22 : batch avec cible inactive');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: ['student_003', 'student_001'] }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assertEq(data.results.length, 1, '1 résultat (inactive ignorée)');
        assertEq(data.results[0].userId, 'student_001', 'Seul student_001 traité');
    }

    // ─── TEST A23 : batch avec cible inconnue → ignorée ───
    console.log('\n📋 Test A23 : batch avec cible inconnue');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: ['ghost_user', 'student_001'] }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assertEq(data.results.length, 1, '1 résultat (inconnu ignoré)');
    }

    // ─── TEST A24 : reset d\'un autre concepteur → autorisé ───
    console.log('\n📋 Test A24 : reset d\'un autre concepteur');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        db.addUser({
            id: 'teacher_004', username: 'autre.concepteur',
            password_hash: '100000:aa:bb', display_name: 'AUTRE CONCEPT',
            role: 'teacher', concepteur: 1, actif: 1, must_change: 0
        });
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'teacher_004' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Reset autre concepteur autorisé');
        assert(!!data.temporaryPassword, 'Mot de passe temporaire retourné');
    }

    // ─── TEST A25 : réponse reset ne contient pas de données sensibles ───
    console.log('\n📋 Test A25 : réponse reset sans données sensibles');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'student_001' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        const respStr = JSON.stringify(data);
        assert(!respStr.includes(env.AUTH_PEPPER), 'Pepper absent de la réponse');
        assert(!respStr.includes(db.users.get('amira.hamdaoui').password_hash), 'Hash absent de la réponse');
        assert(data.temporaryPassword && data.temporaryPassword.length === 16, 'TemporaryPassword présent (16 chars)');
    }

    // ─── TEST A26 : admin-list-users pour étudiant → 403 ───
    console.log('\n📋 Test A26 : étudiant → admin-list-users → 403');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'student_001');
        const req = makeRequest({ action: 'admin-list-users' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 403, 'Statut 403 pour étudiant');
    }

    // ─── TEST A27 : reset-password avec targetUserId manquant → 400 ───
    console.log('\n📋 Test A27 : reset sans targetUserId → 400');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-password' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 400, 'Statut 400 sans targetUserId');
    }

    // ─── TEST A28 : reset-password avec targetUserId numérique → 400 ───
    console.log('\n📋 Test A28 : reset avec targetUserId numérique → 400');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-password', targetUserId: 12345 }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 400, 'Statut 400 pour type numérique');
    }

    // ─── TEST A29 : batch avec non-array → 400 ───
    console.log('\n📋 Test A29 : batch avec non-array → 400');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: 'student_001' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 400, 'Statut 400 pour string au lieu d\'array');
    }

    // ─── TEST A30 : rate limiting — 20 resets puis blocage ───
    console.log('\n📋 Test A30 : rate limiting après 20 resets');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        // Ajouter 20 utilisateurs cibles
        for (let i = 1; i <= 20; i++) {
            db.addUser({
                id: 'target_' + i, username: 'target_' + i,
                password_hash: '100000:aa:bb', display_name: 'Target ' + i,
                role: 'student', concepteur: 0, actif: 1, must_change: 0
            });
        }
        // Effectuer 20 resets
        for (let i = 1; i <= 20; i++) {
            const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'target_' + i }, 'POST', { 'Authorization': 'Bearer ' + token });
            const resp = await handler.fetch(req, env, {});
            if (resp.status !== 200) {
                console.log('  ⚠️ Reset ' + i + ' a échoué avec statut ' + resp.status);
            }
        }
        // 21e reset doit être bloqué
        const req21 = makeRequest({ action: 'admin-reset-password', targetUserId: 'student_001' }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp21 = await handler.fetch(req21, env, {});
        assertEq(resp21.status, 429, 'Statut 429 après 20 resets');
    }

    // ─── TEST A31 : batch dépasse capacité → 429, aucun reset ───
    console.log('\n📋 Test A31 : batch de 10 avec 8 disponibles → 429, aucun reset');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        // Ajouter 10 cibles
        for (let i = 1; i <= 10; i++) {
            db.addUser({
                id: 'target_' + i, username: 'target_' + i,
                password_hash: '100000:aa:bb', display_name: 'Target ' + i,
                role: 'student', concepteur: 0, actif: 1, must_change: 0
            });
        }
        // Effectuer 12 resets pour occuper 12 des 20 places
        for (let i = 1; i <= 12; i++) {
            db.addUser({
                id: 'filler_' + i, username: 'filler_' + i,
                password_hash: '100000:aa:bb', display_name: 'Filler ' + i,
                role: 'student', concepteur: 0, actif: 1, must_change: 0
            });
            const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'filler_' + i }, 'POST', { 'Authorization': 'Bearer ' + token });
            await handler.fetch(req, env, {});
        }
        // Sauvegarder les hash avant le batch
        const hashBefore = db.users.get('target_1').password_hash;
        // Batch de 10 alors que seulement 8 places restantes → refusé
        const batchIds = Array.from({ length: 10 }, (_, i) => 'target_' + (i + 1));
        const reqBatch = makeRequest({ action: 'admin-reset-batch', targetUserIds: batchIds }, 'POST', { 'Authorization': 'Bearer ' + token });
        const respBatch = await handler.fetch(reqBatch, env, {});
        assertEq(respBatch.status, 429, 'Statut 429 capacité insuffisante');
        // Vérifier qu'AUCUN reset n'a été effectué
        const hashAfter = db.users.get('target_1').password_hash;
        assertEq(hashAfter, hashBefore, 'Aucun hash modifié (fail-before-write)');
    }

    // ─── TEST A32 : batch exactement égal à capacité restante → accepté ───
    console.log('\n📋 Test A32 : batch = capacité restante → accepté');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        // Ajouter 8 cibles
        for (let i = 1; i <= 8; i++) {
            db.addUser({
                id: 'cap_target_' + i, username: 'cap_target_' + i,
                password_hash: '100000:aa:bb', display_name: 'Cap Target ' + i,
                role: 'student', concepteur: 0, actif: 1, must_change: 0
            });
        }
        // Effectuer 12 resets pour occuper 12 places
        for (let i = 1; i <= 12; i++) {
            db.addUser({
                id: 'cap_filler_' + i, username: 'cap_filler_' + i,
                password_hash: '100000:aa:bb', display_name: 'Cap Filler ' + i,
                role: 'student', concepteur: 0, actif: 1, must_change: 0
            });
            const req = makeRequest({ action: 'admin-reset-password', targetUserId: 'cap_filler_' + i }, 'POST', { 'Authorization': 'Bearer ' + token });
            await handler.fetch(req, env, {});
        }
        // Batch de exactement 8 → accepté
        const batchIds = Array.from({ length: 8 }, (_, i) => 'cap_target_' + (i + 1));
        const reqBatch = makeRequest({ action: 'admin-reset-batch', targetUserIds: batchIds }, 'POST', { 'Authorization': 'Bearer ' + token });
        const respBatch = await handler.fetch(reqBatch, env, {});
        const dataBatch = await respBatch.json();
        assertEq(respBatch.status, 200, 'Statut 200 (capacité exacte)');
        assertEq(dataBatch.results.length, 8, '8 résultats');
    }

    // ─── TEST A33 : batch avec doublons → chaque compte une seule fois ───
    console.log('\n📋 Test A33 : batch avec doublons multiples → dédupliqué');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        // student_001 envoyé 3 fois, student_002 envoyé 2 fois
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: ['student_001', 'student_002', 'student_001', 'student_001', 'student_002'] }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assertEq(data.results.length, 2, '2 résultats après déduplication');
    }

    // ─── TEST A34 : batch contenant teacher_001 → ce compte reste inchangé ───
    console.log('\n📋 Test A34 : batch avec teacher_001 → exclu');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const hashBefore = db.users.get('kamel.chellouai').password_hash;
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: ['teacher_001', 'student_001'] }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assertEq(data.results.length, 1, '1 résultat (teacher_001 exclu)');
        assertEq(data.results[0].userId, 'student_001', 'Seul student_001 réinitialisé');
        const hashAfter = db.users.get('kamel.chellouai').password_hash;
        assertEq(hashAfter, hashBefore, 'Hash teacher_001 inchangé');
    }

    // ─── TEST A35 : batch avec inexistants/inactifs → aucun effet ───
    console.log('\n📋 Test A35 : batch avec inexistants/inactifs');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const token = await createSessionForUser(env, 'teacher_001');
        const req = makeRequest({ action: 'admin-reset-batch', targetUserIds: ['ghost_1', 'student_003', 'ghost_2', 'student_001'] }, 'POST', { 'Authorization': 'Bearer ' + token });
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        // ghost_1 inexistant, student_003 inactif, ghost_2 inexistant → seuls student_001 traité
        assertEq(data.results.length, 1, '1 résultat (inexistants/inactifs ignorés)');
        assertEq(data.results[0].userId, 'student_001', 'Seul student_001 traité');
    }

    // =================================================================
    // TESTS BOOTSTRAP — Mécanisme temporaire teacher_001
    // =================================================================
    console.log('\n' + '═'.repeat(60));
    console.log('🔑 TESTS BOOTSTRAP — Initialisation teacher_001');
    console.log('═'.repeat(60));

    // ─── TEST B1 : bootstrap cible correcte → 200 ───
    console.log('\n📋 Test B1 : bootstrap teacher_001 → 200');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const hashBefore = db.users.get('kamel.chellouai').password_hash;
        const req = makeRequest(
            { action: 'bootstrap-set-password', targetUserId: 'teacher_001' },
            'POST',
            { 'X-Bootstrap-Key': env.BOOTSTRAP_KEY }
        );
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assert(!!data.temporaryPassword, 'Mot de passe temporaire retourné');
        assertEq(data.temporaryPassword.length, 16, 'TemporaryPassword 16 chars');
        assertEq(data.userId, 'teacher_001', 'userId = teacher_001');
        // Vérifier que le hash a changé
        const hashAfter = db.users.get('kamel.chellouai').password_hash;
        assert(hashAfter !== hashBefore, 'Hash modifié');
        // Vérifier must_change=1
        assertEq(db.users.get('kamel.chellouai').must_change, 1, 'must_change=1');
    }

    // ─── TEST B2 : bootstrap cible différente → 403 ───
    console.log('\n📋 Test B2 : bootstrap cible différente → 403');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest(
            { action: 'bootstrap-set-password', targetUserId: 'student_001' },
            'POST',
            { 'X-Bootstrap-Key': env.BOOTSTRAP_KEY }
        );
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 403, 'Statut 403 cible non autorisée');
    }

    // ─── TEST B3 : bootstrap sans BOOTSTRAP_KEY → 403 ───
    console.log('\n📋 Test B3 : bootstrap sans clé → 403');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest(
            { action: 'bootstrap-set-password', targetUserId: 'teacher_001' },
            'POST',
            {}
        );
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 403, 'Statut 403 sans clé');
    }

    // ─── TEST B4 : bootstrap avec mauvaise clé → 403 ───
    console.log('\n📋 Test B4 : bootstrap mauvaise clé → 403');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest(
            { action: 'bootstrap-set-password', targetUserId: 'teacher_001' },
            'POST',
            { 'X-Bootstrap-Key': 'wrong-key' }
        );
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 403, 'Statut 403 mauvaise clé');
    }

    // ─── TEST B5 : bootstrap sans AUTH_PEPPER → 503 ───
    console.log('\n📋 Test B5 : bootstrap sans AUTH_PEPPER → 503');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        env.AUTH_PEPPER = undefined;
        const req = makeRequest(
            { action: 'bootstrap-set-password', targetUserId: 'teacher_001' },
            'POST',
            { 'X-Bootstrap-Key': env.BOOTSTRAP_KEY }
        );
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 503, 'Statut 503 sans pepper');
    }

    // ─── TEST B6 : bootstrap sans BOOTSTRAP_KEY configuré → 503 ───
    console.log('\n📋 Test B6 : bootstrap sans BOOTSTRAP_KEY env → 503');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        env.BOOTSTRAP_KEY = undefined;
        const req = makeRequest(
            { action: 'bootstrap-set-password', targetUserId: 'teacher_001' },
            'POST',
            { 'X-Bootstrap-Key': 'anything' }
        );
        const resp = await handler.fetch(req, env, {});
        assertEq(resp.status, 503, 'Statut 503 bootstrap non configuré');
    }

    // ─── TEST B7 : hash PBKDF2 valide après bootstrap ───
    console.log('\n📋 Test B7 : hash PBKDF2 valide après bootstrap');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest(
            { action: 'bootstrap-set-password', targetUserId: 'teacher_001' },
            'POST',
            { 'X-Bootstrap-Key': env.BOOTSTRAP_KEY }
        );
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        const newHash = db.users.get('kamel.chellouai').password_hash;
        const parts = newHash.split(':');
        assertEq(parts.length, 3, 'Hash au format iterations:salt:hash');
        assertEq(parts[0], '100000', '100000 itérations');
        assert(parts[1].length === 32, 'Salt 32 hex chars');
        assert(parts[2].length === 64, 'Hash 64 hex chars (256 bits)');
    }

    // ─── TEST B8 : sessions invalidées après bootstrap ───
    console.log('\n📋 Test B8 : sessions invalidées après bootstrap');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Créer une session pour teacher_001
        const token = await createSessionForUser(env, 'teacher_001');
        assert(db.sessions.size > 0, 'Session créée avant bootstrap');
        const req = makeRequest(
            { action: 'bootstrap-set-password', targetUserId: 'teacher_001' },
            'POST',
            { 'X-Bootstrap-Key': env.BOOTSTRAP_KEY }
        );
        await handler.fetch(req, env, {});
        // Vérifier que les sessions de teacher_001 sont supprimées
        let sessionsForTeacher = 0;
        for (const [k, v] of db.sessions) {
            if (v.user_id === 'teacher_001') sessionsForTeacher++;
        }
        assertEq(sessionsForTeacher, 0, 'Sessions teacher_001 invalidées');
    }

    // ─── TEST B9 : aucun plaintext password dans D1 ───
    console.log('\n📋 Test B9 : aucun plaintext dans D1');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest(
            { action: 'bootstrap-set-password', targetUserId: 'teacher_001' },
            'POST',
            { 'X-Bootstrap-Key': env.BOOTSTRAP_KEY }
        );
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        const storedHash = db.users.get('kamel.chellouai').password_hash;
        // Le mot de passe temporaire ne doit pas être stocké en clair
        assert(!storedHash.includes(data.temporaryPassword), 'Temp password absent du hash stocké');
        // Le hash doit être au format PBKDF2
        assert(storedHash.startsWith('100000:'), 'Format PBKDF2');
    }

    // ─── TEST B10 : aucun secret dans la réponse ───
    console.log('\n📋 Test B10 : réponse sans pepper ni hash');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        const req = makeRequest(
            { action: 'bootstrap-set-password', targetUserId: 'teacher_001' },
            'POST',
            { 'X-Bootstrap-Key': env.BOOTSTRAP_KEY }
        );
        const resp = await handler.fetch(req, env, {});
        const data = await resp.json();
        const respStr = JSON.stringify(data);
        assert(!respStr.includes(env.AUTH_PEPPER), 'Pepper absent de la réponse');
        assert(!respStr.includes(env.BOOTSTRAP_KEY), 'Bootstrap key absent de la réponse');
        assert(!respStr.includes(db.users.get('kamel.chellouai').password_hash), 'Hash absent de la réponse');
    }

    // ─── TEST B11 : login avec temp password après bootstrap ───
    console.log('\n📋 Test B11 : login avec temp password après bootstrap');
    {
        const db = new MockD1Database();
        const env = await makeMockEnv(db);
        // Bootstrap
        const reqBoot = makeRequest(
            { action: 'bootstrap-set-password', targetUserId: 'teacher_001' },
            'POST',
            { 'X-Bootstrap-Key': env.BOOTSTRAP_KEY }
        );
        const respBoot = await handler.fetch(reqBoot, env, {});
        const dataBoot = await respBoot.json();
        const tempPw = dataBoot.temporaryPassword;
        // Login avec le temp password
        const reqLogin = makeRequest(
            { action: 'login', username: 'kamel.chellouai', password: tempPw },
            'POST', {}
        );
        const respLogin = await handler.fetch(reqLogin, env, {});
        assertEq(respLogin.status, 200, 'Login avec temp password → 200');
        const dataLogin = await respLogin.json();
        assertEq(dataLogin.mustChangePassword, true, 'must_change=1 après login');
    }

    // ─── RÉSUMÉ ───
    console.log('\n' + '='.repeat(60));
    console.log('📊 Résultats : ' + pass + ' pass, ' + fail + ' échec(s)');
    console.log('='.repeat(60));

    if (fail > 0) process.exit(1);
}

runTests().catch(e => {
    console.error('FATAL:', e);
    process.exit(2);
});
