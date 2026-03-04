// === CHARGEUR UNIFIÉ DES RÈGLES SPACY ===
// Charge et combine toutes les règles des différentes catégories
// Architecture modulaire : style, conjugaison, orthographe, vocabulaire

console.log('🔧 Initialisation du chargeur unifié de règles spaCy...');

// ---------------------------------------------------------------------
// FONCTION DE CHARGEMENT
// ---------------------------------------------------------------------

function loadAllRules() {
    const allRules = [];
    
    // Règles de style
    if (typeof window !== 'undefined' && window.styleRules) {
        allRules.push(...window.styleRules);
        console.log(`✅ ${window.styleRules.length} règles de style chargées`);
    }
    
    // Règles de conjugaison
    if (typeof window !== 'undefined' && window.conjugaisonRules) {
        allRules.push(...window.conjugaisonRules);
        console.log(`✅ ${window.conjugaisonRules.length} règles de conjugaison chargées`);
    }
    
    // Règles d'orthographe
    if (typeof window !== 'undefined' && window.orthographeRules) {
        allRules.push(...window.orthographeRules);
        console.log(`✅ ${window.orthographeRules.length} règles d'orthographe chargées`);
    }
    
    // Règles de vocabulaire
    if (typeof window !== 'undefined' && window.vocabulaireRules) {
        allRules.push(...window.vocabulaireRules);
        console.log(`✅ ${window.vocabulaireRules.length} règles de vocabulaire chargées`);
    }
    
    // Règles complètes (fallback)
    if (typeof window !== 'undefined' && window.spacyRulesComplete) {
        allRules.push(...window.spacyRulesComplete);
        console.log(`✅ ${window.spacyRulesComplete.length} règles complètes chargées (fallback)`);
    }
    
    console.log(`🎯 Total : ${allRules.length} règles spaCy chargées et prêtes`);
    
    return allRules;
}

// ---------------------------------------------------------------------
// APPLICATION DES RÈGLES
// ---------------------------------------------------------------------

function applyAllRules(doc) {
    const allRules = loadAllRules();
    const allErrors = [];
    
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
