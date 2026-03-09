// 🐍 Client JavaScript pour spaCy Python API
// Remplace la simulation JavaScript par de vrais appels spaCy

console.log('🐍 Initialisation du client spaCy Python API');

class SpacyPythonClient {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
        this.isAvailable = false;
        this.checkAvailability();
    }

    async checkAvailability() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            this.isAvailable = data.spacy_loaded;
            console.log('🐍 spaCy Python API disponible:', this.isAvailable);
            return this.isAvailable;
        } catch (error) {
            console.warn('⚠️ spaCy Python API non disponible:', error.message);
            this.isAvailable = false;
            return false;
        }
    }

    async analyzeText(text, options = {}) {
        if (!this.isAvailable) {
            await this.checkAvailability();
            if (!this.isAvailable) {
                throw new Error('spaCy Python API non disponible');
            }
        }

        const payload = {
            text: text,
            include_entities: options.includeEntities !== false,
            include_pos: options.includePOS !== false,
            include_dependencies: options.includeDependencies !== false
        };

        try {
            const response = await fetch(`${this.baseUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            return this.formatSpacyResponse(data);
        } catch (error) {
            console.error('❌ Erreur analyse spaCy:', error);
            throw error;
        }
    }

    async getTokens(text) {
        const response = await fetch(`${this.baseUrl}/tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`Erreur tokens: ${response.status}`);
        }

        return await response.json();
    }

    async getEntities(text) {
        const response = await fetch(`${this.baseUrl}/entities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`Erreur entities: ${response.status}`);
        }

        return await response.json();
    }

    async getDependencies(text) {
        const response = await fetch(`${this.baseUrl}/dependencies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`Erreur dependencies: ${response.status}`);
        }

        return await response.json();
    }

    async getCorrections(text) {
        const response = await fetch(`${this.baseUrl}/corrections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`Erreur corrections: ${response.status}`);
        }

        return await response.json();
    }

    formatSpacyResponse(data) {
        // Convertit la réponse spaCy Python au format attendu par le pipeline
        return {
            analysis: {
                tokens: data.tokens.map(token => ({
                    text: token.text,
                    lemma: token.lemma,
                    pos: token.pos,
                    tag: token.tag,
                    dep: token.dep,
                    head: token.head,
                    index: token.index
                })),
                entities: data.entities,
                dependencies: data.tokens.map(token => ({
                    text: token.text,
                    dep: token.dep,
                    head: token.head,
                    children: token.children
                }))
            },
            corrections: data.corrections.map(correction => ({
                start: correction.start,
                end: correction.end,
                original: correction.original,
                corrected: correction.corrected,
                type: correction.type,
                confidence: correction.confidence,
                explanation: correction.explanation,
                rule_id: `spacy_${correction.type}`,
                category: correction.type,
                source: 'spacy-python'
            })),
            processingTime: data.processing_time,
            metadata: {
                module: 'spaCy-Python',
                language: 'fr',
                model: 'fr_core_news_sm',
                tokensCount: data.tokens.length,
                entitiesCount: data.entities.length,
                correctionsCount: data.corrections.length
            }
        };
    }
}

// Remplacement du spaCy simulé par le client Python
window.spacyPythonClient = new SpacyPythonClient();

// Fonction pour intégrer spaCy Python dans le pipeline existant
window.replaceSpacyWithPython = async function() {
    console.log('🔄 Remplacement spaCy simulé par spaCy Python...');
    
    if (!window.spacyPythonClient.isAvailable) {
        console.warn('⚠️ spaCy Python non disponible, conservation de la simulation');
        return false;
    }

    // Remplacer les méthodes du module spaCy existant
    if (window.hybridPipeline && window.hybridPipeline.modules.spacy) {
        const originalSpacy = window.hybridPipeline.modules.spacy;
        
        // Remplacer la méthode process
        window.hybridPipeline.modules.spacy.process = async function(text) {
            const startTime = Date.now();
            
            try {
                // Utiliser spaCy Python
                const result = await window.spacyPythonClient.analyzeText(text);
                const processingTime = Date.now() - startTime;
                
                return {
                    ...result,
                    processingTime: processingTime
                };
            } catch (error) {
                console.warn('⚠️ Erreur spaCy Python, fallback vers simulation:', error.message);
                
                // Fallback vers la simulation originale
                return await originalSpacy.process(text);
            }
        };
        
        console.log('✅ spaCy Python intégré dans le pipeline');
        return true;
    }
    
    return false;
};

// Auto-intégration après le chargement
setTimeout(async () => {
    const success = await window.replaceSpacyWithPython();
    if (success) {
        console.log('🎉 spaCy Python est maintenant utilisé dans le pipeline !');
    }
}, 1000);

// Exposition globale
window.SpacyPythonClient = SpacyPythonClient;
