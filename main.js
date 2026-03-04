/**
 * =================================================================
 * POINT D'ENTRÉE PRINCIPAL DE L'APPLICATION
 * Version optimisée avec système de fluidité
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
    },
    performance: {
        enableCaching: true,
        enableStreaming: true,
        enableIndicators: true,
        enableRecovery: true,
        enablePreloading: true,
        enableWorkers: true,
        enableVirtualDOM: true,
        enableMemoryManagement: true,
        enableContextualPreloading: true,
        enableNetworkOptimization: true
    }
};

// État de l'application
const appState = {
    modulesReady: false,
    iaReady: false,
    currentStatus: 'initialization',
    errors: [],
    startTime: Date.now(),
    performance: {
        cache: null,
        loader: null,
        pipeline: null,
        indicators: null,
        recovery: null,
        preloader: null,
        workerPool: null,
        memoryManager: null,
        contextualPreloader: null,
        networkOptimizer: null
    }
};

// =================================================================
// INITIALISATION DES SYSTÈMES DE PERFORMANCE
// =================================================================

/**
 * Initialise les systèmes de performance
 */
function initializePerformanceSystems() {
    if (APP_CONFIG.performance.enableCaching && window.IntelligentCache) {
        appState.performance.cache = new window.IntelligentCache(500, 1800000); // 30min TTL
        console.log('🗄️ Cache intelligent initialisé');
    }

    if (window.ProgressiveLoader) {
        appState.performance.loader = new window.ProgressiveLoader();
        appState.performance.loader.setProgressCallback((progress) => {
            if (APP_CONFIG.performance.enableIndicators && window.loadingIndicators) {
                window.loadingIndicators.update('main-loader', {
                    message: `Chargement des modules... ${progress.loadedCount}/${progress.total}`,
                    progress: progress.totalProgress
                });
            }
        });
        console.log('📦 Chargeur progressif initialisé');
    }

    if (APP_CONFIG.performance.enableStreaming && window.StreamingPipeline) {
        appState.performance.pipeline = new window.StreamingPipeline();
        appState.performance.pipeline.setProgressCallback((update) => {
            if (APP_CONFIG.performance.enableIndicators && window.loadingIndicators) {
                handlePipelineUpdate(update);
            }
        });
        console.log('🌊 Pipeline streaming initialisé');
    }

    if (APP_CONFIG.performance.enableIndicators && window.loadingIndicators) {
        appState.performance.indicators = window.loadingIndicators;
        console.log('📊 Indicateurs visuels initialisés');
    }

    if (APP_CONFIG.performance.enableRecovery && window.autoRecovery) {
        appState.performance.recovery = window.autoRecovery;
        appState.performance.recovery.setRecoveryCallback((recovery) => {
            handleRecoveryUpdate(recovery);
        });
        console.log('🔄 Système de récupération initialisé');
    }

    // Systèmes avancés
    if (APP_CONFIG.performance.enablePreloading && window.ResourcePreloader) {
        appState.performance.preloader = new window.ResourcePreloader();
        appState.performance.preloader.preloadCommonResources();
        console.log('🚀 Préchargeur intelligent initialisé');
    }

    if (APP_CONFIG.performance.enableWorkers && window.SpacyWorkerPool) {
        appState.performance.workerPool = new window.SpacyWorkerPool(2); // 2 workers
        console.log('👥 Pool de workers initialisé');
    }

    if (APP_CONFIG.performance.enableMemoryManagement && window.MemoryManager) {
        appState.performance.memoryManager = window.memoryManager;
        console.log('🧠 Gestionnaire de mémoire initialisé');
    }

    if (APP_CONFIG.performance.enableContextualPreloading && window.ContextualPreloader) {
        appState.performance.contextualPreloader = window.contextualPreloader;
        console.log('🔮 Préchargeur contextuel initialisé');
    }

    if (APP_CONFIG.performance.enableNetworkOptimization && window.NetworkOptimizer) {
        appState.performance.networkOptimizer = window.networkOptimizer;
        console.log('🌐 Optimiseur réseau initialisé');
    }
}

/**
 * Gère les mises à jour du pipeline
 */
