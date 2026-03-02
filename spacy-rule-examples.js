// Exemples concrets de règles personnalisées spaCy
// Ce fichier montre comment coder des règles spécifiques pour les erreurs courantes des étudiants

console.log('📚 Exemples de règles personnalisées spaCy');

// ==========================================
// EXEMPLE 1: Accord sujet-verbe (pluriel)
// ==========================================
const accordSujetVerbeRule = {
  name: 'accord_sujet_verbe_pluriel',
  description: 'Si le sujet est au pluriel et que le verbe est au singulier, affiche une alerte',
  
  // Pattern spaCy (Matcher)
  pattern: [
    {
      'RIGHT_ID': 'subject',
      'RIGHT_ATTRS': {
        'POS': 'NOUN',           // Nom
        'MORPH': {'Number': 'Plur'}  // Au pluriel
      }
    },
    {
      'LEFT_ID': 'subject',
      'REL_OP': '>',            // Dépendance: sujet → verbe
      'RIGHT_ATTRS': {
        'POS': 'VERB',           // Verbe
        'MORPH': {'Number': 'Sing'}  // Au singulier (erreur!)
      }
    }
  ],
  
  // Action à exécuter
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const subject = doc[match[1]];  // Token du sujet
      const verb = doc[match[2]];     // Token du verbe
      
      console.log(`🎯 Sujet: "${subject.text}" (pluriel) + Verbe: "${verb.text}" (singulier) = ERREUR!`);
      
      errors.push({
        type: 'accord_sujet_verbe',
        word: verb.text,
        correction: getCorrectVerbForm(verb.lemma, 'Plur'),
        explanation: `Le sujet "${subject.text}" est au pluriel mais le verbe "${verb.text}" est au singulier.`,
        severity: 'high',
        confidence: 0.95
      });
    });
    
    return errors;
  }
};

// ==========================================
// EXEMPLE 2: Participe passé avec avoir
// ==========================================
const participePasseRule = {
  name: 'accord_participe_passe_avoir',
  description: 'Vérifie l\'accord du participe passé avec avoir quand le COD est avant',
  
  pattern: [
    {
      'RIGHT_ID': 'auxiliary',
      'RIGHT_ATTRS': {
        'LEMMA': 'avoir',
        'POS': 'AUX'
      }
    },
    {
      'LEFT_ID': 'auxiliary',
      'REL_OP': '>',
      'RIGHT_ATTRS': {
        'POS': 'VERB',
        'MORPH': {'Tense': 'Past', 'Gender': 'Masc', 'Number': 'Sing'}
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const auxiliary = doc[match[1]];
      const participe = doc[match[2]];
      
      // Chercher le COD avant le verbe
      const cod = findCODBeforeVerb(doc, participe);
      
      if (cod && cod.morph.Number === 'Plur') {
        console.log(`🎯 COD "${cod.text}" (pluriel) avant participe "${participe.text}" = ERREUR d'accord!`);
        
        errors.push({
          type: 'accord_participe_passe',
          word: participe.text,
          correction: participe.text + 's',
          explanation: `Le COD "${cod.text}" est au pluriel et placé avant le verbe. Le participe passé doit s'accorder.`,
          severity: 'high',
          confidence: 0.90
        });
      }
    });
    
    return errors;
  }
};

// ==========================================
// EXEMPLE 3: c'est vs ce sont
// ==========================================
const cEstCeSontRule = {
  name: 'c_est_ce_sont',
  description: 'Détecte l\'utilisation incorrecte de "c\'est" au lieu de "ce sont"',
  
  pattern: [
    {
      'RIGHT_ID': 'determinant',
      'RIGHT_ATTRS': {
        'POS': 'DET',
        'MORPH': {'Number': 'Plur'}  // Déterminant pluriel
      }
    },
    {
      'LEFT_ID': 'determinant',
      'REL_OP': '>',
      'RIGHT_ATTRS': {
        'LEMMA': 'être',
        'POS': 'VERB',
        'MORPH': {'Number': 'Sing'}  // Verbe singulier (erreur!)
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const determinant = doc[match[1]];
      const verb = doc[match[2]];
      
      console.log(`🎯 Déterminant "${determinant.text}" (pluriel) + Verbe "${verb.text}" (singulier) = ERREUR!`);
      
      errors.push({
        type: 'c_est_ce_sont',
        word: verb.text,
        correction: 'sont',
        explanation: `Avec le déterminant "${determinant.text}" au pluriel, il faut "ce sont" et non "${verb.text}".`,
        severity: 'medium',
        confidence: 0.85
      });
    });
    
    return errors;
  }
};

