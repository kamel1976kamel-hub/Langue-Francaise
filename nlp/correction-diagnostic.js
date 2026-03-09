// 🔍 DIAGNOSTIC COMPLET DU SYSTÈME DE CORRECTION
// Script pour vérifier l'état et le fonctionnement du nuage de correction

class CorrectionDiagnostic {
    constructor() {
        this.results = {
            database: false,
            integration: false,
            ui: false,
            functions: {},
            errors: []
        };
    }

    async runFullDiagnostic() {
        console.log('🔍 Démarrage du diagnostic complet du système de correction...');
        
        // 1. Vérifier la base de données
        await this.checkDatabase();
        
        // 2. Vérifier l'intégration
        await this.checkIntegration();
        
        // 3. Vérifier l'interface utilisateur
        await this.checkUI();
        
        // 4. Vérifier les fonctions globales
        await this.checkGlobalFunctions();
        
        // 5. Test de correction
        await this.testCorrection();
        
        // 6. Afficher les résultats
        this.displayResults();
        
        return this.results;
    }

    async checkDatabase() {
        try {
            console.log('📊 Vérification de la base de données...');
            
            // Vérifier BrowserSQLiteManager
            if (window.BrowserSQLiteManager) {
                this.results.functions.BrowserSQLiteManager = true;
                console.log('✅ BrowserSQLiteManager disponible');
            } else {
                this.results.functions.BrowserSQLiteManager = false;
                this.results.errors.push('BrowserSQLiteManager non disponible');
            }
            
            // Vérifier DatabaseRulesManager
            if (window.DatabaseRulesManager) {
                this.results.functions.DatabaseRulesManager = true;
                console.log('✅ DatabaseRulesManager disponible');
            } else {
                this.results.functions.DatabaseRulesManager = false;
                this.results.errors.push('DatabaseRulesManager non disponible');
            }
            
            // Vérifier l'intégration de la base de données
            if (window.NLPDatabaseIntegration && window.NLPDatabaseIntegration.isReady) {
                this.results.database = true;
                console.log('✅ Base de données NLP prête');
                
                // Obtenir les statistiques
                const stats = window.getNLPStats();
                console.log('📊 Statistiques:', stats);
                
            } else {
                this.results.database = false;
                this.results.errors.push('Base de données NLP non prête');
                console.log('⚠️ Base de données NLP non prête');
            }
            
        } catch (error) {
            this.results.database = false;
            this.results.errors.push('Erreur base de données: ' + error.message);
            console.error('❌ Erreur base de données:', error);
        }
    }

    async checkIntegration() {
        try {
            console.log('🔗 Vérification de l\'intégration...');
            
            // Vérifier NLPManager
            if (window.NLPManager && window.NLPManager.isReady) {
                this.results.integration = true;
                console.log('✅ NLPManager prêt');
            } else {
                this.results.integration = false;
                this.results.errors.push('NLPManager non prêt');
            }
            
            // Vérifier les événements
            const eventFired = await this.waitForEvent('nlp-database-ready', 2000);
            if (eventFired) {
                console.log('✅ Événement nlp-database-ready reçu');
            } else {
                console.log('⚠️ Événement nlp-database-ready non reçu (timeout)');
            }
            
        } catch (error) {
            this.results.integration = false;
            this.results.errors.push('Erreur intégration: ' + error.message);
            console.error('❌ Erreur intégration:', error);
        }
    }

    async checkUI() {
        try {
            console.log('🎨 Vérification de l\'interface utilisateur...');
            
            // Vérifier TextCorrectorUI
            if (window.TextCorrectorUI) {
                this.results.functions.TextCorrectorUI = true;
                console.log('✅ TextCorrectorUI disponible');
                
                // Vérifier si l'interface est initialisée
                const container = document.querySelector('.text-corrector-container');
                if (container) {
                    this.results.ui = true;
                    console.log('✅ Interface utilisateur trouvée');
                } else {
                    this.results.ui = false;
                    this.results.errors.push('Interface utilisateur non trouvée dans le DOM');
                }
            } else {
                this.results.functions.TextCorrectorUI = false;
                this.results.ui = false;
                this.results.errors.push('TextCorrectorUI non disponible');
            }
            
        } catch (error) {
            this.results.ui = false;
            this.results.errors.push('Erreur UI: ' + error.message);
            console.error('❌ Erreur UI:', error);
        }
    }