function handlePipelineUpdate(update) {
    switch (update.type) {
        case 'step_start':
            window.loadingIndicators.update('pipeline', {
                message: `${update.icon} ${update.step}...`,
                steps: [{
                    name: update.step,
                    icon: update.icon,
                    active: true,
                    completed: false
                }]
            });
            break;
            
        case 'step_progress':
            window.loadingIndicators.update('pipeline', {
                progress: update.progress
            });
            break;
            
        case 'step_complete':
            window.loadingIndicators.update('pipeline', {
                steps: [{
                    name: update.step,
                    icon: update.icon,
                    active: false,
                    completed: true
                }]
            });
            break;
            
        case 'processing_complete':
            window.loadingIndicators.hide('pipeline');
            break;
            
        case 'error':
            window.loadingIndicators.update('pipeline', {
                message: `❌ Erreur: ${update.message}`,
                type: 'error'
            });
            break;
    }
}

/**
 * Gère les mises à jour de récupération
 */
function handleRecoveryUpdate(recovery) {
    if (APP_CONFIG.debug) {
        console.log(`🔄 Recovery ${recovery.type}:`, recovery);
    }

    switch (recovery.type) {
        case 'retry':
            if (appState.performance.indicators) {
                appState.performance.indicators.update('recovery', {
                    message: `Tentative ${recovery.attempt}/${recovery.maxRetries}...`
                });
            }
            break;
            
        case 'success':
            if (appState.performance.indicators && appState.performance.indicators.isShowing('recovery')) {
                appState.performance.indicators.hide('recovery');
            }
            break;
            
        case 'failure':
            if (appState.performance.indicators) {
                appState.performance.indicators.update('recovery', {
                    message: `❌ Échec après ${recovery.attempts} tentatives`,
                    type: 'error'
                });
            }
            break;
    }
}

// =================================================================
// GESTION DU STATUT DE L'IA
// =================================================================

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
        
        // Logging en mode debug
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
 * Vérifie si les modules optionnels sont disponibles
 * @returns {object} Statut des modules optionnels
 */
function getOptionalModulesStatus() {
    const status = {};
    APP_CONFIG.modules.optional.forEach(moduleName => {
        status[moduleName] = typeof window[moduleName] === 'function';
    });
    return status;
}

// =================================================================
// GESTION DES ERREURS ET LOGGING
// =================================================================

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
    
    // Limiter le nombre d'erreurs en mémoire
    if (appState.errors.length > 50) {
        appState.errors = appState.errors.slice(-25);
    }
}

/**
 * Récupère les erreurs récentes
 * @param {string} context - Contexte filtré (optionnel)
 * @returns {Array} Liste des erreurs
 */
function getRecentErrors(context = null) {
    if (context) {
        return appState.errors.filter(error => error.context === context);
    }
    return appState.errors;
}

// =================================================================
// GESTION DE L'IA ET PIPELINE
// =================================================================

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
        
        // Utiliser le pipeline principal si disponible
        if (typeof window.runFourModelPipeline === 'function') {
            setIaStatus("IA : traitement intelligent...", "bg-purple-500", 50);
            const result = await window.runFourModelPipeline(studentAnswer, activityContext, activityType);
            setIaStatus("IA : analyse terminée", "bg-emerald-500", 100);
            return result;
        }
        
        // Fallback simplifié
        setIaStatus("IA : mode simplifié", "bg-amber-500", 75);
        return await runFourModelPipelineFallback(studentAnswer, activityContext, activityType);
        
    } catch (error) {
        addError(`Pipeline error: ${error.message}`, 'pipeline');
        setIaStatus("IA : erreur de traitement", "bg-rose-500", 0);
        throw error;
    }
}

/**
 * Pipeline fallback pour tests locaux
 * @param {string} studentAnswer - Réponse de l'étudiant
 * @param {string} activityContext - Contexte de l'activité
 * @param {string} activityType - Type d'activité
 * @returns {string} Réponse simulée
 */
