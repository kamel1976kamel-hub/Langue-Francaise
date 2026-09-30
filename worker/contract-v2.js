/**
 * =================================================================
 * CONTRAT IA V2 — Validation et construction
 * =================================================================
 * Module isolé et testable pour :
 *   - Validation structurelle de RequestV2
 *   - Validation structurelle de ResponseV2
 *   - Construction de ResponseV2 vide (fallback/erreur)
 *
 * RÈGLES :
 *   - Le Worker ne possède PAS les 275 règles locales.
 *   - Il ne fait qu'une validation STRUCTURELLE des champs.
 *   - Il ne fait PAS confiance au rule_id du navigateur comme preuve.
 *   - Il ne renvoie JAMAIS de rule_id inconnu provenant du modèle.
 *   - Il ne renvoie JAMAIS de données brutes (choices, etapes, prompts).
 * =================================================================
 */

// =================================================================
// CONSTANTES DU CONTRAT V2
// =================================================================
const CONTRACT_VERSION = "2.0";

// Limites RequestV2
const V2_MAX_TEXT_ORIGINAL_CHARS = 2000;
const V2_MAX_LOCAL_DETECTIONS = 4;
const V2_MAX_RULE_ID_CHARS = 50;
const V2_MAX_CATEGORY_CHARS = 30;
const V2_MAX_EXCERPT_CHARS = 100;
const V2_MAX_CORRECTION_LOCAL_CHARS = 100;
const V2_MAX_CHAT_TOPIC_CHARS = 30;
const V2_MAX_CHAT_TOPIC_CONTEXT_CHARS = 500;
const V2_MAX_CHAT_TOPIC_TITLE_CHARS = 100;
const V2_MAX_ACTIVITY_ID_CHARS = 50;
const V2_MAX_ACTIVITY_TITLE_CHARS = 150;
const V2_MAX_ACTIVITY_TYPE_CHARS = 30;
const V2_MAX_ACTIVITY_INSTRUCTIONS_CHARS = 300;

// Limites ResponseV2
const V2_MAX_DIAGNOSTIC_CHARS = 300;
const V2_MAX_ERRORS = 5;
const V2_MAX_ERROR_EXCERPT_CHARS = 100;
const V2_MAX_ERROR_TYPE_CHARS = 30;
const V2_MAX_ERROR_CORRECTION_CHARS = 150;
const V2_MAX_PRIORITY_CHARS = 200;
const V2_MAX_TUTOR_EXPLANATION_CHARS = 400;
const V2_MAX_TUTOR_ADVICE_CHARS = 200;
const V2_MAX_TUTOR_EXAMPLE_CHARS = 200;
const V2_MAX_COURSE_POINT_CHARS = 300;
const V2_MAX_COURSE_RULE_CHARS = 200;
const V2_MAX_COURSE_EXAMPLE_CHARS = 200;
const V2_MAX_LOCAL_RULES_USED = 8;

// Enumérations
const V2_VALID_MODES = ["chat", "activity"];
const V2_VALID_SOURCES = ["remote_a22b", "remote_a22_fallback", "local_rules"];
const V2_VALID_STATUSES = ["ok", "partial", "throttled", "error", "auth_required"];
const V2_VALID_REASONS = [
    "anti_rafale", "quota_exceeded", "worker_error",
    "session_expired", "auth_unavailable",
    "step_2_failed", "step_3_failed", "step_2_3_failed",
    "json_invalid"
];

// =================================================================
// VALIDATION REQUEST V2
// =================================================================

/**
 * Valide un payload RequestV2.
 * Retourne { valid: boolean, errors: string[] }
 */