// ==========================================
// EXEMPLE 4: Pléonasmes
// ==========================================
const pleonasmeRule = {
  name: 'pleonasmes',
  description: 'Détecte les pléonasmes courants',
  
  patterns: [
    // Monter en haut
    [
      {'RIGHT_ID': 'verb', 'RIGHT_ATTRS': {'LEMMA': 'monter'}},
      {'LEFT_ID': 'verb', 'REL_OP': '>', 'RIGHT_ATTRS': {'LEMMA': 'haut', 'POS': 'ADV'}}
    ],
    // Descendre en bas
    [
      {'RIGHT_ID': 'verb', 'RIGHT_ATTRS': {'LEMMA': 'descendre'}},
      {'LEFT_ID': 'verb', 'REL_OP': '>', 'RIGHT_ATTRS': {'LEMMA': 'bas', 'POS': 'ADV'}}
    ],
    // Sortir dehors
    [
      {'RIGHT_ID': 'verb', 'RIGHT_ATTRS': {'LEMMA': 'sortir'}},
      {'LEFT_ID': 'verb', 'REL_OP': '>', 'RIGHT_ATTRS': {'LEMMA': 'dehors', 'POS': 'ADV'}}
    ]
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const verb = doc[match[1]];
      const adverb = doc[match[2]];
      
      const pleonasme = verb.text + ' ' + adverb.text;
      console.log(`🎯 Pléonasme détecté: "${pleonasme}"`);
      
      errors.push({
        type: 'pleonasme',
        word: pleonasme,
        correction: verb.text,
        explanation: `Pléonasme : "${pleonasme}" est redondant. Le verbe "${verb.text}" contient déjà l'idée de "${adverb.text}".`,
        severity: 'medium',
        confidence: 0.80
      });
    });
    
    return errors;
  }
};

// ==========================================
// EXEMPLE 5: Conjugaisons incorrectes
// ==========================================
const conjugaisonRule = {
  name: 'conjugaisons_incorrectes',
  description: 'Détecte les conjugaisons incorrectes courantes',
  
  patterns: [
    // nous est → nous sommes
    [
      {'RIGHT_ID': 'subject', 'RIGHT_ATTRS': {'TEXT': 'nous', 'POS': 'PRON'}},
      {'LEFT_ID': 'subject', 'REL_OP': '>', 'RIGHT_ATTRS': {'LEMMA': 'être', 'TEXT': 'est'}}
    ],
    // vous est → vous êtes
    [
      {'RIGHT_ID': 'subject', 'RIGHT_ATTRS': {'TEXT': 'vous', 'POS': 'PRON'}},
      {'LEFT_ID': 'subject', 'REL_OP': '>', 'RIGHT_ATTRS': {'LEMMA': 'être', 'TEXT': 'est'}}
    ],
    // ils est → ils sont
    [
      {'RIGHT_ID': 'subject', 'RIGHT_ATTRS': {'TEXT': 'ils', 'POS': 'PRON'}},
      {'LEFT_ID': 'subject', 'REL_OP': '>', 'RIGHT_ATTRS': {'LEMMA': 'être', 'TEXT': 'est'}}
    ]
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const subject = doc[match[1]];
      const verb = doc[match[2]];
      
      const correctForm = getCorrectConjugation(subject.text, verb.lemma);
      console.log(`🎯 "${subject.text} ${verb.text}" → "${subject.text} ${correctForm}"`);
      
      errors.push({
        type: 'conjugaison',
        word: verb.text,
        correction: correctForm,
        explanation: `Erreur de conjugaison : avec "${subject.text}", le verbe "${verb.lemma}" se conjugue "${correctForm}".`,
        severity: 'high',
        confidence: 0.95
      });
    });
    
    return errors;
  }
};

// ==========================================
// EXEMPLE 6: Homophones contextuels
// ==========================================
const homophoneRule = {
  name: 'homophones_contextuels',
  description: 'Détecte les mauvais homophones selon le contexte',
  
  // Cette règle utilise l'analyse contextuelle plutôt que des patterns fixes
  action: function(doc) {
    const errors = [];
    
    doc.forEach((token, i) => {
      // et vs est
      if (token.text === 'et' && token.pos === 'VERB') {
        console.log(`🎯 "et" utilisé comme verbe = ERREUR!`);
        errors.push({
          type: 'homophone',
          word: 'et',
          correction: 'est',
          explanation: '"et" est une conjonction de coordination, pas un verbe. Utilisez "est" (verbe être).',
          severity: 'medium',
          confidence: 0.85
        });
      }
      
      if (token.text === 'est' && token.pos === 'CCONJ') {
        console.log(`🎯 "est" utilisé comme conjonction = ERREUR!`);
        errors.push({
          type: 'homophone',
          word: 'est',
          correction: 'et',
          explanation: '"est" est un verbe, pas une conjonction. Utilisez "et" pour relier des mots.',
          severity: 'medium',
          confidence: 0.85
        });
      }
      
      // a vs à
      if (token.text === 'a' && token.pos === 'ADP') {
        console.log(`🎯 "a" utilisé comme préposition = ERREUR!`);
        errors.push({
          type: 'homophone',
          word: 'a',
          correction: 'à',
          explanation: '"a" est un verbe (avoir), pas une préposition. Utilisez "à" pour indiquer une direction.',
          severity: 'medium',
          confidence: 0.85
        });
      }
      
      if (token.text === 'à' && token.pos === 'AUX') {
        console.log(`🎯 "à" utilisé comme verbe = ERREUR!`);
        errors.push({
          type: 'homophone',
          word: 'à',
          correction: 'a',
          explanation: '"à" est une préposition, pas un verbe. Utilisez "a" (verbe avoir).',
          severity: 'medium',
          confidence: 0.85
        });
      }
    });
    
    return errors;
  }
};

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

