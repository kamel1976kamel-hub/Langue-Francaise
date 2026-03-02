// Assistant d'écriture intelligent avec infobulles et audio
class WritingAssistant {
  constructor() {
    this.corrections = {
      // Fautes d'orthographe courantes
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
        'a': 'à (préposition) / a (verbe avoir)',
        'as': 'a (verbe avoir) / as (2ème personne)',
        'ont': 'on (pronom) / ont (verbe avoir)',
        'son': 'sont (verbe être) / son (possessif)',
        'sont': 'son (possessif) / sont (verbe être)',
        'est': 'et (conjonction) / est (verbe être)',
        'et': 'est (verbe être) / et (conjonction)',
        'ces': 'ses (possessif) / ces (démonstratif)',
        'ses': 'ces (démonstratif) / ses (possessif)',
        'ce': 'se (pronom) / ce (démonstratif)',
        'se': 'ce (démonstratif) / se (pronom)',
        'ceux': 'se (pronom) / ceux (démonstratif)',
        'celui': 'celui (démonstratif) / celu (inexistant)',
        'celle': 'celle (démonstratif) / celle (correct)',
        'celles': 'celles (démonstratif) / celles (correct)',
        'leur': 'leurs (adjectif) / leur (pronom)',
        'leurs': 'leur (pronom) / leurs (adjectif)',
        'ou': 'où (lieu) / ou (conjonction)',
        'où': 'ou (conjonction) / où (lieu)',
        'dans': 'don (verbe) / dans (préposition)',
        'don': 'dans (préposition) / don (nom)',
        'sans': 'sang (nom) / sans (préposition)',
        'sang': 'sans (préposition) / sang (nom)',
        'temps': 'tans (pronom) / temps (nom)',
        'tans': 'temps (nom) / tans (pronom)',
        'tant': 'temps (nom) / tant (adverbe)',
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
        'pour': 'por (inexistant) / pour (préposition)',
        'por': 'pour (préposition) / por (inexistant)',
        'par': 'pars (verbe) / par (préposition)',
        'pars': 'par (préposition) / pars (verbe)',
        'avec': 'aveque (ancien) / avec (préposition)',
        'aveque': 'avec (préposition) / aveque (ancien)',
        'sur': 'sûr (adjectif) / sur (préposition)',
        'sûr': 'sur (préposition) / sûr (adjectif)',
        'sous': 'sou (nom) / sous (préposition)',
        'sou': 'sous (préposition) / sou (nom)',
        'entre': 'entre (préposition) / entre (correct)',
        'contre': 'contre (correct) / contres (incorrect)',
        'contres': 'contre (correct) / contres (incorrect)',
        'depuis': 'dépuis (incorrect) / depuis (préposition)',
        'dépuis': 'depuis (préposition) / dépuis (incorrect)',
        'pendant': 'pendants (adjectif) / pendant (préposition)',
        'pendants': 'pendant (préposition) / pendants (adjectif)',
        'avant': 'avants (adjectif) / avant (préposition)',
        'avants': 'avant (préposition) / avants (adjectif)',
        'apres': 'après (préposition) / apres (incorrect)',
        'après': 'apres (incorrect) / après (préposition)',
        'vers': 'ver (nom) / vers (préposition)',
        'ver': 'vers (préposition) / ver (nom)',
        'vert': 'ver (nom) / vers (préposition) / vert (adjectif)',
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
    const text = element.value;
    if (!text || text.length < 2) return;

    console.log('🔍 Assistant analyse:', text); // Debug

    // Créer une version avec les erreurs surlignées
    const highlightedText = this.highlightErrors(text);
    
    // Si on est dans une activité, afficher les suggestions
    if (element.closest('.activity-content')) {
      this.showSuggestions(element, highlightedText);
    }
    
    // Si on est dans un chat, afficher aussi les suggestions
    if (element.closest('.smart-textarea-container') || element.id === 'chatInput') {
      this.showSuggestions(element, highlightedText);
    }
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

    // Créer un panneau de suggestions
    let suggestionsPanel = element.parentNode.querySelector('.writing-suggestions');
    if (!suggestionsPanel) {
      suggestionsPanel = document.createElement('div');
      suggestionsPanel.className = 'writing-suggestions mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg';
      element.parentNode.appendChild(suggestionsPanel);
    }

    suggestionsPanel.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
        <span class="text-amber-600 font-semibold">💡 Suggestions d'écriture</span>
        <button class="text-amber-500 hover:text-amber-700 text-sm" onclick="this.closest('.writing-suggestions').remove()">
          ✕
        </button>
      </div>
      <div class="space-y-2">
        ${errors.slice(0, 3).map(error => `
          <div class="flex items-start gap-2 text-sm">
            <span class="text-amber-500 mt-0.5">⚠️</span>
            <div class="flex-1">
              <span class="font-medium text-amber-700">${error.word}</span>
              <span class="text-amber-600"> → ${error.correction}</span>
              <button class="ml-2 text-amber-500 hover:text-amber-700" onclick="writingAssistant.speakCorrection('${error.explanation.replace(/'/g, "\\'")}')">
                🔊
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Auto-suppression après 10 secondes
    setTimeout(() => {
      if (suggestionsPanel.parentNode) {
        suggestionsPanel.remove();
      }
    }, 10000);
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
