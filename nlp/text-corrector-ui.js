// 🎨 COMPOSANT D'INTERFACE UTILISATEUR POUR CORRECTION DE TEXTE
// Intégration transparente dans l'application existante

class TextCorrectorUI {
    constructor(options = {}) {
        this.options = {
            container: options.container || 'body',
            showStats: options.showStats !== false,
            showSuggestions: options.showSuggestions !== false,
            autoCorrect: options.autoCorrect || false,
            theme: options.theme || 'default',
            ...options
        };
        
        this.isInitialized = false;
        this.currentText = '';
        this.currentResult = null;
        
        this.init();
    }

    init() {
        // Attendre que le système NLP soit prêt
        if (window.NLPManager) {
            window.NLPManager.initialize().then(() => {
                this.setupEventListeners();
                this.createUI();
                this.isInitialized = true;
                console.log('✅ Interface de correction prête');
            });
        } else {
            console.error('❌ NLPManager non trouvé');
        }
    }

    setupEventListeners() {
        // Écouter les événements du système NLP
        window.addEventListener('nlp-ready', (event) => {
            console.log('🚀 Système NLP prêt - Interface activée');
            this.updateStatus('ready');
        });

        window.addEventListener('nlp-fallback', (event) => {
            console.log('⚠️ Système NLP en mode fallback');
            this.updateStatus('fallback');
        });
    }

    createUI() {
        const container = typeof this.options.container === 'string' 
            ? document.querySelector(this.options.container) 
            : this.options.container;

        if (!container) {
            console.error('❌ Conteneur non trouvé:', this.options.container);
            return;
        }

        // Créer le composant
        const component = document.createElement('div');
        component.className = 'text-corrector-ui';
        component.innerHTML = this.getUITemplate();
        
        container.appendChild(component);
        this.bindEvents();
        this.applyTheme();
    }

    getUITemplate() {
        return `
            <div class="text-corrector-container">
                <!-- En-tête -->
                <div class="corrector-header">
                    <h3>🔧 Correction Textuelle</h3>
                    <div class="status-indicator" id="nlp-status">
                        <span class="status-dot"></span>
                        <span class="status-text">Initialisation...</span>
                    </div>
                </div>

                <!-- Zone de texte -->
                <div class="text-input-section">
                    <label for="text-input">Texte à corriger :</label>
                    <textarea 
                        id="text-input" 
                        placeholder="Entrez votre texte ici..."
                        rows="4"
                    ></textarea>
                    <div class="input-actions">
                        <button id="correct-btn" class="btn btn-primary" disabled>
                            🔍 Corriger
                        </button>
                        <button id="clear-btn" class="btn btn-secondary">
                            🗑️ Effacer
                        </button>
                        <button id="sample-btn" class="btn btn-secondary">
                            📋 Exemple
                        </button>
                    </div>
                </div>

                <!-- Statistiques -->
                <div class="stats-section" id="stats-section" style="display: none;">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value" id="corrections-count">0</div>
                            <div class="stat-label">Corrections</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="confidence-score">0%</div>
                            <div class="stat-label">Confiance</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="suggestions-count">0</div>
                            <div class="stat-label">Suggestions</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="processing-time">0ms</div>
                            <div class="stat-label">Temps</div>
                        </div>
                    </div>
                </div>

                <!-- Résultat -->
                <div class="result-section" id="result-section" style="display: none;">
                    <div class="result-header">
                        <h4>✅ Texte corrigé</h4>
                        <button id="copy-btn" class="btn btn-small">
                            📋 Copier
                        </button>
                    </div>
                    <textarea 
                        id="text-output" 
                        readonly
                        rows="4"
                    ></textarea>
                </div>

                <!-- Corrections détaillées -->
                <div class="corrections-section" id="corrections-section" style="display: none;">
                    <h4>🔍 Corrections détectées</h4>
                    <div id="corrections-list" class="corrections-list">
                        <div class="no-corrections">Aucune correction détectée</div>
                    </div>
                </div>

                <!-- Suggestions -->
                <div class="suggestions-section" id="suggestions-section" style="display: none;">
                    <h4>💡 Suggestions d'amélioration</h4>
                    <div id="suggestions-list" class="suggestions-list">
                        <div class="no-suggestions">Aucune suggestion</div>
                    </div>
                </div>
            </div>

            <style>
                .text-corrector-container {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 100%;
                    margin: 20px 0;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    overflow: hidden;
                }

                .corrector-header {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .corrector-header h3 {
                    margin: 0;
                    font-size: 18px;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #fbbf24;
                    animation: pulse 2s infinite;
                }

                .status-dot.ready {
                    background: #10b981;
                    animation: none;
                }

                .status-dot.fallback {
                    background: #f59e0b;
                    animation: none;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .text-input-section, .result-section, .corrections-section, .suggestions-section {
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                }

                .text-input-section:last-child,
                .result-section:last-child,
                .corrections-section:last-child,
                .suggestions-section:last-child {
                    border-bottom: none;
                }

                .text-input-section label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #374151;
                }

                textarea {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-family: inherit;
                    font-size: 14px;
                    resize: vertical;
                    transition: border-color 0.3s ease;
                }

                textarea:focus {
                    outline: none;
                    border-color: #10b981;
                }

                #text-output {
                    background: #f8fafc;
                    border-color: #e5e7eb;
                }

                .input-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 12px;
                }

                .btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .btn-primary {
                    background: #10b981;
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #059669;
                    transform: translateY(-1px);
                }

                .btn-secondary {
                    background: #6b7280;
                    color: white;
                }

                .btn-secondary:hover {
                    background: #4b5563;
                    transform: translateY(-1px);
                }

                .btn-small {
                    padding: 6px 12px;
                    font-size: 12px;
                    background: #6b7280;
                    color: white;
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .stats-section {
                    background: #f8fafc;
                    padding: 20px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 15px;
                }

                .stat-item {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    border: 1px solid #e5e7eb;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: bold;
                    color: #10b981;
                }

                .stat-label {
                    color: #6b7280;
                    font-size: 12px;
                    margin-top: 4px;
                }

                .result-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .result-header h4 {
                    margin: 0;
                    color: #374151;
                }

                .corrections-list, .suggestions-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .correction-item, .suggestion-item {
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 12px;
                    margin: 8px 0;
                    border-radius: 0 6px 6px 0;
                }

                .suggestion-item {
                    background: #dbeafe;
                    border-left-color: #3b82f6;
                }

                .correction-item .rule-name {
                    background: #f59e0b;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 11px;
                    margin-right: 6px;
                }

                .suggestion-item .suggestion-type {
                    background: #3b82f6;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 11px;
                    margin-right: 6px;
                }

                .correction-text, .suggestion-text {
                    font-weight: 500;
                    color: #92400e;
                }

                .suggestion-text {
                    color: #1e40af;
                }

                .explanation, .suggestion-desc {
                    color: #78350f;
                    font-size: 13px;
                    margin-top: 4px;
                }

                .suggestion-desc {
                    color: #1e3a8a;
                }

                .no-corrections, .no-suggestions {
                    text-align: center;
                    padding: 20px;
                    color: #6b7280;
                    font-style: italic;
                }

                h4 {
                    margin: 0 0 12px 0;
                    color: #374151;
                    font-size: 16px;
                }
            </style>
        `;
    }

