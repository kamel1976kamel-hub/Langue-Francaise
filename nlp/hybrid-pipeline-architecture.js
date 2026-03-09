// 🧩 PIPELINE HYBRIDE NLP COMPLET - Architecture Conceptuelle
// Intégration spaCy + Base de règles + IA Groq
// Documentation et implémentation du pipeline complet

console.log('🏗️ Initialisation du pipeline hybride NLP complet');

/**
 * ========================================
 * ARCHITECTURE CONCEPTUELLE DU PIPELINE
 * ========================================
 * 
 *            texte utilisateur
 *                   │
 *                   ▼
 *          ┌───────────────┐
 *          │ Prétraitement │
 *          │    spaCy      │
 *          │ (tokenisation,│
 *          │  POS, morpho, │
 *          │  dépendances) │
 *          └───────────────┘
 *                   │
 *                   ▼
 *   ┌───────────────────────────┐
 *   │                           │
 *   │  Moteur Règles BDD         │
 *   │ (200+ règles fixes,        │
 *   │  expressions régulières)  │
 *   │                           │
 *   │  Détection rapide          │
 *   │  de fautes lexicales       │
 *   │  et erreurs simples        │
 *   └───────────────────────────┐
 *                   │
 *                   ▼
 *   ┌───────────────────────────┐
 *   │                           │
 *   │   Analyse IA Groq         │
 *   │ (Llama3-70B, style,       │
 *   │  fluidité, cohérence)      │
 *   │                           │
 *   │  Propose reformulations   │
 *   │  contextuelles et         │
 *   │  corrections stylistiques  │
 *   └───────────────────────────┐
 *                   │
 *                   ▼
 *   ┌───────────────────────────┐
 *   │                           │
 *   │  Fusion intelligente      │
 *   │ - Priorité règles > IA     │
 *   │ - Filtrage incohérences    │
 *   │ - Tri par score/conf.      │
 *   │                           │
 *   └───────────────────────────┐
 *                   │
 *                   ▼
 *          ┌───────────────┐
 *          │ Interface     │
 *          │ utilisateur   │
 *          │ (affichage    │
 *          │  corrections, │
 *          │  suggestions, │
 *          │  surlignage)  │
 *          └───────────────┘
 */

/**
 * ========================================
 * TABLEAU DES MODULES ET VALEUR AJOUTÉE
 * ========================================
 * 
 * Module                  Rôle                           Valeur ajoutée
 * ──────────────────────────────────────────────────────────────────────
 * spaCy                   Analyse morpho-syntaxique     • Détecte les accords sujet-verbe, genres, nombres, subordonnées
 *                                                         • Sert de "filtre grammatical" avant l'IA
 *                                                         • Fournit indices précis pour traçabilité
 * 
 * Moteur Règles BDD       Correction rapide basée sur règles • Couverture de 200+ règles
 *                                                         • Détection de fautes simples et répétitives
 *                                                         • Instantanéité (<50ms)
 * 
 * IA Groq                 Analyse contextuelle et stylistique • Reformulations naturelles
 *                                                         • Style et fluidité
 *                                                         • Cohérence discursive et logique
 * 
 * Fusion intelligente     Combinaison des suggestions     • Priorité aux règles fixes
 *                                                         • Pondération IA pour style
 *                                                         • Tri et suppression des doublons
 *                                                         • Gestion des conflits
 * 
 * Interface utilisateur   Visualisation et interaction   • Affichage corrections avec surlignage
 *                                                         • Suggestions interactives
 *                                                         • Statistiques temps réel
 */

/**
 * ========================================
 * POINTS FORTS DU PIPELINE COMBINÉ
 * ========================================
 * 
 * ⚡ Précision maximale : spaCy sécurise la syntaxe, les règles BDD sécurisent les fautes lexicales, 
 *    IA Groq améliore le style et la cohérence.
 * 
 * 📈 Scalabilité : pipeline modulaire, facile d'ajouter des règles ou d'autres modèles IA.
 * 
 * ⚡ Performance optimisée : règles BDD rapides + cache IA pour limiter les appels API.
 * 
 * 🔍 Transparence et traçabilité : chaque correction peut être justifiée par son module d'origine.
 */

