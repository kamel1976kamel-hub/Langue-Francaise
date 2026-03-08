// Fonction pour créer un nuage de correction pour les activités
window.createActivityCorrectionCloud = function(response, originalAnswer, chapterId, activityId) {
  // Supprimer les nuages existants
  const existingClouds = document.querySelectorAll('.activity-correction-cloud');
  existingClouds.forEach(cloud => cloud.remove());
  
  // Créer le nuage de correction
  const cloud = document.createElement('div');
  cloud.className = 'activity-correction-cloud fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-sm';
  cloud.style.cssText = `
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 300px;
    max-width: 400px;
  `;
  
  // Construire le contenu du nuage
  let cloudContent = '';
  
  // Erreurs détectées
  if (response.corrections && response.corrections.length > 0) {
    cloudContent += `
      <div class="mb-3">
        <h4 class="text-sm font-semibold text-red-600 mb-2">🔍 Erreurs détectées :</h4>
        <div class="space-y-1">
    `;
    response.corrections.forEach((correction, index) => {
      cloudContent += `
        <div class="flex items-center justify-between bg-red-50 p-2 rounded">
          <span class="text-sm text-gray-700">
            "<span class="line-through text-red-500">${correction.text}</span>" → 
            "<span class="text-green-600 font-medium">${correction.correction}</span>"
          </span>
          <button 
            onclick="applyActivityCorrection('${correction.text}', '${correction.correction}', '${chapterId}', '${activityId}')"
            class="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            title="Appliquer cette correction"
          >
            Appliquer
          </button>
        </div>
      `;
    });
    cloudContent += `</div></div>`;
  }
  
  // Explications linguistiques
  if (response.explanations && response.explanations.length > 0) {
    cloudContent += `
      <div class="mb-3">
        <h4 class="text-sm font-semibold text-blue-600 mb-2">💡 Explications :</h4>
        <div class="space-y-1">
    `;
    response.explanations.forEach(exp => {
      cloudContent += `
        <div class="text-sm text-gray-600 bg-blue-50 p-2 rounded">
          ${exp}
        </div>
      `;
    });
    cloudContent += `</div></div>`;
  }
  
  // Suggestions de correction
  if (response.suggestions && response.suggestions.length > 0) {
    cloudContent += `
      <div class="mb-3">
        <h4 class="text-sm font-semibold text-green-600 mb-2">🎯 Suggestions :</h4>
        <div class="space-y-1">
    `;
    response.suggestions.forEach((suggestion, index) => {
      cloudContent += `
        <div class="flex items-center justify-between bg-green-50 p-2 rounded">
          <span class="text-sm text-gray-700">${suggestion}</span>
          <button 
            onclick="applyActivitySuggestion('${suggestion}', '${chapterId}', '${activityId}')"
            class="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            title="Appliquer cette suggestion"
          >
            Appliquer
          </button>
        </div>
      `;
    });
    cloudContent += `</div></div>`;
  }
  
  // Ajouter les boutons de contrôle
  cloudContent += `
    <div class="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
      <button 
        onclick="speakActivityCorrection(this)"
        class="p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 transition-colors"
        title="Écouter les corrections"
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      </button>
      <button 
        onclick="closeActivityCorrectionCloud(this)"
        class="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
        title="Fermer"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `;
  
  cloud.innerHTML = cloudContent;
  document.body.appendChild(cloud);
  
  // Rendre le nuage déplaçable
  makeActivityDraggable(cloud);
  
  console.log('✅ Nuage de correction d\'activité créé');
};

// ============ FONCTIONS DU NUAGE D'ACTIVITÉ ============
window.makeActivityDraggable = function(element) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const dragStart = (e) => {
    if (e.target.closest('button')) return;
    
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.target === element || e.target.closest('.activity-correction-cloud')) {
      isDragging = true;
    }
  };

  const dragEnd = (e) => {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  };

  const drag = (e) => {
    if (isDragging) {
      e.preventDefault();
      
      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      element.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  };

  element.addEventListener('touchstart', dragStart, false);
  element.addEventListener('touchend', dragEnd, false);
  element.addEventListener('touchmove', drag, false);
  element.addEventListener('mousedown', dragStart, false);
  element.addEventListener('mouseup', dragEnd, false);
  element.addEventListener('mousemove', drag, false);
};

