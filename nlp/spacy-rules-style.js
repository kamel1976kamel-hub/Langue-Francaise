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

function getMasculineAdjective(femAdj) {
    const inv = {
        'belle': 'beau', 'nouvelle': 'nouveau', 'vieille': 'vieux',
        'gentille': 'gentil', 'grande': 'grand', 'petite': 'petit',
        'bonne': 'bon', 'jolie': 'joli', 'grosse': 'gros',
        'longue': 'long', 'blanche': 'blanc', 'fraîche': 'frais',
        'sèche': 'sec', 'douce': 'doux', 'publique': 'public'
    };
    return inv[femAdj] || femAdj.replace(/e$/, '');
}

function getPluralNoun(singular) {
    if (singular.match(/(s|x|z)$/)) return singular;
    if (singular.match(/(au|eu)$/)) return singular + 'x';
    if (singular.match(/al$/)) return singular.replace(/al$/, 'aux');
    if (singular.match(/ail$/)) return singular + 's';
    return singular + 's';
}

function getSingularNoun(plural) {
    if (plural.endsWith('aux')) return plural.replace(/aux$/, 'al');
    if (plural.endsWith('x') && (plural.endsWith('eaux') || plural.endsWith('aux'))) return plural.replace(/x$/, '');
    if (plural.endsWith('s')) return plural.slice(0, -1);
    return plural;
}

function getFeminineNoun(mascNoun) {
    const fems = {
        'chien': 'chienne', 'chat': 'chatte', 'ami': 'amie',
        'voisin': 'voisine', 'employé': 'employée', 'lycéen': 'lycéenne',
        'artiste': 'artiste'
    };
    return fems[mascNoun] || mascNoun + 'e';
}

function getMasculineNoun(femNoun) {
    const inv = {
        'chienne': 'chien', 'chatte': 'chat', 'amie': 'ami',
        'voisine': 'voisin', 'employée': 'employé', 'lycéenne': 'lycéen'
    };
    return inv[femNoun] || femNoun.replace(/e$/, '');
}

function isVowel(c) {
    return 'aeiouyàâäéèêëïîôöùûü'.includes(c.toLowerCase());
}

function elide(word) {
    const elisions = {
        'le': 'l\'', 'la': 'l\'', 'je': 'j\'', 'me': 'm\'', 'te': 't\'',
        'se': 's\'', 'ce': 'c\'', 'de': 'd\'', 'que': 'qu\''
    };
    return elisions[word] || word;
}

