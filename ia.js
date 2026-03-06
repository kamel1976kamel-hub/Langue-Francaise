// Fichier de compatibilité IA - Redirige vers la pipeline Cloudflare Workers
// Ce fichier remplace l'ancienne implémentation WebLLM

// Fonction de compatibilité pour les anciens appels
window.demanderIA = async function(prompt, contexte) {
    console.log('🚀 ia.js - demaderIA appelé');
    console.log('📝 Prompt:', prompt);
    console.log('📋 Contexte:', contexte);
    
    // Attendre un peu que sendAIChatMessage soit disponible (compatibilité avec main.js)
    let attempts = 0;
    while (typeof window.sendAIChatMessage !== 'function' && attempts < 10) {
        console.log(`⏳ ia.js - Attente de sendAIChatMessage... tentative ${attempts + 1}/10`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    // Utiliser le pipeline Cloudflare Workers
    if (typeof window.sendAIChatMessage === 'function') {
        console.log('✅ ia.js - Appel à sendAIChatMessage...');
        const result = await window.sendAIChatMessage(prompt);
        console.log('✅ ia.js - Réponse reçue de sendAIChatMessage');
        return result;
    } else {
        console.log('❌ ia.js - sendAIChatMessage NON disponible après attente');
        return "Le service IA est temporairement indisponible. Veuillez réessayer plus tard.";
    }
};

// Fonction d'initialisation de compatibilité
window.initWebLLM = async function() {
  console.log("WebLLM remplacé par la pipeline à 4 modèles GitHub Models");
  // Ne fait rien - la pipeline est initialisée dans main.js
};

// Message de compatibilité
console.log("ia.js chargé - Utilisation de la pipeline Cloudflare Workers");
