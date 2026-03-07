/**
 * =================================================================
 * CHAT SYSTEM UNIFIED - Version intégrée
 * =================================================================
 * 
 * Ce fichier fusionne les fonctionnalités de :
 * - chat-system.js (discussions)
 * - chat-system-simple.js (Cloudflare Workers)
 * - chat-system-cloudflare.js (alternative Workers)
 * 
 * Intégration pédagogique complète avec StudentProfile
 */

// Configuration principale
const CHAT_CONFIG = {
    workerUrl: "https://tuteur-ia-api.chellouaikamel50.workers.dev",
    fallbackUrl: "https://tuteur-ia-api.votre-compte.workers.dev",
    enablePedagogy: true,
    enableLocalAnalysis: true
};

// État global
let chatState = {
    currentDiscussion: null,
    isProcessing: false,
    lastMessage: null
};

// ============ FONCTIONS UNIFIÉES ============

/**
 * Fonction principale unifiée pour envoyer un message à l'IA
 * @param {string} message - Message de l'utilisateur
 * @param {string} context - Contexte optionnel
 * @param {string} activityType - Type d'activité
 */
window.sendAIChatMessageUnified = async function(message, context = '', activityType = 'général') {
    try {
        console.log('\n🚀 ===== DÉBUT CHAT UNIFIED =====');
        console.log('📝 Message utilisateur:', message);
        console.log('🔗 Configuration:', CHAT_CONFIG);
        
        // Éviter les doublons
        if (chatState.isProcessing) {
            console.log('⚠️ Message déjà en cours de traitement');
            return;
        }
        
        chatState.isProcessing = true;
        chatState.lastMessage = message;
        
        // 1. Afficher message utilisateur
        addChatMessage(message, 'user');
        showTypingIndicator();
        
        // 2. Analyse locale si activée
        let localAnalysis = null;
        if (CHAT_CONFIG.enableLocalAnalysis && window.FrenchAnalyzer) {
            try {
                localAnalysis = await window.FrenchAnalyzer.analyze(message);
                console.log('🔍 Analyse locale:', localAnalysis);
                
                // Si l'analyse locale est suffisante, retourner directement
                if (localAnalysis.errors.length > 0 && localAnalysis.confidence > 0.8) {
                    const pedagogicalResponse = window.AIPedagogicalService?.formatPedagogicalResponse(localAnalysis);
                    displayChatPedagogicalResponse(pedagogicalResponse, message);
                    chatState.isProcessing = false;
                    return;
                }
            } catch (error) {
                console.warn('⚠️ Erreur analyse locale:', error);
            }
        }
        
        // 3. Appel API avec contexte pédagogique
        const pedagogicalContext = {
            studentProfile: window.StudentProfile?.getProfile(window.currentUser?.id),
            localAnalysis: localAnalysis,
            activityType: activityType,
            context: context,
            timestamp: new Date().toISOString()
        };
        
        const response = await callChatAPI(message, pedagogicalContext);
        
        // 4. Traiter la réponse
        await processAIResponse(response, message, localAnalysis);
        
        chatState.isProcessing = false;
        
    } catch (error) {
        console.error('❌ Erreur chat unifié:', error);
        handleChatError(error, message);
        chatState.isProcessing = false;
    }
};

/**
 * Appel l'API avec fallback
 */
