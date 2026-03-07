// PLAN DE NETTOYAGE ET OPTIMISATION
// ===================================

// 1. FICHIERS À SUPPRIMER IMMÉDIATEMENT
const FILES_TO_DELETE = [
    'activities-broken.js',           // Doublon de activities.js
    'spacy-rules-conjugaison.js',    // Erreurs syntaxe
    'spacy-rules-vocabulaire.js',    // Erreurs syntaxe  
    'login-fix.js',                 // Obsolète
    'nettoyer-identifiants.js',      // Obsolète
    'test-enseignant.js',            // Fichier de test
    'server.js',                    // Non utilisé
    'build-tailwind.js',             // Build script
    'cloudflare-worker.js',          // Ancien worker
    'cloudflare-worker-simple.js',    // Ancien worker
    'specific-pipeline.js',          // Remplacé par fixed
    'spacy-diagnostic.js',          // Diagnostic
    'spacy-status-checker.js',       // Diagnostic
    'spacy-test-functions.js',       // Test
    'writing-assistant-spacy-lg.js'  // Conflit avec main
];

// 2. FICHIERS À CONSERVER (essentiels)
const FILES_TO_KEEP = [
    'main.js',                      // Cœur applicatif
    'activities.js',                // Gestion activités
    'index.html',                   // Interface principale
    'chat-system.js',               // Chat IA
    'audio-system.js',              // Audio
    'contextual-preloader.js',      // Préchargement
    'network-optimizer.js',         // Optimisations réseau
    'intelligent-cache.js',          // Cache intelligent
    'memory-manager.js',             // Mémoire
    'loading-indicators.js',         // UX loading
    'auto-recovery.js',             // Récupération erreurs
    'adaptive-debouncer.js',        // Débounce optimisé
    'resource-preloader.js',         // Préchargement ressources
    'progressive-loader.js',         // Chargement progressif
    'pipeline-config-interface.js',   // Configuration IA
    'pipeline-models-checker.js',   // Vérification modèles
    'streaming-pipeline.js',        // Pipeline streaming
    'specific-pipeline-fixed.js',    // Pipeline IA (version fixe)
    'rag-service.js',               // Service RAG
    'rag-setup.js',                 // Setup RAG
    'rag-huggingface.js',           // HuggingFace RAG
    'comptes-etudiants.js',        // Gestion comptes
    'ia.js',                       // Interface IA (compatibilité)
    'spacy-lg-interface.js',        // Interface spaCy (si utilisé)
    'spacy-custom-rules.js',        // Règles personnalisées
    'spacy-operational-rules.js',   // Règles opérationnelles
    'spacy-rule-examples.js',       // Exemples règles
    'spacy-rules-loader.js',        // Chargeur règles
    'spacy-rules-orthographe.js',   // Règles orthographe
    'spacy-rules-style.js',         // Règles style
    'spacy-specific-rules.js',      // Règles spécifiques
    'spacy-worker-pool.js',         // Pool workers spaCy
    'spacy-rules-converter.js',      // Conversion règles
    'spacy-rules-conjugaison-fixed.js', // Conjugaison (fix)
    'tailwind.config.js'            // Config Tailwind
];

// 3. DOUBLONS DE FONCTIONS À RÉSOUDRE
const FUNCTION_DUPLICATES = {
    'window.demanderIA': {
        files: ['main.js:431', 'main.js:858'],
        action: 'Garder la version ligne 858 (plus complète), supprimer 4-431'
    },
    'window.submitActivity': {
        files: ['activities.js', 'activities-broken.js'],
        action: 'Supprimer activities-broken.js'
    },
    'window.getActivityAnswer': {
        files: ['activities.js', 'index.html'],
        action: 'Garder uniquement dans activities.js'
    }
};

// 4. OPTIMISATIONS PERFORMANCES
const PERFORMANCE_OPTIMIZATIONS = [
    {
        name: 'Lazy Loading Scripts',
        description: 'Charger les scripts uniquement quand nécessaire',
        priority: 'HIGH',
        files: ['spacy-*.js', 'writing-assistant*.js']
    },
    {
        name: 'Script Bundling',
        description: 'Combiner les scripts similaires',
        priority: 'HIGH',
        bundles: [
            'spacy-core.js', // Tous les spaCy rules
            'ia-pipeline.js', // Tous les pipelines IA
            'utils-core.js'   // Utilitaires communs
        ]
    },
    {
        name: 'Cache Optimization',
        description: 'Optimiser le cache navigateur et serveur',
        priority: 'MEDIUM',
        actions: [
            'Version statique des assets',
            'Cache headers optimisés',
            'Service Worker pour cache offline'
        ]
    },
    {
        name: 'Async Loading',
        description: 'Chargement asynchrone des fonctionnalités',
        priority: 'MEDIUM',
        implementation: 'defer et async sur tous les scripts non critiques'
    }
];

// 5. ARCHITECTURE AMÉLIORÉE
const RECOMMENDED_ARCHITECTURE = {
    core: {
        files: ['main.js', 'activities.js', 'chat-system.js'],
        load: 'critical', // Chargement synchrone
        cache: 'permanent'
    },
    features: {
        files: ['audio-system.js', 'contextual-preloader.js'],
        load: 'defer', // Chargement différé
        cache: 'session'
    },
    advanced: {
        files: ['spacy-*.js', 'writing-assistant*.js'],
        load: 'lazy', // Chargement à la demande
        cache: 'dynamic'
    },
    optimization: {
        files: ['network-optimizer.js', 'intelligent-cache.js'],
        load: 'defer',
        cache: 'permanent'
    }
};

console.log('🔋 PLAN DE NETTOYAGE GÉNÉRÉ');
console.log('📁 Fichiers à supprimer:', FILES_TO_DELETE.length);
console.log('📁 Fichiers à conserver:', FILES_TO_KEEP.length);
console.log('🔄 Doublons à résoudre:', Object.keys(FUNCTION_DUPLICATES).length);
console.log('⚡ Optimisations à implémenter:', PERFORMANCE_OPTIMIZATIONS.length);
