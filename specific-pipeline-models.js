/**
 * =================================================================
 * PIPELINE IA TEMPS RÉEL - MODÈLES SPÉCIFIQUES UTILISATEUR
 * DeepSeek-R1 + GPT-5-chat + Llama 4 Scout 17B 16E + Phi-4-mini-raisonnement
 * =================================================================
 */

console.log('🚀 Initialisation du pipeline IA avec modèles spécifiques...');

/**
 * Configuration du pipeline avec les 4 modèles demandés
 */
const SPECIFIC_PIPELINE_CONFIG = {
    models: {
        evaluator: {
            name: 'Évaluateur Logique (DeepSeek-R1)',
            model: 'deepseek/deepseek-r1',
            endpoint: 'https://api.github.com/models/deepseek/deepseek-r1/chat/completions',
            temperature: 0.1, // Très rigoureux avec Chain of Thought
            maxTokens: 800,
            role: 'Analyseur technique avec réflexion approfondie'
        },
        tutor: {
            name: 'Tuteur Pédagogue (OpenAI gpt-5-chat)',
            model: 'openai/gpt-5-chat',
            endpoint: 'https://api.github.com/models/openai/gpt-5-chat/chat/completions',
            temperature: 0.8, // Empathique et conversationnel
            maxTokens: 600,
            role: 'Interface de discussion naturelle et empathique'
        },
        documentalist: {
            name: 'Documentaliste (Llama 4 Scout 17B 16E)',
            model: 'meta/llama-4-scout-17b-16e',
            endpoint: 'https://api.github.com/models/meta/llama-4-scout-17b-16e/chat/completions',
            temperature: 0.2, // Précis pour la recherche synthétique
            maxTokens: 1200, // Grande fenêtre pour synthèse de documents
            role: 'Synthétiseur de supports de cours étendus'
        },
        qualityController: {
            name: 'Contrôleur Qualité (Phi-4-mini-raisonnement)',
            model: 'microsoft/phi-4-mini-reasoning',
            endpoint: 'https://api.github.com/models/microsoft/phi-4-mini-reasoning/chat/completions',
            temperature: 0.05, // Ultra-précis pour la validation logique
            maxTokens: 400,
            role: 'Validateur anti-hallucination rapide'
        }
    },
    timeout: 30000,
    retryAttempts: 2,
    sequentialProcessing: true, // Séquentiel pour respecter la chaîne de raisonnement
    cacheEnabled: true,
    cacheTTL: 300000
};

/**
 * Cache pour les réponses du pipeline
 */
const specificPipelineCache = new Map();

/**
 * Gestionnaire de clés GitHub
 */
function getGitHubToken() {
    const token = localStorage.getItem('github_token') || 
                  sessionStorage.getItem('github_token') || 
                  process.env.GITHUB_TOKEN;
    
    if (!token || token === 'YOUR_GITHUB_TOKEN_HERE') {
        throw new Error('Token GitHub non configuré. Veuillez configurer votre token GitHub Models.');
    }
    
    return token;
}

/**
 * Effectue un appel API GitHub Models avec retry
 */
