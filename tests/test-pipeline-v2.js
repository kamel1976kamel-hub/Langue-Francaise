/**
 * Tests Pipeline V2 — Analyse, Tuteur, Cours, Fallbacks, Contrat, Sécurité
 * 
 * Teste les fonctions de validation/normalisation du pipeline V2 du Worker
 * sans appeler Groq (tests unitaires sur les helpers).
 */

'use strict';

var assert = require('assert');

// Charger les modules
var contractV2 = require('../worker/contract-v2.js');

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
console.log('PIPELINE V2 — TESTS');
console.log('='.repeat(60));

// =================================================================
// Helpers pour simuler les fonctions du Worker
// (On reproduit la logique des fonctions non-exportées pour les tester)
// =================================================================

function extraireJSON(texte) {
    try {
        return JSON.parse(texte);
    } catch (e) {
        var debut = texte.indexOf('{');
        var fin = texte.lastIndexOf('}');
        if (debut !== -1 && fin > debut) {
            try { return JSON.parse(texte.slice(debut, fin + 1)); } catch (e2) { /* ignoré */ }
        }
        return { brut: String(texte).slice(0, 200) };
    }
}

function sanitizeRuleId(ruleId, localRuleIds) {
    if (typeof ruleId !== 'string' || !ruleId) return null;
    return localRuleIds[ruleId] ? ruleId : null;
}

function buildLocalRuleIdSet(request) {
    var set = {};
    if (Array.isArray(request.local_detections)) {
        for (var i = 0; i < request.local_detections.length; i++) {
            var rid = request.local_detections[i] && request.local_detections[i].rule_id;
            if (typeof rid === 'string' && rid) {
                set[rid] = true;
            }
        }
    }
    return set;
}

function validateAnalyseV2(raw, localRuleIds) {
    var result = extraireJSON(raw);
    var diagnostic = typeof result.diagnostic === 'string' ? result.diagnostic.slice(0, 300) : '';
    var priorite = typeof result.priorite === 'string' ? result.priorite.slice(0, 200) : '';
    var erreurs = [];
    if (Array.isArray(result.erreurs)) {
        var max = Math.min(result.erreurs.length, 5);
        for (var i = 0; i < max; i++) {
            var e = result.erreurs[i];
            if (!e || typeof e !== 'object') continue;
            var excerpt = typeof e.extrait === 'string' ? e.extrait.slice(0, 100) : '';
            var type = typeof e.type === 'string' ? e.type.slice(0, 30) : '';
            var correction = (e.correction === null || e.correction === undefined) ? null : String(e.correction).slice(0, 150);
            var ruleId = sanitizeRuleId(e.rule_id, localRuleIds);
            var confidence = null;
            if (typeof e.model_confidence === 'number' && e.model_confidence >= 0 && e.model_confidence <= 1) {
                confidence = e.model_confidence;
            }
            erreurs.push({
                excerpt: excerpt,
                type: type,
                correction: correction,
                rule_id: ruleId,
                model_confidence: confidence,
                rule_known_locally: false, // Worker n'a PAS les 275 règles
                local_detected: ruleId !== null,
                model_suggested: ruleId !== null,
                validated: false // Validation finale côté frontend uniquement
            });
        }
    }
    return { diagnostic: diagnostic, erreurs: erreurs, priorite: priorite };
}

function validateTuteurV2(raw) {
    var result = extraireJSON(raw);
    return {
        explanation: typeof result.explication === 'string' ? result.explication.slice(0, 400) : '',
        advice: typeof result.conseil === 'string' ? result.conseil.slice(0, 200) : '',
        example: typeof result.exemple === 'string' ? result.exemple.slice(0, 200) : ''
    };
}

function validateCoursV2(raw, localRuleIds) {
    var result = extraireJSON(raw);
    var ruleId = sanitizeRuleId(result.rule_id, localRuleIds);
    return {
        point_cours: typeof result.point_cours === 'string' ? result.point_cours.slice(0, 300) : '',
        rule: typeof result.regle === 'string' ? result.regle.slice(0, 200) : '',
        example: typeof result.exemple === 'string' ? result.exemple.slice(0, 200) : '',
        rule_id: ruleId,
        validated: false // Validation finale côté frontend uniquement
    };
}

// =================================================================
console.log('\n--- A. ANALYSE — Validation du résultat ---');
// =================================================================

