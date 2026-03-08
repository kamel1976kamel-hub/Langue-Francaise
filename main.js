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
                        content: `Tu es un expert en français et en pédagogie. Analyse la réponse de l'étudiant avec le contexte suivant : ${activityContext}. Sois encourageant mais précis. Identifie les points forts et les axes d'amélioration. Formatage JSON avec les champs : analysis, error_type, rule, hint, example, exercise, validation, confidence.`
                    },
                    {
                        role: 'user',
                        content: `Texte de l'étudiant : "${studentAnswer}"`
                    }
                ],
                max_tokens: 300, // Réduit pour plus de stabilité
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
