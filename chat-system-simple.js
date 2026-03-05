/**
 * =================================================================
 * CHAT SYSTEM - VERSION SIMPLE (GITHUB PAGES + CLOUDFLARE WORKERS)
 * =================================================================
 */

const WORKER_URL = "https://tuteur-ia-api.votre-compte.workers.dev";

// Fonction principale
window.sendMessage = async function(message) {
    try {
        console.log('🚀 Envoi vers Cloudflare Workers:', message);
        
        // Afficher message utilisateur
        addChatMessage(message, 'user');
        
        // Indicateur de chargement
        showTypingIndicator();
        
        // Appeler l'API
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Réponse reçue:', result);
        
        // Cacher l'indicateur
        hideTypingIndicator();
        
        // Formater et afficher la réponse
        const formattedResponse = formatResponse(result);
        addChatMessage(formattedResponse, 'ai');
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        hideTypingIndicator();
        addChatMessage("Désolé, une erreur technique est survenue. Veuillez réessayer.", 'ai');
    }
};

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
    const chatContainer = document.getElementById('chatMessages');
    if (!chatContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message`;
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${escapeHtml(message)}</p>
                <small>${new Date().toLocaleTimeString()}</small>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="ai-response">${message}</div>
                <small>${new Date().toLocaleTimeString()}</small>
            </div>
        `;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Indicateur de frappe
function showTypingIndicator() {
    const chatContainer = document.getElementById('chatMessages');
    if (chatContainer) {
        const indicator = document.createElement('div');
        indicator.id = 'typingIndicator';
        indicator.className = 'ai-message typing';
        indicator.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        chatContainer.appendChild(indicator);
        chatContainer.scrollTop = chatContainer.scrollHeight;
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
    
    // Configurer le formulaire
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    
    if (chatForm && chatInput) {
        chatForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const message = chatInput.value.trim();
            if (!message) return;
            
            chatInput.value = '';
            
            try {
                await window.sendMessage(message);
            } catch (error) {
                console.error('Erreur:', error);
            }
        });
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
