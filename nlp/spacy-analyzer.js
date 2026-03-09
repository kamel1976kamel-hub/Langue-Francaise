// ANALYSEUR LINGUISTIQUE SPA CY
// =================================

window.SpacyAnalyzer = {
    patterns: {
        // Erreurs de conjugaison courantes
        conjugaison: [
            { pattern: /\bil vas\b/g, correction: "il va", type: "conjugaison", rule: "aller_present", confidence: 0.95 },
            { pattern: /\bils vas\b/g, correction: "ils vont", type: "conjugaison", rule: "aller_present", confidence: 0.95 },
            { pattern: /\bel vas\b/g, correction: "elle va", type: "conjugaison", rule: "aller_present", confidence: 0.95 },
            { pattern: /\bil sont\b/g, correction: "il est", type: "conjugaison", rule: "etre_present", confidence: 0.95 },
            { pattern: /\bel sont\b/g, correction: "elles sont", type: "conjugaison", rule: "etre_present", confidence: 0.95 },
            { pattern: /\bil faut\b/g, correction: "il faut", type: "conjugaison", rule: "falloir_present", confidence: 0.95 },
            { pattern: /\bil font\b/g, correction: "ils font", type: "conjugaison", rule: "faire_present", confidence: 0.95 },
            { pattern: /\bel font\b/g, correction: "elles font", type: "conjugaison", rule: "faire_present", confidence: 0.95 },
            
            // Règles supplémentaires depuis spacy-rules-conjugaison-fixed.js
            { pattern: /\bnous vas\b/g, correction: "nous allons", type: "conjugaison", rule: "aller_present", confidence: 0.95 },
            { pattern: /\bvous vas\b/g, correction: "vous allez", type: "conjugaison", rule: "aller_present", confidence: 0.95 },
            { pattern: /\bil sommes\b/g, correction: "nous sommes", type: "conjugaison", rule: "etre_present", confidence: 0.95 },
            { pattern: /\bil etes\b/g, correction: "vous êtes", type: "conjugaison", rule: "etre_present", confidence: 0.95 },
            
            // Accords sujet-verbe simplifiés
            { pattern: /\bles enfant joue\b/g, correction: "les enfants jouent", type: "conjugaison", rule: "accord_sujet_verbe", confidence: 0.90 },
            { pattern: /\bles chat mange\b/g, correction: "les chats mangent", type: "conjugaison", rule: "accord_sujet_verbe", confidence: 0.90 },
            { pattern: /\bles fille danse\b/g, correction: "les filles dansent", type: "conjugaison", rule: "accord_sujet_verbe", confidence: 0.90 }
        ],
        
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
        
        // Accords grammaticaux
        accords: [
            { pattern: /\bles(\w+)s\b/g, correction: "les$1", type: "accord", rule: "pluriel_masculin", confidence: 0.90 },
            { pattern: /\bla(\w+)s\b/g, correction: "la$1", type: "accord", rule: "féminin_singulier", confidence: 0.90 },
            { pattern: /\bun(\w+)s\b/g, correction: "un$1", type: "accord", rule: "masculin_singulier", confidence: 0.90 }
        ],
        
        // Ponctuation
        ponctuation: [
            { pattern: /\s+[.,!?]/g, correction: "", type: "ponctuation", rule: "espace_avant_ponctuation", confidence: 0.95 },
            { pattern: /[a-z][A-Z]/g, correction: (match) => match[0] + ' ' + match[1], type: "ponctuation", rule: "espace_mots", confidence: 0.90 }
        ]
    },

    /**
     * Analyse un texte et retourne les erreurs détectées
     */
    analyze(text) {
        console.log('🔍 SPAZY ANALYZER - DÉBUT ANALYSE');
        console.log('📝 Texte à analyser:', text);
        console.log('📏 Longueur du texte:', text.length, 'caractères');
        
        const analysis = {
            errors: [],
            suggestions: [],
            confidence: 0,
            processingTime: 0
        };
        
        const startTime = performance.now();
        console.log('⏱️ Timestamp de début:', startTime);
        
        // Analyser chaque type de pattern
        console.log('🔧 DÉBUT ANALYSE DES PATTERNS');
        Object.keys(this.patterns).forEach((category, categoryIndex) => {
            console.log(`📂 Catégorie ${categoryIndex + 1}/${Object.keys(this.patterns).length}: ${category}`);
            console.log(`📋 Nombre de règles dans ${category}:`, this.patterns[category].length);
            
            this.patterns[category].forEach((rule, ruleIndex) => {
                console.log(`  🔍 Règle ${ruleIndex + 1}/${this.patterns[category].length}: ${rule.rule}`);
                console.log(`  🎯 Pattern:`, rule.pattern);
                console.log(`  📊 Confiance: ${rule.confidence}`);
                
                const matches = text.match(rule.pattern);
                console.log(`  🔎 Matches trouvés:`, matches ? matches.length : 0);
                
                if (matches) {
                    console.log(`  ✅ Erreurs détectées pour la règle ${rule.rule}:`);
                    matches.forEach((match, matchIndex) => {
                        console.log(`    📍 Match ${matchIndex + 1}: "${match}"`);
                        
                        const correction = typeof rule.correction === 'function' ? 
                            rule.correction(match) : rule.correction;
                        
                        console.log(`    🔄 Correction: "${correction}"`);
                        
                        const error = {
                            text: match,
                            correction: correction,
                            type: rule.type,
                            rule: rule.rule,
                            confidence: rule.confidence,
                            explanation: this.getExplanation(rule.type, rule.rule)
                        };
                        
                        console.log(`    📄 Erreur ajoutée:`, error);
                        analysis.errors.push(error);
                    });
                } else {
                    console.log(`  ✅ Aucune erreur détectée pour la règle ${rule.rule}`);
                }
            });
            
            console.log(`📊 Sous-total erreurs ${category}:`, analysis.errors.filter(e => e.type === category).length);
        });
        
        console.log('🔧 FIN ANALYSE DES PATTERNS');
        console.log('📊 Nombre total d\'erreurs détectées:', analysis.errors.length);
        
        // Calculer la confiance globale
        console.log('🧮 CALCUL DE LA CONFIANCE');
        if (analysis.errors.length === 0) {
            analysis.confidence = 1.0;
            console.log('✅ Confiance maximale: 1.0 (aucune erreur)');
        } else {
            const avgConfidence = analysis.errors.reduce((sum, error) => sum + error.confidence, 0) / analysis.errors.length;
            analysis.confidence = avgConfidence;
            console.log(`📊 Confiance calculée: ${avgConfidence.toFixed(3)} (moyenne de ${analysis.errors.length} erreurs)`);
            
            // Détail des confiances par type
            const confidenceByType = {};
            analysis.errors.forEach(error => {
                if (!confidenceByType[error.type]) {
                    confidenceByType[error.type] = [];
                }
                confidenceByType[error.type].push(error.confidence);
            });
            
            console.log('📈 Confiance par type d\'erreur:');
            Object.keys(confidenceByType).forEach(type => {
                const confidences = confidenceByType[type];
                const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
                console.log(`  ${type}: ${avg.toFixed(3)} (${confidences.length} erreurs)`);
            });
        }
        
        analysis.processingTime = performance.now() - startTime;
        console.log(`⏱️ Temps de traitement: ${analysis.processingTime.toFixed(2)}ms`);
        
        console.log('🧠 SpacyAnalyzer - Analyse terminée:', analysis);
        console.log('📊 RÉSUMÉ ANALYSE SPAZY:');
        console.log(`  📝 Texte: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        console.log(`  🔢 Erreurs: ${analysis.errors.length}`);
        console.log(`  📊 Confiance: ${(analysis.confidence * 100).toFixed(1)}%`);
        console.log(`  ⏱️ Temps: ${analysis.processingTime.toFixed(2)}ms`);
        
        return analysis;
    },

    /**
     * Retourne une explication pour un type d'erreur
     */
    getExplanation(type, rule) {
        const explanations = {
            conjugaison: "Erreur de conjugaison détectée. Vérifiez l'accord sujet-verbe.",
            anglicisms: "Anglicisme détecté. Préférez le terme français équivalent.",
            accords: "Erreur d'accord grammatical. Vérifiez genre et nombre.",
            ponctuation: "Erreur de ponctuation. Vérifiez l'espacement."
        };
        return explanations[type] || "Erreur grammaticale détectée.";
    },

    /**
     * Valide un texte et retourne un score
     */
    validate(text, level = 'intermediate') {
        const analysis = this.analyze(text);
        const validation = {
            isValid: true,
            score: 0,
            level: level,
            errors: analysis.errors,
            suggestions: analysis.suggestions,
            recommendations: []
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

    /**
     * Retourne une recommandation pour un type d'erreur
     */
    getRecommendation(errorType) {
        const recommendations = {
            conjugaison: "Vérifiez la conjugaison des verbes au temps requis.",
            anglicisms: "Évitez les anglicismes en utilisant les termes français appropriés.",
            accords: "Assurez-vous des accords corrects en genre et en nombre.",
            ponctuation: "Vérifiez la ponctuation et les espaces."
        };
        return recommendations[errorType] || "Revoyez la structure de votre phrase.";
    },

    /**
     * Corrige automatiquement un texte
     */
    correct(text) {
        let correctedText = text;
        const corrections = [];
        
        // Appliquer les corrections dans l'ordre
        Object.keys(this.patterns).forEach(category => {
            this.patterns[category].forEach(rule => {
                const originalText = correctedText;
                correctedText = correctedText.replace(rule.pattern, rule.correction);
                
                if (originalText !== correctedText) {
                    corrections.push({
                        type: rule.type,
                        rule: rule.rule,
                        original: originalText,
                        corrected: correctedText
                    });
                }
            });
        });
        
        return {
            original: text,
            corrected: correctedText,
            corrections: corrections,
            improved: text !== correctedText
        };
    }
};

// FONCTION D'ANALYSE EN TEMPS RÉEL
window.analyzeTextLocal = function(text) {
    console.log('🔍 Analyse locale du texte:', text.substring(0, 50) + '...');
    
    if (!text || text.trim().length < 3) {
        return {
            errors: [],
            explanations: [],
            suggestions: []
        };
    }
    
    const errors = [];
    const explanations = [];
    const suggestions = [];
    
    // Analyser avec les patterns de SpacyAnalyzer
    Object.keys(window.SpacyAnalyzer.patterns).forEach(category => {
        window.SpacyAnalyzer.patterns[category].forEach(rule => {
            const matches = text.match(rule.pattern);
            if (matches) {
                errors.push({
                    text: matches[0],
                    correction: rule.correction,
                    type: rule.type,
                    rule: rule.rule,
                    confidence: rule.confidence || 0.9
                });
                
                explanations.push(`Erreur de ${rule.type}: "${matches[0]}" → "${rule.correction}"`);
                suggestions.push(`Utilisez "${rule.correction}" au lieu de "${matches[0]}"`);
            }
        });
    });
    
    // Vérifier les majuscules en début de phrase
    const sentences = text.split(/[.!?]+/);
    sentences.forEach((sentence, index) => {
        const trimmed = sentence.trim();
        if (trimmed.length > 0 && index === 0) {
            // Première phrase doit commencer par majuscule
            if (trimmed[0] !== trimmed[0].toUpperCase()) {
                errors.push({
                    text: trimmed[0],
                    correction: trimmed[0].toUpperCase(),
                    type: 'majuscule',
                    rule: 'debut_phrase',
                    confidence: 0.95
                });
                explanations.push('La phrase doit commencer par une majuscule.');
                suggestions.push(`Mettez "${trimmed[0].toUpperCase()}" au début de la phrase.`);
            }
        }
    });
    
    console.log('✅ Analyse terminée:', errors.length, 'erreurs trouvées');
    
    return {
        errors: errors,
        explanations: explanations,
        suggestions: suggestions
    };
};

console.log('✅ SpacyAnalyzer chargé - Analyse linguistique française');
console.log('✅ Fonction analyzeTextLocal disponible pour l\'analyse en temps réel');
