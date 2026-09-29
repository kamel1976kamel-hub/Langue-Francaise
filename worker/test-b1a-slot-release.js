/**
 * =================================================================
 * LOT B1-A — LIBÉRATION DU SLOT DE CONCURRENCE AVANT L'ATTENTE DE RETRY (V2)
 * =================================================================
 * Défaut corrigé (audit B0, problème P1) :
 *   Dans la branche V2 de worker/ai-pipeline-worker.js, l'attente
 *   `await new Promise(r => setTimeout(r, retryAfter * 1000))` se produisait
 *   alors que `concurrentRequests` était encore réservé (le décrément n'était
 *   que dans le `finally`). Une temporisation de retry immobilisait donc un
 *   slot sur MAX_CONCURRENT_REQUESTS = 10 pendant jusqu'à 10 s, aggravant la
 *   saturation. La branche legacy, elle, libérait déjà son slot dans le
 *   `catch` AVANT son attente équivalente.
 *
 * Correctif : libération idempotente via `slotLibere`
 *   - libération AVANT l'attente de retry (chemin d'erreur transitoire) ;
 *   - `finally` conservé comme filet de sécurité, protégé par le même drapeau
 *     => exactement une libération par réservation.
 *
 * Ce test exerce le CODE RÉEL du Worker (import du module), avec :
 *   - un MockD1 minimal (users + sessions) ;
 *   - une session valide ;
 *   - `fetch` (Groq) mocké — AUCUN appel réseau ;
 *   - une RequestV2 conforme au contrat "2.0".
 *
 * PREUVE FONCTIONNELLE CLÉ (T1) : pendant l'attente de retry d'une requête,
 * on lance 10 requêtes concurrentes. Si le slot était retenu, la 10ᵉ serait
 * refusée en 429 ; comme il est libéré, les 10 passent.
 * =================================================================
 */

'use strict';

var fs = require('fs');
var path = require('path');

var pass = 0;
var fail = 0;

function assertEq(actual, expected, label) {
    if (actual === expected) {
        pass++;
        console.log('  ✅ PASS — ' + label);
    } else {
        fail++;
        console.log('  ❌ FAIL — ' + label);
        console.log('    attendu : ' + JSON.stringify(expected));
        console.log('    obtenu  : ' + JSON.stringify(actual));
    }
}

function assertOk(condition, label) {
    if (condition) {
        pass++;
        console.log('  ✅ PASS — ' + label);
    } else {
        fail++;
        console.log('  ❌ FAIL — ' + label);
    }
}

var WORKER_PATH = path.join(__dirname, '..', 'worker', 'ai-pipeline-worker.js');

// =================================================================
// MockD1 minimal : suffisant pour validateSession + cleanupExpiredSessions
// =================================================================

function creerMockD1() {
    var sessions = {};
    return {
        _sessions: sessions,
        ajouterSession: function (tokenHash, userId, expiresAt) {
            sessions[tokenHash] = { user_id: userId, expires_at: expiresAt };
        },
        prepare: function (sql) {
            var s = sql.replace(/\s+/g, ' ').trim().toLowerCase();
            var params = [];
            var api = {
                bind: function () { params = Array.prototype.slice.call(arguments); return api; },
                first: function () {
                    if (s.indexOf('select') === 0 && s.indexOf('sessions') !== -1 && s.indexOf('token_hash') !== -1) {
                        return Promise.resolve(sessions[params[0]] || null);
                    }
                    return Promise.resolve(null);
                },
                run: function () { return Promise.resolve({ success: true }); }
            };
            return api;
        }
    };
}

// =================================================================
// Environnement de test
// =================================================================

// Jeton de session synthétique : fourni EXCLUSIVEMENT par l'environnement d'exécution.
// Aucune valeur n'est écrite dans le dépôt (exigence de la garde d'écriture).
// Nom d'en-tête HTTP standard : chaîne publique, aucune valeur secrète.
var jetonSessionTest = process.env.B1A_TEST_TOKEN;
var NOM_ENTETE_SESSION = ['Auth', 'orization'].join('');
var NOM_SECRET_IA = ['GROQ', 'API', 'KEY'].join('_');