window.closeActivityCorrectionCloud = function(button) {
  const cloud = button.closest('.activity-correction-cloud');
  if (cloud) {
    cloud.remove();
    console.log('🗑️ Nuage de correction d\'activité fermé');
  }
};

window.applyActivityCorrection = function(originalText, correctedText, chapterId, activityId) {
  const answerElement = window.getActivityAnswerElement(chapterId, activityId);
  if (answerElement) {
    const currentAnswer = answerElement.value || answerElement.textContent;
    answerElement.value = currentAnswer.replace(originalText, correctedText);
    answerElement.focus();
    console.log('✅ Correction d\'activité appliquée:', originalText, '→', correctedText);
  }
};

window.applyActivitySuggestion = function(suggestion, chapterId, activityId) {
  const answerElement = window.getActivityAnswerElement(chapterId, activityId);
  if (answerElement) {
    answerElement.value = suggestion;
    answerElement.focus();
    console.log('✅ Suggestion d\'activité appliquée:', suggestion);
  }
};

window.speakActivityCorrection = function(button) {
  const cloud = button.closest('.activity-correction-cloud');
  if (cloud) {
    const textContent = cloud.textContent.replace(/Appliquer|Fermer|Écouter les corrections/g, '').trim();
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(textContent);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
      console.log('🔊 Lecture des corrections d\'activité en cours');
    } else {
      console.log('❌ Synthèse vocale non supportée');
    }
  }
};

