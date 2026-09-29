/**
 * =================================================================
 * CONTRAT IA V2 — Constructeur de requête frontend
 * =================================================================
 * Module isolé et testable pour construire RequestV2 à partir :
 *   - du texte original étudiant (AVANT correction) ;
 *   - des détections locales (toutes, non tronquées) ;
 *   - du contexte chat ou activity.
 *
 * RÈGLES :
 *   - text_original est IMMUTABLE — jamais remplacé par le texte corrigé.
 *   - Toutes les détections sont conservées en interne.
 *   - Seules 4 détections max sont envoyées à l'IA (sélection déterministe).
 *   - Le vrai rule_id est toujours conservé (pas rule.name).
 *   - Aucun profil, aucun historique, pas les 275 règles.
 * =================================================================
 */

// =================================================================
// CONSTANTES
// =================================================================
const CONTRACT_VERSION = "2.0";
const MAX_LOCAL_DETECTIONS_SENT = 4;
const MAX_RULE_ID_CHARS = 50;
const MAX_CATEGORY_CHARS = 30;
const MAX_EXCERPT_CHARS = 100;
const MAX_CORRECTION_CHARS = 100;
const MAX_TEXT_ORIGINAL_CHARS = 2000;
const MAX_CHAT_TOPIC_CHARS = 30;
const MAX_CHAT_TOPIC_CONTEXT_CHARS = 500;
const MAX_CHAT_TOPIC_TITLE_CHARS = 100;
const MAX_ACTIVITY_ID_CHARS = 50;
const MAX_ACTIVITY_TITLE_CHARS = 150;
const MAX_ACTIVITY_TYPE_CHARS = 30;
const MAX_ACTIVITY_INSTRUCTIONS_CHARS = 300;

// =================================================================
// SÉLECTION DÉTERMINISTE DES DÉTECTIONS LOCALES
// =================================================================

/**
 * Sélectionne les N meilleures détections locales par priorité décroissante.
 * En cas d'égalité : rule_id alphabétique croissant.
 * Ne modifie PAS la liste originale.
 *
 * @param {Array} detections - Toutes les détections locales
 * @param {number} max - Nombre max à sélectionner (défaut 4)
 * @returns {Array} Les N meilleures détections
 */
function selectTopLocalDetections(detections, max) {
    if (max === undefined) max = MAX_LOCAL_DETECTIONS_SENT;
    if (!Array.isArray(detections) || detections.length === 0) return [];

    // Copier pour ne pas modifier l'original
    var copy = detections.slice();

    // Trier par priority décroissante, puis rule_id alphabétique croissant
    copy.sort(function(a, b) {
        var pa = (typeof a.priority === 'number') ? a.priority : 0;
        var pb = (typeof b.priority === 'number') ? b.priority : 0;
        if (pa !== pb) return pb - pa; // décroissant
        // Égalité : rule_id alphabétique croissant
        var ra = (typeof a.rule_id === 'string') ? a.rule_id : '';
        var rb = (typeof b.rule_id === 'string') ? b.rule_id : '';
        if (ra < rb) return -1;
        if (ra > rb) return 1;
        return 0;
    });

    return copy.slice(0, max);
}

// =================================================================
// NORMALISATION DES DÉTECTIONS
// =================================================================

/**
 * Normalise une détection locale au format V2.
 * @param {Object} d - Détection brute
 * @returns {Object|null} Détection normalisée ou null si invalide
 */
function normalizeLocalDetection(d) {
    if (!d || typeof d !== 'object') return null;

    var ruleId = (typeof d.rule_id === 'string') ? d.rule_id : '';
    var category = (typeof d.category === 'string') ? d.category : '';
    var excerpt = (typeof d.excerpt === 'string') ? d.excerpt : '';
    var correction = (typeof d.correction === 'string') ? d.correction : '';

    // rule_id obligatoire
    if (!ruleId) return null;

    return {
        rule_id: ruleId.slice(0, MAX_RULE_ID_CHARS),
        category: category.slice(0, MAX_CATEGORY_CHARS),
        excerpt: excerpt.slice(0, MAX_EXCERPT_CHARS),
        correction: correction.slice(0, MAX_CORRECTION_CHARS)
    };
}

