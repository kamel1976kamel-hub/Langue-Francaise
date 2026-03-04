/**
 * =================================================================
 * PRÉCHARGEMENT INTELLIGENT DES RESSOURCES
 * Anticipation des besoins utilisateur avec chargement en arrière-plan
 * =================================================================
 */

'use strict';

class ResourcePreloader {
    constructor() {
        this.resources = new Map();
        this.preloadQueue = [];
        this.isPreloading = false;
        this.preloadedCallbacks = new Map();
        this.preloadStats = {
            total: 0,
            successful: 0,
            failed: 0,
            startTime: Date.now()
        };
        this.preloadPriorities = {
            critical: 100,
            high: 75,
            medium: 50,
            low: 25
        };
    }

    /**
     * Ajoute une ressource à la file de préchargement
     * @param {Object} resource - Configuration de la ressource
     */
    addToPreloadQueue(resource) {
        // Normaliser la ressource
        const normalizedResource = {
            name: resource.name,
            loader: resource.loader,
            priority: this.preloadPriorities[resource.priority] || resource.priority || 50,
            timeout: resource.timeout || 10000,
            retries: resource.retries || 2,
            dependencies: resource.dependencies || [],
            metadata: resource.metadata || {}
        };

        this.preloadQueue.push(normalizedResource);
        this.preloadQueue.sort((a, b) => b.priority - a.priority);
        
        if (!this.isPreloading) {
            this.startPreloading();
        }

        console.log(`📦 Ressource ajoutée à la file: ${resource.name} (priorité: ${normalizedResource.priority})`);
    }