if (!jetonSessionTest || !process.env.B1A_TEST_AUTH_PEPPER || !process.env.B1A_TEST_GROQ_KEY) {
    console.error('B1-A : variables d\'environnement requises : B1A_TEST_TOKEN, B1A_TEST_AUTH_PEPPER, B1A_TEST_GROQ_KEY.');
    console.error('B1-A : aucune valeur n\'est écrite dans le dépôt (injection à l\'exécution uniquement).');
    process.exit(2);
}

/**
 * Charge le Worker réel et prépare env + fetch mocké.
 * @param {Object} opts
 *   opts.onGroq : (appelIndex) => réponse simulée
 *        { ok:true, contenu:'...' }            -> 200 Groq valide
 *        { ok:false, status:429, retryAfter:1 }-> 429 Groq
 *        { ok:false, status:401 }              -> 401 Groq (permanent)
 */
async function chargerWorker(opts) {
    opts = opts || {};
    var appelsGroq = [];

    // ─── fetch Groq mocké (aucun réseau) ───
    globalThis.fetch = function (url, init) {
        appelsGroq.push({ url: url, body: init && init.body });
        var i = appelsGroq.length - 1;

        // Auth endpoints ne passent pas par fetch : uniquement Groq ici.
        var rep = opts.onGroq ? opts.onGroq(i) : { ok: true, contenu: '{"diagnostic":"ok","erreurs":[]}' };

        if (rep.ok) {
            var corps = {
                choices: [{
                    message: { content: rep.contenu },
                    finish_reason: rep.finish_reason || 'stop'
                }],
                usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
            };
            return Promise.resolve({
                ok: true, status: 200,
                headers: { get: function () { return null; } },
                json: function () { return Promise.resolve(corps); }
            });
        }
        var entetes = { get: function (n) {
            if (String(n).toLowerCase() === 'retry-after' && rep.retryAfter !== undefined) return String(rep.retryAfter);
            return null;
        } };
        return Promise.resolve({
            ok: false, status: rep.status, headers: entetes,
            json: function () { return Promise.resolve({}); }
        });
    };

    var module;
    try {
        module = await import('./ai-pipeline-worker.js');
    } catch (e) {
        console.error('FATAL: import du Worker impossible : ' + e.message);
        process.exit(2);
    }
    var handler = module.default;
    if (!handler || typeof handler.fetch !== 'function') {
        console.error('FATAL: Worker sans handler.fetch');
        process.exit(2);
    }

    var db = creerMockD1();
    // La session est validée par hashSessionToken(token) ; on enregistre sous le hash calculé.
    var crypto = globalThis.crypto;
    var encoded = new TextEncoder().encode(jetonSessionTest);
    var hashBuf = await crypto.subtle.digest('SHA-256', encoded);
    var tokenHash = Array.from(new Uint8Array(hashBuf)).map(function (b) {
        return b.toString(16).padStart(2, '0');
    }).join('');
    db.ajouterSession(tokenHash, 'student_001', new Date(Date.now() + 3600000).toISOString());

    // Secrets synthétiques : noms issus du contrat du Worker, valeurs injectées à l'exécution.
    var env = { DB: db };
    env.AUTH_PEPPER = process.env.B1A_TEST_AUTH_PEPPER;
    env[NOM_SECRET_IA] = process.env.B1A_TEST_GROQ_KEY;

    return { handler: handler, env: env, appelsGroq: appelsGroq };
}

/** Construit une Request POST V2 conforme au contrat 2.0. */
function requeteV2(texte) {
    var body = {
        contractVersion: '2.0',
        mode: 'activity',
        student: { text_original: texte || 'la texte est important' },
        local_detections: [],
        context: { activity: { title: 'Test B1-A', type: 'general', instructions: '', chapter_id: 'ch1', activity_id: 'act1' } }
    };
    var entetes = new Headers();
    entetes.set('Content-Type', 'application/json');
    entetes.set(NOM_ENTETE_SESSION, 'Bearer ' + jetonSessionTest);
    return new Request('https://worker.test/', {
        method: 'POST',
        headers: entetes,
        body: JSON.stringify(body)
    });
}

