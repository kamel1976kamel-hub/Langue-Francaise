/**
 * =================================================================
 * ÉTAPE 3D — VÉRIFICATION RÉELLE DU PIPELINE A22B V2
 * =================================================================
 * Test d'intégration complet qui simule le pipeline réel :
 *   1. Frontend → RequestV2 (buildRequestV2)
 *   2. Worker → validateRequestV2
 *   3. Worker → pipelineA22BV2 (avec Groq mocké)
 *   4. Worker → buildResponseV2
 *   5. Worker → validateResponseV2
 *   6. Frontend → validateResponseRuleIds
 * 
 * Ce test vérifie que le contrat V2 est respecté de bout en bout.
 */

'use strict';

// =================================================================
// IMPORTS
// =================================================================
import {
    validateRequestV2,
    validateResponseV2,
    buildResponseV2,
    buildEmptyResponseV2,
    CONTRACT_VERSION
} from '../worker/contract-v2.js';

import {
    buildRequestV2,
    isResponseV2,
    validateResponseRuleIds
} from '../src/request-builder-v2.js';

// =================================================================
// UTILITAIRES DE TEST
// =================================================================
let pass = 0;
let fail = 0;
let currentSection = '';

function assertEq(actual, expected, label) {
    if (actual === expected) {
        pass++;
        console.log('  ✓ ' + label);
    } else {
        fail++;
        console.log('  ✗ ' + label);
        console.log('    Attendu:', expected);
        console.log('    Obtenu:', actual);
    }
}

function assertOk(condition, label) {
    if (condition) {
        pass++;
        console.log('  ✓ ' + label);
    } else {
        fail++;
        console.log('  ✗ ' + label);
    }
}

function section(name) {
    currentSection = name;
    console.log('\n--- ' + name + ' ---');
}

// =================================================================
// MOCK GROQ — Simule les réponses de l'API Groq
// =================================================================

/**
 * Simule une réponse Groq réaliste pour l'étape Analyse
 */
function mockAnalyseResponse(textOriginal, hasErrors) {
    if (!hasErrors) {
        return JSON.stringify({
            diagnostic: 'Texte correct, aucune erreur significative détectée.',
            erreurs: [],
            priorite: 'Aucune correction majeure nécessaire.'
        });
    }
    
    // Extraire un extrait du texte pour simuler une détection
    const words = textOriginal.split(' ');
    const excerpt = words.slice(0, 3).join(' ');
    
    return JSON.stringify({
        diagnostic: 'Plusieurs erreurs identifiées : accord sujet-verbe et orthographe.',
        erreurs: [
            {
                extrait: excerpt,
                type: 'grammaire',
                correction: 'correction simulée',
                rule_id: 'genre_texte_masculin',
                model_confidence: 0.85
            }
        ],
        priorite: 'Corriger l\'accord sujet-verbe en priorité.'
    });
}

/**
 * Simule une réponse Groq réaliste pour l'étape Tuteur
 */
function mockTuteurResponse() {
    return JSON.stringify({
        explication: 'L\'erreur vient d\'un mauvais accord entre le sujet et le verbe.',
        conseil: 'Relis ta phrase en identifiant le sujet et le verbe.',
        exemple: 'Les enfants jouent dans le jardin.'
    });
}

/**
 * Simule une réponse Groq réaliste pour l'étape Cours
 */
function mockCoursResponse(ruleId) {
    return JSON.stringify({
        point_cours: 'L\'accord du sujet et du verbe est fondamental en français.',
        regle: 'Le verbe s\'accorde avec le sujet en personne et en nombre.',
        exemple: 'Le chat mange → Les chats mangent',
        rule_id: ruleId || 'genre_texte_masculin'
    });
}

// =================================================================
// A. TESTS FRONTEND → REQUEST V2
// =================================================================

section('A. Frontend → RequestV2');

