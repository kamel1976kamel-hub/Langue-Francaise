// Interface spaCy API pour analyse linguistique avancée
class SpacyAnalyzer {
  constructor() {
    this.apiEndpoint = 'https://your-spacy-api.com/analyze'; // À configurer
    this.enabled = false;
    this.fallbackEnabled = true;
  }

  // Initialisation de l'analyseur spaCy
  async init() {
    try {
      // Test de connexion à l'API
      const response = await fetch(`${this.apiEndpoint}/health`);
      if (response.ok) {
        this.enabled = true;
        console.log('🤖 spaCy API connectée avec succès');
        return true;
      }
    } catch (error) {
      console.warn('⚠️ spaCy API non disponible, utilisation du fallback');
      this.enabled = false;
      return false;
    }
  }

  // Analyse du texte avec spaCy
  async analyzeText(text) {
    if (!this.enabled) {
      return this.fallbackAnalysis(text);
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: 'fr',
          analysis: ['pos', 'lemma', 'dependency', 'ner']
        }))
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const result = await response.json();
      console.log('🤖 Analyse spaCy:', result);
      
      return this.convertSpacyToErrors(result);
    } catch (error) {
      console.error('❌ Erreur spaCy:', error);
      return this.fallbackAnalysis(text);
    }
  }

  // Conversion des résultats spaCy en format d'erreurs
  convertSpacyToErrors(spacyResult) {
    const errors = [];
    
    // 1. Vérification des accords sujet-verbe
    if (spacyResult.dependencies) {
      spacyResult.dependencies.forEach(dep => {
        if (dep.relation === 'nsubj' && dep.head && dep.child) {
          const subject = dep.child;
          const verb = dep.head;
          
          // Vérification accord nombre
          if (subject.number === 'plural' && verb.number === 'singular') {
            errors.push({
              type: 'grammaire',
              word: verb.text,
              correction: this.getCorrectVerbForm(verb.lemma, 'plural'),
              explanation: `Erreur d'accord : le sujet "${subject.text}" est au pluriel, le verbe "${verb.text}" devrait être au pluriel.`,
              offset: verb.start_char,
              length: verb.end_char - verb.start_char
            });
          }
        }
      });
    }

    // 2. Vérification des participes passés
    if (spacyResult.tokens) {
      spacyResult.tokens.forEach(token => {
        if (token.pos === 'AUX' && token.lemma === 'avoir') {
          // Chercher le participe passé suivant
          const nextToken = spacyResult.tokens[token.index + 1];
          if (nextToken && nextToken.pos === 'VERB') {
            // Vérifier l'accord avec l'objet direct si nécessaire
            const directObject = this.findDirectObject(spacyResult, token);
            if (directObject && directObject.number === 'plural' && !nextToken.text.endsWith('s')) {
              errors.push({
                type: 'grammaire',
                word: nextToken.text,
                correction: nextToken.text + 's',
                explanation: `Erreur d'accord du participe passé : l'objet direct est au pluriel.`,
                offset: nextToken.start_char,
                length: nextToken.end_char - nextToken.start_char
              });
            }
          }
        }
      });
    }

    // 3. Vérification orthographique de base
    const commonErrors = {
      'c\'et': 'c\'est',
      'pere': 'père',
      'mere': 'mère',
      'frere': 'frère',
      'soeur': 'sœur'
    };

    Object.entries(commonErrors).forEach(([wrong, correct]) => {
      if (text.toLowerCase().includes(wrong)) {
        const index = text.toLowerCase().indexOf(wrong);
        errors.push({
          type: 'orthographe',
          word: wrong,
          correction: correct,
          explanation: `Erreur orthographique : "${wrong}" devrait être "${correct}".`,
          offset: index,
          length: wrong.length
        });
      }
    });

    console.log(`🤖 spaCy a trouvé ${errors.length} erreurs`);
    return errors;
  }

  // Analyse fallback améliorée
  fallbackAnalysis(text) {
    console.log('📝 Utilisation du fallback amélioré');
    
    const errors = [];
    
    // Règles grammaticales avancées
    const grammarRules = [
      {
        pattern: /\bc'et\b/gi,
        replacement: "c'est",
        message: "Attention : \"c'et\" devrait être \"c'est\" (contraction de \"cela est\").",
        type: 'grammaire'
      },
      {
        pattern: /\bc'est "est"\b/gi,
        replacement: "c'est et",
        message: "Erreur de vocabulaire : \"c'est \"est\" au lieu de \"et\" devrait être \"c'est et\".",
        type: 'vocabulaire'
      },
      {
        pattern: /\bmais "mias"\b/gi,
        replacement: "mais que",
        message: "Erreur de vocabulaire : \"mais \"mias\" au lieu de \"que\" devrait être \"mais que\".",
        type: 'vocabulaire'
      },
      {
        pattern: /\bmieu de mias\b/gi,
        replacement: "mieux que",
        message: "Erreur de vocabulaire : \"mieu de mias\" devrait être \"mieux que\".",
        type: 'vocabulaire'
      },
      {
        pattern: /\bqui aller\b/gi,
        replacement: "qui va",
        message: "Erreur de conjugaison : \"qui aller\" devrait être \"qui va\" (verbe aller au présent).",
        type: 'conjugaison'
      }
    ];

    // Appliquer les règles
    grammarRules.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        errors.push({
          type: rule.type,
          word: match[0],
          correction: rule.replacement,
          explanation: rule.message,
          offset: match.index,
          length: match[0].length
        });
      }
    });

    console.log(`📊 Fallback a trouvé ${errors.length} erreurs`);
    return errors;
  }

  // Utilitaires pour l'analyse spaCy
  findDirectObject(result, auxVerb) {
    // Logique pour trouver l'objet direct
    return null; // À implémenter selon les besoins
  }

  getCorrectVerbForm(lemma, number) {
    // Logique pour conjuguer correctement
    const conjugations = {
      'être': { 'plural': 'sont' },
      'avoir': { 'plural': 'ont' },
      'aller': { 'plural': 'vont' },
      'faire': { 'plural': 'font' }
    };
    return conjugations[lemma]?.[number] || lemma;
  }
}

// Export pour utilisation
window.SpacyAnalyzer = SpacyAnalyzer;
console.log('🤖 Analyseur spaCy chargé');
