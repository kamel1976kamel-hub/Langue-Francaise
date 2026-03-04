/**
 * =================================================================
 * SYSTÈME D'INDICATEURS VISUELS
 * Feedback utilisateur pendant les traitements
 * =================================================================
 */

'use strict';

class LoadingIndicators {
    constructor() {
        this.indicators = new Map();
        this.globalProgress = 0;
        this.container = null;
        this.defaultOptions = {
            showProgress: true,
            showSpinner: true,
            closable: false,
            overlay: true,
            zIndex: 9999
        };
        this.init();
    }

    /**
     * Initialise le système d'indicateurs
     * @private
     */
    init() {
        this.createContainer();
        this.addStyles();
    }

    /**
     * Crée le conteneur principal
     * @private
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'loading-indicators-container';
        this.container.className = 'loading-indicators-container';
        document.body.appendChild(this.container);
    }

    /**
     * Ajoute les styles CSS
     * @private
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .loading-indicators-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
            }

            .loading-indicator {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                min-width: 300px;
                max-width: 500px;
                pointer-events: auto;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .loading-indicator.dark {
                background: rgba(30, 30, 30, 0.95);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .loading-indicator-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(2px);
                z-index: 9998;
            }

            .loading-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .loading-spinner.small {
                width: 24px;
                height: 24px;
                border-width: 2px;
            }

            .loading-spinner.large {
                width: 56px;
                height: 56px;
                border-width: 4px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .loading-message {
                font-size: 16px;
                font-weight: 500;
                color: #374151;
                text-align: center;
                margin: 0;
            }

            .loading-indicator.dark .loading-message {
                color: #f3f4f6;
            }

            .loading-progress-container {
                width: 100%;
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
            }

            .loading-indicator.dark .loading-progress-container {
                background: #4b5563;
            }

            .loading-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                border-radius: 4px;
                transition: width 0.3s ease;
                width: 0%;
            }

            .loading-steps {
                width: 100%;
                margin-top: 12px;
            }

            .loading-step {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 0;
                font-size: 14px;
                color: #6b7280;
                opacity: 0.6;
                transition: opacity 0.3s ease;
            }

            .loading-step.active {
                color: #3b82f6;
                opacity: 1;
            }

            .loading-step.completed {
                color: #10b981;
                opacity: 1;
            }

            .loading-indicator.dark .loading-step {
                color: #9ca3af;
            }

            .loading-indicator.dark .loading-step.active {
                color: #60a5fa;
            }

            .loading-indicator.dark .loading-step.completed {
                color: #34d399;
            }

            .loading-close-btn {
                position: absolute;
                top: 12px;
                right: 12px;
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #6b7280;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s ease;
            }

            .loading-close-btn:hover {
                background: rgba(107, 114, 128, 0.1);
            }

            .loading-indicator.dark .loading-close-btn {
                color: #9ca3af;
            }

            .loading-indicator.dark .loading-close-btn:hover {
                background: rgba(156, 163, 175, 0.1);
            }

            .fade-in {
                animation: fadeIn 0.3s ease;
            }

            .fade-out {
                animation: fadeOut 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -45%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }

            @keyframes fadeOut {
                from { opacity: 1; transform: translate(-50%, -50%); }
                to { opacity: 0; transform: translate(-50%, -55%); }
            }

            .loading-dots {
                display: inline-block;
            }

            .loading-dots::after {
                content: '';
                animation: dots 1.5s steps(4, end) infinite;
            }

            @keyframes dots {
                0%, 20% { content: ''; }
                40% { content: '.'; }
                60% { content: '..'; }
                80%, 100% { content: '...'; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Affiche un indicateur de chargement
     * @param {string} id - ID unique de l'indicateur
     * @param {string} message - Message à afficher
     * @param {Object} options - Options de configuration
     * @returns {Object} Contrôleur de l'indicateur
     */
    show(id, message, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        
        // Masquer l'indicateur existant s'il y en a un
        if (this.indicators.has(id)) {
            this.hide(id);
        }

        // Créer l'overlay si nécessaire
        let overlay = null;
        if (config.overlay) {
            overlay = this.createOverlay();
        }

        // Créer l'indicateur
        const indicator = this.createIndicator(id, message, config);
        
        // Ajouter au DOM
        if (overlay) {
            document.body.appendChild(overlay);
        }
        this.container.appendChild(indicator);

        // Stocker les références
        this.indicators.set(id, {
            element: indicator,
            overlay,
            config,
            startTime: Date.now()
        });

        // Animation d'entrée
        requestAnimationFrame(() => {
            indicator.classList.add('fade-in');
        });

        return this.createController(id);
    }

    /**
     * Met à jour un indicateur existant
     * @param {string} id - ID de l'indicateur
     * @param {Object} updates - Mises à jour à appliquer
     */
    update(id, updates) {
        const indicatorData = this.indicators.get(id);
        if (!indicatorData) return;

        const { element } = indicatorData;

        if (updates.message) {
            const messageEl = element.querySelector('.loading-message');
            if (messageEl) {
                messageEl.innerHTML = `${updates.message}<span class="loading-dots"></span>`;
            }
        }

        if (updates.progress !== undefined) {
            const progressBar = element.querySelector('.loading-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${Math.max(0, Math.min(100, updates.progress))}%`;
            }
        }

        if (updates.steps) {
            this.updateSteps(element, updates.steps);
        }

        if (updates.type) {
            this.updateType(element, updates.type);
        }
    }

