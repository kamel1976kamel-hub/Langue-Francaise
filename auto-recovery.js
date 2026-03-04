/**
 * =================================================================
 * SYSTÈME DE REPRISE AUTOMATIQUE
 * Retry exponentiel avec backoff adaptatif
 * =================================================================
 */

'use strict';

class AutoRecoverySystem {
    constructor() {
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffFactor: 2,
            jitter: true,
            jitterFactor: 0.1
        };
        
        this.criticalOperations = new Map();
        this.retryHistory = new Map();
        this.stats = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            totalRetries: 0,
            averageRetries: 0
        };
        this.recoveryCallback = null;
    }

    /**
     * Définit le callback de récupération
     * @param {Function} callback - Fonction de callback
     */
    setRecoveryCallback(callback) {
        this.recoveryCallback = callback;
    }

    /**
     * Exécute une opération avec retry automatique
     * @param {Function} operation - Opération à exécuter
     * @param {Object} context - Contexte de l'opération
     * @param {Object} customConfig - Configuration personnalisée
     * @returns {Promise} Résultat de l'opération
     */
    async executeWithRetry(operation, context = {}, customConfig = {}) {
        const config = { ...this.retryConfig, ...customConfig };
        const operationId = context.id || `op-${Date.now()}`;
        
        let lastError;
        let attempts = 0;
        const startTime = Date.now();
        
        this.stats.totalOperations++;
        
        while (attempts <= config.maxRetries) {
            try {
                // Notifier la tentative
                this.notifyAttempt(operationId, attempts, config.maxRetries, context);
                
                // Exécuter l'opération
                const result = await this.executeWithTimeout(operation, config.timeout || 30000);
                
                // Succès
                if (attempts > 0) {
                    console.log(`✅ Opération ${operationId} réussie après ${attempts} tentatives`);
                    if (this.recoveryCallback) {
                        this.recoveryCallback({
                            type: 'success',
                            operationId,
                            attempts,
                            context,
                            duration: Date.now() - startTime
                        });
                    }
                }
                
                this.stats.successfulOperations++;
                this.updateRetryHistory(operationId, attempts, true, Date.now() - startTime);
                
                return result;
                
            } catch (error) {
                lastError = error;
                attempts++;
                
                // Enregistrer l'échec
                this.updateRetryHistory(operationId, attempts, false, Date.now() - startTime, error);
                
                if (attempts > config.maxRetries) {
                    // Échec final
                    console.error(`❌ Opération ${operationId} échouée après ${attempts} tentatives:`, error.message);
                    
                    if (this.recoveryCallback) {
                        this.recoveryCallback({
                            type: 'failure',
                            operationId,
                            attempts,
                            error,
                            context,
                            duration: Date.now() - startTime
                        });
                    }
                    
                    this.stats.failedOperations++;
                    throw error;
                }
                
                // Calculer le délai avant la prochaine tentative
                const delay = this.calculateDelay(attempts, config);
                
                console.warn(`⚠️ Tentative ${attempts}/${config.maxRetries} échouée pour ${operationId}, retry dans ${delay}ms:`, error.message);
                
                // Notifier l'attente
                if (this.recoveryCallback) {
                    this.recoveryCallback({
                        type: 'retry',
                        operationId,
                        attempts,
                        maxRetries: config.maxRetries,
                        delay,
                        error,
                        context
                    });
                }
                
                // Attendre avant la prochaine tentative
                await this.delay(delay);
            }
        }
        
        throw lastError;
    }

    /**
     * Exécute une opération avec timeout
     * @private
     */
    async executeWithTimeout(operation, timeout) {
        return Promise.race([
            operation(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout de l\'opération')), timeout)
            )
        ]);
    }

    /**
     * Calcule le délai de retry avec backoff exponentiel
     * @private
     */
    calculateDelay(attempt, config) {
        let delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
        delay = Math.min(delay, config.maxDelay);
        
        // Ajouter du jitter pour éviter la synchronisation
        if (config.jitter) {
            const jitterAmount = delay * config.jitterFactor;
            const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
            delay = Math.max(0, delay + jitter);
        }
        
        return Math.round(delay);
    }

    /**
     * Notifie une tentative d'opération
     * @private
     */
    notifyAttempt(operationId, attempt, maxAttempts, context) {
        if (this.recoveryCallback) {
            this.recoveryCallback({
                type: 'attempt',
                operationId,
                attempt,
                maxAttempts,
                context
            });
        }
    }

    /**
     * Met à jour l'historique des retries
     * @private
     */
    updateRetryHistory(operationId, attempt, success, duration, error = null) {
        if (!this.retryHistory.has(operationId)) {
            this.retryHistory.set(operationId, []);
        }
        
        const history = this.retryHistory.get(operationId);
        history.push({
            attempt,
            success,
            duration,
            error: error ? error.message : null,
            timestamp: Date.now()
        });
        
        // Limiter la taille de l'historique
        if (history.length > 10) {
            history.shift();
        }
        
        this.stats.totalRetries++;
        this.updateAverageRetries();
    }

    /**
     * Met à jour la moyenne des retries
     * @private
     */
    updateAverageRetries() {
        if (this.stats.totalOperations === 0) {
            this.stats.averageRetries = 0;
            return;
        }
        
        this.stats.averageRetries = (this.stats.totalRetries / this.stats.totalOperations).toFixed(2);
    }

    /**
     * Enregistre une opération critique
     * @param {string} name - Nom de l'opération
     * @param {Function} operation - Fonction de l'opération
     * @param {Object} context - Contexte
     */
    registerCriticalOperation(name, operation, context = {}) {
        this.criticalOperations.set(name, {
            operation,
            context,
            registeredAt: Date.now()
        });
    }

    /**
     * Exécute une opération critique avec retry
     * @param {string} name - Nom de l'opération
     * @param {Object} customConfig - Configuration personnalisée
     * @returns {Promise} Résultat de l'opération
     */
    async executeCriticalOperation(name, customConfig = {}) {
        const opData = this.criticalOperations.get(name);
        if (!opData) {
            throw new Error(`Opération critique ${name} non trouvée`);
        }
        
        return this.executeWithRetry(
            opData.operation,
            { ...opData.context, name, critical: true },
            customConfig
        );
    }

    /**
     * Retry une opération critique
     * @param {string} name - Nom de l'opération
     * @returns {Promise} Résultat de l'opération
     */
    async retryCriticalOperation(name) {
        return this.executeCriticalOperation(name, {
            maxRetries: 5, // Plus de tentatives pour les opérations critiques
            baseDelay: 2000
        });
    }

    /**
     * Vérifie si une opération est enregistrée comme critique
     * @param {string} name - Nom de l'opération
     * @returns {boolean}
     */
    isCriticalOperation(name) {
        return this.criticalOperations.has(name);
    }

    /**
     * Délai utilitaire
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Récupère les statistiques de récupération
     * @returns {Object} Statistiques
     */
    getStats() {
        const successRate = this.stats.totalOperations > 0 ? 
            (this.stats.successfulOperations / this.stats.totalOperations * 100).toFixed(2) : 0;

        return {
            ...this.stats,
            successRate: `${successRate}%`,
            criticalOperationsCount: this.criticalOperations.size,
            retryHistorySize: this.retryHistory.size
        };
    }

    /**
     * Récupère l'historique des retries pour une opération
     * @param {string} operationId - ID de l'opération
     * @returns {Array} Historique
     */
    getRetryHistory(operationId) {
        return this.retryHistory.get(operationId) || [];
    }

    /**
     * Analyse les patterns d'échec
     * @returns {Object} Analyse des patterns
     */
    analyzeFailurePatterns() {
        const patterns = {
            timeout: 0,
            network: 0,
            permission: 0,
            unknown: 0
        };

        for (const [operationId, history] of this.retryHistory) {
            for (const entry of history) {
                if (!entry.error) continue;

                const error = entry.error.toLowerCase();
                if (error.includes('timeout')) {
                    patterns.timeout++;
                } else if (error.includes('network') || error.includes('fetch')) {
                    patterns.network++;
                } else if (error.includes('permission') || error.includes('unauthorized')) {
                    patterns.permission++;
                } else {
                    patterns.unknown++;
                }
            }
        }

        const total = Object.values(patterns).reduce((a, b) => a + b, 0);
        
        return {
            patterns,
            total,
            percentages: Object.fromEntries(
                Object.entries(patterns).map(([key, value]) => [
                    key, 
                    total > 0 ? ((value / total) * 100).toFixed(2) + '%' : '0%'
                ])
            )
        };
    }

    /**
     * Réinitialise les statistiques
     */
    resetStats() {
        this.stats = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            totalRetries: 0,
            averageRetries: 0
        };
    }

    /**
     * Nettoie l'historique des retries
     * @param {number} maxAge - Âge maximum des entrées (ms)
     */
    cleanupHistory(maxAge = 3600000) { // 1h par défaut
        const now = Date.now();
        const toDelete = [];

        for (const [operationId, history] of this.retryHistory) {
            const recentHistory = history.filter(entry => now - entry.timestamp < maxAge);
            
            if (recentHistory.length === 0) {
                toDelete.push(operationId);
            } else {
                this.retryHistory.set(operationId, recentHistory);
            }
        }

        toDelete.forEach(id => this.retryHistory.delete(id));
        return toDelete.length;
    }

    /**
     * Exporte l'état du système
     * @returns {Object} État exporté
     */
    exportState() {
        return {
            config: this.retryConfig,
            stats: this.getStats(),
            criticalOperations: Array.from(this.criticalOperations.keys()),
            failurePatterns: this.analyzeFailurePatterns(),
            exportedAt: Date.now()
        };
    }

    /**
     * Configure les paramètres de retry
     * @param {Object} newConfig - Nouvelle configuration
     */
    configure(newConfig) {
        this.retryConfig = { ...this.retryConfig, ...newConfig };
    }
}

// Instance globale
window.autoRecovery = new AutoRecoverySystem();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoRecoverySystem;
}