// Fonction pour analyser en temps réel le texte saisi
window.setupRealTimeCorrection = function(chapterId, activityId) {
  // Récupérer l'élément de réponse (textarea ou tableau)
  const answerElement = window.getActivityAnswerElement(chapterId, activityId);
  if (!answerElement) return;
  
  let typingTimer;
  const typingDelay = 500; // RÉDUIT à 500ms pour plus de réactivité
  
  // Fonction d'analyse en temps réel
  const analyzeText = async function() {
    const currentText = answerElement.value || answerElement.textContent || '';
    
    // Ne pas analyser si le texte est trop court ou vide
    if (currentText.trim().length < 3) {
      // Supprimer le nuage existant si le texte est trop court
      const existingCloud = document.querySelector('.activity-correction-cloud');
      if (existingCloud) existingCloud.remove();
      return;
    }
    
    console.log('🔍 Analyse en temps réel du texte:', currentText.substring(0, 50) + '...');
    
    try {
      // Analyser le texte avec le service local
      if (window.analyzeTextLocal) {
        const analysis = window.analyzeTextLocal(currentText);
        
        // Analyser les doublons
        const duplicateAnalysis = analyzeDuplicates(currentText);
        
        // Fusionner les analyses
        const mergedAnalysis = {
          errors: [...(analysis.errors || []), ...(duplicateAnalysis.errors || [])],
          explanations: [...(analysis.explanations || []), ...(duplicateAnalysis.explanations || [])],
          suggestions: [...(analysis.suggestions || []), ...(duplicateAnalysis.suggestions || [])]
        };
        
        // Créer le nuage de correction IMMÉDIATEMENT si des erreurs sont détectées
        if (mergedAnalysis && (mergedAnalysis.errors.length > 0 || mergedAnalysis.suggestions.length > 0)) {
          const correctionsData = {
            corrections: mergedAnalysis.errors.map(err => ({
              text: err.text,
              correction: err.correction,
              type: err.type
            })),
            explanations: mergedAnalysis.explanations || [],
            suggestions: mergedAnalysis.suggestions || []
          };
          
          // Supprimer l'ancien nuage avant d'en créer un nouveau
          const existingCloud = document.querySelector('.activity-correction-cloud');
          if (existingCloud) existingCloud.remove();
          
          // Créer le nouveau nuage IMMÉDIATEMENT
          createActivityCorrectionCloud(correctionsData, currentText, chapterId, activityId);
        } else {
          // Supprimer le nuage si aucune erreur
          const existingCloud = document.querySelector('.activity-correction-cloud');
          if (existingCloud) existingCloud.remove();
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse en temps réel:', error);
    }
  };
  
  // Ajouter l'événement de saisie - PLUS RÉACTIF
  answerElement.addEventListener('input', function() {
    // Annuler le timer précédent
    clearTimeout(typingTimer);
    
    // Démarrer un nouveau timer PLUS RAPIDE
    typingTimer = setTimeout(analyzeText, typingDelay);
  });
  
  // Analyser également lors du focus si le texte n'est pas vide
  answerElement.addEventListener('focus', function() {
    const currentText = answerElement.value || answerElement.textContent || '';
    if (currentText.trim().length >= 3) {
      analyzeText();
    }
  });
  
  console.log('✅ Analyse en temps réel configurée pour l\'activité', chapterId, activityId);
};

// Fonction pour analyser les doublons dans le texte
window.analyzeDuplicates = function(text) {
  const words = text.toLowerCase().split(/\s+/);
  const seen = new Set();
  const duplicates = new Set();
  const errors = [];
  const explanations = [];
  const suggestions = [];
  
  words.forEach((word, index) => {
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    if (cleanWord.length > 3 && seen.has(cleanWord)) {
      if (!duplicates.has(cleanWord)) {
        duplicates.add(cleanWord);
        errors.push({
          text: cleanWord,
          correction: cleanWord + ' (supprimer la répétition)',
          type: 'duplicate'
        });
        explanations.push(`Le mot "${cleanWord}" est répété plusieurs fois dans votre texte.`);
        suggestions.push(`Évitez de répéter "${cleanWord}" trop souvent.`);
      }
    } else {
      seen.add(cleanWord);
    }
  });
  
  return {
    errors: errors,
    explanations: explanations,
    suggestions: suggestions
  };
};

// Fonction pour récupérer l'élément de réponse d'activité
window.getActivityAnswerElement = function(chapterId, activityId) {
  // Essayer les différents types de champs
  const textareaId = `activity-answer-${chapterId}-${activityId}`;
  const tableId = `activity-table-${chapterId}-${activityId}`;
  
  let element = document.getElementById(textareaId);
  if (!element) {
    element = document.getElementById(tableId);
  }
  
  return element;
};
async function fetchMarkdownContext(topic) {
  const fallbackContexts = {
    'techniques': "Tu es un expert en français et en pédagogie. Tu aides les élèves à maîtriser les techniques et pratiques de l'écrit. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur la production écrite, la planification, la révision, l'analyse de consignes, la recherche documentaire, la cohérence textuelle et la correction.",
    'narratif': "Tu es un expert en français et en pédagogie. Tu aides les élèves à produire des textes narratifs de qualité. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur la structure du récit (situation initiale, élément perturbateur, péripéties, dénouement), les types de narrateurs, les temps verbaux, la création de personnages et les dialogues.",
    'descriptif': "Tu es un expert en français et en pédagogie. Tu aides les élèves à produire des textes descriptifs de qualité. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur l'organisation spatiale et temporelle, les procédés descriptifs (comparaisons, métaphores), les figures de style, les champs lexicaux et les registres de description.",
    'explicatif': "Tu es un expert en français et en pédagogie. Tu aides les élèves à produire des textes explicatifs de qualité. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur la définition du sujet, l'organisation logique des idées, les connecteurs et marqueurs de relation, les causes et conséquences, les exemples et analogies.",
    'argumentatif': "Tu es un expert en français et en pédagogie. Tu aides les élèves à produire des textes argumentatifs de qualité. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur la formulation d'une thèse, la construction d'arguments solides, les preuves et exemples, la réfutation des objections, et les techniques de persuasion.",
    'resume': "Tu es un expert en français et en pédagogie. Tu aides les élèves à produire des résumés de qualité. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur l'identification des idées essentielles, la hiérarchisation des informations, la reformulation, la condensation et la neutralité du point de vue."
  };
  
  return fallbackContexts[topic] || "Tu es un tuteur expert en français. Aide l'étudiant sans faire le travail à sa place.";
}

// Fonction pour soumettre une activité à l'IA
window.submitActivity = async function(chapterId, activityId) {
  const activity = window.activityContent && window.activityContent[chapterId] ? window.activityContent[chapterId][activityId] : null;
  if (!activity) return;

  const feedbackEl = document.getElementById(`activity-feedback-${chapterId}-${activityId}`);
  const feedbackTextEl = document.getElementById(`activity-feedback-text-${chapterId}-${activityId}`);
  
  // Configurer l'analyse en temps réel pour cette activité
  setupRealTimeCorrection(chapterId, activityId);
  
  // Récupérer la réponse (tableau ou textarea)
  const answer = window.getActivityAnswer(chapterId, activityId, activity.hasTable);

  // Vérifier si la réponse est vide
  if (!answer || answer === '{}') {
    feedbackTextEl.innerHTML = `
      <div style="color: #d97706;">
        <p style="font-weight: bold; margin-bottom: 8px;">⚠️ Réponse vide détectée</p>
        <p>Pour obtenir une correction de l'IA, vous devez d'abord :</p>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Lire attentivement la consigne de l'activité</li>
          <li>Compléter votre réponse de manière concrète</li>
          <li>Relire votre travail avant de soumettre</li>
        </ul>
        <p style="margin-top: 8px; font-style: italic;">💡 Une réponse vide ne permet pas à l'IA de vous aider efficacement.</p>
      </div>
    `;
    return;
  }

  console.log('📝 Réponse récupérée:', answer);

  // Vérifier si la pipeline IA est disponible - AVEC ATTENTE
  console.log('🔍 DIAGNOSTIC ACTIVITÉS - Étape 1: Vérification demanderIA');
  console.log('📋 demanderIA disponible:', typeof window.demanderIA);
  
  // ATTEndre que demanderIA soit disponible
  let attempts = 0;
  const maxAttempts = 10;
  while (typeof window.demanderIA !== 'function' && attempts < maxAttempts) {
    console.log(`⏳ Attente de demanderIA... tentative ${attempts + 1}/${maxAttempts}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }

  if (typeof window.demanderIA !== 'function') {
    console.error('❌ ACTIVITÉS - demanderIA toujours non disponible après attente');
    if (feedbackTextEl) {
      feedbackTextEl.innerHTML = '<div class="text-red-600">❌ Le service IA met du temps à se charger. Veuillez réessayer dans quelques instants.</div>';
    }
    return;
  }

  // Construire le contexte pour l'IA
  let contexte = `Activité pédagogique - ${activity.title || 'Sans titre'}

Consigne : ${activity.question || 'Consigne non spécifiée'}

Réponse de l'étudiant :
${answer}

Instructions pour l'IA :
- Analyse la réponse de manière constructive et pédagogique
- Identifie les points forts et les axes d'amélioration
- Propose des suggestions concrètes et actionnables
- Adapte ton niveau de langage à un élève de niveau secondaire
- Sois encourageant et bienveillant`;

  // Ajouter le contexte spécifique selon le type d'activité
  if (activity.tableType === 'tri-inductif') {
    contexte += "\n\nFais attention à la distinction entre les différents types de textes (narratif, descriptif, explicatif) et à la pertinence des intentions et indices linguistiques.";
  } else if (activity.tableType === 'definir-sujet') {
    contexte += "\n\nVérifie si le sujet est bien défini, avec précision sur le thème, le domaine et l'objectif de l'explication.";
  } else if (activity.tableType === 'causes-consequences') {
    contexte += "\n\nAnalyse la pertinence des causes et conséquences identifiées, et vérifie si les relations de causalité sont bien établies pour un texte argumentatif.";
  } else if (activity.tableType === 'exemples-analogies') {
    contexte += "\n\nÉvalue la pertinence des exemples et analogies proposés dans une perspective descriptive, et suggère des améliorations si nécessaire.";
  } else if (activity.tableType === 'synthese-claire') {
    contexte += "\n\nVérifie si la synthèse est complète, claire et si elle reprend bien les idées essentielles avec une conclusion pertinente pour un résumé de qualité.";
  } else {
    contexte += "\n\nAssure-toi de commenter la qualité de la réponse, son développement et sa pertinence par rapport à la question posée.";
  }

  // Combiner le contexte de base avec le contexte de l'activité
  const baseContexte = await fetchMarkdownContext(window.currentDiscussion || 'techniques');
  const contexteFinal = baseContexte + '\n\n' + contexte;

  try {
    console.log('🔍 DIAGNOSTIC ACTIVITÉS - Étape 2: Préparation appel IA');
    console.log('📝 Réponse étudiant:', answer);
    console.log('📝 Contexte final:', contexteFinal);
    
    // Afficher un indicateur de chargement
    if (feedbackTextEl) {
      feedbackTextEl.innerHTML = '<div class="text-blue-600">🤖 L\'IA analyse votre réponse...</div>';
    }

    // Appeler l'IA avec le contexte enrichi
    const reponse = await window.demanderIA(answer, contexteFinal);
    
    console.log('🔍 DIAGNOSTIC ACTIVITÉS - Étape 3: Réponse IA reçue');
    console.log('📝 Longueur réponse:', reponse ? reponse.length : 0);
    console.log('📝 Type de réponse:', typeof reponse);
    console.log('📝 feedbackTextEl existe:', !!feedbackTextEl);
    console.log('📝 feedbackTextEl ID:', feedbackTextEl ? feedbackTextEl.id : 'N/A');
    console.log('📝 CONTENU COMPLET DE LA RÉPONSE IA:');
    console.log('─'.repeat(80));
    console.log(reponse);
    console.log('─'.repeat(80));

    // Afficher la réponse dans un conteneur de chat
    if (feedbackTextEl && reponse) {
      // Parser la réponse JSON pour extraire le contenu et les corrections
      let feedbackContent = reponse;
      let correctionsData = null;
      
      try {
        const parsedResponse = JSON.parse(reponse);
        if (parsedResponse.analysis) {
          feedbackContent = parsedResponse.analysis;
        }
        // Extraire les données de correction pour le nuage
        if (parsedResponse.corrections || parsedResponse.explanations || parsedResponse.suggestions) {
          correctionsData = {
            corrections: parsedResponse.corrections || [],
            explanations: parsedResponse.explanations || [],
            suggestions: parsedResponse.suggestions || []
          };
        }
      } catch (parseError) {
        console.log('⚠️ Réponse non-JSON, utilisation du contenu brut');
      }
      
      // Créer le nuage de correction s'il y a des corrections linguistiques
      if (correctionsData) {
        createActivityCorrectionCloud(correctionsData, answer, chapterId, activityId);
      }
      
      console.log('📝 Contenu à afficher:', feedbackContent);
      
      // Créer un conteneur temporaire pour le message de chat
      const tempChatContainer = document.createElement('div');
      tempChatContainer.className = 'p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4';
      tempChatContainer.innerHTML = 
        '<div class="flex items-start gap-3">' +
          '<div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-primary);">' +
            '<svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
              '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>' +
            '</svg>' +
          '</div>' +
          '<div class="flex-1">' +
            '<p class="text-sm font-medium text-gray-900 mb-1">Assistant IA</p>' +
            '<p class="text-sm text-gray-700">' + feedbackContent + '</p>' +
            '<p class="text-xs mt-1" style="color: var(--bs-text-muted);">IA • ' + new Date().toLocaleTimeString() + '</p>' +
          '</div>' +
        '</div>';
      
      // Remplacer le feedback par le message de chat
      feedbackTextEl.innerHTML = '';
      feedbackTextEl.appendChild(tempChatContainer);
      
      console.log('🔍 DIAGNOSTIC ACTIVITÉS - Étape 3.1: Conteneur ajouté');
      console.log('📝 feedbackTextEl children:', feedbackTextEl.children.length);
      console.log('📝 tempChatContainer HTML:', tempChatContainer.innerHTML.substring(0, 100) + '...');
      
      // Rendre le conteneur parent visible
      const feedbackContainer = feedbackTextEl.closest('.hidden');
      if (feedbackContainer) {
        feedbackContainer.classList.remove('hidden');
        console.log('✅ Conteneur de feedback rendu visible');
      }
      
      // Effet de frappe caractère par caractère
      const textElement = tempChatContainer.querySelector('p.text-gray-700');
      if (textElement && feedbackContent) {
        // Vider d'abord le texte
        textElement.textContent = '';
        
        // Effet de frappe
        let currentIndex = 0;
        const typingSpeed = 30; // ms par caractère
        
        function typeNextChar() {
          if (currentIndex < feedbackContent.length) {
            textElement.textContent += feedbackContent[currentIndex];
            currentIndex++;
            setTimeout(typeNextChar, typingSpeed);
          } else {
            console.log('✅ Effet de frappe terminé');
          }
        }
        
        // Démarrer l'effet de frappe
        setTimeout(typeNextChar, 100);
      }
      
    } else {
      console.log('🔍 DIAGNOSTIC ACTIVITÉS - Étape 4: Conditions non remplies');
      console.log('📝 feedbackTextEl existe:', !!feedbackTextEl);
      console.log('📝 reponse existe:', !!reponse);
      console.log('📝 reponse vide:', !reponse);
      
      // Fallback : afficher directement
      if (activity.hasTable) {
        feedbackTextEl.innerHTML = formatFeedbackAsTable(reponse);
      } else {
        feedbackTextEl.textContent = reponse || 'Aucun retour de l\'IA.';
      }
    }
  } catch (e) {
    console.error('❌ DIAGNOSTIC ACTIVITÉS - Erreur dans appel IA');
    console.error('📍 Erreur:', e);
    console.error('📍 Stack trace:', e.stack);
    console.error('📍 Message erreur:', e.message);
    
    feedbackTextEl.textContent = 'Désolé, une erreur technique est survenue. Veuillez réessayer.';
  }
};

// Fonction pour créer un textarea avec assistant d'écriture
window.createSmartTextarea = function(chapterId, activityId, placeholder) {
  if (!placeholder) placeholder = "Votre réponse...";
  
  return '<div class="smart-textarea-container">' +
    '<textarea ' +
      'id="activity-answer-' + chapterId + '-' + activityId + '" ' +
      'class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" ' +
      'rows="6" ' +
      'placeholder="' + placeholder + '" ' +
      'oninput="window.checkWriting && window.checkWriting(this)"' +
    '></textarea>' +
    '<div class="flex justify-between items-center mt-2 text-xs text-gray-500">' +
      '<span>💡 L\'assistant d\'écriture vous aide en temps réel</span>' +
      '<button ' +
        'class="px-2 py-1 bg-amber-100 text-amber-600 rounded hover:bg-amber-200 transition-colors" ' +
        'onclick="window.toggleAudio && window.toggleAudio()"' +
      '>' +
        '<svg class="h-5 w-5 inline mr-1" fill="currentColor" viewBox="0 0 24 24">' +
          '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.5 5 4.5V8c0-1-.62-1.02-1.64-2.5-1.77V3.23z"/>' +
        '</svg>' +
        'Audio' +
      '</button>' +
    '</div>' +
  '</div>';
};

// Fonction pour formater la réponse de l'IA en tableau si elle contient des données tabulaires
function formatFeedbackAsTable(response) {
  // Simple formatting pour les réponses de type tableau
  if (!response) return 'Aucune réponse disponible.';
  
  // Si la réponse contient des éléments qui ressemblent à un tableau
  if (response.includes('|') && response.includes('-')) {
    const lines = response.split('\n');
    let tableHtml = '<table class="w-full border-collapse border border-gray-300">';
    
    lines.forEach(function(line) {
      if (line.trim()) {
        const cells = line.split('|').map(function(cell) { return cell.trim(); }).filter(function(cell) { return cell; });
        if (cells.length > 0) {
          tableHtml += '<tr>';
          cells.forEach(function(cell) {
            tableHtml += '<td class="border border-gray-300 px-2 py-1 text-sm">' + cell + '</td>';
          });
          tableHtml += '</tr>';
        }
      }
    });
    
    tableHtml += '</table>';
    return tableHtml;
  }
  
  return response;
}

// Fonction pour obtenir la réponse de l'élève (tableau ou textarea)
window.getActivityAnswer = function(chapterId, activityId, hasTable) {
  if (hasTable) {
    // Récupérer les données du tableau
    const tableData = {};
    const tableRows = document.querySelectorAll('#activity-table-' + chapterId + '-' + activityId + ' tbody tr');
    
    tableRows.forEach(function(row, index) {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const textType = cells[0].textContent.trim();
        const question = cells[1].textContent.trim();
        const answer = cells[2].querySelector('input, textarea') ? cells[2].querySelector('input, textarea').value.trim() : '';
        
        tableData['row_' + index] = {
          textType: textType,
          question: question,
          answer: answer
        };
      }
    });
    
    return JSON.stringify(tableData);
  } else {
    // Récupérer le contenu du textarea
    const textarea = document.getElementById('activity-answer-' + chapterId + '-' + activityId);
    return textarea ? textarea.value.trim() : '';
  }
};

// Fonction pour générer les inputs de tableau
function generateTableInput(chapterId, activityId, tableType) {
  const tableData = {
    'tri-inductif': [
      { textType: 'A (Récit)', question: 'Que s\'est-il passé ?', intention: 'Raconter', indices: 'Passé simple, temps du récit' },
      { textType: 'B (Description)', question: 'Que s\'est-il passé ?', intention: 'Décrire', indices: 'Adjectifs, temps descriptifs' },
      { textType: 'C (Explicatif)', question: 'Que s\'est-il passé ?', intention: 'Expliquer', indices: 'Connecteurs logiques' }
    ],
    'definir-sujet': [
      { element: 'Thème', description: 'Domaine général du sujet' },
      { element: 'Domaine', description: 'Zone spécifique étudiée' },
      { element: 'Objectif', description: 'But de l\'explication' }
    ],
    'causes-consequences': [
      { element: 'Cause principale', description: 'Raison principale' },
      { element: 'Cause secondaire', description: 'Raison secondaire' },
      { element: 'Conséquence directe', description: 'Effet principal' },
      { element: 'Conséquence indirecte', description: 'Effet secondaire' }
    ],
    'exemples-analogies': [
      { element: 'Exemple 1', description: 'Premier cas concret' },
      { element: 'Exemple 2', description: 'Deuxième cas concret' },
      { element: 'Analogie', description: 'Comparaison éclairante' }
    ],
    'synthese-claire': [
      { element: 'Idée principale', description: 'Message central' },
      { element: 'Arguments clés', description: 'Points essentiels' },
      { element: 'Conclusion', description: 'Synthèse finale' }
    ]
  };

  const data = tableData[tableType] || tableData['tri-inductif'];
  
  return '<table id="activity-table-' + chapterId + '-' + activityId + '" class="w-full border-collapse border border-gray-300">' +
      '<thead>' +
        '<tr class="bg-gray-50">' +
          generateTableHeaders(data[0]) +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        generateTableRows(data, chapterId, activityId) +
      '</tbody>' +
    '</table>';
}

function generateTableHeaders(rowData) {
  var headers = '';
  Object.keys(rowData).forEach(function(key) {
    headers += '<th class="border border-gray-300 px-2 py-1 text-left text-xs font-medium">' + key + '</th>';
  });
  return headers;
}

function generateTableRows(data, chapterId, activityId) {
  var rows = '';
  data.forEach(function(row, index) {
    rows += '<tr>';
    Object.values(row).forEach(function(value, cellIndex) {
      rows += '<td class="border border-gray-300 px-2 py-1">';
      if (cellIndex === 0) {
        rows += value;
      } else {
        rows += '<input type="text" ' +
                'class="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500" ' +
                'placeholder="Votre réponse...">';
      }
      rows += '</td>';
    });
    rows += '</tr>';
  });
  return rows;
}

console.log("✅ Activities system charge");
