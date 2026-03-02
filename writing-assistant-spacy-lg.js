// Assistant d'écriture avec spaCy lg (Large) - Version ultra-avancée
class WritingAssistantSpacyLG {
  constructor() {
    this.spacyInterface = new SpacyLGInterface();
    this.spacyEnabled = false;
    this.clouds = [];
    this.modelInfo = null;
    this.customRules = null;
    this.init();
  }

  async init() {
    console.log('🧠 Initialisation de l\'assistant d\'écriture avec spaCy lg (Large)...');
    
    // Initialiser spaCy lg
    await this.spacyInterface.init();
    this.spacyEnabled = this.spacyInterface.enabled;
    this.modelInfo = this.spacyInterface.getModelInfo();
    
    // Initialiser les règles personnalisées
    if (typeof SpacyCustomRules !== 'undefined') {
      this.customRules = new SpacyCustomRules();
    }
    
    // Mettre en place les écouteurs d'événements
    this.setupEventListeners();
    
    // Afficher les informations du modèle
    if (this.spacyEnabled) {
      console.log('✅ spaCy lg (Large) initialisé');
      console.log(`📊 Modèle: ${this.modelInfo.name} - Précision: ${this.modelInfo.accuracy}`);
      console.log(`🎯 Fonctionnalités: ${this.modelInfo.features.join(', ')}`);
    } else {
      console.log('📝 Mode fallback avancé activé');
    }
    
    console.log('✅ Assistant d\'écriture spaCy lg (Large) chargé');
  }

  setupEventListeners() {
    // Observer les changements dans les textareas et inputs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'TEXTAREA' || node.tagName === 'INPUT') {
            this.addInputListener(node);
          }
          
