// Assistant d'écriture avec spaCy lg (Large) - Version RADICALEMENT CORRIGÉE
class WritingAssistantSpacyLGFixed {
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
    if (element.dataset.spacyLGAssistantFixed) return;
    element.dataset.spacyLGAssistantFixed = 'true';

    let timeout;
    element.addEventListener('input', async (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await this.checkText(element);
      }, 800); // Délai augmenté pour éviter les conflits
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
        console.log(`🧠 spaCy lg (Large) a trouvé ${errors.length} erreur(s) avec confiance moyenne ${errors.reduce((sum, e) => sum + (e.confidence || 0.5), 0) / errors.length}`);
        this.showHighlights(element, errors);
        this.showSuggestions(element, errors);
      } else {
        this.clearHighlights(element);
        this.clearClouds(element);
        this.showSuccess(element);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse spaCy lg:', error);
    }
  }

  applyCustomRules(text) {
    if (!this.customRules) return [];
    
    try {
      // Simuler un document spaCy pour les règles personnalisées
      const mockDoc = this.createMockSpacyDoc(text);
      return this.customRules.applyRules(mockDoc);
    } catch (error) {
      console.error('❌ Erreur dans les règles personnalisées:', error);
      return [];
    }
  }

  createMockSpacyDoc(text) {
    // Créer une simulation de document spaCy pour les règles
    const tokens = text.split(/\s+/).map((word, index) => ({
      text: word,
      lemma: word.toLowerCase(),
      pos: this.guessPOS(word),
      idx: text.indexOf(word, index > 0 ? text.slice(0, text.indexOf(word)).split(/\s+/).join(' ').length + 1 : 0),
      i: index,
      morph: this.guessMorphology(word),
      dep: this.guessDependency(word, index),
      head: null
    }));
    
    return tokens;
  }

  guessPOS(word) {
    // Deviner la partie du discours de manière simple
    if (word.match(/^(le|la|les|un|une|des|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|nos|votre|vos)$/i)) return 'DET';
    if (word.match(/^(je|tu|il|elle|nous|vous|ils|elles|me|te|le|la|lui|nous|vous|leur|y|en)$/i)) return 'PRON';
    if (word.match(/^(être|avoir|aller|faire|dire|prendre|voir|savoir|pouvoir|vouloir|devoir|falloir|valoir|venir|partir|sortir|entrer|arriver|rester|tomber|mourir|naître|devenir|rendre|mettre|tenir|comprendre|apprendre|enseigner|trouver|chercher|donner|recevoir|acheter|vendre|payer|coûter|peser|mesurer|compter|ajouter|enlever|retirer|oublier|se souvenir|connaître|croire|penser|parler|répondre|demander|questionner|écouter|entendre|voir|regarder|sentir|goûter|toucher|sembler|paraître|devenir|rester|demeurer|partir|arriver|sortir|entrer|rentrer|monter|descendre|passer|traverser|franchir|atteindre|gagner|perdre|battre|vaincre|triompher|réussir|échouer|manquer|rat|)$/i)) return 'VERB';
    if (word.match(/^(et|ou|mais|où|donc|or|ni|car|si|lorsque|quand|comme|que|qui|quoi|où|quand|comment|pourquoi|quel|quelle|quels|quelles)$/i)) return 'CCONJ';
    if (word.match(/^(de|du|des|au|aux|à|par|pour|sur|sous|avec|sans|contre|entre|parmi|pendant|depuis|vers|jusque|selon|malgré|pendant|devant|derrière|dessous|dessus|après|avant|pendant)$/i)) return 'ADP';
    if (word.match(/^(très|plus|moins|bien|mal|trop|assez|peu|beaucoup|fort|faible|grand|petit|long|court|haut|bas|vite|lentement|doucement|fortement|facilement|difficilement|simplement|normalement|habituellement|généralement|souvent|rarement|jamais|toujours|parfois|quelquefois|encore|déjà|bientôt|tard|tôt|hier|aujourd\'hui|demain|maintenant|alors|ensuite|puis|après|avant|pendant|pendant que|lorsque|quand|comme|si|bien que|quoique|malgré|selon|vers|chez|par|pour|sur|sous|avec|sans|contre|entre|parmi|pendant|depuis|jusque|selon)$/i)) return 'ADV';
    return 'NOUN';
  }

  guessMorphology(word) {
    // Deviner la morphologie de manière simple
    const morph = {};
    
    // Genre
    if (word.match(/e$/)) morph.Gender = 'Fem';
    else if (word.match(/^[lmnrtbdcg]/)) morph.Gender = 'Masc';
    
    // Nombre
    if (word.match(/s$/)) morph.Number = 'Plur';
    else morph.Number = 'Sing';
    
    // Temps pour les verbes
    if (word.match(/(é|er|ez)$/)) morph.Tense = 'Past';
    else if (word.match(/(ons|ez|ent)$/)) morph.Tense = 'Pres';
    else if (word.match(/(ais|ait|aient)$/)) morph.Tense = 'Imp';
    
    // Mode
    if (word.match(/(ons|ez|ent)$/)) morph.Mood = 'Ind';
    else if (word.match(/e$/)) morph.Mood = 'Subj';
    
    return morph;
  }

  guessDependency(word, index) {
    // Deviner la dépendance de manière simple
    if (this.guessPOS(word) === 'DET') return 'det';
    if (this.guessPOS(word) === 'ADP') return 'case';
    if (this.guessPOS(word) === 'CCONJ') return 'cc';
    return 'obj';
  }

  showHighlights(element, errors) {
    // Effacer les surbrillances précédentes
    this.clearHighlights(element);
    
    // Créer un conteneur pour les surbrillances
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
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
    // Éviter les doublons : vérifier si des nuages existent déjà pour cet élément
    const existingClouds = document.querySelectorAll('.spacy-lg-cloud-fixed');
    const hasCloudsForThisElement = Array.from(existingClouds).some(cloud => 
      cloud.dataset.elementId === element.id
    );
    
    if (hasCloudsForThisElement) {
      console.log('📋 Nuages déjà présents pour cet élément, pas de nouvelle création');
      return;
    }
    
    // Trier les erreurs par sévérité
    const sortedErrors = errors.sort((a, b) => {
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return (severityOrder[b.severity] || 1) - (severityOrder[a.severity] || 1);
    });
    
    // Créer un nuage pour chaque erreur
    sortedErrors.forEach((error, index) => {
      setTimeout(() => {
        this.createCloud(element, error, index);
      }, index * 300); // Délai augmenté pour éviter les conflits
    });
  }

  createCloud(element, error, index) {
    const cloud = document.createElement('div');
    cloud.className = 'spacy-lg-cloud-fixed';
    cloud.dataset.elementId = element.id; // Associer le nuage à l'élément
    
    const topPosition = -140 - (index * 120); // Espacement augmenté pour lg
    cloud.style.cssText = `
      position: fixed;
      top: ${topPosition}px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #1e40af, #312e81);
      color: white;
      padding: 14px 18px;
      border-radius: 22px;
      box-shadow: 0 10px 30px rgba(30, 64, 175, 0.4);
      z-index: 99999;
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
    if (!document.querySelector('#spacy-lg-cloud-animations-fixed')) {
      const style = document.createElement('style');
      style.id = 'spacy-lg-cloud-animations-fixed';
      style.textContent = `
        @keyframes cloudFloatLG {
          0% { opacity: 0; transform: translateX(-50%) translateY(30px) scale(0.7); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        .spacy-lg-cloud-fixed { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
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
    const cloudId = `spacy-lg-cloud-fixed-${Date.now()}-${index}`;
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

    document.body.appendChild(cloud);

    // Positionnement par rapport à l'élément
    const rect = element.getBoundingClientRect();
    cloud.style.top = (rect.top - 140 - (index * 120)) + 'px';
    cloud.style.left = (rect.left + rect.width / 2) + 'px';

    // Ajouter les événements
    setTimeout(() => {
      const audioBtn = document.getElementById(audioBtnId);
      const applyBtn = document.getElementById(applyBtnId);
      const closeBtn = document.getElementById(closeBtnId);
      
      console.log('🔍 Recherche des boutons:', { audioBtnId, applyBtnId, closeBtnId });
      console.log('🔍 Boutons trouvés:', { audioBtn, applyBtn, closeBtn });
      
      if (audioBtn) {
        audioBtn.addEventListener('click', (e) => {
          console.log('🔊 Bouton audio cliqué - Lecture de l\'explication');
          e.stopPropagation();
          this.speakCorrection(error.explanation);
        });
        console.log('✅ Bouton audio configuré');
      } else {
        console.warn('⚠️ Bouton audio non trouvé');
      }
      
      if (applyBtn) {
        applyBtn.addEventListener('click', (e) => {
          console.log('✏️ Bouton appliquer cliqué - Application de la correction');
          e.stopPropagation();
          this.applyCorrection(element, error);
        });
        console.log('✅ Bouton appliquer configuré');
      } else {
        console.warn('⚠️ Bouton appliquer non trouvé');
      }
      
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          console.log('❌ Bouton fermer cliqué - Fermeture du nuage');
          e.stopPropagation();
          cloud.style.animation = 'cloudFloatLG 0.4s ease-in reverse';
          setTimeout(() => cloud.remove(), 400);
        });
        console.log('✅ Bouton fermer configuré');
      } else {
        console.warn('⚠️ Bouton fermer non trouvé');
      }

      // 🎵 Lancement automatique de l'audio
      console.log('🎵 Lancement automatique de l\'audio spaCy lg pour:', error.explanation);
      this.speakCorrection(error.explanation);
      
      // 🖱️ Rendre le nuage déplaçable avec SYSTÈME RADICALEMENT DIFFÉRENT
      this.makeCloudDraggableFixed(cloud);
      
    }, 200); // Augmenté pour laisser le temps au DOM de se construire
  }

  makeCloudDraggableFixed(cloud) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    const startDrag = (e) => {
      // Ne pas démarrer le drag si on clique sur les boutons
      if (e.target.closest('.cloud-audio-btn-lg, .cloud-close-btn-lg')) {
        console.log('🖱️ Clic sur bouton - PAS de drag');
        return;
      }
      
      // BLOQUER TOUT SAUF LE DRAG
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = cloud.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      cloud.style.zIndex = 100000;
      cloud.style.transition = 'none';
      cloud.style.cursor = 'grabbing';
      cloud.style.transform = 'scale(1.05)';
      
      console.log('🖱️ DRAG COMMENCÉ - Position initiale:', { x: initialX, y: initialY });
    };

    const drag = (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      cloud.style.left = newX + 'px';
      cloud.style.top = newY + 'px';
      cloud.style.transform = 'scale(1.05)';
      
      console.log('🖱️ DRAG EN COURS - Position:', { x: newX, y: newY });
    };

    const endDrag = () => {
      if (!isDragging) return;
      
      isDragging = false;
      cloud.style.cursor = 'move';
      cloud.style.transform = 'scale(1)';
      cloud.style.transition = 'all 0.3s ease';
      
      console.log('🖱️ DRAG TERMINÉ');
    };

    // SYSTÈME DE DRAG TOTALEMENT ISOLÉ - MAIS AVEC EXCEPTIONS POUR LES BOUTONS
    cloud.addEventListener('mousedown', startDrag, { capture: true, passive: false });
    document.addEventListener('mousemove', drag, { capture: true, passive: false });
    document.addEventListener('mouseup', endDrag, { capture: true, passive: false });
    
    // BLOQUER SEULEMENT LES CLICS SUR LE CONTENU DU NUAGE (PAS SUR LES BOUTONS)
    cloud.addEventListener('click', (e) => {
      // Ne pas bloquer si on clique sur les boutons
      if (e.target.closest('.cloud-audio-btn-lg, .cloud-close-btn-lg')) {
        console.log('🖱️ Clic autorisé sur bouton');
        return; // Laisser l'événement se propager aux boutons
      }
      
      // Bloquer seulement les clics sur le contenu du nuage
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('🖱️ Clic bloqué sur contenu du nuage');
    }, { capture: true, passive: false });
    
    // Ajouter des logs pour les boutons
    const audioBtn = cloud.querySelector('.cloud-audio-btn-lg');
    const applyBtn = cloud.querySelector('.cloud-audio-btn-lg:not([id*="audio"])');
    const closeBtn = cloud.querySelector('.cloud-close-btn-lg');
    
    if (audioBtn) {
      audioBtn.addEventListener('click', (e) => {
        console.log('🔊 Bouton audio cliqué');
      });
    }
    
    if (applyBtn) {
      applyBtn.addEventListener('click', (e) => {
        console.log('✏️ Bouton appliquer cliqué');
      });
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        console.log('❌ Bouton fermer cliqué');
      });
    }
    
    console.log('🖱️ SYSTÈME DE DRAG FIXE INSTALLÉ avec boutons fonctionnels');
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
    
    // Modifier l'icône selon la sévérité
    if (severity === 'high') return '🔴 ' + baseIcon;
    if (severity === 'medium') return '🟡 ' + baseIcon;
    return '🟢 ' + baseIcon;
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
    // Supprimer uniquement les nuages associés à cet élément
    const clouds = document.querySelectorAll('.spacy-lg-cloud-fixed');
    clouds.forEach(cloud => {
      if (cloud.dataset.elementId === element.id || !cloud.dataset.elementId) {
        cloud.remove();
      }
    });
    this.clouds = [];
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
      border-radius: 6px;
      font-size: 12px;
      z-index: 100001;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    tooltip.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${error.type}</div>
      <div style="margin-bottom: 4px;">Règle: ${error.rule || 'Non spécifiée'}</div>
      <div style="opacity: 0.8;">${error.explanation}</div>
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = highlightElement.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 5) + 'px';
    
    setTimeout(() => tooltip.remove(), 3000);
  }
}

// Initialisation
window.addEventListener('DOMContentLoaded', () => {
  window.writingAssistantFixed = new WritingAssistantSpacyLGFixed();
  console.log('🧠 Assistant d\'écriture spaCy lg (Large) FIXE initialisé');
});

window.WritingAssistantSpacyLGFixed = WritingAssistantSpacyLGFixed;