    bindEvents() {
        const elements = {
            textInput: document.getElementById('text-input'),
            correctBtn: document.getElementById('correct-btn'),
            clearBtn: document.getElementById('clear-btn'),
            sampleBtn: document.getElementById('sample-btn'),
            copyBtn: document.getElementById('copy-btn')
        };

        // Correction
        elements.correctBtn.addEventListener('click', () => this.correctText());

        // Effacer
        elements.clearBtn.addEventListener('click', () => this.clearAll());

        // Exemple
        elements.sampleBtn.addEventListener('click', () => this.loadSample());

        // Copier
        elements.copyBtn.addEventListener('click', () => this.copyResult());

        // Auto-correction si activée
        if (this.options.autoCorrect) {
            elements.textInput.addEventListener('input', () => {
                clearTimeout(this.autoCorrectTimeout);
                this.autoCorrectTimeout = setTimeout(() => this.correctText(), 1000);
            });
        }
    }

    async correctText() {
        const textInput = document.getElementById('text-input');
        const text = textInput.value.trim();

        if (!text) {
            this.showError('Veuillez entrer un texte à corriger');
            return;
        }

        const correctBtn = document.getElementById('correct-btn');
        correctBtn.textContent = '⏳ Analyse...';
        correctBtn.disabled = true;

        try {
            // Utiliser la nouvelle fonction de base de données si disponible, sinon fallback
            let result;
            if (window.correctTextWithDatabase) {
                result = await window.correctTextWithDatabase(text);
            } else if (window.correctText) {
                result = await window.correctText(text);
            } else {
                throw new Error('Aucune fonction de correction disponible');
            }
            this.displayResult(result);
        } catch (error) {
            console.error('Erreur de correction:', error);
            this.showError('Erreur lors de la correction: ' + error.message);
        } finally {
            correctBtn.textContent = '🔍 Corriger';
            correctBtn.disabled = false;
        }
    }

    displayResult(result) {
        this.currentResult = result;

        // Adapter le résultat au format attendu
        const corrections = result.corrections || [];
        const suggestions = result.suggestions || [];
        const confidence = result.confidence || 95;
        const processingTime = result.processingTime || 0;
        const correctedText = result.correctedText || result.originalText || '';

        // Mettre à jour les statistiques
        document.getElementById('corrections-count').textContent = corrections.length;
        document.getElementById('confidence-score').textContent = confidence + '%';
        document.getElementById('suggestions-count').textContent = suggestions.length;
        document.getElementById('processing-time').textContent = processingTime + 'ms';
        document.getElementById('stats-section').style.display = 'block';

        // Afficher le texte corrigé
        document.getElementById('text-output').value = correctedText;
        document.getElementById('result-section').style.display = 'block';

        // Afficher les corrections
        this.displayCorrections(corrections);

        // Afficher les suggestions
        if (this.options.showSuggestions) {
            this.displaySuggestions(suggestions);
        }
    }

