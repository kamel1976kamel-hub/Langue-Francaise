/**
 * =================================================================
 * API CLOUDFLARE WORKERS - TUTEUR IA MULTI-AGENTS RAG
 * =================================================================
 */

// Configuration
const GROQ_API_KEY = 'votre_clé_api_groq_ici'; // À remplacer
const WEAVIATE_URL = 'https://votre-instance-weaviate.com'; // Optionnel

// Pipeline multi-agents
async function callGroqModel(model, messages, temperature = 0.2) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: temperature,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
}

// Agent 1 : Analyse logique
async function analyzeWithDeepSeek(studentAnswer, context, activityType) {
    const messages = [
        {
            role: 'system',
            content: 'Tu es un évaluateur logique expert. Analyse la réponse de l\'étudiant avec précision. Identifie les points forts, les erreurs, et les concepts manquants. Sois constructif et détaillé. Réponse MAXIMUM 10 lignes.'
        },
        {
            role: 'user',
            content: `Contexte: ${context}\nType: ${activityType}\nRéponse: "${studentAnswer}"`
        }
    ];

    return await callGroqModel('llama-3.1-8b-instant', messages, 0.1);
}

// Agent 2 : Tuteur pédagogue
async function tutorWithLlama3(analysis, context, activityType) {
    const messages = [
        {
            role: 'system',
            content: 'Tu es un tuteur pédagogue bienveillant. Transforme l\'analyse en une réponse encourageante. Donne des indices progressifs, pas de réponses directes. Réponse MAXIMUM 10 lignes.'
        },
        {
            role: 'user',
            content: `Analyse: ${analysis.choices[0].message.content}\nContexte: ${context}\nType: ${activityType}`
        }
    ];

    return await callGroqModel('llama-3.1-8b-instant', messages, 0.7);
}

// Agent 3 : Documentaliste
async function documentWithMixtral(tutorResponse, context, activityType) {
    const messages = [
        {
            role: 'system',
            content: 'Tu es un documentaliste expert. Trouve les références pertinentes. Sois précis et concis. Réponse MAXIMUM 10 lignes.'
        },
        {
            role: 'user',
            content: `Réponse tuteur: ${tutorResponse.choices[0].message.content}\nContexte: ${context}`
        }
    ];

    return await callGroqModel('openai/gpt-oss-20b', messages, 0.3);
}

// Agent 4 : Contrôleur qualité
async function validateWithPhi3(tutorResponse, documentation, studentAnswer) {
    const messages = [
        {
            role: 'system',
            content: 'Tu es un contrôleur qualité rigoureux. Valide la cohérence pédagogique. Donne un score qualité (0-100). Réponse MAXIMUM 10 lignes.'
        },
        {
            role: 'user',
            content: `Tuteur: ${tutorResponse.choices[0].message.content}\nDocumentation: ${documentation.choices[0].message.content}\nOriginal: ${studentAnswer}`
        }
    ];

    return await callGroqModel('llama-3.1-8b-instant', messages, 0.05);
}

// Recherche RAG (simplifié pour Cloudflare Workers)
async function searchRAG(query) {
    // TODO: Intégrer avec Weaviate ou HuggingFace
    // Pour l'instant, retourne une réponse simulée
    return {
        context: "Documents pertinents trouvés dans les cours de mathématiques et français.",
        references: ["Chapitre 3 - Géométrie", "Page 42 - Formules d'aire"]
    };
}

// Pipeline principal
async function runPipeline(studentAnswer, context = "", activityType = "général") {
    try {
        console.log(`🚀 Pipeline pour: "${studentAnswer}"`);

        // Étape 1: Analyse logique
        const analysis = await analyzeWithDeepSeek(studentAnswer, context, activityType);

        // Étape 2: Tuteur pédagogue
        const tutor = await tutorWithLlama3(analysis, context, activityType);

        // Étape 3: Documentaliste
        const documentation = await documentWithMixtral(tutor, context, activityType);

        // Étape 4: Validation
        const validation = await validateWithPhi3(tutor, documentation, studentAnswer);

        return {
            studentAnswer,
            activityContext: context,
            activityType,
            analysis: analysis.choices[0].message.content,
            tutor: tutor.choices[0].message.content,
            documentation: documentation.choices[0].message.content,
            validation: validation.choices[0].message.content,
            timestamp: new Date().toISOString(),
            pipeline: "cloudflare-workers-multi-agents"
        };

    } catch (error) {
        console.error('❌ Erreur pipeline:', error);
        throw error;
    }
}

// Endpoint principal de l'API
export default {
    async fetch(request, env, ctx) {
        // CORS
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Gérer les requêtes OPTIONS (CORS preflight)
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Uniquement les requêtes POST
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { 
                status: 405, 
                headers: corsHeaders 
            });
        }

        try {
            const body = await request.json();
            const { message, context, activityType } = body;

            if (!message) {
                return new Response(JSON.stringify({ 
                    error: 'Message requis' 
                }), { 
                    status: 400, 
                    headers: corsHeaders 
                });
            }

            // Lancer le pipeline
            const result = await runPipeline(message, context, activityType);

            return new Response(JSON.stringify(result), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });

        } catch (error) {
            console.error('❌ Erreur API:', error);
            return new Response(JSON.stringify({ 
                error: 'Erreur interne du serveur',
                details: error.message 
            }), { 
                status: 500, 
                headers: corsHeaders 
            });
        }
    }
};
