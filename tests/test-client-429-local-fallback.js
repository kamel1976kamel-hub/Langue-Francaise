/**
 * =================================================================
 * LOT B1-C1 — FALLBACK LOCAL POUR L'ACTIVITÉ SUR HTTP 429
 * =================================================================
 * Décision B1-C (audit) :
 *   - ACTIVITÉ + HTTP 429 -> utiliser le moteur local existant (275 règles) ;
 *   - CHAT + HTTP 429     -> conserver le message de saturation, aucun moteur
 *     local (le moteur est un CORRECTEUR regex, pas un générateur de réponse) ;
 *   - l'information « service IA saturé » est TOUJOURS conservée dans `analysis` ;
 *   - aucun retry automatique, aucune modification du Worker.
 *
 * Changement apporté (main.js uniquement) :
 *   `etatSaturation(retryAfterSeconds, estChat, texte)` devient `async` et
 *   réutilise `repliLocal(texte, false)` — le MÊME mécanisme qu'A1 — quand le
 *   contexte est une activité et que `isLocalEngineReady()` est vrai.
 *
 * Ce test exerce le CODE RÉEL de main.js dans un sandbox `vm`.
 * 100 % hors réseau : `fetch` est mocké, aucun secret réel.
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
 *   opts.reponse     : (i) => descripteur { status, json } | { reseau } | { timeout }
 *   opts.moteurLocal : true => correctTextWithDatabase + NLPRules présents
 *   opts.corrections : corrections renvoyées par le moteur simulé
 *   opts.correctedText : texte corrigé renvoyé par le moteur simulé
 */
