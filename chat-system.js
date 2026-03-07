// Système de chat et discussions

// La variable currentDiscussion et discussionData sont déclarées dans index.html pour éviter les conflits

// ============ SÉLECTION DE DISCUSSION ============
window.selectDiscussion = function(topic) {
  window.currentDiscussion = topic;
  const data = window.discussionData[topic];
  
  // Mettre à jour l'apparence des boutons
  document.querySelectorAll('.discussion-item').forEach(btn => {
    btn.classList.remove('active');
    btn.style.backgroundColor = '';
    btn.style.color = 'var(--bs-text-muted)';
    const indicator = btn.querySelector('.indicator');
    indicator.style.backgroundColor = '';
    indicator.classList.add('bg-gray-500');
  });
  
  const activeBtn = document.querySelector(`[data-topic="${topic}"]`);
  activeBtn.classList.add('active');
  activeBtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
  activeBtn.style.color = 'var(--bs-white)';
  const activeIndicator = activeBtn.querySelector('.indicator');
  activeIndicator.classList.remove('bg-gray-500');
  activeIndicator.style.backgroundColor = 'var(--bs-primary)';
  
  // Mettre à jour le titre dans la colonne 3
  document.getElementById('chatTitle').textContent = data.title;
  
  // Charger les messages sauvegardés ou afficher le message de bienvenue
  const chatMessages = document.getElementById('chatMessages');
  const savedMessages = loadChatHistory(topic);
  
  if (savedMessages && savedMessages.length > 0) {
    // Restaurer les messages sauvegardés
    chatMessages.innerHTML = savedMessages.map(msg => createMessageHTML(msg)).join('');
  } else {
    // Afficher le message de bienvenue par défaut
    chatMessages.innerHTML = `
      <div class="flex gap-3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-primary);">
          <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <div class="flex-1">
          <div class="rounded-lg p-4" style="background-color: rgba(255,255,255,0.05);">
            <div class="flex justify-between items-start">
              <p class="text-sm flex-1" style="color: var(--bs-white);">${data.welcomeMessage}</p>
              <button 
                onclick="speakChatAIResponse(this)"
                class="ml-2 p-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 transition-colors"
                title="Lire le message de bienvenue"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </button>
            </div>
          </div>
          <p class="text-xs mt-1" style="color: var(--bs-text-muted);">IA • Maintenant</p>
        </div>
      </div>
    `;
  }
  
  // Mettre à jour la colonne 4
  if (typeof updateColumn4 !== 'undefined') {
    updateColumn4(data.column4);
  }
};

// ============ GESTION DE L'HISTORIQUE DES CHATS ============
function loadChatHistory(topic) {
  try {
    const key = 'chatHistory_' + topic;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Erreur chargement historique:', e);
    return [];
  }
}

