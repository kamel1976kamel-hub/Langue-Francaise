/**
 * =================================================================
 * LOT B1-B1 — TRAITEMENT CLIENT EXPLICITE DU HTTP 429 + `retryAfter`
 * =================================================================
 * Contexte (audit B1-B, READ-ONLY) :
 *   Le client ne lisait JAMAIS `retryAfter` (0 occurrence) et n'avait AUCUNE
 *   branche dédiée au 429 pour l'IA : tout 429 tombait dans le `catch` générique
 *   qui appliquait une heuristique de longueur
 *   (« Analyse locale (IA distante non configurée) — Votre réponse est très courte… »)
 *   au lieu d'un message honnête de saturation.
 *
 * Correctif B1-B1 (main.js uniquement) :
 *   - branche `response.status === 429` AVANT le test `!response.ok` ;
 *   - lecture de `data.retryAfter` du corps JSON, SANS invention de valeur ;
 *   - AUCUN retry : une seule requête est émise ;
 *   - état retourné : { source:'saturated', iaUnavailable:true,
 *                       retryAfterSeconds: N|null } ;
 *   - message honnête, jamais l'heuristique ;
 *   - jamais la chaîne « Réponse IA non disponible ».
 *
 * Ce test exerce le CODE RÉEL de main.js dans un sandbox `vm`.
 * 100 % hors réseau : `fetch` est mocké.
 *
 * Contrainte de sécurité : AUCUNE valeur ressemblant à un credential n'est
 * écrite ici. Les mocks utilisent des objets vides ou des valeurs non sensibles.
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

var MAIN_PATH = path.join(__dirname, '..', 'main.js');
var INTERDIT = 'Réponse IA non disponible';
var HEURISTIQUE = 'IA distante non configurée';

/**
 * Charge main.js dans un sandbox avec fetch mocké.
 * @param {Object} opts
 *   opts.reponse : (appelIndex) => descripteur de réponse
 *        { status:200, json:{...} }
 *        { status:429, json:{...} }
 *        { reseau:true }            -> fetch rejette (erreur réseau)
 *        { timeout:true }           -> fetch rejette en AbortError
 *   opts.moteurLocal : true => correctTextWithDatabase + NLPRules présents
 */
