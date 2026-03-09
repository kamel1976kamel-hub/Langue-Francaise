// === VALIDATION ET CHARGEMENT DES RÈGLES ===
// Pipeline de validation stricte pour éviter les règles mal formées

console.log('🔍 Initialisation du validateur de règles linguistiques');

// Validation stricte des règles
window.validateRule = function(rule, ruleId) {
    const errors = [];
    
    // Champs obligatoires
    if (!rule.id || typeof rule.id !== 'string') {
        errors.push('ID manquant ou invalide');
    }
    
    if (!rule.pattern && !rule.regex) {
        errors.push('Pattern ou regex manquant');
    }
    
    // Accepter 'correction' ou 'replacement' pour la compatibilité
    if ((!rule.correction && !rule.replacement) || 
        (rule.correction && typeof rule.correction !== 'string' && typeof rule.correction !== 'function') || 
        (rule.replacement && typeof rule.replacement !== 'string')) {
        errors.push('Correction ou replacement manquant ou invalide');
    }
    
    // Accepter 'message' ou 'explanation' pour la compatibilité
    if ((!rule.message && !rule.explanation) || 
        (rule.message && typeof rule.message !== 'string') || 
        (rule.explanation && typeof rule.explanation !== 'string')) {
        errors.push('Message ou explication manquant ou invalide');
    }
    
    // Validation du pattern
    if (rule.pattern) {
        try {
            if (typeof rule.pattern === 'string') {
                new RegExp(rule.pattern);
            } else if (typeof rule.pattern === 'function') {
                // Fonction de correction - valide
            } else if (rule.pattern instanceof RegExp) {
                // RegExp - valide
            } else if (Array.isArray(rule.pattern)) {
                rule.pattern.forEach((p, i) => {
                    if (typeof p !== 'string') {
                        errors.push(`Pattern ${i} invalide: doit être une chaîne`);
                    } else {
                        new RegExp(p);
                    }
                });
            } else {
                errors.push('Pattern doit être une chaîne, RegExp, fonction ou tableau');
            }
        } catch (regexError) {
            errors.push(`Pattern regex invalide: ${regexError.message}`);
        }
    }
    
    // Validation de la priorité
    if (rule.priority !== undefined) {
        if (typeof rule.priority !== 'number' || rule.priority < 0 || rule.priority > 100) {
            errors.push('Priority doit être un nombre entre 0 et 100');
        }
    }
    
    // Validation des champs optionnels
    if (rule.explanation && typeof rule.explanation !== 'string') {
        errors.push('Explanation doit être une chaîne');
    }
    
    if (rule.example && typeof rule.example !== 'string') {
        errors.push('Example doit être une chaîne');
    }
    
    if (rule.replacement && typeof rule.replacement !== 'string') {
        errors.push('Replacement doit être une chaîne');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        ruleId: ruleId || 'unknown'
    };
};

// Fusion automatique de patterns tableau
window.normalizeRule = function(rule) {
    const normalized = { ...rule };
    
    // Fusionner les patterns en tableau en regex unique
    if (Array.isArray(normalized.pattern)) {
        normalized.pattern = normalized.pattern.join('|');
    }
    
    // Compiler la regex
    if (normalized.pattern && !normalized.regex) {
        try {
            normalized.regex = new RegExp(normalized.pattern, normalized.flags || 'gi');
        } catch (error) {
            console.warn(`⚠️ Impossible de compiler la regex pour ${normalized.id}:`, error.message);
            return null;
        }
    }
    
    // Valeurs par défaut
    normalized.priority = normalized.priority || 50;
    normalized.category = normalized.category || 'general';
    
    return normalized;
};