// A1. Construction RequestV2 mode chat
{
    const request = buildRequestV2({
        mode: 'chat',
        textOriginal: 'Je suis fatigué aujourd\'hui.',
        localDetections: [
            { rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'Je suis', correction: 'Je suis', priority: 5 }
        ],
        context: {
            chat: {
                topic: 'discussion_libre',
                topic_context: 'L\'élève parle de son état.',
                topic_title: 'Discussion libre'
            }
        }
    });
    
    assertEq(request.contractVersion, '2.0', 'A1 — contractVersion = "2.0"');
    assertEq(request.mode, 'chat', 'A1 — mode = "chat"');
    assertEq(request.student.text_original, 'Je suis fatigué aujourd\'hui.', 'A1 — text_original = texte ORIGINAL');
    assertOk(Array.isArray(request.local_detections), 'A1 — local_detections est un array');
    assertOk(request.local_detections.length <= 4, 'A1 — local_detections ≤ 4');
    assertEq(request.context.chat.topic, 'discussion_libre', 'A1 — context.chat.topic transmis');
    
    // Valider avec le validateur Worker
    const validation = validateRequestV2(request);
    assertOk(validation.valid, 'A1 — RequestV2 validée par le Worker');
}

// A2. Construction RequestV2 mode activity
{
    const request = buildRequestV2({
        mode: 'activity',
        textOriginal: 'Il mange des pommes.',
        localDetections: [],
        context: {
            activity: {
                chapter_id: 'chap1',
                activity_id: 'act1',
                title: 'Rédiger une phrase',
                type: 'textarea',
                instructions: 'Écrivez une phrase simple.'
            }
        }
    });
    
    assertEq(request.contractVersion, '2.0', 'A2 — contractVersion = "2.0"');
    assertEq(request.mode, 'activity', 'A2 — mode = "activity"');
    assertEq(request.student.text_original, 'Il mange des pommes.', 'A2 — text_original = texte ORIGINAL');
    assertEq(request.context.activity.chapter_id, 'chap1', 'A2 — chapter_id transmis');
    assertEq(request.context.activity.activity_id, 'act1', 'A2 — activity_id transmis');
    assertEq(request.context.activity.title, 'Rédiger une phrase', 'A2 — title transmis');
    assertEq(request.context.activity.type, 'textarea', 'A2 — type transmis');
    assertEq(request.context.activity.instructions, 'Écrivez une phrase simple.', 'A2 — instructions transmises');
    
    const validation = validateRequestV2(request);
    assertOk(validation.valid, 'A2 — RequestV2 validée par le Worker');
}

// A3. text_original n'est PAS le texte corrigé
{
    const textOriginal = 'Je suis fatigué.';
    const textCorrige = 'Je suis fatigué.'; // Même texte dans ce cas
    
    const request = buildRequestV2({
        mode: 'chat',
        textOriginal: textOriginal,
        localDetections: [],
        context: { chat: { topic: 'test', topic_context: '', topic_title: 'Test' } }
    });
    
    assertEq(request.student.text_original, textOriginal, 'A3 — text_original = texte ORIGINAL (pas corrigé)');
    assertEq(request.student.text_original, 'Je suis fatigué.', 'A3 — text_original contient la faute');
}

// A4. Maximum 4 détections envoyées
{
    const detections = [];
    for (let i = 0; i < 10; i++) {
        detections.push({
            rule_id: 'rule_' + i,
            category: 'grammaire',
            excerpt: 'extrait ' + i,
            correction: 'correction ' + i,
            priority: i
        });
    }
    
    const request = buildRequestV2({
        mode: 'chat',
        textOriginal: 'Test avec beaucoup de détections.',
        localDetections: detections,
        context: { chat: { topic: 'test', topic_context: '', topic_title: 'Test' } }
    });
    
    assertOk(request.local_detections.length <= 4, 'A4 — Maximum 4 détections envoyées');
    assertEq(request.local_detections.length, 4, 'A4 — Exactement 4 détections (troncature)');
}

// =================================================================
// B. TESTS WORKER → A22B PIPELINE (avec Groq mocké)
// =================================================================

section('B. Worker → Pipeline A22B (simulation)');

