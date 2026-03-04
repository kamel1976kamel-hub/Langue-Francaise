// === RÈGLES PERSONNALISÉES SPACY – LE VOCABULAIRE ET SES PIÈGES ===
// Basé sur l'ouvrage "Le vocabulaire et ses pièges" (Archipoche)
// Version enrichie : chaque règle contient une explication détaillée, un exemple concret
// et une proposition de correction explicite.

console.log('📚 Initialisation des règles personnalisées spaCy – Le vocabulaire et ses pièges');

// ---------------------------------------------------------------------
// FONCTIONS UTILITAIRES
// ---------------------------------------------------------------------

function getLemma(word) {
    return word.lemma || word.text;
}

function isVowel(c) {
    return 'aeiouyàâäéèêëïîôöùûü'.includes(c.toLowerCase());
}

// ---------------------------------------------------------------------
// RÈGLES DE VOCABULAIRE
// ---------------------------------------------------------------------

const vocabulaireRules = [
    // ===== CHAPITRE 1 : CONFUSIONS FRÉQUENTES =====
    {
        name: 'confusion_sens_signification',
        description: 'Détecte les confusions entre mots de sens proches',
        example: '❌ "J\'ai appris la leçon" → ✅ "J\'ai compris la leçon"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const confusions = [
                { 
                    pattern: /\bapprendre la leçon\b/g, 
                    correction: 'comprendre la leçon', 
                    explanation: '"Apprendre" s\'utilise pour acquérir des connaissances, "comprendre" pour saisir le sens. Pour une leçon, on dit "comprendre la leçon".'
                },
                { 
                    pattern: /\bmonter en haut\b/g, 
                    correction: 'monter', 
                    explanation: 'Pléonasme : "monter" contient déjà l\'idée de "haut". On dit simplement "monter".'
                },
                { 
                    pattern: /\bsortir dehors\b/g, 
                    correction: 'sortir', 
                    explanation: 'Pléonasme : "sortir" contient déjà l\'idée de "dehors". On dit simplement "sortir".'
                },
                { 
                    pattern: /\bentrer dedans\b/g, 
                    correction: 'entrer', 
                    explanation: 'Pléonasme : "entrer" contient déjà l\'idée de "dedans". On dit simplement "entrer".'
                },
                { 
                    pattern: /\bdescendre en bas\b/g, 
                    correction: 'descendre', 
                    explanation: 'Pléonasme : "descendre" contient déjà l\'idée de "bas". On dit simplement "descendre".'
                }
            ];
            
            confusions.forEach(confusion => {
                const matches = text.match(confusion.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'confusion_sens',
                            word: match,
                            correction: confusion.correction,
                            explanation: confusion.explanation,
                            offset: index,
                            length: match.length,
                            severity: 'medium',
                            confidence: 0.8
                        });
                    });
                }
            });
            
            return errors;
        }
    },
    {
        name: 'faux_amis',
        description: 'Détecte les faux amis (mots similaires mais de sens différents)',
        example: '❌ "J\'attends le bus" → ✅ "J\'attends le bus" (correct) vs "J\'assiste au cours"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const fauxAmis = [
                { 
                    pattern: /\battendre le bus\b/g, 
                    correction: 'attendre le bus', 
                    explanation: '"Attendre" est correct pour un bus. Ne pas confondre avec "assister" qui s\'utilise pour un cours, un spectacle.'
                },
                { 
                    pattern: /\bréaliser un projet\b/g, 
                    correction: 'réaliser un projet', 
                    explanation: '"Réaliser" est correct en français. Ne pas confondre avec l\'anglais "to realize" qui signifie "se rendre compte".'
                },
                { 
                    pattern: /\bsensible à la douleur\b/g, 
                    correction: 'sensible à la douleur', 
                    explanation: '"Sensible" est correct. Ne pas confondre avec "sensible" en anglais qui signifie "sensé".'
                },
                { 
                    pattern: /\bactuellement\b/g, 
                    correction: 'actuellement', 
                    explanation: '"Actuellement" signifie "en ce moment". Ne pas confondre avec l\'anglais "actually" qui se traduit par "en fait".'
                }
            ];
            
            fauxAmis.forEach(fauxAmi => {
                const matches = text.match(fauxAmi.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'faux_ami',
                            word: match,
                            correction: fauxAmi.correction,
                            explanation: fauxAmi.explanation,
                            offset: index,
                            length: match.length,
                            severity: 'medium',
                            confidence: 0.7
                        });
                    });
                }
            });
            
            return errors;
        }
    },
    // ===== CHAPITRE 2 : MOTS MAL EMPLOYÉS =====
    {
        name: 'mots_mal_employes',
        description: 'Détecte les mots employés dans un contexte inapproprié',
        example: '❌ "C\'est très joli" → ✅ "C\'est très beau" (pour un homme)',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const motsMalEmployes = [
                { 
                    pattern: /\btrès joli\b/g, 
                    correction: 'très beau', 
                    explanation: '"Joli" s\'emploie plutôt pour ce qui est délicat, gracieux. "Beau" est plus général et s\'applique mieux à un homme.'
                },
                { 
                    pattern: /\bnécessairement\b/g, 
                    correction: 'nécessairement', 
                    explanation: 'Attention à l\'orthographe : "nécessairement" avec deux "a".'
                },
                { 
                    pattern: /\bquand même\b/g, 
                    correction: 'quand même', 
                    explanation: 'L\'expression correcte est "quand même" (trois mots) ou "quand-même" avec trait d\'union.'
                },
                { 
                    pattern: /\btoute de suite\b/g, 
                    correction: 'tout de suite', 
                    explanation: 'L\'expression correcte est "tout de suite" (sans "e" à "tout").'
                }
            ];
            
            motsMalEmployes.forEach(mot => {
                const matches = text.match(mot.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'mot_mal_employe',
                            word: match,
                            correction: mot.correction,
                            explanation: mot.explanation,
                            offset: index,
                            length: match.length,
                            severity: 'medium',
                            confidence: 0.8
                        });
                    });
                }
            });
            
            return errors;
        }
    },
    // ===== CHAPITRE 3 : PRÉFIXES ET SUFFIXES =====
    {
        name: 'prefixes_suffixes',
        description: 'Vérifie l\'emploi correct des préfixes et suffixes',
        example: '❌ "inpossible" → ✅ "impossible"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const prefixesSuffixes = [
                { 
                    pattern: /\binpossible\b/g, 
                    correction: 'impossible', 
                    explanation: 'Le préfixe négatif est "im-" devant "possible" (commence par p), pas "in-".'
                },
                { 
                    pattern: /\birrespectueux\b/g, 
                    correction: 'irrespectueux', 
                    explanation: 'Le préfixe négatif est "ir-" devant "respectueux" (commence par r), pas "in-".'
                },
                { 
                    pattern: /\bilogique\b/g, 
                    correction: 'illogique', 
                    explanation: 'Le préfixe négatif est "il-" devant "logique" (commence par l), pas "bi-".'
                },
                { 
                    pattern: /\bsportif\b/g, 
                    correction: 'sportif', 
                    explanation: 'Attention : "sportif" s\'écrit avec un seul "t".'
                },
                { 
                    pattern: /\bclimatisation\b/g, 
                    correction: 'climatisation', 
                    explanation: 'Attention : "climatisation" s\'écrit avec un seul "m".'
                }
            ];
            
            prefixesSuffixes.forEach(regle => {
                const matches = text.match(regle.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'prefixe_suffixe',
                            word: match,
                            correction: regle.correction,
                            explanation: regle.explanation,
                            offset: index,
                            length: match.length,
                            severity: 'high',
                            confidence: 0.9
                        });
                    });
                }
            });
            
            return errors;
        }
    },
    // ===== CHAPITRE 4 : EXPRESSIONS IDIOMATIQUES =====
    {
        name: 'expressions_idiomatiques',
        description: 'Vérifie l\'emploi correct des expressions idiomatiques',
        example: '❌ "Jeter l\'éponge" → ✅ "Jeter l\'éponge"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const expressions = [
                { 
                    pattern: /\bjeter l\'éponge\b/g, 
                    correction: 'jeter l\'éponge', 
                    explanation: 'L\'expression correcte est "jeter l\'éponge" (avec article défini).'
                },
                { 
                    pattern: /\bmettre la main à la patte\b/g, 
                    correction: 'mettre la main à la pâte', 
                    explanation: 'L\'expression correcte est "mettre la main à la pâte" (commencer à travailler).'
                },
                { 
                    pattern: /\bavoir la frite\b/g, 
                    correction: 'avoir la frite', 
                    explanation: 'L\'expression correcte est "avoir la frite" (être énervé).'
                },
                { 
                    pattern: /\btirer les marrons du feu\b/g, 
                    correction: 'tirer les marrons du feu', 
                    explanation: 'L\'expression correcte est "tirer les marrons du feu" (profiter d\'une situation).'
                }
            ];
            
            expressions.forEach(expression => {
                const matches = text.match(expression.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'expression_idiomatique',
                            word: match,
                            correction: expression.correction,
                            explanation: expression.explanation,
                            offset: index,
                            length: match.length,
                            severity: 'medium',
                            confidence: 0.8
                        });
                    });
                }
            });
            
            return errors;
        }
    },
    // ===== CHAPITRE 5 : NIVEAUX DE LANGAGE =====
    {
        name: 'niveaux_langage',
        description: 'Détecte les incohérences de niveau de langage',
        example: '❌ "Le PDG a kiffé la réunion" → ✅ "Le PDG a apprécié la réunion"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const niveaux = [
                { 
                    pattern: /\bkiffé\b/g, 
                    correction: 'apprécié', 
                    explanation: '"Kiffer" est un mot familier. Dans un contexte professionnel, préférez "apprécier".'
                },
                { 
                    pattern: /\bcimer\b/g, 
                    correction: 'merci', 
                    explanation: '"Cimer" est un mot familier. Préférez "merci" dans un contexte formel.'
                },
                { 
                    pattern: /\bosé\b/g, 
                    correction: 'osé', 
                    explanation: '"Osé" avec accent s\'écrit "osé", pas "osé".'
                },
                { 
                    pattern: /\brelou\b/g, 
                    correction: 'énervant', 
                    explanation: '"Relou" est un mot familier. Préférez "énervant" ou "pénible".'
                }
            ];
            
            niveaux.forEach(niveau => {
                const matches = text.match(niveau.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'niveau_langage',
                            word: match,
                            correction: niveau.correction,
                            explanation: niveau.explanation,
                            offset: index,
                            length: match.length,
                            severity: 'low',
                            confidence: 0.7
                        });
                    });
                }
            });
            
            return errors;
        }
    }
];

// ---------------------------------------------------------------------
// COLLECTE FINALE DES RÈGLES
// ---------------------------------------------------------------------

console.log(`✅ ${vocabulaireRules.length} règles de vocabulaire chargées.`);

// Export pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = vocabulaireRules;
} else if (typeof window !== 'undefined') {
    window.vocabulaireRules = vocabulaireRules;
}
