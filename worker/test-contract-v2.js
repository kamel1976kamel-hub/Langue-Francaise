/**
 * =================================================================
 * TESTS UNITAIRES — CONTRAT IA V2
 * =================================================================
 * Tests de validation RequestV2 et ResponseV2.
 * Module testé : worker/contract-v2.js
 * =================================================================
 */

let pass = 0, fail = 0, skip = 0;

function assert(cond, label) {
    if (cond) { pass++; console.log('  ✅ PASS — ' + label); }
    else { fail++; console.error('  ❌ ÉCHEC — ' + label); }
}

function assertEq(actual, expected, label) {
    assert(actual === expected, label + ' (attendu: ' + JSON.stringify(expected) + ', obtenu: ' + JSON.stringify(actual) + ')');
}

function assertDeepEq(actual, expected, label) {
    assert(JSON.stringify(actual) === JSON.stringify(expected), label);
}

// =================================================================
// HELPERS — Payloads valides
// =================================================================

function makeValidRequestChat(overrides) {
    const base = {
        contractVersion: "2.0",
        mode: "chat",
        student: {
            text_original: "la texte est important"
        },
        local_detections: [
            { rule_id: "genre_texte_masculin", category: "grammaire", excerpt: "la texte", correction: "le texte" }
        ],
        context: {
            chat: {
                topic: "grammaire",
                topic_context: "Accord en genre et en nombre.",
                topic_title: "Le genre des noms"
            }
        }
    };
    return Object.assign({}, base, overrides || {});
}

function makeValidRequestActivity(overrides) {
    const base = {
        contractVersion: "2.0",
        mode: "activity",
        student: {
            text_original: "Le vent est dû à des différences de pression"
        },
        local_detections: [],
        context: {
            activity: {
                chapter_id: "explicatif-1",
                activity_id: "2",
                title: "Séquence 1 · Activité 2 – Analyse d'un texte",
                type: "tri-inductif",
                instructions: "Repérer les marques de la visée explicative."
            }
        }
    };
    return Object.assign({}, base, overrides || {});
}

function makeValidResponseOk(overrides) {
    const base = {
        contractVersion: "2.0",
        source: "remote_a22b",
        status: "ok",
        analysis: {
            diagnostic: "Test diagnostic",
            errors: [],
            priority: ""
        },
        tutor: {
            explanation: "Test explication",
            advice: "Test conseil",
            example: "Test exemple"
        },
        course: {
            point_cours: "Test point cours",
            rule: "Test règle",
            example: "Test exemple cours",
            validated: true,
            rule_id: "genre_texte_masculin"
        },
        metadata: {
            model: "openai/gpt-oss-20b",
            local_rules_used: ["genre_texte_masculin"]
        }
    };
    return Object.assign({}, base, overrides || {});
}

// =================================================================
// TESTS
// =================================================================

