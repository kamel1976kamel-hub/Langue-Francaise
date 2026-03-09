// === RÈGLES PERSONNALISÉES SPACY – VOCABULAIRE (VERSION SIMPLIFIÉE) ===
// Version stabilisée pour éviter les erreurs de syntaxe

console.log('📚 Initialisation des règles simplifiées de vocabulaire');

// Règles de vocabulaire de base (sans apostrophes problématiques)
const vocabulaireRules = [
    {
        id: 'confusion_a_a',
        name: 'confusion_a_a',
        pattern: /\bà\b/g,
        correction: 'a',
        explanation: 'À = préposition ; a = verbe avoir.',
        example: 'Il va à Paris. Il a un chat.',
        type: 'vocabulaire',
        priority: 80
    },
    {
        id: 'confusion_ca_ce',
        name: 'confusion_ca_ce',
        pattern: /\bça\b/g,
        correction: 'cela',
        explanation: 'Ça (pronom démonstratif) peut être remplacé par cela.',
        example: 'Ça va bien. → Cela va bien.',
        type: 'vocabulaire',
        priority: 75
    },
    {
        id: 'confusion_leur_leurs',
        name: 'confusion_leur_leurs',
        pattern: /\bles leur(s?)\b/g,
        correction: 'leurs',
        explanation: 'Leur (adjectif) s accorde avec le nom.',
        example: 'Leurs livres sont intéressants.',
        type: 'vocabulaire',
        priority: 70
    },
    {
        id: 'confusion_quelquelle',
        name: 'confusion_quelquelle',
        pattern: /\bquel la\b/g,
        correction: 'quelle',
        explanation: 'Quel + nom masculin ; quelle + nom féminin.',
        example: 'Quelle belle journée !',
        type: 'vocabulaire',
        priority: 75
    },
    {
        id: 'confusion_on_ont',
        name: 'confusion_on_ont',
        pattern: /\bont\b/g,
        correction: 'on',
        explanation: 'On = pronom ; ont = verbe avoir.',
        example: 'On arrive. Ils ont arrivé.',
        type: 'vocabulaire',
        priority: 80
    }
];

// Export standardisé pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = vocabulaireRules;
} else if (typeof window !== 'undefined') {
    window.vocabulaireRules = vocabulaireRules;
    console.log(`✅ ${vocabulaireRules.length} règles de vocabulaire simplifiées chargées.`);
}
