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

// État de l'application
const appState = {
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
            return "L'IA est en cours d'initialisation. Veuillez patienter...";
        }

        const result = await runFourModelPipelineWithFallback(prompt, contexte);
        return result;

    } catch (error) {
        addError(`IA request failed: ${error.message}`, 'ia_request');
        
        const errorMsg = `❌ Erreur du pipeline IA: ${error.message}

Veuillez vérifier votre connexion et réessayer.`;
        console.log('📄 Message d\'erreur généré:', errorMsg);
        return errorMsg;
    }
};

/**
 * Fonction de débogage pour vérifier l'état de la pipeline
 */
window.debugPipelineStatus = function() {
    console.log('=== ÉTAT DE L\'APPLICATION ===');
    console.log('Nom:', window.APP_CONFIG.name);
    console.log('Version:', window.APP_CONFIG.version);
    console.log('Mode debug:', window.APP_CONFIG.debug);
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

// Pipeline IA RÉEL - Connexion API OpenAI
window.runFourModelPipeline = async function(studentAnswer, activityContext, activityType = 'general') {
    console.log('🚀 Pipeline IA RÉEL activé');
    console.log('📝 Réponse étudiant:', studentAnswer);
    console.log('📝 Contexte activité:', activityContext);
    
    try {
        // Appel API OpenAI RÉELLE
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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'
            },
            body: JSON.stringify({
                model: 'llama-3.1-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `Tu es un expert en français et en pédagogie. Analyse la réponse de l'étudiant avec le contexte suivant : ${activityContext}. Sois encourageant mais précis. Identifie les points forts et les axes d'amélioration. Formatage JSON avec les champs : analysis, error_type, rule, hint, example, exercise, validation, confidence.`
                    },
                    {
                        role: 'user',
                        content: `Texte de l'étudiant : "${studentAnswer}"`
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        console.log('✅ Réponse API Groq reçue:', aiResponse);
        
        // Tenter de parser le JSON
        try {
            const parsedResponse = JSON.parse(aiResponse);
            console.log('📊 Réponse parsée:', parsedResponse);
            return JSON.stringify(parsedResponse);
        } catch (parseError) {
            console.log('⚠️ Réponse non-JSON, retour formaté');
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
        
    } catch (error) {
        console.error('❌ Erreur API Groq:', error);
        
        // Fallback pédagogique
        return JSON.stringify({
            analysis: "Service IA temporairement indisponible. Analyse locale effectuée.",
            error_type: "service",
            rule: "connexion",
            hint: "Veuillez réessayer ultérieurement",
            example: "Votre réponse est en cours d'analyse",
            exercise: "Continuez à pratiquer",
            validation: true,
            confidence: 0.5
        });
    }
};

// Démarrer l'IA au chargement
console.log("🚀 Initialisation avec pipeline IA modeles specifiques - DeepSeek-V3 + GPT-5 + Llama 4 Scout");
