// 🌐 SERVEUR API POUR LA BASE DE DONNÉES NLP
// Node.js + Express + MySQL

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'nlp_rules',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4'
};

let db;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Connexion à la base de données
async function connectDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('✅ Connecté à la base de données MySQL');
        
        // Tester la connexion
        await db.query('SELECT 1');
        console.log('📊 Base de données accessible');
        
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error);
        console.log('🔄 Mode fallback activé');
        db = null;
    }
}

// Routes API
app.post('/api/nlp/query', async (req, res) => {
    try {
        const { sql, params = [] } = req.body;
        
        if (!db) {
            return res.status(503).json({ 
                error: 'Base de données non disponible',
                fallback: true 
            });
        }

        if (!sql) {
            return res.status(400).json({ error: 'Requête SQL manquante' });
        }

        // Sécurité basique - ne permettre que les SELECT
        if (!sql.trim().toLowerCase().startsWith('select')) {
            return res.status(403).json({ error: 'Seules les requêtes SELECT sont autorisées' });
        }

        const [rows] = await db.execute(sql, params);
        res.json(rows);

    } catch (error) {
        console.error('Erreur de requête:', error);
        res.status(500).json({ 
            error: 'Erreur de base de données',
            details: error.message 
        });
    }
});

// Route pour obtenir toutes les règles
app.get('/api/nlp/rules', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ 
                error: 'Base de données non disponible',
                fallback: true 
            });
        }

        const [rows] = await db.execute(`
            SELECT 
                rule_id as id,
                name,
                category,
                pattern_type,
                pattern,
                correction,
                explanation,
                example,
                priority
            FROM linguistic_rules 
            WHERE is_active = TRUE 
            ORDER BY category, priority DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error('Erreur lors du chargement des règles:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour obtenir les règles par catégorie
app.get('/api/nlp/rules/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const validCategories = ['style', 'vocabulaire', 'conjugaison', 'orthographe'];
        
        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: 'Catégorie invalide' });
        }

        if (!db) {
            return res.status(503).json({ 
                error: 'Base de données non disponible',
                fallback: true 
            });
        }

        const [rows] = await db.execute(`
            SELECT 
                rule_id as id,
                name,
                category,
                pattern_type,
                pattern,
                correction,
                explanation,
                example,
                priority
            FROM linguistic_rules 
            WHERE category = ? AND is_active = TRUE 
            ORDER BY priority DESC
        `, [category]);

        res.json(rows);

    } catch (error) {
        console.error(`Erreur lors du chargement des règles ${category}:`, error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour ajouter une règle
app.post('/api/nlp/rules', async (req, res) => {
    try {
        const { rule_id, name, category, pattern_type, pattern, correction, explanation, example, priority } = req.body;
        
        if (!db) {
            return res.status(503).json({ 
                error: 'Base de données non disponible',
                fallback: true 
            });
        }

        const [result] = await db.execute(`
            INSERT INTO linguistic_rules (
                rule_id, name, category, pattern_type, pattern, correction, 
                explanation, example, priority
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [rule_id, name, category, pattern_type || 'regex', pattern, correction, explanation, example, priority || 50]);

        res.json({ 
            success: true, 
            id: result.insertId,
            message: 'Règle ajoutée avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de l\'ajout de la règle:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'ID de règle déjà existant' });
        } else {
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
});

// Route pour mettre à jour les statistiques d'utilisation
app.post('/api/nlp/rules/:ruleId/usage', async (req, res) => {
    try {
        const { ruleId } = req.params;
        const { success = true, confidence = 0 } = req.body;
        
        if (!db) {
            return res.status(503).json({ 
                error: 'Base de données non disponible',
                fallback: true 
            });
        }

        await db.execute(`
            CALL UpdateRuleUsage(?, ?, ?)
        `, [ruleId, success, confidence]);

        res.json({ success: true });

    } catch (error) {
        console.error('Erreur lors de la mise à jour des statistiques:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour obtenir les statistiques
app.get('/api/nlp/stats', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ 
                error: 'Base de données non disponible',
                fallback: true 
            });
        }

        const [rows] = await db.execute(`
            SELECT 
                lr.rule_id,
                lr.name,
                lr.category,
                COALESCE(SUM(rus.usage_count), 0) as total_usage,
                COALESCE(SUM(rus.success_count), 0) as total_success,
                COALESCE(AVG(rus.avg_confidence), 0) as avg_confidence
            FROM linguistic_rules lr
            LEFT JOIN rule_usage_stats rus ON lr.rule_id = rus.rule_id
            WHERE lr.is_active = TRUE
            GROUP BY lr.rule_id, lr.name, lr.category
            ORDER BY total_usage DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({
        status: db ? 'healthy' : 'degraded',
        database: db ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Servir l'application principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'index.html'));
});

// Démarrage du serveur
async function startServer() {
    await connectDB();
    
    app.listen(PORT, () => {
        console.log(`🌐 Serveur API NLP démarré sur http://localhost:${PORT}`);
        console.log(`📊 Base de données: ${db ? 'Connectée' : 'Mode fallback'}`);
        console.log(`🔗 API disponible: http://localhost:${PORT}/api/nlp`);
        console.log(`🏠 Application: http://localhost:${PORT}/`);
    });
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    console.error('Erreur non capturée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesse rejetée non gérée:', reason);
});

// Démarrage
startServer().catch(console.error);

module.exports = app;