// ---------------------------------------------------------------------
// RÈGLES DE PONCTUATION (Chapitre 1) – légèrement enrichies
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
                            explanation: `En français, un complément circonstanciel (temps, lieu, manière...) placé en tête de phrase est généralement suivi d'une virgule pour détacher l'élément et faciliter la lecture. Exemple : "Hier, je suis allé au cinéma."`,
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
                        explanation: `En typographie française, on met une espace insécable avant les signes de ponctuation double (; : ! ?) pour une meilleure lisibilité. Exemple : "Bonjour !" et non "Bonjour!".`,
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
        name: 'point_virgule_enumeration',
        description: 'Suggère l\'emploi du point-virgule dans les énumérations complexes',
        example: '❌ "Il y avait : un chat, un chien, un oiseau." (si les éléments sont longs) → ✅ "Il y avait : un chat ; un chien ; un oiseau."',
        pattern: [
            { 'RIGHT_ID': 'intro', 'RIGHT_ATTRS': { 'TEXT': ':' } },
            { 'LEFT_ID': 'intro', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'PUNCT', 'TEXT': ',' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const colon = doc[match[1]];
                let commaCount = 0;
                for (let i = colon.i + 1; i < doc.length; i++) {
                    if (doc[i].text === ',') commaCount++;
                    if (commaCount >= 2) break;
                }
                if (commaCount >= 2) {
                    errors.push({
                        type: 'ponctuation_enumeration',
                        word: ',',
                        correction: ';',
                        explanation: `Dans une énumération comportant plusieurs éléments, surtout s'ils sont longs ou contiennent déjà des virgules, on utilise de préférence le point-virgule pour séparer les éléments. Cela améliore la clarté. Exemple : "Il y avait : un chat roux ; un chien noir ; un oiseau bleu."`,
                        offset: colon.idx + 1,
                        length: 1,
                        severity: 'medium',
                        confidence: 0.6
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
                            explanation: `Une phrase interrogative doit se terminer par un point d'interrogation pour indiquer qu'il s'agit d'une question. Exemple : "Tu viens ?" et non "Tu viens".`,
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
    {
        name: 'guillemets_non_fermes',
        description: 'Détecte les guillemets ouvrants sans fermeture',
        example: '❌ "Il a dit : « Bonjour" → ✅ "Il a dit : « Bonjour »"',
        pattern: [
            { 'RIGHT_ID': 'guill', 'RIGHT_ATTRS': { 'TEXT': '«' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            const openPositions = matches.map(m => m[1]);
            openPositions.forEach(pos => {
                let found = false;
                for (let i = pos + 1; i < doc.length; i++) {
                    if (doc[i].text === '»') {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    errors.push({
                        type: 'guillemets_non_fermes',
                        word: '«',
                        correction: '« ... »',
                        explanation: `Chaque guillemet ouvrant « doit avoir un guillemet fermant » correspondant, sauf si la citation s'étend sur plusieurs paragraphes (dans ce cas on met un guillemet ouvrant au début de chaque paragraphe et un fermant seulement à la fin). Exemple : « Bonjour » et non « Bonjour.`,
                        offset: doc[pos].idx,
                        length: 1,
                        severity: 'high',
                        confidence: 0.95
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'virgule_avant_et',
        description: 'Détecte une virgule superflue avant "et" dans une énumération',
        example: '❌ "des pommes, des poires, et des oranges" → ✅ "des pommes, des poires et des oranges"',
        pattern: [
            { 'RIGHT_ID': 'comma', 'RIGHT_ATTRS': { 'POS': 'PUNCT', 'TEXT': ',' } },
            { 'LEFT_ID': 'comma', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'CCONJ', 'TEXT': 'et' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const comma = doc[match[1]];
                const et = doc[match[2]];
                let nextToken = doc[et.i + 1];
                if (nextToken && nextToken.pos !== 'NOUN' && nextToken.pos !== 'ADJ') {
                    errors.push({
                        type: 'virgule_superflue',
                        word: ',',
                        correction: '',
                        explanation: `Dans une énumération, on ne met généralement pas de virgule avant "et" (sauf pour des raisons stylistiques, comme une insistance). Exemple : "des pommes, des poires et des oranges" est correct, sans virgule avant "et".`,
                        offset: comma.idx,
                        length: 1,
                        severity: 'low',
                        confidence: 0.6
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'majuscule_apres_point',
        description: 'Vérifie la présence d\'une majuscule après un point',
        example: '❌ "Il fait beau. demain nous irons." → ✅ "Il fait beau. Demain nous irons."',
        pattern: [
            { 'RIGHT_ID': 'point', 'RIGHT_ATTRS': { 'POS': 'PUNCT', 'TEXT': '.' } },
            { 'LEFT_ID': 'point', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const point = doc[match[1]];
                const nextToken = doc[point.i + 1];
                if (nextToken && nextToken.text[0] === nextToken.text[0].toLowerCase()) {
                    if (point.i > 0 && doc[point.i - 1].text.length > 1 && doc[point.i - 1].text[0] === doc[point.i - 1].text[0].toUpperCase()) {
                        return; // probable abréviation
                    }
                    errors.push({
                        type: 'majuscule_manquante',
                        word: nextToken.text,
                        correction: nextToken.text[0].toUpperCase() + nextToken.text.slice(1),
                        explanation: `Après un point, on met une majuscule pour marquer le début d'une nouvelle phrase. Exemple : "Il fait beau. Demain nous irons." et non "Il fait beau. demain nous irons."`,
                        offset: nextToken.idx,
                        length: nextToken.length,
                        severity: 'high',
                        confidence: 0.95
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'points_suspension_trop',
        description: 'Détecte l\'usage excessif de points de suspension (plus de trois)',
        example: '❌ "Je ne sais pas...." → ✅ "Je ne sais pas..."',
        pattern: [
            { 'RIGHT_ID': 'points', 'RIGHT_ATTRS': { 'TEXT': { 'REGEX': '\\.{4,}' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const token = doc[match[1]];
                errors.push({
                    type: 'ponctuation_excessive',
                    word: token.text,
                    correction: '...',
                    explanation: `Les points de suspension sont toujours au nombre de trois. Un nombre supérieur est considéré comme une erreur typographique (sauf usage littéraire très particulier). Exemple : "Je ne sais pas..." et non "Je ne sais pas....".`,
                    offset: token.idx,
                    length: token.length,
                    severity: 'low',
                    confidence: 0.9
                });
            });
            return errors;
        }
    },
    {
        name: 'deux_points_majuscule',
        description: 'Détecte une majuscule après deux-points (hors citation)',
        example: '❌ "Il a dit : Bonjour" → ✅ "Il a dit : bonjour" (sauf si c\'est un nom propre ou le début d\'une citation)',
        pattern: [
            { 'RIGHT_ID': 'colon', 'RIGHT_ATTRS': { 'TEXT': ':' } },
            { 'LEFT_ID': 'colon', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'PROPN' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const colon = doc[match[1]];
                const properNoun = doc[match[2]];
                errors.push({
                    type: 'majuscule_apres_deuxpoints',
                    word: properNoun.text,
                    correction: properNoun.text.toLowerCase(),
                    explanation: `Sauf s'il s'agit d'une citation, d'un titre ou d'un nom propre, les deux-points sont suivis d'une minuscule. Exemple : "Il a dit : bonjour" (et non "Il a dit : Bonjour").`,
                    offset: properNoun.idx,
                    length: properNoun.length,
                    severity: 'low',
                    confidence: 0.5
                });
            });
            return errors;
        }
    }
];

// ---------------------------------------------------------------------
// RÈGLES DE SYNTAXE (Chapitre 2) – enrichies avec explications et illustrations
// ---------------------------------------------------------------------

const syntaxRules = [
    // ===== ACCORDS =====
    {
        name: 'accord_sujet_verbe_beaucoup',
        description: 'Accord du verbe avec "beaucoup de", "peu de", "la plupart", etc.',
        example: '❌ "Beaucoup de monde est venu" (si "monde" est considéré comme collectif, mais souvent on attend un pluriel) → ✅ "Beaucoup de gens sont venus" (car "gens" est pluriel). Plus précisément : "Beaucoup de monde" est accepté au singulier, mais avec un complément pluriel, le verbe est pluriel.',
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
                        explanation: `Avec "${quantToken.text}", le verbe s'accorde généralement avec le complément qui suit, souvent au pluriel. Exemple : "Beaucoup de gens sont venus" (et non "est venu"). Cependant, si le complément est singulier ("peu de monde"), le verbe peut rester au singulier.`,
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
        example: '❌ "Les pommes que j\'ai mangé" → ✅ "Les pommes que j\'ai mangées" (car "que" reprend "pommes", COD féminin pluriel placé avant)',
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
                            explanation: `Avec l'auxiliaire "avoir", le participe passé s'accorde en genre et en nombre avec le complément d'objet direct (COD) si celui-ci est placé avant le verbe. Exemple : "Les pommes que j'ai mangées" (COD "que" = pommes, féminin pluriel) ; "La lettre qu'il a écrite" (COD "que" = lettre, féminin singulier).`,
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
                    else if (det.lemma === 'ce' && nounGender === 'Fem') correction = 'cette';
                    else if (det.lemma === 'cet' && nounGender === 'Fem') correction = 'cette';
                    else if (det.lemma === 'cette' && nounGender === 'Masc') correction = (isVowel(noun.text[0]) ? 'cet' : 'ce');
                    else if (det.lemma === 'mon' && nounGender === 'Fem' && isVowel(noun.text[0])) correction = 'mon';
                    else if (det.lemma === 'mon' && nounGender === 'Fem' && !isVowel(noun.text[0])) correction = 'ma';
                    else if (det.lemma === 'ma' && nounGender === 'Masc') correction = 'mon';
                    else if (det.lemma === 'ton' && nounGender === 'Fem' && !isVowel(noun.text[0])) correction = 'ta';
                    else if (det.lemma === 'ta' && nounGender === 'Masc') correction = 'ton';
                    else if (det.lemma === 'son' && nounGender === 'Fem' && !isVowel(noun.text[0])) correction = 'sa';
                    else if (det.lemma === 'sa' && nounGender === 'Masc') correction = 'son';
                    else correction = det.text;

                    if (correction !== det.text) {
                        errors.push({
                            type: 'accord_genre',
                            word: det.text + ' ' + noun.text,
                            correction: correction + ' ' + noun.text,
                            explanation: `Le déterminant doit s'accorder en genre avec le nom. Par exemple, "fille" est féminin, donc on dit "la fille" (et non "le fille") ; "garçon" est masculin, donc "le garçon" (et non "la garçon").`,
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
        name: 'accord_adjectif_nom',
        description: 'Accord en genre et nombre de l\'adjectif avec le nom',
        example: '❌ "une robe bleu" → ✅ "une robe bleue" ; ❌ "des chemises gris" → ✅ "des chemises grises"',
        pattern: [
            { 'RIGHT_ID': 'adj', 'RIGHT_ATTRS': { 'POS': 'ADJ' } },
            { 'LEFT_ID': 'adj', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'NOUN' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const adj = doc[match[1]];
                const noun = doc[match[2]];
                const nounGender = noun.morph.Gender;
                const nounNumber = noun.morph.Number;
                const adjGender = adj.morph.Gender;
                const adjNumber = adj.morph.Number;

                if (nounGender && adjGender && nounGender !== adjGender) {
                    let correctAdj = adj.text;
                    if (nounGender === 'Fem') correctAdj = getFeminineAdjective(adj.lemma);
                    else correctAdj = getMasculineAdjective(adj.lemma);
                    errors.push({
                        type: 'accord_genre',
                        word: adj.text,
                        correction: correctAdj,
                        explanation: `L'adjectif s'accorde en genre avec le nom. Exemple : "une robe bleue" (féminin) et non "une robe bleu".`,
                        offset: adj.idx,
                        length: adj.length,
                        severity: 'medium',
                        confidence: 0.85
                    });
                }
                if (nounNumber && adjNumber && nounNumber !== adjNumber) {
                    let correctAdj = adj.text;
                    if (nounNumber === 'Plur') correctAdj = getPluralNoun(adj.lemma);
                    else correctAdj = getSingularNoun(adj.lemma);
                    errors.push({
                        type: 'accord_nombre',
                        word: adj.text,
                        correction: correctAdj,
                        explanation: `L'adjectif s'accorde en nombre avec le nom. Exemple : "des robes bleues" (pluriel) et non "des robes bleue".`,
                        offset: adj.idx,
                        length: adj.length,
                        severity: 'medium',
                        confidence: 0.85
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'accord_couleur',
        description: 'Accord des adjectifs de couleur (simples vs composés)',
        example: '❌ "des rubans oranges" (si "orange" est invariable) → ✅ "des rubans orange" ; mais "des fleurs roses" (car "rose" s\'accorde)',
        pattern: [
            { 'RIGHT_ID': 'color', 'RIGHT_ATTRS': { 'POS': 'ADJ', 'TEXT': { 'IN': ['orange', 'marron', 'pourpre', 'écarlate', 'fauve', 'incarnat', 'mauve', 'rose'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const color = doc[match[1]];
                const noun = doc[color.i - 1];
                if (noun && noun.pos === 'NOUN') {
                    const nounNumber = noun.morph.Number;
                    const invariables = ['orange', 'marron', 'pourpre', 'écarlate', 'fauve', 'incarnat', 'mauve', 'rose'];
                    if (invariables.includes(color.lemma) && color.text.endsWith('s') && nounNumber === 'Plur') {
                        errors.push({
                            type: 'couleur_invariable',
                            word: color.text,
                            correction: color.lemma,
                            explanation: `Les adjectifs de couleur issus de noms (orange, marron, pourpre, etc.) sont généralement invariables. Exemple : "des rubans orange" (et non "oranges"). En revanche, des adjectifs comme "rose", "mauve", "écarlate" s'accordent.`,
                            offset: color.idx,
                            length: color.length,
                            severity: 'low',
                            confidence: 0.9
                        });
                    }
                }
            });
            return errors;
        }
    },
    // ===== EMPLOI DES MODES ET TEMPS =====
    {
        name: 'apres_que_indicatif',
        description: 'Après "après que", on emploie l\'indicatif, non le subjonctif',
        example: '❌ "Après qu\'il ait mangé" → ✅ "Après qu\'il a mangé"',
        pattern: [
            { 'RIGHT_ID': 'apres_que', 'RIGHT_ATTRS': { 'TEXT': 'après', 'POS': 'ADP' } },
            { 'LEFT_ID': 'apres_que', 'REL_OP': '>', 'RIGHT_ATTRS': { 'TEXT': 'que', 'POS': 'SCONJ' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const apres = doc[match[1]];
                const que = doc[match[2]];
                for (let i = que.i + 1; i < doc.length; i++) {
                    if (doc[i].pos === 'VERB') {
                        const verb = doc[i];
                        if (verb.morph.Mood === 'Sub') {
                            const correctForm = getConjugation(getLemma(verb), verb.morph.Person, verb.morph.Number, 'Pres') || 'indicatif';
                            errors.push({
                                type: 'mode_apres_apres_que',
                                word: verb.text,
                                correction: correctForm,
                                explanation: `Contrairement à "avant que" qui appelle le subjonctif, "après que" exprime un fait accompli et doit être suivi de l'indicatif (ou du conditionnel). Exemple : "Après qu'il a mangé, il est sorti" (et non "après qu'il ait mangé").`,
                                offset: verb.idx,
                                length: verb.length,
                                severity: 'high',
                                confidence: 0.95
                            });
                        }
                        break;
                    }
                }
            });
            return errors;
        }
    },
    {
        name: 'avant_que_subjonctif',
        description: 'Après "avant que", on emploie le subjonctif',
        example: '❌ "Avant qu\'il part" → ✅ "Avant qu\'il parte"',
        pattern: [
            { 'RIGHT_ID': 'avant_que', 'RIGHT_ATTRS': { 'TEXT': 'avant', 'POS': 'ADP' } },
            { 'LEFT_ID': 'avant_que', 'REL_OP': '>', 'RIGHT_ATTRS': { 'TEXT': 'que', 'POS': 'SCONJ' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const avant = doc[match[1]];
                const que = doc[match[2]];
                for (let i = que.i + 1; i < doc.length; i++) {
                    if (doc[i].pos === 'VERB') {
                        const verb = doc[i];
                        if (verb.morph.Mood !== 'Sub') {
                            const correctForm = getConjugation(getLemma(verb), verb.morph.Person, verb.morph.Number, 'Subj') || 'subjonctif';
                            errors.push({
                                type: 'mode_avant_que',
                                word: verb.text,
                                correction: correctForm,
                                explanation: `"Avant que" exprime une éventualité non réalisée et exige le subjonctif. Exemple : "Avant qu'il parte, nous dînerons" (et non "avant qu'il part"). On peut aussi ajouter un "ne" explétif : "avant qu'il ne parte".`,
                                offset: verb.idx,
                                length: verb.length,
                                severity: 'high',
                                confidence: 0.95
                            });
                        }
                        break;
                    }
                }
            });
            return errors;
        }
    },
    {
        name: 'bien_que_subjonctif',
        description: 'Après "bien que", on emploie le subjonctif',
        example: '❌ "Bien qu\'il est riche" → ✅ "Bien qu\'il soit riche"',
        pattern: [
            { 'RIGHT_ID': 'bien_que', 'RIGHT_ATTRS': { 'TEXT': 'bien', 'POS': 'ADV' } },
            { 'LEFT_ID': 'bien_que', 'REL_OP': '>', 'RIGHT_ATTRS': { 'TEXT': 'que', 'POS': 'SCONJ' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const bien = doc[match[1]];
                const que = doc[match[2]];
                for (let i = que.i + 1; i < doc.length; i++) {
                    if (doc[i].pos === 'VERB') {
                        const verb = doc[i];
                        if (verb.morph.Mood !== 'Sub') {
                            const correctForm = getConjugation(getLemma(verb), verb.morph.Person, verb.morph.Number, 'Subj') || 'subjonctif';
                            errors.push({
                                type: 'mode_bien_que',
                                word: verb.text,
                                correction: correctForm,
                                explanation: `"Bien que" marque la concession et est toujours suivi du subjonctif. Exemple : "Bien qu'il soit riche, il est modeste" (et non "bien qu'il est riche").`,
                                offset: verb.idx,
                                length: verb.length,
                                severity: 'high',
                                confidence: 0.95
                            });
                        }
                        break;
                    }
                }
            });
            return errors;
        }
    },
    {
        name: 'pour_que_subjonctif',
        description: 'Après "pour que", on emploie le subjonctif',
        example: '❌ "Pour qu\'il comprend" → ✅ "Pour qu\'il comprenne"',
        pattern: [
            { 'RIGHT_ID': 'pour_que', 'RIGHT_ATTRS': { 'TEXT': 'pour', 'POS': 'ADP' } },
            { 'LEFT_ID': 'pour_que', 'REL_OP': '>', 'RIGHT_ATTRS': { 'TEXT': 'que', 'POS': 'SCONJ' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const pour = doc[match[1]];
                const que = doc[match[2]];
                for (let i = que.i + 1; i < doc.length; i++) {
                    if (doc[i].pos === 'VERB') {
                        const verb = doc[i];
                        if (verb.morph.Mood !== 'Sub') {
                            const correctForm = getConjugation(getLemma(verb), verb.morph.Person, verb.morph.Number, 'Subj') || 'subjonctif';
                            errors.push({
                                type: 'mode_pour_que',
                                word: verb.text,
                                correction: correctForm,
                                explanation: `"Pour que" exprime le but et commande le subjonctif. Exemple : "Il parle fort pour que tout le monde l'entende" (et non "pour que tout le monde entend").`,
                                offset: verb.idx,
                                length: verb.length,
                                severity: 'high',
                                confidence: 0.95
                            });
                        }
                        break;
                    }
                }
            });
            return errors;
        }
    },
    {
        name: 'sans_que_subjonctif',
        description: 'Après "sans que", on emploie le subjonctif',
        example: '❌ "Il est parti sans que je sais" → ✅ "Il est parti sans que je sache"',
        pattern: [
            { 'RIGHT_ID': 'sans_que', 'RIGHT_ATTRS': { 'TEXT': 'sans', 'POS': 'ADP' } },
            { 'LEFT_ID': 'sans_que', 'REL_OP': '>', 'RIGHT_ATTRS': { 'TEXT': 'que', 'POS': 'SCONJ' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const sans = doc[match[1]];
                const que = doc[match[2]];
                for (let i = que.i + 1; i < doc.length; i++) {
                    if (doc[i].pos === 'VERB') {
                        const verb = doc[i];
                        if (verb.morph.Mood !== 'Sub') {
                            const correctForm = getConjugation(getLemma(verb), verb.morph.Person, verb.morph.Number, 'Subj') || 'subjonctif';
                            errors.push({
                                type: 'mode_sans_que',
                                word: verb.text,
                                correction: correctForm,
                                explanation: `"Sans que" exprime l'absence d'une condition et requiert le subjonctif. Exemple : "Il est parti sans que je le sache" (et non "sans que je sais").`,
                                offset: verb.idx,
                                length: verb.length,
                                severity: 'high',
                                confidence: 0.95
                            });
                        }
                        break;
                    }
                }
            });
            return errors;
        }
    },
    {
        name: 'conditionnel_apres_si',
        description: 'Dans une proposition introduite par "si", on n\'emploie pas le conditionnel',
        example: '❌ "Si j\'aurais su" → ✅ "Si j\'avais su"',
        pattern: [
            { 'RIGHT_ID': 'si', 'RIGHT_ATTRS': { 'TEXT': 'si', 'POS': 'SCONJ' } },
            { 'LEFT_ID': 'si', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'Mood': 'Cond' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const si = doc[match[1]];
                const verb = doc[match[2]];
                let correctForm;
                if (verb.morph.Tense === 'Pres') correctForm = getConjugation(getLemma(verb), verb.morph.Person, verb.morph.Number, 'Imp');
                else correctForm = getConjugation(getLemma(verb), verb.morph.Person, verb.morph.Number, 'PQP');
                errors.push({
                    type: 'mode_apres_si',
                    word: verb.text,
                    correction: correctForm,
                    explanation: `Dans une proposition conditionnelle introduite par "si", on n'emploie jamais le conditionnel. On utilise l'indicatif (imparfait ou plus-que-parfait). Exemple : "Si j'avais su, je serais venu" (et non "si j'aurais su").`,
                    offset: verb.idx,
                    length: verb.length,
                    severity: 'high',
                    confidence: 0.95
                });
            });
            return errors;
        }
    },
    // ===== CONFUSIONS COURANTES =====
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
                    explanation: `Avec un nom pluriel, on utilise "ce sont" au lieu de "c'est". Exemple : "Ce sont les enfants" (et non "c'est les enfants").`,
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
        example: '❌ "La maison ou je vis" → ✅ "La maison où je vis" ; ❌ "Je ne sais pas où aller" (correct)',
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
                        explanation: `"ou" (sans accent) est une conjonction de coordination qui exprime une alternative (ex: "fromage ou dessert"). "où" (avec accent) est un adverbe ou pronom relatif indiquant un lieu ou un moment (ex: "la ville où je suis né"). Dans ce contexte, on attend "où".`,
                        offset: token.idx,
                        length: 2,
                        severity: 'medium',
                        confidence: 0.7
                    });
                } else if (text === 'où' && nextToken && (nextToken.pos === 'NOUN' || nextToken.pos === 'ADJ')) {
                    errors.push({
                        type: 'confusion_ou_où',
                        word: 'où',
                        correction: 'ou',
                        explanation: `"où" (avec accent) indique un lieu ou un moment ; "ou" (sans accent) est une conjonction d'alternative. Dans ce contexte, on attend "ou". Exemple : "fromage ou dessert" (et non "fromage où dessert").`,
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
        example: '❌ "Il a à manger" (si c\'est "il a mangé") → ambigu ; mais surtout : ❌ "Il a Paris" → ✅ "Il est à Paris" ; ❌ "Je vais a Paris" → ✅ "Je vais à Paris"',
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
                        explanation: `"a" (sans accent) est le verbe avoir conjugué à la 3e personne du singulier. "à" (avec accent) est une préposition. Devant un infinitif, on utilise "à" (ex: "il commence à pleuvoir") et non "a".`,
                        offset: token.idx,
                        length: 1,
                        severity: 'high',
                        confidence: 0.9
                    });
                } else if (text === 'à' && nextToken && nextToken.pos === 'VERB' && nextToken.morph.VerbForm === 'Fin') {
                    errors.push({
                        type: 'confusion_a_à',
                        word: 'à',
                        correction: 'a',
                        explanation: `"à" (préposition) ne peut précéder un verbe conjugué. On attend le verbe "avoir" : "a". Exemple : "il a mangé" (et non "il à mangé").`,
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
        example: '❌ "Il et grand" → ✅ "Il est grand" ; ❌ "Lui est moi" → ✅ "Lui et moi"',
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
                        explanation: `"et" est une conjonction de coordination (ex: "lui et moi"). "est" est le verbe être (ex: "il est grand"). Dans ce contexte, on attend le verbe "est".`,
                        offset: token.idx,
                        length: 2,
                        severity: 'high',
                        confidence: 0.9
                    });
                } else if (text === 'est' && prevToken && prevToken.pos === 'PRON' && nextToken && nextToken.pos === 'PRON') {
                    errors.push({
                        type: 'confusion_et_est',
                        word: 'est',
                        correction: 'et',
                        explanation: `"est" est le verbe être. "et" est une conjonction de coordination. Dans ce contexte, on attend "et".`,
                        offset: token.idx,
                        length: 3,
                        severity: 'high',
                        confidence: 0.9
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'leur_leurs',
        description: 'Détecte la confusion entre "leur" (pronom personnel) et "leurs" (déterminant possessif)',
        example: '❌ "Je leur donne leurs livres" → ✅ "Je leur donne leurs livres" (correct) ; ❌ "Je donne leurs livres" → ✅ "Je leur donne leurs livres"',
        pattern: [
            { 'RIGHT_ID': 'leur', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['leur', 'leurs'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const token = doc[match[1]];
                const text = token.text;
                const nextToken = doc[token.i + 1];
                if (text === 'leur' && nextToken && nextToken.pos === 'NOUN' && !nextToken.text.endsWith('s')) {
                    errors.push({
                        type: 'confusion_leur_leurs',
                        word: 'leur',
                        correction: 'leurs',
                        explanation: `"leur" est pronom personnel (ex: "je leur donne"). "leurs" est déterminant possessif pluriel (ex: "leurs livres"). Devant un nom pluriel, on utilise "leurs".`,
                        offset: token.idx,
                        length: 4,
                        severity: 'medium',
                        confidence: 0.8
                    });
                } else if (text === 'leurs' && nextToken && nextToken.pos === 'VERB') {
                    errors.push({
                        type: 'confusion_leur_leurs',
                        word: 'leurs',
                        correction: 'leur',
                        explanation: `"leurs" est déterminant possessif pluriel. "leur" est pronom personnel. Devant un verbe, on utilise "leur".`,
                        offset: token.idx,
                        length: 5,
                        severity: 'medium',
                        confidence: 0.8
                    });
                }
            });
            return errors;
        }
    },
    // ===== CONCORDANCE DES TEMPS =====
    {
        name: 'concordance_temps_discours_indirect',
        description: 'Vérifie la concordance des temps dans le discours indirect',
        example: '❌ "Il dit qu\'il viendra." → ✅ "Il dit qu\'il viendra." (correct) ; ❌ "Il a dit qu\'il viendra." → ✅ "Il a dit qu\'il viendrait."',
        pattern: [
            { 'RIGHT_ID': 'intro', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'Tense': 'Past' } } },
            { 'LEFT_ID': 'intro', 'REL_OP': '>', 'RIGHT_ATTRS': { 'TEXT': 'que', 'POS': 'SCONJ' } },
            { 'LEFT_ID': 'intro', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'Tense': 'Fut' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const intro = doc[match[1]];
                const que = doc[match[2]];
                const verb = doc[match[3]];
                // Vérifier que le verbe introducteur est à un temps du passé
                const introTense = intro.morph.Tense;
                if (introTense === 'Past' || introTense === 'Imp' || introTense === 'PQP') {
                    // Le verbe subordonné devrait être au conditionnel présent
                    const correctForm = getConjugation(getLemma(verb), verb.morph.Person, verb.morph.Number, 'Cond');
                    if (correctForm) {
                        errors.push({
                            type: 'concordance_temps',
                            word: verb.text,
                            correction: correctForm,
                            explanation: `Dans le discours indirect, si le verbe introducteur est à un temps du passé, le futur de l'indicatif devient généralement le conditionnel présent. Exemple : "Il a dit qu'il viendrait" (et non "qu'il viendra").`,
                            offset: verb.idx,
                            length: verb.length,
                            severity: 'high',
                            confidence: 0.9
                        });
                    }
                }
            });
            return errors;
        }
    },
    // ===== PHRASE SANS VERBE CONJUGUÉ =====
    // (pas vraiment une erreur, mais on peut suggérer d'ajouter un verbe si le contexte l'exige)
    // On ne fait pas de règle pour ça.
    // ===== COORDINATION ET JUXTAPOSITION =====
    // On pourrait détecter des répétitions de "et" ou des virgules manquantes, déjà traité.
    // ===== PROPOSITIONS SUBORDONNÉES RELATIVES =====
    // Détection d'un relatif sans antécédent clair ?
    {
        name: 'relatif_sans_antecedent',
        description: 'Détecte les pronoms relatifs sans antécédent explicite (sauf cas de "ce qui", "ce que")',
        example: '❌ "J\'ai vu qui arrive." (ambigu) → ✅ "J\'ai vu celui qui arrive." ou "J\'ai vu la personne qui arrive."',
        pattern: [
            { 'RIGHT_ID': 'rel', 'RIGHT_ATTRS': { 'POS': 'PRON', 'TEXT': { 'IN': ['qui', 'que', 'dont', 'où'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const rel = doc[match[1]];
                // Chercher un antécédent nominal avant le relatif
                let antecedent = null;
                for (let i = rel.i - 1; i >= 0; i--) {
                    if (doc[i].pos === 'NOUN' || doc[i].pos === 'PRON') {
                        antecedent = doc[i];
                        break;
                    }
                    if (doc[i].pos === 'VERB') break; // on ne dépasse pas le verbe
                }
                if (!antecedent && rel.text !== 'ce' && doc[rel.i - 1] && doc[rel.i - 1].text !== 'ce') {
                    // Vérifier si c'est "ce qui", "ce que" (accepté)
                    if (rel.i > 0 && doc[rel.i - 1].text === 'ce') return;
                    errors.push({
                        type: 'relatif_sans_antecedent',
                        word: rel.text,
                        correction: 'antécédent + ' + rel.text,
                        explanation: `Un pronom relatif (qui, que, dont, où) doit généralement avoir un antécédent explicite (un nom ou un pronom) pour être clair. Exemple : "J'ai vu la personne qui arrive" (et non "J'ai vu qui arrive").`,
                        offset: rel.idx,
                        length: rel.length,
                        severity: 'medium',
                        confidence: 0.7
                    });
                }
            });
            return errors;
        }
    },
    // ===== EMPLOI DU SUBJONCTIF DANS LES SUBORDONNÉES =====
    // Déjà traité dans le chapitre 2, on ne répète pas.
    // ===== INTERROGATION INDIRECTE SANS "SI" =====
    {
        name: 'interrogation_indirecte_si',
        description: 'Vérifie l\'emploi de "si" dans l\'interrogation indirecte totale',
        example: '❌ "Je me demande est-ce qu\'il vient." → ✅ "Je me demande s\'il vient."',
        pattern: [
            { 'RIGHT_ID': 'intro', 'RIGHT_ATTRS': { 'POS': 'VERB', 'LEMMA': { 'IN': ['demander', 'savoir', 'ignorer', 'voir', 'expliquer'] } } },
            { 'LEFT_ID': 'intro', 'REL_OP': '>', 'RIGHT_ATTRS': { 'TEXT': 'est-ce que', 'POS': 'SCONJ' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const intro = doc[match[1]];
                const estceque = doc[match[2]];
                errors.push({
                    type: 'interrogation_indirecte',
                    word: 'est-ce que',
                    correction: 'si',
                    explanation: `Dans l'interrogation indirecte totale (question fermée), on utilise "si" et non "est-ce que". Exemple : "Je me demande s'il vient" (et non "Je me demande est-ce qu'il vient").`,
                    offset: estceque.idx,
                    length: estceque.length,
                    severity: 'high',
                    confidence: 0.95
                });
            });
            return errors;
        }
    },
    // ===== EXCLAMATION AVEC "QUE" SANS SUBJONCTIF =====
    {
        name: 'exclamation_que_subjonctif',
        description: 'Dans les exclamations avec "que", on utilise souvent le subjonctif',
        example: '❌ "Qu\'il est beau !" (correct, c\'est l\'indicatif) ; mais "Qu\'il vienne !" (souhait) est au subjonctif. Pas vraiment d\'erreur courante.',
        // On ne fait pas de règle car c'est trop contextuel.
    }
];

// ---------------------------------------------------------------------
// RÈGLES DU CHAPITRE 4 : DE LA SYNTAXE AU STYLE (J'ÉCRIS POUR...)
// ---------------------------------------------------------------------

const chapitre4Rules = [
    // Règle 1 : Excès de "je" dans un texte (lettre de motivation, demande)
    {
        name: 'exces_je',
        description: 'Détecte un usage excessif du pronom "je" dans un texte personnel, ce qui peut donner une impression d\'égocentrisme et nuire à la prise en compte du lecteur.',
        example: '❌ "Je pense que je suis compétent, je voudrais vous dire que j\'ai de l\'expérience, je suis motivé." → ✅ "Mon parcours et ma motivation correspondent au poste."',
        pattern: null, // pas de pattern spaCy, on utilisera une fonction directe sur le texte
        action: function(doc, matches) {
            const errors = [];
            const jeTokens = doc.filter(t => t.lemma === 'je' || t.text === 'j\'');
            if (jeTokens.length > 3 && doc.length < 50) {
                // Trop de "je" pour un texte court
                errors.push({
                    type: 'exces_je',
                    word: 'je',
                    correction: 'réduire l\'usage de "je", privilégier des tournures impersonnelles ou centrées sur le lecteur',
                    explanation: `Dans une lettre ou une demande, un excès de "je" peut donner l'impression que vous ne pensez qu'à vous. Essayez de reformuler en mettant en avant les besoins du destinataire. Exemple : au lieu de "je pense que je suis compétent", dites "mes compétences correspondent au poste".`,
                    offset: jeTokens[0].idx,
                    length: jeTokens[jeTokens.length-1].idx + jeTokens[jeTokens.length-1].length - jeTokens[0].idx,
                    severity: 'medium',
                    confidence: 0.6
                });
            }
            return errors;
        }
    },
    // Règle 2 : Absence de formule de politesse dans une lettre (détection de mots-clés)
    {
        name: 'formule_politesse_manquante',
        description: 'Vérifie la présence d\'une formule de politesse en fin de lettre (ex: "je vous prie d\'agréer", "cordialement", "salutations").',
        example: '❌ (fin de lettre sans formule) → ✅ "Je vous prie d\'agréer, Monsieur, mes salutations distinguées."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            const text = doc.text.toLowerCase();
            const formules = ['je vous prie', 'veuillez agréer', 'cordialement', 'salutations', 'bien à vous', 'sincèrement'];
            let found = false;
            for (let f of formules) {
                if (text.includes(f)) {
                    found = true;
                    break;
                }
            }
            if (!found && doc.length > 30) { // seulement pour les textes assez longs
                errors.push({
                    type: 'formule_politesse_manquante',
                    word: 'fin du texte',
                    correction: 'ajouter une formule de politesse',
                    explanation: `Une lettre se termine généralement par une formule de politesse (ex: "Je vous prie d'agréer, Monsieur, l'expression de mes salutations distinguées.").`,
                    offset: doc[doc.length-1].idx + doc[doc.length-1].length,
                    length: 0,
                    severity: 'low',
                    confidence: 0.7
                });
            }
            return errors;
        }
    },
    // Règle 3 : Vocabulaire trop pathétique (détection de mots excessifs)
    {
        name: 'pathos_excessif',
        description: 'Détecte l\'usage de mots trop chargés émotionnellement dans une demande ou une lettre formelle, ce qui peut gêner le lecteur.',
        example: '❌ "J\'ai lutté, souffert, et je mérite ce poste." → ✅ "Mon parcours m\'a permis d\'acquérir de l\'expérience."',
        pattern: [
            { 'RIGHT_ID': 'pathos', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['lutter', 'souffrir', 'désespoir', 'détresse', 'misère', 'combat', 'douleur', 'injustice'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const token = doc[match[1]];
                errors.push({
                    type: 'pathos_excessif',
                    word: token.text,
                    correction: 'remplacer par un vocabulaire plus neutre et concret',
                    explanation: `L'usage de mots trop chargés émotionnellement (pathos) peut indisposer le lecteur. Préférez des formulations factuelles et concrètes. Exemple : au lieu de "j'ai souffert", dites "j'ai traversé des difficultés".`,
                    offset: token.idx,
                    length: token.length,
                    severity: 'medium',
                    confidence: 0.8
                });
            });
            return errors;
        }
    },
    // Règle 4 : Manque de concret (trop d\'abstrait) dans une description ou un argumentaire
    {
        name: 'manque_concret',
        description: 'Détecte une surabondance de mots abstraits sans exemples ou détails concrets.',
        example: '❌ "J\'ai des qualités relationnelles et une grande motivation." → ✅ "J\'ai animé des ateliers pour 20 enfants pendant deux ans."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            // Compter les noms abstraits (liste simplifiée)
            const abstractNouns = ['qualité', 'motivation', 'compétence', 'savoir-être', 'relation', 'expérience', 'valeur', 'principe', 'idée', 'concept', 'notion', 'théorie'];
            let abstractCount = 0;
            doc.forEach(token => {
                if (abstractNouns.includes(token.lemma)) abstractCount++;
            });
            if (abstractCount > 3 && doc.length < 100) {
                errors.push({
                    type: 'manque_concret',
                    word: 'trop d\'abstrait',
                    correction: 'ajouter des exemples concrets, des chiffres, des faits précis',
                    explanation: `Votre texte contient beaucoup de termes abstraits sans illustration concrète. Pour convaincre, appuyez vos dires d'exemples précis, de réalisations, de chiffres.`,
                    offset: doc[0].idx,
                    length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                    severity: 'medium',
                    confidence: 0.6
                });
            }
            return errors;
        }
    },
    // Règle 5 : Absence de structure dans une lettre (pas d\'introduction, pas de conclusion)
    {
        name: 'structure_lettre_manquante',
        description: 'Vérifie qu\'une lettre contient une introduction (ex: "objet", "je vous écris") et une conclusion (formule de politesse).',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            const text = doc.text.toLowerCase();
            const hasIntro = text.includes('objet') || text.includes('je vous écris') || text.includes('je me permets') || text.includes('suite à');
            const hasConclusion = text.includes('je vous prie') || text.includes('veuillez agréer') || text.includes('cordialement');
            if (!hasIntro && doc.length > 30) {
                errors.push({
                    type: 'structure_lettre',
                    word: 'début',
                    correction: 'ajouter une introduction (objet, contexte)',
                    explanation: `Une lettre doit commencer par une introduction claire (raison de l'écrit, référence, objet).`,
                    offset: doc[0].idx,
                    length: 10,
                    severity: 'low',
                    confidence: 0.5
                });
            }
            if (!hasConclusion && doc.length > 30) {
                errors.push({
                    type: 'structure_lettre',
                    word: 'fin',
                    correction: 'ajouter une formule de politesse',
                    explanation: `Une lettre doit se terminer par une formule de politesse.`,
                    offset: doc[doc.length-1].idx + doc[doc.length-1].length,
                    length: 0,
                    severity: 'low',
                    confidence: 0.7
                });
            }
            return errors;
        }
    },
    // Règle 6 : Phrases trop longues et complexes (plus de 30 mots)
    {
        name: 'phrase_trop_longue',
        description: 'Détecte les phrases de plus de 30 mots, qui peuvent nuire à la clarté et fatiguer le lecteur.',
        example: '❌ "Dans le cadre de mes fonctions, j\'ai été amené à superviser une équipe de dix personnes, ce qui m\'a permis de développer des compétences en management, en gestion de projet et en communication, compétences que je souhaite mettre au service de votre entreprise qui, comme je le sais, attache une grande importance à la qualité du service client." → ✅ Scinder en plusieurs phrases.',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            let start = 0;
            for (let i = 0; i < doc.length; i++) {
                if (doc[i].is_sent_start || i === 0) {
                    start = i;
                }
                if (doc[i].is_sent_end || i === doc.length - 1) {
                    const length = i - start + 1;
                    if (length > 30) {
                        const phrase = doc.slice(start, i+1).map(t => t.text).join(' ');
                        errors.push({
                            type: 'phrase_trop_longue',
                            word: phrase.substring(0, 50) + '...',
                            correction: 'scinder en phrases plus courtes',
                            explanation: `Cette phrase fait plus de 30 mots. Les phrases trop longues peuvent perdre le lecteur. Essayez de la couper en plusieurs phrases plus simples.`,
                            offset: doc[start].idx,
                            length: doc[i].idx + doc[i].length - doc[start].idx,
                            severity: 'low',
                            confidence: 0.8
                        });
                    }
                }
            }
            return errors;
        }
    },
    // Règle 7 : Absence de liens logiques dans un texte argumentatif
    {
        name: 'liens_logiques_manquants',
        description: 'Détecte un enchaînement de phrases sans connecteurs logiques (mais, donc, cependant, etc.), ce qui peut rendre le texte confus.',
        example: '❌ "Il pleut. Je prends un parapluie." → ✅ "Il pleut, donc je prends un parapluie."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            const connecteurs = ['mais', 'donc', 'or', 'ni', 'car', 'cependant', 'pourtant', 'toutefois', 'en effet', 'parce que', 'puisque', 'alors', 'ainsi', 'c\'est pourquoi'];
            let phrases = [];
            let start = 0;
            for (let i = 0; i < doc.length; i++) {
                if (doc[i].is_sent_start && i !== 0) {
                    phrases.push({start: start, end: i-1});
                    start = i;
                }
            }
            phrases.push({start: start, end: doc.length-1});
            if (phrases.length >= 3) {
                let hasConnecteur = false;
                for (let p of phrases) {
                    const text = doc.slice(p.start, p.end+1).map(t => t.text).join(' ').toLowerCase();
                    for (let c of connecteurs) {
                        if (text.includes(c)) {
                            hasConnecteur = true;
                            break;
                        }
                    }
                }
                if (!hasConnecteur) {
                    errors.push({
                        type: 'liens_logiques_manquants',
                        word: 'manque de connecteurs',
                        correction: 'ajouter des connecteurs logiques (mais, donc, cependant, etc.) pour relier les idées',
                        explanation: `Votre texte enchaîne les phrases sans liens logiques. Utilisez des connecteurs pour montrer les relations entre les idées (cause, conséquence, opposition...).`,
                        offset: doc[0].idx,
                        length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                        severity: 'medium',
                        confidence: 0.6
                    });
                }
            }
            return errors;
        }
    },
    // Règle 8 : Ton trop direct ou impératif dans une demande polie
    {
        name: 'ton_imperatif_demande',
        description: 'Détecte l\'usage de l\'impératif dans une demande polie (ex: "donnez-moi", "envoyez-moi") et suggère des formes plus courtoises.',
        example: '❌ "Donnez-moi les informations." → ✅ "Pourriez-vous me donner les informations ?"',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'Mood': 'Imp' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                // Vérifier si le contexte est une demande (présence de "je vous prie", "merci de" ?) mais on simplifie
                errors.push({
                    type: 'ton_imperatif',
                    word: verb.text,
                    correction: 'utiliser le conditionnel ou une formule de politesse (ex: "pourriez-vous...", "je vous saurais gré de...")',
                    explanation: `Dans une demande polie, l'impératif peut paraître trop direct. Préférez des tournures plus courtoises comme le conditionnel ("pourriez-vous...") ou "je vous prie de...".`,
                    offset: verb.idx,
                    length: verb.length,
                    severity: 'low',
                    confidence: 0.7
                });
            });
            return errors;
        }
    },
    // Règle 9 : Absence de remerciement dans une lettre de demande
    {
        name: 'remerciement_manquant',
        description: 'Vérifie la présence d\'un remerciement (ex: "je vous remercie", "merci") dans une lettre de demande.',
        example: '❌ (pas de merci) → ✅ "Je vous remercie par avance de votre attention."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            const text = doc.text.toLowerCase();
            if (!text.includes('merci') && !text.includes('remercie') && doc.length > 30) {
                errors.push({
                    type: 'remerciement_manquant',
                    word: 'fin du texte',
                    correction: 'ajouter un remerciement',
                    explanation: `Dans une lettre de demande, il est poli de remercier votre interlocuteur pour son attention ou pour l'aide qu'il pourra apporter.`,
                    offset: doc[doc.length-1].idx + doc[doc.length-1].length,
                    length: 0,
                    severity: 'low',
                    confidence: 0.8
                });
            }
            return errors;
        }
    },
    // Règle 10 : Absence de précisions (dates, lieux) dans un compte rendu
    {
        name: 'absence_precisions_compte_rendu',
        description: 'Détecte un compte rendu sans mention de date, de lieu ou de participants.',
        example: '❌ "Nous avons discuté du projet." → ✅ "Le 15 mars, nous avons discuté du projet avec M. Dupont."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            const text = doc.text.toLowerCase();
            const hasDate = text.match(/\d{1,2}\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|\d{4})/);
            const hasLieu = text.includes('à') && (text.includes('salle') || text.includes('bureau') || text.includes('siège'));
            const hasParticipants = text.includes('participant') || text.includes('présent') || text.includes('assistaient');
            if (!hasDate && !hasLieu && !hasParticipants && doc.length > 20) {
                errors.push({
                    type: 'absence_precisions',
                    word: 'compte rendu',
                    correction: 'ajouter la date, le lieu, les participants',
                    explanation: `Un compte rendu doit préciser le contexte : date, lieu, personnes présentes.`,
                    offset: doc[0].idx,
                    length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                    severity: 'medium',
                    confidence: 0.6
                });
            }
            return errors;
        }
    }
];

// ---------------------------------------------------------------------
// RÈGLES DU CHAPITRE 5 : LEÇONS D'AUTEURS ET DE TEXTES
// ---------------------------------------------------------------------

const chapitre5Rules = [
    // Règle 1 : Description sans point de vue (absence de pronoms personnels ou de modalisateurs)
    {
        name: 'description_sans_point_de_vue',
        description: 'Détecte une description purement objective, sans point de vue, ce qui peut la rendre froide.',
        example: '❌ "La maison a trois fenêtres. Le ciel est bleu." → ✅ "À mes pieds, la maison aux trois fenêtres semblait dormir sous le ciel bleu."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            // Chercher des marques de subjectivité : pronoms personnels, adjectifs évaluatifs, verbes de sentiment
            const subjectif = doc.some(t => t.lemma === 'je' || t.lemma === 'nous' || t.lemma === 'sembler' || t.lemma === 'paraître' || t.lemma === 'trouver' || t.pos === 'ADJ' && t.dep === 'amod');
            if (!subjectif && doc.length > 10) {
                errors.push({
                    type: 'description_sans_point_de_vue',
                    word: 'description',
                    correction: 'intégrer un point de vue (utiliser "je", "nous", ou des adjectifs évaluatifs, des comparaisons)',
                    explanation: `Une description gagne à être incarnée par un point de vue. Au lieu d'une énumération objective, faites sentir la présence d'un observateur, ses impressions.`,
                    offset: doc[0].idx,
                    length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                    severity: 'low',
                    confidence: 0.5
                });
            }
            return errors;
        }
    },
    // Règle 2 : Absence de détails concrets dans une description
    {
        name: 'description_sans_details',
        description: 'Détecte une description trop vague, sans détails sensoriels (vue, ouïe, odorat).',
        example: '❌ "Il y avait un arbre." → ✅ "Un chêne noueux étendait ses branches tordues."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            // Compter les adjectifs qualificatifs et les noms concrets
            const adjectifs = doc.filter(t => t.pos === 'ADJ').length;
            const nomsConcrets = doc.filter(t => t.pos === 'NOUN' && !t.is_stop).length;
            if (adjectifs < 2 && nomsConcrets < 3 && doc.length > 10) {
                errors.push({
                    type: 'description_sans_details',
                    word: 'description',
                    correction: 'ajouter des adjectifs précis, des détails sensoriels (couleurs, formes, sons, odeurs)',
                    explanation: `Votre description manque de détails concrets. Pour rendre la scène vivante, utilisez des adjectifs et des noms précis qui sollicitent les sens du lecteur.`,
                    offset: doc[0].idx,
                    length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                    severity: 'medium',
                    confidence: 0.7
                });
            }
            return errors;
        }
    },
    // Règle 3 : Récit sans repères temporels
    {
        name: 'recit_sans_chronologie',
        description: 'Détecte un récit qui manque de marqueurs temporels (puis, ensuite, le lendemain, etc.).',
        example: '❌ "Il arriva. Il vit une femme. Il lui parla." → ✅ "Il arriva. Puis il vit une femme. Alors il lui parla."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            const marqueurs = ['puis', 'ensuite', 'alors', 'après', 'plus tard', 'le lendemain', 'soudain', 'tout à coup', 'enfin'];
            let found = false;
            const text = doc.text.toLowerCase();
            for (let m of marqueurs) {
                if (text.includes(m)) {
                    found = true;
                    break;
                }
            }
            if (!found && doc.length > 20) {
                errors.push({
                    type: 'recit_sans_chronologie',
                    word: 'récit',
                    correction: 'ajouter des indicateurs de temps pour structurer la narration',
                    explanation: `Un récit doit être ancré dans le temps. Utilisez des marqueurs temporels (puis, ensuite, le lendemain...) pour guider le lecteur.`,
                    offset: doc[0].idx,
                    length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                    severity: 'medium',
                    confidence: 0.6
                });
            }
            return errors;
        }
    },
    // Règle 4 : Absence de présentations des personnages dans un récit
    {
        name: 'personnages_non_presentes',
        description: 'Détecte l\'introduction d\'un nom propre sans présentation préalable (âge, aspect, rôle).',
        example: '❌ "Jean arriva." → ✅ "Jean, un homme d\'une trentaine d\'années, arriva."',
        pattern: [
            { 'RIGHT_ID': 'propn', 'RIGHT_ATTRS': { 'POS': 'PROPN' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const propn = doc[match[1]];
                // Vérifier si le nom propre apparaît pour la première fois et s'il est suivi d'une description
                // On regarde les 5 tokens avant et après
                const before = doc.slice(Math.max(0, propn.i - 5), propn.i).map(t => t.text).join(' ');
                const after = doc.slice(propn.i + 1, Math.min(doc.length, propn.i + 6)).map(t => t.text).join(' ');
                // Si pas de description (pas d'adjectif, pas de virgule explicative)
                if (!after.includes(',') && !after.match(/\s(qui|que|dont)\s/) && !doc.slice(propn.i+1, propn.i+3).some(t => t.pos === 'ADJ')) {
                    errors.push({
                        type: 'personnage_non_presente',
                        word: propn.text,
                        correction: `présenter brièvement ${propn.text} (âge, aspect, rôle) dès son apparition`,
                        explanation: `Quand un personnage apparaît pour la première fois, il est bon de le présenter (âge, physique, fonction) pour que le lecteur puisse se le représenter.`,
                        offset: propn.idx,
                        length: propn.length,
                        severity: 'low',
                        confidence: 0.5
                    });
                }
            });
            return errors;
        }
    },
    // Règle 5 : Commentaire sans citation du texte
    {
        name: 'commentaire_sans_citation',
        description: 'Détecte un commentaire de texte qui n\'inclut pas de citations pour appuyer l\'analyse.',
        example: '❌ "L\'auteur utilise un vocabulaire soutenu." → ✅ "L\'auteur utilise un vocabulaire soutenu, comme dans "il s\'enquit"."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            // Chercher des guillemets ou des italiques (simulés par des guillemets)
            const text = doc.text;
            if (!text.includes('«') && !text.includes('"') && !text.includes('»') && doc.length > 30) {
                errors.push({
                    type: 'commentaire_sans_citation',
                    word: 'commentaire',
                    correction: 'ajouter des citations du texte pour appuyer votre analyse',
                    explanation: `Un commentaire de texte doit s'appuyer sur des citations précises. Sans elles, l'analyse reste vague et non fondée.`,
                    offset: doc[0].idx,
                    length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                    severity: 'medium',
                    confidence: 0.8
                });
            }
            return errors;
        }
    },
    // Règle 6 : Usage excessif du passif dans un rapport (manque de dynamisme)
    {
        name: 'passif_excessif',
        description: 'Détecte une proportion trop élevée de verbes au passif, ce qui alourdit le style.',
        example: '❌ "La décision a été prise par le comité." → ✅ "Le comité a pris la décision."',
        pattern: [
            { 'RIGHT_ID': 'aux_passif', 'RIGHT_ATTRS': { 'POS': 'AUX', 'LEMMA': 'être' } },
            { 'LEFT_ID': 'aux_passif', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'Voice': 'Pass' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            if (matches.length > 3) { // plus de 3 passifs
                errors.push({
                    type: 'passif_excessif',
                    word: 'verbes au passif',
                    correction: 'privilégier la voix active pour plus de dynamisme',
                    explanation: `L'usage répété du passif alourdit le style. Préférez la voix active, plus directe et vivante.`,
                    offset: doc[0].idx,
                    length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                    severity: 'low',
                    confidence: 0.6
                });
            }
            return errors;
        }
    },
    // Règle 7 : Absence d\'adverbes de manière dans une action (manque de précision)
    {
        name: 'action_sans_maniere',
        description: 'Détecte des verbes d\'action sans adverbe de manière, ce qui peut manquer de précision.',
        example: '❌ "Il marcha." → ✅ "Il marcha lentement."',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'POS': 'VERB' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            // On regarde si après le verbe il y a un adverbe en -ment (manière)
            matches.forEach(match => {
                const verb = doc[match[1]];
                const next = doc[verb.i + 1];
                if (next && (next.pos === 'ADV' && next.text.endsWith('ment'))) {
                    // adverbe présent, rien à signaler
                } else {
                    // pas d'adverbe de manière, on pourrait suggérer d'en ajouter
                    // Mais on ne veut pas surcharger, on ne signale que si la phrase est très simple
                    if (verb.i === 0 || doc[verb.i-1].is_sent_start) {
                        errors.push({
                            type: 'action_sans_maniere',
                            word: verb.text,
                            correction: `préciser l'action avec un adverbe de manière (ex: ${verb.text} rapidement, doucement...)`,
                            explanation: `Pour rendre une action plus vivante, vous pouvez ajouter un adverbe de manière qui indique comment elle se déroule.`,
                            offset: verb.idx + verb.length,
                            length: 0,
                            severity: 'low',
                            confidence: 0.3
                        });
                    }
                }
            });
            return errors;
        }
    }
];

// ---------------------------------------------------------------------
// RÈGLES DU CHAPITRE 6 : TROUVER SON STYLE
// ---------------------------------------------------------------------

const chapitre6Rules = [
    // Règle 1 : Répétition excessive d'un même mot (lemme) dans un court intervalle
    {
        name: 'repetition_excessive',
        description: 'Détecte la répétition d\'un même mot (ou lemme) à moins de 10 tokens d\'intervalle, ce qui peut être lourd.',
        example: '❌ "Il a dit qu\'il viendrait, mais il n\'est pas venu." (répétition de "il") → ✅ "Il a annoncé sa venue, mais ne s\'est pas présenté."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            const lemmas = {};
            for (let i = 0; i < doc.length; i++) {
                const token = doc[i];
                const lemma = token.lemma;
                if (token.is_stop || token.pos === 'PUNCT') continue; // ignorer les mots outils
                if (!lemmas[lemma]) {
                    lemmas[lemma] = [];
                }
                lemmas[lemma].push(i);
            }
            for (let lemma in lemmas) {
                const positions = lemmas[lemma];
                for (let j = 1; j < positions.length; j++) {
                    if (positions[j] - positions[j-1] < 10) {
                        // répétition trop proche
                        const token1 = doc[positions[j-1]];
                        const token2 = doc[positions[j]];
                        errors.push({
                            type: 'repetition_excessive',
                            word: lemma,
                            correction: `remplacer une occurrence par un synonyme ou une périphrase`,
                            explanation: `Le mot "${lemma}" est répété à courte distance. Cela peut alourdir le style. Cherchez un synonyme ou reformulez.`,
                            offset: token1.idx,
                            length: token2.idx + token2.length - token1.idx,
                            severity: 'low',
                            confidence: 0.7
                        });
                        break; // une seule alerte par lemme
                    }
                }
            }
            return errors;
        }
    },
    // Règle 2 : Verbes faibles (être, avoir, faire) trop fréquents
    {
        name: 'verbes_faibles',
        description: 'Détecte une surutilisation des verbes "être", "avoir", "faire", qui manquent de précision.',
        example: '❌ "Il a fait un travail." → ✅ "Il a réalisé un travail."',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': { 'IN': ['être', 'avoir', 'faire'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            if (matches.length > doc.length * 0.1) { // plus de 10% des tokens sont ces verbes
                errors.push({
                    type: 'verbes_faibles',
                    word: 'être/avoir/faire',
                    correction: 'remplacer par des verbes plus précis (ex: "effectuer", "réaliser", "se trouver", "posséder")',
                    explanation: `Les verbes "être", "avoir", "faire" sont très généraux. Pour un style plus vivant, utilisez des verbes plus spécifiques.`,
                    offset: doc[0].idx,
                    length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                    severity: 'medium',
                    confidence: 0.6
                });
            }
            return errors;
        }
    },
    // Règle 3 : Trop d\'adverbes en -ment (style lourd)
    {
        name: 'trop_adverbes_ment',
        description: 'Détecte un excès d\'adverbes en -ment, qui peuvent alourdir le style.',
        example: '❌ "Il marcha rapidement, puis il s\'arrêta brusquement." → ✅ "Il pressa le pas, puis s\'arrêta net."',
        pattern: [
            { 'RIGHT_ID': 'adv', 'RIGHT_ATTRS': { 'POS': 'ADV', 'TEXT': { 'REGEX': '.*ment$' } } }
        ],
        action: function(doc, matches) {
            if (matches.length > 3 && doc.length < 100) {
                return [{
                    type: 'trop_adverbes_ment',
                    word: 'adverbes en -ment',
                    correction: 'remplacer certains adverbes par des compléments ou des verbes plus précis',
                    explanation: `Les adverbes en -ment sont utiles, mais leur accumulation peut rendre le style lourd. Variez les formulations.`,
                    offset: doc[0].idx,
                    length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                    severity: 'low',
                    confidence: 0.5
                }];
            }
            return [];
        }
    },
    // Règle 4 : Sons désagréables (cacophonie) – exemple : répétition de "que" ou "qu'"
    {
        name: 'cacophonie_que',
        description: 'Détecte une répétition rapprochée de "que" ou "qu\'", qui peut créer une sonorité désagréable.',
        example: '❌ "Je pense que tu crois que je sais que tu mens." → ✅ "Je pense que tu crois savoir que tu mens."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            let lastIdx = -10;
            for (let i = 0; i < doc.length; i++) {
                if (doc[i].text === 'que' || doc[i].text === 'qu\'') {
                    if (i - lastIdx < 5) {
                        errors.push({
                            type: 'cacophonie_que',
                            word: 'que ... que',
                            correction: 'réduire le nombre de "que" en reformulant (ex: utiliser l\'infinitif, des nominalisations)',
                            explanation: `La répétition rapprochée de "que" crée une cacophonie. Essayez de remplacer certaines subordonnées par des infinitifs ou des noms.`,
                            offset: doc[lastIdx].idx,
                            length: doc[i].idx + doc[i].length - doc[lastIdx].idx,
                            severity: 'low',
                            confidence: 0.6
                        });
                        break;
                    }
                    lastIdx = i;
                }
            }
            return errors;
        }
    },
    // Règle 5 : Usage abusif de "il y a"
    {
        name: 'abus_il_y_a',
        description: 'Détecte une utilisation trop fréquente de la locution "il y a", qui peut être remplacée par des verbes plus précis.',
        example: '❌ "Il y a des gens qui pensent que..." → ✅ "Certains pensent que..."',
        pattern: [
            { 'RIGHT_ID': 'ilya', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['il y a', 'y a'] } } }
        ],
        action: function(doc, matches) {
            if (matches.length > 2) {
                return [{
                    type: 'abus_il_y_a',
                    word: 'il y a',
                    correction: 'remplacer par des tournures plus directes (ex: "existe", "se trouve", "on trouve")',
                    explanation: `"Il y a" est une tournure faible. Préférez des verbes comme "exister", "se trouver", ou reformulez.`,
                    offset: doc[0].idx,
                    length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                    severity: 'low',
                    confidence: 0.6
                }];
            }
            return [];
        }
    },
    // Règle 6 : Absence de variété dans les débuts de phrase (toujours le même sujet)
    {
        name: 'debuts_phrase_monotones',
        description: 'Détecte des phrases qui commencent toujours par le même mot ou le même type de sujet (ex: "Il", "Elle", "On").',
        example: '❌ "Il arriva. Il vit. Il dit." → ✅ "Il arriva. Soudain, il vit. Alors il dit."',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            let premiersMots = [];
            let start = 0;
            for (let i = 0; i < doc.length; i++) {
                if (doc[i].is_sent_start || i === 0) {
                    start = i;
                }
                if (doc[i].is_sent_end || i === doc.length - 1) {
                    const premier = doc[start];
                    premiersMots.push({text: premier.text, idx: start});
                }
            }
            // Compter les occurrences du même premier mot
            const counts = {};
            for (let p of premiersMots) {
                counts[p.text] = (counts[p.text] || 0) + 1;
            }
            for (let mot in counts) {
                if (counts[mot] > premiersMots.length * 0.5 && premiersMots.length > 2) {
                    errors.push({
                        type: 'debuts_phrase_monotones',
                        word: mot,
                        correction: 'varier les débuts de phrases (utiliser des compléments circonstanciels, des adverbes, des subordonnées)',
                        explanation: `Trop de phrases commencent par "${mot}". Variez les constructions pour rendre le texte plus vivant.`,
                        offset: doc[premiersMots.find(p => p.text === mot).idx].idx,
                        length: 10,
                        severity: 'medium',
                        confidence: 0.7
                    });
                    break;
                }
            }
            return errors;
        }
    },
    // Règle 7 : Négation lourde (ne...pas) trop fréquente
    {
        name: 'negation_lourde',
        description: 'Détecte un excès de négations, qui peuvent alourdir le style.',
        example: '❌ "Il n\'a pas vu, n\'a pas entendu, n\'a pas compris." → ✅ "Il est resté sourd et aveugle."',
        pattern: [
            { 'RIGHT_ID': 'ne', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['ne', 'n\''] } } }
        ],
        action: function(doc, matches) {
            if (matches.length > doc.length * 0.05) { // plus de 5% de négations
                return [{
                    type: 'negation_lourde',
                    word: 'ne...pas',
                    correction: 'remplacer certaines négations par des formulations positives ou des antonymes',
                    explanation: `L'accumulation de négations peut rendre le style pesant. Cherchez des formulations positives (ex: "il ignore" au lieu de "il ne sait pas").`,
                    offset: doc[0].idx,
                    length: doc[doc.length-1].idx + doc[doc.length-1].length - doc[0].idx,
                    severity: 'low',
                    confidence: 0.5
                }];
            }
            return [];
        }
    },
    // Règle 8 : Absence d\'ellipse (tout est explicite)
    {
        name: 'absence_ellipse',
        description: 'Détecte un style trop explicite qui pourrait bénéficier d\'ellipses pour alléger.',
        example: '❌ "Il prit son manteau, puis il ouvrit la porte, puis il sortit." → ✅ "Il prit son manteau, ouvrit la porte et sortit."',
        pattern: null,
        action: function(doc, matches) {
            // Détection de répétitions de sujets dans des propositions coordonnées
            const errors = [];
            for (let i = 0; i < doc.length - 2; i++) {
                if (doc[i].pos === 'PRON' && doc[i+1].pos === 'VERB' && doc[i+2] && doc[i+2].text === 'et' && doc[i+3] && doc[i+3].pos === 'PRON' && doc[i+3].text === doc[i].text) {
                    errors.push({
                        type: 'absence_ellipse',
                        word: doc[i].text + ' ... et ' + doc[i+3].text,
                        correction: `supprimer le second sujet (${doc[i+3].text}) après "et"`,
                        explanation: `Vous pouvez éviter de répéter le sujet après "et". L'ellipse du sujet allège la phrase.`,
                        offset: doc[i+3].idx,
                        length: doc[i+3].length,
                        severity: 'low',
                        confidence: 0.8
                    });
                    break;
                }
            }
            return errors;
        }
    }
];

// ---------------------------------------------------------------------
// COLLECTE FINALE DES RÈGLES
// ---------------------------------------------------------------------

// Combiner toutes les règles
const allStyleRules = ponctuationRules.concat(syntaxRules, chapitre4Rules, chapitre5Rules, chapitre6Rules);

console.log(`✅ ${allStyleRules.length} règles personnalisées du style chargées.`);
console.log('📖 Chaque règle inclut une explication détaillée et un exemple illustratif.');

// Export pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = allStyleRules;
} else if (typeof window !== 'undefined') {
    window.styleRules = allStyleRules;
}
