// AMÉLIORATIONS ACTIVITÉS IA
// ==========================

window.ActivitiesOptimized = {
    // Cache des contextes d'activités
    activityContextCache: new Map(),
    
    // Templates de contexte par type d'activité
    contextTemplates: {
        'tri-inductif': {
            instructions: "Analyse cette réponse en tenant compte de la classification des types de textes. Évalue la pertinence des catégories proposées et la cohérence des justifications.",
            focus_points: ["types de textes", "indices linguistiques", "pertinence classification", "cohérence arguments"],
            evaluation_criteria: ["exactitude classification", "qualité justifications", "compréhension critères"]
        },
        'definir-sujet': {
            instructions: "Évalue la clarté et la précision de la définition du sujet. Vérifie si les limites, le domaine et l'objectif sont bien identifiés.",
            focus_points: ["précision sujet", "délimitation champ", "clarté définition", "pertinence objectif"],
            evaluation_criteria: ["clarté expression", "précision terminologique", "cohérence structure"]
        },
        'causes-consequences': {
            instructions: "Analyse la pertinence et la validité des relations de causalité identifiées. Vérifie si les liens logiques sont bien établis.",
            focus_points: ["relations causales", "validité liens", "profondeur analyse", "cohérence logique"],
            evaluation_criteria: ["pertinence causes", "validité conséquences", "logique enchaînement"]
        },
        'exemples-analogies': {
            instructions: "Évalue la pertinence et l'efficacité des exemples et analogies proposés. Suggère des améliorations si nécessaire.",
            focus_points: ["pertinence exemples", "qualité analogies", "force démonstrative", "originalité"],
            evaluation_criteria: ["pertinence", "clarté", "force argumentative", "originalité"]
        },
        'synthese-claire': {
            instructions: "Évalue la complétude, la clarté et la structure de la synthèse. Vérifie si les idées essentielles sont bien intégrées.",
            focus_points: ["complétude contenu", "clarté expression", "structure logique", "qualité conclusion"],
            evaluation_criteria: ["exhaustivité", "clarté", "cohérence", "pertinence conclusion"]
        }
    },
    
    // Analyse locale améliorée pour activités
    async analyzeActivityResponse(answer, activityType) {
        console.log(`🔍 Analyse activité ${activityType}:`, answer);
        
        // 1. Analyse linguistique de base
        const linguisticAnalysis = await window.SpacyAnalyzer?.analyze(answer) || { errors: [], confidence: 0 };
        
        // 2. Analyse spécifique au type d'activité
        const specificAnalysis = this.analyzeByActivityType(answer, activityType);
        
        // 3. Analyse structurelle
        const structuralAnalysis = this.analyzeStructure(answer, activityType);
        
        return {
            linguistic: linguisticAnalysis,
            specific: specificAnalysis,
            structural: structuralAnalysis,
            overall_confidence: this.calculateOverallConfidence(linguisticAnalysis, specificAnalysis, structuralAnalysis)
        };
    },
    
    // Analyse spécifique par type d'activité
    analyzeByActivityType(answer, activityType) {
        const template = this.contextTemplates[activityType];
        if (!template) return { score: 0.5, feedback: [] };
        
        const analysis = {
            score: 0.5,
            feedback: [],
            strengths: [],
            weaknesses: []
        };
        
        // Analyse de la longueur (adaptée au type)
        const wordCount = answer.split(/\s+/).length;
        const expectedLength = this.getExpectedLength(activityType);
        
        if (wordCount < expectedLength.min) {
            analysis.weaknesses.push("Réponse trop courte, manque de développement");
            analysis.score -= 0.2;
        } else if (wordCount > expectedLength.max) {
            analysis.weaknesses.push("Réponse trop longue, manque de concision");
            analysis.score -= 0.1;
        } else {
            analysis.strengths.push("Longueur appropriée");
            analysis.score += 0.1;
        }
        
        // Analyse des mots-clés attendus
        const expectedKeywords = this.getExpectedKeywords(activityType);
        const foundKeywords = expectedKeywords.filter(keyword => 
            answer.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (foundKeywords.length >= expectedKeywords.length * 0.6) {
            analysis.strengths.push("Utilisation pertinente des concepts clés");
            analysis.score += 0.2;
        } else {
            analysis.weaknesses.push("Certains concepts importants manquent");
            analysis.score -= 0.1;
        }
        
        // Analyse de la structure
        if (this.hasGoodStructure(answer, activityType)) {
            analysis.strengths.push("Bonne organisation des idées");
            analysis.score += 0.1;
        } else {
            analysis.weaknesses.push("Structure à améliorer");
            analysis.score -= 0.1;
        }
        
        return analysis;
    },
    
    // Analyse structurelle
    analyzeStructure(answer, activityType) {
        const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        return {
            sentence_count: sentences.length,
            avg_sentence_length: sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length,
            has_introduction: this.hasIntroduction(answer),
            has_conclusion: this.hasConclusion(answer),
            coherence_score: this.calculateCoherence(answer)
        };
    },
    
    // Calcul de confiance globale
    calculateOverallConfidence(linguistic, specific, structural) {
        const weights = {
            linguistic: 0.3,
            specific: 0.5,
            structural: 0.2
        };
        
        const linguisticScore = linguistic.confidence || 0.5;
        const specificScore = specific.score || 0.5;
        const structuralScore = structural.coherence_score || 0.5;
        
        return (
            linguisticScore * weights.linguistic +
            specificScore * weights.specific +
            structuralScore * weights.structural
        );
    },
    
    // Contexte enrichi pour l'IA
    buildActivityContext(answer, activity, analysis) {
        const template = this.contextTemplates[activity.tableType];
        
        return {
            activity_type: activity.tableType,
            activity_title: activity.title || "Activité",
            student_answer: answer,
            local_analysis: analysis,
            activity_instructions: template?.instructions || "Analysez cette réponse.",
            focus_points: template?.focus_points || [],
            evaluation_criteria: template?.evaluation_criteria || [],
            student_level: this.getStudentLevel(),
            expected_length: this.getExpectedLength(activity.tableType),
            timestamp: new Date().toISOString()
        };
    },
    
    // Timeout adaptatif selon complexité
    getAdaptiveTimeout(activityType) {
        const timeouts = {
            'tri-inductif': 3000,
            'definir-sujet': 4000,
            'causes-consequences': 6000,
            'exemples-analogies': 5000,
            'synthese-claire': 7000
        };
        
        return timeouts[activityType] || 5000;
    },
    
    // Feedback structuré
    generateStructuredFeedback(analysis, aiResponse = null) {
        const feedback = {
            overall_score: Math.round(analysis.overall_confidence * 100),
            linguistic_feedback: this.formatLinguisticFeedback(analysis.linguistic),
            specific_feedback: this.formatSpecificFeedback(analysis.specific),
            structural_feedback: this.formatStructuralFeedback(analysis.structural),
            ai_feedback: aiResponse,
            recommendations: this.generateRecommendations(analysis),
            next_steps: this.generateNextSteps(analysis)
        };
        
        return feedback;
    },
    
    // Formatage feedback linguistique
    formatLinguisticFeedback(linguistic) {
        if (!linguistic.errors || linguistic.errors.length === 0) {
            return {
                status: "excellent",
                message: "Excellent niveau de français !",
                corrections: []
            };
        }
        
        return {
            status: "to_improve",
            message: `Quelques points à améliorer : ${linguistic.errors.length} correction(s) suggérée(s)`,
            corrections: linguistic.errors.slice(0, 3).map(err => ({
                original: err.text,
                correction: err.correction,
                explanation: err.explanation
            }))
        };
    },
    
    // Formatage feedback spécifique
    formatSpecificFeedback(specific) {
        return {
            score: Math.round(specific.score * 100),
            strengths: specific.strengths || [],
            weaknesses: specific.weaknesses || [],
            message: this.generateSpecificMessage(specific)
        };
    },
    
    // Formatage feedback structurel
    formatStructuralFeedback(structural) {
        return {
            coherence: Math.round(structural.coherence_score * 100),
            structure: {
                has_introduction: structural.has_introduction,
                has_conclusion: structural.has_conclusion,
                sentence_count: structural.sentence_count,
                avg_sentence_length: Math.round(structural.avg_sentence_length)
            },
            message: this.generateStructuralMessage(structural)
        };
    },
    
    // Fonctions utilitaires
    getExpectedLength(activityType) {
        const lengths = {
            'tri-inductif': { min: 50, max: 150 },
            'definir-sujet': { min: 80, max: 200 },
            'causes-consequences': { min: 100, max: 250 },
            'exemples-analogies': { min: 80, max: 200 },
            'synthese-claire': { min: 150, max: 300 }
        };
        
        return lengths[activityType] || { min: 50, max: 150 };
    },
    
    getExpectedKeywords(activityType) {
        const keywords = {
            'tri-inductif': ['texte', 'type', 'narratif', 'descriptif', 'explicatif'],
            'definir-sujet': ['sujet', 'définir', 'thème', 'domaine', 'objectif'],
            'causes-consequences': ['cause', 'conséquence', 'parce que', 'donc', 'résultat'],
            'exemples-analogies': ['exemple', 'analogue', 'similaire', 'comme', 'tel'],
            'synthese-claire': ['synthèse', 'clarté', 'idée', 'essentiel', 'conclusion'],
            'resume': ['résumé', 'fidélité', 'concision', 'neutralité', 'complétude'],
            'techniques': ['planification', 'structuration', 'connecteurs', 'vocabulaire']
        };
        
        return keywords[activityType] || [];
    },
    
    hasGoodStructure(answer, activityType) {
        // Vérifie si la réponse a une structure logique
        const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Au moins 3 phrases pour une structure minimale
        if (sentences.length < 3) return false;
        
        // Vérifie la présence de connecteurs logiques
        const connectors = ['car', 'donc', 'ainsi', 'cependant', 'par conséquent', 'en effet'];
        return connectors.some(connector => answer.toLowerCase().includes(connector));
    },
    
    hasIntroduction(answer) {
        const introPatterns = ['dans', 'ce', 'texte', 'il', 's\'agit', 'voici', 'pour'];
        const firstSentence = answer.split(/[.!?]+/)[0].toLowerCase();
        return introPatterns.some(pattern => firstSentence.includes(pattern));
    },
    
    hasConclusion(answer) {
        const conclusionPatterns = ['en', 'conclusion', 'finalement', 'pour', 'conclure', 'en', 'résumé'];
        const lastSentence = answer.split(/[.!?]+/).slice(-1)[0].toLowerCase();
        return conclusionPatterns.some(pattern => lastSentence.includes(pattern));
    },
    
    calculateCoherence(answer) {
        // Calcul simple de cohérence basé sur les connecteurs
        const connectors = ['et', 'mais', 'ou', 'donc', 'car', 'ni', 'or', 'ainsi', 'cependant'];
        const connectorCount = connectors.filter(connector => 
            answer.toLowerCase().split(' ').includes(connector)
        ).length;
        
        const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const maxPossibleConnectors = sentences.length - 1;
        
        return maxPossibleConnectors > 0 ? connectorCount / maxPossibleConnectors : 0.5;
    },
    
    getStudentLevel() {
        return window.currentUser?.level || 'intermediate';
    },
    
    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.linguistic.errors.length > 0) {
            recommendations.push("Revoyez les points de grammaire et conjugaison identifiés.");
        }
        
        if (analysis.specific.score < 0.7) {
            recommendations.push("Approfondissez les concepts spécifiques à ce type d'exercice.");
        }
        
        if (analysis.structural.coherence_score < 0.6) {
            recommendations.push("Améliorez la structure de vos réponses avec des connecteurs logiques.");
        }
        
        return recommendations;
    },
    
    generateNextSteps(analysis) {
        const steps = [];
        
        if (analysis.overall_confidence > 0.8) {
            steps.push("Excellent ! Essayez un exercice plus complexe.");
        } else if (analysis.overall_confidence > 0.6) {
            steps.push("Bon niveau ! Continuez à vous entraîner sur ce type d'exercice.");
        } else {
            steps.push("Entraînez-vous sur les exercices de base de ce type.");
        }
        
        return steps;
    }
};

console.log('✅ Activités IA optimisées chargées');
