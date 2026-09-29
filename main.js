/**
 * =================================================================
 * POINT D'ENTRÉE PRINCIPAL DE L'APPLICATION
 * Version propre et fonctionnelle
 * =================================================================
 */

'use strict';

// Configuration de l'application (protection globale)
window.APP_CONFIG = window.APP_CONFIG || {
    name: 'Langue Française',
    version: '2.0',
    debug: location.hostname === 'localhost' || location.protocol === 'file:',
    modules: {
        required: [
            'demanderIA'
        ],
        optional: [
            'runFourModelPipeline',
            'initializeUIElements',
            'initializeChatSystem',
            'initializeAudioSystem',
            'initializeActivities'
        ]
    },
    api: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        workerUrl: 'https://langue-francaise-ia.chellouaikamel50.workers.dev'
    }
};

// État de l'application (protection globale)
window.appState = window.appState || {
    modulesReady: false,
    iaReady: false,
    currentStatus: 'initialization',
    errors: [],
    startTime: Date.now()
};

/**
 * Vérifie si tous les modules requis sont prêts
 * @returns {boolean} True si tous les modules sont prêts
 */
function areAllModulesReady() {
    return window.APP_CONFIG.modules.required.every(moduleName => 
        typeof window[moduleName] === 'function'
    );
}

/**
 * Ajoute une erreur à l'état de l'application
 * @param {string} error - Message d'erreur
 * @param {string} context - Contexte de l'erreur
 */
function addError(error, context = 'general') {
    const errorObj = {
        message: error,
        context,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
    };
    
    appState.errors.push(errorObj);
    
    if (window.APP_CONFIG.debug) {
        console.error(`❌ Error [${context}]:`, error);
    }
    
    if (appState.errors.length > 50) {
        appState.errors = appState.errors.slice(-25);
    }
}

/**
 * Pipeline IA avec fallback (Worker → fallback local)
 * @param {string} studentAnswer - Réponse de l'étudiant
 * @param {string} activityContext - Contexte de l'activité
 * @param {string} activityType - Type d'activité
 * @returns {Promise<string>} Réponse de l'IA
 */
async function runFourModelPipelineWithFallback(studentAnswer, activityContext, activityType, optionsV2) {
    try {
        setIaStatus("IA : analyse en cours...", "bg-blue-500", 25);
        
        if (typeof window.runFourModelPipeline === 'function') {
            setIaStatus("IA : traitement intelligent...", "bg-purple-500", 50);
            const result = await window.runFourModelPipeline(studentAnswer, activityContext, activityType, optionsV2);
            // ACTION 20: distinguer l'origine — le repli local est retourné sans exception
            // quand l'IA distante n'est pas configurée.
            var isLocalAnalysis = !!(result && result.source === 'locale');
            setIaStatus(isLocalAnalysis ? "IA distante indisponible — analyse locale" : "IA : analyse terminée", isLocalAnalysis ? "bg-amber-500" : "bg-emerald-500", 100);
            return result;
        }
        
        throw new Error('Pipeline IA indisponible. Veuillez vérifier votre connexion.');
        
    } catch (error) {
        addError(`Pipeline error: ${error.message}`, 'pipeline');
        setIaStatus("IA : configuration requise", "bg-rose-500", 0);
        
        const errorMessage = `⚠️ Service IA indisponible
        
Le pipeline IA n'est pas accessible pour le moment.
Veuillez vérifier votre connexion internet et réessayer.
        
Erreur technique : ${error.message}`;
        
        return errorMessage;
    }
}

/**
 * Initialise l'IA principale
 * @returns {Promise<void>}
 */
async function initIA() {
    try {
        setIaStatus("IA : initialisation...", "bg-amber-500", 10);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIaStatus("IA : vérification des modules...", "bg-blue-500", 50);
        
        const modulesReady = areAllModulesReady();
        if (!modulesReady) {
            throw new Error('Certains modules requis ne sont pas disponibles');
        }
        
        setIaStatus("IA : configuration...", "bg-purple-500", 75);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setIaStatus("IA : prête", "bg-emerald-500", 100);
        appState.iaReady = true;
        
        console.log('✅ IA initialisée avec succès');
        
    } catch (error) {
        addError(`IA initialization failed: ${error.message}`, 'ia');
        setIaStatus("IA : erreur d'initialisation", "bg-rose-500", 0);
        throw error;
    }
}

/**
 * Fonction globale pour demander à l'IA
 * @param {string} prompt - Prompt pour l'IA
 * @param {string} contexte - Contexte de la demande
 * @returns {Promise<string>} Réponse de l'IA
 */

// ─── V2 : helpers globaux pour détecter et normaliser les ResponseV2 ───
function isResponseV2(data) {
    if (window.RequestBuilderV2 && typeof window.RequestBuilderV2.isResponseV2 === 'function') {
        return window.RequestBuilderV2.isResponseV2(data);
    }
    return data && typeof data === 'object' && data.contractVersion === '2.0';
}

function normalizeResponseV2(responseV2) {
    if (window.RequestBuilderV2 && typeof window.RequestBuilderV2.normalizeResponseV2 === 'function') {
        return window.RequestBuilderV2.normalizeResponseV2(responseV2);
    }
    // Fallback minimal si le module n'est pas chargé
    var parts = [];
    if (responseV2 && responseV2.analysis) {
        if (typeof responseV2.analysis === 'string') parts.push(responseV2.analysis);
        else if (responseV2.analysis.diagnostic) parts.push(responseV2.analysis.diagnostic);
    }
    return {
        analysisText: parts.length > 0 ? parts.join('\n\n') : 'Analyse effectuée.',
        source: responseV2 ? responseV2.source : null,
        status: responseV2 ? responseV2.status : 'unknown'
    };
}