function saveChatHistory(topic, messages) {
  try {
    const key = 'chatHistory_' + topic;
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (e) {
    console.error('Erreur sauvegarde historique:', e);
  }
}

function addMessageToHistory(topic, text, sender) {
  const messages = loadChatHistory(topic);
  messages.push({
    text: text,
    sender: sender,
    timestamp: new Date().toISOString()
  });
  saveChatHistory(topic, messages);
}

// ============ RÉINITIALISER LA CONVERSATION ============
window.resetCurrentDiscussion = function() {
  if (!window.currentDiscussion) return;
  
  // Confirmer la réinitialisation
  if (!confirm('Voulez-vous vraiment réinitialiser cette conversation ? Tous les messages seront supprimés.')) {
    return;
  }
  
  // Supprimer l'historique du localStorage
  const key = 'chatHistory_' + window.currentDiscussion;
  localStorage.removeItem(key);
  
  // Réafficher le message de bienvenue
  const data = window.discussionData[window.currentDiscussion];
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = `
    <div class="flex gap-3">
      <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-primary);">
        <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>
      <div class="flex-1">
        <div class="rounded-lg p-4" style="background-color: rgba(255,255,255,0.05);">
          <div class="flex justify-between items-start">
            <p class="text-sm flex-1" style="color: var(--bs-white);">${data.welcomeMessage}</p>
            <button 
              onclick="speakChatAIResponse(this)"
              class="ml-2 p-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 transition-colors"
              title="Lire le message de bienvenue"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
          </div>
        </div>
        <p class="text-xs mt-1" style="color: var(--bs-text-muted);">IA • Maintenant</p>
      </div>
    </div>
  `;
  
  console.log('Conversation réinitialisée:', window.currentDiscussion);
};

function createMessageHTML(msg) {
  const isStudent = msg.sender === 'student';
  const time = new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  if (isStudent) {
    return `
      <div class="flex gap-3">
        <div class="flex-1">
          <div class="rounded-lg p-4" style="background-color: var(--bs-primary); margin-left: auto; max-width: 80%;">
            <p class="text-sm text-white">${escapeHtml(msg.text)}</p>
          </div>
          <p class="text-xs mt-1 text-right" style="color: var(--bs-text-muted);">Vous • ${time}</p>
        </div>
        <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-secondary);">
          <span class="text-white text-xs font-bold">V</span>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="flex gap-3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-primary);">
          <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <div class="flex-1">
          <div class="rounded-lg p-4" style="background-color: rgba(255,255,255,0.05); max-width: 80%;">
            <div class="flex justify-between items-start">
              <p class="text-sm flex-1" style="color: var(--bs-white);">${escapeHtml(msg.text)}</p>
              <button 
                onclick="speakChatAIResponse(this)"
                class="ml-2 p-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 transition-colors"
                title="Lire la réponse de l'IA"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </button>
            </div>
          </div>
          <p class="text-xs mt-1" style="color: var(--bs-text-muted);">IA • ${time}</p>
        </div>
      </div>
    `;
  }
}

function updateColumn4(data) {
  const column4 = document.getElementById('chatColumn4');
  if (!column4) return;
  
  // Mettre à jour le titre avec l'ID
  const titleElement = document.getElementById('chatModuleTitle');
  if (titleElement) {
    titleElement.textContent = data.title;
  }
  
  // Mettre à jour les sections avec les IDs
  const finalitiesElement = document.getElementById('chatModuleFinalities');
  const objectivesList = document.getElementById('chatModuleObjectives');
  const contentElement = document.getElementById('chatModuleContent');
  
  if (finalitiesElement) {
    finalitiesElement.textContent = data.finalities;
  }
  
  if (objectivesList) {
    objectivesList.innerHTML = data.objectives.map(obj => `<li class="list-disc list-inside">${obj}</li>`).join('');
  }
  
  if (contentElement) {
    contentElement.textContent = data.content;
  }
}

// Fonction pour charger le contexte Markdown depuis GitHub Pages
async function fetchMarkdownContext(topic) {
  try {
    // Utiliser directement le chemin absolu qui fonctionne
    const response = await fetch(`https://kamel1976kamel-hub.github.io/Langue-Francaise/contexts/${topic}.md`);
    
    if (!response.ok) throw new Error(`Fichier ${topic}.md non trouvé (status: ${response.status})`);
    
    const mdText = await response.text();
    console.log(`✅ Contexte Markdown ${topic}.md chargé (${mdText.length} caractères)`);
    return mdText;
  } catch (error) {
    console.error('❌ Impossible de charger le contexte Markdown:', error);
    // Fallback contextuel silencieux
    const fallbackContexts = {
      techniques: "Tu es un expert en didactique du français. Aide l'étudiant à progresser dans la production écrite sans lui donner directement les réponses. Domaine : planification, structuration, connecteurs logiques, adaptation au destinataire, révision, analyse de consignes.",
      narratif: "Tu es un expert en littérature spécialisé dans le texte narratif. Aide l'étudiant à maîtriser la structure du récit, les personnages, les temps verbaux, le narrateur et l'intrigue. Guide-le dans la création d'histoires captivantes.",
      descriptif: "Tu es un expert en littérature spécialisé dans le texte descriptif. Aide l'étudiant à développer son regard descriptif, l'organisation spatiale, les perceptions sensorielles, les champs lexicaux et la création d'atmosphère.",
      explicatif: "Tu es un expert en littérature spécialisé dans le texte explicatif. Aide l'étudiant à structurer ses explications de manière logique, utiliser les connecteurs logiques, et répondre aux questions 'Pourquoi?' et 'Comment?'.",
      argumentatif: "Tu es un expert en littérature spécialisé dans le texte argumentatif. Aide l'étudiant à développer sa thèse, construire des arguments solides, utiliser des preuves et réfuter les contre-arguments.",
      resume: "Tu es un expert en littérature spécialisé dans l'art du résumé. Aide l'étudiant à identifier les idées essentielles, éliminer les superflu, reformuler avec ses propres mots et respecter la fidélité au texte."
    };
    
    return fallbackContexts[topic] || "Tu es un tuteur expert en français. Aide l'étudiant sans faire le travail à sa place.";
  }
}

// ============ CHAT AVEC IA (vue Chat) - ARCHITECTURE PÉDAGOGIQUE ============
window.sendAIChatMessage = async function() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Ajouter le message de l'étudiant
  addChatMessage(message, 'student');
  
  // Vider l'input
  input.value = '';
  
  // ARCHITECTURE PÉDAGOGIQUE : Analyse locale d'abord
  console.log('🔍 CHAT - Analyse locale du message:', message);
  const localAnalysis = await window.FrenchAnalyzer?.analyze(message) || { errors: [], confidence: 0 };
  
  console.log('📊 CHAT - Résultat analyse locale:', localAnalysis);
  
  // Si l'analyse locale est suffisamment confidente
  if (localAnalysis.errors.length > 0 && localAnalysis.confidence > 0.8) {
    console.log('✅ CHAT - Analyse locale suffisante - Réponse directe');
    const pedagogicalResponse = window.AIPedagogicalService?.formatPedagogicalResponse(localAnalysis);
    displayChatPedagogicalResponse(pedagogicalResponse, message);
    return;
  }
  
  // Sinon, appel IA avec contexte pédagogique
  console.log('🤖 CHAT - Analyse locale insuffisante - Appel IA');
  
  // ATTEndre que demanderIA soit disponible
  const maxWaitTime = 5000; // 5 secondes max
  const startTime = Date.now();
  
  while (typeof window.demanderIA !== 'function' && (Date.now() - startTime) < maxWaitTime) {
    console.log('⏳ CHAT - En attente de demanderIA...');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Appeler le pipeline IA - AVEC ATTENTE INTELLIGENTE
  if (typeof window.demanderIA === 'function') {
    console.log('🚀 CHAT - Lancement du pipeline IA avec message:', message);
    
    // Charger automatiquement le contexte Markdown du sujet
    let topicContext = "Tu es un tuteur expert en français.";
    if (window.currentDiscussion) {
      topicContext = await fetchMarkdownContext(window.currentDiscussion);
    }
    
    // Construire le contexte pédagogique structuré
    const pedagogicalContext = {
      message_type: "chat",
      student_message: message,
      local_analysis: localAnalysis,
      topic_context: topicContext,
      instructions: `
Tu es un professeur expert de français dans une conversation pédagogique.

Réponds OBLIGATOIREMENT dans ce format JSON :
{
  "analysis": "analyse linguistique du message",
  "error_type": "type d'erreur principal",
  "rule": "règle grammaticale",
  "hint": "indice pédagogique",
  "example": "exemple correct",
  "exercise": "exercice de consolidation",
  "validation": false
}

Instructions :
- Sois encourageant mais précis
- Identifie les erreurs linguistiques si présentes
- Donne des explications claires et structurées
- Propose des exemples concrets
- Adapte ton niveau à un élève de collège/lycée

Contexte du sujet : ${topicContext}
Message de l'étudiant : ${message}
Analyse locale détectée : ${JSON.stringify(localAnalysis)}
      `
    };
    
    window.demanderIA(message, JSON.stringify(pedagogicalContext))
      .then(response => {
        console.log('✅ CHAT - Réponse du pipeline reçue:', response);
        
        // Essayer de parser la réponse JSON
        let pedagogicalResponse;
        try {
          pedagogicalResponse = JSON.parse(response);
        } catch (e) {
          // Fallback si ce n'est pas du JSON
          pedagogicalResponse = {
            analysis: "Réponse pédagogique",
            error_type: "conversation",
            rule: "expression française",
            hint: "Continuer la conversation",
            example: response.substring(0, 150) + "...",
            exercise: "Pratiquer régulièrement",
            validation: true
          };
        }
        
        displayChatPedagogicalResponse(pedagogicalResponse, message);
      })
      .catch(err => {
        console.error('❌ CHAT - Erreur IA :', err);
        addChatMessage("Désolé, une erreur technique est survenue. Veuillez réessayer.", 'ai');
      });
  } else {
    console.error('❌ CHAT - Pipeline IA indisponible après 5 secondes d\'attente.');
    addChatMessage("Le service IA met du temps à se charger. Veuillez réessayer dans quelques instants.", 'ai');
  }
};

// Fonction pour afficher la réponse pédagogique dans le chat
function displayChatPedagogicalResponse(response, originalMessage) {
  const responseHTML = `
    <div class="chat-pedagogical-response" style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 8px 0; border-radius: 8px;">
      <div class="response-header" style="display: flex; align-items: center; margin-bottom: 12px;">
        <span class="status-icon" style="font-size: 18px; margin-right: 8px;">
          ${response.validation ? '✅' : '💡'}
        </span>
        <strong style="color: #1f2937;">Analyse linguistique</strong>
      </div>
      
      <div class="analysis-content" style="margin: 8px 0;">
        <p style="margin: 0; line-height: 1.5;">${response.analysis}</p>
      </div>
      
      ${response.error_type !== 'aucune' && response.error_type !== 'conversation' ? `
        <div class="error-details" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 8px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e;"><strong>Type :</strong> ${response.error_type}</p>
          ${response.rule ? `<p style="margin: 4px 0; color: #78350f;"><strong>Règle :</strong> ${response.rule}</p>` : ''}
        </div>
      ` : ''}
      
      ${response.hint ? `
        <div class="pedagogical-hint" style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin: 8px 0; border-radius: 4px;">
          <p style="margin: 0; color: #1e3a8a;">
            <strong>💡 Conseil :</strong> ${response.hint}
          </p>
        </div>
      ` : ''}
      
      ${response.example ? `
        <div class="correct-example" style="background: #d1fae5; border-left: 4px solid #10b981; padding: 12px; margin: 8px 0; border-radius: 4px;">
          <p style="margin: 0; color: #065f46;">
            <strong>✏️ Exemple :</strong> ${response.example}
          </p>
        </div>
      ` : ''}
      
      ${response.exercise ? `
        <div class="practice-exercise" style="background: #f3e8ff; border-left: 4px solid #8b5cf6; padding: 12px; margin: 8px 0; border-radius: 4px;">
          <p style="margin: 0; color: #5b21b6;">
            <strong>🎯 Exercice :</strong> ${response.exercise}
          </p>
        </div>
      ` : ''}
      
      <div class="confidence-indicator" style="margin-top: 12px; text-align: right; font-size: 12px; color: #6b7280;">
        Confiance : ${Math.round((response.confidence || 0.8) * 100)}%
      </div>
    </div>
  `;
  
  // Afficher avec effet de frappe ou directement
  if (typeof simulateTypingEffectForChat === 'function') {
    simulateTypingEffectForChat(responseHTML);
  } else {
    addChatMessage(responseHTML, 'ai');
  }
  
  // Enregistrer dans le profil d'apprentissage
  if (window.StudentProfile && response.error_type !== 'aucune' && response.error_type !== 'conversation') {
    window.StudentProfile.recordError('anonymous', {
      type: response.error_type,
      context: originalMessage,
      correction: response.hint
    });
  }
}
};

