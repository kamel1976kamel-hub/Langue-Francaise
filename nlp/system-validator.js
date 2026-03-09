// === VALIDATEUR AUTOMATIQUE DE COHÉRENCE DU SYSTÈME NLP ===
// Vérifie la cohérence entre tous les fichiers du dossier NLP

console.log('🔍 Initialisation du validateur de cohérence du système NLP');

// État du système
const systemState = {
    validated: false,
    errors: [],
    warnings: [],
    recommendations: []
};

// Validation de la structure des règles
function validateRuleStructure(rule, fileName, index) {
    const errors = [];
    const warnings = [];
    
    // Champs obligatoires
    if (!rule.id) errors.push(`Règle ${index}: Champ 'id' manquant`);
    if (!rule.name) errors.push(`Règle ${index}: Champ 'name' manquant`);
    if (!rule.pattern) errors.push(`Règle ${index}: Champ 'pattern' manquant`);
    if (!rule.correction && !rule.replacement) errors.push(`Règle ${index}: Champ 'correction' ou 'replacement' manquant`);
    
    // Validation du pattern
    if (rule.pattern) {
        try {
            if (typeof rule.pattern === 'string') {
                new RegExp(rule.pattern);
            } else if (rule.pattern instanceof RegExp) {
                // Valide
            } else {
                warnings.push(`Règle ${index}: Pattern doit être une chaîne ou une RegExp`);
            }
        } catch (regexError) {
            errors.push(`Règle ${index}: Pattern regex invalide - ${regexError.message}`);
        }
    }
    
    // Cohérence des champs
    if (rule.replacement && !rule.correction) {
        warnings.push(`Règle ${index}: Utilise 'replacement' au lieu de 'correction' - devrait être standardisé`);
    }
    
    // Priorité valide
    if (rule.priority !== undefined && (typeof rule.priority !== 'number' || rule.priority < 0 || rule.priority > 100)) {
        warnings.push(`Règle ${index}: Priority devrait être un nombre entre 0 et 100`);
    }
    
    return { errors, warnings };
}

// Validation des exports d'un fichier
function validateFileExports(fileName, expectedExports) {
    const errors = [];
    const warnings = [];
    
    expectedExports.forEach(exportName => {
        if (typeof window[exportName] === 'undefined') {
            errors.push(`Export manquant: window.${exportName}`);
        } else if (!Array.isArray(window[exportName])) {
            warnings.push(`Export ${exportName} n'est pas un tableau`);
        }
    });
    
    return { errors, warnings };
}

