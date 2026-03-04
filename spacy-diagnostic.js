/**
 * =================================================================
 * DIAGNOSTIC DES RÈGLES SPAcy
 * Analyse pourquoi les règles ne s'appliquent pas correctement
 * =================================================================
 */

/**
 * Diagnostic complet du système de règles
 */
function diagnoseSpacyRules() {
    console.log('🔍 === DIAGNOSTIC COMPLET DES RÈGLES SPAcy ===');
    
    // 1. Vérifier si les fonctions globales existent
    console.log('\n📋 1. Vérification des fonctions globales:');
    const globalFunctions = [
        'loadAllRules',
        'applyAllRules',
        'applyRule',
        'specificRules',
        'orthographeRules',
        'conjugaisonRules',
        'styleRules',
        'vocabulaireRules'
    ];
    
    globalFunctions.forEach(funcName => {
        const exists = typeof window[funcName] !== 'undefined';
        const type = exists ? typeof window[funcName] : 'undefined';
        console.log(`  ${exists ? '✅' : '❌'} ${funcName}: ${type}`);
        
        if (exists && type === 'object' && Array.isArray(window[funcName])) {
            console.log(`    └─ Contient ${window[funcName].length} éléments`);
        }
    });
    
    // 2. Tester le chargement des règles
    console.log('\n📚 2. Test de chargement des règles:');
    try {
        if (typeof window.loadAllRules === 'function') {
            const allRules = window.loadAllRules();
            console.log(`  ✅ loadAllRules() retourne ${allRules.length} règles`);
            
            // Analyser par catégorie
            const byCategory = {};
            allRules.forEach(rule => {
                if (!byCategory[rule.category]) {
                    byCategory[rule.category] = [];
                }
                byCategory[rule.category].push(rule);
            });
            
            console.log('  📊 Répartition par catégorie:');
            Object.keys(byCategory).forEach(category => {
                console.log(`    ${category}: ${byCategory[category].length} règles`);
                
                // Afficher les règles spécifiques
                if (category === 'specific') {
                    byCategory[category].forEach(rule => {
                        console.log(`      🎯 ${rule.name}: ${rule.description}`);
                    });
                }
            });
        } else {
            console.log('  ❌ loadAllRules n\'est pas une fonction');
        }
    } catch (error) {
        console.error('  ❌ Erreur lors du chargement:', error.message);
    }
    
    // 3. Tester l'application des règles sur "beau fille"
    console.log('\n🧪 3. Test d\'application sur "beau fille":');
    const testText = "c'est la beau fille";
    
    try {
        // Créer un document de test
        const testDoc = createTestDocument(testText);
        console.log('  📝 Document de test créé:');
        console.log('    Texte:', testDoc.text);
        console.log('    Tokens:', testDoc.tokens.map(t => t.text));
        
        // Tester applyAllRules
        if (typeof window.applyAllRules === 'function') {
            const errors = window.applyAllRules(testDoc, { maxErrors: 20 });
            console.log(`  🔍 applyAllRules() trouve ${errors.length} erreurs`);
            
            if (errors.length > 0) {
                errors.forEach((error, index) => {
                    console.log(`    ${index + 1}. ${error.word} → ${error.correction}`);
                    console.log(`       Type: ${error.type}, Règle: ${error.ruleName}`);
                    console.log(`       Explication: ${error.explanation}`);
                });
            } else {
                console.log('  ⚠️ Aucune erreur trouvée - problème possible !');
            }
        } else {
            console.log('  ❌ applyAllRules n\'est pas disponible');
        }
        
        // Tester les règles spécifiques individuellement
        console.log('\n  🎯 Test des règles spécifiques:');
        if (window.specificRules && Array.isArray(window.specificRules)) {
            window.specificRules.forEach((rule, index) => {
                try {
                    const ruleErrors = rule.action(testDoc);
                    console.log(`    ${index + 1}. ${rule.name}: ${ruleErrors.length} erreurs`);
                    if (ruleErrors.length > 0) {
                        ruleErrors.forEach(error => {
                            console.log(`        → ${error.word} → ${error.correction}`);
                        });
                    }
                } catch (error) {
                    console.log(`    ${index + 1}. ${rule.name}: ERREUR - ${error.message}`);
                }
            });
        }
        
    } catch (error) {
        console.error('  ❌ Erreur lors du test:', error.message);
    }
    
    // 4. Vérifier l'intégration avec l'assistant d'écriture
    console.log('\n🔧 4. Vérification de l\'intégration:');
    if (window.writingAssistantSpacy) {
        console.log('  ✅ writingAssistantSpacy est disponible');
        
        // Vérifier s'il utilise les nouvelles règles
        const checkTextFunc = window.writingAssistantSpacy.checkText.toString();
        const usesNewRules = checkTextFunc.includes('window.applyAllRules');
        console.log(`  ${usesNewRules ? '✅' : '❌'} Utilise window.applyAllRules: ${usesNewRules}`);
        
        if (!usesNewRules) {
            console.log('  ⚠️ L\'assistant n\'utilise pas les nouvelles règles unifiées !');
        }
    } else {
        console.log('  ❌ writingAssistantSpacy n\'est pas disponible');
    }
    
    // 5. Test en temps réel
    console.log('\n⏱️ 5. Test en temps réel (dans 2 secondes):');
    setTimeout(() => {
        console.log('  🧪 Test en cours...');
        
        // Trouver un textarea ou input
        const textElements = document.querySelectorAll('textarea, input[type="text"]');
        if (textElements.length > 0) {
            const element = textElements[0];
            console.log(`  📝 Utilisation de l'élément: ${element.tagName}`);
            
            // Simuler la saisie
            const originalValue = element.value;
            element.value = testText;
            
            // Déclencher l'événement input
            const event = new Event('input', { bubbles: true });
            element.dispatchEvent(event);
            
            console.log('  ⌨️ Texte "beau fille" tapé, vérifiez les nuages de correction...');
            
            // Restaurer la valeur originale après 5 secondes
            setTimeout(() => {
                element.value = originalValue;
                console.log('  🔄 Valeur originale restaurée');
            }, 5000);
        } else {
            console.log('  ❌ Aucun textarea/input trouvé pour le test');
        }
    }, 2000);
    
    console.log('\n🏁 === FIN DU DIAGNOSTIC ===');
}