/**
 * Normalise un tableau de détections locales.
 * Filtre les entrées invalides.
 * @param {Array} detections - Détections brutes
 * @returns {Array} Détections normalisées
 */
function normalizeLocalDetections(detections) {
    if (!Array.isArray(detections)) return [];
    var result = [];
    for (var i = 0; i < detections.length; i++) {
        var norm = normalizeLocalDetection(detections[i]);
        if (norm) result.push(norm);
    }
    return result;
}

// =================================================================
// CONVERSION DES RÉSULTATS DE CORRECTION EN DÉTECTIONS
// =================================================================

/**
 * Convertit le résultat de correctTextWithDatabase() en détections V2.
 * Le champ `rule` contient rule.name — on cherche le vrai rule_id via window.NLPRules.
 *
 * @param {Object} correctionsResult - Résultat de correctTextWithDatabase()
 * @returns {Array} Détections V2 avec vrais rule_id
 */
function convertDatabaseCorrectionsToDetections(correctionsResult) {
    if (!correctionsResult || typeof correctionsResult !== 'object') return [];
    var corrections = correctionsResult.corrections || [];
    if (!Array.isArray(corrections)) return [];

    // Construire un index name → { id, priority, category } depuis window.NLPRules
    var nameToRule = buildNameToRuleIndex();

    var detections = [];
    for (var i = 0; i < corrections.length; i++) {
        var c = corrections[i];
        var ruleName = (typeof c.rule === 'string') ? c.rule : '';
        var info = nameToRule[ruleName] || null;

        detections.push({
            rule_id: info ? info.id : ruleName, // Vrai rule_id si trouvé, sinon rule.name en dernier recours
            category: info ? info.category : ((typeof c.category === 'string') ? c.category : ''),
            excerpt: (typeof c.original === 'string') ? c.original : '',
            correction: (typeof c.corrected === 'string') ? c.corrected : '',
            priority: info ? info.priority : 0 // priorité réelle ou 0 (repli neutre)
        });
    }
    return detections;
}

/**
 * Convertit le résultat de analyzeTextLocal() en détections V2.
 * Le champ `rule` contient c.rule_id.
 * La priorité réelle est récupérée depuis window.NLPRules via l'index par id.
 * La catégorie réelle est également récupérée depuis window.NLPRules.
 *
 * @param {Object} analysisResult - Résultat de analyzeTextLocal()
 * @returns {Array} Détections V2 (avec priority interne pour le tri)
 */
function convertAnalyzeErrorsToDetections(analysisResult) {
    if (!analysisResult || typeof analysisResult !== 'object') return [];
    var errors = analysisResult.errors || [];
    if (!Array.isArray(errors)) return [];

    // Construire un index id → { priority, category } depuis window.NLPRules
    var idToRule = buildIdToRuleIndex();

    var detections = [];
    for (var i = 0; i < errors.length; i++) {
        var e = errors[i];
        var ruleId = (typeof e.rule === 'string') ? e.rule : 'unknown';
        var info = idToRule[ruleId] || null;

        // Priorité réelle depuis les règles locales, pas confidence * 100
        var priority = info ? info.priority : 0;

        // Catégorie réelle depuis les règles locales
        var category = info ? info.category : ((typeof e.type === 'string') ? e.type : '');

        detections.push({
            rule_id: ruleId,
            category: category,
            excerpt: (typeof e.text === 'string') ? e.text : '',
            correction: (typeof e.correction === 'string') ? e.correction : '',
            priority: priority
        });
    }
    return detections;
}

/**
 * Construit un index name → { id, priority, category } depuis window.NLPRules.
 * Permet de retrouver le vrai rule_id à partir de rule.name.
 * @returns {Object} Index name → { id, priority, category }
 */
