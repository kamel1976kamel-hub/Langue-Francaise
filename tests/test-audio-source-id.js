/**
 * =================================================================
 * TESTS — COLLISION sourceId audio (readText / speakChatAIResponse)
 * =================================================================
 * Contexte : `readText` (bloc inline principal, ~l.670) et
 * `speakChatAIResponse` (~l.6450) construisaient leur `sourceId` ainsi :
 *
 *   'chat-ai-response-' + text.substring(0, 20).replace(/\s+/g, '-').toLowerCase()
 *
 * Deux messages distincts dont les 20 premiers caractères sont identiques
 * obtenaient donc le MÊME identifiant. Les 6 messages de bienvenue statiques
 * de index.html partageaient en particulier l'identifiant
 * « chat-ai-response-bienvenue-dans-le-mo », ce qui fait que le clic sur le
 * bouton audio d'un module pouvait arrêter la lecture en cours sans lancer
 * la nouvelle (branche toggle prise à tort).
 *
 * Correctif évalué (lot dédié) :
 *
 *   'chat-ai-response-' + text
 *
 * Approche des tests : les expressions réelles de `sourceId` sont EXTRAITES
 * de index.html et évaluées, jamais recopiées en dur. De même, les 6 textes
 * de bienvenue sont lus DEPUIS index.html. Le test échoue donc sur l'état
 * d'avant correction et passe après.
 *
 * Les tests purement calculatoires ne nécessitent aucun navigateur.
 *
 * Tests en lecture seule : aucun fichier modifié, aucun déploiement.
 * =================================================================
 */

'use strict';

var fs = require('fs');
var path = require('path');

var INDEX = path.join(__dirname, '..', 'index.html');

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

