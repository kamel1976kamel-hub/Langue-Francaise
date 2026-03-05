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
        description: 'Verifie le choix de l auxiliaire (être/avoir) pour les verbes pronominaux et certains verbes de mouvement.',
        example: '❌ "j\'ai parti" → ✅ "je suis parti"',
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
    {
        name: 'verbe_payer_y_i',
        description: 'Vérifie l'alternance y / i dans les verbes comme "payer", "essayer".',
        example: '❌ "je paie" ou "je paye" sont corrects ; mais "il paye" est aussi correct. Pas vraiment d'erreur, mais on peut signaler une forme préférée.',
        // On ne fait pas de règle d'erreur, car les deux sont acceptées.
    },
    // ===== CHAPITRE 4 : VERBES DÉFECTIFS =====
    {
        name: 'verbe_defectif_forme_inexistante',
        description: 'Détecte l'emploi d'une forme inexistante pour les verbes défectifs (ex: "paître" n'a pas de passé simple).',
        example: '❌ "il paîtra" (futur de paître, en fait c'est possible mais rare) ; mieux vaut éviter. On se concentre sur des cas flagrants.',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'LEMMA': { 'IN': ['paître', 'bruire', 'frire', 'clore', 'éclore'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                const lemma = verb.lemma;
                // Vérifier si le temps/mode existe pour ce verbe défectif
                if (lemma === 'paître') {
                    if (verb.morph && (verb.morph.Tense === 'PS' || (verb.morph.Tense === 'Fut' && verb.morph.Mood === 'Ind'))) {
                        errors.push({
                            type: 'verbe_defectif',
                            word: verb.text,
                            correction: 'utiliser un autre verbe ou une périphrase',
                            explanation: `Le verbe "paître" n'a pas de passé simple ni de futur simple (on utilise "brouter" ou une périphrase).`,
                            offset: verb.idx,
                            length: verb.length,
                            severity: 'medium',
                            confidence: 0.7
                        });
                    }
                }
                if (lemma === 'bruire') {
                    if (verb.morph && verb.morph.Tense === 'Imp' && verb.morph.Mood === 'Ind') {
                        // bruire a un imparfait : je bruyais, etc. C'est correct.
                    } else if (verb.morph && verb.morph.Tense === 'Pres' && verb.morph.Number === 'Plur' && verb.morph.Person !== '3') {
                        // bruire n'a pas de nous/vous au présent
                        errors.push({
                            type: 'verbe_defectif',
                            word: verb.text,
                            correction: 'utiliser "bruisser"',
                            explanation: `Le verbe "bruire" est défectif : il n'a pas de formes conjuguées à nous/vous au présent. On utilise "bruisser" à la place.`,
                            offset: verb.idx,
                            length: verb.length,
                            severity: 'medium',
                            confidence: 0.7
                        });
                    }
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
// COLLECTE FINALE DES RÈGLES
// ---------------------------------------------------------------------

console.log(`✅ ${conjugaisonRules.length} règles de conjugaison chargées.`);

// Export pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = conjugaisonRules;
} else if (typeof window !== 'undefined') {
    window.conjugaisonRules = conjugaisonRules;
}