// ========================================
// IMPLÉMENTATION DU PIPELINE COMPLET
// ========================================

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

    async initialize() {
        console.log('🚀 Initialisation du pipeline hybride complet...');
        
        try {
            // 1. Initialisation du module spaCy (simulation)
            await this.initializeSpacy();
            
            // 2. Initialisation du moteur de règles BDD
            await this.initializeRulesEngine();
            
            // 3. Initialisation de l'IA Groq
            await this.initializeGroqAI();
            
            // 4. Initialisation du module de fusion
            await this.initializeFusion();
            
            // 5. Initialisation de l'interface
            await this.initializeInterface();
            
            console.log('✅ Pipeline hybride complet initialisé');
            return true;
        } catch (error) {
            console.error('❌ Erreur d\'initialisation du pipeline:', error);
            return false;
        }
    }

    // ========================================
    // MODULE 1: PRÉTRAITEMENT SPACY
    // ========================================
    async initializeSpacy() {
        this.modules.spacy = {
            name: 'spaCy',
            description: 'Analyse morpho-syntaxique',
            capabilities: ['tokenisation', 'POS', 'morphologie', 'dépendances'],
            
            async process(text) {
                const startTime = Date.now();
                
                // Simulation de l'analyse spaCy (remplacer par vrai spaCy si disponible)
                const analysis = {
                    tokens: this.tokenize(text),
                    pos: this.analyzePOS(text),
                    morphology: this.analyzeMorphology(text),
                    dependencies: this.analyzeDependencies(text),
                    entities: this.extractEntities(text)
                };
                
                const processingTime = Date.now() - startTime;
                
                return {
                    analysis: analysis,
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
                // Analyse simplifiée des parties du discours
                const tokens = text.split(/\s+/);
                return tokens.map((token, index) => ({
                    text: token,
                    pos: this.guessPOS(token),
                    index: index
                }));
            },
            guessPOS: function(token) {
                // Deviner la partie du discours (simplifié)
                if (token.match(/^[.!?]+$/)) return 'PUNCT';
                if (token.match(/^(le|la|les|un|une|des)$/)) return 'DET';
                if (token.match(/^(je|tu|il|elle|nous|vous|ils|elles)$/)) return 'PRON';
                if (token.match(/^(et|ou|mais|donc|or|ni|car)$/)) return 'CCONJ';
                if (token.match(/^(est|sont|ai|as|a|avons|avez|ont)$/)) return 'VERB';
                if (token.match(/^\d+$/)) return 'NUM';
                return 'NOUN'; // Par défaut
            },
            analyzeMorphology: function(text) {
                // Analyse morphologique simplifiée
                return {
                    number: text.includes('(s|ont|ent)') ? 'Plur' : 'Sing',
                    gender: text.match(/(e|te|elle|la|une)/) ? 'Fem' : 'Masc',
                    tense: 'Pres' // Simplification
                };
            },
            analyzeDependencies: function(text) {
                // Analyse des dépendances simplifiée
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
                // Simplification - trouver le dernier nom
                const words = text.split(/\s+/);
                for (let i = words.length - 1; i >= 0; i--) {
                    if (words[i].length > 3 && !words[i].match(/^(et|ou|mais|donc|le|la|les|un|une|des)$/i)) {
                        return words[i];
                    }
                }
                return null;
            },
            extractEntities: function(text) {
                // Extraction d'entités simplifiée
                const entities = [];
                
                // Noms propres (majuscules)
                const properNouns = text.match(/\b[A-Z][a-z]+\b/g) || [];
                properNouns.forEach(entity => {
                    entities.push({ text: entity, type: 'PERSON', start: text.indexOf(entity), end: text.indexOf(entity) + entity.length });
                });
                
                return entities;
            }
        };
        
        console.log('✅ Module spaCy initialisé');
    }

    // ========================================
    // MODULE 2: MOTEUR DE RÈGLES BDD
    // ========================================
    async initializeRulesEngine() {
        this.modules.rulesEngine = {
            name: 'Moteur de règles BDD',
            description: 'Correction rapide basée sur 200+ règles fixes',
            capabilities: ['expressions régulières', 'fautes lexicales', 'erreurs grammaticales'],
            
            async process(text, spacyAnalysis = null) {
                const startTime = Date.now();
                const corrections = [];
                
                // Charger les règles depuis la base de données
                const rules = await this.loadRulesFromDB();
                
                // Appliquer chaque règle
                for (const rule of rules) {
                    try {
                        const ruleCorrections = await this.applyRule(rule, text, spacyAnalysis);
                        corrections.push(...ruleCorrections);
                    } catch (error) {
                        console.warn(`⚠️ Erreur règle ${rule.rule_id}:`, error);
                    }
                }
                
                const processingTime = Date.now() - startTime;
                
                return {
                    corrections: corrections,
                    correctedText: this.applyCorrections(text, corrections),
                    processingTime: processingTime,
                    metadata: {
                        module: 'RulesEngine',
                        rulesApplied: rules.length,
                        correctionsFound: corrections.length
                    }
                };
            },
            
            async loadRulesFromDB() {
                // Charger depuis la base de données existante
                if (window.hybridAnalyzer && window.hybridAnalyzer.dbRules) {
                    return window.hybridAnalyzer.dbRules;
                }
                
                // Fallback vers règles par défaut
                return this.getDefaultRules();
            },
            
            getDefaultRules() {
                return [
                    {
                        rule_id: 'accord_sujet_verbe_ils',
                        category: 'conjugaison',
                        pattern: /\bils\s+(\w+[^s])\b/g,
                        correction: (match) => `ils ${match[1]}s`,
                        explanation: 'Accord sujet-verbe: "ils" + verbe au pluriel',
                        priority: 90
                    },
                    {
                        rule_id: 'confusion_a_à',
                        category: 'vocabulaire',
                        pattern: /\ba\s+(aller|partir|venir|arriver|manger|boire|dormir)/g,
                        correction: 'à',
                        explanation: 'Devant un infinitif, on utilise "à" et non "a"',
                        priority: 85
                    }
                ];
            },
            
            async applyRule(rule, text, spacyAnalysis) {
                const corrections = [];
                
                if (rule.pattern_type === 'regex') {
                    const regex = new RegExp(rule.pattern, 'g');
                    const matches = [...text.matchAll(regex)];
                    
                    for (const match of matches) {
                        let correction = rule.correction;
                        
                        if (typeof correction === 'function') {
                            correction = correction(match);
                        } else if (typeof correction === 'string' && match.length > 1) {
                            correction = correction.replace(/\$(\d+)/g, (_, num) => match[parseInt(num)] || '');
                        }
                        
                        if (correction && correction !== match[0]) {
                            corrections.push({
                                rule_id: rule.rule_id,
                                category: rule.category,
                                original: match[0],
                                corrected: correction,
                                explanation: rule.explanation,
                                priority: rule.priority,
                                start: match.index,
                                end: match.index + match[0].length,
                                source: 'RulesEngine'
                            });
                        }
                    }
                }
                
                return corrections;
            },
            
            applyCorrections: (text, corrections) => {
                let correctedText = text;
                
                // Appliquer les corrections dans l'ordre inverse pour ne pas perturber les positions
                corrections
                    .sort((a, b) => b.start - a.start)
                    .forEach(correction => {
                        const before = correctedText.substring(0, correction.start);
                        const after = correctedText.substring(correction.end);
                        correctedText = before + correction.corrected + after;
                    });
                
                return correctedText;
            }
        };
        
        console.log('✅ Moteur de règles BDD initialisé');
    }

    // ========================================
    // MODULE 3: IA GROQ
    // ========================================
    async initializeGroqAI() {
        this.modules.groqAI = {
            name: 'IA Groq',
            description: 'Analyse contextuelle et stylistique avec Llama3-70B',
            capabilities: ['style', 'fluidité', 'cohérence', 'reformulations'],
            
            async process(text, spacyAnalysis = null, rulesCorrections = null) {
                const startTime = Date.now();
                
                try {
                    // Vérifier la disponibilité de l'IA
                    if (!window.groqAIAnalysis) {
                        return {
                            suggestions: [],
                            processingTime: Date.now() - startTime,
                            metadata: {
                                module: 'GroqAI',
                                status: 'unavailable',
                                reason: 'Module IA non disponible'
                            }
                        };
                    }
                    
                    // Préparer le contexte pour l'IA
                    const context = this.prepareContext(text, spacyAnalysis, rulesCorrections);
                    
                    // Appeler l'IA Groq
                    const suggestions = await window.groqAIAnalysisCached(text);
                    
                    const processingTime = Date.now() - startTime;
                    
                    return {
                        suggestions: suggestions.map(s => ({
                            ...s,
                            source: 'GroqAI',
                            context: context
                        })),
                        processingTime: processingTime,
                        metadata: {
                            module: 'GroqAI',
                            suggestionsCount: suggestions.length,
                            context: context
                        }
                    };
                    
                } catch (error) {
                    console.warn('⚠️ Erreur traitement IA Groq:', error);
                    return {
                        suggestions: [],
                        processingTime: Date.now() - startTime,
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
                    if (word.length > 3) { // Ignorer les mots courts
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
            capabilities: ['priorisation', 'filtrage', 'déduplication', 'gestion conflits'],
            
            async process(rulesCorrections, groqSuggestions, spacyAnalysis = null) {
                const startTime = Date.now();
                
                // 1. Collecter toutes les suggestions
                const allSuggestions = [
                    ...(rulesCorrections || []).map(c => ({ ...c, sourceType: 'rule' })),
                    ...(groqSuggestions || []).map(s => ({ ...s, sourceType: 'ai' }))
                ];
                
                // 2. Déduplication
                const deduplicated = this.deduplicate(allSuggestions);
                
                // 3. Résolution des conflits
                const resolved = this.resolveConflicts(deduplicated);
                
                // 4. Priorisation
                const prioritized = this.prioritize(resolved);
                
                // 5. Filtrage
                const filtered = this.filter(prioritized, spacyAnalysis);
                
                const processingTime = Date.now() - startTime;
                
                return {
                    finalSuggestions: filtered,
                    processingTime: processingTime,
                    metadata: {
                        module: 'Fusion',
                        totalInput: allSuggestions.length,
                        afterDeduplication: deduplicated.length,
                        afterConflictResolution: resolved.length,
                        afterPrioritization: prioritized.length,
                        finalCount: filtered.length
                    }
                };
            },
            
            deduplicate: (suggestions) => {
                const seen = new Set();
                const deduplicated = [];
                
                suggestions.forEach(suggestion => {
                    const key = `${suggestion.start}-${suggestion.end}-${suggestion.corrected}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        deduplicated.push(suggestion);
                    }
                });
                
                return deduplicated;
            },
            
            resolveConflicts: (suggestions) => {
                // Regrouper les suggestions qui se chevauchent
                const conflicts = this.findOverlappingSuggestions(suggestions);
                const resolved = [];
                
                conflicts.forEach(group => {
                    if (group.length === 1) {
                        resolved.push(group[0]);
                    } else {
                        // Résoudre le conflit : prioriser les règles sur l'IA
                        const ruleSuggestions = group.filter(s => s.sourceType === 'rule');
                        const aiSuggestions = group.filter(s => s.sourceType === 'ai');
                        
                        if (ruleSuggestions.length > 0) {
                            // Prendre la suggestion de règle avec la plus haute priorité
                            resolved.push(ruleSuggestions.reduce((best, current) => 
                                (current.priority || 0) > (best.priority || 0) ? current : best
                            ));
                        } else {
                            // Prendre la suggestion IA avec la plus haute confiance
                            resolved.push(aiSuggestions.reduce((best, current) => 
                                (current.priority || 0) > (best.priority || 0) ? current : best
                            ));
                        }
                    }
                });
                
                return resolved;
            },
            
            findOverlappingSuggestions: function(suggestions) {
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
                            // Chevauchement - ajouter au groupe
                            currentGroup.push(suggestion);
                        } else {
                            // Pas de chevauchement - finaliser le groupe
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
            
            prioritize: (suggestions) => {
                // Trier par priorité décroissante
                return [...suggestions].sort((a, b) => {
                    // Priorité aux règles sur l'IA à priorité égale
                    if (a.sourceType === 'rule' && b.sourceType === 'ai') return -1;
                    if (a.sourceType === 'ai' && b.sourceType === 'rule') return 1;
                    
                    // Sinon, trier par priorité
                    return (b.priority || 0) - (a.priority || 0);
                });
            },
            
            filter: (suggestions, spacyAnalysis) => {
                // Filtrer basé sur la qualité et la pertinence
                return suggestions.filter(suggestion => {
                    // Filtrer les suggestions trop courtes
                    if (suggestion.corrected.length < 2) return false;
                    
                    // Filtrer les suggestions identiques à l'original
                    if (suggestion.corrected === suggestion.original) return false;
                    
                    // Filtrer basé sur l'analyse spaCy si disponible
                    if (spacyAnalysis) {
                        return this.validateWithSpacy(suggestion, spacyAnalysis);
                    }
                    
                    return true;
                });
            },
            
            validateWithSpacy: function(suggestion, spacyAnalysis) {
                // Validation basique avec l'analyse spaCy
                // Vérifier que la suggestion ne crée pas d'erreurs grammaticales évidentes
                const text = suggestion.corrected;
                
                // Vérifications simples
                if (text.match(/\s{2,}/)) return false; // Double espaces
                if (text.match(/\s+[.,!?]/)) return false; // Espace avant ponctuation
                if (text.match(/[A-Z][a-z]+[A-Z]/)) return false; // Casse étrange
                
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
                    corrected: this.applySuggestions(originalText, suggestions),
                    suggestions: suggestions || [],
                    stats: this.calculateStats(suggestions || [], metadata),
                    visualization: this.createVisualization(originalText, suggestions || [])
                };
                
                return result;
            },
            
            applySuggestions: (text, suggestions) => {
                let correctedText = text;
                
                // Appliquer les suggestions dans l'ordre inverse
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
                    // Par catégorie
                    if (!stats.byCategory[suggestion.category]) {
                        stats.byCategory[suggestion.category] = 0;
                    }
                    stats.byCategory[suggestion.category]++;
                    
                    // Par source
                    if (!stats.bySource[suggestion.source]) {
                        stats.bySource[suggestion.source] = 0;
                    }
                    stats.bySource[suggestion.source]++;
                    
                    // Par priorité
                    const priority = suggestion.priority || 70;
                    if (priority >= 85) stats.byPriority.high++;
                    else if (priority >= 70) stats.byPriority.medium++;
                    else stats.byPriority.low++;
                });
                
                // Temps de traitement total
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
                
                // Trier les highlights par position décroissante
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
    // MÉTHODE PRINCIPALE DU PIPELINE
    // ========================================
    async processText(text) {
        const cacheKey = text.substring(0, 100);
        
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
            console.log("🔄 Début du traitement du pipeline hybride...");
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
            
            // Nettoyer le cache si nécessaire
            if (this.cache.size > 50) {
                const oldestKey = this.cache.keys().next().value;
                this.cache.delete(oldestKey);
            }
            
            // Mettre à jour les statistiques
            this.updatePipelineStats(finalResult);
            
            console.log(`✅ Pipeline terminé en ${totalTime}ms - ${finalResult.suggestions.length} suggestions`);
            
            return finalResult;
            
        } catch (error) {
            console.error('❌ Erreur dans le pipeline:', error);
            return {
                original: text,
                corrected: text,
                suggestions: [],
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }
    
    updatePipelineStats(result) {
        this.pipelineStats.totalProcessed++;
        
        // Mettre à jour les stats de chaque module
        if (result.pipeline.spacy) {
            this.pipelineStats.moduleStats.spacy.calls++;
            this.pipelineStats.moduleStats.spacy.avgTime = 
                (this.pipelineStats.moduleStats.spacy.avgTime + result.pipeline.spacy.processingTime) / 2;
        }
        
        if (result.pipeline.rules) {
            this.pipelineStats.moduleStats.rules.calls++;
            this.pipelineStats.moduleStats.rules.avgTime = 
                (this.pipelineStats.moduleStats.rules.avgTime + result.pipeline.rules.processingTime) / 2;
        }
        
        if (result.pipeline.groq) {
            this.pipelineStats.moduleStats.groq.calls++;
            this.pipelineStats.moduleStats.groq.avgTime = 
                (this.pipelineStats.moduleStats.groq.avgTime + result.pipeline.groq.processingTime) / 2;
        }
        
        if (result.pipeline.fusion) {
            this.pipelineStats.moduleStats.fusion.calls++;
            this.pipelineStats.moduleStats.fusion.avgTime = 
                (this.pipelineStats.moduleStats.fusion.avgTime + result.pipeline.fusion.processingTime) / 2;
        }
        
        // Mettre à jour le temps moyen global
        this.pipelineStats.averageTime = 
            (this.pipelineStats.averageTime + result.processingTime) / 2;
    }
    
    getPipelineStats() {
        return {
            ...this.pipelineStats,
            cacheSize: this.cache.size,
            modules: Object.keys(this.modules).map(key => ({
                name: this.modules[key].name,
                description: this.modules[key].description,
                capabilities: this.modules[key].capabilities
            }))
        };
    }
}

// ========================================
// EXPORT ET INITIALISATION GLOBALE
// ========================================

// Exporter la classe
window.HybridNLPPipeline = HybridNLPPipeline;

// Initialisation automatique
(async function() {
    console.log('🏗️ Initialisation du pipeline hybride NLP complet...');
    
    if (typeof window !== 'undefined') {
        window.hybridPipeline = new HybridNLPPipeline();
        await window.hybridPipeline.initialize();
        
        // Exposer les fonctions globales
        window.processWithHybridPipeline = async function(text) {
            return await window.hybridPipeline.processText(text);
        };
        
        window.getHybridPipelineStats = function() {
            return window.hybridPipeline.getPipelineStats();
        };
        
        console.log('✅ Pipeline hybride NLP complet prêt');
    }
})();

console.log('🏗️ Architecture du pipeline hybride NLP chargée');
