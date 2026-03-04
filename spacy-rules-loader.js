/**
 * =================================================================
 * CHARGEUR UNIFIÉ DES RÈGLES SPACY
 * Charge et combine toutes les règles des différentes catégories
 * Architecture modulaire : style, conjugaison, orthographe, vocabulaire
 * =================================================================
 */

'use strict';

// Configuration du chargeur
const RULES_LOADER_CONFIG = {
    categories: [
        { name: 'style', global: 'styleRules', priority: 1 },
        { name: 'conjugaison', global: 'conjugaisonRules', priority: 2 },
        { name: 'orthographe', global: 'orthographeRules', priority: 3 },
        { name: 'vocabulaire', global: 'vocabulaireRules', priority: 4 }
    ],
    debug: true,
    enableStats: true
};

// État du chargeur
const loaderState = {
    loadedRules: new Map(),
    totalRules: 0,
    lastLoadTime: null,
    errors: []
};

// =================================================================
// GESTION DES ERREURS
// =================================================================

/**
 * Ajoute une erreur au journal du chargeur
 * @param {string} error - Message d'erreur
 * @param {string} context - Contexte de l'erreur
 */
function addLoaderError(error, context = 'general') {
    const errorObj = {
        message: error,
        context,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
    };
    
    loaderState.errors.push(errorObj);
    
    if (RULES_LOADER_CONFIG.debug) {
        console.error(`❌ Loader Error [${context}]:`, error);
    }
    
    // Limiter le nombre d'erreurs en mémoire
    if (loaderState.errors.length > 20) {
        loaderState.errors = loaderState.errors.slice(-10);
    }
}

/**
 * Récupère les erreurs du chargeur
 * @returns {Array} Liste des erreurs
 */
function getLoaderErrors() {
    return [...loaderState.errors];
}

// =================================================================
// CHARGEMENT DES RÈGLES
// =================================================================

/**
 * Charge toutes les règles disponibles
 * @param {Object} options - Options de chargement
 * @returns {Array} Liste des règles chargées
 */
function loadAllRules(options = {}) {
    const defaults = {
        includeDisabled: false,
        sortByPriority: true,
        validateRules: true
    };
    
    const config = { ...defaults, ...options };
    const startTime = Date.now();
    
    try {
        const allRules = [];
        const stats = {
            loaded: 0,
            failed: 0,
            byCategory: {}
        };
        
        // Charger chaque catégorie
        for (const category of RULES_LOADER_CONFIG.categories) {
            try {
                const categoryRules = loadRulesByCategory(category, config);
                
                if (categoryRules.length > 0) {
                    allRules.push(...categoryRules);
                    stats.loaded += categoryRules.length;
                    stats.byCategory[category.name] = categoryRules.length;
                    
                    if (RULES_LOADER_CONFIG.debug) {
                        console.log(`✅ ${categoryRules.length} règles de ${category.name} chargées`);
                    }
                } else {
                    stats.failed++;
                    addLoaderError(`Aucune règle trouvée pour la catégorie ${category.name}`, category.name);
                }
            } catch (error) {
                stats.failed++;
                addLoaderError(`Erreur lors du chargement de ${category.name}: ${error.message}`, category.name);
            }
        }
        
        // Trier par priorité si demandé
        if (config.sortByPriority) {
            allRules.sort((a, b) => (a.priority || 0) - (b.priority || 0));
        }
        
        // Mettre à jour l'état
        loaderState.loadedRules.clear();
        allRules.forEach(rule => {
            loaderState.loadedRules.set(rule.name || rule.id, rule);
        });
        loaderState.totalRules = allRules.length;
        loaderState.lastLoadTime = new Date().toISOString();
        
        const loadTime = Date.now() - startTime;
        
        if (RULES_LOADER_CONFIG.debug || RULES_LOADER_CONFIG.enableStats) {
            console.log(`🎯 Chargement terminé en ${loadTime}ms :`);
            console.log(`   📊 Total : ${allRules.length} règles`);
            console.log(`   ✅ Succès : ${stats.loaded} règles`);
            console.log(`   ❌ Échecs : ${stats.failed} catégories`);
            
            if (RULES_LOADER_CONFIG.enableStats) {
                console.log(`   📋 Par catégorie :`, stats.byCategory);
            }
        }
        
        return allRules;
        
    } catch (error) {
        addLoaderError(`Erreur générale lors du chargement: ${error.message}`, 'loadAllRules');
        throw error;
    }
}

/**
 * Charge les règles d'une catégorie spécifique
 * @param {Object} category - Configuration de la catégorie
 * @param {Object} options - Options de chargement
 * @returns {Array} Liste des règles de la catégorie
 */
