// === MODULE IA/STATISTIQUE AVEC GROQ ===
// Analyse linguistique avancée avec modèle de langage réel

console.log('🧠 Initialisation du module IA Groq pour analyse linguistique');

// Configuration de l'API Groq
const GROQ_CONFIG = {
    apiKey: 'gsk_JEJvBA...', // Remplacer par votre vraie clé Groq
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama3-70b-8192', // ou 'mixtral-8x7b-32768'
    maxTokens: 500,
    temperature: 0.3
};

// Fonction pour appeler l'API Groq
async function callGroqAPI(prompt) {
    try {
        const response = await fetch(`${GROQ_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_CONFIG.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: GROQ_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un expert linguistique français. Analyse les textes et propose des améliorations de style, de fluidité et de formulation. Retourne uniquement des suggestions structurées en JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: GROQ_CONFIG.maxTokens,
                temperature: GROQ_CONFIG.temperature
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('❌ Erreur API Groq:', error.message);
        return null;
    }
}

// Analyse IA complète du texte
window.groqAIAnalysis = async function(text) {
    if (!text || text.length < 10) {
        return [];
    }

    const prompt = `Analyse linguistique complète du texte ci-dessous :
Propose des reformulations ou corrections de style, de fluidité ou de tournures maladroites.
Texte : "${text}"

Retourne une liste structurée de suggestions au format JSON :
[
  {
    "rule_id": "IA_001",
    "message": "Description du problème",
    "suggestion": "Texte suggéré",
    "start": 12,
    "end": 25,
    "priority": 70,
    "category": "style|fluidite|formulation"
  }
]

Focus sur :
- Tournures familières à améliorer
- Phrases lourdes ou répétitives  
- Formulations maladroites
- Suggestions de reformulations plus fluides
- Problèmes de cohérence`;

    try {
        const response = await callGroqAPI(prompt);
        if (!response) return [];

        // Tenter de parser la réponse JSON
        let suggestions = [];
        try {
            suggestions = JSON.parse(response);
        } catch (parseError) {
            // Si le parsing échoue, extraire manuellement
            suggestions = extractSuggestionsFromText(response);
        }

        // Valider et normaliser les suggestions
        return suggestions.filter(s => 
            s.rule_id && 
            s.message && 
            s.suggestion && 
            typeof s.start === 'number' && 
            typeof s.end === 'number'
        ).map(s => ({
            rule_id: s.rule_id || 'IA_001',
            message: s.message || 'Suggestion d\'amélioration',
            suggestion: s.suggestion || '',
            start: Math.max(0, s.start || 0),
            end: Math.min(text.length, s.end || s.start + 5),
            priority: s.priority || 70,
            category: s.category || 'style'
        }));

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse IA:', error);
        return [];
    }
};

// Extraction manuelle des suggestions si le parsing JSON échoue
function extractSuggestionsFromText(text) {
    const suggestions = [];
    const lines = text.split('\n');
    
    let currentSuggestion = null;
    
    for (const line of lines) {
        // Détection de début de suggestion
        if (line.includes('rule_id') || line.includes('IA_')) {
            if (currentSuggestion) {
                suggestions.push(currentSuggestion);
            }
            currentSuggestion = {
                rule_id: 'IA_001',
                message: '',
                suggestion: '',
                start: 0,
                end: 0,
                priority: 70,
                category: 'style'
            };
        }
        
        // Extraction des informations
        if (line.includes('message:')) {
            const message = line.split('message:')[1]?.trim().replace(/"/g, '');
            if (currentSuggestion && message) currentSuggestion.message = message;
        }
        
        if (line.includes('suggestion:')) {
            const suggestion = line.split('suggestion:')[1]?.trim().replace(/"/g, '');
            if (currentSuggestion && suggestion) currentSuggestion.suggestion = suggestion;
        }
        
        if (line.includes('start:')) {
            const start = parseInt(line.split('start:')[1]?.trim());
            if (currentSuggestion && !isNaN(start)) currentSuggestion.start = start;
        }
        
        if (line.includes('end:')) {
            const end = parseInt(line.split('end:')[1]?.trim());
            if (currentSuggestion && !isNaN(end)) currentSuggestion.end = end;
        }
        
        if (line.includes('priority:')) {
            const priority = parseInt(line.split('priority:')[1]?.trim());
            if (currentSuggestion && !isNaN(priority)) currentSuggestion.priority = priority;
        }
    }
    
    if (currentSuggestion) {
        suggestions.push(currentSuggestion);
    }
    
    return suggestions;
}

// Analyse rapide avec cache pour éviter les appels répétés
const analysisCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

window.groqAIAnalysisCached = async function(text) {
    const cacheKey = text.substring(0, 100); // Clé basée sur le début du texte
    
    // Vérifier le cache
    if (analysisCache.has(cacheKey)) {
        const cached = analysisCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('📋 Utilisation de l\'analyse IA en cache');
            return cached.suggestions;
        }
    }
    
    // Nouvelle analyse
    const suggestions = await window.groqAIAnalysis(text);
    
    // Mettre en cache
    analysisCache.set(cacheKey, {
        suggestions: suggestions,
        timestamp: Date.now()
    });
    
    // Nettoyer le cache si trop grand
    if (analysisCache.size > 50) {
        const oldestKey = analysisCache.keys().next().value;
        analysisCache.delete(oldestKey);
    }
    
    return suggestions;
};

console.log('✅ Module IA Groq initialisé avec cache');
