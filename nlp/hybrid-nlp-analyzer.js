// 🧠 ANALYSEUR NLP HYBRIDE - BASE DE DONNÉES + IA GROQ
// Combine les règles structurées avec l'analyse IA contextuelle

console.log('🔄 Initialisation de l\'analyseur NLP hybride');

class HybridNLPAnalyzer {
    constructor() {
        this.dbRules = [];
        this.aiEnabled = false;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async initialize() {
        try {
            console.log('🚀 Initialisation de l\'analyseur hybride...');
            
            // 1. Charger les règles de la base de données
            await this.loadDatabaseRules();
            
            // 2. Tester la disponibilité de l'IA Groq
            this.aiEnabled = await this.testGroqAvailability();
            
            console.log(`✅ Analyseur hybride prêt - Règles: ${this.dbRules.length}, IA: ${this.aiEnabled ? 'activée' : 'désactivée'}`);
            
            return true;
        } catch (error) {
            console.error('❌ Erreur d\'initialisation:', error);
            return false;
        }
    }

    async loadDatabaseRules() {
        try {
            if (window.NLPDatabaseIntegration && window.NLPDatabaseIntegration.isReady) {
                // Récupérer les règles via le gestionnaire de base de données
                const dbManager = window.NLPDatabaseIntegration.dbManager;
                if (dbManager) {
                    const rules = await dbManager.getAllRules();
                    this.dbRules = rules || [];
                }
            } else if (window.BrowserSQLiteManager) {
                // Fallback direct
                const sqliteManager = new BrowserSQLiteManager();
                await sqliteManager.initialize();
                const rules = await sqliteManager.query('SELECT * FROM linguistic_rules');
                this.dbRules = rules || [];
            } else {
                // Fallback vers les règles spaCy existantes
                this.dbRules = this.convertSpacyRules();
            }
            
            console.log(`📚 ${this.dbRules.length} règles chargées depuis la base de données`);
        } catch (error) {
            console.warn('⚠️ Erreur chargement BDD, utilisation des règles spaCy:', error);
            this.dbRules = this.convertSpacyRules();
        }
    }

    convertSpacyRules() {
        const rules = [];
        
        // Convertir les règles de conjugaison spaCy
        if (window.SpacyAnalyzer && window.SpacyAnalyzer.patterns) {
            const patterns = window.SpacyAnalyzer.patterns;
            
            // Conjugaison
            if (patterns.conjugaison) {
                patterns.conjugaison.forEach((rule, index) => {
                    rules.push({
                        rule_id: `spacy_conj_${index}`,
                        name: rule.rule || `conjugaison_${index}`,
                        category: 'conjugaison',
                        pattern_type: 'regex',
                        pattern: rule.pattern.source,
                        correction: rule.correction,
                        explanation: `Erreur de conjugaison: ${rule.rule}`,
                        example: rule.pattern + ' → ' + rule.correction,
                        priority: Math.round(rule.confidence * 100)
                    });
                });
            }
            
            // Anglicismes
            if (patterns.anglicisms) {
                patterns.anglicisms.forEach((rule, index) => {
                    rules.push({
                        rule_id: `spacy_ang_${index}`,
                        name: rule.rule || `anglicisme_${index}`,
                        category: 'vocabulaire',
                        pattern_type: 'regex',
                        pattern: rule.pattern.source,
                        correction: rule.correction,
                        explanation: `Anglicisme à éviter: ${rule.rule}`,
                        example: rule.pattern + ' → ' + rule.correction,
                        priority: Math.round(rule.confidence * 100)
                    });
                });
            }
            
            // Accords
            if (patterns.accords) {
                patterns.accords.forEach((rule, index) => {
                    rules.push({
                        rule_id: `spacy_accord_${index}`,
                        name: rule.rule || `accord_${index}`,
                        category: 'orthographe',
                        pattern_type: 'regex',
                        pattern: rule.pattern.source,
                        correction: rule.correction,
                        explanation: `Erreur d'accord: ${rule.rule}`,
                        example: rule.pattern + ' → ' + rule.correction,
                        priority: Math.round(rule.confidence * 100)
                    });
                });
            }
        }
        
        return rules;
    }

    async testGroqAvailability() {
        try {
            if (!window.groqAIAnalysis) {
                console.log('⚠️ Module IA Groq non disponible');
                return false;
            }
            
            // Test avec un texte court
            const testResult = await window.groqAIAnalysis('Test rapide');
            this.aiEnabled = Array.isArray(testResult);
            
            if (this.aiEnabled) {
                console.log('🧠 IA Groq disponible et fonctionnelle');
            } else {
                console.log('⚠️ IA Groq non fonctionnelle, utilisation des règles BDD uniquement');
            }
            
            return this.aiEnabled;
        } catch (error) {
            console.warn('⚠️ Test IA Groq échoué:', error);
            return false;
        }
    }

    async analyzeText(text) {
        const cacheKey = text.substring(0, 100);
        
        // Vérifier le cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.result;
            }
        }