function addChatMessage(text, sender) {
  const chatMessages = document.getElementById('chatMessages');
  
  // Sauvegarder le message dans l'historique
    if (window.currentDiscussion) {
    addMessageToHistory(window.currentDiscussion, text, sender);
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'flex gap-3';
  
  const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  
  if (sender === 'student') {
    messageDiv.innerHTML = `
      <div class="flex-1">
        <div class="rounded-lg p-4" style="background-color: var(--bs-primary); margin-left: auto; max-width: 80%;">
          <p class="text-sm text-white">${escapeHtml(text)}</p>
        </div>
        <p class="text-xs mt-1 text-right" style="color: var(--bs-text-muted);">Vous • ${time}</p>
        </div>
        <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-secondary);">
          <span class="text-white text-xs font-bold">V</span>
        </div>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-primary);">
        <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>
      <div class="flex-1">
        <div class="rounded-lg p-4" style="background-color: rgba(255,255,255,0.05);">
          <div class="flex justify-between items-start">
            <p class="text-sm flex-1" style="color: var(--bs-white);">${escapeHtml(text)}</p>
            <button 
              onclick="speakChatAIResponse(this)"
              class="ml-2 p-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 transition-colors"
              title="Lire la réponse de l'IA"
            >
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
          </div>
        </div>
        <p class="text-xs mt-1" style="color: var(--bs-text-muted);">IA • ${time}</p>
      </div>
    `;
  }
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fonction utilitaire pour échapper le HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
