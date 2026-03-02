// Assistant d'écriture avec Grammalecte uniquement
class WritingAssistant {
  constructor() {
    this.typingTimer = null;
    this.grammalecteEnabled = true;
    this.audioEnabled = true;
    
    // Initialiser Grammalecte si disponible
    if (typeof grammalecte !== 'undefined') {
      console.log('🇫🇷 Grammalecte détecté, initialisation...');
      this.initGrammalecte();
    } else {
      console.warn('⚠️ Grammalecte non disponible, utilisation du fallback uniquement');
      this.grammalecteEnabled = false;
    }
    
    this.setupEventListeners();
    this.addStyles();
  }

  // Initialisation de Grammalecte
  async initGrammalecte() {
    try {
      // Initialisation de Grammalecte
      this.grammalecte = new grammalecte.Grammalecte({
        bDebug: false,
        bContextMenu: false,
        bToolbar: false,
        bTextFormatter: false,
        bSpellChecker: false
      });
      
      // Afficher la version de Grammalecte
      if (this.grammalecte && this.grammalecte.oInfo) {
        console.log(`🇫🇷 Grammalecte version: ${this.grammalecte.oInfo.sVersion || 'inconnue'}`);
      }
      
      console.log('✅ Grammalecte initialisé avec succès');
      this.grammalecteEnabled = true;
    } catch (error) {
      console.error('❌ Erreur initialisation Grammalecte:', error);
      this.grammalecteEnabled = false;
    }
  }