    async checkGlobalFunctions() {
        try {
            console.log('🌐 Vérification des fonctions globales...');
            
            const functions = [
                'correctText',
                'correctTextWithDatabase',
                'quickCorrectText',
                'validateText',
                'getNLPSuggestions',
                'getNLPStats',
                'analyzeTextLocal',
                'applyRules'
            ];
            
            functions.forEach(funcName => {
                if (window[funcName] && typeof window[funcName] === 'function') {
                    this.results.functions[funcName] = true;
                    console.log(`✅ ${funcName} disponible`);
                } else {
                    this.results.functions[funcName] = false;
                    this.results.errors.push(`${funcName} non disponible`);
                    console.log(`❌ ${funcName} non disponible`);
                }
            });
            
        } catch (error) {
            this.results.errors.push('Erreur fonctions globales: ' + error.message);
            console.error('❌ Erreur fonctions globales:', error);
        }
    }

    async testCorrection() {
        try {
            console.log('🧪 Test de correction...');
            
            const testText = "Les enfant joue dans le jardin. Il vas à l'école.";
            let result;
            
            // Essayer avec la nouvelle fonction de base de données
            if (window.correctTextWithDatabase) {
                result = await window.correctTextWithDatabase(testText);
                console.log('✅ Test avec correctTextWithDatabase réussi');
            } else if (window.correctText) {
                result = await window.correctText(testText);
                console.log('✅ Test avec correctText réussi');
            } else {
                throw new Error('Aucune fonction de correction disponible');
            }
            
            if (result && result.success) {
                console.log('✅ Test de correction réussi:');
                console.log('  - Texte original:', testText);
                console.log('  - Texte corrigé:', result.correctedText);
                console.log('  - Corrections:', result.corrections?.length || 0);
                
                this.results.correctionTest = {
                    success: true,
                    originalText: testText,
                    correctedText: result.correctedText,
                    correctionsCount: result.corrections?.length || 0
                };
            } else {
                throw new Error('Le test de correction a échoué');
            }
            
        } catch (error) {
            this.results.correctionTest = {
                success: false,
                error: error.message
            };
            this.results.errors.push('Test de correction: ' + error.message);
            console.error('❌ Test de correction:', error);
        }
    }

    async waitForEvent(eventName, timeout = 2000) {
        return new Promise((resolve) => {
            let fired = false;
            
            const handler = () => {
                fired = true;
                window.removeEventListener(eventName, handler);
                resolve(true);
            };
            
            window.addEventListener(eventName, handler);
            
            setTimeout(() => {
                if (!fired) {
                    window.removeEventListener(eventName, handler);
                    resolve(false);
                }
            }, timeout);
        });
    }

    displayResults() {
        console.log('\n📋 RÉSULTATS DU DIAGNOSTIC:');
        console.log('=====================================');
        
        // État général
        const overallStatus = this.results.database && this.results.integration && this.results.ui;
        console.log(`🎯 État général: ${overallStatus ? '✅ BON' : '❌ PROBLÈMES DÉTECTÉS'}`);
        
        // Base de données
        console.log(`📊 Base de données: ${this.results.database ? '✅' : '❌'}`);
        
        // Intégration
        console.log(`🔗 Intégration: ${this.results.integration ? '✅' : '❌'}`);
        
        // Interface utilisateur
        console.log(`🎨 Interface: ${this.results.ui ? '✅' : '❌'}`);
        
        // Test de correction
        if (this.results.correctionTest) {
            console.log(`🧪 Test correction: ${this.results.correctionTest.success ? '✅' : '❌'}`);
            if (this.results.correctionTest.success) {
                console.log(`   Corrections: ${this.results.correctionTest.correctionsCount}`);
            }
        }
        
        // Fonctions disponibles
        console.log('\n🌐 Fonctions globales:');
        Object.keys(this.results.functions).forEach(funcName => {
            const status = this.results.functions[funcName] ? '✅' : '❌';
            console.log(`   ${status} ${funcName}`);
        });
        
        // Erreurs
        if (this.results.errors.length > 0) {
            console.log('\n❌ Erreurs détectées:');
            this.results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        } else {
            console.log('\n✅ Aucune erreur détectée');
        }
        
        console.log('=====================================\n');
        
        // Afficher dans l'interface si disponible
        this.displayInUI();
    }

