// === RÈGLES PERSONNALISÉES SPACY – CHAPITRE 1 : LES PIÈGES DE L'ORTHOGRAPHE DE A À Z ===
// Basé sur le chapitre 1 de "L'orthographe et ses pièges" (Archipoche)
// Version enrichie : chaque règle contient une explication détaillée, un exemple concret
// et une proposition de correction explicite.

console.log('📚 Initialisation des règles personnalisées spaCy – Chapitre 1 (Pièges orthographiques)');

// ---------------------------------------------------------------------
// FONCTIONS UTILITAIRES
// ---------------------------------------------------------------------

function getLemma(word) {
    return word.lemma || word.text;
}

function isVowel(c) {
    return 'aeiouyàâäéèêëïîôöùûü'.includes(c.toLowerCase());
}

// Dictionnaire des confusions orthographiques (mot erroné -> mot correct avec explication)
// Basé sur la liste alphabétique du chapitre 1
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
    'azimut': { correction: 'azimut', explanation: 'Azimut = angle (sans h) ; azimuté = désorienté.' },

    // B
    'baccara': { correction: 'baccara', explanation: 'Baccara = jeu de cartes (un a) ; baccarat = cristal (avec t).' },
    'baccarat': { correction: 'baccarat', explanation: 'Baccarat = cristal (avec t) ; baccara = jeu.' },
    'bai': { correction: 'bai', explanation: 'Bai = couleur du cheval ; baie = fruit, ouverture ; bée = ouvert ; bey = dignitaire.' },
    'baie': { correction: 'baie', explanation: 'Baie = fruit, ouverture ; bai = couleur du cheval.' },
    'bée': { correction: 'bée', explanation: 'Bée = grand ouvert ; bai = couleur du cheval.' },
    'bey': { correction: 'bey', explanation: 'Bey = dignitaire ; bai = couleur.' },
    'baille': { correction: 'baille', explanation: 'Baille = eau (familier) ; bail = contrat de location.' },
    'bail': { correction: 'bail', explanation: 'Bail = contrat de location (pl. baux) ; baille = eau.' },
    'bayer': { correction: 'bayer', explanation: 'Bayer = rêvasser (bayer aux corneilles) ; bailler = donner à bail.' },
    'bailler': { correction: 'bailler', explanation: 'Bailler = donner à bail ; bâiller = ouvrir la bouche.' },
    'bâiller': { correction: 'bâiller', explanation: 'Bâiller = ouvrir la bouche ; bailler = donner.' },
    'bal': { correction: 'bal', explanation: 'Bal = soirée dansante (un l) ; balle = projectile.' },
    'balle': { correction: 'balle', explanation: 'Balle = projectile ; bal = soirée.' },
    'balade': { correction: 'balade', explanation: 'Balade = promenade (un l) ; ballade = poème.' },
    'ballade': { correction: 'ballade', explanation: 'Ballade = poème (deux l) ; balade = promenade.' },
    'balai': { correction: 'balai', explanation: 'Balai = instrument de nettoyage ; ballet = danse.' },
    'ballet': { correction: 'ballet', explanation: 'Ballet = danse ; balai = nettoyage.' },
    'ban': { correction: 'ban', explanation: 'Ban = proclamation ; banc = siège.' },
    'banc': { correction: 'banc', explanation: 'Banc = siège ; ban = proclamation.' },
    'bar': { correction: 'bar', explanation: 'Bar = poisson, débit de boisson ; barre = tige.' },
    'barre': { correction: 'barre', explanation: 'Barre = tige ; bar = poisson.' },
    'bard': { correction: 'bard', explanation: 'Bard = civière ; barre = tige.' },
    'bardeau': { correction: 'bardeau', explanation: 'Bardeau = planche ; bardot = animal.' },
    'bardot': { correction: 'bardot', explanation: 'Bardot = animal ; bardeau = planche.' },
    'basilic': { correction: 'basilic', explanation: 'Basilic = plante ; basilique = église.' },
    'basilique': { correction: 'basilique', explanation: 'Basilique = église ; basilic = plante.' },
    'bas': { correction: 'bas', explanation: 'Bas = opposé à haut ; bât = harnais.' },
    'bât': { correction: 'bât', explanation: 'Bât = harnais ; bas = opposé à haut.' },
    'baume': { correction: 'baume', explanation: 'Baume = pommade ; bôme = espar de bateau.' },
    'bôme': { correction: 'bôme', explanation: 'Bôme = espar de bateau ; baume = pommade.' },
    'bel': { correction: 'bel', explanation: 'Bel = forme de beau devant voyelle.' },
    'bis': { correction: 'bis', explanation: 'Bis = deux fois (s se prononce) ; bis = adjectif (s muet) ; bisse = couleuvre.' },
    'bisse': { correction: 'bisse', explanation: 'Bisse = couleuvre ; bis = deux fois.' },
    'bitte': { correction: 'bitte', explanation: 'Bitte = borne d\'amarrage (deux t) ; bit = unité informatique.' },
    'bit': { correction: 'bit', explanation: 'Bit = unité informatique ; bitte = borne.' },
    'blé': { correction: 'blé', explanation: 'Blé = céréale ; blet = trop mûr.' },
    'blet': { correction: 'blet', explanation: 'Blet = trop mûr (fém. blette) ; blé = céréale.' },
    'bonace': { correction: 'bonace', explanation: 'Bonace = calme plat (un s) ; bonasse = naïf (deux s).' },
    'bonasse': { correction: 'bonasse', explanation: 'Bonasse = naïf (deux s) ; bonace = calme.' },
    'bonhomme': { correction: 'bonhomme', explanation: 'Bonhomme = homme (un n) ; bonshommes = pluriel (n et s).' },
    'bonhomie': { correction: 'bonhomie', explanation: 'Bonhomie = simplicité (un n).' },
    'bonneterie': { correction: 'bonneterie', explanation: 'Bonneterie = fabrication de bonnets (un t).' },
    'boom': { correction: 'boom', explanation: 'Boom = expansion ; boum = bruit, fête.' },
    'boum': { correction: 'boum', explanation: 'Boum = bruit, fête ; boom = expansion.' },
    'bore': { correction: 'bore', explanation: 'Bore = élément chimique ; bord = limite.' },
    'bord': { correction: 'bord', explanation: 'Bord = limite ; bore = élément.' },
    'boss': { correction: 'boss', explanation: 'Boss = chef (anglicisme) ; bosse = protubérance.' },
    'bosse': { correction: 'bosse', explanation: 'Bosse = protubérance ; boss = chef.' },
    'boulot': { correction: 'boulot', explanation: 'Boulot = travail ; bouleau = arbre.' },
    'bouleau': { correction: 'bouleau', explanation: 'Bouleau = arbre ; boulot = travail.' },
    'bourg': { correction: 'bourg', explanation: 'Bourg = village ; bourre = amas de poils.' },
    'bourre': { correction: 'bourre', explanation: 'Bourre = amas de poils ; bourg = village.' },
    'box': { correction: 'box', explanation: 'Box = compartiment ; boxe = sport.' },
    'boxe': { correction: 'boxe', explanation: 'Boxe = sport ; box = compartiment.' },
    'brie': { correction: 'brie', explanation: 'Brie (f.) = région ; brie (m.) = fromage ; bris = action de briser.' },
    'bris': { correction: 'bris', explanation: 'Bris = action de briser ; brie = fromage.' },
    'brique': { correction: 'brique', explanation: 'Brique = matériau ; brick = voilier.' },
    'brick': { correction: 'brick', explanation: 'Brick = voilier ; brique = matériau.' },
    'bric-à-brac': { correction: 'bric-à-brac', explanation: 'Bric-à-brac = désordre (traits d\'union).' },
    'brocart': { correction: 'brocart', explanation: 'Brocart = étoffe ; brocard = raillerie.' },
    'brocard': { correction: 'brocard', explanation: 'Brocard = raillerie ; brocart = étoffe.' },
    'bruire': { correction: 'bruire', explanation: 'Bruire = faire du bruit ; bruisser = bruire (plus récent).' },
    'bruisser': { correction: 'bruisser', explanation: 'Bruisser = bruire (plus récent).' },
    'brut': { correction: 'brut', explanation: 'Brut = nature (adj.) ; brute = personne violente.' },
    'brute': { correction: 'brute', explanation: 'Brute = personne violente ; brut = nature.' },
    'but': { correction: 'but', explanation: 'But = objectif ; butte = élévation de terre.' },
    'butte': { correction: 'butte', explanation: 'Butte = élévation ; but = objectif.' },
    'buter': { correction: 'buter', explanation: 'Buter = heurter ; butter = entourer de terre.' },
    'butter': { correction: 'butter', explanation: 'Butter = entourer de terre (plante) ; buter = heurter.' },

    // C
    'ça': { correction: 'ça', explanation: 'Ça = pronom démonstratif (cela) ; çà = adverbe de lieu (çà et là).' },
    'çà': { correction: 'çà', explanation: 'Çà = adverbe de lieu (çà et là) ; ça = pronom.' },
    'cabillaud': { correction: 'cabillaud', explanation: 'Cabillaud = poisson ; cabillot = cheville en bois.' },
    'cabillot': { correction: 'cabillot', explanation: 'Cabillot = cheville en bois ; cabillaud = poisson.' },
    'caddie': { correction: 'caddie', explanation: 'Caddie = chariot de supermarché (marque) ou porteur de golf.' },
    'caddy': { correction: 'caddy', explanation: 'Caddy = porteur de golf (variante).' },
    'cadran': { correction: 'cadran', explanation: 'Cadran = surface d\'horloge ; quadrant = quart de cercle.' },
    'quadrant': { correction: 'quadrant', explanation: 'Quadrant = quart de cercle ; cadran = horloge.' },
    'cahot': { correction: 'cahot', explanation: 'Cahot = secousse ; chaos = désordre.' },
    'chaos': { correction: 'chaos', explanation: 'Chaos = désordre (ch) ; cahot = secousse.' },
    'cahoteux': { correction: 'cahoteux', explanation: 'Cahoteux = plein de cahots ; chaotique = désordonné.' },
    'chaotique': { correction: 'chaotique', explanation: 'Chaotique = désordonné ; cahoteux = plein de cahots.' },
    'cal': { correction: 'cal', explanation: 'Cal = durillon (pl. cals) ; cale = coin, fond de bateau.' },
    'cale': { correction: 'cale', explanation: 'Cale = coin, fond ; cal = durillon.' },
    'canaux': { correction: 'canaux', explanation: 'Canaux = pluriel de canal ; canot = petite barque.' },
    'canot': { correction: 'canot', explanation: 'Canot = petite barque ; canaux = canaux.' },
    'cane': { correction: 'cane', explanation: 'Cane = femelle du canard ; canne = bâton.' },
    'canne': { correction: 'canne', explanation: 'Canne = bâton ; cane = canard.' },
    'caner': { correction: 'caner', explanation: 'Caner = flancher (un n) ; canner = garnir de cannage.' },
    'canner': { correction: 'canner', explanation: 'Canner = garnir de cannage (deux n) ; caner = flancher.' },
    'cap': { correction: 'cap', explanation: 'Cap = promontoire ; cape = manteau ; gap = écart.' },
    'cape': { correction: 'cape', explanation: 'Cape = manteau ; cap = promontoire.' },
    'gap': { correction: 'gap', explanation: 'Gap = écart (anglicisme) ; cap = promontoire.' },
    'capital': { correction: 'capital', explanation: 'Capital = essentiel, somme d\'argent ; capitale = ville principale.' },
    'capitale': { correction: 'capitale', explanation: 'Capitale = ville principale ; capital = essentiel.' },
    'car': { correction: 'car', explanation: 'Car = conjonction, autocar ; carre = angle ; quart = quatrième partie.' },
    'carre': { correction: 'carre', explanation: 'Carre = angle ; car = autocar ; quart = quart.' },
    'quart': { correction: 'quart', explanation: 'Quart = quatrième partie ; carre = angle.' },
    'carré': { correction: 'carré', explanation: 'Carré = figure géométrique ; carrée = chambre (familier).' },
    'carrée': { correction: 'carrée', explanation: 'Carrée = chambre (familier) ; carré = figure.' },
    'carte': { correction: 'carte', explanation: 'Carte = plan, document ; quarte = intervalle musical, série de quatre cartes.' },
    'quarte': { correction: 'quarte', explanation: 'Quarte = intervalle musical, série de quatre ; carte = plan.' },
    'kart': { correction: 'kart', explanation: 'Kart = petit véhicule de sport ; carte = plan.' },
    'cartier': { correction: 'cartier', explanation: 'Cartier = fabricant de cartes ; quartier = partie d\'une ville.' },
    'quartier': { correction: 'quartier', explanation: 'Quartier = partie d\'une ville ; cartier = fabricant de cartes.' },
    'cash': { correction: 'cash', explanation: 'Cash = en espèces (anglicisme) ; cache = lieu caché.' },
    'cache': { correction: 'cache', explanation: 'Cache = lieu caché ; cash = espèces.' },
    'cathare': { correction: 'cathare', explanation: 'Cathare = hérétique ; catarrhe = inflammation.' },
    'catarrhe': { correction: 'catarrhe', explanation: 'Catarrhe = inflammation ; cathare = hérétique.' },
    'céans': { correction: 'céans', explanation: 'Céans = ici (maître de céans) ; séant = derrière.' },
    'séant': { correction: 'séant', explanation: 'Séant = derrière ; céans = ici.' },
    'ceint': { correction: 'ceint', explanation: 'Ceint = entouré (part. passé de ceindre) ; sain = en bonne santé.' },
    'sain': { correction: 'sain', explanation: 'Sain = en bonne santé ; ceint = entouré.' },
    'saint': { correction: 'saint', explanation: 'Saint = sacré ; sein = poitrine, intérieur.' },
    'sein': { correction: 'sein', explanation: 'Sein = poitrine ; saint = sacré.' },
    'seing': { correction: 'seing', explanation: 'Seing = signature ; sein = poitrine.' },
    'célébrer': { correction: 'célébrer', explanation: 'Célébrer = fêter ; celebret = autorisation liturgique (sans accent).' },
    'celebret': { correction: 'celebret', explanation: 'Celebret = autorisation liturgique (sans accent) ; célébrer = fêter.' },
    'celer': { correction: 'celer', explanation: 'Celer = cacher ; receler = receler (un l).' },
    'receler': { correction: 'receler', explanation: 'Receler = cacher (un l) ; recéler = variante orthographique.' },
    'céleri': { correction: 'céleri', explanation: 'Céleri = légume (accent aigu) ; cèleri = variante (grave).' },
    'cèleri': { correction: 'cèleri', explanation: 'Cèleri = légume (accent grave) ; céleri = variante.' },
    'sellerie': { correction: 'sellerie', explanation: 'Sellerie = travail du sellier (deux l) ; céleri = légume.' },
    'cellier': { correction: 'cellier', explanation: 'Cellier = local frais (c) ; sellier = artisan (s).' },
    'sellier': { correction: 'sellier', explanation: 'Sellier = artisan (s) ; cellier = local (c).' },
    'cendre': { correction: 'cendre', explanation: 'Cendre = résidu de combustion ; sandre = poisson.' },
    'sandre': { correction: 'sandre', explanation: 'Sandre = poisson ; cendre = résidu.' },
    'cène': { correction: 'cène', explanation: 'Cène = dernier repas du Christ ; scène = lieu de théâtre.' },
    'scène': { correction: 'scène', explanation: 'Scène = lieu de théâtre ; cène = repas.' },
    'senne': { correction: 'senne', explanation: 'Senne = filet de pêche ; scène = théâtre.' },
    'cens': { correction: 'cens', explanation: 'Cens = impôt ; sens = signification.' },
    'sens': { correction: 'sens', explanation: 'Sens = signification ; cens = impôt.' },
    'censé': { correction: 'censé', explanation: 'Censé = supposé ; sensé = qui a du sens.' },
    'sensé': { correction: 'sensé', explanation: 'Sensé = qui a du sens ; censé = supposé.' },
    'cep': { correction: 'cep', explanation: 'Cep = pied de vigne ; cèpe = champignon.' },
    'cèpe': { correction: 'cèpe', explanation: 'Cèpe = champignon ; cep = pied de vigne.' },
    'cerf': { correction: 'cerf', explanation: 'Cerf = animal (f muet) ; serf = paysan (f sonore).' },
    'serf': { correction: 'serf', explanation: 'Serf = paysan ; cerf = animal.' },
    'sert': { correction: 'sert', explanation: 'Sert = verbe servir (3e pers.) ; serre = abri pour plantes.' },
    'serre': { correction: 'serre', explanation: 'Serre = abri pour plantes ; sert = sert.' },
    'certes': { correction: 'certes', explanation: 'Certes = adverbe ; serte = enchâssement.' },
    'serte': { correction: 'serte', explanation: 'Serte = enchâssement ; certes = adverbe.' },
    'cession': { correction: 'cession', explanation: 'Cession = action de céder ; session = période de réunion.' },
    'session': { correction: 'session', explanation: 'Session = période ; cession = cession.' },
    'cétacé': { correction: 'cétacé', explanation: 'Cétacé = mammifère marin (c) ; sétacé = soyeux (s).' },
    'sétacé': { correction: 'sétacé', explanation: 'Sétacé = soyeux ; cétacé = mammifère.' },
    'chacun': { correction: 'chacun', explanation: 'Chacun = pronom (un n) ; chaque = adjectif.' },
    'chaque': { correction: 'chaque', explanation: 'Chaque = adjectif ; chacun = pronom.' },
    'chai': { correction: 'chai', explanation: 'Chai = cave à vin ; chez = préposition.' },
    'chez': { correction: 'chez', explanation: 'Chez = préposition ; chai = cave.' },
    'chaix': { correction: 'chaix', explanation: 'Chaix = indicateur horaire ; chai = cave.' },
    'chaîne': { correction: 'chaîne', explanation: 'Chaîne = lien, canal ; chêne = arbre.' },
    'chêne': { correction: 'chêne', explanation: 'Chêne = arbre ; chaîne = lien.' },
    'champ': { correction: 'champ', explanation: 'Champ = terrain ; chant = mélodie.' },
    'chant': { correction: 'chant', explanation: 'Chant = mélodie ; champ = terrain.' },
    'chape': { correction: 'chape', explanation: 'Chape = couverture ; schappe = déchet de soie.' },
    'schappe': { correction: 'schappe', explanation: 'Schappe = déchet de soie ; chape = couverture.' },
    'chas': { correction: 'chas', explanation: 'Chas = trou d\'aiguille ; chat = animal.' },
    'chat': { correction: 'chat', explanation: 'Chat = animal ; chas = trou.' },
    'chah': { correction: 'chah', explanation: 'Chah = roi d\'Iran (orthographe variable).' },
    'chasse': { correction: 'chasse', explanation: 'Chasse = action de chasser ; châsse = reliquaire.' },
    'châsse': { correction: 'châsse', explanation: 'Châsse = reliquaire ; chasse = action.' },
    'chassie': { correction: 'chassie', explanation: 'Chassie = sécrétion de l\'œil ; châssis = cadre.' },
    'châssis': { correction: 'châssis', explanation: 'Châssis = cadre ; chassie = sécrétion.' },
    'chaud': { correction: 'chaud', explanation: 'Chaud = brûlant ; chaux = matière ; show = spectacle.' },
    'chaux': { correction: 'chaux', explanation: 'Chaux = matière ; chaud = brûlant.' },
    'show': { correction: 'show', explanation: 'Show = spectacle ; chaud = brûlant.' },
    'cheminot': { correction: 'cheminot', explanation: 'Cheminot = employé des chemins de fer ; chemineau = vagabond.' },
    'chemineau': { correction: 'chemineau', explanation: 'Chemineau = vagabond ; cheminot = employé.' },
    'chère': { correction: 'chère', explanation: 'Chère = nourriture (faire bonne chère) ; cher = coûteux, aimé.' },
    'cher': { correction: 'cher', explanation: 'Cher = coûteux, aimé ; chère = nourriture.' },
    'chair': { correction: 'chair', explanation: 'Chair = viande ; chaire = estrade.' },
    'chaire': { correction: 'chaire', explanation: 'Chaire = estrade ; chair = viande.' },
    'chic': { correction: 'chic', explanation: 'Chic = élégant (inv.) ; chique = boule de tabac, bosse.' },
    'chique': { correction: 'chique', explanation: 'Chique = boule de tabac, bosse ; chic = élégant.' },
    'chômage': { correction: 'chômage', explanation: 'Chômage = absence d\'emploi (accent) ; chaumage = coupe du chaume.' },
    'chaumage': { correction: 'chaumage', explanation: 'Chaumage = coupe du chaume ; chômage = absence d\'emploi.' },
    'choper': { correction: 'choper', explanation: 'Choper = attraper (un p) ; chopper = outil préhistorique, moto.' },
    'chopper': { correction: 'chopper', explanation: 'Chopper = outil, moto (deux p) ; choper = attraper.' },
    'choral': { correction: 'choral', explanation: 'Choral = chant religieux (adj. ou nom) ; chorale = groupe de chant.' },
    'chorale': { correction: 'chorale', explanation: 'Chorale = groupe de chant ; choral = chant.' },
    'corral': { correction: 'corral', explanation: 'Corral = enclos pour animaux ; choral = chant.' },
    'ci': { correction: 'ci', explanation: 'Ci = adverbe (ci-gît) ; sis = situé ; scie = outil ; six = chiffre.' },
    'sis': { correction: 'sis', explanation: 'Sis = situé ; ci = adverbe.' },
    'scie': { correction: 'scie', explanation: 'Scie = outil ; ci = adverbe.' },
    'six': { correction: 'six', explanation: 'Six = chiffre ; ci = adverbe.' },
    'cil': { correction: 'cil', explanation: 'Cil = poil de paupière ; scille = plante.' },
    'scille': { correction: 'scille', explanation: 'Scille = plante ; cil = poil.' },
    'cilice': { correction: 'cilice', explanation: 'Cilice = vêtement de pénitence ; silice = roche.' },
    'silice': { correction: 'silice', explanation: 'Silice = roche ; cilice = vêtement.' },
    'cime': { correction: 'cime', explanation: 'Cime = sommet ; cyme = inflorescence.' },
    'cyme': { correction: 'cyme', explanation: 'Cyme = inflorescence ; cime = sommet.' },
    'cire': { correction: 'cire', explanation: 'Cire = substance ; sire = titre.' },
    'sire': { correction: 'sire', explanation: 'Sire = titre ; cire = substance.' },
    'cistre': { correction: 'cistre', explanation: 'Cistre = instrument à cordes ; sistre = instrument à percussion.' },
    'sistre': { correction: 'sistre', explanation: 'Sistre = instrument à percussion ; cistre = à cordes.' },
    'claie': { correction: 'claie', explanation: 'Claie = treillis ; clé = outil.' },
    'clé': { correction: 'clé', explanation: 'Clé = outil ; clef = variante.' },
    'clair': { correction: 'clair', explanation: 'Clair = lumineux ; clerc = lettré.' },
    'clerc': { correction: 'clerc', explanation: 'Clerc = lettré ; clair = lumineux.' },
    'claire-voie': { correction: 'claire-voie', explanation: 'Claire-voie = ouverture ; clair-obscur = contraste.' },
    'clair-obscur': { correction: 'clair-obscur', explanation: 'Clair-obscur = contraste ; claire-voie = ouverture.' },
    'clic-clac': { correction: 'clic-clac', explanation: 'Clic-clac = canapé ; clique = groupe.' },
    'clique': { correction: 'clique', explanation: 'Clique = groupe ; clic-clac = canapé.' },
    'click': { correction: 'click', explanation: 'Click = clic (anglicisme) ; clique = groupe.' },
    'clos': { correction: 'clos', explanation: 'Clos = fermé (adj.) ; clos = enclos (nom) ; clause = disposition.' },
    'clause': { correction: 'clause', explanation: 'Clause = disposition ; clos = fermé.' },
    'coi': { correction: 'coi', explanation: 'Coi = tranquille (fém. coite) ; quoi = pronom.' },
    'quoi': { correction: 'quoi', explanation: 'Quoi = pronom ; coi = tranquille.' },
    'coin': { correction: 'coin', explanation: 'Coin = angle ; coing = fruit.' },
    'coing': { correction: 'coing', explanation: 'Coing = fruit ; coin = angle.' },
    'col': { correction: 'col', explanation: 'Col = cou, passage ; colle = adhésif.' },
    'colle': { correction: 'colle', explanation: 'Colle = adhésif ; col = cou.' },
    'khôl': { correction: 'khôl', explanation: 'Khôl = fard à paupières ; col = cou.' },
    'colérique': { correction: 'colérique', explanation: 'Colérique = coléreux ; cholérique = relatif au choléra.' },
    'cholérique': { correction: 'cholérique', explanation: 'Cholérique = relatif au choléra ; colérique = coléreux.' },
    'colon': { correction: 'colon', explanation: 'Colon = habitant d\'une colonie ; côlon = intestin.' },
    'côlon': { correction: 'côlon', explanation: 'Côlon = intestin ; colon = colon.' },
    'coma': { correction: 'coma', explanation: 'Coma = perte de conscience ; comma = intervalle musical.' },
    'comma': { correction: 'comma', explanation: 'Comma = intervalle musical ; coma = perte de conscience.' },
    'command': { correction: 'command', explanation: 'Command = déclaration en droit ; comment = adverbe.' },
    'comment': { correction: 'comment', explanation: 'Comment = adverbe ; command = terme juridique.' },
    'commande': { correction: 'commande', explanation: 'Commande = ordre ; commende = bénéfice ecclésiastique.' },
    'commende': { correction: 'commende', explanation: 'Commende = bénéfice ecclésiastique ; commande = ordre.' },
    'comptant': { correction: 'comptant', explanation: 'Comptant = en espèces (argent) ; content = satisfait.' },
    'content': { correction: 'content', explanation: 'Content = satisfait ; comptant = en espèces.' },
    'compter': { correction: 'compter', explanation: 'Compter = calculer ; conter = raconter.' },
    'conter': { correction: 'conter', explanation: 'Conter = raconter ; compter = calculer.' },
    'comté': { correction: 'comté', explanation: 'Comté = fromage, domaine ; conte = récit.' },
    'conclu': { correction: 'conclu', explanation: 'Conclu = participe de conclure ; exclu = participe d\'exclure.' },
    'exclu': { correction: 'exclu', explanation: 'Exclu = participe d\'exclure ; conclu = de conclure.' },
    'concomitant': { correction: 'concomitant', explanation: 'Concomitant = simultané (un m).' },
    'consol': { correction: 'consol', explanation: 'Consol = système de navigation ; console = meuble.' },
    'console': { correction: 'console', explanation: 'Console = meuble, support ; consol = système.' },
    'cool': { correction: 'cool', explanation: 'Cool = décontracté (anglicisme) ; coule = écoulement.' },
    'coule': { correction: 'coule', explanation: 'Coule = écoulement ; cool = décontracté.' },
    'coq': { correction: 'coq', explanation: 'Coq = oiseau ; coque = coquille.' },
    'coque': { correction: 'coque', explanation: 'Coque = coquille ; coke = charbon.' },
    'coke': { correction: 'coke', explanation: 'Coke = charbon ; coque = coquille.' },
    'cor': { correction: 'cor', explanation: 'Cor = corne, instrument ; corps = organisme.' },
    'corps': { correction: 'corps', explanation: 'Corps = organisme ; cor = corne.' },
    'cornue': { correction: 'cornue', explanation: 'Cornue = récipient ; cornu = avec des cornes.' },
    'cornu': { correction: 'cornu', explanation: 'Cornu = avec des cornes ; cornue = récipient.' },
    'cosse': { correction: 'cosse', explanation: 'Cosse = enveloppe ; causse = plateau calcaire.' },
    'causse': { correction: 'causse', explanation: 'Causse = plateau ; cosse = enveloppe.' },
    'côte': { correction: 'côte', explanation: 'Côte = pente, os ; cote = valeur, indice ; cotte = vêtement.' },
    'cote': { correction: 'cote', explanation: 'Cote = valeur, indice ; côte = pente.' },
    'cotte': { correction: 'cotte', explanation: 'Cotte = vêtement ; côte = pente.' },
    'côté': { correction: 'côté', explanation: 'Côté = direction ; coteau = colline.' },
    'coteau': { correction: 'coteau', explanation: 'Coteau = colline ; côté = direction.' },
    'cou': { correction: 'cou', explanation: 'Cou = partie du corps ; coup = percussion ; coût = prix.' },
    'coup': { correction: 'coup', explanation: 'Coup = percussion ; cou = cou ; coût = prix.' },
    'coût': { correction: 'coût', explanation: 'Coût = prix ; coup = percussion.' },
    'coupé': { correction: 'coupé', explanation: 'Coupé = voiture ; coupée = ouverture.' },
    'coupée': { correction: 'coupée', explanation: 'Coupée = ouverture ; coupé = voiture.' },
    'cour': { correction: 'cour', explanation: 'Cour = espace ; cours = leçon, flux ; court = terrain, bref.' },
    'cours': { correction: 'cours', explanation: 'Cours = leçon, flux ; cour = espace.' },
    'court': { correction: 'court', explanation: 'Court = terrain, bref ; cour = espace.' },
    'courre': { correction: 'courre', explanation: 'Courre = chasse à courre ; cour = espace.' },
    'crack': { correction: 'crack', explanation: 'Crack = drogue, champion ; craque = mensonge.' },
    'craque': { correction: 'craque', explanation: 'Craque = mensonge ; crack = drogue.' },
    'crash': { correction: 'crash', explanation: 'Crash = accident ; krach = effondrement boursier.' },
    'krach': { correction: 'krach', explanation: 'Krach = effondrement boursier ; crash = accident.' },
    'krak': { correction: 'krak', explanation: 'Krak = forteresse ; crash = accident.' },
    'craie': { correction: 'craie', explanation: 'Craie = roche ; crêt = sommet.' },
    'crêt': { correction: 'crêt', explanation: 'Crêt = sommet (Jura) ; craie = roche.' },
    'crème': { correction: 'crème', explanation: 'Crème = produit laitier ; chrême = huile sainte.' },
    'chrême': { correction: 'chrême', explanation: 'Chrême = huile sainte ; crème = produit laitier.' },
    'crique': { correction: 'crique', explanation: 'Crique = petite baie ; cric = outil de levage.' },
    'cric': { correction: 'cric', explanation: 'Cric = outil de levage ; crique = baie.' },
    'cross': { correction: 'cross', explanation: 'Cross = course (cross-country) ; crosse = canne, bâton.' },
    'crosse': { correction: 'crosse', explanation: 'Crosse = canne, bâton ; cross = course.' },
    'croup': { correction: 'croup', explanation: 'Croup = maladie ; croupe = dos de cheval.' },
    'croupe': { correction: 'croupe', explanation: 'Croupe = dos de cheval ; croup = maladie.' },
    'cru': { correction: 'cru', explanation: 'Cru = (adj.) non cuit ; cru = participe de croire ; crû = de croître.' },
    'crû': { correction: 'crû', explanation: 'Crû = participe de croître (avec accent) ; cru = non cuit.' },
    'crue': { correction: 'crue', explanation: 'Crue = montée des eaux ; cru = non cuit.' },
    'cuisseau': { correction: 'cuisseau', explanation: 'Cuisseau = de veau ; cuissot = de gibier.' },
    'cuissot': { correction: 'cuissot', explanation: 'Cuissot = de gibier ; cuisseau = de veau.' },
    'curé': { correction: 'curé', explanation: 'Curé = prêtre ; curée = part aux chiens.' },
    'curée': { correction: 'curée', explanation: 'Curée = part aux chiens ; curé = prêtre.' },
    'cygne': { correction: 'cygne', explanation: 'Cygne = oiseau ; signe = indication.' },
    'signe': { correction: 'signe', explanation: 'Signe = indication ; cygne = oiseau.' },

    // D
    'danse': { correction: 'danse', explanation: 'Danse = art (avec s) ; dense = compact.' },
    'dense': { correction: 'dense', explanation: 'Dense = compact ; danse = art.' },
    'dare-dare': { correction: 'dare-dare', explanation: 'Dare-dare = rapidement (deux e muets).' },
    'dard': { correction: 'dard', explanation: 'Dard = aiguillon ; dare-dare = rapidement.' },
    'date': { correction: 'date', explanation: 'Date = jour ; datte = fruit.' },
    'datte': { correction: 'datte', explanation: 'Datte = fruit ; date = jour.' },
    'décrépi': { correction: 'décrépi', explanation: 'Décrépi = sans crépi (mur) ; décrépit = usé (personne).' },
    'décrépit': { correction: 'décrépit', explanation: 'Décrépit = usé (personne) ; décrépi = sans crépi.' },
    'défait': { correction: 'défait', explanation: 'Défait = détruit ; défet = feuille superflue.' },
    'défet': { correction: 'défet', explanation: 'Défet = feuille superflue ; défait = détruit.' },
    'dégoûter': { correction: 'dégoûter', explanation: 'Dégoûter = causer du dégoût ; dégoutter = tomber goutte à goutte.' },
    'dégoutter': { correction: 'dégoutter', explanation: 'Dégoutter = tomber goutte à goutte ; dégoûter = causer du dégoût.' },
    'délasser': { correction: 'délasser', explanation: 'Délasser = reposer ; délacer = défaire les lacets.' },
    'délacer': { correction: 'délacer', explanation: 'Délacer = défaire les lacets ; délasser = reposer.' },
    'demi': { correction: 'demi', explanation: 'Demi = moitié ; mi- = préfixe invariable.' },
    'dépôt': { correction: 'dépôt', explanation: 'Dépôt = lieu, action de déposer ; dépotoir = lieu où l\'on jette.' },
    'dépotoir': { correction: 'dépotoir', explanation: 'Dépotoir = lieu où l\'on jette ; dépôt = lieu.' },
    'dessein': { correction: 'dessein', explanation: 'Dessein = projet (ei) ; dessin = art graphique (i).' },
    'dessin': { correction: 'dessin', explanation: 'Dessin = art graphique ; dessein = projet.' },
    'desseller': { correction: 'desseller', explanation: 'Desseller = ôter la selle ; desceller = ôter le scellé.' },
    'desceller': { correction: 'desceller', explanation: 'Desceller = ôter le scellé ; desseller = ôter la selle.' },
    'déceler': { correction: 'déceler', explanation: 'Déceler = découvrir ; desseller = ôter la selle.' },
    'détoner': { correction: 'détoner', explanation: 'Détoner = exploser (un n) ; détonner = être faux (musique).' },
    'détonner': { correction: 'détonner', explanation: 'Détonner = être faux (musique) ; détoner = exploser.' },
    'différent': { correction: 'différent', explanation: 'Différent = distinct (adj.) ; différend = conflit (nom).' },
    'différend': { correction: 'différend', explanation: 'Différend = conflit (nom) ; différent = distinct.' },
    'dingue': { correction: 'dingue', explanation: 'Dingue = fou ; dinguer = tomber ; dengue = maladie.' },
    'dinguer': { correction: 'dinguer', explanation: 'Dinguer = tomber ; dingue = fou.' },
    'dengue': { correction: 'dengue', explanation: 'Dengue = maladie ; dingue = fou.' },
    'djinn': { correction: 'djinn', explanation: 'Djinn = génie (dj) ; jean = pantalon (j).' },
    'jean': { correction: 'jean', explanation: 'Jean = pantalon ; djinn = génie.' },
    'du': { correction: 'du', explanation: 'Du = article contracté ; dû = participe de devoir (avec accent).' },
    'dû': { correction: 'dû', explanation: 'Dû = participe de devoir (avec accent) ; du = article.' },

    // E
    'égayer': { correction: 'égayer', explanation: 'Égayer = rendre gai ; égailler = disperser.' },
    'égailler': { correction: 'égailler', explanation: 'Égailler = disperser ; égayer = rendre gai.' },
    'email': { correction: 'email', explanation: 'Émail = matière (pl. émaux) ; émail = courriel (anglicisme).' },
    'emplettes': { correction: 'emplettes', explanation: 'Emplettes = achats (deux t).' },
    'enter': { correction: 'enter', explanation: 'Enter = greffer ; hanter = fréquenter (fantômes).' },
    'hanter': { correction: 'hanter', explanation: 'Hanter = fréquenter (h aspiré) ; enter = greffer.' },
    'entre-temps': { correction: 'entre-temps', explanation: 'Entre-temps = adverbe ; entre tant = entre autant.' },
    'épais': { correction: 'épais', explanation: 'Épais = gros (s au singulier) ; épée = arme.' },
    'épée': { correction: 'épée', explanation: 'Épée = arme ; épais = gros.' },
    'épars': { correction: 'épars', explanation: 'Épars = dispersé ; épar = barre.' },
    'épar': { correction: 'épar', explanation: 'Épar = barre ; épars = dispersé.' },
    'épeler': { correction: 'épeler', explanation: 'Épeler = orthographier (un p) ; appeler = appeler.' },
    'appeler': { correction: 'appeler', explanation: 'Appeler = appeler ; épeler = épeler.' },
    'épicer': { correction: 'épicer', explanation: 'Épicer = assaisonner ; épisser = raccorder des cordages.' },
    'épisser': { correction: 'épisser', explanation: 'Épisser = raccorder des cordages ; épicer = assaisonner.' },
    'ère': { correction: 'ère', explanation: 'Ère = époque ; ers = lentille ; erre = erreur.' },
    'ers': { correction: 'ers', explanation: 'Ers = plante ; ère = époque.' },
    'erre': { correction: 'erre', explanation: 'Erre = erreur ; ère = époque.' }
};

