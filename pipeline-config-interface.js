/**
 * =================================================================
    * GUIDE DE CONFIGURATION DU PIPELINE IA TEMPS RÉEL
    * Instructions pour activer les vrais modèles IA
    * =================================================================
 */

console.log('📋 Guide de configuration du pipeline IA temps réel...');

/**
 * Interface de configuration du pipeline IA
 */
function setupPipelineInterface() {
    // Créer une interface de configuration simple
    const configDiv = document.createElement('div');
    configDiv.id = 'pipeline-config';
    configDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid #4eac6d;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        font-family: Arial, sans-serif;
    `;
    
    configDiv.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #4eac6d;">🚀 Pipeline IA Temps Réel</h3>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Clé API OpenAI:</label>
            <input type="password" id="api-key-input" placeholder="sk-..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Mode de traitement:</label>
            <select id="processing-mode" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                <option value="parallel">⚡ Parallèle (plus rapide)</option>
                <option value="sequential">🔄 Séquentiel (plus stable)</option>
            </select>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: flex; align-items: center;">
                <input type="checkbox" id="cache-enabled" checked style="margin-right: 8px;">
                <span>Activer le cache</span>
            </label>
        </div>
        
        <div style="display: flex; gap: 10px;">
            <button id="save-config" style="flex: 1; padding: 10px; background: #4eac6d; color: white; border: none; border-radius: 5px; cursor: pointer;">💾 Sauvegarder</button>
            <button id="test-pipeline" style="flex: 1; padding: 10px; background: #FC814A; color: white; border: none; border-radius: 5px; cursor: pointer;">🧪 Tester</button>
        </div>
        
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            <div id="status-message" style="font-size: 14px; color: #666;">Configurez votre clé API pour commencer</div>
        </div>
        
        <button id="close-config" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer;">✕</button>
    `;
    
    document.body.appendChild(configDiv);
    
    // Gestionnaires d'événements
    document.getElementById('save-config').addEventListener('click', () => {
        const apiKey = document.getElementById('api-key-input').value.trim();
        const processingMode = document.getElementById('processing-mode').value;
        const cacheEnabled = document.getElementById('cache-enabled').checked;
        
        if (!apiKey) {
            updateStatus('❌ Veuillez entrer une clé API valide', 'error');
            return;
        }
        
        try {
            // Configurer le token Groq (corrigé)
            window.configureGroqToken(apiKey);
            
            // Mettre à jour la configuration
            SPECIFIC_PIPELINE_CONFIG.parallelProcessing = processingMode === 'parallel';
            SPECIFIC_PIPELINE_CONFIG.cacheEnabled = cacheEnabled;
            
            updateStatus('✅ Configuration sauvegardée avec succès!', 'success');
            
            // Masquer l'interface après 2 secondes
            setTimeout(() => {
                configDiv.style.display = 'none';
            }, 2000);
            
        } catch (error) {
            updateStatus(`❌ Erreur: ${error.message}`, 'error');
        }
    });
    
    document.getElementById('test-pipeline').addEventListener('click', async () => {
        const apiKey = document.getElementById('api-key-input').value.trim();
        
        if (!apiKey) {
            updateStatus('❌ Veuillez entrer une clé API valide', 'error');
            return;
        }
        
        updateStatus('🧪 Test en cours...', 'info');
        
        try {
            window.configureGitHubToken(apiKey);
            
            const testResult = await window.runFourModelPipeline(
                "Ceci est un test du pipeline IA.",
                "test de configuration",
                "test"
            );
            
            updateStatus('✅ Test réussi! Pipeline opérationnel', 'success');
            console.log('🧪 Résultat du test:', testResult);
            
        } catch (error) {
            updateStatus(`❌ Erreur de test: ${error.message}`, 'error');
            console.error('🧪 Erreur de test:', error);
        }
    });
    
    document.getElementById('close-config').addEventListener('click', () => {
        configDiv.style.display = 'none';
    });
    
    function updateStatus(message, type) {
        const statusDiv = document.getElementById('status-message');
        statusDiv.textContent = message;
        statusDiv.style.color = type === 'error' ? '#EF476F' : type === 'success' ? '#4eac6d' : '#666';
    }
}

/**
 * Vérifie si la configuration est nécessaire
 */
function checkPipelineConfiguration() {
    try {
        // Vérifier si le token Groq est configuré
        const token = localStorage.getItem('groq_token') || sessionStorage.getItem('groq_token');
        if (token && token !== 'YOUR_GROQ_TOKEN_HERE') {
            console.log('✅ Pipeline Groq déjà configuré');
            return true;
        }
        throw new Error('Token Groq non configuré');
    } catch (error) {
        console.log('⚠️ Pipeline Groq non configuré - affichage de l\'interface');
        setupPipelineInterface();
        return false;
    }
}

/**
 * Affiche un guide d'utilisation
 */
function showPipelineGuide() {
    console.log(`
📋 === GUIDE DU PIPELINE IA TEMPS RÉEL ===

🔑 ÉTAPE 1: OBTENIR UN TOKEN GITHUB MODELS
1. Allez sur https://github.com/settings/tokens
2. Générez un nouveau token avec accès aux Models
3. Copiez le token (commence par "ghp_...")

⚙️ ÉTAPE 2: CONFIGURER LE PIPELINE
Dans la console F12, tapez:
configureGitHubToken("votre-token-github-ici")

Ou utilisez l'interface graphique qui apparaît automatiquement

🧪 ÉTAPE 3: TESTER LE PIPELINE
Dans la console F12, tapez:
testSpecificModels()

Ou utilisez le bouton "Tester" dans l'interface

📊 ÉTAPE 4: SURVEILLER LE FONCTIONNEMENT
Dans la console F12, tapez:
showSpecificPipelineStatus()

🚀 ÉTAPE 5: UTILISER EN TEMPS RÉEL
L'application utilisera automatiquement les vrais modèles IA
pour toutes les requêtes pédagogiques

💡 CONSEILS:
- Gardez votre token GitHub secret
- Activez le cache pour réduire les coûts
- Utilisez le mode séquentiel pour respecter la chaîne de raisonnement
- Surveillez votre consommation sur GitHub Models

⚠️ IMPORTANT:
- Les appels API sont payants
- Configurez des limites de consommation
- Le cache réduit les appels répétés
`);
}

// Export des fonctions
window.checkPipelineConfiguration = checkPipelineConfiguration;
window.showPipelineGuide = showPipelineGuide;

// Configuration automatique au chargement - PRIORITAIRE
if (typeof window !== 'undefined') {
    const autoToken = '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';
    if (autoToken && autoToken !== 'YOUR_GROQ_TOKEN_HERE') {
        // Configurer immédiatement
        localStorage.setItem('groq_token', autoToken);
        sessionStorage.setItem('groq_token', autoToken);
        console.log('🔑 Token Groq configuré automatiquement');
        
        // Masquer l'interface si elle existe
        setTimeout(() => {
            const configDiv = document.getElementById('pipeline-config');
            if (configDiv) {
                configDiv.style.display = 'none';
                console.log('🚫 Interface de configuration masquée automatiquement');
            }
        }, 100);
    }
}

// Vérification automatique au chargement - DÉSACTIVÉE
setTimeout(() => {
    console.log('🔍 Configuration automatique déjà effectuée - pas d\'affichage nécessaire');
}, 500);

console.log('✅ Interface de configuration du pipeline IA chargée');
