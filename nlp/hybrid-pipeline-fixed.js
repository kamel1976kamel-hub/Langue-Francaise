// 🧩 PIPELINE HYBRIDE NLP COMPLET - Architecture Conceptuelle
// Intégration spaCy + Base de règles + IA Groq
// Documentation et implémentation du pipeline complet

console.log('🏗️ Initialisation du pipeline hybride NLP complet');

/**
 * =========================================
 * ARCHITECTURE CONCEPTUELLE DU PIPELINE
 * =========================================
 * 
 *            texte utilisateur
 *                   │
 *                   ▼
 *          ┌───────────────┐
 *          │ Prétraitement │
 *          │    spaCy      │
 *          └───────────────┘
 *                   │
 *                   ▼
 *   ┌───────────────────────────┐
 *   │  Moteur Règles BDD        │
 *   └───────────────────────────┐
 *                   │
 *                   ▼
 *   ┌───────────────────────────┐
 *   │   Analyse IA Groq         │
 *   └───────────────────────────┐
 *                   │
 *                   ▼
 *   ┌───────────────────────────┐
 *   │  Fusion intelligente      │
 *   └───────────────────────────┐
 *                   │
 *                   ▼
 *          ┌───────────────┐
 *          │ Interface     │
 *          └───────────────┘
 */

/**
 * =========================================
 * TABLEAU DES MODULES ET VALEUR AJOUTÉE
 * =========================================
 * 
 * | Module | Rôle | Valeur ajoutée |
 * |--------|------|----------------|
 * | spaCy | Analyse morpho-syntaxique | • Détecte accords sujet-verbe<br>• Filtre grammatical avant IA<br>• Indices précis pour traçabilité |
 * | Moteur Règles BDD | Correction rapide basée sur règles | • 200+ règles<br>• Fautes lexicales simples<br>• Instantanéité (<50ms) |
 * | IA Groq | Analyse contextuelle et stylistique | • Reformulations naturelles<br>• Style et fluidité<br>• Cohérence discursive |
 * | Fusion intelligente | Combinaison des suggestions | • Priorité règles > IA<br>• Filtrage incohérences<br>• Tri par score/confiance |
 * | Interface utilisateur | Visualisation et interaction | • Surlignage corrections<br>• Suggestions interactives<br>• Statistiques temps réel |
 */