    displayInUI() {
        // Créer une interface de diagnostic si elle n'existe pas
        let diagnosticDiv = document.getElementById('correction-diagnostic');
        
        if (!diagnosticDiv) {
            diagnosticDiv = document.createElement('div');
            diagnosticDiv.id = 'correction-diagnostic';
            diagnosticDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 2px solid #10b981;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                z-index: 10000;
                max-width: 400px;
                font-family: monospace;
                font-size: 12px;
            `;
            document.body.appendChild(diagnosticDiv);
        }
        
        const overallStatus = this.results.database && this.results.integration && this.results.ui;
        const statusColor = overallStatus ? '#10b981' : '#ef4444';
        const statusText = overallStatus ? 'SYSTÈME OPÉRATIONNEL' : 'PROBLÈMES DÉTECTÉS';
        
        diagnosticDiv.innerHTML = `
            <div style="border-bottom: 1px solid #e5e7eb; margin-bottom: 10px; padding-bottom: 10px;">
                <strong style="color: ${statusColor}">🔍 DIAGNOSTIC NLP</strong>
                <div style="color: ${statusColor}; font-weight: bold;">${statusText}</div>
            </div>
            <div>
                <div>📊 Base de données: ${this.results.database ? '✅' : '❌'}</div>
                <div>🔗 Intégration: ${this.results.integration ? '✅' : '❌'}</div>
                <div>🎨 Interface: ${this.results.ui ? '✅' : '❌'}</div>
                ${this.results.correctionTest ? 
                    `<div>🧪 Test: ${this.results.correctionTest.success ? '✅' : '❌'} (${this.results.correctionTest.correctionsCount || 0} corrections)</div>` 
                    : ''}
            </div>
            ${this.results.errors.length > 0 ? 
                `<div style="margin-top: 10px; color: #ef4444;">
                    <strong>Erreurs:</strong><br>
                    ${this.results.errors.slice(0, 3).join('<br>')}
                    ${this.results.errors.length > 3 ? '...' : ''}
                </div>` 
                : ''}
            <button onclick="this.parentElement.remove()" style="
                margin-top: 10px;
                padding: 5px 10px;
                background: #6b7280;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
            ">Fermer</button>
        `;
        
        // Auto-suppression après 10 secondes
        setTimeout(() => {
            if (diagnosticDiv.parentElement) {
                diagnosticDiv.remove();
            }
        }, 10000);
    }

    // Méthode pour réparer les problèmes courants
    async repairIssues() {
        console.log('🔧 Tentative de réparation des problèmes...');
        
        const repairs = [];
        
        // Réparer la base de données si nécessaire
        if (!this.results.database && window.NLPDatabaseIntegration) {
            try {
                await window.NLPDatabaseIntegration.initialize();
                repairs.push('Base de données réinitialisée');
                console.log('✅ Base de données réinitialisée');
            } catch (error) {
                console.error('❌ Impossible de réinitialiser la base de données:', error);
            }
        }
        
        // Réparer l'intégration si nécessaire
        if (!this.results.integration && window.NLPManager) {
            try {
                await window.NLPManager.initialize();
                repairs.push('Intégration réinitialisée');
                console.log('✅ Intégration réinitialisée');
            } catch (error) {
                console.error('❌ Impossible de réinitialiser l\'intégration:', error);
            }
        }
        
        // Recréer l'interface si nécessaire
        if (!this.results.ui && window.TextCorrectorUI) {
            try {
                const corrector = new TextCorrectorUI({
                    container: document.body,
                    autoShow: false
                });
                repairs.push('Interface recréée');
                console.log('✅ Interface recréée');
            } catch (error) {
                console.error('❌ Impossible de recréer l\'interface:', error);
            }
        }
        
        console.log(`🔧 ${repairs.length} réparations effectuées:`, repairs);
        
        // Relancer le diagnostic après réparation
        if (repairs.length > 0) {
            setTimeout(() => {
                this.runFullDiagnostic();
            }, 2000);
        }
        
        return repairs;
    }
}

// Créer l'instance globale
window.CorrectionDiagnostic = new CorrectionDiagnostic();

// Fonction pour lancer le diagnostic
window.runCorrectionDiagnostic = async () => {
    return await window.CorrectionDiagnostic.runFullDiagnostic();
};

// Fonction pour réparer les problèmes
window.repairCorrectionSystem = async () => {
    return await window.CorrectionDiagnostic.repairIssues();
};

// Lancer le diagnostic automatiquement après 3 secondes
setTimeout(async () => {
    if (window.location.pathname.includes('index.html')) {
        await window.runCorrectionDiagnostic();
    }
}, 3000);

console.log('🔍 Diagnostic du système de correction chargé');