async function callChatAPI(message, context) {
    const urls = [CHAT_CONFIG.workerUrl, CHAT_CONFIG.fallbackUrl];
    
    for (const url of urls) {
        try {
            console.log(`📡 Tentative API: ${url}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    context: JSON.stringify(context),
                    activityType: context.activityType || 'général'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Réponse API réussie');
                return data;
            }
        } catch (error) {
            console.warn(`⚠️ Erreur API ${url}:`, error);
            continue;
        }
    }
    
    throw new Error('Toutes les API ont échoué');
}

/**
 * Traite la réponse de l'IA
 */
async function processAIResponse(response, originalMessage, localAnalysis) {
    try {
        // Enregistrer dans le profil étudiant si activé
        if (CHAT_CONFIG.enablePedagogy && window.StudentProfile && window.currentUser) {
            const profile = window.StudentProfile.getProfile(window.currentUser.id);
            
            // Analyser la réponse pour identifier les erreurs
            const errors = extractErrorsFromResponse(response);
            const success = errors.length === 0;
            
            // Enregistrer l'activité
            profile.recordActivity({
                type: 'chat',
                message: originalMessage,
                response: response,
                success: success,
                errors: errors,
                localAnalysis: localAnalysis,
                timestamp: new Date().toISOString()
            });
        }
        
        // Afficher la réponse formatée
        displayChatResponse(response, originalMessage);
        
    } catch (error) {
        console.error('❌ Erreur traitement réponse:', error);
    }
}

/**
 * Affiche la réponse formatée
 */
function displayChatResponse(response, originalMessage) {
    // Si la réponse est déjà formatée pédagogiquement
    if (response.type === 'pedagogical') {
        displayChatPedagogicalResponse(response, originalMessage);
    } else {
        // Affichage standard
        addChatMessage(response.response || response.message || 'Réponse non disponible', 'assistant');
    }
    
    hideTypingIndicator();
}

/**
 * Affiche une réponse pédagogique formatée
 */
function displayChatPedagogicalResponse(pedagogicalResponse, originalMessage) {
    const chatContainer = document.getElementById('chatMessages');
    if (!chatContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex gap-3 mb-4';
    
    // Avatar IA
    messageDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span class="text-white text-sm font-bold">🤖</span>
        </div>
        <div class="flex-1">
            <div class="bg-white rounded-lg p-4 shadow-sm">
                ${pedagogicalResponse.corrections ? `
                    <div class="mb-3 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                        <h6 class="text-blue-800 font-semibold mb-2">💡 Corrections suggérées</h6>
                        ${pedagogicalResponse.corrections.map(correction => `
                            <div class="mb-2">
                                <span class="text-red-600 line-through">${correction.original}</span>
                                <span class="ml-2 text-green-600 font-semibold">→ ${correction.corrected}</span>
                                <span class="ml-2 text-gray-600 text-sm">${correction.explication}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="text-gray-800">${pedagogicalResponse.explanation || pedagogicalResponse.response}</div>
                
                ${pedagogicalResponse.exercises ? `
                    <div class="mt-3 p-3 bg-green-50 rounded border-l-4 border-green-500">
                        <h6 class="text-green-800 font-semibold mb-2">🎯 Exercices recommandés</h6>
                        ${pedagogicalResponse.exercises.map(exercise => `
                            <div class="mb-2">
                                <strong>${exercise.type}:</strong> ${exercise.description}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Gestion des erreurs
 */
function handleChatError(error, originalMessage) {
    console.error('❌ Erreur chat:', error);
    
    addChatMessage('❌ Désolé, une erreur est survenue. Veuillez réessayer.', 'assistant');
    hideTypingIndicator();
}

/**
 * Utilitaires du chat original
 */
function addChatMessage(message, sender) {
    const chatContainer = document.getElementById('chatMessages');
    if (!chatContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex gap-3 mb-4';
    
    const isUser = sender === 'user';
    const avatar = isUser ? '👤' : '🤖';
    const bgColor = isUser ? 'bg-blue-500' : 'bg-white';
    const textColor = isUser ? 'text-white' : 'text-gray-800';
    
    messageDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0">
            <span class="${textColor} text-sm font-bold">${avatar}</span>
        </div>
        <div class="flex-1">
            <div class="bg-white rounded-lg p-4 shadow-sm">
                <div class="${textColor}">${message}</div>
            </div>
        </div>
    `;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTypingIndicator() {
    const chatContainer = document.getElementById('chatMessages');
    if (!chatContainer) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'flex gap-3 mb-4';
    indicator.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span class="text-gray-600 text-sm">💭</span>
        </div>
        <div class="flex-1">
            <div class="bg-gray-100 rounded-lg p-4 shadow-sm">
                <div class="text-gray-600 italic">L'IA réfléchit...</div>
            </div>
        </div>
    `;
    
    chatContainer.appendChild(indicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Extraction des erreurs depuis la réponse
 */
function extractErrorsFromResponse(response) {
    const errors = [];
    
    // Si la réponse contient des corrections
    if (response.corrections) {
        response.corrections.forEach(correction => {
            errors.push({
                type: correction.type || 'orthographe',
                original: correction.original,
                corrected: correction.corrected,
                explanation: correction.explication
            });
        });
    }
    
    return errors;
}

// ============ INTÉGRATION DISCUSSIONS ============

/**
 * Sélection de discussion (de chat-system.js)
 */
window.selectDiscussion = function(topic) {
    chatState.currentDiscussion = topic;
    const data = window.discussionData?.[topic];
    
    if (!data) {
        console.warn(`⚠️ Discussion "${topic}" non trouvée`);
        return;
    }
    
    // Mettre à jour l'apparence des boutons
    document.querySelectorAll('.discussion-item').forEach(btn => {
        btn.classList.remove('active');
        btn.style.backgroundColor = '';
        btn.style.color = 'var(--bs-text-muted)';
        const indicator = btn.querySelector('.indicator');
        if (indicator) {
            indicator.style.backgroundColor = '';
            indicator.classList.add('bg-gray-500');
        }
    });
    
    const activeBtn = document.querySelector(`[data-topic="${topic}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
        activeBtn.style.color = 'var(--bs-white)';
        const activeIndicator = activeBtn.querySelector('.indicator');
        if (activeIndicator) {
            activeIndicator.classList.remove('bg-gray-500');
            activeIndicator.style.backgroundColor = 'var(--bs-primary)';
        }
    }
    
    // Mettre à jour le titre
    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle) {
        chatTitle.textContent = data.title;
    }
};

// ============ EXPORT ============
window.ChatSystemUnified = {
    config: CHAT_CONFIG,
    state: chatState,
    sendMessage: window.sendAIChatMessageUnified,
    selectDiscussion: window.selectDiscussion
};

console.log('✅ Chat System Unified chargé');
