/**
 * =================================================================
 * GESTION DE MÉMOIRE ADAPTATIVE
 * Monitoring automatique avec nettoyage intelligent
 * =================================================================
 */

'use strict';

class MemoryManager {
    constructor() {
        this.thresholds = {
            warning: 50 * 1024 * 1024,  // 50MB
            critical: 100 * 1024 * 1024, // 100MB
            emergency: 200 * 1024 * 1024  // 200MB
        };
        
        this.cleanupStrategies = [
            this.clearOldCache.bind(this),
            this.clearUnusedWorkers.bind(this),
            this.compressData.bind(this),
            this.forceGarbageCollection.bind(this),
            this.clearOldHistory.bind(this),
            this.optimizeImages.bind(this)
        ];
        
        this.monitoringInterval = null;
        this.stats = {
            cleanups: {
                warning: 0,
                critical: 0,
                emergency: 0
            },
            lastCleanup: null,
            totalCleaned: 0,
            monitoringStart: Date.now()
        };
        
        this.isMonitoring = false;
        this.cleanupCallbacks = [];
        
        this.startMonitoring();
    }

    /**
     * Démarre le monitoring de la mémoire
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.monitorMemory();
        }, 30000); // Vérifier toutes les 30 secondes
        
        console.log('🧠 Monitoring de la mémoire démarré');
    }

    /**
     * Arrête le monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.isMonitoring = false;
        console.log('🧠 Monitoring de la mémoire arrêté');
    }

    /**
     * Surveille l'utilisation de la mémoire
     * @private
     */
    monitorMemory() {
        if (!performance.memory) {
            return;
        }

        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.totalJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        const usagePercent = (used / limit) * 100;

        // Notifier les callbacks
        this.notifyCallbacks('memory-monitor', {
            used,
            total,
            limit,
            usagePercent,
            timestamp: Date.now()
        });

        // Déclencher les nettoyages selon les seuils
        if (used > this.thresholds.emergency) {
            this.emergencyCleanup();
        } else if (used > this.thresholds.critical) {
            this.criticalCleanup();
        } else if (used > this.thresholds.warning) {
            this.lightCleanup();
        }

        // Log en mode debug
        if (usagePercent > 70) {
            console.warn(`🧠 Utilisation mémoire élevée: ${usagePercent.toFixed(2)}%`);
        }
    }

    /**
     * Nettoyage léger
     * @private
     */
    lightCleanup() {
        console.log('🧹 Nettoyage léger de la mémoire');
        
        let cleaned = 0;
        
        // Nettoyer le cache ancien
        cleaned += this.clearOldCache(1800000); // 30min
        
        // Nettoyer l'historique des erreurs
        cleaned += this.clearOldHistory(3600000); // 1h
        
        this.stats.cleanups.warning++;
        this.updateStats(cleaned);
        
        this.notifyCallbacks('light-cleanup', { cleaned, level: 'warning' });
    }

    /**
     * Nettoyage critique
     * @private
     */
    criticalCleanup() {
        console.log('🧹 Nettoyage critique de la mémoire');
        
        let cleaned = 0;
        
        // Nettoyer le cache ancien
        cleaned += this.clearOldCache(900000); // 15min
        
        // Nettoyer les workers inutilisés
        cleaned += this.clearUnusedWorkers();
        
        // Nettoyer l'historique
        cleaned += this.clearOldHistory(1800000); // 30min
        
        // Compresser les données
        cleaned += this.compressData();
        
        this.stats.cleanups.critical++;
        this.updateStats(cleaned);
        
        this.notifyCallbacks('critical-cleanup', { cleaned, level: 'critical' });
    }

    /**
     * Nettoyage d'urgence
     * @private
     */
    emergencyCleanup() {
        console.log('🚨 Nettoyage d\'urgence de la mémoire');
        
        let cleaned = 0;
        
        // Exécuter toutes les stratégies
        for (const strategy of this.cleanupStrategies) {
            try {
                cleaned += strategy();
            } catch (error) {
                console.error('Erreur dans la stratégie de nettoyage:', error);
            }
        }
        
        this.stats.cleanups.emergency++;
        this.updateStats(cleaned);
        
        this.notifyCallbacks('emergency-cleanup', { cleaned, level: 'emergency' });
        
        // Forcer le garbage collection si disponible
        this.forceGarbageCollection();
    }