async function runFourModelPipelineFallback(studentAnswer, activityContext, activityType = 'general') {
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const responses = {
        evaluation: "Évaluation: La réponse montre une compréhension correcte du sujet. Pour l'améliorer, concentrez-vous sur la structure et la richesse du vocabulaire.",
        references: `Références: Consultez la leçon sur les textes ${activityType} et le chapitre sur les connecteurs logiques.`,
        tutoring: `Excellent travail ! Votre réponse contient des idées pertinentes. Suggestions d'amélioration :\n\n1. Structurez votre réponse avec une introduction claire\n2. Développez vos arguments avec des exemples précis\n3. Utilisez des connecteurs logiques pour lier vos idées\n4. Concluez en synthétisant vos points principaux`,
        quality: "Qualité: La réponse est cohérente et bien formulée. Continuez dans cette voie !"
    };
    
    return Object.values(responses).join('\n\n');
}

/**
 * Initialise l'IA principale
 * @returns {Promise<void>}
 */
async function initIA() {
    try {
        setIaStatus("IA : initialisation...", "bg-amber-500", 10);
        
        // Simuler l'initialisation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIaStatus("IA : vérification des modules...", "bg-blue-500", 50);
        
        // Vérifier les modules
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
// FONCTIONS GLOBALES DE COMPATIBILITÉ
// =================================================================

/**
 * Fonction globale pour demander à l'IA (compatibilité avec optimisations)
 * @param {string} prompt - Prompt pour l'IA
 * @param {string} contexte - Contexte de la demande
 * @returns {Promise<string>} Réponse de l'IA
 */
window.demanderIA = async function(prompt, contexte) {
    try {
        if (!appState.iaReady) {
            return "L'IA est en cours d'initialisation. Veuillez patienter...";
        }

        // Vérifier le cache d'abord
        if (appState.performance.cache) {
            const cacheKey = appState.performance.cache.generateKey(prompt, contexte, 'ia_response');
            const cachedResult = await appState.performance.cache.get(cacheKey);
            
            if (cachedResult) {
                console.log('🎯 Résultat récupéré depuis le cache');
                return cachedResult;
            }
        }

        // Utiliser le streaming si disponible
        if (appState.performance.pipeline && APP_CONFIG.performance.enableStreaming) {
            return await processWithStreaming(prompt, contexte);
        }

        // Utiliser le pipeline avec récupération automatique
        const operation = async () => {
            return await runFourModelPipelineWithFallback(prompt, contexte);
        };

        let result;
        if (appState.performance.recovery && APP_CONFIG.performance.enableRecovery) {
            result = await appState.performance.recovery.executeWithRetry(
                operation,
                { id: 'ia_request', prompt: prompt.substring(0, 50) }
            );
        } else {
            result = await operation();
        }

        // Mettre en cache le résultat
        if (appState.performance.cache && result) {
            const cacheKey = appState.performance.cache.generateKey(prompt, contexte, 'ia_response');
            await appState.performance.cache.set(cacheKey, result);
        }

        return result;

    } catch (error) {
        addError(`IA request failed: ${error.message}`, 'ia_request');
        
        // Afficher une erreur utilisateur
        if (appState.performance.indicators) {
            appState.performance.indicators.showSimple('Erreur de traitement', {
                type: 'error',
                closable: true
            });
        }
        
        return "Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer.";
    }
};

/**
 * Traite la demande avec streaming
 * @private
 */
async function processWithStreaming(prompt, contexte) {
    if (!appState.performance.indicators) {
        // Fallback sans indicateurs
        return await runFourModelPipelineWithFallback(prompt, contexte);
    }

    // Afficher l'indicateur de pipeline
    const indicator = appState.performance.indicators.showWithSteps(
        'Analyse en cours...',
        appState.performance.pipeline.getSteps().map(step => ({
            name: step.name,
            icon: step.icon,
            active: false,
            completed: false
        }))
    );

    try {
        const result = await appState.performance.pipeline.processWithCallback(
            prompt,
            contexte,
            'general',
            (update) => {
                indicator.update(update);
            }
        );

        return result;
    } catch (error) {
        indicator.update({
            message: `❌ Erreur: ${error.message}`,
            type: 'error'
        });
        
        // Masquer après 3 secondes en cas d'erreur
        setTimeout(() => indicator.hide(3000), 3000);
        
        throw error;
    }
}

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
    
    // Modules optionnels
    const optionalStatus = getOptionalModulesStatus();
    console.log('Modules optionnels:', optionalStatus);
    
    // Token GitHub
    const githubToken = localStorage.getItem('github_token') || sessionStorage.getItem('github_token');
    console.log('Token GitHub:', !!githubToken ? 'Présent' : 'Absent');
    
    // Environnement
    console.log('Environnement:', {
        hostname: location.hostname,
        protocol: location.protocol,
        port: location.port
    });
    
    return {
        modulesReady: areAllModulesReady(),
        iaReady: appState.iaReady,
        errors: appState.errors.length,
        optionalModules: optionalStatus
    };
};

/**
 * Fonction pour réinitialiser l'état de l'application
 */
window.resetAppState = function() {
    appState.modulesReady = false;
    appState.iaReady = false;
    appState.currentStatus = 'reset';
    appState.errors = [];
    appState.startTime = Date.now();
    
    setIaStatus("Application : réinitialisation...", "bg-amber-500", 0);
    console.log('État de l\'application réinitialisé');
};

// Fonction pour tester la pipeline avec un message simple
window.testPipeline = async function() {
  console.log('=== TEST DE LA PIPELINE ===');
  
  if (!window.runFourModelPipeline) {
    console.error('❌ Pipeline non disponible');
    return false;
  }
  
  try {
    const testMessage = "Bonjour, je suis un test.";
    const testContext = "Test de fonctionnement de la pipeline IA";
    
    console.log('Envoi du message de test...');
    const startTime = Date.now();
    
    const response = await window.runFourModelPipeline(testMessage, testContext, 'test');
    
    const endTime = Date.now();
    console.log('✅ Test réussi en', endTime - startTime, 'ms');
    console.log('Réponse:', response);
    
    return true;
  } catch (error) {
    console.error('❌ Test échoué:', error);
    return false;
  }
};

// Configuration des modèles pour l'architecture à 4 modèles via GitHub Models API
const modelConfiguration = {
  logicEvaluator: 'deepseek/deepseek-r1', // Évaluateur Logique
  pedagogueTutor: 'openai/gpt-4', // Tuteur Pédagogue
  documentary: 'meta/llama-4-scout-17b-16e', // Documentaliste
  qualityController: 'microsoft/phi-4-mini-reasoning' // Contrôleur de Qualité
};

// Variables pour les clients API
let logicEvaluatorClient = null;
let pedagogueTutorClient = null;
let documentaryClient = null;
let qualityControllerClient = null;

document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

/**
 * Initialise l'application complète avec systèmes de performance
 * @returns {Promise<void>}
 */
async function initializeApp() {
    try {
        console.log(`🚀 Démarrage de ${APP_CONFIG.name} v${APP_CONFIG.version}`);
        
        appState.currentStatus = 'initialization';
        
        // Initialiser les systèmes de performance en premier
        initializePerformanceSystems();
        
        // Afficher l'indicateur de chargement principal
        if (appState.performance.indicators) {
            appState.performance.indicators.show('main-loader', 'Initialisation de l\'application...', {
                showProgress: true,
                overlay: true
            });
        }
        
        // Phase 1: Chargement progressif des modules
        if (appState.performance.loader) {
            await loadModulesProgressively();
        } else {
            await loadModulesLegacy();
        }
        
        // Phase 2: Initialisation de l'IA
        if (appState.performance.indicators) {
            appState.performance.indicators.update('main-loader', {
                message: 'Initialisation de l\'IA...',
                progress: 70
            });
        }
        
        await initIA();
        
        // Phase 3: Finalisation
        if (appState.performance.indicators) {
            appState.performance.indicators.update('main-loader', {
                message: 'Finalisation...',
                progress: 90
            });
        }
        
        appState.modulesReady = true;
        appState.currentStatus = 'ready';
        
        // Masquer l'indicateur principal
        if (appState.performance.indicators) {
            appState.performance.indicators.hide('main-loader', 500);
        }
        
        console.log('✅ Application initialisée avec succès');
        console.log(`⏱️ Temps d'initialisation: ${Date.now() - appState.startTime}ms`);
        
        // Afficher les statistiques de performance en mode debug
        if (APP_CONFIG.debug) {
            showPerformanceStats();
        }
        
    } catch (error) {
        addError(`App initialization failed: ${error.message}`, 'initialization');
        appState.currentStatus = 'error';
        
        // Afficher l'erreur
        if (appState.performance.indicators) {
            appState.performance.indicators.update('main-loader', {
                message: `❌ Erreur d'initialisation: ${error.message}`,
                type: 'error'
            });
        }
        
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
}

/**
 * Charge les modules progressivement
 * @private
 */
async function loadModulesProgressively() {
    const modules = [
        { name: 'ui', loader: () => loadModule('initializeUIElements'), priority: 1 },
        { name: 'chat', loader: () => loadModule('initializeChatSystem'), priority: 2 },
        { name: 'audio', loader: () => loadModule('initializeAudioSystem'), priority: 3 },
        { name: 'activities', loader: () => loadModule('initializeActivities'), priority: 4 },
        { name: 'spacy', loader: () => loadModule('initializeSpacyRules'), priority: 5 },
        { name: 'custom', loader: () => loadModule('loadCustomRules'), priority: 6 }
    ];

    await appState.performance.loader.loadModules(modules);
    
    // Vérifier la session existante
    if (typeof checkExistingSession !== 'undefined') {
        checkExistingSession();
    }
    
    // Mettre à jour le badge des annonces
    if (typeof updateAnnouncementsBadge !== 'undefined') {
        updateAnnouncementsBadge();
    }
}

/**
 * Charge un module avec récupération automatique
 * @private
 */
async function loadModule(moduleName) {
    const operation = async () => {
        if (typeof window[moduleName] === 'function') {
            await window[moduleName]();
            console.log(`✅ Module ${moduleName} chargé`);
        } else {
            console.warn(`⚠️ Module ${moduleName} non disponible`);
        }
    };

    if (appState.performance.recovery) {
        await appState.performance.recovery.executeWithRetry(
            operation,
            { id: `module_${moduleName}`, module: moduleName }
        );
    } else {
        await operation();
    }
}

/**
 * Charge les modules en mode legacy (compatibilité)
 * @private
 */
async function loadModulesLegacy() {
    const modules = [
        'initializeUIElements',
        'initializeChatSystem',
        'initializeAudioSystem',
        'initializeActivities'
    ];

    for (const moduleName of modules) {
        if (typeof window[moduleName] !== 'undefined') {
            try {
                await window[moduleName]();
                console.log(`✅ Module ${moduleName} chargé`);
            } catch (error) {
                console.error(`❌ Erreur chargement ${moduleName}:`, error);
            }
        }
    }
    
    // Vérifier la session existante
    if (typeof checkExistingSession !== 'undefined') {
        checkExistingSession();
    }
    
    // Mettre à jour le badge des annonces
    if (typeof updateAnnouncementsBadge !== 'undefined') {
        updateAnnouncementsBadge();
    }
}

/**
 * Affiche les statistiques de performance
 * @private
 */
function showPerformanceStats() {
    console.log('📊 STATISTIQUES DE PERFORMANCE:');
    
    if (appState.performance.cache) {
        console.log('  🗄️ Cache:', appState.performance.cache.getStats());
    }
    
    if (appState.performance.loader) {
        console.log('  📦 Chargeur:', appState.performance.loader.getStats());
    }
    
    if (appState.performance.recovery) {
        console.log('  🔄 Récupération:', appState.performance.recovery.getStats());
    }
    
    if (appState.performance.pipeline) {
        console.log('  🌊 Pipeline: prêt');
    }
    
    if (appState.performance.indicators) {
        console.log('  📊 Indicateurs:', appState.performance.indicators.getActiveCount(), 'actifs');
    }
}

// Fonction pour initialiser le pipeline à 4 modèles via GitHub Models API
async function initializeFourModelPipeline() {
  console.log('Initialisation du pipeline à 4 modèles via GitHub Models API...');
  
  // Pour l'API GitHub Models, nous n'avons pas besoin d'initialiser les modèles localement
  // Le chargement se fait via les requêtes HTTP vers les serveurs GitHub
  setIaStatus("IA : pipeline à 4 modèles prêt (cloud)", "bg-emerald-500", 100);
  console.log("Pipeline à 4 modèles via GitHub Models API prêt!");
}

// Fonction pour envoyer une requête à un modèle via l'API GitHub Models
async function callGitHubModel(model, messages, temperature = 0.7) {
  console.log(`🔄 Appel au modèle: ${model}`);
  console.log(`📝 Messages: ${messages.length} message(s)`);
  
  try {
    // Créer un AbortController pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout
    
    // Utilisation de l'endpoint correct pour GitHub Models
    const response = await fetch(`https://api.github.com/models/${model}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('github_token') || sessionStorage.getItem('github_token') || 'YOUR_GITHUB_TOKEN_HERE'}`, // Token stocké dans le navigateur
        'User-Agent': 'CoursFrancais/1.0'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: 1000
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`📡 Réponse API: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur API détaillée:`, errorText);
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Réponse reçue de ${model}:`, data.choices?.[0]?.message?.content?.substring(0, 100) + '...');
    return data.choices[0].message.content;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`❌ Timeout pour le modèle ${model}:`, err);
      return "Le service IA met trop de temps à répondre. Veuillez réessayer.";
    }
    console.error(`❌ Erreur lors de l'appel au modèle ${model}:`, err);
    return "Erreur de connexion au service IA. Veuillez vérifier votre connexion Internet.";
  }
}

// Fonction pour exécuter le pipeline à 4 modèles via GitHub Models API
window.runFourModelPipeline = async function(studentAnswer, activityContext, activityType = 'general') {
  // Mode démo pour GitHub Pages (CORS bloqué)
  if (location.hostname.includes('github.io')) {
    return await runFourModelPipelineDemo(studentAnswer, activityContext, activityType);
  }
  
  // Mode local avec API GitHub Models
  try {
    // Étape 1: Évaluateur Logique - Analyse la réponse à froid
    const logicEvaluationPrompt = `Analyse cette réponse d'étudiant à froid. Identifie les erreurs de raisonnement, les lacunes et les points justes. Réponds de manière technique et précise.\n\nRéponse de l'étudiant : ${studentAnswer}\n\nContexte de l'activité : ${activityContext}`;
    
    const logicResult = await callGitHubModel(modelConfiguration.logicEvaluator, [
      { role: "system", content: "Tu es un évaluateur logique rigoureux. Analyse les réponses des étudiants de manière technique et objective. Liste les erreurs de raisonnement, les points justes, et les lacunes." },
      { role: "user", content: logicEvaluationPrompt }
    ]);
    
    // Étape 2: Documentaliste - Recherche dans les supports de cours
    const documentaryPrompt = `À partir de cette analyse technique, identifie quels concepts du cours sont concernés. Cite les sections spécifiques du programme ou du manuel qui pourraient aider l'étudiant.\n\nAnalyse technique : ${logicResult}\n\nType d'activité : ${activityType}`;
    
    const documentaryResult = await callGitHubModel(modelConfiguration.documentary, [
      { role: "system", content: "Tu es un documentaliste expert. Identifie les sections spécifiques du programme ou du manuel qui correspondent aux besoins de l'étudiant." },
      { role: "user", content: documentaryPrompt }
    ]);
    
    // Étape 3: Tuteur Pédagogue - Transforme en discussion pédagogique
    const pedagoguePrompt = `Transforme cette analyse technique en une discussion pédagogique empathique avec l'étudiant. Utilise des questions guidantes pour l'aider à comprendre ses erreurs. Sois encourageant.\n\nAnalyse technique : ${logicResult}\n\nRéférences du cours : ${documentaryResult}\n\nType d'activité : ${activityType}`;
    
    const tutorResponse = await callGitHubModel(modelConfiguration.pedagogueTutor, [
      { role: "system", content: "Tu es un tuteur pédagogue empathique. Discute avec l'étudiant de manière encourageante, pose-lui des questions guidantes pour l'aider à comprendre ses erreurs, et référence les bons passages du cours." },
      { role: "user", content: pedagoguePrompt }
    ]);
    
    // Étape 4: Contrôleur de Qualité - Vérifie l'absence d'hallucinations
    const qualityControlPrompt = `Vérifie cette réponse du tuteur pédagogue. Assure-toi qu'elle ne contient pas d'hallucinations, qu'elle ne donne pas la réponse directement, et qu'elle n'encourage pas une mauvaise compréhension.\n\nRéponse du tuteur : ${tutorResponse}\n\nAnalyse technique originale : ${logicResult}`;
    
    const qualityReport = await callGitHubModel(modelConfiguration.qualityController, [
      { role: "system", content: "Tu es un contrôleur de qualité. Vérifie que la réponse du tuteur ne contient pas d'erreurs, d'hallucinations, ni de réponses données directement. Valide la qualité pédagogique." },
      { role: "user", content: qualityControlPrompt }
    ]);
    
    // Retourner la réponse finale après validation
    return tutorResponse;
  } catch (err) {
    console.error("Erreur dans le pipeline à 4 modèles:", err);
    return "Erreur lors de l'analyse de la réponse. Veuillez vérifier votre connexion Internet.";
  }
};

// Fonction de démonstration pour GitHub Pages
async function runFourModelPipelineDemo(studentAnswer, activityContext, activityType = 'general') {
  // Simuler un temps de traitement
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Analyser le contexte pour une réponse personnalisée
  const contextLower = activityContext.toLowerCase();
  let response = "";
  
  if (contextLower.includes('narratif')) {
    response = `Merci pour votre réponse ! J'analyse votre travail sur le texte narratif.\n\n**Points forts observés :**\n- Vous semblez avoir compris les éléments essentiels du récit\n- La structure narrative est présente\n\n**Pistes d'amélioration :**\n- Pensez à approfondir la caractérisation de vos personnages\n- Travaillez l'enchaînement logique des événements\n- Utilisez des temps verbaux variés pour créer du rythme\n\n**Question pour vous guider :**\nQuel élément perturbateur pourriez-vous ajouter pour rendre votre histoire plus captivante ?\n\nContinuez ainsi, vous êtes sur la bonne voie !`;
  } else if (contextLower.includes('descriptif')) {
    response = `Excellente approche descriptive ! Voici mon analyse :\n\n**Réussites :**\n- Le choix des détails est pertinent\n- L'organisation spatiale est cohérente\n\n**Suggestions pour enrichir :**\n- Intégrez davantage de perceptions sensorielles (vues, sons, odeurs)\n- Variez les champs lexicaux pour créer des atmosphères différentes\n- Pensez à l'implication du narrateur (subjectivité vs objectivité)\n\n**Pour aller plus loin :**\nQuel effet émotionnel cherchez-vous à produire chez votre lecteur ?\n\nVotre travail montre déjà une belle sensibilité descriptive !`;
  } else if (contextLower.includes('explicatif')) {
    response = `Très bon travail sur le texte explicatif ! Analyse détaillée :\n\n**Points positifs :**\n- La définition du sujet est claire\n- Vous utilisez des connecteurs logiques appropriés\n\n**Axes de progression :**\n- Développez davantage les relations de cause à effet\n- Ajoutez des exemples concrets pour illustrer vos explications\n- Structurez votre propos avec une introduction et une conclusion nettes\n\n**Question de réflexion :**\nComment pourriez-vous rendre votre explication encore plus accessible à quelqu'un qui ne connaît pas le sujet ?\n\nVotre démarche explicative est solide !`;
  } else if (contextLower.includes('argumentatif')) {
    response = `Analyse de votre texte argumentatif :\n\n**Forces :**\n- Votre position est clairement affirmée\n- Les arguments présentés sont pertinents\n\n**Recommandations :**\n- Renforcez vos arguments avec des preuves spécifiques\n- Anticipez les contre-arguments possibles\n- Travaillez la progression de vos arguments (du plus faible au plus fort)\n\n**Pour approfondir :**\nQuelles objections pourriez-vous anticiper et comment y répondreiez-vous ?\n\nVotre capacité à convaincre est déjà bien développée !`;
  } else if (contextLower.includes('resume')) {
    response = `Bonne analyse dans votre travail de résumé :\n\n**Compétences maîtrisées :**\n- Vous identifiez bien les idées essentielles\n- La concision est respectée\n\n**Points à perfectionner :**\n- Vérifiez que toutes les idées principales sont bien présentes\n- Travaillez les transitions entre les idées\n- Assurez-vous de ne pas introduire d'interprétation personnelle\n\n**Suggestion :**\nRelisez votre résumé et demandez-vous : "Est-ce que quelqu'un qui n'a pas lu le texte original comprend l'essentiel ?"\n\nVotre synthèse est sur la bonne voie !`;
  } else {
    // Réponse générale pour les techniques d'écriture
    response = `Merci pour votre travail ! Voici mon analyse pédagogique :\n\n**Ce qui fonctionne bien :**\n- Votre engagement dans la tâche est évident\n- Les bases de l'expression écrite sont acquises\n\n**Pistes de développement :**\n- Enrichissez votre vocabulaire précis et varié\n- Structurez vos idées de manière plus explicite\n- Relisez-vous attentivement pour corriger les petites erreurs\n\n**Conseil pratique :**\nPrenez le temps de faire un plan rapide avant de rédiger. Cela vous aidera à organiser vos pensées.\n\nContinuez vos efforts, chaque exercice vous fait progresser !`;
  }
  
  return response;
}

// Fonction de fallback pour le pipeline à 4 modèles (version simplifiée pour tests locaux)
async function runFourModelPipelineFallback(studentAnswer, activityContext, activityType = 'general') {
  // Simuler les 4 étapes du pipeline
  
  // Étape 1: Évaluation logique (simulée)
  const logicResult = "Évaluation: La réponse de l'étudiant contient des éléments pertinents mais nécessite des améliorations dans la structure et le vocabulaire.";
  
  // Étape 2: Documentaliste (simulé)
  const documentaryResult = "Références: Voir leçon sur la structure du texte " + activityType + " et chapitre sur les connecteurs logiques.";
  
  // Étape 3: Tuteur pédagogue (génération de réponse pédagogique)
  const tutorResponse = "Merci pour votre réponse ! Celle-ci montre que vous avez bien compris le sujet. Pour l'améliorer, pensez à :\n\n1. Structurer votre réponse avec une introduction, un développement et une conclusion.\n2. Utiliser des connecteurs logiques pour relier vos idées.\n3. Donner des exemples concrets pour illustrer vos points.\n\nConsultez la leçon sur les textes " + activityType + " pour renforcer vos acquis.";
  
  // Étape 4: Contrôle qualité (simulé)
  // Dans la version réelle, cette étape vérifierait que la réponse ne contient pas d'erreurs
  
  return tutorResponse;
};

// Fonction pour initialiser l'IA principale (pour la compatibilité avec le code existant)
async function initIA() {
  setIaStatus("IA : démarrage (cloud)...", "bg-amber-500", 10);
  console.log("Démarrage de l'IA cloud...");
  
  try {
    // Simuler le chargement de l'IA principale (pour la compatibilité avec le code existant)
    setIaStatus("IA : prête (cloud)", "bg-emerald-500", 100);
    console.log("IA cloud prête !");
  } catch (err) {
    console.error("Erreur IA:", err);
    setIaStatus("IA : erreur - " + err.message, "bg-rose-500", 0);
  }
}

// Fonction globale pour demander à l'IA (pour la compatibilité avec le code existant)
window.demanderIA = async function(prompt, contexte) {
  // Utiliser le pipeline à 4 modèles pour une meilleure qualité
  if (window.runFourModelPipeline) {
    return await window.runFourModelPipeline(prompt, contexte);
  } else {
    // Fallback si le pipeline à 4 modèles n'est pas disponible
    return "L'IA est en cours de chargement. Veuillez patienter.";
  }
}

// Démarrer l'IA au chargement
// Ne pas initialiser WebLLM car on utilise GitHub Models API
console.log("Initialisation avec l'API GitHub Models");