// === RÈGLES PERSONNALISÉES SPACY – STYLE (VERSION SIMPLIFIÉE) ===
// Version stabilisée avec format cohérent pour éviter les erreurs de validation

console.log('📚 Initialisation des règles simplifiées de style');

// Règles de style de base (format standardisé avec regex)
const styleRules = [
    {
        id: 'ponctuation_fin',
        name: 'ponctuation_fin',
        pattern: /\b([.!?])\s*([.!?])/g,
        correction: '$1',
        explanation: 'Éviter la double ponctuation en fin de phrase.',
        example: 'Bonjour!. → Bonjour!',
        type: 'style',
        priority: 85
    },
    {
        id: 'espace_apres_virgule',
        name: 'espace_apres_virgule',
        pattern: /,(\S)/g,
        correction: ', $1',
        explanation: 'Mettre un espace après la virgule.',
        example: 'Bonjour,mon ami → Bonjour, mon ami',
        type: 'style',
        priority: 90
    },
    {
        id: 'espace_avant_point',
        name: 'espace_avant_point',
        pattern: /\s+([.!?])/g,
        correction: '$1',
        explanation: 'Pas d\'espace avant la ponctuation finale.',
        example: 'Bonjour . → Bonjour.',
        type: 'style',
        priority: 85
    },
    {
        id: 'double_espace',
        name: 'double_espace',
        pattern: /\s{2,}/g,
        correction: ' ',
        explanation: 'Éviter les doubles espaces.',
        example: 'Bonjour  mon ami → Bonjour mon ami',
        type: 'style',
        priority: 80
    },
    {
        id: 'majuscule_debut_phrase',
        name: 'majuscule_debut_phrase',
        pattern: /([.!?]\s+)([a-z])/g,
        correction: function(match, punct, letter) {
            return punct + letter.toUpperCase();
        },
        explanation: 'Commencer chaque phrase par une majuscule.',
        example: 'bonjour. comment allez-vous? → Bonjour. Comment allez-vous?',
        type: 'style',
        priority: 95
    },
    {
        id: 'accord_être_adjectif',
        name: 'accord_être_adjectif',
        pattern: /\b(ils|elles)\s+(est|sont)\s+(\w+)(s?)\b/gi,
        correction: function(match, sujet, verbe, adjectif, s) {
            const sujetLower = sujet.toLowerCase();
            const verbeLower = verbe.toLowerCase();
            if ((sujetLower === 'ils' || sujetLower === 'elles') && verbeLower === 'est') {
                return `${sujet} sont ${adjectif}${s ? '' : 's'}`;
            }
            return match;
        },
        explanation: 'Accord sujet-verbe-adjectif avec être.',
        example: 'Ils est grand → Ils sont grands',
        type: 'style',
        priority: 90
    },
    {
        id: 'confusion_ou_où',
        name: 'confusion_ou_où',
        pattern: /\bou\b(?=\s+(le|la|les|un|une|des|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|votre|leur))/gi,
        correction: 'où',
        explanation: 'Utiliser "où" pour le lieu, "ou" pour le choix.',
        example: 'La maison ou je vis → La maison où je vis',
        type: 'style',
        priority: 80
    },
    {
        id: 'confusion_a_à',
        name: 'confusion_a_à',
        pattern: /\ba\b(?=\s+(le|la|les|un|une|des|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|votre|leur|cette|ces|cet))/gi,
        correction: 'à',
        explanation: 'Utiliser "à" pour la préposition, "a" pour le verbe.',
        example: 'Il a le livre → Il à le livre (incorrect)',
        type: 'style',
        priority: 75
    },
    {
        id: 'accord_participe_passé',
        name: 'accord_participe_passé',
        pattern: /\b(elle|la|cette)\s+(a|as|avons|avez|ont|aurai|auras|aura|aurons|aurez|auront|avais|avais|avait|avions|aviez|avaient|eus|eûmes|eûtes|eurent)\s+(\w+é)\b/gi,
        correction: function(match, sujet, auxiliaire, participe) {
            return `${sujet} ${auxiliaire} ${participe}e`;
        },
        explanation: 'Accorder le participe passé avec le sujet féminin.',
        example: 'Elle a arrivé → Elle a arrivée',
        type: 'style',
        priority: 85
    },
    {
        id: 'parentheses_espaces',
        name: 'parentheses_espaces',
        pattern: /\(\s*([^\)]+?)\s*\)/g,
        correction: '($1)',
        explanation: 'Pas d\'espaces inutiles à l\'intérieur des parenthèses.',
        example: '( texte ) → (texte)',
        type: 'style',
        priority: 70
    }
];

// Export standardisé pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = styleRules;
} else if (typeof window !== 'undefined') {
    window.styleRules = styleRules;
    console.log(`✅ ${styleRules.length} règles de style simplifiées chargées.`);
}