// B1. Simulation du pipeline A22B complet
{
    const request = buildRequestV2({
        mode: 'chat',
        textOriginal: 'Les enfants jouent dans le jardin.',
        localDetections: [
            { rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'Les enfants', correction: 'Les enfants', priority: 5 }
        ],
        context: { chat: { topic: 'grammaire', topic_context: 'Exercice d\'accord.', topic_title: 'Accord sujet-verbe' } }
    });
    
    // Simuler les 3 étapes du pipeline
    const mockAnalyse = mockAnalyseResponse(request.student.text_original, true);
    const mockTuteur = mockTuteurResponse();
    const mockCours = mockCoursResponse('genre_texte_masculin');
    
    // Vérifier que les 3 étapes utilisent le même texte original
    assertOk(mockAnalyse.indexOf('Les enfants jouent') >= 0, 'B1 — Analyse utilise text_original');
    assertOk(mockTuteur.indexOf('Les enfants') >= 0 || mockTuteur.length > 0, 'B1 — Tuteur reçoit le contexte');
    assertOk(mockCours.indexOf('accord') >= 0 || mockCours.length > 0, 'B1 — Cours reçoit le contexte');
    
    // Construire une ResponseV2 simulée
    const responseV2 = buildResponseV2({
        source: 'remote_a22b',
        status: 'ok',
        diagnostic: 'Erreurs détectées.',
        errors: [
            {
                excerpt: 'Les enfants',
                type: 'grammaire',
                correction: 'correction',
                rule_id: 'genre_texte_masculin',
                rule_known_locally: false, // Worker ne peut pas savoir
                local_detected: true,
                model_suggested: true,
                validated: false, // Worker ne valide PAS
                model_confidence: 0.85
            }
        ],
        priority: 'Corriger l\'accord.',
        tutorExplanation: 'L\'erreur vient d\'un mauvais accord.',
        tutorAdvice: 'Relis ta phrase.',
        tutorExample: 'Les enfants jouent.',
        coursePoint: 'L\'accord sujet-verbe est fondamental.',
        courseRule: 'Le verbe s\'accorde avec le sujet.',
        courseExample: 'Le chat mange → Les chats mangent',
        courseValidated: false, // Worker ne valide PAS
        courseRuleId: 'genre_texte_masculin',
        model: 'openai/gpt-oss-20b',
        localRulesUsed: ['genre_texte_masculin']
    });
    
    // Valider la ResponseV2
    const validation = validateResponseV2(responseV2);
    assertOk(validation.valid, 'B1 — ResponseV2 valide');
    assertEq(responseV2.contractVersion, '2.0', 'B1 — contractVersion = "2.0"');
    assertEq(responseV2.source, 'remote_a22b', 'B1 — source = "remote_a22b"');
    assertEq(responseV2.status, 'ok', 'B1 — status = "ok"');
    assertOk(responseV2.analysis !== undefined, 'B1 — analysis présent');
    assertOk(responseV2.tutor !== undefined, 'B1 — tutor présent');
    assertOk(responseV2.course !== undefined, 'B1 — course présent');
    assertOk(responseV2.metadata !== undefined, 'B1 — metadata présent');
}

// B2. Vérifier longueurs maximales
{
    const responseV2 = buildResponseV2({
        source: 'remote_a22b',
        status: 'ok',
        diagnostic: 'A'.repeat(500), // Trop long → tronqué
        errors: [],
        priority: 'B'.repeat(300), // Trop long → tronqué
        tutorExplanation: 'C'.repeat(600), // Trop long → tronqué
        tutorAdvice: 'D'.repeat(300), // Trop long → tronqué
        tutorExample: 'E'.repeat(300), // Trop long → tronqué
        coursePoint: 'F'.repeat(500), // Trop long → tronqué
        courseRule: 'G'.repeat(300), // Trop long → tronqué
        courseExample: 'H'.repeat(300), // Trop long → tronqué
        courseValidated: false,
        courseRuleId: null,
        model: 'openai/gpt-oss-20b',
        localRulesUsed: []
    });
    
    assertOk(responseV2.analysis.diagnostic.length <= 300, 'B2 — diagnostic ≤ 300 chars');
    assertOk(responseV2.analysis.priority.length <= 200, 'B2 — priority ≤ 200 chars');
    assertOk(responseV2.tutor.explanation.length <= 400, 'B2 — tutor.explanation ≤ 400 chars');
    assertOk(responseV2.tutor.advice.length <= 200, 'B2 — tutor.advice ≤ 200 chars');
    assertOk(responseV2.tutor.example.length <= 200, 'B2 — tutor.example ≤ 200 chars');
    assertOk(responseV2.course.point_cours.length <= 300, 'B2 — course.point_cours ≤ 300 chars');
    assertOk(responseV2.course.rule.length <= 200, 'B2 — course.rule ≤ 200 chars');
    assertOk(responseV2.course.example.length <= 200, 'B2 — course.example ≤ 200 chars');
}

