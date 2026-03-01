// Système audio pour la synthèse vocale

// Variables pour suivre l'audio en cours
let currentAudioSource = null;

// Vérifier si la synthèse vocale est en cours
window.isSpeaking = function() {
  return window.speechSynthesis && window.speechSynthesis.speaking;
};

// Fonction pour arrêter toute lecture audio en cours
window.stopAllAudio = function() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentAudioSource = null;
  }
};

// Fonction pour lire un texte
window.speakText = function(text) {
  if (!('speechSynthesis' in window)) {
    console.log('Synthèse vocale non supportée');
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  
  // Réinitialiser la source quand la lecture est terminée
  utterance.onend = function() {
    currentAudioSource = null;
  };
  
  // Chercher une voix française
  const voices = window.speechSynthesis.getVoices();
  const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
  if (frenchVoice) {
    utterance.voice = frenchVoice;
  }
  
  window.speechSynthesis.speak(utterance);
};

// Fonction pour lire le texte de l'activité
window.speakActivityText = function(chapterId, activityId) {
  const sourceId = `activity-${chapterId}-${activityId}`;
  
  // Si on clique sur la même source qui est en cours de lecture, on arrête
  if (window.currentAudioSource === sourceId && window.isSpeaking()) {
    window.stopAllAudio();
    return;
  }
  
  // Sinon, on arrête tout et on démarre la nouvelle lecture
  window.stopAllAudio();
  window.currentAudioSource = sourceId;
  
  // Si c'est une activité avec tableau, lire le contenu du tableau
  if (window.activityContent && window.activityContent[chapterId]?.[activityId]?.hasTable) {
    const text = window.getActivityAnswer(chapterId, activityId, true);
    if (text && text !== '{}') {
      window.speakText(text);
    }
  } else {
    // Sinon, lire le textarea
    const answerEl = document.getElementById(`activity-answer-${chapterId}-${activityId}`);
    if (answerEl && answerEl.value.trim()) {
      window.speakText(answerEl.value.trim());
    }
  }
};

// Fonction pour lire le feedback de l'IA
window.speakFeedbackText = function(chapterId, activityId) {
  const sourceId = `feedback-${chapterId}-${activityId}`;
  
  // Si on clique sur la même source qui est en cours de lecture, on arrête
  if (window.currentAudioSource === sourceId && window.isSpeaking()) {
    window.stopAllAudio();
    return;
  }
  
  // Sinon, on arrête tout et on démarre la nouvelle lecture
  window.stopAllAudio();
  window.currentAudioSource = sourceId;
  
  const feedbackTextEl = document.getElementById(`activity-feedback-text-${chapterId}-${activityId}`);
  if (feedbackTextEl && feedbackTextEl.textContent.trim()) {
    window.speakText(feedbackTextEl.textContent.trim());
  }
};

// Fonction pour lire le texte théorique (colonne 4)
window.speakTheoryText = function() {
  const sourceId = 'theory';
  
  // Si on clique sur la même source qui est en cours de lecture, on arrête
  if (window.currentAudioSource === sourceId && window.isSpeaking()) {
    window.stopAllAudio();
    return;
  }
  
  // Sinon, on arrête tout et on démarre la nouvelle lecture
  window.stopAllAudio();
  window.currentAudioSource = sourceId;
  
  const theoryTitleEl = document.getElementById('theoryTitle');
  const theoryContentEl = document.getElementById('theoryContent');
  if (theoryTitleEl && theoryContentEl) {
    const title = theoryTitleEl.innerText;
    const content = theoryContentEl.innerText;
    const fullText = `${title}. ${content}`;
    window.speakText(fullText);
  }
};

// Fonction pour lire les informations du module dans le chat (colonne 4)
window.speakChatModuleText = function() {
  const sourceId = 'chat-module';
  
  // Si on clique sur la même source qui est en cours de lecture, on arrête
  if (window.currentAudioSource === sourceId && window.isSpeaking()) {
    window.stopAllAudio();
    return;
  }
  
  // Sinon, on arrête tout et on démarre la nouvelle lecture
  window.stopAllAudio();
  window.currentAudioSource = sourceId;
  
  const titleElement = document.getElementById('chatModuleTitle');
  const finalitiesElement = document.getElementById('chatModuleFinalities');
  const objectivesList = document.getElementById('chatModuleObjectives');
  const contentElement = document.getElementById('chatModuleContent');
  
  if (titleElement && finalitiesElement && objectivesList && contentElement) {
    const title = titleElement.innerText;
    const finalities = finalitiesElement.innerText;
    const objectives = Array.from(objectivesList.querySelectorAll('li')).map(li => li.innerText).join('. ');
    const content = contentElement.innerText;
    
    const fullText = `${title}. Finalités: ${finalities}. Objectifs: ${objectives}. Contenu: ${content}`;
    window.speakText(fullText);
  }
};

// Fonction pour lire la réponse de l'IA dans le chat
window.speakChatAIResponse = function(buttonElement) {
  // Trouver le texte de la réponse (le parent du bouton est le div contenant le texte)
  const messageDiv = buttonElement.closest('.flex-1').querySelector('p');
  const text = messageDiv ? messageDiv.textContent : '';
  
  if (!text) return;
  
  const sourceId = 'chat-ai-response';
  
  // Si on clique sur la même source qui est en cours de lecture, on arrête
  if (window.currentAudioSource === sourceId && window.isSpeaking()) {
    window.stopAllAudio();
    return;
  }
  
  // Sinon, on arrête tout et on démarre la nouvelle lecture
  window.stopAllAudio();
  window.currentAudioSource = sourceId;
  
  window.speakText(text);
};