window.demanderIA = async function(prompt, contexte, optionsV2) {
    try {
        if (!appState.iaReady) {
            return {
                analysis: "L'IA est en cours d'initialisation. Veuillez patienter...",
                corrections: [],
                explanations: [],
                suggestions: []
            };
        }

        const result = await runFourModelPipelineWithFallback(prompt, contexte, 'general', optionsV2);
        
        // ─── A1 : repli local (source=local_requis) — transmettre TEL QUEL ───
        // Sans ce passage direct, `demanderIA` recalculerait `corrections` via
        // `analyzeTextLocal` (plus bas) et écraserait les corrections locales déjà
        // produites par `repliLocal()` (275 règles).
        if (result && result.source === 'local_requis') {
            return result;
        }

        // ─── B1-B1 : saturation 429 — transmettre TEL QUEL ───
        // Même raison qu'A1 : sans ce passage direct, `demanderIA` écraserait
        // `analysis` (message de saturation) et `corrections` par son propre calcul,
        // et le message honnête produit par `etatSaturation()` serait perdu.
        if (result && result.source === 'saturated') {
            return result;
        }

        // ─── V2 : détecter si le résultat est une ResponseV2 ───
        var isV2 = isResponseV2(result);
        
        // Extraire le texte original de l'étudiant
        let originalText = '';
        if (isV2 && optionsV2 && optionsV2.textOriginal) {
            // V2 : le texte original vient directement de optionsV2
            originalText = optionsV2.textOriginal;
        } else {
            // Legacy : tenter d'extraire depuis le contexte
            try {
                const contextObj = typeof contexte === 'string' ? JSON.parse(contexte) : contexte;
                if (contextObj && contextObj.student_message) {
                    originalText = contextObj.student_message;
                }
            } catch (e) {
                // Réduit le bruit console
            }
        }
        
        // ─── V2 : normaliser la réponse ───
        var analysisText;
        var resultSource;
        
        if (isV2) {
            // ResponseV2 : extraire le contenu pédagogique
            var normalized = normalizeResponseV2(result);
            analysisText = normalized.analysisText;
            resultSource = normalized.source;
        } else {
            // Legacy : comportement existant
            // Améliorer la qualité de la réponse avec le texte original
            var improvedResult = improveResponseQuality(result, originalText);
            analysisText = improvedResult;
            
            // ACTION 20: remonter le marqueur d'origine au niveau supérieur
            if (typeof result === 'object' && result && result.source) {
                resultSource = result.source;
            } else if (typeof result === 'string') {
                try {
                    var parsed = JSON.parse(result);
                    if (parsed && parsed.source) resultSource = parsed.source;
                } catch (e) { /* pas de source si pas JSON */ }
            }
        }
        
        // Analyser le texte original pour les corrections
        let corrections = [];
        let explanations = [];
        let suggestions = [];
        
        if (originalText && originalText.length > 5) {
            try {
                const analysisResult = window.analyzeTextLocal && await window.analyzeTextLocal(originalText);
                if (analysisResult) {
                    corrections = analysisResult.errors || [];
                    explanations = analysisResult.explanations || [];
                    suggestions = analysisResult.suggestions || [];
                }
            } catch (e) {
                console.log('⚠️ Erreur lors de l\'analyse du texte original:', e.message);
            }
        }
        
        return {
            source: resultSource,
            analysis: analysisText,
            corrections: corrections,
            explanations: explanations,
            suggestions: suggestions
        };

    } catch (error) {
        addError(`IA request failed: ${error.message}`, 'ia_request');
        
        const errorMsg = `❌ Erreur du pipeline IA: ${error.message}

Veuillez vérifier votre connexion et réessayer.`;
        console.log('📄 Message d\'erreur généré:', errorMsg);
        return {
            analysis: errorMsg,
            corrections: [],
            explanations: [],
            suggestions: []
        };
    }
};

/**
 * Améliore la qualité des réponses de l'IA
 * @param {string} response - Réponse brute de l'IA
 * @returns {string} Réponse améliorée
 */
function improveResponseQuality(response, originalText = '') {
    if (!response || typeof response !== 'string') {
        return response;
    }
    
    let improved = response;
    
    // 0. Analyse du contexte et du texte original
    const contextualImprovements = analyzeContextAndImprove(response, originalText);
    if (contextualImprovements) {
        improved = contextualImprovements;
    }
    
    // 1. Corriger les fautes d'orthographe courantes
    const corrections = {
        'textes': 'textes',
        'captivants': 'captivants',
        'commencerons': 'commencerons',
        'textes descriptif': 'texte descriptif',
        'au moins entre': 'au moins entre',
        'vont': 'vont',
        'ça': 'cela',
        'avec ça': 'avec cela'
    };
    
    Object.keys(corrections).forEach(incorrect => {
        const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
        improved = improved.replace(regex, corrections[incorrect]);
    });
    
    // 2. Améliorer la ponctuation et la grammaire
    improved = improved
        .replace(/\s*!\s*/g, '! ') // Espace avant les points d'exclamation
        .replace(/\s*\?\s*/g, '? ') // Espace avant les points d'interrogation
        .replace(/\s*\.\s*/g, '. ') // Espace après les points
        .replace(/\s*,\s*/g, ', ') // Espace autour des virgules
        .replace(/\s*:\s*/g, ': ') // Espace autour des deux-points
        .replace(/\s*;\s*/g, '; ') // Espace autour des points-virgules
        .replace(/\s+/g, ' ') // Éviter les espaces multiples
        .trim();
    
    // 3. Corriger les formulations maladroites
    const reformulations = {
        'C\'est quoi un texte descriptif': 'Qu\'est-ce qu\'un texte descriptif',
        'Par où commencerons-nous': 'Par où commencerons-nous',
        'Je vais vous aider avec ça': 'Je vais vous aider avec cela',
        'au moins entre 4 à 6 lignes': 'au moins entre 4 à 6 lignes'
    };
    
    Object.keys(reformulations).forEach(maladroit => {
        improved = improved.replace(new RegExp(maladroit, 'gi'), reformulations[maladroit]);
    });
    
    // 4. Améliorer la structure des phrases
    improved = improved
        .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Majuscule après ponctuation
        .replace(/je vais vous aider([^.]*)/gi, (match, suite) => {
            return match.includes('.') ? match : `Je vais vous aider${suite}.`;
        })
        .replace(/bienvenue dans le module([^.]*)/gi, (match, suite) => {
            return match.includes('.') ? match : `Bienvenue dans le module${suite}.`;
        });
    
    // 5. Vérifier la cohérence et la clarté
    improved = improved
        .replace(/texte descriptif([^s])/gi, 'texte descriptif$1') // Accord
        .replace(/vivant([^s])/gi, 'vivant$1') // Accord
        .replace(/détaillé([^s])/gi, 'détaillé$1'); // Accord
    
    // 6. Ajouter des transitions si nécessaire
    if (improved.includes('aide') && !improved.includes('tout d\'abord') && !improved.includes('pour commencer')) {
        improved = improved.replace(/je vais vous aider/i, 'Pour commencer, je vais vous aider');
    }
    
    // 7. Finaliser avec une ponctuation appropriée
    if (!improved.match(/[.!?]$/)) {
        improved += '.';
    }
    
    console.log('🔧 Réponse améliorée:', improved.substring(0, 100) + '...');
    
    return improved;
}

