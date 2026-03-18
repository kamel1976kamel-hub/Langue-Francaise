// 🎯 Exemples d'intégration du système de correction
// Pour les interfaces de chat et d'activités

// Fonction pour ajouter un bouton de correction
function addCorrectionButton(submitButtonId, targetInputId) {
    const submitButton = document.getElementById(submitButtonId);
    const targetInput = document.getElementById(targetInputId);
    
    if (!submitButton || !targetInput) {
        console.error('❌ Éléments non trouvés:', { submitButtonId, targetInputId });
        return;
    }
    
    // Créer le bouton de correction
    const correctionButton = document.createElement('button');
    correctionButton.type = 'button';
    correctionButton.className = 'btn btn-warning integrated-correction-btn';
    correctionButton.innerHTML = '🔍 Correction';
    correctionButton.dataset.target = targetInputId;
    
    // Ajouter les styles
    correctionButton.style.cssText = `
        margin-right: 10px;
        background: #f59e0b;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
        font-size: 14px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    `;
    
    correctionButton.addEventListener('mouseenter', () => {
        correctionButton.style.background = '#d97706';
        correctionButton.style.transform = 'translateY(-1px)';
    });
    
    correctionButton.addEventListener('mouseleave', () => {
        correctionButton.style.background = '#f59e0b';
        correctionButton.style.transform = 'translateY(0)';
    });
    
    // Insérer le bouton à gauche du bouton de soumission
    submitButton.parentNode.insertBefore(correctionButton, submitButton);
    
    console.log('✅ Bouton de correction ajouté pour:', targetInputId);
}

// Intégration pour l'interface de chat
function integrateChatCorrection() {
    console.log('💬 Intégration correction pour le chat...');
    
    // Chercher tous les inputs et textareas
    const allInputs = document.querySelectorAll('input[type="text"], textarea');
    
    allInputs.forEach((input, index) => {
        const inputId = input.id || `correction-input-${index}`;
        input.id = inputId;
        
        // Chercher le bouton de soumission le plus proche
        let submitButton = null;
        
        // Chercher dans le parent direct
        submitButton = input.parentNode.querySelector('button[type="submit"], .submit-btn, .btn-primary');
        
        // Si pas trouvé, chercher plus largement
        if (!submitButton) {
            submitButton = input.closest('form')?.querySelector('button[type="submit"], .submit-btn, .btn-primary');
        }
        
        // Si encore pas trouvé, chercher dans le conteneur parent
        if (!submitButton) {
            const container = input.closest('.input-group, .form-group, .chat-input-container');
            if (container) {
                submitButton = container.querySelector('button[type="submit"], .submit-btn, .btn-primary');
            }
        }
        
        if (submitButton) {
            const submitId = submitButton.id || `submit-btn-${index}`;
            submitButton.id = submitId;
            
            // Vérifier si le bouton de correction existe déjà
            const existingBtn = submitButton.parentNode.querySelector('.integrated-correction-btn');
            if (!existingBtn) {
                addCorrectionButton(submitId, inputId);
            }
        }
    });
}

// Intégration pour les activités
function integrateActivitiesCorrection() {
    console.log('📝 Intégration correction pour les activités...');
    
    // Chercher toutes les zones de texte (y compris celles des activités)
    const allTextareas = document.querySelectorAll('textarea, .activity-textarea, .writing-area');
    
    allTextareas.forEach((textarea, index) => {
        const textareaId = textarea.id || `activity-textarea-${index}`;
        textarea.id = textareaId;
        
        // Chercher le bouton de soumission associé avec plusieurs stratégies
        let submitButton = null;
        
        // Stratégie 1: chercher dans le parent direct
        submitButton = textarea.parentNode.querySelector('button[type="submit"], .activity-submit, .submit-activity, .btn-primary');
        
        // Stratégie 2: chercher dans le formulaire parent
        if (!submitButton) {
            submitButton = textarea.closest('form')?.querySelector('button[type="submit"], .activity-submit, .submit-activity, .btn-primary');
        }
        
        // Stratégie 3: chercher dans les conteneurs d'activité
        if (!submitButton) {
            const activityContainer = textarea.closest('.activity-container, .exercise-container, .writing-container');
            if (activityContainer) {
                submitButton = activityContainer.querySelector('button[type="submit"], .activity-submit, .submit-activity, .btn-primary');
            }
        }
        
        // Stratégie 4: chercher globalement mais proche
        if (!submitButton) {
            const allButtons = document.querySelectorAll('button[type="submit"], .activity-submit, .submit-activity, .btn-primary');
            const closestButton = Array.from(allButtons).find(btn => {
                const rect = textarea.getBoundingClientRect();
                const btnRect = btn.getBoundingClientRect();
                const distance = Math.abs(rect.top - btnRect.top) + Math.abs(rect.left - btnRect.left);
                return distance < 200; // Distance maximale de 200px
            });
            submitButton = closestButton;
        }
        
        if (submitButton) {
            const submitId = submitButton.id || `activity-submit-${index}`;
            submitButton.id = submitId;
            
            // Vérifier si le bouton de correction existe déjà
            const existingBtn = submitButton.parentNode.querySelector('.integrated-correction-btn');
            if (!existingBtn) {
                addCorrectionButton(submitId, textareaId);
            }
        }
    });
}

