// SYSTÈME DE CHAT UNIFIÉ ET OPTIMISÉ
// =====================================

// ============ ANALYSE EN TEMPS RÉEL POUR CHATS ============
window.setupRealTimeCorrectionForChat = function() {
  const chatInput = document.getElementById('chatInput');
  if (!chatInput) return;
  
  let typingTimer;
  const typingDelay = 500; // RÉDUIT à 500ms pour plus de réactivité
  
  // Fonction d'analyse en temps réel pour les chats
  const analyzeChatText = async function() {
    const currentText = chatInput.value || '';
    
    // Ne pas analyser si le texte est trop court ou vide
    if (currentText.trim().length < 3) {
      // Supprimer le nuage existant si le texte est trop court
      const existingCloud = document.querySelector('.correction-cloud');
      if (existingCloud) existingCloud.remove();
      return;
    }
    
    console.log('🔍 Analyse en temps réel du chat:', currentText.substring(0, 50) + '...');
    
    try {
      // Analyser le texte avec le service local
      if (window.analyzeTextLocal) {
        const analysis = window.analyzeTextLocal(currentText);
        
        // Analyser les doublons
        const duplicateAnalysis = analyzeDuplicatesForChat(currentText);
        
        // Fusionner les analyses
        const mergedAnalysis = {
          errors: [...(analysis.errors || []), ...(duplicateAnalysis.errors || [])],
          explanations: [...(analysis.explanations || []), ...(duplicateAnalysis.explanations || [])],
          suggestions: [...(analysis.suggestions || []), ...(duplicateAnalysis.suggestions || [])]
        };
        
        // Créer le nuage de correction IMMÉDIATEMENT si des erreurs sont détectées
        if (mergedAnalysis && (mergedAnalysis.errors.length > 0 || mergedAnalysis.suggestions.length > 0)) {
          const correctionsData = {
            corrections: mergedAnalysis.errors.map(err => ({
              text: err.text,
              correction: err.correction,
              type: err.type
            })),
            explanations: mergedAnalysis.explanations || [],
            suggestions: mergedAnalysis.suggestions || []
          };
          
          // Supprimer l'ancien nuage avant d'en créer un nouveau
          const existingCloud = document.querySelector('.correction-cloud');
          if (existingCloud) existingCloud.remove();
          
          // Créer le nouveau nuage IMMÉDIATEMENT
          createCorrectionCloud(correctionsData, currentText);
        } else {
          // Supprimer le nuage si aucune erreur
          const existingCloud = document.querySelector('.correction-cloud');
          if (existingCloud) existingCloud.remove();
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse en temps réel du chat:', error);
    }
  };
  
  // Ajouter l'événement de saisie - PLUS RÉACTIF
  chatInput.addEventListener('input', function() {
    // Annuler le timer précédent
    clearTimeout(typingTimer);
    
    // Démarrer un nouveau timer PLUS RAPIDE
    typingTimer = setTimeout(analyzeChatText, typingDelay);
  });
  
  // Analyser également lors du focus si le texte n'est pas vide
  chatInput.addEventListener('focus', function() {
    const currentText = chatInput.value || '';
    if (currentText.trim().length >= 3) {
      analyzeChatText();
    }
  });
  
  console.log('✅ Analyse en temps réel configurée pour les chats');
};

// Fonction pour analyser les doublons dans le texte des chats
window.analyzeDuplicatesForChat = function(text) {
  const words = text.toLowerCase().split(/\s+/);
  const seen = new Set();
  const duplicates = new Set();
  const errors = [];
  const explanations = [];
  const suggestions = [];
  
  words.forEach((word, index) => {
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    if (cleanWord.length > 3 && seen.has(cleanWord)) {
      if (!duplicates.has(cleanWord)) {
        duplicates.add(cleanWord);
        errors.push({
          text: cleanWord,
          correction: cleanWord + ' (supprimer la répétition)',
          type: 'duplicate'
        });
        explanations.push(`Le mot "${cleanWord}" est répété plusieurs fois dans votre message.`);
        suggestions.push(`Évitez de répéter "${cleanWord}" trop souvent.`);
      }
    } else {
      seen.add(cleanWord);
    }
  });
  
  return {
    errors: errors,
    explanations: explanations,
    suggestions: suggestions
  };
};

// ============ SÉLECTION DE DISCUSSION ============
window.selectDiscussion = function(topic) {
  console.log('🔄 SÉLECTION DE DISCUSSION - DÉBUT');
  console.log('📝 Topic sélectionné:', topic);
  
  window.currentDiscussion = topic;
  const data = window.discussionData[topic];
  console.log('📊 Données de discussion:', data);
  
  // Mettre à jour l'apparence des boutons
  console.log('🎨 MISE À JOUR APPARENCE BOUTONS');
  document.querySelectorAll('.discussion-item').forEach((btn, index) => {
    console.log(`  🔘 Bouton ${index + 1}:`, btn.dataset.topic);
    btn.classList.remove('active');
    btn.style.backgroundColor = '';
    btn.style.color = 'var(--bs-text-muted)';
    const indicator = btn.querySelector('.indicator');
    indicator.style.backgroundColor = '';
    indicator.classList.add('bg-gray-500');
  });
  
  const activeBtn = document.querySelector(`[data-topic="${topic}"]`);
  console.log('✅ Bouton activé:', activeBtn);
  activeBtn.classList.add('active');
  activeBtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
  activeBtn.style.color = 'var(--bs-white)';
  const activeIndicator = activeBtn.querySelector('.indicator');
  activeIndicator.classList.remove('bg-gray-500');
  activeIndicator.style.backgroundColor = 'var(--bs-primary)';
  
  // Mettre à jour le titre dans la colonne 3
  console.log('📝 MISE À JOUR TITRE');
  const titleElement = document.getElementById('chatTitle');
  if (titleElement) {
    titleElement.textContent = data.title;
    console.log('  📝 Titre mis à jour:', data.title);
  }
  
  // Mettre à jour la description
  console.log('📝 MISE À JOUR DESCRIPTION');
  const descriptionEl = document.getElementById('discussionDescription');
  if (descriptionEl) {
    descriptionEl.textContent = data.description || '';
    console.log('  📝 Description mise à jour:', data.description || 'vide');
  }
  
  console.log('✅ SÉLECTION DE DISCUSSION - FIN');
  console.log('📝 Discussion sélectionnée:', topic);
};

// ============ SYSTÈME DE CHAT OPTIMISÉ ============
window.ChatSystemUnified = {
    // Cache des analyses locales
    analysisCache: new Map(),
    
    // Analyse locale améliorée avec cache
    async analyzeWithCache(message) {
        console.log('🔍 ANALYSE LOCALE AVEC CACHE - DÉBUT');
        console.log('📝 Message à analyser:', message);
        
        const cacheKey = message.toLowerCase().trim();
        console.log('🔑 Clé de cache:', cacheKey);
        
        if (this.analysisCache.has(cacheKey)) {
            console.log('✅ Cache analyse locale trouvé');
            const cachedResult = this.analysisCache.get(cacheKey);
            console.log('📋 Résultat du cache:', cachedResult);
            console.log('🔍 ANALYSE LOCALE AVEC CACHE - FIN (CACHE)');
            return cachedResult;
        }
        
        console.log('❌ Cache non trouvé, analyse en cours...');
        console.log('📞 Appel à SpacyAnalyzer...');
        
        const analysis = await window.SpacyAnalyzer?.analyze(message) || { errors: [], confidence: 0 };
        console.log('📊 Résultat analyse SpacyAnalyzer:', analysis);
        
        // Mettre en cache si confiance > 0.7
        if (analysis.confidence > 0.7) {
            console.log('💾 Mise en cache du résultat (confiance > 0.7)');
            this.analysisCache.set(cacheKey, analysis);
            console.log(`📊 Taille du cache: ${this.analysisCache.size} entrées`);
        } else {
            console.log('⏭️ Pas de mise en cache (confiance <= 0.7)');
        }
        
        console.log('🔍 ANALYSE LOCALE AVEC CACHE - FIN (NOUVELLE ANALYSE)');
        return analysis;
    },
    
    // Contexte enrichi avec mémoire
    async buildEnhancedContext(message, localAnalysis) {
        let context = {
            message_type: "chat",
            student_message: message,
            local_analysis: localAnalysis,
            topic_context: await this.fetchMarkdownContext(window.currentDiscussion),
            conversation_history: this.getRecentMessages(),
            student_profile: this.getStudentProfile(),
            timestamp: new Date().toISOString()
        };
        
        return context;
    },
    
    // Historique récent des messages
    getRecentMessages() {
        const messages = document.querySelectorAll('#chatMessages .message');
        const recent = [];
        
        // Prendre les 5 derniers messages
        for (let i = messages.length - 1; i >= Math.max(0, messages.length - 5); i--) {
            const msg = messages[i];
            recent.push({
                sender: msg.dataset.sender || 'unknown',
                text: msg.querySelector('.message-text')?.textContent || '',
                timestamp: msg.dataset.timestamp || new Date().toISOString()
            });
        }
        
        return recent.reverse();
    },
    
    // Profil étudiant adaptatif
    getStudentProfile() {
        if (window.currentUser) {
            return {
                level: window.currentUser.level || 'intermediate',
                progress: window.currentUser.progress || 0,
                weak_points: window.currentUser.weakPoints || [],
                strong_points: window.currentUser.strongPoints || []
            };
        }
        return { level: 'intermediate' };
    },
    
    // Timeout progressif
    async callIAWithProgressiveTimeout(context) {
        const timeouts = [2000, 5000, 10000]; // 2s, 5s, 10s
        let lastError = null;
        
        for (const timeout of timeouts) {
            try {
                console.log(`🚀 Tentative IA avec timeout ${timeout}ms`);
                
                const result = await Promise.race([
                    window.demanderIA(context.student_message, JSON.stringify(context)),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), timeout)
                    )
                ]);
                
                return result;
                
            } catch (error) {
                console.warn(`⚠️ Échec timeout ${timeout}ms:`, error.message);
                lastError = error;
                
                // Afficher indicateur de progression
                this.showProgressIndicator(timeout);
                
                // Attendre avant prochaine tentative
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        throw lastError;
    },
    
    // Indicateur de progression
    showProgressIndicator(timeout) {
        const indicators = {
            2000: '🔄 Analyse en cours...',
            5000: '⏳ IA réfléchit...',
            10000: '🤖 Traitement complexe...'
        };
        
        const existing = document.querySelector('.ai-progress');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.className = 'ai-progress bg-yellow-100 text-yellow-800 p-2 rounded mb-2 text-sm';
        indicator.textContent = indicators[timeout] || '🔄 Traitement...';
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    },
    
    // Réponse fallback améliorée
    generateFallbackResponse(localAnalysis) {
        if (localAnalysis.errors.length > 0) {
            return {
                corrections: localAnalysis.errors.slice(0, 3), // Top 3 erreurs
                explanations: ["Voici les corrections principales à examiner."],
                suggestions: ["Continuez à pratiquer ces points !"],
                confidence: localAnalysis.confidence,
                source: "local_analysis"
            };
        }
        
        return {
            corrections: [],
            explanations: ["Votre message semble correct ! Continuez comme ça."],
            suggestions: ["Essayez de poser des questions plus spécifiques."],
            confidence: 1.0,
            source: "fallback"
        };
    },
    
    // Récupérer le contexte Markdown
    async fetchMarkdownContext(topic) {
        if (!topic) return "Tu es un tuteur expert en français.";
        
        try {
            const response = await fetch(`contexts/${topic}.md`);
            if (response.ok) {
                const context = await response.text();
                return context;
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger le contexte Markdown:', error);
        }
        
        // Contextes de secours
        const fallbackContexts = {
            'grammaire': "Tu es un expert en grammaire française. Aide l'étudiant à comprendre les règles grammaticales.",
            'conjugaison': "Tu es un expert en conjugaison française. Aide l'étudiant à maîtriser les temps verbaux.",
            'orthographe': "Tu es un expert en orthographe française. Aide l'étudiant à éviter les fautes d'orthographe.",
            'vocabulaire': "Tu es un expert en vocabulaire français. Aide l'étudiant à enrichir son vocabulaire.",
            'expression-ecrite': "Tu es un expert en expression écrite. Aide l'étudiant à améliorer sa rédaction.",
            'lecture': "Tu es un expert en lecture et compréhension de texte. Aide l'étudiant à mieux lire et comprendre."
        };
        
        return fallbackContexts[topic] || "Tu es un tuteur expert en français. Aide l'étudiant sans faire le travail à sa place.";
    }
};

// ============ FONCTION PRINCIPALE DE CHAT UNIFIÉE ============
window.sendAIChatMessage = async function() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Ajouter le message de l'étudiant
    addChatMessage(message, 'student');
    input.value = '';
    
    try {
        console.log('🔍 CHAT UNIFIÉ - Début analyse optimisée');
        
        // 1. Analyse locale avec cache
        const localAnalysis = await ChatSystemUnified.analyzeWithCache(message);
        console.log('📊 Analyse locale avec cache:', localAnalysis);
        
        // 2. Contexte enrichi
        const enhancedContext = await ChatSystemUnified.buildEnhancedContext(message, localAnalysis);
        console.log('🎯 Contexte enrichi:', enhancedContext);
        
        // 3. Réponse directe si confiance élevée
        if (localAnalysis.confidence > 0.85) {
            console.log('✅ Confiance élevée - Réponse directe optimisée');
            const response = ChatSystemUnified.generateFallbackResponse(localAnalysis);
            displayChatPedagogicalResponse(response, message);
            return;
        }
        
        // 4. Appel IA avec timeout progressif
        console.log('🤖 Appel IA avec timeout progressif');
        const aiResponse = await ChatSystemUnified.callIAWithProgressiveTimeout(enhancedContext);
        console.log('✅ Réponse IA reçue:', aiResponse);
        
        // 5. Afficher la réponse
        displayChatPedagogicalResponse(aiResponse, message);
        
    } catch (error) {
        console.error('❌ Erreur chat IA unifié:', error);
        
        // Fallback ultime
        const fallback = ChatSystemUnified.generateFallbackResponse(
            await window.SpacyAnalyzer?.analyze(message) || { errors: [], confidence: 0 }
        );
        
        displayChatPedagogicalResponse(fallback, message);
        
        // Nettoyer l'indicateur de progression
        const indicator = document.querySelector('.ai-progress');
        if (indicator) indicator.remove();
    }
};

// ============ UTILITAIRES DE CHAT ============
window.addChatMessageWithTyping = function(message, sender) {
  // Récupérer le topic actuel pour déterminer quel conteneur utiliser
  const currentTopic = window.currentDiscussion || 'techniques';
  const chatMessages = document.getElementById(`chatMessages-${currentTopic}`);
  
  if (!chatMessages) {
    console.error(`Conteneur chatMessages-${currentTopic} non trouvé`);
    return;
  }
  
  // Créer le conteneur de message
  const messageDiv = document.createElement('div');
  messageDiv.className = `message mb-4 text-${sender === 'user' ? 'end' : 'start'}`;
  
  if (sender === 'ai') {
    messageDiv.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-primary);">
          <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <div class="flex-1">
          <div class="rounded-lg p-4" style="background-color: rgba(255,255,255,0.05);">
            <div class="flex justify-between items-start">
              <p class="text-sm flex-1 typing-text" style="color: var(--bs-white);"></p>
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
          <p class="text-xs mt-1" style="color: var(--bs-text-muted);">IA • ${new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Effet de frappe
    const textElement = messageDiv.querySelector('.typing-text');
    if (textElement && message) {
      let currentIndex = 0;
      const typingSpeed = 30; // ms par caractère
      
      function typeNextChar() {
        if (currentIndex < message.length) {
          textElement.textContent += message[currentIndex];
          currentIndex++;
          setTimeout(typeNextChar, typingSpeed);
        } else {
          console.log('✅ Effet de frappe terminé dans le chat');
        }
      }
      
      // Démarrer l'effet de frappe
      setTimeout(typeNextChar, 100);
    }
    
    // Sauvegarder le message dans l'historique
    if (window.addMessageToHistory) {
      window.addMessageToHistory(currentTopic, message, sender);
    }
  } else {
    // Pour les messages utilisateur, affichage normal
    messageDiv.innerHTML = `
      <div class="flex items-start gap-3 justify-end">
        <div class="flex-1 max-w-xs lg:max-w-md">
          <div class="rounded-lg p-4" style="background-color: var(--bs-primary);">
            <p class="text-sm" style="color: white;">${message}</p>
          </div>
          <p class="text-xs mt-1 text-end" style="color: var(--bs-text-muted);">Vous • ${new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Sauvegarder le message dans l'historique
    if (window.addMessageToHistory) {
      window.addMessageToHistory(currentTopic, message, sender);
    }
  }
};

window.addChatMessage = function(message, sender, timestamp = null) {
  // Récupérer le topic actuel pour déterminer quel conteneur utiliser
  const currentTopic = window.currentDiscussion || 'techniques';
  const chatMessages = document.getElementById(`chatMessages-${currentTopic}`);
  
  if (!chatMessages) {
    console.error(`Conteneur chatMessages-${currentTopic} non trouvé`);
    return;
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `flex gap-3 mb-4 ${sender === 'student' ? 'flex-row-reverse' : ''}`;
  messageDiv.dataset.sender = sender;
  messageDiv.dataset.timestamp = timestamp || new Date().toISOString();
  
  if (sender === 'student') {
    // Message de l'étudiant
    messageDiv.innerHTML = `
      <div class="flex-1 text-end">
        <div class="rounded-lg p-4 inline-block" style="background-color: var(--bs-primary); color: white;">
          <p class="text-sm">${message}</p>
        </div>
        <p class="text-xs mt-1" style="color: var(--bs-text-muted);">Vous • ${new Date().toLocaleTimeString()}</p>
      </div>
      <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-secondary);">
        <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
      </div>
    `;
  } else {
    // Message de l'IA
    messageDiv.innerHTML = `
      <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-primary);">
        <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      </div>
      <div class="flex-1">
        <div class="rounded-lg p-4" style="background-color: rgba(255,255,255,0.05);">
          <div class="flex justify-between items-start">
            <p class="text-sm flex-1" style="color: var(--bs-white);">${message}</p>
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
        <p class="text-xs mt-1" style="color: var(--bs-text-muted);">IA • ${new Date().toLocaleTimeString()}</p>
      </div>
    `;
  }
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Sauvegarder le message dans l'historique
  if (window.addMessageToHistory) {
    window.addMessageToHistory(currentTopic, message, sender);
  }
};

window.displayChatPedagogicalResponse = function(response, originalMessage) {
  console.log('🔍 CHAT - displayChatPedagogicalResponse appelé');
  console.log('📝 Type de réponse:', typeof response);
  console.log('📝 Contenu réponse:', response);
  
  if (!response || typeof response !== 'object') {
    // Si c'est une simple chaîne, l'afficher directement
    console.log('📝 Réponse simple chaîne, affichage direct');
    addChatMessage(response, 'ai');
    return;
  }
  
  // Séparer les corrections linguistiques de la réponse principale
  const hasCorrections = response.corrections && response.corrections.length > 0;
  const hasExplanations = response.explanations && response.explanations.length > 0;
  const hasSuggestions = response.suggestions && response.suggestions.length > 0;
  
  // Afficher le nuage de corrections si nécessaire
  if (hasCorrections || hasExplanations || hasSuggestions) {
    createCorrectionCloud(response, originalMessage);
  }
  
  // Afficher uniquement la réponse de l'IA sans métalinguistique
  let messageContent = '';
  
  // Utiliser le champ analysis si disponible (réponse directe de l'IA)
  if (response.analysis) {
    messageContent = response.analysis;
    console.log('📝 Utilisation du champ analysis:', messageContent.substring(0, 100) + '...');
  } else {
    // Sinon, créer une réponse simple sans métalinguistique
    messageContent = "Message reçu. Je vais vous aider avec ça.";
  }
  
  console.log('📝 Message final à afficher:', messageContent.substring(0, 100) + '...');
  
  // Créer le message avec effet de frappe
  addChatMessageWithTyping(messageContent, 'ai');
};

// ============ NUAGE DE CORRECTION DYNAMIQUE ============
window.createCorrectionCloud = function(response, originalMessage) {
  // Supprimer les nuages existants
  const existingClouds = document.querySelectorAll('.correction-cloud');
  existingClouds.forEach(cloud => cloud.remove());
  
  // Créer le nuage de correction
  const cloud = document.createElement('div');
  cloud.className = 'correction-cloud fixed z-50 rounded-lg shadow-2xl border-2 p-4 max-w-sm';
  cloud.style.cssText = `
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 300px;
    max-width: 400px;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    border-color: #6d28d9;
    color: white;
    box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
  `;
  
  // Construire le contenu du nuage
  let cloudContent = '';
  
  // Erreurs détectées avec structure complète
  if (response.corrections && response.corrections.length > 0) {
    cloudContent += `
      <div class="mb-3">
        <h4 class="text-sm font-semibold text-white mb-2">🔍 Erreurs détectées :</h4>
        <div class="space-y-2">
    `;
    response.corrections.forEach((correction, index) => {
      cloudContent += `
        <div class="bg-white/20 backdrop-blur-sm p-3 rounded">
          <div class="mb-2">
            <span class="text-xs font-semibold text-yellow-300">❌ Erreur :</span>
            <span class="text-sm text-white ml-1">
              "<span class="line-through text-yellow-300">${correction.text}</span>"
            </span>
          </div>
          <div class="mb-2">
            <span class="text-xs font-semibold text-green-300">✅ Correction :</span>
            <span class="text-sm text-white ml-1">
              "<span class="text-green-300 font-medium">${correction.correction}</span>"
            </span>
          </div>
          ${correction.explanation ? `
            <div class="mb-2">
              <span class="text-xs font-semibold text-blue-300">💡 Explication :</span>
              <span class="text-sm text-white ml-1">${correction.explanation}</span>
            </div>
          ` : ''}
          ${correction.example ? `
            <div class="mb-2">
              <span class="text-xs font-semibold text-purple-300">📝 Exemple :</span>
              <span class="text-sm text-white ml-1">${correction.example}</span>
            </div>
          ` : ''}
          <div class="flex justify-end mt-2">
            <button 
              onclick="applyCorrection('${correction.text}', '${correction.correction}')"
              class="px-3 py-1 bg-white/30 backdrop-blur-sm text-white text-xs rounded hover:bg-white/40 transition-colors border border-white/50"
              title="Appliquer cette correction"
            >
              Appliquer
            </button>
          </div>
        </div>
      `;
    });
    cloudContent += `</div></div>`;
  }
  
  // Explications linguistiques
  if (response.explanations && response.explanations.length > 0) {
    cloudContent += `
      <div class="mb-3">
        <h4 class="text-sm font-semibold text-white mb-2">💡 Explications :</h4>
        <div class="space-y-1">
    `;
    response.explanations.forEach(exp => {
      cloudContent += `
        <div class="text-sm text-white bg-white/20 backdrop-blur-sm p-2 rounded">
          ${exp}
        </div>
      `;
    });
    cloudContent += `</div></div>`;
  }
  
  // Suggestions de correction avec structure complète
  if (response.suggestions && response.suggestions.length > 0) {
    cloudContent += `
      <div class="mb-3">
        <h4 class="text-sm font-semibold text-white mb-2">🎯 Suggestions d'amélioration :</h4>
        <div class="space-y-2">
    `;
    response.suggestions.forEach((suggestion, index) => {
      // Gérer les suggestions qui peuvent être des objets avec des propriétés ou des chaînes simples
      let suggestionText = suggestion;
      let suggestionExplanation = '';
      let suggestionExample = '';
      
      if (typeof suggestion === 'object' && suggestion !== null) {
        suggestionText = suggestion.text || suggestion.suggestion || 'Suggestion sans texte';
        suggestionExplanation = suggestion.explanation || '';
        suggestionExample = suggestion.example || '';
      }
      
      cloudContent += `
        <div class="bg-white/20 backdrop-blur-sm p-3 rounded">
          <div class="mb-2">
            <span class="text-xs font-semibold text-orange-300">💡 Suggestion :</span>
            <span class="text-sm text-white ml-1">${suggestionText}</span>
          </div>
          ${suggestionExplanation ? `
            <div class="mb-2">
              <span class="text-xs font-semibold text-blue-300">📚 Explication :</span>
              <span class="text-sm text-white ml-1">${suggestionExplanation}</span>
            </div>
          ` : ''}
          ${suggestionExample ? `
            <div class="mb-2">
              <span class="text-xs font-semibold text-purple-300">📝 Exemple :</span>
              <span class="text-sm text-white ml-1">${suggestionExample}</span>
            </div>
          ` : ''}
          <div class="flex justify-end mt-2">
            <button 
              onclick="applySuggestion('${suggestionText}')"
              class="px-3 py-1 bg-white/30 backdrop-blur-sm text-white text-xs rounded hover:bg-white/40 transition-colors border border-white/50"
              title="Appliquer cette suggestion"
            >
              Appliquer
            </button>
          </div>
        </div>
      `;
    });
    cloudContent += `</div></div>`;
  }
  
  // Ajouter les boutons de contrôle
  cloudContent += `
    <div class="flex justify-between items-center mt-4 pt-3 border-t border-white/30">
      <button 
        onclick="speakCorrection(this)"
        class="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors border border-white/50"
        title="Écouter les corrections"
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      </button>
      <button 
        onclick="closeCorrectionCloud(this)"
        class="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors border border-white/50"
        title="Fermer"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `;
  
  cloud.innerHTML = cloudContent;
  document.body.appendChild(cloud);
  
  // Rendre le nuage déplaçable
  makeDraggable(cloud);
  
  console.log('✅ Nuage de correction créé');
};

// ============ FONCTIONS DU NUAGE ============
window.makeDraggable = function(element) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const dragStart = (e) => {
    if (e.target.closest('button')) return;
    
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.target === element || e.target.closest('.correction-cloud')) {
      isDragging = true;
    }
  };

  const dragEnd = (e) => {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  };

  const drag = (e) => {
    if (isDragging) {
      e.preventDefault();
      
      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      element.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  };

  element.addEventListener('touchstart', dragStart, false);
  element.addEventListener('touchend', dragEnd, false);
  element.addEventListener('touchmove', drag, false);
  element.addEventListener('mousedown', dragStart, false);
  element.addEventListener('mouseup', dragEnd, false);
  element.addEventListener('mousemove', drag, false);
};

window.closeCorrectionCloud = function(button) {
  const cloud = button.closest('.correction-cloud');
  if (cloud) {
    cloud.remove();
    console.log('�️ Nuage de correction fermé');
  }
};

window.applyCorrection = function(originalText, correctedText) {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = chatInput.value.replace(originalText, correctedText);
    chatInput.focus();
    console.log('✅ Correction appliquée:', originalText, '→', correctedText);
  }
};

window.applySuggestion = function(suggestion) {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = suggestion;
    chatInput.focus();
    console.log('✅ Suggestion appliquée:', suggestion);
  }
};

window.speakCorrection = function(button) {
  const cloud = button.closest('.correction-cloud');
  if (cloud) {
    const textContent = cloud.textContent.replace(/Appliquer|Fermer|Écouter les corrections/g, '').trim();
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textContent);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
      console.log('🔊 Lecture des corrections en cours');
    } else {
      console.log('❌ Synthèse vocale non supportée');
    }
  }
};

window.showTypingIndicator = function() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'typingIndicator';
  indicator.className = 'message mb-4 text-start';
  indicator.innerHTML = `
    <div class="inline-block p-3 rounded-lg bg-gray-100 text-gray-600">
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
        <span class="ml-2 text-sm">L'IA réfléchit...</span>
      </div>
    </div>
  `;
  
  chatMessages.appendChild(indicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

window.hideTypingIndicator = function() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
};

console.log('✅ Système de chat unifié et optimisé chargé');
console.log('🚀 Fonctionnalités : cache, timeout progressif, contexte enrichi, fallback intelligent');
