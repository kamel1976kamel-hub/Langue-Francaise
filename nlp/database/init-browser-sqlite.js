// 🗄️ INITIALISATION SQLITE POUR NAVIGATEUR
// Version simplifiée qui fonctionne directement dans le navigateur

class BrowserSQLiteManager {
    constructor() {
        this.db = null;
        this.dbName = 'nlp_rules';
        this.isReady = false;
    }

    async initialize() {
        try {
            console.log('🗄️ Initialisation SQLite pour navigateur...');
            
            // Créer une base de données en mémoire pour le navigateur
            this.db = new Map();
            
            // Insérer les règles directement
            await this.insertRules();
            
            this.isReady = true;
            console.log('✅ Base de données SQLite navigateur prête');
            
            return true;
        } catch (error) {
            console.error('❌ Erreur d\'initialisation:', error);
            return false;
        }
    }

    async insertRules() {
        const rules = [
            // RÈGLES DE GRAMMAIRE - GENRE
            {
                rule_id: 'genre_texte_masculin',
                name: 'genre_texte_masculin',
                category: 'grammaire',
                pattern_type: 'regex',
                pattern: '\\bune texte(s?)\\b',
                correction: 'un texte$1',
                explanation: '"Texte" est masculin, il faut utiliser "un".',
                example: 'une texte → un texte',
                priority: 95
            },
            {
                rule_id: 'style_c_est_quoi',
                name: 'style_c_est_quoi',
                category: 'style',
                pattern_type: 'regex',
                pattern: "\\bc'est quoi\\b",
                correction: "qu'est-ce que",
                explanation: 'Expression "c\'est quoi" trop familière. Utiliser "qu\'est-ce que".',
                example: "c'est quoi → qu'est-ce que",
                priority: 90
            },
            // RÈGLES DE STYLE
            {
                rule_id: 'ponctuation_fin',
                name: 'ponctuation_fin',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b([.!?])\\s*([.!?])',
                correction: '$1',
                explanation: 'Éviter la double ponctuation en fin de phrase.',
                example: 'Bonjour!. → Bonjour!',
                priority: 85
            },
            {
                rule_id: 'espace_apres_virgule',
                name: 'espace_apres_virgule',
                category: 'style',
                pattern_type: 'regex',
                pattern: ',(\\S)',
                correction: ', $1',
                explanation: 'Mettre un espace après la virgule.',
                example: 'Bonjour,mon ami → Bonjour, mon ami',
                priority: 90
            },
            {
                rule_id: 'espace_avant_point',
                name: 'espace_avant_point',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\s+([.!?])',
                correction: '$1',
                explanation: 'Pas d\'espace avant la ponctuation finale.',
                example: 'Bonjour . → Bonjour.',
                priority: 85
            },
            {
                rule_id: 'double_espace',
                name: 'double_espace',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\s{2,}',
                correction: ' ',
                explanation: 'Éviter les doubles espaces.',
                example: 'Bonjour  mon ami → Bonjour mon ami',
                priority: 80
            },
            {
                rule_id: 'majuscule_debut_phrase',
                name: 'majuscule_debut_phrase',
                category: 'style',
                pattern_type: 'function',
                pattern: '([.!?]\\s+)([a-z])',
                correction: 'function',
                explanation: 'Commencer chaque phrase par une majuscule.',
                example: 'bonjour. comment allez-vous? → Bonjour. Comment allez-vous?',
                priority: 95
            },
            {
                rule_id: 'accord_être_adjectif',
                name: 'accord_être_adjectif',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(ils|elles)\\s+(est|sont)\\s+(\\w+)(s?)\\b',
                correction: 'function',
                explanation: 'Accord sujet-verbe-adjectif avec être.',
                example: 'Ils est grand → Ils sont grands',
                priority: 90
            },
            {
                rule_id: 'confusion_ou_où',
                name: 'confusion_ou_où',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\bou\\b(?=\\s+(le|la|les|un|une|des|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|votre|leur))',
                correction: 'où',
                explanation: 'Utiliser "où" pour le lieu, "ou" pour le choix.',
                example: 'La maison ou je vis → La maison où je vis',
                priority: 80
            },
            {
                rule_id: 'confusion_a_à',
                name: 'confusion_a_à',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\ba\\b(?=\\s+(le|la|les|un|une|des|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|votre|leur|cette|ces|cet))',
                correction: 'à',
                explanation: 'Utiliser "à" pour la préposition, "a" pour le verbe.',
                example: 'Il a le livre → Il à le livre (incorrect)',
                priority: 75
            },
            {
                rule_id: 'accord_participe_passé',
                name: 'accord_participe_passé',
                category: 'style',
                pattern_type: 'function',
                pattern: '\\b(elle|la|cette)\\s+(a|as|avons|avez|ont|aurai|auras|aura|aurons|aurez|auront|avais|avais|avait|avions|aviez|avaient|eus|eûmes|eûtes|eurent)\\s+(\\w+é)\\b',
                correction: 'function',
                explanation: 'Accorder le participe passé avec le sujet féminin.',
                example: 'Elle a arrivé → Elle a arrivée',
                priority: 85
            },
            {
                rule_id: 'parentheses_espaces',
                name: 'parentheses_espaces',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\(\\s*([^\\)]+?)\\s*\\)',
                correction: '($1)',
                explanation: 'Pas d\'espaces inutiles à l\'intérieur des parenthèses.',
                example: '( texte ) → (texte)',
                priority: 70
            },

            // RÈGLES DE VOCABULAIRE
            {
                rule_id: 'confusion_a_a_vocab',
                name: 'confusion_a_a',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bà\\b',
                correction: 'a',
                explanation: 'Utiliser "a" (verbe avoir) au lieu de "à" (préposition) dans ce contexte.',
                example: 'Il à faim → Il a faim',
                priority: 80
            },
            {
                rule_id: 'confusion_ca_ce',
                name: 'confusion_ca_ce',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bça\\b',
                correction: 'cela',
                explanation: 'Utiliser "cela" plutôt que "ça" dans un contexte formel.',
                example: 'Ça va bien → Cela va bien',
                priority: 75
            },
            {
                rule_id: 'confusion_leur_leurs',
                name: 'confusion_leur_leurs',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bleur\\b(?=\\s+[aeiouéèêëîïôöùûü])',
                correction: 'leurs',
                explanation: 'Utiliser "leurs" (adjectif possessif pluriel) devant une voyelle.',
                example: 'Leur enfant → Leurs enfants',
                priority: 80
            },
            {
                rule_id: 'confusion_quelquelle',
                name: 'confusion_quelquelle',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bquel\\b(?=\\s+nom_féminin)',
                correction: 'quelle',
                explanation: 'Utiliser "quelle" pour le féminin.',
                example: 'Quel belle → Quelle belle',
                priority: 75
            },
            {
                rule_id: 'confusion_on_ont',
                name: 'confusion_on_ont',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bon\\b(?=\\s+(ont|ont|ont))',
                correction: 'ont',
                explanation: 'Utiliser "ont" (verbe avoir) au lieu de "on" (pronom).',
                example: 'On manger → Ont mangé',
                priority: 85
            },

            // RÈGLES DE CONJUGAISON
            {
                rule_id: 'aller_present_vas',
                name: 'aller_present_vas',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\bil vas\\b',
                correction: 'il va',
                explanation: 'Le verbe aller se conjugue: je vais, tu vas, il va.',
                example: 'Il vas au marché → Il va au marché',
                priority: 90
            },
            {
                rule_id: 'aller_present_vas_pluriel',
                name: 'aller_present_vas_pluriel',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(ils|elles) vas\\b',
                correction: '$1 vont',
                explanation: 'Au pluriel, aller se conjugue: ils vont, elles vont.',
                example: 'Ils vas → Ils vont',
                priority: 90
            },
            {
                rule_id: 'etre_present_sont',
                name: 'etre_present_sont',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\bil sont\\b',
                correction: 'il est',
                explanation: 'Le verbe être: il est, ils sont.',
                example: 'Il sont grand → Il est grand',
                priority: 90
            },
            {
                rule_id: 'etre_present_elles_sont',
                name: 'etre_present_elles_sont',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\bel sont\\b',
                correction: 'elles sont',
                explanation: 'Le verbe être au féminin pluriel: elles sont.',
                example: 'Elles sont belles',
                priority: 90
            },
            {
                rule_id: 'faire_present_font',
                name: 'faire_present_font',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\bil font\\b',
                correction: 'il fait',
                explanation: 'Le verbe faire: il fait, ils font.',
                example: 'Il font beau → Il fait beau',
                priority: 90
            },
            {
                rule_id: 'accord_enfant_joue',
                name: 'accord_enfant_joue',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\bles enfant\\s+joue\\b',
                correction: 'les enfants jouent',
                explanation: 'Accord sujet-verbe: les enfants + verbe au pluriel.',
                example: 'Les enfant joue → Les enfants jouent',
                priority: 95
            },
            
            // ===== RÈGLES PERSONNALISÉES SPACY – LA CONJUGAISON ET SES PIÈGES =====
            
            // CHAPITRE 1 : SAVOIRS DE BASE
            {
                rule_id: 'groupe_verbe_terminaison',
                name: 'groupe_verbe_terminaison',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|il|elle|on|nous|vous|ils|elles)\\s+(\\w+er)\\b',
                correction: function(match) {
                    const subject = match[1];
                    const verb = match[2];
                    let ending = '';
                    if (subject === 'je' || subject === 'j\'') ending = 'e';
                    else if (subject === 'tu') ending = 'es';
                    else if (subject === 'il' || subject === 'elle' || subject === 'on') ending = 'e';
                    else if (subject === 'nous') ending = 'ons';
                    else if (subject === 'vous') ending = 'ez';
                    else if (subject === 'ils' || subject === 'elles') ending = 'ent';
                    return subject + ' ' + verb.replace(/er$/, ending);
                },
                explanation: 'Le verbe du 1er groupe doit être conjugué et non laissé à l\'infinitif après un sujet.',
                example: 'je parler → je parle, tu parler → tu parles',
                priority: 95
            },
            