class HybridNLPPipeline {
    constructor() {
        this.modules = {
            spacy: null,
            rulesEngine: null,
            groqAI: null,
            fusion: null,
            interface: null
        };
        
        this.pipelineStats = {
            totalProcessed: 0,
            averageTime: 0,
            moduleStats: {
                spacy: { calls: 0, avgTime: 0 },
                rules: { calls: 0, avgTime: 0 },
                groq: { calls: 0, avgTime: 0 },
                fusion: { calls: 0, avgTime: 0 }
            }
        };
        
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Méthodes manquantes pour la compatibilité
    analyzeComplexity(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
        
        return {
            sentencesCount: sentences.length,
            averageLength: Math.round(avgSentenceLength),
            complexity: avgSentenceLength > 50 ? 'high' : avgSentenceLength > 25 ? 'medium' : 'low'
        };
    }

    findOverlappingSuggestions(suggestions) {
        const sorted = [...suggestions].sort((a, b) => a.start - b.start);
        const conflicts = [];
        let currentGroup = [];
        
        for (let i = 0; i < sorted.length; i++) {
            const suggestion = sorted[i];
            
            if (currentGroup.length === 0) {
                currentGroup.push(suggestion);
            } else {
                const lastInGroup = currentGroup[currentGroup.length - 1];
                
                if (suggestion.start <= lastInGroup.end) {
                    currentGroup.push(suggestion);
                } else {
                    conflicts.push(currentGroup);
                    currentGroup = [suggestion];
                }
            }
        }
        
        if (currentGroup.length > 0) {
            conflicts.push(currentGroup);
        }
        
        return conflicts;
    }

    async initialize() {
        console.log('🚀 Initialisation du pipeline hybride complet...');
        
        try {
            // 1. Initialisation du module spaCy (simulation)
            await this.initializeSpacy();
            
            // 2. Initialisation du moteur de règles BDD
            await this.initializeRulesEngine();
            
            // 3. Initialisation du module IA Groq
            await this.initializeGroqAI();
            
            // 4. Initialisation du module de fusion
            await this.initializeFusion();
            
            // 5. Initialisation de l'interface utilisateur
            await this.initializeInterface();
            
            console.log('✅ Pipeline hybride complet initialisé');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du pipeline:', error);
            return false;
        }
    }

    // ========================================
    // MODULE 1: PRÉTRAITEMENT SPACY (SIMULATION)
    // ========================================
    async initializeSpacy() {
        this.modules.spacy = {
            name: 'spaCy (simulé)',
            description: 'Analyse morpho-syntaxique du texte',
            capabilities: ['tokenisation', 'POS tagging', 'analyse morphologique', 'dépendances'],
            
            process: function(text) {
                const startTime = Date.now();
                
                // Analyse spaCy simulée
                const analysis = {
                    tokens: this.tokenize(text),
                    pos: this.analyzePOS(text),
                    morphology: this.analyzeMorphology(text),
                    dependencies: this.analyzeDependencies(text),
                    entities: this.extractEntities(text)
                };
                
                // Corrections basées sur l'analyse spaCy
                const corrections = this.detectGrammaticalErrors(text, analysis);
                
                const processingTime = Date.now() - startTime;
                
                return {
                    analysis: analysis,
                    corrections: corrections,
                    processingTime: processingTime,
                    metadata: {
                        module: 'spaCy',
                        tokensCount: analysis.tokens.length,
                        language: 'fr'
                    }
                };
            },
            
            tokenize: function(text) {
                return text.split(/\s+/).filter(t => t.length > 0);
            },
            
            analyzePOS: function(text) {
                const tokens = text.split(/\s+/);
                return tokens.map((token, index) => ({
                    text: token,
                    pos: this.guessPOS(token),
                    index: index
                }));
            },
            
            guessPOS: function(token) {
                if (token.match(/^[.!?]+$/)) return 'PUNCT';
                if (token.match(/^(le|la|les|un|une|des)$/)) return 'DET';
                if (token.match(/^(je|tu|il|elle|nous|vous|ils|elles)$/)) return 'PRON';
                if (token.match(/^(et|ou|mais|donc|or|ni|car)$/)) return 'CCONJ';
                if (token.match(/^(est|sont|ai|as|a|avons|avez|ont)$/)) return 'VERB';
                if (token.match(/^\d+$/)) return 'NUM';
                return 'NOUN';
            },
            
            analyzeMorphology: function(text) {
                return {
                    number: text.includes('(s|ont|ent)') ? 'Plur' : 'Sing',
                    gender: text.match(/(e|te|elle|la|une)/) ? 'Fem' : 'Masc',
                    tense: 'Pres'
                };
            },
            
            analyzeDependencies: function(text) {
                return {
                    subject: this.findSubject(text),
                    verb: this.findVerb(text),
                    object: this.findObject(text)
                };
            },
            
            findSubject: function(text) {
                const match = text.match(/\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les|un|une|des)\b/i);
                return match ? match[0] : null;
            },
            
            findVerb: function(text) {
                const match = text.match(/\b(est|sont|ai|as|a|avons|avez|ont|vais|vas|vont|mange|manges|aient|parle|parles|parlent)\b/i);
                return match ? match[0] : null;
            },
            
            findObject: function(text) {
                const words = text.split(/\s+/);
                for (let i = words.length - 1; i >= 0; i--) {
                    if (words[i].length > 3 && !words[i].match(/^(et|ou|mais|donc|le|la|les|un|une|des)$/i)) {
                        return words[i];
                    }
                }
                return null;
            },
            
            extractEntities: function(text) {
                const entities = [];
                const properNouns = text.match(/\b[A-Z][a-z]+\b/g) || [];
                properNouns.forEach(entity => {
                    entities.push({ text: entity, type: 'PERSON', start: text.indexOf(entity), end: text.indexOf(entity) + entity.length });
                });
                return entities;
            },
            
            detectGrammaticalErrors: function(text, analysis) {
                const errors = [];
                
                // Détection simple d'erreurs grammaticales
                if (text.includes(' il vas ')) {
                    errors.push({
                        start: text.indexOf(' il vas '),
                        end: text.indexOf(' il vas ') + 7,
                        original: 'il vas',
                        corrected: 'il va',
                        rule_id: 'spaCy_001',
                        category: 'conjugaison',
                        explanation: 'Accord sujet-verbe incorrect',
                        source: 'spaCy',
                        priority: 90
                    });
                }
                
                return errors;
            }
        };
        
        console.log('✅ Module spaCy initialisé');
    }

