// BUNDLE DE PERFORMANCE ET OPTIMISATION
// ========================================

// Configuration globale de performance
window.PerformanceOptimizer = {
    // Cache des ressources
    cache: new Map(),
    
    // État des modules chargés
    loadedModules: new Set(),
    
    // File d'attente des opérations
    operationQueue: [],
    
    // Métriques de performance
    metrics: {
        scriptLoadTime: {},
        operationTime: {},
        cacheHitRate: 0,
        cacheMissRate: 0
    },
    
    // Optimiseur principal
    init() {
        console.log('⚡ Initialisation de l\'optimiseur de performance');
        
        // Monitoring des performances
        this.startPerformanceMonitoring();
        
        // Optimisation du chargement des scripts
        this.optimizeScriptLoading();
        
        // Mise en place du cache intelligent
        this.setupIntelligentCache();
        
        // Optimisation des opérations asynchrones
        this.optimizeAsyncOperations();
    },
    
    // Monitoring des performances
    startPerformanceMonitoring() {
        // Observer les performances du navigateur
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric(entry.name, entry.duration);
                }
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
        }
        
        // Monitoring personnalisé
        this.measurePageLoad();
        this.measureScriptExecution();
    },
    
    // Optimisation du chargement des scripts
    optimizeScriptLoading() {
        // Lazy loading pour les scripts non critiques
        const scripts = document.querySelectorAll('script[data-defer]');
        scripts.forEach(script => {
            if (!this.loadedModules.has(script.src)) {
                this.loadScriptAsync(script.src);
            }
        });
    },
    
    // Chargement asynchrone des scripts
    loadScriptAsync(src) {
        return new Promise((resolve, reject) => {
            const startTime = performance.now();
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => {
                const loadTime = performance.now() - startTime;
                this.metrics.scriptLoadTime[src] = loadTime;
                this.loadedModules.add(src);
                console.log(`⚡ Script chargé: ${src} (${loadTime.toFixed(2)}ms)`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`❌ Erreur de chargement: ${src}`);
                reject(new Error(`Failed to load ${src}`));
            };
            
            document.head.appendChild(script);
        });
    },
    
    // Cache intelligent
    setupIntelligentCache() {
        // Cache avec TTL (Time To Live)
        this.cache = {
            data: new Map(),
            ttl: new Map(),
            
            set(key, value, ttl = 300000) { // 5 minutes par défaut
                this.data.set(key, value);
                this.ttl.set(key, Date.now() + ttl);
            },
            
            get(key) {
                const expiry = this.ttl.get(key);
                if (!expiry || Date.now() > expiry) {
                    this.data.delete(key);
                    this.ttl.delete(key);
                    this.metrics.cacheMissRate++;
                    return null;
                }
                this.metrics.cacheHitRate++;
                return this.data.get(key);
            },
            
            clear() {
                this.data.clear();
                this.ttl.clear();
            }
        };
    },
    
    // Optimisation des opérations asynchrones
    optimizeAsyncOperations() {
        // File d'attente avec priorité
        this.operationQueue = {
            items: [],
            
            add(operation, priority = 'normal') {
                this.items.push({ operation, priority, timestamp: Date.now() });
                this.items.sort((a, b) => {
                    const priorities = { high: 3, normal: 2, low: 1 };
                    return priorities[b.priority] - priorities[a.priority];
                });
            },
            
            process() {
                if (this.items.length === 0) return;
                
                const { operation } = this.items.shift();
                const startTime = performance.now();
                
                return Promise.resolve(operation()).then(result => {
                    const duration = performance.now() - startTime;
                    this.recordMetric('async_operation', duration);
                    return result;
                });
            }
        };
    },
    
    // Mesure des performances
    measurePageLoad() {
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                console.log('⚡ Métriques de chargement:', {
                    domInteractive: navigation.domInteractive,
                    loadEvent: navigation.loadEvent,
                    totalTime: navigation.loadEvent - navigation.navigationStart
                });
            }
        });
    },
    
    measureScriptExecution() {
        // Wrapper pour mesurer l'exécution des fonctions
        const originalFunction = Function.prototype;
        Function.prototype = function(...args) {
            const name = this.name || 'anonymous';
            const startTime = performance.now();
            
            const result = originalFunction.apply(this, args);
            
            const duration = performance.now() - startTime;
            this.recordMetric(`function_${name}`, duration);
            
            return result;
        };
    },
    
    // Enregistrement des métriques
    recordMetric(name, value) {
        if (!this.metrics.operationTime[name]) {
            this.metrics.operationTime[name] = [];
        }
        this.metrics.operationTime[name].push(value);
        
        // Garder seulement les 100 dernières valeurs
        if (this.metrics.operationTime[name].length > 100) {
            this.metrics.operationTime[name] = this.metrics.operationTime[name].slice(-100);
        }
    },
    
    // Rapport de performance
    getPerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            cache: {
                hitRate: this.metrics.cacheHitRate,
                missRate: this.metrics.cacheMissRate,
                efficiency: (this.metrics.cacheHitRate / (this.metrics.cacheHitRate + this.metrics.cacheMissRate) * 100).toFixed(2) + '%'
            },
            scripts: {},
            operations: {}
        };
        
        // Moyennes des temps de chargement
        Object.entries(this.metrics.scriptLoadTime).forEach(([src, time]) => {
            report.scripts[src] = `${time.toFixed(2)}ms`;
        });
        
        // Moyennes des temps d'opération
        Object.entries(this.metrics.operationTime).forEach(([name, times]) => {
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            report.operations[name] = {
                average: `${avg.toFixed(2)}ms`,
                count: times.length,
                min: `${Math.min(...times).toFixed(2)}ms`,
                max: `${Math.max(...times).toFixed(2)}ms`
            };
        });
        
        return report;
    },
    
    // Nettoyage du cache
    cleanup() {
        this.cache.clear();
        console.log('🧹 Cache de performance nettoyé');
    }
};

