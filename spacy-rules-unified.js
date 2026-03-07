/**
 * =================================================================
 * SPACY RULES UNIFIED - Version consolidée
 * =================================================================
 * 
 * Ce fichier unifie toutes les règles SPA Cy en un seul module
 * Fusionne les fonctionnalités de :
 * - spacy-rules-conjugaison-fixed.js
 * - spacy-custom-rules.js
 * - spacy-specific-rules.js
 * - spacy-operational-rules.js
 * - Et tous les autres fichiers spaCy...
 */

// Configuration unifiée
const SPACY_CONFIG = {
    enabled: true,
    debugMode: false,
    fallbackOnError: true,
    cacheRules: true
};

// Base de règles consolidée
const SPACY_RULES = {
    // Règles de conjugaison
    conjugaison: {
        present: {
            'être': ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
            'avoir': ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
            'faire': ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'],
            'aller': ['vais', 'vas', 'va', 'allons', 'allez', 'vont'],
            'pouvoir': ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'],
            'vouloir': ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent']
        },
        passé: {
            'être': ['étais', 'étais', 'était', 'étions', 'étiez', 'étaient'],
            'avoir': ['avais', 'avais', 'avait', 'avions', 'aviez', 'avaient'],
            'faire': ['faisais', 'faisais', 'faisait', 'faisions', 'faisiez', 'faisaient'],
            'aller': ['allais', 'allais', 'allait', 'allions', 'alliez', 'allaient']
        },
        futur: {
            'être': ['serai', 'seras', 'sera', 'serons', 'serez', 'seront'],
            'avoir': ['aurai', 'auras', 'aura', 'aurons', 'aurez', 'auront'],
            'faire': ['ferai', 'feras', 'fera', 'ferons', 'ferez', 'feront'],
            'aller': ['irai', 'iras', 'ira', 'irons', 'irez', 'iront']
        }
    },
    
    // Règles d'orthographe
    orthographe: {
        accents: {
            'a': ['à', 'â'],
            'e': ['é', 'ê', 'è'],
            'i': ['î', 'ï'],
            'o': ['ô', 'ö'],
            'u': ['û', 'ü']
        },
        doubles: {
            'l': ['ll', 'l'],
            't': ['tt', 't'],
            'r': ['rr', 'r'],
            'n': ['nn', 'n']
        },
        muet: {
            'h': ['h', ''],
            'p': ['p', ''],
            't': ['t', '']
        }
    },
    
    // Règles grammaticales
    grammaire: {
        accord: {
            sujet: {
                'je': 's',
                'tu': 's',
                'il/elle': '',
                'nous': 'ons',
                'vous': 'ez',
                'ils/elles': 'ent'
            }
        },
        genre: {
            masculin: ['le', 'un', 'beau', 'nouveau'],
            feminin: ['la', 'une', 'belle', 'nouvelle']
        }
    }
};

// Cache des règles
let rulesCache = new Map();

/**
 * Classe principale unifiée pour les règles SPA Cy
 */