/**
 * Crée un document de test pour les règles
 */
function createTestDocument(text) {
    const tokens = text.split(/\s+/).map((word, index) => {
        // Calculer la position correcte
        let position = 0;
        if (index > 0) {
            const previousWords = text.split(/\s+/).slice(0, index);
            const previousText = previousWords.join(' ');
            position = text.indexOf(word, previousText.length + 1);
        }
        
        return {
            text: word,
            lemma: word.toLowerCase(),
            pos: 'UNKNOWN',
            idx: position,
            length: word.length,
            index: index
        };
    });
    
    return {
        text: text,
        tokens: tokens,
        match: function(pattern) {
            return []; // Simulation basique
        }
    };
}

/**
 * Force le rechargement de toutes les règles
 */
function reloadAllRules() {
    console.log('🔄 Rechargement forcé des règles...');
    
    try {
        // Supprimer les caches existants
        if (window.loaderState) {
            window.loaderState.loadedRules.clear();
            window.loaderState.totalRules = 0;
        }
        
        // Recharger
        if (typeof window.loadAllRules === 'function') {
            const rules = window.loadAllRules();
            console.log(`✅ ${rules.length} règles rechargées`);
            return rules;
        }
    } catch (error) {
        console.error('❌ Erreur lors du rechargement:', error);
    }
    
    return [];
}

// Export des fonctions de diagnostic
window.diagnoseSpacyRules = diagnoseSpacyRules;
window.reloadAllRules = reloadAllRules;
window.createTestDocument = createTestDocument;

// Lancer le diagnostic automatiquement
setTimeout(() => {
    console.log('🚀 Lancement du diagnostic automatique...');
    diagnoseSpacyRules();
}, 3000);

console.log('✅ Fonctions de diagnostic SPAcy chargées');