function validateRequestV2(body) {
    const errors = [];

    // Corps doit être un objet
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { valid: false, errors: ['corps_invalide'] };
    }

    // contractVersion
    if (body.contractVersion !== CONTRACT_VERSION) {
        errors.push('contractVersion_invalide (attendu: "2.0")');
    }

    // mode
    if (typeof body.mode !== 'string' || !V2_VALID_MODES.includes(body.mode)) {
        errors.push('mode_invalide (attendu: "chat" ou "activity")');
    }

    // student.text_original
    if (!body.student || typeof body.student !== 'object') {
        errors.push('student_requis');
    } else if (typeof body.student.text_original !== 'string') {
        errors.push('student.text_original_doit_etre_string');
    } else if (body.student.text_original.length === 0) {
        errors.push('student.text_original_vide');
    } else if (body.student.text_original.length > V2_MAX_TEXT_ORIGINAL_CHARS) {
        errors.push('student.text_original_trop_long (max ' + V2_MAX_TEXT_ORIGINAL_CHARS + ' car)');
    }

    // local_detections
    if (!Array.isArray(body.local_detections)) {
        errors.push('local_detections_doit_etre_array');
    } else {
        if (body.local_detections.length > V2_MAX_LOCAL_DETECTIONS) {
            errors.push('local_detections_trop_nombreuses (max ' + V2_MAX_LOCAL_DETECTIONS + ', reçu ' + body.local_detections.length + ')');
        }
        for (let i = 0; i < body.local_detections.length; i++) {
            const d = body.local_detections[i];
            if (!d || typeof d !== 'object') {
                errors.push('local_detections[' + i + ']_doit_etre_objet');
                continue;
            }
            // rule_id
            if (typeof d.rule_id !== 'string') {
                errors.push('local_detections[' + i + '].rule_id_doit_etre_string');
            } else if (d.rule_id.length === 0 || d.rule_id.length > V2_MAX_RULE_ID_CHARS) {
                errors.push('local_detections[' + i + '].rule_id_longueur_invalide (1–' + V2_MAX_RULE_ID_CHARS + ')');
            }
            // category
            if (typeof d.category !== 'string') {
                errors.push('local_detections[' + i + '].category_doit_etre_string');
            } else if (d.category.length === 0 || d.category.length > V2_MAX_CATEGORY_CHARS) {
                errors.push('local_detections[' + i + '].category_longueur_invalide (1–' + V2_MAX_CATEGORY_CHARS + ')');
            }
            // excerpt
            if (typeof d.excerpt !== 'string') {
                errors.push('local_detections[' + i + '].excerpt_doit_etre_string');
            } else if (d.excerpt.length > V2_MAX_EXCERPT_CHARS) {
                errors.push('local_detections[' + i + '].excerpt_trop_long (max ' + V2_MAX_EXCERPT_CHARS + ')');
            }
            // correction — OBLIGATOIREMENT string pour les détections locales
            if (typeof d.correction !== 'string') {
                errors.push('local_detections[' + i + '].correction_doit_etre_string (null non accepté pour détection locale)');
            } else if (d.correction.length > V2_MAX_CORRECTION_LOCAL_CHARS) {
                errors.push('local_detections[' + i + '].correction_trop_longue (max ' + V2_MAX_CORRECTION_LOCAL_CHARS + ')');
            }
        }
    }

    // context
    if (!body.context || typeof body.context !== 'object') {
        errors.push('context_requis');
    } else {
        // Cohérence mode/context
        if (body.mode === 'chat') {
            if (!body.context.chat || typeof body.context.chat !== 'object') {
                errors.push('context.chat_requis_pour_mode_chat');
            } else {
                if (typeof body.context.chat.topic !== 'string' || body.context.chat.topic.length === 0) {
                    errors.push('context.chat.topic_requis');
                } else if (body.context.chat.topic.length > V2_MAX_CHAT_TOPIC_CHARS) {
                    errors.push('context.chat.topic_trop_long (max ' + V2_MAX_CHAT_TOPIC_CHARS + ')');
                }
                if (typeof body.context.chat.topic_context !== 'string') {
                    errors.push('context.chat.topic_context_doit_etre_string');
                } else if (body.context.chat.topic_context.length > V2_MAX_CHAT_TOPIC_CONTEXT_CHARS) {
                    errors.push('context.chat.topic_context_trop_long (max ' + V2_MAX_CHAT_TOPIC_CONTEXT_CHARS + ')');
                }
                if (typeof body.context.chat.topic_title !== 'string') {
                    errors.push('context.chat.topic_title_doit_etre_string');
                } else if (body.context.chat.topic_title.length > V2_MAX_CHAT_TOPIC_TITLE_CHARS) {
                    errors.push('context.chat.topic_title_trop_long (max ' + V2_MAX_CHAT_TOPIC_TITLE_CHARS + ')');
                }
            }
        } else if (body.mode === 'activity') {
            if (!body.context.activity || typeof body.context.activity !== 'object') {
                errors.push('context.activity_requis_pour_mode_activity');
            } else {
                const a = body.context.activity;
                if (typeof a.chapter_id !== 'string' || a.chapter_id.length === 0) {
                    errors.push('context.activity.chapter_id_requis');
                } else if (a.chapter_id.length > V2_MAX_ACTIVITY_ID_CHARS) {
                    errors.push('context.activity.chapter_id_trop_long (max ' + V2_MAX_ACTIVITY_ID_CHARS + ')');
                }
                if (typeof a.activity_id !== 'string' || a.activity_id.length === 0) {
                    errors.push('context.activity.activity_id_requis');
                } else if (a.activity_id.length > V2_MAX_ACTIVITY_ID_CHARS) {
                    errors.push('context.activity.activity_id_trop_long (max ' + V2_MAX_ACTIVITY_ID_CHARS + ')');
                }
                if (typeof a.title !== 'string') {
                    errors.push('context.activity.title_doit_etre_string');
                } else if (a.title.length > V2_MAX_ACTIVITY_TITLE_CHARS) {
                    errors.push('context.activity.title_trop_long (max ' + V2_MAX_ACTIVITY_TITLE_CHARS + ')');
                }
                if (typeof a.type !== 'string') {
                    errors.push('context.activity.type_doit_etre_string');
                } else if (a.type.length > V2_MAX_ACTIVITY_TYPE_CHARS) {
                    errors.push('context.activity.type_trop_long (max ' + V2_MAX_ACTIVITY_TYPE_CHARS + ')');
                }
                if (typeof a.instructions !== 'string') {
                    errors.push('context.activity.instructions_doit_etre_string');
                } else if (a.instructions.length > V2_MAX_ACTIVITY_INSTRUCTIONS_CHARS) {
                    errors.push('context.activity.instructions_trop_long (max ' + V2_MAX_ACTIVITY_INSTRUCTIONS_CHARS + ')');
                }
            }
        }
    }

    return { valid: errors.length === 0, errors: errors };
}

