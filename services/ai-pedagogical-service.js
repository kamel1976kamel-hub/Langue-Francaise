// SERVICE IA PÉDAGOGIQUE INTÉGRÉ À SPA CY
// ==========================================

window.AIPedagogicalService = {
    async analyzeProduction(studentText, activityContext) {
        console.log('🔍 Analyse pédagogique de:', studentText);
        
        // 1. Utiliser SpacyAnalyzer comme moteur principal
        let localAnalysis;
        try {
            localAnalysis = await window.SpacyAnalyzer?.analyze(studentText) || { errors: [], confidence: 0 };
            console.log('📊 Analyse SpacyAnalyzer:', localAnalysis);
        } catch (error) {
            console.warn('⚠️ SpacyAnalyzer indisponible, fallback analyse interne');
            localAnalysis = await this.fallbackAnalysis(studentText);
        }
        
        // 2. Décider si besoin d'IA externe
        if (localAnalysis.confidence > 0.8 && localAnalysis.errors.length > 0) {
            console.log('✅ Confiance SpacyAnalyzer élevée - Réponse directe');
            return this.formatPedagogicalResponse(localAnalysis);
        }
        
        // 3. Appel IA externe si nécessaire
        console.log('🤖 Confiance faible - Appel IA requis');
        const aiAnalysis = await this.callAI(studentText, activityContext);
        return this.formatPedagogicalResponse(aiAnalysis);
    },
    
    // Fallback si SpacyAnalyzer indisponible
    async fallbackAnalysis(text) {
        const errors = [];
        
        // Patterns essentiels en double secours
        const patterns = [
            { pattern: /\bil vas\b/g, type: "conjugaison", rule: "aller_present", correction: "il va", confidence: 0.95 },
            { pattern: /\bils vas\b/g, type: "conjugaison", rule: "aller_present", correction: "ils vont", confidence: 0.95 },
            { pattern: /\bmail\b/gi, type: "anglicisme", rule: "anglicisme_mail", correction: "courriel", confidence: 0.90 }
        ];
        
        patterns.forEach(pattern => {
            const matches = text.match(pattern.pattern);
            if (matches) {
                errors.push({
                    type: pattern.type,
                    original: matches[0],
                    correction: pattern.correction,
                    rule: pattern.rule,
                    confidence: pattern.confidence
                });
            }
        });
        
        return {
            errors: errors,
            confidence: errors.length > 0 ? 0.7 : 0.3,
            source: "fallback"
        };
    },
    
    formatPedagogicalResponse(analysis) {
        const hasErrors = analysis.errors && analysis.errors.length > 0;
        const mainError = hasErrors ? analysis.errors[0] : null;
        
        return {
            analysis: hasErrors ? `Détection de ${analysis.errors.length} erreur(s) linguistique(s)` : "Production correcte",
            error_type: mainError?.type || "aucune",
            rule: mainError?.rule || "",
            hint: mainError?.correction || "",
            example: this.generateExample(mainError),
            exercise: this.generateExercise(mainError),
            validation: !hasErrors,
            confidence: analysis.confidence || 0.8,
            errors_count: analysis.errors?.length || 0
        };
    },
    
    generateExample(error) {
        if (!error) return "Votre production est excellente !";
        
        const examples = {
            conjugaison: {
                "aller_present": "Il va au marché, ils vont à l'école",
                "verbe_aller": "Je vais, tu vas, il va, nous allons, vous allez, ils vont"
            },
            anglicisme: {
                "anglicisme_weekend": "Nous partons en week-end",
                "anglicisme_mail": "J'ai reçu un courriel important",
                "anglicisme_shopping": "Je fais mes achats le samedi"
            },
            accord: {
                "pluriel": "Les chats sont dans le jardin",
                "féminin": "La voiture est neuve"
            },
            orthographe: {
                "orth_paraitre": "Il paraît content",
                "orth_correct": "Ta réponse est correcte"
            }
        };
        
        return examples[error.type]?.[error.rule] || error.correction || "Exemple à consulter";
    },
    
    generateExercise(error) {
        if (!error) return "Continuez comme ça !";
        
        const exercises = {
            conjugaison: "Conjuguez le verbe 'aller' au présent : je ___, tu ___, il ___",
            anglicisme: "Remplacez l'anglicisme par le terme français approprié",
            accord: "Accordez correctement l'adjectif avec le nom",
            orthographe: "Corrigez l'erreur d'orthographe dans la phrase"
        };
        
        return exercises[error.type] || "Exercice de consolidation à faire";
    },
    
    async callAI(studentText, activityContext) {
        if (typeof window.demanderIA !== 'function') {
            throw new Error('Service IA non disponible');
        }
        
        const prompt = `
Analysez cette production d'étudiant en français et répondez OBLIGATOIREMENT en JSON :

Texte de l'étudiant : "${studentText}"

Répondez avec ce format exact :
{
  "analysis": "description brève de l'analyse",
  "error_type": "type d'erreur principal",
  "rule": "règle grammaticale concernée", 
  "hint": "indice pour corriger",
  "example": "exemple correct",
  "exercise": "exercice de consolidation",
  "validation": false
}

Instructions :
- Sois encourageant mais précis
- Identifie les points forts et les axes d'amélioration  
- Propose des suggestions concrètes
- Adapte ton niveau à un élève de collège/lycée
        `;
        
        try {
            const response = await window.demanderIA(prompt, activityContext || "Analyse linguistique");
            return { errors: [], confidence: 0.7, aiResponse: response };
        } catch (error) {
            console.error('Erreur appel IA:', error);
            return { errors: [], confidence: 0.1, error: error.message };
        }
    }
};

console.log('✅ Service IA Pédagogique chargé');
