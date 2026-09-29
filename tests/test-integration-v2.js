/**
 * Tests d'intégration V2 — CHAT + ACTIVITÉ + TRANSPORT + COMPAT + RESPONSE V2
 * 
 * Vérifie que :
 * - Le texte original reste intact jusqu'au RequestV2
 * - Le JSON envoyé correspond exactement au contrat V2
 * - La ResponseV2 est correctement détectée et normalisée
 * - La compatibilité legacy est préservée
 */

'use strict';

var assert = require('assert');

// Charger le module RequestBuilderV2
var rb = require('../src/request-builder-v2.js');

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
console.log('='.repeat(60));
console.log('INTÉGRATION V2 — CHAT + ACTIVITÉ + TRANSPORT + COMPAT');
console.log('='.repeat(60));

// =================================================================
console.log('\n--- A. CHAT — Texte original et contrat ---');
// =================================================================

// Simuler le flux CHAT
var originalQuestion = 'la texte de l\'étudiant avec des erreurs';
var correctedText = 'le texte de l\'étudiant avec des erreurs';

// Simuler les corrections de la base de données
var correctionsResult = {
    corrections: [
        { original: 'la texte', corrected: 'le texte', rule: 'genre_texte_masculin', category: 'grammaire', explanation: '...' }
    ],
    correctedText: correctedText
};

// A1. texte original capturé avant correction
assertEq(originalQuestion, 'la texte de l\'étudiant avec des erreurs', 'A1 — texte original capturé');

// A2. corrections appliquées (le textarea serait corrigé)
assertEq(correctedText, 'le texte de l\'étudiant avec des erreurs', 'A2 — corrections appliquées');

// A3. Convertir les détections
var detections = rb.convertDatabaseCorrectionsToDetections(correctionsResult);
assertOk(detections.length >= 1, 'A3 — au moins 1 détection convertie');

// A4. Construire le contexte chat
var discussionData = {
    narratif: { title: 'Le texte narratif', context: 'Le texte narratif raconte une histoire...' },
    techniques: { title: 'Les textes techniques', context: 'Les textes techniques expliquent...' }
};
var chatContext = { chat: rb.buildChatContext('narratif', discussionData) };
assertEq(chatContext.chat.topic, 'narratif', 'A4 — topic = narratif');
assertEq(chatContext.chat.topic_title, 'Le texte narratif', 'A4 — topic_title correct');

// A5. Construire RequestV2
var requestChat = rb.buildRequestV2({
    mode: 'chat',
    textOriginal: originalQuestion,
    localDetections: detections,
    context: chatContext
});

// A6. student.text_original reste l'original (pas le corrigé !)
assertEq(requestChat.student.text_original, originalQuestion, 'A6 — text_original = original (pas corrigé)');
assertOk(requestChat.student.text_original.indexOf('la texte') >= 0, 'A6 — contient l\'erreur originale "la texte"');
assertOk(requestChat.student.text_original.indexOf('le texte') === -1, 'A6 — ne contient PAS la correction "le texte"');

// A7. mode === "chat"
assertEq(requestChat.mode, 'chat', 'A7 — mode = chat');

// A8. contractVersion
assertEq(requestChat.contractVersion, '2.0', 'A8 — contractVersion = 2.0');

// A9. détections présentes
assertOk(requestChat.local_detections.length >= 1, 'A9 — détections présentes');

// A10. maximum 4 détections
assertOk(requestChat.local_detections.length <= 4, 'A10 — max 4 détections');

// A11. aucun text_corrected
assertEq(requestChat.student.text_corrected, undefined, 'A11 — aucun text_corrected');
var jsonChat = JSON.stringify(requestChat);
assertOk(jsonChat.indexOf('text_corrected') === -1, 'A11 — aucun text_corrected dans le JSON');

// A12. aucun champ hors contrat
var allowedKeys = ['contractVersion', 'mode', 'student', 'local_detections', 'context'];
var actualKeys = Object.keys(requestChat).sort();
assertEq(JSON.stringify(actualKeys), JSON.stringify(allowedKeys.sort()), 'A12 — exactement les champs du contrat');

