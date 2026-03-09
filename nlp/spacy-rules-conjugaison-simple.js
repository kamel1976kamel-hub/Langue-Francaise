// === RÈGLES PERSONNALISÉES SPACY – CONJUGAISON (VERSION SIMPLIFIÉE) ===
// Version stabilisée pour éviter les erreurs de syntaxe

console.log('📝 Initialisation des règles simplifiées de conjugaison');

// Règles de conjugaison de base (sans apostrophes problématiques)
const conjugaisonRules = [
    {
        id: 'aller_present_vas',
        name: 'aller_present_vas',
        pattern: /\bil vas\b/g,
        correction: 'il va',
        explanation: 'Le verbe aller se conjugue: je vais, tu vas, il va.',
        example: 'Il va au marché.',
        type: 'conjugaison',
        priority: 85
    },
    {
        id: 'aller_present_vas_pluriel',
        name: 'aller_present_vas_pluriel',
        pattern: /\bils vas\b/g,
        correction: 'ils vont',
        explanation: 'Le verbe aller se conjugue: ils vont, elles vont.',
        example: 'Ils vont au cinéma.',
        type: 'conjugaison',
        priority: 85
    },
    {
        id: 'etre_present_sont',
        name: 'etre_present_sont',
        pattern: /\bil sont\b/g,
        correction: 'ils sont',
        explanation: 'Le verbe être se conjugue: ils sont, elles sont.',
        example: 'Ils sont contents.',
        type: 'conjugaison',
        priority: 85
    },
    {
        id: 'etre_present_elles_sont',
        name: 'etre_present_elles_sont',
        pattern: /\bel sont\b/g,
        correction: 'elles sont',
        explanation: 'Le verbe être se conjugue: elles sont.',
        example: 'Elles sont arrivées.',
        type: 'conjugaison',
        priority: 85
    },
    {
        id: 'faire_present_font',
        name: 'faire_present_font',
        pattern: /\bil font\b/g,
        correction: 'ils font',
        explanation: 'Le verbe faire se conjugue: ils font, elles font.',
        example: 'Ils font leurs devoirs.',
        type: 'conjugaison',
        priority: 85
    },
    {
        id: 'faire_present_elles_font',
        name: 'faire_present_elles_font',
        pattern: /\bel font\b/g,
        correction: 'elles font',
        explanation: 'Le verbe faire se conjugue: elles font.',
        example: 'Elles font du sport.',
        type: 'conjugaison',
        priority: 85
    },
    {
        id: 'accord_sujet_verbe_enfants',
        name: 'accord_sujet_verbe_enfants',
        pattern: /\bles enfant joue\b/g,
        correction: 'les enfants jouent',
        explanation: 'Le verbe s accorde avec le sujet: enfants (pluriel) → jouent.',
        example: 'Les enfants jouent dans le jardin.',
        type: 'conjugaison',
        priority: 90
    },
    {
        id: 'accord_sujet_verbe_chats',
        name: 'accord_sujet_verbe_chats',
        pattern: /\bles chat mange\b/g,
        correction: 'les chats mangent',
        explanation: 'Le verbe s accorde avec le sujet: chats (pluriel) → mangent.',
        example: 'Les chats mangent leur nourriture.',
        type: 'conjugaison',
        priority: 90
    },
    {
        id: 'accord_sujet_verbe_filles',
        name: 'accord_sujet_verbe_filles',
        pattern: /\bles fille danse\b/g,
        correction: 'les filles dansent',
        explanation: 'Le verbe s accorde avec le sujet: filles (pluriel) → dansent.',
        example: 'Les filles dansent ensemble.',
        type: 'conjugaison',
        priority: 90
    },
    {
        id: 'falloir_present',
        name: 'falloir_present',
        pattern: /\bil faut\b/g,
        correction: 'il faut',
        explanation: 'Le verbe falloir ne s utilise qu avec il: il faut.',
        example: 'Il faut étudier pour réussir.',
        type: 'conjugaison',
        priority: 80
    }
];

// Export standardisé pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = conjugaisonRules;
} else if (typeof window !== 'undefined') {
    window.conjugaisonRules = conjugaisonRules;
    console.log(`✅ ${conjugaisonRules.length} règles de conjugaison simplifiées chargées.`);
}