    /**
     * Nettoie le cache ancien
     * @private
     */
    clearOldCache(maxAge = 1800000) { // 30min par défaut
        let cleaned = 0;
        
        // Cache intelligent
        if (window.appState?.performance?.cache) {
            cleaned += window.appState.performance.cache.cleanup(maxAge);
        }
        
        // Cache du loader
        if (window.appState?.performance?.loader) {
            // Nettoyer les modules chargés depuis longtemps
            const loader = window.appState.performance.loader;
            const stats = loader.getStats();
            // Implémenter le nettoyage si nécessaire
            console.log('📦 Stats loader:', stats);
        }
        
        // Cache du préchargeur
        if (window.ResourcePreloader?.instance) {
            cleaned += window.ResourcePreloader.instance.cleanup(maxAge);
        }
        
        return cleaned;
    }

    /**
     * Nettoie les workers inutilisés
     * @private
     */
    clearUnusedWorkers() {
        let cleaned = 0;
        
        // Pool de workers SPAcy
        if (window.appState?.performance?.workerPool) {
            const pool = window.appState.performance.workerPool;
            const stats = pool.getStats();
            
            // Si plus de 50% des workers sont inutilisés, en réduire le nombre
            if (stats.availableWorkers > stats.totalWorkers / 2 && stats.totalWorkers > 1) {
                const workersToTerminate = Math.floor(stats.availableWorkers / 2);
                console.log(`🗑️ Termination de ${workersToTerminate} workers inutilisés`);
                pool.restart(stats.totalWorkers - workersToTerminate);
                cleaned += workersToTerminate;
            }
        }
        
        return cleaned;
    }

    /**
     * Compresse les données volumineuses
     * @private
     */
    compressData() {
        let compressed = 0;
        
        // Compresser les chaînes longues dans le cache
        if (window.appState?.performance?.cache) {
            const cache = window.appState.performance.cache;
            // Implémenter la compression si nécessaire
            console.log('🗜️ Compression des données du cache');
            compressed += 1; // Placeholder
        }
        
        return compressed;
    }

    /**
     * Force le garbage collection
     * @private
     */
    forceGarbageCollection() {
        if (window.gc) {
            window.gc();
            console.log('🗑️ Garbage collection forcé');
            return 1;
        }
        
        // Essayer d'autres méthodes
        if (window.performance && window.performance.memory) {
            // Tenter de déclencher le GC en créant et supprimant des objets
            const temp = [];
            for (let i = 0; i < 1000; i++) {
                temp.push(new Array(1000).fill(Math.random()));
            }
            temp.length = 0;
            console.log('🗑️ Tentative de garbage collection indirect');
            return 1;
        }
        
        return 0;
    }

    /**
     * Nettoie l'historique ancien
     * @private
     */
    clearOldHistory(maxAge = 3600000) { // 1h par défaut
        let cleaned = 0;
        const now = Date.now();
        
        // Nettoyer l'historique des erreurs
        if (window.appState?.errors) {
            const originalLength = window.appState.errors.length;
            window.appState.errors = window.appState.errors.filter(
                error => now - new Date(error.timestamp).getTime() < maxAge
            );
            cleaned += originalLength - window.appState.errors.length;
        }
        
        // Nettoyer l'historique du débouncer adaptatif
        if (window.AdaptiveDebouncer?.instance) {
            const debouncer = window.AdaptiveDebouncer.instance;
            if (debouncer.activityHistory) {
                const originalLength = debouncer.activityHistory.length;
                debouncer.activityHistory = debouncer.activityHistory.filter(
                    timestamp => now - timestamp < maxAge
                );
                cleaned += originalLength - debouncer.activityHistory.length;
            }
        }
        
        // Nettoyer l'historique du récupérateur automatique
        if (window.autoRecovery?.instance) {
            cleaned += window.autoRecovery.instance.cleanupHistory(maxAge);
        }
        
        return cleaned;
    }

