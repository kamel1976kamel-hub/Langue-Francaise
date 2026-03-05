const fetch = require("node-fetch");
const RAGService = require("../rag-service.js");

exports.handler = async function(event) {
    const apiKey = process.env.GROQ_API_KEY;
    const body = JSON.parse(event.body);

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Groq API key not configured' })
        };
    }

    // Initialiser le service RAG
    const ragService = new RAGService();

    async function callModel(model, messages, temperature = 0.2) {
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: temperature,
                    max_tokens: 2000
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    try {
        // réponse étudiant
        const student = body.message;
        const context = body.context || "";
        const activityType = body.activityType || "général";

        console.log(`🚀 Début du pipeline IA avec RAG pour: "${student}"`);

        // 🔍 ÉTAPE 0: Recherche RAG
        let ragContext = "";
        try {
            const ragResults = await ragService.searchDocuments(student, 3);
            ragContext = ragService.formatContext(ragResults);
            console.log("📚 Contexte RAG obtenu");
        } catch (error) {
            console.log("⚠️ RAG indisponible, continuation sans contexte");
            ragContext = "Aucun document de cours disponible.";
        }

        // Agent 1 : analyse logique avec contexte RAG
        const analysis = await callModel(
            "llama-3.1-8b-instant",
            [
                {
                    role: "system",
                    content: `Tu es un évaluateur logique expert. Analyse la réponse de l'étudiant avec précision.

CONTEXTE DES COURS:
${ragContext}

Utilise ce contexte pour enrichir ton analyse si pertinent.`
                },
                {
                    role: "user",
                    content: `Contexte: ${context}\nType d'activité: ${activityType}\nRéponse de l'étudiant: ${student}\n\nAnalyse cette réponse en détail.`
                }
            ],
            0.1
        );

        // Agent 2 : tuteur pédagogique
        const tutor = await callModel(
            "llama-3.1-8b-instant",
            [
                {
                    role: "system",
                    content: `Tu es un tuteur pédagogue empathique. Guide l'étudiant avec bienveillance.

CONTEXTE DES COURS:
${ragContext}

Réfère-toi aux documents de cours quand c'est pertinent.`
                },
                {
                    role: "user",
                    content: `Analyse technique: ${analysis.choices[0].message.content}\n\nAide l'étudiant à progresser.`
                }
            ],
            0.7
        );

        // Agent 3 : documentaliste RAG
        const doc = await callModel(
            "openai/gpt-oss-20b",
            [
                {
                    role: "system",
                    content: `Tu es un documentaliste expert. Utilise les documents de cours fournis.

CONTEXTE DES COURS:
${ragContext}

Base tes références sur ces documents.`
                },
                {
                    role: "user",
                    content: `Réponse du tuteur: ${tutor.choices[0].message.content}\n\nTrouve les références précises dans les cours.`
                }
            ],
            0.3
        );

        // Agent 4 : validation finale
        const validation = await callModel(
            "llama-3.1-8b-instant",
            [
                {
                    role: "system",
                    content: `Tu es un contrôleur qualité rigoureux. Valide la cohérence pédagogique.

CONTEXTE DES COURS:
${ragContext}

Assure-toi que la réponse est alignée avec les documents de cours.`
                },
                {
                    role: "user",
                    content: `Réponse finale: ${doc.choices[0].message.content}\n\nValide cette réponse.`
                }
            ],
            0.05
        );

        const result = {
            studentAnswer: student,
            activityContext: context,
            activityType: activityType,
            ragContext: ragContext,
            analysis: analysis.choices[0].message.content,
            tutor: tutor.choices[0].message.content,
            documentation: doc.choices[0].message.content,
            validation: validation.choices[0].message.content,
            timestamp: new Date().toISOString(),
            pipeline: "multi-agents-RAG"
        };

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('❌ Erreur pipeline RAG:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Pipeline execution failed',
                details: error.message 
            })
        };
    }
};