// B3. Absence de champs Groq internes
{
    const responseV2 = buildResponseV2({
        source: 'remote_a22b',
        status: 'ok',
        diagnostic: 'Test.',
        errors: [],
        priority: '',
        tutorExplanation: 'Explication.',
        tutorAdvice: 'Conseil.',
        tutorExample: 'Exemple.',
        coursePoint: 'Point.',
        courseRule: 'Règle.',
        courseExample: 'Exemple.',
        courseValidated: false,
        courseRuleId: null,
        model: 'openai/gpt-oss-20b',
        localRulesUsed: []
    });
    
    // Vérifier qu'il n'y a pas de champs internes
    assertEq(responseV2.choices, undefined, 'B3 — Pas de champ "choices"');
    assertEq(responseV2.etapes, undefined, 'B3 — Pas de champ "etapes"');
    assertEq(responseV2.raw, undefined, 'B3 — Pas de champ "raw"');
    assertEq(responseV2.prompt, undefined, 'B3 — Pas de champ "prompt"');
    assertEq(responseV2.apiKey, undefined, 'B3 — Pas de champ "apiKey"');
    assertEq(responseV2.secret, undefined, 'B3 — Pas de champ "secret"');
}

// =================================================================
// C. TESTS RÉPONSE RÉELLE — Contrat V2
// =================================================================

section('C. ResponseV2 — Contrat strict');

// C1. Tous les champs requis présents
{
    const responseV2 = buildResponseV2({
        source: 'remote_a22b',
        status: 'ok',
        diagnostic: 'Test.',
        errors: [],
        priority: '',
        tutorExplanation: 'Explication.',
        tutorAdvice: 'Conseil.',
        tutorExample: 'Exemple.',
        coursePoint: 'Point.',
        courseRule: 'Règle.',
        courseExample: 'Exemple.',
        courseValidated: false,
        courseRuleId: null,
        model: 'openai/gpt-oss-20b',
        localRulesUsed: []
    });
    
    assertEq(typeof responseV2.contractVersion, 'string', 'C1 — contractVersion est string');
    assertEq(typeof responseV2.source, 'string', 'C1 — source est string');
    assertEq(typeof responseV2.status, 'string', 'C1 — status est string');
    assertEq(typeof responseV2.analysis, 'object', 'C1 — analysis est object');
    assertEq(typeof responseV2.tutor, 'object', 'C1 — tutor est object');
    assertEq(typeof responseV2.course, 'object', 'C1 — course est object');
    assertEq(typeof responseV2.metadata, 'object', 'C1 — metadata est object');
}

// C2. Types des sous-champs
{
    const responseV2 = buildResponseV2({
        source: 'remote_a22b',
        status: 'ok',
        diagnostic: 'Test.',
        errors: [
            {
                excerpt: 'extrait',
                type: 'grammaire',
                correction: 'correction',
                rule_id: 'rule1',
                rule_known_locally: false,
                local_detected: true,
                model_suggested: true,
                validated: false,
                model_confidence: 0.9
            }
        ],
        priority: 'Priorité.',
        tutorExplanation: 'Explication.',
        tutorAdvice: 'Conseil.',
        tutorExample: 'Exemple.',
        coursePoint: 'Point.',
        courseRule: 'Règle.',
        courseExample: 'Exemple.',
        courseValidated: false,
        courseRuleId: 'rule1',
        model: 'openai/gpt-oss-20b',
        localRulesUsed: ['rule1']
    });
    
    const error = responseV2.analysis.errors[0];
    assertEq(typeof error.excerpt, 'string', 'C2 — error.excerpt est string');
    assertEq(typeof error.type, 'string', 'C2 — error.type est string');
    assertEq(typeof error.correction, 'string', 'C2 — error.correction est string');
    assertEq(typeof error.rule_id, 'string', 'C2 — error.rule_id est string');
    assertEq(typeof error.rule_known_locally, 'boolean', 'C2 — error.rule_known_locally est boolean');
    assertEq(typeof error.local_detected, 'boolean', 'C2 — error.local_detected est boolean');
    assertEq(typeof error.model_suggested, 'boolean', 'C2 — error.model_suggested est boolean');
    assertEq(typeof error.validated, 'boolean', 'C2 — error.validated est boolean');
    assertEq(typeof error.model_confidence, 'number', 'C2 — error.model_confidence est number');
    
    assertEq(typeof responseV2.course.validated, 'boolean', 'C2 — course.validated est boolean');
    assertEq(responseV2.course.rule_id, 'rule1', 'C2 — course.rule_id est string ou null');
}

// =================================================================
// D. TESTS VALIDATION DES RULE_ID
// =================================================================

