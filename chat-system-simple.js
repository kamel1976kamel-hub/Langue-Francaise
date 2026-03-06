/**
 * =================================================================
 * CHAT SYSTEM - VERSION SIMPLE (GITHUB PAGES + CLOUDFLARE WORKERS)
 * =================================================================
 */

const WORKER_URL = "https://tuteur-ia-api.chellouaikamel50.workers.dev";

// Fonction principale
window.sendAIChatMessage = async function(message) {
    try {
        console.log('🚀 DÉBUT PIPELINE CLOUDFLARE WORKERS');
        console.log('📝 Message utilisateur:', message);
        console.log('🔗 URL Worker:', WORKER_URL);
        
        // Afficher message utilisateur
        addChatMessage(message, 'user');
        
        // Afficher indicateur de chargement
        showTypingIndicator();
        console.log('⏳ Indicateur de chargement affiché');
        
        // Appeler l'API avec validation CORS
        console.log('📡 Envoi requête POST vers Worker...');
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit',
            body: JSON.stringify({
                message: message
            })
        });
        
        console.log('📡 Réponse Worker reçue - Status:', response.status);
        console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Pipeline 4 agents terminée !');
        console.log('📊 Résultat complet:', result);
        
        // Afficher les détails de chaque agent
        console.log('🔍 Agent 1 - Analyse:', result.analysis ? '✅' : '❌');
        console.log('👨‍🏫 Agent 2 - Tuteur:', result.tutor ? '✅' : '❌');
        console.log('📚 Agent 3 - Documentation:', result.documentation ? '✅' : '❌');
        console.log('✅ Agent 4 - Validation:', result.validation ? '✅' : '❌');
        
        // Cacher l'indicateur
        hideTypingIndicator();
        console.log('⏹️ Indicateur de chargement masqué');
        
        // Formater et afficher la réponse - afficher tous les agents
        console.log('📊 Affichage des 4 agents...');
        
        // Afficher chaque agent séparément
        if (result.analysis) {
            addChatMessage("🔎 **Analyse :**\n" + result.analysis, 'ai');
        }
        if (result.tutor) {
            addChatMessage("👩‍🏫 **Tuteur :**\n" + result.tutor, 'ai');
        }
        if (result.documentation) {
            addChatMessage("📚 **Documentation :**\n" + result.documentation, 'ai');
        }
        if (result.validation) {
            addChatMessage("✅ **Validation :**\n" + result.validation, 'ai');
        }
        
        console.log('💬 Réponses des 4 agents affichées');
        
        console.log('🎯 PIPELINE TERMINÉE AVEC SUCCÈS');
        return result;
        
    } catch (error) {
        console.error('❌ ERREUR PIPELINE:', error);
        console.error('📍 Erreur détaillée:', error.message);
        console.error('📍 Stack trace:', error.stack);
        hideTypingIndicator();
        
        // Message d'erreur détaillé
        const errorMsg = `Erreur technique: ${error.message}\n\nVérifiez que:\n1. Le Worker est déployé\n2. La clé API est valide\n3. La connexion Internet fonctionne\n4. Le domaine est autorisé`;
        addChatMessage(errorMsg, 'ai');
        console.log('💬 Message d\'erreur affiché à l\'utilisateur');
    }
};

// Log de démarrage (après la définition de la fonction)
console.log('🚀 CHAT SYSTEM CHARGÉ - Pipeline 4 agents IA');
console.log('🔗 URL Worker:', WORKER_URL);
console.log('📋 Fonctions disponibles:');
console.log('  - sendAIChatMessage:', typeof window.sendAIChatMessage);
console.log('  - addChatMessage:', typeof window.addChatMessage);
console.log('  - showTypingIndicator:', typeof window.showTypingIndicator);
console.log('  - hideTypingIndicator:', typeof window.hideTypingIndicator);

