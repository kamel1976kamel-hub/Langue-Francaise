/**
 * =================================================================
 * TESTS — MIGRATION OVERWRITE PROTECTION
 * =================================================================
 * Vérifie que la stratégie fail-closed fonctionne correctement :
 * - INSERT INTO (sans OR REPLACE)
 * - Détection des conflits d'ID
 * - Détection des conflits de username
 * - Aucun écrasement automatique
 * - must_change = 1, actif = 1 pour tous les comptes
 * - PBKDF2 compatible avec le Worker
 * =================================================================
 */

const {
    extractUsers,
    verifyUsers,
    generateSQL,
    prepareInsertData,
    hashPassword,
    generateTempPassword,
    PBKDF2_ITERATIONS,
    SALT_BYTES,
    TEMP_PASSWORD_BYTES
} = require('./migrate-users.js');

const crypto = require('crypto');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log(`  ✅ PASS — ${message}`);
    } else {
        failed++;
        console.log(`  ❌ FAIL — ${message}`);
    }
}

// =================================================================
// TEST 1 : SQL utilise INSERT INTO (pas INSERT OR REPLACE)
// =================================================================
console.log('');
console.log('─── Test 1 : SQL fail-closed ─────────────────────────');

const mockRecords = [
    { id: 'test_001', username: 'test.user', password_hash: 'hash1', display_name: 'Test User', role: 'student', concepteur: 0, actif: 1, must_change: 1 },
    { id: 'test_002', username: 'test.two', password_hash: 'hash2', display_name: 'Test Two', role: 'teacher', concepteur: 1, actif: 1, must_change: 1 }
];

const sql = generateSQL(mockRecords);
assert(!sql.includes('INSERT OR REPLACE'), 'SQL ne contient pas INSERT OR REPLACE');
assert(sql.includes('INSERT INTO users'), 'SQL utilise INSERT INTO');
assert(sql.includes('fail-closed'), 'SQL contient le commentaire fail-closed');
assert(sql.includes('aucun overwrite'), 'SQL mentionne aucun overwrite');

// Vérifier que chaque ligne INSERT est correcte
const insertLines = sql.split('\n').filter(l => l.startsWith('INSERT'));
assert(insertLines.length === 2, `2 lignes INSERT générées (obtenu: ${insertLines.length})`);
assert(insertLines[0].includes("'test_001'"), 'Premier INSERT contient test_001');
assert(insertLines[1].includes("'test_002'"), 'Deuxième INSERT contient test_002');

// =================================================================
// TEST 2 : Extraction des 40 utilisateurs
// =================================================================
console.log('');
console.log('─── Test 2 : Extraction source ───────────────────────');

const users = extractUsers();
assert(users.length === 40, `40 utilisateurs extraits (obtenu: ${users.length})`);

const teachers = users.filter(u => u.role === 'teacher');
const students = users.filter(u => u.role === 'student');
assert(teachers.length === 3, `3 enseignants (obtenu: ${teachers.length})`);
assert(students.length === 37, `37 étudiants (obtenu: ${students.length})`);

const concepteurs = users.filter(u => u.concepteur);
assert(concepteurs.length === 1, `1 concepteur (obtenu: ${concepteurs.length})`);
assert(concepteurs[0].id === 'teacher_001', 'teacher_001 est le seul concepteur');

const t2 = users.find(u => u.id === 'teacher_002');
const t3 = users.find(u => u.id === 'teacher_003');
assert(t2 && !t2.concepteur, 'teacher_002 non concepteur');
assert(t3 && !t3.concepteur, 'teacher_003 non concepteur');

// IDs uniques
const ids = users.map(u => u.id);
const uniqueIds = new Set(ids);
assert(uniqueIds.size === 40, `40 IDs uniques (obtenu: ${uniqueIds.size})`);

// Usernames uniques
const usernames = users.map(u => u.username);
const uniqueUsernames = new Set(usernames);
assert(uniqueUsernames.size === 40, `40 usernames uniques (obtenu: ${uniqueUsernames.size})`);

// Vérifications
const errors = verifyUsers(users);
assert(errors.length === 0, `Aucune erreur de vérification (obtenu: ${errors.length})`);

// =================================================================
// TEST 3 : Préparation des données — must_change et actif
// =================================================================
console.log('');
console.log('─── Test 3 : must_change et actif ────────────────────');