          // Chercher les inputs dans les nouveaux éléments
          const inputs = node.querySelectorAll ? node.querySelectorAll('textarea, input[type="text"]') : [];
          inputs.forEach(input => this.addInputListener(input));
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Ajouter aux éléments existants
    document.querySelectorAll('textarea, input[type="text"]').forEach(input => {
      this.addInputListener(input);
    });
  }

  addInputListener(element) {
    if (element.dataset.spacyLGAssistant) return;
    element.dataset.spacyLGAssistant = 'true';

    let timeout;
    element.addEventListener('input', async (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await this.checkText(element);
      }, 600); // Délai augmenté pour l'analyse lg
    });
  }

  async checkText(element) {
    const text = element.value.trim();
    
    if (text.length < 3) {
      this.clearClouds(element);
      return;
    }

    try {
      console.log('🧠 Analyse avec spaCy lg (Large):', text);
      
      // Utiliser spaCy lg si disponible
      const errors = await this.spacyInterface.analyzeText(text);
      
      // Appliquer les règles personnalisées si disponibles
      if (this.customRules) {
        const customErrors = this.applyCustomRules(text);
        errors.push(...customErrors);
      }
      
      if (errors.length > 0) {
        this.highlightErrors(element, errors);
        this.showSuggestions(element, errors);
      } else {
        this.showSuccess(element);
      }
      
    } catch (error) {
      console.error('❌ Erreur analyse spaCy lg:', error);
    }
  }

  applyCustomRules(text) {
    if (!this.customRules) return [];
    
    // Créer un document simulé pour les règles personnalisées
    const simulatedDoc = this.createSimulatedDocument(text);
    
    try {
      return this.customRules.applyRules(simulatedDoc);
    } catch (error) {
      console.error('❌ Erreur règles personnalisées:', error);
      return [];
    }
  }

  createSimulatedDocument(text) {
    // Simulation simplifiée d'un document spaCy pour le fallback
    const tokens = text.split(/\s+/).map((word, index) => ({
      text: word,
      lemma: this.getLemma(word),
      pos: this.getPOS(word),
      morph: this.getMorphology(word),
      idx: text.indexOf(word),
      i: index,
      dep: this.getDependency(word, index),
      head: null
    }));
    
    // Définir les relations de dépendance
    tokens.forEach((token, index) => {
      if (index > 0) {
        token.head = tokens[index - 1];
      }
    });
    
    return tokens;
  }

  getLemma(word) {
    const lemmas = {
      'mange': 'manger',
      'mangeaient': 'manger',
      'mangé': 'manger',
      'mangée': 'manger',
      'mangés': 'manger',
      'mangées': 'manger',
      'sont': 'être',
      'sommes': 'être',
      'est': 'être',
      'suis': 'être',
      'étais': 'être',
      'était': 'être',
      'étions': 'être',
      'étiez': 'être',
      'étaient': 'être',
      'ont': 'avoir',
      'avons': 'avoir',
      'ai': 'avoir',
      'as': 'avoir',
      'a': 'avoir',
      'avais': 'avoir',
      'avait': 'avoir',
      'avions': 'avoir',
      'aviez': 'avoir',
      'avaient': 'avoir',
      'vont': 'aller',
      'allons': 'aller',
      'vais': 'aller',
      'vas': 'aller',
      'va': 'aller',
      'allait': 'aller',
      'allaient': 'aller',
      'font': 'faire',
      'faisons': 'faire',
      'fais': 'faire',
      'faisait': 'faire',
      'faisaient': 'faire',
      'disent': 'dire',
      'disons': 'dire',
      'dis': 'dire',
      'dit': 'dire',
      'disait': 'dire',
      'disaient': 'dire'
    };
    
    return lemmas[word.toLowerCase()] || word.toLowerCase();
  }

  getPOS(word) {
    const posMap = {
      'les': 'DET',
      'le': 'DET',
      'la': 'DET',
      'l\'': 'DET',
      'un': 'DET',
      'une': 'DET',
      'des': 'DET',
      'du': 'DET',
      'de': 'ADP',
      'à': 'ADP',
      'et': 'CCONJ',
      'mais': 'CCONJ',
      'ou': 'CCONJ',
      'car': 'CCONJ',
      'donc': 'CCONJ',
      'ni': 'CCONJ',
      'que': 'SCONJ',
      'qui': 'PRON',
      'que': 'PRON',
      'où': 'PRON',
      'dont': 'PRON',
      'je': 'PRON',
      'tu': 'PRON',
      'il': 'PRON',
      'elle': 'PRON',
      'nous': 'PRON',
      'vous': 'PRON',
      'ils': 'PRON',
      'elles': 'PRON',
      'mon': 'PRON',
      'ton': 'PRON',
      'son': 'PRON',
      'ma': 'PRON',
      'ta': 'PRON',
      'sa': 'PRON',
      'mes': 'PRON',
      'tes': 'PRON',
      'ses': 'PRON',
      'notre': 'PRON',
      'votre': 'PRON',
      'leurs': 'PRON',
      'très': 'ADV',
      'bien': 'ADV',
      'mal': 'ADV',
      'plus': 'ADV',
      'moins': 'ADV',
      'peu': 'ADV',
      'beaucoup': 'ADV',
      'assez': 'ADV',
      'trop': 'ADV',
      'vite': 'ADV',
      'lentement': 'ADV',
      'ici': 'ADV',
      'là': 'ADV',
      'maintenant': 'ADV',
      'hier': 'ADV',
      'demain': 'ADV',
      'aujourd\'hui': 'ADV',
      'toujours': 'ADV',
      'jamais': 'ADV',
      'souvent': 'ADV',
      'parfois': 'ADV',
      'rarement': 'ADV',
      'quelquefois': 'ADV'
    };
    
    return posMap[word.toLowerCase()] || 'NOUN';
  }

  getMorphology(word) {
    const morphology = {
      'les': { Number: 'Plur', Gender: 'Masc' },
      'le': { Number: 'Sing', Gender: 'Masc' },
      'la': { Number: 'Sing', Gender: 'Fem' },
      'une': { Number: 'Sing', Gender: 'Fem' },
      'des': { Number: 'Plur', Gender: 'Masc' },
      'sont': { Number: 'Plur', Person: '3', Mood: 'Ind', Tense: 'Pres' },
      'sommes': { Number: 'Plur', Person: '1', Mood: 'Ind', Tense: 'Pres' },
      'est': { Number: 'Sing', Person: '3', Mood: 'Ind', Tense: 'Pres' },
      'suis': { Number: 'Sing', Person: '1', Mood: 'Ind', Tense: 'Pres' },
      'mange': { Number: 'Sing', Person: '3', Mood: 'Ind', Tense: 'Pres' },
      'mangent': { Number: 'Plur', Person: '3', Mood: 'Ind', Tense: 'Pres' },
      'mangeaient': { Number: 'Plur', Person: '3', Mood: 'Ind', Tense: 'Imp' },
      'mangé': { Number: 'Sing', Gender: 'Masc', Tense: 'Past' },
      'mangée': { Number: 'Sing', Gender: 'Fem', Tense: 'Past' },
      'mangés': { Number: 'Plur', Gender: 'Masc', Tense: 'Past' },
      'mangées': { Number: 'Plur', Gender: 'Fem', Tense: 'Past' },
      'vont': { Number: 'Plur', Person: '3', Mood: 'Ind', Tense: 'Pres' },
      'allons': { Number: 'Plur', Person: '1', Mood: 'Ind', Tense: 'Pres' },
      'vais': { Number: 'Sing', Person: '1', Mood: 'Ind', Tense: 'Pres' },
      'vas': { Number: 'Sing', Person: '2', Mood: 'Ind', Tense: 'Pres' },
      'va': { Number: 'Sing', Person: '3', Mood: 'Ind', Tense: 'Pres' },
      'font': { Number: 'Plur', Person: '3', Mood: 'Ind', Tense: 'Pres' },
      'faisons': { Number: 'Plur', Person: '1', Mood: 'Ind', Tense: 'Pres' },
      'fais': { Number: 'Sing', Person: '2', Mood: 'Ind', Tense: 'Pres' },
      'faisait': { Number: 'Sing', Person: '3', Mood: 'Ind', Tense: 'Imp' },
      'faisaient': { Number: 'Plur', Person: '3', Mood: 'Ind', Tense: 'Imp' },
      'disent': { Number: 'Plur', Person: '3', Mood: 'Ind', Tense: 'Pres' },
      'disons': { Number: 'Plur', Person: '1', Mood: 'Ind', Tense: 'Pres' },
      'dis': { Number: 'Sing', Person: '2', Mood: 'Ind', Tense: 'Pres' },
      'dit': { Number: 'Sing', Person: '3', Mood: 'Ind', Tense: 'Pres' },
      'disait': { Number: 'Sing', Person: '3', Mood: 'Ind', Tense: 'Imp' },
      'disaient': { Number: 'Plur', Person: '3', Mood: 'Ind', Tense: 'Imp' }
    };
    
    return morphology[word.toLowerCase()] || {};
  }

  getDependency(word, index) {
    const dependencies = {
      'les': 'det',
      'le': 'det',
      'la': 'det',
      'une': 'det',
      'des': 'det',
      'de': 'case',
      'à': 'case',
      'et': 'cc',
      'mais': 'cc',
      'ou': 'cc',
      'car': 'cc',
      'donc': 'cc',
      'ni': 'cc',
      'que': 'mark',
      'qui': 'nsubj',
      'que': 'obj',
      'où': 'advmod',
      'dont': 'nmod',
      'je': 'nsubj',
      'tu': 'nsubj',
      'il': 'nsubj',
      'elle': 'nsubj',
      'nous': 'nsubj',
      'vous': 'nsubj',
      'ils': 'nsubj',
      'elles': 'nsubj'
    };
    
    return dependencies[word.toLowerCase()] || 'root';
  }

  highlightErrors(element, errors) {
    // Effacer les surbrillances précédents
    this.clearHighlights(element);
    
    // Créer un conteneur pour les surbrillances
    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;
    
    // Ajouter les surbrillances avec couleur selon la sévérité
    errors.forEach((error, index) => {
      const highlight = document.createElement('span');
      const color = this.getSeverityColor(error.severity);
      highlight.style.cssText = `
        background-color: ${color.bg};
        border-bottom: 2px wavy ${color.border};
        pointer-events: auto;
        cursor: pointer;
        opacity: ${error.confidence || 0.8};
      `;
      highlight.dataset.errorIndex = index;
      highlight.title = `Confiance: ${Math.round((error.confidence || 0.5) * 100)}%`;
      
      // Ajouter un événement de clic pour afficher les détails
      highlight.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showErrorDetails(error, e.target);
      });
      
      container.appendChild(highlight);
    });
    
    element.parentNode.appendChild(container);
  }

  showSuggestions(element, errors) {
    // Effacer les nuages précédents
    this.clearClouds(element);
    
    // Trier les erreurs par sévérité
    const sortedErrors = errors.sort((a, b) => {
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return (severityOrder[b.severity] || 1) - (severityOrder[a.severity] || 1);
    });
    
    // Créer un nuage pour chaque erreur
    sortedErrors.forEach((error, index) => {
      setTimeout(() => {
        this.createCloud(element, error, index);
      }, index * 250); // Délai augmenté pour l'analyse lg
    });
  }

  createCloud(element, error, index) {
    const cloud = document.createElement('div');
    cloud.className = 'spacy-lg-cloud';
    
    const topPosition = -140 - (index * 120); // Espacement augmenté pour lg
    cloud.style.cssText = `
      position: absolute;
      top: ${topPosition}px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #1e40af, #312e81);
      color: white;
      padding: 14px 18px;
      border-radius: 22px;
      box-shadow: 0 10px 30px rgba(30, 64, 175, 0.4);
      z-index: 10000;
      min-width: 280px;
      max-width: 400px;
      font-size: 13px;
      animation: cloudFloatLG 0.6s ease-out;
      border: 2px solid rgba(255, 255, 255, 0.3);
      display: block !important;
      visibility: visible !important;
      cursor: move;
      user-select: none;
    `;

    // Ajouter l'animation CSS spécifique lg
    if (!document.querySelector('#spacy-lg-cloud-animations')) {
      const style = document.createElement('style');
      style.id = 'spacy-lg-cloud-animations';
      style.textContent = `
        @keyframes cloudFloatLG {
          0% { opacity: 0; transform: translateX(-50%) translateY(30px) scale(0.7); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        .spacy-lg-cloud { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .cloud-error-lg { font-weight: bold; color: #fbbf24; font-size: 15px; }
        .cloud-correction-lg { font-weight: bold; color: #86efac; font-size: 15px; }
        .cloud-explanation-lg { margin-top: 8px; opacity: 0.95; line-height: 1.5; }
        .cloud-confidence { margin-top: 6px; font-size: 11px; opacity: 0.8; color: #ddd; }
        .cloud-audio-lg { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.3); }
        .cloud-audio-btn-lg { background: rgba(255, 255, 255, 0.25); border: none; color: white; padding: 5px 10px; border-radius: 14px; font-size: 11px; cursor: pointer; transition: all 0.3s; }
        .cloud-audio-btn-lg:hover { background: rgba(255, 255, 255, 0.35); transform: scale(1.05); }
        .cloud-close-btn-lg { position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.25); border: none; color: white; width: 22px; height: 22px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; transition: all 0.3s; }
        .cloud-close-btn-lg:hover { background: rgba(255, 255, 255, 0.35); transform: scale(1.1); }
      `;
      document.head.appendChild(style);
    }

    const icon = this.getErrorIcon(error.type, error.severity);
    const cloudId = `spacy-lg-cloud-${Date.now()}-${index}`;
    const audioBtnId = `audio-${cloudId}`;
    const applyBtnId = `apply-${cloudId}`;
    const closeBtnId = `close-${cloudId}`;
    const confidence = Math.round((error.confidence || 0.5) * 100);
    
    cloud.innerHTML = `
      <button id="${closeBtnId}" class="cloud-close-btn-lg" title="Fermer">✕</button>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <span style="font-size: 18px;">${icon}</span>
        <span class="cloud-error-lg">"${error.word}"</span>
        <span>→</span>
        <span class="cloud-correction-lg">"${error.correction}"</span>
      </div>
      <div class="cloud-explanation-lg">${error.explanation}</div>
      <div class="cloud-confidence">🎯 Confiance: ${confidence}% | 🧠 spaCy lg</div>
      <div class="cloud-audio-lg">
        <button id="${audioBtnId}" class="cloud-audio-btn-lg">🔊 Écouter l'explication</button>
        <button id="${applyBtnId}" class="cloud-audio-btn-lg" style="margin-left: 10px;">✏️ Appliquer</button>
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
          this.applyCorrection(element, error);
        });
      }
      
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          cloud.style.animation = 'cloudFloatLG 0.4s ease-in reverse';
          setTimeout(() => cloud.remove(), 400);
        });
      }

      // 🎵 Lancement automatique de l'audio
      console.log('🎵 Lancement automatique de l\'audio spaCy lg pour:', error.explanation);
      this.speakCorrection(error.explanation);
      
      // 🖱️ Rendre le nuage déplaçable
      this.makeCloudDraggable(cloud);
      
    }, 100);
  }

  makeCloudDraggable(cloud) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    const startDrag = (e) => {
      if (e.target.closest('.cloud-audio-btn-lg, .cloud-close-btn-lg')) {
        return;
      }
      
      isDragging = true;
      startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
      startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
      
      const rect = cloud.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      cloud.style.zIndex = 10001;
      cloud.style.transition = 'none';
      cloud.style.cursor = 'grabbing';
      cloud.style.transform = 'scale(1.05)';
    };

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
      cloud.style.transform = 'scale(1.05)';
    };

    const endDrag = () => {
      if (!isDragging) return;
      
      isDragging = false;
      cloud.style.cursor = 'move';
      cloud.style.transform = 'scale(1)';
      cloud.style.transition = 'all 0.3s ease';
    };

    // Événements de souris
    cloud.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    
    // Événements tactiles
    cloud.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', endDrag);
    
    // Empêcher la fermeture automatique au clic
    cloud.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  speakCorrection(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.85; // Légèrement plus lent pour spaCy lg
      utterance.pitch = 1;
      utterance.volume = 0.85;
      
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  }

  applyCorrection(element, error) {
    const start = error.offset;
    const end = start + error.length;
    const currentValue = element.value;
    
    const newValue = currentValue.substring(0, start) + error.correction + currentValue.substring(end);
    element.value = newValue;
    
    // Déclencher un événement de changement
    element.dispatchEvent(new Event('input'));
    
    console.log(`✏️ Correction spaCy lg appliquée: "${error.word}" → "${error.correction}" (confiance: ${Math.round((error.confidence || 0.5) * 100)}%)`);
  }

  getErrorIcon(type, severity) {
    const icons = {
      'orthographe': '❌',
      'grammaire': '⚠️',
      'vocabulaire': '💡',
      'conjugaison': '🔄',
      'accord_sujet_verbe': '🤝',
      'accord_participe_passe': '🔗',
      'pleonasme': '🔄',
      'genre': '♂️♀️',
      'orthographe_contextuelle': '📝',
      'conjugaison_complexe': '🎯',
      'subjonctif': '🌟',
      'conditionnel': '🔮',
      'preposition': '📍',
      'determinant': '🔤',
      'pronom': '👤',
      'adjectif': '🎨',
      'adverbe': '⚡',
      'temps_compose': '⏰',
      'mode_verbal': '🎭',
      'inversion': '🔄',
      'construction_impersonnelle': '🏗️',
      'repetition': '🔁',
      'temps_verbaux': '🕐',
      'accord_genre': '⚥',
      'accord_nombre': '🔢',
      'position_adverbe': '📍'
    };
    
    const baseIcon = icons[type] || '❌';
    
    // Ajouter un indicateur de sévérité
    if (severity === 'high') return '🔴' + baseIcon;
    if (severity === 'medium') return '🟡' + baseIcon;
    return '🟢' + baseIcon;
  }

  getSeverityColor(severity) {
    const colors = {
      'high': { bg: 'rgba(239, 68, 68, 0.3)', border: '#ef4444' },
      'medium': { bg: 'rgba(245, 158, 11, 0.3)', border: '#f59e0b' },
      'low': { bg: 'rgba(34, 197, 94, 0.3)', border: '#22c55e' }
    };
    return colors[severity] || colors['medium'];
  }

  clearClouds(element) {
    const clouds = element.parentNode.querySelectorAll('.spacy-lg-cloud');
    clouds.forEach(cloud => cloud.remove());
  }

  clearHighlights(element) {
    const highlights = element.parentNode.querySelectorAll('[data-error-index]');
    highlights.forEach(highlight => highlight.remove());
  }

  showSuccess(element) {
    console.log('✅ Aucune erreur détectée par spaCy lg');
  }

  showErrorDetails(error, highlightElement) {
    console.log('🔍 Détails de l\'erreur spaCy lg:', error);
    
    // Créer une infobulle avec plus de détails
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: absolute;
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 10002;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    tooltip.innerHTML = `
      <div><strong>Type:</strong> ${error.type}</div>
      <div><strong>Sévérité:</strong> ${error.severity}</div>
      <div><strong>Confiance:</strong> ${Math.round((error.confidence || 0.5) * 100)}%</div>
      <div><strong>Règle:</strong> ${error.rule || 'N/A'}</div>
      <div><strong>Explication:</strong> ${error.explanation}</div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Positionner l'infobulle
    const rect = highlightElement.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 5) + 'px';
    
    // Supprimer l'infobulle après 3 secondes
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 3000);
  }
}

// Initialisation de l'assistant spaCy lg
window.addEventListener('DOMContentLoaded', () => {
  window.writingAssistant = new WritingAssistantSpacyLG();
  console.log('🧠 Assistant d\'écriture spaCy lg (Large) initialisé');
});

// Export pour compatibilité
window.WritingAssistantSpacyLG = WritingAssistantSpacyLG;
