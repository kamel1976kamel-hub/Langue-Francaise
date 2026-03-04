// === RÈGLES PERSONNALISÉES SPACY – L'ORTHOGRAPHE ET SES PIÈGES ===
// Basé sur l'ouvrage "L'orthographe et ses pièges" (Archipoche)
// Version enrichie : chaque règle contient une explication détaillée, un exemple concret
// et une proposition de correction explicite.

console.log('📚 Initialisation des règles personnalisées spaCy – L\'orthographe et ses pièges');

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
// RÈGLES D'ORTHOGRAPHE
// ---------------------------------------------------------------------

const orthographeRules = [
    // ===== CHAPITRE 1 : ACCENTS ET CÉDILLES =====
    {
        name: 'accent_aigu_grave',
        description: 'Vérifie l\'emploi correct des accents aigus et graves',
        example: '❌ "il pére" → ✅ "il père"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const erreursCommunes = [
                { pattern: /\bpére\b/g, correction: 'père', explanation: '"père" prend un accent grave sur le e' },
                { pattern: /\bmére\b/g, correction: 'mère', explanation: '"mère" prend un accent grave sur le e' },
                { pattern: /\bfére\b/g, correction: 'frère', explanation: '"frère" prend un accent grave sur le e' },
                { pattern: /\bsóre\b/g, correction: 'sœur', explanation: '"sœur" prend un accent circonflexe sur le o et un tréma sur le u' },
                { pattern: /\bnoel\b/g, correction: 'noël', explanation: '"noël" prend un tréma sur le e' },
                { pattern: /\bcafe\b/g, correction: 'café', explanation: '"café" prend un accent aigu sur le e' }
            ];
            
            erreursCommunes.forEach(erreur => {
                const matches = text.match(erreur.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'accent',
                            word: match,
                            correction: erreur.correction,
                            explanation: erreur.explanation,
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
    {
        name: 'cedille_manquante',
        description: 'Vérifie la présence de la cédille sous le c devant a, o, u',
        example: '❌ "il commanca" → ✅ "il commença"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const cedilleErreurs = [
                { pattern: /\bcommenca/g, correction: 'commença', explanation: 'Le verbe "commencer" prend une cédille sous le c devant a : "commença"' },
                { pattern: /\bplaca/g, correction: 'plaça', explanation: 'Le verbe "placer" prend une cédille sous le c devant a : "plaça"' },
                { pattern: /\bavanca/g, correction: 'avança', explanation: 'Le verbe "avancer" prend une cédille sous le c devant a : "avança"' },
                { pattern: /\bmenaca/g, correction: 'menaça', explanation: 'Le verbe "menacer" prend une cédille sous le c devant a : "menaça"' }
            ];
            
            cedilleErreurs.forEach(erreur => {
                const matches = text.match(erreur.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'cedille',
                            word: match,
                            correction: erreur.correction,
                            explanation: erreur.explanation,
                            offset: index,
                            length: match.length,
                            severity: 'high',
                            confidence: 0.95
                        });
                    });
                }
            });
            
            return errors;
        }
    },
    // ===== CHAPITRE 2 : ACCORDS =====
    {
        name: 'accord_genre_determinant_nom',
        description: 'Vérifie l\'accord en genre entre déterminant et nom',
        example: '❌ "le fille" → ✅ "la fille"',
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
                            explanation: 'Le déterminant doit s\'accorder en genre avec le nom. Par exemple, "fille" est féminin, donc on dit "la fille".',
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
        name: 'accord_nombre_determinant_nom',
        description: 'Vérifie l\'accord en nombre entre déterminant et nom',
        example: '❌ "le fleurs" → ✅ "les fleurs"',
        pattern: [
            { 'RIGHT_ID': 'det', 'RIGHT_ATTRS': { 'POS': 'DET' } },
            { 'LEFT_ID': 'det', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'NOUN' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const det = doc[match[1]];
                const noun = doc[match[2]];
                const detNumber = det.morph.Number;
                const nounNumber = noun.morph.Number;
                
                if (detNumber && nounNumber && detNumber !== nounNumber) {
                    let correction;
                    if (det.lemma === 'le' && nounNumber === 'Plur') correction = 'les';
                    else if (det.lemma === 'la' && nounNumber === 'Plur') correction = 'les';
                    else if (det.lemma === 'un' && nounNumber === 'Plur') correction = 'des';
                    else if (det.lemma === 'une' && nounNumber === 'Plur') correction = 'des';
                    else correction = det.text;

                    if (correction !== det.text) {
                        errors.push({
                            type: 'accord_nombre',
                            word: det.text + ' ' + noun.text,
                            correction: correction + ' ' + noun.text,
                            explanation: 'Le déterminant doit s\'accorder en nombre avec le nom. Par exemple, "fleurs" est pluriel, donc on dit "les fleurs".',
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
    // ===== CHAPITRE 3 : HOMOPHONES =====
    {
        name: 'homophones_a_ou',
        description: 'Détecte la confusion entre homophones courants',
        example: '❌ "a ou" → ✅ "a où" ou "ah ou"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const homophones = [
                { pattern: /\ba ou\b/g, correction: 'a où', explanation: '"a" est le verbe avoir, "où" indique le lieu. "à" est la préposition.' },
                { pattern: /\bont peu\b/g, correction: 'ont peu', explanation: '"ont" est le verbe avoir, "peu" signifie "pas beaucoup".' },
                { pattern: /\bsont sait\b/g, correction: 'sont sait', explanation: '"sont" est le verbe être, "savoir" se conjugue "sait" au singulier.' },
                { pattern: /\bc est\b/g, correction: 'c\'est', explanation: 'Il faut une apostrophe dans "c\'est" (contraction de "cela est").' },
                { pattern: /\bc est\b/g, correction: 's\'est', explanation: '"s\'est" est le verbe être réfléchi, "c\'est" est la démonstrative.' }
            ];
            
            homophones.forEach(homophone => {
                const matches = text.match(homophone.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'homophone',
                            word: match,
                            correction: homophone.correction,
                            explanation: homophone.explanation,
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
    // ===== CHAPITRE 4 : DOUBLES CONSONNES =====
    {
        name: 'double_consonne',
        description: 'Vérifie l\'emploi correct des doubles consonnes',
        example: '❌ "il arive" → ✅ "il arrive"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            const doubleConsonneErreurs = [
                { pattern: /\barive\b/g, correction: 'arrive', explanation: '"arriver" prend deux r à certaines formes : "il arrive"' },
                { pattern: /\bapeler\b/g, correction: 'appeler', explanation: '"appeler" prend deux p : "j\'appelle"' },
                { pattern: /\betoner\b/g, correction: 'étonner', explanation: '"étonner" prend deux n : "il étonne"' },
                { pattern: /\bataquer\b/g, correction: 'attaquer', explanation: '"attaquer" prend deux t : "il attaque"' },
                { pattern: /\bbalon\b/g, correction: 'ballon', explanation: '"ballon" prend deux l' },
                { pattern: /\bcolon\b/g, correction: 'collon', explanation: '"collon" prend deux l' }
            ];
            
            doubleConsonneErreurs.forEach(erreur => {
                const matches = text.match(erreur.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'double_consonne',
                            word: match,
                            correction: erreur.correction,
                            explanation: erreur.explanation,
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
    // ===== CHAPITRE 5 : MUETTES ET LIAISONS =====
    {
        name: 'liaison_incorrecte',
        description: 'Détecte les liaisons incorrectes ou manquantes',
        example: '❌ "les z-animaux" → ✅ "les animaux"',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            // Liaisons interdites
            const liaisonsInterdites = [
                { pattern: /\bles z-animaux\b/g, correction: 'les animaux', explanation: 'Pas de liaison entre "les" et "animaux" (h aspiré)' },
                { pattern: /\bles z-hommes\b/g, correction: 'les hommes', explanation: 'Pas de liaison entre "les" et "hommes" (h aspiré)' },
                { pattern: /\bun n-ami\b/g, correction: 'un ami', explanation: 'Pas de liaison entre "un" et "ami" (h aspiré)' }
            ];
            
            liaisonsInterdites.forEach(liaison => {
                const matches = text.match(liaison.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'liaison',
                            word: match,
                            correction: liaison.correction,
                            explanation: liaison.explanation,
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
    }
];

// ---------------------------------------------------------------------
// COLLECTE FINALE DES RÈGLES
// ---------------------------------------------------------------------

console.log(`✅ ${orthographeRules.length} règles d\'orthographe chargées.`);

// Export pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = orthographeRules;
} else if (typeof window !== 'undefined') {
    window.orthographeRules = orthographeRules;
}
