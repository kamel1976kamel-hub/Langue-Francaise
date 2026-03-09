// === RÈGLES PERSONNALISÉES SPACY – LA CONJUGAISON ET SES PIÈGES ===
// Basé sur l'ouvrage "La conjugaison et ses pièges" (Archipoche)
// Version enrichie : chaque règle contient une explication détaillée, un exemple concret
// et une proposition de correction explicite.

console.log('📚 Initialisation des règles personnalisées spaCy – La conjugaison et ses pièges');

// ---------------------------------------------------------------------
// FONCTIONS UTILITAIRES
// ---------------------------------------------------------------------

function getLemma(verb) {
    return verb.lemma || verb.text;
}

function getConjugation(lemma, person, number, tense, mood) {
    // Dictionnaire très simplifié pour quelques verbes fréquents
    const conjug = {
        'être': {
            'Ind': {
                'Pres': {'1Sing': 'suis', '2Sing': 'es', '3Sing': 'est', '1Plur': 'sommes', '2Plur': 'êtes', '3Plur': 'sont'},
                'Fut': {'1Sing': 'serai', '2Sing': 'seras', '3Sing': 'sera', '1Plur': 'serons', '2Plur': 'serez', '3Plur': 'seront'},
                'Imp': {'1Sing': 'étais', '2Sing': 'étais', '3Sing': 'était', '1Plur': 'étions', '2Plur': 'étiez', '3Plur': 'étaient'},
                'PS': {'1Sing': 'fus', '2Sing': 'fus', '3Sing': 'fut', '1Plur': 'fûmes', '2Plur': 'fûtes', '3Plur': 'furent'}
            },
            'Cond': {
                'Pres': {'1Sing': 'serais', '2Sing': 'serais', '3Sing': 'serait', '1Plur': 'serions', '2Plur': 'seriez', '3Plur': 'seraient'}
            },
            'Subj': {
                'Pres': {'1Sing': 'sois', '2Sing': 'sois', '3Sing': 'soit', '1Plur': 'soyons', '2Plur': 'soyez', '3Plur': 'soient'}
            }
        },
        'avoir': {
            'Ind': {
                'Pres': {'1Sing': 'ai', '2Sing': 'as', '3Sing': 'a', '1Plur': 'avons', '2Plur': 'avez', '3Plur': 'ont'},
                'Fut': {'1Sing': 'aurai', '2Sing': 'auras', '3Sing': 'aura', '1Plur': 'aurons', '2Plur': 'aurez', '3Plur': 'auront'},
                'Imp': {'1Sing': 'avais', '2Sing': 'avais', '3Sing': 'avait', '1Plur': 'avions', '2Plur': 'aviez', '3Plur': 'avaient'},
                'PS': {'1Sing': 'eus', '2Sing': 'eus', '3Sing': 'eut', '1Plur': 'eûmes', '2Plur': 'eûtes', '3Plur': 'eurent'}
            },
            'Cond': {
                'Pres': {'1Sing': 'aurais', '2Sing': 'aurais', '3Sing': 'aurait', '1Plur': 'aurions', '2Plur': 'auriez', '3Plur': 'auraient'}
            },
            'Subj': {
                'Pres': {'1Sing': 'aie', '2Sing': 'aies', '3Sing': 'ait', '1Plur': 'ayons', '2Plur': 'ayez', '3Plur': 'aient'}
            }
        },
        'aller': {
            'Ind': {
                'Pres': {'1Sing': 'vais', '2Sing': 'vas', '3Sing': 'va', '1Plur': 'allons', '2Plur': 'allez', '3Plur': 'vont'},
                'Fut': {'1Sing': 'irai', '2Sing': 'iras', '3Sing': 'ira', '1Plur': 'irons', '2Plur': 'irez', '3Plur': 'iront'},
                'Imp': {'1Sing': 'allais', '2Sing': 'allais', '3Sing': 'allait', '1Plur': 'allions', '2Plur': 'alliez', '3Plur': 'allaient'}
            },
            'Cond': {
                'Pres': {'1Sing': 'irais', '2Sing': 'irais', '3Sing': 'irait', '1Plur': 'irions', '2Plur': 'iriez', '3Plur': 'iraient'}
            },
            'Subj': {
                'Pres': {'1Sing': 'aille', '2Sing': 'ailles', '3Sing': 'aille', '1Plur': 'allions', '2Plur': 'alliez', '3Plur': 'aillent'}
            }
        },
        'faire': {
            'Ind': {
                'Pres': {'1Sing': 'fais', '2Sing': 'fais', '3Sing': 'fait', '1Plur': 'faisons', '2Plur': 'faites', '3Plur': 'font'},
                'Fut': {'1Sing': 'ferai', '2Sing': 'feras', '3Sing': 'fera', '1Plur': 'ferons', '2Plur': 'ferez', '3Plur': 'feront'},
                'Imp': {'1Sing': 'faisais', '2Sing': 'faisais', '3Sing': 'faisait', '1Plur': 'faisions', '2Plur': 'faisiez', '3Plur': 'faisaient'},
                'PS': {'1Sing': 'fis', '2Sing': 'fis', '3Sing': 'fit', '1Plur': 'fîmes', '2Plur': 'fîtes', '3Plur': 'firent'}
            },
            'Cond': {
                'Pres': {'1Sing': 'ferais', '2Sing': 'ferais', '3Sing': 'ferait', '1Plur': 'ferions', '2Plur': 'feriez', '3Plur': 'feraient'}
            },
            'Subj': {
                'Pres': {'1Sing': 'fasse', '2Sing': 'fasses', '3Sing': 'fasse', '1Plur': 'fassions', '2Plur': 'fassiez', '3Plur': 'fassent'}
            }
        }
    };
    if (!conjug[lemma]) return null;
    if (!conjug[lemma][mood]) return null;
    if (!conjug[lemma][mood][tense]) return null;
    const key = person + number.charAt(0).toUpperCase() + number.slice(1);
    return conjug[lemma][mood][tense][key] || null;
}

