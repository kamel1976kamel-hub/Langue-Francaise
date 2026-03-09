// === RÈGLES PERSONNALISÉES SPACY – ORTHOGRAPHE (VERSION SIMPLIFIÉE) ===
// Version stabilisée avec format cohérent pour éviter les erreurs de validation

console.log('📝 Initialisation des règles simplifiées d\'orthographe');

// Règles d'orthographe de base (format standardisé avec regex)
const orthographeRules = [
    {
        id: 'accord_être_nom',
        name: 'accord_être_nom',
        pattern: /\b(ils|elles)\s+(est|sont)\s+(\w+)(s?)\b/gi,
        correction: function(match, sujet, verbe, nom, s) {
            const sujetLower = sujet.toLowerCase();
            const verbeLower = verbe.toLowerCase();
            if ((sujetLower === 'ils' || sujetLower === 'elles') && verbeLower === 'est') {
                return `${sujet} sont ${nom}${s ? '' : 's'}`;
            }
            return match;
        },
        explanation: 'Accord sujet-verbe avec être.',
        example: 'Ils est content → Ils sont contents',
        type: 'orthographe',
        priority: 90
    },
    {
        id: 'accord_avoir_nom',
        name: 'accord_avoir_nom',
        pattern: /\b(ils|elles)\s+(a|as|avons|avez|ont)\s+(\w+)(s?)\b/gi,
        correction: function(match, sujet, auxiliaire, nom, s) {
            const sujetLower = sujet.toLowerCase();
            const auxiliaireLower = auxiliaire.toLowerCase();
            if ((sujetLower === 'ils' || sujetLower === 'elles') && auxiliaireLower === 'a') {
                return `${sujet} ont ${nom}${s ? '' : 's'}`;
            }
            return match;
        },
        explanation: 'Accord sujet-auxiliaire avec avoir.',
        example: 'Ils a les livres → Ils ont les livres',
        type: 'orthographe',
        priority: 90
    },
    {
        id: 'accord_adjectif_feminin',
        name: 'accord_adjectif_feminin',
        pattern: /\b(la|cette|une|ma|ta|sa)\s+(\w+)\s+(\w+)(s?)\b/gi,
        correction: function(match, determinant, nom, adjectif, s) {
            // Ajouter 'e' si l'adjectif ne se termine pas déjà par 'e'
            const adjectifCorrige = adjectif + (!adjectif.endsWith('e') ? 'e' : '') + s;
            return `${determinant} ${nom} ${adjectifCorrige}`;
        },
        explanation: 'Accord de l\'adjectif avec le nom féminin.',
        example: 'La maison est beau → La maison est belle',
        type: 'orthographe',
        priority: 85
    },
    {
        id: 'accord_adjectif_pluriel',
        name: 'accord_adjectif_pluriel',
        pattern: /\b(les|des|mes|tes|ses|nos|vos|leurs)\s+(\w+)\s+(\w+?)\b/gi,
        correction: function(match, determinant, nom, adjectif) {
            // Ajouter 's' si l'adjectif ne se termine pas déjà par 's' ou 'x'
            const adjectifCorrige = adjectif + (!adjectif.match(/[sx]$/) ? 's' : '');
            return `${determinant} ${nom} ${adjectifCorrige}`;
        },
        explanation: 'Accord de l\'adjectif au pluriel.',
        example: 'Les chats est petit → Les chats sont petits',
        type: 'orthographe',
        priority: 85
    },
    {
        id: 'confusion_ce_se',
        name: 'confusion_ce_se',
        pattern: /\bce\b(?=\s+(est|sont|sera|seront|était|étaient|fut|furent))/gi,
        correction: 'se',
        explanation: 'Utiliser "se" pour le pronom réfléchi, "ce" pour le démonstratif.',
        example: 'Ce lave → Se lave',
        type: 'orthographe',
        priority: 80
    }
];

// Export standardisé pour utilisation (Node.js ou navigateur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = orthographeRules;
} else if (typeof window !== 'undefined') {
    window.orthographeRules = orthographeRules;
    console.log(`✅ ${orthographeRules.length} règles d\'orthographe simplifiées chargées.`);
}