// ---------------------------------------------------------------------
// RÈGLES DE CORRECTION ORTHOGRAPHIQUE
// ---------------------------------------------------------------------

const orthographeRules = [
    // Règle 1 : Confusions orthographiques alphabétiques
    {
        name: 'confusion_orthographique',
        description: 'Détecte et corrige les confusions orthographiques courantes (A-Z).',
        example: '❌ "la baie" (pour "la baie") est correct ; "la bée" (pour "la baie") est incorrect.',
        pattern: new RegExp(Object.keys(orthoConfusions).join('|'), 'gi'),
        action: function(doc, matches) {
            const errors = [];
            const text = doc.text.toLowerCase();
            
            // Parcourir toutes les confusions possibles
            Object.keys(orthoConfusions).forEach(motErrone => {
                const regex = new RegExp(`\\b${motErrone}\\b`, 'gi');
                const match = text.match(regex);
                if (match) {
                    const info = orthoConfusions[motErrone];
                    errors.push({
                        type: 'confusion_orthographique',
                        word: motErrone,
                        correction: info.correction,
                        explanation: info.explanation,
                        severity: 'high',
                        confidence: 0.9
                    });
                }
            });
            
            return errors;
        }
    },
    
    // Règle 2 : Accents manquants ou incorrects
    {
        name: 'accents_manquants',
        description: 'Vérifie la présence des accents nécessaires.',
        example: '❌ "deja" → ✅ "déjà"',
        pattern: /\b(deja|ou|ou|a|ou|ca|la|ou|du|ou|ne|ou|se|ce|ou|le|ou|me|ou|te|ou)\b/gi,
        action: function(doc, matches) {
            const errors = [];
            const corrections = {
                'deja': 'déjà',
                'ou': 'où',
                'a': 'à',
                'ca': 'çà',
                'la': 'là',
                'du': 'dû',
                'ne': 'né',
                'se': 'sé',
                'ce': 'cé',
                'le': 'lé',
                'me': 'mé',
                'te': 'té'
            };
            
            matches.forEach(match => {
                const mot = match[0].toLowerCase();
                if (corrections[mot]) {
                    errors.push({
                        type: 'accent_manquant',
                        word: match[0],
                        correction: corrections[mot],
                        explanation: `Il manque un accent sur "${match[0]}".`,
                        severity: 'medium',
                        confidence: 0.8
                    });
                }
            });
            
            return errors;
        }
    },
    
    // Règle 3 : Doubles consonnes incorrectes
    {
        name: 'double_consonne',
        description: 'Vérifie l\'usage correct des doubles consonnes.',
        example: '❌ "balade" (pour "balade" = promenade) vs "ballade" (poème).',
        pattern: /\b\w*(ll|mm|nn|pp|rr|ss|tt)\w*\b/gi,
        action: function(doc, matches) {
            const errors = [];
            // Vérifications spécifiques pour les doubles consonnes
            const motsIncorrects = {
                'ballade': 'balade', // si promenade
                'ballet': 'balai',   // confusion possible
                'balle': 'bal',      // confusion possible
                'carre': 'car',      // confusion possible
                'carte': 'kart',     // confusion possible
                'colle': 'col',      // confusion possible
                'courre': 'cour',    // confusion possible
                'crosse': 'cross',   // confusion possible
                'dette': 'dettes',   // singulier/pluriel
                'lettre': 'laitre',  // confusion possible
                'pomme': 'pom',      // confusion possible
                'terre': 'tere'      // confusion possible
            };
            
            matches.forEach(match => {
                const mot = match[0].toLowerCase();
                if (motsIncorrects[mot]) {
                    errors.push({
                        type: 'double_consonne',
                        word: match[0],
                        correction: motsIncorrects[mot],
                        explanation: `Vérifiez l\'orthographe de "${match[0]}" avec les doubles consonnes.`,
                        severity: 'medium',
                        confidence: 0.7
                    });
                }
            });
            
            return errors;
        }
    },
    
    // Règle 4 : Traits d'union manquants ou incorrects
    {
        name: 'trait_union',
        description: 'Vérifie l\'usage correct des traits d\'union.',
        example: '❌ "a cote" → ✅ "à côté"',
        pattern: /\b(a cote|a coup|a priori|a posteriori|a contrario|non plus|peut etre|vis a vis)\b/gi,
        action: function(doc, matches) {
            const errors = [];
            const corrections = {
                'a cote': 'à-côté',
                'a coup': 'à-coup',
                'a priori': 'a priori',
                'a posteriori': 'a posteriori',
                'a contrario': 'a contrario',
                'non plus': 'non-plus',
                'peut etre': 'peut-être',
                'vis a vis': 'vis-à-vis'
            };
            
            matches.forEach(match => {
                const mot = match[0].toLowerCase();
                if (corrections[mot]) {
                    errors.push({
                        type: 'trait_union',
                        word: match[0],
                        correction: corrections[mot],
                        explanation: `Il faut un trait d\'union dans "${match[0]}".`,
                        severity: 'medium',
                        confidence: 0.8
                    });
                }
            });
            
            return errors;
        }
    },
    
    // Règle 5 : Mots composés incorrects
    {
        name: 'mot_compose',
        description: 'Vérifie l\'orthographe des mots composés.',
        example: '❌ "compte rendu" → ✅ "compte rendu" (sans trait d\'union)',
        pattern: /\b(compte-rendu|compte-rendus|porte-monnaie|porte-monnaies|arc-en-ciel|arc-en-ciel)\b/gi,
        action: function(doc, matches) {
            const errors = [];
            const corrections = {
                'compte-rendu': 'compte rendu',
                'compte-rendus': 'comptes rendus',
                'porte-monnaie': 'portemonnaie',
                'porte-monnaies': 'portemonnaies',
                'arc-en-ciel': 'arc-en-ciel'
            };
            
            matches.forEach(match => {
                const mot = match[0].toLowerCase();
                if (corrections[mot]) {
                    errors.push({
                        type: 'mot_compose',
                        word: match[0],
                        correction: corrections[mot],
                        explanation: `L\'orthographe correcte est "${corrections[mot]}".`,
                        severity: 'medium',
                        confidence: 0.8
                    });
                }
            });
            
            return errors;
        }
    }
];

// ---------------------------------------------------------------------
// EXPORTATION DES RÈGLES
// ---------------------------------------------------------------------

const allOrthographeRules = orthographeRules;

console.log(`✅ ${allOrthographeRules.length} règles d\'orthographe personnalisées chargées.`);
console.log(`📚 Dictionnaire de confusions orthographiques : ${Object.keys(orthoConfusions).length} entrées.`);

// Export pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = allOrthographeRules;
} else if (typeof window !== 'undefined') {
    window.orthographeRules = allOrthographeRules;
}