    // ========================================
    // MODULE 2: MOTEUR RÈGLES BDD
    // ========================================
    async initializeRulesEngine() {
        this.modules.rulesEngine = {
            name: 'Moteur Règles BDD',
            description: 'Application des règles linguistiques depuis la base de données',
            capabilities: ['regex matching', 'corrections lexicales', 'grammaire', 'style'],
            
            process: async function(text, spacyAnalysis) {
                const startTime = Date.now();
                let correctedText = text;
                const corrections = [];
                
                // Utiliser les règles de la base de données si disponibles
                if (window.hybridAnalyzer && window.hybridAnalyzer.dbRules) {
                    const rules = window.hybridAnalyzer.dbRules;
                    
                    for (const rule of rules) {
                        if (rule.pattern_type === 'regex') {
                            try {
                                const regex = new RegExp(rule.pattern, 'gi');
                                const matches = [...text.matchAll(regex)];
                                
                                matches.forEach(match => {
                                    const correction = {
                                        start: match.index,
                                        end: match.index + match[0].length,
                                        original: match[0],
                                        corrected: rule.correction,
                                        rule_id: rule.rule_id,
                                        category: rule.category,
                                        explanation: rule.explanation,
                                        source: 'BDD',
                                        priority: rule.priority || 70
                                    };
                                    
                                    corrections.push(correction);
                                });
                            } catch (error) {
                                console.warn(`Erreur règle ${rule.rule_id}:`, error);
                            }
                        }
                    }
                }
                
                const processingTime = Date.now() - startTime;
                
                return {
                    corrections: corrections,
                    correctedText: this.applyCorrections(text, corrections),
                    processingTime: processingTime,
                    metadata: {
                        module: 'RulesEngine',
                        rulesApplied: corrections.length,
                        rulesAvailable: window.hybridAnalyzer ? window.hybridAnalyzer.dbRules.length : 0
                    }
                };
            },
            
            applyCorrections: function(text, corrections) {
                let corrected = text;
                
                // Appliquer les corrections dans l'ordre inverse pour ne pas perturber les indices
                corrections
                    .sort((a, b) => b.start - a.start)
                    .forEach(correction => {
                        corrected = corrected.substring(0, correction.start) + 
                                   correction.corrected + 
                                   corrected.substring(correction.end);
                    });
                
                return corrected;
            }
        };
        
        console.log('✅ Moteur de règles BDD initialisé');
    }

