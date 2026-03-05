/**
 * =================================================================
 * PIPELINE IA AVEC GROQ - SYSTÈME DE FAILOVER À 3 MODÈLES
 * Llama 3.1 8B Instant + Llama 3.1 70B Versatile + Mixtral 8x7B
 * =================================================================
 */

console.log('🚀 Initialisation du pipeline IA avec Groq (Failover 3 modèles)...');

/**
 * Configuration des modèles pour pipeline IA avec Groq
 */
const SPECIFIC_PIPELINE_CONFIG = {
    // Modèles Groq avec système de failover personnalisé par étape
    models: {
        logicEvaluator: {
            name: 'Évaluateur Logique',
            primary: 'llama-3.1-8b-instant',      // Rapide et efficace
            secondary: 'llama-3.1-70b-versatile',  // Puissant et précis
            tertiary: 'mixtral-8x7b-32768',       // Très puissant pour logique complexe
            role: 'Évaluateur logique expert avec capacité de réflexion approfondie',
            temperature: 0.1,
            maxTokens: 800
        },
        pedagogueTutor: {
            name: 'Tuteur Pédagogue',
            primary: 'llama-3.1-8b-instant',      // Rapide pour dialogue
            secondary: 'llama-3.1-70b-versatile',  // Empathique et détaillé
            tertiary: 'gemma2-9b-it',             // Excellent pour pédagogie
            role: 'Interface de discussion naturelle et empathique avec l\'étudiant',
            temperature: 0.7,
            maxTokens: 500
        },
        documentary: {
            name: 'Documentaliste',
            primary: 'openai/gpt-oss-20b',        // Spécialisé documentation
            secondary: 'llama-3.1-70b-versatile',  // Bon pour références
            tertiary: 'mixtral-8x7b-32768',       // Excellent pour synthèse
            role: 'Synthétiseur de supports de cours et références pédagogiques',
            temperature: 0.3,
            maxTokens: 1200
        },
        qualityController: {
            name: 'Contrôleur de Qualité',
            primary: 'llama-3.1-8b-instant',      // Rapide pour validation
            secondary: 'llama-3.1-70b-versatile',  // Rigoureux et précis
            tertiary: 'gemma2-9b-it',             // Excellent pour analyse critique
            role: 'Validateur anti-hallucination rapide et contrôle qualité',
            temperature: 0.05,
            maxTokens: 300
        }
    },
    
    // Configuration du pipeline
    sequentialProcessing: true,
    timeout: 30000,
    retryAttempts: 2,
    cacheEnabled: true,
    cacheTTL: 300000,
    
    // Configuration API
    apiProvider: 'groq',
    endpoint: '/.netlify/functions/ai-pipeline'
};

/**
 * Cache pour les réponses du pipeline
 */
const pipelineCache = new Map();

/**
 * Appel API Groq avec système de failover à 3 modèles
 */
