// SYSTÈME DE CHAT UNIFIÉ ET OPTIMISÉ
// =====================================

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
  
  // Mettre à jour la description
  const descriptionEl = document.getElementById('discussionDescription');
  if (descriptionEl) {
    descriptionEl.textContent = data.description || '';
  }
  
  console.log('📝 Discussion sélectionnée:', topic);
};

// ============ SYSTÈME DE CHAT OPTIMISÉ ============
window.ChatSystemUnified = {
    // Cache des analyses locales
    analysisCache: new Map(),
    
    // Analyse locale améliorée avec cache
    async analyzeWithCache(message) {
        const cacheKey = message.toLowerCase().trim();
        
        if (this.analysisCache.has(cacheKey)) {
            console.log('📋 Cache analyse locale trouvé');
            return this.analysisCache.get(cacheKey);
        }
        
        const analysis = await window.SpacyAnalyzer?.analyze(message) || { errors: [], confidence: 0 };
        
        // Mettre en cache si confiance > 0.7
        if (analysis.confidence > 0.7) {
            this.analysisCache.set(cacheKey, analysis);
        }
        
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
window.addChatMessage = function(message, sender, timestamp = null) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message mb-4 ${sender === 'student' ? 'text-end' : 'text-start'}`;
  messageDiv.dataset.sender = sender;
  messageDiv.dataset.timestamp = timestamp || new Date().toISOString();
  
  const messageContent = document.createElement('div');
  messageContent.className = `message-text inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${
    sender === 'student' 
      ? 'bg-blue-500 text-white' 
      : 'bg-gray-100 text-gray-800'
  }`;
  messageContent.textContent = message;
  
  messageDiv.appendChild(messageContent);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

window.displayChatPedagogicalResponse = function(response, originalMessage) {
  if (!response || typeof response !== 'object') {
    // Si c'est une simple chaîne, l'afficher directement
    addChatMessage(response, 'ai');
    return;
  }
  
  // Construire un message pédagogique structuré
  let messageContent = '';
  
  if (response.corrections && response.corrections.length > 0) {
    messageContent += '🔍 **Corrections suggérées :**\n';
    response.corrections.forEach((correction, index) => {
      messageContent += `${index + 1}. "${correction.text}" → "${correction.correction}"\n`;
    });
    messageContent += '\n';
  }
  
  if (response.explanations && response.explanations.length > 0) {
    messageContent += '💡 **Explications :**\n';
    response.explanations.forEach(exp => {
      messageContent += `• ${exp}\n`;
    });
    messageContent += '\n';
  }
  
  if (response.suggestions && response.suggestions.length > 0) {
    messageContent += '🎯 **Suggestions :**\n';
    response.suggestions.forEach(suggestion => {
      messageContent += `• ${suggestion}\n`;
    });
  }
  
  if (!messageContent) {
    messageContent = response.analysis || "Message reçu. Je vais vous aider avec ça.";
  }
  
  addChatMessage(messageContent, 'ai');
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
