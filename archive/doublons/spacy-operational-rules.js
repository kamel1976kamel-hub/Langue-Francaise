/**
 * =================================================================
    * CONVERSION SIMPLIFIÉE DES RÈGLES SPAcy
    * Rend les règles existantes opérationnelles rapidement
    * =================================================================
    */

console.log('🔄 Initialisation du convertisseur de règles SPAcy...');

/**
 * Crée des règles opérationnelles à partir des données existantes
 */
function createOperationalRules() {
    const rules = [];
    
    // 1. Règles d'accord de genre (priorité haute)
    rules.push({
        name: 'accord_beau_fille',
        category: 'orthographe',
        enabled: true,
        priority: 1,
        description: 'Corrige "beau fille" en "belle fille"',
        action: function(doc) {
            const errors = [];
            const text = doc.text || '';
            const tokens = doc.tokens || [];
            
            // Chercher "beau fille"
            for (let i = 0; i < tokens.length - 1; i++) {
                const token1 = tokens[i];
                const token2 = tokens[i + 1];
                
                if (token1.text.toLowerCase() === 'beau' && 
                    token2.text.toLowerCase() === 'fille') {
                    
                    errors.push({
                        type: 'accord_genre_adjectif',
                        word: 'beau fille',
                        correction: 'belle fille',
                        explanation: 'Erreur d\'accord de genre : "fille" est féminin, donc l\'adjectif doit être au féminin "belle". On dit "belle fille" et non "beau fille".',
                        offset: token1.idx || 0,
                        length: (token2.idx || 0) + (token2.length || 0) - (token1.idx || 0),
                        severity: 'high',
                        confidence: 0.95
                    });
                }
            }
            
            return errors;
        }
    });
    
    // 2. Anglicismes courants
    rules.push({
        name: 'anglicismes_courants',
        category: 'style',
        enabled: true,
        priority: 2,
        description: 'Détecte les anglicismes courants',
        action: function(doc) {
            const errors = [];
            const text = doc.text || '';
            
            const anglicismes = {
                'meeting': 'réunion',
                'deadline': 'date limite',
                'mail': 'courriel',
                'email': 'courriel',
                'challenge': 'défi',
                'week-end': 'fin de semaine',
                'parking': 'stationnement',
                'shopping': 'achats',
                'business': 'affaires',
                'manager': 'directeur',
                'team': 'équipe',
                'leader': 'leader',
                'best-seller': 'best-seller'
            };
            
            Object.entries(anglicismes).forEach(([anglicisme, francais]) => {
                const regex = new RegExp('\\b' + anglicisme + '\\b', 'gi');
                const matches = text.match(regex);
                if (matches) {
                    matches.forEach(match => {
                        const position = text.indexOf(match);
                        errors.push({
                            type: 'anglicisme',
                            word: match,
                            correction: francais,
                            explanation: `Anglicisme détecté : "${match}". Préférez le terme français "${francais}".`,
                            offset: position,
                            length: match.length,
                            severity: 'medium',
                            confidence: 0.8
                        });
                    });
                }
            });
            
            return errors;
        }
    });
    
    // 3. Erreurs de conjugaison
    rules.push({
        name: 'conjugaisons_base',
        category: 'conjugaison',
        enabled: true,
        priority: 2,
        description: 'Corrige les erreurs de conjugaison courantes',
        action: function(doc) {
            const errors = [];
            const text = doc.text || '';
            
            const conjugaisonErrors = {
                'il vas': 'il va',
                'elle vas': 'elle va',
                'ils vas': 'ils vont',
                'elles vas': 'elles vont',
                'il sont': 'ils sont',
                'elle sont': 'elles sont',
                'il ont': 'ils ont',
                'elle ont': 'elles ont',
                'il fais': 'il fait',
                'elle fais': 'elle fait'
            };
            
            Object.entries(conjugaisonErrors).forEach(([wrong, correct]) => {
                const regex = new RegExp('\\b' + wrong + '\\b', 'gi');
                const matches = text.match(regex);
                if (matches) {
                    matches.forEach(match => {
                        const position = text.indexOf(match);
                        errors.push({
                            type: 'conjugaison',
                            word: match,
                            correction: correct,
                            explanation: `Erreur de conjugaison: "${match}" → "${correct}"`,
                            offset: position,
                            length: match.length,
                            severity: 'high',
                            confidence: 0.9
                        });
                    });
                }
            });
            
            return errors;
        }
    });
    
    // 4. Erreurs de vocabulaire
    rules.push({
        name: 'vocabulaire_base',
        category: 'vocabulaire',
        enabled: true,
        priority: 3,
        description: 'Corrige les erreurs de vocabulaire courantes',
        action: function(doc) {
            const errors = [];
            const text = doc.text || '';
            
            const vocabulaireErrors = {
                'en faite': 'en fait',
                'a la': 'à la',
                'au jourdhui': 'aujourd\'hui',
                'peut etre': 'peut-être',
                'quelque soit': 'quel que soit',
                'malgres': 'malgré',
                'tout a fait': 'tout à fait'
            };
            
            Object.entries(vocabulaireErrors).forEach(([wrong, correct]) => {
                const regex = new RegExp('\\b' + wrong + '\\b', 'gi');
                const matches = text.match(regex);
                if (matches) {
                    matches.forEach(match => {
                        const position = text.indexOf(match);
                        errors.push({
                            type: 'vocabulaire',
                            word: match,
                            correction: correct,
                            explanation: `Erreur de vocabulaire: "${match}" → "${correct}"`,
                            offset: position,
                            length: match.length,
                            severity: 'medium',
                            confidence: 0.7
                        });
                    });
                }
            });
            
            return errors;
        }
    });
    
    // 5. Confusions orthographiques (si disponibles)
    if (window.orthoConfusions) {
        rules.push({
            name: 'confusions_orthographiques',
            category: 'orthographe',
            enabled: true,
            priority: 3,
            description: 'Corrige les confusions orthographiques',
            action: function(doc) {
                const errors = [];
                const text = doc.text || '';
                
                Object.entries(window.orthoConfusions).forEach(([wrong, correct]) => {
                    const regex = new RegExp('\\b' + wrong + '\\b', 'gi');
                    const matches = text.match(regex);
                    if (matches) {
                        matches.forEach(match => {
                            const position = text.indexOf(match);
                            errors.push({
                                type: 'orthographe_confusion',
                                word: match,
                                correction: correct.correction || correct,
                                explanation: correct.explanation || `Erreur d'orthographe: "${match}" → "${correct.correction || correct}"`,
                                offset: position,
                                length: match.length,
                                severity: 'high',
                                confidence: 0.9
                            });
                        });
                    }
                });
                
                return errors;
            }
        });
    }
    
    return rules;
}

