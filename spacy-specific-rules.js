/**
 * =================================================================
 * RÈGLES SPACY SPÉCIFIQUES - ACCORDS DE BASE
 * Règles pour les erreurs courantes d'accord genre/nombre
 * =================================================================
 */

console.log('📚 Initialisation des règles SPAcy spécifiques - Accords de base');

// Règles spécifiques pour les erreurs courantes
const specificRules = [
    {
        name: 'accord_beau_fille',
        category: 'orthographe',
        enabled: true,
        priority: 1,
        description: 'Corrige "beau fille" en "belle fille"',
        action: function(doc) {
            const errors = [];
            const tokens = doc.tokens || [];
            
            // Chercher la séquence "beau fille"
            for (let i = 0; i < tokens.length - 1; i++) {
                const token1 = tokens[i];
                const token2 = tokens[i + 1];
                
                if (token1.text.toLowerCase() === 'beau' && 
                    (token2.text.toLowerCase() === 'fille' || token2.text.toLowerCase() === 'fille,')) {
                    
                    const correction = 'belle fille';
                    const word = token1.text + ' ' + token2.text;
                    
                    errors.push({
                        type: 'accord_genre_adjectif',
                        word: word,
                        correction: correction,
                        explanation: 'Erreur d\'accord de genre : "fille" est féminin, donc l\'adjectif doit être au féminin "belle". On dit "belle fille" et non "beau fille".',
                        offset: token1.idx || 0,
                        length: (token2.idx || 0) + (token2.length || 0) - (token1.idx || 0),
                        severity: 'high',
                        ruleName: 'accord_beau_fille'
                    });
                }
            }
            
            return errors;
        }
    },
    
    {
        name: 'accord_beau_femme',
        category: 'orthographe',
        enabled: true,
        priority: 1,
        description: 'Corrige "beau femme" en "belle femme"',
        action: function(doc) {
            const errors = [];
            const tokens = doc.tokens || [];
            
            // Chercher la séquence "beau femme"
            for (let i = 0; i < tokens.length - 1; i++) {
                const token1 = tokens[i];
                const token2 = tokens[i + 1];
                
                if (token1.text.toLowerCase() === 'beau' && 
                    (token2.text.toLowerCase() === 'femme' || token2.text.toLowerCase() === 'femme,')) {
                    
                    const correction = 'belle femme';
                    const word = token1.text + ' ' + token2.text;
                    
                    errors.push({
                        type: 'accord_genre_adjectif',
                        word: word,
                        correction: correction,
                        explanation: 'Erreur d\'accord de genre : "femme" est féminin, donc l\'adjectif doit être au féminin "belle". On dit "belle femme" et non "beau femme".',
                        offset: token1.idx || 0,
                        length: (token2.idx || 0) + (token2.length || 0) - (token1.idx || 0),
                        severity: 'high',
                        ruleName: 'accord_beau_femme'
                    });
                }
            }
            
            return errors;
        }
    },
    
    {
        name: 'accord_petit_fille',
        category: 'orthographe',
        enabled: true,
        priority: 1,
        description: 'Corrige "petit fille" en "petite fille"',
        action: function(doc) {
            const errors = [];
            const tokens = doc.tokens || [];
            
            // Chercher la séquence "petit fille"
            for (let i = 0; i < tokens.length - 1; i++) {
                const token1 = tokens[i];
                const token2 = tokens[i + 1];
                
                if (token1.text.toLowerCase() === 'petit' && 
                    (token2.text.toLowerCase() === 'fille' || token2.text.toLowerCase() === 'fille,')) {
                    
                    const correction = 'petite fille';
                    const word = token1.text + ' ' + token2.text;
                    
                    errors.push({
                        type: 'accord_genre_adjectif',
                        word: word,
                        correction: correction,
                        explanation: 'Erreur d\'accord de genre : "fille" est féminin, donc l\'adjectif doit être au féminin "petite". On dit "petite fille" et non "petit fille".',
                        offset: token1.idx || 0,
                        length: (token2.idx || 0) + (token2.length || 0) - (token1.idx || 0),
                        severity: 'high',
                        ruleName: 'accord_petit_fille'
                    });
                }
            }
            
            return errors;
        }
    },
    
    {
        name: 'accord_petit_femme',
        category: 'orthographe',
        enabled: true,
        priority: 1,
        description: 'Corrige "petit femme" en "petite femme"',
        action: function(doc) {
            const errors = [];
            const tokens = doc.tokens || [];
            
            // Chercher la séquence "petit femme"
            for (let i = 0; i < tokens.length - 1; i++) {
                const token1 = tokens[i];
                const token2 = tokens[i + 1];
                
                if (token1.text.toLowerCase() === 'petit' && 
                    (token2.text.toLowerCase() === 'femme' || token2.text.toLowerCase() === 'femme,')) {
                    
                    const correction = 'petite femme';
                    const word = token1.text + ' ' + token2.text;
                    
                    errors.push({
                        type: 'accord_genre_adjectif',
                        word: word,
                        correction: correction,
                        explanation: 'Erreur d\'accord de genre : "femme" est féminin, donc l\'adjectif doit être au féminin "petite". On dit "petite femme" et non "petit femme".',
                        offset: token1.idx || 0,
                        length: (token2.idx || 0) + (token2.length || 0) - (token1.idx || 0),
                        severity: 'high',
                        ruleName: 'accord_petit_femme'
                    });
                }
            }
            
            return errors;
        }
    },
    
    {
        name: 'accord_beau_jeune_fille',
        category: 'orthographe',
        enabled: true,
        priority: 1,
        description: 'Corrige "beau jeune fille" en "belle jeune fille"',
        action: function(doc) {
            const errors = [];
            const tokens = doc.tokens || [];
            
            // Chercher la séquence "beau jeune fille"
            for (let i = 0; i < tokens.length - 2; i++) {
                const token1 = tokens[i];
                const token2 = tokens[i + 1];
                const token3 = tokens[i + 2];
                
                if (token1.text.toLowerCase() === 'beau' && 
                    token2.text.toLowerCase() === 'jeune' && 
                    (token3.text.toLowerCase() === 'fille' || token3.text.toLowerCase() === 'fille,')) {
                    
                    const correction = 'belle jeune fille';
                    const word = token1.text + ' ' + token2.text + ' ' + token3.text;
                    
                    errors.push({
                        type: 'accord_genre_adjectif',
                        word: word,
                        correction: correction,
                        explanation: 'Erreur d\'accord de genre : "jeune fille" est féminin, donc l\'adjectif doit être au féminin "belle". On dit "belle jeune fille" et non "beau jeune fille".',
                        offset: token1.idx || 0,
                        length: (token3.idx || 0) + (token3.length || 0) - (token1.idx || 0),
                        severity: 'high',
                        ruleName: 'accord_beau_jeune_fille'
                    });
                }
            }
            
            return errors;
        }
    }
];

// Export des règles
window.specificRules = specificRules;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = specificRules;
}

console.log(`✅ ${specificRules.length} règles spécifiques chargées`);
