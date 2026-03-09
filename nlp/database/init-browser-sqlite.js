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
                pattern_type: 'regex',
                pattern: '\\bles enfant\\s+(\\w+es?)\\b',
                correction: 'les enfants $1ent',
                explanation: 'Accord sujet-verbe: les enfants + verbe au pluriel.',
                example: 'Les enfant joue → Les enfants jouent',
                priority: 85
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
