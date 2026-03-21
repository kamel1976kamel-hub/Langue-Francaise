// 🎯 Système de Correction Intégré pour Chats et Activités
// Interface complète avec nuage de correction et workflow guidé

class IntegratedCorrectionSystem {
    constructor() {
        this.currentCorrections = [];
        this.currentIndex = 0;
        this.originalText = '';
        this.correctedText = '';
        this.isActive = false;
        this.targetElement = null;
        this.correctionCloud = null;
    }

    // Initialisation du système
    initialize() {
        console.log('🎯 Initialisation du système de correction intégré...');
        this.setupEventListeners();
        this.createCorrectionCloudTemplate();
    }

    // Configuration des écouteurs d'événements
    setupEventListeners() {
        // Écouter les clics sur les boutons de correction
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('integrated-correction-btn')) {
                this.handleCorrectionButtonClick(e.target);
            }
        });
    }

    // Créer le template du nuage de correction
    createCorrectionCloudTemplate() {
        const template = document.createElement('template');
        template.id = 'integrated-correction-cloud-template';
        template.innerHTML = `
            <div class="integrated-correction-overlay" style="display: none;">
                <div class="integrated-correction-cloud" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                    <div class="integrated-correction-header">
                        <h3>🔍 Corrections suggérées</h3>
                        <button class="close-integrated-cloud-btn" onclick="window.integratedCorrectionSystem.closeCorrectionCloud()">✕</button>
                    </div>
                    <div class="correction-progress">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <span class="progress-text">Erreur 0 / 0</span>
                    </div>
                    <div class="correction-content">
                        <div class="error-details">
                            <h4>📍 Erreur détectée</h4>
                            <div class="error-text">
                                <span class="original-text"></span>
                                <span class="error-arrow">→</span>
                                <span class="suggested-text"></span>
                            </div>
                            <div class="error-explanation">
                                <h5>💡 Explication</h5>
                                <p class="explanation-text"></p>
                                <div class="example-box">
                                    <strong>Exemple :</strong>
                                    <span class="example-text"></span>
                                </div>
                            </div>
                            <div class="correction-proposals">
                                <h5>✨ Propositions de correction</h5>
                                <div class="proposals-list"></div>
                            </div>
                        </div>
                    </div>
                    <div class="correction-actions">
                        <button class="btn btn-secondary skip-btn" onclick="window.correctionSystem.skipCorrection()">Ignorer</button>
                        <button class="btn btn-primary apply-btn" onclick="window.correctionSystem.applyCurrentCorrection()">Corriger</button>
                    </div>
                    <div class="correction-summary" style="display: none;">
                        <h4>🎉 Corrections terminées !</h4>
                        <div class="summary-stats"></div>
                        <button class="btn btn-success validate-btn" onclick="window.correctionSystem.validateCorrections()">Valider</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(template.content);
    }

    // Gérer le clic sur le bouton de correction
    async handleCorrectionButtonClick(button) {
        const targetId = button.dataset.target;
        const targetElement = document.getElementById(targetId);
        
        if (!targetElement) {
            console.error('❌ Élément cible non trouvé:', targetId);
            return;
        }

        const text = targetElement.value || targetElement.textContent;
        if (!text.trim()) {
            this.showNotification('⚠️ Veuillez d\'abord écrire un texte', 'warning');
            return;
        }

        await this.startCorrectionProcess(targetElement, text);
    }

    // Démarrer le processus de correction
    async startCorrectionProcess(element, text) {
        console.log('🔍 Démarrage du processus de correction...');
        
        this.targetElement = element;
        this.originalText = text;
        this.correctedText = text;
        this.isActive = true;

        try {
            // Analyser le texte avec le système NLP
            const analysis = await this.analyzeText(text);
            this.currentCorrections = this.processAnalysisResults(analysis);
            this.currentIndex = 0;

            if (this.currentCorrections.length === 0) {
                this.showNotification('✅ Aucune erreur détectée ! Votre texte est parfait.', 'success');
                return;
            }

            // Afficher le nuage de correction
            this.showCorrectionCloud();
            this.displayCurrentCorrection();

        } catch (error) {
            console.error('❌ Erreur lors de l\'analyse:', error);
            this.showNotification('❌ Erreur lors de l\'analyse du texte', 'error');
        }
    }

    // Analyser le texte avec le système NLP
    async analyzeText(text) {
        try {
            // Validation du texte
            if (!text || typeof text !== 'string') {
                console.warn('⚠️ Texte invalide pour analyse NLP');
                return {
                    errors: [],
                    suggestions: [],
                    confidence: 0,
                    source: 'invalid_input'
                };
            }
            
            // Utiliser le pipeline hybride si disponible
            if (window.processWithHybridPipeline && typeof window.processWithHybridPipeline === 'function') {
                console.log('🔗 Utilisation du pipeline hybride');
                return await window.processWithHybridPipeline(text);
            }
            
            // Sinon, utiliser spaCy proxy
            if (window.spacyProxyClient && typeof window.spacyProxyClient.analyzeText === 'function') {
                console.log('🔗 Utilisation du spaCy proxy');
                return await window.spacyProxyClient.analyzeText(text);
            }
            
            // Fallback vers analyse locale
            if (window.analyzeTextLocal && typeof window.analyzeTextLocal === 'function') {
                console.log('🔗 Utilisation de l\'analyse locale');
                return await window.analyzeTextLocal(text);
            }
            
            // Fallback vers SpacyAnalyzer
            if (window.SpacyAnalyzer && typeof window.SpacyAnalyzer.analyze === 'function') {
                console.log('🔗 Utilisation de SpacyAnalyzer');
                return await window.SpacyAnalyzer.analyze(text);
            }
            
            // Dernier recours : analyse basique
            console.warn('⚠️ Aucun système NLP avancé disponible, analyse basique');
            return this.performBasicAnalysis(text);
            
        } catch (error) {
            console.error('❌ Erreur analyse NLP:', error);
            // Retourner une analyse basique
            return this.performBasicAnalysis(text);
        }
    }

    // Analyse basique de fallback
    performBasicAnalysis(text) {
        const corrections = [];
        
        // Détections basiques
        const patterns = [
            { pattern: /\bil vas\b/g, correction: 'il va', rule: 'conjugaison', explanation: 'Le verbe "aller" se conjugue "il va" au présent.' },
            { pattern: /\bils vas\b/g, correction: 'ils vont', rule: 'conjugaison', explanation: 'Le verbe "aller" se conjugue "ils vont" au présent.' },
            { pattern: /\bel vas\b/g, correction: 'elle va', rule: 'conjugaison', explanation: 'Le verbe "aller" se conjugue "elle va" au présent.' },
            { pattern: /\bles (\w+)s\b (\w+ent)\b/g, correction: (match, p1, p2) => `les ${p1}s ${p2.replace(/ent$/, 'ent')}`, rule: 'accord', explanation: 'L\'accord sujet-verbe doit être respecté.' }
        ];

        patterns.forEach(({ pattern, correction, rule, explanation }) => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const index = text.indexOf(match);
                    corrections.push({
                        original: match,
                        correction: typeof correction === 'function' ? correction(match) : correction,
                        rule: rule,
                        explanation: explanation,
                        start: index,
                        end: index + match.length,
                        confidence: 0.8
                    });
                });
            }
        });

        return {
            corrections: corrections,
            confidence: corrections.length > 0 ? 0.8 : 1.0,
            processingTime: 50
        };
    }

    // Traiter les résultats d'analyse
    processAnalysisResults(analysis) {
        const corrections = [];
        
        if (analysis.corrections && Array.isArray(analysis.corrections)) {
            corrections.push(...analysis.corrections);
        }
        
        if (analysis.analysis && analysis.analysis.corrections) {
            corrections.push(...analysis.analysis.corrections);
        }

        // Enrichir les corrections avec des exemples
        return corrections.map(correction => ({
            ...correction,
            example: this.generateExample(correction),
            proposals: this.generateProposals(correction)
        }));
    }

    // Générer un exemple pour la correction
    generateExample(correction) {
        const examples = {
            'conjugaison': {
                'il vas': 'Exemple: "Il va au marché" (et non "il vas")',
                'ils vas': 'Exemple: "Ils vont au cinéma" (et non "ils vas")',
                'el vas': 'Exemple: "Elle va travailler" (et non "el vas")'
            },
            'accord': {
                'les chat': 'Exemple: "Les chats sont beaux" (et non "les chat")',
                'les fille': 'Exemple: "Les filles dansent" (et non "les fille")'
            },
            'ponctuation': {
                ' ?': 'Exemple: "Comment allez-vous ?" (avec espace avant le point d\'interrogation)'
            }
        };

        const key = Object.keys(examples).find(k => correction.original.includes(k.split(' ')[0]));
        return examples[key]?.[correction.original] || `Exemple: Utilisez "${correction.correction}" au lieu de "${correction.original}"`;
    }

    // Générer des propositions de correction
    generateProposals(correction) {
        const proposals = [
            {
                text: correction.correction,
                type: 'principale',
                explanation: 'Correction recommandée'
            }
        ];

        // Ajouter des alternatives si pertinent
        if (correction.rule === 'conjugaison') {
            proposals.push({
                text: correction.correction.replace(/va|vont/, 'doit ' + (correction.original.includes('il') ? 'aller' : 'aller')),
                type: 'alternative',
                explanation: 'Alternative avec obligation'
            });
        }

        return proposals;
    }

    // Afficher le nuage de correction
    showCorrectionCloud() {
        const overlay = document.querySelector('.integrated-correction-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            this.updateProgressBar();
        }
    }

    // Fermer le nuage de correction
    closeCorrectionCloud() {
        const overlay = document.querySelector('.integrated-correction-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        this.isActive = false;
    }

    // Afficher la correction actuelle
    displayCurrentCorrection() {
        if (this.currentIndex >= this.currentCorrections.length) {
            this.showCorrectionSummary();
            return;
        }

        const correction = this.currentCorrections[this.currentIndex];
        
        // Mettre à jour l'affichage
        document.querySelector('.original-text').textContent = correction.original;
        document.querySelector('.suggested-text').textContent = correction.correction;
        document.querySelector('.explanation-text').textContent = correction.explanation;
        document.querySelector('.example-text').textContent = correction.example;

        // Afficher les propositions
        const proposalsList = document.querySelector('.proposals-list');
        proposalsList.innerHTML = correction.proposals.map((proposal, index) => `
            <div class="proposal-item ${index === 0 ? 'primary' : 'alternative'}">
                <span class="proposal-text">${proposal.text}</span>
                <small class="proposal-explanation">${proposal.explanation}</small>
                <button class="btn btn-sm ${index === 0 ? 'btn-primary' : 'btn-secondary'}" 
                        onclick="window.correctionSystem.applyProposal(${index})">
                    Corriger
                </button>
            </div>
        `).join('');

        this.updateProgressBar();
    }

    // Mettre à jour la barre de progression
    updateProgressBar() {
        const progress = (this.currentIndex / this.currentCorrections.length) * 100;
        document.querySelector('.progress-fill').style.width = `${progress}%`;
        document.querySelector('.progress-text').textContent = 
            `Erreur ${this.currentIndex + 1} / ${this.currentCorrections.length}`;
    }

    // Appliquer la correction actuelle
    applyCurrentCorrection() {
        const correction = this.currentCorrections[this.currentIndex];
        this.applyCorrection(correction.correction);
    }

    // Appliquer une proposition spécifique
    applyProposal(proposalIndex) {
        const correction = this.currentCorrections[this.currentIndex];
        const proposal = correction.proposals[proposalIndex];
        this.applyCorrection(proposal.text);
    }

    // Appliquer une correction au texte
    applyCorrection(newText) {
        const correction = this.currentCorrections[this.currentIndex];
        
        // Remplacer le texte dans le texte corrigé
        this.correctedText = this.correctedText.replace(correction.original, newText);
        
        // Mettre à jour l'élément cible
        if (this.targetElement) {
            this.targetElement.value = this.correctedText;
        }
        
        // Passer à la correction suivante
        this.currentIndex++;
        this.displayCurrentCorrection();
    }

    // Ignorer la correction actuelle
    skipCorrection() {
        this.currentIndex++;
        this.displayCurrentCorrection();
    }

    // Afficher le résumé des corrections
    showCorrectionSummary() {
        document.querySelector('.correction-content').style.display = 'none';
        document.querySelector('.correction-actions').style.display = 'none';
        document.querySelector('.correction-summary').style.display = 'block';
        
        const stats = `
            <div class="stats-item">
                <span class="stats-number">${this.currentCorrections.length}</span>
                <span class="stats-label">corrections appliquées</span>
            </div>
            <div class="stats-item">
                <span class="stats-number">${this.calculateImprovement()}%</span>
                <span class="stats-label">d'amélioration</span>
            </div>
        `;
        
        document.querySelector('.summary-stats').innerHTML = stats;
        this.updateProgressBar();
    }

    // Calculer le pourcentage d'amélioration
    calculateImprovement() {
        const originalLength = this.originalText.length;
        const correctedLength = this.correctedText.length;
        const changes = Math.abs(correctedLength - originalLength);
        return Math.min(95, Math.round((changes / originalLength) * 100));
    }

    // Valider les corrections
    validateCorrections() {
        this.closeCorrectionCloud();
        this.showNotification('✅ Corrections validées avec succès !', 'success');
        
        // Activer le bouton de soumission si présent
        const submitBtn = this.targetElement?.parentElement?.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('disabled');
        }
    }

    // Afficher une notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.backgroundColor = colors[type];
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Styles CSS pour le nuage de correction
const correctionStyles = `
<style>
.integrated-correction-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
}

