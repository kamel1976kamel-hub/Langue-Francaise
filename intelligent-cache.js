/**
 * =================================================================
 * CACHE INTELLIGENT POUR RÉSULTATS
 * Cache LRU avec TTL et invalidation automatique
 * =================================================================
 */

'use strict';

class IntelligentCache {
    constructor(maxSize = 1000, ttl = 3600000) { // 1h TTL par défaut
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;
        this.lastCleanup = Date.now();
    }

    /**
     * Génère une clé de cache basée sur le contenu
     * @param {string} text - Texte à mettre en cache
     * @param {string} context - Contexte
     * @param {string} type - Type de traitement
     * @returns {string} Clé de cache
     */
    generateKey(text, context, type) {
        // Normaliser le texte pour une meilleure correspondance
        const normalized = `${text.toLowerCase().trim()}|${context}|${type}`;
        return this.simpleHash(normalized);
    }

    /**
     * Hash simple pour générer des clés
     * @private
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir en 32-bit integer
        }
        return hash.toString(36);
    }

    /**
     * Récupère une valeur du cache
     * @param {string} key - Clé de cache
     * @returns {Promise<any>} Valeur ou null
     */
    async get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            this.misses++;
            return null;
        }
        
        // Vérifier l'expiration
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }
        
        // Mettre à jour les statistiques
        item.hits++;
        item.lastAccessed = Date.now();
        
        // Promouvoir au début (LRU)
        this.cache.delete(key);
        this.cache.set(key, item);
        
        this.hits++;
        return item.data;
    }

    /**
     * Met une valeur en cache
     * @param {string} key - Clé de cache
     * @param {any} data - Données à mettre en cache
     * @param {number} customTtl - TTL personnalisé (optionnel)
     * @returns {Promise<void>}
     */
    async set(key, data, customTtl = null) {
        // Éviction LRU si nécessaire
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        const item = {
            data,
            timestamp: Date.now(),
            lastAccessed: Date.now(),
            hits: 0,
            ttl: customTtl || this.ttl
        };

        this.cache.set(key, item);
    }

    /**
     * Évince l'élément le moins récemment utilisé
     * @private
     */
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, item] of this.cache) {
            if (item.lastAccessed < oldestTime) {
                oldestTime = item.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.evictions++;
        }
    }

    /**
     * Nettoie les éléments expirés
     * @returns {number} Nombre d'éléments supprimés
     */
    cleanup() {
        const now = Date.now();
        const toDelete = [];
        
        for (const [key, item] of this.cache) {
            if (now - item.timestamp > item.ttl) {
                toDelete.push(key);
            }
        }

        toDelete.forEach(key => this.cache.delete(key));
        this.lastCleanup = now;

        return toDelete.length;
    }

    /**
     * Invalide le cache pour un pattern
     * @param {string} pattern - Pattern à invalider
     * @returns {number} Nombre d'éléments invalidés
     */
    invalidate(pattern) {
        const toDelete = [];
        const regex = new RegExp(pattern, 'i');

        for (const [key, item] of this.cache) {
            if (regex.test(key)) {
                toDelete.push(key);
            }
        }

        toDelete.forEach(key => this.cache.delete(key));
        return toDelete.length;
    }

    /**
     * Vide complètement le cache
     */
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;
    }

    /**
     * Récupère les statistiques du cache
     * @returns {Object} Statistiques
     */
    getStats() {
        const hitRate = this.hits + this.misses > 0 ? 
            (this.hits / (this.hits + this.misses) * 100).toFixed(2) : 0;

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            evictions: this.evictions,
            hitRate: `${hitRate}%`,
            lastCleanup: new Date(this.lastCleanup).toISOString(),
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    /**
     * Estime l'utilisation mémoire
     * @private
     */
    estimateMemoryUsage() {
        let totalSize = 0;
        
        for (const [key, item] of this.cache) {
            // Estimation approximative
            totalSize += key.length * 2; // String
            totalSize += JSON.stringify(item.data).length * 2;
            totalSize += 100; // Métadonnées
        }

        return this.formatBytes(totalSize);
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
     * Précharge des données communes
     * @param {Array} commonData - Données communes à précharger
     */
    async preload(commonData) {
        for (const item of commonData) {
            const key = this.generateKey(item.text, item.context, item.type);
            await this.set(key, item.data);
        }
    }

    /**
     * Exporte le cache pour la persistance
     * @returns {Object} Cache sérialisable
     */
    export() {
        const data = {};
        const now = Date.now();

        for (const [key, item] of this.cache) {
            // N'exporter que les éléments non expirés
            if (now - item.timestamp < item.ttl) {
                data[key] = {
                    data: item.data,
                    timestamp: item.timestamp,
                    ttl: item.ttl
                };
            }
        }

        return {
            data,
            stats: this.getStats(),
            exportedAt: now
        };
    }

    /**
     * Importe le cache depuis une sauvegarde
     * @param {Object} exportedCache - Cache exporté
     */
    import(exportedCache) {
        if (!exportedCache || !exportedCache.data) {
            return;
        }

        this.clear();

        const now = Date.now();
        for (const [key, item] of Object.entries(exportedCache.data)) {
            // Vérifier que l'item n'est pas expiré
            if (now - item.timestamp < item.ttl) {
                this.cache.set(key, {
                    ...item,
                    lastAccessed: now,
                    hits: 0
                });
            }
        }
    }
}

// Export global
window.IntelligentCache = IntelligentCache;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntelligentCache;
}
