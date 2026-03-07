// SERVICE IA PÉDAGOGIQUE STRUCTURÉ
// ==================================

window.AIPedagogicalService = {
    async analyzeProduction(studentText, activityContext) {
        console.log('🔍 Analyse pédagogique de:', studentText);
        
        // 1. Analyse locale d'abord
        const localAnalysis = await this.localAnalysis(studentText);
        console.log('📊 Analyse locale:', localAnalysis);
        
        if (localAnalysis.confidence > 0.8) {
            console.log('✅ Confiance locale élevée - Pas besoin d\'IA');
            return this.formatPedagogicalResponse(localAnalysis);
        }
        
        // 2. Appel IA si nécessaire
        console.log('🤖 Confiance locale faible - Appel IA requis');
        const aiAnalysis = await this.callAI(studentText, activityContext);
        return this.formatPedagogicalResponse(aiAnalysis);
    },
    
    async localAnalysis(text) {
        const errors = [];
        
        // Détection des erreurs fréquentes
        const patterns = [
            // Conjugaison
            { pattern: /\bil vas\b/g, type: "conjugaison", rule: "aller_present", correction: "il va", confidence: 0.95 },
            { pattern: /\bils vas\b/g, type: "conjugaison", rule: "aller_present", correction: "ils vont", confidence: 0.95 },
            { pattern: /\bel vas\b/g, type: "conjugaison", rule: "aller_present", correction: "elle va", confidence: 0.95 },
            
            // Anglicismes
            { pattern: /\bweek-end\b/gi, type: "anglicisme", rule: "anglicisme_weekend", correction: "week-end", confidence: 0.90 },
            { pattern: /\bmail\b/gi, type: "anglicisme", rule: "anglicisme_mail", correction: "courriel", confidence: 0.90 },
            { pattern: /\bshopping\b/gi, type: "anglicisme", rule: "anglicisme_shopping", correction: "achats", confidence: 0.90 },
            
            // Accords
            { pattern: /les(\w+)s\b/g, type: "accord", rule: "pluriel", correction: "les$1", confidence: 0.85 },
            { pattern: /\bla(\w+)s\b/g, type: "accord", rule: "féminin", correction: "la$1", confidence: 0.85 },
            
            // Orthographe
            { pattern: /\bparrait\b/g, type: "orthographe", rule: "orth_paraitre", correction: "paraît", confidence: 0.90 },
            { pattern: /\bcorect\b/gi, type: "orthographe", rule: "orth_correct", correction: "correct", confidence: 0.95 }
        ];
        
        patterns.forEach(pattern => {
            const matches = text.match(pattern.pattern);
            if (matches) {
                errors.push({
                    type: pattern.type,
                    original: matches[0],
                    correction: pattern.correction,
                    rule: pattern.rule,
                    position: text.indexOf(matches[0]),
                    confidence: pattern.confidence
                });
            }
        });
        
        return {
            errors: errors,
            confidence: errors.length > 0 ? 0.9 : 0.3,
            needsAI: errors.length === 0 || errors.some(e => e.confidence < 0.8)
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