    // ========================================
    // MODULE 3: ANALYSE IA GROQ
    // ========================================
    async initializeGroqAI() {
        this.modules.groqAI = {
            name: 'IA Groq',
            description: 'Analyse contextuelle et stylistique avec modèle de langage',
            capabilities: ['style', 'fluidité', 'cohérence', 'reformulations'],
            
            process: async function(text, spacyAnalysis, rulesCorrections) {
                const startTime = Date.now();
                
                try {
                    // Préparer le contexte pour l'IA
                    const context = this.prepareContext(text, spacyAnalysis, rulesCorrections);
                    
                    // Appeler l'API Groq
                    const suggestions = await window.groqAIAnalysis(text);
                    
                    const processingTime = Date.now() - startTime;
                    
                    return {
                        suggestions: suggestions || [],
                        processingTime: processingTime,
                        metadata: {
                            module: 'GroqAI',
                            status: 'success',
                            suggestionsCount: suggestions ? suggestions.length : 0,
                            context: context
                        }
                    };
                } catch (error) {
                    console.error('❌ Erreur module IA Groq:', error);
                    
                    const processingTime = Date.now() - startTime;
                    
                    return {
                        suggestions: [],
                        processingTime: processingTime,
                        metadata: {
                            module: 'GroqAI',
                            status: 'error',
                            error: error.message
                        }
                    };
                }
            },
            
            prepareContext: function(text, spacyAnalysis, rulesCorrections) {
                return {
                    textLength: text.length,
                    tokensCount: spacyAnalysis ? spacyAnalysis.analysis.tokens.length : 0,
                    hasRulesCorrections: rulesCorrections && rulesCorrections.length > 0,
                    complexity: this.analyzeComplexity(text),
                    style: this.analyzeStyle(text)
                };
            },
            
            analyzeComplexity: function(text) {
                const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
                const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
                
                return {
                    sentencesCount: sentences.length,
                    averageLength: Math.round(avgSentenceLength),
                    complexity: avgSentenceLength > 50 ? 'high' : avgSentenceLength > 25 ? 'medium' : 'low'
                };
            },
            
            analyzeStyle: function(text) {
                const indicators = {
                    formal: /\b(cependant|néanmoins|par conséquent|en effet|ainsi)\b/i.test(text),
                    informal: /\b(bah|du coup|genre|style|kiffer|zarb)\b/i.test(text),
                    passive: /\b(est|sont|été|fut)\s+\w+é(s)?\s+par\b/i.test(text),
                    repetitive: this.detectRepetition(text)
                };
                
                return {
                    level: indicators.formal ? 'formal' : indicators.informal ? 'informal' : 'neutral',
                    characteristics: Object.keys(indicators).filter(key => indicators[key])
                };
            },
            
            detectRepetition: function(text) {
                const words = text.toLowerCase().split(/\s+/);
                const wordCount = {};
                
                words.forEach(word => {
                    if (word.length > 3) {
                        wordCount[word] = (wordCount[word] || 0) + 1;
                    }
                });
                
                const repetitions = Object.entries(wordCount).filter(([word, count]) => count > 2);
                return repetitions.length > 0;
            }
        };
        
        console.log('✅ Module IA Groq initialisé');
    }

