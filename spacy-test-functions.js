/**
 * =================================================================
 * FONCTION DE TEST DES RÈGLES SPAcy
 * Teste les règles spécifiques comme "beau fille"
 * =================================================================
 */

/**
 * Teste les règles SPAcy avec un texte spécifique
 * @param {string} text - Texte à tester
 */
function testSpacyRules(text) {
    console.log('🧪 Test des règles SPAcy pour:', text);
    
    try {
        // Créer un document simple pour le test
        const doc = {
            text: text,
            tokens: text.split(/\s+/).map((token, index) => {
                const positions = [];
                let currentPos = 0;
                for (let i = 0; i < index; i++) {
                    currentPos += text.split(/\s+/)[i].length + 1;
                }
                
                return {
                    text: token,
                    idx: currentPos,
                    length: token.length,
                    index: index,
                    lemma: token.toLowerCase(),
                    pos: 'UNKNOWN'
                };
            })
        };
        
        console.log('📝 Document créé:', doc);
        
        // Charger toutes les règles
        const allRules = window.loadAllRules();
        console.log('📚 Règles chargées:', allRules.length, 'règles');
        
        // Appliquer les règles
        const errors = window.applyAllRules(doc, { maxErrors: 20 });
        console.log('❌ Erreurs trouvées:', errors.length, 'erreurs');
        
        // Afficher les erreurs en détail
        errors.forEach((error, index) => {
            console.log(`🔍 Erreur ${index + 1}:`, {
                word: error.word,
                correction: error.correction,
                explanation: error.explanation,
                type: error.type,
                severity: error.severity,
                ruleName: error.ruleName
            });
        });
        
        // Créer le nuage de correction si des erreurs sont trouvées
        if (errors.length > 0 && window.writingAssistantSpacy) {
            console.log('☁️ Création des nuages de correction...');
            
            // Trouver les éléments dans le texte
            const textElements = document.querySelectorAll('p, span, div');
            textElements.forEach(element => {
                if (element.textContent.includes(text)) {
                    console.log('🎯 Élément trouvé:', element);
                    
                    // Appliquer les erreurs sur l'élément
                    errors.forEach((error, index) => {
                        setTimeout(() => {
                            window.writingAssistantSpacy.showCorrectionCloud(error, element, index);
                        }, index * 100);
                    });
                }
            });
        }
        
        return errors;
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        return [];
    }
}

/**
 * Test spécifique pour "beau fille"
 */
function testBeauFille() {
    console.log('🧪 Test spécifique: "beau fille"');
    return testSpacyRules("c'est la beau fille");
}

/**
 * Test multiple des erreurs courantes
 */
function testMultipleErrors() {
    const testTexts = [
        "c'est la beau fille",
        "c'est un petit femme",
        "la belle jeune femme",
        "un petit garçon"
    ];
    
    testTexts.forEach((text, index) => {
        setTimeout(() => {
            console.log(`🧪 Test ${index + 1}:`, text);
            testSpacyRules(text);
        }, index * 1000);
    });
}

/**
 * Affiche l'état des règles chargées
 */
function showRulesStatus() {
    console.log('📊 État des règles SPAcy:');
    
    try {
        const allRules = window.loadAllRules();
        const rulesByCategory = {};
        
        allRules.forEach(rule => {
            if (!rulesByCategory[rule.category]) {
                rulesByCategory[rule.category] = [];
            }
            rulesByCategory[rule.category].push(rule);
        });
        
        console.log('📚 Répartition par catégorie:');
        Object.keys(rulesByCategory).forEach(category => {
            console.log(`  ${category}: ${rulesByCategory[category].length} règles`);
        });
        
        // Vérifier les règles spécifiques
        const specificRules = rulesByCategory.specific || [];
        console.log('🎯 Règles spécifiques trouvées:', specificRules.length);
        specificRules.forEach(rule => {
            console.log(`  - ${rule.name}: ${rule.description}`);
        });
        
        return rulesByCategory;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'affichage du statut:', error);
        return {};
    }
}

// Export des fonctions de test
window.testSpacyRules = testSpacyRules;
window.testBeauFille = testBeauFille;
window.testMultipleErrors = testMultipleErrors;
window.showRulesStatus = showRulesStatus;

// Auto-test au chargement
setTimeout(() => {
    console.log('🚀 Démarrage des tests automatiques...');
    showRulesStatus();
    
    // Test après 2 secondes
    setTimeout(() => {
        testBeauFille();
    }, 2000);
    
}, 1000);

console.log('✅ Fonctions de test SPAcy chargées');
