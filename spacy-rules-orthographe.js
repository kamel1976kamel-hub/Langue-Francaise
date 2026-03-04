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
// DICTIONNAIRE DES CONFUSIONS ORTHOGRAPHIQUES
// Basé sur la liste alphabétique du chapitre 1
// ---------------------------------------------------------------------

const orthoConfusions = {
    // A
    'abbé': { correction: 'abbé', explanation: 'L\'abbé est un religieux ; abée est une ouverture de moulin.' },
    'abée': { correction: 'abée', explanation: 'L\'abée est une ouverture de moulin ; abbé est un religieux.' },
    'abbesse': { correction: 'abbesse', explanation: 'L\'abbesse dirige une abbaye ; abaisse est une pâte étalée.' },
    'abaisse': { correction: 'abaisse', explanation: 'L\'abaisse est une pâte étalée ; abbesse dirige une abbaye.' },
    'abîme': { correction: 'abîme', explanation: 'Abîme = gouffre (avec accent) ; abyme = procédé artistique (sans).' },
    'abyme': { correction: 'abyme', explanation: 'Abyme = mise en abyme (procédé) ; abîme = gouffre.' },
    'abscisse': { correction: 'abscisse', explanation: 'Abscisse = coordonnée mathématique (s\'écrit ainsi).' },
    'abscons': { correction: 'abscons', explanation: 'Abscons = difficile à comprendre (sans c après s).' },
    'abstrus': { correction: 'abstrus', explanation: 'Abstrus = difficile à comprendre (sans c après s).' },
    'à-côté': { correction: 'à-côté', explanation: 'Un à-côté = ce qui est en plus (avec accent et trait d\'union).' },
    'à-coup': { correction: 'à-coup', explanation: 'Un à-coup = arrêt brusque (avec accent et trait d\'union).' },
    'académie': { correction: 'académie', explanation: 'Académie = institution (un seul c).' },
    'accommodation': { correction: 'accommodation', explanation: 'Accommodation = adaptation (deux c, deux m).' },
    'accommodement': { correction: 'accommodement', explanation: 'Accommodement = arrangement (deux c, deux m).' },
    'accord': { correction: 'accord', explanation: 'Accord = entente (deux c) ; accort = gracieux (deux c, un t).' },
    'accort': { correction: 'accort', explanation: 'Accort = gracieux (deux c, un t) ; accord = entente.' },
    'acquérir': { correction: 'acquérir', explanation: 'Acquérir = obtenir (cqu) ; acquitter = payer (cqu).' },
    'acquiescer': { correction: 'acquiescer', explanation: 'Acquiescer = approuver (cqu, un c).' },
    'acquêt': { correction: 'acquêt', explanation: 'Acquêt = bien acquis pendant le mariage (avec circonflexe).' },
    'acquis': { correction: 'acquis', explanation: 'Acquis = ce qu\'on a acquis (sans t) ; acquit = paiement (avec t).' },
    'acquit': { correction: 'acquit', explanation: 'Acquit = paiement (avec t) ; acquis = ce qu\'on a acquis.' },
    'acre': { correction: 'acre', explanation: 'Acre (fém.) = ancienne mesure ; âcre (adj.) = irritant.' },
    'âcre': { correction: 'âcre', explanation: 'Âcre = irritant (avec accent) ; acre = mesure.' },
    'addiction': { correction: 'addiction', explanation: 'Addiction = dépendance (deux d) ; addition = opération.' },
    'addition': { correction: 'addition', explanation: 'Addition = opération (deux d) ; addiction = dépendance.' },
    'adduction': { correction: 'adduction', explanation: 'Adduction = amenée d\'eau (deux d) ; addiction = dépendance.' },
    'adresse': { correction: 'adresse', explanation: 'Adresse = lieu (un seul d, deux s).' },
    'affaire': { correction: 'affaire', explanation: 'Affaire = chose (deux f) ; afférent = relatif à.' },
    'afférent': { correction: 'afférent', explanation: 'Afférent = relatif à (deux f, un r) ; affaire = chose.' },
    'afféterie': { correction: 'afféterie', explanation: 'Afféterie = affectation (pas d\'accent).' },
    'affligeant': { correction: 'affligeant', explanation: 'Affligeant = pénible (deux f, un g).' },
    'affable': { correction: 'affable', explanation: 'Affable = aimable (deux f).' },
    'affoler': { correction: 'affoler', explanation: 'Affoler = rendre fou (deux f).' },
    'affûter': { correction: 'affûter', explanation: 'Affûter = aiguiser (deux f, accent).' },
    'agonir': { correction: 'agonir', explanation: 'Agonir = accabler (d\'injures) ; agoniser = être à l\'agonie.' },
    'agoniser': { correction: 'agoniser', explanation: 'Agoniser = être à l\'agonie ; agonir = accabler.' },
    'ahan': { correction: 'ahan', explanation: 'Ahan = effort pénible (un h) ; ahuri = stupéfait.' },
    'ahuri': { correction: 'ahuri', explanation: 'Ahuri = stupéfait (h après a) ; ahan = effort.' },
    'ahurissant': { correction: 'ahurissant', explanation: 'Ahurissant = stupéfiant (h après a).' },
    'aine': { correction: 'aine', explanation: 'Aine = région du corps ; haine = aversion.' },
    'haine': { correction: 'haine', explanation: 'Haine = aversion (h aspiré) ; aine = région.' },
    'aire': { correction: 'aire', explanation: 'Aire = surface, nid d\'aigle ; air = vent ; ère = époque.' },
    'air': { correction: 'air', explanation: 'Air = vent ; aire = surface ; ère = époque.' },
    'ère': { correction: 'ère', explanation: 'Ère = époque ; aire = surface ; air = vent.' },
    'alfa': { correction: 'alfa', explanation: 'Alfa = plante ; alpha = lettre grecque.' },
    'alpha': { correction: 'alpha', explanation: 'Alpha = lettre grecque ; alfa = plante.' },
    'alêne': { correction: 'alêne', explanation: 'Alêne = outil de cordonnier ; allène = gaz.' },
    'allène': { correction: 'allène', explanation: 'Allène = gaz ; alêne = outil.' },
    'allaitement': { correction: 'allaitement', explanation: 'Allaitement = action d\'allaiter ; halètement = respiration rapide.' },
    'halètement': { correction: 'halètement', explanation: 'Halètement = respiration rapide (h aspiré) ; allaitement = action d\'allaiter.' },
    'aller': { correction: 'aller', explanation: 'Aller = se déplacer ; hâler = brunir au soleil.' },
    'hâler': { correction: 'hâler', explanation: 'Hâler = brunir au soleil (h aspiré) ; aller = se déplacer.' },
    'allô': { correction: 'allô', explanation: 'Allô = interjection téléphonique (accent) ; halo = cercle lumineux.' },
    'halo': { correction: 'halo', explanation: 'Halo = cercle lumineux ; allô = interjection.' },
    'alvin': { correction: 'alvin', explanation: 'Alvin = relatif au bas-ventre ; alevin = jeune poisson.' },
    'alevin': { correction: 'alevin', explanation: 'Alevin = jeune poisson ; alvin = relatif au bas-ventre.' },
    'amen': { correction: 'amen', explanation: 'Amen = mot invariable (sans accent) ; amène = affable (avec accent).' },
    'amène': { correction: 'amène', explanation: 'Amène = affable (avec accent) ; amen = mot invariable.' },
    'ammoniac': { correction: 'ammoniac', explanation: 'Ammoniac = gaz (avec deux m) ; ammoniaque = liquide.' },
    'ammoniaque': { correction: 'ammoniaque', explanation: 'Ammoniaque = liquide (deux m) ; ammoniac = gaz.' },
    'anal': { correction: 'anal', explanation: 'Anal = relatif à l\'anus ; annales = chroniques annuelles.' },
    'annales': { correction: 'annales', explanation: 'Annales = chroniques annuelles (deux n) ; anal = relatif à l\'anus.' },
    'anche': { correction: 'anche', explanation: 'Anche = languette d\'instrument ; hanche = articulation.' },
    'hanche': { correction: 'hanche', explanation: 'Hanche = articulation (h aspiré) ; anche = languette.' },
    'ancre': { correction: 'ancre', explanation: 'Ancre = objet marin ; encre = liquide à écrire.' },
    'encre': { correction: 'encre', explanation: 'Encre = liquide à écrire ; ancre = objet marin.' },
    'antre': { correction: 'antre', explanation: 'Antre = caverne (masculin) ; entre = préposition.' },
    'entre': { correction: 'entre', explanation: 'Entre = préposition ; antre = caverne.' },
    'aparté': { correction: 'aparté', explanation: 'Aparté = conversation à part (accent) ; a parte = locution latine.' },
    'apex': { correction: 'apex', explanation: 'Apex = sommet ; hapax = mot rare.' },
    'hapax': { correction: 'hapax', explanation: 'Hapax = mot rare (parfois avec h) ; apex = sommet.' },
    'aphélie': { correction: 'aphélie', explanation: 'Aphélie = point éloigné du soleil (ph).' },
    'aphérèse': { correction: 'aphérèse', explanation: 'Aphérèse = suppression de lettre (ph).' },
    'aphone': { correction: 'aphone', explanation: 'Aphone = sans voix (ph).' },
    'aphte': { correction: 'aphte', explanation: 'Aphte = ulcération (ph).' },
    'aphylle': { correction: 'aphylle', explanation: 'Aphylle = sans feuilles (ph).' },
    'apogée': { correction: 'apogée', explanation: 'Apogée = point culminant (masculin).' },
    'appas': { correction: 'appas', explanation: 'Appas = charmes (pluriel, deux p) ; appât = amorce.' },
    'appât': { correction: 'appât', explanation: 'Appât = amorce (singulier, deux p, accent) ; appas = charmes.' },
    'appeler': { correction: 'appeler', explanation: 'Appeler = appeler (deux p, double l à certaines formes) ; épeler = épeler.' },
    'épeler': { correction: 'épeler', explanation: 'Épeler = épeler (accent, un p) ; appeler = appeler.' },
    'apprêt': { correction: 'apprêt', explanation: 'Apprêt = produit pour tissu (deux p, accent) ; après = préposition.' },
    'après': { correction: 'après', explanation: 'Après = préposition ; apprêt = produit.' },
    'a priori': { correction: 'a priori', explanation: 'A priori = locution latine (sans accent).' },
    'a posteriori': { correction: 'a posteriori', explanation: 'A posteriori = locution latine (sans accent).' },
    'a contrario': { correction: 'a contrario', explanation: 'A contrario = locution latine (sans accent).' },
    'aquilon': { correction: 'aquilon', explanation: 'Aquilon = vent du nord ; aquilain = couleur fauve.' },
    'aquilain': { correction: 'aquilain', explanation: 'Aquilain = couleur fauve ; aquilon = vent.' },
    'aquilin': { correction: 'aquilin', explanation: 'Aquilin = en forme de bec d\'aigle.' },
    'ara': { correction: 'ara', explanation: 'Ara = perroquet ; haras = centre équestre.' },
    'haras': { correction: 'haras', explanation: 'Haras = centre équestre (h aspiré) ; ara = perroquet.' },
    'arcanne': { correction: 'arcanne', explanation: 'Arcanne = craie rouge (deux n) ; arcane = secret.' },
    'arcane': { correction: 'arcane', explanation: 'Arcane = secret (un n) ; arcanne = craie.' },
    'archer': { correction: 'archer', explanation: 'Archer = tireur à l\'arc ; archet = baguette de violon.' },
    'archet': { correction: 'archet', explanation: 'Archet = baguette de violon ; archer = tireur.' },
    'aréopage': { correction: 'aréopage', explanation: 'Aréopage = assemblée de savants ; aéroport = port aérien.' },
    'aéroport': { correction: 'aéroport', explanation: 'Aéroport = port aérien ; aréopage = assemblée.' },
    'argutie': { correction: 'argutie', explanation: 'Argutie = argument pointilleux.' },
    'arguer': { correction: 'arguer', explanation: 'Arguer = argumenter (se conjugue).' },
    'arien': { correction: 'arien', explanation: 'Arien = relatif à l\'arianisme (hérésie) ; aryen = relatif aux Aryens.' },
    'aryen': { correction: 'aryen', explanation: 'Aryen = relatif aux Aryens ; arien = hérésie.' },
    'arôme': { correction: 'arôme', explanation: 'Arôme = odeur (accent) ; arum = fleur.' },
    'arum': { correction: 'arum', explanation: 'Arum = fleur ; arôme = odeur.' },
    'arrérages': { correction: 'arrérages', explanation: 'Arrérages = arriérés de paiement (deux r).' },
    'arrhes': { correction: 'arrhes', explanation: 'Arrhes = acompte (deux r, h) ; are = mesure.' },
    'are': { correction: 'are', explanation: 'Are = mesure de surface ; arrhes = acompte.' },
    'as': { correction: 'as', explanation: 'As = carte à jouer ; asse = outil.' },
    'asse': { correction: 'asse', explanation: 'Asse = outil ; as = carte.' },
    'assonance': { correction: 'assonance', explanation: 'Assonance = répétition de sons (un n).' },
    'athée': { correction: 'athée', explanation: 'Athée = qui ne croit pas en Dieu (e final) ; hâter = se dépêcher.' },
    'hâter': { correction: 'hâter', explanation: 'Hâter = se dépêcher (h aspiré) ; athée = sans dieu.' },
    'attraper': { correction: 'attraper', explanation: 'Attraper = saisir (deux t, un p).' },
    'au': { correction: 'au', explanation: 'Au = contraction de à le ; aux = à les ; haut = élevé ; eau = liquide.' },
    'aux': { correction: 'aux', explanation: 'Aux = à les ; au = à le ; haut = élevé ; eau = liquide.' },
    'haut': { correction: 'haut', explanation: 'Haut = élevé (h aspiré) ; au = à le.' },
    'eau': { correction: 'eau', explanation: 'Eau = liquide ; au = à le.' },
    'auspice': { correction: 'auspice', explanation: 'Auspice = présage (masculin) ; hospice = établissement de soin.' },
    'hospice': { correction: 'hospice', explanation: 'Hospice = établissement (h muet) ; auspice = présage.' },
    'autan': { correction: 'autan', explanation: 'Autan = vent du sud ; autant = adverbe de quantité.' },
    'autant': { correction: 'autant', explanation: 'Autant = adverbe de quantité ; autan = vent.' },
    'autel': { correction: 'autel', explanation: 'Autel = table sacrée ; hôtel = établissement d\'hébergement.' },
    'hôtel': { correction: 'hôtel', explanation: 'Hôtel = hébergement (h muet) ; autel = table sacrée.' },
    'avent': { correction: 'avent', explanation: 'Avent = période avant Noël ; avant = préposition.' },
    'avant': { correction: 'avant', explanation: 'Avant = préposition ; avent = période.' },
    'azimut': { correction: 'azimut', explanation: 'Azimut = angle (sans h) ; azimuté = désorienté.' }
};