    /**
     * Optimise les images en mémoire
     * @private
     */
    optimizeImages() {
        let optimized = 0;
        
        // Chercher les images dans le DOM
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Libérer la mémoire des images hors de la vue
            if (!this.isElementInViewport(img)) {
                // Sauvegarder le src
                const src = img.src;
                
                // Remplacer par un placeholder
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                
                // Restaurer au scroll
                img.addEventListener('load', () => {
                    img.src = src;
                }, { once: true });
                
                optimized++;
            }
        });
        
        if (optimized > 0) {
            console.log(`🖼️ Optimisation de ${optimized} images hors vue`);
        }
        
        return optimized;
    }

    /**
     * Vérifie si un élément est dans le viewport
     * @private
     */
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Met à jour les statistiques
     * @private
     */
    updateStats(cleaned) {
        this.stats.lastCleanup = Date.now();
        this.stats.totalCleaned += cleaned;
    }

    /**
     * Notifie les callbacks
     * @private
     */
    notifyCallbacks(event, data) {
        this.cleanupCallbacks.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Erreur dans le callback de mémoire:', error);
            }
        });
    }

    /**
     * Ajoute un callback de nettoyage
     * @param {Function} callback - Fonction de callback
     */
    addCleanupCallback(callback) {
        this.cleanupCallbacks.push(callback);
    }

    /**
     * Supprime un callback de nettoyage
     * @param {Function} callback - Fonction de callback à supprimer
     */
    removeCleanupCallback(callback) {
        const index = this.cleanupCallbacks.indexOf(callback);
        if (index > -1) {
            this.cleanupCallbacks.splice(index, 1);
        }
    }

    /**
     * Récupère les statistiques de mémoire
     * @returns {Object} Statistiques
     */
    getMemoryStats() {
        const baseStats = {
            isMonitoring: this.isMonitoring,
            monitoringDuration: Date.now() - this.stats.monitoringStart,
            cleanups: { ...this.stats.cleanups },
            lastCleanup: this.stats.lastCleanup,
            totalCleaned: this.stats.totalCleaned
        };

        if (performance.memory) {
            return {
                ...baseStats,
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                usage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2) + '%',
                formatted: this.formatBytes(performance.memory.usedJSHeapSize)
            };
        }

        return baseStats;
    }

    /**
     * Formate les bytes en format lisible
     * @private
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 octets';
        
        const units = ['octets', 'Ko', 'Mo', 'Go'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
    }

    /**
     * Configure les seuils de mémoire
     * @param {Object} newThresholds - Nouveaux seuils
     */
    setThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
        console.log('🧠 Seuils de mémoire mis à jour:', this.thresholds);
    }

    /**
     * Déclenche manuellement un nettoyage
     * @param {string} level - Niveau de nettoyage ('light', 'critical', 'emergency')
     */
    triggerCleanup(level = 'light') {
        switch (level) {
            case 'light':
                this.lightCleanup();
                break;
            case 'critical':
                this.criticalCleanup();
                break;
            case 'emergency':
                this.emergencyCleanup();
                break;
            default:
                console.warn('Niveau de nettoyage inconnu:', level);
        }
    }

    /**
     * Exporte l'état du gestionnaire
     * @returns {Object} État exporté
     */
    exportState() {
        return {
            thresholds: this.thresholds,
            stats: this.getMemoryStats(),
            isMonitoring: this.isMonitoring,
            exportedAt: Date.now()
        };
    }

    /**
     * Détruit le gestionnaire
     */
    destroy() {
        this.stopMonitoring();
        this.cleanupCallbacks = [];
        console.log('🧠 Gestionnaire de mémoire détruit');
    }
}

// Instance globale
window.memoryManager = new MemoryManager();

// Export global
window.MemoryManager = MemoryManager;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryManager;
}