function loadRulesByCategory(category, options = {}) {
    const { name, global } = category;
    
    // Vérifier si la variable globale existe
    if (typeof window === 'undefined') {
        addLoaderError('Environnement window non disponible', 'environment');
        return [];
    }
    
    if (!window[global]) {
        if (RULES_LOADER_CONFIG.debug) {
            console.warn(`⚠️ Catégorie ${name} non disponible (${global} non défini)`);
        }
        return [];
    }
    
    const rules = window[global];
    
    // Valider que c'est bien un tableau
    if (!Array.isArray(rules)) {
        addLoaderError(`La catégorie ${name} n'est pas un tableau`, 'validation');
        return [];
    }
    
    // Filtrer et valider les règles
    let filteredRules = rules;
    
    if (!options.includeDisabled) {
        filteredRules = filteredRules.filter(rule => rule.enabled !== false);
    }
    
    if (options.validateRules) {
        filteredRules = filteredRules.filter(rule => validateRule(rule, name));
    }
    
    // Ajouter des métadonnées
    return filteredRules.map(rule => ({
        ...rule,
        category: name,
        loadedAt: Date.now(),
        priority: rule.priority || category.priority * 10
    }));
}

/**
 * Valide une règle
 * @param {Object} rule - Règle à valider
 * @param {string} category - Catégorie de la règle
 * @returns {boolean} True si valide
 */
function validateRule(rule, category) {
    if (!rule || typeof rule !== 'object') {
        addLoaderError(`Règle invalide dans ${category}: n'est pas un objet`, 'validation');
        return false;
    }
    
    if (!rule.name && !rule.id) {
        addLoaderError(`Règle invalide dans ${category}: manque name ou id`, 'validation');
        return false;
    }
    
    if (!rule.action || typeof rule.action !== 'function') {
        addLoaderError(`Règle invalide dans ${category}: action manquante ou invalide`, 'validation');
        return false;
    }
    
    return true;
}

// =================================================================
// APPLICATION DES RÈGLES
// =================================================================

/**
 * Applique toutes les règles à un document
 * @param {Object} doc - Document spaCy
 * @param {Object} options - Options d'application
 * @returns {Array} Liste des erreurs trouvées
 */
function applyAllRules(doc, options = {}) {
    const defaults = {
        categories: null, // null = toutes
        maxErrors: 100,
        includeMetadata: true,
        sortBySeverity: true
    };
    
    const config = { ...defaults, ...options };
    
    try {
        const allRules = loadAllRules();
        const allErrors = [];
        const stats = {
            rulesApplied: 0,
            errorsFound: 0,
            byCategory: {}
        };
        
        // Filtrer les règles par catégorie si demandé
        let rulesToApply = allRules;
        if (config.categories && Array.isArray(config.categories)) {
            rulesToApply = allRules.filter(rule => config.categories.includes(rule.category));
        }
        
        // Appliquer chaque règle
        for (const rule of rulesToApply) {
            try {
                const ruleErrors = applyRule(rule, doc);
                
                if (ruleErrors && ruleErrors.length > 0) {
                    allErrors.push(...ruleErrors);
                    stats.errorsFound += ruleErrors.length;
                    
                    // Compter par catégorie
                    if (!stats.byCategory[rule.category]) {
                        stats.byCategory[rule.category] = 0;
                    }
                    stats.byCategory[rule.category] += ruleErrors.length;
                }
                
                stats.rulesApplied++;
                
            } catch (error) {
                addLoaderError(`Erreur lors de l'application de la règle ${rule.name}: ${error.message}`, 'application');
            }
        }
        
        // Limiter le nombre d'erreurs
        let finalErrors = allErrors;
        if (config.maxErrors && allErrors.length > config.maxErrors) {
            finalErrors = allErrors.slice(0, config.maxErrors);
            if (RULES_LOADER_CONFIG.debug) {
                console.warn(`⚠️ Erreurs limitées à ${config.maxErrors} sur ${allErrors.length}`);
            }
        }
        
        // Trier par sévérité si demandé
        if (config.sortBySeverity) {
            finalErrors.sort((a, b) => (b.severity || 0) - (a.severity || 0));
        }
        
        // Ajouter des métadonnées si demandé
        if (config.includeMetadata) {
            finalErrors.metadata = {
                totalErrors: allErrors.length,
                displayedErrors: finalErrors.length,
                rulesApplied: stats.rulesApplied,
                categories: stats.byCategory,
                processingTime: Date.now() - (doc.processingTime || Date.now())
            };
        }
        
        if (RULES_LOADER_CONFIG.debug) {
            console.log(`🔍 Analyse terminée : ${finalErrors.length} erreurs trouvées`);
            console.log(`   📊 Règles appliquées : ${stats.rulesApplied}`);
            console.log(`   📋 Par catégorie :`, stats.byCategory);
        }
        
        return finalErrors;
        
    } catch (error) {
        addLoaderError(`Erreur lors de l'application des règles: ${error.message}`, 'application');
        return [];
    }
}

/**
 * Applique une règle spécifique
 * @param {Object} rule - Règle à appliquer
 * @param {Object} doc - Document spaCy
 * @returns {Array} Erreurs trouvées
 */