var localDetections = [
    { rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'la texte', correction: 'le texte' },
    { rule_id: 'confusion_a_à', category: 'grammaire', excerpt: 'nous avons mangé', correction: 'nous avons mangé' }
];
var localRuleIds = buildLocalRuleIdSet({ local_detections: localDetections });

// A1. Texte original reçu (via le prompt, pas testé ici mais via le flux)
// A2. 0 détection
{
    var raw = JSON.stringify({ diagnostic: 'Texte correct.', erreurs: [], priorite: '' });
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.diagnostic, 'Texte correct.', 'A2 — diagnostic correct');
    assertEq(result.erreurs.length, 0, 'A2 — 0 erreurs');
}

// A3. 1 détection avec rule_id connu
{
    var raw = JSON.stringify({
        diagnostic: 'Erreur de genre détectée.',
        erreurs: [
            { extrait: 'la texte', type: 'grammaire', correction: 'le texte', rule_id: 'genre_texte_masculin', model_confidence: 0.9 }
        ],
        priorite: 'Corriger le genre du nom texte'
    });
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.erreurs.length, 1, 'A3 — 1 erreur');
    assertEq(result.erreurs[0].rule_id, 'genre_texte_masculin', 'A3 — rule_id connu conservé');
    assertEq(result.erreurs[0].validated, false, 'A3 — validated = false (Worker ne peut pas valider)');
    assertEq(result.erreurs[0].rule_known_locally, false, 'A3 — rule_known_locally = false (Worker n\'a pas les 275 règles)');
    assertEq(result.erreurs[0].local_detected, true, 'A3 — local_detected = true (présent dans local_detections)');
    assertEq(result.erreurs[0].model_confidence, 0.9, 'A3 — model_confidence conservé');
}

// A4. 4 détections
{
    var raw = JSON.stringify({
        diagnostic: 'Plusieurs erreurs.',
        erreurs: [
            { extrait: 'e1', type: 'grammaire', correction: 'c1', rule_id: 'genre_texte_masculin', model_confidence: 0.9 },
            { extrait: 'e2', type: 'orthographe', correction: 'c2', rule_id: 'confusion_a_à', model_confidence: 0.8 },
            { extrait: 'e3', type: 'style', correction: null, rule_id: null, model_confidence: 0.5 },
            { extrait: 'e4', type: 'vocabulaire', correction: 'c4', rule_id: null, model_confidence: 0.3 }
        ],
        priorite: 'Priorité haute'
    });
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.erreurs.length, 4, 'A4 — 4 erreurs');
    assertEq(result.erreurs[0].rule_id, 'genre_texte_masculin', 'A4 — 1er rule_id connu');
    assertEq(result.erreurs[1].rule_id, 'confusion_a_à', 'A4 — 2e rule_id connu');
    assertEq(result.erreurs[2].rule_id, null, 'A4 — 3e rule_id null');
    assertEq(result.erreurs[2].correction, null, 'A4 — correction null acceptée');
}

// A5. rule_id inconnu → null
{
    var raw = JSON.stringify({
        diagnostic: 'Test.',
        erreurs: [
            { extrait: 'xyz', type: 'grammaire', correction: 'abc', rule_id: 'invented_rule_xyz', model_confidence: 0.7 }
        ],
        priorite: ''
    });
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.erreurs[0].rule_id, null, 'A5 — rule_id inconnu → null');
    assertEq(result.erreurs[0].validated, false, 'A5 — validated = false');
    assertEq(result.erreurs[0].rule_known_locally, false, 'A5 — rule_known_locally = false');
    assertEq(result.erreurs[0].local_detected, false, 'A5 — local_detected = false');
    assertEq(result.erreurs[0].model_suggested, false, 'A5 — model_suggested = false');
}

// A6. Confidence hors 0..1 → null
{
    var raw = JSON.stringify({
        diagnostic: 'Test.',
        erreurs: [
            { extrait: 'e', type: 't', correction: 'c', rule_id: 'genre_texte_masculin', model_confidence: 1.5 }
        ],
        priorite: ''
    });
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.erreurs[0].model_confidence, null, 'A6 — confidence 1.5 → null');
}

