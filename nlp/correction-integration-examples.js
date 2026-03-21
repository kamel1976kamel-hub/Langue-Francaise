// 🗑️ FICHIER OBSOLÈTE - SYSTÈME DE CORRECTION INTÉGRÉ REMPLACÉ
// 
// Ce fichier contient l'ancien système de création automatique de boutons de correction.
// Il a été remplacé par le nouveau système intégré dans index.html avec le panneau de correction.
// 
// Les fonctionnalités sont maintenant gérées par :
// - analyzeQuestion() : Analyse la question
// - displayCorrections() : Affiche les corrections dans le panneau
// - applyAllCorrections() : Applique les corrections
// - sendCorrectedQuestion() : Envoie la question corrigée
//
// Ce fichier est conservé pour référence mais n'est plus chargé dans index.html

console.log('⚠️ correction-integration-examples.js est obsolète et ne devrait plus être utilisé');

// Toutes les fonctions originales sont désactivées
function addCorrectionButton(submitButtonId, targetInputId) {
    console.warn('⚠️ addCorrectionButton est obsolète - utilisez le nouveau système dans index.html');
}

function integrateChatCorrection() {
    console.warn('⚠️ integrateChatCorrection est obsolète - utilisez le nouveau système dans index.html');
}

function integrateActivitiesCorrection() {
    console.warn('⚠️ integrateActivitiesCorrection est obsolète - utilisez le nouveau système dans index.html');
}

function autoIntegrateCorrection() {
    console.warn('⚠️ autoIntegrateCorrection est obsolète - utilisez le nouveau système dans index.html');
}

function setupMutationObserver() {
    console.log('🔍 Mutation Observer désactivé pour éviter la suppression/recréation des boutons');
    // L'observer est désactivé car il causait la disparition des boutons de correction
    // en les supprimant et les recréant continuellement
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
