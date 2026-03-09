// ☁️ Client spaCy Cloud (Hugging Face)
// Alternative à l'installation locale de spaCy

console.log('☁️ Initialisation du client spaCy Cloud');

class SpacyCloudClient {
    constructor(apiKey = null) {
        this.apiKey = apiKey; // Token Hugging Face
        this.baseUrl = 'https://api-inference.huggingface.co/models';
        this.model = 'spacy/fr_core_news_sm';
        this.isAvailable = false;
        this.checkAvailability();
    }

    async checkAvailability() {
        if (!this.apiKey) {
            console.warn('⚠️ Clé API Hugging Face non fournie');
            this.isAvailable = false;
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/${this.model}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputs: "test" })
            });

            this.isAvailable = response.ok;
            console.log('☁️ spaCy Cloud disponible:', this.isAvailable);
            return this.isAvailable;
        } catch (error) {
            console.warn('⚠️ spaCy Cloud non disponible:', error.message);
            this.isAvailable = false;
            return false;
        }
    }

    async analyzeText(text, options = {}) {
        if (!this.isAvailable) {
            await this.checkAvailability();
            if (!this.isAvailable) {
                throw new Error('spaCy Cloud non disponible');
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/${this.model}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    inputs: text,
                    options: {
                        // Options Hugging Face si nécessaire
                        wait_for_model: true
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            return this.formatSpacyCloudResponse(data, text);
        } catch (error) {
            console.error('❌ Erreur analyse spaCy Cloud:', error);
            throw error;
        }
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

// Configuration du client spaCy Cloud
window.setupSpacyCloud = async function() {
    console.log('☁️ Configuration de spaCy Cloud...');
    
    // Obtenir la clé API
    const apiKey = SpacyCloudClient.getApiKey();
    if (!apiKey) {
        console.warn('⚠️ Pas de clé API, spaCy Cloud non disponible');
        return false;
    }
    
    // Créer le client
    window.spacyCloudClient = new SpacyCloudClient(apiKey);
    
    // Intégrer dans le pipeline
    if (window.hybridPipeline && window.hybridPipeline.modules.spacy) {
        const originalSpacy = window.hybridPipeline.modules.spacy;
        
        // Remplacer la méthode process
        window.hybridPipeline.modules.spacy.process = async function(text) {
            const startTime = Date.now();
            
            try {
                // Utiliser spaCy Cloud
                const result = await window.spacyCloudClient.analyzeText(text);
                const processingTime = Date.now() - startTime;
                
                return {
                    ...result,
                    processingTime: processingTime
                };
            } catch (error) {
                console.warn('⚠️ Erreur spaCy Cloud, fallback vers simulation:', error.message);
                
                // Fallback vers la simulation originale
                return await originalSpacy.process(text);
            }
        };
        
        console.log('✅ spaCy Cloud intégré dans le pipeline');
        return true;
    }
    
    return false;
};

// Exposition globale
window.SpacyCloudClient = SpacyCloudClient;
