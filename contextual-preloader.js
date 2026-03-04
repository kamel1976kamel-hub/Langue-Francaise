/**
 * =================================================================
 * PRÉDICTION ET PRÉCHARGEMENT CONTEXTUEL
 * Apprentissage des patterns utilisateur pour anticiper les besoins
 * =================================================================
 */

'use strict';

class ContextualPreloader {
    constructor() {
        this.userPatterns = new Map();
        this.contextHistory = [];
        this.preloadPredictions = new Map();
        this.learningEnabled = true;
        this.confidenceThreshold = 0.7;
        this.maxHistorySize = 200;
        this.patternMinOccurrences = 3;
        
        this.stats = {
            totalPredictions: 0,
            successfulPredictions: 0,
            accuracy: 0,
            patternsDiscovered: 0,
            lastUpdate: Date.now()
        };
        
        this.preloadCallbacks = new Map();
        this.contextTypes = [
            'grammar_analysis',
            'text_correction',
            'vocabulary_check',
            'style_analysis',
            'spell_check',
            'text_generation',
            'translation'
        ];
        
        this.startLearning();
    }

    /**
     * Démarre le processus d'apprentissage
     * @private
     */
    startLearning() {
        // Charger les patterns existants depuis le localStorage
        this.loadStoredPatterns();
        
        // Configurer le monitoring des actions utilisateur
        this.setupUserActionMonitoring();
        
        console.log('🧠 Système de prédiction contextuelle démarré');
    }

    /**
     * Configure le monitoring des actions utilisateur
     * @private
     */
    setupUserActionMonitoring() {
        // Intercepter les appels à l'IA pour apprendre les patterns
        if (window.demanderIA) {
            const originalDemanderIA = window.demanderIA;
            window.demanderIA = (prompt, context) => {
                this.recordUserAction('ia_request', { prompt, context });
                return originalDemanderIA(prompt, context);
            };
        }

        // Intercepter les analyses de texte
        if (window.applyAllRules) {
            const originalApplyAllRules = window.applyAllRules;
            window.applyAllRules = (doc, options) => {
                this.recordUserAction('text_analysis', { options });
                return originalApplyAllRules(doc, options);
            };
        }

        // Monitorer les clics sur les éléments UI
        document.addEventListener('click', (event) => {
            this.trackUIInteraction(event);
        });

        // Monitorer les changements de formulaire
        document.addEventListener('change', (event) => {
            this.trackFormInteraction(event);
        });
    }

    /**
     * Enregistre une action utilisateur
     * @param {string} action - Type d'action
     * @param {Object} context - Contexte de l'action
     */
    recordUserAction(action, context = {}) {
        if (!this.learningEnabled) return;

        const timestamp = Date.now();
        const pattern = {
            action,
            context,
            timestamp,
            sessionId: this.getSessionId(),
            userAgent: navigator.userAgent
        };

        // Ajouter à l'historique
        this.contextHistory.push(pattern);
        
        // Limiter la taille de l'historique
        if (this.contextHistory.length > this.maxHistorySize) {
            this.contextHistory.shift();
        }

        // Analyser les patterns périodiquement
        if (this.contextHistory.length % 10 === 0) {
            this.analyzePatterns();
            this.predictNextActions();
        }

        // Sauvegarder périodiquement
        if (this.contextHistory.length % 50 === 0) {
            this.savePatterns();
        }
    }

    /**
     * Track les interactions UI
     * @private
     */
    trackUIInteraction(event) {
        const element = event.target;
        const interaction = {
            type: 'click',
            elementType: element.tagName.toLowerCase(),
            className: element.className,
            id: element.id,
            textContent: element.textContent?.substring(0, 50),
            href: element.href,
            timestamp: Date.now()
        };

        this.recordUserAction('ui_interaction', interaction);
    }

    /**
     * Track les interactions formulaire
     * @private
     */
    trackFormInteraction(event) {
        const element = event.target;
        const interaction = {
            type: 'form_change',
            elementType: element.tagName.toLowerCase(),
            inputType: element.type,
            name: element.name,
            value: element.value?.substring(0, 100),
            timestamp: Date.now()
        };

        this.recordUserAction('form_interaction', interaction);
    }

