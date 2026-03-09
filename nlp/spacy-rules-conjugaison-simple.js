// === RÈGLES PERSONNALISÉES SPACY – CONJUGAISON (VERSION SIMPLIFIÉE) ===
// Version stabilisée pour éviter les erreurs de syntaxe

console.log('📝 Initialisation des règles simplifiées de conjugaison');

// Règles de conjugaison de base (sans apostrophes problématiques)
const conjugaisonRules = [
    {
        name: 'aller_present_vas',
        pattern: /\bil vas\b/g,
        replacement: 'il va',
        explanation: 'Le verbe aller se conjugue: je vais, tu vas, il va.',
        example: 'Il va au marché.'
    },
    {
        name: 'aller_present_vas_pluriel',
        pattern: /\bils vas\b/g,
        replacement: 'ils vont',
        explanation: 'Le verbe aller se conjugue: ils vont, elles vont.',
        example: 'Ils vont au cinéma.'
    },
    {
        name: 'etre_present_sont',
        pattern: /\bil sont\b/g,
        replacement: 'ils sont',
        explanation: 'Le verbe être se conjugue: ils sont, elles sont.',
        example: 'Ils sont contents.'
    },
    {
        name: 'etre_present_elles_sont',
        pattern: /\bel sont\b/g,
        replacement: 'elles sont',
        explanation: 'Le verbe être se conjugue: elles sont.',
        example: 'Elles sont arrivées.'
    },
    {
        name: 'faire_present_font',
        pattern: /\bil font\b/g,
        replacement: 'ils font',
        explanation: 'Le verbe faire se conjugue: ils font, elles font.',
        example: 'Ils font leurs devoirs.'
    },
    {
        name: 'faire_present_elles_font',
        pattern: /\bel font\b/g,
        replacement: 'elles font',
        explanation: 'Le verbe faire se conjugue: elles font.',
        example: 'Elles font du sport.'
    },
    {
        name: 'accord_sujet_verbe_enfants',
        pattern: /\bles enfant joue\b/g,
        replacement: 'les enfants jouent',
        explanation: 'Le verbe s accorde avec le sujet: enfants (pluriel) → jouent.',
        example: 'Les enfants jouent dans le jardin.'
    },
    {
        name: 'accord_sujet_verbe_chats',
        pattern: /\bles chat mange\b/g,
        replacement: 'les chats mangent',
        explanation: 'Le verbe s accorde avec le sujet: chats (pluriel) → mangent.',
        example: 'Les chats mangent leur nourriture.'
    },
    {
        name: 'accord_sujet_verbe_filles',
        pattern: /\bles fille danse\b/g,
        replacement: 'les filles dansent',
        explanation: 'Le verbe s accorde avec le sujet: filles (pluriel) → dansent.',
        example: 'Les filles dansent ensemble.'
    },
    {
        name: 'falloir_present',
        pattern: /\bil faut\b/g,
        replacement: 'il faut',
        explanation: 'Le verbe falloir ne s utilise qu avec il: il faut.',
        example: 'Il faut étudier pour réussir.'
    }
];

// Export pour différents environnements
if (typeof window !== 'undefined') {
    window.conjugaisonRules = conjugaisonRules;
    console.log(`✅ ${conjugaisonRules.length} règles de conjugaison simplifiées chargées.`);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = conjugaisonRules;
}
