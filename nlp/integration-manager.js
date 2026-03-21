// 🚀 GESTIONNAIRE D'INTÉGRATION NLP
// Module d'intégration transparent pour l'application existante

class NLPIntegrationManager {
    constructor() {
        this.isReady = false;
        this.initializationPromise = null;
        this.fallbackMode = false;
        this.initialize();
    }

    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._initialize();
        return this.initializationPromise;
    }

    async _initialize() {
        console.log('🚀 Initialisation du gestionnaire NLP...');

        try {
            // Attendre que les scripts soient chargés
            await this.waitForScripts();
            
            // Initialiser le pipeline avancé si disponible
            if (window.initializeAdvancedPipeline) {
                const success = await window.initializeAdvancedPipeline();
                console.log('✅ Pipeline avancé initialisé:', success);
            }

            // Charger et intégrer les règles
            if (window.initializeAdvancedRules) {
                const rulesCount = await window.initializeAdvancedRules();
                console.log('📚 Règles intégrées:', rulesCount);
            }

            // Valider les règles
            if (window.loadAllRules) {
                const rules = await window.loadAllRules();
                console.log('📊 Règles chargées:', rules);
            }

            this.isReady = true;
            console.log('✅ Gestionnaire NLP prêt');

            // Notifier l'application
            this.notifyApplicationReady();

        } catch (error) {
            console.error('❌ Erreur d\'initialisation NLP:', error);
            this.fallbackMode = true;
            this.notifyApplicationFallback();
        }
    }

    waitForScripts() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (typeof window.analyzeTextLocal !== 'undefined' && typeof window.analyzeTextLocal === 'function') {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            // Timeout après 10 secondes
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('⚠️ Timeout: analyseTextLocal non disponible après 10 secondes');
                resolve();
            }, 10000);
        });
    }

    notifyApplicationReady() {
        // Notifier l'application que le système NLP est prêt
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('nlp-ready', {
                detail: { 
                    isReady: true, 
                    fallbackMode: false,
                    features: this.getAvailableFeatures()
                }
            }));
        }
    }

    notifyApplicationFallback() {
        // Notifier l'application que le système NLP est en mode fallback
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('nlp-fallback', {
                detail: { 
                    isReady: false, 
                    fallbackMode: true,
                    message: 'Système NLP en mode dégradé'
                }
            }));
        }
    }

    getAvailableFeatures() {
        return {
            textAnalysis: typeof window.analyzeTextLocal !== 'undefined' && typeof window.analyzeTextLocal === 'function',
            advancedPipeline: typeof window.advancedTextAnalysis !== 'undefined' && typeof window.advancedTextAnalysis === 'function',
            groqAI: typeof window.groqAIAnalysis !== 'undefined' && typeof window.groqAIAnalysis === 'function',
            rulesValidation: typeof window.validateRule !== 'undefined' && typeof window.validateRule === 'function',
            rulesLoading: typeof window.loadAllRules !== 'undefined' && typeof window.loadAllRules === 'function',
            spacyAnalyzer: typeof window.SpacyAnalyzer !== 'undefined' && typeof window.SpacyAnalyzer.analyze === 'function',
            integratedCorrection: typeof window.integratedCorrectionSystem !== 'undefined',
            aiPedagogicalService: typeof window.AIPedagogicalService !== 'undefined'
        };
    }

    // Interface principale de correction de texte
    async correctText(text, options = {}) {
        if (!this.isReady) {
            await this.initialize();
        }

        try {
            const result = await window.analyzeTextLocal(text, options);
            
            return {
                success: true,
                originalText: text,
                correctedText: this.applyCorrections(text, result.errors || []),
                corrections: result.errors || [],
                suggestions: result.suggestions || [],
                confidence: result.confidence || 0,
                processingTime: result.processingTime || 0,
                fallbackMode: this.fallbackMode
            };

        } catch (error) {
            console.error('Erreur de correction:', error);
            return {
                success: false,
                originalText: text,
                correctedText: text,
                corrections: [],
                error: error.message,
                fallbackMode: true
            };
        }
    }

    applyCorrections(text, corrections) {
        let correctedText = text;
        
        // Appliquer les corrections dans l'ordre inverse pour éviter les décalages
        corrections.sort((a, b) => (b.offset || 0) - (a.offset || 0));
        
        corrections.forEach(correction => {
            if (correction.text && correction.correction) {
                correctedText = correctedText.replace(correction.text, correction.correction);
            }
        });
        
        return correctedText;
    }

    // Interface simplifiée pour les corrections rapides
    async quickCorrect(text) {
        const result = await this.correctText(text);
        return result.correctedText;
    }

    // Validation de texte
    async validateText(text) {
        const result = await this.correctText(text);
        return {
            isValid: result.corrections.length === 0,
            errors: result.corrections,
            score: result.confidence
        };
    }

    // Obtenir des suggestions d'amélioration
    async getSuggestions(text) {
        const result = await this.correctText(text);
        return result.suggestions;
    }

    // Statistiques du système
    getSystemStats() {
        if (!this.isReady) {
            return { status: 'not_ready' };
        }

        const features = this.getAvailableFeatures();
        const rules = window.loadAllRules ? window.loadAllRules() : null;

        return {
            status: 'ready',
            features: features,
            rules: rules ? {
                total: Object.values(rules).reduce((sum, cat) => sum + (cat?.length || 0), 0),
                categories: Object.keys(rules).reduce((obj, key) => {
                    obj[key] = rules[key]?.length || 0;
                    return obj;
                }, {})
            } : null,
            fallbackMode: this.fallbackMode
        };
    }
}

// Créer l'instance globale
window.NLPManager = new NLPIntegrationManager();

// Interface rétrocompatible pour l'application existante
window.correctText = async (text, options) => {
    return await window.NLPManager.correctText(text, options);
};

window.quickCorrectText = async (text) => {
    return await window.NLPManager.quickCorrect(text);
};

window.validateText = async (text) => {
    return await window.NLPManager.validateText(text);
};

window.getNLPSuggestions = async (text) => {
    return await window.NLPManager.getSuggestions(text);
};

window.getNLPStats = () => {
    return window.NLPManager.getSystemStats();
};

// Événements pour l'application
window.addEventListener('load', () => {
    console.log('📚 Gestionnaire NLP chargé - En attente d\'initialisation...');
});

// Export pour Node.js si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NLPIntegrationManager;
}
