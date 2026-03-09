// === RÈGLES PERSONNALISÉES SPACY – VOCABULAIRE (VERSION SIMPLIFIÉE) ===
// Version stabilisée pour éviter les erreurs de syntaxe

console.log('📚 Initialisation des règles simplifiées de vocabulaire');

// Règles de vocabulaire de base (sans apostrophes problématiques)
const vocabulaireRules = [
    {
        name: 'confusion_a_a',
        pattern: /\bà\b/g,
        replacement: 'a',
        explanation: 'À = préposition ; a = verbe avoir.',
        example: 'Il va à Paris. Il a un chat.'
    },
    {
        name: 'confusion_ca_ce',
        pattern: /\bça\b/g,
        replacement: 'cela',
        explanation: 'Ça (pronom démonstratif) peut être remplacé par cela.',
        example: 'Ça va bien. → Cela va bien.'
    },
    {
        name: 'confusion_leur_leurs',
        pattern: /\bles leur(s?)\b/g,
        replacement: 'leurs',
        explanation: 'Leur (adjectif) s accorde avec le nom.',
        example: 'Leurs livres sont intéressants.'
    },
    {
        name: 'confusion_quelquelle',
        pattern: /\bquel la\b/g,
        replacement: 'quelle',
        explanation: 'Quel + nom masculin ; quelle + nom féminin.',
        example: 'Quelle belle journée !'
    },
    {
        name: 'confusion_on_ont',
        pattern: /\bont\b/g,
        replacement: 'on',
        explanation: 'On = pronom ; ont = verbe avoir.',
        example: 'On arrive. Ils ont arrivé.'
    }
];

// Export pour différents environnements
if (typeof window !== 'undefined') {
    window.vocabulaireRules = vocabulaireRules;
    console.log(`✅ ${vocabulaireRules.length} règles de vocabulaire simplifiées chargées.`);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = vocabulaireRules;
}