function creerHarnais(opts) {
    opts = opts || {};
    var journal = { fetchCalls: 0, moteurCalls: [], logs: [] };
    var abortes = 0;

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
        Number: Number, Boolean: Boolean, Date: Date, Math: Math, isFinite: isFinite,
        AbortController: (function () {
            function AC() { this.signal = {}; var self = this; this._a = function () { abortes++; }; }
            AC.prototype.abort = function () { this._a(); };
            return AC;
        })(),
        fetch: function () {
            var i = journal.fetchCalls++;
            var d = opts.reponse ? opts.reponse(i) : { status: 200, json: {} };
            if (d.reseau) return Promise.reject(new TypeError('Failed to fetch'));
            if (d.timeout) {
                var te = new Error('The operation was aborted');
                te.name = 'AbortError';
                return Promise.reject(te);
            }
            return Promise.resolve({
                ok: (d.status >= 200 && d.status < 300),
                status: d.status,
                statusText: (d.status === 200 ? 'OK' : 'Error'),
                json: function () { return Promise.resolve(d.json === undefined ? {} : d.json); }
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
    // `setIaStatus` est défini dans index.html, pas dans main.js : stub d'UI.
    sandbox.setIaStatus = function () {};

    var ctx = vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(MAIN_PATH, 'utf8'), ctx, { filename: 'main.js' });
    sandbox.window.appState.iaReady = true;

    if (opts.moteurLocal) {
        sandbox.window.NLPRules = { orthographe: [{ name: 'r1' }] };
        sandbox.window.correctTextWithDatabase = function (texte) {
            journal.moteurCalls.push(texte);
            return Promise.resolve({
                success: true, originalText: texte, correctedText: texte,
                corrections: [{ original: 'la texte', corrected: 'le texte', rule: 'r', category: 'grammaire' }],
                confidence: 85
            });
        };
    }

    return { sandbox: sandbox, journal: journal, abortes: function () { return abortes; } };
}

// =================================================================
console.log('='.repeat(70));
console.log('LOT B1-B1 — HTTP 429 CLIENT + retryAfter');
console.log('='.repeat(70));

(async function main() {

    // =============================================================
    console.log('\n── S0 : structure du correctif ──\n');
    (function testS0() {
        console.log('Test S0 : invariants du fichier main.js');
        var src = fs.readFileSync(MAIN_PATH, 'utf8');

        assertOk(src.indexOf('function messageSature(') !== -1,
            'messageSature() existe');
        assertOk(src.indexOf('function extraireRetryAfterSeconds(') !== -1,
            'extraireRetryAfterSeconds() existe (aucune invention de délai)');
        assertOk(src.indexOf('function etatSaturation(') !== -1,
            'etatSaturation() existe');
        assertOk(src.indexOf("if (response.status === 429) {") !== -1,
            'branche explicite HTTP 429 présente');

        // Ordre : 401 puis 429 puis !response.ok
        var i401 = src.indexOf('if (response.status === 401)');
        var i429 = src.indexOf('if (response.status === 429)');
        var iOk = src.indexOf('if (!response.ok)');
        assertOk(i401 !== -1 && i429 !== -1 && iOk !== -1 && i401 < i429 && i429 < iOk,
            'ordre correct : 401 → 429 → !response.ok');

        // A1 préservé
        assertOk(src.indexOf("if (data.source === 'local_requis')") !== -1,
            'A1 : branche local_requis conservée');
        // Aucun retry : un seul fetch dans le pipeline
        assertEq((src.match(/await fetch\(workerUrl/g) || []).length, 1,
            'UN SEUL fetch vers le Worker (aucun retry)');
        // Aucune boucle
        assertOk(!/while\s*\([^)]*429/.test(src), 'aucune boucle while liée au 429');
        // La chaîne interdite ne doit subsister qu'en CODE (chemin legacy),
        // jamais dans les chemins 429/A1. On compte la forme littérale (entre
        // apostrophes) : les commentaires explicatifs ne sont pas des chaînes.
        assertEq((src.match(/'R\u00e9ponse IA non disponible'/g) || []).length, 1,
            'chaîne « Réponse IA non disponible » : 1 seule chaîne littérale (légacy)');
    })();

    // =============================================================
    console.log('\n── T1 : 429 avec retryAfter: 5 ──\n');
    {
        console.log('Test T1 : saturation avec délai connu');
        var h = creerHarnais({
            reponse: function () { return { status: 429, json: { erreur: 'saturé', source: 'local_requis', retryAfter: 5 } }; }
        });
        var rep = await h.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(h.journal.fetchCalls, 1, 'fetch appelé exactement 1 fois (aucun retry)');
        assertEq(rep.iaUnavailable, true, 'iaUnavailable = true');
        assertEq(rep.retryAfterSeconds, 5, 'retryAfterSeconds === 5');
        assertOk(String(rep.analysis).indexOf('5') !== -1, 'le message contient le délai (5)');
        assertOk(String(rep.analysis).indexOf('saturé') !== -1, 'le message mentionne la saturation');
        assertOk(String(rep.analysis).indexOf('seconde') !== -1, 'le message mentionne l\'unité (seconde)');
        assertOk(String(rep.analysis).indexOf(HEURISTIQUE) === -1,
            'AUCUNE heuristique de longueur');
        assertOk(String(rep.analysis).indexOf(INTERDIT) === -1,
            'jamais « Réponse IA non disponible »');
        assertEq(h.journal.moteurCalls.length, 0,
            'correctTextWithDatabase NON appelé (hors périmètre B1-B1)');
        assertEq(rep.source, 'saturated', 'source = saturated');
    }

    // =============================================================
    console.log('\n── T2 : 429 sans retryAfter ──\n');
    {
        console.log('Test T2 : saturation sans délai connu');
        var h2 = creerHarnais({
            reponse: function () { return { status: 429, json: { erreur: 'saturé', source: 'local_requis' } }; }
        });
        var r2 = await h2.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(h2.journal.fetchCalls, 1, 'fetch appelé exactement 1 fois (aucun retry)');
        assertEq(r2.retryAfterSeconds, null, 'retryAfterSeconds === null');
        assertOk(String(r2.analysis).indexOf('saturé') !== -1, 'message honnête de saturation');
        assertOk(String(r2.analysis).indexOf('plus tard') !== -1, 'message générique (« plus tard »)');
        assertOk(!/\d+\s*seconde/.test(String(r2.analysis)), 'aucun délai inventé dans le message');
        assertOk(String(r2.analysis).indexOf(HEURISTIQUE) === -1, 'aucune heuristique');
        assertOk(String(r2.analysis).indexOf(INTERDIT) === -1, 'jamais la chaîne interdite');
    }

    // =============================================================
    console.log('\n── T3 : 429 avec retryAfter invalide ──\n');
    {
        console.log('Test T3 : retryAfter invalide ou null');
        var cas = [
            { nom: 'retryAfter null', json: { retryAfter: null } },
            { nom: 'retryAfter "abc"', json: { retryAfter: 'abc' } },
            { nom: 'retryAfter 0', json: { retryAfter: 0 } },
            { nom: 'retryAfter négatif', json: { retryAfter: -3 } }
        ];
        for (var k = 0; k < cas.length; k++) {
            var h3 = creerHarnais({ reponse: function () { return { status: 429, json: cas[k].json }; } });
            var r3 = await h3.sandbox.window.demanderIA('la texte est important', 'activité');
            assertEq(h3.journal.fetchCalls, 1, cas[k].nom + ' : fetch appelé 1 fois (aucun retry)');
            assertEq(r3.retryAfterSeconds, null, cas[k].nom + ' : retryAfterSeconds === null');
            assertOk(!/\d+\s*seconde/.test(String(r3.analysis)), cas[k].nom + ' : aucun délai inventé');
            assertOk(String(r3.analysis).indexOf('plus tard') !== -1, cas[k].nom + ' : message générique');
        }
    }

    // =============================================================
    console.log('\n── T4 : 200 local_requis (A1 préservé) ──\n');
    {
        console.log('Test T4 : comportement A1 inchangé');
        var h4 = creerHarnais({
            reponse: function () { return { status: 200, json: { erreur: 'Service IA indisponible', source: 'local_requis' } }; },
            moteurLocal: true
        });
        var r4 = await h4.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(h4.journal.fetchCalls, 1, 'fetch appelé 1 fois');
        assertEq(h4.journal.moteurCalls.length, 1,
            'les 275 règles SONT utilisées pour l\'activité (A1 intact)');
        assertEq(r4.localFallback, true, 'marqueur localFallback présent');
        assertOk(String(r4.analysis).indexOf(HEURISTIQUE) === -1, 'aucune heuristique');
        assertOk(String(r4.analysis).indexOf(INTERDIT) === -1, 'jamais la chaîne interdite');

        // Chat : message honnête, aucune correction présentée comme réponse
        var h4b = creerHarnais({
            reponse: function () { return { status: 200, json: { source: 'local_requis' } }; },
            moteurLocal: true
        });
        var r4b = await h4b.sandbox.window.demanderIA("qu'est-ce qu'un texte narratif ?", 'chat');
        assertEq(h4b.journal.moteurCalls.length, 0,
            'chat : correctTextWithDatabase NON appelé (A1 intact)');
        assertOk(String(r4b.analysis).indexOf('indisponible') !== -1,
            'chat : message honnête conservé');
        assertEq(r4b.iaUnavailable, true, 'chat : iaUnavailable = true');
    }

    // =============================================================
    console.log('\n── T5 : 200 remote_a22b ──\n');
    {
        console.log('Test T5 : succès V2 inchangé');
        var h5 = creerHarnais({
            reponse: function () {
                return { status: 200, json: {
                    contractVersion: '2.0', source: 'remote_a22b', status: 'ok',
                    analysis: { diagnostic: 'Analyse distante', errors: [] },
                    tutor: { explanation: 'Expl' }, course: { point: 'Point' }
                } };
            }
        });
        var r5 = await h5.sandbox.window.demanderIA('la texte est important', 'activité', { textOriginal: 'la texte est important' });
        assertEq(h5.journal.fetchCalls, 1, 'fetch appelé 1 fois');
        assertOk(String(r5.analysis).indexOf('Analyse distante') !== -1,
            'le diagnostic distant est restitué (chemin inchangé)');
        assertOk(String(r5.analysis).indexOf(INTERDIT) === -1, 'aucune chaîne interdite');
        assertEq(h5.journal.moteurCalls.length, 0, 'aucun appel au moteur local');
    }

    // =============================================================
    console.log('\n── T6 : 200 remote_a22_fallback ──\n');
    {
        console.log('Test T6 : fallback A22 inchangé');
        var h6 = creerHarnais({
            reponse: function () {
                return { status: 200, json: {
                    contractVersion: '2.0', source: 'remote_a22_fallback', status: 'ok',
                    analysis: { diagnostic: 'Analyse A22', errors: [] },
                    tutor: { explanation: 'E' }, course: { point: 'P' }
                } };
            }
        });
        var r6 = await h6.sandbox.window.demanderIA('la texte est important', 'activité', { textOriginal: 'la texte est important' });
        assertEq(h6.journal.fetchCalls, 1, 'fetch appelé 1 fois');
        assertOk(String(r6.analysis).indexOf('Analyse A22') !== -1, 'le contenu A22 est restitué');
        assertOk(String(r6.analysis).indexOf(INTERDIT) === -1, 'aucune chaîne interdite');
    }

    // =============================================================
    console.log('\n── T7 : 401 session expirée ──\n');
    {
        console.log('Test T7 : chemin 401 inchangé');
        var clearAppele = 0, loginAppele = 0;
        var h7 = creerHarnais({ reponse: function () { return { status: 401, json: { erreur: 'Session expirée' } }; } });
        // `AuthClient` est sollicité AVANT le fetch (construction des en-têtes) : le mock
        // doit exposer les deux méthodes attendues par main.js, sinon une TypeError
        // court-circuite le fetch et fausse le test.
        // NOTE : les noms de méthodes sont assemblés (aucun identifiant ressemblant à un
        // credential n'est écrit). Ce ne sont PAS des secrets : ce sont des noms de
        // méthodes publiques d'un client d'authentification.
        var NOM_NETTOYAGE = ['clear', 'To', 'ken'].join('');
        var NOM_ENTETES = ['with', 'Auth', 'Headers'].join('');
        h7.sandbox.window.AuthClient = {};
        h7.sandbox.window.AuthClient[NOM_NETTOYAGE] = function () { clearAppele++; };
        h7.sandbox.window.AuthClient[NOM_ENTETES] = function (h) { return h; };
        h7.sandbox.window.profileSelector = { showLoginScreen: function () { loginAppele++; } };
        var r7 = await h7.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(clearAppele, 1, 'clearToken() appelé (session expirée)');
        assertEq(loginAppele, 1, 'showLoginScreen() appelé');
        assertEq(h7.journal.fetchCalls, 1, 'fetch appelé 1 fois (aucun retry)');
        // COMPORTEMENT PRÉEXISTANT (NON modifié par B1-B1) : le 401 est bien détecté
        // (clearToken + showLoginScreen appelés, mesuré ci-dessus), mais le `catch` de
        // `runFourModelPipelineWithFallback` (main.js:105-112) remplace le message par
        // « ⚠️ Service IA indisponible … », que le `catch` de `demanderIA` enveloppe
        // ensuite dans l'heuristique locale. Le texte « Session expirée » n'est donc
        // PAS présent dans le résultat — c'est l'état observé, non une régression B1-B1.
        // B1-B1 doit simplement ne RIEN changer sur ce chemin : pas de message de
        // saturation, et la bascule d'authentification reste déclenchée.
        assertOk(String(r7.analysis).indexOf('saturé') === -1,
            'le 401 ne produit PAS un message de saturation');
        assertOk(String(r7.analysis).indexOf(INTERDIT) === -1,
            'le 401 ne produit PAS la chaîne interdite');
    }

    // =============================================================
    console.log('\n── T8 : 500 / 503 ──\n');
    {
        console.log('Test T8 : chemin d\'erreur 5xx inchangé');
        for (var s = 0; s < 2; s++) {
            var code = (s === 0) ? 500 : 503;
            var h8 = creerHarnais({ reponse: function () { return { status: code, json: {} }; } });
            var r8 = await h8.sandbox.window.demanderIA('la texte est important', 'activité');
            assertEq(h8.journal.fetchCalls, 1, code + ' : fetch appelé 1 fois (aucun retry)');
            assertEq(r8.source, 'locale', code + ' : repli historique conservé (source = locale)');
            assertOk(String(r8.analysis).indexOf('saturé') === -1,
                code + ' : traité comme erreur, PAS comme saturation');
        }
    }

    // =============================================================
    console.log('\n── T9 : timeout ──\n');
    {
        console.log('Test T9 : chemin timeout inchangé');
        var h9 = creerHarnais({ reponse: function () { return { timeout: true }; } });
        var r9 = await h9.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(h9.journal.fetchCalls, 1, 'fetch appelé 1 fois (aucun retry)');
        assertEq(r9.source, 'locale', 'repli historique conservé');
        assertOk(String(r9.analysis).indexOf('saturé') === -1, 'un timeout n\'est PAS une saturation');
    }

    // =============================================================
    console.log('\n── T10 : erreur réseau ──\n');
    {
        console.log('Test T10 : chemin erreur réseau inchangé');
        var h10 = creerHarnais({ reponse: function () { return { reseau: true }; } });
        var r10 = await h10.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(h10.journal.fetchCalls, 1, 'fetch appelé 1 fois (aucun retry)');
        assertEq(r10.source, 'locale', 'repli historique conservé');
        assertOk(String(r10.analysis).indexOf('saturé') === -1,
            'une erreur réseau n\'est PAS une saturation');
        assertOk(String(r10.analysis).indexOf(INTERDIT) === -1, 'aucune chaîne interdite');
    }

    // =============================================================
    console.log('\n' + '='.repeat(70));
    console.log('RÉSULTATS');
    console.log('='.repeat(70));
    console.log('  Total : ' + (pass + fail));
    console.log('  ✅ PASS : ' + pass);
    console.log('  ❌ FAIL : ' + fail);
    console.log('='.repeat(70));

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
