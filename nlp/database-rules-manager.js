// 🗄️ GESTIONNAIRE DE RÈGLES NLP VIA BASE DE DONNÉES
// Remplace les fichiers JavaScript par une base de données SQL

class DatabaseRulesManager {
    constructor(config = {}) {
        this.config = {
            // Configuration par défaut pour MySQL
            host: config.host || 'localhost',
            port: config.port || 3306,
            database: config.database || 'nlp_rules',
            user: config.user || 'root',
            password: config.password || '',
            // Configuration pour SQLite (fallback)
            useSQLite: config.useSQLite || false,
            sqlitePath: config.sqlitePath || 'nlp_rules.db',
            // Cache
            cacheRules: config.cacheRules !== false,
            cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
            ...config
        };
        
        this.db = null;
        this.cache = new Map();
        this.cacheTimestamp = new Map();
        this.isReady = false;
        
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🗄️ Initialisation du gestionnaire de base de données...');
            
            if (this.config.useSQLite) {
                await this.initSQLite();
            } else {
                await this.initMySQL();
            }
            
            this.isReady = true;
            console.log('✅ Base de données NLP prête');
            
            // Notifier l'application
            this.notifyReady();
            
        } catch (error) {
            console.error('❌ Erreur d\'initialisation de la base de données:', error);
            this.fallbackToJSON();
        }
    }

    async initMySQL() {
        // Pour le navigateur, nous utiliserons une API REST ou WebSockets
        // Pour Node.js, nous utiliserions mysql2
        if (typeof window !== 'undefined') {
            // Environnement navigateur - API REST
            this.db = new MySQLRestAPI(this.config);
        } else {
            // Environnement Node.js - connexion directe
            const mysql = require('mysql2/promise');
            this.db = await mysql.createConnection({
                host: this.config.host,
                port: this.config.port,
                database: this.config.database,
                user: this.config.user,
                password: this.config.password
            });
        }
    }

    async initSQLite() {
        // Utiliser sql.js pour le navigateur ou sqlite3 pour Node.js
        if (typeof window !== 'undefined') {
            // Environnement navigateur - sql.js
            this.db = new SQLiteBrowser(this.config);
        } else {
            // Environnement Node.js - sqlite3
            const sqlite3 = require('sqlite3').verbose();
            this.db = new Promise((resolve, reject) => {
                const db = new sqlite3.Database(this.config.sqlitePath, (err) => {
                    if (err) reject(err);
                    else resolve(db);
                });
            });
        }
    }

    fallbackToJSON() {
        console.log('🔄 Fallback vers les règles JSON');
        this.useJSONFallback = true;
        this.isReady = true;
        this.notifyReady();
    }

    notifyReady() {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('nlp-db-ready', {
                detail: { 
                    isReady: true, 
                    useFallback: this.useJSONFallback || false,
                    config: this.config
                }
            }));
        }
    }

    // ============================================
    // MÉTHODES PRINCIPALES
    // ============================================

    async getAllRules() {
        if (!this.isReady) {
            await this.initialize();
        }

        if (this.useJSONFallback) {
            return this.getJSONRules();
        }

        const cacheKey = 'all_rules';
        if (this.config.cacheRules && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const rules = await this.db.query(`
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

            const rulesByCategory = this.groupRulesByCategory(rules);
            
            if (this.config.cacheRules) {
                this.cache.set(cacheKey, rulesByCategory);
                this.cacheTimestamp.set(cacheKey, Date.now());
            }

            return rulesByCategory;

        } catch (error) {
            console.error('Erreur lors du chargement des règles:', error);
            return this.getJSONRules();
        }
    }

    async getRulesByCategory(category) {
        if (!this.isReady) {
            await this.initialize();
        }

        if (this.useJSONFallback) {
            return this.getJSONRulesByCategory(category);
        }

        const cacheKey = `rules_${category}`;
        if (this.config.cacheRules && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const rules = await this.db.query(`
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

            if (this.config.cacheRules) {
                this.cache.set(cacheKey, rules);
                this.cacheTimestamp.set(cacheKey, Date.now());
            }

            return rules;

        } catch (error) {
            console.error(`Erreur lors du chargement des règles ${category}:`, error);
            return this.getJSONRulesByCategory(category);
        }
    }

    async addRule(rule) {
        if (!this.isReady || this.useJSONFallback) {
            throw new Error('Base de données non disponible');
        }

        try {
            const result = await this.db.query(`
                INSERT INTO linguistic_rules (
                    rule_id, name, category, pattern_type, pattern, correction, 
                    explanation, example, priority
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                rule.id,
                rule.name,
                rule.category,
                rule.pattern_type || 'regex',
                rule.pattern,
                rule.correction,
                rule.explanation,
                rule.example,
                rule.priority || 50
            ]);

            // Invalider le cache
            this.invalidateCache();
            
            console.log(`✅ Règle ${rule.id} ajoutée avec succès`);
            return result;

        } catch (error) {
            console.error('Erreur lors de l\'ajout de la règle:', error);
            throw error;
        }
    }

    async updateRule(ruleId, updates) {
        if (!this.isReady || this.useJSONFallback) {
            throw new Error('Base de données non disponible');
        }

        try {
            const setClause = [];
            const values = [];

            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined) {
                    setClause.push(`${key} = ?`);
                    values.push(updates[key]);
                }
            });

            if (setClause.length === 0) {
                throw new Error('Aucune mise à jour à effectuer');
            }

            values.push(ruleId);

            const result = await this.db.query(`
                UPDATE linguistic_rules 
                SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE rule_id = ?
            `, values);

            // Invalider le cache
            this.invalidateCache();
            
            console.log(`✅ Règle ${ruleId} mise à jour avec succès`);
            return result;

        } catch (error) {
            console.error('Erreur lors de la mise à jour de la règle:', error);
            throw error;
        }
    }

    async deleteRule(ruleId) {
        if (!this.isReady || this.useJSONFallback) {
            throw new Error('Base de données non disponible');
        }

        try {
            const result = await this.db.query(`
                DELETE FROM linguistic_rules WHERE rule_id = ?
            `, [ruleId]);

            // Invalider le cache
            this.invalidateCache();
            
            console.log(`✅ Règle ${ruleId} supprimée avec succès`);
            return result;

        } catch (error) {
            console.error('Erreur lors de la suppression de la règle:', error);
            throw error;
        }
    }

    async updateRuleUsage(ruleId, success = true, confidence = 0) {
        if (!this.isReady || this.useJSONFallback) {
            return;
        }

        try {
            await this.db.query(`
                CALL UpdateRuleUsage(?, ?, ?)
            `, [ruleId, success, confidence]);

        } catch (error) {
            console.error('Erreur lors de la mise à jour des statistiques:', error);
        }
    }

    async getRuleStats() {
        if (!this.isReady || this.useJSONFallback) {
            return this.getJSONStats();
        }

        try {
            const stats = await this.db.query(`
                SELECT * FROM rule_stats
            `);

            return stats;

        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            return this.getJSONStats();
        }
    }

    // ============================================
    // MÉTHODES UTILITAIRES
    // ============================================

    groupRulesByCategory(rules) {
        const grouped = {
            style: [],
            vocabulaire: [],
            conjugaison: [],
            orthographe: []
        };

        rules.forEach(rule => {
            if (grouped[rule.category]) {
                grouped[rule.category].push(this.convertRuleFormat(rule));
            }
        });

        return grouped;
    }

    convertRuleFormat(dbRule) {
        const rule = {
            id: dbRule.id,
            name: dbRule.name,
            category: dbRule.category,
            pattern: dbRule.pattern,
            correction: dbRule.correction,
            explanation: dbRule.explanation,
            example: dbRule.example,
            type: dbRule.category,
            priority: dbRule.priority
        };

        // Conversion du pattern selon le type
        if (dbRule.pattern_type === 'regex') {
            rule.pattern = new RegExp(dbRule.pattern, 'g');
        } else if (dbRule.pattern_type === 'function') {
            rule.pattern = new Function('match', dbRule.pattern);
        } else {
            rule.pattern = dbRule.pattern;
        }

        // Conversion de la correction si c'est une fonction
        if (dbRule.correction && dbRule.correction.startsWith('function')) {
            rule.correction = new Function('match', dbRule.correction);
        }

        return rule;
    }

    isCacheValid(key) {
        const timestamp = this.cacheTimestamp.get(key);
        return timestamp && (Date.now() - timestamp) < this.config.cacheTimeout;
    }

    invalidateCache() {
        this.cache.clear();
        this.cacheTimestamp.clear();
    }

    // ============================================
    // FALLBACK JSON (si la BD n'est pas disponible)
    // ============================================

    getJSONRules() {
        return {
            style: this.getJSONRulesByCategory('style'),
            vocabulaire: this.getJSONRulesByCategory('vocabulaire'),
            conjugaison: this.getJSONRulesByCategory('conjugaison'),
            orthographe: this.getJSONRulesByCategory('orthographe')
        };
    }

    getJSONRulesByCategory(category) {
        // Charger depuis les fichiers -simple.js existants
        const fallbackRules = {
            style: window.styleRules || [],
            vocabulaire: window.vocabulaireRules || [],
            conjugaison: window.conjugaisonRules || [],
            orthographe: window.orthographeRules || []
        };

        return fallbackRules[category] || [];
    }

    getJSONStats() {
        // Statistiques basiques pour le fallback
        const rules = this.getJSONRules();
        const stats = {};

        Object.keys(rules).forEach(category => {
            stats[category] = {
                total: rules[category].length,
                active: rules[category].length,
                avgPriority: 50
            };
        });

        return stats;
    }

    // Méthode getStats pour la compatibilité
    async getStats() {
        if (!this.isReady) {
            await this.initialize();
        }

        if (this.useJSONFallback) {
            return this.getJSONStats();
        }

        try {
            const allRules = await this.getAllRules();
            const stats = {};

            Object.keys(allRules).forEach(category => {
                stats[category] = {
                    total: allRules[category].length,
                    active: allRules[category].length,
                    avgPriority: allRules[category].reduce((sum, rule) => sum + (rule.priority || 50), 0) / allRules[category].length
                };
            });

            return stats;
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            return this.getJSONStats();
        }
    }
}

// ============================================
// CLASSES D'ADAPTATEURS
// ============================================

// Adaptateur pour MySQL via API REST (navigateur)
class MySQLRestAPI {
    constructor(config) {
        this.baseURL = config.apiURL || 'http://localhost:3000/api/nlp';
    }

    async query(sql, params = []) {
        const response = await fetch(`${this.baseURL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql, params })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }
}

// Adaptateur pour SQLite dans le navigateur (sql.js)
class SQLiteBrowser {
    constructor(config) {
        this.dbPath = config.sqlitePath;
        this.db = null;
    }

    async query(sql, params = []) {
        if (!this.db) {
            await this.initDB();
        }

        // Implémentation avec sql.js
        // Ceci est un placeholder - nécessite sql.js
        return [];
    }

    async initDB() {
        // Charger sql.js et initialiser la base de données
        // Implementation placeholder
    }
}

// ============================================
// EXPORT GLOBAL
// ============================================

// Créer l'instance globale
window.DatabaseRulesManager = DatabaseRulesManager;

// Initialiser avec la configuration par défaut
window.NLPDatabase = new DatabaseRulesManager({
    // Par défaut, essayer SQLite dans le navigateur
    useSQLite: true,
    sqlitePath: 'nlp_rules.db',
    cacheRules: true,
    cacheTimeout: 300000
});

// Interface compatible avec le système existant
window.loadAllRules = async () => {
    return await window.NLPDatabase.getAllRules();
};

window.loadRulesByCategory = async (category) => {
    return await window.NLPDatabase.getRulesByCategory(category);
};

// Événements
window.addEventListener('load', () => {
    console.log('🗄️ Gestionnaire de base de données NLP chargé');
});

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseRulesManager;
}