  setupEventListeners() {
    // Observer les changements dans les textareas
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        this.checkText(e.target);
      }
    });

    // Fermer les nuages au clic extérieur
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.writing-cloud')) {
        this.removeAllClouds();
      }
    });
  }

  checkText(element) {
    // Annuler le timer précédent
    clearTimeout(this.typingTimer);
    
    // Programmer une vérification après 300ms de pause
    this.typingTimer = setTimeout(async () => {
      const text = element.value;
      if (!text) return;

      // Utiliser Grammalecte si disponible, sinon fallback
      let errors = [];
      if (this.grammalecteEnabled && text.trim().length >= 3) {
        try {
          errors = await this.checkWithGrammalecte(text);
          console.log('🇫🇷 Grammalecte utilisé avec succès');
        } catch (error) {
          console.warn('⚠️ Grammalecte indisponible, utilisation du fallback:', error.message);
          errors = this.highlightErrors(text);
        }
      } else {
        console.log('📝 Utilisation du fallback dictionnaire');
        errors = this.highlightErrors(text);
      }
      
      // Afficher les nuages
      this.showSuggestions(element, errors);
      
    }, 300);
  }

  // Méthode Grammalecte
  async checkWithGrammalecte(text) {
    if (!this.grammalecte || !this.grammalecteEnabled) {
      throw new Error('Grammalecte non initialisé');
    }

    try {
      console.log('🇫🇷 Analyse avec Grammalecte:', text);
      
      // Utiliser la méthode parseText du fallback
      const result = await grammalecte.parseText(text);
      
      const errors = [];
      
      // Convertir les erreurs Grammalecte au format de notre système
      if (result.grammarErrors && result.grammarErrors.length > 0) {
        result.grammarErrors.forEach(error => {
          errors.push({
            type: this.getGrammalecteErrorType(error.ruleId),
            word: error.beforeText || text.substring(error.start, error.end),
            correction: error.suggestions && error.suggestions.length > 0 ? error.suggestions[0] : 'correction suggérée',
            explanation: error.message || 'Erreur grammaticale détectée',
            offset: error.start,
            length: error.end - error.start
          });
        });
      }
      
      if (result.spellingErrors && result.spellingErrors.length > 0) {
        result.spellingErrors.forEach(error => {
          errors.push({
            type: 'orthographe',
            word: error.word,
            correction: error.suggestions && error.suggestions.length > 0 ? error.suggestions[0] : 'correction orthographique',
            explanation: `Erreur orthographique : "${error.word}"`,
            offset: error.start,
            length: error.end - error.start
          });
        });
      }
      
      console.log(`🇫🇷 Grammalecte a trouvé ${errors.length} erreurs`);
      return errors;
      
    } catch (error) {
      console.error('❌ Erreur Grammalecte:', error);
      throw error;
    }
  }

  // Déterminer le type d'erreur Grammalecte
  getGrammalecteErrorType(ruleId) {
    if (ruleId.includes('orthographe') || ruleId.includes('spelling')) {
      return 'orthographe';
    } else if (ruleId.includes('grammaire') || ruleId.includes('grammar')) {
      return 'grammaire';
    } else if (ruleId.includes('conjugaison') || ruleId.includes('verb')) {
      return 'grammaire';
    } else if (ruleId.includes('typographie') || ruleId.includes('typo')) {
      return 'ponctuation';
    } else if (ruleId.includes('vocabulaire') || ruleId.includes('style')) {
      return 'vocabulaire';
    }
    return 'divers';
  }

  // Fallback avec dictionnaire enrichi
  highlightErrors(text) {
    const errors = [];

    // Dictionnaire de corrections français complet
    const corrections = {
      orthographe: {
        'a': 'à (préposition) / a (verbe avoir)',
        'ou': 'où (lieu) / ou (conjonction)',
        'et': 'est (verbe être) / et (conjonction)',
        'ses': 'ces (adjectif démonstratif) / ses (possessif)',
        'sa': 'ça (pronom démonstratif) / sa (possessif)',
        'la': 'là (lieu) / la (article)',
        'leur': 'leurs (adjectif possessif pluriel)',
        'dans': 'don (verbe donner) / dans (préposition)',
        'on': 'ont (verbe avoir) / on (pronom)',
        'ni': 'n\'i (conjonction) / ni (négation)',
        'quand': 'quant (conjonction) / quand (conjonction temporelle)',
        'quelque': 'quel que (pronom) / quelque (adjectif)',
        'tout': 'tous (adjectif pluriel) / tout (adjectif)',
        'plus': 'plus (comparatif) / plut (verbe plaire)',
        'temps': 'tans (pronom) / temps (nom)',
        'avant': 'avants (adjectif) / avant (préposition)',
        'pendant': 'pendants (adjectif) / pendant (préposition)',
        'depuis': 'dépuis (inexistant) / depuis (préposition)',
        'vers': 'ver (verbe) / vers (préposition)',
        'avec': 'aveque (ancien français) / avec (préposition)',
        'pour': 'poure (ancien français) / pour (préposition)',
        'sur': 'sûr (adjectif) / sur (préposition)',
        'sous': 'sou (nom) / sous (préposition)',
        'entre': 'entre (préposition) / entre (préposition)',
        'parmi': 'parmi (préposition) / parmis (inexistant)',
        'parce': 'par ce (locution) / parce que (conjonction)',
        'lorsque': 'lors que (conjonction) / lorsque (conjonction)',
        'puisque': 'puis que (locution) / puisque (conjonction)',
        'bien': 'bient (inexistant) / bien (adverbe)',
        'mieux': 'mieu (inexistant) / mieux (adverbe comparatif)',
        'peut': 'peu (adverbe) / peut (verbe pouvoir)',
        'peux': 'peu (adverbe) / peux (verbe pouvoir)',
        'peuvent': 'peuvent (verbe pouvoir) / peuven (inexistant)',
        'fais': 'fait (nom) / fais (verbe faire)',
        'fait': 'fais (verbe faire) / fait (nom)',
        'font': 'fond (nom) / font (verbe faire)',
        'sont': 'son (possessif) / sont (verbe être)',
        'été': 'eter (inexistant) / été (nom / verbe)',
        'été': 'etais (verbe être) / été (nom)',
        'avais': 'avais (verbe avoir) / avais (verbe avoir)',
        'aurais': 'aurais (verbe avoir) / aurais (conditionnel)',
        'serais': 'serais (verbe être) / serais (conditionnel)',
        'frais': 'fré (verbe faire) / frais (adjectif)',
        'frais': 'frais (adjectif) / frais (nom)',
        'cré': 'crée (verbe créer) / cré (nom)',
        'cré': 'créer (verbe) / cré (nom)',
        'crée': 'créer (verbe) / crée (verbe)',
        'ver': 'ver (nom) / vers (préposition) / vert (adjectif)',
        'vert': 'ver (nom) / vers (préposition) / vert (adjectif)',
        'vers': 'ver (nom) / vers (préposition) / vert (adjectif)',
        'mer': 'mer (nom) / mère (nom) / maire (nom)',
        'mère': 'mer (nom) / mère (nom) / maire (nom)',
        'maire': 'mer (nom) / mère (nom) / maire (nom)',
        'père': 'père (nom - famille)',
        'perd': 'père (nom) / perd (verbe perdre)',
        'per': 'père (nom) / perd (verbe perdre) / per (préposition)',
        'per': 'père (nom) / perd (verbe perdre) / pair (adjectif)',
        'pair': 'père (nom) / perd (verbe perdre) / per (préposition)',
        'paire': 'père (nom) / perd (verbe perdre) / per (préposition)',
        'paire': 'père (nom) / perd (verbe perdre) / pair (adjectif)',
        // Erreurs courantes
        'pere': 'père (nom - famille)',
        'mere': 'mère (nom - famille)',
        'frere': 'frère (nom - famille)',
        'soeur': 'sœur (nom - famille)',
        'aller': 'aller (verbe) / va (verbe aller au présent)',
        'vas': 'va (verbe aller) / vas (incorrect)',
        'vais': 'va (verbe aller) / vais (1ère personne)',
        'vait': 'vais (verbe aller) / vait (verbe voir)',
        'fais': 'fait (verbe faire) / fais (1ère personne)',
        'fait': 'fais (verbe faire) / fait (nom / 3ème personne)',
        'sais': 'sait (verbe savoir) / sais (1ère personne)',
        'sait': 'sais (verbe savoir) / sait (3ème personne)',
        'vior': 'voir (verbe)',
        'voire': 'voir (verbe) / voire (conjonction)',
        'voir': 'voire (conjonction) / voir (verbe)',
        'laisen': 'leçon (nom)',
        'lecon': 'leçon (nom)',
        'leçons': 'leçon (nom singulier) / leçons (nom pluriel)',
        'laçon': 'leçon (nom)',
        'lassen': 'leçon (nom)',
        'laesson': 'leçon (nom)',
        'lessen': 'leçon (nom)',
        'c\'et': 'c\'est (contraction de "cela est")',
        'cet': 'cette (adjectif) / cet (masculin devant voyelle)',
        'cette': 'cet (adjectif masculin) / cette (adjectif féminin)',
        'cet': 'cette (féminin) / cet (masculin devant voyelle)',
        'et': 'est (verbe être) / et (conjonction)',
        'est': 'et (conjonction) / est (verbe être)',
        'ses': 'ces (démonstratif) / ses (possessif)',
        'ces': 'ses (possessif) / ces (démonstratif)',
        'ce': 'se (pronom) / ce (démonstratif)',
        'se': 'ce (démonstratif) / se (pronom)',
        'sa': 'ça (pronom) / sa (possessif)',
        'ça': 'sa (possessif) / ça (pronom)',
        'mon': 'ma (féminin) / mon (masculin)',
        'ma': 'mon (masculin) / ma (féminin)',
        'mes': 'mes (correct) / mais (conjonction)',
        'mais': 'mes (possessif) / mais (conjonction)',
        'son': 'sont (verbe être) / son (possessif)',
        'sont': 'son (possessif) / sont (verbe être)',
        'ont': 'on (pronom) / ont (verbe avoir)',
        'on': 'ont (verbe avoir) / on (pronom)',
        'ou': 'où (lieu) / ou (conjonction)',
        'où': 'ou (conjonction) / où (lieu)',
        'ni': 'n\'i (conjonction) / ni (négation)',
        'n\'i': 'ni (conjonction) / n\'i (ancien français)',
        'dans': 'don (verbe) / dans (préposition)',
        'don': 'dans (préposition) / don (nom)',
        'sans': 'sang (nom) / sans (préposition)',
        'sang': 'sans (préposition) / sang (nom)',
        'avec': 'aveque (ancien) / avec (préposition)',
        'aveque': 'avec (préposition) / aveque (ancien)',
        'sur': 'sûr (adjectif) / sur (préposition)',
        'sûr': 'sur (préposition) / sûr (adjectif)',
        'sous': 'sou (nom) / sous (préposition)',
        'sou': 'sous (préposition) / sou (nom)',
        'pour': 'por (inexistant) / pour (préposition)',
        'por': 'pour (préposition) / por (inexistant)',
        'par': 'pars (verbe) / par (préposition)',
        'pars': 'par (préposition) / pars (verbe)',
        'vers': 'ver (nom) / vers (préposition)',
        'ver': 'vers (préposition) / ver (nom)',
        'vert': 'ver (nom) / vers (préposition) / vert (adjectif)',
        'temp': 'temps (nom) / temps (nom)',
        'temps': 'temp (incorrect) / temps (nom)',
        'tant': 'temps (nom) / tant (adverbe)',
        'tans': 'temps (nom) / tans (pronom)',
        'camp': 'quant (conjonction) / camp (nom)',
        'quant': 'camp (nom) / quant (conjonction)',
        'quand': 'quant (conjonction) / quand (conjonction)',
        'comme': 'commes (inexistant) / comme (conjonction)',
        'comment': 'comment (correct) / coment (incorrect)',
        'coment': 'comment (correct) / coment (incorrect)',
        'quel': 'quels (pluriel) / quel (singulier)',
        'quels': 'quel (singulier) / quels (pluriel)',
        'quelle': 'quelles (pluriel) / quelle (singulier)',
        'quelles': 'quelle (singulier) / quelles (pluriel)',
        'trop': 'tro (inexistant) / trop (adverbe)',
        'tro': 'trop (adverbe) / tro (inexistant)',
        'tres': 'très (adverbe) / tres (incorrect)',
        'très': 'tres (incorrect) / très (adverbe)',
        'tre': 'très (adverbe) / tre (inexistant)',
        'assez': 'assez (correct) / asser (incorrect)',
        'asser': 'assez (correct) / asser (incorrect)',
        'plus': 'plu (inexistant) / plus (adverbe)',
        'plu': 'plus (adverbe) / plu (inexistant)',
        'moin': 'moins (adverbe) / moin (incorrect)',
        'moins': 'moin (incorrect) / moins (adverbe)',
        'peu': 'peux (verbe) / peu (adverbe)',
        'peux': 'peu (adverbe) / peux (verbe)',
        'peut': 'peu (adverbe) / peut (verbe)',
        'bien': 'bient (inexistant) / bien (adverbe)',
        'bient': 'bien (adverbe) / bient (incorrect)',
        'mieux': 'mieu (inexistant) / mieux (adverbe)',
        'mieu': 'mieux (adverbe) / mieu (incorrect)',
        'mal': 'mal (correct) / mâle (adjectif)',
        'mâle': 'mal (adverbe) / mâle (adjectif)',
        'aussi': 'aussi (correct) / aussy (incorrect)',
        'aussy': 'aussi (correct) / aussy (incorrect)',
        'encore': 'encore (correct) / ancore (incorrect)',
        'ancore': 'encore (correct) / ancore (incorrect)',
        'jamais': 'jamais (correct) / jamais (correct)',
        'toujours': 'toujours (correct) / toujour (incorrect)',
        'toujour': 'toujours (correct) / toujour (incorrect)',
        'souvent': 'souvent (correct) / souvant (incorrect)',
        'souvant': 'souvent (correct) / souvant (incorrect)',
        'parfois': 'parfois (correct) / parfoi (incorrect)',
        'parfoi': 'parfois (correct) / parfoi (incorrect)',
        'rarement': 'rarement (correct) / raremant (incorrect)',
        'raremant': 'rarement (correct) / raremant (incorrect)',
        'quelquefois': 'quelquefois (correct) / quelquefoi (incorrect)',
        'quelquefoi': 'quelquefois (correct) / quelquefoi (incorrect)',
        'deja': 'déjà (adverbe) / deja (incorrect)',
        'déjà': 'deja (incorrect) / déjà (adverbe)',
        'deja': 'déjà (correct) / deja (incorrect)',
        'maintenant': 'maintenant (correct) / maintenent (incorrect)',
        'maintenent': 'maintenant (correct) / maintenent (incorrect)',
        'aujourd\'hui': 'aujourd\'hui (correct) / aujourd\'hui (correct)',
        'hier': 'hier (correct) / hier (correct)',
        'demain': 'demain (correct) / demain (correct)',
      },
      grammaire: {
        // Conjugaisons incorrectes
        'qui aller': 'qui va (verbe aller au présent) / qui aller (infinitif incorrect)',
        'je aller': 'je vais (verbe aller au présent) / je aller (infinitif incorrect)',
        'tu aller': 'tu vas (verbe aller au présent) / tu aller (infinitif incorrect)',
        'il aller': 'il va (verbe aller au présent) / il aller (infinitif incorrect)',
        'elle aller': 'elle va (verbe aller au présent) / elle aller (infinitif incorrect)',
        'nous aller': 'nous allons (verbe aller au présent) / nous aller (infinitif incorrect)',
        'vous aller': 'vous allez (verbe aller au présent) / vous aller (infinitif incorrect)',
        'ils aller': 'ils vont (verbe aller au présent) / ils aller (infinitif incorrect)',
        'elles aller': 'elles vont (verbe aller au présent) / elles aller (infinitif incorrect)',
        'je faire': 'je fais (verbe faire au présent) / je faire (infinitif incorrect)',
        'tu faire': 'tu fais (verbe faire au présent) / tu faire (infinitif incorrect)',
        'il faire': 'il fait (verbe faire au présent) / il faire (infinitif incorrect)',
        'elle faire': 'elle fait (verbe faire au présent) / elle faire (infinitif incorrect)',
        'nous faire': 'nous faisons (verbe faire au présent) / nous faire (infinitif incorrect)',
        'vous faire': 'vous faites (verbe faire au présent) / vous faire (infinitif incorrect)',
        'ils faire': 'ils font (verbe faire au présent) / ils faire (infinitif incorrect)',
        'elles faire': 'elles font (verbe faire au présent) / elles faire (infinitif incorrect)',
        'je avoir': 'j\'ai (verbe avoir au présent) / je avoir (infinitif incorrect)',
        'tu avoir': 'tu as (verbe avoir au présent) / tu avoir (infinitif incorrect)',
        'il avoir': 'il a (verbe avoir au présent) / il avoir (infinitif incorrect)',
        'elle avoir': 'elle a (verbe avoir au présent) / elle avoir (infinitif incorrect)',
        'nous avoir': 'nous avons (verbe avoir au présent) / nous avoir (infinitif incorrect)',
        'vous avoir': 'vous avez (verbe avoir au présent) / vous avoir (infinitif incorrect)',
        'ils avoir': 'ils ont (verbe avoir au présent) / ils avoir (infinitif incorrect)',
        'elles avoir': 'elles ont (verbe avoir au présent) / elles avoir (infinitif incorrect)',
        'je être': 'je suis (verbe être au présent) / je être (infinitif incorrect)',
        'tu être': 'tu es (verbe être au présent) / tu être (infinitif incorrect)',
        'il être': 'il est (verbe être au présent) / il être (infinitif incorrect)',
        'elle être': 'elle est (verbe être au présent) / elle être (infinitif incorrect)',
        'nous être': 'nous sommes (verbe être au présent) / nous être (infinitif incorrect)',
        'vous être': 'vous êtes (verbe être au présent) / vous être (infinitif incorrect)',
        'ils être': 'ils sont (verbe être au présent) / ils être (infinitif incorrect)',
        'elles être': 'elles sont (verbe être au présent) / elles être (infinitif incorrect)',
        'je pouvoir': 'je peux (verbe pouvoir au présent) / je pouvoir (infinitif incorrect)',
        'tu pouvoir': 'tu peux (verbe pouvoir au présent) / tu pouvoir (infinitif incorrect)',
        'il pouvoir': 'il peut (verbe pouvoir au présent) / il pouvoir (infinitif incorrect)',
        'elle pouvoir': 'elle peut (verbe pouvoir au présent) / elle pouvoir (infinitif incorrect)',
        'nous pouvoir': 'nous pouvons (verbe pouvoir au présent) / nous pouvoir (infinitif incorrect)',
        'vous pouvoir': 'vous pouvez (verbe pouvoir au présent) / vous pouvoir (infinitif incorrect)',
        'ils pouvoir': 'ils peuvent (verbe pouvoir au présent) / ils pouvoir (infinitif incorrect)',
        'elles pouvoir': 'elles peuvent (verbe pouvoir au présent) / elles pouvoir (infinitif incorrect)',
        'je vouloir': 'je veux (verbe vouloir au présent) / je vouloir (infinitif incorrect)',
        'tu vouloir': 'tu veux (verbe vouloir au présent) / tu vouloir (infinitif incorrect)',
        'il vouloir': 'il veut (verbe vouloir au présent) / il vouloir (infinitif incorrect)',
        'elle vouloir': 'elle veut (verbe vouloir au présent) / elle vouloir (infinitif incorrect)',
        'nous vouloir': 'nous voulons (verbe vouloir au présent) / nous vouloir (infinitif incorrect)',
        'vous vouloir': 'vous voulez (verbe vouloir au présent) / vous vouloir (infinitif incorrect)',
        'ils vouloir': 'ils veulent (verbe vouloir au présent) / ils vouloir (infinitif incorrect)',
        'elles vouloir': 'elles veulent (verbe vouloir au présent) / elles vouloir (infinitif incorrect)',
        'je savoir': 'je sais (verbe savoir au présent) / je savoir (infinitif incorrect)',
        'tu savoir': 'tu sais (verbe savoir au présent) / tu savoir (infinitif incorrect)',
        'il savoir': 'il sait (verbe savoir au présent) / il savoir (infinitif incorrect)',
        'elle savoir': 'elle sait (verbe savoir au présent) / elle savoir (infinitif incorrect)',
        'nous savoir': 'nous savons (verbe savoir au présent) / nous savoir (infinitif incorrect)',
        'vous savoir': 'vous savez (verbe savoir au présent) / vous savoir (infinitif incorrect)',
        'ils savoir': 'ils savent (verbe savoir au présent) / ils savoir (infinitif incorrect)',
        'elles savoir': 'elles savent (verbe savoir au présent) / elles savoir (infinitif incorrect)',
        'je aller': 'je vais (verbe aller au présent) / je aller (infinitif incorrect)',
        'tu aller': 'tu vas (verbe aller au présent) / tu aller (infinitif incorrect)',
        'il aller': 'il va (verbe aller au présent) / il aller (infinitif incorrect)',
        'elle aller': 'elle va (verbe aller au présent) / elle aller (infinitif incorrect)',
        'nous aller': 'nous allons (verbe aller au présent) / nous aller (infinitif incorrect)',
        'vous aller': 'vous allez (verbe aller au présent) / vous aller (infinitif incorrect)',
        'ils aller': 'ils vont (verbe aller au présent) / ils aller (infinitif incorrect)',
        'elles aller': 'elles vont (verbe aller au présent) / elles aller (infinitif incorrect)',
      },
      vocabulaire: {
        'cool': 'agréable / sympathique',
        'super': 'excellent / remarquable',
        'génial': 'excellent / remarquable',
        'top': 'excellent / de qualité',
        'nul': 'médiocre / de mauvaise qualité',
        'bof': 'médiocre / sans intérêt',
        'kiffer': 'adorer / apprécier',
        'défoncer': 'très réussi / excellent',
        'casser': 'échouer / rater',
        'baiser': 'échouer / rater',
        'chercher': 'rechercher / chercher',
        'manger': 'consommer / déjeuner',
        'bouffer': 'manger / consommer',
        'dormir': 'reposer / dormir',
        'piquer': 'partir / s\'en aller',
        'filer': 'partir rapidement / s\'en aller',
        'kiffer': 'adorer / apprécier fortement',
        'assurer': 'garantir / certifier',
        'déchirer': 'excellent / remarquable',
        'rester': 'demeurer / rester',
        'venir': 'arriver / se présenter',
        'partir': 's\'en aller / quitter',
        'arriver': 'parvenir / atteindre',
        'sortir': 'quitter / sortir de',
        'entrer': 'pénétrer / entrer dans',
        'monter': 'grimper / monter',
        'descendre': 'baisser / descendre',
        'trouver': 'découvrir / trouver',
        'perdre': 'égarer / perdre',
        'gagner': 'obtenir / gagner',
        'recevoir': 'obtenir / recevoir',
        'donner': 'offrir / donner',
        'prendre': 'saisir / prendre',
        'mettre': 'placer / mettre',
        'tenir': 'maintenir / tenir',
        'venir': 'arriver / se présenter',
        'devoir': 'être obligé de / devoir',
        'pouvoir': 'être capable de / pouvoir',
        'vouloir': 'désirer / vouloir',
        'savoir': 'connaître / savoir',
        'connaître': 'savoir / connaître',
        'voir': 'percevoir / voir',
        'entendre': 'percevoir / entendre',
        'parler': 'communiquer / parler',
        'dire': 'exprimer / dire',
        'faire': 'réaliser / faire',
        'être': 'exister / être',
        'avoir': 'posséder / avoir',
        'aller': 'se rendre / aller',
        'venir': 'arriver / venir',
      }
    };

    // Vérifier les fautes d'orthographe
    for (const [erreur, correction] of Object.entries(corrections.orthographe)) {
      const regex = new RegExp(`\\b${erreur}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        // Éviter les doublons
        if (erreur === 'et' && text.includes('c\'et')) {
          continue;
        }
        errors.push({
          type: 'orthographe',
          word: erreur,
          correction: correction,
          explanation: `Attention : "${erreur}" devrait probablement être "${correction.split('/')[0]}".`
        });
      }
    }

    // Vérifier les fautes de grammaire
    for (const [erreur, correction] of Object.entries(corrections.grammaire)) {
      const regex = new RegExp(`\\b${erreur}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        errors.push({
          type: 'grammaire',
          word: erreur,
          correction: correction,
          explanation: `Erreur grammaticale : "${erreur}" devrait être "${correction.split('/')[0]}".`
        });
      }
    }

    // Vérifier le vocabulaire
    for (const [mot, alternatives] of Object.entries(corrections.vocabulaire)) {
      const regex = new RegExp(`\\b${mot}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        errors.push({
          type: 'vocabulaire',
          word: mot,
          correction: alternatives,
          explanation: `Vocabulaire : "${mot}" est un peu informel. Essayez plutôt : ${alternatives}.`
        });
      }
    }

    console.log(`📊 Dictionnaire fallback a trouvé ${errors.length} erreurs`);
    return errors;
  }

  showSuggestions(element, errors) {
    // Supprimer les anciens nuages
    this.removeAllClouds();

    if (errors.length === 0) {
      const text = element.value;
      if (text && text.trim().length > 0) {
        this.createInfoCloud(element, text);
      }
      return;
    }

    // Créer un nuage pour chaque erreur
    errors.forEach((error, index) => {
      setTimeout(() => {
        this.createCloud(element, error, index);
      }, index * 150);
    });
  }

  createInfoCloud(element, text) {
    const cloud = document.createElement('div');
    cloud.className = 'writing-cloud info-cloud';
    cloud.style.cssText = `
      position: absolute;
      top: -60px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 12px 16px;
      border-radius: 20px;
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
      z-index: 10000;
      min-width: 250px;
      max-width: 350px;
      font-size: 13px;
      animation: cloudFloat 0.5s ease-out;
      border: 2px solid rgba(255, 255, 255, 0.2);
      display: block !important;
      visibility: visible !important;
    `;

    cloud.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">✅</span>
        <span style="font-weight: bold;">Pas d'erreur détectée</span>
      </div>
      <div style="margin-top: 6px; opacity: 0.9; font-size: 12px;">
        Continuez d'écrire... (${text.length} caractère${text.length > 1 ? 's' : ''})
      </div>
    `;

    element.parentNode.style.position = 'relative';
    element.parentNode.appendChild(cloud);

    setTimeout(() => {
      if (cloud.parentNode) {
        cloud.style.animation = 'cloudFloat 0.3s ease-in reverse';
        setTimeout(() => cloud.remove(), 300);
      }
    }, 3000);
  }

  createCloud(element, error, index) {
    const cloud = document.createElement('div');
    cloud.className = 'writing-cloud';
    
    // Augmenter l'espacement vertical pour éviter la superposition
    const topPosition = -120 - (index * 100); // Augmenté de -80/-100 à -120/-100
    cloud.style.cssText = `
      position: absolute;
      top: ${topPosition}px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
      padding: 12px 16px;
      border-radius: 20px;
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
      z-index: 10000;
      min-width: 250px;
      max-width: 350px;
      font-size: 13px;
      animation: cloudFloat 0.5s ease-out;
      border: 2px solid rgba(255, 255, 255, 0.2);
      display: block !important;
      visibility: visible !important;
      cursor: move; // Curseur de déplacement
      user-select: none; // Éviter la sélection pendant le déplacement
    `;

    // Ajouter l'animation CSS
    if (!document.querySelector('#cloud-animations')) {
      const style = document.createElement('style');
      style.id = 'cloud-animations';
      style.textContent = `
        @keyframes cloudFloat {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.8); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        .writing-cloud { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .cloud-error { font-weight: bold; color: #fbbf24; font-size: 14px; }
        .cloud-correction { font-weight: bold; color: #86efac; font-size: 14px; }
        .cloud-explanation { margin-top: 6px; opacity: 0.9; line-height: 1.4; }
        .cloud-audio { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.2); }
        .cloud-audio-btn { background: rgba(255, 255, 255, 0.2); border: none; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; cursor: pointer; transition: background 0.2s; }
        .cloud-audio-btn:hover { background: rgba(255, 255, 255, 0.3); }
        .cloud-close-btn { position: absolute; top: 8px; right: 8px; background: rgba(255, 255, 255, 0.2); border: none; color: white; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: background 0.2s; }
        .cloud-close-btn:hover { background: rgba(255, 255, 255, 0.3); }
      `;
      document.head.appendChild(style);
    }

    const icon = this.getErrorIcon(error.type);
    const cloudId = `cloud-${Date.now()}-${index}`;
    const audioBtnId = `audio-${cloudId}`;
    const applyBtnId = `apply-${cloudId}`;
    const closeBtnId = `close-${cloudId}`;
    
    cloud.innerHTML = `
      <button id="${closeBtnId}" class="cloud-close-btn" title="Fermer">✕</button>
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <span style="font-size: 16px;">${icon}</span>
        <span class="cloud-error">"${error.word}"</span>
        <span>→</span>
        <span class="cloud-correction">"${error.correction}"</span>
      </div>
      <div class="cloud-explanation">${error.explanation}</div>
      <div class="cloud-audio">
        <button id="${audioBtnId}" class="cloud-audio-btn">🔊 Écouter l'explication</button>
        <button id="${applyBtnId}" class="cloud-audio-btn" style="margin-left: 8px;">✏️ Appliquer</button>
      </div>
    `;

    element.parentNode.style.position = 'relative';
    element.parentNode.appendChild(cloud);

    // Ajouter les événements
    setTimeout(() => {
      const audioBtn = document.getElementById(audioBtnId);
      const applyBtn = document.getElementById(applyBtnId);
      const closeBtn = document.getElementById(closeBtnId);
      
      if (audioBtn) {
        audioBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.speakCorrection(error.explanation);
        });
      }
      
      if (applyBtn) {
        applyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.applyCorrectionFromCloud(applyBtn, error.correction, error.offset || 0, error.length || 0);
        });
      }
      
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          cloud.style.animation = 'cloudFloat 0.3s ease-in reverse';
          setTimeout(() => cloud.remove(), 300);
        });
      }

      // 🎵 LANCER L'AUDIO AUTOMATIQUEMENT
      console.log('🎵 Lancement automatique de l\'audio pour:', error.explanation);
      this.speakCorrection(error.explanation);
      
      // 🖱️ RENDRE LE NUAGE DÉPLAÇABLE
      this.makeCloudDraggable(cloud);
      
    }, 100);
  }

  // Fonction pour rendre un nuage déplaçable
  makeCloudDraggable(cloud) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    // Fonction de démarrage du drag
    const startDrag = (e) => {
      if (e.target.closest('.cloud-audio-btn, .cloud-close-btn')) {
        return; // Ne pas déplacer si on clique sur un bouton
      }
      
      isDragging = true;
      startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
      startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
      
      const rect = cloud.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      cloud.style.zIndex = 10001; // Mettre au premier plan pendant le déplacement
      cloud.style.transition = 'none'; // Désactiver les transitions pendant le drag
      cloud.style.cursor = 'grabbing';
    };

    // Fonction de déplacement
    const drag = (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      
      const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
      const currentY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      cloud.style.left = newX + 'px';
      cloud.style.top = newY + 'px';
      cloud.style.transform = 'none'; // Enlever le transform pendant le déplacement
    };

    // Fonction de fin de drag
    const endDrag = () => {
      if (!isDragging) return;
      
      isDragging = false;
      cloud.style.zIndex = 10000; // Remettre le z-index normal
      cloud.style.transition = ''; // Réactiver les transitions
      cloud.style.cursor = 'move';
    };

    // Événements souris
    cloud.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    // Événements tactiles (mobile)
    cloud.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', endDrag);

    // Nettoyage des événements lors de la suppression du nuage
    const cleanup = () => {
      cloud.removeEventListener('mousedown', startDrag);
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', endDrag);
      cloud.removeEventListener('touchstart', startDrag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('touchend', endDrag);
    };

    // Observer la suppression du nuage pour nettoyer les événements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === cloud) {
            cleanup();
            observer.disconnect();
          }
        });
      });
    });

    observer.observe(cloud.parentNode, { childList: true, subtree: true });
  }

  getErrorIcon(type) {
    const icons = {
      'orthographe': '❌',
      'grammaire': '⚠️',
      'vocabulaire': '💡',
      'style': '🎨',
      'ponctuation': '📝',
      'divers': 'ℹ️'
    };
    return icons[type] || '❌';
  }

  applyCorrectionFromCloud(button, correction, offset, length) {
    const cloud = button.closest('.writing-cloud');
    const container = cloud.parentNode;
    const input = container.querySelector('input, textarea');
    
    if (!input) {
      console.error('❌ Input non trouvé pour la correction');
      return;
    }

    if (offset > 0 && length > 0) {
      // Correction précise
      const text = input.value;
      const before = text.substring(0, offset);
      const after = text.substring(offset + length);
      input.value = before + correction + after;
    } else {
      // Correction fallback
      const text = input.value;
      const parts = text.split(' ');
      const correctedWord = correction.split(' / ')[0];
      const lastWord = parts[parts.length - 1];
      parts[parts.length - 1] = correctedWord;
      input.value = parts.join(' ');
    }
    
    this.removeAllClouds();
    setTimeout(() => this.checkText(input), 100);
  }

  speakCorrection(text) {
    if (!this.audioEnabled) {
      console.log('🔊 Audio désactivé');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(voice => 
      voice.lang.startsWith('fr') || 
      voice.name.includes('French') ||
      voice.name.includes('Français')
    );
    
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('❌ Impossible de démarrer la lecture audio:', error);
    }
  }

  removeAllClouds() {
    document.querySelectorAll('.writing-cloud').forEach(cloud => cloud.remove());
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .writing-error-highlight {
        background: rgba(239, 68, 68, 0.2);
        border-bottom: 2px solid #ef4444;
        cursor: help;
        position: relative;
      }
      
      .writing-error-highlight:hover {
        background: rgba(239, 68, 68, 0.3);
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialiser l'assistant
window.addEventListener('DOMContentLoaded', () => {
  window.writingAssistant = new WritingAssistant();
  console.log('✅ Assistant d\'écriture avec Grammalecte chargé');
});
