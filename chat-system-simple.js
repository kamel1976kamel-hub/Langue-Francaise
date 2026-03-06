/**
 * =================================================================
 * CHAT SYSTEM - VERSION SIMPLE (GITHUB PAGES + CLOUDFLARE WORKERS)
 * =================================================================
 */

const WORKER_URL = "https://tuteur-ia-api.chellouaikamel50.workers.dev";

// Fonction principale
window.sendAIChatMessage = async function(message) {
    try {
        console.log('\n🚀 ===== DÉBUT PIPELINE CLOUDFLARE WORKERS =====');
        console.log('📝 Message utilisateur:', message);
        console.log('🔗 URL Worker:', WORKER_URL);
        console.log('⏰ Timestamp:', new Date().toISOString());
        
        // Afficher message utilisateur
        console.log('📤 ÉTAPE 1: Affichage message utilisateur...');
        addChatMessage(message, 'user');
        console.log('✅ Message utilisateur affiché dans le chat');
        
        // Afficher indicateur de chargement
        console.log('⏳ ÉTAPE 2: Affichage indicateur de chargement...');
        showTypingIndicator();
        console.log('✅ Indicateur de chargement affiché');
        
        // Appeler l'API avec validation CORS
        console.log('📡 ÉTAPE 3: Envoi requête POST vers Worker...');
        const fetchStart = Date.now();
        console.log('⏱️ Début requête:', fetchStart);
        
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
        
        const fetchEnd = Date.now();
        console.log('⏱️ Fin requête:', fetchEnd);
        console.log('⏱️ Durée requête:', fetchEnd - fetchStart, 'ms');
        
        console.log('📡 ÉTAPE 4: Réponse Worker reçue');
        console.log('📊 Status HTTP:', response.status, response.statusText);
        console.log('� Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('📡 ÉTAPE 5: Parsing réponse JSON...');
        const result = await response.json();
        console.log('✅ Parsing JSON réussi');
        console.log('📊 Résultat complet:', result);
        console.log('📊 Structure de la réponse:', {
            studentMessage: !!result.studentMessage,
            analysis: !!result.analysis,
            tutor: !!result.tutor,
            documentation: !!result.documentation,
            validation: !!result.validation
        });
        
        // Afficher les détails de chaque agent
        console.log('🔍 Agent 1 - Analyse:', result.analysis ? '✅' : '❌');
        console.log('👨‍🏫 Agent 2 - Tuteur:', result.tutor ? '✅' : '❌');
        console.log('📚 Agent 3 - Documentation:', result.documentation ? '✅' : '❌');
        console.log('✅ Agent 4 - Validation:', result.validation ? '✅' : '❌');
        
        // Cacher l'indicateur
        console.log('⏹️ ÉTAPE 6: Masquage indicateur de chargement...');
        hideTypingIndicator();
        console.log('✅ Indicateur de chargement masqué');
        
        // Formater et afficher la réponse - afficher tous les agents
        console.log('📊 ÉTAPE 7: Préparation affichage réponse finale...');
        
        // Afficher une seule réponse finale unifiée
        let finalResponse = "";
        
        if (result.tutor && result.tutor.trim() !== '') {
            console.log('👩‍🏫 Sélection réponse Tuteur (priorité 1)');
            finalResponse = result.tutor;
        } else if (result.analysis && result.analysis.trim() !== '') {
            console.log('🔍 Sélection réponse Analyse (priorité 2)');
            finalResponse = result.analysis;
        } else if (result.documentation && result.documentation.trim() !== '') {
            console.log('📚 Sélection réponse Documentation (priorité 3)');
            finalResponse = result.documentation;
        } else {
            console.log('❌ Aucune réponse valide trouvée');
            finalResponse = "Désolé, je n'ai pas pu générer de réponse complète.";
        }
        
        console.log('📊 ÉTAPE 8: Affichage réponse finale dans le chat...');
        console.log('📝 Longueur réponse:', finalResponse.length, 'caractères');
        addChatMessage(finalResponse, 'ai');
        console.log('✅ Réponse finale affichée dans le chat');
        
        // Mettre à jour l'indicateur IA à "prêt"
        console.log('📊 ÉTAPE 9: Mise à jour indicateur IA...');
        if (typeof setIaStatus === 'function') {
            setIaStatus("IA : Prêt", "bg-emerald-500", 100);
            console.log("✅ Indicateur IA mis à jour : PRÊT");
        } else {
            console.log("⚠️ setIaStatus non disponible");
        }
        
        console.log('🎯 ===== PIPELINE TERMINÉE AVEC SUCCÈS =====');
        console.log('⏰ Timestamp fin:', new Date().toISOString());
        console.log('📊 Résumé pipeline:', {
            input: message,
            output: finalResponse.substring(0, 100) + '...',
            agents: {
                analysis: !!result.analysis,
                tutor: !!result.tutor,
                documentation: !!result.documentation,
                validation: !!result.validation
            }
        });
        
        return result;
        
    } catch (error) {
        console.error('❌ ERREUR PIPELINE:', error);
        console.error('📍 Erreur détaillée:', error.message);
        console.error('📍 Stack trace:', error.stack);
        hideTypingIndicator();
        
        console.log('📊 ÉTAPE 10: Affichage message erreur...');
        const errorMsg = `Erreur technique: ${error.message}\n\nVérifiez que:\n1. Le Worker est déployé\n2. La clé API est valide\n3. La connexion Internet fonctionne\n4. Le domaine est autorisé`;
        
        addChatMessage(errorMsg, 'ai');
        console.log('✅ Message erreur affiché');
        console.log('❌ ===== PIPELINE EN ERREUR =====');
        console.log('⏰ Timestamp erreur:', new Date().toISOString());
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

// Fonction de lecture audio avec toggle lecture/arrêt
window.playAudio = function(button) {
    try {
        // Trouver le texte du message IA
        const messageDiv = button.closest('.flex-1');
        const textElement = messageDiv.querySelector('p.text-sm');
        const text = textElement.textContent;
        
        console.log('🔊 Lecture audio du texte:', text);
        
        // Utiliser l'API Web Speech pour lire le texte
        if ('speechSynthesis' in window) {
            // Vérifier si une lecture est en cours
            if (window.speechSynthesis.speaking) {
                if (window.speechSynthesis.paused) {
                    // Reprendre la lecture
                    console.log('🔊 Reprise de la lecture');
                    window.speechSynthesis.resume();
                    button.innerHTML = `
                        <svg class="h-4 w-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    `;
                } else {
                    // Mettre en pause
                    console.log('⏸️ Mise en pause de la lecture');
                    window.speechSynthesis.pause();
                    button.innerHTML = `
                        <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    `;
                }
            } else {
                // Démarrer une nouvelle lecture
                console.log('🔊 Démarrage nouvelle lecture');
                
                // Créer une nouvelle instance de SpeechSynthesisUtterance
                const utterance = new SpeechSynthesisUtterance(text);
                
                // Configurer la voix (français si disponible)
                const voices = window.speechSynthesis.getVoices();
                const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
                if (frenchVoice) {
                    utterance.voice = frenchVoice;
                }
                
                // Configurer les paramètres
                utterance.rate = 0.9;  // Vitesse de lecture
                utterance.pitch = 1;   // Ton
                utterance.volume = 1;  // Volume
                
                // Sauvegarder l'icône originale
                const originalHTML = button.innerHTML;
                
                // Changer l'icône pendant la lecture
                button.innerHTML = `
                    <svg class="h-4 w-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                `;
                
                // Événements de lecture
                utterance.onstart = () => {
                    console.log('🔊 Début de la lecture audio');
                };
                
                utterance.onend = () => {
                    console.log('🔊 Fin de la lecture audio');
                    button.innerHTML = originalHTML;
                };
                
                utterance.onerror = (event) => {
                    console.error('❌ Erreur lecture audio:', event.error);
                    button.innerHTML = originalHTML;
                };
                
                // Démarrer la lecture
                window.speechSynthesis.speak(utterance);
            }
            
        } else {
            console.error('❌ API Speech Synthesis non supportée par ce navigateur');
            alert('La lecture audio n\'est pas supportée par votre navigateur.');
        }
        
    } catch (error) {
        console.error('❌ Erreur dans playAudio:', error);
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

// Ajouter un message dans le chat avec effet de frappe dynamique et sections séparées
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
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        console.log("✅ Message utilisateur ajouté à chatMessages");
    } else {
        // Pour les messages IA, créer des sections séparées avec persistance
        console.log("🎯 Démarrage effet de frappe pour message IA...");
        
        // Créer la structure du message IA avec sections
        messageDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-primary);">
                <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
            </div>
            <div class="flex-1">
                <div class="rounded-lg p-4" style="background-color: rgba(255,255,255,0.05);">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <!-- Sections séparées avec persistance -->
                            <div class="space-y-3">
                                <div class="border-l-2 border-orange-400 pl-3">
                                    <div class="text-xs font-semibold text-orange-400 mb-1">Techniques et pratiques de l'écrit</div>
                                    <div class="text-sm" style="color: var(--bs-white);"></div>
                                </div>
                                <div class="border-l-2 border-blue-400 pl-3">
                                    <div class="text-xs font-semibold text-blue-400 mb-1">Texte narratif</div>
                                    <div class="text-sm" style="color: var(--bs-white);"></div>
                                </div>
                                <div class="border-l-2 border-green-400 pl-3">
                                    <div class="text-xs font-semibold text-green-400 mb-1">Texte descriptif</div>
                                    <div class="text-sm" style="color: var(--bs-white);"></div>
                                </div>
                                <div class="border-l-2 border-purple-400 pl-3">
                                    <div class="text-xs font-semibold text-purple-400 mb-1">Texte explicatif</div>
                                    <div class="text-sm" style="color: var(--bs-white);"></div>
                                </div>
                                <div class="border-l-2 border-red-400 pl-3">
                                    <div class="text-xs font-semibold text-red-400 mb-1">Texte argumentatif</div>
                                    <div class="text-sm" style="color: var(--bs-white);"></div>
                                </div>
                                <div class="border-l-2 border-yellow-400 pl-3">
                                    <div class="text-xs font-semibold text-yellow-400 mb-1">Résumé</div>
                                    <div class="text-sm" style="color: var(--bs-white);"></div>
                                </div>
                            </div>
                        </div>
                        <button onclick="playAudio(this)" class="ml-3 p-1 rounded hover:bg-white/10 transition-colors" title="Lire à voix haute">
                            <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02V12c0-1.8-1.02-3.29-2.5-4.03zM14 3.23v2.06c2.89.86 5 3.5 5 4.5V8c0-1-.62-1.02-1.64-2.5-1.77V3.23z"/>
                            </svg>
                        </button>
                    </div>
                    <p class="text-xs mt-1" style="color: var(--bs-text-muted);">IA • ${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        `;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Lancer l'effet de frappe et répartir le contenu dans les sections
        const sections = messageDiv.querySelectorAll('.text-sm');
        distributeContentInSections(sections, message);
        
        console.log("✅ Message IA ajouté avec sections séparées");
    }
}

// Fonction pour répartir le contenu dans les sections avec persistance
function distributeContentInSections(sections, fullMessage) {
    // Sauvegarder dans localStorage pour la persistance
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '{}');
    const messageId = Date.now();
    chatHistory[messageId] = {
        techniques: '',
        narratif: '',
        descriptif: '',
        explicatif: '',
        argumentatif: '',
        resume: '',
        fullMessage: fullMessage,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    
    // Répartir le message dans les sections avec effet de frappe
    const sectionTypes = ['techniques', 'narratif', 'descriptif', 'explicatif', 'argumentatif', 'resume'];
    let currentSection = 0;
    let currentCharIndex = 0;
    
    // Diviser le message en mots pour répartir intelligemment
    const words = fullMessage.split(' ');
    const wordsPerSection = Math.ceil(words.length / sectionTypes.length);
    
    function typeNextSection() {
        if (currentSection >= sections.length) {
            console.log("✅ Toutes les sections remplies");
            return;
        }
        
        const section = sections[currentSection];
        const sectionWords = words.slice(
            currentSection * wordsPerSection,
            Math.min((currentSection + 1) * wordsPerSection, words.length)
        );
        const sectionText = sectionWords.join(' ');
        
        chatHistory[messageId][sectionTypes[currentSection]] = sectionText;
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        
        // Effet de frappe pour cette section
        let charIndex = 0;
        function typeChar() {
            if (charIndex < sectionText.length) {
                section.textContent += sectionText.charAt(charIndex);
                charIndex++;
                
                const chatContainer = document.getElementById('chatMessages');
                if (chatContainer) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
                
                const delay = Math.random() * 30 + 20;
                setTimeout(typeChar, delay);
            } else {
                currentSection++;
                setTimeout(typeNextSection, 500);
            }
        }
        
        typeChar();
    }
    
    // Commencer la frappe
    typeNextSection();
}

// Effet de frappe dynamique
function simulateTypingEffect(element, text) {
    let index = 0;
    element.textContent = '';
    
    function typeCharacter() {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            
            // Faire défiler vers le bas pendant la frappe
            const chatContainer = document.getElementById('chatMessages');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            
            // Vitesse de frappe (aléatoire pour plus de naturel)
            const delay = Math.random() * 30 + 20; // 20-50ms par caractère
            setTimeout(typeCharacter, delay);
        } else {
            console.log("✅ Effet de frappe terminé");
        }
    }
    
    typeCharacter();
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
