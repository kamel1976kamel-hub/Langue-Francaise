/**
 * =================================================================
 * TESTS UNITAIRES — REQUEST BUILDER V2 (Frontend)
 * =================================================================
 * Tests du constructeur de requête V2 côté frontend.
 * Module testé : src/request-builder-v2.js
 * =================================================================
 */

var pass = 0, fail = 0;

function assert(cond, label) {
    if (cond) { pass++; console.log('  ✅ PASS — ' + label); }
    else { fail++; console.error('  ❌ ÉCHEC — ' + label); }
}

function assertEq(actual, expected, label) {
    var match = (actual === expected);
    if (match) { pass++; console.log('  ✅ PASS — ' + label); }
    else {
        fail++;
        console.error('  ❌ ÉCHEC — ' + label + ' (attendu: ' + JSON.stringify(expected) + ', obtenu: ' + JSON.stringify(actual) + ')');
    }
}

// Import du module
var rb;
try {
    rb = require('../src/request-builder-v2.js');
} catch (e) {
    console.error('FATAL: Impossible d\'importer request-builder-v2.js:', e.message);
    process.exit(2);
}

var selectTopLocalDetections = rb.selectTopLocalDetections;
var normalizeLocalDetection = rb.normalizeLocalDetection;
var normalizeLocalDetections = rb.normalizeLocalDetections;
var extractActivityInstructions = rb.extractActivityInstructions;
var stripHtmlToText = rb.stripHtmlToText;
var buildChatContext = rb.buildChatContext;
var buildActivityContext = rb.buildActivityContext;
var buildRequestV2 = rb.buildRequestV2;
var convertDatabaseCorrectionsToDetections = rb.convertDatabaseCorrectionsToDetections;
var convertAnalyzeErrorsToDetections = rb.convertAnalyzeErrorsToDetections;
var CONTRACT_VERSION = rb.CONTRACT_VERSION;

// =================================================================
// HELPERS
// =================================================================

function makeDetection(overrides) {
    var base = {
        rule_id: 'genre_texte_masculin',
        category: 'grammaire',
        excerpt: 'la texte',
        correction: 'le texte',
        priority: 95
    };
    for (var k in overrides) { base[k] = overrides[k]; }
    return base;
}

// =================================================================
console.log('\n--- A. Texte original ---');
// =================================================================

// A1. texte original conservé exactement
{
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'la texte est important',
        localDetections: [],
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assertEq(req.student.text_original, 'la texte est important', 'A1 — texte original conserve exactement');
}

// A2. correction locale differente du texte original
{
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'la texte est important',
        localDetections: [makeDetection()],
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assertEq(req.student.text_original, 'la texte est important', 'A2 — text_original != correctedText');
    assert(req.local_detections.length === 1, 'A2 — detection separee du texte');
}

// A3. aucun text_corrected dans RequestV2
{
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'test',
        localDetections: [],
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assert(!req.student.hasOwnProperty('text_corrected'), 'A3 — aucun text_corrected dans student');
    assert(!req.hasOwnProperty('text_corrected'), 'A3 — aucun text_corrected dans request');
}

// A4. texte original vide => erreur
{
    var threw = false;
    try {
        buildRequestV2({
            mode: 'chat',
            textOriginal: '',
            localDetections: [],
            context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
        });
    } catch (e) { threw = true; }
    assert(threw, 'A4 — textOriginal vide => erreur');
}

// =================================================================
console.log('\n--- B. Detections locales ---');
// =================================================================

// B1. 0 detection
{
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'test',
        localDetections: [],
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assertEq(req.local_detections.length, 0, 'B1 — 0 detection => 0 envoyee');
}

// B2. 1 detection
{
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'test',
        localDetections: [makeDetection()],
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assertEq(req.local_detections.length, 1, 'B2 — 1 detection => 1 envoyee');
}

// B3. 4 detections => 4 envoyees
{
    var dets = [];
    for (var i = 0; i < 4; i++) dets.push(makeDetection({ rule_id: 'rule_' + i, priority: 90 - i }));
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'test',
        localDetections: dets,
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assertEq(req.local_detections.length, 4, 'B3 — 4 detections => 4 envoyees');
}