    /**
     * Démarre le processus de préchargement
     * @private
     */
    async startPreloading() {
        if (this.isPreloading) return;
        
        this.isPreloading = true;
        console.log('🚀 Démarrage du préchargement intelligent...');

        while (this.preloadQueue.length > 0) {
            const resource = this.preloadQueue.shift();
            
            try {
                // Vérifier les dépendances d'abord
                await this.loadDependencies(resource);
                
                // Précharger la ressource principale
                await this.preloadResource(resource);
                
                // Notifier le préchargement terminé
                const callback = this.preloadedCallbacks.get(resource.name);
                if (callback) {
                    callback(resource.name, this.resources.get(resource.name));
                }
                
                this.preloadStats.successful++;
                console.log(`✅ Ressource préchargée: ${resource.name}`);
                
            } catch (error) {
                this.preloadStats.failed++;
                console.warn(`❌ Préchargement échoué pour ${resource.name}:`, error.message);
                
                // Notifier l'échec
                const errorCallback = this.preloadedCallbacks.get(`${resource.name}_error`);
                if (errorCallback) {
                    errorCallback(resource.name, error);
                }
            }
            
            this.preloadStats.total++;
            
            // Laisser le temps au navigateur pour éviter le blocage
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        this.isPreloading = false;
        console.log('🏁 Préchargement terminé');
    }

    /**
     * Charge les dépendances d'une ressource
     * @private
     */
    async loadDependencies(resource) {
        for (const dependency of resource.dependencies) {
            if (!this.resources.has(dependency)) {
                // Charger la dépendance si elle n'est pas déjà chargée
                const depResource = this.preloadQueue.find(r => r.name === dependency);
                if (depResource) {
                    await this.preloadResource(depResource);
                }
            }
        }
    }

    /**
     * Précharge une ressource spécifique
     * @private
     */
    async preloadResource(resource) {
        // Vérifier si déjà chargée
        if (this.resources.has(resource.name)) {
            return this.resources.get(resource.name);
        }

        let lastError;
        
        for (let attempt = 0; attempt <= resource.retries; attempt++) {
            try {
                const data = await this.executeWithTimeout(
                    resource.loader(),
                    resource.timeout
                );
                
                this.resources.set(resource.name, {
                    data,
                    loadedAt: Date.now(),
                    metadata: resource.metadata,
                    loadTime: Date.now()
                });
                
                return data;
                
            } catch (error) {
                lastError = error;
                
                if (attempt < resource.retries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.warn(`⚠️ Retry ${attempt + 1}/${resource.retries} pour ${resource.name} dans ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Exécute une fonction avec timeout
     * @private
     */
    async executeWithTimeout(promise, timeout) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout du préchargement')), timeout)
            )
        ]);
    }

    /**
     * Enregistre un callback pour le préchargement terminé
     * @param {string} resourceName - Nom de la ressource
     * @param {Function} callback - Fonction de callback
     */
    onPreloaded(resourceName, callback) {
        this.preloadedCallbacks.set(resourceName, callback);
    }

    /**
     * Enregistre un callback pour l'erreur de préchargement
     * @param {string} resourceName - Nom de la ressource
     * @param {Function} callback - Fonction de callback d'erreur
     */
    onPreloadError(resourceName, callback) {
        this.preloadedCallbacks.set(`${resourceName}_error`, callback);
    }

    /**
     * Récupère une ressource préchargée
     * @param {string} name - Nom de la ressource
     * @returns {*} Données de la ressource ou null
     */
    getResource(name) {
        const resource = this.resources.get(name);
        return resource ? resource.data : null;
    }

    /**
     * Vérifie si une ressource est préchargée
     * @param {string} name - Nom de la ressource
     * @returns {boolean}
     */
    isResourceLoaded(name) {
        return this.resources.has(name);
    }

    /**
     * Précharge les ressources communes de l'application
     */
    preloadCommonResources() {
        // Précharger les règles SPAcy
        this.addToPreloadQueue({
            name: 'spacy-rules',
            priority: 'high',
            loader: async () => {
                if (window.loadAllRules) {
                    return await window.loadAllRules();
                }
                return null;
            },
            dependencies: []
        });

        // Précharger les données utilisateur
        this.addToPreloadQueue({
            name: 'user-data',
            priority: 'critical',
            loader: async () => {
                if (window.gestionUtilisateurs) {
                    return window.gestionUtilisateurs.listerTous();
                }
                return [];
            },
            dependencies: []
        });

        // Précharger les configurations
        this.addToPreloadQueue({
            name: 'app-config',
            priority: 'critical',
            loader: async () => {
                return {
                    theme: localStorage.getItem('theme') || 'light',
                    language: localStorage.getItem('language') || 'fr',
                    preferences: JSON.parse(localStorage.getItem('preferences') || '{}')
                };
            },
            dependencies: []
        });

        // Précharger les modèles IA (si disponibles)
        this.addToPreloadQueue({
            name: 'ia-models',
            priority: 'medium',
            loader: async () => {
                if (window.runFourModelPipeline) {
                    // Préchauffer le pipeline avec une requête de test
                    try {
                        await window.runFourModelPipeline('test', 'test', 'test');
                        return 'warmed-up';
                    } catch (error) {
                        return 'warmup-failed';
                    }
                }
                return null;
            },
            dependencies: ['spacy-rules']
        });
    }

    /**
     * Nettoie les anciennes ressources
     * @param {number} maxAge - Âge maximum en ms
     * @returns {number} Nombre de ressources supprimées
     */
    cleanup(maxAge = 3600000) { // 1h par défaut
        const now = Date.now();
        const toDelete = [];

        for (const [name, resource] of this.resources) {
            if (now - resource.loadedAt > maxAge) {
                toDelete.push(name);
            }
        }

        toDelete.forEach(name => this.resources.delete(name));
        
        if (toDelete.length > 0) {
            console.log(`🧹 Nettoyage: ${toDelete.length} ressources anciennes supprimées`);
        }

        return toDelete.length;
    }

    /**
     * Récupère les statistiques de préchargement
     * @returns {Object} Statistiques
     */
    getStats() {
        const totalTime = Date.now() - this.preloadStats.startTime;
        const successRate = this.preloadStats.total > 0 ? 
            (this.preloadStats.successful / this.preloadStats.total * 100).toFixed(2) : 0;

        return {
            total: this.preloadStats.total,
            successful: this.preloadStats.successful,
            failed: this.preloadStats.failed,
            successRate: `${successRate}%`,
            queued: this.preloadQueue.length,
            loaded: this.resources.size,
            totalTime: `${(totalTime / 1000).toFixed(2)}s`,
            isPreloading: this.isPreloading
        };
    }

    /**
     * Exporte l'état du préchargeur
     * @returns {Object} État exporté
     */
    exportState() {
        return {
            resources: Object.fromEntries(this.resources),
            queue: this.preloadQueue,
            stats: this.getStats(),
            exportedAt: Date.now()
        };
    }

    /**
     * Réinitialise le préchargeur
     */
    reset() {
        this.resources.clear();
        this.preloadQueue = [];
        this.isPreloading = false;
        this.preloadedCallbacks.clear();
        this.preloadStats = {
            total: 0,
            successful: 0,
            failed: 0,
            startTime: Date.now()
        };
    }
}

// Export global
window.ResourcePreloader = ResourcePreloader;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourcePreloader;
}
