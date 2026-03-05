exports.handler = async function(event) {
    const apiKey = process.env.GROQ_API_KEY;
    const body = JSON.parse(event.body);

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Groq API key not configured' })
        };
    }

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
                    max_tokens: 1000
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

        // Agent 1 : analyse logique (DeepSeek R1 Distill Qwen)
        const analysis = await callModel(
            "deepseek-r1-distill-qwen-32b",
            [
                {
                    role: "system",
                    content: "Tu es un évaluateur logique expert. Analyse la réponse de l'étudiant avec précision. Identifie les points forts, les erreurs de raisonnement, et les concepts manquants. Sois constructif et détaillé."
                },
                {
                    role: "user",
                    content: `Contexte: ${context}\nType d'activité: ${activityType}\nRéponse de l'étudiant: ${student}\n\nAnalyse cette réponse en détail.`
                }
            ],
            0.1 // Température basse pour analyse précise
        );

        // Agent 2 : tuteur (Llama 3 70B)
        const tutor = await callModel(
            "llama3-70b-8192",
            [
                {
                    role: "system",
                    content: "Tu es un tuteur pédagogue empathique et expérimenté. Transforme l'analyse technique en une réponse encourageante qui guide l'étudiant sans donner directement les réponses. Utilise des questions ouvertes, des indices progressifs et un ton bienveillant."
                },
                {
                    role: "user",
                    content: `Analyse technique: ${analysis.choices[0].message.content}\n\nAide l'étudiant à progresser avec une approche pédagogique constructive.`
                }
            ],
            0.7 // Température moyenne pour discussion naturelle
        );

        // Agent 3 : documentaliste (Mixtral 8x7B)
        const doc = await callModel(
            "mixtral-8x7b-32768",
            [
                {
                    role: "system",
                    content: "Tu es un documentaliste expert en pédagogie. Trouve les références précises, les pages de manuels, et les exemples concrets qui correspondent aux difficultés identifiées. Sois précis et utile pour l'apprentissage."
                },
                {
                    role: "user",
                    content: `Réponse du tuteur: ${tutor.choices[0].message.content}\n\nTrouve les références de cours, les exemples pratiques et les ressources d'apprentissage pertinentes.`
                }
            ],
            0.3 // Température basse pour précision
        );

        // Agent 4 : validation (Phi-3 Mini)
        const validation = await callModel(
            "phi3-mini",
            [
                {
                    role: "system",
                    content: "Tu es un contrôleur de qualité pédagogique. Vérifie que la réponse finale est correcte, encourageante, ne contient pas d'erreurs, et aide vraiment l'étudiant à apprendre. Valide la qualité globale."
                },
                {
                    role: "user",
                    content: `Réponse finale: ${tutor.choices[0].message.content}\nRéférences: ${doc.choices[0].message.content}\n\nValide la qualité pédagogique de cette réponse.`
                }
            ],
            0.05 // Température très basse pour validation stricte
        );

        // Construire la réponse finale
        const finalResponse = {
            analysis: analysis.choices[0].message.content,
            tutor: tutor.choices[0].message.content,
            documentation: doc.choices[0].message.content,
            validation: validation.choices[0].message.content,
            final: {
                message: tutor.choices[0].message.content,
                references: doc.choices[0].message.content,
                quality: validation.choices[0].message.content
            }
        };

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(finalResponse)
        };

    } catch (error) {
        console.error('Pipeline error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: 'Pipeline execution failed',
                details: error.message 
            })
        };
    }
};