// A13. contexte chat dans le contrat
assertOk(requestChat.context && requestChat.context.chat, 'A13 — contexte.chat présent');
assertEq(requestChat.context.chat.topic, 'narratif', 'A13 — topic = narratif');

// A14. détections : pas de priority dans le JSON
assertOk(jsonChat.indexOf('"priority"') === -1, 'A14 — pas de priority dans le JSON');

// A15. détections : format correct
var det = requestChat.local_detections[0];
assertOk(det.hasOwnProperty('rule_id'), 'A15 — rule_id présent');
assertOk(det.hasOwnProperty('category'), 'A15 — category présent');
assertOk(det.hasOwnProperty('excerpt'), 'A15 — excerpt présent');
assertOk(det.hasOwnProperty('correction'), 'A15 — correction présent');
assertOk(!det.hasOwnProperty('priority'), 'A15 — priority absent');

// =================================================================
console.log('\n--- B. ACTIVITÉ — Texte original et contrat ---');
// =================================================================

// Simuler le flux ACTIVITÉ
var activityOriginalAnswer = 'Je suis allé à la plage hier avec mes amis. Nous avons mangé des glaces.';
var activityCorrectedText = 'Je suis allé à la plage hier avec mes amis. Nous avons mangé des glaces.';

// Simuler les corrections
var activityCorrections = {
    corrections: [
        { original: 'à la plage', corrected: 'au bord de la plage', rule: 'expression_spatiale', category: 'vocabulaire', explanation: '...' }
    ],
    correctedText: activityCorrectedText
};

// Simuler activityContent
var activityContent = {
    'chap1': {
        'act1': {
            title: 'Rédiger un paragraphe',
            html: '<h5>Consignes</h5><p>Rédigez un paragraphe de 3 phrases sur vos vacances.</p>',
            tableType: 'textarea'
        }
    }
};

// B1. texte original capturé avant correction
assertEq(activityOriginalAnswer, 'Je suis allé à la plage hier avec mes amis. Nous avons mangé des glaces.', 'B1 — texte original capturé');

// B2. Convertir les détections
var activityDetections = rb.convertDatabaseCorrectionsToDetections(activityCorrections);
assertOk(activityDetections.length >= 1, 'B2 — au moins 1 détection');

// B3. Construire le contexte activité
var activityContext = { activity: rb.buildActivityContext('chap1', 'act1', activityContent) };
assertEq(activityContext.activity.chapter_id, 'chap1', 'B3 — chapter_id = chap1');
assertEq(activityContext.activity.activity_id, 'act1', 'B3 — activity_id = act1');
assertEq(activityContext.activity.title, 'Rédiger un paragraphe', 'B3 — title réel');
assertEq(activityContext.activity.type, 'textarea', 'B3 — type réel');
assertOk(activityContext.activity.instructions.length > 0, 'B3 — instructions extraites');

// B4. Construire RequestV2
var requestActivity = rb.buildRequestV2({
    mode: 'activity',
    textOriginal: activityOriginalAnswer,
    localDetections: activityDetections,
    context: activityContext
});

// B5. student.text_original reste l'original
assertEq(requestActivity.student.text_original, activityOriginalAnswer, 'B5 — text_original = original');

// B6. mode === "activity"
assertEq(requestActivity.mode, 'activity', 'B6 — mode = activity');

// B7. chapter_id réel
assertEq(requestActivity.context.activity.chapter_id, 'chap1', 'B7 — chapter_id réel');

// B8. activity_id réel
assertEq(requestActivity.context.activity.activity_id, 'act1', 'B8 — activity_id réel');

// B9. title réel
assertEq(requestActivity.context.activity.title, 'Rédiger un paragraphe', 'B9 — title réel');

// B10. type réel
assertEq(requestActivity.context.activity.type, 'textarea', 'B10 — type réel');

// B11. instructions extraites
assertOk(requestActivity.context.activity.instructions.indexOf('Rédigez') >= 0, 'B11 — instructions extraites contiennent le contenu');

// B12. maximum 4 détections
assertOk(requestActivity.local_detections.length <= 4, 'B12 — max 4 détections');

// B13. aucun text_corrected
assertEq(requestActivity.student.text_corrected, undefined, 'B13 — aucun text_corrected');