function buildNameToRuleIndex() {
    var index = {};
    // Accès sécurisé à window.NLPRules (peut ne pas exister en test Node.js)
    var rules = (typeof window !== 'undefined' && window.NLPRules) ? window.NLPRules : {};
    var categories = Object.keys(rules);
    for (var c = 0; c < categories.length; c++) {
        var cat = categories[c];
        var catRules = rules[cat];
        if (!Array.isArray(catRules)) continue;
        for (var i = 0; i < catRules.length; i++) {
            var r = catRules[i];
            if (r && typeof r === 'object') {
                var name = (typeof r.name === 'string') ? r.name : '';
                var id = (typeof r.id === 'string') ? r.id : '';
                var priority = (typeof r.priority === 'number') ? r.priority : 0;
                if (name) {
                    index[name] = { id: id || name, priority: priority, category: cat };
                }
            }
        }
    }
    return index;
}

/**
 * Construit un index id → { priority, category } depuis window.NLPRules.
 * Permet de retrouver la priorité et la catégorie réelles à partir du rule_id.
 * @returns {Object} Index id → { priority, category }
 */
function buildIdToRuleIndex() {
    var index = {};
    var rules = (typeof window !== 'undefined' && window.NLPRules) ? window.NLPRules : {};
    var categories = Object.keys(rules);
    for (var c = 0; c < categories.length; c++) {
        var cat = categories[c];
        var catRules = rules[cat];
        if (!Array.isArray(catRules)) continue;
        for (var i = 0; i < catRules.length; i++) {
            var r = catRules[i];
            if (r && typeof r === 'object') {
                var id = (typeof r.id === 'string') ? r.id : '';
                var priority = (typeof r.priority === 'number') ? r.priority : 0;
                if (id) {
                    index[id] = { priority: priority, category: cat };
                }
            }
        }
    }
    return index;
}

// =================================================================
// EXTRACTION DES INSTRUCTIONS D'ACTIVITÉ
// =================================================================

/**
 * Extrait les instructions (Consignes) du HTML d'une activité.
 * Supprime le HTML, convertit les listes en texte lisible,
 * normalise les espaces, tronque à maxLen caractères.
 *
 * @param {string} html - HTML brut de l'activité
 * @param {number} maxLen - Longueur max (défaut 300)
 * @returns {string} Instructions en texte brut
 */
function extractActivityInstructions(html, maxLen) {
    if (maxLen === undefined) maxLen = MAX_ACTIVITY_INSTRUCTIONS_CHARS;
    if (typeof html !== 'string' || !html) return '';

    // Chercher la section Consignes
    var consignesMatch = html.match(/<h5>\s*Consignes?\s*<\/h5>([\s\S]*?)(?:<h5>|$)/i);
    if (!consignesMatch) {
        // Pas de section Consignes — essayer Objectif
        var objectifMatch = html.match(/<h5>\s*Objectif\s*<\/h5>([\s\S]*?)(?:<h5>|$)/i);
        if (!objectifMatch) return '';
        return stripHtmlToText(objectifMatch[1]).slice(0, maxLen);
    }

    return stripHtmlToText(consignesMatch[1]).slice(0, maxLen);
}

/**
 * Convertit du HTML en texte lisible.
 * - Remplace les <li> par des lignes
 * - Supprime les balises
 * - Normalise les espaces
 * @param {string} html
 * @returns {string}
 */
function stripHtmlToText(html) {
    if (typeof html !== 'string') return '';
    var text = html;
    // Remplacer les <li> par des tirets
    text = text.replace(/<li[^>]*>/gi, '- ');
    // Supprimer toutes les balises HTML
    text = text.replace(/<[^>]+>/g, ' ');
    // Décoder les entités HTML basiques
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&nbsp;/g, ' ');
    // Normaliser les espaces
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

// =================================================================
// CONSTRUCTION DES CONTEXTES
// =================================================================

/**
 * Construit le contexte chat à partir de discussionData.
 * @param {string} topic - Identifiant du topic (ex: "techniques", "narratif")
 * @param {Object} discussionData - Données des discussions (window.discussionData)
 * @returns {Object|null} Contexte chat ou null
 */
