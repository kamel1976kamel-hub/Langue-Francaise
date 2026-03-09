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

// Dictionnaire des confusions courantes (mot erroné -> mot correct avec explication)
const confusions = {
    // A
    'abjurer': { correction: 'adjurer', explanation: 'Abjurer = renier sa foi ; adjurer = exhorter, supplier.' },
    'adjurer': { correction: 'abjurer', explanation: 'Abjurer = renier sa foi ; adjurer = exhorter, supplier.' },
    'acception': { correction: 'acceptation', explanation: 'Acception = sens d'un mot ; acceptation = fait d'accepter.' },
    'acceptation': { correction: 'acception', explanation: 'Acception = sens d'un mot ; acceptation = fait d'accepter.' },
    'achalandé': { correction: 'bien fourni', explanation: 'Achalandé = qui a beaucoup de clients (chalands), pas qui est bien approvisionné.' },
    'acmé': { correction: 'point culminant', explanation: 'L'acmé (masculin) = point culminant ; l'acné (féminin) = maladie de peau.' },
    'acné': { correction: 'acmé', explanation: 'L'acmé (masculin) = point culminant ; l'acné (féminin) = maladie de peau.' },
    'addiction': { correction: 'dépendance', explanation: 'Addiction = dépendance à un produit ; adduction = rapprochement, amenée d'eau.' },
    'adduction': { correction: 'addiction', explanation: 'Addiction = dépendance à un produit ; adduction = rapprochement, amenée d'eau.' },
    'adjuration': { correction: 'abjuration', explanation: 'Adjuration = action d'adjurer (supplier) ; abjuration = action de renier sa foi.' },
    'adventice': { correction: 'accessoire', explanation: 'Adventice = accessoire, qui s'ajoute ; adventif = qui se développe hors du lieu normal.' },
    'adventif': { correction: 'adventice', explanation: 'Adventice = accessoire, qui s'ajoute ; adventif = qui se développe hors du lieu normal.' },
    'affidé': { correction: 'complice', explanation: 'Affidé = complice d'une action illégale ; affilié = membre d'une organisation.' },
    'affilié': { correction: 'affidé', explanation: 'Affidé = complice d'une action illégale ; affilié = membre d'une organisation.' },
    'affleurer': { correction: 'apparaître à peine', explanation: 'Affleurer = apparaître à la surface ; effleurer = toucher légèrement.' },
    'effleurer': { correction: 'affleurer', explanation: 'Affleurer = apparaître à la surface ; effleurer = toucher légèrement.' },
    'agissements': { correction: 'actions (neutre)', explanation: 'Agissements (pluriel) = actions répréhensibles ; actions = neutre.' },
    'agonir': { correction: 'agoniser', explanation: 'Agonir (d'injures) = couvrir d'injures ; agoniser = être en train de mourir.' },
    'agoniser': { correction: 'agonir', explanation: 'Agonir (d'injures) = couvrir d'injures ; agoniser = être en train de mourir.' },
    'aléa': { correction: 'risque', explanation: 'Aléa (masculin) = hasard, risque ; alée (féminin) = passage, allée.' },
    'alléguer': { correction: 'prétendre', explanation: 'Alléguer = donner comme prétexte, prétendre ; léguer = donner par testament.' },
    'léguer': { correction: 'alléguer', explanation: 'Alléguer = donner comme prétexte, prétendre ; léguer = donner par testament.' },
    'alternance': { correction: 'succession', explanation: 'Alternance = succession régulière ; alternative = choix entre deux options.' },
    'alternative': { correction: 'choix', explanation: 'Alternative = choix entre deux options ; ne pas l'employer pour "option" seule.' },
    'amender': { correction: 'améliorer', explanation: 'Amender = améliorer (une loi, un texte) ; amodier = donner en location (une terre).' },
    'amodier': { correction: 'amender', explanation: 'Amender = améliorer (une loi, un texte) ; amodier = donner en location (une terre).' },
    'analogue': { correction: 'semblable', explanation: 'Analogue = qui ressemble à ; analogique = qui fonctionne par analogie.' },
    'analogique': { correction: 'analogue', explanation: 'Analogue = qui ressemble à ; analogique = qui fonctionne par analogie.' },
    'angulaire': { correction: 'qui forme un angle', explanation: 'Angulaire = qui forme un angle ; anguleux = qui a des angles marqués.' },
    'anguleux': { correction: 'angulaire', explanation: 'Angulaire = qui forme un angle ; anguleux = qui a des angles marqués.' },
    'anonyme': { correction: 'sans nom', explanation: 'Anonyme = sans nom ; éponyme = qui donne son nom.' },
    'éponyme': { correction: 'anonyme', explanation: 'Anonyme = sans nom ; éponyme = qui donne son nom.' },
    'apocryphe': { correction: 'non authentique', explanation: 'Apocryphe = non authentique ; anonyme = sans nom.' },
    'à nouveau': { correction: 'de façon nouvelle', explanation: 'À nouveau = d'une manière nouvelle ; de nouveau = une autre fois (identique).' },
    'de nouveau': { correction: 'à nouveau', explanation: 'À nouveau = d'une manière nouvelle ; de nouveau = une autre fois (identique).' },
    'antagoniste': { correction: 'adversaire', explanation: 'Antagoniste = adversaire ; protagoniste = acteur principal, participant.' },
    'protagoniste': { correction: 'antagoniste', explanation: 'Antagoniste = adversaire ; protagoniste = acteur principal, participant.' },
    'apparition': { correction: 'apparition', explanation: 'Apparition = fait d'apparaître ; appariement = mise en paire.' },
    'appariement': { correction: 'mise en paire', explanation: 'Appariement = mise en paire ; apparition = fait d'apparaître.' },
    'apurer': { correction: 'vérifier (comptes)', explanation: 'Apurer = vérifier des comptes ; épurer = purifier, rendre plus pur.' },
    'épurer': { correction: 'apurer', explanation: 'Apurer = vérifier des comptes ; épurer = purifier, rendre plus pur.' },
    'aréole': { correction: 'cercle coloré', explanation: 'Aréole = cercle autour du mamelon ; auréole = cercle lumineux, tache circulaire.' },
    'auréole': { correction: 'aréole', explanation: 'Aréole = cercle autour du mamelon ; auréole = cercle lumineux, tache circulaire.' },
    'aréomètre': { correction: 'mesureur de densité', explanation: 'Aréomètre = mesure la densité des liquides ; aéromètre = mesure la pression de l'air.' },
    'aéromètre': { correction: 'aréomètre', explanation: 'Aréomètre = mesure la densité des liquides ; aéromètre = mesure la pression de l'air.' },
    'arrêt': { correction: 'décision de justice', explanation: 'Arrêt = décision d'une cour supérieure ; arrêté = décision administrative.' },
    'arrêté': { correction: 'arrêt', explanation: 'Arrêt = décision d'une cour supérieure ; arrêté = décision administrative.' },
    'assuétude': { correction: 'dépendance', explanation: 'Assuétude = dépendance à un produit ; addiction = même sens, anglicisme.' },
    'ataraxie': { correction: 'paix intérieure', explanation: 'Ataraxie = absence de troubles ; ataxie = incoordination des mouvements.' },
    'ataxie': { correction: 'ataraxie', explanation: 'Ataraxie = absence de troubles ; ataxie = incoordination des mouvements.' },
    'avanie': { correction: 'humiliation', explanation: 'Avanie = affront, humiliation ; avarie = dégât, dommage.' },
    'avarie': { correction: 'avanie', explanation: 'Avanie = affront, humiliation ; avarie = dégât, dommage.' },
    'avatar': { correction: 'transformation', explanation: 'Avatar = transformation, changement ; ne pas l'employer pour "désagrément".' },
    'avérer': { correction: 's\'avérer', explanation: 'S'avérer = se révéler (déjà "vrai"), éviter "s'avérer vrai" (pléonasme).' },

    // B
    'bâiller': { correction: 'ouvrir la bouche', explanation: 'Bâiller = ouvrir la bouche involontairement ; bailler = donner (location).' },
    'bailler': { correction: 'donner à bail', explanation: 'Bâiller = ouvrir la bouche involontairement ; bailler = donner (location).' },
    'béni': { correction: 'béni (personnes)', explanation: 'Béni = pour les personnes ; bénit = pour les objets sacrés.' },
    'bénit': { correction: 'bénit (objets)', explanation: 'Béni = pour les personnes ; bénit = pour les objets sacrés.' },
    'biennal': { correction: 'tous les deux ans', explanation: 'Biennal = tous les deux ans ; bisannuel = deux fois par an.' },
    'bisannuel': { correction: 'biennal', explanation: 'Biennal = tous les deux ans ; bisannuel = deux fois par an.' },
    'bléser': { correction: 'parler en zézayant', explanation: 'Bléser = prononcer mal les consonnes ; biaiser = utiliser des moyens détournés.' },
    'biaiser': { correction: 'bléser', explanation: 'Bléser = prononcer mal les consonnes ; biaiser = utiliser des moyens détournés.' },
    'bogue': { correction: 'enveloppe de châtaigne', explanation: 'Bogue (fém.) = enveloppe de châtaigne ; bogue (masc.) = erreur informatique (bug).' },
    'bug': { correction: 'bogue (informatique)', explanation: 'Bug = anglicisme pour "bogue informatique".' },
    'botulisme': { correction: 'intoxication', explanation: 'Botulisme = intoxication par la toxine botulique.' },

    // C
    'çà': { correction: 'ici', explanation: 'Çà (avec accent) = adverbe de lieu (çà et là) ; ça (sans accent) = pronom démonstratif.' },
    'ça': { correction: 'cela', explanation: 'Ça (sans accent) = pronom démonstratif ; çà (avec accent) = adverbe de lieu.' },
    'cantique': { correction: 'chant religieux', explanation: 'Cantique = chant religieux ; quantique = relatif aux quanta (physique).' },
    'quantique': { correction: 'cantique', explanation: 'Cantique = chant religieux ; quantique = relatif aux quanta (physique).' },
    'caparaçonné': { correction: 'protégé d\'un caparaçon', explanation: 'Caparaçonné = recouvert d'une protection ; carapace = enveloppe dure.' },
    'carapace': { correction: 'caparaçonné', explanation: 'Caparaçonné = recouvert d'une protection ; carapace = enveloppe dure.' },
    'caténaire': { correction: 'ligne électrique', explanation: 'Caténaire = système de suspension électrique ; cathéter = sonde médicale.' },
    'cathéter': { correction: 'caténaire', explanation: 'Caténaire = système de suspension électrique ; cathéter = sonde médicale.' },
    'caustique': { correction: 'corrosif, mordant', explanation: 'Caustique = qui corrode, mordant ; encaustique = cire pour meubles.' },
    'encaustique': { correction: 'caustique', explanation: 'Caustique = qui corrode, mordant ; encaustique = cire pour meubles.' },
    'cautèle': { correction: 'ruse prudente', explanation: 'Cautèle = prudence rusée ; cauteleux = rusé, dissimulé.' },
    'ceci': { correction: 'ceci', explanation: 'Ceci = ce qui va suivre ; cela = ce qui précède. On dit "cela dit".' },
    'cela': { correction: 'cela', explanation: 'Ceci = ce qui va suivre ; cela = ce qui précède. On dit "cela dit".' },
    'censé': { correction: 'supposé', explanation: 'Censé = supposé ; sensé = qui a du sens, raisonnable.' },
    'sensé': { correction: 'censé', explanation: 'Censé = supposé ; sensé = qui a du sens, raisonnable.' },
    'cessation': { correction: 'arrêt', explanation: 'Cessation = fait de cesser ; cessibilité = caractère de ce qui peut être cédé.' },
    'cessibilité': { correction: 'cessation', explanation: 'Cessation = fait de cesser ; cessibilité = caractère de ce qui peut être cédé.' },
    'chaire': { correction: 'estrade, poste', explanation: 'Chaire = estrade, poste (universitaire) ; chair = tissu du corps.' },
    'chair': { correction: 'chaire', explanation: 'Chaire = estrade, poste (universitaire) ; chair = tissu du corps.' },
    'châsse': { correction: 'reliquaire', explanation: 'Châsse = coffre à reliques ; chasse = action de chasser.' },
    'chasse': { correction: 'châsse', explanation: 'Châsse = coffre à reliques ; chasse = action de chasser.' },
    'chemineau': { correction: 'vagabond', explanation: 'Chemineau = vagabond ; cheminot = employé des chemins de fer.' },
    'cheminot': { correction: 'chemineau', explanation: 'Chemineau = vagabond ; cheminot = employé des chemins de fer.' },
    'chiffe': { correction: 'chiffon, personne molle', explanation: 'Chiffe = chiffon, personne molle ; chiffre = nombre.' },
    'chiffre': { correction: 'chiffe', explanation: 'Chiffe = chiffon, personne molle ; chiffre = nombre.' },
    'chômage': { correction: 'absence d\'emploi', explanation: 'Chômage = absence d'emploi ; chaumage = action de couper le chaume.' },
    'chaumage': { correction: 'chômage', explanation: 'Chômage = absence d'emploi ; chaumage = action de couper le chaume.' },
    'circonspect': { correction: 'prudent', explanation: 'Circonspect = qui manifeste de la prudence.' },
    'colérique': { correction: 'coléreux', explanation: 'Colérique = qui se met en colère ; cholérique = relatif au choléra.' },
    'coléreux': { correction: 'colérique', explanation: 'Colérique = qui se met en colère ; cholérique = relatif au choléra.' },
    'cholérique': { correction: 'colérique', explanation: 'Colérique = qui se met en colère ; cholérique = relatif au choléra.' },
    'collusion': { correction: 'entente secrète', explanation: 'Collusion = entente secrète contre des tiers ; collision = choc, rencontre brutale.' },
    'collision': { correction: 'collusion', explanation: 'Collusion = entente secrète contre des tiers ; collision = choc, rencontre brutale.' },
    'colon': { correction: 'habitant d\'une colonie', explanation: 'Colon = habitant d'une colonie ; côlon = partie de l'intestin.' },
    'côlon': { correction: 'colon', explanation: 'Colon = habitant d'une colonie ; côlon = partie de l'intestin.' },
    'colonisateur': { correction: 'colonisateur', explanation: 'Colonisateur = qui colonise ; colonialiste = partisan de la colonisation (idéologie).' },
    'colonialiste': { correction: 'colonisateur', explanation: 'Colonisateur = qui colonise ; colonialiste = partisan de la colonisation.' },
    'commanditaire': { correction: 'financeur', explanation: 'Commanditaire = celui qui apporte des fonds ; commendataire = gestionnaire d'un bien ecclésiastique.' },
    'commendataire': { correction: 'commanditaire', explanation: 'Commanditaire = celui qui apporte des fonds ; commendataire = gestionnaire d'un bien ecclésiastique.' },
    'commémorer': { correction: 'commémorer', explanation: 'Commémorer = célébrer le souvenir ; fêter = célébrer un événement heureux.' },
    'compréhensible': { correction: 'compréhensible', explanation: 'Compréhensible = qui peut être compris ; compréhensif = qui comprend les autres.' },
    'compréhensif': { correction: 'compréhensif', explanation: 'Compréhensible = qui peut être compris ; compréhensif = qui comprend les autres.' },
    'concupiscence': { correction: 'désir des plaisirs', explanation: 'Concupiscence = désir des plaisirs (souvent charnels).' },
    'conjoncture': { correction: 'situation', explanation: 'Conjoncture = situation résultant de circonstances ; conjecture = hypothèse, supposition.' },
    'conjecture': { correction: 'conjoncture', explanation: 'Conjoncture = situation résultant de circonstances ; conjecture = hypothèse, supposition.' },
    'conséquent': { correction: 'logique', explanation: 'Conséquent = logique (avec ses principes) ; ne pas l'employer pour "important".' },
    'contigu': { correction: 'voisin', explanation: 'Contigu = voisin, adjacent.' },
    'contondant': { correction: 'qui blesse sans couper', explanation: 'Contondant = qui meurtrit sans couper.' },
    'contumace': { correction: 'absence à son procès', explanation: 'Contumace = état d'une personne jugée en son absence.' },
    'coupe sombre': { correction: 'coupe sombre', explanation: 'Coupe sombre (forestier) = coupe modérée ; coupe claire = coupe sévère (il reste peu d'arbres).' },
    'coupe claire': { correction: 'coupe claire', explanation: 'Coupe sombre (forestier) = coupe modérée ; coupe claire = coupe sévère.' },
    'cours': { correction: 'cours', explanation: 'Cours = leçon, flux, avenue ; court = terrain de tennis, brève durée.' },
    'court': { correction: 'court', explanation: 'Cours = leçon, flux, avenue ; court = terrain de tennis, brève durée.' },
    'coutil': { correction: 'étoffe', explanation: 'Coutil = étoffe (se prononce "couti").' },
    'criquet': { correction: 'insecte', explanation: 'Criquet = insecte ; cricket = sport.' },
    'cricket': { correction: 'criquet', explanation: 'Criquet = insecte ; cricket = sport.' },
    'cuisseau': { correction: 'veau', explanation: 'Cuisseau = de veau ; cuissot = de gibier.' },
    'cuissot': { correction: 'cuisseau', explanation: 'Cuisseau = de veau ; cuissot = de gibier.' },
    'cultural': { correction: 'agricole', explanation: 'Cultural = relatif à la culture des sols ; culturel = relatif à la culture (art, idées).' },
    'culturel': { correction: 'cultural', explanation: 'Cultural = relatif à la culture des sols ; culturel = relatif à la culture (art, idées).' },

    // D
    'damer': { correction: 'tasser', explanation: 'Damer = tasser, doubler au jeu de dames ; damner = condamner à l'enfer.' },
    'damner': { correction: 'damer', explanation: 'Damer = tasser, doubler au jeu de dames ; damner = condamner à l'enfer.' },
    'datif': { correction: 'cas grammatical', explanation: 'Datif = cas du complément d'attribution.' },
    'débâcle': { correction: 'rupture des glaces', explanation: 'Débâcle = rupture des glaces, déroute ; embâcle = obstruction par les glaces.' },
    'embâcle': { correction: 'débâcle', explanation: 'Débâcle = rupture des glaces, déroute ; embâcle = obstruction par les glaces.' },
    'décade': { correction: 'dix jours', explanation: 'Décade = dix jours ; décennie = dix ans.' },
    'décennie': { correction: 'dix ans', explanation: 'Décade = dix jours ; décennie = dix ans.' },
    'déchirure': { correction: 'accroc', explanation: 'Déchirure = accroc (concret) ; déchirement = souffrance morale, division.' },
    'déchirement': { correction: 'déchirure', explanation: 'Déchirure = accroc (concret) ; déchirement = souffrance morale, division.' },
    'de concert': { correction: 'ensemble', explanation: 'De concert = en accord ; de conserve = ensemble (navires).' },
    'de conserve': { correction: 'de concert', explanation: 'De concert = en accord ; de conserve = ensemble (navires).' },
    'décrépi': { correction: 'décrépi (mur)', explanation: 'Décrépi = sans crépi (mur) ; décrépit = vieilli (personne).' },
    'décrépit': { correction: 'décrépi', explanation: 'Décrépi = sans crépi (mur) ; décrépit = vieilli (personne).' },
    'dédommager': { correction: 'indemniser', explanation: 'Dédommager = indemniser ; endommager = abîmer.' },
    'endommager': { correction: 'dédommager', explanation: 'Dédommager = indemniser ; endommager = abîmer.' },
    'défalquer': { correction: 'déduire', explanation: 'Défalquer = déduire (comptabilité) ; ne pas confondre avec catafalque.' },
    'dégingandé': { correction: 'dégingandé', explanation: 'Dégingandé = dont l'allure est désarticulée.' },
    'dégradation': { correction: 'détérioration', explanation: 'Dégradation = détérioration ; dégrader = abîmer, destituer.' },
    'démettre': { correction: 'démettre (qqn)', explanation: 'Démettre = destituer ; se démettre = démissionner.' },
    'démystifier': { correction: 'démystifier', explanation: 'Démystifier = ôter le caractère mystique ; démythifier = ôter le caractère mythique.' },
    'démythifier': { correction: 'démythifier', explanation: 'Démystifier = ôter le caractère mystique ; démythifier = ôter le caractère mythique.' },
    'dentition': { correction: 'formation des dents', explanation: 'Dentition = formation des dents ; denture = ensemble des dents.' },
    'denture': { correction: 'dentition', explanation: 'Dentition = formation des dents ; denture = ensemble des dents.' },
    'déodorant': { correction: 'déodorant (corps)', explanation: 'Déodorant = pour le corps ; désodorisant = pour les locaux.' },
    'désodorisant': { correction: 'désodorisant', explanation: 'Déodorant = pour le corps ; désodorisant = pour les locaux.' },
    'déprédations': { correction: 'dégâts', explanation: 'Déprédations = dommages causés à autrui.' },
    'derechef': { correction: 'de nouveau', explanation: 'Derechef = de nouveau (littéraire).' },
    'désappointé': { correction: 'déçu', explanation: 'Désappointé = déçu, trompé dans son attente.' },
    'dessiller': { correction: 'ouvrir les yeux', explanation: 'Dessiller = ouvrir les yeux (au sens figuré).' },
    'différend': { correction: 'conflit', explanation: 'Différend (nom) = conflit ; différent (adj.) = distinct.' },
    'différent': { correction: 'différent', explanation: 'Différend (nom) = conflit ; différent (adj.) = distinct.' },
    'dilemme': { correction: 'choix difficile', explanation: 'Dilemme = choix entre deux options comportant des inconvénients.' },
    'diptyque': { correction: 'tableau en deux parties', explanation: 'Diptyque = œuvre en deux parties ; distique = deux vers.' },
    'distique': { correction: 'diptyque', explanation: 'Diptyque = œuvre en deux parties ; distique = deux vers.' },
    'disert': { correction: 'disert', explanation: 'Disert = qui parle aisément.' },
    'dissiper': { correction: 'dissiper', explanation: 'Dissiper = faire disparaître, gaspiller, distraire.' },
    'dissous': { correction: 'dissous (participe)', explanation: 'Dissous = participe de dissoudre ; dissolu = débauché.' },
    'dissolu': { correction: 'dissous', explanation: 'Dissous = participe de dissoudre ; dissolu = débauché.' },
    'dithyrambe': { correction: 'éloge', explanation: 'Dithyrambe = éloge enthousiaste.' },
    'drastique': { correction: 'rigoureux', explanation: 'Drastique = très rigoureux, draconien.' },

    // E
    'écaler': { correction: 'écaler', explanation: 'Écaler = enlever l'écale (œuf, noix) ; écailler = enlever les écailles (poisson).' },
    'écailler': { correction: 'écailler', explanation: 'Écaler = enlever l'écale ; écailler = enlever les écailles.' },
    'éclaircir': { correction: 'rendre plus clair', explanation: 'Éclaircir = rendre plus clair ; éclairer = donner de la lumière.' },
    'éclairer': { correction: 'éclairer', explanation: 'Éclaircir = rendre plus clair ; éclairer = donner de la lumière.' },
    'écoper': { correction: 'vider l\'eau', explanation: 'Écoper = vider l'eau (bateau), recevoir (une sanction).' },
    'efflorescence': { correction: 'fleurissement', explanation: 'Efflorescence = épanouissement, pruine ; inflorescence = disposition des fleurs.' },
    'inflorescence': { correction: 'efflorescence', explanation: 'Efflorescence = épanouissement ; inflorescence = disposition des fleurs.' },
    'égayer': { correction: 'égayer', explanation: 'Égayer = rendre gai ; égailler = disperser.' },
    'égailler': { correction: 'égailler', explanation: 'Égayer = rendre gai ; égailler = disperser.' },
    'éluder': { correction: 'éluder', explanation: 'Éluder = éviter ; élucider = éclaircir ; élider = supprimer une voyelle.' },
    'élucider': { correction: 'élucider', explanation: 'Éluder = éviter ; élucider = éclaircir ; élider = supprimer une voyelle.' },
    'élider': { correction: 'élider', explanation: 'Éluder = éviter ; élucider = éclaircir ; élider = supprimer une voyelle.' },
    'émérite': { correction: 'émérite', explanation: 'Émérite = qui a de l'expérience ; méritant = qui a du mérite.' },
    'méritant': { correction: 'méritant', explanation: 'Émérite = qui a de l'expérience ; méritant = qui a du mérite.' },
    'émigrer': { correction: 'émigrer', explanation: 'Émigrer = quitter son pays ; immigrer = entrer dans un pays.' },
    'immigrer': { correction: 'immigrer', explanation: 'Émigrer = quitter son pays ; immigrer = entrer dans un pays.' },
    'éminent': { correction: 'éminent', explanation: 'Éminent = élevé, remarquable ; imminent = qui va arriver bientôt.' },
    'imminent': { correction: 'imminent', explanation: 'Éminent = élevé, remarquable ; imminent = qui va arriver bientôt.' },
    'empreinte': { correction: 'empreinte', explanation: 'Empreinte = trace ; emprunt = ce qu'on emprunte.' },
    'emprunt': { correction: 'emprunt', explanation: 'Empreinte = trace ; emprunt = ce qu'on emprunte.' },
    'endémie': { correction: 'endémie', explanation: 'Endémie = maladie permanente ; épidémie = atteinte soudaine et étendue.' },
    'épidémie': { correction: 'épidémie', explanation: 'Endémie = maladie permanente ; épidémie = atteinte soudaine et étendue.' },
    'entrefaites': { correction: 'sur ces entrefaites', explanation: 'Sur ces entrefaites = à ce moment-là.' },
    'entregent': { correction: 'entregent', explanation: 'Entregent = habileté à se faire valoir.' },
    'énumérer': { correction: 'énumérer', explanation: 'Énumérer = lister ; rémunérer = payer.' },
    'rémunérer': { correction: 'rémunérer', explanation: 'Énumérer = lister ; rémunérer = payer.' },
    'envahissement': { correction: 'envahissement', explanation: 'Envahissement = action d'envahir (progressif) ; invasion = irruption brutale.' },
    'invasion': { correction: 'invasion', explanation: 'Envahissement = progressif ; invasion = brutale.' },
    'envie': { correction: 'envie', explanation: 'Envie = désir ; à l'envi = à qui mieux mieux.' },
    'envi': { correction: 'à l\'envi', explanation: 'Envie = désir ; à l'envi = à qui mieux mieux.' },
    'éon': { correction: 'éon', explanation: 'Éon = éternité (philo.) ; éonisme = travestissement.' },
    'épigramme': { correction: 'épigramme', explanation: 'Épigramme (fém.) = petit poème satirique ; épigramme (masc.) = tranche grillée.' },
    'épitaphe': { correction: 'épitaphe', explanation: 'Épitaphe = inscription funéraire ; épigraphe = inscription sur un monument, citation.' },
    'épigraphe': { correction: 'épigraphe', explanation: 'Épitaphe = inscription funéraire ; épigraphe = inscription, citation.' },
    'équanimité': { correction: 'égalité d\'humeur', explanation: 'Équanimité = sérénité, égalité d'humeur.' },
    'espèce': { correction: 'espèce', explanation: 'Une espèce de (féminin).' },
    'et cetera': { correction: 'et cetera', explanation: 'Et cetera (etc.) = et les autres choses.' },
    'événement': { correction: 'événement', explanation: 'Événement = ce qui arrive ; avènement = accession à une dignité.' },
    'avènement': { correction: 'avènement', explanation: 'Événement = ce qui arrive ; avènement = accession à une dignité.' },
    'exaltation': { correction: 'exaltation', explanation: 'Exaltation = surexcitation intellectuelle ; exultation = grande joie.' },
    'exultation': { correction: 'exultation', explanation: 'Exaltation = surexcitation ; exultation = grande joie.' },
    'excuse': { correction: 'excuse', explanation: 'Excuse = justification ; "je m'excuse" est critiqué (préférer "excusez-moi").' },
    'exeat': { correction: 'exeat', explanation: 'Exeat = autorisation de sortie ; exit = sortie (théâtre).' },
    'exit': { correction: 'exit', explanation: 'Exeat = autorisation ; exit = sortie.' },
    'exécrer': { correction: 'exécrer', explanation: 'Exécrer = détester ; excréter = évacuer.' },
    'excréter': { correction: 'excréter', explanation: 'Exécrer = détester ; excréter = évacuer.' },
    'exempt': { correction: 'exempt', explanation: 'Exempt = dispensé ; exempté = dispensé par une autorité.' },
    'exempté': { correction: 'exempté', explanation: 'Exempt = dispensé ; exempté = dispensé par une autorité.' },
    'exergue': { correction: 'exergue', explanation: 'Exergue = espace pour une inscription.' },
    'exhaustif': { correction: 'exhaustif', explanation: 'Exhaustif = complet.' },
    'exocet': { correction: 'exocet', explanation: 'Exocet = poisson ou missile.' },
    'exsangue': { correction: 'exsangue', explanation: 'Exsangue = qui a perdu beaucoup de sang.' },

    // F
    'faciès': { correction: 'faciès', explanation: 'Faciès = apparence (souvent péjoratif).' },
    'factieux': { correction: 'factieux', explanation: 'Factieux = qui crée du trouble ; faction = groupe subversif, garde.' },
    'faction': { correction: 'faction', explanation: 'Factieux = qui crée du trouble ; faction = groupe subversif, garde.' },
    'fauteur': { correction: 'fauteur', explanation: 'Fauteur (de troubles) = qui provoque.' },
    'fécule': { correction: 'fécule', explanation: 'Fécule = amidon ; férule = baguette, autorité.' },
    'férule': { correction: 'férule', explanation: 'Fécule = amidon ; férule = baguette, autorité.' },
    'fenil': { correction: 'fenil', explanation: 'Fenil = local à foin ; chenil = local à chiens.' },
    'chenil': { correction: 'chenil', explanation: 'Fenil = local à foin ; chenil = local à chiens.' },
    'ferrage': { correction: 'ferrage', explanation: 'Ferrage = action de ferrer ; ferrure = ensemble de fers.' },
    'ferrure': { correction: 'ferrure', explanation: 'Ferrage = action de ferrer ; ferrure = ensemble de fers.' },
    'ferroutage': { correction: 'ferroutage', explanation: 'Ferroutage = transport rail-route.' },
    'féru': { correction: 'féru', explanation: 'Féru = passionné (de).' },
    'feu': { correction: 'feu', explanation: 'Feu (adj.) = défunt ; feu (nom) = flamme.' },
    'feuille': { correction: 'feuille', explanation: 'Feuille = page volante ; feuillet = page d'un cahier.' },
    'feuillet': { correction: 'feuillet', explanation: 'Feuille = page volante ; feuillet = page d'un cahier.' },
    'fissile': { correction: 'fissile', explanation: 'Fissile = qui peut être divisé (nucléaire).' },
    'fleuve': { correction: 'fleuve', explanation: 'Fleuve = se jette dans la mer ; rivière = se jette dans un fleuve.' },
    'rivière': { correction: 'rivière', explanation: 'Fleuve = se jette dans la mer ; rivière = se jette dans un fleuve.' },
    'fonds': { correction: 'fonds', explanation: 'Fonds = capital, terrain ; fond = partie basse.' },
    'fond': { correction: 'fond', explanation: 'Fonds = capital, terrain ; fond = partie basse.' },
    'frac': { correction: 'frac', explanation: 'Frac = habit de cérémonie ; vrac = en vrac.' },
    'vrac': { correction: 'vrac', explanation: 'Frac = habit ; vrac = en vrac.' },
    'fusilier': { correction: 'fusilier', explanation: 'Fusilier = soldat ; fusillé = exécuté.' },

    // G
    'gageure': { correction: 'gageure', explanation: 'Gageure = défi (prononcer "gajure").' },
    'gémonies': { correction: 'gémonies', explanation: 'Gémonies = lieu d'exposition (vouer aux gémonies) ; hégémonie = domination.' },
    'hégémonie': { correction: 'hégémonie', explanation: 'Gémonies = lieu d'exposition ; hégémonie = domination.' },
    'gent': { correction: 'gent', explanation: 'Gent = (féminin) groupe (la gent féminine) ; gens = personnes.' },
    'gens': { correction: 'gens', explanation: 'Gent = groupe ; gens = personnes.' },
    'gisant': { correction: 'gisant', explanation: 'Gisant = statue couchée ; orant = statue en prière.' },
    'orant': { correction: 'orant', explanation: 'Gisant = statue couchée ; orant = statue en prière.' },
    'goulot': { correction: 'goulot', explanation: 'Goulot = col de bouteille ; goulet = passage étroit.' },
    'goulet': { correction: 'goulet', explanation: 'Goulot = col de bouteille ; goulet = passage étroit.' },
    'graduation': { correction: 'graduation', explanation: 'Graduation = échelle de mesure ; gradation = progression par degrés.' },
    'gradation': { correction: 'gradation', explanation: 'Graduation = échelle de mesure ; gradation = progression.' },
    'gradué': { correction: 'gradué', explanation: 'Gradué = qui comporte des graduations ; graduel = progressif.' },
    'graduel': { correction: 'graduel', explanation: 'Gradué = avec graduations ; graduel = progressif.' },
    'guet-apens': { correction: 'guet-apens', explanation: 'Guet-apens = piège (prononcer "guet-apen").' },

    // H
    'habileté': { correction: 'habileté', explanation: 'Habileté = adresse ; habilité = autorisé.' },
    'habilité': { correction: 'habilité', explanation: 'Habileté = adresse ; habilité = autorisé.' },
    'héraldique': { correction: 'héraldique', explanation: 'Héraldique = science des blasons.' },
    'heur': { correction: 'heur', explanation: 'Heur = chance (avoir l'heur de) ; heure = 60 minutes.' },
    'heure': { correction: 'heure', explanation: 'Heur = chance ; heure = 60 minutes.' },
    'hiatus': { correction: 'hiatus', explanation: 'Hiatus = succession de deux voyelles, rupture.' },
    'hiberner': { correction: 'hiberner', explanation: 'Hiberner = être en hibernation ; hiverner = passer l'hiver à l'abri.' },
    'hiverner': { correction: 'hiverner', explanation: 'Hiberner = être en hibernation ; hiverner = passer l'hiver à l'abri.' },
    'holographe': { correction: 'holographe', explanation: 'Holographe = écrit de la main du signataire.' },
    'hospice': { correction: 'hospice', explanation: 'Hospice = établissement de soin ; auspices = protection.' },
    'auspices': { correction: 'auspices', explanation: 'Hospice = établissement ; auspices = protection.' },

    // I
    'idiotisme': { correction: 'idiotisme', explanation: 'Idiotisme = expression propre à une langue ; idiotie = bêtise.' },
    'idiotie': { correction: 'idiotie', explanation: 'Idiotisme = expression propre à une langue ; idiotie = bêtise.' },
    'imbiber': { correction: 'imbiber', explanation: 'Imbiber = imprégner ; imbibition = action d'imbiber.' },
    'impétrant': { correction: 'impétrant', explanation: 'Impétrant = celui qui a obtenu un titre.' },
    'impudeur': { correction: 'impudeur', explanation: 'Impudeur = absence de pudeur ; impudicité = caractère impudique.' },
    'impudicité': { correction: 'impudicité', explanation: 'Impudeur = absence de pudeur ; impudicité = caractère impudique.' },
    'impudique': { correction: 'impudique', explanation: 'Impudique = sans pudeur ; impudent = insolent.' },
    'impudent': { correction: 'impudent', explanation: 'Impudique = sans pudeur ; impudent = insolent.' },
    'immixtion': { correction: 'immixtion', explanation: 'Immixtion = action de s'immiscer.' },
    'impavide': { correction: 'impavide', explanation: 'Impavide = qui n'a pas peur ; impassible = sans émotion.' },
    'impassible': { correction: 'impassible', explanation: 'Impavide = sans peur ; impassible = sans émotion.' },
    'imputrescible': { correction: 'imputrescible', explanation: 'Imputrescible = qui ne pourrit pas.' },
    'inaudible': { correction: 'inaudible', explanation: 'Inaudible = qu'on ne peut entendre.' },
    'inclinaison': { correction: 'inclinaison', explanation: 'Inclinaison = état de ce qui est incliné ; inclination = penchant, goût.' },
    'inclination': { correction: 'inclination', explanation: 'Inclinaison = état incliné ; inclination = penchant, goût.' },
    'ingambe': { correction: 'ingambe', explanation: 'Ingambe = alerte, qui a de bonnes jambes.' },
    'ingérer': { correction: 'ingérer', explanation: 'Ingérer = avaler ; ingestion = action d'avaler.' },
    'inhiber': { correction: 'inhiber', explanation: 'Inhiber = bloquer ; inhibition = blocage.' },
    'inhibition': { correction: 'inhibition', explanation: 'Inhibition = blocage ; exhibition = action de montrer.' },
    'exhibition': { correction: 'exhibition', explanation: 'Inhibition = blocage ; exhibition = action de montrer.' },
    'inhumer': { correction: 'inhumer', explanation: 'Inhumer = enterrer ; exhumer = déterrer.' },
    'exhumer': { correction: 'exhumer', explanation: 'Inhumer = enterrer ; exhumer = déterrer.' },
    'iniquité': { correction: 'iniquité', explanation: 'Iniquité = injustice ; équité = justice.' },
    'équité': { correction: 'équité', explanation: 'Iniquité = injustice ; équité = justice.' },
    'initier': { correction: 'initier', explanation: 'Initier = révéler (à qqn) ; critiqué pour "commencer" (anglicisme).' },
    'instar': { correction: 'à l\'instar de', explanation: 'À l'instar de = comme, à l'exemple de.' },
    'interface': { correction: 'interface', explanation: 'Interface = limite d'échange.' },
    'interjeter': { correction: 'interjeter', explanation: 'Interjeter appel = faire appel.' },
    'introverti': { correction: 'introverti', explanation: 'Introverti = tourné vers soi ; interverti = inversé.' },
    'interverti': { correction: 'interverti', explanation: 'Introverti = tourné vers soi ; interverti = inversé.' },
    'irruption': { correction: 'irruption', explanation: 'Irruption = entrée soudaine ; éruption = jaillissement (volcan).' },
    'éruption': { correction: 'éruption', explanation: 'Irruption = entrée soudaine ; éruption = jaillissement.' },

    // J
    'jubiler': { correction: 'jubiler', explanation: 'Jubiler = se réjouir ; jubilé = année sainte, anniversaire.' },
    'jubilé': { correction: 'jubilé', explanation: 'Jubiler = se réjouir ; jubilé = année sainte, anniversaire.' },
    'judicieux': { correction: 'judicieux', explanation: 'Judicieux = pertinent ; judiciaire = relatif à la justice.' },
    'judiciaire': { correction: 'judiciaire', explanation: 'Judicieux = pertinent ; judiciaire = relatif à la justice.' },
    'justesse': { correction: 'justesse', explanation: 'Justesse = qualité de ce qui est juste ; justice = droit, équité.' },
    'justice': { correction: 'justice', explanation: 'Justesse = qualité ; justice = droit, équité.' },

    // L
    'la': { correction: 'la', explanation: 'La = article défini ; là = adverbe de lieu.' },
    'là': { correction: 'là', explanation: 'La = article ; là = adverbe de lieu.' },
    'lacis': { correction: 'lacis', explanation: 'Lacis = réseau ; lacet = cordon, nœud.' },
    'lacet': { correction: 'lacet', explanation: 'Lacis = réseau ; lacet = cordon.' },
    'laconique': { correction: 'laconique', explanation: 'Laconique = bref ; loquace = qui parle beaucoup.' },
    'loquace': { correction: 'loquace', explanation: 'Laconique = bref ; loquace = qui parle beaucoup.' },
    'lacune': { correction: 'lacune', explanation: 'Lacune = manque ; lagune = étendue d'eau salée.' },
    'lagune': { correction: 'lagune', explanation: 'Lacune = manque ; lagune = étendue d'eau salée.' },
    'laïc': { correction: 'laïc', explanation: 'Laïc = non religieux.' },
    'lamaserie': { correction: 'lamaserie', explanation: 'Lamaserie = couvent de lamas.' },
    'laps': { correction: 'laps', explanation: 'Laps = tombé (dans "laps et relaps") ; lapsus = erreur.' },
    'législation': { correction: 'législation', explanation: 'Législation = ensemble des lois ; législature = durée d'un mandat.' },
    'législature': { correction: 'législature', explanation: 'Législation = ensemble des lois ; législature = durée d'un mandat.' },
    'legs': { correction: 'legs', explanation: 'Legs = don par testament ; légataire = bénéficiaire.' },
    'légataire': { correction: 'légataire', explanation: 'Legs = don ; légataire = bénéficiaire.' },
    'libération': { correction: 'libération', explanation: 'Libération = action de libérer ; libéralisation = rendre plus libéral.' },
    'libéralisation': { correction: 'libéralisation', explanation: 'Libération = libérer ; libéralisation = rendre libéral.' },
    'limbe': { correction: 'limbe', explanation: 'Limbe = bord ; lymphe = liquide biologique.' },
    'lymphe': { correction: 'lymphe', explanation: 'Limbe = bord ; lymphe = liquide biologique.' },
    'luxe': { correction: 'luxe', explanation: 'Luxe = richesse ; luxure = débauche ; luxation = entorse.' },
    'luxure': { correction: 'luxure', explanation: 'Luxe = richesse ; luxure = débauche ; luxation = entorse.' },
    'luxation': { correction: 'luxation', explanation: 'Luxe = richesse ; luxure = débauche ; luxation = entorse.' },

    // M
    'magnificence': { correction: 'magnificence', explanation: 'Magnificence = beauté somptueuse ; munificence = générosité.' },
    'munificence': { correction: 'munificence', explanation: 'Magnificence = beauté ; munificence = générosité.' },
    'malignité': { correction: 'malignité', explanation: 'Malignité = caractère nuisible ; malice = espièglerie.' },
    'malice': { correction: 'malice', explanation: 'Malignité = nuisible ; malice = espièglerie.' },
    'malséant': { correction: 'malséant', explanation: 'Malséant = inconvenant ; messéant = qui ne convient pas.' },
    'messéant': { correction: 'messéant', explanation: 'Malséant = inconvenant ; messéant = qui ne convient pas.' },
    'mandant': { correction: 'mandant', explanation: 'Mandant = donneur de mandat ; mandataire = exécutant.' },
    'mandataire': { correction: 'mandataire', explanation: 'Mandant = donneur ; mandataire = exécutant.' },
    'mangeure': { correction: 'mangeure', explanation: 'Mangeure = trou dans une étoffe (prononcer "mangeure").' },
    'mappemonde': { correction: 'mappemonde', explanation: 'Mappemonde = carte plane du globe ; globe = sphère.' },
    'marger': { correction: 'marger', explanation: 'Marger = préparer une marge ; émarger = signer, recevoir un traitement.' },
    'émarger': { correction: 'émarger', explanation: 'Marger = préparer une marge ; émarger = signer, recevoir un traitement.' },
    'marguillier': { correction: 'marguillier', explanation: 'Marguillier = membre du conseil paroissial.' },
    'marqueterie': { correction: 'marqueterie', explanation: 'Marqueterie = assemblage de bois précieux.' },
    'matériau': { correction: 'matériau', explanation: 'Matériau = substance ; matériel = ensemble d'objets.' },
    'matériel': { correction: 'matériel', explanation: 'Matériau = substance ; matériel = ensemble d'objets.' },
    'mécréant': { correction: 'mécréant', explanation: 'Mécréant = incroyant (péjoratif) ; croyant = qui croit.' },
    'croyant': { correction: 'croyant', explanation: 'Mécréant = incroyant (péjoratif) ; croyant = qui croit.' },
    'médical': { correction: 'médical', explanation: 'Médical = relatif à la médecine ; médicinal = qui soigne.' },
    'médicinal': { correction: 'médicinal', explanation: 'Médical = relatif à la médecine ; médicinal = qui soigne.' },
    'mégalomane': { correction: 'mégalomane', explanation: 'Mégalomane = qui a la folie des grandeurs ; mythomane = qui ment pathologiquement.' },
    'mythomane': { correction: 'mythomane', explanation: 'Mégalomane = folie des grandeurs ; mythomane = qui ment.' },
    'mellification': { correction: 'mellification', explanation: 'Mellification = fabrication du miel.' },
    'mélodrame': { correction: 'mélodrame', explanation: 'Mélodrame = drame populaire ; mélomane = amateur de musique.' },
    'mélomane': { correction: 'mélomane', explanation: 'Mélodrame = drame ; mélomane = amateur de musique.' },
    'mémoire': { correction: 'mémoire', explanation: 'Mémoire (fém.) = faculté ; mémoire (masc.) = écrit.' },
    'ménagement': { correction: 'ménagement', explanation: 'Ménagement = égards ; management = gestion.' },
    'management': { correction: 'management', explanation: 'Ménagement = égards ; management = gestion.' },
    'méritant': { correction: 'méritant', explanation: 'Méritant = qui a du mérite ; méritoire = digne d'estime.' },
    'méritoire': { correction: 'méritoire', explanation: 'Méritant = qui a du mérite ; méritoire = digne d'estime.' },
    'métaboliser': { correction: 'métaboliser', explanation: 'Métaboliser = transformer (biologie, psychologie).' },
    'métempsycose': { correction: 'métempsycose', explanation: 'Métempsycose = réincarnation.' },
    'méthodique': { correction: 'méthodique', explanation: 'Méthodique = qui suit une méthode ; méthodiste = adepte du méthodisme.' },
    'méthodiste': { correction: 'méthodiste', explanation: 'Méthodique = qui suit une méthode ; méthodiste = adepte du méthodisme.' },
    'meurtre': { correction: 'meurtre', explanation: 'Meurtre = homicide sans préméditation ; assassinat = avec préméditation.' },
    'assassinat': { correction: 'assassinat', explanation: 'Meurtre = sans préméditation ; assassinat = avec préméditation.' },
    'miction': { correction: 'miction', explanation: 'Miction = action d'uriner ; mixtion = action de mélanger.' },
    'mixtion': { correction: 'mixtion', explanation: 'Miction = action d'uriner ; mixtion = action de mélanger.' },
    'million': { correction: 'million', explanation: 'Million = nom (prend un s au pluriel).' },
    'milliard': { correction: 'milliard', explanation: 'Milliard = nom (prend un s au pluriel).' },
    'mithridatiser': { correction: 'mithridatiser', explanation: 'Se mithridatiser = s'immuniser par petites doses.' },
    'mitigé': { correction: 'mitigé', explanation: 'Mitigé = atténué, mélangé.' },
    'modalisation': { correction: 'modalisation', explanation: 'Modalisation = expression du point de vue (linguistique) ; modélisation = construction de modèles.' },
    'modélisation': { correction: 'modélisation', explanation: 'Modalisation = point de vue ; modélisation = construction de modèles.' },
    'mode': { correction: 'mode', explanation: 'Mode (masc.) = manière ; mode (fém.) = usage, coutume.' },
    'moins-disant': { correction: 'moins-disant', explanation: 'Moins-disant = qui offre le prix le plus bas.' },
    'mieux-disant': { correction: 'mieux-disant', explanation: 'Mieux-disant = qui offre le prix le plus haut.' },
    'moins-perçu': { correction: 'moins-perçu', explanation: 'Moins-perçu = somme due non perçue ; trop-perçu = somme perçue en trop.' },
    'trop-perçu': { correction: 'trop-perçu', explanation: 'Moins-perçu = somme due non perçue ; trop-perçu = somme perçue en trop.' },
    'momie': { correction: 'momie', explanation: 'Momie = cadavre embaumé ; mômerie = enfantillage.' },
    'mômerie': { correction: 'mômerie', explanation: 'Momie = cadavre ; mômerie = enfantillage.' },
    'moral': { correction: 'moral', explanation: 'Moral (masc.) = état d'esprit ; morale (fém.) = règles de vie.' },
    'morale': { correction: 'morale', explanation: 'Moral (masc.) = état d'esprit ; morale (fém.) = règles de vie.' },
    'morgue': { correction: 'morgue', explanation: 'Morgue = lieu des morts, ou attitude hautaine.' },
    'myrrhe': { correction: 'myrrhe', explanation: 'Myrrhe = résine ; myrte = arbuste ; mitre = chapeau d'évêque.' },
    'myrte': { correction: 'myrte', explanation: 'Myrrhe = résine ; myrte = arbuste ; mitre = chapeau.' },
    'mitre': { correction: 'mitre', explanation: 'Myrrhe = résine ; myrte = arbuste ; mitre = chapeau.' },

    // N
    'natal': { correction: 'natal', explanation: 'Natal = de naissance ; natif = originaire.' },
    'natif': { correction: 'natif', explanation: 'Natal = de naissance ; natif = originaire.' },
    'nocturne': { correction: 'nocturne', explanation: 'Nocturne (masc.) = morceau de musique ; nocturne (fém.) = ouverture en soirée.' },
    'notable': { correction: 'notable', explanation: 'Notable = important, personne importante ; notoire = connu (parfois en mal).' }
};

// ---------------------------------------------------------------------
// RÈGLES DE VOCABULAIRE
// ---------------------------------------------------------------------

const vocabulaireRules = [
    // Règle 1 : Confusions de mots proches
    {
        name: 'confusion_mots_proches',
        description: 'Détecte les confusions entre mots de sens proche mais différents.',
        example: '❌ "Il vas à Paris" → ✅ "Il va à Paris"',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            doc.forEach(token => {
                const text = token.text.toLowerCase();
                if (confusions[text]) {
                    const confusion = confusions[text];
                    errors.push({
                        type: 'confusion_vocabulaire',
                        word: token.text,
                        correction: confusion.correction,
                        explanation: confusion.explanation,
                        offset: token.idx,
                        length: token.length,
                        severity: 'medium',
                        confidence: 0.8
                    });
                }
            });
            return errors;
        }
    },

    // Règle 2 : Usage incorrect de "s'avérer"
    {
        name: 's_avérer_pléonasme',
        description: 'Détecte l\'usage de "s\'avérer" avec un adjectif qui indique déjà une vérité.',
        example: '❌ "Cette hypothèse s\'avère vraie" → ✅ "Cette hypothèse se révèle" ou "Cette hypothèse est vraie"',
        pattern: [
            { 'RIGHT_ID': 'verb', 'RIGHT_ATTRS': { 'TEXT': 's\'avère' } },
            { 'LEFT_ID': 'verb', 'REL_OP': '>', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['vrai', 'faux', 'exact', 'correct', 'incorrect', 'certain', 'incertain'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const verb = doc[match[1]];
                const adj = doc[match[2]];
                errors.push({
                    type: 'pléonasme_s_avérer',
                    word: 's\'avère ' + adj.text,
                    correction: 'se révèle ' + adj.text,
                    explanation: '"S\'avérer" signifie "se révéler". L\'adjectif qui suit indique déjà une vérité, ce qui crée un pléonasme. Exemple : "s\'avère vrai" → "se révèle" ou "est vrai".',
                    offset: verb.idx,
                    length: adj.idx + adj.length - verb.idx,
                    severity: 'medium',
                    confidence: 0.7
                });
            });
            return errors;
        }
    },

    // Règle 3 : Confusion entre "la" et "là"
    {
        name: 'confusion_la_la',
        description: 'Détecte la confusion entre l\'article "la" et l\'adverbe "là".',
        example: '❌ "Viens la demain" → ✅ "Viens là demain"',
        pattern: [
            { 'RIGHT_ID': 'word', 'RIGHT_ATTRS': { 'TEXT': 'la' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const token = doc[match[1]];
                const nextToken = doc[token.i + 1];
                const prevToken = doc[token.i - 1];
                
                // Si "la" est suivi d'un verbe ou si le contexte suggère un lieu
                if (nextToken && (nextToken.pos === 'VERB' || nextToken.pos === 'AUX')) {
                    errors.push({
                        type: 'confusion_la_la',
                        word: 'la',
                        correction: 'là',
                        explanation: '"La" (sans accent) est un article défini. "Là" (avec accent) est un adverbe de lieu. Dans ce contexte, il faut "là".',
                        offset: token.idx,
                        length: 2,
                        severity: 'high',
                        confidence: 0.9
                    });
                }
            });
            return errors;
        }
    },

    // Règle 4 : Confusion entre "ou" et "où"
    {
        name: 'confusion_ou_où',
        description: 'Détecte la confusion entre la conjonction "ou" et le pronom relatif "où".',
        example: '❌ "La maison ou je vis" → ✅ "La maison où je vis"',
        pattern: [
            { 'RIGHT_ID': 'word', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['ou', 'où'] } } }
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
                        explanation: '"Ou" (sans accent) est une conjonction de coordination (alternative). "Où" (avec accent) est un pronom relatif ou un adverbe de lieu. Ici, il faut "où".',
                        offset: token.idx,
                        length: 2,
                        severity: 'high',
                        confidence: 0.9
                    });
                }
            });
            return errors;
        }
    },

    // Règle 5 : Confusion entre "a" et "à"
    {
        name: 'confusion_a_a',
        description: 'Détecte la confusion entre le verbe "a" et la préposition "à".',
        example: '❌ "Il a Paris" → ✅ "Il est à Paris"',
        pattern: [
            { 'RIGHT_ID': 'word', 'RIGHT_ATTRS': { 'TEXT': { 'IN': ['a', 'à'] } } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const token = doc[match[1]];
                const text = token.text;
                const nextToken = doc[token.i + 1];
                
                if (text === 'a' && nextToken && nextToken.pos === 'PROPN') {
                    errors.push({
                        type: 'confusion_a_a',
                        word: 'a',
                        correction: 'à',
                        explanation: '"A" (sans accent) est le verbe avoir conjugué. "À" (avec accent) est une préposition. Devant un nom propre (lieu), il faut "à".',
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

    // Règle 6 : Usage incorrect de "en fait"
    {
        name: 'en_fait_usage',
        description: 'Vérifie l\'usage de "en fait" qui peut être mal placé ou redondant.',
        example: '❌ "Il est, en fait, très intelligent" → ✅ "Il est très intelligent" ou "Il est en fait très intelligent"',
        pattern: [
            { 'RIGHT_ID': 'expr', 'RIGHT_ATTRS': { 'TEXT': 'en fait' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const expr = doc[match[1]];
                const prevToken = doc[expr.i - 1];
                const nextToken = doc[expr.i + 1];
                
                // Si "en fait" est entre virgules et n'apporte pas d'information
                if (prevToken && prevToken.text === ',' && nextToken && nextToken.text === ',') {
                    errors.push({
                        type: 'en_fait_superflu',
                        word: 'en fait',
                        correction: '',
                        explanation: '"En fait" placé entre virgules est souvent superflu. Supprimez-le si vous n\'ajoutez pas d\'information.',
                        offset: expr.idx,
                        length: 7,
                        severity: 'low',
                        confidence: 0.6
                    });
                }
            });
            return errors;
        }
    },

    // Règle 7 : Anglicismes courants
    {
        name: 'anglicismes_courants',
        description: 'Détecte les anglicismes courants et suggère des alternatives françaises.',
        example: '❌ "Le meeting" → ✅ "La réunion"',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            const anglicismes = {
                'meeting': 'réunion',
                'briefing': 'point',
                'deadline': 'date limite',
                'manager': 'directeur',
                'leader': 'leader', // conservé mais peut être remplacé par "meneur"
                'challenge': 'défi',
                'performance': 'performance', // conservé
                'business': 'affaires',
                'marketing': 'marketing', // conservé
                'design': 'design', // conservé
                'feedback': 'retour',
                'team': 'équipe',
                'project': 'projet',
                'plan': 'plan',
                'goal': 'objectif',
                'target': 'cible',
                'user': 'utilisateur',
                'client': 'client',
                'server': 'serveur',
                'database': 'base de données',
                'network': 'réseau',
                'software': 'logiciel',
                'hardware': 'matériel',
                'email': 'courriel',
                'website': 'site web',
                'application': 'application',
                'interface': 'interface',
                'system': 'système',
                'feature': 'fonctionnalité',
                'bug': 'bogue',
                'error': 'erreur',
                'test': 'test',
                'debug': 'déboguer',
                'deploy': 'déployer',
                'update': 'mettre à jour',
                'backup': 'sauvegarder',
                'password': 'mot de passe',
                'username': 'nom d\'utilisateur',
                'profile': 'profil',
                'account': 'compte',
                'session': 'session',
                'cookie': 'cookie',
                'cache': 'cache',
                'memory': 'mémoire',
                'storage': 'stockage',
                'file': 'fichier',
                'folder': 'dossier',
                'directory': 'répertoire',
                'path': 'chemin',
                'link': 'lien',
                'url': 'URL',
                'http': 'HTTP',
                'https': 'HTTPS',
                'api': 'API',
                'json': 'JSON',
                'xml': 'XML',
                'html': 'HTML',
                'css': 'CSS',
                'javascript': 'JavaScript',
                'python': 'Python',
                'java': 'Java',
                'php': 'PHP',
                'sql': 'SQL',
                'nosql': 'NoSQL',
                'framework': 'framework',
                'library': 'bibliothèque',
                'package': 'paquet',
                'module': 'module',
                'function': 'fonction',
                'method': 'méthode',
                'class': 'classe',
                'object': 'objet',
                'array': 'tableau',
                'string': 'chaîne',
                'number': 'nombre',
                'boolean': 'booléen',
                'null': 'nul',
                'undefined': 'indéfini',
                'true': 'vrai',
                'false': 'faux',
                'if': 'si',
                'else': 'sinon',
                'for': 'pour',
                'while': 'tant que',
                'do': 'faire',
                'switch': 'selon',
                'case': 'cas',
                'break': 'arrêter',
                'continue': 'continuer',
                'return': 'retourner',
                'try': 'essayer',
                'catch': 'attraper',
                'finally': 'finalement',
                'throw': 'lancer',
                'async': 'asynchrone',
                'await': 'attendre',
                'promise': 'promesse',
                'callback': 'rappel',
                'event': 'événement',
                'listener': 'écouteur',
                'handler': 'gestionnaire',
                'request': 'requête',
                'response': 'réponse',
                'status': 'statut',
                'code': 'code',
                'message': 'message',
                'data': 'données',
                'content': 'contenu',
                'type': 'type',
                'format': 'format',
                'length': 'longueur',
                'size': 'taille',
                'width': 'largeur',
                'height': 'hauteur',
                'position': 'position',
                'color': 'couleur',
                'background': 'arrière-plan',
                'border': 'bordure',
                'margin': 'marge',
                'padding': 'remplissage',
                'display': 'affichage',
                'visibility': 'visibilité',
                'opacity': 'opacité',
                'transform': 'transformation',
                'animation': 'animation',
                'transition': 'transition',
                'hover': 'survol',
                'focus': 'focus',
                'click': 'clic',
                'scroll': 'défilement',
                'resize': 'redimensionnement',
                'load': 'chargement',
                'unload': 'déchargement',
                'error': 'erreur',
                'warning': 'avertissement',
                'info': 'information',
                'success': 'succès',
                'danger': 'danger'
            };
            
            doc.forEach(token => {
                const text = token.text.toLowerCase();
                if (anglicismes[text]) {
                    errors.push({
                        type: 'anglicisme',
                        word: token.text,
                        correction: anglicismes[text],
                        explanation: `Anglicisme courant. Préférez "${anglicismes[text]}" qui est l'équivalent français.`,
                        offset: token.idx,
                        length: token.length,
                        severity: 'low',
                        confidence: 0.7
                    });
                }
            });
            return errors;
        }
    },

    // Règle 8 : Pléonasmes courants
    {
        name: 'pleonasmes_courants',
        description: 'Détecte les pléonasmes courants dans la langue française.',
        example: '❌ "Monter en haut" → ✅ "Monter"',
        pattern: null,
        action: function(doc, matches) {
            const errors = [];
            const pleonasmes = [
                { pattern: 'monter en haut', correction: 'monter', explanation: '"Monter" implique déjà "en haut".' },
                { pattern: 'descendre en bas', correction: 'descendre', explanation: '"Descendre" implique déjà "en bas".' },
                { pattern: 'sortir dehors', correction: 'sortir', explanation: '"Sortir" implique déjà "dehors".' },
                { pattern: 'entrer dedans', correction: 'entrer', explanation: '"Entrer" implique déjà "dedans".' },
                { pattern: 'avancer en avant', correction: 'avancer', explanation: '"Avancer" implique déjà "en avant".' },
                { pattern: 'reculer en arrière', correction: 'reculer', explanation: '"Reculer" implique déjà "en arrière".' },
                { pattern: 's\'avérer vrai', correction: 'être vrai', explanation: '"S\'avérer" signifie "se révéler comme vrai".' },
                { pattern: 's\'avérer faux', correction: 'être faux', explanation: '"S\'avérer" signifie "se révéler comme faux".' },
                { pattern: 'donner gratuitement', correction: 'donner', explanation: '"Donner" peut impliquer la gratuité selon le contexte.' },
                { pattern: 'gratuitement gratuit', correction: 'gratuitement', explanation: 'Redondance : "gratuitement" signifie déjà "gratuit".' },
                { pattern: 'complètement plein', correction: 'plein', explanation: '"Plein" signifie déjà "complètement rempli".' },
                { pattern: 'entièrement entier', correction: 'entier', explanation: '"Entier" signifie déjà "entièrement".' },
                { pattern: 'premièrement premier', correction: 'premier', explanation: '"Premier" implique déjà "premièrement".' },
                { pattern: 'finalement final', correction: 'final', explanation: '"Final" implique déjà "finalement".' },
                { pattern: 'précisément précis', correction: 'précis', explanation: '"Précis" implique déjà "précisément".' },
                { pattern: 'exactement exact', correction: 'exact', explanation: '"Exact" implique déjà "exactement".' },
                { pattern: 'totalement total', correction: 'total', explanation: '"Total" implique déjà "totalement".' },
                { pattern: 'complètement complet', correction: 'complet', explanation: '"Complet" implique déjà "complètement".' },
                { pattern: 'entièrement complet', correction: 'complet', explanation: '"Complet" implique déjà "entièrement".' },
                { pattern: 'parfaitement parfait', correction: 'parfait', explanation: '"Parfait" implique déjà "parfaitement".' },
                { pattern: 'absolument absolu', correction: 'absolu', explanation: '"Absolu" implique déjà "absolument".' },
                { pattern: 'relativement relatif', correction: 'relatif', explanation: '"Relatif" implique déjà "relativement".' },
                { pattern: 'généralement général', correction: 'général', explanation: '"Général" implique déjà "généralement".' },
                { pattern: 'particulièrement particulier', correction: 'particulier', explanation: '"Particulier" implique déjà "particulièrement".' },
                { pattern: 'spécifiquement spécifique', correction: 'spécifique', explanation: '"Spécifique" implique déjà "spécifiquement".' },
                { pattern: 'évidemment évident', correction: 'évident', explanation: '"Évident" implique déjà "évidemment".' },
                { pattern: 'clairement clair', correction: 'clair', explanation: '"Clair" implique déjà "clairement".' },
                { pattern: 'nettement net', correction: 'net', explanation: '"Net" implique déjà "nettement".' },
                { pattern: 'brutalement brutal', correction: 'brutal', explanation: '"Brutal" implique déjà "brutalement".' },
                { pattern: 'violemment violent', correction: 'violent', explanation: '"Violent" implique déjà "violemment".' },
                { pattern: 'rapidement rapide', correction: 'rapide', explanation: '"Rapide" implique déjà "rapidement".' },
                { pattern: 'lentement lent', correction: 'lent', explanation: '"Lent" implique déjà "lentement".' },
                { pattern: 'doucement doux', correction: 'doux', explanation: '"Doux" implique déjà "doucement".' },
                { pattern: 'durement dur', correction: 'dur', explanation: '"Dur" implique déjà "durement".' },
                { pattern: 'fraîchement frais', correction: 'frais', explanation: '"Frais" implique déjà "fraîchement".' },
                { pattern: 'chaudement chaud', correction: 'chaud', explanation: '"Chaud" implique déjà "chaudement".' },
                { pattern: 'froidement froid', correction: 'froid', explanation: '"Froid" implique déjà "froidement".' },
                { pattern: 'silencieusement silencieux', correction: 'silencieux', explanation: '"Silencieux" implique déjà "silencieusement".' },
                { pattern: 'bruyamment bruyant', correction: 'bruyant', explanation: '"Bruyant" implique déjà "bruyamment".' },
                { pattern: 'calmement calme', correction: 'calme', explanation: '"Calme" implique déjà "calmement".' },
                { pattern: 'agréablement agréable', correction: 'agréable', explanation: '"Agréable" implique déjà "agréablement".' },
                { pattern: 'désagréablement désagréable', correction: 'désagréable', explanation: '"Désagréable" implique déjà "désagréablement".' }
            ];
            
            // Détection simple des pléonasmes
            const text = doc.map(t => t.text).join(' ').toLowerCase();
            pleonasmes.forEach(pleonasme => {
                if (text.includes(pleonasme.pattern)) {
                    errors.push({
                        type: 'pléonasme',
                        word: pleonasme.pattern,
                        correction: pleonasme.correction,
                        explanation: pleonasme.explanation,
                        offset: 0,
                        length: pleonasme.pattern.length,
                        severity: 'low',
                        confidence: 0.6
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

const allVocabulaireRules = vocabulaireRules;

console.log(`✅ ${allVocabulaireRules.length} règles de vocabulaire chargées.`);
console.log('📖 Chaque règle inclut une explication détaillée et un exemple illustratif.');

// Export pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = allVocabulaireRules;
} else if (typeof window !== 'undefined') {
    window.vocabulaireRules = allVocabulaireRules;
}