async function runTests() {
    console.log('🧪 Tests unitaires — Contrat IA V2\n');

    // Import du module
    let contractV2;
    try {
        contractV2 = await import('./contract-v2.js');
    } catch (e) {
        console.error('FATAL: Impossible d\'importer contract-v2.js:', e.message);
        process.exit(2);
    }

    const {
        validateRequestV2,
        validateResponseV2,
        isRequestV2,
        buildEmptyResponseV2,
        buildResponseV2,
        truncateString,
        validateModelConfidence,
        CONTRACT_VERSION,
        V2_MAX_LOCAL_DETECTIONS,
        V2_MAX_TEXT_ORIGINAL_CHARS
    } = contractV2;

    assert(typeof validateRequestV2 === 'function', 'validateRequestV2 est une fonction');
    assert(typeof validateResponseV2 === 'function', 'validateResponseV2 est une fonction');
    assert(typeof isRequestV2 === 'function', 'isRequestV2 est une fonction');
    assert(typeof buildEmptyResponseV2 === 'function', 'buildEmptyResponseV2 est une fonction');
    assert(typeof buildResponseV2 === 'function', 'buildResponseV2 est une fonction');
    assertEq(CONTRACT_VERSION, "2.0", 'CONTRACT_VERSION = "2.0"');

    // =================================================================
    console.log('\n─── isRequestV2 ───');
    // =================================================================

    assert(isRequestV2({ contractVersion: "2.0" }), 'isRequestV2 — contractVersion "2.0" → true');
    assert(!isRequestV2({ contractVersion: "1.0" }), 'isRequestV2 — contractVersion "1.0" → false');
    assert(!isRequestV2({}), 'isRequestV2 — pas de contractVersion → false');
    assert(!isRequestV2(null), 'isRequestV2 — null → false');
    assert(!isRequestV2("2.0"), 'isRequestV2 — string → false');

    // =================================================================
    console.log('\n─── Request V2 chat valide → PASS ───');
    // =================================================================

    {
        const req = makeValidRequestChat();
        const result = validateRequestV2(req);
        assert(result.valid, 'Request V2 chat valide → valid = true');
        assertEq(result.errors.length, 0, 'Request V2 chat valide → 0 erreurs');
    }

    // =================================================================
    console.log('\n─── Request V2 activity valide → PASS ───');
    // =================================================================

    {
        const req = makeValidRequestActivity();
        const result = validateRequestV2(req);
        assert(result.valid, 'Request V2 activity valide → valid = true');
        assertEq(result.errors.length, 0, 'Request V2 activity valide → 0 erreurs');
    }

    // =================================================================
    console.log('\n─── Version incorrecte → rejet ───');
    // =================================================================

    {
        const req = makeValidRequestChat({ contractVersion: "1.0" });
        const result = validateRequestV2(req);
        assert(!result.valid, 'contractVersion "1.0" → valid = false');
        assert(result.errors.some(e => e.includes('contractVersion')), 'contractVersion "1.0" → erreur contient "contractVersion"');
    }

    {
        const req = makeValidRequestChat({ contractVersion: "3.0" });
        const result = validateRequestV2(req);
        assert(!result.valid, 'contractVersion "3.0" → valid = false');
    }

    // =================================================================
    console.log('\n─── Mode incorrect → rejet ───');
    // =================================================================

    {
        const req = makeValidRequestChat({ mode: "discussion" });
        const result = validateRequestV2(req);
        assert(!result.valid, 'mode "discussion" → valid = false');
        assert(result.errors.some(e => e.includes('mode')), 'mode incorrect → erreur contient "mode"');
    }

    {
        const req = makeValidRequestChat({ mode: "" });
        const result = validateRequestV2(req);
        assert(!result.valid, 'mode vide → valid = false');
    }

    {
        const req = makeValidRequestChat({ mode: 123 });
        const result = validateRequestV2(req);
        assert(!result.valid, 'mode number → valid = false');
    }

    // =================================================================
    console.log('\n─── Chat sans context.chat → rejet ───');
    // =================================================================

    {
        const req = makeValidRequestChat();
        req.context = {}; // pas de chat
        const result = validateRequestV2(req);
        assert(!result.valid, 'chat sans context.chat → valid = false');
        assert(result.errors.some(e => e.includes('context.chat')), 'chat sans context.chat → erreur contient "context.chat"');
    }

    {
        const req = makeValidRequestChat();
        req.context = { activity: {} }; // mauvais sous-contexte
        const result = validateRequestV2(req);
        assert(!result.valid, 'chat avec context.activity au lieu de chat → valid = false');
    }

    // =================================================================
    console.log('\n─── Activity sans context.activity → rejet ───');
    // =================================================================

    {
        const req = makeValidRequestActivity();
        req.context = {}; // pas d'activity
        const result = validateRequestV2(req);
        assert(!result.valid, 'activity sans context.activity → valid = false');
        assert(result.errors.some(e => e.includes('context.activity')), 'activity sans context.activity → erreur contient "context.activity"');
    }

    {
        const req = makeValidRequestActivity();
        req.context = { chat: {} }; // mauvais sous-contexte
        const result = validateRequestV2(req);
        assert(!result.valid, 'activity avec context.chat au lieu d\'activity → valid = false');
    }

    // =================================================================
    console.log('\n─── Plus de 4 local_detections → rejet ───');
    // =================================================================

    {
        const req = makeValidRequestChat();
        req.local_detections = [];
        for (let i = 0; i < 5; i++) {
            req.local_detections.push({
                rule_id: "rule_" + i,
                category: "style",
                excerpt: "extrait " + i,
                correction: "correction " + i
            });
        }
        const result = validateRequestV2(req);
        assert(!result.valid, '5 local_detections → valid = false');
        assert(result.errors.some(e => e.includes('local_detections_trop_nombreuses')), '5 détections → erreur "trop_nombreuses"');
    }

    {
        const req = makeValidRequestChat();
        req.local_detections = [];
        for (let i = 0; i < 10; i++) {
            req.local_detections.push({
                rule_id: "rule_" + i,
                category: "style",
                excerpt: "extrait " + i,
                correction: "correction " + i
            });
        }
        const result = validateRequestV2(req);
        assert(!result.valid, '10 local_detections → valid = false');
    }

    {
        // Exactement 4 → OK
        const req = makeValidRequestChat();
        req.local_detections = [];
        for (let i = 0; i < 4; i++) {
            req.local_detections.push({
                rule_id: "rule_" + i,
                category: "style",
                excerpt: "extrait " + i,
                correction: "correction " + i
            });
        }
        const result = validateRequestV2(req);
        assert(result.valid, '4 local_detections → valid = true');
    }

    // =================================================================
    console.log('\n─── Correction locale non-string → rejet ───');
    // =================================================================

    {
        const req = makeValidRequestChat();
        req.local_detections = [{ rule_id: "test", category: "style", excerpt: "test", correction: null }];
        const result = validateRequestV2(req);
        assert(!result.valid, 'correction null → valid = false');
        assert(result.errors.some(e => e.includes('correction_doit_etre_string')), 'correction null → erreur "correction_doit_etre_string"');
    }

    {
        const req = makeValidRequestChat();
        req.local_detections = [{ rule_id: "test", category: "style", excerpt: "test", correction: 123 }];
        const result = validateRequestV2(req);
        assert(!result.valid, 'correction number → valid = false');
    }

    {
        const req = makeValidRequestChat();
        req.local_detections = [{ rule_id: "test", category: "style", excerpt: "test", correction: undefined }];
        const result = validateRequestV2(req);
        assert(!result.valid, 'correction undefined → valid = false');
    }

    // =================================================================
    console.log('\n─── Correction IA null → accepté ───');
    // =================================================================

    {
        const resp = makeValidResponseOk();
        resp.analysis.errors = [{
            excerpt: "test",
            type: "grammaticale",
            correction: null, // IA ne propose pas de correction
            rule_id: null,
            rule_known_locally: false,
            local_detected: false,
            model_suggested: true,
            validated: false,
            model_confidence: 0.5
        }];
        const result = validateResponseV2(resp);
        assert(result.valid, 'response avec correction IA null → valid = true');
    }

    // =================================================================
    console.log('\n─── model_confidence < 0 ou > 1 → rejet ───');
    // =================================================================

    {
        const resp = makeValidResponseOk();
        resp.analysis.errors = [{
            excerpt: "test",
            type: "grammaticale",
            correction: "fix",
            rule_id: "test_rule",
            rule_known_locally: true,
            local_detected: true,
            model_suggested: true,
            validated: true,
            model_confidence: -0.1
        }];
        const result = validateResponseV2(resp);
        assert(!result.valid, 'model_confidence -0.1 → valid = false');
        assert(result.errors.some(e => e.includes('model_confidence_invalide')), 'model_confidence -0.1 → erreur "model_confidence_invalide"');
    }

    {
        const resp = makeValidResponseOk();
        resp.analysis.errors = [{
            excerpt: "test",
            type: "grammaticale",
            correction: "fix",
            rule_id: "test_rule",
            rule_known_locally: true,
            local_detected: true,
            model_suggested: true,
            validated: true,
            model_confidence: 1.5
        }];
        const result = validateResponseV2(resp);
        assert(!result.valid, 'model_confidence 1.5 → valid = false');
    }

    {
        // model_confidence null → accepté
        const resp = makeValidResponseOk();
        resp.analysis.errors = [{
            excerpt: "test",
            type: "grammaticale",
            correction: "fix",
            rule_id: "test_rule",
            rule_known_locally: true,
            local_detected: true,
            model_suggested: true,
            validated: true,
            model_confidence: null
        }];
        const result = validateResponseV2(resp);
        assert(result.valid, 'model_confidence null → valid = true');
    }

    {
        // model_confidence 0 → accepté
        const resp = makeValidResponseOk();
        resp.analysis.errors = [{
            excerpt: "test",
            type: "grammaticale",
            correction: "fix",
            rule_id: "test_rule",
            rule_known_locally: true,
            local_detected: true,
            model_suggested: true,
            validated: true,
            model_confidence: 0
        }];
        const result = validateResponseV2(resp);
        assert(result.valid, 'model_confidence 0 → valid = true');
    }

    {
        // model_confidence 1 → accepté
        const resp = makeValidResponseOk();
        resp.analysis.errors = [{
            excerpt: "test",
            type: "grammaticale",
            correction: "fix",
            rule_id: "test_rule",
            rule_known_locally: true,
            local_detected: true,
            model_suggested: true,
            validated: true,
            model_confidence: 1
        }];
        const result = validateResponseV2(resp);
        assert(result.valid, 'model_confidence 1 → valid = true');
    }

    // =================================================================
    console.log('\n─── texte_original > 2000 → rejet ───');
    // =================================================================

    {
        const req = makeValidRequestChat();
        req.student = { text_original: 'a'.repeat(2001) };
        const result = validateRequestV2(req);
        assert(!result.valid, 'text_original 2001 car → valid = false');
        assert(result.errors.some(e => e.includes('text_original_trop_long')), '2001 car → erreur "trop_long"');
    }

    {
        const req = makeValidRequestChat();
        req.student = { text_original: 'a'.repeat(2000) };
        const result = validateRequestV2(req);
        assert(result.valid, 'text_original 2000 car → valid = true');
    }

    {
        const req = makeValidRequestChat();
        req.student = { text_original: '' };
        const result = validateRequestV2(req);
        assert(!result.valid, 'text_original vide → valid = false');
    }

    // =================================================================
    console.log('\n─── Response source/status incohérents → rejet ───');
    // =================================================================

    {
        // status ok + source null → rejet
        const resp = makeValidResponseOk();
        resp.source = null;
        resp.status = "ok";
        const result = validateResponseV2(resp);
        assert(!result.valid, 'status "ok" + source null → valid = false');
    }

    {
        // status partial + source null → rejet
        const resp = makeValidResponseOk();
        resp.source = null;
        resp.status = "partial";
        const result = validateResponseV2(resp);
        assert(!result.valid, 'status "partial" + source null → valid = false');
    }

    // =================================================================
    console.log('\n─── Response error avec source null → accepté ───');
    // =================================================================

    {
        const resp = buildEmptyResponseV2(null, "error", "worker_error");
        const result = validateResponseV2(resp);
        assert(result.valid, 'status "error" + source null → valid = true');
        assertEq(resp.source, null, 'source = null');
        assertEq(resp.status, "error", 'status = "error"');
        assertEq(resp.reason, "worker_error", 'reason = "worker_error"');
    }

    {
        const resp = buildEmptyResponseV2(null, "throttled", "anti_rafale");
        const result = validateResponseV2(resp);
        assert(result.valid, 'status "throttled" + source null → valid = true');
    }

    {
        const resp = buildEmptyResponseV2(null, "auth_required", "session_expired");
        const result = validateResponseV2(resp);
        assert(result.valid, 'status "auth_required" + source null → valid = true');
    }

    // =================================================================
    console.log('\n─── Response ok + source null → rejet ───');
    // =================================================================

    {
        const resp = makeValidResponseOk();
        resp.source = null;
        resp.status = "ok";
        const result = validateResponseV2(resp);
        assert(!result.valid, 'status "ok" + source null → valid = false');
        assert(result.errors.some(e => e.includes('status_ok_necessite_source_non_null') || e.includes('source_null_incompatible_status_ok')), 'ok+null → erreur de cohérence');
    }

    // =================================================================
    console.log('\n─── Response partial + source null → rejet ───');
    // =================================================================

    {
        const resp = makeValidResponseOk();
        resp.source = null;
        resp.status = "partial";
        const result = validateResponseV2(resp);
        assert(!result.valid, 'status "partial" + source null → valid = false');
        assert(result.errors.some(e => e.includes('partial')), 'partial+null → erreur de cohérence');
    }

    // =================================================================
    console.log('\n─── validated = rule_known_locally && local_detected ───');
    // =================================================================

    {
        // validated true quand les deux sont true
        const resp = makeValidResponseOk();
        resp.analysis.errors = [{
            excerpt: "test",
            type: "grammaticale",
            correction: "fix",
            rule_id: "test_rule",
            rule_known_locally: true,
            local_detected: true,
            model_suggested: true,
            validated: true,
            model_confidence: 0.9
        }];
        const result = validateResponseV2(resp);
        assert(result.valid, 'validated=true quand rule_known=true et local_detected=true');
    }

    {
        // validated false quand local_detected=false même si model_suggested=true
        const resp = makeValidResponseOk();
        resp.analysis.errors = [{
            excerpt: "test",
            type: "grammaticale",
            correction: "fix",
            rule_id: "genre_texte_masculin",
            rule_known_locally: true,
            local_detected: false,
            model_suggested: true,
            validated: false,
            model_confidence: 0.7
        }];
        const result = validateResponseV2(resp);
        assert(result.valid, 'validated=false quand local_detected=false (même si model_suggested=true)');
    }

    {
        // validated incohérent → rejet
        const resp = makeValidResponseOk();
        resp.analysis.errors = [{
            excerpt: "test",
            type: "grammaticale",
            correction: "fix",
            rule_id: "test_rule",
            rule_known_locally: true,
            local_detected: false,
            model_suggested: true,
            validated: true, // INCOHÉRENT
            model_confidence: 0.7
        }];
        const result = validateResponseV2(resp);
        assert(!result.valid, 'validated=true incohérent (local_detected=false) → valid = false');
        assert(result.errors.some(e => e.includes('validated_incoherent')), 'incohérence validated → erreur "validated_incoherent"');
    }

    // =================================================================
    console.log('\n─── buildEmptyResponseV2 ───');
    // =================================================================

    {
        const resp = buildEmptyResponseV2(null, "throttled", "quota_exceeded");
        assertEq(resp.contractVersion, "2.0", 'buildEmptyResponseV2 — contractVersion = "2.0"');
        assertEq(resp.source, null, 'buildEmptyResponseV2 — source = null');
        assertEq(resp.status, "throttled", 'buildEmptyResponseV2 — status = "throttled"');
        assertEq(resp.reason, "quota_exceeded", 'buildEmptyResponseV2 — reason = "quota_exceeded"');
        assertEq(resp.analysis.diagnostic, '', 'buildEmptyResponseV2 — diagnostic vide');
        assertEq(resp.analysis.errors.length, 0, 'buildEmptyResponseV2 — 0 erreurs');
        assertEq(resp.tutor.explanation, '', 'buildEmptyResponseV2 — tutor vide');
        assertEq(resp.course.validated, false, 'buildEmptyResponseV2 — course.validated = false');
        assertEq(resp.course.rule_id, null, 'buildEmptyResponseV2 — course.rule_id = null');
        assertEq(resp.metadata.model, null, 'buildEmptyResponseV2 — model = null');
        const vResult = validateResponseV2(resp);
        assert(vResult.valid, 'buildEmptyResponseV2(throttled) → valide');
    }

    {
        const resp = buildEmptyResponseV2("local_rules", "ok");
        assertEq(resp.source, "local_rules", 'buildEmptyResponseV2 — source = "local_rules"');
        assertEq(resp.status, "ok", 'buildEmptyResponseV2 — status = "ok"');
        assertEq(resp.reason, undefined, 'buildEmptyResponseV2 — reason absent');
        const vResult = validateResponseV2(resp);
        assert(vResult.valid, 'buildEmptyResponseV2(local_rules, ok) → valide');
    }

    // =================================================================
    console.log('\n─── buildResponseV2 ───');
    // =================================================================

    {
        const resp = buildResponseV2({
            source: "remote_a22b",
            status: "ok",
            diagnostic: "Test",
            errors: [
                {
                    excerpt: "la texte",
                    type: "grammaticale",
                    correction: "le texte",
                    rule_id: "genre_texte_masculin",
                    rule_known_locally: true,
                    local_detected: true,
                    model_suggested: true,
                    model_confidence: 0.95
                }
            ],
            priority: "Genre",
            tutorExplanation: "Explication",
            tutorAdvice: "Conseil",
            tutorExample: "Exemple",
            coursePoint: "Point",
            courseRule: "Règle",
            courseExample: "Exemple cours",
            courseValidated: true,
            courseRuleId: "genre_texte_masculin",
            model: "openai/gpt-oss-20b",
            localRulesUsed: ["genre_texte_masculin"]
        });
        assertEq(resp.contractVersion, "2.0", 'buildResponseV2 — contractVersion');
        assertEq(resp.source, "remote_a22b", 'buildResponseV2 — source');
        assertEq(resp.status, "ok", 'buildResponseV2 — status');
        assertEq(resp.analysis.errors.length, 1, 'buildResponseV2 — 1 erreur');
        assertEq(resp.analysis.errors[0].validated, true, 'buildResponseV2 — validated = true');
        assertEq(resp.analysis.errors[0].model_confidence, 0.95, 'buildResponseV2 — model_confidence');
        const vResult = validateResponseV2(resp);
        assert(vResult.valid, 'buildResponseV2 complet → valide');
    }

    // =================================================================
    console.log('\n─── truncateString ───');
    // =================================================================

    assertEq(truncateString("hello", 10), "hello", 'truncateString — court inchangé');
    assertEq(truncateString("hello world", 5), "hello", 'truncateString — tronqué à 5');
    assertEq(truncateString("", 10), "", 'truncateString — vide');
    assertEq(truncateString(null, 10), "", 'truncateString — null → ""');
    assertEq(truncateString(123, 10), "", 'truncateString — number → ""');

    // =================================================================
    console.log('\n─── validateModelConfidence ───');
    // =================================================================

    assertEq(validateModelConfidence(0.5), 0.5, 'validateModelConfidence — 0.5 → 0.5');
    assertEq(validateModelConfidence(0), 0, 'validateModelConfidence — 0 → 0');
    assertEq(validateModelConfidence(1), 1, 'validateModelConfidence — 1 → 1');
    assertEq(validateModelConfidence(null), null, 'validateModelConfidence — null → null');
    assertEq(validateModelConfidence(undefined), null, 'validateModelConfidence — undefined → null');
    assertEq(validateModelConfidence(-0.1), null, 'validateModelConfidence — -0.1 → null');
    assertEq(validateModelConfidence(1.1), null, 'validateModelConfidence — 1.1 → null');
    assertEq(validateModelConfidence("0.5"), null, 'validateModelConfidence — string → null');

    // =================================================================
    console.log('\n─── Source non-null + status error/throttled/auth → rejet ───');
    // =================================================================

    {
        const resp = makeValidResponseOk();
        resp.source = "remote_a22b";
        resp.status = "throttled";
        const result = validateResponseV2(resp);
        assert(!result.valid, 'source non-null + status throttled → valid = false');
    }

    {
        const resp = makeValidResponseOk();
        resp.source = "remote_a22b";
        resp.status = "error";
        const result = validateResponseV2(resp);
        assert(!result.valid, 'source non-null + status error → valid = false');
    }

    {
        const resp = makeValidResponseOk();
        resp.source = "remote_a22b";
        resp.status = "auth_required";
        const result = validateResponseV2(resp);
        assert(!result.valid, 'source non-null + status auth_required → valid = false');
    }

    // =================================================================
    console.log('\n─── Champs obligatoires toujours présents ───');
    // =================================================================

    {
        // Même en cas d'erreur, tous les champs existent
        const resp = buildEmptyResponseV2(null, "error", "worker_error");
        assert(resp.hasOwnProperty('contractVersion'), 'error response — contractVersion présent');
        assert(resp.hasOwnProperty('source'), 'error response — source présent');
        assert(resp.hasOwnProperty('status'), 'error response — status présent');
        assert(resp.hasOwnProperty('analysis'), 'error response — analysis présent');
        assert(resp.analysis.hasOwnProperty('diagnostic'), 'error response — analysis.diagnostic présent');
        assert(resp.analysis.hasOwnProperty('errors'), 'error response — analysis.errors présent');
        assert(resp.analysis.hasOwnProperty('priority'), 'error response — analysis.priority présent');
        assert(resp.hasOwnProperty('tutor'), 'error response — tutor présent');
        assert(resp.hasOwnProperty('course'), 'error response — course présent');
        assert(resp.hasOwnProperty('metadata'), 'error response — metadata présent');
    }

    // =================================================================
    console.log('\n─── Pas de données brutes dans ResponseV2 ───');
    // =================================================================

    {
        const resp = buildResponseV2({
            source: "remote_a22b",
            status: "ok",
            diagnostic: "Test",
            errors: [],
            priority: "",
            tutorExplanation: "",
            tutorAdvice: "",
            tutorExample: "",
            coursePoint: "",
            courseRule: "",
            courseExample: "",
            courseValidated: false,
            courseRuleId: null,
            model: "openai/gpt-oss-20b",
            localRulesUsed: []
        });
        assert(!resp.hasOwnProperty('choices'), 'ResponseV2 — pas de "choices"');
        assert(!resp.hasOwnProperty('etapes'), 'ResponseV2 — pas de "etapes"');
        assert(!resp.hasOwnProperty('usage'), 'ResponseV2 — pas de "usage"');
        assert(!resp.hasOwnProperty('systemPrompt'), 'ResponseV2 — pas de "systemPrompt"');
        assert(!resp.hasOwnProperty('userPrompt'), 'ResponseV2 — pas de "userPrompt"');
    }

    // =================================================================
    // Résumé
    // =================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 Résultats : ' + pass + ' pass, ' + fail + ' échec(s), ' + skip + ' ignoré(s)');
    console.log('='.repeat(60));

    process.exit(fail > 0 ? 1 : 0);
}

runTests().catch(function(err) {
    console.error('FATAL:', err);
    process.exit(2);
});