function buildChatContext(topic, discussionData) {
    if (typeof topic !== 'string' || !topic) return null;
    if (!discussionData || typeof discussionData !== 'object') return null;

    var data = discussionData[topic];
    if (!data || typeof data !== 'object') return null;

    return {
        topic: topic.slice(0, MAX_CHAT_TOPIC_CHARS),
        topic_context: (typeof data.context === 'string' ? data.context : '').slice(0, MAX_CHAT_TOPIC_CONTEXT_CHARS),
        topic_title: (typeof data.title === 'string' ? data.title : '').slice(0, MAX_CHAT_TOPIC_TITLE_CHARS)
    };
}

/**
 * Construit le contexte activity à partir de window.activityContent.
 * @param {string} chapterId - Identifiant du chapitre
 * @param {string} activityId - Identifiant de l'activité
 * @param {Object} activityContent - Données des activités (window.activityContent)
 * @returns {Object|null} Contexte activity ou null
 */
function buildActivityContext(chapterId, activityId, activityContent) {
    if (typeof chapterId !== 'string' || !chapterId) return null;
    if (typeof activityId !== 'string' || !activityId) return null;
    if (!activityContent || typeof activityContent !== 'object') return null;

    var chapter = activityContent[chapterId];
    if (!chapter || typeof chapter !== 'object') return null;

    // activityId peut être un nombre ou une string dans la structure
    var activity = chapter[activityId] || chapter[Number(activityId)];
    if (!activity || typeof activity !== 'object') return null;

    var title = (typeof activity.title === 'string') ? activity.title : '';
    var type = (typeof activity.tableType === 'string') ? activity.tableType : '';
    var instructions = extractActivityInstructions(
        (typeof activity.html === 'string') ? activity.html : ''
    );

    return {
        chapter_id: chapterId.slice(0, MAX_ACTIVITY_ID_CHARS),
        activity_id: activityId.slice(0, MAX_ACTIVITY_ID_CHARS),
        title: title.slice(0, MAX_ACTIVITY_TITLE_CHARS),
        type: type.slice(0, MAX_ACTIVITY_TYPE_CHARS),
        instructions: instructions.slice(0, MAX_ACTIVITY_INSTRUCTIONS_CHARS)
    };
}

// =================================================================
// CONSTRUCTION DU REQUEST V2
// =================================================================

/**
 * Construit une RequestV2 complète.
 *
 * @param {Object} options
 * @param {string} options.mode - "chat" ou "activity"
 * @param {string} options.textOriginal - Texte original étudiant (AVANT correction)
 * @param {Array} options.localDetections - TOUTES les détections locales (non tronquées)
 * @param {Object} options.context - Contexte chat ou activity
 * @returns {Object} RequestV2 valide
 */
function buildRequestV2(options) {
    if (!options || typeof options !== 'object') {
        throw new Error('buildRequestV2: options requis');
    }

    var mode = options.mode;
    if (mode !== 'chat' && mode !== 'activity') {
        throw new Error('buildRequestV2: mode doit être "chat" ou "activity"');
    }

    var textOriginal = options.textOriginal;
    if (typeof textOriginal !== 'string' || textOriginal.length === 0) {
        throw new Error('buildRequestV2: textOriginal requis (string non vide)');
    }
    if (textOriginal.length > MAX_TEXT_ORIGINAL_CHARS) {
        textOriginal = textOriginal.slice(0, MAX_TEXT_ORIGINAL_CHARS);
    }

    // Sélection des top détections pour l'IA (max 4)
    var allDetections = Array.isArray(options.localDetections) ? options.localDetections : [];
    var topDetections = selectTopLocalDetections(allDetections, MAX_LOCAL_DETECTIONS_SENT);
    var normalizedDetections = normalizeLocalDetections(topDetections);

    // Contexte
    var context = options.context;
    if (!context || typeof context !== 'object') {
        throw new Error('buildRequestV2: context requis');
    }

    return {
        contractVersion: CONTRACT_VERSION,
        mode: mode,
        student: {
            text_original: textOriginal
        },
        local_detections: normalizedDetections,
        context: context
    };
}

// =================================================================
// RÉPONSE V2 — DÉTECTION, NORMALISATION, VALIDATION
// =================================================================