window.SpacyRulesUnified = {
    config: SPACY_CONFIG,
    rules: SPACY_RULES,
    
    /**
     * Analyse unifiée du texte
     */
    analyze(text) {
        if (!SPACY_CONFIG.enabled) {
            return { errors: [], suggestions: [], confidence: 1.0 };
        }
        
        if (SPACY_CONFIG.cacheRules && rulesCache.has(text)) {
            return rulesCache.get(text);
        }
        
        console.log('🔍 Analyse SPA Cy unifiée:', text);
        
        const analysis = {
            original: text,
            errors: [],
            suggestions: [],
            confidence: 0.0
        };
        
        // 1. Vérification conjugaison
        this.checkConjugaison(text, analysis);
        
        // 2. Vérification orthographe
        this.checkOrthographe(text, analysis);
        
        // 3. Vérification grammaire
        this.checkGrammaire(text, analysis);
        
        // 4. Calculer la confiance
        analysis.confidence = this.calculateConfidence(analysis);
        
        // 5. Mettre en cache
        if (SPACY_CONFIG.cacheRules) {
            rulesCache.set(text, analysis);
        }
        
        if (SPACY_CONFIG.debugMode) {
            console.log('📊 Résultat analyse:', analysis);
        }
        
        return analysis;
    },
    
    /**
     * Vérification des conjugaisons
     */
    checkConjugaison(text, analysis) {
        const words = text.toLowerCase().split(/\s+/);
        
        words.forEach((word, index) => {
            // Vérifier les verbes courants
            Object.entries(SPACY_RULES.conjugaison.present).forEach(([verb, conjugaisons]) => {
                if (word.startsWith(verb)) {
                    const suffix = word.substring(verb.length);
                    if (!conjugaisons.includes(suffix)) {
                        analysis.errors.push({
                            type: 'conjugaison',
                            word: word,
                            position: index,
                            expected: conjugaisons,
                            message: `Conjugaison incorrecte pour "${verb}"`
                        });
                    }
                }
            });
        });
    },
    
    /**
     * Vérification orthographique
     */
    checkOrthographe(text, analysis) {
        const words = text.split(/\s+/);
        
        words.forEach((word, index) => {
            // Vérifier les accents manquants
            Object.entries(SPACY_RULES.orthographe.accents).forEach(([base, accents]) => {
                accents.forEach(accent => {
                    if (word.includes(base) && !word.includes(accent)) {
                        analysis.suggestions.push({
                            type: 'accent',
                            word: word,
                            position: index,
                            suggestion: word.replace(base, accent),
                            message: `Accent manquant: "${base}" → "${accent}"`
                        });
                    }
                });
            });
            
            // Vérifier les doubles lettres
            Object.entries(SPACY_RULES.orthographe.doubles).forEach(([letter, pattern]) => {
                if (word.includes(pattern[0]) && !word.includes(pattern[1])) {
                    analysis.errors.push({
                        type: 'double_lettre',
                        word: word,
                        position: index,
                        message: `Double "${letter}" manquant`
                    });
                }
            });
        });
    },
    
    /**
     * Vérification grammaticale
     */
    checkGrammaire(text, analysis) {
        // Vérification des accords sujet-verbe
        const sentences = text.split(/[.!?]+/);
        
        sentences.forEach((sentence, sIndex) => {
            const words = sentence.trim().split(/\s+/);
            if (words.length < 2) return;
            
            // Chercher le sujet et le verbe
            let sujet = null;
            let verbe = null;
            
            words.forEach((word, wIndex) => {
                const lowerWord = word.toLowerCase();
                
                // Sujets courants
                if (['je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles'].includes(lowerWord)) {
                    sujet = { word: lowerWord, position: wIndex };
                }
                
                // Verbes courants (terminaisons caractéristiques)
                if (lowerWord.match(/(?:er|ir|re|é|és|ée|ées|ant|ents)$/)) {
                    verbe = { word: lowerWord, position: wIndex };
                }
            });
            
            // Vérifier l'accord
            if (sujet && verbe && sujet.position < verbe.position) {
                const accordAttendu = SPACY_RULES.grammaire.accord.sujet[sujet.word];
                if (accordAttendu) {
                    const verbeSuffix = verbe.word.slice(-accordAttendu.length);
                    if (verbeSuffix !== accordAttendu) {
                        analysis.errors.push({
                            type: 'accord_sujet_verbe',
                            sujet: sujet.word,
                            verbe: verbe.word,
                            position: sIndex,
                            expected: accordAttendu,
                            message: `Mauvais accord sujet-verbe: "${sujet.word}" → "${verbe.word}"`
                        });
                    }
                }
            }
        });
    },
    
    /**
     * Calcul de la confiance de l'analyse
     */
    calculateConfidence(analysis) {
        const totalErrors = analysis.errors.length;
        const totalSuggestions = analysis.suggestions.length;
        const textLength = analysis.original.split(/\s+/).length;
        
        // Confiance basée sur le ratio d'erreurs
        const errorRatio = totalErrors / textLength;
        const suggestionRatio = totalSuggestions / textLength;
        
        // Plus il y a d'erreurs, moins la confiance est élevée
        const confidence = Math.max(0, 1 - (errorRatio * 2 + suggestionRatio));
        
        return Math.round(confidence * 100) / 100;
    },
    
    /**
     * Correction automatique d'un texte
     */
    correct(text) {
        const analysis = this.analyze(text);
        let correctedText = text;
        
        // Appliquer les suggestions automatiquement
        analysis.suggestions.forEach(suggestion => {
            if (suggestion.type === 'accent') {
                correctedText = correctedText.replace(suggestion.word, suggestion.suggestion);
            }
        });
        
        return {
            original: text,
            corrected: correctedText,
            analysis: analysis,
            changes: analysis.suggestions.length
        };
    },
    
    /**
     * Nettoyage du cache
     */
    clearCache() {
        rulesCache.clear();
        console.log('🗑️ Cache SPA Cy vidé');
    },
    
    /**
     * Statistiques du cache
     */
    getCacheStats() {
        return {
            size: rulesCache.size,
            memory: JSON.stringify([...rulesCache.entries()]).length
        };
    }
};

// Export pour compatibilité
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.SpacyRulesUnified;
}

console.log('✅ SPA Cy Rules Unified chargé');