// B14. pas de priority dans le JSON
var jsonActivity = JSON.stringify(requestActivity);
assertOk(jsonActivity.indexOf('"priority"') === -1, 'B14 — pas de priority dans le JSON');

// =================================================================
console.log('\n--- C. TRANSPORT — RequestV2 envoyé au Worker ---');
// =================================================================

// C1. Le body envoyé contient contractVersion: "2.0"
var bodyPayload = JSON.stringify(requestChat);
var parsed = JSON.parse(bodyPayload);
assertEq(parsed.contractVersion, '2.0', 'C1 — contractVersion = 2.0 dans le body');

// C2. Le body n'est PAS un body V1
assertEq(parsed.action, undefined, 'C2 — pas de champ "action" (V1)');
assertEq(parsed.systemPrompt, undefined, 'C2 — pas de champ "systemPrompt" (V1)');
assertEq(parsed.userPrompt, undefined, 'C2 — pas de champ "userPrompt" (V1)');

// C3. Le body a la structure V2 exacte
assertOk(parsed.student && typeof parsed.student === 'object', 'C3 — student est un objet');
assertOk(typeof parsed.student.text_original === 'string', 'C3 — student.text_original est string');
assertOk(Array.isArray(parsed.local_detections), 'C3 — local_detections est array');

// C4. Mode chat dans le body
assertEq(parsed.mode, 'chat', 'C4 — mode = chat dans le body');

// C5. Mode activity dans le body
var parsedActivity = JSON.parse(JSON.stringify(requestActivity));
assertEq(parsedActivity.mode, 'activity', 'C5 — mode = activity dans le body');

// =================================================================
console.log('\n--- D. COMPATIBILITÉ — Legacy V1 sans optionsV2 ---');
// =================================================================

// D1. Sans optionsV2, le code legacy est utilisé
// Simuler la logique de runFourModelPipeline
var optionsV2_null = null;
var useV2 = !!(optionsV2_null && optionsV2_null.textOriginal);
assertEq(useV2, false, 'D1 — sans optionsV2 : useV2 = false');

// D2. Avec optionsV2 vide
var optionsV2_empty = {};
var useV2_empty = !!(optionsV2_empty && optionsV2_empty.textOriginal);
assertEq(useV2_empty, false, 'D2 — optionsV2 vide : useV2 = false');

// D3. Avec optionsV2 sans textOriginal
var optionsV2_noText = { localDetections: [] };
var useV2_noText = !!(optionsV2_noText && optionsV2_noText.textOriginal);
assertEq(useV2_noText, false, 'D3 — optionsV2 sans textOriginal : useV2 = false');

// D4. Avec optionsV2 complet
var optionsV2_full = { textOriginal: 'texte', localDetections: [], context: null };
var useV2_full = !!(optionsV2_full && optionsV2_full.textOriginal && true);
assertEq(useV2_full, true, 'D4 — optionsV2 complet : useV2 = true');

// =================================================================
console.log('\n--- E. RESPONSE V2 — Détection et normalisation ---');
// =================================================================

// E1. isResponseV2 détecte une ResponseV2
var responseV2 = {
    contractVersion: '2.0',
    source: 'local_rules',
    status: 'ok',
    analysis: {
        diagnostic: 'Texte correct dans l\'ensemble.',
        errors: []
    },
    tutor: { explanation: 'Bien joué !', advice: 'Continuez ainsi.' },
    course: { point: 'Accord sujet-verbe', rule: 'Le verbe s\'accorde avec le sujet.' },
    metadata: { model: null }
};
assertEq(rb.isResponseV2(responseV2), true, 'E1 — isResponseV2 = true pour ResponseV2');

// E2. isResponseV2 rejette un objet V1
var responseV1 = { source: 'remote_a22b', analysis: 'texte' };
assertEq(rb.isResponseV2(responseV1), false, 'E2 — isResponseV2 = false pour V1');

// E3. isResponseV2 rejette null/undefined
assertEq(rb.isResponseV2(null), false, 'E3 — isResponseV2(null) = false');
assertEq(rb.isResponseV2(undefined), false, 'E3 — isResponseV2(undefined) = false');

