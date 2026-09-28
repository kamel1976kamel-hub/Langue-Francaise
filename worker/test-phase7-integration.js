/**
 * =================================================================
 * PHASE 7 — TEST D'INTÉGRATION AUTHENTIFICATION AVEC D1 RÉEL
 * =================================================================
 * Teste le parcours complet login → /me → /analyze → logout
 * contre la base D1 réelle, sans déployer le Worker.
 *
 * Utilise Node.js crypto (PBKDF2) — vérifié compatible Web Crypto.
 * Utilise wrangler CLI pour les requêtes D1.
 * =================================================================
 */

const crypto = require('crypto');
const { execSync } = require('child_process');

// =================================================================
// CONFIGURATION
// =================================================================
const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const SESSION_TOKEN_BYTES = 32;
const SESSION_EXPIRY_SECONDS = 4 * 60 * 60;
const TEST_PEPPER = 'phase7-integration-test-pepper-' + crypto.randomBytes(8).toString('hex');
const TEST_USER_ID = 'test_phase7_' + crypto.randomBytes(4).toString('hex');
const TEST_USERNAME = 'testuser_phase7';
const TEST_PASSWORD = 'TestPassword-Phase7-' + crypto.randomBytes(6).toString('hex');
const TEST_DISPLAY_NAME = 'Test Phase 7';

let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, name, detail) {
    if (condition) {
        passCount++;
        results.push(`  ✅ ${name}`);
    } else {
        failCount++;
        results.push(`  ❌ ${name} — ${detail || 'échec'}`);
    }
}

// =================================================================
// WRANGLER D1 HELPERS
// =================================================================
function d1Execute(sql) {
    const cmd = `npx wrangler d1 execute langue-francaise-auth --command="${sql.replace(/"/g, '\\"')}" --remote --json`;
    try {
        const output = execSync(cmd, { encoding: 'utf8', timeout: 30000, cwd: __dirname + '/..' });
        const parsed = JSON.parse(output.trim());
        return parsed[0] || parsed;
    } catch (e) {
        return { error: e.message, results: [] };
    }
}

function d1Query(sql) {
    const result = d1Execute(sql);
    return result.results || [];
}

function d1QueryOne(sql) {
    const rows = d1Query(sql);
    return rows.length > 0 ? rows[0] : null;
}