/**
 * Initialise les règles opérationnelles
 */
function initializeOperationalRules() {
    console.log('🚀 Initialisation des règles opérationnelles...');
    
    try {
        // Créer les règles
        const rules = createOperationalRules();
        
        // Stocker globalement
        window.operationalSpacyRules = rules;
        
        console.log(`✅ ${rules.length} règles opérationnelles créées`);
        
        // Afficher les règles par catégorie
        const byCategory = {};
        rules.forEach(rule => {
            if (!byCategory[rule.category]) {
                byCategory[rule.category] = [];
            }
            byCategory[rule.category].push(rule);
        });
        
        console.log('📊 Répartition par catégorie:');
        Object.keys(byCategory).forEach(category => {
            console.log(`  ${category}: ${byCategory[category].length} règles`);
        });
        
        return rules;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        return [];
    }
}

/**
 * Test des règles opérationnelles
 */
function testOperationalRules() {
    console.log('🧪 Test des règles opérationnelles...');
    
    if (!window.operationalSpacyRules) {
        console.log('❌ Aucune règle opérationnelle à tester');
        return;
    }
    
    const testTexts = [
        "c'est la beau fille",
        "j'ai un meeting important",
        "il vas à l'école",
        "en faite je pense que",
        "deadline pour le projet"
    ];
    
    testTexts.forEach((text, index) => {
        setTimeout(() => {
            console.log(`🧪 Test ${index + 1}: "${text}"`);
            
            const doc = {
                text: text,
                tokens: text.split(/\s+/).map((word, i) => {
                    let position = 0;
                    if (i > 0) {
                        const previousWords = text.split(/\s+/).slice(0, i);
                        const previousText = previousWords.join(' ');
                        position = text.indexOf(word, previousText.length + 1);
                    }
                    
                    return {
                        text: word,
                        lemma: word.toLowerCase(),
                        idx: position,
                        length: word.length,
                        index: i
                    };
                })
            };
            
            const errors = [];
            window.operationalSpacyRules.forEach(rule => {
                try {
                    if (rule.enabled !== false) {
                        const ruleErrors = rule.action(doc);
                        if (Array.isArray(ruleErrors)) {
                            errors.push(...ruleErrors);
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Erreur dans la règle ${rule.name}:`, error.message);
                }
            });
            
            console.log(`  🔍 ${errors.length} erreur(s) trouvée(s):`);
            errors.forEach((error, i) => {
                console.log(`    ${i + 1}. ${error.word} → ${error.correction} (${error.type})`);
            });
        }, index * 1000);
    });
}

// Export des fonctions
window.createOperationalRules = createOperationalRules;
window.initializeOperationalRules = initializeOperationalRules;
window.testOperationalRules = testOperationalRules;

// Initialisation automatique
setTimeout(() => {
    console.log('🚀 Démarrage de l\'initialisation automatique...');
    initializeOperationalRules();
    
    // Test après 2 secondes
    setTimeout(() => {
        testOperationalRules();
    }, 2000);
}, 1000);

console.log('✅ Convertisseur simplifié de règles SPAcy chargé');