// Formater la réponse
function formatResponse(result) {
    const { analysis, tutor, documentation, validation } = result;
    
    let response = "";
    
    if (tutor) {
        response += `📚 **Tuteur**\n${tutor}\n\n`;
    }
    
    if (documentation && documentation.trim() !== '') {
        response += `📖 **Documentation**\n${documentation}\n\n`;
    }
    
    if (validation && validation.trim() !== '') {
        response += `✅ **Validation**\n${validation}`;
    }
    
    return response || "Réponse non disponible.";
}

// Ajouter un message dans le chat
function addChatMessage(message, sender) {
    // Utiliser l'ID direct du conteneur chat
    const chatContainer = document.getElementById('chatMessages');
    
    if (!chatContainer) {
        console.log("❌ Conteneur chatMessages non trouvé");
        return;
    }
    
    console.log("✅ Conteneur chatMessages trouvé:", chatContainer.id);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex gap-3 mb-4';

    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="flex-1"></div>
            <div class="flex-1">
                <div class="rounded-lg p-4 bg-blue-500 text-white ml-auto max-w-xs break-words">
                    <p class="text-sm whitespace-pre-wrap">${escapeHtml(message)}</p>
                    <p class="text-xs mt-1 text-right">${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="flex-1">
                <div class="rounded-lg p-4 bg-gray-200 max-w-xs break-words">
                    <p class="text-sm whitespace-pre-wrap">${message}</p>
                    <p class="text-xs mt-1">${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
            <div class="flex-1"></div>
        `;
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    console.log("✅ Message ajouté à chatMessages");
}

// Indicateur de frappe
function showTypingIndicator() {
    // Utiliser l'ID direct du conteneur chat
    const chatContainer = document.getElementById('chatMessages');
    
    if (chatContainer) {
        const indicator = document.createElement('div');
        indicator.id = 'typingIndicator';
        indicator.className = 'flex gap-3 mb-4 typing-indicator';
        indicator.innerHTML = `
            <div class="flex-1">
                <div class="rounded-lg p-4 bg-gray-200 max-w-xs">
                    <div class="flex gap-1">
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                </div>
            </div>
            <div class="flex-1"></div>
        `;
        chatContainer.appendChild(indicator);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        console.log("✅ Indicateur de typing ajouté à chatMessages");
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Échapper le HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Chat System Simple initialisé');
    
    // Configurer l'input et le bouton
    const chatInput = document.querySelector('#chatInput');
    const sendButton = document.querySelector('button:last-of-type');
    
    if (chatInput && sendButton) {
        // Créer la fonction sendMessage
        window.sendMessage = function() {
            const message = chatInput.value.trim();
            if (message) {
                window.sendAIChatMessage(message);
                chatInput.value = '';
            }
        };
        
        // Connecter le bouton
        sendButton.onclick = window.sendMessage;
        
        // Configurer l'événement Enter
        chatInput.onkeypress = function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                window.sendMessage();
            }
        };
        
        console.log('✅ Interface chat configurée');
    } else {
        console.log('❌ Input ou bouton non trouvé');
    }
});

// Styles
const styles = `
<style>
.typing-indicator {
    display: flex;
    gap: 4px;
    padding: 8px 0;
}

.typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #666;
    animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
}

.user-message {
    text-align: right;
    margin: 10px 0;
}

.ai-message {
    text-align: left;
    margin: 10px 0;
}

.message-content {
    display: inline-block;
    max-width: 70%;
    padding: 10px 15px;
    border-radius: 15px;
    word-wrap: break-word;
}

.user-message .message-content {
    background-color: #007bff;
    color: white;
    margin-left: auto;
}

.ai-message .message-content {
    background-color: #f1f3f4;
    color: #333;
}

.ai-response {
    white-space: pre-line;
    line-height: 1.5;
}
</style>
`;

// Injecter les styles
if (!document.getElementById('chat-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'chat-styles';
    styleSheet.textContent = styles.replace(/<\/?style>/g, '');
    document.head.appendChild(styleSheet);
}

console.log('✅ Chat System Simple chargé');
