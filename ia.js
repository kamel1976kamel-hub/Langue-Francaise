// Fichier de compatibilité IA - Redirige vers la pipeline Cloudflare Workers
// Ce fichier remplace l'ancienne implémentation WebLLM
// REDIRECTION VERS main.js pour éviter les conflits
console.log('🔄 ia.js - Redirection vers main.demanderIA');

// Ne pas définir demanderIA ici - utiliser celle de main.js

// Fonction d'initialisation de compatibilité
window.initWebLLM = async function() {
  console.log("WebLLM remplacé par la pipeline à 4 modèles GitHub Models");
  // Ne fait rien - la pipeline est initialisée dans main.js
};

// Message de compatibilité
console.log("ia.js chargé - Utilisation de la pipeline Cloudflare Workers");