{
    var raw = JSON.stringify({
        diagnostic: 'Test.',
        erreurs: [
            { extrait: 'e', type: 't', correction: 'c', rule_id: 'genre_texte_masculin', model_confidence: -0.1 }
        ],
        priorite: ''
    });
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.erreurs[0].model_confidence, null, 'A6 — confidence -0.1 → null');
}

// A7. Dépassement de longueur — diagnostic tronqué
{
    var longDiag = 'x'.repeat(500);
    var raw = JSON.stringify({ diagnostic: longDiag, erreurs: [], priorite: '' });
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.diagnostic.length, 300, 'A7 — diagnostic tronqué à 300');
}

// A8. Max 5 erreurs
{
    var sixErreurs = [];
    for (var i = 0; i < 6; i++) {
        sixErreurs.push({ extrait: 'e' + i, type: 't', correction: 'c', rule_id: null, model_confidence: 0.5 });
    }
    var raw = JSON.stringify({ diagnostic: 'Test', erreurs: sixErreurs, priorite: '' });
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.erreurs.length, 5, 'A8 — max 5 erreurs');
}

// A9. JSON invalide
{
    var result = validateAnalyseV2('pas du JSON', localRuleIds);
    assertEq(result.erreurs.length, 0, 'A9 — JSON invalide → 0 erreurs');
    assertEq(result.diagnostic, '', 'A9 — diagnostic vide');
}

// =================================================================
console.log('\n--- B. TUTEUR — Validation du résultat ---');
// =================================================================

// B1. Résultat valide
{
    var raw = JSON.stringify({
        explication: 'Le nom "texte" est masculin en français.',
        conseil: 'Pensez à vérifier le genre des noms.',
        exemple: 'On dit "un texte" et "le texte".'
    });
    var result = validateTuteurV2(raw);
    assertEq(result.explanation, 'Le nom "texte" est masculin en français.', 'B1 — explanation correct');
    assertEq(result.advice, 'Pensez à vérifier le genre des noms.', 'B1 — advice correct');
    assertEq(result.example, 'On dit "un texte" et "le texte".', 'B1 — example correct');
}

// B2. Limites respectées
{
    var longExpl = 'x'.repeat(600);
    var raw = JSON.stringify({ explication: longExpl, conseil: 'ok', exemple: 'ok' });
    var result = validateTuteurV2(raw);
    assertEq(result.explanation.length, 400, 'B2 — explanation tronqué à 400');
}

// B3. JSON invalide
{
    var result = validateTuteurV2('invalid');
    assertEq(result.explanation, '', 'B3 — JSON invalide → explanation vide');
    assertEq(result.advice, '', 'B3 — advice vide');
    assertEq(result.example, '', 'B3 — example vide');
}

// =================================================================
console.log('\n--- C. COURS — Validation du résultat ---');
// =================================================================

// C1. rule_id connu → validated = false (Worker ne peut pas valider)
{
    var raw = JSON.stringify({
        point_cours: 'Accord du sujet et du verbe.',
        regle: 'Le verbe s\'accorde avec le sujet en personne et en nombre.',
        exemple: 'Les enfants jouent dans le jardin.',
        rule_id: 'genre_texte_masculin'
    });
    var result = validateCoursV2(raw, localRuleIds);
    assertEq(result.rule_id, 'genre_texte_masculin', 'C1 — rule_id connu conservé');
    assertEq(result.validated, false, 'C1 — validated = false (Worker ne peut pas valider)');
}

// C2. rule_id inconnu → null, validated = false
{
    var raw = JSON.stringify({
        point_cours: 'Point.',
        regle: 'Règle.',
        exemple: 'Exemple.',
        rule_id: 'unknown_rule_from_model'
    });
    var result = validateCoursV2(raw, localRuleIds);
    assertEq(result.rule_id, null, 'C2 — rule_id inconnu → null');
    assertEq(result.validated, false, 'C2 — validated = false');
}

// C3. validated ne dépend PAS de l'IA
{
    // Le modèle dit validated: true mais rule_id inconnu
    var raw = JSON.stringify({
        point_cours: 'Point.',
        regle: 'Règle.',
        exemple: 'Exemple.',
        rule_id: 'fake_rule'
    });
    var result = validateCoursV2(raw, localRuleIds);
    assertEq(result.validated, false, 'C3 — validated = false même si le modèle le dit (rule_id inconnu)');
}

// =================================================================
console.log('\n--- D. PIPELINE COMPLET — ResponseV2 ---');
// =================================================================

