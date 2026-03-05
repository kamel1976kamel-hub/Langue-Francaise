const express = require('express');
const cors = require('cors');
const { handler } = require('./functions/ai-pipeline.js');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques
app.use(express.static('.'));

// Endpoint pour le pipeline IA
app.post('/.netlify/functions/ai-pipeline', async (req, res) => {
    try {
        // Simuler l'événement Netlify
        const event = {
            body: JSON.stringify(req.body),
            headers: req.headers,
            httpMethod: 'POST'
        };
        
        const result = await handler(event);
        
        res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (error) {
        console.error('Erreur pipeline:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint pour la recherche RAG
app.post('/api/rag-search', async (req, res) => {
    try {
        const { query } = req.body;
        
        // TODO: Implémenter la recherche Weaviate
        res.json({ results: [], message: 'RAG à implémenter' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de santé
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📡 Pipeline IA disponible sur /.netlify/functions/ai-pipeline`);
});
