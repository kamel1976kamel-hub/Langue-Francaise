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
    'acception': { correction: 'acceptation', explanation: 'Acception = sens d\'un mot ; acceptation = fait d\'accepter.' },
    'acceptation': { correction: 'acception', explanation: 'Acception = sens d\'un mot ; acceptation = fait d\'accepter.' },
    'addiction': { correction: 'dépendance', explanation: 'Addiction = dépendance à un produit ; adduction = rapprochement, amenée d\'eau.' },
    'adduction': { correction: 'addiction', explanation: 'Addiction = dépendance à un produit ; adduction = rapprochement, amenée d\'eau.' },
    'affidé': { correction: 'complice', explanation: 'Affidé = complice d\'une action illégale ; affilié = membre d\'une organisation.' },
    'affilié': { correction: 'affidé', explanation: 'Affidé = complice d\'une action illégale ; affilié = membre d\'une organisation.' },
    'agissements': { correction: 'actions (neutre)', explanation: 'Agissements (pluriel) = actions répréhensibles ; actions = neutre.' },
    'agonir': { correction: 'agoniser', explanation: 'Agonir (d\'injures) = couvrir d\'injures ; agoniser = être en train de mourir.' },
    'agoniser': { correction: 'agonir', explanation: 'Agonir (d\'injures) = couvrir d\'injures ; agoniser = être en train de mourir.' },
    'aléa': { correction: 'risque', explanation: 'Aléa (masculin) = hasard, risque ; alée (féminin) = passage, allée.' },
    'alléguer': { correction: 'prétendre', explanation: 'Alléguer = donner comme prétexte, prétendre ; léguer = donner par testament.' },
    'léguer': { correction: 'alléguer', explanation: 'Alléguer = donner comme prétexte, prétendre ; léguer = donner par testament.' },
    'alternance': { correction: 'succession', explanation: 'Alternance = succession régulière ; alternative = choix entre deux options.' },
    'alternative': { correction: 'choix', explanation: 'Alternative = choix entre deux options ; ne pas l\'employer pour "option" seule.' },
    'amender': { correction: 'améliorer', explanation: 'Amender = améliorer (une loi, un texte) ; amodier = donner en location (une terre).' },
    'amodier': { correction: 'amender', explanation: 'Amender = améliorer (une loi, un texte) ; amodier = donner en location (une terre).' },
    'analogue': { correction: 'semblable', explanation: 'Analogue = qui ressemble à ; analogique = qui fonctionne par analogie.' },
    'analogique': { correction: 'analogue', explanation: 'Analogue = qui ressemble à ; analogique = qui fonctionne par analogie.' },
    'anonyme': { correction: 'sans nom', explanation: 'Anonyme = sans nom ; éponyme = qui donne son nom.' },
    'éponyme': { correction: 'anonyme', explanation: 'Anonyme = sans nom ; éponyme = qui donne son nom.' },
    'apocryphe': { correction: 'non authentique', explanation: 'Apocryphe = non authentique ; anonyme = sans nom.' },
    'à nouveau': { correction: 'de façon nouvelle', explanation: 'À nouveau = d\'une manière nouvelle ; de nouveau = une autre fois (identique).' },
    'de nouveau': { correction: 'à nouveau', explanation: 'À nouveau = d\'une manière nouvelle ; de nouveau = une autre fois (identique).' },
    'antagoniste': { correction: 'adversaire', explanation: 'Antagoniste = adversaire ; protagoniste = acteur principal, participant.' },
    'protagoniste': { correction: 'antagoniste', explanation: 'Antagoniste = adversaire ; protagoniste = acteur principal, participant.' },
    'apurer': { correction: 'vérifier (comptes)', explanation: 'Apurer = vérifier des comptes ; épurer = purifier, rendre plus pur.' },
    'épurer': { correction: 'apurer', explanation: 'Apurer = vérifier des comptes ; épurer = purifier, rendre plus pur.' },
    'aréole': { correction: 'cercle coloré', explanation: 'Aréole = cercle autour du mamelon ; auréole = cercle lumineux, tache circulaire.' },
    'auréole': { correction: 'aréole', explanation: 'Aréole = cercle autour du mamelon ; auréole = cercle lumineux, tache circulaire.' },
    'arrêt': { correction: 'décision de justice', explanation: 'Arrêt = décision d\'une cour supérieure ; arrêté = décision administrative.' },
    'arrêté': { correction: 'arrêt', explanation: 'Arrêt = décision d\'une cour supérieure ; arrêté = décision administrative.' },
    'assuétude': { correction: 'dépendance', explanation: 'Assuétude = dépendance à un produit ; addiction = même sens, anglicisme.' },
    'ataraxie': { correction: 'paix intérieure', explanation: 'Ataraxie = absence de troubles ; ataxie = incoordination des mouvements.' },
    'ataxie': { correction: 'ataraxie', explanation: 'Ataraxie = absence de troubles ; ataxie = incoordination des mouvements.' },
    'avanie': { correction: 'humiliation', explanation: 'Avanie = affront, humiliation ; avarie = dégât, dommage.' },
    'avarie': { correction: 'avanie', explanation: 'Avanie = affront, humiliation ; avarie = dégât, dommage.' },
    'avatar': { correction: 'transformation', explanation: 'Avatar = transformation, changement ; ne pas l\'employer pour "désagrément".' },
    'avérer': { correction: 's\'avérer', explanation: 'S\'avérer = se révéler (déjà "vrai"), éviter "s\'avérer vrai" (pléonasme).' },

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
    'chômage': { correction: 'absence d\'emploi', explanation: 'Chômage = absence d\'emploi ; chaumage = action de couper le chaume.' },
    'chaumage': { correction: 'chômage', explanation: 'Chômage = absence d\'emploi ; chaumage = action de couper le chaume.' },
    'circonspect': { correction: 'prudent', explanation: 'Circonspect = qui manifeste de la prudence.' },
    'colérique': { correction: 'coléreux', explanation: 'Colérique = qui se met en colère ; cholérique = relatif au choléra.' },
    'coléreux': { correction: 'colérique', explanation: 'Colérique = qui se met en colère ; cholérique = relatif au choléra.' },
    'cholérique': { correction: 'colérique', explanation: 'Colérique = qui se met en colère ; cholérique = relatif au choléra.' },
    'collusion': { correction: 'entente secrète', explanation: 'Collusion = entente secrète contre des tiers ; collision = choc, rencontre brutale.' },
    'collision': { correction: 'collusion', explanation: 'Collusion = entente secrète contre des tiers ; collision = choc, rencontre brutale.' },
    'colon': { correction: 'habitant d\'une colonie', explanation: 'Colon = habitant d\'une colonie ; côlon = partie de l\'intestin.' },
    'côlon': { correction: 'colon', explanation: 'Colon = habitant d\'une colonie ; côlon = partie de l\'intestin.' },
    'colonisateur': { correction: 'colonisateur', explanation: 'Colonisateur = qui colonise ; colonialiste = partisan de la colonisation (idéologie).' },
    'colonialiste': { correction: 'colonisateur', explanation: 'Colonisateur = qui colonise ; colonialiste = partisan de la colonisation.' },
    'commanditaire': { correction: 'financeur', explanation: 'Commanditaire = celui qui apporte des fonds ; commendataire = gestionnaire d\'un bien ecclésiastique.' },
    'commendataire': { correction: 'commanditaire', explanation: 'Commanditaire = celui qui apporte des fonds ; commendataire = gestionnaire d\'un bien ecclésiastique.' },
    'commémorer': { correction: 'commémorer', explanation: 'Commémorer = célébrer le souvenir ; fêter = célébrer un événement heureux.' },
    'compréhensible': { correction: 'compréhensible', explanation: 'Compréhensible = qui peut être compris ; compréhensif = qui comprend les autres.' },
    'compréhensif': { correction: 'compréhensif', explanation: 'Compréhensible = qui peut être compris ; compréhensif = qui comprend les autres.' },
    'concupiscence': { correction: 'désir des plaisirs', explanation: 'Concupiscence = désir des plaisirs (souvent charnels).' },
    'conjoncture': { correction: 'situation', explanation: 'Conjoncture = situation résultant de circonstances ; conjecture = hypothèse, supposition.' },
    'conjecture': { correction: 'conjoncture', explanation: 'Conjoncture = situation résultant de circonstances ; conjecture = hypothèse, supposition.' },
    'conséquent': { correction: 'logique', explanation: 'Conséquent = logique (avec ses principes) ; ne pas l\'employer pour "important".' },
    'contigu': { correction: 'voisin', explanation: 'Contigu = voisin, adjacent.' },
    'contondant': { correction: 'qui blesse sans couper', explanation: 'Contondant = qui meurtrit sans couper.' },
    'contumace': { correction: 'absence à son procès', explanation: 'Contumace = état d\'une personne jugée en son absence.' },
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
    'damer': { correction: 'tasser', explanation: 'Damer = tasser, doubler au jeu de dames ; damner = condamner à l\'enfer.' },
    'damner': { correction: 'damer', explanation: 'Damer = tasser, doubler au jeu de dames ; damner = condamner à l\'enfer.' },
    'datif': { correction: 'cas grammatical', explanation: 'Datif = cas du complément d\'attribution.' },
    'débâcle': { correction: 'rupture des glaces', explanation: 'Débâcle = rupture des glaces, déroute ; embâcle = obstruction par les glaces.' },
    'embâcle': { correction: 'débâcle', explanation: 'Débâcle = rupture des glaces, déroute ; embâcle = obstruction par les glaces.' },
    'décade': { correction: 'dix jours', explanation: 'Décade = dix jours ; décennie = dix ans.' },
    'décennie': { correction: 'dix ans', explanation: 'Décade = dix jours ; décennie = dix ans.' },
    'décrépi': { correction: 'décrépi (mur)', explanation: 'Décrépi = sans crépi (mur) ; décrépit = vieilli (personne).' },
    'décrépit': { correction: 'décrépi', explanation: 'Décrépi = sans crépi (mur) ; décrépit = vieilli (personne).' },
    'dédommager': { correction: 'indemniser', explanation: 'Dédommager = indemniser ; endommager = abîmer.' },
    'endommager': { correction: 'dédommager', explanation: 'Dédommager = indemniser ; endommager = abîmer.' },
    'défalquer': { correction: 'déduire', explanation: 'Défalquer = déduire (comptabilité) ; ne pas confondre avec catafalque.' },
    'dégingandé': { correction: 'dégingandé', explanation: 'Dégingandé = dont l\'allure est désarticulée.' },
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
    'écaler': { correction: 'écaler', explanation: 'Écaler = enlever l\'écale (œuf, noix) ; écailler = enlever les écailles (poisson).' },
    'écailler': { correction: 'écailler', explanation: 'Écaler = enlever l\'écale ; écailler = enlever les écailles.' },
    'éclaircir': { correction: 'rendre plus clair', explanation: 'Éclaircir = rendre plus clair ; éclairer = donner de la lumière.' },
    'éclairer': { correction: 'éclairer', explanation: 'Éclaircir = rendre plus clair ; éclairer = donner de la lumière.' },
    'écoper': { correction: 'vider l\'eau', explanation: 'Écoper = vider l\'eau (bateau), recevoir (une sanction).' },
    'efflorescence': { correction: 'fleurissement', explanation: 'Efflorescence = épanouissement, pruine ; inflorescence = disposition des fleurs.' },
    'inflorescence': { correction: 'efflorescence', explanation: 'Efflorescence = épanouissement ; inflorescence = disposition des fleurs.' },
    'égayer': { correction: 'égayer', explanation: 'Égayer = rendre gai ; égailler = disperser.' },
    'égailler': { correction: 'égailler', explanation: 'Égayer = rendre gai ; égailler = disperser.' },
    'éluder': { correction: 'éluder', explanation: 'Éluder = éviter ; élucider = éclaircir ; élider = supprimer une voyelle.' },
    'élucider': { correction: 'élucider', explanation: 'Éluder = éviter ; élucider = éclaircir ; élider = supprimer une voyelle.' },
    'élider': { correction: 'élider', explanation: 'Éluder = éviter ; élucider = éclaircir ; élider = supprimer une voyelle.' },
    'émérite': { correction: 'émérite', explanation: 'Émérite = qui a de l\'expérience ; méritant = qui a du mérite.' },
    'méritant': { correction: 'méritant', explanation: 'Émérite = qui a de l\'expérience ; méritant = qui a du mérite.' },
    'émigrer': { correction: 'émigrer', explanation: 'Émigrer = quitter son pays ; immigrer = entrer dans un pays.' },
    'immigrer': { correction: 'immigrer', explanation: 'Émigrer = quitter son pays ; immigrer = entrer dans un pays.' },
    'éminent': { correction: 'éminent', explanation: 'Éminent = élevé, remarquable ; imminent = qui va arriver bientôt.' },
    'imminent': { correction: 'imminent', explanation: 'Éminent = élevé, remarquable ; imminent = qui va arriver bientôt.' },
    'empreinte': { correction: 'empreinte', explanation: 'Empreinte = trace ; emprunt = ce qu\'on emprunte.' },
    'emprunt': { correction: 'emprunt', explanation: 'Empreinte = trace ; emprunt = ce qu\'on emprunte.' },
    'endémie': { correction: 'endémie', explanation: 'Endémie = maladie permanente ; épidémie = atteinte soudaine et étendue.' },
    'épidémie': { correction: 'épidémie', explanation: 'Endémie = maladie permanente ; épidémie = atteinte soudaine et étendue.' },
    'entrefaites': { correction: 'sur ces entrefaites', explanation: 'Sur ces entrefaites = à ce moment-là.' },
    'entregent': { correction: 'entregent', explanation: 'Entregent = habileté à se faire valoir.' },
    'énumérer': { correction: 'énumérer', explanation: 'Énumérer = lister ; rémunérer = payer.' },
    'rémunérer': { correction: 'rémunérer', explanation: 'Énumérer = lister ; rémunérer = payer.' },
    'envahissement': { correction: 'envahissement', explanation: 'Envahissement = action d\'envahir (progressif) ; invasion = irruption brutale.' },
    'invasion': { correction: 'invasion', explanation: 'Envahissement = progressif ; invasion = brutale.' },
    'envie': { correction: 'envie', explanation: 'Envie = désir ; à l\'envi = à qui mieux mieux.' },
    'envi': { correction: 'à l\'envi', explanation: 'Envie = désir ; à l\'envi = à qui mieux mieux.' },
    'éon': { correction: 'éon', explanation: 'Éon = éternité (philo.) ; éonisme = travestisme.' },
    'épigramme': { correction: 'épigramme', explanation: 'Épigramme (fém.) = petit poème satirique ; épigramme (masc.) = tranche grillée.' },
    'épitaphe': { correction: 'épitaphe', explanation: 'Épitaphe = inscription funéraire ; épigraphe = inscription sur un monument, citation.' },
    'épigraphe': { correction: 'épigraphe', explanation: 'Épitaphe = inscription funéraire ; épigraphe = inscription, citation.' },
    'équanimité': { correction: 'égalité d\'humeur', explanation: 'Équanimité = sérénité, égalité d\'humeur.' },
    'espèce': { correction: 'espèce', explanation: 'Une espèce de (féminin).' },
    'et cetera': { correction: 'et cetera', explanation: 'Et cetera (etc.) = et les autres choses.' },
    'événement': { correction: 'événement', explanation: 'Événement = ce qui arrive ; avènement = accession à une dignité.' },
    'avènement': { correction: 'avènement', explanation: 'Événement = ce qui arrive ; avènement = accession à une dignité.' },
    'exaltation': { correction: 'exaltation', explanation: 'Exaltation = surexcitation intellectuelle ; exultation = grande joie.' },
    'exultation': { correction: 'exultation', explanation: 'Exaltation = surexcitation ; exultation = grande joie.' },
    'excuse': { correction: 'excuse', explanation: 'Excuse = justification ; "je m\'excuse" est critiqué (préférer "excusez-moi").' },
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
    'feuille': { correction: 'feuille', explanation: 'Feuille = page volante ; feuillet = page d\'un cahier.' },
    'feuillet': { correction: 'feuillet', explanation: 'Feuille = page volante ; feuillet = page d\'un cahier.' },
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
    'gémonies': { correction: 'gémonies', explanation: 'Gémonies = lieu d\'exposition (vouer aux gémonies) ; hégémonie = domination.' },
    'hégémonie': { correction: 'hégémonie', explanation: 'Gémonies = lieu d\'exposition ; hégémonie = domination.' },
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
    'heur': { correction: 'heur', explanation: 'Heur = chance (avoir l\'heur de) ; heure = 60 minutes.' },
    'heure': { correction: 'heure', explanation: 'Heur = chance ; heure = 60 minutes.' },
    'hiatus': { correction: 'hiatus', explanation: 'Hiatus = succession de deux voyelles, rupture.' },
    'hiberner': { correction: 'hiberner', explanation: 'Hiberner = être en hibernation ; hiverner = passer l\'hiver à l\'abri.' },
    'hiverner': { correction: 'hiverner', explanation: 'Hiberner = être en hibernation ; hiverner = passer l\'hiver à l\'abri.' },
    'holographe': { correction: 'holographe', explanation: 'Holographe = écrit de la main du signataire.' },
    'hospice': { correction: 'hospice', explanation: 'Hospice = établissement de soin ; auspices = protection.' },
    'auspices': { correction: 'auspices', explanation: 'Hospice = établissement ; auspices = protection.' },

    // I
    'idiotisme': { correction: 'idiotisme', explanation: 'Idiotisme = expression propre à une langue ; idiotie = bêtise.' },
    'idiotie': { correction: 'idiotie', explanation: 'Idiotisme = expression propre à une langue ; idiotie = bêtise.' },
    'imbiber': { correction: 'imbiber', explanation: 'Imbiber = imprégner ; imbibition = action d\'imbiber.' },
    'impétrant': { correction: 'impétrant', explanation: 'Impétrant = celui qui a obtenu un titre.' },
    'impudeur': { correction: 'impudeur', explanation: 'Impudeur = absence de pudeur ; impudicité = caractère impudique.' },
    'impudicité': { correction: 'impudicité', explanation: 'Impudeur = absence de pudeur ; impudicité = caractère impudique.' },
    'impudique': { correction: 'impudique', explanation: 'Impudique = sans pudeur ; impudent = insolent.' },
    'impudent': { correction: 'impudent', explanation: 'Impudique = sans pudeur ; impudent = insolent.' },
    'immixtion': { correction: 'immixtion', explanation: 'Immixtion = action de s\'immiscer.' },
    'impavide': { correction: 'impavide', explanation: 'Impavide = qui n\'a pas peur ; impassible = sans émotion.' },
    'impassible': { correction: 'impassible', explanation: 'Impavide = sans peur ; impassible = sans émotion.' },
    'imputrescible': { correction: 'imputrescible', explanation: 'Imputrescible = qui ne pourrit pas.' },
    'inaudible': { correction: 'inaudible', explanation: 'Inaudible = qu\'on ne peut entendre.' },
    'inclinaison': { correction: 'inclinaison', explanation: 'Inclinaison = état de ce qui est incliné ; inclination = penchant, goût.' },
    'inclination': { correction: 'inclination', explanation: 'Inclinaison = état incliné ; inclination = penchant, goût.' },
    'ingambe': { correction: 'ingambe', explanation: 'Ingambe = alerte, qui a de bonnes jambes.' },
    'ingérer': { correction: 'ingérer', explanation: 'Ingérer = avaler ; ingestion = action d\'avaler.' },
    'inhiber': { correction: 'inhiber', explanation: 'Inhiber = bloquer ; inhibition = blocage.' },
    'inhibition': { correction: 'inhibition', explanation: 'Inhibition = blocage ; exhibition = action de montrer.' },
    'exhibition': { correction: 'exhibition', explanation: 'Inhibition = blocage ; exhibition = action de montrer.' },
    'inhumer': { correction: 'inhumer', explanation: 'Inhumer = enterrer ; exhumer = déterrer.' },
    'exhumer': { correction: 'exhumer', explanation: 'Inhumer = enterrer ; exhumer = déterrer.' },
    'iniquité': { correction: 'iniquité', explanation: 'Iniquité = injustice ; équité = justice.' },
    'équité': { correction: 'équité', explanation: 'Iniquité = injustice ; équité = justice.' },
    'initier': { correction: 'initier', explanation: 'Initier = révéler (à qqn) ; critiqué pour "commencer" (anglicisme).' },
    'instar': { correction: 'à l\'instar de', explanation: 'À l\'instar de = comme, à l\'exemple de.' },
    'interface': { correction: 'interface', explanation: 'Interface = limite d\'échange.' },
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
    'lacet': { correction: 'lacet', explanation: 'Lacis = réseau ; lacet = cordon, nœud.' },
    'laconique': { correction: 'laconique', explanation: 'Laconique = bref ; loquace = qui parle beaucoup.' },
    'loquace': { correction: 'loquace', explanation: 'Laconique = bref ; loquace = qui parle beaucoup.' },
    'lacune': { correction: 'lacune', explanation: 'Lacune = manque ; lagune = étendue d\'eau salée.' },
    'lagune': { correction: 'lagune', explanation: 'Lacune = manque ; lagune = étendue d\'eau salée.' },
    'laïc': { correction: 'laïc', explanation: 'Laïc = non religieux.' },
    'lamaserie': { correction: 'lamaserie', explanation: 'Lamaserie = couvent de lamas.' },
    'laps': { correction: 'laps', explanation: 'Laps = tombé (dans "laps et relaps") ; lapsus = erreur.' },
    'législation': { correction: 'législation', explanation: 'Législation = ensemble des lois ; législature = durée d\'un mandat.' },
    'législature': { correction: 'législature', explanation: 'Législation = ensemble des lois ; législature = durée d\'un mandat.' },
    'legs': { correction: 'legs', explanation: 'Legs = don par testament ; légataire = bénéficiaire.' },
    'légataire': { correction: 'légataire', explanation: 'Legs = don ; légataire = bénéficiaire.' },
    'libération': { correction: 'libération', explanation: 'Libération = action de libérer ; libéralisation = rendre plus libéral.' },
    'libéralisation': { correction: 'libéralisation', explanation: 'Libération = libérer ; libéralisation = rendre libéral.' },
    'limbe': { correction: 'limbe', explanation: 'Limbe = bord ; lymphe = liquide biologique.' },
    'lymphe': { correction: 'lym phe', explanation: 'Limbe = bord ; lymphe = liquide biologique.' },
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
    'matériau': { correction: 'matériau', explanation: 'Matériau = substance ; matériel = ensemble d\'objets.' },
    'matériel': { correction: 'matériel', explanation: 'Matériau = substance ; matériel = ensemble d\'objets.' },
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
    'méritant': { correction: 'méritant', explanation: 'Méritant = qui a du mérite ; méritoire = digne d\'estime.' },
    'méritoire': { correction: 'méritoire', explanation: 'Méritant = qui a du mérite ; méritoire = digne d\'estime.' },
    'métaboliser': { correction: 'métaboliser', explanation: 'Métaboliser = transformer (biologie, psychologie).' },
    'métempsycose': { correction: 'métempsycose', explanation: 'Métempsycose = réincarnation.' },
    'méthodique': { correction: 'méthodique', explanation: 'Méthodique = qui suit une méthode ; méthodiste = adepte du méthodisme.' },
    'méthodiste': { correction: 'méthodiste', explanation: 'Méthodique = qui suit une méthode ; méthodiste = adepte du méthodisme.' },
    'meurtre': { correction: 'meurtre', explanation: 'Meurtre = homicide sans préméditation ; assassinat = avec préméditation.' },
    'assassinat': { correction: 'assassinat', explanation: 'Meurtre = sans préméditation ; assassinat = avec préméditation.' },
    'miction': { correction: 'miction', explanation: 'Miction = action d\'uriner ; mixtion = action de mélanger.' },
    'mixtion': { correction: 'mixtion', explanation: 'Miction = action d\'uriner ; mixtion = action de mélanger.' },
    'million': { correction: 'million', explanation: 'Million = nom (prend un s au pluriel).' },
    'milliard': { correction: 'milliard', explanation: 'Milliard = nom (prend un s au pluriel).' },
    'mithridatiser': { correction: 'mithridatiser', explanation: 'Se mithridatiser = s\'immuniser par petites doses.' },
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
    'moral': { correction: 'moral', explanation: 'Moral (masc.) = état d\'esprit ; morale (fém.) = règles de vie.' },
    'morale': { correction: 'morale', explanation: 'Moral (masc.) = état d\'esprit ; morale (fém.) = règles de vie.' },
    'morgue': { correction: 'morgue', explanation: 'Morgue = lieu des morts, ou attitude hautaine.' },
    'myrrhe': { correction: 'myrrhe', explanation: 'Myrrhe = résine ; myrte = arbuste ; mitre = chapeau d\'évêque.' },
    'myrte': { correction: 'myrte', explanation: 'Myrrhe = résine ; myrte = arbuste ; mitre = chapeau.' },
    'mitre': { correction: 'mitre', explanation: 'Myrrhe = résine ; myrte = arbuste ; mitre = chapeau.' },

    // N
    'natal': { correction: 'natal', explanation: 'Natal = de naissance ; natif = originaire.' },
    'natif': { correction: 'natif', explanation: 'Natal = de naissance ; natif = originaire.' },
    'nocturne': { correction: 'nocturne', explanation: 'Nocturne (masc.) = morceau de musique ; nocturne (fém.) = ouverture en soirée.' },
    'notable': { correction: 'notable', explanation: 'Notable = important, personne importante ; notoire = connu de tous.' },
    'notoire': { correction: 'notoire', explanation: 'Notable = important ; notoire = connu de tous.' }
};