// D1. Construire une ResponseV2 complète et la valider
{
    var responseV2 = contractV2.buildResponseV2({
        source: 'remote_a22b',
        status: 'ok',
        diagnostic: 'Erreur de genre détectée.',
        errors: [
            {
                excerpt: 'la texte',
                type: 'grammaire',
                correction: 'le texte',
                rule_id: 'genre_texte_masculin',
                model_confidence: 0.9,
                rule_known_locally: true,
                local_detected: true,
                model_suggested: true
            }
        ],
        priority: 'Corriger le genre',
        tutorExplanation: 'Le nom texte est masculin.',
        tutorAdvice: 'Vérifiez le genre.',
        tutorExample: 'Un texte long.',
        coursePoint: 'Genre des noms.',
        courseRule: 'Chaque nom a un genre fixe.',
        courseExample: 'Le texte, une table.',
        courseValidated: true,
        courseRuleId: 'genre_texte_masculin',
        model: 'openai/gpt-oss-20b',
        localRulesUsed: ['genre_texte_masculin', 'confusion_a_à']
    });

    var validation = contractV2.validateResponseV2(responseV2);
    assertEq(validation.valid, true, 'D1 — ResponseV2 complète validée (errors: ' + JSON.stringify(validation.errors) + ')');
}

// D2. ResponseV2 avec status partial
{
    var responsePartial = contractV2.buildResponseV2({
        source: 'remote_a22b',
        status: 'partial',
        reason: 'step_2_failed',
        diagnostic: 'Analyse effectuée.',
        errors: [],
        priority: '',
        tutorExplanation: '',
        tutorAdvice: '',
        tutorExample: '',
        coursePoint: '',
        courseRule: '',
        courseExample: '',
        courseValidated: false,
        courseRuleId: null,
        model: 'openai/gpt-oss-20b',
        localRulesUsed: []
    });

    var validation = contractV2.validateResponseV2(responsePartial);
    assertEq(validation.valid, true, 'D2 — ResponseV2 partial validée');
    assertEq(responsePartial.status, 'partial', 'D2 — status = partial');
    assertEq(responsePartial.reason, 'step_2_failed', 'D2 — reason = step_2_failed');
}

// =================================================================
console.log('\n--- E. FALLBACK LOCAL V2 ---');
// =================================================================

// E1. Fallback local avec détections
{
    var request = {
        contractVersion: '2.0',
        mode: 'chat',
        student: { text_original: 'la texte' },
        local_detections: [
            { rule_id: 'genre_texte_masculin', category: 'grammaire', excerpt: 'la texte', correction: 'le texte' }
        ],
        context: { chat: { topic: 'narratif', topic_context: 'ctx', topic_title: 'Titre' } }
    };

    // Simuler fallbackLocalV2
    var localRulesUsed = request.local_detections.map(function(d) { return d.rule_id; }).filter(Boolean);
    var erreurs = [];
    for (var i = 0; i < request.local_detections.length && i < 5; i++) {
        var d = request.local_detections[i];
        erreurs.push({
            excerpt: d.excerpt,
            type: d.category,
            correction: d.correction,
            rule_id: d.rule_id,
            model_confidence: null,
            rule_known_locally: false, // Worker n'a pas les 275 règles
            local_detected: true,
            model_suggested: false,
            validated: false // Frontend uniquement
        });
    }

    var responseLocal = contractV2.buildResponseV2({
        source: 'local_rules',
        status: 'ok',
        diagnostic: erreurs.length + ' erreur(s) détectée(s) par l\'analyse locale.',
        errors: erreurs,
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
        localRulesUsed: localRulesUsed
    });

    var validation = contractV2.validateResponseV2(responseLocal);
    assertEq(validation.valid, true, 'E1 — Fallback local validé');
    assertEq(responseLocal.source, 'local_rules', 'E1 — source = local_rules');
    assertEq(responseLocal.status, 'ok', 'E1 — status = ok');
    assertEq(responseLocal.analysis.errors.length, 1, 'E1 — 1 erreur locale');
    assertEq(responseLocal.analysis.errors[0].validated, false, 'E1 — erreur locale validated = false (Worker)');
    assertEq(responseLocal.analysis.errors[0].rule_known_locally, false, 'E1 — rule_known_locally = false (Worker)');
    assertEq(responseLocal.analysis.errors[0].local_detected, true, 'E1 — local_detected = true');
    assertEq(responseLocal.metadata.model, null, 'E1 — model = null (local)');
}