/**
 * Analyse le contexte et améliore la réponse en fonction du contenu spécifique
 * @param {string} response - Réponse brute de l'IA
 * @param {string} originalText - Texte original de l'étudiant
 * @returns {string|null} Réponse améliorée ou null si pas d'amélioration contextuelle
 */
function analyzeContextAndImprove(response, originalText) {
    if (!originalText || originalText.length < 5) {
        return null;
    }
    
    const lowerOriginal = originalText.toLowerCase();
    const lowerResponse = response.toLowerCase();
    
    // Détecter le type de question et améliorer la réponse
    if (lowerOriginal.includes('texte descriptif') && lowerOriginal.includes('quoi') || lowerOriginal.includes('c\'est quoi')) {
        return generateSpecificDefinitionResponse('texte descriptif', originalText);
    }
    
    if (lowerOriginal.includes('texte narratif') && lowerOriginal.includes('quoi') || lowerOriginal.includes('c\'est quoi')) {
        return generateSpecificDefinitionResponse('texte narratif', originalText);
    }
    
    if (lowerOriginal.includes('texte explicatif') && lowerOriginal.includes('quoi') || lowerOriginal.includes('c\'est quoi')) {
        return generateSpecificDefinitionResponse('texte explicatif', originalText);
    }
    
    if (lowerOriginal.includes('texte argumentatif') && lowerOriginal.includes('quoi') || lowerOriginal.includes('c\'est quoi')) {
        return generateSpecificDefinitionResponse('texte argumentatif', originalText);
    }
    
    // Si l'étudiant demande de l'aide pour un texte spécifique
    if (originalText.length > 20 && (lowerOriginal.includes('aide') || lowerOriginal.includes('corrige') || lowerOriginal.includes('améliore'))) {
        return generateSpecificHelpResponse(originalText, response);
    }
    
    return null;
}

/**
 * Génère une réponse de définition spécifique et détaillée
 * @param {string} textType - Type de texte à définir
 * @param {string} originalQuestion - Question originale de l'étudiant
 * @returns {string} Réponse personnalisée
 */
function generateSpecificDefinitionResponse(textType, originalQuestion) {
    const definitions = {
        'texte descriptif': {
            definition: 'Un texte descriptif est un écrit qui vise à représenter une personne, un lieu, un objet ou une situation de manière détaillée et vivante.',
            characteristics: [
                'Utilise des adjectifs qualificatifs précis',
                'Emploie des comparaisons et des métaphores',
                'Organise l\'espace de manière logique (du général au particulier)',
                'Fait appel aux cinq sens pour rendre la description immersive',
                'Utilise un temps dominant (présent ou imparfait)'
            ],
            examples: [
                'La vieille maison aux volets bleus se dressait fièrement au milieu du jardin verdoyant.',
                'Sur la table en bois brut, une tasse fumante laissait échapper des volutes de vapeur parfumée.'
            ],
            tips: [
                'Commencez par une vue d\'ensemble',
                'Ajoutez progressivement les détails précis',
                'Utilise des champs lexicaux riches',
                'Variez les structures des phrases'
            ]
        },
        'texte narratif': {
            definition: 'Un texte narratif raconte une histoire, réelle ou imaginaire, en suivant une chronologie d\'événements.',
            characteristics: [
                'Suit une structure narrative (situation initiale, élément perturbateur, péripéties, dénouement)',
                'Utilise des temps du récit (passé simple, imparfait, plus-que-parfait)',
                'Intègre des dialogues pour faire vivre les personnages',
                'Crée du suspense et du rythme',
                'Respecte la cohérence temporelle'
            ],
            examples: [
                'Il était une fois un jeune berger qui vivait paisiblement dans les montagnes jusqu\'au jour où...',
                'La porte grinça soudain, révélant une silhouette inconnue sur le seuil.'
            ],
            tips: [
                'Définissez clairement le narrateur',
                'Utilise des connecteurs chronologiques',
                'Créez des personnages mémorables',
                'Variez les rythmes narratifs'
            ]
        },
        'texte explicatif': {
            definition: 'Un texte explicatif a pour but de rendre compréhensible un phénomène, un concept ou un processus.',
            characteristics: [
                'Présente des informations objectives et vérifiables',
                'Utilise des connecteurs logiques (cause, conséquence, but)',
                'Définit les termes techniques',
                'Structure l\'information de manière claire',
                'Évite les opinions personnelles'
            ],
            examples: [
                'La photosynthèse est le processus par lequel les plantes transforment la lumière en énergie.',
                'Pour comprendre le changement climatique, il faut analyser plusieurs facteurs interdépendants.'
            ],
            tips: [
                'Commencez par une définition claire',
                'Organisez les idées en paragraphes thématiques',
                'Utilise des exemples concrets',
                'Vérifiez la clarté de vos explications'
            ]
        },
        'texte argumentatif': {
            definition: 'Un texte argumentatif vise à convaincre le lecteur en présentant une thèse soutenue par des arguments.',
            characteristics: [
                'Présente une thèse claire',
                'Développe des arguments structurés',
                'Apporte des preuves et des exemples',
                'Anticipe et réfute les objections',
                'Conclut de manière percutante'
            ],
            examples: [
                'Il faut interdire les voitures dans les centres-villes car cela réduirait la pollution et améliorerait la qualité de vie.',
                'L\'usage des réseaux sociaux présente plus de dangers que de bénéfices pour les adolescents.'
            ],
            tips: [
                'Formulez une thèse précise',
                'Classez vos arguments par ordre d\'importance',
                'Utilisez des connecteurs argumentatifs',
                'Soyez objectif et factuel'
            ]
        }
    };
    
    const typeInfo = definitions[textType];
    if (!typeInfo) return response;
    
    return `${textType.charAt(0).toUpperCase() + textType.slice(1)}

${typeInfo.definition}

**Caractéristiques principales :**
${typeInfo.characteristics.map((char, i) => `${i + 1}. ${char}`).join('\n')}

**Exemples :**
${typeInfo.examples.map((ex, i) => `${i + 1}. "${ex}"`).join('\n')}

**Conseils pour bien écrire :**
${typeInfo.tips.map((tip, i) => `• ${tip}`).join('\n')}

Maintenant, montrez-moi votre texte et je vous aiderai à l'améliorer selon ces principes !`;
}

/**
 * Génère une réponse d'aide spécifique pour un texte donné
 * @param {string} originalText - Texte original de l'étudiant
 * @param {string} currentResponse - Réponse actuelle de l'IA
 * @returns {string} Réponse personnalisée
 */