    // ========================================
    // MODULE 4: FUSION INTELLIGENTE
    // ========================================
    async initializeFusion() {
        this.modules.fusion = {
            name: 'Fusion intelligente',
            description: 'Combinaison et priorisation des suggestions',
            capabilities: ['déduplication', 'résolution conflits', 'priorisation', 'filtrage'],
            
            process: async function(ruleSuggestions, aiSuggestions, spacyAnalysis) {
                const startTime = Date.now();
                
                // Toujours s'assurer que les entrées sont des tableaux valides
                const rules = Array.isArray(ruleSuggestions) ? ruleSuggestions : [];
                const ai = Array.isArray(aiSuggestions) ? aiSuggestions : [];
                
                console.log(`📊 Fusion: ${rules.length} règles + ${ai.length} suggestions IA`);
                
                // Combiner toutes les suggestions
                const allSuggestions = [...rules, ...ai];
                
                // Détecter les chevauchements
                const conflicts = this.findOverlappingSuggestions(allSuggestions);
                
                // Résoudre les conflits
                const resolved = this.resolveConflicts(conflicts, rules, ai);
                
                // Filtrer et valider
                const filtered = this.filterSuggestions(resolved);
                
                // Trier par priorité
                const sorted = filtered.sort((a, b) => (b.priority || 70) - (a.priority || 70));
                
                const processingTime = Date.now() - startTime;
                
                return {
                    finalSuggestions: sorted,
                    processingTime: processingTime,
                    metadata: {
                        module: 'Fusion',
                        totalInput: allSuggestions.length,
                        finalCount: sorted.length,
                        rulesCount: rules.length,
                        aiCount: ai.length,
                        conflictsResolved: conflicts.length
                    }
                };
            },
            
            findOverlappingSuggestions: function(suggestions) {
                const sorted = [...suggestions].sort((a, b) => a.start - a.start);
                const conflicts = [];
                let currentGroup = [];
                
                for (let i = 0; i < sorted.length; i++) {
                    const suggestion = sorted[i];
                    
                    if (currentGroup.length === 0) {
                        currentGroup.push(suggestion);
                    } else {
                        const lastInGroup = currentGroup[currentGroup.length - 1];
                        
                        if (suggestion.start <= lastInGroup.end) {
                            currentGroup.push(suggestion);
                        } else {
                            conflicts.push(currentGroup);
                            currentGroup = [suggestion];
                        }
                    }
                }
                
                if (currentGroup.length > 0) {
                    conflicts.push(currentGroup);
                }
                
                return conflicts;
            },
            
            resolveConflicts: function(conflicts, ruleSuggestions, aiSuggestions) {
                const resolved = [];
                
                conflicts.forEach(conflict => {
                    if (conflict.length === 1) {
                        // Pas de conflit
                        resolved.push(conflict[0]);
                    } else {
                        // Conflit à résoudre
                        const ruleSuggestions = conflict.filter(s => s.source === 'BDD');
                        const aiSuggestions = conflict.filter(s => s.source === 'GroqAI');
                        
                        if (ruleSuggestions.length > 0) {
                            // Prioriser les règles BDD
                            resolved.push(ruleSuggestions.reduce((best, current) => 
                                (current.priority || 0) > (best.priority || 0) ? current : best
                            ));
                        } else if (aiSuggestions.length > 0) {
                            // Sinon, prendre la meilleure suggestion IA
                            resolved.push(aiSuggestions.reduce((best, current) => 
                                (current.priority || 0) > (best.priority || 0) ? current : best
                            ));
                        }
                    }
                });
                
                return resolved;
            },
            
            filterSuggestions: function(suggestions, spacyAnalysis) {
                return suggestions.filter(suggestion => {
                    // Filtrer basé sur l'analyse spaCy si disponible
                    if (spacyAnalysis) {
                        return this.validateWithSpacy(suggestion, spacyAnalysis);
                    }
                    
                    return true;
                });
            },
            
            validateWithSpacy: function(suggestion, spacyAnalysis) {
                const text = suggestion.corrected;
                
                // Vérifications simples
                if (text.match(/\s{2,}/)) return false;
                if (text.match(/\s+[.,!?]/)) return false;
                if (text.match(/[A-Z][a-z]+[A-Z]/)) return false;
                
                return true;
            }
        };
        
        console.log('✅ Module de fusion intelligente initialisé');
    }