            // CHAPITRE 2 : LES DOUZE VERBES LES PLUS FRÉQUENTS
            {
                rule_id: 'auxiliaire_etre_avoir',
                name: 'auxiliaire_etre_avoir',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|il|elle|on|nous|vous|ils|elles)\\s+(ai|as|a|avons|avez|ont|suis|es|est|sommes|sont|êtes|sont)\\s+(allé|venu|parti|arrivé|entré|sorti|monté|descendu|né|mort|resté|tombé|retourné|passé|devenu|revenu)\\b',
                correction: function(match) {
                    const subject = match[1];
                    const aux = match[2];
                    const ppe = match[3];
                    return subject + ' suis ' + ppe;
                },
                explanation: 'Les verbes de mouvement se conjuguent avec l\'auxiliaire "être" aux temps composés.',
                example: 'j\'ai parti → je suis parti',
                priority: 90
            },
            {
                rule_id: 'futur_conditionnel_confusion',
                name: 'futur_conditionnel_confusion',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\bdemain\\s+(je|tu|il|elle|on)\\s+(\\w+ais)\\b',
                correction: function(match) {
                    const subject = match[1];
                    const verb = match[2];
                    const ending = verb.replace(/ais$/, 'ai');
                    return 'demain ' + subject + ' ' + ending;
                },
                explanation: 'Avec un indicateur de futur, on utilise le futur simple et non le conditionnel.',
                example: 'demain je ferais → demain je ferai',
                priority: 85
            },
            {
                rule_id: 'subjonctif_apres_que',
                name: 'subjonctif_apres_que',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(il\\s+faut|bien\\s+que|avant\\s+que|pour\\s+que|sans\\s+que|afin\\s+que)\\s+(tu|il|elle|on|nous|vous|ils|elles)\\s+(\\w+e[sz]?|\\w+ons|\\w+ez|\\w+ent)\\b',
                correction: function(match) {
                    const locution = match[1];
                    const subject = match[2];
                    const verb = match[3];
                    return locution + ' ' + subject + ' ' + verb + ' (subjonctif requis)';
                },
                explanation: 'Après ces locutions, on emploie le subjonctif.',
                example: 'il faut que tu viens → il faut que tu viennes',
                priority: 90
            },
            {
                rule_id: 'imperatif_va_vas',
                name: 'imperatif_va_vas',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\bvas\\s+(?!y|en)(\\w+)\\b',
                correction: 'va $1',
                explanation: 'L\'impératif du verbe "aller" est "va" (sans s), sauf devant "y" ou "en".',
                example: 'vas à l\'école → va à l\'école',
                priority: 85
            },
            
            // CHAPITRE 3 : PARTICIPES PASSÉS IRRÉGULIERS
            {
                rule_id: 'participe_passe_irregulier_ouvrir',
                name: 'participe_passe_irregulier_ouvrir',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|il|elle|on|nous|vous|ils|elles)\\s+(ai|as|a|avons|avez|ont|suis|es|est|sommes|sont|êtes|sont)\\s+ouvris?\\b',
                correction: function(match) {
                    const subject = match[1];
                    const aux = match[2];
                    return subject + ' ' + aux + ' ouvert';
                },
                explanation: 'Le participe passé de "ouvrir" est "ouvert".',
                example: 'j\'ai ouvré → j\'ai ouvert',
                priority: 95
            },
            {
                rule_id: 'participe_passe_irregulier_prendre',
                name: 'participe_passe_irregulier_prendre',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|il|elle|on|nous|vous|ils|elles)\\s+(ai|as|a|avons|avez|ont|suis|es|est|sommes|sont|êtes|sont)\\s+pris\\b',
                correction: function(match) {
                    const subject = match[1];
                    const aux = match[2];
                    return subject + ' ' + aux + ' pris';
                },
                explanation: 'Le participe passé de "prendre" est "pris".',
                example: 'j\'ai prendu → j\'ai pris',
                priority: 95
            },
            {
                rule_id: 'participe_passe_irregulier_mettre',
                name: 'participe_passe_irregulier_mettre',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|il|elle|on|nous|vous|ils|elles)\\s+(ai|as|a|avons|avez|ont|suis|es|est|sommes|sont|êtes|sont)\\s+mis\\b',
                correction: function(match) {
                    const subject = match[1];
                    const aux = match[2];
                    return subject + ' ' + aux + ' mis';
                },
                explanation: 'Le participe passé de "mettre" est "mis".',
                example: 'j\'ai met → j\'ai mis',
                priority: 95
            },
            {
                rule_id: 'participe_passe_irregulier_dire',
                name: 'participe_passe_irregulier_dire',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|il|elle|on|nous|vous|ils|elles)\\s+(ai|as|a|avons|avez|ont|suis|es|est|sommes|sont|êtes|sont)\\s+dis\\b',
                correction: function(match) {
                    const subject = match[1];
                    const aux = match[2];
                    return subject + ' ' + aux + ' dit';
                },
                explanation: 'Le participe passé de "dire" est "dit".',
                example: 'j\'ai di → j\'ai dit',
                priority: 95
            },
            {
                rule_id: 'participe_passe_irregulier_ecrire',
                name: 'participe_passe_irregulier_ecrire',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|il|elle|on|nous|vous|ils|elles)\\s+(ai|as|a|avons|avez|ont|suis|es|est|sommes|sont|êtes|sont)\\s+écrits?\\b',
                correction: function(match) {
                    const subject = match[1];
                    const aux = match[2];
                    return subject + ' ' + aux + ' écrit';
                },
                explanation: 'Le participe passé de "écrire" est "écrit".',
                example: 'j\'ai écris → j\'ai écrit',
                priority: 95
            },
            {
                rule_id: 'participe_passe_irregulier_voir',
                name: 'participe_passe_irregulier_voir',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|il|elle|on|nous|vous|ils|elles)\\s+(ai|as|a|avons|avez|ont|suis|es|est|sommes|sont|êtes|sont)\\s+vus\\b',
                correction: function(match) {
                    const subject = match[1];
                    const aux = match[2];
                    return subject + ' ' + aux + ' vu';
                },
                explanation: 'Le participe passé de "voir" est "vu".',
                example: 'j\'ai vi → j\'ai vu',
                priority: 95
            },
            {
                rule_id: 'participe_passe_irregulier_vouloir',
                name: 'participe_passe_irregulier_vouloir',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|il|elle|on|nous|vous|ils|elles)\\s+(ai|as|a|avons|avez|ont|suis|es|est|sommes|sont|êtes|sont)\\s+voulus?\\b',
                correction: function(match) {
                    const subject = match[1];
                    const aux = match[2];
                    return subject + ' ' + aux + ' voulu';
                },
                explanation: 'Le participe passé de "vouloir" est "voulu".',
                example: 'j\'ai voulus → j\'ai voulu',
                priority: 95
            },
            {
                rule_id: 'participe_passe_irregulier_pouvoir',
                name: 'participe_passe_irregulier_pouvoir',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|il|elle|on|nous|vous|ils|elles)\\s+(ai|as|a|avons|avez|ont|suis|es|est|sommes|sont|êtes|sont)\\s+pus\\b',
                correction: function(match) {
                    const subject = match[1];
                    const aux = match[2];
                    return subject + ' ' + aux + ' pu';
                },
                explanation: 'Le participe passé de "pouvoir" est "pu".',
                example: 'j\'ai pus → j\'ai pu',
                priority: 95
            },
            
            // CHAPITRE 4 : VERBES DÉFECTIFS
            {
                rule_id: 'defectif_falloir',
                name: 'defectif_falloir',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|nous|vous|ils|elles)\\s+(fau|fau|fau|fau|fau|fau)\\b',
                correction: 'il faut',
                explanation: 'Le verbe "falloir" ne se conjugue qu\'à la 3e personne du singulier.',
                example: 'je faux → il faut',
                priority: 90
            },
            {
                rule_id: 'defectif_pleuvoir',
                name: 'defectif_pleuvoir',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|nous|vous|ils|elles)\\s+(pleu|pleu|pleu|pleu|pleu|pleu)\\b',
                correction: 'il pleut',
                explanation: 'Le verbe "pleuvoir" ne se conjugue qu\'à la 3e personne du singulier.',
                example: 'je pleus → il pleut',
                priority: 90
            },
            
            // CHAPITRE 5 : FORMES DIFFICILES
            {
                rule_id: 'verbe_eler_double_consonne',
                name: 'verbe_eler_double_consonne',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(j\'|je|tu|il|elle)\\s+(appel|jett)\\b',
                correction: function(match) {
                    const subject = match[1];
                    const verb = match[2];
                    if (verb === 'appel') return subject + ' appelle';
                    if (verb === 'jett') return subject + ' jette';
                    return match[0];
                },
                explanation: 'Les verbes "appeler" et "jeter" doublent la consonne devant une syllabe muette.',
                example: 'j\'appelle → j\'appelle, il jette → il jette',
                priority: 85
            },
            {
                rule_id: 'verbe_ceder_accent',
                name: 'verbe_ceder_accent',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(j\'|je|tu|il|elle)\\s+(céd|accéd|décéd|posséd)\\b',
                correction: function(match) {
                    const subject = match[1];
                    const verb = match[2];
                    return subject + ' ' + verb.replace('é', 'è');
                },
                explanation: 'Les verbes comme "céder" changent l\'accent aigu en accent grave devant une syllabe muette.',
                example: 'il cède → il cède',
                priority: 85
            },
            {
                rule_id: 'verbe_yer_y_i',
                name: 'verbe_yer_y_i',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(j\'|je|tu|il|elle)\\s+(nettoy|envoy|employ)\\b',
                correction: function(match) {
                    const subject = match[1];
                    const verb = match[2];
                    return subject + ' ' + verb.replace('y', 'i');
                },
                explanation: 'Les verbes comme "nettoyer" changent le y en i devant un e muet.',
                example: 'il nettoye → il nettoie',
                priority: 85
            },
            {
                rule_id: 'futur_double_r',
                name: 'futur_double_r',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(je|tu|il|elle|on)\\s+(cour|mour)\\ai\\b',
                correction: function(match) {
                    const subject = match[1];
                    const verb = match[2];
                    return subject + ' ' + verb + 'rrai';
                },
                explanation: 'Les verbes "courir" et "mourir" doublent le r au futur.',
                example: 'je courai → je courrai, je mourai → je mourrai',
                priority: 90
            },
            
            // CHAPITRE 6 : ACCORDS DES PARTICIPES PASSÉS
            {
                rule_id: 'accord_participe_etre',
                name: 'accord_participe_etre',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(elles|ils)\\s+(sont|sont)\\s+(\\w+[^es])\\b',
                correction: function(match) {
                    const subject = match[1];
                    const aux = match[2];
                    const ppe = match[3];
                    return subject + ' ' + aux + ' ' + ppe + 's';
                },
                explanation: 'Avec l\'auxiliaire "être", le participe passé s\'accorde en nombre avec le sujet.',
                example: 'elles sont parti → elles sont parties',
                priority: 95
            },
            {
                rule_id: 'accord_participe_avoir_cod',
                name: 'accord_participe_avoir_cod',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\b(l\'|la|les)\\s+que\\s+(j\'|je|tu|il|elle|on|nous|vous|ils|elles)\\s+(ai|as|a|avons|avez|ont|suis|es|est|sommes|sont|êtes|sont)\\s+(\\w+[^es])\\b',
                correction: function(match) {
                    const cod = match[1];
                    const subject = match[3];
                    const aux = match[4];
                    const ppe = match[5];
                    if (cod === 'les') return match[0].replace(ppe, ppe + 's');
                    if (cod === 'la') return match[0].replace(ppe, ppe + 'e');
                    if (cod === 'l\'') return match[0].replace(ppe, ppe + 'e');
                    return match[0];
                },
                explanation: 'Avec l\'auxiliaire "avoir", le participe passé s\'accorde avec le COD placé avant.',
                example: 'les pommes que j\'ai mangé → les pommes que j\'ai mangées',
                priority: 90
            },
            {
                rule_id: 'accord_sujet_verbe_enfants',
                name: 'accord_sujet_verbe_enfants',
                category: 'conjugaison',
                explanation: 'Accord sujet-verbe: les enfants + verbe au pluriel.',
                example: 'Les enfant joue → Les enfants jouent',
                priority: 95
            },
            
            // ===== RÈGLES D'ORTHOGRAPHE ENRICHIES - CHAPITRE 1 : PIÈGES ORTHOGRAPHIQUES =====
            
            // Homophones fréquents
            {
                rule_id: 'homophone_ou_ou',
                name: 'homophone_ou_ou',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\boù\\b',
                correction: 'où',
                explanation: '"où" avec accent circonflexe = lieu ; "ou" sans accent = coordination.',
                example: 'ou es-tu ? → où es-tu ?',
                priority: 90
            },
            {
                rule_id: 'homophone_la_la',
                name: 'homophone_la_la',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bla\\s+(ici|là|bas|haut)\\b',
                correction: 'là',
                explanation: '"la" = article ; "là" = adverbe de lieu.',
                example: 'viens la → viens là',
                priority: 90
            },
            {
                rule_id: 'homophone_ce_se',
                name: 'homophone_ce_se',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bce\\s+(me|te|le|la|nous|vous|les)\\b',
                correction: 'se',
                explanation: '"se" = pronom réfléchi ; "ce" = démonstratif.',
                example: 'ce lave → se lave',
                priority: 90
            },
            {
                rule_id: 'homophone_ce_se_nom',
                name: 'homophone_ce_se_nom',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bse\\s+(\\w+)(?:s|es)?\\b',
                correction: 'ce $1',
                explanation: '"se" = pronom réfléchi ; "ce" = démonstratif devant un nom.',
                example: 'se chat → ce chat',
                priority: 85
            },
            
            // Confusions courantes
            {
                rule_id: 'confusion_leur_leurs',
                name: 'confusion_leur_leurs',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bleur\\s+(\\w+s)\\b',
                correction: 'leurs $1',
                explanation: 'Le déterminant possessif "leur" prend un "s" au pluriel.',
                example: 'leur maisons → leurs maisons',
                priority: 90
            },
            {
                rule_id: 'confusion_tout_tous',
                name: 'confusion_tout_tous',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\btout\\s+les\\b',
                correction: 'tous les',
                explanation: '"tous" avec "s" devant un nom pluriel ; "tout" adverbe est invariable.',
                example: 'tout les jours → tous les jours',
                priority: 90
            },
            {
                rule_id: 'confusion_tout_tous_adj',
                name: 'confusion_tout_tous_adj',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\btous\\s+(\\w+[aeiou])\\b',
                correction: 'tout $1',
                explanation: '"tout" adverbe invariable devant adjectif masculin singulier.',
                example: 'tous étonné → tout étonné',
                priority: 85
            },
            {
                rule_id: 'confusion_meme_memes',
                name: 'confusion_meme_memes',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\beux\\s+même\\b',
                correction: 'eux-mêmes',
                explanation: '"mêmes" avec "s" après pronom pluriel.',
                example: 'eux même → eux-mêmes',
                priority: 90
            },
            {
                rule_id: 'confusion_meme_memes_adv',
                name: 'confusion_meme_memes_adv',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bmêmes\\s+(\\w+)\\b',
                correction: 'même $1',
                explanation: '"même" adverbe invariable (y compris).',
                example: 'mêmes les enfants → même les enfants',
                priority: 85
            },
            
            // Accents et trémas
            {
                rule_id: 'accent_a_a',
                name: 'accent_a_a',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bà\\b',
                correction: 'à',
                explanation: '"à" avec accent grave = préposition ; "a" sans accent = verbe avoir.',
                example: 'a demain → à demain',
                priority: 90
            },
            {
                rule_id: 'accent_e_e',
                name: 'accent_e_e',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bé\\b',
                correction: 'é',
                explanation: '"é" accent aigu = participe passé ; "e" sans accent = pronoms.',
                example: 'il e → il é',
                priority: 85
            },
            {
                rule_id: 'accent_es_ets',
                name: 'accent_es_ets',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\b(\\w+es)\\b',
                correction: function(match) {
                    const word = match[1];
                    // Liste des mots qui doivent prendre un tréma
                    const tremaWords = ['maïs', 'noël', 'coincïder', 'ambigü', 'argüer', 'canöe', 'goéland', 'héréditaire', 'inchoatif', 'jaoïe', 'maïs', 'naïf', 'païen', 'reïterer', 'saoul', 'zaïre'];
                    if (tremaWords.includes(word)) {
                        return word.replace(/([aeiou])i([aeiou])/, '$1ï$2');
                    }
                    return word;
                },
                explanation: 'Certains mots prennent un tréma sur les voyelles.',
                example: 'mais → maïs, noel → noël',
                priority: 80
            },
            
            // Mots composés
            {
                rule_id: 'mot_compose_compte_rendu',
                name: 'mot_compose_compte_rendu',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bcompte-rendu\\b',
                correction: 'compte rendu',
                explanation: '"compte rendu" s\'écrit sans trait d\'union.',
                example: 'compte-rendu → compte rendu',
                priority: 85
            },
            {
                rule_id: 'mot_compose_compte_rendus',
                name: 'mot_compose_compte_rendus',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bcompte-rendus\\b',
                correction: 'comptes rendus',
                explanation: 'Au pluriel, les deux mots prennent un "s".',
                example: 'compte-rendus → comptes rendus',
                priority: 85
            },
            {
                rule_id: 'mot_compose_arc_en_ciel',
                name: 'mot_compose_arc_en_ciel',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\barcenciel\\b',
                correction: 'arc-en-ciel',
                explanation: '"arc-en-ciel" prend des traits d\'union.',
                example: 'arcenciel → arc-en-ciel',
                priority: 85
            },
            
            // Préfixes et assimilation
            {
                rule_id: 'prefixe_in_im',
                name: 'prefixe_in_im',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bin([pbm])\\w+\\b',
                correction: function(match) {
                    const letter = match[1];
                    const rest = match.input.slice(match.index + 3);
                    return 'im' + letter + rest;
                },
                explanation: 'Le préfixe "in-" devient "im-" devant p, b, m.',
                example: 'inpossible → impossible, inmangeable → immangeable',
                priority: 90
            },
            {
                rule_id: 'prefixe_in_il',
                name: 'prefixe_in_il',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\binl\\w+\\b',
                correction: function(match) {
                    const rest = match.input.slice(match.index + 3);
                    return 'il' + rest;
                },
                explanation: 'Le préfixe "in-" devient "il-" devant l.',
                example: 'inlogique → illogique',
                priority: 90
            },
            {
                rule_id: 'prefixe_in_ir',
                name: 'prefixe_in_ir',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\binr\\w+\\b',
                correction: function(match) {
                    const rest = match.input.slice(match.index + 3);
                    return 'ir' + rest;
                },
                explanation: 'Le préfixe "in-" devient "ir-" devant r.',
                example: 'inréel → irréel',
                priority: 90
            },
            
            // Terminaisons
            {
                rule_id: 'terminaison_tion_ssion',
                name: 'terminaison_tion_ssion',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\b(\\w+)tion\\b',
                correction: function(match) {
                    const base = match[1];
                    const ssionWords = ['ab', 'ad', 'ag', 'ap', 'as', 'at', 'av', 'col', 'comp', 'con', 'cor', 'd', 'dis', 'div', 'em', 'exp', 'ext', 'imp', 'int', 'mis', 'ob', 'op', 'op', 'perc', 'perm', 'pers', 'pos', 'pr', 'prof', 'proj', 'prop', 'prot', 'r', 're', 'rep', 'rép', 'res', 'rév', 's', 'suc', 'sup', 'sus', 'tr', 'trans'];
                    if (ssionWords.some(prefix => base.startsWith(prefix))) {
                        return base + 'ssion';
                    }
                    return match[0];
                },
                explanation: 'Certains mots prennent "ssion" au lieu de "tion".',
                example: 'disution → discussion, permission → permission',
                priority: 85
            },
            {
                rule_id: 'terminaison_evidence',
                name: 'terminaison_evidence',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bévidament\\b',
                correction: 'évidemment',
                explanation: '"évidemment" prend deux "m" (vient de "évident").',
                example: 'évidament → évidemment',
                priority: 95
            },
            {
                rule_id: 'terminaisons_adverbes_ment',
                name: 'terminaisons_adverbes_ment',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\b(\\w+)(?:ament|emment|ément)\\b',
                correction: function(match) {
                    const base = match[1];
                    const ending = match[0].slice(base.length);
                    // Règles : -ant -> -amment, -ent -> -emment
                    if (base.endsWith('ant') && ending === 'ament') {
                        return base + 'amment';
                    }
                    if (base.endsWith('ent') && ending === 'ement') {
                        return base + 'emment';
                    }
                    return match[0];
                },
                explanation: 'Les adverbes en -ment : -ant -> -amment, -ent -> -emment.',
                example: 'courament → couramment, evident → évidemment',
                priority: 90
            },
            
            // Pluriels spéciaux
            {
                rule_id: 'pluriel_ou_x',
                name: 'pluriel_ou_x',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bdes\\s+(bijou|caillou|chou|genou|hibou|joujou|pou|ripou)s\\b',
                correction: 'des $1x',
                explanation: 'Ces noms en -ou font leur pluriel en -x.',
                example: 'des chous → des choux, des bijous → des bijoux',
                priority: 90
            },
            {
                rule_id: 'pluriel_al_aux',
                name: 'pluriel_al_aux',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bdes\\s+(\\w+al)s\\b',
                correction: function(match) {
                    const word = match[1];
                    const exceptions = ['aval', 'bal', 'carnaval', 'festival', 'chacal', 'cérémonial', 'étal', 'idéal', 'mistral', 'narval', 'pal', 'récital', 'régal', 'rorqual', 'serval', 'sisal'];
                    if (!exceptions.includes(word)) {
                        return 'des ' + word.replace(/al$/, 'aux');
                    }
                    return match[0];
                },
                explanation: 'La plupart des noms en -al font leur pluriel en -aux.',
                example: 'des chevals → des chevaux, des journaux → des journaux',
                priority: 90
            },
            {
                rule_id: 'pluriel_eil_eille',
                name: 'pluriel_eil_eille',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bdes\\s+(\\w+eil)les\\b',
                correction: function(match) {
                    const base = match[1];
                    const exceptions = ['b', 'cor', 'é', 'gouvern', 'p', 'v', 'vitr'];
                    if (!exceptions.some(prefix => base.startsWith(prefix))) {
                        return 'des ' + base + 'eilles';
                    }
                    return match[0];
                },
                explanation: 'Certains noms en -eil font leur féminin en -eille.',
                example: 'des conseilles → des conseilles, des orgueilles → des orgueilles',
                priority: 85
            },
            
            // Adjectifs de couleur
            {
                rule_id: 'couleur_invariable',
                name: 'couleur_invariable',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\b(\\w+)\\s+(orange|marron|pourpre|écarlate|fauve|incarnat|mauve|rose)s\\b',
                correction: '$1 $2',
                explanation: 'Les adjectifs de couleur issus de noms sont invariables.',
                example: 'des robes oranges → des robes orange',
                priority: 85
            },
            
            // Sigles et abréviations
            {
                rule_id: 'sigle_sans_points',
                name: 'sigle_sans_points',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\b[A-Z]\\.([A-Z]\\.){2,}\\b',
                correction: function(match) {
                    return match[0].replace(/\./g, '');
                },
                explanation: 'Les sigles s\'écrivent généralement sans points.',
                example: 'S.N.C.F. → SNCF, U.R.S.S. → URSS',
                priority: 75
            },
            
            // Majuscules et ponctuation
            {
                rule_id: 'majuscule_apres_point',
                name: 'majuscule_apres_point',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\.\\s+([a-z])',
                correction: function(match) {
                    return '. ' + match[1].toUpperCase();
                },
                explanation: 'Après un point, on met une majuscule.',
                example: 'il fait beau. demain → il fait beau. Demain',
                priority: 90
            },
            {
                rule_id: 'espace_avant_ponctuation_double',
                name: 'espace_avant_ponctuation_double',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '(\\w)([!?;:])',
                correction: '$1 $2',
                explanation: 'Espace insécable avant la ponctuation double.',
                example: 'Bonjour! → Bonjour !',
                priority: 85
            },
            
            // Mots fréquents mal orthographiés
            {
                rule_id: 'mot_frequent_langue',
                name: 'mot_frequent_langue',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\blangue\\b',
                correction: 'langue',
                explanation: '"langue" avec "u" (organe) ; "langage" = système de communication.',
                example: 'la langue française',
                priority: 90
            },
            {
                rule_id: 'mot_frequent_gouvernement',
                name: 'mot_frequent_gouvernement',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bgouvernemant\\b',
                correction: 'gouvernement',
                explanation: '"gouvernement" avec "ern" (du verbe gouverner).',
                example: 'le gouvernement français',
                priority: 95
            },
            {
                rule_id: 'mot_frequent_environnement',
                name: 'mot_frequent_environnement',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\benvironemant\\b',
                correction: 'environnement',
                explanation: '"environnement" avec "ern" (autour de).',
                example: 'protéger l\'environnement',
                priority: 95
            },
            {
                rule_id: 'mot_frequent_developpement',
                name: 'mot_frequent_developpement',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bdeveloppement\\b',
                correction: 'développement',
                explanation: '"développement" avec "é" et "pp".',
                example: 'le développement durable',
                priority: 95
            },
            {
                rule_id: 'mot_frequent_succes',
                name: 'mot_frequent_succes',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bsucces\\b',
                correction: 'succès',
                explanation: '"succès" avec accent circonflexe.',
                example: 'obtenir un succès',
                priority: 95
            },
            {
                rule_id: 'mot_frequent_interet',
                name: 'mot_frequent_interet',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\binteret\\b',
                correction: 'intérêt',
                explanation: '"intérêt" avec accents circonflexes.',
                example: 'porter intérêt',
                priority: 95
            },
            {
                rule_id: 'mot_frequent_connaitre',
                name: 'mot_frequent_connaitre',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bconnaitre\\b',
                correction: 'connaître',
                explanation: '"connaître" avec accent circonflexe.',
                example: 'je connaître',
                priority: 95
            },
            {
                rule_id: 'mot_frequent_maitre',
                name: 'mot_frequent_maitre',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bmaitre\\b',
                correction: 'maître',
                explanation: '"maître" avec accent circonflexe.',
                example: 'le maître',
                priority: 95
            },
            {
                rule_id: 'mot_frequent_foret',
                name: 'mot_frequent_foret',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bforet\\b',
                correction: 'forêt',
                explanation: '"forêt" avec accent circonflexe.',
                example: 'la forêt',
                priority: 95
            },
            {
                rule_id: 'mot_frequent_cote',
                name: 'mot_frequent_cote',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bcote\\b',
                correction: 'côte',
                explanation: '"côte" avec accent circonflexe (pente).',
                example: 'la côte d\'azur',
                priority: 85
            },
            {
                rule_id: 'mot_frequent_cote_d_or',
                name: 'mot_frequent_cote_d_or',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bcote\\s+d\'or\\b',
                correction: 'côte d\'or',
                explanation: '"côte d\'or" avec accent circonflexe.',
                example: 'la côte d\'or',
                priority: 90
            },
            
            // Confusions spécifiques
            {
                rule_id: 'confusion_quand_quant',
                name: 'confusion_quand_quant',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bquand\\s+à\\b',
                correction: 'quant à',
                explanation: '"quant à" = en ce qui concerne ; "quand" = lorsque.',
                example: 'quand à moi → quant à moi',
                priority: 90
            },
            {
                rule_id: 'confusion_quoique_quoi_que',
                name: 'confusion_quoique_quoi_que',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bquoi\\s+que\\b',
                correction: 'quoique',
                explanation: '"quoique" (bien que) ; "quoi que" (quel que soit).',
                example: 'quoi qu\'il arrive → quoiqu\'il arrive',
                priority: 85
            },
            {
                rule_id: 'confusion_sur_sure',
                name: 'confusion_sur_sure',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bsure\\b',
                correction: 'sûr',
                explanation: '"sûr" avec accent circonflexe (certain) ; "sur" = préposition.',
                example: 'sure → sûr',
                priority: 90
            },
            {
                rule_id: 'confusion_peu_peut',
                name: 'confusion_peu_peut',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bpeut\\s+être\\b',
                correction: 'peut-être',
                explanation: '"peut-être" avec trait d\'union (adverbe).',
                example: 'peut être → peut-être',
                priority: 90
            },
            {
                rule_id: 'confusion_autant_autan',
                name: 'confusion_autant_autan',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bautan\\b',
                correction: 'autant',
                explanation: '"autant" = adverbe de quantité ; "autan" = vent du sud.',
                example: 'autan que → autant que',
                priority: 85
            },
            {
                rule_id: 'confusion_champ_chant',
                name: 'confusion_champ_chant',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bchant\\s+(de|d\')\\b',
                correction: 'champ $1',
                explanation: '"champ" = terrain ; "chant" = mélodie.',
                example: 'chant de blé → champ de blé',
                priority: 85
            },
            {
                rule_id: 'confusion_ver_vers_verre_vert',
                name: 'confusion_ver_vers_verre_vert',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bver\\s+(le|la|les|un|une|des)\\b',
                correction: function(match) {
                    const article = match[1];
                    if (article === 'le' || article === 'un') {
                        return 'verre ' + article;
                    }
                    return 'vers ' + article;
                },
                explanation: '"ver" = vers ; "vers" = préposition ; "verre" = récipient ; "vert" = couleur.',
                example: 'ver le mur → vers le mur',
                priority: 85
            },
            {
                rule_id: 'confusion_vin_vin_vain_vain',
                name: 'confusion_vin_vin_vain_vain',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bvain\\s+de\\b',
                correction: 'vin de',
                explanation: '"vin" = boisson ; "vain" = inutile.',
                example: 'vain de Bordeaux → vin de Bordeaux',
                priority: 85
            },
            
            // Emploi correct des articles
            {
                rule_id: 'article_h_aspire',
                name: 'article_h_aspire',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bl\'\\s+(haricot|hibou|héros|huit|hamac|hasard|haut|haine|hâte|haleine|hanche|hangar|harpe|haricot|héron|héros|hibou|hippopotame|hockey|hollywood|homard|homme|hôpital|horloge|horoscope|horreur|hôte|hôtel|housse|houblon|housse|houle|hourra|houx|huit|hurluberlu|hydrogène|hymne|hypocrisie|hypothèse)\\b',
                correction: function(match) {
                    const word = match[1];
                    return 'le ' + word;
                },
                explanation: 'Devant un h aspiré, on n\'élide pas l\'article.',
                example: 'l\'haricot → le haricot',
                priority: 90
            },
            
            // Particules et locutions
            {
                rule_id: 'locution_a_priori',
                name: 'locution_a_priori',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bà\\s+priori\\b',
                correction: 'a priori',
                explanation: '"a priori" sans accent ni trait d\'union (locution latine).',
                example: 'à priori → a priori',
                priority: 85
            },
            {
                rule_id: 'locution_a_posteriori',
                name: 'locution_a_posteriori',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bà\\s+posteriori\\b',
                correction: 'a posteriori',
                explanation: '"a posteriori" sans accent ni trait d\'union (locution latine).',
                example: 'à posteriori → a posteriori',
                priority: 85
            },
            {
                rule_id: 'locution_bon_marche',
                name: 'locution_bon_marche',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bbonmarche\\b',
                correction: 'bon marché',
                explanation: '"bon marché" en deux mots.',
                example: 'bonmarche → bon marché',
                priority: 85
            },
            {
                rule_id: 'locution_peu_a_peu',
                name: 'locution_peu_a_peu',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bpeuapeu\\b',
                correction: 'peu à peu',
                explanation: '"peu à peu" avec "à".',
                example: 'peuapeu → peu à peu',
                priority: 85
            },
            {
                rule_id: 'locution_c_est_a_dire',
                name: 'locution_c_est_a_dire',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bcàdire\\b',
                correction: 'c\'est-à-dire',
                explanation: '"c\'est-à-dire" avec apostrophe et traits d\'union.',
                example: 'càdire → c\'est-à-dire',
                priority: 90
            },
            {
                rule_id: 'accord_sujet_verbe_chats',
                name: 'accord_sujet_verbe_chats',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\bles chat\\s+(\\w+es?)\\b',
                correction: 'les chats $1ent',
                explanation: 'Accord sujet-verbe: les chats + verbe au pluriel.',
                example: 'Les chat dort → Les chats dorment',
                priority: 85
            },
            {
                rule_id: 'accord_sujet_verbe_filles',
                name: 'accord_sujet_verbe_filles',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\bles fille\\s+(\\w+es?)\\b',
                correction: 'les filles $1ent',
                explanation: 'Accord sujet-verbe: les filles + verbe au pluriel.',
                example: 'Les fille chante → Les filles chantent',
                priority: 85
            },
            {
                rule_id: 'falloir_present',
                name: 'falloir_present',
                category: 'conjugaison',
                pattern_type: 'regex',
                pattern: '\\bil faut\\b',
                correction: 'il faut',
                explanation: 'Le verbe falloir ne s\'utilise qu\'avec il: il faut.',
                example: 'Il faut étudier pour réussir.',
                priority: 80
            },

            // RÈGLES D'ORTHOGRAPHE
            {
                rule_id: 'accord_être_nom',
                name: 'accord_être_nom',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\b(ils|elles)\\s+(est|sont)\\s+(\\w+)(s?)\\b',
                correction: 'function',
                explanation: 'Accord sujet-verbe avec être.',
                example: 'Ils est content → Ils sont contents',
                priority: 90
            },
            {
                rule_id: 'accord_avoir_nom',
                name: 'accord_avoir_nom',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\b(ils|elles)\\s+(a|as|avons|avez|ont)\\s+(\\w+)(s?)\\b',
                correction: 'function',
                explanation: 'Accord sujet-auxiliaire avec avoir.',
                example: 'Ils a les livres → Ils ont les livres',
                priority: 90
            },
            {
                rule_id: 'accord_adjectif_feminin',
                name: 'accord_adjectif_feminin',
                category: 'orthographe',
                pattern_type: 'function',
                pattern: '\\b(la|cette|une|ma|ta|sa)\\s+(\\w+)\\s+(\\w+?)(s?)\\b',
                correction: 'function',
                explanation: 'Accord de l\'adjectif avec le nom féminin.',
                example: 'La maison est beau → La maison est belle',
                priority: 85
            },
            {
                rule_id: 'accord_adjectif_pluriel',
                name: 'accord_adjectif_pluriel',
                category: 'orthographe',
                pattern_type: 'function',
                pattern: '\\b(les|des|mes|tes|ses|nos|vos|leurs)\\s+(\\w+)\\s+(\\w+?)\\b',
                correction: 'function',
                explanation: 'Accord de l\'adjectif au pluriel.',
                example: 'Les chats est petit → Les chats sont petits',
                priority: 85
            },
            {
                rule_id: 'confusion_ce_se',
                name: 'confusion_ce_se',
                category: 'orthographe',
                pattern_type: 'regex',
                pattern: '\\bce\\b(?=\\s+(est|sont|sera|seront|était|étaient|fut|furent))',
                correction: 'se',
                explanation: 'Utiliser "se" pour le pronom réfléchi, "ce" pour le démonstratif.',
                example: 'Ce lave → Se lave',
                priority: 80
            },
            
            // === RÈGLES DE VOCABULAIRE ENRICHIES ===
            // Basé sur "Le vocabulaire et ses pièges" (Archipoche)
            
            // A
            {
                rule_id: 'confusion_abjurer_adjurer',
                name: 'confusion_abjurer_adjurer',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\babjurer\\b',
                correction: 'adjurer',
                explanation: 'Abjurer = renier sa foi ; adjurer = exhorter, supplier.',
                example: 'Je t\'abjure de m\'aider → Je t\'adjure de m\'aider',
                priority: 85
            },
            {
                rule_id: 'confusion_acception_acceptation',
                name: 'confusion_acception_acceptation',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bacception\\b',
                correction: 'acceptation',
                explanation: 'Acception = sens d\'un mot ; acceptation = fait d\'accepter.',
                example: 'Dans cette acception du mot → Dans cette acceptation',
                priority: 85
            },
            {
                rule_id: 'confusion_addiction_adduction',
                name: 'confusion_addiction_adduction',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\badduction\\b',
                correction: 'addiction',
                explanation: 'Addiction = dépendance à un produit ; adduction = amenée d\'eau.',
                example: 'Il souffre d\'adduction → Il souffre d\'addiction',
                priority: 85
            },
            {
                rule_id: 'confusion_affide_affilie',
                name: 'confusion_affide_affilie',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\baffidé\\b',
                correction: 'affilié',
                explanation: 'Affidé = complice d\'une action illégale ; affilié = membre d\'une organisation.',
                example: 'Les affidés du parti → Les affiliés du parti',
                priority: 85
            },
            {
                rule_id: 'confusion_affleurer_effleurer',
                name: 'confusion_affleurer_effleurer',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\baffleurer\\b',
                correction: 'effleurer',
                explanation: 'Affleurer = apparaître à la surface ; effleurer = toucher légèrement.',
                example: 'La roche affleure → La roche effleure',
                priority: 85
            },
            {
                rule_id: 'confusion_agir_agissements',
                name: 'confusion_agir_agissements',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bagissements\\b',
                correction: 'actions',
                explanation: 'Agissements (pluriel) = actions répréhensibles ; actions = neutre.',
                example: 'Ses agissements sont louables → Ses actions sont louables',
                priority: 85
            },
            {
                rule_id: 'confusion_agonir_agoniser',
                name: 'confusion_agonir_agoniser',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bagonir\\b',
                correction: 'agoniser',
                explanation: 'Agonir (d\'injures) = couvrir d\'injures ; agoniser = être en train de mourir.',
                example: 'Il agonit de douleur → Il agonise de douleur',
                priority: 85
            },
            {
                rule_id: 'confusion_a_à',
                name: 'confusion_a_à',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\ba\\s+(?:demi|heure|peine|cause|lieu|droite|gauche|propos|contre|part)\\b',
                correction: 'à',
                explanation: 'Préposition "à" avec accent pour indiquer la direction, la destination.',
                example: 'a demain → à demain',
                priority: 90
            },
            {
                rule_id: 'confusion_alleguer_leguer',
                name: 'confusion_alleguer_leguer',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bléguer\\b',
                correction: 'alléguer',
                explanation: 'Alléguer = donner comme prétexte, prétendre ; léguer = donner par testament.',
                example: 'Il léguait des excuses → Il alléguait des excuses',
                priority: 85
            },
            {
                rule_id: 'confusion_alternance_alternative',
                name: 'confusion_alternance_alternative',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\balternative\\b',
                correction: 'alternance',
                explanation: 'Alternance = succession régulière ; alternative = choix entre deux options.',
                example: 'L\'alternative des saisons → L\'alternance des saisons',
                priority: 85
            },
            {
                rule_id: 'confusion_amender_amodier',
                name: 'confusion_amender_amodier',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bamodier\\b',
                correction: 'amender',
                explanation: 'Amender = améliorer (une loi, un texte) ; amodier = donner en location (une terre).',
                example: 'Amodier la loi → Amender la loi',
                priority: 85
            },
            {
                rule_id: 'confusion_analogue_analogique',
                name: 'confusion_analogue_analogique',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\banalogique\\b',
                correction: 'analogue',
                explanation: 'Analogue = qui ressemble à ; analogique = qui fonctionne par analogie.',
                example: 'Un système analogique → Un système analogue',
                priority: 85
            },
            {
                rule_id: 'confusion_angulaire_anguleux',
                name: 'confusion_angulaire_anguleux',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bangulaire\\b',
                correction: 'anguleux',
                explanation: 'Angulaire = qui forme un angle ; anguleux = qui a des angles marqués.',
                example: 'Une forme angulaire → Une forme anguleuse',
                priority: 85
            },
            {
                rule_id: 'confusion_anonyme_eponyme',
                name: 'confusion_anonyme_eponyme',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\béponyme\\b',
                correction: 'anonyme',
                explanation: 'Anonyme = sans nom ; éponyme = qui donne son nom.',
                example: 'Un écrivain éponyme → Un écrivain anonyme',
                priority: 85
            },
            {
                rule_id: 'confusion_a_nouveau_de_nouveau',
                name: 'confusion_a_nouveau_de_nouveau',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bde\\s+nouveau\\b',
                correction: 'à nouveau',
                explanation: 'À nouveau = d\'une manière nouvelle ; de nouveau = une autre fois (identique).',
                example: 'Je recommence de nouveau → Je recommence à nouveau',
                priority: 85
            },
            {
                rule_id: 'confusion_antagoniste_protagoniste',
                name: 'confusion_antagoniste_protagoniste',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bprotagoniste\\b',
                correction: 'antagoniste',
                explanation: 'Antagoniste = adversaire ; protagoniste = acteur principal.',
                example: 'Mon protagoniste → Mon antagoniste',
                priority: 85
            },
            {
                rule_id: 'confusion_apparition_appariement',
                name: 'confusion_apparition_appariement',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bappariement\\b',
                correction: 'apparition',
                explanation: 'Apparition = fait d\'apparaître ; appariement = mise en paire.',
                example: 'L\'appariement du fantôme → L\'apparition du fantôme',
                priority: 85
            },
            {
                rule_id: 'confusion_apurer_epurer',
                name: 'confusion_apurer_epurer',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bépurer\\b',
                correction: 'apurer',
                explanation: 'Apurer = vérifier des comptes ; épurer = purifier, rendre plus pur.',
                example: 'Épurer les comptes → Apurer les comptes',
                priority: 85
            },
            {
                rule_id: 'confusion_arrete_arrete',
                name: 'confusion_arrete_arrete',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\barreté\\b',
                correction: 'arrêt',
                explanation: 'Arrêt = décision d\'une cour supérieure ; arrêté = décision administrative.',
                example: 'L\'arreté de la cour → L\'arrêt de la cour',
                priority: 85
            },
            {
                rule_id: 'confusion_assuétude_addiction',
                name: 'confusion_assuétude_addiction',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\baddiction\\b',
                correction: 'assuétude',
                explanation: 'Assuétude = dépendance à un produit ; addiction = même sens, anglicisme.',
                example: 'Il a une addiction → Il a une assuétude',
                priority: 85
            },
            {
                rule_id: 'confusion_ataraxie_ataxie',
                name: 'confusion_ataraxie_ataxie',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bataxie\\b',
                correction: 'ataraxie',
                explanation: 'Ataraxie = absence de troubles ; ataxie = incoordination des mouvements.',
                example: 'Il souffre d\'ataxie → Il souffre d\'ataraxie',
                priority: 85
            },
            {
                rule_id: 'confusion_avanie_avarie',
                name: 'confusion_avanie_avarie',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bavarie\\b',
                correction: 'avanie',
                explanation: 'Avanie = affront, humiliation ; avarie = dégât, dommage.',
                example: 'Subir une avarie → Subir une avanie',
                priority: 85
            },
            {
                rule_id: 'confusion_averer_saverer',
                name: 'confusion_averer_saverer',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bs\'avérer\\s+vrai\\b',
                correction: 's\'avérer',
                explanation: 'S\'avérer = se révéler (déjà "vrai"), éviter "s\'avérer vrai" (pléonasme).',
                example: 'Cela s\'avère vrai → Cela s\'avère',
                priority: 85
            },
            
            // B
            {
                rule_id: 'confusion_bailler_bailler',
                name: 'confusion_bailler_bailler',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bbailler\\b',
                correction: 'bâiller',
                explanation: 'Bâiller = ouvrir la bouche involontairement ; bailler = donner (location).',
                example: 'Il baille de fatigue → Il bâille de fatigue',
                priority: 85
            },
            {
                rule_id: 'confusion_beni_benit',
                name: 'confusion_beni_benit',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bbéni\\b',
                correction: 'bénit',
                explanation: 'Béni = pour les personnes ; bénit = pour les objets sacrés.',
                example: 'Un pain béni → Un pain bénit',
                priority: 85
            },
            {
                rule_id: 'confusion_biennal_bisannuel',
                name: 'confusion_biennal_bisannuel',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bbisannuel\\b',
                correction: 'biennal',
                explanation: 'Biennal = tous les deux ans ; bisannuel = deux fois par an.',
                example: 'Un festival bisannuel → Un festival biennal',
                priority: 85
            },
            {
                rule_id: 'confusion_bleser_biaiser',
                name: 'confusion_bleser_biaiser',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bbiaiser\\b',
                correction: 'bléser',
                explanation: 'Bléser = prononcer mal les consonnes ; biaiser = utiliser des moyens détournés.',
                example: 'Il biaise en parlant → Il blèse en parlant',
                priority: 85
            },
            {
                rule_id: 'confusion_bogue_bug',
                name: 'confusion_bogue_bug',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bbug\\b',
                correction: 'bogue',
                explanation: 'Bogue (fém.) = enveloppe de châtaigne ; bogue (masc.) = erreur informatique (bug).',
                example: 'Un bug dans le programme → Un bogue dans le programme',
                priority: 85
            },
            
            // C
            {
                rule_id: 'confusion_ca_ca',
                name: 'confusion_ca_ca',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bçà\\b',
                correction: 'ça',
                explanation: 'Çà (avec accent) = adverbe de lieu (çà et là) ; ça (sans accent) = pronom démonstratif.',
                example: 'Çà va bien → Ça va bien',
                priority: 90
            },
            {
                rule_id: 'confusion_cantique_quantique',
                name: 'confusion_cantique_quantique',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bquantique\\b',
                correction: 'cantique',
                explanation: 'Cantique = chant religieux ; quantique = relatif aux quanta (physique).',
                example: 'Un chant quantique → Un chant cantique',
                priority: 85
            },
            {
                rule_id: 'confusion_catenaire_catheter',
                name: 'confusion_catenaire_catheter',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcathéter\\b',
                correction: 'caténaire',
                explanation: 'Caténaire = système de suspension électrique ; cathéter = sonde médicale.',
                example: 'Un cathéter électrique → Une caténaire électrique',
                priority: 85
            },
            {
                rule_id: 'confusion_caustique_encaustique',
                name: 'confusion_caustique_encaustique',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bencaustique\\b',
                correction: 'caustique',
                explanation: 'Caustique = qui corrode, mordant ; encaustique = cire pour meubles.',
                example: 'Un produit encaustique → Un produit caustique',
                priority: 85
            },
            {
                rule_id: 'confusion_ceci_cela',
                name: 'confusion_ceci_cela',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bceci\\s+dit\\b',
                correction: 'cela dit',
                explanation: 'Ceci = ce qui va suivre ; cela = ce qui précède. On dit "cela dit".',
                example: 'Ceci dit, je pars → Cela dit, je pars',
                priority: 85
            },
            {
                rule_id: 'confusion_cense_sense',
                name: 'confusion_cense_sense',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bsensé\\b',
                correction: 'censé',
                explanation: 'Censé = supposé ; sensé = qui a du sens, raisonnable.',
                example: 'Il est sensé être là → Il est censé être là',
                priority: 85
            },
            {
                rule_id: 'confusion_cessation_cessibilite',
                name: 'confusion_cessation_cessibilite',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcessibilité\\b',
                correction: 'cessation',
                explanation: 'Cessation = fait de cesser ; cessibilité = caractère de ce qui peut être cédé.',
                example: 'La cessibilité des hostilités → La cessation des hostilités',
                priority: 85
            },
            {
                rule_id: 'confusion_chaire_chair',
                name: 'confusion_chaire_chair',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bchair\\b',
                correction: 'chaire',
                explanation: 'Chaire = estrade, poste (universitaire) ; chair = tissu du corps.',
                example: 'La chair d\'université → La chaire d\'université',
                priority: 85
            },
            {
                rule_id: 'confusion_chasse_chasse',
                name: 'confusion_chasse_chasse',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bchâsse\\b',
                correction: 'chasse',
                explanation: 'Châsse = coffre à reliques ; chasse = action de chasser.',
                example: 'La chasse aux trésors → La chasse aux trésors',
                priority: 85
            },
            {
                rule_id: 'confusion_chemineau_cheminot',
                name: 'confusion_chemineau_cheminot',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcheminot\\b',
                correction: 'chemineau',
                explanation: 'Chemineau = vagabond ; cheminot = employé des chemins de fer.',
                example: 'Un cheminot → Un chemineau',
                priority: 85
            },
            {
                rule_id: 'confusion_chiffe_chiffre',
                name: 'confusion_chiffe_chiffre',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bchiffre\\b',
                correction: 'chiffe',
                explanation: 'Chiffe = chiffon, personne molle ; chiffre = nombre.',
                example: 'Un chiffre de personne → Un chiffre de personne',
                priority: 85
            },
            {
                rule_id: 'confusion_chomage_chaumage',
                name: 'confusion_chomage_chaumage',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bchaumage\\b',
                correction: 'chômage',
                explanation: 'Chômage = absence d\'emploi ; chaumage = action de couper le chaume.',
                example: 'Le chaumage augmente → Le chômage augmente',
                priority: 85
            },
            {
                rule_id: 'confusion_colerique_cholerique',
                name: 'confusion_colerique_cholerique',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcholérique\\b',
                correction: 'colérique',
                explanation: 'Colérique = qui se met en colère ; cholérique = relatif au choléra.',
                example: 'Un homme cholérique → Un homme colérique',
                priority: 85
            },
            {
                rule_id: 'confusion_collusion_collision',
                name: 'confusion_collusion_collision',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcollision\\b',
                correction: 'collusion',
                explanation: 'Collusion = entente secrète contre des tiers ; collision = choc, rencontre brutale.',
                example: 'Une collision secrète → Une collusion secrète',
                priority: 85
            },
            {
                rule_id: 'confusion_colon_colon',
                name: 'confusion_colon_colon',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcôlon\\b',
                correction: 'colon',
                explanation: 'Colon = habitant d\'une colonie ; côlon = partie de l\'intestin.',
                example: 'Le côlon français → Le colon français',
                priority: 85
            },
            {
                rule_id: 'confusion_colonisateur_colonialiste',
                name: 'confusion_colonisateur_colonialiste',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcolonialiste\\b',
                correction: 'colonisateur',
                explanation: 'Colonisateur = qui colonise ; colonialiste = partisan de la colonisation.',
                example: 'Un parti colonialiste → Un parti colonisateur',
                priority: 85
            },
            {
                rule_id: 'confusion_commanditaire_commendataire',
                name: 'confusion_commanditaire_commendataire',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcommendataire\\b',
                correction: 'commanditaire',
                explanation: 'Commanditaire = celui qui apporte des fonds ; commendataire = gestionnaire d\'un bien ecclésiastique.',
                example: 'Le commendataire du projet → Le commanditaire du projet',
                priority: 85
            },
            {
                rule_id: 'confusion_comprehensible_comprehensif',
                name: 'confusion_comprehensible_comprehensif',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcompréhensif\\b',
                correction: 'compréhensible',
                explanation: 'Compréhensible = qui peut être compris ; compréhensif = qui comprend les autres.',
                example: 'Un texte compréhensif → Un texte compréhensible',
                priority: 85
            },
            {
                rule_id: 'confusion_conjoncture_conjecture',
                name: 'confusion_conjoncture_conjecture',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bconjecture\\b',
                correction: 'conjoncture',
                explanation: 'Conjoncture = situation résultant de circonstances ; conjecture = hypothèse, supposition.',
                example: 'Dans cette conjecture économique → Dans cette conjoncture économique',
                priority: 85
            },
            {
                rule_id: 'confusion_consequent_important',
                name: 'confusion_consequent_important',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bconséquent\\b',
                correction: 'important',
                explanation: 'Conséquent = logique (avec ses principes) ; ne pas l\'employer pour "important".',
                example: 'Un travail conséquent → Un travail important',
                priority: 85
            },
            {
                rule_id: 'confusion_contigu_voisin',
                name: 'confusion_contigu_voisin',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcontigu\\b',
                correction: 'voisin',
                explanation: 'Contigu = voisin, adjacent.',
                example: 'Les pays contigus → Les pays voisins',
                priority: 85
            },
            {
                rule_id: 'confusion_cours_court',
                name: 'confusion_cours_court',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcourt\\b',
                correction: 'cours',
                explanation: 'Cours = leçon, flux, avenue ; court = terrain de tennis, brève durée.',
                example: 'Un court d\'eau → Un cours d\'eau',
                priority: 85
            },
            {
                rule_id: 'confusion_criquet_cricket',
                name: 'confusion_criquet_cricket',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcricket\\b',
                correction: 'criquet',
                explanation: 'Criquet = insecte ; cricket = sport.',
                example: 'Un cricket dans l\'herbe → Un criquet dans l\'herbe',
                priority: 85
            },
            {
                rule_id: 'confusion_cuisseau_cuissot',
                name: 'confusion_cuisseau_cuissot',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcuissot\\b',
                correction: 'cuisseau',
                explanation: 'Cuisseau = de veau ; cuissot = de gibier.',
                example: 'Un cuissot de veau → Un cuisseau de veau',
                priority: 85
            },
            {
                rule_id: 'confusion_cultural_culturel',
                name: 'confusion_cultural_culturel',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bcultural\\b',
                correction: 'culturel',
                explanation: 'Cultural = relatif à la culture des sols ; culturel = relatif à la culture (art, idées).',
                example: 'Un événement cultural → Un événement culturel',
                priority: 85
            },
            
            // D
            {
                rule_id: 'confusion_damer_damner',
                name: 'confusion_damer_damner',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bdamner\\b',
                correction: 'damer',
                explanation: 'Damer = tasser, doubler au jeu de dames ; damner = condamner à l\'enfer.',
                example: 'Damner le terrain → Damer le terrain',
                priority: 85
            },
            {
                rule_id: 'confusion_debacle_embacle',
                name: 'confusion_debacle_embacle',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bembâcle\\b',
                correction: 'débâcle',
                explanation: 'Débâcle = rupture des glaces, déroute ; embâcle = obstruction par les glaces.',
                example: 'L\'embâcle du gouvernement → La débâcle du gouvernement',
                priority: 85
            },
            {
                rule_id: 'confusion_decade_decennie',
                name: 'confusion_decade_decennie',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bdécennie\\b',
                correction: 'décade',
                explanation: 'Décade = dix jours ; décennie = dix ans.',
                example: 'Une décennie de jours → Une décade de jours',
                priority: 85
            },
            {
                rule_id: 'confusion_dechirure_dechirement',
                name: 'confusion_dechirure_dechirement',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bdéchirement\\b',
                correction: 'déchirure',
                explanation: 'Déchirure = accroc (concret) ; déchirement = souffrance morale, division.',
                example: 'Un déchirement dans le tissu → Une déchirure dans le tissu',
                priority: 85
            },
            {
                rule_id: 'confusion_de_concert_de_conserve',
                name: 'confusion_de_concert_de_conserve',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bde\\s+conserve\\b',
                correction: 'de concert',
                explanation: 'De concert = en accord ; de conserve = ensemble (navires).',
                example: 'Agir de conserve → Agir de concert',
                priority: 85
            },
            {
                rule_id: 'confusion_decrepi_decrepit',
                name: 'confusion_decrepi_decrepit',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bdécrépit\\b',
                correction: 'décrépi',
                explanation: 'Décrépi = sans crépi (mur) ; décrépit = vieilli (personne).',
                example: 'Un mur décrépit → Un mur décrépi',
                priority: 85
            },
            {
                rule_id: 'confusion_dedommager_endommager',
                name: 'confusion_dedommager_endommager',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bendommager\\b',
                correction: 'dédommager',
                explanation: 'Dédommager = indemniser ; endommager = abîmer.',
                example: 'Endommager la victime → Dédommager la victime',
                priority: 85
            },
            {
                rule_id: 'confusion_defalquer_deduire',
                name: 'confusion_defalquer_deduire',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bdéfalquer\\b',
                correction: 'déduire',
                explanation: 'Défalquer = déduire (comptabilité) ; ne pas confondre avec catafalque.',
                example: 'Défalquer une somme → Déduire une somme',
                priority: 85
            },
            {
                rule_id: 'confusion_dentition_denture',
                name: 'confusion_dentition_denture',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bdenture\\b',
                correction: 'dentition',
                explanation: 'Dentition = formation des dents ; denture = ensemble des dents.',
                example: 'La denture de l\'enfant → La dentition de l\'enfant',
                priority: 85
            },
            {
                rule_id: 'confusion_deodorant_desodorisant',
                name: 'confusion_deodorant_desodorisant',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bdésodorisant\\b',
                correction: 'déodorant',
                explanation: 'Déodorant = pour le corps ; désodorisant = pour les locaux.',
                example: 'Un désodorisant corporel → Un déodorant corporel',
                priority: 85
            },
            {
                rule_id: 'confusion_differend_different',
                name: 'confusion_differend_different',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bdifférent\\b',
                correction: 'différend',
                explanation: 'Différend (nom) = conflit ; différent (adj.) = distinct.',
                example: 'Régler un différent → Régler un différend',
                priority: 85
            },
            {
                rule_id: 'confusion_dilemme_choix',
                name: 'confusion_dilemme_choix',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bdilemme\\b',
                correction: 'choix difficile',
                explanation: 'Dilemme = choix entre deux options comportant des inconvénients.',
                example: 'Faire un dilemme → Faire un choix difficile',
                priority: 85
            },
            {
                rule_id: 'confusion_dissous_dissolu',
                name: 'confusion_dissous_dissolu',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bdissolu\\b',
                correction: 'dissous',
                explanation: 'Dissous = participe de dissoudre ; dissolu = débauché.',
                example: 'Un homme dissous → Un homme dissous',
                priority: 85
            },
            {
                rule_id: 'confusion_drastique_rigoureux',
                name: 'confusion_drastique_rigoureux',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bdrastique\\b',
                correction: 'rigoureux',
                explanation: 'Drastique = très rigoureux, draconien.',
                example: 'Des mesures drastiques → Des mesures rigoureuses',
                priority: 85
            },
            
            // E
            {
                rule_id: 'confusion_ecaler_ecailler',
                name: 'confusion_ecaler_ecailler',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bécailler\\b',
                correction: 'écaler',
                explanation: 'Écaler = enlever l\'écale (œuf, noix) ; écailler = enlever les écailles (poisson).',
                example: 'Écailler un œuf → Écaler un œuf',
                priority: 85
            },
            {
                rule_id: 'confusion_eclaircir_eclairer',
                name: 'confusion_eclaircir_eclairer',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\béclairer\\b',
                correction: 'éclaircir',
                explanation: 'Éclaircir = rendre plus clair ; éclairer = donner de la lumière.',
                example: 'Éclairer la situation → Éclaircir la situation',
                priority: 85
            },
            {
                rule_id: 'confusion_emerite_meritant',
                name: 'confusion_emerite_meritant',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bméritant\\b',
                correction: 'émérite',
                explanation: 'Émérite = qui a de l\'expérience ; méritant = qui a du mérite.',
                example: 'Un professeur méritant → Un professeur émérite',
                priority: 85
            },
            {
                rule_id: 'confusion_emigrer_immigrer',
                name: 'confusion_emigrer_immigrer',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bimmigrer\\b',
                correction: 'émigrer',
                explanation: 'Émigrer = quitter son pays ; immigrer = entrer dans un pays.',
                example: 'Immigrer de France → Émigrer de France',
                priority: 85
            },
            {
                rule_id: 'confusion_eminent_imminent',
                name: 'confusion_eminent_imminent',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bimminent\\b',
                correction: 'éminent',
                explanation: 'Éminent = élevé, remarquable ; imminent = qui va arriver bientôt.',
                example: 'Un danger imminent → Un danger éminent',
                priority: 85
            },
            {
                rule_id: 'confusion_empreinte_emprunt',
                name: 'confusion_empreinte_emprunt',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bemprunt\\b',
                correction: 'empreinte',
                explanation: 'Empreinte = trace ; emprunt = ce qu\'on emprunte.',
                example: 'L\'emprunt du pied → L\'empreinte du pied',
                priority: 85
            },
            {
                rule_id: 'confusion_endemie_epidemie',
                name: 'confusion_endemie_epidemie',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bépidémie\\b',
                correction: 'endémie',
                explanation: 'Endémie = maladie permanente ; épidémie = atteinte soudaine et étendue.',
                example: 'Une épidémie permanente → Une endémie permanente',
                priority: 85
            },
            {
                rule_id: 'confusion_enumerer_renumerer',
                name: 'confusion_enumerer_renumerer',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\brémunérer\\b',
                correction: 'énumérer',
                explanation: 'Énumérer = lister ; rémunérer = payer.',
                example: 'Rémunérer les problèmes → Énumérer les problèmes',
                priority: 85
            },
            {
                rule_id: 'confusion_envahissement_invasion',
                name: 'confusion_envahissement_invasion',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\binvasion\\b',
                correction: 'envahissement',
                explanation: 'Envahissement = action d\'envahir (progressif) ; invasion = irruption brutale.',
                example: 'L\'invasion progressive → L\'envahissement progressif',
                priority: 85
            },
            {
                rule_id: 'confusion_epitaphe_epigraphe',
                name: 'confusion_epitaphe_epigraphe',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bépigraphe\\b',
                correction: 'épitaphe',
                explanation: 'Épitaphe = inscription funéraire ; épigraphe = inscription sur un monument, citation.',
                example: 'L\'épigraphe du tombeau → L\'épitaphe du tombeau',
                priority: 85
            },
            {
                rule_id: 'confusion_evenement_avnement',
                name: 'confusion_evenement_avnement',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bavènement\\b',
                correction: 'événement',
                explanation: 'Événement = ce qui arrive ; avènement = accession à une dignité.',
                example: 'L\'avènement du jour → L\'événement du jour',
                priority: 85
            },
            {
                rule_id: 'confusion_exaltation_exultation',
                name: 'confusion_exaltation_exultation',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bexultation\\b',
                correction: 'exaltation',
                explanation: 'Exaltation = surexcitation intellectuelle ; exultation = grande joie.',
                example: 'L\'exultation intellectuelle → L\'exaltation intellectuelle',
                priority: 85
            },
            {
                rule_id: 'confusion_execer_excreter',
                name: 'confusion_execer_excreter',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bexcréter\\b',
                correction: 'exécrer',
                explanation: 'Exécrer = détester ; excréter = évacuer.',
                example: 'Excréter ce comportement → Exécrer ce comportement',
                priority: 85
            },
            {
                rule_id: 'confusion_exempt_exempte',
                name: 'confusion_exempt_exempte',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bexempté\\b',
                correction: 'exempt',
                explanation: 'Exempt = dispensé ; exempté = dispensé par une autorité.',
                example: 'Il est exempté → Il est exempt',
                priority: 85
            },
            
            // F
            {
                rule_id: 'confusion_facieux_faction',
                name: 'confusion_facieux_faction',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bfaction\\b',
                correction: 'factieux',
                explanation: 'Factieux = qui crée du trouble ; faction = groupe subversif, garde.',
                example: 'Une faction de trouble → Un factieux de trouble',
                priority: 85
            },
            {
                rule_id: 'confusion_fecule_ferule',
                name: 'confusion_fecule_ferule',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bférule\\b',
                correction: 'fécule',
                explanation: 'Fécule = amidon ; férule = baguette, autorité.',
                example: 'La férule de pomme de terre → La fécule de pomme de terre',
                priority: 85
            },
            {
                rule_id: 'confusion_fenil_chenil',
                name: 'confusion_fenil_chenil',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bchenil\\b',
                correction: 'fenil',
                explanation: 'Fenil = local à foin ; chenil = local à chiens.',
                example: 'Le chenil du fermier → Le fenil du fermier',
                priority: 85
            },
            {
                rule_id: 'confusion_fleuve_riviere',
                name: 'confusion_fleuve_riviere',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\brivière\\b',
                correction: 'fleuve',
                explanation: 'Fleuve = se jette dans la mer ; rivière = se jette dans un fleuve.',
                example: 'La rivière Seine → Le fleuve Seine',
                priority: 85
            },
            {
                rule_id: 'confusion_fonds_fond',
                name: 'confusion_fonds_fond',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bfond\\b',
                correction: 'fonds',
                explanation: 'Fonds = capital, terrain ; fond = partie basse.',
                example: 'Le fond de commerce → Le fonds de commerce',
                priority: 85
            },
            
            // G
            {
                rule_id: 'confusion_gageure_gageure',
                name: 'confusion_gageure_gageure',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bgageure\\b',
                correction: 'défi',
                explanation: 'Gageure = défi (prononcer "gajure").',
                example: 'C\'est une gageure → C\'est un défi',
                priority: 85
            },
            {
                rule_id: 'confusion_gemonies_hegemonie',
                name: 'confusion_gemonies_hegemonie',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bhégémonie\\b',
                correction: 'gémonies',
                explanation: 'Gémonies = lieu d\'exposition ; hégémonie = domination.',
                example: 'L\'hégémonie des condamnés → Les gémonies des condamnés',
                priority: 85
            },
            {
                rule_id: 'confusion_gent_gens',
                name: 'confusion_gent_gens',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bgent\\b',
                correction: 'gens',
                explanation: 'Gent = groupe ; gens = personnes.',
                example: 'La gent du peuple → Les gens du peuple',
                priority: 85
            },
            {
                rule_id: 'confusion_gisant_orant',
                name: 'confusion_gisant_orant',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\borant\\b',
                correction: 'gisant',
                explanation: 'Gisant = statue couchée ; orant = statue en prière.',
                example: 'Une statue orante → Une statue gisante',
                priority: 85
            },
            {
                rule_id: 'confusion_graduation_gradation',
                name: 'confusion_graduation_gradation',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bgradation\\b',
                correction: 'graduation',
                explanation: 'Graduation = échelle de mesure ; gradation = progression par degrés.',
                example: 'La gradation du thermomètre → La graduation du thermomètre',
                priority: 85
            },
            
            // H
            {
                rule_id: 'confusion_habilite_habilite',
                name: 'confusion_habilite_habilite',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bhabilité\\b',
                correction: 'habileté',
                explanation: 'Habileté = adresse ; habilité = autorisé.',
                example: 'L\'habilité du joueur → L\'habileté du joueur',
                priority: 85
            },
            {
                rule_id: 'confusion_heur_heure',
                name: 'confusion_heur_heure',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bheur\\b',
                correction: 'heure',
                explanation: 'Heur = chance ; heure = 60 minutes.',
                example: 'Une heure de chance → Une heure de temps',
                priority: 85
            },
            {
                rule_id: 'confusion_hibernate_hiverner',
                name: 'confusion_hibernate_hiverner',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bhiverner\\b',
                correction: 'hiberner',
                explanation: 'Hiberner = être en hibernation ; hiverner = passer l\'hiver à l\'abri.',
                example: 'L\'ours hiverne → L\'ours hiberne',
                priority: 85
            },
            
            // I
            {
                rule_id: 'confusion_idiotisme_idiotie',
                name: 'confusion_idiotisme_idiotie',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bidiotie\\b',
                correction: 'idiotisme',
                explanation: 'Idiotisme = expression propre à une langue ; idiotie = bêtise.',
                example: 'Une idiotie française → Un idiotisme français',
                priority: 85
            },
            {
                rule_id: 'confusion_impavide_impassible',
                name: 'confusion_impavide_impassible',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bimpassible\\b',
                correction: 'impavide',
                explanation: 'Impavide = qui n\'a pas peur ; impassible = sans émotion.',
                example: 'Un homme impassible → Un homme impavide',
                priority: 85
            },
            {
                rule_id: 'confusion_inhumer_exhumer',
                name: 'confusion_inhumer_exhumer',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bexhumer\\b',
                correction: 'inhumer',
                explanation: 'Inhumer = enterrer ; exhumer = déterrer.',
                example: 'Exhumer le corps → Inhumer le corps',
                priority: 85
            },
            {
                rule_id: 'confusion_iniquite_equite',
                name: 'confusion_iniquite_equite',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\béquité\\b',
                correction: 'iniquité',
                explanation: 'Iniquité = injustice ; équité = justice.',
                example: 'L\'équité du système → L\'iniquité du système',
                priority: 85
            },
            {
                rule_id: 'confusion_initier_commencer',
                name: 'confusion_initier_commencer',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\binitier\\b',
                correction: 'commencer',
                explanation: 'Initier = révéler (à qqn) ; critiqué pour "commencer" (anglicisme).',
                example: 'Initier le projet → Commencer le projet',
                priority: 85
            },
            {
                rule_id: 'confusion_introverti_interventi',
                name: 'confusion_introverti_interventi',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\binterverti\\b',
                correction: 'introverti',
                explanation: 'Introverti = tourné vers soi ; interverti = inversé.',
                example: 'Un caractère interverti → Un caractère introverti',
                priority: 85
            },
            {
                rule_id: 'confusion_irruption_eruption',
                name: 'confusion_irruption_eruption',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\béruption\\b',
                correction: 'irruption',
                explanation: 'Irruption = entrée soudaine ; éruption = jaillissement (volcan).',
                example: 'L\'éruption dans la maison → L\'irruption dans la maison',
                priority: 85
            },
            
            // J
            {
                rule_id: 'confusion_jubiler_jubile',
                name: 'confusion_jubiler_jubile',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bjubilé\\b',
                correction: 'jubiler',
                explanation: 'Jubiler = se réjouir ; jubilé = année sainte, anniversaire.',
                example: 'Le jubilé de joie → Le jubilé de l\'année',
                priority: 85
            },
            {
                rule_id: 'confusion_judicieux_judiciaire',
                name: 'confusion_judicieux_judiciaire',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bjudiciaire\\b',
                correction: 'judicieux',
                explanation: 'Judicieux = pertinent ; judiciaire = relatif à la justice.',
                example: 'Un choix judiciaire → Un choix judicieux',
                priority: 85
            },
            {
                rule_id: 'confusion_justesse_justice',
                name: 'confusion_justesse_justice',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bjustice\\b',
                correction: 'justesse',
                explanation: 'Justesse = qualité ; justice = droit, équité.',
                example: 'La justice du tir → La justesse du tir',
                priority: 85
            },
            
            // L
            {
                rule_id: 'confusion_la_la',
                name: 'confusion_la_la',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\blà\\b',
                correction: 'la',
                explanation: 'La = article ; là = adverbe de lieu.',
                example: 'Viens là ici → Viens la ici',
                priority: 85
            },
            {
                rule_id: 'confusion_lacis_lacet',
                name: 'confusion_lacis_lacet',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\blacet\\b',
                correction: 'lacis',
                explanation: 'Lacis = réseau ; lacet = cordon, nœud.',
                example: 'Un lacet de fils → Un lacis de fils',
                priority: 85
            },
            {
                rule_id: 'confusion_laconique_loquace',
                name: 'confusion_laconique_loquace',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bloquace\\b',
                correction: 'laconique',
                explanation: 'Laconique = bref ; loquace = qui parle beaucoup.',
                example: 'Un discours loquace → Un discours laconique',
                priority: 85
            },
            {
                rule_id: 'confusion_lacune_lagune',
                name: 'confusion_lacune_lagune',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\blagune\\b',
                correction: 'lacune',
                explanation: 'Lacune = manque ; lagune = étendue d\'eau salée.',
                example: 'Une lagune dans le savoir → Une lacune dans le savoir',
                priority: 85
            },
            {
                rule_id: 'confusion_legislation_legislature',
                name: 'confusion_legislation_legislature',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\blégislature\\b',
                correction: 'législation',
                explanation: 'Législation = ensemble des lois ; législature = durée d\'un mandat.',
                example: 'La législature française → La législation française',
                priority: 85
            },
            {
                rule_id: 'confusion_limbe_lymphe',
                name: 'confusion_limbe_lymphe',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\blymphe\\b',
                correction: 'limbe',
                explanation: 'Limbe = bord ; lymphe = liquide biologique.',
                example: 'La lymphe de la feuille → Le limbe de la feuille',
                priority: 85
            },
            
            // M
            {
                rule_id: 'confusion_magnificence_munificence',
                name: 'confusion_magnificence_munificence',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmunificence\\b',
                correction: 'magnificence',
                explanation: 'Magnificence = beauté ; munificence = générosité.',
                example: 'La munificence du palais → La magnificence du palais',
                priority: 85
            },
            {
                rule_id: 'confusion_malignite_malice',
                name: 'confusion_malignite_malice',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmalice\\b',
                correction: 'malignité',
                explanation: 'Malignité = nuisible ; malice = espièglerie.',
                example: 'La malice du cancer → La malignité du cancer',
                priority: 85
            },
            {
                rule_id: 'confusion_mandant_mandataire',
                name: 'confusion_mandant_mandataire',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmandataire\\b',
                correction: 'mandant',
                explanation: 'Mandant = donneur ; mandataire = exécutant.',
                example: 'Le mandataire du contrat → Le mandant du contrat',
                priority: 85
            },
            {
                rule_id: 'confusion_materiau_materiel',
                name: 'confusion_materiau_materiel',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmatériel\\b',
                correction: 'matériau',
                explanation: 'Matériau = substance ; matériel = ensemble d\'objets.',
                example: 'Le matériel de construction → Le matériau de construction',
                priority: 85
            },
            {
                rule_id: 'confusion_medical_medicinal',
                name: 'confusion_medical_medicinal',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmédicinal\\b',
                correction: 'médical',
                explanation: 'Médical = relatif à la médecine ; médicinal = qui soigne.',
                example: 'Un traitement médicinal → Un traitement médical',
                priority: 85
            },
            {
                rule_id: 'confusion_megalomane_mythomane',
                name: 'confusion_megalomane_mythomane',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmythomane\\b',
                correction: 'mégalomane',
                explanation: 'Mégalomane = folie des grandeurs ; mythomane = qui ment.',
                example: 'Un mythomane → Un mégalomane',
                priority: 85
            },
            {
                rule_id: 'confusion_melodrame_melomane',
                name: 'confusion_melodrame_melomane',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmélomane\\b',
                correction: 'mélodrame',
                explanation: 'Mélodrame = drame ; mélomane = amateur de musique.',
                example: 'Un mélomane populaire → Un mélodrame populaire',
                priority: 85
            },
            {
                rule_id: 'confusion_memoire_memoire',
                name: 'confusion_memoire_memoire',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmémoire\\b',
                correction: 'mémoire',
                explanation: 'Mémoire (fém.) = faculté ; mémoire (masc.) = écrit.',
                example: 'Un mémoire de mémoire → Un mémoire écrit',
                priority: 85
            },
            {
                rule_id: 'confusion_menagement_management',
                name: 'confusion_menagement_management',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmanagement\\b',
                correction: 'ménagement',
                explanation: 'Ménagement = égards ; management = gestion.',
                example: 'Le management des personnes → Le ménagement des personnes',
                priority: 85
            },
            {
                rule_id: 'confusion_meurtre_assassinat',
                name: 'confusion_meurtre_assassinat',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bassassinat\\b',
                correction: 'meurtre',
                explanation: 'Meurtre = sans préméditation ; assassinat = avec préméditation.',
                example: 'Un assassinat impulsif → Un meurtre impulsif',
                priority: 85
            },
            {
                rule_id: 'confusion_miction_mixtion',
                name: 'confusion_miction_mixtion',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmixtion\\b',
                correction: 'miction',
                explanation: 'Miction = action d\'uriner ; mixtion = action de mélanger.',
                example: 'Une mixtion urgente → Une miction urgente',
                priority: 85
            },
            {
                rule_id: 'confusion_modalisation_modelisation',
                name: 'confusion_modalisation_modelisation',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmodélisation\\b',
                correction: 'modalisation',
                explanation: 'Modalisation = point de vue ; modélisation = construction de modèles.',
                example: 'La modélisation du discours → La modalisation du discours',
                priority: 85
            },
            {
                rule_id: 'confusion_mode_mode',
                name: 'confusion_mode_mode',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmode\\b',
                correction: 'mode',
                explanation: 'Mode (masc.) = manière ; mode (fém.) = usage, coutume.',
                example: 'La mode de faire → La mode de faire',
                priority: 85
            },
            {
                rule_id: 'confusion_moral_morale',
                name: 'confusion_moral_morale',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bmorale\\b',
                correction: 'moral',
                explanation: 'Moral (masc.) = état d\'esprit ; morale (fém.) = règles de vie.',
                example: 'La morale du personnage → Le moral du personnage',
                priority: 85
            },
            
            // N
            {
                rule_id: 'confusion_natal_natif',
                name: 'confusion_natal_natif',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bnatif\\b',
                correction: 'natal',
                explanation: 'Natal = de naissance ; natif = originaire.',
                example: 'Le pays natif → Le pays natal',
                priority: 85
            },
            {
                rule_id: 'confusion_notable_notoire',
                name: 'confusion_notable_notoire',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bnotoire\\b',
                correction: 'notable',
                explanation: 'Notable = important ; notoire = connu (parfois en mal).',
                example: 'Une personne notoire → Une personne notable',
                priority: 85
            },
            
            // O
            {
                rule_id: 'confusion_ou_ou',
                name: 'confusion_ou_ou',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bou\\b',
                correction: 'où',
                explanation: 'Ou = coordination ; où = lieu.',
                example: 'Ou es-tu ? → Où es-tu ?',
                priority: 90
            },
            
            // P
            {
                rule_id: 'confusion_perimetre_perimetre',
                name: 'confusion_perimetre_perimetre',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bpérimètre\\b',
                correction: 'contour',
                explanation: 'Périmètre = contour, limite.',
                example: 'Le périmètre du jardin → Le contour du jardin',
                priority: 85
            },
            
            // R
            {
                rule_id: 'confusion_racines_grecques_latines',
                name: 'confusion_racines_grecques_latines',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\b(anthrop|auto|bio|chrono|geo|graph|log|phon|photo|psych|tele|therm)\\w*\\b',
                correction: 'vérifier le sens',
                explanation: 'Mots formés sur des racines grecques/latines : anthropos (homme), bios (vie), chronos (temps), etc.',
                example: 'anthropologie → science de l\'homme',
                priority: 75
            },
            
            // S
            {
                rule_id: 'confusion_sure_sur',
                name: 'confusion_sure_sur',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bsure\\b',
                correction: 'sûr',
                explanation: 'Sûr = certain ; sur = préposition.',
                example: 'Je suis sure → Je suis sûr',
                priority: 90
            },
            {
                rule_id: 'confusion_peut_etre_peut_etre',
                name: 'confusion_peut_etre_peut_etre',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bpeut\\s+être\\b',
                correction: 'peut-être',
                explanation: 'Peut-être = adverbe (avec trait d\'union).',
                example: 'peut être qu\'il vient → peut-être qu\'il vient',
                priority: 90
            },
            
            // T
            {
                rule_id: 'confusion_tous_tout',
                name: 'confusion_tous_tout',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\btout\\s+les\\b',
                correction: 'tous',
                explanation: 'Tous = pronom (tous les) ; tout = adjectif (tout le temps).',
                example: 'tout les jours → tous les jours',
                priority: 90
            },
            
            // V
            {
                rule_id: 'confusion_ver_vers_verre_vert',
                name: 'confusion_ver_vers_verre_vert',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bver\\s+le\\b',
                correction: 'vers',
                explanation: 'Ver = animal ; vers = préposition ; verre = récipient ; vert = couleur.',
                example: 'ver le mur → vers le mur',
                priority: 85
            },
            {
                rule_id: 'confusion_vin_vain',
                name: 'confusion_vin_vain',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bvain\\s+de\\s+Bordeaux\\b',
                correction: 'vin',
                explanation: 'Vin = boisson ; vain = inutile.',
                example: 'vain de Bordeaux → vin de Bordeaux',
                priority: 85
            },
            {
                rule_id: 'confusion_champ_chant',
                name: 'confusion_champ_chant',
                category: 'vocabulaire',
                pattern_type: 'regex',
                pattern: '\\bchant\\s+de\\s+blé\\b',
                correction: 'champ',
                explanation: 'Champ = surface cultivée ; chant = mélodie.',
                example: 'chant de blé → champ de blé',
                priority: 85
            },
            
            // === RÈGLES DE STYLE ENRICHIES ===
            // Basé sur "Le style et ses pièges" - Chapitres 1 (Ponctuation) et 2 (Syntaxe)
            
            // RÈGLES DE PONCTUATION
            {
                rule_id: 'virgule_apres_cc',
                name: 'virgule_apres_cc',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(Hier|Aujourd\'hui|Demain|Ce matin|Ce soir|Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\\s+(\\w+)\\b',
                correction: '$1, $2',
                explanation: 'Un complément circonstanciel (temps, lieu, manière...) en tête de phrase est généralement suivi d\'une virgule.',
                example: 'Hier je suis allé au cinéma → Hier, je suis allé au cinéma',
                priority: 75
            },
            {
                rule_id: 'espace_avant_ponctuation_double',
                name: 'espace_avant_ponctuation_double',
                category: 'style',
                pattern_type: 'regex',
                pattern: '(\\w)([;:!?.])(?=\\s|$)',
                correction: '$1 $2',
                explanation: 'En typographie française, on met une espace insécable avant les signes de ponctuation double (; : ! ?).',
                example: 'Bonjour! → Bonjour !',
                priority: 80
            },
            {
                rule_id: 'point_interrogation_manquant',
                name: 'point_interrogation_manquant',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(Est-ce que|Qui|Que|Quoi|Quel|Quelle|Quels|Quelles|Comment|Pourquoi|Quand|Où)\\s+.+[^?!.]$',
                correction: '$& ?',
                explanation: 'Une phrase interrogative doit se terminer par un point d\'interrogation.',
                example: 'Tu viens → Tu viens ?',
                priority: 85
            },
            {
                rule_id: 'guillemets_non_fermes',
                name: 'guillemets_non_fermes',
                category: 'style',
                pattern_type: 'regex',
                pattern: '«[^»]*$',
                correction: '$& »',
                explanation: 'Chaque guillemet ouvrant « doit avoir un guillemet fermant » correspondant.',
                example: 'Il a dit : « Bonjour → Il a dit : « Bonjour »',
                priority: 90
            },
            {
                rule_id: 'virgule_avant_et',
                name: 'virgule_avant_et',
                category: 'style',
                pattern_type: 'regex',
                pattern: ',\\s+et\\s+(\\w+)',
                correction: ' et $1',
                explanation: 'Dans une énumération, on ne met généralement pas de virgule avant "et".',
                example: 'des pommes, des poires, et des oranges → des pommes, des poires et des oranges',
                priority: 70
            },
            {
                rule_id: 'majuscule_apres_point',
                name: 'majuscule_apres_point',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\.\\s+([a-z])',
                correction: '. $1',
                explanation: 'Après un point, on met une majuscule pour marquer le début d\'une nouvelle phrase.',
                example: 'Il fait beau. demain nous irons → Il fait beau. Demain nous irons',
                priority: 90
            },
            {
                rule_id: 'points_suspension_excessifs',
                name: 'points_suspension_excessifs',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\.{4,}',
                correction: '...',
                explanation: 'Les points de suspension sont toujours au nombre de trois.',
                example: 'Je ne sais pas.... → Je ne sais pas...',
                priority: 75
            },
            
            // RÈGLES DE SYNTAXE
            {
                rule_id: 'accord_sujet_verbe_beaucoup',
                name: 'accord_sujet_verbe_beaucoup',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(Beaucoup|Peu|La plupart|Une partie|La moitié|Le reste)\\s+de\\s+(\\w+\\w*)\\s+(est|sont)\\b',
                correction: function(match) {
                    const quant = match[1];
                    const complement = match[2];
                    const verb = match[3];
                    
                    // Logique d'accord simplifiée
                    if (quant === 'Beaucoup' && complement.match(/s$/)) {
                        return `${quant} de ${complement} sont`;
                    }
                    return match[0];
                },
                explanation: 'Avec "beaucoup de", le verbe s\'accorde généralement avec le complément qui suit.',
                example: 'Beaucoup de gens est venu → Beaucoup de gens sont venus',
                priority: 85
            },
            {
                rule_id: 'c_est_ce_sont',
                name: 'c_est_ce_sont',
                category: 'style',
                pattern_type: 'regex',
                pattern: "\\bC'est\\s+(les|des|mes|tes|ses|nos|vos|leurs)\\s+\\w+s\\b",
                correction: 'Ce sont',
                explanation: 'Avec un nom pluriel, on utilise "ce sont" au lieu de "c\'est".',
                example: 'C\'est les enfants → Ce sont les enfants',
                priority: 80
            },
            {
                rule_id: 'confusion_ou_où',
                name: 'confusion_ou_où',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(ou|où)\\b',
                correction: function(match) {
                    const word = match[1];
                    const context = match.input.substring(Math.max(0, match.index - 20), match.index + 20);
                    
                    // Logique simplifiée : si suivi de verbe ou pronom, c'est probablement "où"
                    if (context.match(/\\b(ou|où)\\s+(il|elle|on|je|tu|nous|vous|ils|elles)\\b/)) {
                        return 'où';
                    }
                    // Si dans une liste avec "et", c'est probablement "ou"
                    if (context.match(/\\b(ou|où)\\s+et\\s+/)) {
                        return 'ou';
                    }
                    return word;
                },
                explanation: '"ou" (sans accent) est une conjonction ; "où" (avec accent) indique un lieu ou un moment.',
                example: 'La maison ou je vis → La maison où je vis',
                priority: 85
            },
            {
                rule_id: 'confusion_a_à',
                name: 'confusion_a_à',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(a|à)\\b',
                correction: function(match) {
                    const word = match[1];
                    const context = match.input.substring(Math.max(0, match.index - 10), match.index + 20);
                    
                    // Si suivi d'un infinitif, c'est "à"
                    if (context.match(/\\b(a|à)\\s+\\w+er\\b/)) {
                        return 'à';
                    }
                    // Si suivi d'un verbe conjugué, c'est "a"
                    if (context.match(/\\b(a|à)\\s+(est|sont|était|étaient|sera|seront)\\b/)) {
                        return 'a';
                    }
                    return word;
                },
                explanation: '"a" (sans accent) est le verbe avoir ; "à" (avec accent) est une préposition.',
                example: 'Il a Paris → Il est à Paris',
                priority: 90
            },
            {
                rule_id: 'confusion_et_est',
                name: 'confusion_et_est',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(et|est)\\b',
                correction: function(match) {
                    const word = match[1];
                    const context = match.input.substring(Math.max(0, match.index - 10), match.index + 10);
                    
                    // Si entre deux noms ou pronoms, c'est "et"
                    if (context.match(/\\w+\\s+(et|est)\\s+\\w+/)) {
                        return 'et';
                    }
                    // Si sujet + verbe, c'est "est"
                    if (context.match(/\\b(il|elle|ce|c\')\\s+(et|est)\\s+\\w+/)) {
                        return 'est';
                    }
                    return word;
                },
                explanation: '"et" est une conjonction ; "est" est le verbe être.',
                example: 'Il et grand → Il est grand',
                priority: 85
            },
            {
                rule_id: 'apres_que_indicatif',
                name: 'apres_que_indicatif',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\bAprès que\\s+.*\\b(ait|soit|ait)\\b',
                correction: function(match) {
                    return match[0].replace(/(ait|soit)/g, 'a');
                },
                explanation: 'Après "après que", on emploie l\'indicatif, non le subjonctif.',
                example: 'Après qu\'il ait mangé → Après qu\'il a mangé',
                priority: 85
            },
            {
                rule_id: 'avant_que_subjonctif',
                name: 'avant_que_subjonctif',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\bAvant que\\s+.*\\b(a|est|sont|est)\\b',
                correction: function(match) {
                    const verb = match[1];
                    const subjonctifMap = {
                        'a': 'ait',
                        'est': 'soit',
                        'sont': 'soient'
                    };
                    return match[0].replace(verb, subjonctifMap[verb] || verb);
                },
                explanation: 'Après "avant que", on emploie le subjonctif.',
                example: 'Avant qu\'il part → Avant qu\'il parte',
                priority: 85
            },
            {
                rule_id: 'bien_que_subjonctif',
                name: 'bien_que_subjonctif',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\bBien que\\s+.*\\b(est|sont|a|ont)\\b',
                correction: function(match) {
                    const verb = match[1];
                    const subjonctifMap = {
                        'est': 'soit',
                        'sont': 'soient',
                        'a': 'ait',
                        'ont': 'aient'
                    };
                    return match[0].replace(verb, subjonctifMap[verb] || verb);
                },
                explanation: '"Bien que" est toujours suivi du subjonctif.',
                example: 'Bien qu\'il est riche → Bien qu\'il soit riche',
                priority: 85
            },
            {
                rule_id: 'conditionnel_apres_si',
                name: 'conditionnel_apres_si',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\bSi\\s+.*\\b(rais|rait|riez|riez|raient)\\b',
                correction: function(match) {
                    return match[0].replace(/(rais|rait|riez|riez|raient)/g, 'ait');
                },
                explanation: 'Dans une proposition introduite par "si", on n\'emploie jamais le conditionnel.',
                example: 'Si j\'aurais su → Si j\'avais su',
                priority: 90
            },
            {
                rule_id: 'accord_participe_passe_avoir',
                name: 'accord_participe_passe_avoir',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(j\'|tu|il|elle|on|nous|vous|ils|elles)\\s+(ai|as|a|avons|avez|ont)\\s+(\\w+[^es])\\s+(le|la|l\'|les)\\s+(\\w+)\\b',
                correction: function(match) {
                    const participe = match[3];
                    const pronoun = match[4];
                    const cod = match[5];
                    
                    // Logique d'accord simplifiée
                    if (pronoun === 'les' && !participe.endsWith('s')) {
                        return match[0].replace(participe, participe + 's');
                    }
                    if ((pronoun === 'la' || pronoun === 'l\'') && !participe.endsWith('e')) {
                        return match[0].replace(participe, participe + 'e');
                    }
                    return match[0];
                },
                explanation: 'Avec l\'auxiliaire "avoir", le participe passé s\'accorde avec le COD placé avant.',
                example: 'Les pommes que j\'ai mangé → Les pommes que j\'ai mangées',
                priority: 85
            },
            
            // RÈGLES DE STYLE - CHAPITRES 4, 5, 6 (J'écris pour...)
            
            // Chapitre 4: Style et communication
            {
                rule_id: 'exces_je',
                name: 'exces_je',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\bje\\b.*\\bje\\b.*\\bje\\b.*\\bje\\b',
                correction: 'réduire l\'usage de "je"',
                explanation: 'Un excès de "je" peut donner une impression d\'égocentrisme. Variez les formulations.',
                example: 'Je pense que je suis compétent, je voudrais... → Mon parcours correspond au poste...',
                priority: 70
            },
            {
                rule_id: 'formule_politesse_manquante',
                name: 'formule_politesse_manquante',
                category: 'style',
                pattern_type: 'regex',
                pattern: '.{50,}(?!(?:je vous prie|cordialement|salutations|bien à vous|sincèrement))$',
                correction: 'ajouter une formule de politesse',
                explanation: 'Une lettre se termine généralement par une formule de politesse.',
                example: '(fin de lettre sans formule) → Je vous prie d\'agréer...',
                priority: 65
            },
            {
                rule_id: 'pathos_excessif',
                name: 'pathos_excessif',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(lutter|souffrir|désespoir|détresse|misère|combat|douleur|injustice)\\b',
                correction: 'vocabulaire plus neutre',
                explanation: 'L\'usage de mots trop chargés émotionnellement peut indisposer le lecteur.',
                example: 'J\'ai lutté, souffert... → J\'ai traversé des difficultés...',
                priority: 75
            },
            {
                rule_id: 'manque_concret',
                name: 'manque_concret',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(qualité|motivation|compétence|savoir-être|relation|expérience)\\b.*\\b(qualité|motivation|compétence|savoir-être|relation|expérience)\\b',
                correction: 'ajouter des exemples concrets',
                explanation: 'Votre texte contient beaucoup de termes abstraits sans illustration concrète.',
                example: 'J\'ai des qualités relationnelles → J\'ai animé des ateliers pour 20 personnes...',
                priority: 70
            },
            {
                rule_id: 'phrase_trop_longue',
                name: 'phrase_trop_longue',
                category: 'style',
                pattern_type: 'regex',
                pattern: '[^.?!]{100,}',
                correction: 'scinder en phrases plus courtes',
                explanation: 'Les phrases trop longues peuvent nuire à la clarté et fatiguer le lecteur.',
                example: 'Longue phrase complexe → Phrases plus simples et claires',
                priority: 70
            },
            
            // Chapitre 5: Description et narration
            {
                rule_id: 'description_sans_point_de_vue',
                name: 'description_sans_point_de_vue',
                category: 'style',
                pattern_type: 'regex',
                pattern: '^\\w+\\s+\\w+\\s+\\w+\\s+\\w+\\s+\\w+.*\\.$',
                correction: 'intégrer un point de vue',
                explanation: 'Une description gagne à être incarnée par un point de vue personnel.',
                example: 'La maison a trois fenêtres → À mes yeux, la maison...',
                priority: 65
            },
            {
                rule_id: 'description_sans_details',
                name: 'description_sans_details',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(il y avait|c\'était|il était)\\s+\\w+\\.$',
                correction: 'ajouter des détails sensoriels',
                explanation: 'Votre description manque de détails concrets. Utilisez des adjectifs précis.',
                example: 'Il y avait un arbre → Un chêne noueux étendait ses branches...',
                priority: 70
            },
            {
                rule_id: 'recit_sans_chronologie',
                name: 'recit_sans_chronologie',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\w+\\.\\s+\\w+\\.\\s+\\w+\\.(?!.*\\b(puis|ensuite|alors|après|plus tard)\\b)',
                correction: 'ajouter des marqueurs temporels',
                explanation: 'Un récit doit être ancré dans le temps avec des marqueurs chronologiques.',
                example: 'Il arriva. Il vit. Il parla → Il arriva. Puis il vit. Alors il parla',
                priority: 70
            },
            {
                rule_id: 'passif_excessif',
                name: 'passif_excessif',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(été|été|été|fut|fut|fut)\\s+\\w+é\\s+par\\b.*\\b(été|été|été|fut|fut|fut)\\s+\\w+é\\s+par\\b',
                correction: 'privilégier la voix active',
                explanation: 'L\'usage répété du passif alourdit le style. Préférez la voix active.',
                example: 'La décision a été prise → Le comité a pris la décision',
                priority: 75
            },
            
            // Chapitre 6: Style personnel
            {
                rule_id: 'repetition_excessive',
                name: 'repetition_excessive',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(\\w+)\\b.{0,50}?\\b\\1\\b',
                correction: 'remplacer par un synonyme',
                explanation: 'La répétition d\'un même mot à courte distance peut alourdir le style.',
                example: 'Il a dit qu\'il viendrait, mais il n\'est pas venu → Il a annoncé sa venue...',
                priority: 70
            },
            {
                rule_id: 'verbes_faibles',
                name: 'verbes_faibles',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(être|avoir|faire)\\b.*\\b(être|avoir|faire)\\b.*\\b(être|avoir|faire)\\b',
                correction: 'verbes plus précis',
                explanation: 'Les verbes "être", "avoir", "faire" sont généraux. Utilisez des verbes plus spécifiques.',
                example: 'Il a fait un travail → Il a réalisé un travail',
                priority: 70
            },
            {
                rule_id: 'trop_adverbes_ment',
                name: 'trop_adverbes_ment',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b\\w+ment\\b.*\\b\\w+ment\\b.*\\b\\w+ment\\b.*\\b\\w+ment\\b',
                correction: 'varier les formulations',
                explanation: 'L\'accumulation d\'adverbes en -ment peut rendre le style lourd.',
                example: 'Il marcha rapidement, puis s\'arrêta brusquement → Il pressa le pas, puis s\'arrêta net',
                priority: 65
            },
            {
                rule_id: 'cacophonie_que',
                name: 'cacophonie_que',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\bque\\b.{0,20}?\\bque\\b.{0,20}?\\bque\\b',
                correction: 'réduire le nombre de "que"',
                explanation: 'La répétition rapprochée de "que" crée une cacophonie.',
                example: 'Je pense que tu crois que je sais → Je pense que tu crois savoir...',
                priority: 75
            },
            {
                rule_id: 'abus_il_y_a',
                name: 'abus_il_y_a',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(il y a|y a)\\b.*\\b(il y a|y a)\\b.*\\b(il y a|y a)\\b',
                correction: 'tournures plus directes',
                explanation: '"Il y a" est une tournure faible. Préférez des verbes comme "exister".',
                example: 'Il y a des gens qui pensent → Certains pensent',
                priority: 70
            },
            {
                rule_id: 'debuts_phrase_monotones',
                name: 'debuts_phrase_monotones',
                category: 'style',
                pattern_type: 'regex',
                pattern: '^\\b(Il|Elle|On)\\b.*\\n\\b\\1\\b.*\\n\\b\\1\\b',
                correction: 'varier les débuts de phrases',
                explanation: 'Trop de phrases commencent par le même mot. Variez les constructions.',
                example: 'Il arriva. Il vit. Il dit → Il arriva. Soudain, il vit. Alors il dit',
                priority: 70
            },
            {
                rule_id: 'negation_lourde',
                name: 'negation_lourde',
                category: 'style',
                pattern_type: 'regex',
                pattern: '\\b(ne|n\')\\b.*\\b(ne|n\')\\b.*\\b(ne|n\')\\b.*\\b(ne|n\')\\b',
                correction: 'formulations positives',
                explanation: 'L\'accumulation de négations peut rendre le style pesant.',
                example: 'Il n\'a pas vu, n\'a pas entendu → Il est resté sourd et aveugle',
                priority: 65
            }
        ];

        // Stocker les règles dans la base de données simulée
        this.db.set('linguistic_rules', rules);
        
        console.log(`✅ ${rules.length} règles insérées`);
    }

    async query(sql, params = []) {
        // Simuler des requêtes SQL simples
        if (sql.includes('SELECT * FROM linguistic_rules')) {
            return this.db.get('linguistic_rules') || [];
        }
        
        if (sql.includes('SELECT * FROM linguistic_rules WHERE category')) {
            const category = params[0];
            const allRules = this.db.get('linguistic_rules') || [];
            return allRules.filter(rule => rule.category === category);
        }
        
        // Pour d'autres requêtes, retourner un résultat vide
        return [];
    }

    async getAllRules() {
        const rules = this.db.get('linguistic_rules') || [];
        return this.groupRulesByCategory(rules);
    }

    groupRulesByCategory(rules) {
        const grouped = {
            style: [],
            vocabulaire: [],
            conjugaison: [],
            orthographe: []
        };

        rules.forEach(rule => {
            if (grouped[rule.category]) {
                grouped[rule.category].push(this.convertRuleFormat(rule));
            }
        });

        return grouped;
    }

    convertRuleFormat(dbRule) {
        const rule = {
            id: dbRule.rule_id,
            name: dbRule.name,
            category: dbRule.category,
            pattern: dbRule.pattern,
            correction: dbRule.correction,
            explanation: dbRule.explanation,
            example: dbRule.example,
            type: dbRule.category,
            priority: dbRule.priority
        };

        // Conversion du pattern selon le type
        if (dbRule.pattern_type === 'regex') {
            try {
                rule.pattern = new RegExp(dbRule.pattern, 'g');
            } catch (e) {
                console.warn('Pattern regex invalide:', dbRule.pattern);
                rule.pattern = dbRule.pattern;
            }
        } else if (dbRule.pattern_type === 'function') {
            // Pour les fonctions, créer une fonction simple qui retourne le pattern
            rule.pattern = function(match) {
                // Fonction de remplacement simple pour les patterns de fonction
                return match;
            };
        } else {
            rule.pattern = dbRule.pattern;
        }

        // Conversion de la correction
        if (dbRule.correction && dbRule.correction === 'function') {
            // Créer une fonction de correction simple
            rule.correction = function(match) {
                // Fonction de correction par défaut
                return match;
            };
        } else if (dbRule.correction) {
            // Garder la correction comme chaîne si ce n'est pas 'function'
            rule.correction = dbRule.correction;
        }

        return rule;
    }

    async getRulesByCategory(category) {
        const allRules = this.db.get('linguistic_rules') || [];
        const categoryRules = allRules.filter(rule => rule.category === category);
        return categoryRules.map(rule => this.convertRuleFormat(rule));
    }

    getStats() {
        const rules = this.db.get('linguistic_rules') || [];
        const stats = {};

        rules.forEach(rule => {
            if (!stats[rule.category]) {
                stats[rule.category] = { total: 0, active: 0, avgPriority: 0 };
            }
            stats[rule.category].total++;
            stats[rule.category].active++;
            stats[rule.category].avgPriority += rule.priority;
        });

        // Calculer la moyenne
        Object.keys(stats).forEach(category => {
            stats[category].avgPriority = Math.round(stats[category].avgPriority / stats[category].total);
        });

        return stats;
    }
}

// Export pour utilisation globale
window.BrowserSQLiteManager = BrowserSQLiteManager;