function generateSpecificHelpResponse(originalText, currentResponse) {
    // Analyser le texte original pour identifier les problèmes potentiels
    const analysis = analyzeTextIssues(originalText);
    
    let response = `J'ai analysé votre texte et voici mes observations :\n\n`;
    
    if (analysis.grammar.length > 0) {
        response += "**🔍 Points de grammaire à améliorer :**\n";
        analysis.grammar.forEach((issue, i) => {
            response += `${i + 1}. ${issue}\n`;
        });
        response += '\n';
    }
    
    if (analysis.style.length > 0) {
        response += "**🎨 Suggestions d'amélioration stylistique :**\n";
        analysis.style.forEach((suggestion, i) => {
            response += `${i + 1}. ${suggestion}\n`;
        });
        response += '\n';
    }
    
    if (analysis.structure.length > 0) {
        response += "**📝 Organisation du texte :**\n";
        analysis.structure.forEach((point, i) => {
            response += `${i + 1}. ${point}\n`;
        });
        response += '\n';
    }
    
    response += "**✅ Points forts de votre texte :**\n";
    analysis.strengths.forEach((strength, i) => {
        response += `• ${strength}\n`;
    });
    
    response += `\nSouhaitez-vous que je vous aide à corriger ces points spécifiquement ?`;
    
    return response;
}

/**
 * Analyse les problèmes potentiels dans un texte
 * @param {string} text - Texte à analyser
 * @returns {Object} Analyse structurée des problèmes
 */
function analyzeTextIssues(text) {
    const issues = {
        grammar: [],
        style: [],
        structure: [],
        strengths: []
    };
    
    // Détection simple des problèmes (à améliorer avec des règles plus complexes)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Vérifier la longueur des phrases
    sentences.forEach((sentence, i) => {
        if (sentence.length > 100) {
            issues.structure.push(`La phrase ${i + 1} est très longue (${sentence.length} caractères). Considérez la couper.`);
        }
        if (sentence.length < 10) {
            issues.structure.push(`La phrase ${i + 1} est très courte. Enrichissez-la.`);
        }
    });
    
    // Vérifier la ponctuation
    if (!text.match(/[.!?]$/)) {
        issues.grammar.push('Le texte ne se termine pas par une ponctuation finale.');
    }
    
    // Vérifier les répétitions
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = {};
    words.forEach(word => {
        if (word.length > 3) {
            wordCount[word] = (wordCount[word] || 0) + 1;
        }
    });
    
    Object.keys(wordCount).forEach(word => {
        if (wordCount[word] > 3) {
            issues.style.push(`Le mot "${word}" est répété ${wordCount[word]} fois. Variez votre vocabulaire.`);
        }
    });
    
    // Identifier les points forts
    if (sentences.length >= 3) {
        issues.strengths.push('Texte bien structuré avec plusieurs phrases.');
    }
    
    if (text.includes(',') || text.includes(';') || text.includes(':')) {
        issues.strengths.push('Bonne utilisation de la ponctuation pour structurer les idées.');
    }
    
    if (text.length > 50) {
        issues.strengths.push('Texte suffisamment développé.');
    }
    
    return issues;
}

/**
 * Fonction de débogage pour vérifier l'état de la pipeline
 */
window.debugPipelineStatus = function() {
    console.log('=== ÉTAT DE L\'APPLICATION ===');
    console.log('Nom:', window.APP_CONFIG.name);
    console.log('Version:', window.APP_CONFIG.version);
    // console.log('Mode debug:', window.APP_CONFIG.debug); // Réduit le bruit console
    console.log('Modules prêts:', areAllModulesReady());
    console.log('IA prête:', appState.iaReady);
    console.log('Statut actuel:', appState.currentStatus);
    console.log('Temps de démarrage:', new Date(appState.startTime).toISOString());
    console.log('Erreurs:', appState.errors.length);
    
    return {
        modulesReady: areAllModulesReady(),
        iaReady: appState.iaReady,
        errors: appState.errors.length
    };
};

/**
 * Initialise l'application complète
 * @returns {Promise<void>}
 */
