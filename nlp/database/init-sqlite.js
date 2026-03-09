// 🗄️ INITIALISATION SQLITE POUR NLP RULES
// Crée la base de données SQLite avec toutes les règles

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class SQLiteInitializer {
    constructor() {
        this.dbPath = path.join(__dirname, 'nlp_rules.db');
        this.db = null;
    }

    async initialize() {
        try {
            console.log('🗄️ Initialisation de la base de données SQLite...');
            
            // Supprimer l'ancienne base si elle existe
            if (fs.existsSync(this.dbPath)) {
                fs.unlinkSync(this.dbPath);
                console.log('🗑️ Ancienne base de données supprimée');
            }

            // Créer la nouvelle base
            this.db = new sqlite3.Database(this.dbPath);
            console.log('✅ Base de données SQLite créée');

            // Créer les tables
            await this.createTables();
            
            // Insérer les règles
            await this.insertRules();
            
            // Créer les index
            await this.createIndexes();
            
            // Fermer la connexion
            await this.close();
            
            console.log('🎉 Base de données SQLite initialisée avec succès !');
            console.log(`📍 Fichier: ${this.dbPath}`);
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            throw error;
        }
    }

    createTables() {
        return new Promise((resolve, reject) => {
            const sql = `
                -- Table des règles linguistiques
                CREATE TABLE IF NOT EXISTS linguistic_rules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rule_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL CHECK(category IN ('style', 'vocabulaire', 'conjugaison', 'orthographe')),
                    pattern_type TEXT NOT NULL DEFAULT 'regex' CHECK(pattern_type IN ('regex', 'function', 'string')),
                    pattern TEXT NOT NULL,
                    correction TEXT NOT NULL,
                    explanation TEXT,
                    example TEXT,
                    priority INTEGER DEFAULT 50,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                -- Table des métadonnées
                CREATE TABLE IF NOT EXISTS rule_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rule_id TEXT NOT NULL,
                    meta_key TEXT NOT NULL,
                    meta_value TEXT,
                    FOREIGN KEY (rule_id) REFERENCES linguistic_rules(rule_id) ON DELETE CASCADE
                );

                -- Table des statistiques
                CREATE TABLE IF NOT EXISTS rule_usage_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rule_id TEXT NOT NULL,
                    usage_date DATE NOT NULL,
                    usage_count INTEGER DEFAULT 0,
                    success_count INTEGER DEFAULT 0,
                    avg_confidence REAL,
                    FOREIGN KEY (rule_id) REFERENCES linguistic_rules(rule_id) ON DELETE CASCADE,
                    UNIQUE(rule_id, usage_date)
                );
            `;

            this.db.exec(sql, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Tables créées');
                    resolve();
                }
            });
        });
    }

    insertRules() {
        return new Promise((resolve, reject) => {
            const rules = [
                // RÈGLES DE STYLE
                {
                    rule_id: 'ponctuation_fin',
                    name: 'ponctuation_fin',
                    category: 'style',
                    pattern_type: 'regex',
                    pattern: '\\b([.!?])\\s*([.!?])',
                    correction: '$1',
                    explanation: 'Éviter la double ponctuation en fin de phrase.',
                    example: 'Bonjour!. → Bonjour!',
                    priority: 85
                },
                {
                    rule_id: 'espace_apres_virgule',
                    name: 'espace_apres_virgule',
                    category: 'style',
                    pattern_type: 'regex',
                    pattern: ',(\\S)',
                    correction: ', $1',
                    explanation: 'Mettre un espace après la virgule.',
                    example: 'Bonjour,mon ami → Bonjour, mon ami',
                    priority: 90
                },
                {
                    rule_id: 'espace_avant_point',
                    name: 'espace_avant_point',
                    category: 'style',
                    pattern_type: 'regex',
                    pattern: '\\s+([.!?])',
                    correction: '$1',
                    explanation: 'Pas d\'espace avant la ponctuation finale.',
                    example: 'Bonjour . → Bonjour.',
                    priority: 85
                },
                {
                    rule_id: 'double_espace',
                    name: 'double_espace',
                    category: 'style',
                    pattern_type: 'regex',
                    pattern: '\\s{2,}',
                    correction: ' ',
                    explanation: 'Éviter les doubles espaces.',
                    example: 'Bonjour  mon ami → Bonjour mon ami',
                    priority: 80
                },
                {
                    rule_id: 'majuscule_debut_phrase',
                    name: 'majuscule_debut_phrase',
                    category: 'style',
                    pattern_type: 'function',
                    pattern: '([.!?]\\s+)([a-z])',
                    correction: 'function',
                    explanation: 'Commencer chaque phrase par une majuscule.',
                    example: 'bonjour. comment allez-vous? → Bonjour. Comment allez-vous?',
                    priority: 95
                },
                {
                    rule_id: 'accord_être_adjectif',
                    name: 'accord_être_adjectif',
                    category: 'style',
                    pattern_type: 'regex',
                    pattern: '\\b(ils|elles)\\s+(est|sont)\\s+(\\w+)(s?)\\b',
                    correction: 'function',
                    explanation: 'Accord sujet-verbe-adjectif avec être.',
                    example: 'Ils est grand → Ils sont grands',
                    priority: 90
                },
                {
                    rule_id: 'confusion_ou_où',
                    name: 'confusion_ou_où',
                    category: 'style',
                    pattern_type: 'regex',
                    pattern: '\\bou\\b(?=\\s+(le|la|les|un|une|des|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|votre|leur))',
                    correction: 'où',
                    explanation: 'Utiliser "où" pour le lieu, "ou" pour le choix.',
                    example: 'La maison ou je vis → La maison où je vis',
                    priority: 80
                },
                {
                    rule_id: 'confusion_a_à',
                    name: 'confusion_a_à',
                    category: 'style',
                    pattern_type: 'regex',
                    pattern: '\\ba\\b(?=\\s+(le|la|les|un|une|des|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|votre|leur|cette|ces|cet))',
                    correction: 'à',
                    explanation: 'Utiliser "à" pour la préposition, "a" pour le verbe.',
                    example: 'Il a le livre → Il à le livre (incorrect)',
                    priority: 75
                },
                {
                    rule_id: 'accord_participe_passé',
                    name: 'accord_participe_passé',
                    category: 'style',
                    pattern_type: 'function',
                    pattern: '\\b(elle|la|cette)\\s+(a|as|avons|avez|ont|aurai|auras|aura|aurons|aurez|auront|avais|avais|avait|avions|aviez|avaient|eus|eûmes|eûtes|eurent)\\s+(\\w+é)\\b',
                    correction: 'function',
                    explanation: 'Accorder le participe passé avec le sujet féminin.',
                    example: 'Elle a arrivé → Elle a arrivée',
                    priority: 85
                },
                {
                    rule_id: 'parentheses_espaces',
                    name: 'parentheses_espaces',
                    category: 'style',
                    pattern_type: 'regex',
                    pattern: '\\(\\s*([^\\)]+?)\\s*\\)',
                    correction: '($1)',
                    explanation: 'Pas d\'espaces inutiles à l\'intérieur des parenthèses.',
                    example: '( texte ) → (texte)',
                    priority: 70
                },

                // RÈGLES DE VOCABULAIRE
                {
                    rule_id: 'confusion_a_a_vocab',
                    name: 'confusion_a_a',
                    category: 'vocabulaire',
                    pattern_type: 'regex',
                    pattern: '\\bà\\b',
                    correction: 'a',
                    explanation: 'Utiliser "a" (verbe avoir) au lieu de "à" (préposition) dans ce contexte.',
                    example: 'Il à faim → Il a faim',
                    priority: 80
                },
                {
                    rule_id: 'confusion_ca_ce',
                    name: 'confusion_ca_ce',
                    category: 'vocabulaire',
                    pattern_type: 'regex',
                    pattern: '\\bça\\b',
                    correction: 'cela',
                    explanation: 'Utiliser "cela" plutôt que "ça" dans un contexte formel.',
                    example: 'Ça va bien → Cela va bien',
                    priority: 75
                },
                {
                    rule_id: 'confusion_leur_leurs',
                    name: 'confusion_leur_leurs',
                    category: 'vocabulaire',
                    pattern_type: 'regex',
                    pattern: '\\bleur\\b(?=\\s+[aeiouéèêëîïôöùûü])',
                    correction: 'leurs',
                    explanation: 'Utiliser "leurs" (adjectif possessif pluriel) devant une voyelle.',
                    example: 'Leur enfant → Leurs enfants',
                    priority: 80
                },
                {
                    rule_id: 'confusion_quelquelle',
                    name: 'confusion_quelquelle',
                    category: 'vocabulaire',
                    pattern_type: 'regex',
                    pattern: '\\bquel\\b(?=\\s+nom_féminin)',
                    correction: 'quelle',
                    explanation: 'Utiliser "quelle" pour le féminin.',
                    example: 'Quel belle → Quelle belle',
                    priority: 75
                },
                {
                    rule_id: 'confusion_on_ont',
                    name: 'confusion_on_ont',
                    category: 'vocabulaire',
                    pattern_type: 'regex',
                    pattern: '\\bon\\b(?=\\s+(ont|ont|ont))',
                    correction: 'ont',
                    explanation: 'Utiliser "ont" (verbe avoir) au lieu de "on" (pronom).',
                    example: 'On manger → Ont mangé',
                    priority: 85
                },

                // RÈGLES DE CONJUGAISON
                {
                    rule_id: 'aller_present_vas',
                    name: 'aller_present_vas',
                    category: 'conjugaison',
                    pattern_type: 'regex',
                    pattern: '\\bil vas\\b',
                    correction: 'il va',
                    explanation: 'Le verbe aller se conjugue: je vais, tu vas, il va.',
                    example: 'Il vas au marché → Il va au marché',
                    priority: 90
                },
                {
                    rule_id: 'aller_present_vas_pluriel',
                    name: 'aller_present_vas_pluriel',
                    category: 'conjugaison',
                    pattern_type: 'regex',
                    pattern: '\\b(ils|elles) vas\\b',
                    correction: '$1 vont',
                    explanation: 'Au pluriel, aller se conjugue: ils vont, elles vont.',
                    example: 'Ils vas → Ils vont',
                    priority: 90
                },
                {
                    rule_id: 'etre_present_sont',
                    name: 'etre_present_sont',
                    category: 'conjugaison',
                    pattern_type: 'regex',
                    pattern: '\\bil sont\\b',
                    correction: 'il est',
                    explanation: 'Le verbe être: il est, ils sont.',
                    example: 'Il sont grand → Il est grand',
                    priority: 90
                },
                {
                    rule_id: 'etre_present_elles_sont',
                    name: 'etre_present_elles_sont',
                    category: 'conjugaison',
                    pattern_type: 'regex',
                    pattern: '\\bel sont\\b',
                    correction: 'elles sont',
                    explanation: 'Le verbe être au féminin pluriel: elles sont.',
                    example: 'Elles sont belles',
                    priority: 90
                },
                {
                    rule_id: 'faire_present_font',
                    name: 'faire_present_font',
                    category: 'conjugaison',
                    pattern_type: 'regex',
                    pattern: '\\bil font\\b',
                    correction: 'ils font',
                    explanation: 'Le verbe faire: il fait, ils font.',
                    example: 'Il font beau → Ils font beau',
                    priority: 90
                },
                {
                    rule_id: 'faire_present_elles_font',
                    name: 'faire_present_elles_font',
                    category: 'conjugaison',
                    pattern_type: 'regex',
                    pattern: '\\bel font\\b',
                    correction: 'elles font',
                    explanation: 'Le verbe faire au féminin pluriel: elles font.',
                    example: 'Elles font',
                    priority: 90
                },
                {
                    rule_id: 'accord_sujet_verbe_enfants',
                    name: 'accord_sujet_verbe_enfants',
                    category: 'conjugaison',
                    pattern_type: 'regex',
                    pattern: '\\bles enfant\\s+(\\w+es?)\\b',
                    correction: 'les enfants $1ent',
                    explanation: 'Accord sujet-verbe: les enfants + verbe au pluriel.',
                    example: 'Les enfant joue → Les enfants jouent',
                    priority: 85
                },
                {
                    rule_id: 'accord_sujet_verbe_chats',
                    name: 'accord_sujet_verbe_chats',
                    category: 'conjugaison',
                    pattern_type: 'regex',
                    pattern: '\\bles chat\\s+(\\w+es?)\\b',
                    correction: 'les chats $1ent',
                    explanation: 'Accord sujet-verbe: les chats + verbe au pluriel.',
                    example: 'Les chat dort → Les chats dorment',
                    priority: 85
                },
                {
                    rule_id: 'accord_sujet_verbe_filles',
                    name: 'accord_sujet_verbe_filles',
                    category: 'conjugaison',
                    pattern_type: 'regex',
                    pattern: '\\bles fille\\s+(\\w+es?)\\b',
                    correction: 'les filles $1ent',
                    explanation: 'Accord sujet-verbe: les filles + verbe au pluriel.',
                    example: 'Les fille chante → Les filles chantent',
                    priority: 85
                },
                {
                    rule_id: 'falloir_present',
                    name: 'falloir_present',
                    category: 'conjugaison',
                    pattern_type: 'regex',
                    pattern: '\\bil faut\\b',
                    correction: 'il faut',
                    explanation: 'Le verbe falloir ne s\'utilise qu\'avec il: il faut.',
                    example: 'Il faut étudier pour réussir.',
                    priority: 80
                },

                // RÈGLES D'ORTHOGRAPHE
                {
                    rule_id: 'accord_être_nom',
                    name: 'accord_être_nom',
                    category: 'orthographe',
                    pattern_type: 'regex',
                    pattern: '\\b(ils|elles)\\s+(est|sont)\\s+(\\w+)(s?)\\b',
                    correction: 'function',
                    explanation: 'Accord sujet-verbe avec être.',
                    example: 'Ils est content → Ils sont contents',
                    priority: 90
                },
                {
                    rule_id: 'accord_avoir_nom',
                    name: 'accord_avoir_nom',
                    category: 'orthographe',
                    pattern_type: 'regex',
                    pattern: '\\b(ils|elles)\\s+(a|as|avons|avez|ont)\\s+(\\w+)(s?)\\b',
                    correction: 'function',
                    explanation: 'Accord sujet-auxiliaire avec avoir.',
                    example: 'Ils a les livres → Ils ont les livres',
                    priority: 90
                },
                {
                    rule_id: 'accord_adjectif_feminin',
                    name: 'accord_adjectif_feminin',
                    category: 'orthographe',
                    pattern_type: 'function',
                    pattern: '\\b(la|cette|une|ma|ta|sa)\\s+(\\w+)\\s+(\\w+?)(s?)\\b',
                    correction: 'function',
                    explanation: 'Accord de l\'adjectif avec le nom féminin.',
                    example: 'La maison est beau → La maison est belle',
                    priority: 85
                },
                {
                    rule_id: 'accord_adjectif_pluriel',
                    name: 'accord_adjectif_pluriel',
                    category: 'orthographe',
                    pattern_type: 'function',
                    pattern: '\\b(les|des|mes|tes|ses|nos|vos|leurs)\\s+(\\w+)\\s+(\\w+?)\\b',
                    correction: 'function',
                    explanation: 'Accord de l\'adjectif au pluriel.',
                    example: 'Les chats est petit → Les chats sont petits',
                    priority: 85
                },
                {
                    rule_id: 'confusion_ce_se',
                    name: 'confusion_ce_se',
                    category: 'orthographe',
                    pattern_type: 'regex',
                    pattern: '\\bce\\b(?=\\s+(est|sont|sera|seront|était|étaient|fut|furent))',
                    correction: 'se',
                    explanation: 'Utiliser "se" pour le pronom réfléchi, "ce" pour le démonstratif.',
                    example: 'Ce lave → Se lave',
                    priority: 80
                }
            ];

            const stmt = this.db.prepare(`
                INSERT INTO linguistic_rules (
                    rule_id, name, category, pattern_type, pattern, correction, 
                    explanation, example, priority
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            let inserted = 0;
            this.db.serialize(() => {
                const insertNext = (index) => {
                    if (index >= rules.length) {
                        stmt.finalize();
                        console.log(`✅ ${inserted} règles insérées`);
                        resolve();
                        return;
                    }

                    const rule = rules[index];
                    stmt.run([
                        rule.rule_id,
                        rule.name,
                        rule.category,
                        rule.pattern_type,
                        rule.pattern,
                        rule.correction,
                        rule.explanation,
                        rule.example,
                        rule.priority
                    ], function(err) {
                        if (err) {
                            console.error(`❌ Erreur insertion ${rule.rule_id}:`, err);
                        } else {
                            inserted++;
                        }
                        insertNext(index + 1);
                    });
                };

                insertNext(0);
            });
        });
    }

    createIndexes() {
        return new Promise((resolve, reject) => {
            const sql = `
                CREATE INDEX IF NOT EXISTS idx_category ON linguistic_rules(category);
                CREATE INDEX IF NOT EXISTS idx_priority ON linguistic_rules(priority);
                CREATE INDEX IF NOT EXISTS idx_active ON linguistic_rules(is_active);
                CREATE INDEX IF NOT EXISTS idx_rule_id ON linguistic_rules(rule_id);
                CREATE INDEX IF NOT EXISTS idx_rule_meta ON rule_metadata(rule_id);
                CREATE INDEX IF NOT EXISTS idx_meta_key ON rule_metadata(meta_key);
                CREATE INDEX IF NOT EXISTS idx_usage_date ON rule_usage_stats(usage_date);
            `;

            this.db.exec(sql, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Index créés');
                    resolve();
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Connexion fermée');
                    resolve();
                }
            });
        });
    }

    // Afficher des statistiques
    async showStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    category,
                    COUNT(*) as rule_count,
                    SUM(priority) as total_priority
                FROM linguistic_rules 
                WHERE is_active = 1
                GROUP BY category
                ORDER BY category
            `;

            this.db.all(sql, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('\n📊 Statistiques de la base de données:');
                    console.log('=====================================');
                    rows.forEach(row => {
                        console.log(`${row.category.toUpperCase()}: ${row.rule_count} règles (priorité totale: ${row.total_priority})`);
                    });
                    console.log('=====================================');
                    resolve(rows);
                }
            });
        });
    }
}

// Exécution
if (require.main === module) {
    const initializer = new SQLiteInitializer();
    initializer.initialize()
        .then(() => initializer.showStats())
        .catch(console.error);
}

module.exports = SQLiteInitializer;