.integrated-correction-cloud {
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    position: relative;
    z-index: 100000;
}

.integrated-correction-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.integrated-correction-header h3 {
    margin: 0;
    color: #1f2937;
}

.close-integrated-cloud-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #6b7280;
}

.correction-progress {
    margin-bottom: 25px;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-fill {
    height: 100%;
    background: #3b82f6;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 14px;
    color: #6b7280;
}

.error-details h4 {
    color: #1f2937;
    margin-bottom: 15px;
}

.error-text {
    background: #fef3c7;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 16px;
    text-align: center;
}

.original-text {
    color: #dc2626;
    font-weight: 500;
}

.error-arrow {
    margin: 0 10px;
    color: #6b7280;
}

.suggested-text {
    color: #059669;
    font-weight: 500;
}

.error-explanation {
    background: #f0f9ff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.error-explanation h5 {
    color: #1e40af;
    margin-bottom: 10px;
}

.explanation-text {
    color: #374151;
    margin-bottom: 15px;
}

.example-box {
    background: #f8fafc;
    padding: 15px;
    border-radius: 6px;
    border-left: 4px solid #3b82f6;
}

.example-text {
    color: #6b7280;
    font-style: italic;
}

.correction-proposals h5 {
    color: #1f2937;
    margin-bottom: 15px;
}

.proposal-item {
    background: #f9fafb;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 10px;
    border: 2px solid transparent;
}

.proposal-item.primary {
    border-color: #3b82f6;
}

.proposal-item.alternative {
    border-color: #e5e7eb;
}

.proposal-text {
    display: block;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 5px;
}

.proposal-explanation {
    display: block;
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 10px;
}

.correction-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 25px;
}