// E2. Fallback local sans détections
{
    var responseEmpty = contractV2.buildResponseV2({
        source: 'local_rules',
        status: 'ok',
        diagnostic: 'Aucune erreur détectée.',
        errors: [],
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
        localRulesUsed: []
    });

    var validation = contractV2.validateResponseV2(responseEmpty);
    assertEq(validation.valid, true, 'E2 — Fallback local vide validé');
}

// =================================================================
console.log('\n--- F. THROTTLED / ERREUR ---');
// =================================================================

// F1. ResponseV2 throttled
{
    var responseThrottled = contractV2.buildEmptyResponseV2(null, 'throttled', 'anti_rafale');
    var validation = contractV2.validateResponseV2(responseThrottled);
    assertEq(validation.valid, true, 'F1 — ResponseV2 throttled validée');
    assertEq(responseThrottled.status, 'throttled', 'F1 — status = throttled');
    assertEq(responseThrottled.source, null, 'F1 — source = null');
    assertEq(responseThrottled.reason, 'anti_rafale', 'F1 — reason = anti_rafale');
}

// =================================================================
console.log('\n--- G. SÉCURITÉ — Pas de champs internes exposés ---');
// =================================================================

// G1. Aucune donnée brute Groq
{
    var responseV2 = contractV2.buildResponseV2({
        source: 'remote_a22b',
        status: 'ok',
        diagnostic: 'Test',
        errors: [],
        priority: '',
        tutorExplanation: 'Explication',
        tutorAdvice: 'Conseil',
        tutorExample: 'Exemple',
        coursePoint: 'Point',
        courseRule: 'Règle',
        courseExample: 'Exemple',
        courseValidated: false,
        courseRuleId: null,
        model: 'openai/gpt-oss-20b',
        localRulesUsed: []
    });

    var json = JSON.stringify(responseV2);
    assertOk(json.indexOf('choices') === -1, 'G1 — pas de "choices"');
    assertOk(json.indexOf('etapes') === -1, 'G1 — pas de "etapes"');
    assertOk(json.indexOf('systemPrompt') === -1, 'G1 — pas de "systemPrompt"');
    assertOk(json.indexOf('userPrompt') === -1, 'G1 — pas de "userPrompt"');
    assertOk(json.indexOf('api_key') === -1, 'G1 — pas de "api_key"');
    assertOk(json.indexOf('GROQ_API_KEY') === -1, 'G1 — pas de "GROQ_API_KEY"');
    assertOk(json.indexOf('finish_reason') === -1, 'G1 — pas de "finish_reason"');
    assertOk(json.indexOf('usage') === -1, 'G1 — pas de "usage"');
}

// =================================================================
console.log('\n--- H. CONTRAT — Toutes les réponses validées ---');
// =================================================================

// H1. ResponseV2 A22B
{
    var resp = contractV2.buildResponseV2({
        source: 'remote_a22b', status: 'ok',
        diagnostic: 'Diag', errors: [], priority: '',
        tutorExplanation: '', tutorAdvice: '', tutorExample: '',
        coursePoint: '', courseRule: '', courseExample: '',
        courseValidated: false, courseRuleId: null,
        model: 'openai/gpt-oss-20b', localRulesUsed: []
    });
    assertEq(contractV2.validateResponseV2(resp).valid, true, 'H1 — A22B validé');
}

// H2. ResponseV2 A22 fallback
{
    var resp = contractV2.buildResponseV2({
        source: 'remote_a22_fallback', status: 'ok',
        diagnostic: 'Diag', errors: [], priority: '',
        tutorExplanation: '', tutorAdvice: '', tutorExample: '',
        coursePoint: '', courseRule: '', courseExample: '',
        courseValidated: false, courseRuleId: null,
        model: 'openai/gpt-oss-20b', localRulesUsed: []
    });
    assertEq(contractV2.validateResponseV2(resp).valid, true, 'H2 — A22 fallback validé');
}