/**
 * Vérifie si un payload est une requête V2 (par contractVersion).
 */
function isRequestV2(body) {
    return body && typeof body === 'object' && body.contractVersion === CONTRACT_VERSION;
}

// =================================================================
// CONSTRUCTION RESPONSE V2
// =================================================================

/**
 * Construit une ResponseV2 vide et valide.
 * Utilisée pour les cas d'erreur, throttling, fallback.
 */
function buildEmptyResponseV2(source, status, reason) {
    const resp = {
        contractVersion: CONTRACT_VERSION,
        source: source,
        status: status,
        analysis: {
            diagnostic: '',
            errors: [],
            priority: ''
        },
        tutor: {
            explanation: '',
            advice: '',
            example: ''
        },
        course: {
            point_cours: '',
            rule: '',
            example: '',
            validated: false,
            rule_id: null
        },
        metadata: {
            model: null,
            local_rules_used: []
        }
    };
    if (reason) {
        resp.reason = reason;
    }
    return resp;
}

/**
 * Construit une ResponseV2 complète à partir des données du pipeline.
 * Utilisée après succès A22B, A22 fallback, ou fallback local.
 */
function buildResponseV2(options) {
    const {
        source,
        status,
        reason,
        diagnostic,
        errors,
        priority,
        tutorExplanation,
        tutorAdvice,
        tutorExample,
        coursePoint,
        courseRule,
        courseExample,
        courseValidated,
        courseRuleId,
        model,
        localRulesUsed,
        maxDiagnosticChars
    } = options;

    // LOT C2 — Borne de troncature du diagnostic : par défaut celle du contrat (300).
    // Permet au mode CHAT, dont analysis.diagnostic porte toute la réponse
    // conversationnelle, d'utiliser une borne plus large — sans modifier la valeur
    // de V2_MAX_DIAGNOSTIC_CHARS ni aucune autre limite.
    var limiteDiagnostic = (typeof maxDiagnosticChars === 'number' && maxDiagnosticChars > 0)
        ? maxDiagnosticChars
        : V2_MAX_DIAGNOSTIC_CHARS;

    return {
        contractVersion: CONTRACT_VERSION,
        source: source || null,
        status: status || 'ok',
        reason: reason || undefined,
        analysis: {
            diagnostic: truncateString(diagnostic || '', limiteDiagnostic),
            errors: Array.isArray(errors) ? errors.slice(0, V2_MAX_ERRORS).map(function(e) {
                return {
                    excerpt: truncateString(e.excerpt || '', V2_MAX_ERROR_EXCERPT_CHARS),
                    type: truncateString(e.type || '', V2_MAX_ERROR_TYPE_CHARS),
                    correction: (e.correction === null || e.correction === undefined) ? null : truncateString(String(e.correction), V2_MAX_ERROR_CORRECTION_CHARS),
                    rule_id: (e.rule_id === null || e.rule_id === undefined) ? null : truncateString(String(e.rule_id), V2_MAX_RULE_ID_CHARS),
                    rule_known_locally: Boolean(e.rule_known_locally),
                    local_detected: Boolean(e.local_detected),
                    model_suggested: Boolean(e.model_suggested),
                    validated: Boolean(e.rule_known_locally) && Boolean(e.local_detected),
                    model_confidence: validateModelConfidence(e.model_confidence)
                };
            }) : [],
            priority: truncateString(priority || '', V2_MAX_PRIORITY_CHARS)
        },
        tutor: {
            explanation: truncateString(tutorExplanation || '', V2_MAX_TUTOR_EXPLANATION_CHARS),
            advice: truncateString(tutorAdvice || '', V2_MAX_TUTOR_ADVICE_CHARS),
            example: truncateString(tutorExample || '', V2_MAX_TUTOR_EXAMPLE_CHARS)
        },
        course: {
            point_cours: truncateString(coursePoint || '', V2_MAX_COURSE_POINT_CHARS),
            rule: truncateString(courseRule || '', V2_MAX_COURSE_RULE_CHARS),
            example: truncateString(courseExample || '', V2_MAX_COURSE_EXAMPLE_CHARS),
            validated: Boolean(courseValidated),
            rule_id: (courseRuleId === null || courseRuleId === undefined) ? null : truncateString(String(courseRuleId), V2_MAX_RULE_ID_CHARS)
        },
        metadata: {
            model: model || null,
            local_rules_used: Array.isArray(localRulesUsed) ? localRulesUsed.slice(0, V2_MAX_LOCAL_RULES_USED).map(String) : []
        }
    };
}

