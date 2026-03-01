// Fonctions utilitaires

// Fonction d'échappement HTML pour prévenir les attaques XSS
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return '';
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Fonction pour charger les modules
function loadModules() {
  // Cette fonction peut être utilisée pour charger dynamiquement des modules si nécessaire
  console.log('Modules chargés');
}

// Fonction pour formater les dates
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Fonction pour générer des IDs uniques
function generateUniqueId() {
  return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

// Fonction pour vérifier si un élément est dans le viewport
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Fonction pour faire défiler vers un élément
function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

// Fonction pour charger des données depuis localStorage avec gestion d'erreurs
function loadFromLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Erreur de chargement depuis localStorage:', e);
    return defaultValue;
  }
}

// Fonction pour sauvegarder des données dans localStorage avec gestion d'erreurs
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Erreur de sauvegarde dans localStorage:', e);
  }
}

// Fonction pour supprimer des données de localStorage
function removeFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Erreur de suppression de localStorage:', e);
  }
}

// Fonction pour nettoyer le localStorage
function clearLocalStorage(pattern = null) {
  try {
    if (pattern) {
      // Supprimer les clés qui correspondent à un motif
      Object.keys(localStorage).forEach(key => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } else {
      // Tout supprimer
      localStorage.clear();
    }
  } catch (e) {
    console.error('Erreur de nettoyage du localStorage:', e);
  }
}

// Fonction pour copier du texte dans le presse-papiers
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Texte copié dans le presse-papiers');
    }).catch(err => {
      console.error('Erreur lors de la copie:', err);
    });
  } else {
    // Fallback pour les navigateurs plus anciens
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      console.log('Texte copié dans le presse-papiers');
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
    document.body.removeChild(textArea);
  }
}

// Fonction pour charger un script dynamiquement
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Fonction pour charger un CSS dynamiquement
function loadCSS(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

// Fonction pour mettre à jour le statut de l'IA
function setIaStatus(statusText, bgColorClass, progressPercent) {
  const statusElement = document.getElementById('ia-status');
  const progressBar = document.getElementById('ia-progress');
  
  if (statusElement) {
    statusElement.textContent = statusText;
  }
  
  if (progressBar) {
    progressBar.style.width = progressPercent + '%';
    progressBar.className = 'h-1 rounded-full ' + bgColorClass;
  }
}

// Exporter les fonctions utiles globalement si nécessaire
window.escapeHtml = escapeHtml;
window.formatDate = formatDate;
window.generateUniqueId = generateUniqueId;
window.isElementInViewport = isElementInViewport;
window.scrollToElement = scrollToElement;
window.loadFromLocalStorage = loadFromLocalStorage;
window.saveToLocalStorage = saveToLocalStorage;
window.removeFromLocalStorage = removeFromLocalStorage;
window.clearLocalStorage = clearLocalStorage;
window.copyToClipboard = copyToClipboard;
window.loadScript = loadScript;
window.loadCSS = loadCSS;
window.setIaStatus = setIaStatus;