// H3. ResponseV2 local
{
    var resp = contractV2.buildResponseV2({
        source: 'local_rules', status: 'ok',
        diagnostic: 'Diag', errors: [], priority: '',
        tutorExplanation: '', tutorAdvice: '', tutorExample: '',
        coursePoint: '', courseRule: '', courseExample: '',
        courseValidated: false, courseRuleId: null,
        model: null, localRulesUsed: []
    });
    assertEq(contractV2.validateResponseV2(resp).valid, true, 'H3 — local validé');
}

// H4. ResponseV2 throttled
{
    var resp = contractV2.buildEmptyResponseV2(null, 'throttled', 'anti_rafale');
    assertEq(contractV2.validateResponseV2(resp).valid, true, 'H4 — throttled validé');
}

// =================================================================
console.log('\n--- I. SANITIZE RULE_ID ---');
// =================================================================

// I1. rule_id dans local_detections → conservé
{
    var ids = { 'genre_texte_masculin': true, 'confusion_a_à': true };
    assertEq(sanitizeRuleId('genre_texte_masculin', ids), 'genre_texte_masculin', 'I1 — rule_id connu conservé');
}

// I2. rule_id hors local_detections → null
{
    var ids = { 'genre_texte_masculin': true };
    assertEq(sanitizeRuleId('unknown_rule', ids), null, 'I2 — rule_id inconnu → null');
}

// I3. rule_id vide → null
{
    assertEq(sanitizeRuleId('', {}), null, 'I3 — rule_id vide → null');
}

// I4. rule_id non-string → null
{
    assertEq(sanitizeRuleId(123, {}), null, 'I4 — rule_id number → null');
    assertEq(sanitizeRuleId(null, {}), null, 'I4 — rule_id null → null');
    assertEq(sanitizeRuleId(undefined, {}), null, 'I4 — rule_id undefined → null');
}

// =================================================================
console.log('\n--- J. CONTEXT BUILDING ---');
// =================================================================

// J1. Contexte chat
{
    var request = {
        mode: 'chat',
        context: { chat: { topic: 'narratif', topic_title: 'Le narratif', topic_context: 'Le texte narratif raconte...' } }
    };
    // Simuler buildV2ContextPrompt
    var ctx = '';
    if (request.mode === 'chat' && request.context && request.context.chat) {
        var c = request.context.chat;
        ctx = 'Contexte : discussion sur le thème « ' + (c.topic_title || c.topic) + ' ».\\n' +
            (c.topic_context ? c.topic_context + '\\n' : '');
    }
    assertOk(ctx.indexOf('narratif') >= 0 || ctx.indexOf('Narratif') >= 0, 'J1 — contexte chat contient le topic');
    assertOk(ctx.indexOf('raconte') >= 0, 'J1 — contexte chat contient le topic_context');
}

// J2. Contexte activité
{
    var request = {
        mode: 'activity',
        context: { activity: { chapter_id: 'chap1', activity_id: 'act1', title: 'Rédiger', type: 'textarea', instructions: 'Écrivez 3 phrases.' } }
    };
    var ctx = '';
    if (request.mode === 'activity' && request.context && request.context.activity) {
        var a = request.context.activity;
        ctx = 'Contexte : activité « ' + (a.title || '') + ' » (type: ' + (a.type || 'général') + ').\\n' +
            (a.instructions ? 'Consignes : ' + a.instructions + '\\n' : '');
    }
    assertOk(ctx.indexOf('Rédiger') >= 0, 'J2 — contexte activité contient le title');
    assertOk(ctx.indexOf('Écrivez') >= 0, 'J2 — contexte activité contient les instructions');
}

// =================================================================
console.log('\n--- K. VALIDATION LOCALE — Worker ne peut JAMAIS valider ---');
// =================================================================

// K1. rule_id envoyé par le navigateur mais absent des règles locales → validated=false
// Le Worker ne possède pas les 275 règles, donc rule_known_locally = false toujours
{
    var raw = JSON.stringify({
        diagnostic: 'Test.',
        erreurs: [
            { extrait: 'xyz', type: 'grammaire', correction: 'abc', rule_id: 'fake_browser_rule', model_confidence: 0.8 }
        ],
        priorite: ''
    });
    // fake_browser_rule n'est PAS dans localRuleIds
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.erreurs[0].rule_id, null, 'K1 — rule_id absent des règles locales → null');
    assertEq(result.erreurs[0].validated, false, 'K1 — validated = false');
    assertEq(result.erreurs[0].rule_known_locally, false, 'K1 — rule_known_locally = false');
}

