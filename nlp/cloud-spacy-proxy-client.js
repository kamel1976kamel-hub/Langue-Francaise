// 🌐 Client spaCy Cloud via Proxy Local
// Résout le problème CORS en utilisant un serveur proxy local

console.log('🌐 Initialisation du client spaCy Cloud via proxy');

class SpacyProxyClient {
    constructor(proxyUrl = 'http://localhost:8001') {
        this.proxyUrl = proxyUrl;
        this.isAvailable = false;
        this.checkAvailability();
    }

    async checkAvailability() {
        try {
            console.log('🔍 Test de disponibilité du proxy spaCy...');
            
            const response = await fetch(`${this.proxyUrl}/health`);
            const data = await response.json();
            
            this.isAvailable = response.ok && data.status === 'healthy';
            console.log('✅ Proxy spaCy disponible:', this.isAvailable);
            return this.isAvailable;
        } catch (error) {
            console.warn('⚠️ Proxy spaCy non disponible:', error.message);
            this.isAvailable = false;
            return false;
        }
    }

    async analyzeText(text, options = {}) {
        if (!this.isAvailable) {
            await this.checkAvailability();
            if (!this.isAvailable) {
                throw new Error('Proxy spaCy non disponible');
            }
        }

        try {
            console.log('🔍 Analyse spaCy via proxy du texte:', text);

            const response = await fetch(`${this.proxyUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    inputs: text,
                    options: {
                        wait_for_model: true,
                        use_cache: false,
                        ...options
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erreur proxy spaCy:', response.status, errorText);
                throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📊 Réponse proxy spaCy:', data);
            
            return this.formatProxyResponse(data, text);
        } catch (error) {
            console.error('❌ Erreur analyse proxy spaCy:', error);
            throw error;
        }
    }

    formatProxyResponse(data, originalText) {
        console.log('🔄 Formatage réponse proxy spaCy...');
        
        let tokens = [];
        let entities = [];
        
        // Le proxy retourne la réponse directe de Hugging Face
        if (Array.isArray(data) && data.length > 0) {
            const result = data[0];
            
            // Extraire les tokens
            if (result.tokens) {
                tokens = result.tokens.map((token, i) => ({
                    text: token.text || token.word || '',
                    lemma: token.lemma || token.text || '',
                    pos: token.pos || token.tag || 'NOUN',
                    tag: token.tag || token.pos || 'NN',
                    dep: token.dep || 'ROOT',
                    head: token.head || 'ROOT',
                    index: i,
                    start: token.start || 0,
                    end: token.end || token.text?.length || 0
                }));
            }
            
            // Extraire les entités
            if (result.ents) {
                entities = result.ents.map(ent => ({
                    text: ent.text || ent.word || '',
                    label: ent.label || ent.type || 'ENTITY',
                    start: ent.start || 0,
                    end: ent.end || ent.text?.length || 0,
                    confidence: ent.score || ent.confidence || 0.8
                }));
            }
        }

        // Fallback si structure différente
        if (tokens.length === 0) {
            console.log('⚠️ Fallback tokenisation basique via proxy');
            const words = originalText.split(/\s+/);
            tokens = words.map((word, i) => ({
                text: word,
                lemma: word.toLowerCase(),
                pos: 'NOUN',
                tag: 'NN',
                dep: 'ROOT',
                head: 'ROOT',
                index: i,
                start: originalText.indexOf(word),
                end: originalText.indexOf(word) + word.length
            }));
        }

        const result = {
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
            corrections: [], // spaCy ne fait pas de corrections directement
            processingTime: 200, // Estimation pour appel via proxy
            metadata: {
                module: 'spaCy-Proxy',
                language: 'fr',
                model: 'spacy/fr_core_news_sm',
                tokensCount: tokens.length,
                entitiesCount: entities.length,
                correctionsCount: 0,
                source: 'huggingface-proxy',
                proxyUrl: this.proxyUrl
            }
        };

        console.log('✅ Résultat proxy formaté:', result);
        return result;
    }

    async testConnection() {
        console.log('🧪 Test de connexion du proxy spaCy...');
        
        try {
            const response = await fetch(`${this.proxyUrl}/test`);
            const data = await response.json();
            
            if (data.status === 'success') {
                console.log('🎉 Test proxy spaCy réussi !');
                console.log('📊 Exemple de résultat:', data.sample_result);
                return data;
            } else {
                throw new Error(data.message || 'Test proxy échoué');
            }
        } catch (error) {
            console.error('❌ Test proxy spaCy échoué:', error);
            throw error;
        }
    }

    async startProxy() {
        console.log('🚀 Tentative de démarrage du proxy spaCy...');
        
        try {
            // Vérifier si le proxy est déjà en cours
            const healthResponse = await fetch(`${this.proxyUrl}/health`);
            if (healthResponse.ok) {
                console.log('✅ Proxy spaCy déjà démarré');
                return true;
            }
        } catch (error) {
            console.log('ℹ️ Proxy spaCy pas démarré, tentative de lancement...');
        }
        
        // Instructions pour l'utilisateur
        console.log('📝 Pour démarrer le proxy spaCy :');
        console.log('1. Ouvrir un terminal dans nlp/python-server/');
        console.log('2. Exécuter: python proxy-server.py');
        console.log('3. Attendre le message "Running on http://localhost:8001"');
        
        return false;
    }
}

// Créer le client proxy
window.spacyProxyClient = new SpacyProxyClient();

// Fonction pour intégrer spaCy Proxy dans le pipeline
window.integrateSpacyProxy = async function() {
    console.log('🔗 Intégration de spaCy Proxy dans le pipeline...');
    
    // D'abord essayer de démarrer le proxy
    await window.spacyProxyClient.startProxy();
    
    // Vérifier la disponibilité
    if (!window.spacyProxyClient.isAvailable) {
        await window.spacyProxyClient.checkAvailability();
    }
    
    if (!window.spacyProxyClient.isAvailable) {
        console.warn('⚠️ spaCy Proxy non disponible');
        return false;
    }
    
    // Intégrer dans le pipeline existant
    if (window.hybridPipeline && window.hybridPipeline.modules.spacy) {
        const originalSpacy = window.hybridPipeline.modules.spacy;
        
        // Remplacer la méthode process
        window.hybridPipeline.modules.spacy.process = async function(text) {
            const startTime = Date.now();
            
            try {
                console.log('🌐 Utilisation de spaCy Proxy pour:', text);
                
                // Utiliser spaCy Proxy
                const result = await window.spacyProxyClient.analyzeText(text);
                const processingTime = Date.now() - startTime;
                
                console.log('✅ spaCy Proxy terminé en', processingTime, 'ms');
                
                return {
                    ...result,
                    processingTime: processingTime
                };
            } catch (error) {
                console.warn('⚠️ Erreur spaCy Proxy, fallback vers simulation:', error.message);
                
                // Fallback vers la simulation originale
                return await originalSpacy.process(text);
            }
        };
        
        console.log('✅ spaCy Proxy intégré avec succès dans le pipeline !');
        return true;
    }
    
    console.warn('⚠️ Pipeline non disponible pour intégration spaCy Proxy');
    return false;
};

// Auto-intégration après 3 secondes
setTimeout(async () => {
    console.log('🚀 Tentative d\'intégration automatique spaCy Proxy...');
    
    // D'abord tester le proxy
    try {
        await window.spacyProxyClient.testConnection();
        console.log('✅ spaCy Proxy fonctionnel');
    } catch (error) {
        console.log('ℹ️ spaCy Proxy non encore démarré');
    }
    
    // Ensuite intégrer
    const success = await window.integrateSpacyProxy();
    
    if (success) {
        console.log('🎉 spaCy Proxy est maintenant utilisé dans votre pipeline !');
    } else {
        console.log('ℹ️ spaCy Proxy non disponible, utilisation de la simulation JS');
        console.log('📝 Pour activer spaCy Proxy :');
        console.log('1. cd nlp/python-server');
        console.log('2. python proxy-server.py');
        console.log('3. Actualisez cette page');
    }
}, 3000);

// Exposition globale
window.SpacyProxyClient = SpacyProxyClient;

console.log('🌐 spaCy Proxy client configuré et prêt !');
