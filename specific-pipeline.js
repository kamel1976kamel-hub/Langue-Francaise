/**
 * =================================================================
 * PIPELINE IA AVEC GROQ - 4 MODÈLES GRATUITS
 * DeepSeek R1 Distill + Llama 3 70B + Mixtral 8x7B + Phi-3 Mini
 * =================================================================
 */

console.log('🚀 Initialisation du pipeline IA avec Groq...');

/**
 * Configuration des modèles pour pipeline IA avec Groq
 */
const SPECIFIC_PIPELINE_CONFIG = {
    // Modèles Groq - gratuits et performants
    models: {
        logicEvaluator: {
            name: 'Évaluateur Logique',
            model: 'deepseek-r1-distill-llama-70b',
            role: 'Évaluateur logique expert avec capacité de réflexion approfondie',
            temperature: 0.1,
            maxTokens: 800
        },
        pedagogueTutor: {
            name: 'Tuteur Pédagogue',
            model: 'llama3-70b-8192',
            role: 'Interface de discussion naturelle et empathique avec l\'étudiant',
            temperature: 0.7,
            maxTokens: 600
        },
        documentary: {
            name: 'Documentaliste',
            model: 'mixtral-8x7b-32768',
            role: 'Synthétiseur de supports de cours et références pédagogiques',
            temperature: 0.3,
            maxTokens: 1200
        },
        qualityController: {
            name: 'Contrôleur de Qualité',
            model: 'phi3-mini',
            role: 'Validateur anti-hallucination rapide et contrôle qualité',
            temperature: 0.05,
            maxTokens: 400
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
const specificPipelineCache = new Map();

/**
 * Gestionnaire de token API (Groq)
 */
function getGroqToken() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('groq_token') || sessionStorage.getItem('groq_token') || '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';
    }
    return process.env.GROQ_API_KEY || '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';
}

/**
 * Appel API via fonction Netlify Groq
 */
async function callGroqModelAPI(modelConfig, prompt, retryCount = 0) {
    const isProduction = location.hostname.includes('github.io') || 
                       location.hostname.includes('netlify.app') ||
                       !location.hostname.includes('localhost');
    
    if (isProduction) {
        // Appel via fonction Netlify Groq
        try {
            console.log(`🔄 Appel Groq à ${modelConfig.name} (${modelConfig.model})`);
            
            const response = await fetch('/.netlify/functions/ai-pipeline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: prompt,
                    context: 'Appel via pipeline Groq',
                    activityType: 'general',
                    model: modelConfig.model,
                    role: modelConfig.role,
                    temperature: modelConfig.temperature,
                    maxTokens: modelConfig.maxTokens
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Netlify Function Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Retourner la réponse appropriée selon le modèle
            switch (modelConfig.model) {
                case 'deepseek-r1-distill-llama-70b':
                    return data.analysis || data.final?.message || 'Analyse effectuée';
                case 'llama3-70b-8192':
                    return data.tutor || data.final?.message || 'Réponse pédagogique';
                case 'mixtral-8x7b-32768':
                    return data.documentation || data.final?.references || 'Documentation trouvée';
                case 'phi3-mini':
                    return data.validation || data.final?.quality || 'Validation effectuée';
                default:
                    return data.final?.message || 'Traitement complété';
            }

        } catch (error) {
            console.error(`❌ Erreur fonction Netlify ${modelConfig.name}:`, error.message);
            
            if (retryCount < SPECIFIC_PIPELINE_CONFIG.retryAttempts) {
                console.warn(`⚠️ Retry ${retryCount + 1}/${SPECIFIC_PIPELINE_CONFIG.retryAttempts} pour ${modelConfig.name}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return callGroqModelAPI(modelConfig, prompt, retryCount + 1);
            }
            throw error;
        }
    } else {
        // Mode local - appel direct Groq
        console.log(`🔄 Appel local Groq à ${modelConfig.name} (${modelConfig.model})`);
        
        const requestBody = {
            model: modelConfig.model,
            messages: [
                {
                    role: "system",
                    content: modelConfig.role
                },
                {
                    role: "user", 
                    content: prompt
                }
            ],
            temperature: modelConfig.temperature,
            max_tokens: modelConfig.maxTokens
        };

        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getGroqToken()}`,
                    'User-Agent': 'Langue-Francaise/1.0'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Erreur API Groq (${response.status}):`, errorText);
                throw new Error(`Erreur API Groq: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            
            if (!content) {
                throw new Error('Réponse vide de l\'API Groq');
            }

            console.log(`✅ Réponse de ${modelConfig.name}:`, content.substring(0, 100) + '...');
            return content;

        } catch (error) {
            console.error(`❌ Erreur appel local ${modelConfig.name}:`, error.message);
            
            if (retryCount < SPECIFIC_PIPELINE_CONFIG.retryAttempts) {
                console.warn(`⚠️ Retry ${retryCount + 1}/${SPECIFIC_PIPELINE_CONFIG.retryAttempts} pour ${modelConfig.name}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return callGroqModelAPI(modelConfig, prompt, retryCount + 1);
            }

            throw error;
        }
    }
}

/**
 * MODÈLE 1: Évaluateur Logique DeepSeek R1 Distill
 */
async function evaluateWithDeepSeekR1(studentAnswer, activityContext, activityType) {
    const prompt = `En tant qu'évaluateur logique expert, analyse cette réponse d'étudiant avec précision.

CONTEXTE: ${activityContext}
TYPE: ${activityType}
RÉPONSE: "${studentAnswer}"

ANALYSE REQUISE:
1. Points forts et concepts corrects
2. Erreurs de raisonnement spécifiques  
3. Concepts manquants
4. Score de compréhension (0-10)
5. Pistes d'amélioration

Sois constructif et précis.`;

    return await callGroqModelAPI(SPECIFIC_PIPELINE_CONFIG.models.logicEvaluator, prompt);
}

/**
 * MODÈLE 2: Tuteur Pédagogue Llama 3 70B
 */
async function tutorWithLlama3(analysisResult, studentAnswer, activityContext) {
    const prompt = `En tant que tuteur pédagogue empathique, transforme cette analyse en réponse constructive.

ANALYSE: ${analysisResult}
RÉPONSE ORIGINALE: ${studentAnswer}
CONTEXTE: ${activityContext}

DIRECTIVES:
1. Encourage l'étudiant
2. Pose des questions ouvertes
3. Donne des indices progressifs (pas de réponses directes)
4. Utilise un ton bienveillant
5. Propose des pistes pour approfondir`;

    return await callGroqModelAPI(SPECIFIC_PIPELINE_CONFIG.models.pedagogueTutor, prompt);
}

/**
 * MODÈLE 3: Documentaliste Mixtral 8x7B
 */
async function documentWithMixtral(tutorResponse, activityContext, activityType) {
    const prompt = `En tant que documentaliste expert, trouve les références pour cette situation.

RÉPONSE DU TUTEUR: ${tutorResponse}
CONTEXTE: ${activityContext}
TYPE: ${activityType}

RESSOURCES REQUISES:
1. Références de manuels pertinents
2. Pages ou chapitres spécifiques
3. Exemples concrets et exercices
4. Ressources complémentaires
5. Méthodes d'apprentissage adaptées`;

    return await callGroqModelAPI(SPECIFIC_PIPELINE_CONFIG.models.documentary, prompt);
}

/**
 * MODÈLE 4: Contrôleur Qualité Phi-3 Mini
 */
async function qualityControlWithPhi3(tutorResponse, documentation, studentAnswer) {
    const prompt = `En tant que contrôleur qualité rigoureux, valide cette réponse pédagogique.

RÉPONSE TUTEUR: ${tutorResponse}
DOCUMENTATION: ${documentation}
RÉPONSE ORIGINALE: ${studentAnswer}

VALIDATION:
1. La réponse est-elle pédagogiquement correcte ?
2. Y a-t-il des erreurs ou incohérences ?
3. La réponse aide-t-elle vraiment l'étudiant ?
4. Les références sont-elles pertinentes ?
5. Score de qualité (0-100)`;

    return await callGroqModelAPI(SPECIFIC_PIPELINE_CONFIG.models.qualityController, prompt);
}

/**
 * Pipeline principal avec les 4 modèles Groq
 */
async function runSpecificPipelineModels(studentAnswer, activityContext, activityType = 'general') {
    const startTime = Date.now();
    
    try {
        console.log('🚀 === PIPELINE MODÈLES SPÉCIFIQUES DÉMARRÉ ===');
        console.log(`📝 Entrée: "${studentAnswer}"`);
        console.log(`📋 Contexte: "${activityContext}"`);
        console.log(`🏷️ Type: "${activityType}"`);
        
        // Vérifier le cache
        const cacheKey = `${studentAnswer}-${activityContext}-${activityType}`;
        if (SPECIFIC_PIPELINE_CONFIG.cacheEnabled && specificPipelineCache.has(cacheKey)) {
            const cached = specificPipelineCache.get(cacheKey);
            if (Date.now() - cached.timestamp < SPECIFIC_PIPELINE_CONFIG.cacheTTL) {
                console.log('🎯 Résultat récupéré depuis le cache');
                return cached.result;
            }
        }

        console.log('🔄 Traitement séquentiel des 4 modèles...');
        
        // Étape 1: Évaluateur Logique
        console.log('\n🧠 === ÉTAPE 1: ÉVALUATEUR LOGIQUE (DeepSeek R1 Distill) ===');
        const evaluation = await evaluateWithDeepSeekR1(studentAnswer, activityContext, activityType);
        
        // Étape 2: Tuteur Pédagogue
        console.log('\n👨‍🏫 === ÉTAPE 2: TUTEUR PÉDAGOGUE (Llama 3 70B) ===');
        const tutoring = await tutorWithLlama3(evaluation, studentAnswer, activityContext);
        
        // Étape 3: Documentaliste
        console.log('\n📚 === ÉTAPE 3: DOCUMENTALISTE (Mixtral 8x7B) ===');
        const documentation = await documentWithMixtral(tutoring, activityContext, activityType);
        
        // Étape 4: Contrôleur Qualité
        console.log('\n🔍 === ÉTAPE 4: CONTRÔLEUR QUALITÉ (Phi-3 Mini) ===');
        const qualityValidation = await qualityControlWithPhi3(tutoring, documentation, studentAnswer);
        
        // Construire la réponse finale
        const finalResponse = {
            studentAnswer: studentAnswer,
            activityContext: activityContext,
            activityType: activityType,
            evaluation: evaluation,
            tutoring: tutoring,
            documentation: documentation,
            qualityValidation: qualityValidation,
            finalMessage: tutoring,
            references: documentation,
            qualityScore: qualityValidation,
            processingTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            models: {
                evaluator: 'DeepSeek R1 Distill',
                tutor: 'Llama 3 70B',
                documentalist: 'Mixtral 8x7B',
                qualityController: 'Phi-3 Mini'
            }
        };
        
        // Mettre en cache
        if (SPECIFIC_PIPELINE_CONFIG.cacheEnabled) {
            specificPipelineCache.set(cacheKey, {
                result: finalResponse,
                timestamp: Date.now()
            });
        }
        
        console.log(`\n✅ Pipeline complété en ${Date.now() - startTime}ms`);
        console.log('🎯 Réponse finale générée avec succès');
        
        return finalResponse;
        
    } catch (error) {
        console.error('❌ ERREUR DU PIPELINE:', error);
        throw new Error(`Erreur du pipeline IA: ${error.message}`);
    }
}

/**
 * Fonctions d'export pour utilisation globale
 */
window.runSpecificPipelineModels = runSpecificPipelineModels;
window.runFourModelPipeline = runSpecificPipelineModels; // Compatibilité

/**
 * Configuration automatique du token Groq
 */
window.configureGroqToken = function(token) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('groq_token', token);
        sessionStorage.setItem('groq_token', token);
        console.log('🔑 Token Groq configuré avec succès');
        
        // Masquer automatiquement l'interface de configuration
        const configDiv = document.getElementById('pipeline-config');
        if (configDiv) {
            configDiv.style.display = 'none';
        }
    }
};

// Configuration automatique au chargement - IMMÉDIAT
if (typeof window !== 'undefined') {
    const autoToken = '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';
    if (autoToken && autoToken !== 'YOUR_GROQ_TOKEN_HERE') {
        window.configureGroqToken(autoToken);
        console.log('🔑 Token Groq configuré automatiquement au démarrage');
    }
}

/**
 * Afficher le statut du pipeline
 */
window.showSpecificPipelineStatus = function() {
    console.log('\n🤖 === ÉTAT DU PIPELINE GROQ ===');
    console.log('Fournisseur: Groq');
    console.log('Modèles configurés:');
    
    Object.entries(SPECIFIC_PIPELINE_CONFIG.models).forEach(([key, model]) => {
        console.log(`✅ ${model.name}: ${model.model}`);
    });
    
    console.log('\n⚙️ Configuration:');
    console.log(`⚡ Traitement: ${SPECIFIC_PIPELINE_CONFIG.sequentialProcessing ? 'Séquentiel' : 'Parallèle'}`);
    console.log(`⏱️ Timeout: ${SPECIFIC_PIPELINE_CONFIG.timeout}ms`);
    console.log(`🔄 Retry: ${SPECIFIC_PIPELINE_CONFIG.retryAttempts} tentatives`);
    console.log(`💾 Cache: ${SPECIFIC_PIPELINE_CONFIG.cacheEnabled ? 'Activé' : 'Désactivé'}`);
    
    const token = getGroqToken();
    console.log(`\n🔑 Groq: ${token && token !== 'YOUR_GROQ_TOKEN_HERE' ? 'Configuré' : 'Non configuré'}`);
    
    return {
        provider: 'Groq',
        models: SPECIFIC_PIPELINE_CONFIG.models,
        config: SPECIFIC_PIPELINE_CONFIG,
        tokenConfigured: token && token !== 'YOUR_GROQ_TOKEN_HERE'
    };
};

/**
 * Tester les modèles spécifiques
 */
window.testSpecificModels = async function() {
    console.log('\n🧪 === TEST DES MODÈLES SPÉCIFIQUES GROQ ===');
    
    const testCases = [
        {
            input: "C'est une belle journée ensoleillée.",
            context: "description d'un paysage",
            type: "descriptif"
        },
        {
            input: "Je pense que l'éducation est importante pour la société.",
            context: "réflexion sur l'éducation",
            type: "argumentatif"
        },
        {
            input: "Le personnage principal traverse une forêt sombre.",
            context: "début d'une histoire",
            type: "narratif"
        }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        console.log(`\n🧪 Test ${i + 1}/${testCases.length}:`);
        console.log(`📝 Entrée: "${test.input}"`);
        console.log(`📋 Contexte: "${test.context}"`);
        console.log(`🏷️ Type: "${test.type}"`);
        
        try {
            const result = await runSpecificPipelineModels(test.input, test.context, test.type);
            console.log(`✅ Test ${i + 1} réussi !`);
            console.log(`🎯 Réponse: ${result.finalMessage.substring(0, 100)}...`);
        } catch (error) {
            console.error(`❌ Test ${i + 1} échoué:`, error.message);
        }
    }
    
    console.log('\n🏁 Tests terminés');
};

console.log('✅ Pipeline IA Groq initialisé avec succès');