// =================================================================
// VALIDATION RESPONSE V2
// =================================================================

/**
 * Valide un objet ResponseV2.
 * Retourne { valid: boolean, errors: string[] }
 */
function validateResponseV2(obj) {
    const errors = [];

    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return { valid: false, errors: ['response_invalide'] };
    }

    // contractVersion
    if (obj.contractVersion !== CONTRACT_VERSION) {
        errors.push('contractVersion_invalide');
    }

    // source
    if (obj.source !== null && !V2_VALID_SOURCES.includes(obj.source)) {
        errors.push('source_invalide');
    }

    // status
    if (typeof obj.status !== 'string' || !V2_VALID_STATUSES.includes(obj.status)) {
        errors.push('status_invalide');
    }

    // reason (facultatif)
    if (obj.reason !== undefined && obj.reason !== null) {
        if (typeof obj.reason !== 'string' || !V2_VALID_REASONS.includes(obj.reason)) {
            errors.push('reason_invalide');
        }
    }

    // Cohérence source/status
    if (obj.status === 'ok' && obj.source === null) {
        errors.push('status_ok_necessite_source_non_null');
    }
    if (obj.status === 'partial' && obj.source === null) {
        errors.push('status_partial_necessite_source_non_null');
    }
    if (obj.source === null && obj.status === 'ok') {
        errors.push('source_null_incompatible_status_ok');
    }
    if (obj.source !== null && obj.status === 'throttled') {
        errors.push('source_non_null_incompatible_status_throttled');
    }
    if (obj.source !== null && obj.status === 'error') {
        errors.push('source_non_null_incompatible_status_error');
    }
    if (obj.source !== null && obj.status === 'auth_required') {
        errors.push('source_non_null_incompatible_status_auth_required');
    }

    // analysis
    if (!obj.analysis || typeof obj.analysis !== 'object') {
        errors.push('analysis_requis');
    } else {
        if (typeof obj.analysis.diagnostic !== 'string') {
            errors.push('analysis.diagnostic_doit_etre_string');
        }
        if (!Array.isArray(obj.analysis.errors)) {
            errors.push('analysis.errors_doit_etre_array');
        } else {
            if (obj.analysis.errors.length > V2_MAX_ERRORS) {
                errors.push('analysis.errors_trop_nombreux (max ' + V2_MAX_ERRORS + ')');
            }
            for (let i = 0; i < obj.analysis.errors.length; i++) {
                const e = obj.analysis.errors[i];
                if (!e || typeof e !== 'object') {
                    errors.push('analysis.errors[' + i + ']_doit_etre_objet');
                    continue;
                }
                if (typeof e.excerpt !== 'string') errors.push('analysis.errors[' + i + '].excerpt_doit_etre_string');
                if (typeof e.type !== 'string') errors.push('analysis.errors[' + i + '].type_doit_etre_string');
                // correction : string | null
                if (e.correction !== null && typeof e.correction !== 'string') {
                    errors.push('analysis.errors[' + i + '].correction_doit_etre_string_ou_null');
                }
                // rule_id : string | null
                if (e.rule_id !== null && typeof e.rule_id !== 'string') {
                    errors.push('analysis.errors[' + i + '].rule_id_doit_etre_string_ou_null');
                }
                // Booleans
                if (typeof e.rule_known_locally !== 'boolean') errors.push('analysis.errors[' + i + '].rule_known_locally_doit_etre_boolean');
                if (typeof e.local_detected !== 'boolean') errors.push('analysis.errors[' + i + '].local_detected_doit_etre_boolean');
                if (typeof e.model_suggested !== 'boolean') errors.push('analysis.errors[' + i + '].model_suggested_doit_etre_boolean');
                if (typeof e.validated !== 'boolean') errors.push('analysis.errors[' + i + '].validated_doit_etre_boolean');
                // validated = rule_known_locally && local_detected
                if (e.validated !== (e.rule_known_locally && e.local_detected)) {
                    errors.push('analysis.errors[' + i + '].validated_incoherent (doit = rule_known_locally && local_detected)');
                }
                // model_confidence : number | null, 0..1
                if (e.model_confidence !== null) {
                    if (typeof e.model_confidence !== 'number' || e.model_confidence < 0 || e.model_confidence > 1) {
                        errors.push('analysis.errors[' + i + '].model_confidence_invalide (number 0..1 ou null)');
                    }
                }
            }
        }
        if (typeof obj.analysis.priority !== 'string') {
            errors.push('analysis.priority_doit_etre_string');
        }
    }

    // tutor
    if (!obj.tutor || typeof obj.tutor !== 'object') {
        errors.push('tutor_requis');
    } else {
        if (typeof obj.tutor.explanation !== 'string') errors.push('tutor.explanation_doit_etre_string');
        if (typeof obj.tutor.advice !== 'string') errors.push('tutor.advice_doit_etre_string');
        if (typeof obj.tutor.example !== 'string') errors.push('tutor.example_doit_etre_string');
    }

    // course
    if (!obj.course || typeof obj.course !== 'object') {
        errors.push('course_requis');
    } else {
        if (typeof obj.course.point_cours !== 'string') errors.push('course.point_cours_doit_etre_string');
        if (typeof obj.course.rule !== 'string') errors.push('course.rule_doit_etre_string');
        if (typeof obj.course.example !== 'string') errors.push('course.example_doit_etre_string');
        if (typeof obj.course.validated !== 'boolean') errors.push('course.validated_doit_etre_boolean');
        if (obj.course.rule_id !== null && typeof obj.course.rule_id !== 'string') {
            errors.push('course.rule_id_doit_etre_string_ou_null');
        }
    }

    // metadata
    if (!obj.metadata || typeof obj.metadata !== 'object') {
        errors.push('metadata_requis');
    } else {
        if (obj.metadata.model !== null && typeof obj.metadata.model !== 'string') {
            errors.push('metadata.model_doit_etre_string_ou_null');
        }
        if (!Array.isArray(obj.metadata.local_rules_used)) {
            errors.push('metadata.local_rules_used_doit_etre_array');
        }
    }

    return { valid: errors.length === 0, errors: errors };
}

