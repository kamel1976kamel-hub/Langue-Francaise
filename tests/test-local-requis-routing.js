/**
 * =================================================================
 * LOT A1 — TESTS DU CONTRAT `local_requis` CÔTÉ CLIENT
 * =================================================================
 * Contexte (audit A0, READ-ONLY) :
 *   - le Worker peut renvoyer `{ source: 'local_requis' }` en HTTP 200
 *     (worker/ai-pipeline-worker.js:1550, 1557, 1565) et en HTTP 429
 *     (l.1385, 1547) ;
 *   - le client ne testait JAMAIS `data.source` : il retombait sur la
 *     chaîne littérale « Réponse IA non disponible » (main.js, ancienne
 *     ligne 795), 25 caractères, au lieu d'utiliser le moteur local.
 *
 * Le lot A1 corrige ce routage dans main.js :
 *   - `data.source === 'local_requis'` est détecté explicitement ;
 *   - le repli local RÉUTILISE `window.correctTextWithDatabase` (275 règles),
 *     aucun nouveau moteur n'est créé ;
 *   - en chat, aucune correction n'est présentée comme réponse
 *     conversationnelle : message d'indisponibilité explicite ;
 *   - toutes les autres sources (`remote_a22b`, `remote_a22_fallback`,
 *     `local_rules`), le HTTP 429, le 401 et `throttled` restent inchangés.
 *
 * Aucun appel réseau : `fetch` est simulé.
 * =================================================================
 */

'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

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

// =================================================================
// Harnais : charge main.js dans un sandbox avec fetch simulé
// =================================================================

var MAIN_PATH = path.join(__dirname, '..', 'main.js');
var WORKER_REL = path.join('worker', 'ai-pipeline-worker.js');
var WORKER_PATH = path.join(__dirname, '..', WORKER_REL);

/**
 * Crée un sandbox chargeant main.js.
 * @param {Object} opts
 *   opts.reponse      : objet JSON renvoyé par fetch (défaut: {})
 *   opts.status       : statut HTTP simulé (défaut: 200)
 *   opts.engineReady  : true => window.correctTextWithDatabase + NLPRules peuplés
 *   opts.corrections  : corrections renvoyées par le faux correctTextWithDatabase
 */