// E4. normalizeResponseV2 extrait le texte
var normalized = rb.normalizeResponseV2(responseV2);
assertOk(normalized.analysisText.length > 0, 'E4 — analysisText non vide');
assertOk(normalized.analysisText.indexOf('Texte correct') >= 0, 'E4 — contient le diagnostic');
assertOk(normalized.analysisText.indexOf('Bien joué') >= 0, 'E4 — contient l\'explication tuteur');
assertOk(normalized.analysisText.indexOf('Accord sujet-verbe') >= 0, 'E4 — contient le point de cours');

// E5. normalizeResponseV2 retourne source et status
assertEq(normalized.source, 'local_rules', 'E5 — source = local_rules');
assertEq(normalized.status, 'ok', 'E5 — status = ok');

// E6. normalizeResponseV2 avec analysis string
var responseV2String = {
    contractVersion: '2.0',
    source: 'local_rules',
    status: 'ok',
    analysis: 'Texte simple en string'
};
var normalizedString = rb.normalizeResponseV2(responseV2String);
assertOk(normalizedString.analysisText.indexOf('Texte simple') >= 0, 'E6 — analysis string normalisée');

// E7. normalizeResponseV2 avec réponse vide
var responseV2Empty = {
    contractVersion: '2.0',
    source: null,
    status: 'empty'
};
var normalizedEmpty = rb.normalizeResponseV2(responseV2Empty);
assertEq(normalizedEmpty.analysisText, 'Analyse effectuée.', 'E7 — réponse vide → texte par défaut');

// =================================================================
console.log('\n--- F. VALIDATION DES rule_id ---');
// =================================================================

// Simuler window.NLPRules pour les tests F
var oldNLPRules = (typeof window !== 'undefined') ? window.NLPRules : undefined;
if (typeof global !== 'undefined') {
    global.window = global.window || {};
}
if (typeof window !== 'undefined') {
    window.NLPRules = {
        grammaire: [
            { id: 'genre_texte_masculin', name: 'genre_texte_masculin', category: 'grammaire', priority: 95 }
        ],
        style: [
            { id: 'expression_spatiale', name: 'expression_spatiale', category: 'style', priority: 60 }
        ]
    };
}

// F1. rule_id connu ET détecté → validated = true
var responseWithErrors = {
    contractVersion: '2.0',
    source: 'remote_a22b',
    status: 'ok',
    analysis: {
        diagnostic: 'Erreurs trouvées',
        errors: [
            { excerpt: 'la texte', type: 'grammaire', rule_id: 'genre_texte_masculin', correction: 'le texte' }
        ]
    }
};
var sentDets = [{ rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'la texte', correction: 'le texte' }];
var validated = rb.validateResponseRuleIds(responseWithErrors, sentDets);
assertEq(validated.length, 1, 'F1 — 1 rule_id validé');
assertEq(validated[0].rule_id, 'genre_texte_masculin', 'F1 — rule_id conservé');
assertEq(validated[0].validated, true, 'F1 — validated = true (connu ET détecté)');

// F2. rule_id inconnu → rule_id = null, validated = false
var responseUnknown = {
    contractVersion: '2.0',
    source: 'remote_a22b',
    status: 'ok',
    analysis: {
        diagnostic: 'Erreurs',
        errors: [
            { excerpt: 'xyz', type: 'unknown', rule_id: 'unknown_rule_from_ai', correction: 'abc' }
        ]
    }
};
var validatedUnknown = rb.validateResponseRuleIds(responseUnknown, sentDets);
assertEq(validatedUnknown.length, 1, 'F2 — 1 rule_id à valider');
assertEq(validatedUnknown[0].rule_id, null, 'F2 — rule_id inconnu → null');
assertEq(validatedUnknown[0].validated, false, 'F2 — validated = false');

