// 🔄 MIGRATION DES FICHIERS JS VERS LA BASE DE DONNÉES
 Script pour migrer toutes les règles des fichiers JavaScript vers la base de données

const fs = require('fs');
const path = require('path');

class JSToDatabaseMigrator {
    constructor() {
        this.nlpPath = path.join(__dirname, '..');
        this.rules = [];
        this.migrationLog = [];
    }

    async migrate() {
        try {
            console.log('🔄 Début de la migration depuis les fichiers JavaScript...');
            
            // Charger les règles depuis les fichiers JS
            await this.loadRulesFromJSFiles();
            
            // Préparer les règles pour la base de données
            const preparedRules = this.prepareRulesForDatabase();
            
            // Générer le script SQL d'insertion
            await this.generateSQLInsert(preparedRules);
            
            // Créer un rapport de migration
            this.generateMigrationReport();
            
            console.log('✅ Migration terminée avec succès !');
            
        } catch (error) {
            console.error('❌ Erreur lors de la migration:', error);
            throw error;
        }
    }

    async loadRulesFromJSFiles() {
        const ruleFiles = [
            { file: 'spacy-rules-style-simple.js', category: 'style' },
            { file: 'spacy-rules-vocabulaire-simple.js', category: 'vocabulaire' },
            { file: 'spacy-rules-conjugaison-simple.js', category: 'conjugaison' },
            { file: 'spacy-rules-orthographe-simple.js', category: 'orthographe' }
        ];

        for (const { file, category } of ruleFiles) {
            const filePath = path.join(this.nlpPath, file);
            
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ Fichier non trouvé: ${file}`);
                continue;
            }

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const rules = this.extractRulesFromJS(content, category);
                
                this.rules.push(...rules);
                console.log(`✅ ${rules.length} règles extraites de ${file}`);
                
            } catch (error) {
                console.error(`❌ Erreur lors de la lecture de ${file}:`, error.message);
            }
        }
    }

    extractRulesFromJS(content, category) {
        const rules = [];
        
        // Extraire les règles du format JavaScript
        const ruleRegex = /{\s*id:\s*['"`]([^'"`]+)['"`],\s*name:\s*['"`]([^'"`]+)['"`],.*?pattern:\s*([^,}]+),.*?correction:\s*([^,}]+),.*?explanation:\s*['"`]([^'"`]*?)['"`],.*?example:\s*['"`]([^'"`]*?)['"`]/gs;
        
        let match;
        while ((match = ruleRegex.exec(content)) !== null) {
            const rule = {
                rule_id: match[1],
                name: match[2],
                category: category,
                pattern_type: 'regex',
                pattern: this.cleanPattern(match[3]),
                correction: this.cleanCorrection(match[4]),
                explanation: match[5] || '',
                example: match[6] || '',
                priority: 50
            };
            
            rules.push(rule);
            this.migrationLog.push({
                action: 'extracted',
                rule_id: rule.rule_id,
                category: category,
                status: 'success'
            });
        }
        
        return rules;
    }

    cleanPattern(pattern) {
        // Nettoyer le pattern pour l'insertion SQL
        pattern = pattern.trim();
        
        // Si c'est une regex, extraire le pattern
        if (pattern.startsWith('/') && pattern.endsWith('/')) {
            return pattern.slice(1, -1);
        }
        
        // Si c'est une fonction, la marquer comme telle
        if (pattern.includes('function') || pattern.includes('=>')) {
            return 'function';
        }
        
        return pattern;
    }

    cleanCorrection(correction) {
        // Nettoyer la correction pour l'insertion SQL
        correction = correction.trim();
        
        // Si c'est une fonction, la marquer comme telle
        if (correction.includes('function') || correction.includes('=>')) {
            return 'function';
        }
        
        // Enlever les guillemets si présents
        if ((correction.startsWith("'") && correction.endsWith("'")) ||
            (correction.startsWith('"') && correction.endsWith('"'))) {
            return correction.slice(1, -1);
        }
        
        return correction;
    }

    prepareRulesForDatabase() {
        const preparedRules = [];
        const seenIds = new Set();
        
        for (const rule of this.rules) {
            // Éviter les doublons
            if (seenIds.has(rule.rule_id)) {
                this.migrationLog.push({
                    action: 'duplicate',
                    rule_id: rule.rule_id,
                    category: rule.category,
                    status: 'skipped'
                });
                continue;
            }
            
            seenIds.add(rule.rule_id);
            
            // Valider et préparer la règle
            const preparedRule = {
                rule_id: rule.rule_id,
                name: rule.name,
                category: rule.category,
                pattern_type: rule.pattern_type,
                pattern: rule.pattern,
                correction: rule.correction,
                explanation: rule.explanation,
                example: rule.example,
                priority: rule.priority
            };
            
            preparedRules.push(preparedRule);
            this.migrationLog.push({
                action: 'prepared',
                rule_id: rule.rule_id,
                category: rule.category,
                status: 'success'
            });
        }
        
        return preparedRules;
    }

    async generateSQLInsert(rules) {
        const sqlPath = path.join(__dirname, 'migrated-rules.sql');
        let sql = '-- ============================================\n';
        sql += '-- RÈGLES MIGRÉES DEPUIS LES FICHIERS JS\n';
        sql += '-- ============================================\n\n';
        sql += 'USE nlp_rules;\n\n';
        sql += '-- Insertion des règles migrées\n';
        
        for (const rule of rules) {
            sql += `INSERT INTO linguistic_rules (\n`;
            sql += `    rule_id, name, category, pattern_type, pattern, correction,\n`;
            sql += `    explanation, example, priority\n`;
            sql += `) VALUES (\n`;
            sql += `    '${this.escapeSQL(rule.rule_id)}',\n`;
            sql += `    '${this.escapeSQL(rule.name)}',\n`;
            sql += `    '${rule.category}',\n`;
            sql += `    '${rule.pattern_type}',\n`;
            sql += `    '${this.escapeSQL(rule.pattern)}',\n`;
            sql += `    '${this.escapeSQL(rule.correction)}',\n`;
            sql += `    '${this.escapeSQL(rule.explanation)}',\n`;
            sql += `    '${this.escapeSQL(rule.example)}',\n`;
            sql += `    ${rule.priority}\n`;
            sql += `);\n\n`;
        }
        
        // Ajouter une requête de vérification
        sql += '-- ============================================\n';
        sql += '-- VÉRIFICATION DE LA MIGRATION\n';
        sql += '-- ============================================\n\n';
        sql += 'SELECT \n';
        sql += '    category,\n';
        sql += '    COUNT(*) as migrated_rules\n';
        sql += 'FROM linguistic_rules \n';
        sql += 'WHERE is_active = TRUE\n';
        sql += 'GROUP BY category\n';
        sql += 'ORDER BY category;\n';
        
        fs.writeFileSync(sqlPath, sql);
        console.log(`✅ Script SQL généré: ${sqlPath}`);
    }

    escapeSQL(str) {
        // Échapper les caractères pour SQL
        return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
    }

    generateMigrationReport() {
        const reportPath = path.join(__dirname, 'migration-report.md');
        
        let report = '# 📊 RAPPORT DE MIGRATION\n\n';
        report += `**Date:** ${new Date().toLocaleString()}\n`;
        report += `**Total de règles extraites:** ${this.rules.length}\n\n`;
        
        // Statistiques par catégorie
        const categoryStats = {};
        for (const rule of this.rules) {
            if (!categoryStats[rule.category]) {
                categoryStats[rule.category] = 0;
            }
            categoryStats[rule.category]++;
        }
        
        report += '## 📈 Statistiques par catégorie\n\n';
        report += '| Catégorie | Nombre de règles |\n';
        report += '|----------|----------------|\n';
        
        for (const [category, count] of Object.entries(categoryStats)) {
            report += `| ${category} | ${count} |\n`;
        }
        
        // Log des opérations
        report += '\n## 📋 Journal des opérations\n\n';
        
        const groupedLogs = this.migrationLog.reduce((groups, log) => {
            if (!groups[log.action]) {
                groups[log.action] = [];
            }
            groups[log.action].push(log);
            return groups;
        }, {});
        
        for (const [action, logs] of Object.entries(groupedLogs)) {
            report += `### ${action.toUpperCase()} (${logs.length})\n\n`;
            
            if (logs.length <= 10) {
                logs.forEach(log => {
                    const emoji = log.status === 'success' ? '✅' : log.status === 'skipped' ? '⏭️' : '❌';
                    report += `${emoji} ${log.rule_id} (${log.category})\n`;
                });
            } else {
                report += `${logs.length} opérations\n`;
            }
            report += '\n';
        }
        
        // Liste des règles migrées
        report += '## 📝 Liste des règles migrées\n\n';
        report += '<details>\n<summary>Afficher toutes les règles</summary>\n\n';
        
        for (const rule of this.rules) {
            report += `### ${rule.rule_id}\n`;
            report += `- **Nom:** ${rule.name}\n`;
            report += `- **Catégorie:** ${rule.category}\n`;
            report += `- **Pattern:** \`${rule.pattern}\`\n`;
            report += `- **Correction:** \`${rule.correction}\`\n`;
            if (rule.explanation) {
                report += `- **Explication:** ${rule.explanation}\n`;
            }
            if (rule.example) {
                report += `- **Exemple:** ${rule.example}\n`;
            }
            report += '\n';
        }
        
        report += '</details>\n\n';
        
        // Instructions post-migration
        report += '## 🚀 Instructions post-migration\n\n';
        report += '1. **Exécuter le script SQL:**\n';
        report += '   ```bash\n';
        report += '   mysql -u root -p nlp_rules < migrated-rules.sql\n';
        report += '   ```\n\n';
        report += '2. **Vérifier la migration:**\n';
        report += '   ```sql\n';
        report += '   SELECT category, COUNT(*) FROM linguistic_rules GROUP BY category;\n';
        report += '   ```\n\n';
        report += '3. **Tester le système:**\n';
        report += '   - Démarrer le serveur API\n';
        report += '   - Tester avec l\'interface existante\n';
        report += '   - Vérifier que toutes les règles fonctionnent\n\n';
        
        fs.writeFileSync(reportPath, report);
        console.log(`✅ Rapport de migration généré: ${reportPath}`);
    }
}

// Exécution
if (require.main === module) {
    const migrator = new JSToDatabaseMigrator();
    migrator.migrate().catch(console.error);
}

module.exports = JSToDatabaseMigrator;