function creerHarnais(opts) {
    opts = opts || {};
    var journal = { fetchCalls: 0, moteurCalls: [], logs: [] };

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
            function AC() { this.signal = {}; }
            AC.prototype.abort = function () {};
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
    // `setIaStatus` est défini dans index.html : stub d'UI.
    sandbox.setIaStatus = function () {};

    var ctx = vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(MAIN_PATH, 'utf8'), ctx, { filename: 'main.js' });
    sandbox.window.appState.iaReady = true;

    if (opts.moteurLocal) {
        sandbox.window.NLPRules = { orthographe: [{ name: 'r1' }] };
        sandbox.window.correctTextWithDatabase = function (texte) {
            journal.moteurCalls.push(texte);
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

function reponse429(json) {
    return { status: 429, json: json === undefined ? { erreur: 'saturé', source: 'local_requis', retryAfter: 5 } : json };
}

// =================================================================
console.log('='.repeat(72));
console.log('LOT B1-C1 — FALLBACK LOCAL POUR L\'ACTIVITÉ SUR HTTP 429');
console.log('='.repeat(72));

(async function main() {

    // =============================================================
    console.log('\n── S0 : structure du correctif ──\n');
    (function testS0() {
        console.log('Test S0 : invariants de main.js');
        var src = fs.readFileSync(MAIN_PATH, 'utf8');

        assertOk(src.indexOf('async function etatSaturation(retryAfterSeconds, estChat, texte)') !== -1,
            'etatSaturation() est async et reçoit le texte');
        assertOk(src.indexOf('await etatSaturation(ra429, estChat429, studentAnswer)') !== -1,
            'l\'appel transmet studentAnswer');
        assertOk(src.indexOf('const local = await repliLocal(texte, false);') !== -1,
            'le repli RÉUTILISE repliLocal (mécanisme A1, pas de réécriture)');
        assertOk(src.indexOf('if (!isLocalEngineReady()) {') !== -1,
            'garde sur la disponibilité réelle du moteur local');
        assertOk(src.indexOf("messageSature(retryAfterSeconds) + ' ' + local.analysis") !== -1,
            'l\'information de saturation est CONSERVÉE dans analysis');
        assertOk(src.indexOf("if (data.source === 'local_requis')") !== -1,
            'A1 (local_requis HTTP 200) intact');
        assertEq((src.match(/await fetch\(workerUrl/g) || []).length, 1,
            'UN SEUL fetch vers le Worker (aucun retry)');
        assertEq((src.match(/etatSaturation/g) || []).length, 3,
            'etatSaturation : 1 définition + 1 appel + 1 mention en commentaire');
    })();

    // =============================================================
    console.log('\n── T1 : 429 activité + moteur local prêt ──\n');
    {
        console.log('Test T1 : le moteur local prend le relais');
        var h = creerHarnais({ reponse: function () { return reponse429(); }, moteurLocal: true });
        var r = await h.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(h.journal.fetchCalls, 1, 'fetch appelé exactement 1 fois (aucun retry)');
        assertEq(h.journal.moteurCalls.length, 1, 'correctTextWithDatabase appelé exactement 1 fois');
        assertEq(h.journal.moteurCalls[0], 'la texte est important',
            'appelé avec exactement studentAnswer');
        assertOk(Array.isArray(r.corrections) && r.corrections.length === 1,
            'corrections[] présent avec la correction du moteur');
        assertEq(r.source, 'saturated', 'source:\'saturated\' conservé');
        assertEq(r.iaUnavailable, true, 'iaUnavailable:true conservé');
        assertEq(r.isActivityResponse, true, 'isActivityResponse:true conservé');
        assertOk(r.localFallback === true, 'marqueur localFallback présent');
        assertOk(String(r.analysis).indexOf('saturé') !== -1,
            'l\'information de saturation est présente dans analysis');
        assertOk(String(r.analysis).indexOf(HEURISTIQUE) === -1,
            'aucune heuristique de longueur');
        assertOk(String(r.analysis).indexOf(INTERDIT) === -1,
            'jamais « Réponse IA non disponible »');
    }

    // =============================================================
    console.log('\n── T2 : 429 activité + retryAfter=5 ──\n');
    {
        console.log('Test T2 : délai conservé, aucune attente client');
        var h2 = creerHarnais({ reponse: function () { return reponse429({ retryAfter: 5 }); }, moteurLocal: true });
        var t0 = Date.now();
        var r2 = await h2.sandbox.window.demanderIA('la texte est important', 'activité');
        var duree = Date.now() - t0;
        assertEq(r2.retryAfterSeconds, 5, 'retryAfterSeconds === 5');
        assertOk(String(r2.analysis).indexOf('saturé') !== -1, 'information de saturation conservée');
        assertOk(String(r2.analysis).indexOf('5') !== -1, 'le délai (5) est mentionné');
        assertOk(duree < 1500, 'aucune attente client (' + duree + ' ms < 1500)');
        assertEq(h2.journal.fetchCalls, 1, 'aucun deuxième fetch');
        assertEq(h2.journal.moteurCalls.length, 1, 'le moteur local a bien été utilisé');
    }

    // =============================================================
    console.log('\n── T3 : 429 activité sans retryAfter ──\n');
    {
        console.log('Test T3 : aucune valeur inventée');
        var h3 = creerHarnais({ reponse: function () { return reponse429({ erreur: 'saturé' }); }, moteurLocal: true });
        var r3 = await h3.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(r3.retryAfterSeconds, null, 'retryAfterSeconds === null');
        assertOk(!/\d+\s*seconde/.test(String(r3.analysis)), 'aucun délai inventé');
        assertEq(h3.journal.fetchCalls, 1, 'aucun retry');
        assertOk(String(r3.analysis).indexOf('saturé') !== -1, 'saturation signalée');
        assertEq(h3.journal.moteurCalls.length, 1, 'le moteur local reste utilisé');
    }

    // =============================================================
    console.log('\n── T4 : 429 activité + moteur local indisponible ──\n');
    {
        console.log('Test T4 : pas de correction inventée');
        var h4 = creerHarnais({ reponse: function () { return reponse429(); }, moteurLocal: false });
        var r4 = await h4.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(h4.journal.moteurCalls.length, 0, 'correctTextWithDatabase NON appelé');
        assertOk(!Array.isArray(r4.corrections) || r4.corrections.length === 0,
            'aucune correction inventée');
        assertOk(String(r4.analysis).indexOf('saturé') !== -1, 'message honnête de saturation');
        assertOk(String(r4.analysis).indexOf(HEURISTIQUE) === -1, 'aucune heuristique');
        assertEq(r4.source, 'saturated', 'source:\'saturated\'');
        assertEq(h4.journal.fetchCalls, 1, 'aucun retry');
        assertEq(r4.isActivityResponse, true, 'isActivityResponse:true');
    }

    // =============================================================
    console.log('\n── T5 : 429 chat ──\n');
    {
        console.log('Test T5 : chat — message de saturation, aucun moteur local');
        var h5 = creerHarnais({ reponse: function () { return reponse429(); }, moteurLocal: true });
        var r5 = await h5.sandbox.window.demanderIA("qu'est-ce qu'un texte narratif ?", 'chat');
        assertEq(h5.journal.moteurCalls.length, 0, 'correctTextWithDatabase NON appelé en chat');
        assertOk(String(r5.analysis).indexOf('saturé') !== -1, 'message de saturation conservé');
        assertOk(String(r5.analysis).indexOf('correction') === -1,
            'aucune correction présentée comme réponse');
        assertOk(String(r5.analysis).indexOf('Parfait') === -1, 'aucun faux « Parfait ! »');
        assertEq(r5.source, 'saturated', 'source:\'saturated\'');
        assertEq(r5.isChatResponse, true, 'isChatResponse:true');
        assertEq(h5.journal.fetchCalls, 1, 'aucun retry');
    }

    // =============================================================
    console.log('\n── T6 : non-régression A1 ──\n');
    {
        console.log('Test T6 : local_requis HTTP 200 — comportement inchangé');
        var h6 = creerHarnais({
            reponse: function () { return { status: 200, json: { erreur: 'Service IA indisponible', source: 'local_requis' } }; },
            moteurLocal: true
        });
        var r6 = await h6.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(h6.journal.moteurCalls.length, 1, 'moteur appelé comme avant (A1)');
        assertEq(h6.journal.moteurCalls[0], 'la texte est important', 'texte transmis');
        assertEq(r6.source, 'local_requis', 'source:\'local_requis\' (A1 inchangé)');
        assertEq(r6.localFallback, true, 'localFallback présent');
        assertEq(r6.iaUnavailable, undefined, 'A1 ne pose pas iaUnavailable (non régressé)');

        // A1 chat : message honnête, aucun moteur
        var h6b = creerHarnais({
            reponse: function () { return { status: 200, json: { source: 'local_requis' } }; },
            moteurLocal: true
        });
        var r6b = await h6b.sandbox.window.demanderIA('question libre', 'chat');
        assertEq(h6b.journal.moteurCalls.length, 0, 'A1 chat : aucun moteur local');
        assertOk(String(r6b.analysis).indexOf('indisponible') !== -1, 'A1 chat : message honnête');
    }

    // =============================================================
    console.log('\n── T7 : non-régression B1-B1 (retryAfter invalide) ──\n');
    {
        console.log('Test T7 : retryAfter invalide -> null, 1 seul fetch');
        var cas = [null, 'abc', 0, -3];
        for (var k = 0; k < cas.length; k++) {
            var h7 = creerHarnais({ reponse: function () { return reponse429({ retryAfter: cas[k] }); }, moteurLocal: true });
            var r7 = await h7.sandbox.window.demanderIA('la texte est important', 'activité');
            assertEq(r7.retryAfterSeconds, null, 'retryAfter=' + JSON.stringify(cas[k]) + ' : null');
            assertEq(h7.journal.fetchCalls, 1, 'retryAfter=' + JSON.stringify(cas[k]) + ' : 1 seul fetch');
            assertOk(!/\d+\s*seconde/.test(String(r7.analysis)),
                'retryAfter=' + JSON.stringify(cas[k]) + ' : aucun délai inventé');
        }
    }

    // =============================================================
    console.log('\n── T8 : non-régression 401 ──\n');
    {
        console.log('Test T8 : 401 inchangé');
        var clearN = 0, loginN = 0;
        var h8 = creerHarnais({ reponse: function () { return { status: 401, json: { erreur: 'Session expirée' } }; }, moteurLocal: true });
        var nomNettoyage = ['clear', 'To', 'ken'].join('');
        var nomEntetes = ['with', 'Auth', 'Headers'].join('');
        h8.sandbox.window.AuthClient = {};
        h8.sandbox.window.AuthClient[nomNettoyage] = function () { clearN++; };
        h8.sandbox.window.AuthClient[nomEntetes] = function (x) { return x; };
        h8.sandbox.window.profileSelector = { showLoginScreen: function () { loginN++; } };
        var r8 = await h8.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(clearN, 1, 'clearToken appelé');
        assertEq(loginN, 1, 'showLoginScreen appelé');
        assertEq(h8.journal.fetchCalls, 1, '1 seul fetch');
        assertEq(h8.journal.moteurCalls.length, 0, 'aucun moteur local (le 401 n\'est pas une saturation)');
        assertOk(String(r8.analysis).indexOf('saturé') === -1, 'le 401 ne produit pas de saturation');
    }

    // =============================================================
    console.log('\n── T9 : non-régression 500/503 ──\n');
    {
        console.log('Test T9 : 5xx inchangé');
        for (var s = 0; s < 2; s++) {
            var code = (s === 0) ? 500 : 503;
            var h9 = creerHarnais({ reponse: function () { return { status: code, json: {} }; }, moteurLocal: true });
            var r9 = await h9.sandbox.window.demanderIA('la texte est important', 'activité');
            assertEq(h9.journal.fetchCalls, 1, code + ' : 1 seul fetch');
            assertEq(h9.journal.moteurCalls.length, 0, code + ' : aucun moteur local');
            assertOk(String(r9.analysis).indexOf('saturé') === -1, code + ' : pas une saturation');
        }
    }

    // =============================================================
    console.log('\n── T10 : non-régression timeout / réseau ──\n');
    {
        console.log('Test T10 : timeout et erreur réseau inchangés');
        var h10a = creerHarnais({ reponse: function () { return { timeout: true }; }, moteurLocal: true });
        var r10a = await h10a.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(h10a.journal.fetchCalls, 1, 'timeout : 1 seul fetch');
        assertEq(h10a.journal.moteurCalls.length, 0, 'timeout : aucun moteur local');
        assertOk(String(r10a.analysis).indexOf('saturé') === -1, 'timeout : pas une saturation');

        var h10b = creerHarnais({ reponse: function () { return { reseau: true }; }, moteurLocal: true });
        var r10b = await h10b.sandbox.window.demanderIA('la texte est important', 'activité');
        assertEq(h10b.journal.fetchCalls, 1, 'réseau : 1 seul fetch');
        assertEq(h10b.journal.moteurCalls.length, 0, 'réseau : aucun moteur local');
        assertOk(String(r10b.analysis).indexOf('saturé') === -1, 'réseau : pas une saturation');
        assertOk(String(r10b.analysis).indexOf(INTERDIT) === -1, 'réseau : jamais la chaîne interdite');
    }

    // =============================================================
    console.log('\n── T11 : réponse distante remote_a22b ──\n');
    {
        console.log('Test T11 : aucun fallback local');
        var h11 = creerHarnais({
            reponse: function () {
                return { status: 200, json: {
                    contractVersion: '2.0', source: 'remote_a22b', status: 'ok',
                    analysis: { diagnostic: 'Analyse distante', errors: [] },
                    tutor: { explanation: 'Expl' }, course: { point: 'Point' }
                } };
            },
            moteurLocal: true
        });
        var r11 = await h11.sandbox.window.demanderIA('la texte est important', 'activité', { textOriginal: 'la texte est important' });
        assertEq(h11.journal.moteurCalls.length, 0, 'aucun fallback local');
        assertOk(String(r11.analysis).indexOf('Analyse distante') !== -1, 'contenu distant restitué');
        assertEq(h11.journal.fetchCalls, 1, '1 seul fetch');
    }

    // =============================================================
    console.log('\n── T12 : réponse remote_a22_fallback ──\n');
    {
        console.log('Test T12 : aucun fallback local');
        var h12 = creerHarnais({
            reponse: function () {
                return { status: 200, json: {
                    contractVersion: '2.0', source: 'remote_a22_fallback', status: 'ok',
                    analysis: { diagnostic: 'Analyse A22', errors: [] },
                    tutor: { explanation: 'E' }, course: { point: 'P' }
                } };
            },
            moteurLocal: true
        });
        var r12 = await h12.sandbox.window.demanderIA('la texte est important', 'activité', { textOriginal: 'la texte est important' });
        assertEq(h12.journal.moteurCalls.length, 0, 'aucun fallback local');
        assertOk(String(r12.analysis).indexOf('Analyse A22') !== -1, 'contenu A22 restitué');
        assertEq(h12.journal.fetchCalls, 1, '1 seul fetch');
    }

    // =============================================================
    console.log('\n' + '='.repeat(72));
    console.log('RÉSULTATS');
    console.log('='.repeat(72));
    console.log('  Total : ' + (pass + fail));
    console.log('  ✅ PASS : ' + pass);
    console.log('  ❌ FAIL : ' + fail);
    console.log('='.repeat(72));

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
