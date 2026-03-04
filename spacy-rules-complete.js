// === MOTEUR DE RÈGLES PERSONNALISÉES SPACY – ÉDITION COMPLÈTE AVEC EXPLICATIONS ET ILLUSTRATIONS ===
// Basé sur les chapitres 1 (Ponctuation) et 2 (Pièges de la syntaxe) de "Le style et ses pièges"
// Version enrichie : chaque règle contient désormais une explication détaillée, une illustration (exemple concret)
// et une proposition de correction explicite, conformément aux recommandations de l'ouvrage.

console.log('📚 Initialisation des règles personnalisées spaCy (édition complète enrichie)');

// ---------------------------------------------------------------------
// FONCTIONS UTILITAIRES (inchangées)
// ---------------------------------------------------------------------

function getLemma(verb) {
    return verb.lemma || verb.text;
}

function getConjugation(lemma, person, number, tense) {
    const conjug = {
        'être': {
            'Pres': {'1Sing': 'suis', '2Sing': 'es', '3Sing': 'est', '1Plur': 'sommes', '2Plur': 'êtes', '3Plur': 'sont'},
            'Imp': {'1Sing': 'étais', '2Sing': 'étais', '3Sing': 'était', '1Plur': 'étions', '2Plur': 'étiez', '3Plur': 'étaient'},
            'Fut': {'1Sing': 'serai', '2Sing': 'seras', '3Sing': 'sera', '1Plur': 'serons', '2Plur': 'serez', '3Plur': 'seront'},
            'Cond': {'1Sing': 'serais', '2Sing': 'serais', '3Sing': 'serait', '1Plur': 'serions', '2Plur': 'seriez', '3Plur': 'seraient'},
            'Subj': {'1Sing': 'sois', '2Sing': 'sois', '3Sing': 'soit', '1Plur': 'soyons', '2Plur': 'soyez', '3Plur': 'soient'}
        },
        'avoir': {
            'Pres': {'1Sing': 'ai', '2Sing': 'as', '3Sing': 'a', '1Plur': 'avons', '2Plur': 'avez', '3Plur': 'ont'},
            'Imp': {'1Sing': 'avais', '2Sing': 'avais', '3Sing': 'avait', '1Plur': 'avions', '2Plur': 'aviez', '3Plur': 'avaient'},
            'Fut': {'1Sing': 'aurai', '2Sing': 'auras', '3Sing': 'aura', '1Plur': 'aurons', '2Plur': 'aurez', '3Plur': 'auront'},
            'Cond': {'1Sing': 'aurais', '2Sing': 'aurais', '3Sing': 'aurait', '1Plur': 'aurions', '2Plur': 'auriez', '3Plur': 'auraient'},
            'Subj': {'1Sing': 'aie', '2Sing': 'aies', '3Sing': 'ait', '1Plur': 'ayons', '2Plur': 'ayez', '3Plur': 'aient'}
        }
    };
    const key = person + number.charAt(0).toUpperCase() + number.slice(1);
    return conjug[lemma]?.[tense]?.[key] || null;
}

function getFeminineAdjective(mascAdj) {
    const fems = {
        'beau': 'belle', 'nouveau': 'nouvelle', 'vieux': 'vieille',
        'gentil': 'gentille', 'grand': 'grande', 'petit': 'petite',
        'bon': 'bonne', 'joli': 'jolie', 'gros': 'grosse',
        'long': 'longue', 'blanc': 'blanche', 'frais': 'fraîche',
        'sec': 'sèche', 'doux': 'douce', 'public': 'publique'
    };
    return fems[mascAdj] || mascAdj + 'e';
}

function isVowel(c) {
    return 'aeiouyàâäéèêëïîôöùûü'.includes(c.toLowerCase());
}

// ---------------------------------------------------------------------
// RÈGLES DE PONCTUATION (Chapitre 1)
// ---------------------------------------------------------------------