/**
 * Détecte si une réponse du Worker est une ResponseV2.
 * @param {Object} data - Réponse JSON du Worker
 * @returns {boolean}
 */
function isResponseV2(data) {
    return !!(data && typeof data === 'object' && data.contractVersion === CONTRACT_VERSION);
}

/**
 * Normalise une ResponseV2 en texte pédagogique lisible.
 * Extrait le contenu de analysis, tutor, course et produit un texte unique.
 * 
 * @param {Object} responseV2 - ResponseV2 du Worker
 * @returns {Object} { analysisText, source, status }
 */
function normalizeResponseV2(responseV2) {
    if (!isResponseV2(responseV2)) {
        return { analysisText: '', source: null, status: null };
    }
    
    var parts = [];
    var source = responseV2.source || null;
    var status = responseV2.status || 'unknown';
    
    // Analysis
    if (responseV2.analysis) {
        if (typeof responseV2.analysis === 'string' && responseV2.analysis) {
            parts.push(responseV2.analysis);
        } else if (typeof responseV2.analysis === 'object') {
            if (responseV2.analysis.diagnostic) {
                parts.push(responseV2.analysis.diagnostic);
            }
            if (Array.isArray(responseV2.analysis.errors) && responseV2.analysis.errors.length > 0) {
                var erreurs = responseV2.analysis.errors.map(function(e) {
                    return (e.excerpt || '') + ' → ' + (e.correction || 'à revoir');
                });
                parts.push('Erreurs détectées : ' + erreurs.join(' ; '));
            }
        }
    }
    
    // Tutor
    if (responseV2.tutor) {
        if (responseV2.tutor.explanation) parts.push(responseV2.tutor.explanation);
        if (responseV2.tutor.advice) parts.push('Conseil : ' + responseV2.tutor.advice);
        if (responseV2.tutor.example) parts.push('Exemple : ' + responseV2.tutor.example);
    }
    
    // Course
    if (responseV2.course) {
        if (responseV2.course.point) parts.push('Point de cours : ' + responseV2.course.point);
        if (responseV2.course.rule) parts.push('Règle : ' + responseV2.course.rule);
        if (responseV2.course.example) parts.push('Exemple : ' + responseV2.course.example);
    }
    
    var analysisText = parts.length > 0 ? parts.join('\n\n') : 'Analyse effectuée.';
    
    return {
        analysisText: analysisText,
        source: source,
        status: status
    };
}

/**
 * Valide les rule_id retournés par la ResponseV2 contre les règles locales.
 * Un rule_id n'est validé que si :
 *   - il est connu localement (dans window.NLPRules)
 *   - ET il a été détecté localement (dans local_detections envoyées)
 * 
 * @param {Object} responseV2 - ResponseV2 du Worker
 * @param {Array} sentDetections - local_detections envoyées dans la RequestV2
 * @returns {Array} rule_id validés (avec validated: true/false)
 */