// Optimisation des appels IA
window.OptimizedIA = {
    // Cache des réponses IA
    responseCache: new Map(),
    
    // File d'attente des requêtes
    requestQueue: [],
    
    // État des requêtes en cours
    activeRequests: new Set(),
    
    // Optimiseur IA
    init() {
        console.log('🤖 Initialisation de l\'optimiseur IA');
        
        // Intercepter les appels à demanderIA
        this.interceptIACalls();
        
        // Mettre en place le cache IA
        this.setupIACache();
        
        // Optimiser les requêtes
        this.optimizeIARequests();
    },
    
    // Intercepter les appels IA
    interceptIACalls() {
        if (window.demanderIA) {
            const originalDemanderIA = window.demanderIA;
            
            window.demanderIA = async (prompt, context) => {
                const startTime = performance.now();
                const cacheKey = this.generateCacheKey(prompt, context);
                
                // Vérifier le cache
                const cached = this.responseCache.get(cacheKey);
                if (cached) {
                    console.log('🎯 Réponse IA depuis le cache');
                    return cached;
                }
                
                // Éviter les requêtes dupliquées
                const requestKey = `${prompt}_${context}`;
                if (this.activeRequests.has(requestKey)) {
                    console.log('⏳ Requête IA déjà en cours, attente...');
                    return this.waitForRequest(requestKey);
                }
                
                this.activeRequests.add(requestKey);
                
                try {
                    const response = await originalDemanderIA(prompt, context);
                    
                    // Mettre en cache
                    this.responseCache.set(cacheKey, response);
                    
                    const duration = performance.now() - startTime;
                    console.log(`⚡ Requête IA traitée en ${duration.toFixed(2)}ms`);
                    
                    return response;
                } finally {
                    this.activeRequests.delete(requestKey);
                }
            };
        }
    },
    
    // Cache IA avec TTL
    setupIACache() {
        this.responseCache = {
            data: new Map(),
            ttl: new Map(),
            
            set(key, value) {
                this.data.set(key, value);
                this.ttl.set(key, Date.now() + 600000); // 10 minutes
            },
            
            get(key) {
                const expiry = this.ttl.get(key);
                if (!expiry || Date.now() > expiry) {
                    this.data.delete(key);
                    this.ttl.delete(key);
                    return null;
                }
                return this.data.get(key);
            },
            
            clear() {
                this.data.clear();
                this.ttl.clear();
            }
        };
    },
    
    // Optimiser les requêtes
    optimizeIARequests() {
        // Batch processing pour les requêtes multiples
        this.requestQueue = {
            items: [],
            processing: false,
            
            add(request) {
                this.items.push(request);
                this.process();
            },
            
            async process() {
                if (this.processing || this.items.length === 0) return;
                
                this.processing = true;
                
                while (this.items.length > 0) {
                    const request = this.items.shift();
                    try {
                        await request();
                    } catch (error) {
                        console.error('❌ Erreur requête IA:', error);
                    }
                }
                
                this.processing = false;
            }
        };
    },
    
    // Générer clé de cache
    generateCacheKey(prompt, context) {
        const combined = `${prompt}_${context}`;
        return btoa(combined).substring(0, 32);
    },
    
    // Attendre une requête
    waitForRequest(requestKey) {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (!this.activeRequests.has(requestKey)) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        }
    }
};

// Initialisation automatique
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser l'optimiseur de performance
    window.PerformanceOptimizer.init();
    
    // Initialiser l'optimiseur IA
    window.OptimizedIA.init();
    
    console.log('⚡ Système d\'optimisation chargé');
    
    // Afficher le rapport de performance toutes les 30 secondes
    setInterval(() => {
        const report = window.PerformanceOptimizer.getPerformanceReport();
        console.log('📊 Rapport de performance:', report);
    }, 30000);
});

// Fonction globale pour afficher les métriques
window.showPerformanceMetrics = function() {
    const report = window.PerformanceOptimizer.getPerformanceReport();
    console.table(report);
    return report;
};

// Nettoyage automatique du cache toutes les heures
setInterval(() => {
    window.PerformanceOptimizer.cleanup();
    window.OptimizedIA.responseCache.clear();
}, 3600000); // 1 heure