function assertNe(actual, other, label) {
    if (actual !== other) { pass++; console.log('  [PASS] ' + label); }
    else {
        fail++;
        console.error('  [FAIL] ' + label);
        console.error('         les deux identifiants valent : ' + JSON.stringify(actual));
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

var src = fs.readFileSync(INDEX, 'utf8');
var lines = src.split('\n');

/* -----------------------------------------------------------------
 * Extraction des constructions de sourceId réellement présentes
 * ----------------------------------------------------------------- */

/** Renvoie [{ligne, expr}] pour chaque `const sourceId = <expr>;` */
function extraireConstructions() {
    var out = [];
    lines.forEach(function (l, i) {
        var m = /^\s*const sourceId = (.+);\s*$/.exec(l);
        if (m) { out.push({ ligne: i + 1, expr: m[1], texte: l }); }
    });
    return out;
}

var constructions = extraireConstructions();

/**
 * Compile une expression d'index.html en fonction de `text`.
 * L'expression est utilisée TELLE QUELLE : aucune réécriture.
 */
function compileurTexte(expr) {
    // eslint-disable-next-line no-new-func
    return new Function('text', 'return (' + expr + ');');
}

/** Compile une expression en fonction de (chapterId, activityId). */
function compileurChapitre(expr) {
    // eslint-disable-next-line no-new-func
    return new Function('chapterId', 'activityId', 'return (' + expr + ');');
}

var chatExprs = constructions.filter(function (c) {
    return c.expr.indexOf('chat-ai-response-') !== -1;
});
var autresExprs = constructions.filter(function (c) {
    return c.expr.indexOf('chat-ai-response-') === -1;
});

/* -----------------------------------------------------------------
 * Extraction des 6 messages de bienvenue statiques de index.html
 * ----------------------------------------------------------------- */

/**
 * Texte littéral du <p> qui précède immédiatement un bouton
 * `speakChatAIResponse(this)`. Les <p> contenant une interpolation `${...}`
 * (rendus dynamiques) sont exclus : seuls les textes statiques comptent.
 */
function extraireTextesStatiques() {
    var out = [];
    lines.forEach(function (l, i) {
        if (!/<p class="text-sm flex-1"/.test(l)) { return; }
        var suite = lines.slice(i + 1, i + 8).join(' ');
        if (!/onclick="speakChatAIResponse\(this\)"/.test(suite)) { return; }
        var m = /<p class="text-sm flex-1"[^>]*>([^<]*)<\/p>/.exec(l);
        if (!m) { return; }
        var t = m[1];
        if (t.indexOf('${') !== -1) { return; }
        if (!t.trim()) { return; }
        out.push({ ligne: i + 1, texte: t });
    });
    return out;
}

var textesStatiques = extraireTextesStatiques();

/* -----------------------------------------------------------------
 * Extraction des welcomeMessage de discussionData
 * ----------------------------------------------------------------- */

function extraireWelcomeMessages() {
    var out = [];
    lines.forEach(function (l, i) {
        var m = /welcomeMessage:\s*"((?:[^"\\]|\\.)*)"/.exec(l);
        if (m) { out.push({ ligne: i + 1, texte: m[1].replace(/\\"/g, '"') }); }
    });
    return out;
}

var welcomeMessages = extraireWelcomeMessages();

/* =================================================================
 * 0. PRÉALABLE — les constructions attendues ont été trouvées
 * ================================================================= */

section('0. Préalable — localisation des constructions', function () {
    assertEq(constructions.length, 6,
        '6 constructions de sourceId présentes dans index.html');
    assertEq(chatExprs.length, 2,
        'exactement 2 constructions « chat-ai-response- » (readText + speakChatAIResponse)');
    assertEq(autresExprs.length, 4,
        'exactement 4 constructions pour les autres familles');
    assert(chatExprs.length === 2 && chatExprs[0].expr === chatExprs[1].expr,
        'les 2 constructions « chat-ai-response- » sont strictement identiques');
    assertEq(textesStatiques.length, 6,
        '6 messages de bienvenue statiques extraits du HTML');
    assertEq(welcomeMessages.length, 6,
        '6 welcomeMessage extraits de discussionData');
});

/* =================================================================
 * 1. LES 6 MESSAGES STATIQUES → 6 sourceId DISTINCTS
 * ================================================================= */

section('1. Les 6 messages de bienvenue donnent 6 sourceId distincts', function () {
    var f = compileurTexte(chatExprs[0].expr);
    var ids = textesStatiques.map(function (t) { return f(t.texte); });
    var uniques = new Set(ids);

    assertEq(uniques.size, 6,
        '6 identifiants distincts pour les 6 messages de bienvenue');

    // Diagnostic : si collision, nommer les messages fautifs
    if (uniques.size !== 6) {
        var groupes = {};
        ids.forEach(function (id, i) {
            groupes[id] = groupes[id] || [];
            groupes[id].push('l.' + textesStatiques[i].ligne);
        });
        Object.keys(groupes).forEach(function (k) {
            if (groupes[k].length > 1) {
                console.error('         COLLISION : ' + JSON.stringify(k));
                console.error('           → ' + groupes[k].join(', '));
            }
        });
    }
});

/* =================================================================
 * 2. DEUX TEXTES DIFFÉRENTS PARTAGEANT LES 20 PREMIERS CARACTÈRES
 * ================================================================= */

section('2. Textes différents partageant les 20 premiers caractères', function () {
    var f = compileurTexte(chatExprs[0].expr);
    var a = "Très bien ! Votre réponse est correcte et vous avez bien utilisé le passé composé.";
    var b = "Très bien ! Votre réponse est correcte mais attention aux accords.";
    assertEq(a.substring(0, 20), b.substring(0, 20),
        'préalable : les deux textes partagent bien leurs 20 premiers caractères');
    assertNe(f(a), f(b),
        'deux textes à préfixe de 20 car. commun produisent des identifiants distincts');
});

/* =================================================================
 * 3. DEUX TEXTES DIFFÉRENTS PARTAGEANT UN PRÉFIXE PLUS LONG
 * ================================================================= */

section('3. Textes différents partageant un préfixe plus long', function () {
    var f = compileurTexte(chatExprs[0].expr);
    var a = "Excellent travail ! La structure de votre texte est claire et bien organisée.";
    var b = "Excellent travail ! La structure de votre texte est claire et bien rythmée.";
    var prefixe = 0;
    while (prefixe < Math.min(a.length, b.length) && a[prefixe] === b[prefixe]) { prefixe++; }
    assert(prefixe >= 40,
        'préalable : le préfixe commun dépasse 40 caractères (' + prefixe + ')');
    assertNe(f(a), f(b),
        'deux textes à préfixe commun de ' + prefixe + ' car. produisent des identifiants distincts');

    // Variante longue : préfixe commun de plus de 80 caractères
    var c = 'Bravo pour ce travail très soigné et particulièrement pertinent dans son ensemble : la première partie est claire, la seconde est précise, la troisième est complète.';
    var d = 'Bravo pour ce travail très soigné et particulièrement pertinent dans son ensemble : la première partie est claire, la seconde est précise, la troisième est à revoir.';
    var p2 = 0;
    while (p2 < Math.min(c.length, d.length) && c[p2] === d[p2]) { p2++; }
    assert(p2 >= 100, 'préalable : préfixe commun de ' + p2 + ' caractères');
    assertNe(f(c), f(d),
        'deux textes à préfixe commun de ' + p2 + ' car. produisent des identifiants distincts');
});

/* =================================================================
 * 4. DEUX TEXTES STRICTEMENT IDENTIQUES → MÊME IDENTIFIANT
 *    (exigence du toggle : même source ⇒ même identifiant)
 * ================================================================= */

section('4. Textes identiques → même identifiant (déterminisme)', function () {
    var f = compileurTexte(chatExprs[0].expr);
    var t = "Bienvenue dans le module \"Texte narratif\" ! Je peux vous aider à comprendre la structure narrative.";
    assertEq(f(t), f(t), 'le même texte produit deux fois le même identifiant');

    // Deux occurrences réelles du même texte doivent aussi coïncider
    var doublons = textesStatiques.filter(function (x) {
        return textesStatiques.some(function (y) { return y.ligne !== x.ligne && y.texte === x.texte; });
    });
    assertEq(doublons.length, 0,
        'les 6 textes statiques sont tous différents (aucun doublon légitime)');

    // Le welcomeMessage « Techniques » est identique au texte statique l.3296
    var w0 = welcomeMessages[0].texte;
    assertEq(f(w0), f(textesStatiques[0].texte),
        'welcomeMessage[0] et le texte statique correspondant produisent le même identifiant');
});

/* =================================================================
 * 5. « a » vs « A » → IDENTIFIANTS DISTINCTS
 * ================================================================= */

section('5. Sensibilité à la casse', function () {
    var f = compileurTexte(chatExprs[0].expr);
    assertNe(f('a'), f('A'), '« a » et « A » produisent des identifiants distincts');
    assertNe(f('Bonjour'), f('bonjour'),
        '« Bonjour » et « bonjour » produisent des identifiants distincts');
});

/* =================================================================
 * 6. « a b » vs « a-b » vs « a  b » → IDENTIFIANTS DISTINCTS
 * ================================================================= */

section('6. Sensibilité aux espaces et aux tirets', function () {
    var f = compileurTexte(chatExprs[0].expr);
    var i1 = f('a b');
    var i2 = f('a-b');
    var i3 = f('a  b');
    assertNe(i1, i2, '« a b » et « a-b » produisent des identifiants distincts');
    assertNe(i1, i3, '« a b » et « a  b » produisent des identifiants distincts');
    assertNe(i2, i3, '« a-b » et « a  b » produisent des identifiants distincts');
    assertNe(f('a\tb'), f('a b'), 'tabulation et espace produisent des identifiants distincts');
    assertNe(f('a\nb'), f('a b'), 'saut de ligne et espace produisent des identifiants distincts');
});

/* =================================================================
 * 7. TEXTES LONGS → IDENTIFIANTS DISTINCTS
 * ================================================================= */

section('7. Textes longs', function () {
    var f = compileurTexte(chatExprs[0].expr);
    var long1 = 'x'.repeat(2999) + 'A';
    var long2 = 'x'.repeat(2999) + 'B';
    assertEq(long1.length, 3000, 'préalable : textes de 3000 caractères');
    assertNe(f(long1), f(long2),
        'deux textes de 3000 car. ne différant qu\'au dernier produisent des identifiants distincts');

    // Un JSON.stringify de réponse IA (cf. messageToDisplay) reste discriminant
    var j1 = JSON.stringify({ analysis: 'Réponse A', score: 1 }, null, 2);
    var j2 = JSON.stringify({ analysis: 'Réponse B', score: 1 }, null, 2);
    assertNe(f(j1), f(j2), 'deux charges JSON différentes produisent des identifiants distincts');
});

/* =================================================================
 * 8. PRÉFIXE « chat-ai-response- » CONSERVÉ
 * ================================================================= */

section('8. Préfixe conservé', function () {
    var f = compileurTexte(chatExprs[0].expr);
    [
        'Bonjour',
        'a',
        'Texte avec accents éàü',
        'Bienvenue dans le module "Texte narratif" !'
    ].forEach(function (t) {
        assert(f(t).indexOf('chat-ai-response-') === 0,
            'préfixe « chat-ai-response- » conservé pour ' + JSON.stringify(t.substring(0, 32)));
    });
});

/* =================================================================
 * 9. LES 4 AUTRES FAMILLES PRODUISENT LES MÊMES VALEURS QU'AVANT
 *    (contrat de format verrouillé : elles ne doivent pas bouger)
 *    NOTE : la famille « chat-module » (audio de la fiche du module) a été
 *    retirée quand la fiche du module et son icône livre ont été supprimées
 *    du Chat ; elle n'existe plus dans le code, ce n'est donc plus une famille
 *    à verrouiller.
 * ================================================================= */

section('9. Les 4 autres familles de sourceId sont inchangées', function () {
    var attendus = [
        { nom: 'activity-*', marqueur: '`activity-', attendu: 'activity-explicatif-1-3' },
        { nom: 'theory', marqueur: "'theory'", attendu: 'theory' },
        { nom: 'answer-*', marqueur: '`answer-', attendu: 'answer-explicatif-1-3' },
        { nom: 'feedback-*', marqueur: '`feedback-', attendu: 'feedback-explicatif-1-3' }
    ];

    attendus.forEach(function (a) {
        var trouvees = autresExprs.filter(function (c) {
            return c.expr.indexOf(a.marqueur) !== -1;
        });
        assertEq(trouvees.length, 1,
            'construction « ' + a.nom + ' » présente une seule fois');
        if (trouvees.length !== 1) { return; }

        var g = compileurChapitre(trouvees[0].expr);
        assertEq(g('explicatif-1', '3'), a.attendu,
            '« ' + a.nom + ' » produit toujours ' + JSON.stringify(a.attendu));
    });

    // Aucune construction « chat-ai-response- » ne doit apparaître parmi les autres
    var intrus = autresExprs.filter(function (c) {
        return c.expr.indexOf('chat-ai-response-') !== -1;
    });
    assertEq(intrus.length, 0, 'aucune autre famille n\'utilise le préfixe « chat-ai-response- »');
});

/* =================================================================
 * 10. PRINCIPE DE TOGGLE (currentAudioSource === sourceId)
 * ================================================================= */

section('10. Principe de toggle préservé', function () {
    var f = compileurTexte(chatExprs[0].expr);

    // Le mécanisme réel est comparé textuellement dans index.html
    var occurrences = lines.filter(function (l) {
        return /window\.currentAudioSource === sourceId && window\.isSpeaking\(\)/.test(l);
    });
    assertEq(occurrences.length, 6,
        'les 6 comparaisons « currentAudioSource === sourceId && isSpeaking() » sont présentes');

    // Le mécanisme ne dépend pas du FORMAT de sourceId : il compare deux chaînes
    // produites par la MÊME fonction. On vérifie donc la propriété qui le rend
    // correct : même texte ⇒ même identifiant, textes différents ⇒ identifiants
    // différents. C'est exactement ce que le toggle exige.
    // Deux réponses distinctes ne différant qu'à la fin (cas de feedback fréquent)
    var ta = "Réponse de l'IA au message 1.";
    var tb = "Réponse de l'IA au message 2.";
    assertNe(f(ta), f(tb),
        'deux réponses distinctes produisent des identifiants distincts (préalable du toggle)');
    var sourceIdA = f(ta);
    var sourceIdB = f(tb);

    // Simulation de la condition, sans navigateur :
    //   currentAudioSource === sourceIdA  (source A en cours)  → toggle si même source
    //   currentAudioSource === sourceIdB  (source B cliquée)
    var currentAudioSource = sourceIdA;
    var isSpeaking = true;
    var toggleDeclenchePourA = (currentAudioSource === sourceIdA) && isSpeaking;
    var toggleDeclenchePourB = (currentAudioSource === sourceIdB) && isSpeaking;

    assert(toggleDeclenchePourA === true,
        're-cliquer sur la source en cours déclenche bien le toggle (arrêt)');
    assert(toggleDeclenchePourB === false,
        'cliquer sur une AUTRE source ne déclenche pas le toggle (démarrage)');

    // Cas du texte identique : le toggle doit rester déclenchable
    var currentAudioSource2 = f(ta);
    assert((currentAudioSource2 === f(ta)) === true,
        'un texte identique recliqué déclenche toujours le toggle');

    // Limite documentée : la branche réellement exécutée dépend de
    // window.speechSynthesis (non simulable ici sans navigateur). Ce fichier
    // verrouille donc le PRÉREQUIS du toggle — l'unicité de l'identifiant par
    // texte — et non l'effet audio lui-même.
});

/* =================================================================
 * RÉSUMÉ
 * ================================================================= */

var total = pass + fail;

console.log('\n' + '='.repeat(60));
console.log('RÉSULTATS — collision sourceId audio');
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