function isVowel(c) {
    return 'aeiouyàâäéèêëïîôöùûü'.includes(c.toLowerCase());
}

function getExpectedParticiple(verb, aux) {
    // Retourne le participe passé correct pour quelques verbes courants
    const participes = {
        'ouvrir': 'ouvert',
        'couvrir': 'couvert',
        'offrir': 'offert',
        'souffrir': 'souffert',
        'prendre': 'pris',
        'apprendre': 'appris',
        'comprendre': 'compris',
        'mettre': 'mis',
        'permettre': 'permis',
        'promettre': 'promis',
        'dire': 'dit',
        'écrire': 'écrit',
        'faire': 'fait',
        'voir': 'vu',
        'avoir': 'eu',
        'être': 'été',
        'vouloir': 'voulu',
        'pouvoir': 'pu',
        'savoir': 'su',
        'devoir': 'dû',
        'recevoir': 'reçu',
        'boire': 'bu',
        'croire': 'cru',
        'lire': 'lu',
        'plaire': 'plu',
        'taire': 'tu',
        'connaître': 'connu',
        'paraître': 'paru',
        'naître': 'né',
        'mourir': 'mort',
        'courir': 'couru',
        'vêtir': 'vêtu',
        'asseoir': 'assis',
        'résoudre': 'résolu',
        'absoudre': 'absous',
        'dissoudre': 'dissous'
    };
    return participes[verb] || null;
}

// ---------------------------------------------------------------------
// RÈGLES DE CONJUGAISON
// ---------------------------------------------------------------------