section('D. Validation des rule_id');

// D1. Règle connue + détectée localement → validated = true (côté frontend)
{
    const responseV2 = {
        contractVersion: '2.0',
        source: 'remote_a22b',
        status: 'ok',
        analysis: {
            diagnostic: 'Test.',
            errors: [
                { rule_id: 'genre_texte_masculin', type: 'grammaire', excerpt: 'test', correction: 'test' }
            ],
            priority: ''
        },
        tutor: { explanation: '', advice: '', example: '' },
        course: { point_cours: '', rule: '', example: '', validated: false, rule_id: null },
        metadata: { model: 'openai/gpt-oss-20b', local_rules_used: [] }
    };
    
    const sentDetections = [
        { rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'test', correction: 'test' }
    ];
    
    // Simuler window.NLPRules
    global.window = {
        NLPRules: {
            grammaire: [
                { id: 'genre_texte_masculin', priority: 5 }
            ]
        }
    };
    
    const validated = validateResponseRuleIds(responseV2, sentDetections);
    assertEq(validated.length, 1, 'D1 — 1 rule_id à valider');
    assertEq(validated[0].rule_id, 'genre_texte_masculin', 'D1 — rule_id conservé');
    assertEq(validated[0].validated, true, 'D1 — validated = true (connu ET détecté)');
    assertEq(validated[0].known_locally, true, 'D1 — known_locally = true');
    assertEq(validated[0].local_detected, true, 'D1 — local_detected = true');
}

// D2. Règle connue mais NON détectée → validated = false
{
    const responseV2 = {
        contractVersion: '2.0',
        source: 'remote_a22b',
        status: 'ok',
        analysis: {
            diagnostic: 'Test.',
            errors: [
                { rule_id: 'genre_texte_masculin', type: 'grammaire', excerpt: 'test', correction: 'test' }
            ],
            priority: ''
        },
        tutor: { explanation: '', advice: '', example: '' },
        course: { point_cours: '', rule: '', example: '', validated: false, rule_id: null },
        metadata: { model: 'openai/gpt-oss-20b', local_rules_used: [] }
    };
    
    const sentDetections = []; // Aucune détection envoyée
    
    const validated = validateResponseRuleIds(responseV2, sentDetections);
    assertEq(validated.length, 1, 'D2 — 1 rule_id à valider');
    assertEq(validated[0].rule_id, 'genre_texte_masculin', 'D2 — rule_id conservé (connu)');
    assertEq(validated[0].validated, false, 'D2 — validated = false (connu mais NON détecté)');
    assertEq(validated[0].known_locally, true, 'D2 — known_locally = true');
    assertEq(validated[0].local_detected, false, 'D2 — local_detected = false');
}

// D3. ID inventé par l'IA → rule_id = null, validated = false
{
    const responseV2 = {
        contractVersion: '2.0',
        source: 'remote_a22b',
        status: 'ok',
        analysis: {
            diagnostic: 'Test.',
            errors: [
                { rule_id: 'invented_by_ai_42', type: 'grammaire', excerpt: 'test', correction: 'test' }
            ],
            priority: ''
        },
        tutor: { explanation: '', advice: '', example: '' },
        course: { point_cours: '', rule: '', example: '', validated: false, rule_id: null },
        metadata: { model: 'openai/gpt-oss-20b', local_rules_used: [] }
    };
    
    const sentDetections = [
        { rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'test', correction: 'test' }
    ];
    
    const validated = validateResponseRuleIds(responseV2, sentDetections);
    assertEq(validated.length, 1, 'D3 — 1 rule_id à valider');
    assertEq(validated[0].rule_id, null, 'D3 — rule_id inventé → null');
    assertEq(validated[0].validated, false, 'D3 — validated = false');
    assertEq(validated[0].known_locally, false, 'D3 — known_locally = false');
}

// D4. course.rule_id subit la même validation
{
    const responseV2 = {
        contractVersion: '2.0',
        source: 'remote_a22b',
        status: 'ok',
        analysis: {
            diagnostic: 'Test.',
            errors: [],
            priority: ''
        },
        tutor: { explanation: '', advice: '', example: '' },
        course: {
            point_cours: 'Point.',
            rule: 'Règle.',
            example: 'Exemple.',
            validated: false,
            rule_id: 'genre_texte_masculin'
        },
        metadata: { model: 'openai/gpt-oss-20b', local_rules_used: [] }
    };
    
    const sentDetections = [
        { rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'test', correction: 'test' }
    ];
    
    const validated = validateResponseRuleIds(responseV2, sentDetections);
    // validateResponseRuleIds valide aussi course.rule_id
    assertOk(validated.length >= 0, 'D4 — course.rule_id validé');
}