        const result = {
            original: text,
            corrected: text,
            corrections: [],
            stats: {
                totalRules: this.dbRules.length,
                appliedRules: 0,
                aiSuggestions: 0,
                categories: {}
            },
            processingTime: 0
        };

        const startTime = Date.now();

        try {
            // 1. Appliquer les règles de la base de données
            const dbResult = await this.applyDatabaseRules(text);
            result.corrected = dbResult.text;
            result.corrections.push(...dbResult.corrections);
            result.stats.appliedRules = dbResult.corrections.length;

            // 2. Appliquer l'analyse IA si disponible
            if (this.aiEnabled) {
                const aiResult = await this.applyAIAnalysis(dbResult.text);
                result.corrections.push(...aiResult.corrections);
                result.stats.aiSuggestions = aiResult.corrections.length;
                
                // Appliquer les suggestions IA (optionnel)
                if (aiResult.suggestions.length > 0) {
                    result.corrected = this.applyAISuggestions(dbResult.text, aiResult.suggestions);
                }
            }

            // 3. Calculer les statistiques
            this.calculateStats(result);

            result.processingTime = Date.now() - startTime;

            // Mettre en cache
            this.cache.set(cacheKey, {
                result: result,
                timestamp: Date.now()
            });

            // Nettoyer le cache si nécessaire
            if (this.cache.size > 100) {
                const oldestKey = this.cache.keys().next().value;
                this.cache.delete(oldestKey);
            }

            return result;

        } catch (error) {
            console.error('❌ Erreur lors de l\'analyse:', error);
            result.error = error.message;
            return result;
        }
    }

    async applyDatabaseRules(text) {
        const corrections = [];
        let correctedText = text;

        for (const rule of this.dbRules) {
            try {
                if (rule.pattern_type === 'regex' && rule.pattern) {
                    const regex = new RegExp(rule.pattern, 'g');
                    const matches = [...correctedText.matchAll(regex)];
                    
                    for (const match of matches) {
                        let correction = rule.correction;
                        
                        // Si la correction est une fonction, l'exécuter
                        if (typeof correction === 'function') {
                            correction = correction(match);
                        } else if (typeof correction === 'string' && match.length > 1) {
                            // Remplacer les références de capture ($1, $2, etc.)
                            correction = correction.replace(/\$(\d+)/g, (_, num) => match[parseInt(num)] || '');
                        }

                        if (correction && correction !== match[0]) {
                            corrections.push({
                                rule_id: rule.rule_id,
                                category: rule.category,
                                original: match[0],
                                corrected: correction,
                                explanation: rule.explanation,
                                example: rule.example,
                                priority: rule.priority,
                                start: match.index,
                                end: match.index + match[0].length
                            });

                            // Appliquer la correction
                            correctedText = correctedText.replace(match[0], correction);
                        }
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Erreur règle ${rule.rule_id}:`, error);
            }
        }

        return {
            text: correctedText,
            corrections: corrections
        };
    }

    async applyAIAnalysis(text) {
        if (!this.aiEnabled) {
            return { corrections: [], suggestions: [] };
        }

        try {
            const aiSuggestions = await window.groqAIAnalysisCached(text);
            
            const corrections = aiSuggestions.map(suggestion => ({
                rule_id: suggestion.rule_id,
                category: suggestion.category || 'ia',
                original: text.substring(suggestion.start, suggestion.end),
                corrected: suggestion.suggestion,
                explanation: suggestion.message,
                example: `${text.substring(suggestion.start, suggestion.end)} → ${suggestion.suggestion}`,
                priority: suggestion.priority || 70,
                start: suggestion.start,
                end: suggestion.end,
                isAISuggestion: true
            }));

            return {
                corrections: corrections,
                suggestions: aiSuggestions
            };
        } catch (error) {
            console.warn('⚠️ Erreur analyse IA:', error);
            return { corrections: [], suggestions: [] };
        }
    }

    applyAISuggestions(text, suggestions) {
        let correctedText = text;
        
        // Appliquer les suggestions dans l'ordre inverse pour ne pas perturber les positions
        suggestions
            .sort((a, b) => b.start - a.start)
            .forEach(suggestion => {
                if (suggestion.start >= 0 && suggestion.end <= correctedText.length) {
                    const before = correctedText.substring(0, suggestion.start);
                    const after = correctedText.substring(suggestion.end);
                    correctedText = before + suggestion.suggestion + after;
                }
            });
        
        return correctedText;
    }

    calculateStats(result) {
        // Statistiques par catégorie
        result.corrections.forEach(correction => {
            if (!result.stats.categories[correction.category]) {
                result.stats.categories[correction.category] = 0;
            }
            result.stats.categories[correction.category]++;
        });

        // Taux de correction
        result.stats.correctionRate = result.corrections.length > 0 ? 
            (result.corrections.length / result.original.length * 100).toFixed(2) : 0;
    }

    async getStats() {
        return {
            totalRules: this.dbRules.length,
            categories: this.getCategoriesCount(),
            aiEnabled: this.aiEnabled,
            cacheSize: this.cache.size,
            performance: this.getPerformanceStats()
        };
    }

    getCategoriesCount() {
        const categories = {};
        this.dbRules.forEach(rule => {
            if (!categories[rule.category]) {
                categories[rule.category] = 0;
            }
            categories[rule.category]++;
        });
        return categories;
    }

    getPerformanceStats() {
        const recentAnalyses = Array.from(this.cache.values()).slice(-10);
        if (recentAnalyses.length === 0) return null;

        const avgTime = recentAnalyses.reduce((sum, item) => sum + item.result.processingTime, 0) / recentAnalyses.length;
        const avgCorrections = recentAnalyses.reduce((sum, item) => sum + item.result.corrections.length, 0) / recentAnalyses.length;

        return {
            averageProcessingTime: Math.round(avgTime),
            averageCorrections: Math.round(avgCorrections * 10) / 10,
            sampleSize: recentAnalyses.length
        };
    }

    // Fonction globale pour l'intégration facile
    async correctText(text) {
        const result = await this.analyzeText(text);
        return {
            correctedText: result.corrected,
            corrections: result.corrections,
            stats: result.stats,
            processingTime: result.processingTime,
            confidence: this.calculateConfidence(result)
        };
    }

    calculateConfidence(result) {
        if (result.corrections.length === 0) return 100;
        
        // Confiance basée sur la priorité moyenne des corrections
        const avgPriority = result.corrections.reduce((sum, c) => sum + c.priority, 0) / result.corrections.length;
        const confidence = Math.max(50, Math.min(95, 100 - (100 - avgPriority) / 2));
        
        return Math.round(confidence);
    }
}

// Initialisation et export global
window.HybridNLPAnalyzer = HybridNLPAnalyzer;

// Auto-initialisation
(async function() {
    if (typeof window !== 'undefined') {
        window.hybridAnalyzer = new HybridNLPAnalyzer();
        await window.hybridAnalyzer.initialize();
        
        // Exposer la fonction globale de correction
        window.correctTextWithHybrid = async function(text) {
            return await window.hybridAnalyzer.correctText(text);
        };
        
        // Exposer la fonction de statistiques
        window.getHybridStats = async function() {
            return await window.hybridAnalyzer.getStats();
        };
        
        console.log('✅ Analyseur NLP hybride global initialisé');
    }
})();

console.log('🔄 Module d\'analyse NLP hybride chargé');
