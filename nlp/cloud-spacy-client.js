// ☁️ Client spaCy Cloud (Hugging Face)
// Alternative à l'installation locale de spaCy

console.log('☁️ Initialisation du client spaCy Cloud');

class SpacyCloudClient {
    constructor() {
        this.model = 'spacy/fr_core_news_sm';
        this.isAvailable = false;
    }

    async checkAvailability() {
        return false;
    }

    async analyzeText() {
        throw new Error('spaCy Cloud requires a trusted server-side service.');
    }

    formatSpacyCloudResponse(data, originalText) {
        // Convertit la réponse Hugging Face au format attendu
        // Note: Le format exact dépend du modèle spaCy sur Hugging Face
        
        let tokens = [];
        let entities = [];
        
        // Parser la réponse (format peut varier)
        if (Array.isArray(data) && data.length > 0) {
            const result = data[0];
            
            // Tokens (si disponible)
            if (result.tokens) {
                tokens = result.tokens.map((token, i) => ({
                    text: token.text || token.word,
                    lemma: token.lemma || token.text,
                    pos: token.pos || token.tag,
                    tag: token.tag || token.pos,
                    dep: token.dep || 'ROOT',
                    head: token.head || 'ROOT',
                    index: i
                }));
            }
            
            // Entités (si disponible)
            if (result.entities) {
                entities = result.entities.map(ent => ({
                    text: ent.text || ent.word,
                    label: ent.label || ent.type,
                    start: ent.start || 0,
                    end: ent.end || ent.text.length,
                    confidence: ent.score || 0.8
                }));
            }
        }

        // Fallback si structure différente
        if (tokens.length === 0) {
            // Tokenisation basique
            tokens = originalText.split(/\s+/).map((token, i) => ({
                text: token,
                lemma: token.toLowerCase(),
                pos: 'NOUN',
                tag: 'NN',
                dep: 'ROOT',
                head: 'ROOT',
                index: i
            }));
        }

        return {
            analysis: {
                tokens: tokens,
                entities: entities,
                dependencies: tokens.map(token => ({
                    text: token.text,
                    dep: token.dep,
                    head: token.head,
                    children: []
                }))
            },
            corrections: [], // spaCy Cloud ne fait pas de corrections directement
            processingTime: 100, // Estimation
            metadata: {
                module: 'spaCy-Cloud',
                language: 'fr',
                model: this.model,
                tokensCount: tokens.length,
                entitiesCount: entities.length,
                correctionsCount: 0
            }
        };
    }

    // Méthode pour obtenir une clé API Hugging Face
    static getApiKey() {
        // Demander à l'utilisateur de fournir sa clé
        const apiKey = prompt('Entrez votre clé API Hugging Face pour spaCy Cloud:');
        return apiKey;
    }
}

// Cloud inference is disabled in the browser; configure a trusted server-side service first.
window.setupSpacyCloud = async function() {
    console.warn('spaCy Cloud is unavailable in the browser; local analysis remains active.');
    return false;
};

// Exposition globale
window.SpacyCloudClient = SpacyCloudClient;