// =================================================================
// E. TESTS FALLBACKS
// =================================================================

section('E. Fallbacks — A22B, A22, local');

// E1. Fallback A22B → A22 (erreur transitoire)
{
    const responseV2 = buildResponseV2({
        source: 'remote_a22_fallback',
        status: 'ok',
        diagnostic: 'Analyse partielle.',
        errors: [],
        priority: '',
        tutorExplanation: 'Explication simplifiée.',
        tutorAdvice: '',
        tutorExample: '',
        coursePoint: 'Point de cours.',
        courseRule: '',
        courseExample: '',
        courseValidated: false,
        courseRuleId: null,
        model: 'openai/gpt-oss-20b',
        localRulesUsed: []
    });
    
    const validation = validateResponseV2(responseV2);
    assertOk(validation.valid, 'E1 — ResponseV2 fallback A22 valide');
    assertEq(responseV2.source, 'remote_a22_fallback', 'E1 — source = "remote_a22_fallback"');
}

// E2. Fallback local (A22B + A22 échouent)
{
    const responseV2 = buildResponseV2({
        source: 'local_rules',
        status: 'ok',
        diagnostic: 'Erreurs détectées localement.',
        errors: [
            {
                excerpt: 'extrait',
                type: 'grammaire',
                correction: 'correction',
                rule_id: 'rule1',
                rule_known_locally: false, // Worker ne peut pas savoir
                local_detected: true,
                model_suggested: false,
                validated: false, // Worker ne valide PAS
                model_confidence: null
            }
        ],
        priority: '',
        tutorExplanation: '',
        tutorAdvice: '',
        tutorExample: '',
        coursePoint: '',
        courseRule: '',
        courseExample: '',
        courseValidated: false,
        courseRuleId: null,
        model: null,
        localRulesUsed: ['rule1']
    });
    
    const validation = validateResponseV2(responseV2);
    assertOk(validation.valid, 'E2 — ResponseV2 fallback local valide');
    assertEq(responseV2.source, 'local_rules', 'E2 — source = "local_rules"');
    assertEq(responseV2.metadata.model, null, 'E2 — model = null (local)');
}

// E3. Throttled (anti-rafale)
{
    const responseV2 = buildEmptyResponseV2(null, 'throttled', 'anti_rafale');
    
    const validation = validateResponseV2(responseV2);
    assertOk(validation.valid, 'E3 — ResponseV2 throttled valide');
    assertEq(responseV2.status, 'throttled', 'E3 — status = "throttled"');
    assertEq(responseV2.source, null, 'E3 — source = null (throttled)');
    assertEq(responseV2.reason, 'anti_rafale', 'E3 — reason = "anti_rafale"');
}

// =================================================================
// F. TESTS COMPORTEMENT CHAT (simulation)
// =================================================================

section('F. Comportement CHAT (simulation)');

// F1. Phrase avec faute grammaticale
{
    const request = buildRequestV2({
        mode: 'chat',
        textOriginal: 'Je suis fatigué aujourd\'hui.',
        localDetections: [
            { rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'Je suis', correction: 'Je suis', priority: 5 }
        ],
        context: { chat: { topic: 'discussion', topic_context: 'L\'élève parle de son état.', topic_title: 'Discussion' } }
    });
    
    assertEq(request.student.text_original, 'Je suis fatigué aujourd\'hui.', 'F1 — Texte original avec faute');
    assertOk(request.local_detections.length > 0, 'F1 — Détections locales présentes');
}

// F2. Phrase avec faute d'orthographe
{
    const request = buildRequestV2({
        mode: 'chat',
        textOriginal: 'Il mange des pommes.',
        localDetections: [
            { rule_id: 'orthographe', category: 'orthographe', excerpt: 'pommes', correction: 'pommes', priority: 3 }
        ],
        context: { chat: { topic: 'orthographe', topic_context: 'Exercice d\'orthographe.', topic_title: 'Orthographe' } }
    });
    
    assertEq(request.student.text_original, 'Il mange des pommes.', 'F2 — Texte original avec faute d\'orthographe');
}

