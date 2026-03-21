// 🗄️ INTÉGRATION DE LA BASE DE DONNÉES NLP DANS L'APPLICATION
// Script d'initialisation automatique pour l'application principale

class NLPDatabaseIntegration {
    constructor() {
        this.isReady = false;
        this.dbManager = null;
        this.fallbackRules = null;
    }

    async initialize() {
        try {
            console.log('🚀 Initialisation de la base de données NLP pour l\'application...');
            
            // 1. Initialiser la base de données SQLite
            if (window.BrowserSQLiteManager) {
                const sqliteManager = new BrowserSQLiteManager();
                await sqliteManager.initialize();
                console.log('✅ Base de données SQLite initialisée');
                
                // 2. Configurer le gestionnaire de base de données
                this.dbManager = new DatabaseRulesManager({
                    useSQLite: true,
                    sqlitePath: 'browser',
                    cacheRules: true,
                    cacheTimeout: 300000
                });
                
                await this.dbManager.initialize();
                console.log('✅ Gestionnaire de base de données prêt');
                
                // 3. Intégrer les règles dans le système existant
                await this.integrateRules();
                
                this.isReady = true;
                console.log('✅ Base de données NLP intégrée avec succès');
                
                // 4. Notifier l'application
                this.notifyApplication();
                
            } else {
                console.warn('⚠️ BrowserSQLiteManager non disponible, utilisation du fallback');
                await this.initializeFallback();
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'intégration de la base de données:', error);
            await this.initializeFallback();
        }
    }