// Charger et valider les règles depuis un objet
window.loadRulesFromObject = function(rulesData, categoryName) {
    const validRules = [];
    const invalidRules = [];
    
    if (!Array.isArray(rulesData)) {
        console.warn(`⚠️ ${categoryName}: les règles ne sont pas dans un tableau`);
        return { validRules: [], invalidRules: [] };
    }
    
    rulesData.forEach((rule, index) => {
        const ruleId = rule.id || `${categoryName}_${index}`;
        const validation = window.validateRule(rule, ruleId);
        
        if (validation.isValid) {
            const normalized = window.normalizeRule(rule);
            if (normalized) {
                validRules.push(normalized);
            } else {
                invalidRules.push({ rule: rule, errors: ['Échec de la normalisation'], ruleId });
            }
        } else {
            invalidRules.push({ rule: rule, errors: validation.errors, ruleId });
        }
    });
    
    return { validRules, invalidRules };
};

// Charger les règles depuis différentes sources
window.loadAllRules = function() {
    const allRules = {
        style: [],
        vocabulaire: [],
        orthographe: [],
        conjugaison: [],
        general: []
    };
    
    const stats = {
        total: 0,
        valid: 0,
        invalid: 0,
        byCategory: {}
    };
    
    // Charger les règles de style
    if (window.styleRules) {
        const result = window.loadRulesFromObject(window.styleRules, 'style');
        allRules.style = result.validRules;
        stats.invalid += result.invalidRules.length;
        result.invalidRules.forEach(r => {
            console.warn(`⚠️ Règle de style invalide ignorée: ${r.ruleId}`, r.errors);
        });
    }
    
    // Charger les règles de vocabulaire simplifiées
    if (window.vocabulaireRules) {
        const result = window.loadRulesFromObject(window.vocabulaireRules, 'vocabulaire');
        allRules.vocabulaire = result.validRules;
        stats.invalid += result.invalidRules.length;
        result.invalidRules.forEach(r => {
            console.warn(`⚠️ Règle de vocabulaire invalide ignorée: ${r.ruleId}`, r.errors);
        });
    }
    
    // Charger les règles d'orthographe
    if (window.orthographeRules) {
        const result = window.loadRulesFromObject(window.orthographeRules, 'orthographe');
        allRules.orthographe = result.validRules;
        stats.invalid += result.invalidRules.length;
        result.invalidRules.forEach(r => {
            console.warn(`⚠️ Règle d'orthographe invalide ignorée: ${r.ruleId}`, r.errors);
        });
    }
    
    // Charger les règles de conjugaison simplifiées
    if (window.conjugaisonRules) {
        const result = window.loadRulesFromObject(window.conjugaisonRules, 'conjugaison');
        allRules.conjugaison = result.validRules;
        stats.invalid += result.invalidRules.length;
        result.invalidRules.forEach(r => {
            console.warn(`⚠️ Règle de conjugaison invalide ignorée: ${r.ruleId}`, r.errors);
        });
    }
    
    // Calculer les statistiques
    Object.keys(allRules).forEach(category => {
        const count = allRules[category].length;
        stats.byCategory[category] = count;
        stats.valid += count;
        stats.total += count;
    });
    
    console.log('📊 Statistiques de chargement des règles:');
    console.log(`   ✅ Règles valides: ${stats.valid}`);
    console.log(`   ❌ Règles invalides: ${stats.invalid}`);
    console.log(`   📈 Par catégorie:`, stats.byCategory);
    
    return allRules;
};

// Appliquer les règles sur un texte
window.applyRules = function(text, rules) {
    const results = [];
    
    if (!text || typeof text !== 'string') {
        return results;
    }
    
    Object.keys(rules).forEach(category => {
        const categoryRules = rules[category];
        
        categoryRules.forEach(rule => {
            if (!rule.regex) return;
            
            // Appliquer la regex
            let match;
            while ((match = rule.regex.exec(text)) !== null) {
                results.push({
                    rule_id: rule.id,
                    category: category,
                    message: rule.message,
                    suggestion: rule.replacement || rule.suggestion || '',
                    start: match.index,
                    end: match.index + match[0].length,
                    priority: rule.priority || 50,
                    explanation: rule.explanation || '',
                    example: rule.example || '',
                    matched_text: match[0]
                });
                
                // Éviter les boucles infinies avec les regex globales
                if (!rule.regex.global) break;
            }
        });
    });
    
    return results;
};

console.log('✅ Validateur de règles initialisé');
