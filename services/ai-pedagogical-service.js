// SERVICE IA PÉDAGOGIQUE INTÉGRÉ À SPA CY
// ==========================================

window.AIPedagogicalService = {
    async analyzeProduction(studentText, activityContext) {
        console.log('🤖 AI PÉDAGOGIQUE SERVICE - DÉBUT ANALYSE');
        console.log('📝 Texte étudiant:', studentText);
        console.log('📏 Longueur:', studentText.length, 'caractères');
        console.log('🎯 Contexte activité:', activityContext || 'non spécifié');
        
        // 1. Utiliser SpacyAnalyzer comme moteur principal
        console.log('🔍 ÉTAPE 1: APPEL SPACY ANALYZER');
        let localAnalysis;
        try {
            console.log('📞 Appel à SpacyAnalyzer...');
            localAnalysis = await window.SpacyAnalyzer?.analyze(studentText) || { errors: [], confidence: 0 };
            console.log('📊 Résultat SpacyAnalyzer:', localAnalysis);
            console.log(`  🔢 Erreurs détectées: ${localAnalysis.errors?.length || 0}`);
            console.log(`  📊 Confiance: ${(localAnalysis.confidence * 100).toFixed(1)}%`);
            console.log(`  ⏱️ Temps: ${localAnalysis.processingTime?.toFixed(2) || 'N/A'}ms`);
        } catch (error) {
            console.warn('⚠️ SpacyAnalyzer indisponible, fallback analyse interne');
            console.error('❌ Erreur SpacyAnalyzer:', error);
            console.log('🔄 Activation du mode fallback...');
            localAnalysis = await this.fallbackAnalysis(studentText);
        }
        
        // 2. Décider si besoin d'IA externe
        console.log('🧮 ÉTAPE 2: DÉCISION DE PIPELINE');
        console.log(`📊 Seuil de confiance: 0.8`);
        console.log(`📊 Confiance actuelle: ${localAnalysis.confidence?.toFixed(3) || 'N/A'}`);
        console.log(`📊 Nombre d'erreurs: ${localAnalysis.errors?.length || 0}`);
        
        if (localAnalysis.confidence > 0.8 && localAnalysis.errors.length > 0) {
            console.log('✅ DÉCISION: CONFIANCE ÉLEVÉE - RÉPONSE DIRECTE SPAZY');
            console.log('🎯 Pas besoin d\'appel IA externe');
            const response = this.formatPedagogicalResponse(localAnalysis);
            console.log('📤 Réponse formatée:', response);
            return response;
        }
        
        // 3. Appel IA externe si nécessaire
        console.log('🤖 DÉCISION: CONFIANCE FAIBLE - APPEL IA EXTERNE REQUIS');
        console.log('📞 Appel à l\'IA externe...');
        const aiAnalysis = await this.callAI(studentText, activityContext);
        console.log('📊 Résultat IA externe:', aiAnalysis);
        
        const response = this.formatPedagogicalResponse(aiAnalysis);
        console.log('📤 Réponse finale formatée:', response);
        console.log('🤖 AI PÉDAGOGIQUE SERVICE - FIN ANALYSE');
        
        return response;
    },
    
    // Fallback si SpacyAnalyzer indisponible
    async fallbackAnalysis(text) {
        console.log('🔄 FALLBACK ANALYSIS - DÉBUT');
        console.log('📝 Texte à analyser (fallback):', text);
        
        const errors = [];
        
        // Patterns essentiels en double secours
        console.log('🔧 APPLICATION DES PATTERNS FALLBACK');
        const patterns = [
            { pattern: /\bil vas\b/g, type: "conjugaison", rule: "aller_present", correction: "il va", confidence: 0.95 },
            { pattern: /\bils vas\b/g, type: "conjugaison", rule: "aller_present", correction: "ils vont", confidence: 0.95 },
            { pattern: /\bmail\b/gi, type: "anglicisme", rule: "anglicisme_mail", correction: "courriel", confidence: 0.90 }
        ];
        
        console.log(`📋 Nombre de patterns fallback: ${patterns.length}`);
        
        patterns.forEach((pattern, index) => {
            console.log(`  🔍 Pattern ${index + 1}/${patterns.length}: ${pattern.rule}`);
            console.log(`  🎯 Regex:`, pattern.pattern);
            
            const matches = text.match(pattern.pattern);
            console.log(`  🔎 Matches: ${matches ? matches.length : 0}`);
            
            if (matches) {
                console.log(`  ✅ Erreur détectée: "${matches[0]}" → "${pattern.correction}"`);
                errors.push({
                    type: pattern.type,
                    original: matches[0],
                    correction: pattern.correction,
                    rule: pattern.rule,
                    confidence: pattern.confidence
                });
            }
        });
        
        const result = {
            errors: errors,
            confidence: errors.length > 0 ? 0.7 : 0.3,
            source: "fallback"
        };
        
        console.log('📊 Résultat fallback:', result);
        console.log('🔄 FALLBACK ANALYSIS - FIN');
        
        return result;
    },
    
    formatPedagogicalResponse(analysis) {
        console.log('📝 FORMATAGE PÉDAGOGIQUE - DÉBUT');
        console.log('📊 Analyse à formater:', analysis);
        
        const hasErrors = analysis.errors && analysis.errors.length > 0;
        const mainError = hasErrors ? analysis.errors[0] : null;
        
        console.log(`  🔢 Erreurs: ${analysis.errors?.length || 0}`);
        console.log(`  📊 HasErrors: ${hasErrors}`);
        console.log(`  🎯 MainError:`, mainError);
        
        const response = {
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
        
        console.log('📤 Réponse formatée:', response);
        console.log('📝 FORMATAGE PÉDAGOGIQUE - FIN');
        
        return response;
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
        console.log('🤖 APPEL IA EXTERNE - DÉBUT');
        console.log('📝 Texte étudiant:', studentText);
        console.log('🎯 Contexte activité:', activityContext || 'non spécifié');
        
        if (typeof window.demanderIA !== 'function') {
            console.error('❌ Service IA non disponible - window.demanderIA n\'est pas une fonction');
            throw new Error('Service IA non disponible');
        }
        
        console.log('✅ Service IA disponible, construction du prompt...');
        
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
        
        console.log('📏 Longueur du prompt:', prompt.length, 'caractères');
        console.log('📞 Appel à window.demanderIA...');
        
        try {
            const startTime = performance.now();
            const response = await window.demanderIA(prompt, activityContext || "Analyse linguistique");
            const endTime = performance.now();
            
            console.log(`⏱️ Temps de réponse IA: ${(endTime - startTime).toFixed(2)}ms`);
            console.log('📤 Réponse IA brute:', response);
            
            const result = { errors: [], confidence: 0.7, aiResponse: response };
            console.log('📊 Résultat formaté:', result);
            console.log('🤖 APPEL IA EXTERNE - FIN (SUCCÈS)');
            
            return result;
        } catch (error) {
            console.error('❌ Erreur lors de l\'appel IA:', error);
            console.log('🔄 Retour d\'erreur formatée...');
            console.log('🤖 APPEL IA EXTERNE - FIN (ERREUR)');
            
            return { errors: [], confidence: 0.1, error: error.message };
        }
    }
};

console.log('✅ Service IA Pédagogique chargé');
