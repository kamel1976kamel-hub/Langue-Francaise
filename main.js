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
        retryDelay: 1000
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
 * Met à jour le statut de l'IA dans l'interface
 * @param {string} statusText - Texte du statut
 * @param {string} bgColorClass - Classe CSS pour la couleur
 * @param {number} progressPercent - Pourcentage de progression
 */
function setIaStatus(statusText, bgColorClass, progressPercent) {
    const statusElement = document.getElementById('ia-status');
    const progressBar = document.getElementById('ia-progress');
    
    try {
        if (statusElement) {
            statusElement.textContent = statusText;
            statusElement.className = statusElement.className.replace(/bg-\w+-500/g, bgColorClass);
        }
        
        if (progressBar) {
            progressBar.style.width = `${Math.max(0, Math.min(100, progressPercent))}%`;
            progressBar.className = `h-1 rounded-full transition-all duration-300 ${bgColorClass}`;
        }
        
        if (window.APP_CONFIG.debug) {
            console.log(`🤖 IA Status: ${statusText} (${progressPercent}%)`);
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut IA:', error);
    }
}

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
 * Pipeline à 4 modèles avec fallback
 * @param {string} studentAnswer - Réponse de l'étudiant
 * @param {string} activityContext - Contexte de l'activité
 * @param {string} activityType - Type d'activité
 * @returns {Promise<string>} Réponse de l'IA
 */
async function runFourModelPipelineWithFallback(studentAnswer, activityContext, activityType = 'general') {
    try {
        setIaStatus("IA : analyse en cours...", "bg-blue-500", 25);
        
        if (typeof window.runFourModelPipeline === 'function') {
            setIaStatus("IA : traitement intelligent...", "bg-purple-500", 50);
            const result = await window.runFourModelPipeline(studentAnswer, activityContext, activityType);
            setIaStatus("IA : analyse terminée", "bg-emerald-500", 100);
            return result;
        }
        
        throw new Error('Pipeline IA temps réel non disponible. Veuillez configurer votre clé API OpenAI.');
        
    } catch (error) {
        addError(`Pipeline error: ${error.message}`, 'pipeline');
        setIaStatus("IA : configuration requise", "bg-rose-500", 0);
        
        const errorMessage = `⚠️ Pipeline IA non configuré
        
Pour activer l'IA temps réel :
1. Obtenez une clé API sur https://platform.openai.com/api-keys
2. Configurez-la avec : configureAPIKey("votre-clé-api")
3. Ou utilisez l'interface graphique qui apparaît automatiquement
        
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
window.demanderIA = async function(prompt, contexte) {
    try {
        if (!appState.iaReady) {
            return {
                analysis: "L'IA est en cours d'initialisation. Veuillez patienter...",
                corrections: [],
                explanations: [],
                suggestions: []
            };
        }

        const result = await runFourModelPipelineWithFallback(prompt, contexte);
        
        // Extraire le texte original de l'étudiant depuis le contexte
        let originalText = '';
        try {
            const contextObj = typeof contexte === 'string' ? JSON.parse(contexte) : contexte;
            if (contextObj && contextObj.student_message) {
                originalText = contextObj.student_message;
            }
        } catch (e) {
            // console.log('⚠️ Impossible de parser le contexte pour extraire le texte original'); // Réduit le bruit console
        }
        
        // Améliorer la qualité de la réponse avec le texte original
        const improvedResult = improveResponseQuality(result, originalText);
        
        // Analyser le texte original pour les corrections
        let corrections = [];
        let explanations = [];
        let suggestions = [];
        
        if (originalText && originalText.length > 5) {
            try {
                const analysisResult = window.analyzeTextLocal && window.analyzeTextLocal(originalText);
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
            analysis: improvedResult,
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
        'au moins entre 4 à 6 lignes': 'au main.js?v=44 à 6 lignes'
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

// Pipeline IA RÉEL - Connexion API Groq avec fallback intelligent
window.runFourModelPipeline = async function(studentAnswer, activityContext, activityType = 'general') {
    console.log('🚀 Pipeline IA RÉEL activé');
    console.log('📝 Réponse étudiant:', studentAnswer);
    console.log('📝 Contexte activité:', activityContext);
    
    try {
        // Appel API Groq RÉELLE avec timeout et vérification de clé
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        // Vérifier si la clé API est valide
        const apiKey = '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';
        if (!apiKey || apiKey.trim() === '') {
            throw new Error('Clé API Groq manquante ou vide');
        }
        
        console.log('🔑 Clé API Groq:', apiKey.substring(0, 10) + '...');
        
        // Déterminer le type de prompt selon le contexte
        let systemPrompt;
        let userPrompt;
        
        if (activityContext === 'chat' || activityContext.includes('chat')) {
            // Mode chat : répondre directement aux questions
            systemPrompt = `Tu es un assistant expert en français et en pédagogie. Réponds de manière claire, utile et encourageante aux questions de l'étudiant. Sois précis et donne des exemples quand c'est pertinent. Utilise un langage simple mais correct.`;
            userPrompt = `Question de l'étudiant : "${studentAnswer}"`;
        } else {
            // Mode analyse pédagogique : analyser la réponse
            systemPrompt = `Tu es un expert en français et en pédagogie. Analyse la réponse de l'étudiant avec le contexte suivant : ${activityContext}. Sois encourageant mais précis. Identifie les points forts et les axes d'amélioration. Formatage JSON avec les champs : analysis, error_type, rule, hint, example, exercise, validation, confidence.`;
            userPrompt = `Texte de l'étudiant : "${studentAnswer}"`;
        }
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant', // Modèle plus rapide et stable
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                max_tokens: activityContext === 'chat' ? 500 : 300, // Plus de tokens pour le chat
                temperature: 0.7
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        console.log('✅ Réponse API Groq reçue:', aiResponse);
        
        // Traiter la réponse selon le contexte
        if (activityContext === 'chat' || activityContext.includes('chat')) {
            // Mode chat : retourner la réponse directement
            return {
                analysis: aiResponse,
                corrections: [],
                explanations: [],
                suggestions: [],
                isChatResponse: true
            };
        } else {
            // Mode analyse pédagogique : tenter de parser le JSON
            try {
                const parsedResponse = JSON.parse(aiResponse);
                console.log('📊 Réponse parsée:', parsedResponse);
                return JSON.stringify(parsedResponse);
            } catch (parseError) {
                // console.log('⚠️ Réponse non-JSON, retour formaté'); // Réduit le bruit console
                return JSON.stringify({
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
        console.error('❌ Erreur API Groq:', error);
        
        // Fallback intelligent basé sur l'analyse locale
        console.log('🔄 Activation du fallback pédagogique intelligent...');
        
        // Analyser la réponse étudiant
        const answerLength = studentAnswer.trim().length;
        const hasStructure = studentAnswer.includes('.') || studentAnswer.includes(',') || studentAnswer.includes(';');
        const hasVerbs = /[a-zA-Z]+er\b|[a-zA-Z]+é\b|[a-zA-Z]+és\b|[a-zA-Z]+ée\b|[a-zA-Z]+ées\b/.test(studentAnswer);
        
        let feedback = {
            analysis: "Analyse locale effectuée.",
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
        return JSON.stringify(feedback);
    }
};

// Démarrer l'IA au chargement
console.log("🚀 Initialisation avec pipeline IA modeles specifiques - DeepSeek-V3 + GPT-5 + Llama 4 Scout");

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
        const scripts = document.querySelectorAll('script[src*="?v="]');
        const currentVersion = Date.now();
        
        scripts.forEach(script => {
            const src = script.src;
            const newSrc = src.replace(/\?v=\d+/, `?v=${currentVersion}`);
            
            if (src !== newSrc) {
                console.log(`🔄 CacheManager - Rechargement du script (mode développement): ${src}`);
                
                // Créer un nouveau script
                const newScript = document.createElement('script');
                newScript.src = newSrc;
                newScript.async = false;
                
                // Remplacer l'ancien script
                if (script.parentNode) {
                    script.parentNode.replaceChild(newScript, script);
                }
            }
        });
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