    /**
     * Analyse les patterns utilisateur
     * @private
     */
    analyzePatterns() {
        const recentActions = this.contextHistory.slice(-100);
        const patterns = new Map();

        // Analyser les séquences d'actions
        for (let i = 1; i < recentActions.length; i++) {
            const prevAction = recentActions[i - 1];
            const currentAction = recentActions[i];
            
            // Créer une clé pour le pattern
            const patternKey = this.createPatternKey(prevAction, currentAction);
            
            if (!patterns.has(patternKey)) {
                patterns.set(patternKey, []);
            }
            
            patterns.get(patternKey).push({
                nextAction: currentAction.action,
                nextContext: currentAction.context,
                timeDiff: currentAction.timestamp - prevAction.timestamp,
                confidence: this.calculateConfidence(prevAction, currentAction)
            });
        }

        // Calculer les probabilités et filtrer les patterns significatifs
        for (const [key, transitions] of patterns) {
            if (transitions.length >= this.patternMinOccurrences) {
                const probabilities = this.calculateProbabilities(transitions);
                this.userPatterns.set(key, {
                    transitions,
                    probabilities,
                    frequency: transitions.length,
                    lastSeen: Math.max(...transitions.map(t => t.timeDiff))
                });
            }
        }

        this.stats.patternsDiscovered = this.userPatterns.size;
        console.log(`🧠 ${this.stats.patternsDiscovered} patterns découverts`);
    }

    /**
     * Crée une clé pour un pattern
     * @private
     */
    createPatternKey(prevAction, currentAction) {
        const prevKey = `${prevAction.action}:${this.extractContextSignature(prevAction.context)}`;
        const timeOfDay = this.getTimeOfDay(prevAction.timestamp);
        return `${prevKey}:${timeOfDay}`;
    }

    /**
     * Extrait la signature du contexte
     * @private
     */
    extractContextSignature(context) {
        if (!context || typeof context !== 'object') return 'generic';
        
        const signatures = [];
        
        if (context.prompt) {
            // Analyser le type de prompt
            if (context.prompt.includes('grammaire')) signatures.push('grammar');
            if (context.prompt.includes('orthographe')) signatures.push('spelling');
            if (context.prompt.includes('vocabulaire')) signatures.push('vocabulary');
            if (context.prompt.includes('style')) signatures.push('style');
        }
        
        if (context.options) {
            if (context.options.categories) signatures.push('categories');
            if (context.options.maxErrors) signatures.push('limited');
        }
        
        return signatures.length > 0 ? signatures.join('_') : 'generic';
    }

    /**
     * Calcule la confiance d'un pattern
     * @private
     */
    calculateConfidence(prevAction, currentAction) {
        let confidence = 0.5; // Base confidence
        
        // Augmenter la confiance si le temps est prévisible
        const timeDiff = currentAction.timestamp - prevAction.timestamp;
        if (timeDiff < 5000) confidence += 0.2; // Actions rapides
        if (timeDiff < 1000) confidence += 0.1; // Actions très rapides
        
        // Augmenter la confiance si le contexte est similaire
        if (this.contextSimilarity(prevAction.context, currentAction.context) > 0.7) {
            confidence += 0.2;
        }
        
        return Math.min(1, confidence);
    }

    /**
     * Calcule la similarité entre deux contextes
     * @private
     */
    contextSimilarity(context1, context2) {
        if (!context1 || !context2) return 0;
        
        let similarity = 0;
        let factors = 0;
        
        // Comparer les propriétés communes
        const keys = new Set([...Object.keys(context1 || {}), ...Object.keys(context2 || {})]);
        
        for (const key of keys) {
            if (context1[key] && context2[key]) {
                if (typeof context1[key] === 'string' && typeof context2[key] === 'string') {
                    // Similarité textuelle
                    const sim = this.stringSimilarity(context1[key], context2[key]);
                    similarity += sim;
                    factors++;
                } else if (context1[key] === context2[key]) {
                    similarity += 1;
                    factors++;
                }
            }
        }
        
        return factors > 0 ? similarity / factors : 0;
    }

    /**
     * Calcule la similarité entre deux chaînes
     * @private
     */
    stringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Distance de Levenshtein
     * @private
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Calcule les probabilités de transition
     * @private
     */
    calculateProbabilities(transitions) {
        const probabilities = new Map();
        const total = transitions.length;

        // Grouper par action suivante
        const grouped = new Map();
        for (const transition of transitions) {
            const nextKey = `${transition.nextAction}:${this.extractContextSignature(transition.nextContext)}`;
            
            if (!grouped.has(nextKey)) {
                grouped.set(nextKey, []);
            }
            grouped.get(nextKey).push(transition);
        }

        // Calculer les probabilités
        for (const [nextKey, group] of grouped) {
            const avgConfidence = group.reduce((sum, t) => sum + t.confidence, 0) / group.length;
            const probability = (group.length / total) * avgConfidence;
            probabilities.set(nextKey, probability);
        }

        return probabilities;
    }

