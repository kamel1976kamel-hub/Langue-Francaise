/**
 * =================================================================
 * CLOUDFLARE WORKERS - TUTEUR IA MULTI-AGENTS (VERSION SIMPLE)
 * =================================================================
 */

// Configuration - À REMPLACER
const GROQ_API_KEY = "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";

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
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status}`);
    }

    return await response.json();
}

// Agent 1 : Analyse logique
async function analyzeWithDeepSeek(studentMessage) {
    const messages = [
        {
            role: 'system',
            content: 'Tu es un évaluateur logique expert. Analyse la réponse en 10 lignes maximum.'
        },
        {
            role: 'user',
            content: `Réponse étudiant: ${studentMessage}`
        }
    ];

    return await callGroqModel('llama-3.1-8b-instant', messages, 0.1);
}

// Agent 2 : Tuteur pédagogue
async function tutorWithLlama3(analysis) {
    const messages = [
        {
            role: 'system',
            content: 'Tu es un tuteur bienveillant. Guide l\'étudiant en 10 lignes maximum.'
        },
        {
            role: 'user',
            content: `Analyse: ${analysis.choices[0].message.content}`
        }
    ];

    return await callGroqModel('llama-3.1-8b-instant', messages, 0.7);
}

// Agent 3 : Documentaliste
async function documentWithMixtral(tutorResponse) {
    const messages = [
        {
            role: 'system',
            content: 'Tu es un documentaliste. Donne des références en 10 lignes maximum.'
        },
        {
            role: 'user',
            content: `Réponse tuteur: ${tutorResponse.choices[0].message.content}`
        }
    ];

    return await callGroqModel('openai/gpt-oss-20b', messages, 0.3);
}

// Agent 4 : Validation
async function validateWithPhi3(documentation) {
    const messages = [
        {
            role: 'system',
            content: 'Tu es un contrôleur qualité. Valide la réponse en 10 lignes maximum.'
        },
        {
            role: 'user',
            content: `Documentation: ${documentation.choices[0].message.content}`
        }
    ];

    return await callGroqModel('llama-3.1-8b-instant', messages, 0.05);
}

// Pipeline principal
async function runPipeline(studentMessage) {
    try {
        console.log(`🚀 Pipeline pour: "${studentMessage}"`);

        // Étape 1: Analyse logique
        const analysis = await analyzeWithDeepSeek(studentMessage);

        // Étape 2: Tuteur pédagogue
        const tutor = await tutorWithLlama3(analysis);

        // Étape 3: Documentaliste
        const documentation = await documentWithMixtral(tutor);

        // Étape 4: Validation
        const validation = await validateWithPhi3(documentation);

        return {
            studentMessage,
            analysis: analysis.choices[0].message.content,
            tutor: tutor.choices[0].message.content,
            documentation: documentation.choices[0].message.content,
            validation: validation.choices[0].message.content,
            timestamp: new Date().toISOString(),
            pipeline: "cloudflare-workers-simple"
        };

    } catch (error) {
        console.error('❌ Erreur pipeline:', error);
        throw error;
    }
}

// Handler principal
export default {
    async fetch(request, env, ctx) {
        // CORS
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { 
                status: 405, 
                headers: corsHeaders 
            });
        }

        try {
            const body = await request.json();
            const { message } = body;

            if (!message) {
                return new Response(JSON.stringify({ 
                    error: 'Message requis' 
                }), { 
                    status: 400, 
                    headers: corsHeaders 
                });
            }

            // Lancer le pipeline
            const result = await runPipeline(message);

            return new Response(JSON.stringify(result), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });

        } catch (error) {
            console.error('❌ Erreur API:', error);
            return new Response(JSON.stringify({ 
                error: 'Erreur serveur',
                details: error.message 
            }), { 
                status: 500, 
                headers: corsHeaders 
            });
        }
    }
};