// B4. 5 detections => 4 envoyees
{
    var dets = [];
    for (var i = 0; i < 5; i++) dets.push(makeDetection({ rule_id: 'rule_' + i, priority: 90 - i }));
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'test',
        localDetections: dets,
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assertEq(req.local_detections.length, 4, 'B4 — 5 detections => 4 envoyees');
}

// B5. 7 detections => 4 envoyees
{
    var dets = [];
    for (var i = 0; i < 7; i++) dets.push(makeDetection({ rule_id: 'rule_' + i, priority: 95 - i }));
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'test',
        localDetections: dets,
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assertEq(req.local_detections.length, 4, 'B5 — 7 detections => 4 envoyees');
}

// B6. priorite decroissante
{
    var dets = [
        makeDetection({ rule_id: 'low', priority: 50 }),
        makeDetection({ rule_id: 'high', priority: 95 }),
        makeDetection({ rule_id: 'mid', priority: 80 })
    ];
    var top = selectTopLocalDetections(dets, 4);
    assertEq(top[0].rule_id, 'high', 'B6 — priorite decroissante : high en premier');
    assertEq(top[1].rule_id, 'mid', 'B6 — priorite decroissante : mid en deuxieme');
    assertEq(top[2].rule_id, 'low', 'B6 — priorite decroissante : low en troisieme');
}

// B7. egalite de priorite => rule_id alphabetique
{
    var dets = [
        makeDetection({ rule_id: 'zebra', priority: 80 }),
        makeDetection({ rule_id: 'alpha', priority: 80 }),
        makeDetection({ rule_id: 'beta', priority: 80 })
    ];
    var top = selectTopLocalDetections(dets, 4);
    assertEq(top[0].rule_id, 'alpha', 'B7 — egalite : alpha avant beta');
    assertEq(top[1].rule_id, 'beta', 'B7 — egalite : beta avant zebra');
    assertEq(top[2].rule_id, 'zebra', 'B7 — egalite : zebra en dernier');
}

// B8. toutes les detections restent disponibles apres selection
{
    var dets = [];
    for (var i = 0; i < 7; i++) dets.push(makeDetection({ rule_id: 'rule_' + i, priority: 95 - i }));
    var top = selectTopLocalDetections(dets, 4);
    assertEq(dets.length, 7, 'B8 — liste originale non modifiee (7)');
    assertEq(top.length, 4, 'B8 — selection = 4');
}

// B9. vrai rule_id conserve
{
    var det = makeDetection({ rule_id: 'genre_texte_masculin' });
    var norm = normalizeLocalDetection(det);
    assertEq(norm.rule_id, 'genre_texte_masculin', 'B9 — vrai rule_id conserve');
}

// B10. category conservee
{
    var det = makeDetection({ category: 'grammaire' });
    var norm = normalizeLocalDetection(det);
    assertEq(norm.category, 'grammaire', 'B10 — category conservee');
}

// B11. correction locale string
{
    var det = makeDetection({ correction: 'le texte' });
    var norm = normalizeLocalDetection(det);
    assertEq(typeof norm.correction, 'string', 'B11 — correction locale est string');
}

// B12. correction non-string => normalisee en string vide
{
    var det = makeDetection({ correction: null });
    var norm = normalizeLocalDetection(det);
    assertEq(typeof norm.correction, 'string', 'B12 — correction null => string vide');
}

// =================================================================
console.log('\n--- C. Contexte chat ---');
// =================================================================

var mockDiscussionData = {
    techniques: {
        title: "Techniques et pratiques de l'ecrit",
        context: "Tu es un expert en francais et en pedagogie."
    },
    narratif: {
        title: "Texte narratif",
        context: "Tu aides les eleves a produire des textes narratifs."
    }
};

// C1. contexte issu de discussionData
{
    var ctx = buildChatContext('techniques', mockDiscussionData);
    assert(ctx !== null, 'C1 — contexte chat non null');
    assertEq(ctx.topic, 'techniques', 'C1 — topic correct');
}

// C2. topic correct
{
    var ctx = buildChatContext('narratif', mockDiscussionData);
    assertEq(ctx.topic, 'narratif', 'C2 — topic = narratif');
}

