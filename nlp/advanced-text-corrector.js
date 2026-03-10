// === PIPELINE AVANCÉ DE CORRECTION DE TEXTE ===
// Fusion des règles linguistiques et de l'analyse IA Groq

console.log('🚀 Initialisation du pipeline avancé de correction');

// État global du pipeline
const pipelineState = {
    rulesLoaded: false,
    aiReady: false,
    cache: new Map(),
    stats: {
        totalAnalyses: 0,
        ruleMatches: 0,
        aiSuggestions: 0,
        averageTime: 0
    }
};

// Fusion des suggestions avec priorisation
window.mergeSuggestions = function(ruleResults, aiResults) {
    // Gérer les cas où ruleResults ou aiResults ne sont pas des tableaux
    const ruleArray = Array.isArray(ruleResults) ? ruleResults : (ruleResults && ruleResults.corrections ? ruleResults.corrections : []);
    const aiArray = Array.isArray(aiResults) ? aiResults : [];
    const allSuggestions = [...ruleArray, ...aiArray];
    
    // Déduplication basée sur la position
    const uniqueSuggestions = [];
    const seenPositions = new Set();
    
    allSuggestions.forEach(suggestion => {
        const positionKey = `${suggestion.start}-${suggestion.end}`;
        
        if (!seenPositions.has(positionKey)) {
            seenPositions.add(positionKey);
            uniqueSuggestions.push(suggestion);
        } else {
            // Si même position, garder celle avec la priorité la plus élevée
            const existingIndex = uniqueSuggestions.findIndex(s => 
                `${s.start}-${s.end}` === positionKey
            );
            if (existingIndex >= 0) {
                if (suggestion.priority > uniqueSuggestions[existingIndex].priority) {
                    uniqueSuggestions[existingIndex] = suggestion;
                }
            }
        }
    });
    
    // Trier par priorité décroissante puis par position
    return uniqueSuggestions.sort((a, b) => {
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }
        return a.start - b.start;
    });
};

// Application des corrections sur le texte
window.applyCorrections = function(text, corrections) {
    let correctedText = text;
    const appliedCorrections = [];
    
    // Trier par position pour éviter les décalages
    const sortedCorrections = corrections
        .filter(c => c.suggestion && c.suggestion.trim())
        .sort((a, b) => b.start - a.start); // Ordre inverse pour préserver les indices
    
    sortedCorrections.forEach(correction => {
        const before = correctedText.substring(0, correction.start);
        const after = correctedText.substring(correction.end);
        
        const originalText = correctedText.substring(correction.start, correction.end);
        correctedText = before + correction.suggestion + after;
        
        appliedCorrections.push({
            ...correction,
            original_text: originalText,
            applied: true
        });
    });
    
    return {
        corrected_text: correctedText,
        applied_corrections: appliedCorrections.reverse() // Remettre dans l'ordre original
    };
};

// Analyse de confiance globale
window.calculateConfidence = function(corrections, textLength) {
    if (corrections.length === 0) return 95;
    
    const density = corrections.length / Math.max(textLength, 1) * 100;
    const avgPriority = corrections.reduce((sum, c) => sum + c.priority, 0) / corrections.length;
    
    // Plus il y a de corrections et plus la priorité est élevée, moins la confiance est haute
    let confidence = 95 - (density * 2) - ((100 - avgPriority) * 0.5);
    
    return Math.max(0, Math.min(100, Math.round(confidence)));
};

