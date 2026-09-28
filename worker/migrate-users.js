/**
 * =================================================================
 * MIGRATION DES 40 COMPTES — D1 AUTHENTIFICATION
 * =================================================================
 * Script ponctuel d'administration.
 * - NE modifie aucun fichier applicatif.
 * - NE writeTo Git aucun mot de passe.
 * - NE déploie PAS en production sans validation manuelle.
 *
 * Usage :
 *   node migrate-users.js --preview        Aperçu sans insertion
 *   node migrate-users.js --insert         Insertion réelle (D1 requis)
 *   node migrate-users.js --export-temp    Exporte les mots de passe temporaires
 *                                          (stdout uniquement, pas de fichier)
 *
 * Variable d'environnement requise :
 *   AUTH_PEPPER   — Pepper pour le hash PBKDF2 (identique au Worker)
 * =================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =================================================================
// CONFIGURATION
// =================================================================
const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const TEMP_PASSWORD_BYTES = 12; // 96 bits → 16 chars base64url

// =================================================================
// EXTRACTION DES 40 UTILISATEURS DEPUIS student-profile-unified.js
// =================================================================
function extractUsers() {
    const srcPath = path.join(__dirname, '..', 'memory', 'student-profile-unified.js');
    const content = fs.readFileSync(srcPath, 'utf8');

    const idRegex = /id:\s*'(teacher_\d+|student_\d+)'/g;
    const positions = [];
    let m;
    while ((m = idRegex.exec(content)) !== null) {
        positions.push({ id: m[1], index: m.index });
    }

    const users = [];
    for (let i = 0; i < positions.length; i++) {
        const start = positions[i].index;
        const end = i + 1 < positions.length ? positions[i + 1].index : content.length;
        const block = content.substring(start, end);

        const nomM = block.match(/nom:\s*"([^"]+)"/);
        const prenomM = block.match(/prenom:\s*"([^"]+)"/);
        const usernameM = block.match(/username:\s*"([^"]+)"/);
        const roleM = block.match(/role:\s*"(teacher|student)"/);
        const concepteurM = block.match(/concepteur:\s*(true|false)/);
        const displayM = block.match(/displayName:\s*"([^"]+)"/);

        users.push({
            id: positions[i].id,
            nom: nomM ? nomM[1] : '',
            prenom: prenomM ? prenomM[1] : '',
            username: usernameM ? usernameM[1] : '',
            role: roleM ? roleM[1] : 'student',
            concepteur: concepteurM ? concepteurM[1] === 'true' : false,
            displayName: displayM ? displayM[1] : ''
        });
    }
    return users;
}

// =================================================================
// GÉNÉRATION DE MOT DE PASSE TEMPORAIRE
// =================================================================
function generateTempPassword() {
    // 12 octets aléatoires → base64url → 16 caractères
    const buf = crypto.randomBytes(TEMP_PASSWORD_BYTES);
    return buf.toString('base64url');
}

// =================================================================
// HASH PBKDF2 (identique au Worker)
// =================================================================
async function hashPassword(password, pepper) {
    const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
    const hash = crypto.pbkdf2Sync(
        password + pepper, salt, PBKDF2_ITERATIONS, 32, 'sha256'
    ).toString('hex');
    return `${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

// =================================================================
// VÉRIFICATIONS
// =================================================================
function verifyUsers(users) {
    const errors = [];

    // Total
    if (users.length !== 40) errors.push(`Total: ${users.length} au lieu de 40`);

    // Rôles
    const teachers = users.filter(u => u.role === 'teacher');
    const students = users.filter(u => u.role === 'student');
    if (teachers.length !== 3) errors.push(`Enseignants: ${teachers.length} au lieu de 3`);
    if (students.length !== 37) errors.push(`Étudiants: ${students.length} au lieu de 37`);

    // Concepteur
    const concepteurs = users.filter(u => u.concepteur);
    if (concepteurs.length !== 1) errors.push(`Concepteurs: ${concepteurs.length} au lieu de 1`);
    if (concepteurs.length === 1 && concepteurs[0].id !== 'teacher_001') {
        errors.push(`Concepteur incorrect: ${concepteurs[0].id} au lieu de teacher_001`);
    }

    // teacher_002 et teacher_003 non concepteurs
    const t2 = users.find(u => u.id === 'teacher_002');
    const t3 = users.find(u => u.id === 'teacher_003');
    if (t2 && t2.concepteur) errors.push('teacher_002 est concepteur (devrait être false)');
    if (t3 && t3.concepteur) errors.push('teacher_003 est concepteur (devrait être false)');

    // IDs dupliqués
    const ids = users.map(u => u.id);
    const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupIds.length > 0) errors.push(`IDs dupliqués: ${[...new Set(dupIds)].join(', ')}`);

    // Usernames dupliqués
    const usernames = users.map(u => u.username);
    const dupUsernames = usernames.filter((u, i) => usernames.indexOf(u) !== i);
    if (dupUsernames.length > 0) errors.push(`Usernames dupliqués: ${[...new Set(dupUsernames)].join(', ')}`);

    // Champs requis
    for (const u of users) {
        if (!u.id) errors.push('ID manquant');
        if (!u.username) errors.push(`Username manquant pour ${u.id}`);
        if (!u.displayName) errors.push(`displayName manquant pour ${u.id}`);
    }

    return errors;
}

// =================================================================
// APERÇU ADMINISTRATIF
// =================================================================
function printPreview(users) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║       APERÇU ADMINISTRATIF — MIGRATION D1              ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  Total utilisateurs : ${users.length}`);
    console.log(`  Étudiants          : ${users.filter(u => u.role === 'student').length}`);
    console.log(`  Enseignants        : ${users.filter(u => u.role === 'teacher').length}`);
    console.log(`  Concepteur         : ${users.filter(u => u.concepteur).length}`);
    console.log('');
    console.log('─── Utilisateurs ───────────────────────────────────────');
    console.log('  ID              │ Username              │ Rôle     │ Concept.');
    console.log('  ────────────────┼───────────────────────┼──────────┼─────────');
    for (const u of users) {
        const id = u.id.padEnd(15);
        const un = u.username.padEnd(21);
        const role = u.role.padEnd(8);
        const conc = u.concepteur ? 'Oui' : 'Non';
        console.log(`  ${id} │ ${un} │ ${role} │ ${conc}`);
    }
    console.log('');

    // Vérifications
    const errors = verifyUsers(users);
    if (errors.length === 0) {
        console.log('  ✅ Toutes les vérifications passent.');
    } else {
        console.log('  ❌ ERREURS :');
        errors.forEach(e => console.log(`     - ${e}`));
    }
    console.log('');
}

// =================================================================
// PRÉPARATION DES DONNÉES D'INSERTION
// =================================================================
async function prepareInsertData(users, pepper) {
    const records = [];
    const tempPasswords = new Map(); // id → mot de passe temporaire

    for (const u of users) {
        const tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword, pepper);

        records.push({
            id: u.id,
            username: u.username,
            password_hash: passwordHash,
            display_name: u.displayName,
            role: u.role,
            concepteur: u.concepteur ? 1 : 0,
            actif: 1,
            must_change: 1
        });

        tempPasswords.set(u.id, {
            username: u.username,
            displayName: u.displayName,
            tempPassword: tempPassword
        });
    }

    return { records, tempPasswords };
}

// =================================================================
// EXPORT DES MOTS DE PASSE TEMPORAIRES (stdout uniquement)
// =================================================================
function printTempPasswords(tempPasswords) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║   MOTS DE PASSE TEMPORAIRES — DISTRIBUTION INDIVIDUELLE ║');
    console.log('║   ⚠️  NE PAS CONSERVER — À DISTRIBUER PUIS SUPPRIMER    ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('  Username              │ Nom affiché              │ Mot de passe temporaire');
    console.log('  ──────────────────────┼──────────────────────────┼────────────────────────');
    for (const [id, data] of tempPasswords) {
        const un = data.username.padEnd(21);
        const dn = data.displayName.padEnd(24);
        console.log(`  ${un} │ ${dn} │ ${data.tempPassword}`);
    }
    console.log('');
    console.log('  ⚠️  Ces mots de passe ne sont PAS stockés dans le dépôt.');
    console.log('  ⚠️  Chaque utilisateur devra changer son mot de passe à la première connexion.');
    console.log('');
}

// =================================================================
// GÉNÉRATION SQL (pour wrangler d1 execute) — FAIL-CLOSED
// =================================================================
// Stratégie : INSERT INTO (sans OR REPLACE).
// Si un ID ou username existe déjà → contrainte UNIQUE/PRIMARY KEY → erreur SQL.
// Aucune ligne existante n'est jamais modifiée ou supprimée automatiquement.
function generateSQL(records) {
    const lines = [
        '-- Migration D1 — 40 comptes utilisateurs',
        '-- Stratégie : INSERT INTO (fail-closed, aucun overwrite)',
        '-- Généré le: ' + new Date().toISOString(),
        '-- Si un conflit existe, cette requête échoue sans modifier de données.',
        ''
    ];
    for (const r of records) {
        const vals = [
            `'${r.id}'`,
            `'${r.username}'`,
            `'${r.password_hash}'`,
            `'${r.display_name.replace(/'/g, "''")}'`,
            `'${r.role}'`,
            r.concepteur,
            r.actif,
            r.must_change
        ].join(', ');
        lines.push(`INSERT INTO users (id, username, password_hash, display_name, role, concepteur, actif, must_change) VALUES (${vals});`);
    }
    return lines.join('\n');
}

// =================================================================
// VÉRIFICATION DES CONFLITS AVANT INSERTION
// =================================================================
// Interroge D1 pour détecter les IDs ou usernames déjà existants.
// Retourne { ok: true, conflicts: [] } si aucun conflit,
// ou { ok: false, conflicts: [...] } avec la liste des conflits.
function checkConflictsD1(records) {
    const conflicts = [];

    // Vérifier les IDs existants
    const ids = records.map(r => `'${r.id}'`).join(',');
    const existingIds = wranglerQuery(`SELECT id FROM users WHERE id IN (${ids})`);
    if (existingIds.ok && existingIds.results.length > 0) {
        for (const row of existingIds.results) {
            conflicts.push({ type: 'ID_EXISTS', id: row.id });
        }
    }

    // Vérifier les usernames existants
    const usernames = records.map(r => `'${r.username}'`).join(',');
    const existingUsernames = wranglerQuery(`SELECT username FROM users WHERE username IN (${usernames})`);
    if (existingUsernames.ok && existingUsernames.results.length > 0) {
        for (const row of existingUsernames.results) {
            conflicts.push({ type: 'USERNAME_EXISTS', username: row.username });
        }
    }

    // Si la base n'est pas accessible, ce n'est pas un conflit mais une erreur d'infra
    if (!existingIds.ok || !existingUsernames.ok) {
        return { ok: false, error: (existingIds.error || existingUsernames.error || 'Base D1 inaccessible'), conflicts: [] };
    }

    return { ok: conflicts.length === 0, conflicts };
}

// =================================================================
// VÉRIFICATION D1 NON DESTRUCTIVE (--verify-d1)
// =================================================================
const { execSync } = require('child_process');

function wranglerQuery(sql) {
    try {
        const result = execSync(
            `npx wrangler d1 execute langue-francaise-auth --command="${sql}" --remote --json`,
            { encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
        );
        // wrangler --json renvoie un tableau de résultats
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return { ok: true, results: parsed[0].results || parsed };
        }
        return { ok: true, results: parsed };
    } catch (e) {
        const msg = e.stderr || e.message || String(e);
        if (msg.includes('not found') || msg.includes('D1_DATABASE') || msg.includes('ENOENT')) {
            return { ok: false, error: 'Base D1 introuvable ou non configurée' };
        }
        if (msg.includes('authentication') || msg.includes('Unauthorized')) {
            return { ok: false, error: 'Authentification Wrangler requise (wrangler login)' };
        }
        return { ok: false, error: msg.substring(0, 200) };
    }
}

async function verifyD1() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║       VÉRIFICATION D1 — LECTURE SEULE                  ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    const report = {};

    // 1. Test de connexion basique
    console.log('  [1/6] Test de connexion...');
    const conn = wranglerQuery('SELECT 1 as test');
    if (!conn.ok) {
        console.log(`         ❌ ${conn.error}`);
        console.log('');
        console.log('  Diagnostic :');
        console.log('    - La base D1 n\'a probablement pas encore été créée.');
        console.log('    - Commande de création : wrangler d1 create langue-francaise-auth');
        console.log('    - Puis mettre à jour database_id dans worker/wrangler.toml');
        console.log('    - Puis appliquer le schéma : wrangler d1 execute langue-francaise-auth --file=worker/schema.sql');
        console.log('');
        report.d1_reachable = false;
        report.d1_schema = false;
        return report;
    }
    console.log('         ✅ Base accessible');
    report.d1_reachable = true;

    // 2. Vérification du schéma (tables existantes)
    console.log('  [2/6] Vérification du schéma...');
    const tables = wranglerQuery("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','sessions','login_attempts') ORDER BY name");
    if (!tables.ok) {
        console.log(`         ❌ ${tables.error}`);
        report.d1_schema = false;
        return report;
    }
    const tableNames = (tables.results || []).map(r => r.name).sort();
    const expectedTables = ['login_attempts', 'sessions', 'users'];
    const missingTables = expectedTables.filter(t => !tableNames.includes(t));
    if (missingTables.length > 0) {
        console.log(`         ❌ Tables manquantes : ${missingTables.join(', ')}`);
        console.log(`         Appliquer : wrangler d1 execute langue-francaise-auth --file=worker/schema.sql`);
        report.d1_schema = false;
    } else {
        console.log('         ✅ 3 tables présentes (users, sessions, login_attempts)');
        report.d1_schema = true;
    }

    // 3. Index
    console.log('  [3/6] Vérification des index...');
    const indexes = wranglerQuery("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name");
    if (indexes.ok) {
        const idxNames = (indexes.results || []).map(r => r.name);
        const expectedIdx = ['idx_login_attempts_ip', 'idx_login_attempts_username', 'idx_sessions_expires'];
        const missingIdx = expectedIdx.filter(i => !idxNames.includes(i));
        if (missingIdx.length > 0) {
            console.log(`         ⚠️  Index manquants : ${missingIdx.join(', ')}`);
        } else {
            console.log('         ✅ 3 index présents');
        }
    } else {
        console.log('         ⚠️  Impossible de vérifier les index');
    }

    // 4. Counts (pas de données sensibles)
    console.log('  [4/6] Nombre d\'enregistrements...');
    const userCount = wranglerQuery('SELECT COUNT(*) as count FROM users');
    const sessionCount = wranglerQuery('SELECT COUNT(*) as count FROM sessions');
    const attemptCount = wranglerQuery('SELECT COUNT(*) as count FROM login_attempts');

    const uc = userCount.ok && userCount.results[0] ? userCount.results[0].count : '?';
    const sc = sessionCount.ok && sessionCount.results[0] ? sessionCount.results[0].count : '?';
    const ac = attemptCount.ok && attemptCount.results[0] ? attemptCount.results[0].count : '?';
    console.log(`         users          : ${uc}`);
    console.log(`         sessions       : ${sc}`);
    console.log(`         login_attempts : ${ac}`);
    report.users_count = uc;
    report.sessions_count = sc;
    report.attempts_count = ac;

    // 5. Doublons
    console.log('  [5/6] Vérification des doublons...');
    const dupIds = wranglerQuery('SELECT id, COUNT(*) as c FROM users GROUP BY id HAVING c > 1');
    const dupUsernames = wranglerQuery('SELECT username, COUNT(*) as c FROM users GROUP BY username HAVING c > 1');
    const idDups = dupIds.ok ? (dupIds.results || []).length : '?';
    const unDups = dupUsernames.ok ? (dupUsernames.results || []).length : '?';
    console.log(`         IDs dupliqués      : ${idDups}`);
    console.log(`         Usernames dupliqués : ${unDups}`);
    report.duplicate_ids = idDups;
    report.duplicate_usernames = unDups;

    // 6. Vérification rôles
    console.log('  [6/6] Vérification des rôles...');
    const roles = wranglerQuery('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    if (roles.ok && roles.results.length > 0) {
        for (const r of roles.results) {
            console.log(`         ${r.role} : ${r.count}`);
        }
    } else {
        console.log('         (aucun utilisateur)');
    }

    console.log('');
    console.log('  ✅ Vérification terminée. Aucune donnée modifiée.');
    console.log('  ✅ Aucun mot de passe / hash / pepper affiché.');
    console.log('');
    return report;
}

// =================================================================
// MAIN
// =================================================================
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || '--preview';

    if (mode !== '--raw-sql') {
        console.log('');
        console.log(`Mode : ${mode}`);
        console.log('');
    }

    if (mode === '--verify-d1') {
        const report = await verifyD1();
        console.log('  Rapport :');
        console.log(`    D1_REACHABLE = ${report.d1_reachable ? 'PASS' : 'FAIL'}`);
        console.log(`    D1_SCHEMA    = ${report.d1_schema ? 'PASS' : 'FAIL'}`);
        if (report.users_count !== undefined) console.log(`    USERS_COUNT  = ${report.users_count}`);
        if (report.duplicate_ids !== undefined) console.log(`    DUP_IDS      = ${report.duplicate_ids}`);
        if (report.duplicate_usernames !== undefined) console.log(`    DUP_USERNAMES = ${report.duplicate_usernames}`);
        console.log('');
        return;
    }

    if (mode === '--check-conflicts') {
        console.log('  Vérification des conflits D1...');
        console.log('');
        // Extraire les utilisateurs avant la vérification
        const usersForCheck = extractUsers();
        const checkErrors = verifyUsers(usersForCheck);
        if (checkErrors.length > 0) {
            console.error('  ❌ ERREURS dans les données source :');
            checkErrors.forEach(e => console.error(`     - ${e}`));
            process.exit(1);
        }
        // Vérifier que le pepper est disponible (nécessaire pour générer les données)
        const pepper = process.env.AUTH_PEPPER;
        if (!pepper) {
            console.error('  ❌ AUTH_PEPPER non défini. Définir avec : $env:AUTH_PEPPER = "votre-pepper"');
            process.exit(1);
        }
        const { records } = await prepareInsertData(usersForCheck, pepper);
        const result = checkConflictsD1(records);
        if (result.error) {
            console.log(`  ❌ ${result.error}`);
            console.log('     La base D1 n\'est peut-être pas encore créée.');
            console.log('     Exécuter : wrangler d1 create langue-francaise-auth');
            process.exit(1);
        }
        if (result.conflicts.length > 0) {
            console.log('  ❌ CONFLITS DÉTECTÉS — migration refusée :');
            for (const c of result.conflicts) {
                if (c.type === 'ID_EXISTS') console.log(`     - ID déjà existant : ${c.id}`);
                if (c.type === 'USERNAME_EXISTS') console.log(`     - Username déjà existant : ${c.username}`);
            }
            console.log('');
            console.log('  Aucune insertion effectuée. Corriger les conflits avant de réessayer.');
            process.exit(1);
        }
        console.log('  ✅ Aucun conflit détecté dans D1.');
        console.log('  ✅ La migration peut être exécutée en toute sécurité.');
        console.log('');
        return;
    }

    // 1. Extraire les utilisateurs
    const users = extractUsers();

    // 1b. Mode --raw-sql : avant tout affichage, générer uniquement le SQL
    if (mode === '--raw-sql') {
        const rawPepper = process.env.AUTH_PEPPER;
        if (!rawPepper) { process.stderr.write('AUTH_PEPPER non défini\n'); process.exit(1); }
        const rawErrors = verifyUsers(users);
        if (rawErrors.length > 0) { process.stderr.write('Erreurs source: ' + rawErrors.join('; ') + '\n'); process.exit(1); }
        const { records: rawRecords } = await prepareInsertData(users, rawPepper);
        const rawSQL = generateSQL(rawRecords);
        process.stdout.write(rawSQL + '\n');
        return;
    }

    // 2. Vérifications
    const errors = verifyUsers(users);
    if (errors.length > 0 && mode !== '--preview') {
        console.error('❌ ERREURS — migration annulée :');
        errors.forEach(e => console.error(`   - ${e}`));
        process.exit(1);
    }

    // 3. Aperçu
    printPreview(users);

    if (mode === '--preview') {
        console.log('Mode aperçu terminé. Aucune donnée générée.');
        console.log('Utilisez --export-temp pour voir les mots de passe temporaires.');
        console.log('Utilisez --insert pour insérer en base (D1 + AUTH_PEPPER requis).');
        return;
    }

    // 4. Pepper
    const pepper = process.env.AUTH_PEPPER;
    if (!pepper) {
        console.error('❌ AUTH_PEPPER non défini dans l\'environnement.');
        console.error('   Définir avec : $env:AUTH_PEPPER = "votre-pepper-secret"');
        process.exit(1);
    }

    // 5. Générer les données
    const { records, tempPasswords } = await prepareInsertData(users, pepper);

    if (mode === '--export-temp') {
        printTempPasswords(tempPasswords);
        console.log('⚠️  SUPPRIMER CETTE SORTIE APRÈS DISTRIBUTION.');
        return;
    }

    if (mode === '--generate-sql') {
        // Vérification des conflits avant génération du SQL
        console.log('  Vérification des conflits D1 avant génération SQL...');
        const conflictResult = checkConflictsD1(records);
        if (conflictResult.error) {
            console.log(`  ⚠️  ${conflictResult.error}`);
            console.log('     Le SQL est généré malgré tout (INSERT INTO échouera sur conflit).');
            console.log('');
        } else if (conflictResult.conflicts.length > 0) {
            console.log('  ❌ CONFLITS DÉTECTÉS — SQL non généré :');
            for (const c of conflictResult.conflicts) {
                if (c.type === 'ID_EXISTS') console.log(`     - ID déjà existant : ${c.id}`);
                if (c.type === 'USERNAME_EXISTS') console.log(`     - Username déjà existant : ${c.username}`);
            }
            console.log('');
            console.log('  Migration refusée. Aucune ligne existante ne sera modifiée.');
            process.exit(1);
        } else {
            console.log('  ✅ Aucun conflit détecté.');
            console.log('');
        }
        const sql = generateSQL(records);
        console.log(sql);
        console.log('');
        console.log('⚠️  Ce SQL contient les hashes PBKDF2. Ne pas committer.');
        console.log('   Utiliser avec : wrangler d1 execute langue-francaise-auth --file=migration.sql');
        return;
    }

    if (mode === '--insert') {
        console.log('');
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║  ⚠️  MODE INSERTION — EXÉCUTION D1 RÉELLE              ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        console.log('');
        console.log(`  ${records.length} comptes prêts à insérer.`);
        console.log('  Stratégie : INSERT INTO (fail-closed, aucun overwrite).');
        console.log('');
        console.log('  Pour exécuter l\'insertion réelle :');
        console.log('  0. node migrate-users.js --check-conflicts  (vérifier les conflits)');
        console.log('  1. wrangler d1 create langue-francaise-auth');
        console.log('  2. wrangler d1 execute langue-francaise-auth --file=worker/schema.sql');
        console.log('  3. node migrate-users.js --generate-sql > migration.sql');
        console.log('  4. wrangler d1 execute langue-francaise-auth --file=migration.sql');
        console.log('  5. rm migration.sql');
        console.log('');
        console.log('  ⚠️  INSERT INTO (sans OR REPLACE) : échoue si un ID/username existe déjà.');
        console.log('     Aucune ligne existante n\'est jamais modifiée ou supprimée.');
        console.log('');
        return;
    }

    console.log(`Mode inconnu : ${mode}`);
    console.log('Modes disponibles : --preview, --export-temp, --generate-sql, --insert, --verify-d1, --check-conflicts');
}

// =================================================================
// EXPORTS POUR TESTS (uniquement si require() directement)
// =================================================================
if (typeof module !== 'undefined' && require.main !== module) {
    module.exports = {
        extractUsers,
        verifyUsers,
        generateSQL,
        prepareInsertData,
        hashPassword,
        generateTempPassword,
        checkConflictsD1,
        PBKDF2_ITERATIONS,
        SALT_BYTES,
        TEMP_PASSWORD_BYTES
    };
} else {
    main().catch(e => {
        console.error('FATAL:', e.message);
        process.exit(2);
    });
}