    async integrateRules() {
        try {
            console.log('🔍 Intégration des règles depuis la base de données...');
            
            // Charger les règles depuis la base de données
            const allRules = await this.dbManager.getAllRules();
            console.log('📋 Règles reçues du gestionnaire:', allRules);
            
            // Intégrer dans SpacyAnalyzer si disponible
            if (window.SpacyAnalyzer && window.initializeAdvancedRules) {
                const rulesCount = await window.initializeAdvancedRules();
                console.log(`✅ ${rulesCount} règles intégrées dans SpacyAnalyzer`);
            }
            
            // Rendre les règles globalement disponibles
            window.NLPRules = allRules;
            window.NLPDatabase = this.dbManager;
            
            console.log('✅ Règles NLP intégrées dans l\'application');
            console.log('📊 Détail des règles:', {
                style: allRules.style?.length || 0,
                vocabulaire: allRules.vocabulaire?.length || 0,
                conjugaison: allRules.conjugaison?.length || 0,
                orthographe: allRules.orthographe?.length || 0,
                grammaire: allRules.grammaire?.length || 0
            });
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'intégration des règles:', error);
            throw error;
        }
    }

    async initializeFallback() {
        console.log('🔄 Initialisation du mode fallback...');
        
        // Règles de fallback si la base de données n'est pas disponible
        this.fallbackRules = {
            style: [
                {
                    id: 'espace_apres_virgule',
                    name: 'espace_apres_virgule',
                    pattern: /,(\S)/g,
                    correction: ', $1',
                    explanation: 'Mettre un espace après la virgule.',
                    example: 'Bonjour,mon ami → Bonjour, mon ami'
                },
                {
                    id: 'espace_avant_point',
                    name: 'espace_avant_point',
                    pattern: /\s+([.!?])/g,
                    correction: '$1',
                    explanation: 'Pas d\'espace avant la ponctuation finale.',
                    example: 'Bonjour . → Bonjour.'
                }
            ],
            vocabulaire: [
                {
                    id: 'confusion_ca_ce',
                    name: 'confusion_ca_ce',
                    pattern: /\bça\b/g,
                    correction: 'cela',
                    explanation: 'Utiliser "cela" plutôt que "ça" dans un contexte formel.',
                    example: 'Ça va bien → Cela va bien'
                }
            ],
            conjugaison: [
                {
                    id: 'aller_present_vas',
                    name: 'aller_present_vas',
                    pattern: /\bil vas\b/g,
                    correction: 'il va',
                    explanation: 'Le verbe aller se conjugue: je vais, tu vas, il va.',
                    example: 'Il vas au marché → Il va au marché'
                },
                {
                    id: 'accord_enfant_joue',
                    name: 'accord_enfant_joue',
                    pattern: /\bles enfant\s+joue\b/g,
                    correction: 'les enfants jouent',
                    explanation: 'Accord sujet-verbe: les enfants + verbe au pluriel.',
                    example: 'Les enfant joue → Les enfants jouent'
                }
            ],
            orthographe: [
                {
                    id: 'confusion_ce_se',
                    name: 'confusion_ce_se',
                    pattern: /\bce\b(?=\s+(est|sont|sera|seront|était|étaient|fut|furent))/g,
                    correction: 'se',
                    explanation: 'Utiliser "se" pour le pronom réfléchi, "ce" pour le démonstratif.',
                    example: 'Ce lave → Se lave'
                }
            ]
        };
        
        // Rendre les règles de fallback disponibles
        window.NLPRules = this.fallbackRules;
        window.NLPDatabase = null;
        
        console.log('✅ Mode fallback initialisé avec 9 règles');
        this.isReady = true;
    }

    notifyApplication() {
        // Émettre un événement pour notifier l'application
        const event = new CustomEvent('nlp-database-ready', {
            detail: {
                isReady: this.isReady,
                hasDatabase: !!this.dbManager,
                rulesCount: Object.keys(window.NLPRules || {}).reduce((sum, cat) => sum + (window.NLPRules[cat]?.length || 0), 0)
            }
        });
        
        window.dispatchEvent(event);
        console.log('📢 Événement nlp-database-ready émis');
    }

    // Méthode utilitaire pour la correction de texte
    async correctText(text) {
        if (!this.isReady) {
            await this.initialize();
        }
        
        if (!text || typeof text !== 'string') {
            return {
                success: false,
                correctedText: text,
                corrections: [],
                error: 'Texte invalide'
            };
        }
        
        try {
            const rules = window.NLPRules || {};
            const corrections = [];
            
            console.log('🔍 Règles disponibles pour correction:', {
                style: rules.style?.length || 0,
                vocabulaire: rules.vocabulaire?.length || 0,
                conjugaison: rules.conjugaison?.length || 0,
                orthographe: rules.orthographe?.length || 0,
                grammaire: rules.grammaire?.length || 0
            });
            
            // Appliquer les règles de chaque catégorie
            ['style', 'vocabulaire', 'conjugaison', 'orthographe', 'grammaire'].forEach(category => {
                if (rules[category]) {
                    console.log(`🔍 Test des règles ${category}:`, rules[category].length);
                    rules[category].forEach((rule, index) => {
                        try {
                            if (rule.pattern && rule.correction) {
                                console.log(`🔍 Test règle ${index}: ${rule.name} - pattern:`, rule.pattern);
                                const matches = text.match(rule.pattern);
                                console.log(`📋 Résultat pour ${rule.name}:`, matches);
                                if (matches) {
                                    matches.forEach(match => {
                                        let correction;
                                        if (typeof rule.correction === 'function') {
                                            correction = rule.correction(match);
                                        } else {
                                            correction = match.replace(rule.pattern, rule.correction);
                                        }
                                        
                                        console.log(`✅ Correction trouvée: "${match}" → "${correction}"`);
                                        corrections.push({
                                            original: match,
                                            corrected: correction,
                                            rule: rule.name,
                                            category: category,
                                            explanation: rule.explanation
                                        });
                                    });
                                }
                            }
                        } catch (error) {
                            console.warn('⚠️ Erreur dans la règle:', rule.name, error);
                        }
                    });
                }
            });
            
            console.log('📊 Corrections trouvées:', corrections.length);
            
            // Appliquer les corrections
            let correctedText = text;
            corrections.forEach(correction => {
                correctedText = correctedText.replace(correction.original, correction.corrected);
            });
            
            console.log('📝 Texte corrigé:', correctedText);
            
            return {
                success: true,
                originalText: text,
                correctedText: correctedText,
                corrections: corrections,
                confidence: corrections.length > 0 ? 85 : 95,
                hasDatabase: !!this.dbManager
            };
            
        } catch (error) {
            console.error('❌ Erreur lors de la correction:', error);
            return {
                success: false,
                correctedText: text,
                corrections: [],
                error: error.message
            };
        }
    }

    // Obtenir des statistiques
    getStats() {
        if (!this.isReady) {
            return { status: 'not_ready' };
        }
        
        const rules = window.NLPRules || {};
        const stats = {
            status: 'ready',
            hasDatabase: !!this.dbManager,
            categories: {}
        };
        
        Object.keys(rules).forEach(category => {
            stats.categories[category] = rules[category]?.length || 0;
        });
        
        stats.totalRules = Object.values(stats.categories).reduce((sum, count) => sum + count, 0);
        
        return stats;
    }
}

// Initialisation automatique au chargement
window.NLPDatabaseIntegration = new NLPDatabaseIntegration();

// Écouter l'événement de chargement du DOM
document.addEventListener('DOMContentLoaded', async () => {
    // Attendre un peu pour que les autres scripts soient chargés
    setTimeout(async () => {
        try {
            await window.NLPDatabaseIntegration.initialize();
        } catch (error) {
            console.error('❌ Erreur critique lors de l\'initialisation NLP:', error);
        }
    }, 1000);
});

// Rendre la fonction de correction disponible globalement
window.correctTextWithDatabase = async (text) => {
    return await window.NLPDatabaseIntegration.correctText(text);
};

window.getNLPStats = () => {
    return window.NLPDatabaseIntegration.getStats();
};

console.log('🗄️ Script d\'intégration de la base de données NLP chargé');