// Pipeline principal d'analyse
window.advancedTextAnalysis = async function(text, options = {}) {
    const startTime = Date.now();
    pipelineState.totalAnalyses++;
    
    const defaultOptions = {
        enableAI: true,
        enableRules: true,
        maxCorrections: 20,
        categories: ['style', 'vocabulaire', 'orthographe', 'conjugaison']
    };
    
    const opts = { ...defaultOptions, ...options };
    
    try {
        // Validation des entrées
        if (!text || typeof text !== 'string') {
            throw new Error('Texte invalide');
        }
        
        if (text.length < 3) {
            return {
                original_text: text,
                corrected_text: text,
                corrections: [],
                confidence: 100,
                analysis_time: 0,
                stats: { rule_matches: 0, ai_suggestions: 0 }
            };
        }
        
        // Vérifier le cache
        const cacheKey = `${text.substring(0, 50)}_${JSON.stringify(opts)}`;
        if (pipelineState.cache.has(cacheKey)) {
            const cached = pipelineState.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) { // Cache 1 minute
                console.log('📋 Utilisation du cache d\'analyse');
                return cached.result;
            }
        }
        
        let ruleResults = [];
        let aiResults = [];
        
        // 1. Analyse par règles linguistiques
        if (opts.enableRules && pipelineState.rulesLoaded) {
            try {
                const rules = window.loadAllRules();
                ruleResults = window.applyRules(text, rules);
                pipelineState.stats.ruleMatches += ruleResults.length;
                console.log(`📝 Règles linguistiques: ${ruleResults.length} corrections`);
            } catch (error) {
                console.warn('⚠️ Erreur lors de l\'analyse par règles:', error.message);
            }
        }
        
        // 2. Analyse IA (parallèle si possible)
        if (opts.enableAI && pipelineState.aiReady && text.length >= 10) {
            try {
                aiResults = await window.groqAIAnalysisCached(text);
                pipelineState.stats.aiSuggestions += aiResults.length;
                console.log(`🤖 Analyse IA: ${aiResults.length} suggestions`);
            } catch (error) {
                console.warn('⚠️ Erreur lors de l\'analyse IA:', error.message);
            }
        }
        
        // 3. Fusion et priorisation
        const allCorrections = window.mergeSuggestions(ruleResults, aiResults);
        
        // 4. Limiter le nombre de corrections
        const limitedCorrections = allCorrections.slice(0, opts.maxCorrections);
        
        // 5. Application des corrections
        const correctionResult = window.applyCorrections(text, limitedCorrections);
        
        // 6. Calcul de la confiance
        const confidence = window.calculateConfidence(limitedCorrections, text.length);
        
        // 7. Résultat final
        const result = {
            original_text: text,
            corrected_text: correctionResult.corrected_text,
            corrections: limitedCorrections,
            applied_corrections: correctionResult.applied_corrections,
            confidence: confidence,
            analysis_time: Date.now() - startTime,
            stats: {
                rule_matches: ruleResults.length,
                ai_suggestions: aiResults.length,
                total_suggestions: allCorrections.length,
                limited_corrections: limitedCorrections.length
            },
            metadata: {
                text_length: text.length,
                correction_density: (limitedCorrections.length / text.length * 100).toFixed(2) + '%',
                categories: [...new Set(limitedCorrections.map(c => c.category))]
            }
        };
        
        // Mettre en cache
        pipelineState.cache.set(cacheKey, {
            result: result,
            timestamp: Date.now()
        });
        
        // Nettoyer le cache si trop grand
        if (pipelineState.cache.size > 100) {
            const oldestKey = pipelineState.cache.keys().next().value;
            pipelineState.cache.delete(oldestKey);
        }
        
        // Mettre à jour les statistiques
        const analysisTime = Date.now() - startTime;
        pipelineState.stats.averageTime = 
            (pipelineState.stats.averageTime * (pipelineState.totalAnalyses - 1) + analysisTime) / 
            pipelineState.totalAnalyses;
        
        console.log(`✅ Analyse terminée en ${analysisTime}ms, confiance: ${confidence}%`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse avancée:', error);
        return {
            original_text: text,
            corrected_text: text,
            corrections: [],
            confidence: 0,
            analysis_time: Date.now() - startTime,
            error: error.message,
            stats: { rule_matches: 0, ai_suggestions: 0 }
        };
    }
};

// Initialisation du pipeline
window.initializeAdvancedPipeline = async function() {
    console.log('🔧 Initialisation du pipeline avancé...');
    
    try {
        // 1. Charger les règles
        if (typeof window.loadAllRules === 'function') {
            const rules = window.loadAllRules();
            const totalRules = Object.values(rules).reduce((sum, cat) => sum + cat.length, 0);
            console.log(`📚 ${totalRules} règles linguistiques chargées`);
            pipelineState.rulesLoaded = true;
        }
        
        // 2. Tester l'IA
        if (typeof window.groqAIAnalysis === 'function') {
            // Test avec un texte simple
            const testResult = await window.groqAIAnalysis('Test rapide');
            pipelineState.aiReady = true;
            console.log('🤖 Module IA Groq prêt');
        }
        
        // 3. État final
        console.log('✅ Pipeline avancé initialisé:', {
            rules: pipelineState.rulesLoaded,
            ai: pipelineState.aiReady,
            cache_size: pipelineState.cache.size
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        return false;
    }
};

// Obtenir les statistiques du pipeline
window.getPipelineStats = function() {
    return {
        ...pipelineState.stats,
        cache_size: pipelineState.cache.size,
        rules_loaded: pipelineState.rulesLoaded,
        ai_ready: pipelineState.aiReady
    };
};

// Vider le cache
window.clearPipelineCache = function() {
    pipelineState.cache.clear();
    console.log('🗑️ Cache du pipeline vidé');
};

console.log('✅ Pipeline avancé de correction initialisé');