function creerHarnais(opts) {
    opts = opts || {};
    var status = (opts.status === undefined) ? 200 : opts.status;
    var reponse = (opts.reponse === undefined) ? {} : opts.reponse;
    var journal = { fetchCalls: [], correctCalls: [], logs: [] };

    var sandbox = {
        console: {
            log: function () { journal.logs.push(Array.prototype.join.call(arguments, ' ')); },
            warn: function () { journal.logs.push(Array.prototype.join.call(arguments, ' ')); },
            error: function () { journal.logs.push(Array.prototype.join.call(arguments, ' ')); }
        },
        setTimeout: setTimeout, clearTimeout: clearTimeout,
        setInterval: function () { return 0; }, clearInterval: clearInterval,
        Promise: Promise, Map: Map, Set: Set, JSON: JSON, RegExp: RegExp,
        Object: Object, Array: Array, String: String, Error: Error,
        Number: Number, Boolean: Boolean, Date: Date, Math: Math,
        AbortController: (function () {
            function AC() { this.signal = {}; }
            AC.prototype.abort = function () {};
            return AC;
        })(),
        fetch: function (url, options) {
            journal.fetchCalls.push({ url: url, body: options && options.body });
            return Promise.resolve({
                ok: status >= 200 && status < 300,
                status: status,
                statusText: status === 200 ? 'OK' : 'Error',
                json: function () { return Promise.resolve(reponse); }
            });
        },
        localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
        location: { hostname: 'localhost', protocol: 'http:', href: 'http://localhost/' },
        navigator: { userAgent: 'node' },
        MutationObserver: (function () { function MO() {} MO.prototype.observe = function () {}; MO.prototype.disconnect = function () {}; return MO; })(),
        CustomEvent: function (t, d) { this.type = t; this.detail = d; },
        document: {
            addEventListener: function () {},
            dispatchEvent: function () {},
            createElement: function () {
                return {
                    style: {}, classList: { add: function () {}, remove: function () {} },
                    appendChild: function () {}, setAttribute: function () {},
                    querySelector: function () { return null; }
                };
            },
            getElementById: function () { return null; },
            querySelector: function () { return null; },
            querySelectorAll: function () { return []; },
            body: { appendChild: function () {}, removeChild: function () {} }
        },
        SpeechSynthesisUtterance: function () {},
        speechSynthesis: { speak: function () {}, cancel: function () {} },
        XMLHttpRequest: function () {}
    };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.window.addEventListener = function () {};

    // `setIaStatus` est défini dans index.html:8596 (couche UI), pas dans main.js.
    // Le harnais le stubbe pour isoler le contrat `local_requis`.
    sandbox.setIaStatus = function () {};

    var ctx = vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(MAIN_PATH, 'utf8'), ctx, { filename: 'main.js' });

    // L'application doit être « prête » pour que demanderIA n'arrête pas tôt
    sandbox.window.appState.iaReady = true;

    // Moteur local simulé
    if (opts.engineReady) {
        sandbox.window.NLPRules = { orthographe: [{ name: 'r1' }], grammaire: [{ name: 'r2' }] };
        sandbox.window.correctTextWithDatabase = function (texte) {
            journal.correctCalls.push(texte);
            return Promise.resolve({
                success: true,
                originalText: texte,
                correctedText: opts.correctedText || texte,
                corrections: (opts.corrections === undefined)
                    ? [{ original: 'la texte', corrected: 'le texte', rule: 'genre_texte_masculin', category: 'grammaire' }]
                    : opts.corrections,
                confidence: 85
            });
        };
    }

    return { sandbox: sandbox, journal: journal };
}

var INTERDIT = 'Réponse IA non disponible';

// =================================================================
console.log('='.repeat(64));
console.log('LOT A1 — CONTRAT `local_requis` CÔTÉ CLIENT');
console.log('='.repeat(64));

// =================================================================
console.log('\n── SECTION 0 : structure du correctif dans main.js ──\n');

(function testS0() {
    console.log('Test S0 : le correctif est présent et ciblé');
    var src = fs.readFileSync(MAIN_PATH, 'utf8');

    assertOk(src.indexOf("if (data.source === 'local_requis')") !== -1,
        'le routage teste explicitement data.source === \'local_requis\'');
    assertOk(src.indexOf('function repliLocal(') !== -1,
        'la fonction de repli repliLocal() existe');
    assertOk(src.indexOf('function isLocalEngineReady(') !== -1,
        'la garde isLocalEngineReady() existe');
    assertOk(src.indexOf('window.correctTextWithDatabase(texte)') !== -1,
        'le repli RÉUTILISE window.correctTextWithDatabase (moteur existant)');
    assertOk(src.indexOf('const aiResponse = data.choices') !== -1,
        'le chemin legacy d\'extraction est conservé');

    // Le routage doit être placé AVANT l'extraction legacy
    var idxRoutage = src.indexOf("if (data.source === 'local_requis')");
    var idxLegacy = src.indexOf("const aiResponse = data.choices");
    assertOk(idxRoutage !== -1 && idxLegacy !== -1 && idxRoutage < idxLegacy,
        'le routage précède l\'extraction legacy (donc la chaîne littérale est évitée)');

    // Aucune modification du Worker
    var worker = fs.readFileSync(WORKER_PATH, 'utf8');
    assertOk(worker.indexOf('local_requis') !== -1,
        'le Worker déclare toujours local_requis (contrat inchangé, non modifié par A1)');
    assertOk(worker.indexOf('MAX_CONCURRENT_REQUESTS = 10') !== -1,
        'MAX_CONCURRENT_REQUESTS du Worker inchangé (10)');
})();

