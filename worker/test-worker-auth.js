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
                    for (const u of self.users.values()) {
                        if (u.id === params[0]) return { ...u };
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
                    for (const a of self.loginAttempts) {
                        if (a.ip_hash === params[0] && !a.success && a.attempted_at > cutoff) count++;
                    }
                    return { count };
                }
                return null;
            },
            all: async function() {
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
                    const [username, ip_hash, success] = params;
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
                    for (const [k, u] of self.users) {
                        if (u.id === userId) {
                            u.password_hash = newHash;
                            u.must_change = 0;
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
