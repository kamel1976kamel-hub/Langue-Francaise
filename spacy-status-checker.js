/**
 * =================================================================
 * VÉRIFICATION COMPLÈTE DE L'ÉTAT OPÉRATIONNEL
 * Diagnostic de toutes les règles SPAcy
 * =================================================================
 */

/**
 * Diagnostic complet de l'état opérationnel des règles
 */
function checkAllRulesOperational() {
    console.log('🔍 === VÉRIFICATION COMPLÈTE DES RÈGLES SPAcy ===');
    
    const status = {
        total: 0,
        operational: 0,
        nonOperational: 0,
        categories: {},
        details: []
    };
    
    // 1. Vérifier les règles opérationnelles
    console.log('\n🚀 1. RÈGLES OPÉRATIONNELLES:');
    if (window.operationalSpacyRules && Array.isArray(window.operationalSpacyRules)) {
        console.log(`✅ ${window.operationalSpacyRules.length} règles opérationnelles trouvées`);
        
        window.operationalSpacyRules.forEach((rule, index) => {
            const isWorking = testRuleFunction(rule);
            status.total++;
            
            if (isWorking) {
                status.operational++;
                console.log(`  ✅ ${rule.name} (${rule.category}) - OPÉRATIONNELLE`);
            } else {
                status.nonOperational++;
                console.log(`  ❌ ${rule.name} (${rule.category}) - NON OPÉRATIONNELLE`);
            }
            
            // Compter par catégorie
            if (!status.categories[rule.category]) {
                status.categories[rule.category] = { operational: 0, total: 0 };
            }
            status.categories[rule.category].total++;
            if (isWorking) {
                status.categories[rule.category].operational++;
            }
        });
    } else {
        console.log('❌ Aucune règle opérationnelle trouvée');
    }
    
    // 2. Vérifier les règles spécifiques
    console.log('\n🎯 2. RÈGLES SPÉCIFIQUES:');
    if (window.specificRules && Array.isArray(window.specificRules)) {
        console.log(`✅ ${window.specificRules.length} règles spécifiques trouvées`);
        
        window.specificRules.forEach((rule, index) => {
            const isWorking = testRuleFunction(rule);
            status.total++;
            
            if (isWorking) {
                status.operational++;
                console.log(`  ✅ ${rule.name} (${rule.category}) - OPÉRATIONNELLE`);
            } else {
                status.nonOperational++;
                console.log(`  ❌ ${rule.name} (${rule.category}) - NON OPÉRATIONNELLE`);
            }
            
            if (!status.categories[rule.category]) {
                status.categories[rule.category] = { operational: 0, total: 0 };
            }
            status.categories[rule.category].total++;
            if (isWorking) {
                status.categories[rule.category].operational++;
            }
        });
    } else {
        console.log('❌ Aucune règle spécifique trouvée');
    }
    
    // 3. Vérifier les règles originales
    console.log('\n📚 3. RÈGLES ORIGINALES:');
    const originalCategories = [
        { name: 'orthographe', global: 'orthographeRules' },
        { name: 'conjugaison', global: 'conjugaisonRules' },
        { name: 'style', global: 'styleRules' },
        { name: 'vocabulaire', global: 'vocabulaireRules' }
    ];
    
    originalCategories.forEach(category => {
        const rules = window[category.global];
        if (rules && Array.isArray(rules)) {
            console.log(`\n📖 ${category.name.toUpperCase()} (${rules.length} règles):`);
            
            rules.forEach((rule, index) => {
                const isWorking = testRuleFunction(rule);
                status.total++;
                
                if (isWorking) {
                    status.operational++;
                    console.log(`  ✅ ${rule.name || category.name + '_' + index} - OPÉRATIONNELLE`);
                } else {
                    status.nonOperational++;
                    console.log(`  ❌ ${rule.name || category.name + '_' + index} - NON OPÉRATIONNELLE`);
                }
                
                if (!status.categories[category.name]) {
                    status.categories[category.name] = { operational: 0, total: 0 };
                }
                status.categories[category.name].total++;
                if (isWorking) {
                    status.categories[category.name].operational++;
                }
            });
        } else {
            console.log(`❌ Aucune règle ${category.name} trouvée`);
        }
    });
    
    // 4. Résumé par catégorie
    console.log('\n📊 4. RÉSUMÉ PAR CATÉGORIE:');
    Object.keys(status.categories).forEach(category => {
        const catStatus = status.categories[category];
        const percentage = ((catStatus.operational / catStatus.total) * 100).toFixed(1);
        console.log(`  ${category}: ${catStatus.operational}/${catStatus.total} (${percentage}%) opérationnelles`);
    });
    
    // 5. Test global
    console.log('\n🧪 5. TEST GLOBAL:');
    const testResults = testAllRulesGlobal();
    console.log(`📝 Test sur "${testResults.text}":`);
    console.log(`  🔍 ${testResults.errors.length} erreur(s) détectée(s)`);
    testResults.errors.forEach((error, index) => {
        console.log(`    ${index + 1}. ${error.word} → ${error.correction} (${error.ruleName})`);
    });
    
    // 6. Conclusion
    const totalPercentage = status.total > 0 ? ((status.operational / status.total) * 100).toFixed(1) : 0;
    console.log('\n🏁 6. CONCLUSION:');
    console.log(`📊 Statut global: ${status.operational}/${status.total} (${totalPercentage}%) règles opérationnelles`);
    
    if (status.operational === status.total && status.total > 0) {
        console.log('🎉 ✅ TOUTES LES RÈGLES SONT OPÉRATIONNELLES !');
    } else if (status.operational > status.total * 0.8) {
        console.log('✅ LA PLUPART DES RÈGLES SONT OPÉRATIONNELLES');
    } else {
        console.log('⚠️ CERTAINES RÈGLES NE SONT PAS OPÉRATIONNELLES');
    }
    
    return status;
}