    /**
     * Masque un indicateur
     * @param {string} id - ID de l'indicateur
     * @param {number} delay - Délai avant de masquer (ms)
     */
    hide(id, delay = 0) {
        const indicatorData = this.indicators.get(id);
        if (!indicatorData) return;

        const { element, overlay } = indicatorData;

        setTimeout(() => {
            // Animation de sortie
            element.classList.add('fade-out');

            setTimeout(() => {
                // Supprimer du DOM
                element.remove();
                if (overlay) {
                    overlay.remove();
                }

                // Nettoyer les références
                this.indicators.delete(id);
            }, 300);
        }, delay);
    }

    /**
     * Masque tous les indicateurs
     * @param {number} delay - Délai avant de masquer (ms)
     */
    hideAll(delay = 0) {
        for (const id of this.indicators.keys()) {
            this.hide(id, delay);
        }
    }

    /**
     * Crée un indicateur
     * @private
     */
    createIndicator(id, message, config) {
        const indicator = document.createElement('div');
        indicator.className = `loading-indicator ${config.dark ? 'dark' : ''}`;
        indicator.id = `loading-${id}`;

        let content = `
            <div class="loading-content">
        `;

        if (config.showSpinner) {
            content += `
                <div class="loading-spinner ${config.spinnerSize || ''}"></div>
            `;
        }

        content += `
            <p class="loading-message">${message}<span class="loading-dots"></span></p>
        `;

        if (config.showProgress) {
            content += `
                <div class="loading-progress-container">
                    <div class="loading-progress-bar"></div>
                </div>
            `;
        }

        if (config.steps) {
            content += '<div class="loading-steps"></div>';
        }

        content += '</div>';

        if (config.closable) {
            content += `
                <button class="loading-close-btn" onclick="window.loadingIndicators.hide('${id}')">&times;</button>
            `;
        }

        indicator.innerHTML = content;
        return indicator;
    }

    /**
     * Crée un overlay
     * @private
     */
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-indicator-overlay';
        return overlay;
    }

    /**
     * Met à jour les étapes
     * @private
     */
    updateSteps(element, steps) {
        const stepsContainer = element.querySelector('.loading-steps');
        if (!stepsContainer) return;

        stepsContainer.innerHTML = steps.map((step, index) => `
            <div class="loading-step ${step.active ? 'active' : ''} ${step.completed ? 'completed' : ''}">
                <span>${step.icon || '📋'}</span>
                <span>${step.name}</span>
            </div>
        `).join('');
    }

    /**
     * Met à jour le type de spinner
     * @private
     */
    updateType(element, type) {
        const spinner = element.querySelector('.loading-spinner');
        if (!spinner) return;

        // Changer la couleur selon le type
        const colors = {
            'info': '#3b82f6',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444'
        };

        const color = colors[type] || '#3b82f6';
        spinner.style.borderTopColor = color;
    }

    /**
     * Crée un contrôleur pour l'indicateur
     * @private
     */
    createController(id) {
        return {
            update: (updates) => this.update(id, updates),
            hide: (delay) => this.hide(id, delay),
            isShowing: () => this.indicators.has(id)
        };
    }

    /**
     * Affiche un indicateur simple
     * @param {string} message - Message
     * @param {Object} options - Options
     * @returns {Object} Contrôleur
     */
    showSimple(message, options = {}) {
        const id = `simple-${Date.now()}`;
        return this.show(id, message, {
            showProgress: false,
            spinnerSize: 'small',
            ...options
        });
    }

    /**
     * Affiche un indicateur avec progression
     * @param {string} message - Message
     * @param {Object} options - Options
     * @returns {Object} Contrôleur
     */
    showWithProgress(message, options = {}) {
        const id = `progress-${Date.now()}`;
        return this.show(id, message, {
            showProgress: true,
            ...options
        });
    }

    /**
     * Affiche un indicateur avec étapes
     * @param {string} message - Message
     * @param {Array} steps - Étapes
     * @param {Object} options - Options
     * @returns {Object} Contrôleur
     */
    showWithSteps(message, steps, options = {}) {
        const id = `steps-${Date.now()}`;
        const indicator = this.show(id, message, {
            steps,
            ...options
        });
        
        return indicator;
    }

    /**
     * Vérifie si un indicateur est affiché
     * @param {string} id - ID de l'indicateur
     * @returns {boolean}
     */
    isShowing(id) {
        return this.indicators.has(id);
    }

    /**
     * Récupère le nombre d'indicateurs actifs
     * @returns {number}
     */
    getActiveCount() {
        return this.indicators.size;
    }

    /**
     * Nettoie tous les indicateurs
     */
    cleanup() {
        this.hideAll();
        if (this.container) {
            this.container.remove();
        }
    }
}

// Instance globale
window.loadingIndicators = new LoadingIndicators();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingIndicators;
}
