/**
 * =================================================================
 * SYSTÈME DE CHARGEMENT PROGRESSIF
 * Gestion du chargement des modules avec barre de progression
 * =================================================================
 */

'use strict';

class ProgressiveLoader {
    constructor() {
        this.modules = new Map();
        this.loadingPromises = new Map();
        this.progressCallback = null;
        this.loadedModules = new Set();
        this.failedModules = new Set();
        this.startTime = Date.now();
    }

    /**
     * Définit le callback pour la progression
     * @param {Function} callback - Fonction de callback
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Charge un module avec progression
     * @param {string} name - Nom du module
     * @param {Function} loader - Fonction de chargement
     * @param {number} priority - Priorité (0 = haute)
     * @returns {Promise} Module chargé
     */
    async loadModule(name, loader, priority = 0) {
        // Vérifier si déjà chargé
        if (this.modules.has(name)) {
            return this.modules.get(name);
        }

        // Vérifier si déjà en cours de chargement
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        // Notifier début du chargement
        this.updateProgress(name, 0, 'Chargement...');

        const loadingPromise = this._loadModuleInternal(name, loader, priority);
        this.loadingPromises.set(name, loadingPromise);

        try {
            const result = await loadingPromise;
            this.modules.set(name, result);
            this.loadedModules.add(name);
            this.updateProgress(name, 100, 'Terminé');
            return result;
        } catch (error) {
            this.failedModules.add(name);
            this.updateProgress(name, -1, `Erreur: ${error.message}`);
            throw error;
        } finally {
            this.loadingPromises.delete(name);
        }
    }

    /**
     * Charge plusieurs modules en parallèle
     * @param {Array} modules - Liste des modules à charger
     * @returns {Promise} Tous les modules chargés
     */
    async loadModules(modules) {
        const promises = modules.map(({ name, loader, priority }) => 
            this.loadModule(name, loader, priority)
        );
        
        return Promise.allSettled(promises);
    }

    /**
     * Charge un module en interne avec timeout
     * @private
     */
    async _loadModuleInternal(name, loader, priority) {
        const timeout = priority === 0 ? 15000 : 30000; // Timeout plus court pour haute priorité
        
        return Promise.race([
            loader(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Timeout du module ${name}`)), timeout)
            )
        ]);
    }

    /**
     * Met à jour la progression
     * @private
     */
    updateProgress(moduleName, percent, message) {
        if (this.progressCallback) {
            const totalProgress = this.calculateTotalProgress();
            this.progressCallback({
                module: moduleName,
                percent,
                message,
                totalProgress,
                loadedCount: this.loadedModules.size,
                failedCount: this.failedModules.size,
                elapsedTime: Date.now() - this.startTime
            });
        }
    }

    /**
     * Calcule la progression totale
     * @private
     */
    calculateTotalProgress() {
        const total = this.loadingPromises.size + this.loadedModules.size + this.failedModules.size;
        if (total === 0) return 0;
        
        const completed = this.loadedModules.size + this.failedModules.size;
        return Math.round((completed / total) * 100);
    }

    /**
     * Vérifie si un module est chargé
     * @param {string} name - Nom du module
     * @returns {boolean}
     */
    isModuleLoaded(name) {
        return this.modules.has(name);
    }

    /**
     * Récupère un module chargé
     * @param {string} name - Nom du module
     * @returns {*} Module ou null
     */
    getModule(name) {
        return this.modules.get(name) || null;
    }

    /**
     * Récupère les statistiques de chargement
     * @returns {Object} Statistiques
     */
    getStats() {
        return {
            loaded: this.loadedModules.size,
            failed: this.failedModules.size,
            loading: this.loadingPromises.size,
            total: this.loadedModules.size + this.failedModules.size + this.loadingPromises.size,
            elapsedTime: Date.now() - this.startTime
        };
    }

    /**
     * Réinitialise le chargeur
     */
    reset() {
        this.modules.clear();
        this.loadingPromises.clear();
        this.loadedModules.clear();
        this.failedModules.clear();
        this.startTime = Date.now();
    }
}

// Export global
window.ProgressiveLoader = ProgressiveLoader;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressiveLoader;
}
