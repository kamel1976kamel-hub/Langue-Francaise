/**
 * =================================================================
 * TESTS — RELIQUATS « setupRealTimeCorrection » SUPPRIMÉS
 * =================================================================
 * Contexte : les deux champs de réponse d'activité portaient un attribut
 *
 *   onload="setupRealTimeCorrection('${chapterId}', '${activityId}')"
 *
 * Cet attribut était DOUBLEMENT mort :
 *   1. `setupRealTimeCorrection` n'existe plus (elle vivait dans
 *      activities.js, supprimé au commit d95262b) ;
 *   2. un `<textarea>` n'émet AUCUN événement `load`, donc l'attribut
 *      n'était de toute façon jamais déclenché.
 *
 * Le lot E-2c a supprimé ces 2 attributs. Le présent test verrouille :
 *   - l'absence totale de `setupRealTimeCorrection` dans le code ;
 *   - l'absence de tout attribut `onload` sur les champs d'activité ;
 *   - la présence intacte des 7 hooks `writingAssistant.checkText(this)`
 *     et du hook `writingAssistant.toggleAudio()` (hors périmètre E-2c,
 *     volontairement conservés).
 *
 * Contrôle purement statique : aucun navigateur, aucun DOM simulé.
 * Tests en lecture seule : aucun fichier modifié, aucun déploiement.
 * =================================================================
 */

'use strict';

var fs = require('fs');
var path = require('path');

var INDEX_PATH = path.join(__dirname, '..', 'index.html');

var pass = 0;
var fail = 0;
var exceptions = [];

function assert(cond, label) {
    if (cond) { pass++; console.log('  [PASS] ' + label); }
    else { fail++; console.error('  [FAIL] ' + label); }
}

function assertEq(actual, expected, label) {
    if (actual === expected) { pass++; console.log('  [PASS] ' + label); }
    else {
        fail++;
        console.error('  [FAIL] ' + label);
        console.error('         attendu : ' + JSON.stringify(expected));
        console.error('         obtenu  : ' + JSON.stringify(actual));
    }
}

function section(name, fn) {
    console.log('\n--- ' + name + ' ---');
    try { fn(); }
    catch (e) {
        exceptions.push({ section: name, type: e.name, message: e.message });
        fail++;
        console.error('  [FAIL] exception : ' + e.name + ': ' + e.message);
    }
}

var src = fs.readFileSync(INDEX_PATH, 'utf8');
var lignes = src.split('\n');

function compter(motif) {
    var re = new RegExp(motif, 'g');
    return (src.match(re) || []).length;
}

/* =================================================================
 * T1 — Aucun setupRealTimeCorrection ne subsiste
 * ================================================================= */

section('T1 — setupRealTimeCorrection : 0 occurrence dans le code', function () {
    assertEq(compter('setupRealTimeCorrection'), 0,
        'aucune occurrence de « setupRealTimeCorrection » dans index.html');

    assertEq(compter('onload\\s*=\\s*"setupRealTimeCorrection'), 0,
        'aucun attribut onload="setupRealTimeCorrection…"');

    // Vérification nominative : les 2 anciennes lignes exactes ont disparu
    var anciennes = [
        "onload=\"setupRealTimeCorrection('${chapterId}', '${activityId}')\"",
        "onload=\"setupRealTimeCorrection('${chapterId}', '${id}')\""
    ];
    anciennes.forEach(function (a) {
        assertEq(src.indexOf(a), -1,
            'ligne supprimée absente : ' + a.substring(0, 60) + '…');
    });
});

/* =================================================================
 * T2 — Aucun attribut onload sur les champs d'activité
 * ================================================================= */

section('T2 — Aucun attribut onload résiduel', function () {
    assertEq(compter('onload='), 0,
        'aucun attribut « onload= » dans tout index.html');

    // Les 2 <textarea> d'activité : identifiés par « <textarea » suivi de leur id.
    // (Les 5 autres « id="activity-answer-…" sont des <div> de tableau.)
    var zones = [];
    lignes.forEach(function (l, i) {
        if (/<textarea\s*$/.test(l) &&
            /id="activity-answer-\$\{chapterId\}-\$\{(activityId|id)\}"/.test(lignes[i + 1] || '')) {
            zones.push(i + 2);
        }
    });
    assertEq(zones.length, 2,
        'les 2 <textarea> d\'activité sont présents (l.' + zones.join(', l.') + ')');

    // Chacun doit être suivi du oninput et non d'un onload
    zones.forEach(function (n) {
        var bloc = lignes.slice(n - 1, n + 8).join('\n');
        var avant = lignes.slice(Math.max(0, n - 12), n - 1).join('\n');
        assert(bloc.indexOf('onload') === -1,
            'l.' + n + ' : le <textarea> n\'a plus de « onload » qui suit');
        assert(avant.indexOf('onload') === -1,
            'l.' + n + ' : aucun « onload » dans les 12 lignes qui précèdent');
    });
});