function getCorrectVerbForm(lemma, number) {
  const conjugations = {
    'être': {
      'Plur': {
        'Pres': 'sont',
        'Imp': 'étaient',
        'Fut': 'seront'
      }
    },
    'avoir': {
      'Plur': {
        'Pres': 'ont',
        'Imp': 'avaient',
        'Fut': 'auront'
      }
    },
    'aller': {
      'Plur': {
        'Pres': 'vont',
        'Imp': 'allaient',
        'Fut': 'iront'
      }
    }
  };
  
  return conjugations[lemma]?.[number]?.['Pres'] || lemma;
}

function getCorrectConjugation(subject, verbLemma) {
  const conjugations = {
    'nous': {
      'être': 'sommes',
      'avoir': 'avons',
      'aller': 'allons',
      'faire': 'faisons'
    },
    'vous': {
      'être': 'êtes',
      'avoir': 'avez',
      'aller': 'allez',
      'faire': 'faites'
    },
    'ils': {
      'être': 'sont',
      'avoir': 'ont',
      'aller': 'vont',
      'faire': 'font'
    },
    'elles': {
      'être': 'sont',
      'avoir': 'ont',
      'aller': 'vont',
      'faire': 'font'
    }
  };
  
  return conjugations[subject]?.[verbLemma] || verbLemma;
}

function findCODBeforeVerb(doc, verb) {
  // Chercher le COD (complément d'objet direct) avant le verbe
  for (let i = verb.i - 1; i >= 0; i--) {
    const token = doc[i];
    if (token.dep === 'obj' && token.head === verb) {
      return token;
    }
  }
  return null;
}

// ==========================================
// UTILISATION DES RÈGLES
// ==========================================

function applyCustomRules(doc) {
  console.log('🔧 Application des règles personnalisées...');
  
  const allErrors = [];
  const rules = [
    accordSujetVerbeRule,
    participePasseRule,
    cEstCeSontRule,
    pleonasmeRule,
    conjugaisonRule,
    homophoneRule
  ];
  
  rules.forEach(rule => {
    console.log(`📝 Vérification: ${rule.description}`);
    
    // Pour les règles avec patterns
    if (rule.patterns || rule.pattern) {
      const patterns = rule.patterns || [rule.pattern];
      
      patterns.forEach(pattern => {
        const matches = findMatches(doc, pattern);
        if (matches.length > 0) {
          console.log(`🎯 ${matches.length} correspondances trouvées`);
          const ruleErrors = rule.action(doc, matches);
          allErrors.push(...ruleErrors);
        }
      });
    } else {
      // Pour les règles sans patterns (comme les homophones)
      const ruleErrors = rule.action(doc);
      allErrors.push(...ruleErrors);
    }
  });
  
  console.log(`✅ ${allErrors.length} erreurs trouvées au total`);
  return allErrors;
}

function findMatches(doc, pattern) {
  // Simulation du Matcher de spaCy
  const matches = [];
  
  if (pattern.length === 2) {
    for (let i = 0; i < doc.length - 1; i++) {
      const token1 = doc[i];
      const token2 = doc[i + 1];
      
      if (matchesPattern(token1, pattern[0]) && matchesPattern(token2, pattern[1])) {
        matches.push([0, i, i + 1]);
      }
    }
  }
  
  return matches;
}

function matchesPattern(token, pattern) {
  for (const [attr, value] of Object.entries(pattern.RIGHT_ATTRS)) {
    if (attr === 'POS' && token.pos !== value) return false;
    if (attr === 'LEMMA' && token.lemma !== value) return false;
    if (attr === 'TEXT' && token.text !== value) return false;
    if (attr === 'MORPH' && !matchesMorphology(token.morph, value)) return false;
  }
  return true;
}

function matchesMorphology(tokenMorph, patternMorph) {
  for (const [attr, value] of Object.entries(patternMorph)) {
    if (tokenMorph[attr] !== value) return false;
  }
  return true;
}

// Export des exemples
window.SpacyRuleExamples = {
  accordSujetVerbeRule,
  participePasseRule,
  cEstCeSontRule,
  pleonasmeRule,
  conjugaisonRule,
  homophoneRule,
  applyCustomRules
};

console.log('📚 Exemples de règles spaCy chargés');