    // ========================================
    // MODULE 5: INTERFACE UTILISATEUR
    // ========================================
    async initializeInterface() {
        this.modules.interface = {
            name: 'Interface utilisateur',
            description: 'Visualisation et interaction avec les corrections',
            capabilities: ['affichage', 'surlignage', 'interactions', 'statistiques'],
            
            displayResults: function(originalText, suggestions, metadata) {
                const result = {
                    original: originalText,
                    corrected: this.applySuggestions(originalText, suggestions || []),
                    suggestions: suggestions || [],
                    stats: this.calculateStats(suggestions || [], metadata),
                    visualization: this.createVisualization(originalText, suggestions || [])
                };
                
                return result;
            },
            
            applySuggestions: function(text, suggestions) {
                let correctedText = text;
                
                suggestions
                    .sort((a, b) => b.start - a.start)
                    .forEach(suggestion => {
                        const before = correctedText.substring(0, suggestion.start);
                        const after = correctedText.substring(suggestion.end);
                        correctedText = before + suggestion.corrected + after;
                    });
                
                return correctedText;
            },
            
            calculateStats: function(suggestions, metadata) {
                const stats = {
                    totalSuggestions: suggestions.length,
                    byCategory: {},
                    bySource: {},
                    byPriority: { high: 0, medium: 0, low: 0 },
                    processingTime: 0
                };
                
                suggestions.forEach(suggestion => {
                    if (!stats.byCategory[suggestion.category]) {
                        stats.byCategory[suggestion.category] = 0;
                    }
                    stats.byCategory[suggestion.category]++;
                    
                    if (!stats.bySource[suggestion.source]) {
                        stats.bySource[suggestion.source] = 0;
                    }
                    stats.bySource[suggestion.source]++;
                    
                    const priority = suggestion.priority || 70;
                    if (priority >= 85) stats.byPriority.high++;
                    else if (priority >= 70) stats.byPriority.medium++;
                    else stats.byPriority.low++;
                });
                
                if (metadata) {
                    stats.processingTime = 
                        (metadata.spacy?.processingTime || 0) +
                        (metadata.rules?.processingTime || 0) +
                        (metadata.groq?.processingTime || 0) +
                        (metadata.fusion?.processingTime || 0);
                }
                
                return stats;
            },
            
            createVisualization: function(text, suggestions) {
                const highlights = [];
                
                suggestions.forEach(suggestion => {
                    highlights.push({
                        start: suggestion.start || 0,
                        end: suggestion.end || (suggestion.start || 0) + (suggestion.original?.length || 0),
                        type: suggestion.category || 'unknown',
                        source: suggestion.source || 'unknown',
                        tooltip: `${suggestion.explanation || 'Correction'} (${suggestion.source || 'Unknown'})`,
                        className: `highlight-${suggestion.category || 'unknown'} highlight-${suggestion.source || 'unknown'}`
                    });
                });
                
                return {
                    text: text,
                    highlights: highlights,
                    html: this.generateHighlightedHTML(text, highlights)
                };
            },
            
            generateHighlightedHTML: function(text, highlights) {
                let html = text;
                
                highlights.sort((a, b) => b.start - a.start);
                
                highlights.forEach(highlight => {
                    const before = html.substring(0, highlight.start);
                    const highlighted = html.substring(highlight.start, highlight.end);
                    const after = html.substring(highlight.end);
                    
                    const highlightedHTML = `<span class="${highlight.className}" title="${highlight.tooltip}">${highlighted}</span>`;
                    html = before + highlightedHTML + after;
                });
                
                return html;
            }
        };
        
        console.log('✅ Module interface utilisateur initialisé');
    }

