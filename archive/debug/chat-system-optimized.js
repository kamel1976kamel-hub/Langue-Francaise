// AMÉLIORATIONS CHAT IA
// ===================

window.ChatSystemOptimized = {
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
    }
};

// Remplacer la fonction existante
window.sendAIChatMessage = async function() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Ajouter le message de l'étudiant
    addChatMessage(message, 'student');
    input.value = '';
    
    try {
        console.log('🔍 CHAT OPTIMISÉ - Début analyse');
        
        // 1. Analyse locale avec cache
        const localAnalysis = await ChatSystemOptimized.analyzeWithCache(message);
        console.log('📊 Analyse locale:', localAnalysis);
        
        // 2. Contexte enrichi
        const enhancedContext = await ChatSystemOptimized.buildEnhancedContext(message, localAnalysis);
        console.log('🎯 Contexte enrichi:', enhancedContext);
        
        // 3. Réponse directe si confiance élevée
        if (localAnalysis.confidence > 0.85) {
            console.log('✅ Confiance élevée - Réponse directe');
            const response = ChatSystemOptimized.generateFallbackResponse(localAnalysis);
            displayChatPedagogicalResponse(response, message);
            return;
        }
        
        // 4. Appel IA avec timeout progressif
        console.log('🤖 Appel IA avec timeout progressif');
        const aiResponse = await ChatSystemOptimized.callIAWithProgressiveTimeout(enhancedContext);
        console.log('✅ Réponse IA reçue:', aiResponse);
        
        // 5. Afficher la réponse
        displayChatPedagogicalResponse(aiResponse, message);
        
    } catch (error) {
        console.error('❌ Erreur chat IA:', error);
        
        // Fallback ultime
        const fallback = ChatSystemOptimized.generateFallbackResponse(
            await window.SpacyAnalyzer?.analyze(message) || { errors: [], confidence: 0 }
        );
        
        displayChatPedagogicalResponse(fallback, message);
        
        // Nettoyer l'indicateur de progression
        const indicator = document.querySelector('.ai-progress');
        if (indicator) indicator.remove();
    }
};

console.log('✅ Chat IA optimisé chargé');
