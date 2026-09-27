// === MODULE IA — STUB LOCAL (ACTION 29) ===
// Le chemin direct navigateur → Groq a été supprimé.
// L'analyse distante passe exclusivement par le Worker via window.APP_CONFIG.api.workerUrl.
// Ce module conserve uniquement les points d'entrée publics pour la compatibilité
// avec advanced-text-corrector.js et integration-manager.js, en retournant [].

console.log('🧠 Module IA Groq — stub local (aucun chemin distant direct)');

// Analyse IA : toujours vide — le pipeline distant est géré par le Worker.
window.groqAIAnalysis = async function (text) {
    if (!text || typeof text !== 'string' || text.length < 10) {
        return [];
    }
    return [];
};

// Variante en cache : idem, retourne toujours [].
window.groqAIAnalysisCached = async function (text) {
    if (!text || typeof text !== 'string' || text.length < 10) {
        return [];
    }
    return [];
};

console.log('✅ Module IA Groq initialisé (stub local, fallback uniquement)');