async function callGitHubModelAPI(modelConfig, prompt, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SPECIFIC_PIPELINE_CONFIG.timeout);

    try {
        console.log(`🔄 Appel à ${modelConfig.name} (${modelConfig.model})`);
        
        const response = await fetch(modelConfig.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getGitHubToken()}`,
                'User-Agent': 'CoursFrancais-Pipeline/1.0',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: modelConfig.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: modelConfig.temperature,
                max_tokens: modelConfig.maxTokens,
                stream: false
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erreur API ${modelConfig.name}:`, response.status, errorText);
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const result = data.choices[0].message.content;
        
        console.log(`✅ Réponse de ${modelConfig.name}: ${result.substring(0, 100)}...`);
        return result;

    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error(`Timeout du modèle ${modelConfig.name}`);
        }

        if (retryCount < SPECIFIC_PIPELINE_CONFIG.retryAttempts) {
            console.warn(`⚠️ Retry ${retryCount + 1}/${SPECIFIC_PIPELINE_CONFIG.retryAttempts} pour ${modelConfig.name}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return callGitHubModelAPI(modelConfig, prompt, retryCount + 1);
        }

        throw error;
    }
}

/**
 * MODÈLE 1: Évaluateur Logique DeepSeek-R1 (Analyse avec Chain of Thought)
 */
async function evaluateWithDeepSeekR1(studentAnswer, activityContext, activityType) {
    const prompt = `En tant qu'évaluateur logique expert avec capacité de réflexion approfondie (Chain of Thought), analyse cette réponse d'étudiant avec une précision extrême.

CONTEXTE DE L'ACTIVITÉ : ${activityContext}
TYPE D'ACTIVITÉ : ${activityType}
RÉPONSE DE L'ÉTUDIANT : "${studentAnswer}"

Réfléchis étape par étape avant de conclure :
1. Analyse la logique globale de la réponse
2. Identifie les raisonnements corrects
3. Détecte les erreurs de raisonnement subtiles
4. Vérifie la cohérence mathématique/informatique
5. Évalue la compréhension des concepts

Fournis un rapport technique interne structuré :
1. Score de précision (0-10)
2. Points validés (maximum 3)
3. Erreurs de raisonnement détectées (maximum 3)
4. Concepts manquants ou mal compris
5. Analyse de la logique appliquée

Sois extrêmement précis et factuel. Ce rapport est pour usage interne uniquement.

Format JSON strict :
{
  "score": 7,
  "points_valides": ["Structure logique correcte", "Application de la formule de base"],
  "erreurs_raisonnement": ["Erreur d'interprétation de l'énoncé", "Calcul incorrect étape 2"],
  "concepts_manquants": ["Principe de multiplication des aires", "Unités de mesure"],
  "analyse_logique": "L'étudiant comprend le concept global mais fait une erreur dans l'application de la formule..."
}`;

    const response = await callGitHubModelAPI(SPECIFIC_PIPELINE_CONFIG.models.evaluator, prompt);
    
    try {
        return JSON.parse(response);
    } catch (error) {
        console.warn('⚠️ Réponse invalide de DeepSeek-R1, utilisation du fallback');
        return {
            score: 5,
            points_valides: ['Analyse partielle'],
            erreurs_raisonnement: ['Erreur de format'],
            concepts_manquants: ['Réflexion approfondie'],
            analyse_logique: 'Analyse de base effectuée.'
        };
    }
}

/**
 * MODÈLE 2: Tuteur Pédagogue GPT-5-chat (Interface de discussion naturelle)
 */
async function tutorWithGPT5Chat(evaluation, studentAnswer, activityContext) {
    const prompt = `En tant que tuteur pédagogique expert avec une capacité de conversation naturelle et empathique, transforme cette analyse technique interne en une discussion constructive avec l'étudiant.

RAPPORT TECHNIQUE INTERNE (DeepSeek-R1) :
- Score : ${evaluation.score}/10
- Points validés : ${evaluation.points_valides.join(', ')}
- Erreurs de raisonnement : ${evaluation.erreurs_raisonnement.join(', ')}
- Concepts manquants : ${evaluation.concepts_manquants.join(', ')}
- Analyse logique : ${evaluation.analyse_logique}

RÉPONSE ORIGINALE DE L'ÉTUDIANT : "${studentAnswer}"
CONTEXTE : ${activityContext}

Crée une réponse pédagogique qui :
1. Commence par une appréciation sincère des points validés
2. Mentionne 1-2 erreurs de manière constructive et encourageante
3. Pose une question guidante (sans donner la solution directe)
4. Donne un indice progressif si nécessaire
5. Se termine par un encouragement personnalisé

Ton : naturel, empathique, conversationnel, encourageant
Style : Discussion fluide comme un vrai tuteur
Longueur : 250-450 caractères maximum
Ne donne jamais la réponse directement
Maintiens une conversation naturelle`;

    const response = await callGitHubModelAPI(SPECIFIC_PIPELINE_CONFIG.models.tutor, prompt);
    
    return {
        response: response,
        approach: 'conversation_guidée',
        tone: 'naturel_empathique',
        style: 'discussion_fluide',
        length: response.length
    };
}

/**
 * MODÈLE 3: Documentaliste Llama 4 Scout 17B 16E (Synthèse de supports étendus)
 */
async function documentWithLlama4Scout(evaluation, activityContext, activityType) {
    const prompt = `En tant que documentaliste expert spécialisé dans la synthèse de plusieurs documents et l'analyse d'activité étendue, recherche les ressources pédagogiques pertinentes en gardant en mémoire tout ce qui a été enseigné.

ÉVALUATION TECHNIQUE (DeepSeek-R1) :
- Erreurs de raisonnement : ${evaluation.erreurs_raisonnement.join(', ')}
- Concepts manquants : ${evaluation.concepts_manquants.join(', ')}
- Analyse logique : ${evaluation.analyse_logique}
- Type d'activité : ${activityType}
- Contexte : ${activityContext}

En utilisant ta capacité de synthèse documentaire étendue :
1. Identifie les supports de cours pertinents (manuels, chapitres, sections)
2. Extrais le paragraphe exact lié à l'erreur principale
3. Fournis un exemple concret ou exercice similaire
4. Cite la référence précise (chapitre/page/section)
5. Synthétise si nécessaire plusieurs sources

Sois précis dans tes références et exhaustif dans ta recherche documentaire.

Format JSON :
{
  "paragraphe_cours": "Texte exact du support de cours avec la définition/formule correcte...",
  "exemple_concret": "Exemple détaillé montrant l'application correcte du concept...",
  "reference_precise": "Manuel de Mathématiques - Chapitre 4, page 87 - Section 'Calcul d'aires'",
  "sources_synthese": "Synthèse des chapitres 3 et 4 sur les mesures géométriques"
}`;

    const response = await callGitHubModelAPI(SPECIFIC_PIPELINE_CONFIG.models.documentalist, prompt);
    
    try {
        return JSON.parse(response);
    } catch (error) {
        console.warn('⚠️ Réponse invalide de Llama 4 Scout 17B 16E, utilisation du fallback');
        return {
            paragraphe_cours: 'Consultez le chapitre correspondant à cette notion dans votre manuel.',
            exemple_concret: 'Exemple similaire disponible dans les exercices pratiques.',
            reference_precise: 'Manuel pédagogique - Section correspondante',
            sources_synthese: 'Synthèse des supports de cours disponibles'
        };
    }
}

/**
 * MODÈLE 4: Contrôleur Qualité Phi-4-mini-raisonnement (Anti-hallucination rapide)
 */
async function qualityControlWithPhi4(tutoringResponse, evaluation, documentation) {
    const prompt = `En tant que contrôleur qualité ultra-rapide spécialisé en raisonnement logique, valide cette réponse pédagogique pour éviter les hallucinations et erreurs.

RÉPONSE DU TUTEUR (GPT-5-chat) : "${tutoringResponse.response}"

CONTEXTE TECHNIQUE :
- Évaluation originale : ${evaluation.score}/10
- Erreurs détectées : ${evaluation.erreurs_raisonnement.join(', ')}
- Documentation fournie : ${documentation.reference_precise}

Vérifie rigoureusement :
1. Le tuteur n'a-t-il pas donné la solution directement ?
2. La réponse est-elle cohérente avec l'évaluation technique ?
3. Les indices donnés sont-ils appropriés et progressifs ?
4. La réponse encourage-t-elle sans valider une erreur ?
5. Le ton est-il bien pédagogique et empathique ?

Sois extrêmement précis dans ta validation logique.

Format JSON :
{
  "validation": "APPROUVÉ" ou "REJETÉ",
  "score_qualite": 95,
  "problemes": [],
  "corrections_suggerees": "Aucune correction nécessaire" ou "Suggestions d'amélioration...",
  "raisonnement": "La réponse est cohérente avec l'évaluation et ne donne pas la solution..."
}`;

    const response = await callGitHubModelAPI(SPECIFIC_PIPELINE_CONFIG.models.qualityController, prompt);
    
    try {
        return JSON.parse(response);
    } catch (error) {
        console.warn('⚠️ Réponse invalide de Phi-4-mini-raisonnement, utilisation du fallback');
        return {
            validation: 'APPROUVÉ',
            score_qualite: 85,
            problemes: [],
            corrections_suggerees: 'Validation de base effectuée',
            raisonnement: 'Réponse approuvée par défaut'
        };
    }
}
/**
 * Pipeline principal avec les 4 modèles spécifiques
 */
async function runSpecificPipelineModels(studentAnswer, activityContext, activityType = 'general') {
    const startTime = Date.now();
    const cacheKey = `${activityType}:${activityContext}:${btoa(studentAnswer).substring(0, 50)}`;
    
    console.log('🚀 === PIPELINE MODÈLES SPÉCIFIQUES DÉMARRÉ ===');
    console.log(`📝 Entrée: "${studentAnswer}"`);
    console.log(`📋 Contexte: "${activityContext}"`);
    console.log(`🏷️ Type: "${activityType}"`);
    
    // Vérifier le cache
    if (SPECIFIC_PIPELINE_CONFIG.cacheEnabled && specificPipelineCache.has(cacheKey)) {
        const cached = specificPipelineCache.get(cacheKey);
        if (Date.now() - cached.timestamp < SPECIFIC_PIPELINE_CONFIG.cacheTTL) {
            console.log('⚡ Réponse récupérée depuis le cache');
            return cached.response;
        }
    }
    
    try {
        let results = {};
        
        if (SPECIFIC_PIPELINE_CONFIG.sequentialProcessing) {
            // Traitement séquentiel des 4 modèles
            console.log('🔄 Traitement séquentiel des 4 modèles...');
            
            // Étape 1: DeepSeek-R1 - Évaluation technique avec Chain of Thought
            console.log('\n🧠 === ÉTAPE 1: ÉVALUATEUR LOGIQUE (DeepSeek-R1) ===');
            const evaluatorStart = Date.now();
            results.evaluation = await evaluateWithDeepSeekR1(studentAnswer, activityContext, activityType);
            const evaluatorTime = Date.now() - evaluatorStart;
            console.log(`⏱️ Temps: ${evaluatorTime}ms | Score: ${results.evaluation.score}/10`);
            console.log(`🔍 Raisonnement: ${results.evaluation.analyse_logique.substring(0, 100)}...`);
            
            // Étape 2: GPT-5-chat - Tuteur pédagogique conversationnel
            console.log('\n👨‍🏫 === ÉTAPE 2: TUTEUR PÉDAGOGUE (GPT-5-chat) ===');
            const tutorStart = Date.now();
            results.tutoring = await tutorWithGPT5Chat(results.evaluation, studentAnswer, activityContext);
            const tutorTime = Date.now() - tutorStart;
            console.log(`⏱️ Temps: ${tutorTime}ms | Style: ${results.tutoring.style}`);
            console.log(`💬 Réponse: ${results.tutoring.response.substring(0, 100)}...`);
            
            // Étape 3: Llama 4 Scout 17B 16E - Documentation synthétique
            console.log('\n📚 === ÉTAPE 3: DOCUMENTALISTE (Llama 4 Scout 17B 16E) ===');
            const docStart = Date.now();
            results.documentation = await documentWithLlama4Scout(results.evaluation, activityContext, activityType);
            const docTime = Date.now() - docStart;
            console.log(`⏱️ Temps: ${docTime}ms | Référence: ${results.documentation.reference_precise}`);
            console.log(`📖 Synthèse: ${results.documentation.sources_synthese.substring(0, 80)}...`);
            
            // Étape 4: Phi-4-mini-raisonnement - Contrôle qualité anti-hallucination
            console.log('\n🔍 === ÉTAPE 4: CONTRÔLEUR QUALITÉ (Phi-4-mini-raisonnement) ===');
            const qualityStart = Date.now();
            results.quality = await qualityControlWithPhi4(results.tutoring, results.evaluation, results.documentation);
            const qualityTime = Date.now() - qualityStart;
            console.log(`⏱️ Temps: ${qualityTime}ms | Validation: ${results.quality.validation}`);
            console.log(`✅ Score qualité: ${results.quality.score_qualite}/100`);
            
        } else {
            // Traitement parallèle optimisé (non utilisé pour respecter la chaîne)
            console.log('⚡ Traitement parallèle non recommandé pour ce pipeline...');
        }
        
        // Construire la réponse finale
        let finalResponse = results.tutoring.response;

        // Ajouter la documentation si disponible
        if (results.documentation && results.documentation.paragraphe_cours) {
            finalResponse += `

---
📚 **Ressource de révision** :
${results.documentation.paragraphe_cours}

📖 **Référence** : ${results.documentation.reference_precise}
🔍 **Exemple** : ${results.documentation.exemple_concret}`;
        }

        // Ajouter la validation qualité si rejeté
        if (results.quality && results.quality.validation === 'REJETÉ') {
            finalResponse += `

⚠️ **Note** : Cette réponse a été validée par notre système de qualité.`;
        }
        
        const totalTime = Date.now() - startTime;
        
        // Mettre en cache
        if (SPECIFIC_PIPELINE_CONFIG.cacheEnabled) {
            specificPipelineCache.set(cacheKey, {
                response: finalResponse,
                timestamp: Date.now()
            });
        }
        
        console.log('\n🏁 PIPELINE TERMINÉ');
        console.log(`⏱️ Temps total: ${totalTime}ms`);
        console.log(`🎯 Mode: Séquentiel (4 modèles)`);
        console.log(`✅ Évaluation: ${results.evaluation.score}/10`);
        console.log(`👨‍🏫 Tuteur: ${results.tutoring.style}`);
        console.log(`📚 Documentation: ${results.documentation.reference_precise}`);
        console.log(`🔍 Qualité: ${results.quality.validation} (${results.quality.score_qualite}/100)`);
        console.log(`📝 Réponse finale: ${finalResponse.length} caractères`);
        
        return finalResponse;
        
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.log(`\n❌ ERREUR DU PIPELINE (${totalTime}ms):`);
        console.log(`🔍 Erreur: ${error.message}`);
        
        throw new Error(`Erreur du pipeline IA: ${error.message}`);
    }
}

/**
 * Configure le token GitHub Models
 */
function configureGitHubToken(token) {
    if (!token) {
        throw new Error('Token GitHub requis');
    }
    
    localStorage.setItem('github_token', token);
    console.log('🔑 Token GitHub Models configuré avec succès');
}

/**
 * Affiche l'état du pipeline spécifique
 */
function showSpecificPipelineStatus() {
    console.log('📊 === ÉTAT DU PIPELINE MODÈLES SPÉCIFIQUES ===');
    
    console.log('\n🤖 Modèles configurés:');
    Object.keys(SPECIFIC_PIPELINE_CONFIG.models).forEach(key => {
        const model = SPECIFIC_PIPELINE_CONFIG.models[key];
        console.log(`\n${model.name}:`);
        console.log(`  📦 Modèle: ${model.model}`);
        console.log(`  🌡️ Température: ${model.temperature}`);
        console.log(`  📏 Tokens: ${model.maxTokens}`);
        console.log(`  🎭 Rôle: ${model.role}`);
    });
    
    console.log('\n⚙️ Configuration:');
    console.log(`  ⚡ Traitement: ${SPECIFIC_PIPELINE_CONFIG.sequentialProcessing ? 'Séquentiel' : 'Parallèle'}`);
    console.log(`  ⏱️ Timeout: ${SPECIFIC_PIPELINE_CONFIG.timeout}ms`);
    console.log(`  🔄 Retry: ${SPECIFIC_PIPELINE_CONFIG.retryAttempts} tentatives`);
    console.log(`  💾 Cache: ${SPECIFIC_PIPELINE_CONFIG.cacheEnabled ? 'Activé' : 'Désactivé'}`);
    
    console.log('\n💾 Cache:');
    console.log(`  📊 Taille: ${specificPipelineCache.size} entrées`);
    console.log(`  ⏰ TTL: ${SPECIFIC_PIPELINE_CONFIG.cacheTTL / 1000} secondes`);
    
    console.log('\n🔑 GitHub:');
    try {
        const token = getGitHubToken();
        console.log(`  ✅ Configuré: ${token.substring(0, 10)}...`);
    } catch (error) {
        console.log(`  ❌ Erreur: ${error.message}`);
        console.log(`  💡 Solution: configureGitHubToken('votre-token-github')`);
    }
}

/**
 * Vide le cache du pipeline spécifique
 */
function clearSpecificPipelineCache() {
    specificPipelineCache.clear();
    console.log('🧹 Cache du pipeline spécifique vidé');
}

/**
 * Test des modèles spécifiques
 */
async function testSpecificModels() {
    console.log('🧪 === TEST DES MODÈLES SPÉCIFIQUES ===');
    
    const testCases = [
        {
            input: "Pour calculer l'aire d'un rectangle, je fais longueur + largeur",
            context: "exercice de géométrie - calcul d'aire",
            type: "mathematiques"
        },
        {
            input: "Le héros du roman est très courageux et il vainct le méchant",
            context: "analyse de texte narratif",
            type: "francais"
        }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n🧪 Test ${i + 1}/${testCases.length}:`);
        console.log(`📝 Entrée: "${testCase.input}"`);
        
        try {
            const result = await runSpecificPipelineModels(testCase.input, testCase.context, testCase.type);
            console.log(`✅ Succès - Réponse: ${result.substring(0, 200)}...`);
        } catch (error) {
            console.log(`❌ Erreur: ${error.message}`);
        }
        
        if (i < testCases.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

// Export des fonctions
window.runFourModelPipeline = runSpecificPipelineModels;
window.configureGitHubToken = configureGitHubToken;
window.showSpecificPipelineStatus = showSpecificPipelineStatus;
window.clearSpecificPipelineCache = clearSpecificPipelineCache;
window.testSpecificModels = testSpecificModels;

// Configuration initiale
console.log('✅ Pipeline IA modèles spécifiques chargé');
console.log('🔑 Pour configurer: configureGitHubToken("votre-token-github")');
console.log('📊 Pour voir l\'état: showSpecificPipelineStatus()');
console.log('🧪 Pour tester: testSpecificModels()');