// C3. topic_title correct
{
    var ctx = buildChatContext('techniques', mockDiscussionData);
    assertEq(ctx.topic_title, "Techniques et pratiques de l'ecrit", 'C3 — topic_title correct');
}

// C4. topic_context correct
{
    var ctx = buildChatContext('narratif', mockDiscussionData);
    assert(ctx.topic_context.indexOf('textes narratifs') >= 0, 'C4 — topic_context correct');
}

// C5. topic inexistant => null
{
    var ctx = buildChatContext('inexistant', mockDiscussionData);
    assertEq(ctx, null, 'C5 — topic inexistant => null');
}

// =================================================================
console.log('\n--- D. Contexte activity ---');
// =================================================================

var mockActivityContent = {
    "explicatif-1": {
        1: {
            title: "Sequence 1 - Activite 1 - Le tri inductif",
            html: '<h5>Objectif</h5><p>Faire distinguer recit et explication.</p><h5>Consignes</h5><ul><li>Lire les textes.</li><li>Remplir le tableau.</li></ul>',
            tableType: "tri-inductif"
        },
        2: {
            title: "Sequence 1 - Activite 2 - Analyse",
            html: '<h5>Objectif</h5><p>Reperer les marques.</p>',
            tableType: "definir-sujet"
        },
        3: {
            title: "Sequence 1 - Activite 3 - Sans instructions",
            html: '<p>Texte libre sans section Consignes ni Objectif structure.</p>',
            tableType: ""
        }
    }
};

// D1. chapter_id
{
    var ctx = buildActivityContext('explicatif-1', '1', mockActivityContent);
    assertEq(ctx.chapter_id, 'explicatif-1', 'D1 — chapter_id correct');
}

// D2. activity_id
{
    var ctx = buildActivityContext('explicatif-1', '1', mockActivityContent);
    assertEq(ctx.activity_id, '1', 'D2 — activity_id correct');
}

// D3. title
{
    var ctx = buildActivityContext('explicatif-1', '1', mockActivityContent);
    assertEq(ctx.title, 'Sequence 1 - Activite 1 - Le tri inductif', 'D3 — title correct');
}

// D4. type
{
    var ctx = buildActivityContext('explicatif-1', '1', mockActivityContent);
    assertEq(ctx.type, 'tri-inductif', 'D4 — type correct');
}

// D5. extraction instructions
{
    var ctx = buildActivityContext('explicatif-1', '1', mockActivityContent);
    assert(ctx.instructions.indexOf('Lire les textes') >= 0, 'D5 — instructions extraites (lire les textes)');
    assert(ctx.instructions.indexOf('Remplir le tableau') >= 0, 'D5 — instructions extraites (remplir le tableau)');
}

// D6. troncature a 300 caracteres
{
    var longHtml = '<h5>Consignes</h5><ul>';
    for (var i = 0; i < 50; i++) longHtml += '<li>Consigne numero ' + i + ' qui est assez longue pour tester.</li>';
    longHtml += '</ul>';
    var instructions = extractActivityInstructions(longHtml);
    assert(instructions.length <= 300, 'D6 — instructions tronquees a 300 car (longueur: ' + instructions.length + ')');
}

// D7. activite sans instructions => comportement explicite
{
    var ctx = buildActivityContext('explicatif-1', '3', mockActivityContent);
    assert(ctx !== null, 'D7 — contexte non null meme sans instructions');
    assertEq(ctx.instructions, '', 'D7 — instructions vides (pas d\'invention)');
}

// D8. chapitre inexistant => null
{
    var ctx = buildActivityContext('inexistant', '1', mockActivityContent);
    assertEq(ctx, null, 'D8 — chapitre inexistant => null');
}

// D9. activite inexistante => null
{
    var ctx = buildActivityContext('explicatif-1', '99', mockActivityContent);
    assertEq(ctx, null, 'D9 — activite inexistante => null');
}

// =================================================================
console.log('\n--- E. Contrat ---');
// =================================================================

