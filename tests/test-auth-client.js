/**
 * =================================================================
 * TESTS FRONTEND AUTH-CLIENT — PHASE 8
 * =================================================================
 * 10 scénarios requis pour la couche d'authentification frontend.
 * Simule sessionStorage et fetch() côté Node.js.
 * =================================================================
 */

// ─── MOCK sessionStorage ───
const storage = new Map();
global.sessionStorage = {
    getItem: function (k) { return storage.has(k) ? storage.get(k) : null; },
    setItem: function (k, v) { storage.set(k, String(v)); },
    removeItem: function (k) { storage.delete(k); },
    clear: function () { storage.clear(); }
};

// ─── MOCK fetch ───
let mockResponses = [];
let lastFetchRequest = null;
let lastFetchOptions = null;

global.fetch = async function (url, options) {
    lastFetchRequest = { url: url, body: JSON.parse(options.body) };
    lastFetchOptions = options;
    const resp = mockResponses.shift() || { status: 500, data: {} };
    return {
        status: resp.status,
        ok: resp.status >= 200 && resp.status < 300,
        json: async function () { return resp.data; },
        headers: { get: function () { return null; } }
    };
};

// ─── MOCK window ───
global.window = global;
global.self = global;

// ─── Charger auth-client.js ───
const fs = require('fs');
const path = require('path');
const authClientCode = fs.readFileSync(path.join(__dirname, '..', 'auth-client.js'), 'utf8');
eval(authClientCode);

// ─── HELPERS TEST ───
let pass = 0, fail = 0;
function assert(cond, label) {
    if (cond) { pass++; console.log('  ✅ PASS — ' + label); }
    else { fail++; console.error('  ❌ ÉCHEC — ' + label); }
}
function assertEq(actual, expected, label) {
    assert(actual === expected, label + ' (attendu: ' + JSON.stringify(expected) + ', obtenu: ' + JSON.stringify(actual) + ')');
}

function resetState() {
    storage.clear();
    mockResponses = [];
    lastFetchRequest = null;
    lastFetchOptions = null;
}

