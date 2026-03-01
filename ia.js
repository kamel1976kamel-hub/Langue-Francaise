// Fichier de compatibilité IA - Redirige vers la pipeline à 4 modèles
// Ce fichier remplace l'ancienne implémentation WebLLM

// Fonction de compatibilité pour les anciens appels
window.demanderIA = async function(prompt, contexte) {
  // Rediriger vers la pipeline à 4 modèles
  if (window.runFourModelPipeline) {
    return await window.runFourModelPipeline(prompt, contexte);
  } else {
    return "L'IA est en cours de chargement. Veuillez patienter...";
  }
};

// Fonction d'initialisation de compatibilité
window.initWebLLM = async function() {
  console.log("WebLLM remplacé par la pipeline à 4 modèles GitHub Models");
  // Ne fait rien - la pipeline est initialisée dans main.js
};

// Message de compatibilité
console.log("ia.js chargé - Utilisation de la pipeline à 4 modèles");