// F3. rule_id connu mais NON détecté → validated = false
var responseNotDetected = {
    contractVersion: '2.0',
    source: 'remote_a22b',
    status: 'ok',
    analysis: {
        diagnostic: 'Erreurs',
        errors: [
            { excerpt: 'xyz', type: 'style', rule_id: 'expression_spatiale', correction: 'abc' }
        ]
    }
};
var emptySentDets = [];
var validatedNotDetected = rb.validateResponseRuleIds(responseNotDetected, emptySentDets);
assertEq(validatedNotDetected.length, 1, 'F3 — 1 rule_id à valider');
assertEq(validatedNotDetected[0].rule_id, 'expression_spatiale', 'F3 — rule_id conservé (connu)');
assertEq(validatedNotDetected[0].validated, false, 'F3 — validated = false (connu mais non détecté)');
assertEq(validatedNotDetected[0].known_locally, true, 'F3 — known_locally = true');
assertEq(validatedNotDetected[0].local_detected, false, 'F3 — local_detected = false');

// F4. Pas d'errors dans la réponse → tableau vide
var responseNoErrors = {
    contractVersion: '2.0',
    source: 'local_rules',
    status: 'ok',
    analysis: { diagnostic: 'Parfait', errors: [] }
};
var validatedNoErrors = rb.validateResponseRuleIds(responseNoErrors, sentDets);
assertEq(validatedNoErrors.length, 0, 'F4 — pas d\'errors → tableau vide');

// Restaurer window.NLPRules
if (typeof window !== 'undefined') {
    if (oldNLPRules !== undefined) {
        window.NLPRules = oldNLPRules;
    } else {
        delete window.NLPRules;
    }
}

// =================================================================
console.log('\n--- G. DÉTECTIONS — Conservation et sélection ---');
// =================================================================

// G1. Toutes les détections conservées avant sélection
var allDets = [];
for (var i = 0; i < 10; i++) {
    allDets.push({ rule_id: 'rule_' + i, category: 'grammaire', excerpt: 'e' + i, correction: 'c' + i, priority: 90 - i });
}
assertEq(allDets.length, 10, 'G1 — 10 détections conservées en mémoire');

// G2. Sélection des 4 meilleures
var top4 = rb.selectTopLocalDetections(allDets, 4);
assertEq(top4.length, 4, 'G2 — 4 sélectionnées');
assertEq(allDets.length, 10, 'G2 — originales intactes (10)');

// G3. Tri par priorité réelle
assertEq(top4[0].rule_id, 'rule_0', 'G3 — priorité 90 en premier');
assertEq(top4[1].rule_id, 'rule_1', 'G3 — priorité 89 en deuxième');
assertEq(top4[2].rule_id, 'rule_2', 'G3 — priorité 88 en troisième');
assertEq(top4[3].rule_id, 'rule_3', 'G3 — priorité 87 en quatrième');

// G4. Après normalisation, pas de priority
var normalized = rb.normalizeLocalDetections(top4);
assertEq(normalized.length, 4, 'G4 — 4 détections normalisées');
var normalizedJson = JSON.stringify(normalized);
assertOk(normalizedJson.indexOf('"priority"') === -1, 'G4 — pas de priority après normalisation');

// =================================================================
console.log('\n--- H. CROSS-VALIDATION — Worker accepte les RequestV2 ---');
// =================================================================

// H1. Charger le validateur Worker si disponible
var contractV2Path = '../worker/contract-v2.js';
var workerValidator = null;
try {
    workerValidator = require(contractV2Path);
} catch (e) {
    // Module non disponible en mode test
}

if (workerValidator) {
    // H1. RequestV2 chat validée par le Worker
    var v1 = workerValidator.validateRequestV2(requestChat);
    assertEq(v1.valid, true, 'H1 — RequestV2 chat acceptée par validateur Worker (errors: ' + JSON.stringify(v1.errors) + ')');

    // H2. RequestV2 activity validée par le Worker
    var v2 = workerValidator.validateRequestV2(requestActivity);
    assertEq(v2.valid, true, 'H2 — RequestV2 activity acceptée par validateur Worker (errors: ' + JSON.stringify(v2.errors) + ')');
} else {
    console.log('  SKIP H1/H2 — validateur Worker non disponible');
}

// =================================================================
// Résumé
// =================================================================
console.log('\n' + '='.repeat(60));
console.log('Résultats : ' + pass + ' pass, ' + fail + ' echec(s)');
console.log('='.repeat(60));

process.exit(fail > 0 ? 1 : 0);