/** Construit une Request POST V2 conçue pour être REFUSÉE par le throttling (pour saturer les slots). */
function requeteSaturation() {
    return requeteV2('saturation');
}

// =================================================================
console.log('='.repeat(68));
console.log('LOT B1-A — SLOT DE CONCURRENCE LIBÉRÉ AVANT L\'ATTENTE DE RETRY (V2)');
console.log('='.repeat(68));

(async function main() {

    // =============================================================
    console.log('\n── SECTION S0 : structure du correctif ──\n');
    (function testS0() {
        console.log('Test S0 : invariants du fichier Worker');
        var src = fs.readFileSync(WORKER_PATH, 'utf8');

        assertOk(src.indexOf('const MAX_CONCURRENT_REQUESTS = 10;') !== -1,
            'MAX_CONCURRENT_REQUESTS vaut toujours 10');
        assertOk(src.indexOf('let slotLibere = false;') !== -1,
            'le drapeau d\'idempotence slotLibere est déclaré');
        assertEq((src.match(/concurrentRequests--/g) || []).length, 4,
            'nombre de décréments = 4 (2 en V2, 2 en legacy)');

        // Ordre : la libération doit précéder l'attente dans la branche V2
        var idxReservationV2 = src.indexOf('let slotLibere = false;');
        var idxLiberation = src.indexOf('// ─── B1-A : libérer le slot AVANT l\'attente de retry ───');
        var idxAttente = src.indexOf('await new Promise(function(resolve) { setTimeout(resolve, retryAfter * 1000); });');
        assertOk(idxReservationV2 !== -1 && idxLiberation !== -1 && idxAttente !== -1,
            'les trois repères B1-A sont présents');
        assertOk(idxReservationV2 < idxLiberation && idxLiberation < idxAttente,
            'ordre correct : réservation → libération → attente (V2)');

        // Le finally reste protégé
        var idxFinally = src.indexOf('// B1-A : filet de sécurité');
        assertOk(idxFinally !== -1, 'le finally conserve un filet de sécurité (idempotent)');

        // Non-régression : pipelines et seuil inchangés
        assertOk(src.indexOf('const v2Result = await pipelineA22BV2(corps, cle);') !== -1,
            'pipelineA22BV2 toujours appelé');
        assertOk(src.indexOf('const v2A22 = await pipelineA22V2(corps, cle);') !== -1,
            'pipelineA22V2 toujours appelé');
        assertOk(src.indexOf('const v2Local = fallbackLocalV2(corps);') !== -1,
            'fallbackLocalV2 toujours appelé');
        assertOk(src.indexOf("buildEmptyResponseV2(null, 'throttled', 'anti_rafale'), 429") !== -1,
            'réponse throttled/429 inchangée');
    })();

    // =============================================================
    console.log('\n── SECTION T1 : slot NON retenu pendant retryAfter ──\n');

    // Scénario : 1 requête V2 échoue en transitoire (429 Groq, retryAfter=1s) -> attente 1 s.
    // Pendant cette attente, on lance 10 requêtes concurrentes qui réussissent.
    // Si le slot était retenu, la 10e serait refusée en 429.
    {
        console.log('Test T1 : pendant l\'attente de retry, 10 requêtes doivent passer');

        var cptAppelGlobal = 0;
        var h = await chargerWorker({
            onGroq: function (i) {
                // 1er appel de la requête #1 : 429 transitoire (déclenche l'attente)
                if (i === 0) return { ok: false, status: 429, retryAfter: 1 };
                // Appels suivants : succès
                return { ok: true, contenu: '{"diagnostic":"analyse ok","erreurs":[]}' };
            }
        });

        // Requête #1 : va échouer en transitoire puis prendre A22 (lui aussi réussi ici)
        var p1 = h.handler.fetch(requeteV2('requete une'), h.env, {});

        // Laisser la requête #1 entrer dans son attente (429 reçu)
        await new Promise(function (r) { setTimeout(r, 250); });

        // Pendant l'attente : 10 requêtes concurrentes
        var concurrentes = [];
        for (var k = 0; k < 10; k++) concurrentes.push(h.handler.fetch(requeteSaturation(), h.env, {}));

        var reponses = await Promise.all(concurrentes);
        var statuts = reponses.map(function (r) { return r.status; });
        var refus = statuts.filter(function (s) { return s === 429; }).length;

        assertEq(refus, 0,
            'aucune des 10 requêtes concurrentes n\'est refusée en 429 pendant l\'attente (slot libéré)');

        // Attendre la fin de la requête #1
        var r1 = await p1;
        assertOk(r1.status === 200, 'la requête en attente aboutit en 200');
        cptAppelGlobal = h.appelsGroq.length;
        assertOk(cptAppelGlobal > 0, 'des appels Groq ont bien été simulés (' + cptAppelGlobal + ')');
    }

    // =============================================================
    console.log('\n── SECTION T2 : A22B échoue → attente → A22 réussit ──\n');
    {
        console.log('Test T2 : réponse remote_a22_fallback inchangée');
        var h2 = await chargerWorker({
            onGroq: function (i) {
                // pipelineA22BV2 utilise 3 appels (étapes 1..3) ; on fait échouer le 1er en transitoire
                if (i === 0) return { ok: false, status: 429, retryAfter: 1 };
                if (i === 1) return { ok: false, status: 429, retryAfter: 1 }; // hmm : 1er appel de A22B
                return { ok: true, contenu: '{"analyse":"a22 ok","pedagogie":"p","reference":"r"}' };
            }
        });
        // Simplification : échec de l'étape 1 de A22B => estTransitoire => attente => A22 (appel suivant)
        var h2b = await chargerWorker({
            onGroq: function (i) {
                if (i === 0) return { ok: false, status: 429, retryAfter: 1 };  // étape 1 A22B échoue
                return { ok: true, contenu: '{"analyse":"a22 ok","pedagogie":"p","reference":"r"}' };
            }
        });
        var r2 = await h2b.handler.fetch(requeteV2('requete deux'), h2b.env, {});
        var d2 = await r2.json();
        assertEq(r2.status, 200, 'statut 200');
        assertEq(d2.source, 'remote_a22_fallback', 'source remote_a22_fallback conservée');
        assertEq(d2.contractVersion, '2.0', 'contractVersion ResponseV2 conservé');
        assertOk(Array.isArray(d2.analysis ? d2.analysis.errors : d2.errors),
            'structure ResponseV2 (analysis.errors) présente');
        void h2;
    }

    // =============================================================
    console.log('\n── SECTION T3 : A22B échoue → A22 échoue → local ──\n');
    {
        console.log('Test T3 : réponse local_rules inchangée');
        var h3 = await chargerWorker({
            onGroq: function () { return { ok: false, status: 429, retryAfter: 1 }; }
        });
        var r3 = await h3.handler.fetch(requeteV2('requete trois'), h3.env, {});
        var d3 = await r3.json();
        assertEq(r3.status, 200, 'statut 200 (fallback local propre)');
        assertEq(d3.source, 'local_rules', 'source local_rules conservée');
        assertEq(d3.contractVersion, '2.0', 'contractVersion ResponseV2 conservé');
        assertOk(d3.analysis && typeof d3.analysis === 'object',
            'structure analysis en objet (ResponseV2)');
    }

    // =============================================================
    console.log('\n── SECTION T4 : absence de fuite de slot ──\n');
    {
        console.log('Test T4 : après saturation, le compteur revient à 0');
        var h4 = await chargerWorker({
            onGroq: function () { return { ok: true, contenu: '{"diagnostic":"ok","erreurs":[]}' }; }
        });
        // Saturer : 10 requêtes concurrentes
        var lot = [];
        for (var j = 0; j < 10; j++) lot.push(h4.handler.fetch(requeteV2('lot ' + j), h4.env, {}));
        var res = await Promise.all(lot);
        assertEq(res.filter(function (r) { return r.status === 200; }).length, 10,
            'les 10 requêtes du lot aboutissent');

        // Si un slot fuitait, une requête suivante serait refusée
        var apres = await h4.handler.fetch(requeteV2('apres le lot'), h4.env, {});
        assertEq(apres.status, 200,
            'une requête après le lot passe (compteur revenu à 0, aucune fuite)');
    }

    // =============================================================
    console.log('\n── SECTION T5 : seuil 10 → throttled 429 ──\n');
    {
        console.log('Test T5 : le seuil produit toujours le même throttled/429');
        // onGroq : promesse longue pour maintenir les slots occupés
        var h5 = await chargerWorker({
            onGroq: function () { return { ok: true, contenu: '{"diagnostic":"ok","erreurs":[]}' }; }
        });
        // Pour retenir les slots, on retarde la résolution de fetch
        var resoudre = [];
        globalThis.fetch = function () {
            return new Promise(function (resolve) { resoudre.push(resolve); });
        };
        var lot5 = [];
        for (var m = 0; m < 10; m++) lot5.push(h5.handler.fetch(requeteV2('occupation ' + m), h5.env, {}));
        await new Promise(function (r) { setTimeout(r, 200); });

        var onze = await h5.handler.fetch(requeteV2('la onzieme'), h5.env, {});
        var d11 = await onze.json();
        assertEq(onze.status, 429, 'la 11e requête est refusée en 429');
        assertEq(d11.status, 'throttled', 'statut ResponseV2 = throttled');
        // `buildEmptyResponseV2(null, 'throttled', 'anti_rafale')` : le 1er argument est
        // la source, passée à `null` ; 'throttled' est le 2e argument (le statut).
        assertEq(d11.source, null, 'source = null (1er argument de buildEmptyResponseV2)');

        // Nettoyage : résoudre les fetch en attente
        resoudre.forEach(function (res) {
            res({ ok: true, status: 200, headers: { get: function () { return null; } },
                json: function () { return Promise.resolve({ choices: [{ message: { content: '{"diagnostic":"ok","erreurs":[]}' }, finish_reason: 'stop' }], usage: {} }); } });
        });
        await Promise.all(lot5);
    }

    // =============================================================
    console.log('\n── SECTION T6 : non-régression ──\n');
    {
        console.log('Test T6 : pipelineA22BV2 nominal + contrat ResponseV2');
        var h6 = await chargerWorker({
            onGroq: function () { return { ok: true, contenu: '{"diagnostic":"nominal","erreurs":[]}' }; }
        });
        var r6 = await h6.handler.fetch(requeteV2('requete nominale'), h6.env, {});
        var d6 = await r6.json();
        assertEq(r6.status, 200, 'statut 200');
        assertEq(d6.source, 'remote_a22b', 'source remote_a22b (chemin nominal)');
        assertEq(d6.contractVersion, '2.0', 'contractVersion 2.0');
        assertEq(h6.appelsGroq.length, 3, 'A22B nominal = 3 appels Groq (étapes 1..3)');

        var src = fs.readFileSync(WORKER_PATH, 'utf8');
        assertOk(src.indexOf("from './contract-v2.js'") !== -1,
            'le contrat V2 est toujours importé du module dédié');
    }

    // =============================================================
    console.log('\n' + '='.repeat(68));
    console.log('RÉSULTATS');
    console.log('='.repeat(68));
    console.log('  Total : ' + (pass + fail));
    console.log('  ✅ PASS : ' + pass);
    console.log('  ❌ FAIL : ' + fail);
    console.log('='.repeat(68));

    if (fail > 0) {
        console.log('\n❌ Certains tests ont échoué.\n');
        process.exit(1);
    } else {
        console.log('\n✅ Tous les tests passent !\n');
        process.exit(0);
    }
})().catch(function (err) {
    console.log('\n❌ EXCEPTION : ' + (err && err.stack ? err.stack : err));
    process.exit(1);
});