// E1. contractVersion === "2.0"
{
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'test',
        localDetections: [],
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assertEq(req.contractVersion, '2.0', 'E1 — contractVersion = "2.0"');
}

// E2. mode correct
{
    var req1 = buildRequestV2({
        mode: 'chat',
        textOriginal: 'test',
        localDetections: [],
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assertEq(req1.mode, 'chat', 'E2 — mode = chat');

    var req2 = buildRequestV2({
        mode: 'activity',
        textOriginal: 'test',
        localDetections: [],
        context: { activity: { chapter_id: 'ch1', activity_id: '1', title: 'T', type: 'tri', instructions: 'I' } }
    });
    assertEq(req2.mode, 'activity', 'E2 — mode = activity');
}

// E3. maximum 4 detections
{
    var dets = [];
    for (var i = 0; i < 10; i++) dets.push(makeDetection({ rule_id: 'r' + i, priority: 90 - i }));
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'test',
        localDetections: dets,
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assert(req.local_detections.length <= 4, 'E3 — max 4 detections (obtenu: ' + req.local_detections.length + ')');
}

// E4. aucun champ non prevu
{
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'test',
        localDetections: [],
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    var keys = Object.keys(req).sort();
    var expected = ['context', 'contractVersion', 'local_detections', 'mode', 'student'];
    assertEq(JSON.stringify(keys), JSON.stringify(expected), 'E4 — exactement les champs prevus');
}

// E5. RequestV2 accepte par le validateur Worker
{
    var contractV2;
    try {
        contractV2 = require('../worker/contract-v2.js');
    } catch (e) {
        contractV2 = null;
    }
    if (contractV2) {
        var chatCtx = buildChatContext('techniques', mockDiscussionData);
        var req = buildRequestV2({
            mode: 'chat',
            textOriginal: 'la texte est important',
            localDetections: [
                makeDetection({ rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'la texte', correction: 'le texte', priority: 95 })
            ],
            context: { chat: chatCtx }
        });
        var result = contractV2.validateRequestV2(req);
        assert(result.valid, 'E5 — RequestV2 chat acceptee par validateur Worker (errors: ' + JSON.stringify(result.errors) + ')');
    } else {
        console.log('  SKIP E5 — validateur Worker non disponible');
    }
}

// E6. RequestV2 activity acceptee par le validateur Worker
{
    var contractV2;
    try {
        contractV2 = require('../worker/contract-v2.js');
    } catch (e) {
        contractV2 = null;
    }
    if (contractV2) {
        var actCtx = buildActivityContext('explicatif-1', '1', mockActivityContent);
        var req = buildRequestV2({
            mode: 'activity',
            textOriginal: 'Le vent est du a des differences de pression',
            localDetections: [],
            context: { activity: actCtx }
        });
        var result = contractV2.validateRequestV2(req);
        assert(result.valid, 'E6 — RequestV2 activity acceptee par validateur Worker (errors: ' + JSON.stringify(result.errors) + ')');
    } else {
        console.log('  SKIP E6 — validateur Worker non disponible');
    }
}

// =================================================================
console.log('\n--- F. Conversion des corrections ---');
// =================================================================

// F1. convertDatabaseCorrectionsToDetections
{
    var correctionsResult = {
        success: true,
        corrections: [
            { original: 'la texte', corrected: 'le texte', rule: 'genre_texte_masculin', category: 'grammaire', explanation: '...' }
        ]
    };
    var dets = convertDatabaseCorrectionsToDetections(correctionsResult);
    assertEq(dets.length, 1, 'F1 — 1 detection convertie');
    assertEq(dets[0].rule_id, 'genre_texte_masculin', 'F1 — rule_id conserve');
    assertEq(dets[0].category, 'grammaire', 'F1 — category conservee');
    assertEq(dets[0].excerpt, 'la texte', 'F1 — excerpt = original');
    assertEq(dets[0].correction, 'le texte', 'F1 — correction = corrected');
}

// F2. convertAnalyzeErrorsToDetections (sans window.NLPRules => priority = 0)
{
    var analysisResult = {
        errors: [
            { text: 'la texte', correction: 'le texte', type: 'grammaire', rule: 'genre_texte_masculin', confidence: 0.95 }
        ]
    };
    var dets = convertAnalyzeErrorsToDetections(analysisResult);
    assertEq(dets.length, 1, 'F2 — 1 detection convertie');
    assertEq(dets[0].rule_id, 'genre_texte_masculin', 'F2 — rule_id conserve');
    assertEq(dets[0].priority, 0, 'F2 — priority = 0 sans NLPRules (pas confidence * 100)');
}

// =================================================================
console.log('\n--- I. Priorite reelle et categorie (avec NLPRules simule) ---');
// =================================================================

// Simuler window.NLPRules pour les tests I
var buildIdToRuleIndex = rb.buildIdToRuleIndex;

// Sauvegarder l'ancien window.NLPRules s'il existe
var oldNLPRules = (typeof window !== 'undefined') ? window.NLPRules : undefined;

// Injecter des regles simulees
if (typeof global !== 'undefined') {
    global.window = global.window || {};
}
if (typeof window !== 'undefined') {
    window.NLPRules = {
        grammaire: [
            { id: 'genre_texte_masculin', name: 'genre_texte_masculin', category: 'grammaire', priority: 95 }
        ],
        style: [
            { id: 'priorite_faible', name: 'priorite_faible', category: 'style', priority: 20 },
            { id: 'priorite_forte', name: 'priorite_forte', category: 'style', priority: 90 }
        ],
        orthographe: [
            { id: 'orthographe_rule', name: 'orthographe_rule', category: 'orthographe', priority: 75 }
        ]
    };
}

// I1. confidence elevee mais priorite faible => tri par priorite reelle
{
    var analysisResult = {
        errors: [
            { text: 'match1', correction: 'fix1', type: 'style', rule: 'priorite_faible', confidence: 0.99 },
            { text: 'match2', correction: 'fix2', type: 'style', rule: 'priorite_forte', confidence: 0.10 }
        ]
    };
    var dets = convertAnalyzeErrorsToDetections(analysisResult);
    assertEq(dets[0].priority, 20, 'I1 — confidence 0.99 => priorite reelle 20 (faible)');
    assertEq(dets[1].priority, 90, 'I1 — confidence 0.10 => priorite reelle 90 (forte)');

    // Le tri doit mettre priorite_forte en premier
    var top = selectTopLocalDetections(dets, 4);
    assertEq(top[0].rule_id, 'priorite_forte', 'I1 — tri par priorite reelle : priorite_forte en premier');
    assertEq(top[1].rule_id, 'priorite_faible', 'I1 — tri par priorite reelle : priorite_faible en deuxieme');
}

// I2. priorite faible mais confidence forte => tri par priorite reelle
{
    var analysisResult = {
        errors: [
            { text: 'match1', correction: 'fix1', type: 'style', rule: 'priorite_forte', confidence: 0.01 },
            { text: 'match2', correction: 'fix2', type: 'style', rule: 'priorite_faible', confidence: 0.99 }
        ]
    };
    var dets = convertAnalyzeErrorsToDetections(analysisResult);
    var top = selectTopLocalDetections(dets, 4);
    assertEq(top[0].rule_id, 'priorite_forte', 'I2 — priorite reelle 90 > 20 : priorite_forte premier (meme si confidence 0.01)');
}

// I3. categorie reelle provenant de window.NLPRules
{
    var analysisResult = {
        errors: [
            { text: 'match', correction: 'fix', type: 'unknown_type', rule: 'genre_texte_masculin', confidence: 0.5 }
        ]
    };
    var dets = convertAnalyzeErrorsToDetections(analysisResult);
    assertEq(dets[0].category, 'grammaire', 'I3 — categorie reelle = grammaire (depuis NLPRules, pas type=unknown_type)');
}

// I4. categorie pour regle inconnue => fallback sur type de l'erreur
{
    var analysisResult = {
        errors: [
            { text: 'match', correction: 'fix', type: 'vocabulaire', rule: 'unknown_rule_xyz', confidence: 0.5 }
        ]
    };
    var dets = convertAnalyzeErrorsToDetections(analysisResult);
    assertEq(dets[0].category, 'vocabulaire', 'I4 — regle inconnue => fallback sur type de l erreur');
}

// I5. absence de priority dans le JSON final
{
    var dets = [
        { rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'la texte', correction: 'le texte', priority: 95 }
    ];
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: 'la texte',
        localDetections: dets,
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    var json = JSON.stringify(req);
    assert(json.indexOf('"priority"') === -1, 'I5 — pas de "priority" dans le JSON final de local_detections');
    assert(req.local_detections[0].hasOwnProperty('rule_id'), 'I5 — rule_id present');
    assert(req.local_detections[0].hasOwnProperty('category'), 'I5 — category present');
    assert(req.local_detections[0].hasOwnProperty('excerpt'), 'I5 — excerpt present');
    assert(req.local_detections[0].hasOwnProperty('correction'), 'I5 — correction present');
    assert(!req.local_detections[0].hasOwnProperty('priority'), 'I5 — priority absent de l objet normalise');
}

// I6. conservation de toutes les detections en memoire avant selection
{
    var allDets = [];
    for (var i = 0; i < 10; i++) {
        allDets.push({ rule_id: 'rule_' + i, category: 'style', excerpt: 'e' + i, correction: 'c' + i, priority: 90 - i });
    }
    var originalLength = allDets.length;
    var top = selectTopLocalDetections(allDets, 4);
    assertEq(allDets.length, originalLength, 'I6 — liste originale intacte (10)');
    assertEq(top.length, 4, 'I6 — selection = 4');
    assertEq(allDets[9].rule_id, 'rule_9', 'I6 — dernier element original toujours present');
}

// I7. categorie normalisee parmi les 5 enums
{
    var validCategories = ['grammaire', 'style', 'vocabulaire', 'conjugaison', 'orthographe'];
    var analysisResult = {
        errors: [
            { text: 'm1', correction: 'f1', type: 'grammaire', rule: 'genre_texte_masculin', confidence: 0.5 }
        ]
    };
    var dets = convertAnalyzeErrorsToDetections(analysisResult);
    assert(validCategories.indexOf(dets[0].category) >= 0, 'I7 — categorie dans les 5 enums : ' + dets[0].category);
}

// Restaurer l'ancien window.NLPRules
if (typeof window !== 'undefined') {
    if (oldNLPRules !== undefined) {
        window.NLPRules = oldNLPRules;
    } else {
        delete window.NLPRules;
    }
}

// =================================================================
console.log('\n--- G. Securite XSS ---');
// =================================================================

// G1. texte du DOM jamais reinjecte en HTML
{
    var malicious = '<script>alert("xss")</script>la texte';
    var req = buildRequestV2({
        mode: 'chat',
        textOriginal: malicious,
        localDetections: [],
        context: { chat: { topic: 'test', topic_context: 'ctx', topic_title: 'Titre' } }
    });
    assertEq(req.student.text_original, malicious, 'G1 — texte original conserve tel quel (JSON, pas HTML)');
}

// G2. stripHtmlToText supprime le HTML
{
    var result = stripHtmlToText('<script>alert("xss")</script>texte');
    assert(result.indexOf('<script>') === -1, 'G2 — stripHtmlToText supprime les balises script');
}

// =================================================================
console.log('\n--- H. stripHtmlToText ---');
// =================================================================

{
    assertEq(stripHtmlToText('<b>gras</b>'), 'gras', 'H1 — balises supprimees');
    assertEq(stripHtmlToText('<li>item1</li><li>item2</li>'), '- item1 - item2', 'H2 — li convertis en tirets');
    assertEq(stripHtmlToText('  espaces   multiples  '), 'espaces multiples', 'H3 — espaces normalises');
    assertEq(stripHtmlToText(''), '', 'H4 — vide => vide');
    assertEq(stripHtmlToText(null), '', 'H5 — null => vide');
    assertEq(stripHtmlToText('&amp; &lt;'), '& <', 'H6 — entites decodees');
}

// =================================================================
// Resume
// =================================================================
console.log('\n' + '='.repeat(60));
console.log('Resultats : ' + pass + ' pass, ' + fail + ' echec(s)');
console.log('='.repeat(60));

process.exit(fail > 0 ? 1 : 0);
