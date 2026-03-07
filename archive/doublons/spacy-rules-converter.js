/**
 * =================================================================
 * CONVERSION DES RÈGLES SPAcy EXISTANTES
 * Rend les règles orthographe, vocabulaire, style, conjugaison opérationnelles
 * =================================================================
 */

/**
 * Convertit les anciennes règles au nouveau format compatible
 */
function convertLegacyRules() {
    console.log('🔄 Conversion des règles SPAcy existantes...');
    
    const convertedRules = [];
    
    // 1. Convertir les règles d'orthographe
    if (window.orthographeRules && Array.isArray(window.orthographeRules)) {
        console.log(`📝 Conversion de ${window.orthographeRules.length} règles d'orthographe...`);
        
        window.orthographeRules.forEach((rule, index) => {
            if (rule.action && typeof rule.action === 'function') {
                // La règle utilise déjà le bon format
                convertedRules.push({
                    ...rule,
                    category: rule.category || 'orthographe',
                    enabled: rule.enabled !== false,
                    priority: rule.priority || 3
                });
            } else {
                // Convertir l'ancien format
                const convertedRule = convertOrthographeRule(rule, index);
                if (convertedRule) {
                    convertedRules.push(convertedRule);
                }
            }
        });
    }
    
    // 2. Convertir les règles de style
    if (window.styleRules && Array.isArray(window.styleRules)) {
        console.log(`🎨 Conversion de ${window.styleRules.length} règles de style...`);
        
        window.styleRules.forEach((rule, index) => {
            const convertedRule = convertStyleRule(rule, index);
            if (convertedRule) {
                convertedRules.push(convertedRule);
            }
        });
    }
    
    // 3. Convertir les règles de vocabulaire
    if (window.vocabulaireRules && Array.isArray(window.vocabulaireRules)) {
        console.log(`📚 Conversion de ${window.vocabulaireRules.length} règles de vocabulaire...`);
        
        window.vocabulaireRules.forEach((rule, index) => {
            const convertedRule = convertVocabulaireRule(rule, index);
            if (convertedRule) {
                convertedRules.push(convertedRule);
            }
        });
    }
    
    // 4. Convertir les règles de conjugaison
    if (window.conjugaisonRules && Array.isArray(window.conjugaisonRules)) {
        console.log(`🔤 Conversion de ${window.conjugaisonRules.length} règles de conjugaison...`);
        
        window.conjugaisonRules.forEach((rule, index) => {
            const convertedRule = convertConjugaisonRule(rule, index);
            if (convertedRule) {
                convertedRules.push(convertedRule);
            }
        });
    }
    
    console.log(`✅ Conversion terminée: ${convertedRules.length} règles converties`);
    return convertedRules;
}

/**
 * Convertit une règle d'orthographe
 */