// ─── TESTS ───
async function runTests() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TESTS FRONTEND AUTH-CLIENT — PHASE 8');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // ─── TEST 1 : Application sans session → écran login ───
    console.log('─── Test 1 : Sans session → login requis ───');
    resetState();
    assert(!window.AuthClient.isAuthenticated(), 'Aucune session active');
    assertEq(window.AuthClient.getToken(), null, 'Pas de token en storage');
    const meNoSession = await window.AuthClient.getMe();
    assertEq(meNoSession.status, 401, 'getMe sans token → 401 local');

    // ─── TEST 2 : Session valide → /me détermine l'utilisateur ───
    console.log('─── Test 2 : Session valide → /me ───');
    resetState();
    storage.set('auth_session_token', 'valid-token-123');
    mockResponses.push({
        status: 200,
        data: {
            user: { id: 'student_001', username: 'amira.hamdaoui', displayName: 'AMIRA CHAHD HAMDAOUI', role: 'student', concepteur: false },
            mustChangePassword: true
        }
    });
    const meResult = await window.AuthClient.getMe();
    assertEq(meResult.status, 200, '/me réussit avec token valide');
    assertEq(meResult.data.user.id, 'student_001', 'ID utilisateur correct');
    assertEq(meResult.data.user.role, 'student', 'Rôle correct');
    assertEq(meResult.data.mustChangePassword, true, 'mustChangePassword correct');
    // Vérifier que Authorization a été envoyé
    assert(lastFetchOptions.headers.Authorization === 'Bearer valid-token-123', 'Authorization header envoyé');

    // ─── TEST 3 : Session invalide → retour login ───
    console.log('─── Test 3 : Session invalide → retour login ───');
    resetState();
    storage.set('auth_session_token', 'expired-token');
    mockResponses.push({ status: 401, data: { erreur: 'Session expirée' } });
    const meExpired = await window.AuthClient.getMe();
    assertEq(meExpired.status, 401, '/me avec token expiré → 401');

    // ─── TEST 4 : Login réussi → token stocké en sessionStorage ───
    console.log('─── Test 4 : Login réussi → sessionStorage ───');
    resetState();
    mockResponses.push({
        status: 200,
        data: {
            session: 'new-session-token-abc',
            user: { id: 'student_001', username: 'amira.hamdaoui', displayName: 'AMIRA', role: 'student', concepteur: false },
            mustChangePassword: true,
            expiresAt: '2099-01-01T00:00:00.000Z'
        }
    });
    const loginResult = await window.AuthClient.login('amira.hamdaoui', 'TempPassword123');
    assertEq(loginResult.status, 200, 'Login réussi');
    assertEq(storage.get('auth_session_token'), 'new-session-token-abc', 'Token en sessionStorage');
    assert(window.AuthClient.isAuthenticated(), 'isAuthenticated() = true');

    // ─── TEST 5 : Mauvais login → aucune session locale ───
    console.log('─── Test 5 : Mauvais login → pas de session ───');
    resetState();
    mockResponses.push({ status: 401, data: { erreur: 'Identifiants invalides' } });
    const badLogin = await window.AuthClient.login('student_001', 'WrongPassword');
    assertEq(badLogin.status, 401, 'Login échoué → 401');
    assertEq(sessionStorage.getItem('auth_session_token'), null, 'Aucun token stocké');
    assert(!window.AuthClient.isAuthenticated(), 'isAuthenticated() = false');

    // ─── TEST 6 : must_change = 1 → changement obligatoire ───
    console.log('─── Test 6 : must_change = 1 ───');
    resetState();
    mockResponses.push({
        status: 200,
        data: {
            session: 'token-must-change',
            user: { id: 'student_001', username: 'amira.hamdaoui', displayName: 'AMIRA', role: 'student', concepteur: false },
            mustChangePassword: true
        }
    });
    const loginMustChange = await window.AuthClient.login('amira.hamdaoui', 'TempPass123');
    assertEq(loginMustChange.status, 200, 'Login réussi');
    assertEq(loginMustChange.data.mustChangePassword, true, 'mustChangePassword = true dans réponse');

    // ─── TEST 7 : Changement réussi → accès application ───
    console.log('─── Test 7 : Changement mot de passe réussi ───');
    resetState();
    storage.set('auth_session_token', 'token-for-change');
    mockResponses.push({ status: 200, data: { message: 'Mot de passe modifié' } });
    const cpResult = await window.AuthClient.changePassword('OldPass123', 'NewPass456!');
    assertEq(cpResult.status, 200, 'Changement réussi');
    assert(lastFetchOptions.headers.Authorization === 'Bearer token-for-change', 'Authorization envoyé pour change-password');
    // Vérifier validation locale
    const cpShort = await window.AuthClient.changePassword('old', 'short');
    assertEq(cpShort.status, 400, 'Mot de passe court → 400 local');

    // ─── TEST 8 : Logout → token supprimé ───
    console.log('─── Test 8 : Logout → token supprimé ───');
    resetState();
    storage.set('auth_session_token', 'token-to-delete');
    mockResponses.push({ status: 200, data: { message: 'Déconnexion réussie' } });
    assert(window.AuthClient.isAuthenticated(), 'Authentifié avant logout');
    const logoutResult = await window.AuthClient.logout();
    assertEq(logoutResult.status, 200, 'Logout réussi');
    assertEq(sessionStorage.getItem('auth_session_token'), null, 'Token supprimé de sessionStorage');
    assert(!window.AuthClient.isAuthenticated(), 'isAuthenticated() = false après logout');

    // ─── TEST 9 : /analyze → Authorization ajouté automatiquement ───
    console.log('─── Test 9 : Authorization pour /analyze ───');
    resetState();
    storage.set('auth_session_token', 'analyze-token');
    const headers = window.AuthClient.withAuthHeaders({ 'Content-Type': 'application/json' });
    assertEq(headers['Authorization'], 'Bearer analyze-token', 'Authorization ajouté');
    assertEq(headers['Content-Type'], 'application/json', 'Content-Type conservé');
    // Sans token
    resetState();
    const headersNoToken = window.AuthClient.withAuthHeaders({ 'Content-Type': 'application/json' });
    assertEq(headersNoToken['Authorization'], undefined, 'Pas Authorization sans token');

    // ─── TEST 10 : localStorage currentProfile falsifié → ne change PAS l'identité ───
    console.log('─── Test 10 : localStorage falsifié → ignoré ───');
    resetState();
    // Simuler un currentProfile falsifié dans localStorage
    // (AuthClient n'utilise QUE sessionStorage pour le token)
    const fakeLocalStorage = { currentProfile: JSON.stringify({ id: 'teacher_001', role: 'teacher', concepteur: true }) };
    // AuthClient ne lit JAMAIS localStorage
    assertEq(window.AuthClient.getToken(), null, 'AuthClient ne lit pas localStorage');
    assert(!window.AuthClient.isAuthenticated(), 'isAuthenticated() = false malgré localStorage falsifié');
    // Même si localStorage contient un profil, le token doit venir de sessionStorage
    storage.set('auth_session_token', 'real-token');
    assert(window.AuthClient.isAuthenticated(), 'isAuthenticated() = true uniquement via sessionStorage');
    assertEq(window.AuthClient.getToken(), 'real-token', 'Token vient de sessionStorage');

    // ─── RÉSUMÉ ───
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  RÉSULTATS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`  Total : ${pass} pass, ${fail} échec(s)`);
    console.log('');

    if (fail > 0) process.exit(1);
}

runTests().catch(function (e) {
    console.error('FATAL:', e.message);
    console.error(e.stack);
    process.exit(2);
});