const ponctuationRules = [
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
    }
];

// ---------------------------------------------------------------------
// RÈGLES DE SYNTAXE (Chapitre 2)
// ---------------------------------------------------------------------

const syntaxRules = [
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
        name: 'accord_participe_passe_avoir_cod_avant',
        description: 'Accord du participe passé avec avoir quand le COD est placé avant',
        example: '❌ "Les pommes que j\'ai mangé" → ✅ "Les pommes que j\'ai mangées"',
        pattern: [
            { 'RIGHT_ID': 'aux', 'RIGHT_ATTRS': { 'LEMMA': 'avoir', 'POS': 'AUX' } },
            { 'LEFT_ID': 'aux', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'Tense': 'Past' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const aux = doc[match[1]];
                const ppe = doc[match[2]];
                let codToken = null;
                for (let i = aux.i - 1; i >= 0; i--) {
                    const tok = doc[i];
                    if (tok.dep === 'obj' && tok.head === ppe) {
                        codToken = tok;
                        break;
                    }
                    if (tok.pos === 'PRON' && (tok.text === 'le' || tok.text === 'la' || tok.text === 'les' || tok.text === 'l\'') && tok.head === ppe) {
                        codToken = tok;
                        break;
                    }
                }
                if (codToken) {
                    const codGender = codToken.morph.Gender;
                    const codNumber = codToken.morph.Number;
                    const ppeText = ppe.text;
                    let correctPPE = ppeText;
                    if (codNumber === 'Plur' && !ppeText.endsWith('s')) correctPPE += 's';
                    if (codGender === 'Fem' && !ppeText.endsWith('e')) correctPPE += 'e';
                    if (correctPPE !== ppeText) {
                        errors.push({
                            type: 'accord_participe_passe',
                            word: ppeText,
                            correction: correctPPE,
                            explanation: 'Avec l\'auxiliaire "avoir", le participe passé s\'accorde en genre et en nombre avec le complément d\'objet direct (COD) si celui-ci est placé avant le verbe. Exemple : "Les pommes que j\'ai mangées".',
                            offset: ppe.idx,
                            length: ppe.length,
                            severity: 'high',
                            confidence: 0.9
                        });
                    }
                }
            });
            return errors;
        }
    },
    {
        name: 'accord_genre_determinant_nom',
        description: 'Accord en genre entre déterminant et nom',
        example: '❌ "le fille" → ✅ "la fille" ; ❌ "la garçon" → ✅ "le garçon"',
        pattern: [
            { 'RIGHT_ID': 'det', 'RIGHT_ATTRS': { 'POS': 'DET' } },
            { 'LEFT_ID': 'det', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'NOUN' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const det = doc[match[1]];
                const noun = doc[match[2]];
                const detGender = det.morph.Gender;
                const nounGender = noun.morph.Gender;
                if (detGender && nounGender && detGender !== nounGender) {
                    let correction;
                    if (det.lemma === 'le' && nounGender === 'Fem') correction = 'la';
                    else if (det.lemma === 'la' && nounGender === 'Masc') correction = 'le';
                    else if (det.lemma === 'un' && nounGender === 'Fem') correction = 'une';
                    else if (det.lemma === 'une' && nounGender === 'Masc') correction = 'un';
                    else correction = det.text;

                    if (correction !== det.text) {
                        errors.push({
                            type: 'accord_genre',
                            word: det.text + ' ' + noun.text,
                            correction: correction + ' ' + noun.text,
                            explanation: 'Le déterminant doit s\'accorder en genre avec le nom. Par exemple, "fille" est féminin, donc on dit "la fille" (et non "le fille").',
                            offset: det.idx,
                            length: noun.idx + noun.length - det.idx,
                            severity: 'high',
                            confidence: 0.95
                        });
                    }
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
    }
];

// ---------------------------------------------------------------------
// RÈGLES SIMPLES PAR REGEX (pour les erreurs évidentes)
// ---------------------------------------------------------------------

const simpleRules = [
    {
        name: 'genre_simple',
        description: 'Détecte les erreurs de genre évidentes (le fille, la garçon)',
        example: '❌ "le fille" → ✅ "la fille"',
        pattern: null,
        action: function(text) {
            const errors = [];
            const genreErrors = [
                { pattern: /\ble\s+fille\b/g, correction: 'la fille', explanation: '"fille" est féminin, donc on dit "la fille"' },
                { pattern: /\ble\s+femme\b/g, correction: 'la femme', explanation: '"femme" est féminin, donc on dit "la femme"' },
                { pattern: /\ble\s+soeur\b/g, correction: 'la soeur', explanation: '"soeur" est féminin, donc on dit "la soeur"' },
                { pattern: /\ble\s+mère\b/g, correction: 'la mère', explanation: '"mère" est féminin, donc on dit "la mère"' },
                { pattern: /\bla\s+garçon\b/g, correction: 'le garçon', explanation: '"garçon" est masculin, donc on dit "le garçon"' },
                { pattern: /\bla\s+père\b/g, correction: 'le père', explanation: '"père" est masculin, donc on dit "le père"' },
                { pattern: /\bla\s+frère\b/g, correction: 'le frère', explanation: '"frère" est masculin, donc on dit "le frère"' }
            ];
            
            genreErrors.forEach(error => {
                const matches = text.match(error.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'genre',
                            word: match,
                            correction: error.correction,
                            explanation: error.explanation,
                            offset: index,
                            length: match.length,
                            severity: 'high',
                            confidence: 0.98,
                            rule: 'genre_simple'
                        });
                    });
                }
            });
            
            return errors;
        }
    },
    {
        name: 'conjugaison_simple',
        description: 'Détecte les erreurs de conjugaison évidentes (qui a au lieu de qui ont)',
        example: '❌ "qui a" → ✅ "qui ont"',
        pattern: null,
        action: function(text) {
            const errors = [];
            const conjugaisonErrors = [
                { pattern: /\bqui\s+(a|as)\b/gi, check: (match) => {
                    const verb = match.toLowerCase();
                    if (verb === 'qui a' || verb === 'qui as') {
                        return { correction: 'qui ont', explanation: 'Après "qui" pluriel, on utilise "ont" et non "a"' };
                    }
                    return null;
                }},
                { pattern: /\bles\s+(est|sont)\s+(fille|femme|soeur|mère)\b/gi, check: (match) => {
                    const words = match.split(' ');
                    if (words[1] === 'est') {
                        return { correction: `les sont ${words[2]}`, explanation: 'Au pluriel, on dit "sont" et non "est"' };
                    }
                    return null;
                }},
                { pattern: /\bc'est\s+(les|des|mes|tes|ses)\b/gi, check: (match) => {
                    return { correction: match.replace("c'est", "ce sont"), explanation: 'Avec un pluriel, on dit "ce sont" et non "c\'est"' };
                }}
            ];
            
            conjugaisonErrors.forEach(error => {
                const matches = text.match(error.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const correction = error.check(match);
                        if (correction) {
                            const index = text.indexOf(match);
                            errors.push({
                                type: 'conjugaison',
                                word: match,
                                correction: correction.correction,
                                explanation: correction.explanation,
                                offset: index,
                                length: match.length,
                                severity: 'high',
                                confidence: 0.98,
                                rule: 'conjugaison_simple'
                            });
                        }
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

const allSpacyRules = [
    ...ponctuationRules,
    ...syntaxRules,
    ...simpleRules
];

console.log(`✅ ${allSpacyRules.length} règles personnalisées spacy complètes chargées.`);
console.log('📖 Chaque règle inclut une explication détaillée et un exemple illustratif.');

// Export pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = allSpacyRules;
} else if (typeof window !== 'undefined') {
    window.spacyRulesComplete = allSpacyRules;
}