async function testPreparation() {
    const pepper = 'test-pepper-for-migration-tests';
    const { records, tempPasswords } = await prepareInsertData(users, pepper);

    assert(records.length === 40, `40 enregistrements préparés (obtenu: ${records.length})`);

    // Tous doivent avoir must_change = 1
    const allMustChange = records.every(r => r.must_change === 1);
    assert(allMustChange, 'Tous les comptes ont must_change = 1');

    // Tous doivent avoir actif = 1
    const allActif = records.every(r => r.actif === 1);
    assert(allActif, 'Tous les comptes ont actif = 1');

    // Tous doivent avoir un hash PBKDF2
    const allHashed = records.every(r => {
        const parts = r.password_hash.split(':');
        return parts.length === 3 && parseInt(parts[0], 10) === PBKDF2_ITERATIONS;
    });
    assert(allHashed, 'Tous les mots de passe sont hashés PBKDF2');

    // Tous doivent avoir un salt unique
    const salts = records.map(r => r.password_hash.split(':')[1]);
    const uniqueSalts = new Set(salts);
    assert(uniqueSalts.size === 40, `40 salts uniques (obtenu: ${uniqueSalts.size})`);

    // Tous doivent avoir un mot de passe temporaire
    assert(tempPasswords.size === 40, `40 mots de passe temporaires (obtenu: ${tempPasswords.size})`);

    // Mots de passe temporaires = 16 chars base64url
    for (const [id, data] of tempPasswords) {
        assert(data.tempPassword.length === 16, `Password length 16 for ${id}`);
    }

    // =================================================================
    // TEST 4 : PBKDF2 compatible avec le Worker
    // =================================================================
    console.log('');
    console.log('─── Test 4 : PBKDF2 compatible Worker ────────────');

    const testPassword = 'test-password-123';
    const testPepper = 'test-pepper-value';
    const hash = await hashPassword(testPassword, testPepper);
    const parts = hash.split(':');

    assert(parts.length === 3, `Format iterations:salt:hash (obtenu: ${parts.length} parties)`);
    assert(parts[0] === '100000', `100000 itérations (obtenu: ${parts[0]})`);
    assert(parts[1].length === 32, `Salt 32 chars hex (obtenu: ${parts[1].length})`);
    assert(parts[2].length === 64, `Hash 64 chars hex (obtenu: ${parts[2].length})`);

    // Vérifier que le hash est reproductible avec les mêmes paramètres
    const salt = parts[1];
    const expectedHash = crypto.pbkdf2Sync(
        testPassword + testPepper, salt, 100000, 32, 'sha256'
    ).toString('hex');
    assert(parts[2] === expectedHash, 'Hash PBKDF2 reproductible (Node.js crypto)');

    // =================================================================
    // TEST 5 : Mots de passe temporaires cryptographiques
    // =================================================================
    console.log('');
    console.log('─── Test 5 : Passwords cryptographiques ──────────');

    const passwords = new Set();
    for (let i = 0; i < 100; i++) {
        passwords.add(generateTempPassword());
    }
    assert(passwords.size === 100, `100 mots de passe uniques sur 100 générations (obtenu: ${passwords.size})`);

    // Vérifier qu'aucun ne contient de prénom/nom/date
    const namePattern = /^(kamel|amira|wissal|ahmed|sara|fatima|teacher|student)/i;
    let nameCount = 0;
    for (const p of passwords) {
        if (namePattern.test(p)) nameCount++;
    }
    assert(nameCount === 0, 'Aucun mot de passe ne contient de prénom/nom');

    // =================================================================
    // TEST 6 : SQL fail-closed — aucun OR REPLACE
    // =================================================================
    console.log('');
    console.log('─── Test 6 : Aucun overwrite dans le SQL ─────────');

    const fullSQL = generateSQL(records);
    assert(!fullSQL.includes('OR REPLACE'), 'SQL final ne contient aucun OR REPLACE');
    assert(!fullSQL.includes('UPDATE'), 'SQL final ne contient aucun UPDATE');
    assert(!fullSQL.includes('DELETE'), 'SQL final ne contient aucun DELETE');

    const insertCount = (fullSQL.match(/^INSERT INTO/gm) || []).length;
    assert(insertCount === 40, `40 INSERT INTO dans le SQL final (obtenu: ${insertCount})`);

    // =================================================================
    // TEST 7 : Sécurité — aucun secret dans les exports
    // =================================================================
    console.log('');
    console.log('─── Test 7 : Sécurité ────────────────────────────');

    // Le SQL ne contient pas le pepper
    assert(!fullSQL.includes(testPepper), 'Le pepper n\'apparaît pas dans le SQL');

    // Le SQL ne contient pas les mots de passe temporaires
    for (const [id, data] of tempPasswords) {
        assert(!fullSQL.includes(data.tempPassword), `Mot de passe ${id} absent du SQL`);
    }

    // =================================================================
    // TEST 8 : Conflits — simulation
    // =================================================================
    console.log('');
    console.log('─── Test 8 : Détection de conflits ───────────────');

    // Simuler un conflit : si un ID existe déjà, le SQL INSERT INTO échouerait
    // On vérifie que le SQL ne contient aucune protection contre les conflits
    // (c'est la contrainte SQL elle-même qui protège)
    const conflictSQL = generateSQL([mockRecords[0]]);
    assert(conflictSQL.includes('INSERT INTO users'), 'INSERT INTO sans protection overwrite');
    assert(!conflictSQL.includes('IF NOT EXISTS'), 'Pas de IF NOT EXISTS — échoue sur conflit');
    assert(!conflictSQL.includes('OR IGNORE'), 'Pas de OR IGNORE — échoue sur conflit');

    // =================================================================
    // RAPPORT FINAL
    // =================================================================
    console.log('');
    console.log('============================================================');
    console.log(`📊 Résultats : ${passed} pass, ${failed} échec(s)`);
    console.log('============================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

testPreparation().catch(e => {
    console.error('FATAL:', e.message);
    process.exit(2);
});