async function callGroqModelAPI(modelConfig, prompt, retryCount = 0) {
    const models = [
        modelConfig.primary,
        modelConfig.secondary, 
        modelConfig.tertiary
    ];
    
    for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
        const currentModel = models[modelIndex];
        
        try {
            console.log(`🔄 Appel Groq à ${modelConfig.name} (${currentModel})`);
            
            const response = await fetch(SPECIFIC_PIPELINE_CONFIG.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: currentModel,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: modelConfig.temperature,
                    max_tokens: modelConfig.maxTokens
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                
                // Rate limit détecté → essayer modèle suivant
                if (response.status === 429 || errorData.error?.includes('rate_limit')) {
                    console.warn(`⚠️ Rate limit pour ${currentModel}, essai modèle suivant...`);
                    continue; // Passer au modèle suivant
                }
                
                throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content || 'Réponse vide';
            
            console.log(`✅ ${modelConfig.name} (${currentModel}) réponse reçue`);
            return reply;

        } catch (error) {
            console.error(`❌ Erreur ${modelConfig.name} (${currentModel}):`, error.message);
            
            // Si dernier modèle et retry attempts pas dépassés
            if (modelIndex === models.length - 1 && retryCount < SPECIFIC_PIPELINE_CONFIG.retryAttempts) {
                console.warn(`⚠️ Retry ${retryCount + 1}/${SPECIFIC_PIPELINE_CONFIG.retryAttempts} pour ${modelConfig.name}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return callGroqModelAPI(modelConfig, prompt, retryCount + 1);
            }
            
            // Si pas dernier modèle, continuer avec le suivant
            if (modelIndex < models.length - 1) {
                continue;
            }
            
            throw error;
        }
    }
    
    throw new Error(`Tous les modèles ont échoué pour ${modelConfig.name}`);
}

/**
 * MODÈLE 1: Évaluateur Logique
 */
async function evaluateWithDeepSeekR1(studentAnswer, activityContext, activityType) {
    const prompt = `En tant qu'évaluateur logique, analyse cette réponse d'étudiant.

CONTEXTE: ${activityContext}
TYPE: ${activityType}
RÉPONSE: "${studentAnswer}"

CONSIGNES IMPORTANTES:
- Réponse MAXIMUM 10 lignes
- 2-3 points clés maximum
- Score compréhension (0-10) obligatoire
- Sois concis et précis`;

    return await callGroqModelAPI(SPECIFIC_PIPELINE_CONFIG.models.logicEvaluator, prompt);
}

/**
 * MODÈLE 2: Tuteur Pédagogue
 */
async function tutorWithLlama3(logicEvaluation, activityContext, activityType) {
    const prompt = `En tant que tuteur pédagogue, réponds à cette situation pédagogique.

ÉVALUATION LOGIQUE: ${logicEvaluation}
CONTEXTE: ${activityContext}
TYPE: ${activityType}

CONSIGNES IMPORTANTES:
- Réponse MAXIMUM 10 lignes
- Sois encourageur et bienveillant
- Donne 1-2 indices progressifs
- Pas de réponse directe
- Termine par une question ouverte`;

    return await callGroqModelAPI(SPECIFIC_PIPELINE_CONFIG.models.pedagogueTutor, prompt);
}

/**
 * MODÈLE 3: Documentaliste
 */
async function documentWithMixtral(tutorResponse, activityContext, activityType) {
    const prompt = `En tant que documentaliste, trouve les références pour cette situation.

RÉPONSE DU TUTEUR: ${tutorResponse}
CONTEXTE: ${activityContext}
TYPE: ${activityType}

CONSIGNES IMPORTANTES:
- Réponse MAXIMUM 10 lignes
- 2-3 références pertinentes maximum
- Sois concis et précis
- Indique pages ou chapitres si possible`;

    return await callGroqModelAPI(SPECIFIC_PIPELINE_CONFIG.models.documentary, prompt);
}

/**
 * MODÈLE 4: Contrôleur Qualité
 */
async function qualityControlWithPhi3(tutorResponse, documentation, studentAnswer) {
    const prompt = `En tant que contrôleur qualité, valide cette réponse pédagogique.

RÉPONSE TUTEUR: ${tutorResponse}
DOCUMENTATION: ${documentation}
RÉPONSE ORIGINALE: ${studentAnswer}

CONSIGNES IMPORTANTES:
- Réponse MAXIMUM 10 lignes
- Score qualité (0-100) obligatoire
- 1-2 points clés maximum
- Sois concis et direct`;

    return await callGroqModelAPI(SPECIFIC_PIPELINE_CONFIG.models.qualityController, prompt);
}

/**
 * Pipeline principal avec les 4 modèles Groq et système de failover
 */
async function runSpecificPipelineModels(studentAnswer, activityContext, activityType = 'general') {
    const startTime = Date.now();
    
    try {
        console.log('🚀 Démarrage du pipeline IA avec failover...');
        
        // ÉTAPE 1: Évaluation logique
        const logicEvaluation = await evaluateWithDeepSeekR1(studentAnswer, activityContext, activityType);
        
        // ÉTAPE 2: Tutorat pédagogique
        const tutorResponse = await tutorWithLlama3(logicEvaluation, activityContext, activityType);
        
        // ÉTAPE 3: Documentation
        const documentation = await documentWithMixtral(tutorResponse, activityContext, activityType);
        
        // ÉTAPE 4: Contrôle qualité
        const qualityControl = await qualityControlWithPhi3(tutorResponse, documentation, studentAnswer);
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        const result = {
            studentAnswer,
            activityContext,
            activityType,
            logicEvaluation,
            tutorResponse,
            documentation,
            qualityControl,
            processingTime,
            timestamp: new Date().toISOString(),
            models: {
                logicEvaluator: SPECIFIC_PIPELINE_CONFIG.models.logicEvaluator.primary,
                pedagogueTutor: SPECIFIC_PIPELINE_CONFIG.models.pedagogueTutor.primary,
                documentary: SPECIFIC_PIPELINE_CONFIG.models.documentary.primary,
                qualityController: SPECIFIC_PIPELINE_CONFIG.models.qualityController.primary
            }
        };
        
        console.log(`✅ Pipeline IA terminé en ${processingTime}ms`);
        return result;
        
    } catch (error) {
        console.error('❌ ERREUR DU PIPELINE:', error.message);
        throw new Error(`Erreur du pipeline IA: ${error.message}`);
    }
}

/**
 * Export des fonctions pour utilisation globale
 */
window.runSpecificPipelineModels = runSpecificPipelineModels;
window.SPECIFIC_PIPELINE_CONFIG = SPECIFIC_PIPELINE_CONFIG;

console.log('✅ Pipeline IA avec failover à 3 modèles initialisé');