// Intégration automatique au chargement
function autoIntegrateCorrection() {
    console.log('🚀 Intégration automatique du système de correction...');
    
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoIntegrateCorrection);
        return;
    }
    
    // Intégrer pour le chat
    integrateChatCorrection();
    
    // Intégrer pour les activités
    integrateActivitiesCorrection();
    
    // Ajouter un observateur pour les éléments dynamiques
    setupMutationObserver();
    
    console.log('✅ Intégration terminée - Seul le nouveau système est actif');
}

// Observer les changements dans le DOM pour les éléments dynamiques
function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Vérifier si de nouveaux inputs ou textareas ont été ajoutés
                        const newInputs = node.querySelectorAll ? 
                            node.querySelectorAll('input[type="text"], textarea, button[type="submit"]') : [];
                        
                        if (newInputs.length > 0) {
                            console.log('🔄 Nouveaux éléments détectés, réintégration...');
                            setTimeout(() => {
                                integrateChatCorrection();
                                integrateActivitiesCorrection();
                            }, 100);
                        }
                    }
                });
            }
        });
    });
    
    // Observer tout le corps du document
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Fonction pour créer une interface de correction manuelle
function createManualCorrectionInterface(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('❌ Conteneur non trouvé:', containerId);
        return;
    }
    
    container.innerHTML = `
        <div class="correction-interface">
            <h3>🔍 Correction de texte</h3>
            <div class="text-input-area">
                <textarea id="manual-correction-text" placeholder="Écrivez votre texte ici..." rows="6" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;"></textarea>
            </div>
            <div class="correction-controls" style="margin-top: 15px;">
                <button class="btn btn-primary" onclick="window.integratedCorrectionSystem.handleCorrectionButtonClick({ dataset: { target: 'manual-correction-text' } })">
                    🔍 Lancer la correction
                </button>
                <button class="btn btn-secondary" onclick="document.getElementById('manual-correction-text').value = ''">
                    🗑️ Effacer
                </button>
            </div>
            <div class="correction-result" id="correction-result" style="margin-top: 20px;"></div>
        </div>
    `;
}

// Styles CSS pour l'intégration
const integrationStyles = `
<style>
.integrated-correction-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.integrated-correction-btn:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.integrated-correction-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.correction-interface {
    background: #f9fafb;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    margin: 20px 0;
}

.correction-interface h3 {
    color: #1f2937;
    margin-bottom: 15px;
}

.text-input-area textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.correction-controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.correction-result {
    background: white;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
}

@media (max-width: 768px) {
    .correction-controls {
        flex-direction: column;
    }
    
    .integrated-correction-btn {
        width: 100%;
        justify-content: center;
    }
}
</style>
`;

// Injecter les styles
if (typeof document !== 'undefined') {
    document.head.insertAdjacentHTML('beforeend', integrationStyles);
}

// Initialisation automatique
if (typeof window !== 'undefined') {
    console.log('🔍 Correction Integration: Initialisation...');
    
    // Démarrer l'intégration quand le système NLP est prêt
    document.addEventListener('nlp-ready', () => {
        console.log('🎯 Système NLP prêt, démarrage de l\'intégration...');
        autoIntegrateCorrection();
    });
    
    // Écouter les clics sur les boutons de correction
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('integrated-correction-btn')) {
            console.log('🔍 Clic sur bouton de correction détecté');
            if (window.integratedCorrectionSystem) {
                window.integratedCorrectionSystem.handleCorrectionButtonClick(e.target);
            }
        }
    });
    
    // Démarrer directement si le DOM est déjà chargé
    if (document.readyState !== 'loading') {
        console.log('🔍 DOM déjà chargé, démarrage immédiat...');
        setTimeout(autoIntegrateCorrection, 500);
    } else {
        console.log('🔍 DOM en chargement, attente...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🔍 DOM chargé, démarrage de l\'intégration...');
            setTimeout(autoIntegrateCorrection, 500);
        });
    }
    
    // Exporter les fonctions pour utilisation manuelle
    window.CorrectionIntegration = {
        addCorrectionButton,
        integrateChatCorrection,
        integrateActivitiesCorrection,
        createManualCorrectionInterface,
        autoIntegrateCorrection
    };
    
    console.log('✅ Correction Integration: Initialisation terminée');
}