/* =================================================================
 * T3 — Les hooks writingAssistant sont INTACTS (hors périmètre)
 * ================================================================= */

section('T3 — Hooks writingAssistant conservés (hors périmètre E-2c)', function () {
    assertEq(compter('window\\.writingAssistant && window\\.writingAssistant\\.checkText\\(this\\)'), 7,
        'les 7 hooks « checkText(this) » sont présents');

    assertEq(compter('window\\.writingAssistant && window\\.writingAssistant\\.toggleAudio\\(\\)'), 1,
        'le hook « toggleAudio() » est présent (1)');

    assertEq(compter('window\\.writingAssistant'), 16,
        'total « window.writingAssistant » = 16 (7×2 pour checkText + 1×2 pour toggleAudio)');
});

/* =================================================================
 * T4 — Les 2 champs conservent leurs attributs et boutons
 * ================================================================= */

section('T4 — Intégrité des 2 champs d\'activité', function () {
    assertEq(compter('id="activity-answer-'), 7,
        'les 7 occurrences de « id="activity-answer- » sont présentes (5 <div> de tableau + 2 <textarea>)');

    // Attributs structurels des 2 <textarea> d'activité uniquement :
    // le motif « rows="4" » suivi du placeholder d'activité distingue ces deux champs
    // du <textarea> d'annonce (qui porte aussi rows="4", hors périmètre E-2c).
    assertEq(compter('placeholder="Votre réponse\\.\\.\\."'), 2,
        'les 2 <textarea> d\'activité gardent leur placeholder');
    assertEq(compter('rows="4" \\s*\n\\s*placeholder="Votre réponse\\.\\.\\."'), 2,
        'les 2 <textarea> d\'activité gardent rows="4" + placeholder');

    // Boutons associés, hors périmètre E-2c : comptes inchangés
    assertEq(compter('onclick="analyzeActivityAnswer\\('), 1,
        'bouton « Analyser » intact');
    assertEq(compter('onclick="submitActivityWithV2\\('), 1,
        'bouton « Envoyer » intact');
    assertEq(compter('onclick="speakAnswerText\\('), 1,
        'bouton audio « Lire votre réponse » (speakAnswerText) intact');
    assertEq(compter('onclick="applyActivityCorrections\\('), 1,
        'bouton « Appliquer » intact');
    assertEq(compter('onclick="ignoreActivityCorrections\\('), 1,
        'bouton « Ignorer » intact');
});

/* =================================================================
 * T5 — Le bloc principal reste syntaxiquement sain
 * ================================================================= */

section('T5 — Structure du fichier préservée', function () {
    // Les 7 blocs <script> inline sont toujours là
    var blocs = 0;
    for (var i = 0; i < lignes.length; i++) {
        if (/<script(?![^>]*\ssrc=)[^>]*>/.test(lignes[i])) {
            for (var j = i + 1; j < lignes.length; j++) {
                if (/<\/script>/.test(lignes[j])) { blocs++; break; }
            }
        }
    }
    assertEq(blocs, 7, 'les 7 blocs <script> inline sont présents');

    // Les 2 </textarea> suivant les champs sont toujours là
    assert(/oninput="window\.writingAssistant && window\.writingAssistant\.checkText\(this\)"\s*\n\s*><\/textarea>/.test(src),
        'le 1er <textarea> se ferme directement après son oninput');
    assert(/oninput="window\.writingAssistant && window\.writingAssistant\.checkText\(this\)"\s*\n\s*><\/textarea>/.test(src),
        'le 2e <textarea> se ferme directement après son oninput');
});

/* =================================================================
 * RÉSUMÉ
 * ================================================================= */

var total = pass + fail;

console.log('\n' + '='.repeat(60));
console.log('RÉSULTATS — reliquats setupRealTimeCorrection');
console.log('  PASS : ' + pass);
console.log('  FAIL : ' + fail);
console.log('  TOTAL : ' + total);
if (exceptions.length > 0) {
    console.log('  EXCEPTIONS : ' + exceptions.length);
    exceptions.forEach(function (ex, i) {
        console.log('     ' + (i + 1) + '. [' + ex.section + '] ' + ex.type + ': ' + ex.message);
    });
} else {
    console.log('  EXCEPTIONS : 0');
}
console.log('='.repeat(60));

if (fail > 0) {
    console.error('\n' + fail + ' test(s) en échec');
    process.exit(1);
}
console.log('\nTous les tests passent !');
process.exit(0);