    displayCorrections(corrections) {
        const correctionsList = document.getElementById('corrections-list');
        const correctionsSection = document.getElementById('corrections-section');

        if (corrections.length === 0) {
            correctionsList.innerHTML = '<div class="no-corrections">✅ Aucune correction détectée</div>';
        } else {
            correctionsList.innerHTML = corrections.map((correction, index) => `
                <div class="correction-item">
                    <div>
                        <span class="rule-name">${correction.rule || 'Règle ' + (index + 1)}</span>
                        <span class="correction-text">"${correction.text}" → "${correction.correction}"</span>
                    </div>
                    ${correction.explanation ? `<div class="explanation">${correction.explanation}</div>` : ''}
                </div>
            `).join('');
        }

        correctionsSection.style.display = 'block';
    }

    displaySuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestions-list');
        const suggestionsSection = document.getElementById('suggestions-section');

        if (!suggestions || suggestions.length === 0) {
            suggestionsList.innerHTML = '<div class="no-suggestions">Aucune suggestion</div>';
        } else {
            suggestionsList.innerHTML = suggestions.map((suggestion, index) => `
                <div class="suggestion-item">
                    <div>
                        <span class="suggestion-type">${suggestion.type || 'Suggestion'}</span>
                        <span class="suggestion-text">${suggestion.text}</span>
                    </div>
                    ${suggestion.description ? `<div class="suggestion-desc">${suggestion.description}</div>` : ''}
                </div>
            `).join('');
        }

        suggestionsSection.style.display = 'block';
    }

    clearAll() {
        document.getElementById('text-input').value = '';
        document.getElementById('text-output').value = '';
        document.getElementById('stats-section').style.display = 'none';
        document.getElementById('result-section').style.display = 'none';
        document.getElementById('corrections-section').style.display = 'none';
        document.getElementById('suggestions-section').style.display = 'none';
        this.currentResult = null;
    }

    loadSample() {
        const samples = [
            "L'enfant mange beaucoup et c'est quoi ce livre ? Les enfant joue dans le jardin. Il vas à l'école.",
            "Je suis aller au magasin pour acheter du pain. Il y a beaucoup de monde et j'ai vu un ami.",
            "Les voiture sont garer dans le rue. Il faut faire attention quand on traverse.",
            "Elle est très intelligent et elle réussi tout ces examens. Son travail est remarquable."
        ];
        const randomSample = samples[Math.floor(Math.random() * samples.length)];
        document.getElementById('text-input').value = randomSample;
    }

    async copyResult() {
        const output = document.getElementById('text-output');
        if (!output.value) return;

        try {
            await navigator.clipboard.writeText(output.value);
            this.showSuccess('Texte copié dans le presse-papiers');
        } catch (error) {
            // Fallback pour les navigateurs plus anciens
            output.select();
            document.execCommand('copy');
            this.showSuccess('Texte copié');
        }
    }

    updateStatus(status) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');

        statusDot.className = `status-dot ${status}`;
        
        switch (status) {
            case 'ready':
                statusText.textContent = 'Prêt';
                document.getElementById('correct-btn').disabled = false;
                break;
            case 'fallback':
                statusText.textContent = 'Mode dégradé';
                document.getElementById('correct-btn').disabled = false;
                break;
            default:
                statusText.textContent = 'Initialisation...';
                document.getElementById('correct-btn').disabled = true;
        }
    }

    showError(message) {
        // Vous pouvez implémenter un système de notification ici
        console.error('Erreur:', message);
        alert(message); // Fallback simple
    }

    showSuccess(message) {
        // Vous pouvez implémenter un système de notification ici
        console.log('Succès:', message);
    }

    applyTheme() {
        // Appliquer le thème personnalisé si spécifié
        if (this.options.theme !== 'default') {
            const container = document.querySelector('.text-corrector-container');
            container.classList.add(`theme-${this.options.theme}`);
        }
    }

    // API publique
    async correctTextFromElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const text = element.value || element.textContent;
            let result;
            if (window.correctTextWithDatabase) {
                result = await window.correctTextWithDatabase(text);
            } else if (window.correctText) {
                result = await window.correctText(text);
            } else {
                throw new Error('Aucune fonction de correction disponible');
            }
            this.displayResult(result);
            return result;
        }
    }

    getCurrentResult() {
        return this.currentResult;
    }
}

// Export pour utilisation globale
window.TextCorrectorUI = TextCorrectorUI;