    // ========================================
    // MÉTHODE PRINCIPALE DE TRAITEMENT
    // ========================================
    async processText(text) {
        const cacheKey = text.toLowerCase().trim();
        
        // Vérifier le cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📋 Utilisation du cache du pipeline');
                return cached.result;
            }
        }
        
        const startTime = Date.now();
        console.log("🔄 Début du traitement du pipeline hybride...");
        
        try {
            // ÉTAPE 1: Prétraitement spaCy
            console.log("📝 Étape 1: Analyse spaCy...");
            const spacyResult = await this.modules.spacy.process(text);
            console.log("✅ Étape 1: spaCy terminée");
            
            // ÉTAPE 2: Moteur de règles BDD
            console.log("⚙️ Étape 2: Moteur de règles BDD...");
            const rulesResult = await this.modules.rulesEngine.process(text, spacyResult);
            console.log("✅ Étape 2: BDD terminée");
            
            // ÉTAPE 3: Analyse IA Groq
            console.log("🧠 Étape 3: Analyse IA Groq...");
            const groqResult = await this.modules.groqAI.process(text, spacyResult, rulesResult);
            console.log("✅ Étape 3: IA terminée");
            
            // ÉTAPE 4: Fusion intelligente
            console.log("🔀 Étape 4: Fusion intelligente...");
            const fusionResult = await this.modules.fusion.process(
                rulesResult.corrections, 
                groqResult.suggestions, 
                spacyResult
            );
            console.log("✅ Étape 4: Fusion terminée");
            
            // ÉTAPE 5: Interface utilisateur
            console.log("🖥️ Étape 5: Interface utilisateur...");
            const interfaceResult = this.modules.interface.displayResults(
                text, 
                fusionResult.finalSuggestions,
                {
                    spacy: spacyResult,
                    rules: rulesResult,
                    groq: groqResult,
                    fusion: fusionResult
                }
            );
            console.log("✅ Étape 5: Interface terminée");
            
            const totalTime = Date.now() - startTime;
            
            const finalResult = {
                original: text,
                corrected: interfaceResult.corrected,
                suggestions: fusionResult.finalSuggestions,
                stats: interfaceResult.stats,
                visualization: interfaceResult.visualization,
                processingTime: totalTime,
                pipeline: {
                    spacy: spacyResult,
                    rules: rulesResult,
                    groq: groqResult,
                    fusion: fusionResult,
                    interface: interfaceResult
                }
            };
            
            // Mettre en cache
            this.cache.set(cacheKey, {
                result: finalResult,
                timestamp: Date.now()
            });
            
            // Mettre à jour les statistiques
            this.updateStats(totalTime);
            
            console.log(`✅ Pipeline terminé en ${totalTime}ms avec ${finalResult.suggestions.length} suggestions`);
            
            return finalResult;
            
        } catch (error) {
            console.error('❌ Erreur dans le pipeline:', error);
            
            // Retourner un résultat par défaut en cas d'erreur
            return {
                original: text,
                corrected: text,
                suggestions: [],
                stats: { totalSuggestions: 0, byCategory: {}, bySource: {}, processingTime: 0 },
                processingTime: Date.now() - startTime,
                error: error.message
            };
        }
    }
    
    updateStats(processingTime) {
        this.pipelineStats.totalProcessed++;
        this.pipelineStats.averageTime = 
            (this.pipelineStats.averageTime * (this.pipelineStats.totalProcessed - 1) + processingTime) / 
            this.pipelineStats.totalProcessed;
    }
    
    getPipelineStats() {
        return {
            ...this.pipelineStats,
            cacheSize: this.cache.size,
            modules: [
                { name: 'spaCy', description: 'Analyse morpho-syntaxique' },
                { name: 'Règles BDD', description: 'Correction basée sur règles' },
                { name: 'IA Groq', description: 'Analyse contextuelle' },
                { name: 'Fusion', description: 'Combinaison intelligente' },
                { name: 'Interface', description: 'Visualisation' }
            ]
        };
    }
}

// Exposition globale
window.HybridNLPPipeline = HybridNLPPipeline;

// Fonction globale pour le traitement
window.processWithHybridPipeline = async function(text) {
    if (!window.hybridPipeline) {
        window.hybridPipeline = new HybridNLPPipeline();
        await window.hybridPipeline.initialize();
    }
    
    return await window.hybridPipeline.processText(text);
};

// Fonction globale pour les statistiques
window.getHybridPipelineStats = function() {
    return window.hybridPipeline ? window.hybridPipeline.getPipelineStats() : null;
};

console.log('🏗️ Architecture du pipeline hybride NLP chargée');
