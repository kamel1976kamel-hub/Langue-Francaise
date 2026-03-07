// ANALYSEUR LINGUISTIQUE FRANÇAIS
// ==================================

window.FrenchAnalyzer = {
    patterns: {
        // Anglicismes courants
        anglicisms: [
            { pattern: /\bweek-end\b/gi, correction: "week-end", type: "anglicisme", rule: "weekend", confidence: 0.95 },
            { pattern: /\bmail\b/gi, correction: "courriel", type: "anglicisme", rule: "mail", confidence: 0.95 },
            { pattern: /\bshopping\b/gi, correction: "achats", type: "anglicisme", rule: "shopping", confidence: 0.95 },
            { pattern: /\bmeeting\b/gi, correction: "réunion", type: "anglicisme", rule: "meeting", confidence: 0.95 },
            { pattern: /\bdeadline\b/gi, correction: "date limite", type: "anglicisme", rule: "deadline", confidence: 0.95 },
            { pattern: /\bfeedback\b/gi, correction: "retour", type: "anglicisme", rule: "feedback", confidence: 0.95 },
            { pattern: /\bmanager\b/gi, correction: "gestionnaire", type: "anglicisme", rule: "manager", confidence: 0.95 }
        ],
        
        // Erreurs de conjugaison
        conjugaison: [
            { pattern: /\bil vas\b/g, correction: "il va", type: "conjugaison", rule: "aller_present", confidence: 0.95 },
            { pattern: /\bils vas\b/g, correction: "ils vont", type: "conjugaison", rule: "aller_present", confidence: 0.95 },
            { pattern: /\bel vas\b/g, correction: "elle va", type: "conjugaison", rule: "aller_present", confidence: 0.95 },
            { pattern: /\bil est\b/g, correction: "il est", type: "conjugaison", rule: "etre_present", confidence: 0.95 },
            { pattern: /\bel sont\b/g, correction: "elles sont", type: "conjugaison", rule: "etre_present", confidence: 0.95 },
            { pattern: /\bil faut\b/g, correction: "il faut", type: "conjugaison", rule: "falloir_present", confidence: 0.95 }
        ],
        
        // Accords
        accords: [
            { pattern: /\bles(\w+)s\b/g, correction: "les$1", type: "accord", rule: "pluriel_masculin", confidence: 0.90 },
            { pattern: /\bla(\w+)s\b/g, correction: "la$1", type: "accord", rule: "féminin_singulier", confidence: 0.90 },
            { pattern: /\bune(\w+)s\b/g, correction: "une$1", type: "accord", rule: "féminin_singulier", confidence: 0.90 },
            { pattern: /\bdes(\w+)x\b/g, correction: "des$1", type: "accord", rule: "pluriel_masculin", confidence: 0.85 }
        ],
        
        // Orthographe
        orthographe: [
            { pattern: /\bparrait\b/g, correction: "paraît", type: "orthographe", rule: "paraitre", confidence: 0.95 },
            { pattern: /\bcorect\b/gi, correction: "correct", type: "orthographe", rule: "correct", confidence: 0.95 },
            { pattern: /\bsavait\b/g, correction: "savait", type: "orthographe", rule: "savoir", confidence: 0.90 },
            { pattern: /\blanguage\b/gi, correction: "langue", type: "orthographe", rule: "language", confidence: 0.95 },
            { pattern: /\bconnecté\b/g, correction: "connecté", type: "orthographe", rule: "accent", confidence: 0.90 }
        ],
        
        // Participe passé avec avoir
        participePasse: [
            { pattern: /j'ai (\w+)é(s?)\s+(\w+)/g, type: "participe_passe", rule: "accord_participe_avoir", confidence: 0.85 },
            { pattern: /tu as (\w+)é(s?)\s+(\w+)/g, type: "participe_passe", rule: "accord_participe_avoir", confidence: 0.85 },
            { pattern: /il a (\w+)é(s?)\s+(\w+)/g, type: "participe_passe", rule: "accord_participe_avoir", confidence: 0.85 }
        ]
    },
    
    analyze(text) {
        const errors = [];
        const analysis = {
            text: text,
            errors: [],
            confidence: 0,
            needsAI: false,
            statistics: {
                words: text.split(/\s+/).length,
                characters: text.length,
                sentences: text.split(/[.!?]+/).length - 1
            }
        };
        
        console.log('🔍 Début analyse linguistique de:', text);
        
        // Analyser chaque catégorie
        Object.entries(this.patterns).forEach(([category, patterns]) => {
            patterns.forEach(pattern => {
                const matches = text.match(pattern.pattern);
                if (matches) {
                    const error = {
                        type: category,
                        original: matches[0],
                        correction: pattern.correction,
                        rule: pattern.rule,
                        position: text.indexOf(matches[0]),
                        confidence: pattern.confidence,
                        category: this.getCategoryName(category)
                    };
                    
                    errors.push(error);
                    console.log(`📍 Erreur détectée:`, error);
                }
            });
        });
        
        // Calculer la confiance globale
        analysis.errors = errors;
        analysis.confidence = this.calculateGlobalConfidence(errors);
        analysis.needsAI = errors.length === 0 || errors.some(e => e.confidence < 0.8);
        
        console.log('📊 Résultat analyse:', analysis);
        return analysis;
    },
    
    getCategoryName(category) {
        const names = {
            anglicisms: "Anglicisme",
            conjugaison: "Conjugaison", 
            accords: "Accord",
            orthographe: "Orthographe",
            participePasse: "Participe passé"
        };
        return names[category] || category;
    },
    
    calculateGlobalConfidence(errors) {
        if (errors.length === 0) return 0.3;
        
        const avgConfidence = errors.reduce((sum, error) => sum + error.confidence, 0) / errors.length;
        const hasHighConfidence = errors.some(e => e.confidence >= 0.9);
        
        return hasHighConfidence ? Math.min(avgConfidence + 0.1, 1.0) : avgConfidence;
    },
    
    // Fonction utilitaire pour corriger un texte
    correctText(text) {
        let correctedText = text;
        const corrections = [];
        
        Object.values(this.patterns).flat().forEach(pattern => {
            const matches = correctedText.match(pattern.pattern);
            if (matches) {
                correctedText = correctedText.replace(pattern.pattern, pattern.correction);
                corrections.push({
                    original: matches[0],
                    correction: pattern.correction,
                    type: pattern.type
                });
            }
        });
        
        return {
            original: text,
            corrected: correctedText,
            corrections: corrections,
            hasChanges: corrections.length > 0
        };
    },
    
    // Validation avancée
    validateText(text, level = 'intermediate') {
        const analysis = this.analyze(text);
        const validation = {
            isValid: true,
            score: 0,
            recommendations: [],
            level: level
        };
        
        // Calculer le score
        if (analysis.errors.length === 0) {
            validation.score = 100;
            validation.recommendations.push("Excellent ! Aucune erreur détectée.");
        } else {
            const errorPenalty = analysis.errors.reduce((sum, error) => {
                return sum + (1 - error.confidence) * 10;
            }, 0);
            
            validation.score = Math.max(0, 100 - errorPenalty);
            validation.isValid = validation.score >= 70;
            
            // Recommandations spécifiques
            const errorTypes = [...new Set(analysis.errors.map(e => e.type))];
            errorTypes.forEach(type => {
                validation.recommendations.push(this.getRecommendation(type));
            });
        }
        
        return validation;
    },
    
    getRecommendation(errorType) {
        const recommendations = {
            anglicisms: "Évitez les anglicismes en utilisant les termes français appropriés.",
            conjugaison: "Vérifiez la conjugaison des verbes au temps requis.",
            accords: "Assurez-vous des accords corrects en genre et en nombre.",
            orthographe: "Consultez un dictionnaire pour vérifier l'orthographe des mots.",
            participePasse: "Vérifiez l'accord du participe passé avec l'auxiliaire avoir."
        };
        
        return recommendations[errorType] || "Revoyez les règles de grammaire française.";
    }
};

console.log('✅ Analyseur linguistique français chargé');