function applyRule(rule, doc) {
    try {
        // Vérifier si la règle est activée
        if (rule.enabled === false) {
            return [];
        }
        
        // Appliquer la règle
        let errors;
        if (rule.pattern && typeof doc.match === 'function') {
            // Règle avec pattern spaCy
            const matches = doc.match(rule.pattern);
            errors = rule.action(doc, matches);
        } else {
            // Règle avec texte direct
            errors = rule.action(doc.text || doc);
        }
        
        // Normaliser le résultat
        if (!Array.isArray(errors)) {
            return [];
        }
        
        // Ajouter des métadonnées aux erreurs
        return errors.map(error => ({
            ...error,
            ruleName: rule.name || rule.id,
            ruleCategory: rule.category,
            ruleDescription: rule.description,
            timestamp: Date.now()
        }));
        
    } catch (error) {
        addLoaderError(`Erreur dans la règle ${rule.name}: ${error.message}`, 'rule');
        return [];
    }
}

// =================================================================
// UTILITAIRES
// =================================================================

/**
 * Récupère les statistiques du chargeur
 * @returns {Object} Statistiques
 */
function getLoaderStats() {
    return {
        totalRules: loaderState.totalRules,
        loadedCategories: RULES_LOADER_CONFIG.categories.length,
        lastLoadTime: loaderState.lastLoadTime,
        errors: loaderState.errors.length,
        rulesByCategory: Object.fromEntries(loaderState.loadedRules)
    };
}

/**
 * Recharge toutes les règles
 * @returns {Array} Nouvelles règles chargées
 */
function reloadAllRules() {
    loaderState.loadedRules.clear();
    loaderState.errors = [];
    return loadAllRules();
}

/**
 * Recherche une règle par nom
 * @param {string} name - Nom de la règle
 * @returns {Object|null} Règle trouvée
 */
function findRuleByName(name) {
    return loaderState.loadedRules.get(name) || null;
}

/**
 * Liste les règles par catégorie
 * @returns {Object} Règles groupées par catégorie
 */
function listRulesByCategory() {
    const rulesByCategory = {};
    
    for (const [name, rule] of loaderState.loadedRules) {
        if (!rulesByCategory[rule.category]) {
            rulesByCategory[rule.category] = [];
        }
        rulesByCategory[rule.category].push(rule);
    }
    
    return rulesByCategory;
}

// =================================================================
// EXPORTS
// =================================================================

// Export global pour compatibilité
window.SpacyRulesLoader = {
    loadAllRules,
    applyAllRules,
    reloadAllRules,
    findRuleByName,
    listRulesByCategory,
    getLoaderStats,
    getLoaderErrors,
    config: RULES_LOADER_CONFIG,
    state: loaderState
};

// Export individuels pour compatibilité
window.loadAllRules = loadAllRules;
window.applyAllRules = applyAllRules;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.SpacyRulesLoader;
}

// Initialisation
if (RULES_LOADER_CONFIG.debug) {
    console.log('🔧 Chargeur unifié de règles spaCy initialisé');
}
    
    console.log(`🔍 Application de ${allRules.length} règles sur le document...`);
    
    allRules.forEach(rule => {
        try {
            console.log(`📝 Vérification de la règle: ${rule.name}`);
            
            // Pour les règles simples (pattern null), utiliser le texte brut
            if (rule.pattern === null) {
                const text = doc.map ? doc.map(token => token.text).join(' ') : doc.toString();
                const ruleErrors = rule.action(text);
                allErrors.push(...ruleErrors);
            } else {
                // Pour les règles spaCy, utiliser le pattern matcher
                const matches = findPatternMatches(doc, rule.pattern);
                
                if (matches.length > 0) {
                    console.log(`🎯 ${matches.length} correspondances trouvées pour ${rule.name}`);
                    
                    const ruleErrors = rule.action(doc, matches);
                    allErrors.push(...ruleErrors);
                }
            }
            
        } catch (error) {
            console.error(`❌ Erreur dans la règle ${rule.name}:`, error);
        }
    });
    
    console.log(`✅ ${allErrors.length} erreurs trouvées avec toutes les règles`);
    return allErrors;
}

// ---------------------------------------------------------------------
// UTILITAIRES
// ---------------------------------------------------------------------

function findPatternMatches(doc, pattern) {
    const matches = [];
    
    // Simulation simplifiée du pattern matching
    // En pratique, cela utiliserait le vrai matcher spaCy
    for (let i = 0; i < doc.length; i++) {
        const token = doc[i];
        if (pattern && pattern.length > 0) {
            // Vérification très simplifiée
            const firstPattern = pattern[0];
            if (firstPattern.RIGHT_ATTRS && firstPattern.RIGHT_ATTRS.POS) {
                if (token.pos === firstPattern.RIGHT_ATTRS.POS) {
                    matches.push([i]);
                }
            }
        }
    }
    
    return matches;
}

// ---------------------------------------------------------------------
// EXPORT ET INITIALISATION
// ---------------------------------------------------------------------

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadAllRules,
        applyAllRules
    };
} else if (typeof window !== 'undefined') {
    window.spacyRulesLoader = {
        loadAllRules,
        applyAllRules
    };
    
    // Charger automatiquement toutes les règles au démarrage
    window.addEventListener('DOMContentLoaded', () => {
        const rules = loadAllRules();
        console.log('🚀 Chargeur de règles spaCy initialisé avec succès');
    });
}

console.log('📦 Chargeur unifié de règles spaCy prêt');