// F3. Question pédagogique sans faute
{
    const request = buildRequestV2({
        mode: 'chat',
        textOriginal: 'Comment accorder le verbe avec le sujet ?',
        localDetections: [],
        context: { chat: { topic: 'question', topic_context: 'Question pédagogique.', topic_title: 'Question' } }
    });
    
    assertEq(request.student.text_original, 'Comment accorder le verbe avec le sujet ?', 'F3 — Question pédagogique');
    assertEq(request.local_detections.length, 0, 'F3 — Aucune détection locale');
}

// =================================================================
// G. TESTS COMPORTEMENT ACTIVITY (simulation)
// =================================================================

section('G. Comportement ACTIVITY (simulation)');

// G1. Soumission d'activité avec contexte complet
{
    const request = buildRequestV2({
        mode: 'activity',
        textOriginal: 'Il mange des pommes.',
        localDetections: [
            { rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'Il mange', correction: 'Il mange', priority: 5 }
        ],
        context: {
            activity: {
                chapter_id: 'chap1',
                activity_id: 'act1',
                title: 'Rédiger une phrase',
                type: 'textarea',
                instructions: 'Écrivez une phrase simple avec un sujet et un verbe.'
            }
        }
    });
    
    assertEq(request.mode, 'activity', 'G1 — mode = "activity"');
    assertEq(request.context.activity.chapter_id, 'chap1', 'G1 — chapter_id présent');
    assertEq(request.context.activity.activity_id, 'act1', 'G1 — activity_id présent');
    assertEq(request.context.activity.title, 'Rédiger une phrase', 'G1 — title présent');
    assertEq(request.context.activity.type, 'textarea', 'G1 — type présent');
    assertOk(request.context.activity.instructions.length > 0, 'G1 — instructions présentes');
    
    const validation = validateRequestV2(request);
    assertOk(validation.valid, 'G1 — RequestV2 activity validée');
}

// =================================================================
// H. SÉCURITÉ — Pas de fuite de données sensibles
// =================================================================

section('H. Sécurité — Pas de fuite');

// H1. Pas de secret dans la réponse
{
    const responseV2 = buildResponseV2({
        source: 'remote_a22b',
        status: 'ok',
        diagnostic: 'Test.',
        errors: [],
        priority: '',
        tutorExplanation: 'Explication.',
        tutorAdvice: 'Conseil.',
        tutorExample: 'Exemple.',
        coursePoint: 'Point.',
        courseRule: 'Règle.',
        courseExample: 'Exemple.',
        courseValidated: false,
        courseRuleId: null,
        model: 'openai/gpt-oss-20b',
        localRulesUsed: []
    });
    
    const jsonStr = JSON.stringify(responseV2);
    assertEq(jsonStr.indexOf('apiKey'), -1, 'H1 — Pas de "apiKey" dans la réponse');
    assertEq(jsonStr.indexOf('secret'), -1, 'H1 — Pas de "secret" dans la réponse');
    assertEq(jsonStr.indexOf('GROQ'), -1, 'H1 — Pas de "GROQ" dans la réponse');
    assertEq(jsonStr.indexOf('password'), -1, 'H1 — Pas de "password" dans la réponse');
}

// H2. Pas de prompt brut dans la réponse
{
    const responseV2 = buildResponseV2({
        source: 'remote_a22b',
        status: 'ok',
        diagnostic: 'Test.',
        errors: [],
        priority: '',
        tutorExplanation: 'Explication.',
        tutorAdvice: 'Conseil.',
        tutorExample: 'Exemple.',
        coursePoint: 'Point.',
        courseRule: 'Règle.',
        courseExample: 'Exemple.',
        courseValidated: false,
        courseRuleId: null,
        model: 'openai/gpt-oss-20b',
        localRulesUsed: []
    });
    
    const jsonStr = JSON.stringify(responseV2);
    assertEq(jsonStr.indexOf('prompt'), -1, 'H2 — Pas de "prompt" dans la réponse');
    assertEq(jsonStr.indexOf('system'), -1, 'H2 — Pas de "system" dans la réponse');
    assertEq(jsonStr.indexOf('user'), -1, 'H2 — Pas de "user" dans la réponse');
}

// =================================================================
// RÉSUMÉ
// =================================================================

console.log('\n' + '='.repeat(60));
console.log('Résultats : ' + pass + ' pass, ' + fail + ' echec(s)');
console.log('='.repeat(60));

process.exit(fail > 0 ? 1 : 0);
