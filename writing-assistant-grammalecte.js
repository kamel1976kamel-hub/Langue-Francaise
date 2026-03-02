// Assistant d'écriture avec Grammalecte intégré
class WritingAssistant {
  constructor() {
    this.typingTimer = null;
    this.languageToolEnabled = true;
    this.grammalecteEnabled = true;
    this.audioEnabled = true;
    
    // Initialiser Grammalecte si disponible
    if (typeof grammalecte !== 'undefined') {
      console.log('🇫🇷 Grammalecte détecté, initialisation...');
      this.initGrammalecte();
    } else {
      console.warn('⚠️ Grammalecte non disponible, utilisation du fallback');
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

      // Utiliser Grammalecte en priorité si disponible
      let errors = [];
      if (this.grammalecteEnabled && text.trim().length >= 3) {
        try {
          errors = await this.checkWithGrammalecte(text);
          console.log('🇫🇷 Grammalecte utilisé avec succès');
        } catch (error) {
          console.warn('⚠️ Grammalecte indisponible, utilisation du fallback:', error.message);
          errors = this.highlightErrors(text);
        }
      } else if (this.languageToolEnabled && text.trim().length >= 10) {
        try {
          errors = await this.checkWithLanguageTool(text);
          console.log('✅ LanguageTool utilisé avec succès');
        } catch (error) {
          console.warn('⚠️ LanguageTool indisponible, utilisation du fallback:', error.message);
          errors = this.highlightErrors(text);
        }
      } else {
        console.log('📝 Texte trop court, utilisation du fallback seulement');
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
      
      // Analyser le texte avec Grammalecte
      const result = await this.grammalecte.parseText(text);
      
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

  // Méthode LanguageTool (fallback)
  async checkWithLanguageTool(text) {
    try {
      if (text.trim().length < 10) {
        throw new Error('Texte trop court pour LanguageTool (minimum 10 caractères)');
      }

      const formData = new FormData();
      formData.append('text', text);
      formData.append('language', 'fr');

      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`LanguageTool API error: ${response.status}`);
      }

      const data = await response.json();
      
      const errors = [];
      data.matches.forEach(match => {
        const correction = match.replacements.length > 0 ? match.replacements[0].value : match.replacements.map(r => r.value).join(' / ');
        errors.push({
          type: this.getLanguageToolErrorType(match.rule.category),
          word: text.substring(match.offset, match.offset + match.length),
          correction: correction,
          explanation: match.message,
          offset: match.offset,
          length: match.length
        });
      });

      return errors;
    } catch (error) {
      console.error('❌ Erreur LanguageTool:', error);
      throw error;
    }
  }

  getLanguageToolErrorType(category) {
    const categoryMap = {
      'GRAMMAR': 'grammaire',
      'SPELLING': 'orthographe',
      'TYPOGRAPHY': 'ponctuation',
      'STYLE': 'vocabulaire',
      'CONFUSION': 'vocabulaire'
    };
    return categoryMap[category] || 'divers';
  }

  // Fallback avec dictionnaire
  highlightErrors(text) {
    const errors = [];

    // Dictionnaire de corrections simplifié
    const corrections = {
      'c\'et': 'c\'est',
      'pere': 'père',
      'aller': 'va',
      'et': 'est'
    };

    for (const [erreur, correction] of Object.entries(corrections)) {
      const regex = new RegExp(`\\b${erreur}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        errors.push({
          type: 'orthographe',
          word: erreur,
          correction: correction,
          explanation: `Attention : "${erreur}" devrait être "${correction}".`
        });
      }
    }

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
    
    const topPosition = -60 - (index * 80);
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
    }, 100);
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
