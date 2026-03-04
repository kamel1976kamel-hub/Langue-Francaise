/**
 * =================================================================
 * OPTIMISATION RÉSEAU AVANCÉE
 * Cache intelligent, file d'attente offline et adaptation de connexion
 * =================================================================
 */

'use strict';

class NetworkOptimizer {
    constructor() {
        this.requestQueue = new Map();
        this.requestCache = new Map();
        this.offlineQueue = [];
        this.isOnline = navigator.onLine;
        this.connectionType = this.getConnectionType();
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            backoffFactor: 2
        };
        
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedRequests: 0,
            offlineRequests: 0,
            averageResponseTime: 0,
            totalResponseTime: 0
        };
        
        this.cacheConfig = {
            maxSize: 100,
            defaultTTL: 300000, // 5 minutes
            cleanupInterval: 60000 // 1 minute
        };
        
        this.setupEventListeners();
        this.startConnectionMonitoring();
        this.startCacheCleanup();
    }

    /**
     * Configure les écouteurs d'événements
     * @private
     */
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Connexion rétablie');
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('🌐 Connexion perdue - Mode offline');
        });

        // Network Information API si disponible
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.connectionType = this.getConnectionType();
                this.adjustTimeouts();
                console.log('🌐 Type de connexion changé:', this.connectionType);
            });
        }
    }

    /**
     * Démarre le monitoring de la connexion
     * @private
     */
    startConnectionMonitoring() {
        setInterval(() => {
            this.updateConnectionStatus();
        }, 30000); // Vérifier toutes les 30 secondes
    }

    /**
     * Met à jour le statut de la connexion
     * @private
     */
    updateConnectionStatus() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;
        
        if (wasOnline !== this.isOnline) {
            console.log(`🌐 Changement de statut: ${wasOnline ? 'offline' : 'online'} → ${this.isOnline ? 'online' : 'offline'}`);
            
            if (this.isOnline && this.offlineQueue.length > 0) {
                this.processOfflineQueue();
            }
        }
    }

    /**
     * Démarre le nettoyage du cache
     * @private
     */
    startCacheCleanup() {
        setInterval(() => {
            this.cleanupCache();
        }, this.cacheConfig.cleanupInterval);
    }

    /**
     * Obtient le type de connexion
     * @private
     */
    getConnectionType() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType || 'unknown',
                downlink: conn.downlink || 0,
                rtt: conn.rtt || 0,
                saveData: conn.saveData || false,
                type: conn.type || 'unknown'
            };
        }
        return { effectiveType: 'unknown' };
    }

    /**
     * Ajuste les timeouts selon la connexion
     * @private
     */
    adjustTimeouts() {
        const timeouts = {
            'slow-2g': 60000,
            '2g': 45000,
            '3g': 30000,
            '4g': 15000
        };

        const timeout = timeouts[this.connectionType.effectiveType] || 30000;
        this.retryConfig.baseDelay = Math.min(timeout / 3, 5000);
        
        console.log(`🌐 Timeout ajusté à ${timeout}ms pour ${this.connectionType.effectiveType}`);
        
        return timeout;
    }

    /**
     * Effectue une requête fetch optimisée
     * @param {string} url - URL de la requête
     * @param {Object} options - Options de la requête
     * @returns {Promise} Réponse de la requête
     */
    async optimizedFetch(url, options = {}) {
        const startTime = Date.now();
        const cacheKey = this.generateCacheKey(url, options);
        
        // Vérifier le cache d'abord
        if (this.requestCache.has(cacheKey)) {
            const cached = this.requestCache.get(cacheKey);
            if (Date.now() - cached.timestamp < cached.ttl) {
                this.stats.cachedRequests++;
                console.log('🎯 Réponse récupérée depuis le cache réseau');
                return this.cloneResponse(cached.response);
            }
        }

        // Si offline, mettre en file d'attente
        if (!this.isOnline) {
            return this.queueOfflineRequest(url, options);
        }

        // Éviter les requêtes dupliquées
        if (this.requestQueue.has(cacheKey)) {
            return this.requestQueue.get(cacheKey);
        }

        // Créer la promesse de requête
        const requestPromise = this.executeRequest(url, options, cacheKey);
        this.requestQueue.set(cacheKey, requestPromise);

        try {
            const response = await requestPromise;
            const responseTime = Date.now() - startTime;
            
            // Mettre à jour les statistiques
            this.stats.successfulRequests++;
            this.stats.totalResponseTime += responseTime;
            this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.successfulRequests;
            
            // Mettre en cache la réponse si c'est un GET réussi
            if (response.ok && (!options.method || options.method === 'GET')) {
                this.cacheResponse(cacheKey, response.clone());
            }

            return response;
        } catch (error) {
            this.stats.failedRequests++;
            throw error;
        } finally {
            this.requestQueue.delete(cacheKey);
            this.stats.totalRequests++;
        }
    }

    /**
     * Exécute une requête avec retry et timeout
     * @private
     */
    async executeRequest(url, options, cacheKey) {
        let lastError;
        
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                const timeout = this.adjustTimeouts();
                const response = await this.fetchWithTimeout(url, options, timeout);
                
                // Si succès, retourner la réponse
                return response;
                
            } catch (error) {
                lastError = error;
                
                if (attempt < this.retryConfig.maxRetries) {
                    const delay = this.calculateRetryDelay(attempt);
                    console.warn(`⚠️ Retry ${attempt + 1}/${this.retryConfig.maxRetries} pour ${url} dans ${delay}ms`);
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Calcule le délai de retry
     * @private
     */
    calculateRetryDelay(attempt) {
        let delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt);
        
        // Ajouter du jitter pour éviter la synchronisation
        const jitter = delay * 0.1 * Math.random();
        delay += jitter;
        
        return Math.min(delay, this.retryConfig.maxDelay);
    }

    /**
     * Effectue une requête avec timeout
     * @private
     */
    async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(`Timeout réseau (${timeout}ms) pour ${url}`);
            }
            
            throw error;
        }
    }

    /**
     * Met en file d'attente une requête offline
     * @private
     */
    queueOfflineRequest(url, options) {
        return new Promise((resolve, reject) => {
            const offlineRequest = {
                url,
                options,
                resolve,
                reject,
                timestamp: Date.now(),
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
            };
            
            this.offlineQueue.push(offlineRequest);
            this.stats.offlineRequests++;
            
            console.log(`📪 Requête mise en file d'attente offline: ${url}`);
        });
    }

    /**
     * Traite la file d'attente offline
     * @private
     */
    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;
        
        console.log(`🌐 Traitement de ${this.offlineQueue.length} requêtes offline`);
        
        // Traiter les requêtes dans l'ordre
        while (this.offlineQueue.length > 0 && this.isOnline) {
            const request = this.offlineQueue.shift();
            
            try {
                const response = await this.optimizedFetch(request.url, request.options);
                request.resolve(response);
                
                console.log(`✅ Requête offline traitée: ${request.url}`);
            } catch (error) {
                request.reject(error);
                console.error(`❌ Échec requête offline: ${request.url}`, error);
            }
        }
    }

    /**
     * Génère une clé de cache
     * @private
     */
    generateCacheKey(url, options) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.stringify(options.body) : '';
        const headers = options.headers ? JSON.stringify(options.headers) : '';
        return `${method}:${url}:${body}:${headers}`;
    }

    /**
     * Met en cache une réponse
     * @private
     */
    cacheResponse(key, response) {
        // Limiter la taille du cache
        if (this.requestCache.size >= this.cacheConfig.maxSize) {
            this.evictOldestCacheEntry();
        }

        this.requestCache.set(key, {
            response,
            timestamp: Date.now(),
            ttl: this.cacheConfig.defaultTTL
        });
    }

    /**
     * Évince l'entrée la plus ancienne du cache
     * @private
     */
    evictOldestCacheEntry() {
        let oldestKey = null;
        let oldestTimestamp = Date.now();

        for (const [key, entry] of this.requestCache) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.requestCache.delete(oldestKey);
        }
    }

    /**
     * Nettoie le cache des entrées expirées
     * @private
     */
    cleanupCache() {
        const now = Date.now();
        const toDelete = [];

        for (const [key, entry] of this.requestCache) {
            if (now - entry.timestamp > entry.ttl) {
                toDelete.push(key);
            }
        }

        toDelete.forEach(key => this.requestCache.delete(key));
        
        if (toDelete.length > 0) {
            console.log(`🧹 Nettoyage cache: ${toDelete.length} entrées expirées supprimées`);
        }
    }

    /**
     * Clone une réponse pour éviter les erreurs de lecture
     * @private
     */
    cloneResponse(response) {
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            url: response.url
        });
    }

    /**
     * Vide le cache
     */
    clearCache() {
        this.requestCache.clear();
        console.log('🧹 Cache réseau vidé');
    }

    /**
     * Configure les options de cache
     * @param {Object} config - Configuration du cache
     */
    setCacheConfig(config) {
        this.cacheConfig = { ...this.cacheConfig, ...config };
        console.log('🌐 Configuration du cache mise à jour:', this.cacheConfig);
    }

    /**
     * Configure les options de retry
     * @param {Object} config - Configuration des retry
     */
    setRetryConfig(config) {
        this.retryConfig = { ...this.retryConfig, ...config };
        console.log('🌐 Configuration des retry mise à jour:', this.retryConfig);
    }

    /**
     * Récupère les statistiques réseau
     * @returns {Object} Statistiques
     */
    getNetworkStats() {
        const successRate = this.stats.totalRequests > 0 ? 
            (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) : 0;

        return {
            isOnline: this.isOnline,
            connectionType: this.connectionType,
            totalRequests: this.stats.totalRequests,
            successfulRequests: this.stats.successfulRequests,
            failedRequests: this.stats.failedRequests,
            cachedRequests: this.stats.cachedRequests,
            offlineRequests: this.stats.offlineRequests,
            successRate: `${successRate}%`,
            averageResponseTime: `${this.stats.averageResponseTime.toFixed(2)}ms`,
            queuedRequests: this.requestQueue.size,
            offlineQueue: this.offlineQueue.length,
            cacheSize: this.requestCache.size,
            cacheHitRate: this.stats.totalRequests > 0 ? 
                `${(this.stats.cachedRequests / this.stats.totalRequests * 100).toFixed(2)}%` : '0%'
        };
    }

    /**
     * Teste la connectivité
     * @returns {Promise<boolean>} True si connecté
     */
    async testConnectivity() {
        try {
            const response = await this.optimizedFetch('https://httpbin.org/get', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch (error) {
            console.warn('🌐 Test de connectivité échoué:', error.message);
            return false;
        }
    }

    /**
     * Force la synchronisation de la file offline
     */
    async forceSyncOfflineQueue() {
        if (!this.isOnline) {
            throw new Error('Impossible de synchroniser: hors ligne');
        }
        
        await this.processOfflineQueue();
        console.log('🌐 Synchronisation forcée terminée');
    }

    /**
     * Exporte l'état de l'optimiseur
     * @returns {Object} État exporté
     */
    exportState() {
        return {
            stats: this.getNetworkStats(),
            config: {
                cache: this.cacheConfig,
                retry: this.retryConfig
            },
            offlineQueue: this.offlineQueue.map(req => ({
                ...req,
                resolve: undefined,
                reject: undefined
            })),
            exportedAt: Date.now()
        };
    }

    /**
     * Détruit l'optimiseur réseau
     */
    destroy() {
        // Annuler toutes les requêtes en attente
        for (const [key, promise] of this.requestQueue) {
            // Les promesses seront rejetées quand le timeout sera atteint
        }
        
        this.requestQueue.clear();
        this.clearCache();
        this.offlineQueue = [];
        
        console.log('🌐 Optimiseur réseau détruit');
    }
}

// Instance globale
window.networkOptimizer = new NetworkOptimizer();

// Export global
window.NetworkOptimizer = NetworkOptimizer;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkOptimizer;
}
