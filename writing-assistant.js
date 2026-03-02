// Assistant d'écriture simplifié et propre
class WritingAssistant {
  constructor() {
    this.clouds = [];
    this.init();
  }

  init() {
    console.log('🚀 Initialisation de l\'assistant d\'écriture...');
    this.setupEventListeners();
    console.log('✅ Assistant d\'écriture chargé');
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
    if (element.dataset.writingAssistant) return;
    element.dataset.writingAssistant = 'true';

    let timeout;
    element.addEventListener('input', async (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await this.checkText(element);
      }, 500);
    });
  }

  async checkText(element) {
    const text = element.value.trim();
    
    if (text.length < 3) {
      this.clearClouds(element);
      return;
    }

    try {
      console.log('📝 Analyse du texte:', text);
      
      // Analyse simple avec règles de base
      const errors = this.analyzeText(text);
      
      if (errors.length > 0) {
        this.showSuggestions(element, errors);
      } else {
        this.showSuccess(element);
      }
      
    } catch (error) {
      console.error('❌ Erreur analyse:', error);
    }
  }

  analyzeText(text) {
    const errors = [];
    
    // Règles orthographiques de base
    const spellingRules = [
      { pattern: /\bc'et\b/gi, replacement: "c'est", message: "Attention : \"c'et\" devrait être \"c'est\"." },
      { pattern: /\bpere\b/gi, replacement: "père", message: "Erreur orthographique : \"pere\" devrait être \"père\"." },
      { pattern: /\bmere\b/gi, replacement: "mère", message: "Erreur orthographique : \"mere\" devrait être \"mère\"." },
      { pattern: /\bfrere\b/gi, replacement: "frère", message: "Erreur orthographique : \"frere\" devrait être \"frère\"." },
      { pattern: /\bsoeur\b/gi, replacement: "sœur", message: "Erreur orthographique : \"soeur\" devrait être \"sœur\"." }
    ];

    // Règles grammaticales de base
    const grammarRules = [
      { pattern: /\bqui aller\b/gi, replacement: "qui va", message: "Erreur de conjugaison : \"qui aller\" devrait être \"qui va\"." },
      { pattern: /\bje aller\b/gi, replacement: "je vais", message: "Erreur de conjugaison : \"je aller\" devrait être \"je vais\"." },
      { pattern: /\bil aller\b/gi, replacement: "il va", message: "Erreur de conjugaison : \"il aller\" devrait être \"il va\"." },
      { pattern: /\belle aller\b/gi, replacement: "elle va", message: "Erreur de conjugaison : \"elle aller\" devrait être \"elle va\"." },
      { pattern: /\bnous aller\b/gi, replacement: "nous allons", message: "Erreur de conjugaison : \"nous aller\" devrait être \"nous allons\"." },
      { pattern: /\bvous aller\b/gi, replacement: "vous allez", message: "Erreur de conjugaison : \"vous aller\" devrait être \"vous allez\"." },
      { pattern: /\bils aller\b/gi, replacement: "ils vont", message: "Erreur de conjugaison : \"ils aller\" devrait être \"ils vont\"." },
      { pattern: /\belles aller\b/gi, replacement: "elles vont", message: "Erreur de conjugaison : \"elles aller\" devrait être \"elles vont\"." }
    ];

    // Appliquer les règles orthographiques
    spellingRules.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        errors.push({
          type: 'orthographe',
          word: match[0],
          correction: rule.replacement,
          explanation: rule.message,
          offset: match.index,
          length: match[0].length
        });
      }
    });

    // Appliquer les règles grammaticales
    grammarRules.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        errors.push({
          type: 'grammaire',
          word: match[0],
          correction: rule.replacement,
          explanation: rule.message,
          offset: match.index,
          length: match[0].length
        });
      }
    });

    console.log(`📊 ${errors.length} erreurs trouvées`);
    return errors;
  }

  showSuggestions(element, errors) {
    // Effacer les nuages précédents
    this.clearClouds(element);
    
    // Créer un nuage pour chaque erreur
    errors.forEach((error, index) => {
      setTimeout(() => {
        this.createCloud(element, error, index);
      }, index * 200);
    });
  }

  createCloud(element, error, index) {
    const cloud = document.createElement('div');
    cloud.className = 'writing-cloud';
    
    const topPosition = -80 - (index * 100);
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
      cursor: move;
      user-select: none;
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
        <button id="${audioBtnId}" class="cloud-audio-btn">🔊 Écouter</button>
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
          this.applyCorrection(element, error);
        });
      }
      
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          cloud.style.animation = 'cloudFloat 0.3s ease-in reverse';
          setTimeout(() => cloud.remove(), 300);
        });
      }

      // Lancement automatique de l'audio
      console.log('🎵 Lancement automatique de l\'audio pour:', error.explanation);
      this.speakCorrection(error.explanation);
      
      // Rendre le nuage déplaçable
      this.makeCloudDraggable(cloud);
      
    }, 100);
  }

  makeCloudDraggable(cloud) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    const startDrag = (e) => {
      if (e.target.closest('.cloud-audio-btn, .cloud-close-btn')) {
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
      cloud.style.transform = 'none';
    };

    const endDrag = () => {
      if (!isDragging) return;
      
      isDragging = false;
      cloud.style.zIndex = 10000;
      cloud.style.transition = '';
      cloud.style.cursor = 'move';
    };

    // Événements souris et tactiles
    cloud.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    cloud.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', endDrag);
  }

  speakCorrection(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
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
    
    console.log(`✏️ Correction appliquée: "${error.word}" → "${error.correction}"`);
  }

  getErrorIcon(type) {
    const icons = {
      'orthographe': '❌',
      'grammaire': '⚠️',
      'vocabulaire': '💡',
      'style': '🎨',
      'ponctuation': '📝'
    };
    return icons[type] || '❌';
  }

  clearClouds(element) {
    const clouds = element.parentNode.querySelectorAll('.writing-cloud');
    clouds.forEach(cloud => cloud.remove());
  }

  showSuccess(element) {
    console.log('✅ Aucune erreur détectée');
  }
}

// Initialisation de l'assistant
window.addEventListener('DOMContentLoaded', () => {
  window.writingAssistant = new WritingAssistant();
  console.log('✅ Assistant d\'écriture initialisé');
});

// Export pour compatibilité
window.WritingAssistant = WritingAssistant;