.correction-summary {
    text-align: center;
    padding: 20px;
}

.correction-summary h4 {
    color: #059669;
    margin-bottom: 20px;
}

.stats-item {
    display: inline-block;
    margin: 0 20px;
    text-align: center;
}

.stats-number {
    display: block;
    font-size: 24px;
    font-weight: bold;
    color: #3b82f6;
}

.stats-label {
    display: block;
    font-size: 14px;
    color: #6b7280;
}

.validate-btn {
    background: #10b981;
    color: white;
    padding: 12px 30px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 20px;
}

.validate-btn:hover {
    background: #059669;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
`;

// Injecter les styles
if (typeof document !== 'undefined') {
    document.head.insertAdjacentHTML('beforeend', correctionStyles);
}

// Initialisation globale
if (typeof window !== 'undefined') {
    console.log('🔍 Integrated Correction System: Création de l\'instance...');
    window.integratedCorrectionSystem = new IntegratedCorrectionSystem();
    
    // Écouter le chargement du DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🔍 DOM chargé, initialisation du système...');
            window.integratedCorrectionSystem.initialize();
        });
    } else {
        console.log('🔍 DOM déjà chargé, initialisation immédiate...');
        window.integratedCorrectionSystem.initialize();
    }
    
    // Export pour utilisation
    window.IntegratedCorrectionSystem = IntegratedCorrectionSystem;
    
    console.log('✅ Integrated Correction System: Prêt');
}
