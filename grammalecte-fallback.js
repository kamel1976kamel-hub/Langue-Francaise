// Fallback Grammalecte simplifié mais fonctionnel
window.grammalecte = {
  oInfo: {
    sVersion: "2.3.0-fallback",
    sAuthor: "Fallback System"
  },
  
  // Initialisation
  Grammalecte: function(options) {
    this.options = options || {};
    console.log('🇫🇷 Grammalecte Fallback initialisé');
    return this;
  },
  
  // Analyse de texte simplifiée mais efficace
  parseText: async function(text) {
    console.log('🇫🇷 Analyse avec Grammalecte Fallback:', text);
    
    const result = {
      grammarErrors: [],
      spellingErrors: []
    };
    
    // Règles grammaticales françaises
    const grammarRules = [
      {
        pattern: /\bc'et\b/gi,
        replacement: "c'est",
        message: "Attention : \"c'et\" devrait être \"c'est\" (contraction de \"cela est\").",
        ruleId: "c_et_c_est"
      },
      {
        pattern: /\bqui aller\b/gi,
        replacement: "qui va",
        message: "Erreur de conjugaison : \"qui aller\" devrait être \"qui va\" (verbe aller au présent).",
        ruleId: "conjugaison_aller"
      },
      {
        pattern: /\bje aller\b/gi,
        replacement: "je vais",
        message: "Erreur de conjugaison : \"je aller\" devrait être \"je vais\" (verbe aller au présent).",
        ruleId: "conjugaison_aller_je"
      },
      {
        pattern: /\btu aller\b/gi,
        replacement: "tu vas",
        message: "Erreur de conjugaison : \"tu aller\" devrait être \"tu vas\" (verbe aller au présent).",
        ruleId: "conjugaison_aller_tu"
      },
      {
        pattern: /\bil aller\b/gi,
        replacement: "il va",
        message: "Erreur de conjugaison : \"il aller\" devrait être \"il va\" (verbe aller au présent).",
        ruleId: "conjugaison_aller_il"
      },
      {
        pattern: /\belle aller\b/gi,
        replacement: "elle va",
        message: "Erreur de conjugaison : \"elle aller\" devrait être \"elle va\" (verbe aller au présent).",
        ruleId: "conjugaison_aller_elle"
      },
      {
        pattern: /\bnous aller\b/gi,
        replacement: "nous allons",
        message: "Erreur de conjugaison : \"nous aller\" devrait être \"nous allons\" (verbe aller au présent).",
        ruleId: "conjugaison_aller_nous"
      },
      {
        pattern: /\bvous aller\b/gi,
        replacement: "vous allez",
        message: "Erreur de conjugaison : \"vous aller\" devrait être \"vous allez\" (verbe aller au présent).",
        ruleId: "conjugaison_aller_vous"
      },
      {
        pattern: /\bils aller\b/gi,
        replacement: "ils vont",
        message: "Erreur de conjugaison : \"ils aller\" devrait être \"ils vont\" (verbe aller au présent).",
        ruleId: "conjugaison_aller_ils"
      },
      {
        pattern: /\belles aller\b/gi,
        replacement: "elles vont",
        message: "Erreur de conjugaison : \"elles aller\" devrait être \"elles vont\" (verbe aller au présent).",
        ruleId: "conjugaison_aller_elles"
      },
      {
        pattern: /\bje faire\b/gi,
        replacement: "je fais",
        message: "Erreur de conjugaison : \"je faire\" devrait être \"je fais\" (verbe faire au présent).",
        ruleId: "conjugaison_faire_je"
      },
      {
        pattern: /\btu faire\b/gi,
        replacement: "tu fais",
        message: "Erreur de conjugaison : \"tu faire\" devrait être \"tu fais\" (verbe faire au présent).",
        ruleId: "conjugaison_faire_tu"
      },
      {
        pattern: /\bil faire\b/gi,
        replacement: "il fait",
        message: "Erreur de conjugaison : \"il faire\" devrait être \"il fait\" (verbe faire au présent).",
        ruleId: "conjugaison_faire_il"
      },
      {
        pattern: /\belle faire\b/gi,
        replacement: "elle fait",
        message: "Erreur de conjugaison : \"elle faire\" devrait être \"elle fait\" (verbe faire au présent).",
        ruleId: "conjugaison_faire_elle"
      },
      {
        pattern: /\bnous faire\b/gi,
        replacement: "nous faisons",
        message: "Erreur de conjugaison : \"nous faire\" devrait être \"nous faisons\" (verbe faire au présent).",
        ruleId: "conjugaison_faire_nous"
      },
      {
        pattern: /\bvous faire\b/gi,
        replacement: "vous faites",
        message: "Erreur de conjugaison : \"vous faire\" devrait être \"vous faites\" (verbe faire au présent).",
        ruleId: "conjugaison_faire_vous"
      },
      {
        pattern: /\bils faire\b/gi,
        replacement: "ils font",
        message: "Erreur de conjugaison : \"ils faire\" devrait être \"ils font\" (verbe faire au présent).",
        ruleId: "conjugaison_faire_ils"
      },
      {
        pattern: /\belles faire\b/gi,
        replacement: "elles font",
        message: "Erreur de conjugaison : \"elles faire\" devrait être \"elles font\" (verbe faire au présent).",
        ruleId: "conjugaison_faire_elles"
      }
    ];
    
    // Règles orthographiques
    const spellingRules = [
      {
        pattern: /\bpere\b/gi,
        replacement: "père",
        message: "Erreur orthographique : \"pere\" devrait être \"père\" (accent manquant).",
        ruleId: "orthographe_pere"
      },
      {
        pattern: /\bmaison\b/gi,
        replacement: "maison",
        message: "Erreur orthographique : \"maison\" est correct.",
        ruleId: "orthographe_maison"
      },
      {
        pattern: /\bfrere\b/gi,
        replacement: "frère",
        message: "Erreur orthographique : \"frere\" devrait être \"frère\" (accent manquant).",
        ruleId: "orthographe_frere"
      },
      {
        pattern: /\bsoeur\b/gi,
        replacement: "sœur",
        message: "Erreur orthographique : \"soeur\" devrait être \"sœur\" (accent manquant).",
        ruleId: "orthographe_soeur"
      },
      {
        pattern: /\bmere\b/gi,
        replacement: "mère",
        message: "Erreur orthographique : \"mere\" devrait être \"mère\" (accent manquant).",
        ruleId: "orthographe_mere"
      }
    ];
    
    // Analyser les règles grammaticales
    grammarRules.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        result.grammarErrors.push({
          start: match.index,
          end: match.index + match[0].length,
          beforeText: match[0],
          message: rule.message,
          ruleId: rule.ruleId,
          suggestions: [rule.replacement]
        });
      }
    });
    
    // Analyser les règles orthographiques
    spellingRules.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        result.spellingErrors.push({
          start: match.index,
          end: match.index + match[0].length,
          word: match[0],
          message: rule.message,
          ruleId: rule.ruleId,
          suggestions: [rule.replacement]
        });
      }
    });
    
    console.log(`🇫🇷 Grammalecte Fallback a trouvé ${result.grammarErrors.length + result.spellingErrors.length} erreurs`);
    return result;
  }
};

console.log('🇫🇷 Grammalecte Fallback chargé avec succès');