    /**
     * Prédit les prochaines actions
     * @private
     */
    predictNextActions() {
        if (this.contextHistory.length === 0) return;

        const lastAction = this.contextHistory[this.contextHistory.length - 1];
        const patternKey = this.createPatternKey(lastAction, null);
        
        const patterns = this.userPatterns.get(patternKey);
        if (!patterns) return;

        // Prédire les prochaines actions les plus probables
        const predictions = Array.from(patterns.probabilities.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3); // Top 3 prédictions

        this.preloadPredictedResources(predictions);
        this.stats.totalPredictions += predictions.length;
    }

    /**
     * Précharge les ressources prédites
     * @private
     */
    preloadPredictedResources(predictions) {
        for (const [nextKey, probability] of predictions) {
            if (probability > this.confidenceThreshold) {
                const [action, context] = nextKey.split(':');
                this.preloadResourceForAction(action, context, probability);
                
                console.log(`🔮 Prédiction: ${action} (${(probability * 100).toFixed(1)}%)`);
            }
        }
    }

    /**
     * Précharge une ressource pour une action
     * @private
     */
    preloadResourceForAction(action, context, probability) {
        const resourceMap = {
            'grammar_analysis': () => this.preloadGrammarRules(),
            'text_correction': () => this.preloadCorrectionRules(),
            'vocabulary_check': () => this.preloadVocabularyRules(),
            'style_analysis': () => this.preloadStyleRules(),
            'spell_check': () => this.preloadSpellCheck(),
            'ia_request': () => this.preloadIAModels()
        };

        const preloadFn = resourceMap[action];
        if (preloadFn) {
            // Notifier le début du préchargement
            this.notifyPreloadStart(action, context, probability);
            
            // Exécuter le préchargement
            preloadFn().then(() => {
                this.notifyPreloadComplete(action, context, probability);
            }).catch(error => {
                this.notifyPreloadError(action, context, probability, error);
            });
        }
    }

    /**
     * Précharge les règles de grammaire
     * @private
     */
    async preloadGrammarRules() {
        if (window.loadAllRules) {
            return await window.loadAllRules({ categories: ['orthographe', 'conjugaison'] });
        }
        return null;
    }

    /**
     * Précharge les règles de correction
     * @private
     */
    async preloadCorrectionRules() {
        if (window.SpacyRulesLoader) {
            return await window.SpacyRulesLoader.loadAllRules();
        }
        return null;
    }

    /**
     * Précharge les règles de vocabulaire
     * @private
     */
    async preloadVocabularyRules() {
        if (window.vocabulaireRules) {
            // Les règles sont déjà chargées
            return 'already_loaded';
        }
        return null;
    }

    /**
     * Précharge les règles de style
     * @private
     */
    async preloadStyleRules() {
        if (window.styleRules) {
            return 'already_loaded';
        }
        return null;
    }

    /**
     * Précharge la vérification orthographique
     * @private
     */
    async preloadSpellCheck() {
        if (window.orthoConfusions) {
            return 'already_loaded';
        }
        return null;
    }

    /**
     * Précharge les modèles IA
     * @private
     */
    async preloadIAModels() {
        if (window.runFourModelPipeline) {
            // Préchauffer le pipeline avec une requête de test
            try {
                await window.runFourModelPipeline('test', 'test', 'test');
                return 'warmed_up';
            } catch (error) {
                return 'warmup_failed';
            }
        }
        return null;
    }

    /**
     * Notifie le début du préchargement
     * @private
     */
    notifyPreloadStart(action, context, probability) {
        const callbacks = this.preloadCallbacks.get('start') || [];
        callbacks.forEach(callback => {
            try {
                callback({ action, context, probability, timestamp: Date.now() });
            } catch (error) {
                console.error('Erreur dans le callback de préchargement:', error);
            }
        });
    }

    /**
     * Notifie la fin du préchargement
     * @private
     */
    notifyPreloadComplete(action, context, probability) {
        const callbacks = this.preloadCallbacks.get('complete') || [];
        callbacks.forEach(callback => {
            try {
                callback({ action, context, probability, timestamp: Date.now() });
            } catch (error) {
                console.error('Erreur dans le callback de préchargement:', error);
            }
        });
    }

    /**
     * Notifie une erreur de préchargement
     * @private
     */
    notifyPreloadError(action, context, probability, error) {
        const callbacks = this.preloadCallbacks.get('error') || [];
        callbacks.forEach(callback => {
            try {
                callback({ action, context, probability, error, timestamp: Date.now() });
            } catch (error) {
                console.error('Erreur dans le callback de préchargement:', error);
            }
        });
    }