// =================================================================
// PBKDF2 (Node.js — compatible Web Crypto du Worker)
// =================================================================
function hashPassword(password, pepper) {
    const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
    const hash = crypto.pbkdf2Sync(
        password + pepper, salt, PBKDF2_ITERATIONS, 32, 'sha256'
    ).toString('hex');
    return `${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

function verifyPassword(password, pepper, storedHash) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const iterations = parseInt(parts[0], 10);
    const salt = parts[1];
    const expectedHash = parts[2];
    const computed = crypto.pbkdf2Sync(
        password + pepper, salt, iterations, 32, 'sha256'
    ).toString('hex');
    // Constant-time comparison
    if (computed.length !== expectedHash.length) return false;
    let result = 0;
    for (let i = 0; i < computed.length; i++) {
        result |= computed.charCodeAt(i) ^ expectedHash.charCodeAt(i);
    }
    return result === 0;
}

function generateSessionToken() {
    return crypto.randomBytes(SESSION_TOKEN_BYTES).toString('hex');
}

function sha256Hex(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// =================================================================
// SIMULATION DES HANDLERS DU WORKER
// =================================================================

// Simule handleLogin
async function simulateLogin(username, password) {
    // 1. Lookup utilisateur (comme le Worker)
    const user = d1QueryOne(
        `SELECT id, username, password_hash, display_name, role, concepteur, actif, must_change FROM users WHERE username = '${username.toLowerCase().trim()}'`
    );
    if (!user) {
        return { status: 401, body: { erreur: 'Identifiants invalides' } };
    }
    // 2. Vérifier mot de passe
    const valid = verifyPassword(password, TEST_PEPPER, user.password_hash);
    if (!valid) {
        return { status: 401, body: { erreur: 'Identifiants invalides' } };
    }
    // 3. Vérifier actif
    if (!user.actif) {
        return { status: 403, body: { erreur: 'Compte désactivé' } };
    }
    // 4. Créer session
    const sessionToken = generateSessionToken();
    const tokenHash = sha256Hex(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_SECONDS * 1000).toISOString();
    d1Execute(
        `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ('${tokenHash}', '${user.id}', '${expiresAt}')`
    );
    return {
        status: 200,
        body: {
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
        }
    };
}

// Simule requireSession + handleMe
async function simulateMe(token) {
    if (!token) {
        return { status: 401, body: { erreur: 'Authentification requise' } };
    }
    const tokenHash = sha256Hex(token);
    const session = d1QueryOne(
        `SELECT user_id, expires_at FROM sessions WHERE token_hash = '${tokenHash}'`
    );
    if (!session) {
        return { status: 401, body: { erreur: 'Session expirée' } };
    }
    if (new Date(session.expires_at) < new Date()) {
        d1Execute(`DELETE FROM sessions WHERE token_hash = '${tokenHash}'`);
        return { status: 401, body: { erreur: 'Session expirée' } };
    }
    const user = d1QueryOne(
        `SELECT id, username, display_name, role, concepteur, actif, must_change FROM users WHERE id = '${session.user_id}'`
    );
    if (!user) {
        return { status: 404, body: { erreur: 'Utilisateur introuvable' } };
    }
    if (!user.actif) {
        return { status: 403, body: { erreur: 'Compte désactivé' } };
    }
    return {
        status: 200,
        body: {
            user: {
                id: user.id,
                username: user.username,
                displayName: user.display_name,
                role: user.role,
                concepteur: !!user.concepteur
            },
            mustChangePassword: !!user.must_change
        }
    };
}

// Simule requireSession pour /analyze
async function simulateAnalyzeAuth(token) {
    if (!token) {
        return { status: 401, body: { erreur: 'Authentification requise', source: 'auth_required' } };
    }
    const tokenHash = sha256Hex(token);
    const session = d1QueryOne(
        `SELECT user_id, expires_at FROM sessions WHERE token_hash = '${tokenHash}'`
    );
    if (!session) {
        return { status: 401, body: { erreur: 'Session expirée' } };
    }
    if (new Date(session.expires_at) < new Date()) {
        d1Execute(`DELETE FROM sessions WHERE token_hash = '${tokenHash}'`);
        return { status: 401, body: { erreur: 'Session expirée' } };
    }
    // Session valide → le pipeline IA serait exécuté
    return { status: 200, body: { source: 'remote_a22b', authenticated: true } };
}

// Simule handleLogout
async function simulateLogout(token) {
    if (token) {
        const tokenHash = sha256Hex(token);
        d1Execute(`DELETE FROM sessions WHERE token_hash = '${tokenHash}'`);
    }
    return { status: 200, body: { message: 'Déconnexion réussie' } };
}

// =================================================================
// TEST PRINCIPAL
// =================================================================
async function runTests() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  PHASE 7 — TEST D\'INTÉGRATION AUTHENTIFICATION D1');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // ─── 0. VÉRIFIER D1 AVANT TOUT ───
    console.log('─── 0. Vérification D1 avant test ───');
    const preUsers = d1QueryOne('SELECT COUNT(*) as count FROM users');
    assert(preUsers && preUsers.count === 40, `D1 users = 40 (actuel: ${preUsers ? preUsers.count : 'N/A'})`);

    // ─── 1. CRÉER UTILISATEUR DE TEST ───
    console.log('─── 1. Création utilisateur de test ───');
    const testHash = hashPassword(TEST_PASSWORD, TEST_PEPPER);
    const insertResult = d1Execute(
        `INSERT INTO users (id, username, password_hash, display_name, role, concepteur, actif, must_change) VALUES ('${TEST_USER_ID}', '${TEST_USERNAME}', '${testHash}', '${TEST_DISPLAY_NAME}', 'student', 0, 1, 1)`
    );
    assert(insertResult.success !== false, 'Utilisateur de test inséré dans D1');

    // Vérifier insertion
    const testUser = d1QueryOne(`SELECT id, username, role FROM users WHERE id = '${TEST_USER_ID}'`);
    assert(testUser && testUser.id === TEST_USER_ID, 'Utilisateur de test présent dans D1');

    // ─── 2. TEST LOGIN ───
    console.log('─── 2. Test POST /login ───');
    const loginResult = await simulateLogin(TEST_USERNAME, TEST_PASSWORD);
    assert(loginResult.status === 200, `Login réussi (status ${loginResult.status})`);
    assert(loginResult.body.session && loginResult.body.session.length > 0, 'Token de session retourné');
    assert(loginResult.body.user && loginResult.body.user.id === TEST_USER_ID, 'User ID correct dans réponse login');
    assert(loginResult.body.user && loginResult.body.user.username === TEST_USERNAME, 'Username correct dans réponse login');
    assert(loginResult.body.user && loginResult.body.user.role === 'student', 'Rôle correct dans réponse login');
    assert(loginResult.body.mustChangePassword === true, 'mustChangePassword = true');

    const sessionToken = loginResult.body.session;

    // Vérifier session en D1
    const tokenHash = sha256Hex(sessionToken);
    const sessionRow = d1QueryOne(`SELECT user_id, expires_at FROM sessions WHERE token_hash = '${tokenHash}'`);
    assert(sessionRow && sessionRow.user_id === TEST_USER_ID, 'Session créée en D1');
    assert(sessionRow && new Date(sessionRow.expires_at) > new Date(), 'Session non expirée');

    // ─── 3. TEST /me ───
    console.log('─── 3. Test GET /me ───');
    const meResult = await simulateMe(sessionToken);
    assert(meResult.status === 200, `/me réussi (status ${meResult.status})`);
    assert(meResult.body.user.id === TEST_USER_ID, '/me — ID correct');
    assert(meResult.body.user.username === TEST_USERNAME, '/me — username correct');
    assert(meResult.body.user.displayName === TEST_DISPLAY_NAME, '/me — display_name correct');
    assert(meResult.body.user.role === 'student', '/me — rôle correct');
    assert(meResult.body.user.concepteur === false, '/me — concepteur correct (false)');
    assert(meResult.body.mustChangePassword === true, '/me — mustChangePassword = true');

    // ─── 4. TEST /analyze authentifié ───
    console.log('─── 4. Test POST /analyze authentifié ───');
    const analyzeResult = await simulateAnalyzeAuth(sessionToken);
    assert(analyzeResult.status === 200, `/analyze authentifié (status ${analyzeResult.status})`);
    assert(analyzeResult.body.authenticated === true, '/analyze — authentification validée');

    // ─── 5. TEST /logout ───
    console.log('─── 5. Test POST /logout ───');
    const logoutResult = await simulateLogout(sessionToken);
    assert(logoutResult.status === 200, `Logout réussi (status ${logoutResult.status})`);

    // Vérifier session supprimée
    const sessionAfterLogout = d1QueryOne(`SELECT user_id FROM sessions WHERE token_hash = '${tokenHash}'`);
    assert(!sessionAfterLogout, 'Session supprimée de D1 après logout');

    // ─── 6. TEST TOKEN INVALIDE APRÈS LOGOUT ───
    console.log('─── 6. Test token invalide après logout ───');
    const meAfterLogout = await simulateMe(sessionToken);
    assert(meAfterLogout.status === 401, `/me après logout → 401 (status ${meAfterLogout.status})`);

    // ─── 7. TESTS SÉCURITÉ ───
    console.log('─── 7. Tests sécurité ───');

    // /me sans token
    const meNoAuth = await simulateMe(null);
    assert(meNoAuth.status === 401, `/me sans token → 401 (status ${meNoAuth.status})`);

    // /analyze sans token
    const analyzeNoAuth = await simulateAnalyzeAuth(null);
    assert(analyzeNoAuth.status === 401, `/analyze sans token → 401 (status ${analyzeNoAuth.status})`);

    // Token aléatoire
    const randomToken = crypto.randomBytes(32).toString('hex');
    const meRandomToken = await simulateMe(randomToken);
    assert(meRandomToken.status === 401, `/me token aléatoire → 401 (status ${meRandomToken.status})`);

    // Mauvais mot de passe
    const loginBadPassword = await simulateLogin(TEST_USERNAME, 'WrongPassword123!');
    assert(loginBadPassword.status === 401, `Mauvais mot de passe → 401 (status ${loginBadPassword.status})`);
    assert(loginBadPassword.body.erreur === 'Identifiants invalides', 'Message générique (ne révèle pas l\'erreur)');

    // Username inexistant
    const loginNonExistent = await simulateLogin('nonexistent_user_xyz', 'SomePassword123!');
    assert(loginNonExistent.status === 401, `Username inexistant → 401 (status ${loginNonExistent.status})`);
    assert(loginNonExistent.body.erreur === 'Identifiants invalides', 'Message identique (ne révèle pas si compte existe)');

    // ─── 8. NETTOYAGE UTILISATEUR DE TEST ───
    console.log('─── 8. Nettoyage ───');
    // Supprimer sessions restantes du test
    d1Execute(`DELETE FROM sessions WHERE user_id = '${TEST_USER_ID}'`);
    // Supprimer login attempts du test
    d1Execute(`DELETE FROM login_attempts WHERE username = '${TEST_USERNAME}'`);
    // Supprimer utilisateur de test
    const deleteResult = d1Execute(`DELETE FROM users WHERE id = '${TEST_USER_ID}'`);
    assert(deleteResult.success !== false, 'Utilisateur de test supprimé de D1');

    // Vérifier suppression
    const testUserAfter = d1QueryOne(`SELECT id FROM users WHERE id = '${TEST_USER_ID}'`);
    assert(!testUserAfter, 'Utilisateur de test absent de D1 après nettoyage');

    // ─── 9. VÉRIFICATION D1 APRÈS TESTS ───
    console.log('─── 9. Vérification D1 après tests ───');
    const postUsers = d1QueryOne('SELECT COUNT(*) as count FROM users');
    assert(postUsers && postUsers.count === 40, `D1 users = 40 après test (actuel: ${postUsers ? postUsers.count : 'N/A'})`);

    const postSessions = d1QueryOne('SELECT COUNT(*) as count FROM sessions');
    assert(postSessions && postSessions.count === 0, `D1 sessions = 0 (actuel: ${postSessions ? postSessions.count : 'N/A'})`);

    const postAttempts = d1QueryOne('SELECT COUNT(*) as count FROM login_attempts');
    // Les tentatives du test ont été nettoyées, mais il peut y en avoir d'autres
    // On vérifie surtout qu'il n'y a pas d'attempts pour notre user de test
    const testAttempts = d1QueryOne(`SELECT COUNT(*) as count FROM login_attempts WHERE username = '${TEST_USERNAME}'`);
    assert(testAttempts && testAttempts.count === 0, `Login attempts test nettoyés (actuel: ${testAttempts ? testAttempts.count : 'N/A'})`);

    // Vérifier rôles inchangés
    const postStudents = d1QueryOne("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const postTeachers = d1QueryOne("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'");
    const postConcepteurs = d1QueryOne("SELECT COUNT(*) as count FROM users WHERE concepteur = 1");
    assert(postStudents && postStudents.count === 37, `37 students (actuel: ${postStudents ? postStudents.count : 'N/A'})`);
    assert(postTeachers && postTeachers.count === 3, `3 teachers (actuel: ${postTeachers ? postTeachers.count : 'N/A'})`);
    assert(postConcepteurs && postConcepteurs.count === 1, `1 concepteur (actuel: ${postConcepteurs ? postConcepteurs.count : 'N/A'})`);

    // ─── 10. VÉRIFIER must_change ───
    console.log('─── 10. Vérification must_change ───');
    const mustChangeCount = d1QueryOne("SELECT COUNT(*) as count FROM users WHERE must_change = 1");
    assert(mustChangeCount && mustChangeCount.count === 40, `40 must_change = 1 (actuel: ${mustChangeCount ? mustChangeCount.count : 'N/A'})`);

    // ─── 11. VÉRIFIER CANNONICAL HASH FORMAT ───
    console.log('─── 11. Vérification format hash ───');
    const badFormat = d1QueryOne("SELECT COUNT(*) as count FROM users WHERE password_hash NOT LIKE '100000:%' OR LENGTH(password_hash) != 104");
    assert(badFormat && badFormat.count === 0, `0 hash au format incorrect (actuel: ${badFormat ? badFormat.count : 'N/A'})`);

    // ─── RÉSULTATS ───
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  RÉSULTATS');
    console.log('═══════════════════════════════════════════════════════════');
    for (const r of results) {
        console.log(r);
    }
    console.log('');
    console.log(`  Total : ${passCount} pass, ${failCount} échec(s)`);
    console.log('');

    if (failCount > 0) {
        process.exit(1);
    }
}

runTests().catch(e => {
    console.error('FATAL:', e.message);
    console.error(e.stack);
    process.exit(2);
});