// =================================================================
console.log('\n── SECTION T1 : activité + local_requis HTTP 200 ──\n');

(function testT1() {
    console.log('Test T1 : activité + local_requis (HTTP 200)');
    var h = creerHarnais({
        status: 200,
        reponse: { erreur: 'Service IA indisponible', source: 'local_requis' },
        engineReady: true
    });

    return h.sandbox.window.demanderIA('la texte est important', 'activité').then(function (reponse) {
        assertEq(h.journal.correctCalls.length, 1,
            'correctTextWithDatabase appelé exactement 1 fois');
        assertEq(h.journal.correctCalls[0], 'la texte est important',
            'le texte étudiant correct est transmis au moteur local');
        assertOk(String(reponse.analysis).indexOf(INTERDIT) === -1,
            'la chaîne « Réponse IA non disponible » n\'est PAS produite');
        assertEq(reponse.source, 'local_requis',
            'la source local_requis est propagée');
        assertEq(reponse.localFallback, true,
            'le marqueur localFallback est présent');
    });
})().then(function () {

    // =============================================================
    console.log('\n── SECTION T2 : activité + résultat local ──\n');

    console.log('Test T2 : format compatible avec displayActivityCorrections');
    var h = creerHarnais({
        status: 200,
        reponse: { erreur: 'Service IA indisponible', source: 'local_requis' },
        engineReady: true
    });

    return h.sandbox.window.demanderIA('la texte est important', 'activité').then(function (reponse) {
        // displayActivityCorrections lit : corrections.corrections || corrections.errors
        assertOk(Array.isArray(reponse.corrections),
            'reponse.corrections est un tableau (lu par index.html:1089)');
        assertEq(reponse.corrections.length, 1,
            'la correction locale remonte dans le format attendu');
        assertEq(reponse.corrections[0].original, 'la texte',
            'la correction porte bien « original »');
        assertEq(reponse.corrections[0].corrected, 'le texte',
            'la correction porte bien « corrected »');
        assertOk(typeof reponse.analysis === 'string' && reponse.analysis.length > 0,
            'une analyse textuelle est fournie à l\'UI');
    });
}).then(function () {

    // =============================================================
    console.log('\n── SECTION T3 : chat + local_requis HTTP 200 ──\n');

    console.log('Test T3 : chat + local_requis — pas de fausse réponse');
    var h = creerHarnais({
        status: 200,
        reponse: { erreur: 'Service IA indisponible', source: 'local_requis' },
        engineReady: true
    });

    return h.sandbox.window.demanderIA("qu'est-ce que un texte narratif ?", 'chat').then(function (reponse) {
        assertEq(h.journal.correctCalls.length, 0,
            'la correction locale n\'est PAS appelée en chat');
        assertOk(String(reponse.analysis).indexOf('indisponible') !== -1,
            'un message d\'indisponibilité explicite est renvoyé');
        assertOk(String(reponse.analysis).indexOf(INTERDIT) === -1,
            'aucune chaîne « Réponse IA non disponible »');
        assertOk(String(reponse.analysis).indexOf('correction') === -1,
            'aucune correction orthographique présentée comme réponse');
        assertOk(String(reponse.analysis).indexOf('Parfait') === -1,
            'aucun faux « Parfait ! Votre réponse est correcte »');
        assertEq(reponse.iaUnavailable, true,
            'l\'état iaUnavailable est explicite');
        assertEq(reponse.isChatResponse, true,
            'le mode chat est conservé pour l\'affichage');
    });
}).then(function () {

    // =============================================================
    console.log('\n── SECTION T4 : réponse V2 normale (remote_a22b) ──\n');

    console.log('Test T4 : chemin V2 strictement conservé');
    var h = creerHarnais({
        status: 200,
        reponse: {
            contractVersion: '2.0', // src/request-builder-v2.js:22
            source: 'remote_a22b',
            status: 'ok',
            analysis: { diagnostic: 'Analyse distante OK', errors: [] },
            tutor: { explanation: 'Explication distante' },
            course: { point: 'Point de cours' }
        },
        engineReady: true
    });

    return h.sandbox.window.demanderIA('la texte est important', 'activité', { textOriginal: 'la texte est important' }).then(function (reponse) {
        assertEq(h.journal.correctCalls.length, 0,
            'le moteur local n\'est PAS appelé pour une réponse V2 distante');
        assertOk(String(reponse.analysis).indexOf('Analyse distante OK') !== -1,
            'le diagnostic distant est bien restitué');
        assertOk(String(reponse.analysis).indexOf(INTERDIT) === -1,
            'aucune chaîne littérale de repli');
    });
}).then(function () {

    // =============================================================
    console.log('\n── SECTION T5 : source local_rules ──\n');

    console.log('Test T5 : chemin local_rules inchangé');
    var h = creerHarnais({
        status: 200,
        reponse: {
            contractVersion: '2.0', // src/request-builder-v2.js:22
            source: 'local_rules',
            status: 'ok',
            analysis: { diagnostic: 'Détections locales', errors: [] },
            tutor: {}, course: {}
        },
        engineReady: true
    });

    return h.sandbox.window.demanderIA('la texte est important', 'activité', { textOriginal: 'la texte est important' }).then(function (reponse) {
        assertOk(reponse !== undefined && reponse !== null,
            'local_rules est traité (aucune régression)');
        assertOk(String(reponse.analysis).indexOf(INTERDIT) === -1,
            'aucune chaîne littérale pour local_rules');
    });
}).then(function () {

    // =============================================================
    console.log('\n── SECTION T6 : local_requis HTTP 429 ──\n');

    console.log('Test T6 : HTTP 429 — comportement de rejet conservé');
    var h = creerHarnais({
        status: 429,
        reponse: { erreur: 'Service IA saturé, réessayez plus tard', source: 'local_requis', retryAfter: 5 },
        engineReady: true
    });

    return h.sandbox.window.demanderIA('la texte est important', 'activité').then(function (reponse) {
        // Le 429 déclenche !response.ok => throw => catch => feedback local heuristique
        assertEq(h.journal.correctCalls.length, 0,
            'le moteur local n\'est PAS appelé via le routage A1 (429 passe par catch)');
        assertOk(reponse !== undefined && reponse !== null,
            'le catch produit bien un objet de repli (pas de crash)');
        assertOk(String(reponse.analysis).indexOf(INTERDIT) === -1,
            'aucune chaîne « Réponse IA non disponible » après un 429');
        assertEq(reponse.source, 'locale',
            'le repli heuristique existant conserve source=locale');
    });
}).then(function () {

    // =============================================================
    console.log('\n── SECTION T7 : règles locales non prêtes ──\n');

    console.log('Test T7 : moteur local indisponible — pas de fausse correction');
    var h = creerHarnais({
        status: 200,
        reponse: { erreur: 'Service IA indisponible', source: 'local_requis' },
        engineReady: false // ni correctTextWithDatabase ni NLPRules
    });

    return h.sandbox.window.demanderIA('la texte est important', 'activité').then(function (reponse) {
        assertEq(h.journal.correctCalls.length, 0,
            'aucun appel au moteur local absent');
        assertOk(reponse !== undefined && reponse !== null,
            'aucun crash');
        assertOk(String(reponse.analysis).indexOf(INTERDIT) === -1,
            'aucune chaîne « Réponse IA non disponible »');
        assertOk(String(reponse.analysis).indexOf('indisponible') !== -1,
            'message honnête d\'indisponibilité locale');
        assertEq(reponse.iaUnavailable, true,
            'état iaUnavailable explicite');
        assertOk(!Array.isArray(reponse.corrections) || reponse.corrections.length === 0,
            'aucune fausse correction produite');
    });
}).then(function () {

    // =============================================================
    console.log('\n── SECTION T7b : correctTextWithDatabase présent MAIS NLPRules vide ──\n');

    console.log('Test T7b : garde sur NLPRules (point établi par A0)');
    var h = creerHarnais({
        status: 200,
        reponse: { erreur: 'Service IA indisponible', source: 'local_requis' },
        engineReady: false
    });
    // correctTextWithDatabase existe, mais NLPRules n'est pas peuplé
    h.sandbox.window.correctTextWithDatabase = function (t) {
        h.journal.correctCalls.push(t);
        return Promise.resolve({ success: true, corrections: [] });
    };

    return h.sandbox.window.demanderIA('la texte est important', 'activité').then(function (reponse) {
        assertEq(h.journal.correctCalls.length, 0,
            'le moteur n\'est PAS appelé alors que NLPRules est vide (garde isLocalEngineReady)');
        assertOk(String(reponse.analysis).indexOf('indisponible') !== -1,
            'message honnête au lieu d\'une correction vide trompeuse');
    });
}).then(function () {

    // =============================================================
    console.log('\n── SECTION T8 : anti-régression ──\n');

    console.log('Test T8 : fichiers hors périmètre intacts');
    var workerSrc = fs.readFileSync(WORKER_PATH, 'utf8');
    var v2Src = fs.readFileSync(path.join(__dirname, '..', 'src', 'request-builder-v2.js'), 'utf8');
    var dbSrc = fs.readFileSync(path.join(__dirname, '..', 'nlp', 'database', 'init-browser-sqlite.js'), 'utf8');

    assertOk(workerSrc.indexOf('pipelineA22V2') !== -1 && workerSrc.indexOf('fallbackLocalV2') !== -1,
        'Worker : pipeline A22 et fallbackLocalV2 inchangés');
    assertOk(v2Src.indexOf('function buildRequestV2') !== -1 && v2Src.indexOf('function normalizeResponseV2') !== -1,
        'RequestBuilderV2 : buildRequestV2 et normalizeResponseV2 inchangés');
    assertOk(v2Src.indexOf('function isResponseV2') !== -1,
        'RequestBuilderV2 : isResponseV2 inchangé');
    assertEq((dbSrc.match(/category:\s*'/g) || []).length, 275,
        '275 règles locales toujours présentes (aucune modification)');
    assertOk(workerSrc.indexOf('temperature') !== -1,
        'les prompts/températures du Worker ne sont pas supprimés par A1');

    // main.js : les autres sources ne doivent pas être détournées
    var mainSrc = fs.readFileSync(MAIN_PATH, 'utf8');
    assertOk(mainSrc.indexOf("source: 'throttled'") !== -1,
        'le chemin throttled existant est conservé');
    assertOk(mainSrc.indexOf('remote_a22_fallback') !== -1 || mainSrc.indexOf('remote_unknown') !== -1,
        'le traitement des sources distantes est conservé');
    assertOk(mainSrc.indexOf('response.status === 401') !== -1,
        'la gestion 401 session expirée est conservée');

    // =============================================================
    console.log('\n' + '='.repeat(64));
    console.log('RÉSULTATS');
    console.log('='.repeat(64));
    console.log('  Total : ' + (pass + fail));
    console.log('  ✅ PASS : ' + pass);
    console.log('  ❌ FAIL : ' + fail);
    console.log('='.repeat(64));

    if (fail > 0) {
        console.log('\n❌ Certains tests ont échoué.\n');
        process.exit(1);
    } else {
        console.log('\n✅ Tous les tests passent !\n');
        process.exit(0);
    }
}).catch(function (err) {
    console.log('\n❌ EXCEPTION : ' + (err && err.stack ? err.stack : err));
    process.exit(1);
});