const conjugaisonRules = [
    // ===== CHAPITRE 1 : SAVOIRS DE BASE =====
    {
        name: 'groupe_verbe_terminaison',
        description: 'Vérifie que la terminaison du verbe correspond à son groupe (1er groupe : -er, sauf aller)',
        example: '❌ "il aller" → ✅ "il va" ou "il allait" selon le temps',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'POS': 'VERB', 'TEXT': { 'REGEX': '.*er$' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                // Vérifier que le verbe n'est pas à l'infinitif employé comme verbe conjugué
                // On regarde s'il y a un sujet avant et si le verbe est à une forme finie
                if (verb.i > 0 && doc[verb.i-1].pos === 'PRON' && verb.morph && verb.morph.VerbForm !== 'Inf') {
                    // C'est probablement une erreur de conjugaison (ex: "je parler" au lieu de "je parle")
                    const subject = doc[verb.i-1];
                    let correctForm = null;
                    if (subject.lemma === 'je' || subject.lemma === 'il' || subject.lemma === 'elle') {
                        correctForm = verb.lemma.replace(/er$/, 'e'); // simplification
                    } else if (subject.lemma === 'tu') {
                        correctForm = verb.lemma.replace(/er$/, 'es');
                    } else if (subject.lemma === 'nous') {
                        correctForm = verb.lemma.replace(/er$/, 'ons');
                    } else if (subject.lemma === 'vous') {
                        correctForm = verb.lemma.replace(/er$/, 'ez');
                    } else if (subject.lemma === 'ils' || subject.lemma === 'elles') {
                        correctForm = verb.lemma.replace(/er$/, 'ent');
                    }
                    if (correctForm) {
                        errors.push({
                            type: 'groupe_verbe',
                            word: verb.text,
                            correction: correctForm,
                            explanation: `Le verbe "${verb.lemma}" est du 1er groupe. Il doit être conjugué et non laissé à l'infinitif après un sujet. Exemple : "je parle" (et non "je parler").`,
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
    {
        name: 'auxiliaire_etre_avoir',
        description: 'Vérifie le choix de l'auxiliaire (être/avoir) pour les verbes pronominaux et certains verbes de mouvement.',
        example: '❌ "j'ai parti" → ✅ "je suis parti"',
        pattern: [
            { 'RIGHT_ID': 'aux', 'RIGHT_ATTRS': { 'POS': 'AUX', 'LEMMA': { 'IN': ['être', 'avoir'] } } },
            { 'LEFT_ID': 'aux', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'VerbForm': 'Part' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            const verbesEtre = ['aller', 'venir', 'partir', 'arriver', 'entrer', 'sortir', 'monter', 'descendre', 'naître', 'mourir', 'rester', 'tomber', 'retourner', 'passer', 'devenir', 'revenir', 'intervenir', 'parvenir', 'provenir', 'survenir', 'advenir'];
            matches.forEach(match => {
                const aux = doc[match[1]];
                const ppe = doc[match[2]];
                const lemma = ppe.lemma;
                // Vérifier si le verbe est pronominal (présence d'un pronom réfléchi)
                let isPronominal = false;
                for (let i = aux.i - 1; i >= 0; i--) {
                    if (doc[i].pos === 'PRON' && (doc[i].text === 'me' || doc[i].text === 'm\'' || doc[i].text === 'te' || doc[i].text === 't\'' || doc[i].text === 'se' || doc[i].text === 's\'' || doc[i].text === 'nous' || doc[i].text === 'vous')) {
                        isPronominal = true;
                        break;
                    }
                    if (doc[i].pos === 'VERB') break;
                }
                if (isPronominal) {
                    // Les verbes pronominaux se conjuguent avec être
                    if (aux.lemma === 'avoir') {
                        errors.push({
                            type: 'auxiliaire_pronominaux',
                            word: aux.text + ' ' + ppe.text,
                            correction: 'être ' + ppe.text,
                            explanation: `Les verbes pronominaux (comme "se laver") se conjuguent toujours avec l'auxiliaire "être". Exemple : "je me suis lavé" (et non "je m'ai lavé").`,
                            offset: aux.idx,
                            length: ppe.idx + ppe.length - aux.idx,
                            severity: 'high',
                            confidence: 0.95
                        });
                    }
                } else if (verbesEtre.includes(lemma)) {
                    // Ces verbes intransitifs de mouvement se conjuguent avec être
                    if (aux.lemma === 'avoir') {
                        errors.push({
                            type: 'auxiliaire_etre',
                            word: aux.text + ' ' + ppe.text,
                            correction: 'être ' + ppe.text,
                            explanation: `Le verbe "${lemma}" se conjugue avec l'auxiliaire "être" aux temps composés. Exemple : "je suis parti" (et non "j'ai parti").`,
                            offset: aux.idx,
                            length: ppe.idx + ppe.length - aux.idx,
                            severity: 'high',
                            confidence: 0.9
                        });
                    }
                }
            });
            return errors;
        }
    },
    // ===== CHAPITRE 2 : LES DOUZE VERBES LES PLUS FRÉQUENTS =====
    {
        name: 'futur_conditionnel_confusion',
        description: 'Détecte la confusion entre le futur simple et le conditionnel présent (terminaisons -ai / -ais).',
        example: '❌ "demain, je ferais" (si c'est un projet certain) → ✅ "demain, je ferai"',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'Mood': { 'IN': ['Ind', 'Cond'] } } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            // On cherche des indices temporels (demain, hier) pour déterminer si le conditionnel est inapproprié
            const hasFutureAdverb = doc.some(t => t.lemma === 'demain' || t.lemma === 'plus tard' || t.text === 'futur');
            const hasPastAdverb = doc.some(t => t.lemma === 'hier' || t.lemma === 'autrefois');
            matches.forEach(match => {
                const verb = doc[match[1]];
                if (hasFutureAdverb && verb.morph.Mood === 'Cond') {
                    errors.push({
                        type: 'futur_conditionnel',
                        word: verb.text,
                        correction: verb.lemma + 'ai' /* simplification */,
                        explanation: `Avec un indicateur de futur ("demain"), on utilise le futur simple (terminaison -ai, -as, -a...) et non le conditionnel présent (terminaison -ais, -ais, -ait...). Exemple : "demain je ferai" (et non "je ferais").`,
                        offset: verb.idx,
                        length: verb.length,
                        severity: 'medium',
                        confidence: 0.7
                    });
                }
                if (hasPastAdverb && verb.morph.Mood === 'Ind' && verb.morph.Tense === 'Fut') {
                    errors.push({
                        type: 'futur_conditionnel',
                        word: verb.text,
                        correction: verb.lemma + 'ais',
                        explanation: `Avec un indicateur de passé ("hier"), on utilise généralement l'imparfait ou le conditionnel, pas le futur.`,
                        offset: verb.idx,
                        length: verb.length,
                        severity: 'medium',
                        confidence: 0.6
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'subjonctif_apres_que',
        description: 'Vérifie l'emploi du subjonctif après certaines locutions (il faut que, bien que, avant que, pour que).',
        example: '❌ "il faut que tu viens" → ✅ "il faut que tu viennes"',
        pattern: [
            { 'RIGHT_ID': 'loc', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['faut', 'bien', 'avant', 'pour', 'sans', 'afin'] } } },
            { 'LEFT_ID': 'loc', 'REL_OP': '>', 'RIGHT_ATTRS': { 'TEXT': 'que', 'POS': 'SCONJ' } },
            { 'LEFT_ID': 'loc', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const loc = doc[match[1]];
                const que = doc[match[2]];
                const verb = doc[match[3]];
                // Liste des locutions exigeant le subjonctif
                const subjonctifTriggers = ['faut', 'bien', 'avant', 'pour', 'sans', 'afin'];
                if (subjonctifTriggers.includes(loc.text) && verb.morph.Mood !== 'Sub') {
                    // On pourrait essayer de trouver la forme correcte du subjonctif, mais c'est complexe
                    errors.push({
                        type: 'subjonctif_manquant',
                        word: verb.text,
                        correction: 'subjonctif',
                        explanation: `Après "${loc.text} que", on emploie le subjonctif. Exemple : "il faut que tu viennes" (et non "tu viens").`,
                        offset: verb.idx,
                        length: verb.length,
                        severity: 'high',
                        confidence: 0.9
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'impératif_va_vas',
        description: 'Vérifie l'orthographe de l'impératif du verbe "aller" : "va" sans s, sauf devant "en" ou "y" où il prend un s euphonique.',
        example: '❌ "vas à l'école" → ✅ "va à l'école" ; mais "vas-y" est correct.',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': 'aller', 'POS': 'VERB', 'MORPH': { 'Mood': 'Imp' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                const nextToken = doc[verb.i + 1];
                if (verb.text === 'vas') {
                    // Vérifier si le mot suivant est "y" ou "en"
                    if (nextToken && (nextToken.text === 'y' || nextToken.text === 'en')) {
                        // Correct (vas-y, vas-en)
                    } else {
                        errors.push({
                            type: 'imperatif_aller',
                            word: 'vas',
                            correction: 'va',
                            explanation: `L'impératif du verbe "aller" à la 2e personne du singulier est "va" (sans s), sauf devant "y" ou "en" où on ajoute un s euphonique pour des raisons de prononciation : "vas-y", "vas-en". Exemple : "va à l'école" (et non "vas à l'école").`,
                            offset: verb.idx,
                            length: 3,
                            severity: 'medium',
                            confidence: 0.95
                        });
                    }
                }
            });
            return errors;
        }
    },
    {
        name: 'participe_passe_irregulier',
        description: 'Détecte les participes passés incorrects pour les verbes irréguliers fréquents.',
        example: '❌ "j'ai ouvri" → ✅ "j'ai ouvert"',
        pattern: [
            { 'RIGHT_ID': 'aux', 'RIGHT_ATTRS': { 'POS': 'AUX', 'LEMMA': { 'IN': ['être', 'avoir'] } } },
            { 'LEFT_ID': 'aux', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'VerbForm': 'Part' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const aux = doc[match[1]];
                const ppe = doc[match[2]];
                const expected = getExpectedParticiple(ppe.lemma, aux.lemma);
                if (expected && ppe.text !== expected) {
                    errors.push({
                        type: 'participe_irregulier',
                        word: ppe.text,
                        correction: expected,
                        explanation: `Le participe passé de "${ppe.lemma}" est "${expected}" (et non "${ppe.text}"). Exemple : "j'ai ouvert" (et non "j'ai ouvri").`,
                        offset: ppe.idx,
                        length: ppe.length,
                        severity: 'high',
                        confidence: 0.9
                    });
                }
            });
            return errors;
        }
    },
    // ===== CHAPITRE 3 : LES CENT VERBES CLÉS =====
    {
        name: 'verbe_ceindre_peindre',
        description: 'Vérifie la conjugaison des verbes en -eindre (peindre, éteindre, etc.) : radical en -ign- au pluriel et à certains temps.',
        example: '❌ "ils peindent" → ✅ "ils peignent"',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': { 'IN': ['peindre', 'éteindre', 'teindre', 'atteindre', 'craindre', 'joindre'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                // Vérifier si le verbe est à la 3e personne du pluriel et devrait être en -gnent
                if (verb.morph && verb.morph.Person === '3' && verb.morph.Number === 'Plur') {
                    if (!verb.text.endsWith('gnent')) {
                        const expected = verb.lemma.replace(/e?indre$/, 'ignent'); // simplification
                        errors.push({
                            type: 'verbe_eindre',
                            word: verb.text,
                            correction: expected,
                            explanation: `Les verbes comme "peindre" ont un radical en -ign- à la 3e personne du pluriel : "ils peignent" (et non "ils peindent").`,
                            offset: verb.idx,
                            length: verb.length,
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
        name: 'verbe_eler_eter_double_consonne',
        description: 'Vérifie l'alternance des consonnes doubles ou de l'accent pour les verbes en -eler, -eter (appeler, jeter, etc.).',
        example: '❌ "il appelle" est correct ; mais "il jète" (au lieu de "il jette") est incorrect.',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': { 'IN': ['appeler', 'jeter', 'rappeler', 'renouveler', 'étiqueter'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                // Pour simplifier, on vérifie la présence d'un seul l ou t quand il en faudrait deux
                if (verb.lemma === 'appeler' || verb.lemma === 'rappeler') {
                    if (verb.text.match(/[^l]el[^l]/) && !verb.text.includes('ell')) {
                        errors.push({
                            type: 'verbe_eler',
                            word: verb.text,
                            correction: verb.text.replace(/el/, 'ell'), // très simplifié
                            explanation: `Le verbe "appeler" double le "l" devant une syllabe muette : "j'appelle", "tu appelles", "il appelle" (et non "j'appèle").`,
                            offset: verb.idx,
                            length: verb.length,
                            severity: 'high',
                            confidence: 0.8
                        });
                    }
                }
                if (verb.lemma === 'jeter') {
                    if (verb.text.match(/[^t]et[^t]/) && !verb.text.includes('ett')) {
                        errors.push({
                            type: 'verbe_eter',
                            word: verb.text,
                            correction: verb.text.replace(/et/, 'ett'),
                            explanation: `Le verbe "jeter" double le "t" devant une syllabe muette : "je jette", "tu jettes", "il jette" (et non "je jète").`,
                            offset: verb.idx,
                            length: verb.length,
                            severity: 'high',
                            confidence: 0.8
                        });
                    }
                }
            });
            return errors;
        }
    },
    {
        name: 'verbe_ceder_accent',
        description: 'Vérifie l'alternance accent aigu / accent grave dans les verbes comme "céder", "accéder".',
        example: '❌ "il cède" est correct ; mais "il céde" serait incorrect.',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': { 'IN': ['céder', 'accéder', 'décéder', 'posséder'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                // Vérifier si le verbe est à une forme où l'accent doit être grave
                if (verb.text.includes('é') && verb.morph && verb.morph.Tense === 'Pres' && verb.morph.Person !== '1' && verb.morph.Person !== '2') {
                    // simplification : on suppose que le e doit devenir è
                    const expected = verb.text.replace('é', 'è');
                    errors.push({
                        type: 'verbe_ceder',
                        word: verb.text,
                        correction: expected,
                        explanation: `Les verbes comme "céder" changent l'accent aigu en accent grave devant une syllabe muette : "il cède" (et non "il céde").`,
                        offset: verb.idx,
                        length: verb.length,
                        severity: 'medium',
                        confidence: 0.8
                    });
                }
            });
            return errors;
        }
    },
    // ===== CHAPITRE 5 : LE VERBE DANS SON CONTEXTE (ACCORDS) =====
    {
        name: 'accord_participe_passe_avec_etre',
        description: 'Vérifie l'accord du participe passé avec le sujet quand l'auxiliaire est "être".',
        example: '❌ "elles sont parti" → ✅ "elles sont parties"',
        pattern: [
            { 'RIGHT_ID': 'aux', 'RIGHT_ATTRS': { 'LEMMA': 'être', 'POS': 'AUX' } },
            { 'LEFT_ID': 'aux', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'VerbForm': 'Part' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const aux = doc[match[1]];
                const ppe = doc[match[2]];
                // Trouver le sujet
                let subject = null;
                for (let i = aux.i - 1; i >= 0; i--) {
                    if (doc[i].dep === 'nsubj' || doc[i].dep === 'csubj') {
                        subject = doc[i];
                        break;
                    }
                }
                if (subject) {
                    const subjectGender = subject.morph.Gender;
                    const subjectNumber = subject.morph.Number;
                    const ppeText = ppe.text;
                    let correctPPE = ppeText;
                    if (subjectNumber === 'Plur' && !ppeText.endsWith('s')) correctPPE += 's';
                    if (subjectGender === 'Fem' && !ppeText.endsWith('e')) correctPPE += 'e';
                    // Gérer les cas où les deux sont nécessaires (ex: parties)
                    if (subjectGender === 'Fem' && subjectNumber === 'Plur' && !ppeText.endsWith('es')) {
                        correctPPE = ppeText + (ppeText.endsWith('e') ? 's' : 'es');
                    }
                    if (correctPPE !== ppeText) {
                        errors.push({
                            type: 'accord_participe_etre',
                            word: ppeText,
                            correction: correctPPE,
                            explanation: `Avec l'auxiliaire "être", le participe passé s'accorde en genre et en nombre avec le sujet. Exemple : "elles sont parties" (et non "parti").`,
                            offset: ppe.idx,
                            length: ppe.length,
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
        name: 'accord_participe_passe_avoir_cod_avant',
        description: 'Accord du participe passé avec avoir quand le COD est placé avant.',
        example: '❌ "les pommes que j'ai mangé" → ✅ "les pommes que j'ai mangées"',
        pattern: [
            { 'RIGHT_ID': 'aux', 'RIGHT_ATTRS': { 'LEMMA': 'avoir', 'POS': 'AUX' } },
            { 'LEFT_ID': 'aux', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'VerbForm': 'Part' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const aux = doc[match[1]];
                const ppe = doc[match[2]];
                // Chercher un pronom COD avant le verbe (le, la, les, que, etc.)
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
                    if (codGender === 'Fem' && codNumber === 'Plur' && !ppeText.endsWith('es')) {
                        correctPPE = ppeText + (ppeText.endsWith('e') ? 's' : 'es');
                    }
                    if (correctPPE !== ppeText) {
                        errors.push({
                            type: 'accord_participe_avoir',
                            word: ppeText,
                            correction: correctPPE,
                            explanation: `Avec l'auxiliaire "avoir", le participe passé s'accorde avec le complément d'objet direct (COD) si celui-ci est placé avant le verbe. Exemple : "les pommes que j'ai mangées" (COD "que" = pommes, féminin pluriel).`,
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
        name: 'accord_participe_verbes_pronominaux',
        description: 'Accord du participe passé des verbes pronominaux.',
        example: '❌ "elles se sont lavé" → ✅ "elles se sont lavées" (si "se" est COD)',
        pattern: [
            { 'RIGHT_ID': 'pron', 'RIGHT_ATTRS': { 'POS': 'PRON', 'TEXT': { 'IN': ['me', 'te', 'se', 'nous', 'vous'] } } },
            { 'LEFT_ID': 'pron', 'REL_OP': '>', 'RIGHT_ATTRS': { 'LEMMA': 'être', 'POS': 'AUX' } },
            { 'LEFT_ID': 'pron', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB', 'MORPH': { 'VerbForm': 'Part' } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const pron = doc[match[1]];
                const aux = doc[match[2]];
                const ppe = doc[match[3]];
                // Il faut déterminer si le pronom est COD ou COI. C'est complexe, on simplifie.
                // On vérifie l'accord avec le sujet si le verbe est essentiellement pronominal ou si le pronom est COD.
                // Pour simplifier, on regarde le genre/nombre du sujet.
                let subject = null;
                for (let i = pron.i - 1; i >= 0; i--) {
                    if (doc[i].dep === 'nsubj') {
                        subject = doc[i];
                        break;
                    }
                }
                if (subject) {
                    const subjectGender = subject.morph.Gender;
                    const subjectNumber = subject.morph.Number;
                    const ppeText = ppe.text;
                    let correctPPE = ppeText;
                    if (subjectNumber === 'Plur' && !ppeText.endsWith('s')) correctPPE += 's';
                    if (subjectGender === 'Fem' && !ppeText.endsWith('e')) correctPPE += 'e';
                    if (subjectGender === 'Fem' && subjectNumber === 'Plur' && !ppeText.endsWith('es')) {
                        correctPPE = ppeText + (ppeText.endsWith('e') ? 's' : 'es');
                    }
                    if (correctPPE !== ppeText) {
                        errors.push({
                            type: 'accord_participe_pronominal',
                            word: ppeText,
                            correction: correctPPE,
                            explanation: `Avec les verbes pronominaux, le participe passé s'accorde avec le sujet si le pronom réfléchi est COD. Exemple : "elles se sont lavées" (et non "lavé").`,
                            offset: ppe.idx,
                            length: ppe.length,
                            severity: 'high',
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
// RÈGLES : VERBES DÉFECTIFS ET FORMES DIFFICILES
// ---------------------------------------------------------------------

const verbesDefectifsRules = [
    // ===== VERBES DÉFECTIFS COURANTS =====
    {
        name: 'defectif_falloir',
        description: 'Vérifie que le verbe "falloir" n'est employé qu'à la 3e personne du singulier (il faut, il fallait, etc.).',
        example: '❌ "je faux" (inexistant) → ✅ "il faut"',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': 'falloir', 'POS': 'VERB' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                // Vérifier si la personne n'est pas la 3e du singulier
                if (verb.morph && (verb.morph.Person !== '3' || verb.morph.Number !== 'Sing')) {
                    errors.push({
                        type: 'defectif_falloir',
                        word: verb.text,
                        correction: 'utiliser seulement la 3e personne du singulier',
                        explanation: `Le verbe "falloir" est impersonnel et défectif : il ne se conjugue qu'à la 3e personne du singulier. Exemple : "il faut", "il fallait", "il faudra".`,
                        offset: verb.idx,
                        length: verb.length,
                        severity: 'high',
                        confidence: 0.95
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'defectif_pleuvoir',
        description: 'Vérifie que le verbe "pleuvoir" n'est employé qu'à la 3e personne du singulier (il pleut).',
        example: '❌ "je pleus" (inexistant) → ✅ "il pleut"',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': 'pleuvoir', 'POS': 'VERB' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                if (verb.morph && (verb.morph.Person !== '3' || verb.morph.Number !== 'Sing')) {
                    errors.push({
                        type: 'defectif_pleuvoir',
                        word: verb.text,
                        correction: 'utiliser seulement la 3e personne du singulier',
                        explanation: `Le verbe "pleuvoir" est impersonnel : il ne se conjugue qu'à la 3e personne du singulier. Exemple : "il pleut", "il pleuvait", "il pleuvra".`,
                        offset: verb.idx,
                        length: verb.length,
                        severity: 'high',
                        confidence: 0.95
                    });
                }
            });
            return errors;
        }
    },
    {
        name: 'defectif_bruire',
        description: 'Vérifie que le verbe "bruire" n'est pas employé à des formes inexistantes (nous/vous au présent, etc.).',
        example: '❌ "nous bruissons" (forme de bruisser) → ✅ utiliser "bruisser" ou une périphrase',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': 'bruire', 'POS': 'VERB' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                // bruire n'a pas de formes à nous/vous au présent
                if (verb.morph && verb.morph.Tense === 'Pres' && verb.morph.Number === 'Plur' && verb.morph.Person !== '3') {
                    errors.push({
                        type: 'defectif_bruire',
                        word: verb.text,
                        correction: 'utiliser le verbe "bruisser" (1er groupe)',
                        explanation: `Le verbe "bruire" est défectif : il n'a pas de formes à nous/vous au présent. On utilise "bruisser" (régulier) à la place. Exemple : "nous bruissons" (de bruisser).`,
                        offset: verb.idx,
                        length: verb.length,
                        severity: 'medium',
                        confidence: 0.8
                    });
                }
            });
            return errors;
        }
    },
    // ===== FORMES DIFFICILES =====
    {
        name: 'verbe_eler_eter',
        description: 'Vérifie l'alternance de la consonne double ou de l'accent pour les verbes en -eler, -eter (appeler, jeter, etc.).',
        example: '❌ "il appelle" est correct ; mais "il jète" (au lieu de "il jette") est incorrect.',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': { 'IN': ['appeler', 'jeter', 'rappeler', 'renouveler', 'étiqueter'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                const lemma = verb.lemma;
                // Règle : devant e muet, on double la consonne (pour appeler, jeter) ou on met un accent (pour acheter)
                if (lemma === 'appeler' || lemma === 'rappeler') {
                    // Formes avec double l
                    if (verb.morph && verb.morph.Tense === 'Pres' && verb.morph.Number === 'Sing') {
                        if (!verb.text.includes('ell')) {
                            const expected = verb.text.replace(/el/, 'ell'); // simplification
                            errors.push({
                                type: 'verbe_eler',
                                word: verb.text,
                                correction: expected,
                                explanation: `Le verbe "appeler" double le "l" devant une syllabe muette : "j'appelle", "tu appelles", "il appelle".`,
                                offset: verb.idx,
                                length: verb.length,
                                severity: 'high',
                                confidence: 0.9
                            });
                        }
                    }
                }
                if (lemma === 'jeter') {
                    if (verb.morph && verb.morph.Tense === 'Pres' && verb.morph.Number === 'Sing') {
                        if (!verb.text.includes('ett')) {
                            const expected = verb.text.replace(/et/, 'ett');
                            errors.push({
                                type: 'verbe_eter',
                                word: verb.text,
                                correction: expected,
                                explanation: `Le verbe "jeter" double le "t" devant une syllabe muette : "je jette", "tu jettes", "il jette".`,
                                offset: verb.idx,
                                length: verb.length,
                                severity: 'high',
                                confidence: 0.9
                            });
                        }
                    }
                }
                if (lemma === 'acheter') {
                    // acheter prend un accent grave
                    if (verb.morph && verb.morph.Tense === 'Pres' && verb.morph.Number === 'Sing') {
                        if (!verb.text.includes('è')) {
                            const expected = verb.text.replace(/e/, 'è');
                            errors.push({
                                type: 'verbe_eler',
                                word: verb.text,
                                correction: expected,
                                explanation: `Le verbe "acheter" prend un accent grave sur le e devant une syllabe muette : "j'achète", "tu achètes", "il achète".`,
                                offset: verb.idx,
                                length: verb.length,
                                severity: 'high',
                                confidence: 0.9
                            });
                        }
                    }
                }
            });
            return errors;
        }
    },
    {
        name: 'verbe_ceder_accent',
        description: 'Vérifie l'alternance accent aigu / accent grave dans les verbes comme "céder", "accéder".',
        example: '❌ "il cède" est correct ; "il céde" est incorrect.',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': { 'IN': ['céder', 'accéder', 'décéder', 'posséder', 'digérer', 'régner'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                // Devant une syllabe muette, le é devient è
                if (verb.morph && verb.morph.Tense === 'Pres' && verb.morph.Number === 'Sing') {
                    if (verb.text.includes('é') && !verb.text.includes('è')) {
                        const expected = verb.text.replace(/é/, 'è');
                        errors.push({
                            type: 'verbe_ceder',
                            word: verb.text,
                            correction: expected,
                            explanation: `Les verbes comme "céder" changent l'accent aigu en accent grave devant une syllabe muette : "il cède" (et non "il céde").`,
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
    {
        name: 'futur_conditionnel_r',
        description: 'Vérifie le doublement du r au futur et au conditionnel pour certains verbes (courir, mourir, etc.).',
        example: '❌ "je courai" → ✅ "je courrai"',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': { 'IN': ['courir', 'mourir', 'acquérir', 'envoyer'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                const lemma = verb.lemma;
                if (verb.morph && (verb.morph.Tense === 'Fut' || (verb.morph.Mood === 'Cond' && verb.morph.Tense === 'Pres'))) {
                    // Ces verbes doublent le r au futur et au conditionnel
                    if (lemma === 'courir' && !verb.text.includes('rr')) {
                        errors.push({
                            type: 'futur_double_r',
                            word: verb.text,
                            correction: 'courr' + verb.text.slice(-3),
                            explanation: `Le verbe "courir" double le r au futur et au conditionnel : "je courrai", "je courrais" (et non "je courai").`,
                            offset: verb.idx,
                            length: verb.length,
                            severity: 'high',
                            confidence: 0.95
                        });
                    }
                    if (lemma === 'mourir' && !verb.text.includes('rr')) {
                        errors.push({
                            type: 'futur_double_r',
                            word: verb.text,
                            correction: 'mourr' + verb.text.slice(-3),
                            explanation: `Le verbe "mourir" double le r au futur et au conditionnel : "je mourrai", "je mourrais".`,
                            offset: verb.idx,
                            length: verb.length,
                            severity: 'high',
                            confidence: 0.95
                        });
                    }
                }
            });
            return errors;
        }
    }
];

// ---------------------------------------------------------------------
// COLLECTE FINALE DES RÈGLES
// ---------------------------------------------------------------------

const allConjugaisonRules = conjugaisonRules.concat(verbesDefectifsRules);

console.log(`✅ ${allConjugaisonRules.length} règles de conjugaison chargées.`);

// Export pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = allConjugaisonRules;
} else if (typeof window !== 'undefined') {
    window.conjugaisonRules = allConjugaisonRules;
}