// ---------------------------------------------------------------------
// RÈGLES DE VOCABULAIRE
// ---------------------------------------------------------------------

const vocabulaireRules = [
    // ===== RÈGLE PRINCIPALE : DÉTECTION DES CONFUSIONS =====
    {
        name: 'confusions_vocabulaire_complet',
        description: 'Détecte les confusions de vocabulaire basées sur le dictionnaire complet',
        example: '❌ "abjurer" → ✅ "adjurer" (selon le contexte)',
        pattern: null, // Utilise regex directe
        action: function(text) {
            const errors = [];
            
            // Parcourir toutes les confusions du dictionnaire
            Object.entries(confusions).forEach(([motErrone, data]) => {
                const regex = new RegExp(`\\b${motErrone}\\b`, 'gi');
                const matches = text.match(regex);
                
                if (matches) {
                    matches.forEach(match => {
                        const index = text.indexOf(match);
                        errors.push({
                            type: 'confusion_vocabulaire',
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
    // ===== RÈGLES SPÉCIFIQUES PAR CATÉGORIES =====
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
    {
        name: 'genre_tion',
        description: 'Les noms en -tion sont toujours féminins',
        example: '❌ "un nation" → ✅ "une nation"',
        pattern: null,
        action: function(text) {
            const errors = [];
            const regex = /\b(le|un|ce)\s+(\w+tion)\b/g;
            const matches = text.match(regex);
            
            if (matches) {
                matches.forEach(match => {
                    const index = text.indexOf(match);
                    const parts = match.split(' ');
                    const det = parts[0];
                    const noun = parts[1];
                    let correction = '';
                    
                    if (det === 'un') correction = 'une';
                    else if (det === 'le') correction = 'la';
                    else if (det === 'ce') correction = 'cette';
                    
                    errors.push({
                        type: 'genre',
                        word: match,
                        correction: correction + ' ' + noun,
                        explanation: 'Les noms terminés par "-tion" sont féminins.',
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
    {
        name: 'genre_age',
        description: 'Les noms en -age sont généralement masculins',
        example: '❌ "une fromage" → ✅ "un fromage"',
        pattern: null,
        action: function(text) {
            const errors = [];
            const exceptions = ['cage', 'image', 'page', 'plage', 'rage', 'nage'];
            const regex = /\b(la|une|cette)\s+(\w+age)\b/g;
            const matches = text.match(regex);
            
            if (matches) {
                matches.forEach(match => {
                    const index = text.indexOf(match);
                    const parts = match.split(' ');
                    const det = parts[0];
                    const noun = parts[1];
                    
                    if (!exceptions.includes(noun)) {
                        let correction = '';
                        if (det === 'une') correction = 'un';
                        else if (det === 'la') correction = 'le';
                        else if (det === 'cette') correction = 'ce';
                        
                        errors.push({
                            type: 'genre',
                            word: match,
                            correction: correction + ' ' + noun,
                            explanation: 'Les noms terminés par "-age" sont masculins (sauf exceptions).',
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

console.log(`✅ ${vocabulaireRules.length} règles de vocabulaire chargées (dictionnaire complet).`);

// Export pour utilisation// Éviter les conflits de variables globales
if (typeof window.confusions === 'undefined') {
    window.confusions = confusions;
}
if (typeof window.vocabulaireRules === 'undefined') {
    window.vocabulaireRules = vocabulaireRules;
}