/**
 * Test si une fonction de règle fonctionne
 */
function testRuleFunction(rule) {
    try {
        if (!rule || typeof rule.action !== 'function') {
            return false;
        }
        
        // Créer un document de test simple
        const testDoc = {
            text: "test simple",
            tokens: [
                { text: "test", idx: 0, length: 4, index: 0 },
                { text: "simple", idx: 5, length: 6, index: 1 }
            ],
            match: () => []
        };
        
        // Exécuter la règle
        const result = rule.action(testDoc);
        
        // Vérifier que le résultat est un tableau
        return Array.isArray(result);
        
    } catch (error) {
        return false;
    }
}

/**
 * Test global de toutes les règles
 */
function testAllRulesGlobal() {
    const testText = "c'est la beau fille pour le meeting de demain";
    const allErrors = [];
    
    // Créer un document de test
    const testDoc = {
        text: testText,
        tokens: testText.split(/\s+/).map((word, index) => {
            let position = 0;
            if (index > 0) {
                const previousWords = testText.split(/\s+/).slice(0, index);
                const previousText = previousWords.join(' ');
                position = testText.indexOf(word, previousText.length + 1);
            }
            
            return {
                text: word,
                lemma: word.toLowerCase(),
                idx: position,
                length: word.length,
                index: index
            };
        }),
        match: () => []
    };
    
    // Tester toutes les sources de règles
    const ruleSources = [
        { name: 'Opérationnelles', rules: window.operationalSpacyRules },
        { name: 'Spécifiques', rules: window.specificRules },
        { name: 'Orthographe', rules: window.orthographeRules },
        { name: 'Conjugaison', rules: window.conjugaisonRules },
        { name: 'Style', rules: window.styleRules },
        { name: 'Vocabulaire', rules: window.vocabulaireRules }
    ];
    
    ruleSources.forEach(source => {
        if (source.rules && Array.isArray(source.rules)) {
            source.rules.forEach(rule => {
                try {
                    if (rule.enabled !== false && typeof rule.action === 'function') {
                        const errors = rule.action(testDoc);
                        if (Array.isArray(errors)) {
                            errors.forEach(error => {
                                allErrors.push({
                                    ...error,
                                    source: source.name,
                                    ruleName: rule.name || 'unknown'
                                });
                            });
                        }
                    }
                } catch (error) {
                    // Ignorer les erreurs de règles individuelles
                }
            });
        }
    });
    
    return {
        text: testText,
        errors: allErrors
    };
}

/**
 * Affiche un rapport détaillé
 */
function showDetailedReport() {
    console.log('\n📋 === RAPPORT DÉTAILLÉ ===');
    
    const status = checkAllRulesOperational();
    
    // Créer un rapport HTML
    const report = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <h2>🔍 Rapport d'état des règles SPAcy</h2>
        
        <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>📊 Statistiques globales</h3>
            <p><strong>Total:</strong> ${status.total} règles</p>
            <p><strong>Opérationnelles:</strong> ${status.operational} règles</p>
            <p><strong>Non opérationnelles:</strong> ${status.nonOperational} règles</p>
            <p><strong>Taux de réussite:</strong> ${((status.operational / status.total) * 100).toFixed(1)}%</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>📈 Répartition par catégorie</h3>
            ${Object.keys(status.categories).map(category => {
                const cat = status.categories[category];
                const percentage = ((cat.operational / cat.total) * 100).toFixed(1);
                return `
                <div style="margin: 10px 0;">
                    <strong>${category}:</strong> ${cat.operational}/${cat.total} (${percentage}%)
                    <div style="background: #ddd; height: 10px; border-radius: 5px; margin: 5px 0;">
                        <div style="background: ${percentage > 80 ? '#4CAF50' : percentage > 50 ? '#FF9800' : '#F44336'}; 
                                    width: ${percentage}%; height: 100%; border-radius: 5px;"></div>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>🧪 Test de fonctionnement</h3>
            <p>Texte test: <code>"c'est la beau fille pour le meeting de demain"</code></p>
            <p>Résultat: ${testAllRulesGlobal().errors.length} erreurs détectées</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <strong>${status.operational === status.total && status.total > 0 ? 
                '🎉 TOUTES LES RÈGLES SONT OPÉRATIONNELLES !' : 
                status.operational > status.total * 0.8 ? 
                '✅ LA PLUPART DES RÈGLES SONT OPÉRATIONNELLES' : 
                '⚠️ CERTAINES RÈGLES NÉCESSITENT UNE ATTENTION'}</strong>
        </div>
    </div>
    `;
    
    // Ouvrir dans une nouvelle fenêtre
    const newWindow = window.open('', '_blank');
    newWindow.document.write(report);
    newWindow.document.close();
    
    return status;
}

// Export des fonctions
window.checkAllRulesOperational = checkAllRulesOperational;
window.showDetailedReport = showDetailedReport;
window.testAllRulesGlobal = testAllRulesGlobal;

// Lancer la vérification automatiquement
setTimeout(() => {
    console.log('🚀 Lancement de la vérification automatique...');
    checkAllRulesOperational();
}, 2000);

console.log('✅ Vérificateur d\'état des règles SPAcy chargé');