// ---------------------------------------------------------------------
// RÈGLES D'ORTHOGRAPHE
// ---------------------------------------------------------------------

const orthographeRules = [
    // ===== RÈGLE PRINCIPALE : DÉTECTION DES CONFUSIONS ORTHOGRAPHIQUES =====
    {
        name: 'confusions_orthographiques_complet',
        description: 'Détecte les confusions orthographiques basées sur le dictionnaire complet',
        example: '❌ "abbé" → ✅ "abbé" (selon le contexte)',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            
            // Parcourir toutes les confusions du dictionnaire
            Object.entries(orthoConfusions).forEach(([motErrone, data]) => {
                // Échapper les caractères spéciaux dans la regex mais garder les accents
                const motEscaped = motErrone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(motEscaped, 'gi');
                const matches = text.match(regex);
                
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'confusion_orthographique',
                            word: match,
                            correction: data.correction,
                            explanation: data.explanation,
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
        example: '❌ "le fleur" → ✅ "la fleur"',
        pattern: [
            { 'RIGHT_ID': 'det', 'RIGHT_ATTRS': { 'POS': 'DET' } },
            { 'LEFT_ID': 'det', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'NOUN' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            if (!matches || !Array.isArray(matches)) {
                return errors; // Retourne vide si pas de matches (appel avec text au lieu de doc)
            }
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
            if (!matches || !Array.isArray(matches)) {
                return errors; // Retourne vide si pas de matches (appel avec text au lieu de doc)
            }
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
    },
    // ===== RÈGLES DES CHAPITRES 3, 4 ET 5 =====
    // Règle 1 : Homophones la/là
    {
        name: 'homophone_la_la',
        description: 'Distingue "la" (article) et "là" (adverbe de lieu).',
        example: '❌ "la bas" → ✅ "là bas"',
        pattern: [
            { 'RIGHT_ID': 'word', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['la', 'là'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            if (!matches || !Array.isArray(matches)) {
                return errors; // Retourne vide si pas de matches (appel avec text au lieu de doc)
            }
            matches.forEach(match => {
                const token = doc[match[1]];
                const text = token.text;
                const nextToken = doc[token.i + 1];
                if (text === 'la') {
                    // Si suivi d'un adverbe de lieu, devrait être là
                    if (nextToken && (nextToken.text === 'bas' || nextToken.text === 'haut' || nextToken.text === 'dedans' || nextToken.text === 'dehors')) {
                        errors.push({
                            type: 'homophone_la',
                            word: 'la',
                            correction: 'là',
                            explanation: 'Confusion entre "la" (article) et "là" (adverbe de lieu).',
                            offset: token.idx,
                            length: 2,
                            severity: 'high',
                            confidence: 0.7
                        });
                    }
                } else if (text === 'là') {
                    // Si c'est devant un nom, peut-être article
                    if (nextToken && nextToken.pos === 'NOUN') {
                        errors.push({
                            type: 'homophone_la',
                            word: 'là',
                            correction: 'la',
                            explanation: 'Confusion entre "là" (adverbe) et "la" (article).',
                            offset: token.idx,
                            length: 2,
                            severity: 'high',
                            confidence: 0.7
                        });
                    }
                }
            });
            return errors;
        }
    },
    // Règle 2 : Homophones ce/se
    {
        name: 'homophone_ce_se',
        description: 'Distingue "ce" (démonstratif) et "se" (pronom réfléchi).',
        example: '❌ "il ce lave" → ✅ "il se lave".',
        pattern: [
            { 'RIGHT_ID': 'word', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['ce', 'se'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            if (!matches || !Array.isArray(matches)) {
                return errors; // Retourne vide si pas de matches (appel avec text au lieu de doc)
            }
            matches.forEach(match => {
                const token = doc[match[1]];
                const text = token.text;
                const nextToken = doc[token.i + 1];
                if (text === 'ce') {
                    // Devant un verbe pronominal, devrait être se
                    if (nextToken && nextToken.pos === 'PRON' && (nextToken.text === 'me' || nextToken.text === 'te' || nextToken.text === 'le' || nextToken.text === 'la')) {
                        errors.push({
                            type: 'homophone_ce_se',
                            word: 'ce',
                            correction: 'se',
                            explanation: 'Confusion entre "ce" (démonstratif) et "se" (pronom réfléchi).',
                            offset: token.idx,
                            length: 2,
                            severity: 'high',
                            confidence: 0.8
                        });
                    }
                } else if (text === 'se') {
                    // Devant un nom, devrait être ce
                    if (nextToken && nextToken.pos === 'NOUN') {
                        errors.push({
                            type: 'homophone_ce_se',
                            word: 'se',
                            correction: 'ce',
                            explanation: 'Confusion entre "se" (pronom) et "ce" (démonstratif).',
                            offset: token.idx,
                            length: 2,
                            severity: 'high',
                            confidence: 0.8
                        });
                    }
                }
            });
            return errors;
        }
    },
    // Règle 3 : Préfixes négatifs in-/im-/il-/ir-
    {
        name: 'prefixes_negatifs',
        description: 'Vérifie l\'orthographe des préfixes négatifs in-/im-/il-/ir-',
        example: '❌ "inpossible" → ✅ "impossible"',
        pattern: null,
        action: function(text) {
            const errors = [];
            
            // in- devient im- devant p/b/m
            const regexImp = /\bin[pm]\w*/g;
            const matchesImp = text.match(regexImp);
            if (matchesImp) {
                matchesImp.forEach(match => {
                    const index = text.indexOf(match);
                    const correction = 'im' + match.slice(2);
                    errors.push({
                        type: 'prefixe_negatif',
                        word: match,
                        correction: correction,
                        explanation: 'Le préfixe négatif "in-" devient "im-" devant les lettres p, b, m.',
                        offset: index,
                        length: match.length,
                        severity: 'high',
                        confidence: 0.95
                    });
                });
            }
            
            // in- devient il- devant l
            const regexIl = /\bil\w*/g;
            const matchesIl = text.match(regexIl);
            if (matchesIl) {
                matchesIl.forEach(match => {
                    const index = text.indexOf(match);
                    const correction = 'il' + match.slice(2);
                    errors.push({
                        type: 'prefixe_negatif',
                        word: match,
                        correction: correction,
                        explanation: 'Le préfixe négatif "in-" devient "il-" devant la lettre l.',
                        offset: index,
                        length: match.length,
                        severity: 'high',
                        confidence: 0.95
                    });
                });
            }
            
            // in- devient ir- devant r
            const regexIr = /\bir\w*/g;
            const matchesIr = text.match(regexIr);
            if (matchesIr) {
                matchesIr.forEach(match => {
                    const index = text.indexOf(match);
                    const correction = 'ir' + match.slice(2);
                    errors.push({
                        type: 'prefixe_negatif',
                        word: match,
                        correction: correction,
                        explanation: 'Le préfixe négatif "in-" devient "ir-" devant la lettre r.',
                        offset: index,
                        length: match.length,
                        severity: 'high',
                        confidence: 0.95
                    });
                });
            }
            
            return errors;
        }
    },
    // Règle 4 : Adverbes en -ment
    {
        name: 'adverbes_ment',
        description: 'Vérifie la formation correcte des adverbes en -ment',
        example: '❌ "évidament" → ✅ "évidemment"',
        pattern: null,
        action: function(text) {
            const errors = [];
            const erreursCourantes = [
                { pattern: /\bévidament\b/g, correction: 'évidemment', explanation: 'L\'adverbe "évidemment" vient de "évident" (en -ent) et prend deux "m".' },
                { pattern: /\bprécédament\b/g, correction: 'précédemment', explanation: 'L\'adverbe "précédemment" vient de "précédent" (en -ent) et prend deux "m".' },
                { pattern: /\bcourament\b/g, correction: 'couramment', explanation: 'L\'adverbe "couramment" vient de "courant" (en -ant) et prend deux "m".' },
                { pattern: /\bfréquament\b/g, correction: 'fréquemment', explanation: 'L\'adverbe "fréquemment" vient de "fréquent" (en -ent) et prend deux "m".' }
            ];
            
            erreursCourantes.forEach(erreur => {
                const matches = text.match(erreur.pattern);
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'adverbe_ment',
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
    // Règle 5 : Pluriel des noms en -al
    {
        name: 'pluriel_al_aux',
        description: 'Vérifie le pluriel correct des noms en -al (généralement -aux)',
        example: '❌ "des chevals" → ✅ "des chevaux"',
        pattern: null,
        action: function(text) {
            const errors = [];
            const exceptions = ['aval', 'bal', 'carnaval', 'festival', 'chacal', 'cérémonial', 'étal', 'idéal', 'mistral', 'narval', 'pal', 'récital', 'régal', 'rorqual', 'serval', 'sisal'];
            
            // Détecter les noms en -al au pluriel incorrect
            const regexMauvaisPluriel = /\b(\w+als)\b/g;
            const matches = text.match(regexMauvaisPluriel);
            if (matches) {
                matches.forEach(match => {
                    const singulier = match.slice(0, -3) + 'al';
                    if (!exceptions.includes(singulier)) {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'pluriel_al',
                            word: match,
                            correction: singulier.replace(/al$/, 'aux'),
                            explanation: `La plupart des noms en -al font leur pluriel en -aux. Exemple : ${singulier} → ${singulier.replace(/al$/, 'aux')}.`,
                            offset: index,
                            length: match.length,
                            severity: 'high',
                            confidence: 0.9
                        });
                    }
                });
            }
            
            return errors;
        }
    },
    // Règle 6 : Pluriel des noms en -ou
    {
        name: 'pluriel_ou_oux',
        description: 'Vérifie le pluriel correct des noms en -ou (exceptions en -x)',
        example: '❌ "des chous" → ✅ "des choux"',
        pattern: null,
        action: function(text) {
            const errors = [];
            const exceptionsX = ['bijou', 'caillou', 'chou', 'genou', 'hibou', 'joujou', 'pou', 'ripou'];
            
            // Détecter les noms en -ou au pluriel incorrect
            const regexMauvaisPluriel = /\b(\w+ous)\b/g;
            const matches = text.match(regexMauvaisPluriel);
            if (matches) {
                matches.forEach(match => {
                    const singulier = match.slice(0, -3) + 'ou';
                    if (exceptionsX.includes(singulier)) {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'pluriel_ou',
                            word: match,
                            correction: singulier + 'x',
                            explanation: `Le mot "${singulier}" fait son pluriel en -x (comme bijou, caillou...).`,
                            offset: index,
                            length: match.length,
                            severity: 'high',
                            confidence: 0.9
                        });
                    }
                });
            }
            
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
    module.exports = { orthographeRules, orthoConfusions };
} else if (typeof window !== 'undefined') {
    window.orthographeRules = orthographeRules;
    window.orthoConfusions = orthoConfusions;
}

// Rendre les variables globales pour les tests
global.orthographeRules = orthographeRules;
global.orthoConfusions = orthoConfusions;
