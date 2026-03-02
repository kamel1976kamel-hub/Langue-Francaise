// Assistant d'écriture intelligent avec LanguageTool et audio
class WritingAssistant {
  constructor() {
    this.typingTimer = null;
    this.languageToolEnabled = true;
    this.languageToolUrl = 'https://api.languagetool.org/v2/check'; // API publique
    // Alternative locale : 'http://localhost:8081/v2/check' (si vous avez un serveur local)
    
    this.corrections = {
      // Gardé comme fallback si LanguageTool indisponible
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
        'père': 'père (nom) / perd (verbe perdre)',
        'perd': 'père (nom) / perd (verbe perdre)',
        'per': 'père (nom) / perd (verbe perdre) / per (préposition)',
        'per': 'père (nom) / perd (verbe perdre) / pair (adjectif)',
        'pair': 'père (nom) / perd (verbe perdre) / per (préposition)',
        'paire': 'père (nom) / perd (verbe perdre) / per (préposition)',
        'paire': 'père (nom) / perd (verbe perdre) / pair (adjectif)',
        // Ajouts pour les erreurs courantes
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
        // Erreurs de frappe courantes
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
      // Fautes de grammaire
      grammaire: {
        // Accords
        'ils a': 'ils ont (verbe avoir) / ils a (inexistant)',
        'ils est': 'ils sont (verbe être) / ils est (inexistant)',
        'elles a': 'elles ont (verbe avoir) / elles a (inexistant)',
        'elles est': 'elles sont (verbe être) / elles est (inexistant)',
        'vous a': 'vous avez (verbe avoir) / vous a (inexistant)',
        'vous est': 'vous êtes (verbe être) / vous est (inexistant)',
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
        // Conjugaisons correctes
        'je suis': 'je suis (correct) / je suis (verbe être)',
        'tu es': 'tu es (correct) / tu es (verbe être)',
        'il es': 'il est (correct) / il es (verbe être)',
        'elle es': 'elle est (correct) / elle es (verbe être)',
        'nous sommes': 'nous sommes (correct) / nous sommes (verbe être)',
        'vous êtes': 'vous êtes (correct) / vous êtes (verbe être)',
        'ils sont': 'ils sont (correct) / ils sont (verbe être)',
        'elles sont': 'elles sont (correct) / elles sont (verbe être)',
        // Verbe avoir
        'je ai': 'j\'ai (correct) / je ai (incorrect)',
        'tu as': 'tu as (correct) / tu as (verbe avoir)',
        'il as': 'il a (correct) / il as (incorrect)',
        'elle as': 'elle a (correct) / elle as (incorrect)',
        'nous avons': 'nous avons (correct) / nous avons (verbe avoir)',
        'vous avez': 'vous avez (correct) / vous avez (verbe avoir)',
        'ils ont': 'ils ont (correct) / ils ont (verbe avoir)',
        'elles ont': 'elles ont (correct) / elles ont (verbe avoir)',
      },
      // Choix de mots inappropriés
      vocabulaire: {
        'très bien': 'excellent / très bien / admirable',
        'pas mal': 'correct / satisfaisant / acceptable',
        'chose': 'élément / aspect / point / caractéristique',
        'truc': 'méthode / technique / procédé / outil',
        'machin': 'dispositif / appareil / instrument / objet',
        'bidule': 'dispositif / appareil / instrument / objet',
        'foutu': 'détérioré / endommagé / abîmé',
        'foutu': 'détérioré / endommagé / abîmé',
        'nul': 'médiocre / faible / insuffisant / limité',
        'nulle': 'médiocre / faible / insuffisante / limitée',
        'gros': 'important / considérable / significatif / majeur',
        'grosse': 'importante / considérable / significative / majeure',
        'petit': 'modeste / réduit / limité / mineur',
        'petite': 'modeste / réduite / limitée / mineure',
        'beaucoup': 'énormément / considérablement / grandement / substantiellement',
        'beaucoup de': 'de nombreux / de multiples / maints / divers',
        'un peu': 'légèrement / quelque peu / modérément / relativement',
        'trop': 'excessivement / trop / surabondamment',
        'assez': 'suffisamment / assez / convenablement / adéquatement',
        'plus ou moins': 'relativement / approximativement / globalement / dans l\'ensemble',
        'tout à fait': 'complètement / entièrement / totalement / absolument',
        'en tout cas': 'dans tous les cas / quoi qu\'il en soit / en tout état de cause',
        'en fait': 'en réalité / effectivement / réellement / concrètement',
        'en gros': 'globalement / dans l\'ensemble / sommairement / approximativement',
        'en bref': 'brièvement / succinctement / pour résumer / en résumé',
        'enfin': 'finalement / pour conclure / en conclusion / pour finir',
        'en plus': 'de plus / également / en outre / qui plus est',
        'en tout': 'totalement / complètement / entièrement / absolument',
        'en général': 'généralement / habituellement / couramment / normalement',
        'en particulier': 'spécifiquement / notamment / particulièrement / spécialement',
        'en effet': 'effectivement / en réalité / réellement / concrètement',
        'en dépit': 'malgré / en dépit de / nonobstant / quoique',
        'en raison': 'en raison de / à cause de / du fait de / en vertu de',
        'en vue': 'en vue de / dans la perspective de / en prévision de / anticipant',
        'en fonction': 'en fonction de / selon / suivant / conformément à',
        'en mesure': 'en mesure de / capable de / en état de / à même de',
        'en cours': 'en cours de / pendant / durant / au cours de',
        'fin': 'fin / terme / conclusion / achèvement',
        'début': 'début / commencement / origine / point de départ',
        'milieu': 'milieu / centre / cœur / milieu',
        'bout': 'bout / extrémité / fin / terme',
        'côté': 'côté / direction / sens / orientation',
        'endroit': 'endroit / lieu / place / emplacement',
        'moment': 'moment / instant / temps / période',
        'temps': 'temps / moment / période / durée',
        'fois': 'fois / occasion / moment / instant',
        'manière': 'manière / façon / méthode / technique',
        'façon': 'façon / manière / méthode / technique',
        'sorte': 'sorte / type / genre / catégorie',
        'genre': 'genre / sorte / type / catégorie',
        'type': 'type / sorte / genre / catégorie',
        'espèce': 'espèce / sorte / type / catégorie',
        'forme': 'forme / aspect / apparence / apparence',
        'aspect': 'aspect / forme / apparence / apparence',
        'apparence': 'apparence / aspect / forme / apparence',
        'taille': 'taille / dimension / grandeur / taille',
        'dimension': 'dimension / taille / grandeur / taille',
        'grandeur': 'grandeur / taille / dimension / taille',
        'couleur': 'couleur / teinte / nuance / coloration',
        'teinte': 'teinte / couleur / nuance / coloration',
        'nuance': 'nuance / teinte / couleur / coloration',
        'coloration': 'coloration / couleur / teinte / nuance',
        'odeur': 'odeur / parfum / arôme / senteur',
        'parfum': 'parfum / odeur / arôme / senteur',
        'arôme': 'arôme / odeur / parfum / senteur',
        'senteur': 'senteur / odeur / parfum / arôme',
        'bruit': 'bruit / son / nuisance / perturbation',
        'son': 'son / bruit / nuisance / perturbation',
        'nuisance': 'nuisance / bruit / son / perturbation',
        'perturbation': 'perturbation / bruit / son / nuisance',
      }
    };
    
    this.audioEnabled = true;
    this.currentTooltip = null;
    this.speechSynthesis = window.speechSynthesis;
    this.init();
  }