async function initializeApp() {
    try {
        console.log(`🚀 Démarrage de ${window.APP_CONFIG.name} v${window.APP_CONFIG.version}`);
        
        appState.currentStatus = 'initialization';
        
        await initIA();
        
        appState.modulesReady = true;
        appState.currentStatus = 'ready';
        
        console.log('✅ Application initialisée avec succès');
        console.log(`⏱️ Temps d'initialisation: ${Date.now() - appState.startTime}ms`);
        
    } catch (error) {
        addError(`App initialization failed: ${error.message}`, 'initialization');
        appState.currentStatus = 'error';
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
}

// Démarrer l'application au chargement
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// ─── A1 : garde de disponibilité RÉELLE du moteur local ───
// `window.NLPRules` n'est peuplé qu'après `nlp-database-ready`
// (nlp/database-integration.js:73, via integrateRules()). Tester seulement
// `window.correctTextWithDatabase` laisserait passer un moteur aux règles vides.
function isLocalEngineReady() {
    if (typeof window.correctTextWithDatabase !== 'function') return false;
    var rules = window.NLPRules;
    if (!rules || typeof rules !== 'object') return false;
    return Object.keys(rules).some(function (cat) {
        return Array.isArray(rules[cat]) && rules[cat].length > 0;
    });
}

// ─── A1 : message honnête quand aucun moteur local n'est disponible ───
function messageServiceIndisponible(contexte) {
    if (contexte === 'chat') {
        return 'Le service IA est momentanément indisponible. Votre question n\u2019a pas pu recevoir de réponse pour le moment. Merci de réessayer dans quelques instants.';
    }
    return 'Le service IA et l\u2019analyse locale sont momentanément indisponibles. Votre réponse n\u2019a pas pu être analysée pour le moment. Merci de réessayer dans quelques instants.';
}

// ─── B1-B1 : message honnête quand le Worker signale une saturation (HTTP 429) ───
// Le 429 est une INSTRUCTION explicite (« réessayez plus tard »), pas une panne :
// il ne doit donc ni passer par le catch générique, ni produire l'heuristique de
// longueur (« Analyse locale (IA distante non configurée) — Votre réponse est très courte »).
function messageSature(retryAfterSeconds) {
    if (typeof retryAfterSeconds === 'number' && isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        return 'Le service IA est momentanément saturé. Réessayez dans ' + retryAfterSeconds + ' seconde' + (retryAfterSeconds > 1 ? 's' : '') + '.';
    }
    return 'Le service IA est momentanément saturé. Veuillez réessayer plus tard.';
}

// ─── B1-B1 : extraction SANS invention de `retryAfter` ───
// Seule source retenue : `data.retryAfter` du corps JSON (W2/W3 le fournissent).
// Aucune valeur par défaut n'est fabriquée : absent ou invalide => null.
function extraireRetryAfterSeconds(valeur) {
    var n = Number(valeur);
    if (!isFinite(n) || n <= 0) return null;
    return n;
}

// ─── B1-B1 / B1-C1 : état retourné au niveau appelant pour un HTTP 429 ───
// AUCUN retry : une seule requête est émise, jamais de seconde tentative.
// B1-C1 : en ACTIVITÉ, le moteur local existant (275 règles, via `repliLocal`)
// prend le relais comme dans A1 — le texte `studentAnswer` est disponible dans
// `runFourModelPipeline`. En CHAT, le moteur est un CORRECTEUR et non un
// générateur de réponse : il reste donc délibérément non appelé.
// L'information de saturation est TOUJOURS conservée dans `analysis`.
async function etatSaturation(retryAfterSeconds, estChat, texte) {
    const base = {
        source: 'saturated',
        iaUnavailable: true,
        retryAfterSeconds: (typeof retryAfterSeconds === 'number' ? retryAfterSeconds : null)
    };
    // ─── CHAT : message de saturation, AUCUN appel au moteur local ───
    if (estChat) {
        return Object.assign(base, {
            analysis: messageSature(retryAfterSeconds),
            corrections: [], explanations: [], suggestions: [],
            isChatResponse: true
        });
    }
    // ─── ACTIVITÉ : moteur local si prêt, sinon message honnête ───
    if (!isLocalEngineReady()) {
        return Object.assign(base, {
            analysis: messageSature(retryAfterSeconds),
            corrections: [], explanations: [], suggestions: [],
            isActivityResponse: true
        });
    }
    // Réutiliser le mécanisme A1 existant — aucune réécriture du moteur.
    const local = await repliLocal(texte, false);
    return Object.assign(base, {
        analysis: messageSature(retryAfterSeconds) + ' ' + local.analysis,
        corrections: (local && Array.isArray(local.corrections)) ? local.corrections : [],
        explanations: [], suggestions: [],
        isActivityResponse: true,
        localFallback: true
    });
}

// ─── A1 : repli local via le moteur EXISTANT (275 règles, aucune réécriture) ───
async function repliLocal(texte, estChat) {
    if (estChat) {
        return {
            source: 'local_requis',
            analysis: messageServiceIndisponible('chat'),
            corrections: [], explanations: [], suggestions: [],
            isChatResponse: true, iaUnavailable: true
        };
    }
    if (!isLocalEngineReady()) {
        return {
            source: 'local_requis',
            analysis: messageServiceIndisponible('activite'),
            corrections: [], explanations: [], suggestions: [],
            isActivityResponse: true, iaUnavailable: true
        };
    }
    const resultat = await window.correctTextWithDatabase(texte);
    const corrections = (resultat && Array.isArray(resultat.corrections)) ? resultat.corrections : [];
    console.log('✅ Analyse locale utilisée (source=local_requis):', { corrections: corrections.length });
    let texteFinal = 'Analyse locale (service IA momentanément indisponible).';
    if (corrections.length > 0) {
        texteFinal += ' ' + corrections.length + ' correction(s) détectée(s) :\n' +
            corrections.map(function (c) { return '• « ' + c.original + ' » → « ' + c.corrected + ' »'; }).join('\n');
    } else {
        texteFinal += ' Aucune correction automatique n\u2019a été détectée par les règles locales.';
    }
    return {
        source: 'local_requis',
        analysis: texteFinal,
        corrections: corrections, explanations: [], suggestions: [],
        isActivityResponse: true, localFallback: true
    };
}

// Pipeline IA — Worker Cloudflare avec fallback local
window.runFourModelPipeline = async function(studentAnswer, activityContext, activityType, optionsV2) {
    console.log('🚀 Pipeline IA activé (Worker Cloudflare)');
    console.log('📝 Réponse étudiant:', studentAnswer);
    console.log('📝 Contexte activité:', activityContext);
    
    // ─── V2 : déterminer le mode et construire le body ───
    var useV2 = !!(optionsV2 && optionsV2.textOriginal && window.RequestBuilderV2);
    var requestBody;
    
    if (useV2) {
        // Déterminer le mode V2
        var mode = (activityContext === 'chat' || activityContext.includes('chat')) ? 'chat' : 'activity';
        
        // Construire RequestV2 via le module dédié
        var requestV2 = window.RequestBuilderV2.buildRequestV2({
            mode: mode,
            textOriginal: optionsV2.textOriginal,
            localDetections: optionsV2.localDetections || [],
            context: optionsV2.context || null
        });
        
        console.log('📝 V2 Request construite:', {
            contractVersion: requestV2.contractVersion,
            mode: requestV2.mode,
            textOriginalLength: requestV2.student.text_original.length,
            detections: requestV2.local_detections.length
        });
        
        requestBody = JSON.stringify(requestV2);
    }
    
    try {
        // Appel du Worker Cloudflare avec timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        // Déterminer le type de prompt selon le contexte (legacy V1)
        let systemPrompt;
        let userPrompt;
        
        if (activityContext === 'chat' || activityContext.includes('chat')) {
            systemPrompt = `Tu es un assistant expert en français et en pédagogie. Réponds de manière claire, utile et encourageante aux questions de l'étudiant. Sois précis et donne des exemples quand c'est pertinent. Utilise un langage simple mais correct.`;
            userPrompt = `Question de l'étudiant : "${studentAnswer}"`;
        } else if (activityContext === 'activité') {
            systemPrompt = `Tu es un professeur de français. Analyse la réponse de l'étudiant de manière pédagogique et encourageante. 
            - Identifie les erreurs de grammaire, orthographe, vocabulaire
            - Explique les règles de manière simple
            - Donne des exemples clairs
            - Propose des exercices si nécessaire
            - Sois toujours positif et constructif
            
            Réponds de manière naturelle et conversationnelle, pas en JSON.`;
            userPrompt = `Réponse de l'étudiant : "${studentAnswer}". Analyse cette réponse et donne des conseils constructifs.`;
        } else {
            systemPrompt = `Tu es un expert en français et en pédagogie. Analyse la réponse de l'étudiant avec le contexte suivant : ${activityContext}. Sois encourageant mais précis. Identifie les points forts et les axes d'amélioration. Formatage JSON avec les champs : analysis, error_type, rule, hint, example, exercise, validation, confidence.`;
            userPrompt = `Texte de l'étudiant : "${studentAnswer}"`;
        }
        
        // SEC-003 : Worker-only — aucun appel direct à Groq depuis le navigateur
        const workerUrl = window.APP_CONFIG?.api?.workerUrl || 'https://langue-francaise-ia.chellouaikamel50.workers.dev';
        if (window.antiRafaleProtection && window.antiRafaleProtection.isThrottled('ia-request')) {
            console.warn('⚠️ Requête IA throttled (anti-rafale)');
            return { source: 'throttled', analysis: 'Trop de requêtes en cours. Veuillez patienter.', corrections: [], explanations: [], suggestions: [], throttled: true };
        }
        
        // ─── Body : V2 ou V1 ───
        var bodyPayload = useV2
            ? requestBody
            : JSON.stringify({
                action: 'analyze',
                systemPrompt: systemPrompt,
                userPrompt: userPrompt,
                context: activityContext,
                maxTokens: activityContext === 'chat' ? 500 : 300,
                temperature: 0.7
            });
        
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: window.AuthClient
                ? window.AuthClient.withAuthHeaders({ 'Content-Type': 'application/json' })
                : { 'Content-Type': 'application/json' },
            body: bodyPayload,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        // Session expirée → retour à la connexion
        if (response.status === 401) {
            if (window.AuthClient) window.AuthClient.clearToken();
            if (window.profileSelector) window.profileSelector.showLoginScreen();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        // ─── B1-B1 : HTTP 429 traité EXPLICITEMENT (ne tombe plus dans le catch) ───
        // 429 = saturation/quota : le Worker demande une temporisation. On ne réémet
        // JAMAIS de requête ici (aucun retry) et on n'invente aucun délai : seul
        // `data.retryAfter` du corps est lu (W2 legacy=5, W3 legacy=quota Groq).
        // ⚠️ W1 (saturation V2, ai-pipeline-worker.js:1282) renvoie une ResponseV2
        // `status:'throttled'` sans `retryAfter` => retryAfterSeconds = null.
        if (response.status === 429) {
            let corps429 = null;
            try { corps429 = await response.json(); } catch (e) { corps429 = null; }
            const ra429 = extraireRetryAfterSeconds(corps429 && corps429.retryAfter);
            const estChat429 = (activityContext === 'chat' || activityContext.includes('chat'));
            console.warn('⚠️ Worker: HTTP 429 (saturation)', { retryAfterSeconds: ra429 });
            return await etatSaturation(ra429, estChat429, studentAnswer);
        }
        if (!response.ok) { throw new Error(`Erreur Worker: ${response.status} ${response.statusText}`); }
        const data = await response.json();
        
        // ─── V2 : détecter ResponseV2 et la retourner directement ───
        if (isResponseV2(data)) {
            console.log('✅ ResponseV2 reçue du Worker:', {
                contractVersion: data.contractVersion,
                source: data.source,
                status: data.status
            });

            // ─── V2 : validation centralisée des rule_id côté frontend ───
            // validateResponseRuleIds applique directement les résultats in-place
            // sur analysis.errors[] et course (rule_known_locally, local_detected,
            // model_suggested, validated, rule_id).
            if (window.RequestBuilderV2 && typeof window.RequestBuilderV2.validateResponseRuleIds === 'function') {
                var sentDetections = (optionsV2 && Array.isArray(optionsV2.localDetections)) ? optionsV2.localDetections : [];
                window.RequestBuilderV2.validateResponseRuleIds(data, sentDetections);
            }

            // Retourner l'objet ResponseV2 validé — demanderIA() le normalisera
            return data;
        }

        // ─── A1 : contrat Worker « local_requis » (fallback local requis côté client) ───
        // Le Worker peut renvoyer ce signal en HTTP 200 (ai-pipeline-worker.js:1550/1557/1565) :
        // le corps ne porte alors ni `choices` ni `analysis`. Sans ce test, le client affichait
        // la chaîne littérale « Réponse IA non disponible » au lieu d'une réponse.
        // ⚠️ HTTP 429 (saturation/quota) n'atteint pas ce point : `!response.ok` (l.770) lève déjà.
        if (data.source === 'local_requis') {
            console.warn('⚠️ Worker: repli local requis (source=local_requis)');
            const _estChat = (activityContext === 'chat' || activityContext.includes('chat'));
            return await repliLocal(studentAnswer, _estChat);
        }
        
        // ─── Legacy V1 : comportement existant ───
        const aiResponse = data.choices?.[0]?.message?.content || data.analysis || 'Réponse IA non disponible';
        const workerSource = data.source || 'remote_unknown';
        console.log('✅ Réponse Worker reçue:', { source: workerSource, length: aiResponse.length });
        
        // Traiter la réponse selon le contexte
        if (activityContext === 'chat' || activityContext.includes('chat')) {
            // Mode chat : retourner la réponse directement
            return {
                source: workerSource,
                analysis: aiResponse,
                corrections: [],
                explanations: [],
                suggestions: [],
                isChatResponse: true
            };
        } else if (activityContext === 'activité') {
            // Mode activité : retourner la réponse naturelle
            return {
                source: workerSource,
                analysis: aiResponse,
                corrections: [],
                explanations: [],
                suggestions: [],
                isActivityResponse: true
            };
        } else {
            // Mode analyse pédagogique : tenter de parser le JSON
            try {
                const parsedResponse = JSON.parse(aiResponse);
                console.log('📊 Réponse parsée:', parsedResponse);
                return JSON.stringify({ ...parsedResponse, source: workerSource });
            } catch (parseError) {
                // console.log('⚠️ Réponse non-JSON, retour formaté'); // Réduit le bruit console
                return JSON.stringify({
                    source: workerSource,
                    analysis: aiResponse.substring(0, 200),
                    error_type: "général",
                    rule: "expression",
                    hint: "Continuez vos efforts",
                    example: "Votre expression est bonne",
                    exercise: "Pratiquez régulièrement",
                    validation: true,
                    confidence: 0.8
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur Worker IA:', error);
        
        // Fallback intelligent basé sur l'analyse locale
        console.log('🔄 Activation du fallback pédagogique intelligent...');
        
        // Analyser la réponse étudiant
        const answerLength = studentAnswer.trim().length;
        const hasStructure = studentAnswer.includes('.') || studentAnswer.includes(',') || studentAnswer.includes(';');
        const hasVerbs = /[a-zA-Z]+er\b|[a-zA-Z]+é\b|[a-zA-Z]+és\b|[a-zA-Z]+ée\b|[a-zA-Z]+ées\b/.test(studentAnswer);
        
        let feedback = {
            source: 'locale',
            analysis: "Analyse locale (IA distante non configurée).",
            error_type: "structure",
            rule: "développement",
            hint: "Développez votre réponse",
            example: "Exemple à consulter",
            exercise: "Exercice de consolidation",
            validation: true,
            confidence: 0.7
        };
        
        // Feedback personnalisé selon la réponse
        if (answerLength < 30) {
            feedback.analysis = "Votre réponse est très courte. Essayez de développer davantage vos idées.";
            feedback.hint = "Ajoutez des détails et des exemples concrets.";
            feedback.exercise = "Réécrivez votre réponse en ajoutant au moins 3 phrases complètes.";
        } else if (answerLength > 100) {
            feedback.analysis = "Bonne longueur de réponse. Continuez dans cette voie.";
            feedback.validation = true;
            feedback.confidence = 0.9;
        } else {
            feedback.analysis = "Longueur appropriée. Pensez à structurer davantage vos idées.";
            feedback.hint = "Organisez votre réponse en paragraphes logiques.";
        }
        
        // ACTION 20: le marqueur d'origine locale doit survivre aux heuristiques de longueur
        // (l'IA distante n'est pas configurée — l'analyse est produite localement).
        feedback.analysis = "Analyse locale (IA distante non configurée) — " + feedback.analysis;
        
        if (!hasStructure) {
            feedback.rule = "ponctuation";
            feedback.hint = "Utilisez des points et des virgules pour structurer votre texte.";
        }
        
        if (activityContext.includes('passé') && !hasVerbs) {
            feedback.rule = "temps_verbaux";
            feedback.hint = "Pensez à utiliser des verbes au passé comme demandé.";
            feedback.exercise = "Conjuguez 3 verbes au passé composé dans votre réponse.";
        }
        
        console.log('📊 Feedback généré:', feedback);
        // ACTION 20: retourner l'objet (et non JSON.stringify) afin que `source: 'locale'`
        // survive jusqu'à l'UI — l'interface déballe déjà response.analysis objet (index.html).
        return feedback;
    }
};

// Démarrer l'IA au chargement
console.log("🚀 Initialisation IA — Worker Cloudflare (openai/gpt-oss-20b)");

// Système de détection de modifications et suppression automatique du cache
window.CacheManager = {
    // Cache des timestamps de modification
    modificationTimestamps: new Map(),
    
    // Observer pour détecter les modifications
    observer: null,
    
    // Intervalle de vérification
    checkInterval: null,
    
    // Mode développement/production
    isDevelopment: true, // Par défaut en mode développement
    
    // Initialiser le système
    init() {
        // Vérifier si on est en mode développement
        this.isDevelopment = this.detectDevelopmentMode();
        
        if (!this.isDevelopment) {
            console.log('� CacheManager - Mode production détecté, système désactivé');
            return;
        }
        
        console.log('�� CacheManager - Initialisation du système de détection de modifications (MODE DÉVELOPPEMENT)');
        
        // Observer les modifications du DOM
        this.setupMutationObserver();
        
        // Vérifier périodiquement les modifications
        this.setupPeriodicCheck();
        
        // Scanner les éléments existants
        this.scanExistingElements();
        
        // Ajouter un indicateur visuel en mode développement
        this.addDevelopmentIndicator();
    },
    
    // Détecter si on est en mode développement
    detectDevelopmentMode() {
        // Méthodes pour détecter le mode développement
        const checks = [
            // URL localhost
            () => window.location.hostname === 'localhost',
            // URL 127.0.0.1
            () => window.location.hostname === '127.0.0.1',
            // Port spécifique (ex: 3000, 8000, etc.)
            () => window.location.port && window.location.port !== '80' && window.location.port !== '443',
            // Paramètre URL
            () => window.location.search.includes('dev=true') || window.location.search.includes('debug=true'),
            // Variable globale
            () => window.DEVELOPMENT_MODE === true,
            // Console ouverte (indicateur de développement)
            () => window.console && window.console.firebug,
            // Absence de HTTPS en production
            () => window.location.protocol === 'file:'
        ];
        
        // Retourner true si au moins une vérification est vraie
        return checks.some(check => {
            try {
                return check();
            } catch (e) {
                return false;
            }
        });
    },
    
    // Ajouter un indicateur visuel en mode développement
    addDevelopmentIndicator() {
        // Créer un badge indiquant le mode développement
        const badge = document.createElement('div');
        badge.id = 'dev-mode-indicator';
        badge.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff6b6b;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            font-family: monospace;
            animation: pulse 2s infinite;
        `;
        badge.textContent = 'DEV MODE - Cache Actif';
        
        // Ajouter l'animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(badge);
        
        // Ajouter un bouton pour forcer le cache
        const clearButton = document.createElement('button');
        clearButton.textContent = '🗑️ Vider Cache';
        clearButton.style.cssText = `
            position: fixed;
            top: 45px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 5px 10px;
            border: none;
            border-radius: 5px;
            font-size: 12px;
            cursor: pointer;
            z-index: 9999;
            font-family: monospace;
        `;
        clearButton.onclick = () => {
            this.clearAllCaches();
            alert('Cache vidé avec succès !');
        };
        
        document.body.appendChild(clearButton);
        
        console.log('🎨 CacheManager - Indicateurs de mode développement ajoutés');
    },
    
    // Configurer l'observer de mutations
    setupMutationObserver() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    this.handleDOMChange(mutation);
                }
            });
        });
        
        // Observer tout le document
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeOldValue: true
        });
        
        console.log('📡 CacheManager - Observer de mutations configuré (mode développement)');
    },
    
    // Configurer la vérification périodique
    setupPeriodicCheck() {
        this.checkInterval = setInterval(() => {
            this.checkForModifications();
        }, 5000); // Vérifier toutes les 5 secondes
        
        console.log('⏰ CacheManager - Vérification périodique configurée (5s) - mode développement');
    },
    
    // Scanner les éléments existants
    scanExistingElements() {
        const elements = document.querySelectorAll('[id], [data-cache-key]');
        elements.forEach(element => {
            this.registerElement(element);
        });
        
        console.log(`🔍 CacheManager - ${elements.length} éléments existants scannés (mode développement)`);
    },
    
    // Enregistrer un élément
    registerElement(element) {
        const key = this.getElementKey(element);
        const content = this.getElementContent(element);
        const timestamp = Date.now();
        
        this.modificationTimestamps.set(key, {
            content: content,
            timestamp: timestamp,
            element: element
        });
    },
    
    // Obtenir la clé d'un élément
    getElementKey(element) {
        return element.id || element.getAttribute('data-cache-key') || element.tagName + '-' + Math.random().toString(36).substr(2, 9);
    },
    
    // Obtenir le contenu d'un élément
    getElementContent(element) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            return element.value;
        } else if (element.tagName === 'SELECT') {
            return element.value;
        } else {
            return element.textContent || element.innerHTML;
        }
    },
    
    // Gérer les changements DOM
    handleDOMChange(mutation) {
        if (mutation.target) {
            const element = mutation.target.nodeType === Node.TEXT_NODE ? 
                mutation.target.parentElement : mutation.target;
            
            if (element && (element.id || element.getAttribute('data-cache-key'))) {
                this.checkElementModification(element);
            }
        }
    },
    
    // Vérifier les modifications de tous les éléments
    checkForModifications() {
        this.modificationTimestamps.forEach((data, key) => {
            if (data.element && document.contains(data.element)) {
                this.checkElementModification(data.element);
            } else {
                // Élément supprimé, nettoyer le cache
                this.modificationTimestamps.delete(key);
            }
        });
    },
    
    // Vérifier la modification d'un élément
    checkElementModification(element) {
        const key = this.getElementKey(element);
        const currentContent = this.getElementContent(element);
        const cachedData = this.modificationTimestamps.get(key);
        
        if (cachedData && cachedData.content !== currentContent) {
            console.log('🔄 CacheManager - Modification détectée (mode développement):', key);
            this.handleModification(key, element, currentContent, cachedData);
        }
    },
    
    // Gérer une modification détectée
    handleModification(key, element, newContent, oldData) {
        console.log(`📝 CacheManager - Élément modifié (mode développement): ${key}`);
        console.log(`📊 Ancien contenu: "${oldData.content}"`);
        console.log(`📊 Nouveau contenu: "${newContent}"`);
        
        // Mettre à jour le timestamp
        this.modificationTimestamps.set(key, {
            content: newContent,
            timestamp: Date.now(),
            element: element
        });
        
        // Supprimer tous les caches
        this.clearAllCaches();
        
        // Notifier les autres systèmes
        this.notifyModification(key, element, newContent);
        
        // Mettre à jour l'indicateur visuel
        this.updateIndicator();
    },
    
    // Mettre à jour l'indicateur visuel
    updateIndicator() {
        const badge = document.getElementById('dev-mode-indicator');
        if (badge) {
            badge.style.background = '#ff9800';
            badge.textContent = 'DEV MODE - Cache Vidé';
            
            setTimeout(() => {
                badge.style.background = '#ff6b6b';
                badge.textContent = 'DEV MODE - Cache Actif';
            }, 2000);
        }
    },
    
    // Supprimer tous les caches
    clearAllCaches() {
        console.log('🗑️ CacheManager - Suppression de tous les caches (mode développement)...');
        
        // Vider les caches des différents systèmes
        if (window.SpacyAnalyzer && window.SpacyAnalyzer.clearCache) {
            window.SpacyAnalyzer.clearCache();
            console.log('✅ Cache SpacyAnalyzer vidé');
        }
        
        if (window.chatSystem && window.chatSystem.clearCache) {
            window.chatSystem.clearCache();
            console.log('✅ Cache chatSystem vidé');
        }
        
        // Vider les caches locaux
        if (typeof localStorage !== 'undefined') {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('cache') || key.includes('temp') || key.includes('analysis'))) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log(`🗑️ Cache localStorage supprimé: ${key}`);
            });
        }
        
        // Vider les caches sessionStorage
        if (typeof sessionStorage !== 'undefined') {
            const keysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('cache') || key.includes('temp') || key.includes('analysis'))) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                sessionStorage.removeItem(key);
                console.log(`🗑️ Cache sessionStorage supprimé: ${key}`);
            });
        }
        
        // Forcer le rechargement des scripts si nécessaire
        this.forceScriptReload();
        
        console.log('🎯 CacheManager - Tous les caches ont été supprimés (mode développement)');
    },
    
    // Notifier les autres systèmes de la modification
    notifyModification(key, element, newContent) {
        // Émettre un événement personnalisé
        const event = new CustomEvent('cacheModification', {
            detail: {
                key: key,
                element: element,
                newContent: newContent,
                timestamp: Date.now(),
                mode: 'development'
            }
        });
        
        document.dispatchEvent(event);
        
        console.log('📢 CacheManager - Événement de modification émis (mode développement)');
    },
    
    // Forcer le rechargement des scripts
    forceScriptReload() {
        // DÉSACTIVÉ en production : ne pas réinjecter les scripts déjà exécutés
        // pour éviter les erreurs de déclarations dupliquées (const/class)
        // console.log('🔄 CacheManager - forceScriptReload désactivé en production');
    },
    
    // Arrêter le système
    stop() {
        if (this.observer) {
            this.observer.disconnect();
            console.log('🛑 CacheManager - Observer arrêté (mode développement)');
        }
        
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            console.log('🛑 CacheManager - Vérification périodique arrêtée (mode développement)');
        }
        
        // Supprimer les indicateurs visuels
        const badge = document.getElementById('dev-mode-indicator');
        if (badge) {
            badge.remove();
        }
        
        const button = document.querySelector('button[onclick*="clearAllCaches"]');
        if (button) {
            button.remove();
        }
    },
    
    // Obtenir des statistiques
    getStats() {
        return {
            watchedElements: this.modificationTimestamps.size,
            modificationsDetected: this.modificationTimestamps.size,
            systemActive: !!(this.observer && this.checkInterval),
            mode: this.isDevelopment ? 'development' : 'production',
            isDevelopment: this.isDevelopment
        };
    }
};

// Démarrer le CacheManager au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    // Démarrer après un court délai pour s'assurer que tout est chargé
    setTimeout(() => {
        window.CacheManager.init();
        
        // Écouter les événements de modification
        document.addEventListener('cacheModification', function(event) {
            console.log('🎯 CacheManager - Modification détectée:', event.detail);
        });
        
        console.log('✅ CacheManager - Système de gestion de cache démarré');
    }, 1000);
});

// Fonction globale pour forcer la suppression du cache
window.forceClearCache = function() {
    console.log('🔄 ForceClearCache - Suppression manuelle des caches...');
    window.CacheManager.clearAllCaches();
    return 'Tous les caches ont été supprimés';
};