function convertOrthographeRule(rule, index) {
    if (!rule.pattern && !rule.action) {
        return null;
    }
    
    return {
        name: rule.name || `orthographe_${index}`,
        category: 'orthographe',
        enabled: rule.enabled !== false,
        priority: rule.priority || 3,
        description: rule.description || `Règle d'orthographe ${index}`,
        pattern: rule.pattern || null,
        action: rule.action || function(doc) {
            const errors = [];
            const text = doc.text || '';
            
            // Utiliser les confusions orthographiques si disponibles
            if (window.orthoConfusions && rule.confusions) {
                Object.entries(window.orthoConfusions).forEach(([wrong, correct]) => {
                    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
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
            }
            
            return errors;
        }
    };
}

/**
 * Convertit une règle de style
 */
function convertStyleRule(rule, index) {
    if (!rule.action && !rule.pattern) {
        return null;
    }
    
    return {
        name: rule.name || `style_${index}`,
        category: 'style',
        enabled: rule.enabled !== false,
        priority: rule.priority || 2,
        description: rule.description || `Règle de style ${index}`,
        pattern: rule.pattern || null,
        action: rule.action || function(doc) {
            const errors = [];
            const text = doc.text || '';
            
            // Anglicismes courants
            const anglicismes = {
                'challenge': 'défi',
                'deadline': 'date limite',
                'meeting': 'réunion',
                'mail': 'courriel',
                'email': 'courriel',
                'week-end': 'fin de semaine',
                'parking': 'stationnement',
                'shopping': 'achats',
                'fast-food': 'restauration rapide',
                'business': 'affaires',
                'manager': 'directeur',
                'leader': 'leader',
                'team': 'équipe',
                'best-seller': 'best-seller',
                'newsletter': 'lettre d\'information',
                'podcast': 'podcast',
                'hashtag': 'mot-dièse',
                'troll': 'troll',
                'like': 'j\'aime',
                'share': 'partager',
                'comment': 'commentaire'
            };
            
            Object.entries(anglicismes).forEach(([anglicisme, francais]) => {
                const regex = new RegExp(`\\b${anglicisme}\\b`, 'gi');
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
    };
}

/**
 * Convertit une règle de vocabulaire
 */
function convertVocabulaireRule(rule, index) {
    if (!rule.action && !rule.pattern) {
        return null;
    }
    
    return {
        name: rule.name || `vocabulaire_${index}`,
        category: 'vocabulaire',
        enabled: rule.enabled !== false,
        priority: rule.priority || 4,
        description: rule.description || `Règle de vocabulaire ${index}`,
        pattern: rule.pattern || null,
        action: rule.action || function(doc) {
            const errors = [];
            const text = doc.text || '';
            
            // Erreurs de vocabulaire courantes
            const vocabulaireErrors = {
                'en faite': 'en fait',
                'a la': 'à la',
                'du coup': 'du coup', // Accepté mais peut être amélioré
                'tout a fait': 'tout à fait',
                'peut etre': 'peut-être',
                'quelque soit': 'quel que soit',
                'autant que': 'autant que',
                'malgres': 'malgré',
                'dans la mesure du possible': 'dans la mesure du possible',
                'au jourdhui': 'aujourd\'hui',
                'a demain': 'à demain',
                'a plus tard': 'à plus tard'
            };
            
            Object.entries(vocabulaireErrors).forEach(([wrong, correct]) => {
                const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
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
    };
}

/**
 * Convertit une règle de conjugaison
 */
function convertConjugaisonRule(rule, index) {
    if (!rule.action && !rule.pattern) {
        return null;
    }
    
    return {
        name: rule.name || `conjugaison_${index}`,
        category: 'conjugaison',
        enabled: rule.enabled !== false,
        priority: rule.priority || 2,
        description: rule.description || `Règle de conjugaison ${index}`,
        pattern: rule.pattern || null,
        action: rule.action || function(doc) {
            const errors = [];
            const text = doc.text || '';
            
            // Erreurs de conjugaison courantes
            const conjugaisonErrors = {
                'je vais': 'je vais',
                'tu vas': 'tu vas',
                'il vas': 'il va',
                'elle vas': 'elle va',
                'nous vas': 'nous allons',
                'vous vas': 'vous allez',
                'ils vas': 'ils vont',
                'elles vas': 'elles vont',
                'il sont': 'ils sont',
                'elle sont': 'elles sont',
                'il ont': 'ils ont',
                'elle ont': 'elles ont',
                'il fais': 'il fait',
                'elle fais': 'elle fait',
                'il a fais': 'il a fait',
                'elle a fais': 'elle a fait'
            };
            
            Object.entries(conjugaisonErrors).forEach(([wrong, correct]) => {
                const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
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
    };
}

/**
 * Remplace les règles existantes par les versions converties
 */
function replaceLegacyRules() {
    console.log('🔄 Remplacement des règles SPAcy existantes...');
    
    try {
        // Convertir toutes les règles
        const convertedRules = convertLegacyRules();
        
        if (convertedRules.length === 0) {
            console.warn('⚠️ Aucune règle à convertir');
            return;
        }
        
        // Mettre à jour les variables globales
        window.convertedSpacyRules = convertedRules;
        
        // Compter par catégorie
        const byCategory = {};
        convertedRules.forEach(rule => {
            if (!byCategory[rule.category]) {
                byCategory[rule.category] = 0;
            }
            byCategory[rule.category]++;
        });
        
        console.log('📊 Répartition des règles converties:');
        Object.keys(byCategory).forEach(category => {
            console.log(`  ${category}: ${byCategory[category]} règles`);
        });
        
        // Forcer le rechargement du chargeur de règles
        if (window.loaderState) {
            window.loaderState.loadedRules.clear();
            window.loaderState.totalRules = 0;
        }
        
        console.log('✅ Règles SPAcy converties avec succès');
        return convertedRules;
        
    } catch (error) {
        console.error('❌ Erreur lors de la conversion:', error);
        return [];
    }
}

/**
 * Test des règles converties
 */
function testConvertedRules() {
    console.log('🧪 Test des règles SPAcy converties...');
    
    if (!window.convertedSpacyRules) {
        console.log('❌ Aucune règle convertie à tester');
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
                tokens: text.split(/\s+/).map((word, i) => ({
                    text: word,
                    lemma: word.toLowerCase(),
                    idx: text.indexOf(word, i > 0 ? text.slice(0, text.indexOf(word)).split(/\s+/).join(' ').length + 1 : 0),
                    length: word.length,
                    index: i
                })),
                match: () => []
            };
            
            const errors = [];
            window.convertedSpacyRules.forEach(rule => {
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
window.convertLegacyRules = convertLegacyRules;
window.replaceLegacyRules = replaceLegacyRules;
window.testConvertedRules = testConvertedRules;

// Conversion automatique au chargement
setTimeout(() => {
    console.log('🚀 Démarrage de la conversion automatique...');
    replaceLegacyRules();
    
    // Test après 2 secondes
    setTimeout(() => {
        testConvertedRules();
    }, 2000);
}, 1000);

console.log('✅ Convertisseur de règles SPAcy chargé');