function validateResponseRuleIds(responseV2, sentDetections) {
    if (!isResponseV2(responseV2)) return [];
    
    // Construire l'ensemble des rule_id envoyés
    var sentRuleIds = {};
    if (Array.isArray(sentDetections)) {
        for (var i = 0; i < sentDetections.length; i++) {
            var rid = sentDetections[i] && sentDetections[i].rule_id;
            if (typeof rid === 'string' && rid) {
                sentRuleIds[rid] = true;
            }
        }
    }
    
    // Construire l'index des règles locales par id
    var idToRule = buildIdToRuleIndex();
    
    // Fonction interne de validation d'un rule_id
    function validateOneRuleId(ruleId) {
        var knownLocally = idToRule.hasOwnProperty(ruleId);
        var localDetected = sentRuleIds.hasOwnProperty(ruleId);
        return {
            rule_id: knownLocally ? ruleId : null,
            validated: knownLocally && localDetected,
            known_locally: knownLocally,
            local_detected: localDetected
        };
    }
    
    // Collecter et valider les rule_id de analysis.errors[]
    var validated = [];
    if (responseV2.analysis && typeof responseV2.analysis === 'object' && Array.isArray(responseV2.analysis.errors)) {
        for (var j = 0; j < responseV2.analysis.errors.length; j++) {
            var e = responseV2.analysis.errors[j];
            if (e && typeof e.rule_id === 'string') {
                var result = validateOneRuleId(e.rule_id);
                // Appliquer directement les champs de validation à l'erreur
                e.rule_known_locally = result.known_locally;
                e.local_detected = result.local_detected;
                e.model_suggested = (typeof e.rule_id === 'string' && e.rule_id !== null);
                e.validated = result.validated;
                e.rule_id = result.rule_id;
                validated.push(result);
            }
        }
    }
    
    // Valider course.rule_id avec la même logique
    if (responseV2.course && typeof responseV2.course === 'object' && typeof responseV2.course.rule_id === 'string') {
        var courseResult = validateOneRuleId(responseV2.course.rule_id);
        responseV2.course.rule_known_locally = courseResult.known_locally;
        responseV2.course.local_detected = courseResult.local_detected;
        responseV2.course.model_suggested = (typeof responseV2.course.rule_id === 'string' && responseV2.course.rule_id !== null);
        responseV2.course.validated = courseResult.validated;
        responseV2.course.rule_id = courseResult.rule_id;
    }
    
    return validated;
}

// =================================================================
// EXPORTS
// =================================================================

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONTRACT_VERSION: CONTRACT_VERSION,
        MAX_LOCAL_DETECTIONS_SENT: MAX_LOCAL_DETECTIONS_SENT,
        MAX_RULE_ID_CHARS: MAX_RULE_ID_CHARS,
        MAX_CATEGORY_CHARS: MAX_CATEGORY_CHARS,
        MAX_EXCERPT_CHARS: MAX_EXCERPT_CHARS,
        MAX_CORRECTION_CHARS: MAX_CORRECTION_CHARS,
        MAX_TEXT_ORIGINAL_CHARS: MAX_TEXT_ORIGINAL_CHARS,
        selectTopLocalDetections: selectTopLocalDetections,
        normalizeLocalDetection: normalizeLocalDetection,
        normalizeLocalDetections: normalizeLocalDetections,
        convertDatabaseCorrectionsToDetections: convertDatabaseCorrectionsToDetections,
        convertAnalyzeErrorsToDetections: convertAnalyzeErrorsToDetections,
        buildNameToRuleIndex: buildNameToRuleIndex,
        buildIdToRuleIndex: buildIdToRuleIndex,
        extractActivityInstructions: extractActivityInstructions,
        stripHtmlToText: stripHtmlToText,
        buildChatContext: buildChatContext,
        buildActivityContext: buildActivityContext,
        buildRequestV2: buildRequestV2,
        isResponseV2: isResponseV2,
        normalizeResponseV2: normalizeResponseV2,
        validateResponseRuleIds: validateResponseRuleIds
    };
}

// Export pour navigateur (ES module via script type="module")
if (typeof window !== 'undefined') {
    window.RequestBuilderV2 = {
        CONTRACT_VERSION: CONTRACT_VERSION,
        MAX_LOCAL_DETECTIONS_SENT: MAX_LOCAL_DETECTIONS_SENT,
        selectTopLocalDetections: selectTopLocalDetections,
        normalizeLocalDetection: normalizeLocalDetection,
        normalizeLocalDetections: normalizeLocalDetections,
        convertDatabaseCorrectionsToDetections: convertDatabaseCorrectionsToDetections,
        convertAnalyzeErrorsToDetections: convertAnalyzeErrorsToDetections,
        buildNameToRuleIndex: buildNameToRuleIndex,
        buildIdToRuleIndex: buildIdToRuleIndex,
        extractActivityInstructions: extractActivityInstructions,
        stripHtmlToText: stripHtmlToText,
        buildChatContext: buildChatContext,
        buildActivityContext: buildActivityContext,
        buildRequestV2: buildRequestV2,
        isResponseV2: isResponseV2,
        normalizeResponseV2: normalizeResponseV2,
        validateResponseRuleIds: validateResponseRuleIds
    };
}