    /**
     * Ajoute un callback de préchargement
     * @param {string} event - Type d'événement ('start', 'complete', 'error')
     * @param {Function} callback - Fonction de callback
     */
    onPreload(event, callback) {
        if (!this.preloadCallbacks.has(event)) {
            this.preloadCallbacks.set(event, []);
        }
        this.preloadCallbacks.get(event).push(callback);
    }

    /**
     * Obtient l'heure de la journée
     * @private
     */
    getTimeOfDay(timestamp) {
        const hour = new Date(timestamp).getHours();
        
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 22) return 'evening';
        return 'night';
    }

    /**
     * Obtient l'ID de session
     * @private
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Sauvegarde les patterns dans le localStorage
     * @private
     */
    savePatterns() {
        try {
            const data = {
                patterns: Object.fromEntries(this.userPatterns),
                stats: this.stats,
                savedAt: Date.now()
            };
            localStorage.setItem('contextual_patterns', JSON.stringify(data));
        } catch (error) {
            console.warn('Impossible de sauvegarder les patterns:', error);
        }
    }

    /**
     * Charge les patterns depuis le localStorage
     * @private
     */
    loadStoredPatterns() {
        try {
            const stored = localStorage.getItem('contextual_patterns');
            if (stored) {
                const data = JSON.parse(stored);
                this.userPatterns = new Map(Object.entries(data.patterns || {}));
                
                // Mettre à jour les stats
                if (data.stats) {
                    this.stats = { ...this.stats, ...data.stats };
                }
                
                console.log(`🧠 ${this.userPatterns.size} patterns chargés depuis le stockage`);
            }
        } catch (error) {
            console.warn('Impossible de charger les patterns stockés:', error);
        }
    }

    /**
     * Active/désactive l'apprentissage
     * @param {boolean} enabled - État de l'apprentissage
     */
    setLearningEnabled(enabled) {
        this.learningEnabled = enabled;
        console.log(`🧠 Apprentissage ${enabled ? 'activé' : 'désactivé'}`);
    }

    /**
     * Définit le seuil de confiance
     * @param {number} threshold - Seuil de confiance (0-1)
     */
    setConfidenceThreshold(threshold) {
        this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
        console.log(`🧠 Seuil de confiance défini à ${this.confidenceThreshold}`);
    }

    /**
     * Récupère les statistiques de prédiction
     * @returns {Object} Statistiques
     */
    getPredictionStats() {
        const accuracy = this.stats.totalPredictions > 0 ? 
            (this.stats.successfulPredictions / this.stats.totalPredictions * 100).toFixed(2) : 0;

        return {
            ...this.stats,
            accuracy: `${accuracy}%`,
            totalPatterns: this.userPatterns.size,
            contextHistorySize: this.contextHistory.length,
            currentPredictions: this.preloadPredictions.size,
            learningEnabled: this.learningEnabled
        };
    }

    /**
     * Exporte les patterns
     * @returns {Object} Patterns exportés
     */
    exportPatterns() {
        return {
            patterns: Object.fromEntries(this.userPatterns),
            history: this.contextHistory,
            stats: this.getPredictionStats(),
            exportedAt: Date.now()
        };
    }

    /**
     * Importe les patterns
     * @param {Object} data - Données à importer
     */
    importPatterns(data) {
        if (data.patterns) {
            this.userPatterns = new Map(Object.entries(data.patterns));
        }
        if (data.history) {
            this.contextHistory = data.history;
        }
        if (data.stats) {
            this.stats = { ...this.stats, ...data.stats };
        }
        
        console.log(`🧠 ${this.userPatterns.size} patterns importés`);
    }

    /**
     * Réinitialise le système
     */
    reset() {
        this.userPatterns.clear();
        this.contextHistory = [];
        this.preloadPredictions.clear();
        this.stats = {
            totalPredictions: 0,
            successfulPredictions: 0,
            accuracy: 0,
            patternsDiscovered: 0,
            lastUpdate: Date.now()
        };
        
        // Supprimer le stockage local
        localStorage.removeItem('contextual_patterns');
        
        console.log('🧠 Système de prédiction réinitialisé');
    }

    /**
     * Détruit le système
     */
    destroy() {
        this.savePatterns();
        this.preloadCallbacks.clear();
        console.log('🧠 Système de prédiction détruit');
    }
}

// Instance globale
window.contextualPreloader = new ContextualPreloader();

// Export global
window.ContextualPreloader = ContextualPreloader;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContextualPreloader;
}
