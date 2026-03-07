/**
 * =================================================================
 * POINT D'ENTRÉE PRINCIPAL DE L'APPLICATION
 * Version propre et fonctionnelle
 * =================================================================
 */

'use strict';

// Configuration de l'application
const APP_CONFIG = {
    name: 'Langue Française',
    version: '2.0',
    debug: location.hostname === 'localhost' || location.protocol === 'file:',
    modules: {
        required: [
            'runFourModelPipeline',
            'initializeUIElements',
            'initializeChatSystem',
            'initializeAudioSystem',
            'initializeActivities'
        ],
        optional: [
            'initializeSpacyRules',
            'loadCustomRules'
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
        
        if (APP_CONFIG.debug) {
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
    return APP_CONFIG.modules.required.every(moduleName => 
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
    
    if (APP_CONFIG.debug) {
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
    console.log('Nom:', APP_CONFIG.name);
    console.log('Version:', APP_CONFIG.version);
    console.log('Mode debug:', APP_CONFIG.debug);
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
        console.log(`🚀 Démarrage de ${APP_CONFIG.name} v${APP_CONFIG.version}`);
        
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

// Démarrer l'IA au chargement
console.log("🚀 Initialisation avec pipeline IA modeles specifiques - DeepSeek-V3 + GPT-5 + Llama 4 Scout");