// Validation globale du système
window.validateNLPSystem = function() {
    console.log('🚀 Début de la validation du système NLP...');
    
    systemState.errors = [];
    systemState.warnings = [];
    systemState.recommendations = [];
    
    // 1. Validation des fichiers de règles
    const ruleFiles = [
        { name: 'styleRules', variable: 'styleRules', file: 'spacy-rules-style.js' },
        { name: 'vocabulaireRules', variable: 'vocabulaireRules', file: 'spacy-rules-vocabulaire-simple.js' },
        { name: 'conjugaisonRules', variable: 'conjugaisonRules', file: 'spacy-rules-conjugaison-simple.js' },
        { name: 'orthographeRules', variable: 'orthographeRules', file: 'spacy-rules-orthographe.js' }
    ];
    
    ruleFiles.forEach(ruleFile => {
        console.log(`📋 Validation de ${ruleFile.file}...`);
        
        if (typeof window[ruleFile.variable] === 'undefined') {
            systemState.errors.push(`Fichier ${ruleFile.file}: Export ${ruleFile.variable} non trouvé`);
            return;
        }
        
        const rules = window[ruleFile.variable];
        if (!Array.isArray(rules)) {
            systemState.errors.push(`Fichier ${ruleFile.file}: ${ruleFile.variable} n'est pas un tableau`);
            return;
        }
        
        // Valider chaque règle
        rules.forEach((rule, index) => {
            const validation = validateRuleStructure(rule, ruleFile.file, index);
            systemState.errors.push(...validation.errors);
            systemState.warnings.push(...validation.warnings);
        });
        
        console.log(`✅ ${ruleFile.file}: ${rules.length} règles validées`);
    });
    
    // 2. Validation des modules du pipeline
    const pipelineModules = [
        'validateRule',
        'normalizeRule',
        'loadAllRules',
        'applyRules',
        'groqAIAnalysis',
        'advancedTextAnalysis',
        'analyzeTextLocal'
    ];
    
    pipelineModules.forEach(moduleName => {
        if (typeof window[moduleName] === 'undefined') {
            systemState.warnings.push(`Module manquant: ${moduleName}`);
        }
    });
    
    // 3. Validation de la cohérence des structures
    const allRules = window.loadAllRules ? window.loadAllRules() : null;
    if (allRules) {
        Object.keys(allRules).forEach(category => {
            const categoryRules = allRules[category];
            categoryRules.forEach((rule, index) => {
                // Vérifier la cohérence des champs
                if (rule.replacement && !rule.correction) {
                    systemState.recommendations.push(`Standardiser ${category}[${index}]: remplacer 'replacement' par 'correction'`);
                }
                
                if (!rule.type) {
                    systemState.recommendations.push(`Ajouter 'type' à ${category}[${index}] pour meilleure classification`);
                }
                
                if (rule.priority === undefined) {
                    systemState.recommendations.push(`Ajouter 'priority' à ${category}[${index}] pour meilleure priorisation`);
                }
            });
        });
    }
    
    // 4. Validation des dépendances
    if (typeof window.SpacyAnalyzer !== 'undefined') {
        const requiredCategories = ['style', 'vocabulaire', 'orthographe', 'conjugaison'];
        requiredCategories.forEach(category => {
            if (!window.SpacyAnalyzer.patterns[category]) {
                systemState.warnings.push(`Catégorie manquante dans SpacyAnalyzer: ${category}`);
            }
        });
    }
    
    // Calcul du score de santé
    const totalIssues = systemState.errors.length + systemState.warnings.length + systemState.recommendations.length;
    const healthScore = Math.max(0, 100 - (systemState.errors.length * 10) - (systemState.warnings.length * 3) - (systemState.recommendations.length * 1));
    
    systemState.validated = true;
    systemState.healthScore = healthScore;
    
    // Afficher les résultats
    console.log('\n📊 RÉSULTATS DE LA VALIDATION');
    console.log('================================');
    console.log(`🎯 Score de santé: ${healthScore}/100`);
    console.log(`❌ Erreurs: ${systemState.errors.length}`);
    console.log(`⚠️  Avertissements: ${systemState.warnings.length}`);
    console.log(`💡 Recommandations: ${systemState.recommendations.length}`);
    
    if (systemState.errors.length > 0) {
        console.log('\n❌ ERREURS CRITIQUES:');
        systemState.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (systemState.warnings.length > 0) {
        console.log('\n⚠️  AVERTISSEMENTS:');
        systemState.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    if (systemState.recommendations.length > 0) {
        console.log('\n💡 RECOMMANDATIONS:');
        systemState.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
    // État final
    if (healthScore >= 90) {
        console.log('\n✅ Système en excellente état!');
    } else if (healthScore >= 70) {
        console.log('\n🟡 Système en bon état avec quelques améliorations possibles');
    } else if (healthScore >= 50) {
        console.log('\n🟠 Système nécessite des corrections');
    } else {
        console.log('\n🔴 Système nécessite des corrections critiques');
    }
    
    return systemState;
};

// Validation rapide (sans détails)
window.quickValidateNLP = function() {
    const issues = [];
    
    // Vérification basique des exports
    const requiredExports = ['styleRules', 'vocabulaireRules', 'conjugaisonRules', 'orthographeRules'];
    requiredExports.forEach(exportName => {
        if (typeof window[exportName] === 'undefined') {
            issues.push(`Export manquant: ${exportName}`);
        }
    });
    
    // Vérification des modules principaux
    const requiredModules = ['analyzeTextLocal', 'loadAllRules'];
    requiredModules.forEach(moduleName => {
        if (typeof window[moduleName] === 'undefined') {
            issues.push(`Module manquant: ${moduleName}`);
        }
    });
    
    const isHealthy = issues.length === 0;
    console.log(`🚀 Validation rapide: ${isHealthy ? '✅' : '❌'} (${issues.length} problèmes)`);
    
    if (!isHealthy) {
        console.log('Problèmes détectés:');
        issues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    return { isHealthy, issues };
};

// Auto-validation au chargement
setTimeout(() => {
    if (typeof window !== 'undefined') {
        console.log('⏱️ Validation automatique du système NLP dans 2 secondes...');
        setTimeout(() => {
            window.quickValidateNLP();
        }, 2000);
    }
}, 1000);

console.log('✅ Validateur de système NLP initialisé');
