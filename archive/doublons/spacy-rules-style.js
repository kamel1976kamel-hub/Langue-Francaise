// === RÈGLES PERSONNALISÉES SPACY – LE STYLE ET SES PIÈGES ===
// Basé sur l'ouvrage "Le style et ses pièges" (Archipoche)
// Version enrichie : chaque règle contient une explication détaillée, un exemple concret
// et une proposition de correction explicite.

console.log('📚 Initialisation des règles personnalisées spaCy – Le style et ses pièges');

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
// RÈGLES DE STYLE
// ---------------------------------------------------------------------

const styleRules = [
    // ===== CHAPITRE 1 : PONCTUATION =====
    {
        name: 'virgule_apres_cc',
        description: 'Détecte l\'absence de virgule après un complément circonstanciel en début de phrase',
        example: '❌ "Hier je suis allé au cinéma." → ✅ "Hier, je suis allé au cinéma."',
        pattern: [
            { 'RIGHT_ID': 'cc', 'RIGHT_ATTRS': { 'DEP': 'advmod' } },
            { 'LEFT_ID': 'cc', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const ccToken = doc[match[1]];
                const verbToken = doc[match[2]];
                if (ccToken.i === 0 || doc[ccToken.i - 1].is_sent_start) {
                    const nextToken = doc[ccToken.i + 1];
                    if (nextToken && nextToken.text !== ',') {
                        errors.push({
                            type: 'virgule_manquante',
                            word: ccToken.text + ' ' + verbToken.text,
                            correction: ccToken.text + ', ' + verbToken.text,
                            explanation: 'En français, un complément circonstanciel (temps, lieu, manière...) placé en tête de phrase est généralement suivi d\'une virgule pour détacher l\'élément et faciliter la lecture. Exemple : "Hier, je suis allé au cinéma."',
                            offset: ccToken.idx,
                            length: verbToken.idx + verbToken.length - ccToken.idx,
                            severity: 'low',
                            confidence: 0.7
                        });
                    }
                }
            });
            return errors;
        }
    },
    {
        name: 'espace_avant_ponctuation',
        description: 'Détecte l\'absence d\'espace avant les signes de ponctuation double (; : ! ?)',
        example: '❌ "Bonjour!" → ✅ "Bonjour !" (avec espace insécable)',
        pattern: [
            { 'RIGHT_ID': 'punct', 'RIGHT_ATTRS': { 'POS': 'PUNCT', 'TEXT': { 'IN': [';', ':', '!', '?'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const punct = doc[match[1]];
                const prevToken = doc[punct.i - 1];
                if (prevToken && prevToken.text.length > 0 && prevToken.text !== ' ') {
                    errors.push({
                        type: 'espace_manquante',
                        word: prevToken.text + punct.text,
                        correction: prevToken.text + ' ' + punct.text,
                        explanation: 'En typographie française, on met une espace insécable avant les signes de ponctuation double (; : ! ?) pour une meilleure lisibilité. Exemple : "Bonjour !" et non "Bonjour!".',
                        offset: prevToken.idx + prevToken.length,
                        length: 1,
                        severity: 'low',
                        confidence: 0.9
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'point_interrogation_manquant',
        description: 'Détecte l\'absence de point d\'interrogation dans une phrase interrogative',
        example: '❌ "Tu viens" → ✅ "Tu viens ?"',
        pattern: [
            { 'RIGHT_ID': 'interrog', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['qui', 'que', 'quoi', 'quel', 'quelle', 'quels', 'quelles', 'comment', 'pourquoi', 'quand', 'où', 'est-ce que'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const word = doc[match[1]];
                if (word.i === 0 || doc[word.i - 1].is_sent_start) {
                    const lastToken = doc[doc.length - 1];
                    if (lastToken.text !== '?' && lastToken.text !== '!' && lastToken.text !== '.') {
                        errors.push({
                            type: 'ponctuation_manquante',
                            word: lastToken.text,
                            correction: lastToken.text + ' ?',
                            explanation: 'Une phrase interrogative doit se terminer par un point d\'interrogation pour indiquer qu\'il s\'agit d\'une question. Exemple : "Tu viens ?" et non "Tu viens".',
                            offset: lastToken.idx + lastToken.length,
                            length: 0,
                            severity: 'medium',
                            confidence: 0.8
                        });
                    }
                }
            });
            return errors;
        }
    },
    // ===== CHAPITRE 2 : PIÈGES DE LA SYNTAXE =====
    {
        name: 'accord_sujet_verbe_beaucoup',
        description: 'Accord du verbe avec "beaucoup de", "peu de", "la plupart", etc.',
        example: '❌ "Beaucoup de monde est venu" → ✅ "Beaucoup de gens sont venus"',
        pattern: [
            { 'RIGHT_ID': 'quant', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['beaucoup', 'peu', 'la plupart', 'une partie', 'la moitié', 'le reste'] } } },
            { 'LEFT_ID': 'quant', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const quantToken = doc[match[1]];
                const verbToken = doc[match[2]];
                let shouldBePlural = true;
                if (quantToken.text === 'peu' || quantToken.text === 'une partie' || quantToken.text === 'la moitié' || quantToken.text === 'le reste') {
                    let nextIdx = quantToken.i + 1;
                    while (nextIdx < doc.length && doc[nextIdx].text !== 'de') nextIdx++;
                    if (nextIdx < doc.length && doc[nextIdx + 1] && doc[nextIdx + 1].morph.Number === 'Sing') {
                        shouldBePlural = false;
                    }
                }
                const verbNumber = verbToken.morph.Number;
                if (shouldBePlural && verbNumber === 'Sing') {
                    const correctForm = getConjugation(getLemma(verbToken), verbToken.morph.Person, 'Plur', verbToken.morph.Tense) || verbToken.text + 'nt';
                    errors.push({
                        type: 'accord_sujet_verbe',
                        word: verbToken.text,
                        correction: correctForm,
                        explanation: `Avec "${quantToken.text}", le verbe s\'accorde généralement avec le complément qui suit, souvent au pluriel. Exemple : "Beaucoup de gens sont venus" (et non "est venu").`,
                        offset: verbToken.idx,
                        length: verbToken.length,
                        severity: 'high',
                        confidence: 0.8
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'c_est_ce_sont',
        description: 'Détecte l\'emploi de "c\'est" devant un nom pluriel',
        example: '❌ "C\'est les enfants" → ✅ "Ce sont les enfants"',
        pattern: [
            { 'RIGHT_ID': 'cest', 'RIGHT_ATTRS': { 'TEXT': 'c\'est', 'POS': 'PRON' } },
            { 'LEFT_ID': 'cest', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'DET', 'MORPH': { 'Number': 'Plur' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const cest = doc[match[1]];
                const det = doc[match[2]];
                errors.push({
                    type: 'c_est_ce_sont',
                    word: 'c\'est',
                    correction: 'ce sont',
                    explanation: 'Avec un nom pluriel, on utilise "ce sont" au lieu de "c\'est". Exemple : "Ce sont les enfants" (et non "c\'est les enfants").',
                    offset: cest.idx,
                    length: 4,
                    severity: 'medium',
                    confidence: 0.85
                });
            });
            return errors;
        }
    },
    {
        name: 'ou_ou',
        description: 'Détecte la confusion entre "ou" (conjonction) et "où" (pronom relatif/adverbe)',
        example: '❌ "La maison ou je vis" → ✅ "La maison où je vis"',
        pattern: [
            { 'RIGHT_ID': 'ou', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['ou', 'où'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const token = doc[match[1]];
                const text = token.text;
                const nextToken = doc[token.i + 1];
                if (text === 'ou' && nextToken && (nextToken.pos === 'PRON' || nextToken.pos === 'VERB')) {
                    errors.push({
                        type: 'confusion_ou_où',
                        word: 'ou',
                        correction: 'où',
                        explanation: '"ou" (sans accent) est une conjonction de coordination qui exprime une alternative. "où" (avec accent) est un adverbe ou pronom relatif indiquant un lieu ou un moment. Dans ce contexte, on attend "où".',
                        offset: token.idx,
                        length: 2,
                        severity: 'medium',
                        confidence: 0.7
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'a_ou_a',
        description: 'Détecte la confusion entre "a" (verbe avoir) et "à" (préposition)',
        example: '❌ "Je vais a Paris" → ✅ "Je vais à Paris"',
        pattern: [
            { 'RIGHT_ID': 'a', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['a', 'à'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const token = doc[match[1]];
                const text = token.text;
                const nextToken = doc[token.i + 1];
                if (text === 'a' && nextToken && nextToken.pos === 'VERB' && nextToken.morph.VerbForm === 'Inf') {
                    errors.push({
                        type: 'confusion_a_à',
                        word: 'a',
                        correction: 'à',
                        explanation: '"a" (sans accent) est le verbe avoir conjugué à la 3e personne du singulier. "à" (avec accent) est une préposition. Devant un infinitif, on utilise "à".',
                        offset: token.idx,
                        length: 1,
                        severity: 'high',
                        confidence: 0.9
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'et_est',
        description: 'Détecte la confusion entre "et" (conjonction) et "est" (verbe être)',
        example: '❌ "Il et grand" → ✅ "Il est grand"',
        pattern: [
            { 'RIGHT_ID': 'et_est', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['et', 'est'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const token = doc[match[1]];
                const text = token.text;
                const prevToken = doc[token.i - 1];
                const nextToken = doc[token.i + 1];
                if (text === 'et' && prevToken && prevToken.pos === 'NOUN' && nextToken && nextToken.pos === 'ADJ') {
                    errors.push({
                        type: 'confusion_et_est',
                        word: 'et',
                        correction: 'est',
                        explanation: '"et" est une conjonction de coordination. "est" est le verbe être. Dans ce contexte, on attend le verbe "est".',
                        offset: token.idx,
                        length: 2,
                        severity: 'high',
                        confidence: 0.8
                    });
                }
            });
            return errors;
        }
    },
    // ===== CHAPITRE 3 : RÉPÉTITIONS ET PLÉONASMES =====
    {
        name: 'pleonasmes_courants',
        description: 'Détecte les pléonasmes courants',
        example: '❌ "monter en haut" → ✅ "monter"',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': { 'IN': ['monter', 'descendre', 'entrer', 'sortir'] } } },
            { 'LEFT_ID': 'verb', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'ADP' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            const pleonasmes = {
                'monter': ['haut', 'dessus'],
                'descendre': ['bas', 'dessous'],
                'entrer': ['dedans'],
                'sortir': ['dehors']
            };
            
            matches.forEach(match => {
                const verb = doc[match[1]];
                const prep = doc[match[2]];
                const verbLemma = verb.lemma;
                
                if (pleonasmes[verbLemma] && pleonasmes[verbLemma].includes(prep.text)) {
                    errors.push({
                        type: 'pleonasme',
                        word: verb.text + ' ' + prep.text,
                        correction: verb.text,
                        explanation: `Pléonasme détecté : "${verb.text} ${prep.text}". Le verbe "${verb.text}" contient déjà l'idée de "${prep.text}". Exemple : "monter" suffit (et non "monter en haut").`,
                        offset: verb.idx,
                        length: verb.length + prep.length + 1,
                        severity: 'medium',
                        confidence: 0.8
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'repetitions_mots',
        description: 'Détecte les répétitions de mots dans une même phrase',
        example: '❌ "Je vais aller au magasin" → ✅ "Je vais au magasin"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const words = text.toLowerCase().split(/\s+/);
            const wordCount = {};
            
            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });
            
            Object.entries(wordCount).forEach(([word, count]) => {
                if (count > 1 && word.length > 3) { // Ignorer les mots courts
                    const regex = new RegExp(`\\b${word}\\b`, 'gi');
                    const matches = text.match(regex);
                    if (matches && matches.length > 1) {
                        const index = text.indexOf(matches[1]); // Deuxième occurrence
                        errors.push({
                            type: 'repetition',
                            word: word,
                            correction: 'remplacer par un synonyme',
                            explanation: `Répétition détectée : le mot "${word}" apparaît ${count} fois. Variez le vocabulaire pour améliorer le style.`,
                            offset: index,
                            length: word.length,
                            severity: 'low',
                            confidence: 0.6
                        });
                    }
                }
            });
            
            return errors;
        }
    },
    // ===== CHAPITRE 4 : CHOIX DES MOTS =====
    {
        name: 'mots_familiers',
        description: 'Détecte l\'emploi de mots familiers dans un contexte formel',
        example: '❌ "C\'est super !" → ✅ "C\'est excellent !"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const familiers = {
                'super': 'excellent',
                'génial': 'remarquable',
                'top': 'excellent',
                'nul': 'médiocre',
                'truc': 'chose',
                'bidule': 'objet',
                'machin': 'dispositif',
                'boulot': 'travail',
                'bosser': 'travailler',
                'kiffer': 'adorer',
                'cimer': 'merci',
                'mec': 'homme',
                'meuf': 'femme',
                'rezo': 'réseau',
                'aprem': 'après-midi',
                'matin': 'matinée'
            };
            
            Object.entries(familiers).forEach(([familier, formel]) => {
                const regex = new RegExp(`\\b${familier}\\b`, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'langage_familier',
                            word: match,
                            correction: formel,
                            explanation: `Le mot "${match}" est familier. Préférez "${formel}" dans un contexte formel.`,
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
    },
    {
        name: 'anglicismes_courants',
        description: 'Détecte les anglicismes courants et propose des alternatives françaises',
        example: '❌ "C\'est un challenge" → ✅ "C\'est un défi"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const anglicismes = {
                'challenge': 'défi',
                'deadline': 'date limite',
                'meeting': 'réunion',
                'mail': 'courriel',
                'email': 'courriel',
                'week-end': 'fin de semaine',
                'parking': 'stationnement',
                'shopping': 'achats',
                'fast-food': 'restauration rapide',
                'business': 'affaires',
                'manager': 'directeur',
                'leader': 'leader',
                'team': 'équipe',
                'best-seller': 'best-seller',
                'newsletter': 'lettre d\'information',
                'podcast': 'podcast',
                'hashtag': 'mot-dièse',
                'troll': 'troll',
                'like': 'j\'aime',
                'share': 'partager',
                'comment': 'commentaire'
            };
            
            Object.entries(anglicismes).forEach(([anglicisme, francais]) => {
                const regex = new RegExp(`\\b${anglicisme}\\b`, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'anglicisme',
                            word: match,
                            correction: francais,
                            explanation: `Anglicisme détecté : "${match}". Préférez le terme français "${francais}".`,
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
    }
];

// ---------------------------------------------------------------------
// COLLECTE FINALE DES RÈGLES
// ---------------------------------------------------------------------

console.log(`✅ ${styleRules.length} règles de style chargées.`);

// Export pour utilisation// Éviter les conflits de variables globales
if (typeof window.styleRules === 'undefined') {
    window.styleRules = styleRules;
}
