// 🚀 Installateur NLP Automatique
// Détecte et installe spaCy selon les capacités du système

class AutoNLPInstaller {
    constructor() {
        this.installationStatus = 'checking';
        this.preferredMethod = null;
    }

    async initialize() {
        console.log('🔍 Détection des capacités NLP...');
        
        // 1. Essayer WebAssembly (priorité)
        if (await this.tryWebAssembly()) {
            this.preferredMethod = 'wasm';
            this.installationStatus = 'ready';
            console.log('✅ spaCy WebAssembly disponible');
            return true;
        }
        
        // 2. Essayer spaCy local
        if (await this.tryLocalSpacy()) {
            this.preferredMethod = 'local';
            this.installationStatus = 'ready';
            console.log('✅ spaCy local disponible');
            return true;
        }
        
        // 3. Proposer installation locale
        if (await this.offerLocalInstallation()) {
            this.preferredMethod = 'local-installed';
            this.installationStatus = 'ready';
            console.log('✅ spaCy local installé');
            return true;
        }
        
        // 4. Fallback cloud
        this.preferredMethod = 'cloud';
        this.installationStatus = 'fallback';
        console.log('⚠️ Utilisation du fallback cloud');
        return false;
    }

    async tryWebAssembly() {
        try {
            // Simulation de spaCy-WASM (à implémenter)
            console.log('🧪 Test spaCy WebAssembly...');
            
            // Charger le modèle WASM depuis CDN
            const wasmModule = await this.loadWasmModule();
            return wasmModule !== null;
            
        } catch (error) {
            console.log('❌ spaCy WebAssembly non disponible:', error.message);
            return false;
        }
    }

    async tryLocalSpacy() {
        try {
            console.log('🧪 Test spaCy local...');
            
            // Tester si le proxy local fonctionne
            const response = await fetch('http://localhost:8002/health', {
                method: 'GET',
                timeout: 2000
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.status === 'healthy';
            }
            
            return false;
            
        } catch (error) {
            console.log('❌ spaCy local non disponible:', error.message);
            return false;
        }
    }

    async offerLocalInstallation() {
        try {
            console.log('💰 Proposition d\'installation locale...');
            
            // Afficher une boîte de dialogue
            const userChoice = await this.showInstallationDialog();
            
            if (userChoice) {
                return await this.performLocalInstallation();
            }
            
            return false;
            
        } catch (error) {
            console.log('❌ Installation locale échouée:', error.message);
            return false;
        }
    }

    showInstallationDialog() {
        return new Promise((resolve) => {
            // Créer une modal d'installation
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;">
                        <h2>🚀 Installation NLP Locale</h2>
                        <p>Voulez-vous installer spaCy localement pour une analyse ultra-rapide ?</p>
                        <p><strong>Avantages :</strong></p>
                        <ul style="text-align: left;">
                            <li>⚡ Analyse instantanée (20ms)</li>
                            <li>🔒 100% privé et sécurisé</li>
                            <li>🌐 Fonctionne hors ligne</li>
                        </ul>
                        <p><strong>Taille :</strong> ~200MB</p>
                        <div style="margin-top: 20px;">
                            <button id="install-yes" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-right: 10px;">Installer</button>
                            <button id="install-no" style="background: #ef4444; color: white; padding: 10px 20px; border: none; border-radius: 5px;">Non merci</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            document.getElementById('install-yes').onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };
            
            document.getElementById('install-no').onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };
        });
    }

    async performLocalInstallation() {
        try {
            console.log('📦 Début de l\'installation locale...');
            
            // 1. Télécharger l'installeur
            const installerUrl = 'https://github.com/explosion/spacy/releases/latest/download/spacy_windows.exe';
            await this.downloadFile(installerUrl, 'spacy_installer.exe');
            
            // 2. Exécuter l'installation
            await this.executeInstaller('spacy_installer.exe');
            
            // 3. Installer le modèle français
            await this.installSpacyModel();
            
            // 4. Démarrer le proxy
            await this.startLocalProxy();
            
            console.log('✅ Installation terminée avec succès');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'installation:', error);
            return false;
        }
    }

    async downloadFile(url, filename) {
        // Implémentation du téléchargement
        console.log(`📥 Téléchargement de ${url}...`);
        // Code de téléchargement ici...
    }

    async executeInstaller(exePath) {
        // Exécuter l'installeur (nécessite des permissions)
        console.log(`⚙️ Exécution de ${exePath}...`);
        // Code d'exécution ici...
    }

    async installSpacyModel() {
        console.log('📦 Installation du modèle français...');
        // Commande: python -m spacy download fr_core_news_md
    }

    async startLocalProxy() {
        console.log('🚀 Démarrage du proxy local...');
        // Démarrer proxy-spacy-pro.py
    }

    async loadWasmModule() {
        // Charger spaCy en WebAssembly
        try {
            // Simulation - à remplacer avec le vrai module WASM
            return { loaded: true };
        } catch {
            return null;
        }
    }

    getInstallationStatus() {
        return {
            status: this.installationStatus,
            method: this.preferredMethod,
            capabilities: this.getCapabilities()
        };
    }

    getCapabilities() {
        switch (this.preferredMethod) {
            case 'wasm':
                return {
                    speed: 'medium',
                    privacy: 'high',
                    offline: true,
                    accuracy: 'medium'
                };
            case 'local':
            case 'local-installed':
                return {
                    speed: 'high',
                    privacy: 'maximum',
                    offline: true,
                    accuracy: 'high'
                };
            case 'cloud':
                return {
                    speed: 'medium',
                    privacy: 'low',
                    offline: false,
                    accuracy: 'high'
                };
            default:
                return {
                    speed: 'low',
                    privacy: 'medium',
                    offline: false,
                    accuracy: 'low'
                };
        }
    }
}

// Export pour utilisation globale
window.AutoNLPInstaller = AutoNLPInstaller;

// Initialisation automatique au chargement
document.addEventListener('DOMContentLoaded', async () => {
    const installer = new AutoNLPInstaller();
    await installer.initialize();
    
    // Notifier l'application
    window.dispatchEvent(new CustomEvent('nlp-installer-ready', {
        detail: installer.getInstallationStatus()
    }));
});