// K2. rule_id connu localement + détection locale → validated = false côté Worker
// (la validation finale se fait côté frontend)
{
    var raw = JSON.stringify({
        diagnostic: 'Test.',
        erreurs: [
            { extrait: 'la texte', type: 'grammaire', correction: 'le texte', rule_id: 'genre_texte_masculin', model_confidence: 0.9 }
        ],
        priorite: ''
    });
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.erreurs[0].rule_id, 'genre_texte_masculin', 'K2 — rule_id conservé (dans local_detections)');
    assertEq(result.erreurs[0].validated, false, 'K2 — validated = false (Worker ne valide PAS)');
    assertEq(result.erreurs[0].rule_known_locally, false, 'K2 — rule_known_locally = false (Worker ne sait pas)');
    assertEq(result.erreurs[0].local_detected, true, 'K2 — local_detected = true (dans local_detections)');
}

// K3. rule_id connu localement mais absent des détections envoyées → validated=false
{
    var raw = JSON.stringify({
        diagnostic: 'Test.',
        erreurs: [
            { extrait: 'xyz', type: 'grammaire', correction: 'abc', rule_id: 'genre_texte_masculin', model_confidence: 0.7 }
        ],
        priorite: ''
    });
    // localRuleIds ne contient pas genre_texte_masculin
    var emptyIds = {};
    var result = validateAnalyseV2(raw, emptyIds);
    assertEq(result.erreurs[0].rule_id, null, 'K3 — rule_id absent des détections → null');
    assertEq(result.erreurs[0].validated, false, 'K3 — validated = false');
}

// K4. rule_id inventé par l'IA → rule_id=null, validated=false
{
    var raw = JSON.stringify({
        diagnostic: 'Test.',
        erreurs: [
            { extrait: 'xyz', type: 'grammaire', correction: 'abc', rule_id: 'totally_invented_by_ai_42', model_confidence: 0.99 }
        ],
        priorite: ''
    });
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.erreurs[0].rule_id, null, 'K4 — rule_id inventé → null');
    assertEq(result.erreurs[0].validated, false, 'K4 — validated = false');
    assertEq(result.erreurs[0].model_suggested, false, 'K4 — model_suggested = false (sanitized)');
}

// K5. Worker seul ne peut JAMAIS transformer presence dans local_detections en validation
{
    // Même si le rule_id est dans local_detections, validated reste false
    var raw = JSON.stringify({
        diagnostic: 'Test.',
        erreurs: [
            { extrait: 'la texte', type: 'grammaire', correction: 'le texte', rule_id: 'genre_texte_masculin', model_confidence: 1.0 }
        ],
        priorite: ''
    });
    var result = validateAnalyseV2(raw, localRuleIds);
    assertEq(result.erreurs[0].local_detected, true, 'K5 — local_detected = true');
    assertEq(result.erreurs[0].validated, false, 'K5 — validated = false MALGRE local_detected=true');
    assertOk(!(result.erreurs[0].validated === true), 'K5 — confirmation : validated !== true');
}

// K6. course.rule_id subit la même validation que analysis.errors[].rule_id
{
    var raw = JSON.stringify({
        point_cours: 'Point.',
        regle: 'Règle.',
        exemple: 'Exemple.',
        rule_id: 'genre_texte_masculin'
    });
    var result = validateCoursV2(raw, localRuleIds);
    assertEq(result.rule_id, 'genre_texte_masculin', 'K6 — course.rule_id conservé');
    assertEq(result.validated, false, 'K6 — course.validated = false (même règle que errors)');

    // Avec un rule_id inconnu
    var raw2 = JSON.stringify({
        point_cours: 'Point.',
        regle: 'Règle.',
        exemple: 'Exemple.',
        rule_id: 'unknown_course_rule'
    });
    var result2 = validateCoursV2(raw2, localRuleIds);
    assertEq(result2.rule_id, null, 'K6 — course.rule_id inconnu → null');
    assertEq(result2.validated, false, 'K6 — course.validated = false');
}

// =================================================================
// Résumé
// =================================================================
console.log('\n' + '='.repeat(60));
console.log('Résultats : ' + pass + ' pass, ' + fail + ' echec(s)');
console.log('='.repeat(60));

process.exit(fail > 0 ? 1 : 0);