  init() {
    this.createTooltipStyles();
    this.setupEventListeners();
  }

  createTooltipStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .writing-assistant-tooltip {
        position: absolute;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
        pointer-events: none;
      }
      
      .writing-assistant-tooltip.show {
        opacity: 1;
        transform: translateY(0);
      }
      
      .writing-assistant-tooltip .correction-title {
        font-weight: bold;
        margin-bottom: 8px;
        color: #ffd700;
      }
      
      .writing-assistant-tooltip .correction-text {
        line-height: 1.4;
        margin-bottom: 10px;
      }
      
      .writing-assistant-tooltip .audio-btn {
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      
      .writing-assistant-tooltip .audio-btn:hover {
        background: rgba(255,255,255,0.3);
        transform: scale(1.05);
      }
      
      .writing-assistant-tooltip .audio-btn.playing {
        background: #4ade80;
        animation: pulse 1s infinite;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
      
      .writing-error-highlight {
        background: rgba(239, 68, 68, 0.2);
        border-bottom: 2px wavy #ef4444;
        cursor: help;
        transition: all 0.2s;
      }
      
      .writing-error-highlight:hover {
        background: rgba(239, 68, 68, 0.3);
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Observer les changements dans les textareas
    document.addEventListener('input', (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        this.checkText(e.target);
      }
    });

    // Fermer l'infobulle au clic
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.writing-assistant-tooltip') && !e.target.classList.contains('writing-error-highlight')) {
        this.hideTooltip();
      }
    });
  }

  checkText(element) {
    // Annuler le timer précédent
    clearTimeout(this.typingTimer);
    
    // Programmer une vérification après 800ms de pause
    this.typingTimer = setTimeout(async () => {
      const text = element.value;
      if (!text || text.length < 3) return;

      console.log('🔍 Assistant analyse:', text); // Debug

      // Vérifier si le texte contient des mots complets (pas en train d'écrire)
      const words = text.split(/\s+/);
      const hasCompleteWords = words.some(word => word.length >= 3);
      
      if (!hasCompleteWords) return;

      // Utiliser LanguageTool si disponible, sinon fallback
      let errors = [];
      if (this.languageToolEnabled) {
        try {
          errors = await this.checkWithLanguageTool(text);
        } catch (error) {
          console.warn('⚠️ LanguageTool indisponible, utilisation du fallback:', error);
          errors = this.highlightErrors(text);
        }
      } else {
        errors = this.highlightErrors(text);
      }
      
      // Si on est dans une activité, afficher les suggestions
      if (element.closest('.activity-content')) {
        this.showSuggestions(element, errors);
      }
      
      // Si on est dans un chat, afficher aussi les suggestions
      if (element.closest('.smart-textarea-container') || element.id === 'chatInput') {
        this.showSuggestions(element, errors);
      }
    }, 800);
  }

  // Méthode LanguageTool
  async checkWithLanguageTool(text) {
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('language', 'fr');
      formData.append('enabledRules', 'GONNA,MORFOLOGIK_RULE_FR_FR,COMMA_PARENTHESIS_WHITESPACE,DATE_FORMAT,FRENCH_WHITESPACE,PUNCTUATION_PARAGRAPH_END');
      
      const response = await fetch(this.languageToolUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`LanguageTool API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📝 LanguageTool réponses:', data.matches);
      
      return this.convertLanguageToolErrors(data.matches);
    } catch (error) {
      console.error('❌ Erreur LanguageTool:', error);
      throw error;
    }
  }

  // Convertir les erreurs LanguageTool en format interne
  convertLanguageToolErrors(matches) {
    const errors = [];
    
    matches.forEach(match => {
      const error = {
        type: this.categorizeError(match.rule.category.id),
        word: match.context.text.substring(match.offset, match.offset + match.length),
        correction: match.replacements.length > 0 ? match.replacements.map(r => r.value).join(' / ') : 'Correction suggérée',
        explanation: match.message || `Erreur détectée : ${match.rule.description}`,
        offset: match.offset,
        length: match.length
      };
      
      errors.push(error);
    });

    console.log(`📊 LanguageTool a trouvé ${errors.length} erreurs`);
    return errors;
  }

  // Catégoriser les erreurs LanguageTool
  categorizeError(categoryId) {
    const categories = {
      'TYPOS': 'orthographe',
      'GRAMMAR': 'grammaire',
      'STYLE': 'style',
      'PUNCTUATION': 'ponctuation',
      'CASING': 'orthographe',
      'CONFUSION_WORDS': 'vocabulaire',
      'GRAMMAR_SPELLING': 'grammaire',
      'MISC': 'divers'
    };
    
    return categories[categoryId] || 'divers';
  }

  highlightErrors(text) {
    let highlightedText = text;
    const errors = [];

    console.log('🔍 Recherche d\'erreurs dans:', text); // Debug

    // Vérifier les fautes d'orthographe (plus sensible)
    for (const [erreur, correction] of Object.entries(this.corrections.orthographe)) {
      const regex = new RegExp(`\\b${erreur}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        console.log(`❌ Erreur orthographe trouvée: ${erreur} → ${correction}`); // Debug
        errors.push({
          type: 'orthographe',
          word: erreur,
          correction: correction,
          explanation: `Attention : "${erreur}" devrait probablement être "${correction.split('/')[0]}".`
        });
      }
    }

    // Vérifier les fautes de grammaire
    for (const [erreur, correction] of Object.entries(this.corrections.grammaire)) {
      const regex = new RegExp(`\\b${erreur}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        console.log(`❌ Erreur grammaire trouvée: ${erreur} → ${correction}`); // Debug
        errors.push({
          type: 'grammaire',
          word: erreur,
          correction: correction,
          explanation: `Erreur grammaticale : "${erreur}" devrait être "${correction.split('/')[0]}".`
        });
      }
    }

    // Vérifier le vocabulaire
    for (const [mot, alternatives] of Object.entries(this.corrections.vocabulaire)) {
      const regex = new RegExp(`\\b${mot}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        console.log(`💡 Amélioration vocabulaire trouvée: ${mot} → ${alternatives}`); // Debug
        errors.push({
          type: 'vocabulaire',
          word: mot,
          correction: alternatives,
          explanation: `Vocabulaire : "${mot}" est un peu informel. Essayez plutôt : ${alternatives}.`
        });
      }
    }

    console.log(`📊 Total erreurs trouvées: ${errors.length}`); // Debug
    return errors;
  }

  showSuggestions(element, errors) {
    if (errors.length === 0) return;

    console.log(`💡 Affichage de ${errors.length} suggestions`);

    // Créer un panneau de suggestions
    let suggestionsPanel = element.parentNode.querySelector('.writing-suggestions');
    if (!suggestionsPanel) {
      suggestionsPanel = document.createElement('div');
      suggestionsPanel.className = 'writing-suggestions';
      suggestionsPanel.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        max-height: 200px;
        overflow-y: auto;
        margin-top: 4px;
      `;
      element.parentNode.style.position = 'relative';
      element.parentNode.appendChild(suggestionsPanel);
    }

    // Générer le HTML des suggestions
    let suggestionsHTML = '<div style="padding: 8px; font-size: 12px; font-weight: bold; color: #4a5568; border-bottom: 1px solid #e2e8f0;">💡 Suggestions d\'écriture</div>';
    
    errors.forEach((error, index) => {
      const icon = this.getErrorIcon(error.type);
      const color = this.getErrorColor(error.type);
      
      suggestionsHTML += `
        <div class="suggestion-item" style="padding: 8px 12px; border-bottom: 1px solid #f7fafc; cursor: pointer; hover:background:#f7fafc;" onclick="window.writingAssistant.applyCorrection(this, '${error.correction}', ${error.offset || 0}, ${error.length || 0})">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: ${color}; font-size: 14px;">${icon}</span>
            <span style="flex: 1; font-size: 13px; color: #2d3748;">
              <strong style="color: #e53e3e;">${error.word}</strong> → <strong style="color: #38a169;">${error.correction}</strong>
            </span>
            <button onclick="event.stopPropagation(); window.writingAssistant.speakCorrection('${error.explanation}')" style="background: none; border: none; color: #3182ce; cursor: pointer; font-size: 12px; padding: 2px 4px; border-radius: 3px;" title="Écouter l'explication">
              🔊
            </button>
          </div>
          <div style="font-size: 11px; color: #718096; margin-top: 2px; margin-left: 22px;">
            ${error.explanation}
          </div>
        </div>
      `;
    });

    suggestionsPanel.innerHTML = suggestionsHTML;

    // Auto-suppression après 10 secondes
    setTimeout(() => {
      if (suggestionsPanel && suggestionsPanel.parentNode) {
        suggestionsPanel.remove();
      }
    }, 10000);
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

  getErrorColor(type) {
    const colors = {
      'orthographe': '#e53e3e',
      'grammaire': '#ed8936',
      'vocabulaire': '#38a169',
      'style': '#805ad5',
      'ponctuation': '#3182ce',
      'divers': '#718096'
    };
    return colors[type] || '#e53e3e';
  }

  // Nouvelle méthode pour appliquer les corrections LanguageTool
  applyCorrection(element, correction, offset, length) {
    if (offset && length) {
      // Correction LanguageTool avec position précise
      const text = element.value;
      const before = text.substring(0, offset);
      const after = text.substring(offset + length);
      element.value = before + correction + after;
    } else {
      // Correction fallback (ancien système)
      const text = element.value;
      const parts = text.split(' ');
      const correctedWord = correction.split(' / ')[0];
      const lastWord = parts[parts.length - 1];
      parts[parts.length - 1] = correctedWord;
      element.value = parts.join(' ');
    }
    
    // Recalculer après correction
    setTimeout(() => this.checkText(element), 100);
  }

  showTooltip(element, error, x, y) {
    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'writing-assistant-tooltip';
    tooltip.innerHTML = `
      <div class="correction-title">💡 Suggestion</div>
      <div class="correction-text">${error.explanation}</div>
      <button class="audio-btn" onclick="writingAssistant.speakCorrection('${error.explanation.replace(/'/g, "\\'")}')">
        🔊 Écouter l'explication
      </button>
    `;

    document.body.appendChild(tooltip);
    
    // Positionner l'infobulle
    tooltip.style.left = x + 'px';
    tooltip.style.top = (y - tooltip.offsetHeight - 10) + 'px';

    // Afficher avec animation
    setTimeout(() => tooltip.classList.add('show'), 10);

    this.currentTooltip = tooltip;
  }

  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
  }

  speakCorrection(text) {
    if (!this.audioEnabled || !this.speechSynthesis) return;

    // Arrêter toute lecture en cours
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Ajouter un indicateur visuel
    const btn = event.target;
    btn.classList.add('playing');
    btn.textContent = '🔊 Lecture...';

    utterance.onend = () => {
      btn.classList.remove('playing');
      btn.innerHTML = '🔊 Écouter l\'explication';
    };

    this.speechSynthesis.speak(utterance);
  }

  // Activer/désactiver l'audio
  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
    if (!this.audioEnabled) {
      this.speechSynthesis.cancel();
    }
    return this.audioEnabled;
  }
}

// Initialiser l'assistant
const writingAssistant = new WritingAssistant();

// Rendre accessible globalement
window.writingAssistant = writingAssistant;
