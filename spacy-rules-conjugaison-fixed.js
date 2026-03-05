/**
 * Règles de conjugaison spaCy - Version corrigée
 */

const conjugaisonRules = [
    {
        name: 'accord_sujet_verbe',
        description: 'Verifie l accord du sujet avec le verbe',
        example: '❌ "les enfant joue" → ✅ "les enfants jouent"',
        pattern: [
            { 'RIGHT_ID': 'sujet', 'RIGHT_ATTRS': { 'POS': 'NOUN' } },
            { 'LEFT_ID': 'sujet', 'REL_OP': '>', 'RIGHT_ATTRS': { 'POS': 'VERB' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            matches.forEach(match => {
                const sujet = doc[match[1]];
                const verbe = doc[match[2]];
                
                // Vérification simplifiée
                if (sujet && verbe) {
                    const sujetText = sujet.text.toLowerCase();
                    const verbeText = verbe.text.toLowerCase();
                    
                    // Sujet pluriel mais verbe singulier
                    if (sujetText.endsWith('s') && !verbeText.endsWith('nt') && verbeText.length > 2) {
                        errors.push({
                            word: verbe.text,
                            correction: verbeText + 'nt',
                            explanation: 'Le verbe doit s accorder avec le sujet pluriel',
                            type: 'conjugaison',
                            severity: 'error'
                        });
                    }
                }
            });
            return errors;
        }
    },
    {
        name: 'temps_verbes',
        description: 'Verifie l utilisation des temps verbaux',
        example: '❌ "je vas" → ✅ "je vais"',
        pattern: [
            { 'RIGHT_ID': 'verbe', 'RIGHT_ATTRS': { 'POS': 'VERB' } }
        ],
        action: function(doc, matches) {
            const errors = [];
            const erreursCommunes = {
                'vas': 'vais',
                'vas': 'vais',
                'font': 'font',
                'sommes': 'sommes',
                'etes': 'êtes'
            };
            
            matches.forEach(match => {
                const verbe = doc[match[1]];
                if (verbe && erreursCommunes[verbe.text.toLowerCase()]) {
                    errors.push({
                        word: verbe.text,
                        correction: erreursCommunes[verbe.text.toLowerCase()],
                        explanation: 'Erreur de conjugaison courante',
                        type: 'conjugaison',
                        severity: 'error'
                    });
                }
            });
            return errors;
        }
    }
];

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { conjugaisonRules };
} else if (typeof window !== 'undefined') {
    window.conjugaisonRules = conjugaisonRules;
}

console.log('✅ Règles de conjugaison corrigées chargées');
