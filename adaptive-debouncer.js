/**
 * =================================================================
 * DÉBOUNCING ADAPTATIF
 * Délai intelligent selon le contexte de l'utilisateur
 * =================================================================
 */

'use strict';

class AdaptiveDebouncer {
    constructor() {
        this.timeouts = new Map();
        this.contexts = {
            'typing': 300,      // Pendant la frappe active
            'pause': 800,      // Pause courte entre les frappes
            'thinking': 2000,  // L'utilisateur réfléchit
            'idle': 5000       // Inactivité prolongée
        };
        this.currentContext = 'typing';
        this.lastActivity = Date.now();
        this.activityHistory = [];
        this.maxHistorySize = 20;
        this.contextChangeCallback = null;
    }

    /**
     * Définit le callback de changement de contexte
     * @param {Function} callback - Fonction de callback
     */
    setContextChangeCallback(callback) {
        this.contextChangeCallback = callback;
    }

    /**
     * Applique un debounce adaptatif
     * @param {string} key - Clé unique pour le debounce
     * @param {Function} func - Fonction à exécuter
     * @param {number} customDelay - Délai personnalisé (optionnel)
     * @returns {void}
     */
    debounce(key, func, customDelay = null) {
        // Adapter le délai selon le contexte
        const delay = customDelay || this.contexts[this.currentContext];
        
        // Annuler le timeout précédent
        clearTimeout(this.timeouts.get(key));
        
        // Créer le nouveau timeout
        const timeoutId = setTimeout(() => {
            func();
            this.timeouts.delete(key);
        }, delay);
        
        this.timeouts.set(key, timeoutId);
        this.updateContext();
        this.recordActivity();
    }

    /**
     * Enregistre une activité
     * @private
     */
    recordActivity() {
        const now = Date.now();
        this.activityHistory.push(now);
        
        // Limiter la taille de l'historique
        if (this.activityHistory.length > this.maxHistorySize) {
            this.activityHistory.shift();
        }
        
        this.lastActivity = now;
    }

    /**
     * Met à jour le contexte selon l'activité récente
     * @private
     */
    updateContext() {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;
        
        const oldContext = this.currentContext;
        
        // Déterminer le nouveau contexte
        if (timeSinceLastActivity < 500) {
            this.currentContext = 'typing';
        } else if (timeSinceLastActivity < 2000) {
            this.currentContext = 'pause';
        } else if (timeSinceLastActivity < 8000) {
            this.currentContext = 'thinking';
        } else {
            this.currentContext = 'idle';
        }
        
        // Notifier le changement de contexte
        if (oldContext !== this.currentContext && this.contextChangeCallback) {
            this.contextChangeCallback({
                oldContext,
                newContext: this.currentContext,
                delay: this.contexts[this.currentContext],
                timeSinceLastActivity
            });
        }
    }

    /**
     * Analyse le pattern de frappe pour une optimisation plus fine
     * @param {number} typingSpeed - Vitesse de frappe (caractères/seconde)
     * @returns {number} Délai ajusté
     */
    adjustDelayForTypingSpeed(typingSpeed) {
        let adjustment = 0;
        
        if (typingSpeed > 60) { // Frappe très rapide
            adjustment = -100;
        } else if (typingSpeed > 40) { // Frappe rapide
            adjustment = -50;
        } else if (typingSpeed < 20) { // Frappe lente
            adjustment = 100;
        } else if (typingSpeed < 10) { // Frappe très lente
            adjustment = 200;
        }
        
        const baseDelay = this.contexts[this.currentContext];
        return Math.max(100, baseDelay + adjustment);
    }

    /**
     * Débounce avec délai adaptatif selon la vitesse de frappe
     * @param {string} key - Clé unique
     * @param {Function} func - Fonction à exécuter
     * @param {number} typingSpeed - Vitesse de frappe
     * @returns {void}
     */
    debounceWithTypingSpeed(key, func, typingSpeed) {
        const delay = this.adjustDelayForTypingSpeed(typingSpeed);
        
        clearTimeout(this.timeouts.get(key));
        
        const timeoutId = setTimeout(() => {
            func();
            this.timeouts.delete(key);
        }, delay);
        
        this.timeouts.set(key, timeoutId);
        this.updateContext();
        this.recordActivity();
    }

    /**
     * Annule un debounce spécifique
     * @param {string} key - Clé du debounce à annuler
     * @returns {boolean} True si annulé
     */
    cancel(key) {
        const timeoutId = this.timeouts.get(key);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeouts.delete(key);
            return true;
        }
        return false;
    }

    /**
     * Annule tous les debounces
     */
    cancelAll() {
        for (const timeoutId of this.timeouts.values()) {
            clearTimeout(timeoutId);
        }
        this.timeouts.clear();
    }

    /**
     * Vérifie si un debounce est en cours
     * @param {string} key - Clé à vérifier
     * @returns {boolean} True si en cours
     */
    isPending(key) {
        return this.timeouts.has(key);
    }

    /**
     * Récupère le nombre de debounces en cours
     * @returns {number} Nombre de debounces actifs
     */
    getPendingCount() {
        return this.timeouts.size;
    }

    /**
     * Récupère le contexte actuel
     * @returns {string} Contexte actuel
     */
    getCurrentContext() {
        return this.currentContext;
    }

    /**
     * Récupère les délais pour chaque contexte
     * @returns {Object} Délais par contexte
     */
    getContextDelays() {
        return { ...this.contexts };
    }

    /**
     * Personnalise les délais de contexte
     * @param {Object} newDelays - Nouveaux délais
     */
    setContextDelays(newDelays) {
        this.contexts = { ...this.contexts, ...newDelays };
    }

    /**
     * Analyse les patterns d'activité
     * @returns {Object} Analyse des patterns
     */
    analyzeActivityPatterns() {
        if (this.activityHistory.length < 2) {
            return { message: 'Pas assez de données pour analyser' };
        }

        const intervals = [];
        for (let i = 1; i < this.activityHistory.length; i++) {
            intervals.push(this.activityHistory[i] - this.activityHistory[i - 1]);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const minInterval = Math.min(...intervals);
        const maxInterval = Math.max(...intervals);

        // Déterminer le pattern dominant
        const patterns = {
            'typing': intervals.filter(i => i < 1000).length,
            'pause': intervals.filter(i => i >= 1000 && i < 3000).length,
            'thinking': intervals.filter(i => i >= 3000 && i < 10000).length,
            'idle': intervals.filter(i => i >= 10000).length
        };

        const dominantPattern = Object.keys(patterns).reduce((a, b) => 
            patterns[a] > patterns[b] ? a : b
        );

        return {
            avgInterval,
            minInterval,
            maxInterval,
            dominantPattern,
            patterns,
            totalActivities: this.activityHistory.length
        };
    }

    /**
     * Réinitialise l'état du debouncer
     */
    reset() {
        this.cancelAll();
        this.activityHistory = [];
        this.currentContext = 'typing';
        this.lastActivity = Date.now();
    }

    /**
     * Exporte l'état pour debugging
     * @returns {Object} État actuel
     */
    exportState() {
        return {
            currentContext: this.currentContext,
            pendingCount: this.getPendingCount(),
            lastActivity: this.lastActivity,
            activityHistorySize: this.activityHistory.length,
            contextDelays: this.contexts,
            patterns: this.analyzeActivityPatterns()
        };
    }
}

// Export global
window.AdaptiveDebouncer = AdaptiveDebouncer;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdaptiveDebouncer;
}