// =================================================================
// UTILITAIRES
// =================================================================

function truncateString(str, maxLen) {
    if (typeof str !== 'string') return '';
    return str.length > maxLen ? str.slice(0, maxLen) : str;
}

function validateModelConfidence(val) {
    if (val === null || val === undefined) return null;
    if (typeof val !== 'number') return null;
    if (val < 0 || val > 1) return null;
    return val;
}

// =================================================================
// EXPORTS
// =================================================================

export {
    CONTRACT_VERSION,
    V2_MAX_TEXT_ORIGINAL_CHARS,
    V2_MAX_LOCAL_DETECTIONS,
    V2_MAX_RULE_ID_CHARS,
    V2_MAX_CATEGORY_CHARS,
    V2_MAX_EXCERPT_CHARS,
    V2_MAX_CORRECTION_LOCAL_CHARS,
    V2_MAX_CHAT_TOPIC_CHARS,
    V2_MAX_CHAT_TOPIC_CONTEXT_CHARS,
    V2_MAX_CHAT_TOPIC_TITLE_CHARS,
    V2_MAX_ACTIVITY_ID_CHARS,
    V2_MAX_ACTIVITY_TITLE_CHARS,
    V2_MAX_ACTIVITY_TYPE_CHARS,
    V2_MAX_ACTIVITY_INSTRUCTIONS_CHARS,
    V2_MAX_DIAGNOSTIC_CHARS,
    V2_MAX_ERRORS,
    V2_MAX_ERROR_EXCERPT_CHARS,
    V2_MAX_ERROR_TYPE_CHARS,
    V2_MAX_ERROR_CORRECTION_CHARS,
    V2_MAX_PRIORITY_CHARS,
    V2_MAX_TUTOR_EXPLANATION_CHARS,
    V2_MAX_TUTOR_ADVICE_CHARS,
    V2_MAX_TUTOR_EXAMPLE_CHARS,
    V2_MAX_COURSE_POINT_CHARS,
    V2_MAX_COURSE_RULE_CHARS,
    V2_MAX_COURSE_EXAMPLE_CHARS,
    V2_MAX_LOCAL_RULES_USED,
    V2_VALID_MODES,
    V2_VALID_SOURCES,
    V2_VALID_STATUSES,
    V2_VALID_REASONS,
    validateRequestV2,
    validateResponseV2,
    isRequestV2,
    buildEmptyResponseV2,
    buildResponseV2,
    truncateString,
    validateModelConfidence
};
