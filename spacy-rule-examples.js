// Exemples concrets de règles personnalisées spaCy - Version étendue
console.log('📚 Exemples de règles personnalisées spaCy - Version étendue');

// === EXEMPLES ÉTENDUS DE RÈGLES PERSONNALISÉES ===

// Exemple 1: Accord sujet-verbe avancé
const accordSujetVerbeRule = {
  name: 'accord_sujet_verbe_avance',
  description: 'Détecte les erreurs d\'accord sujet-verbe complexes',
  
  pattern: [
    {
      'RIGHT_ID': 'subject',
      'RIGHT_ATTRS': {
        'POS': 'NOUN',
        'MORPH': {'Number': 'Plur'}
      }
    },
    {
      'LEFT_ID': 'subject',
      'REL_OP': '>',
      'RIGHT_ATTRS': {
        'POS': 'VERB',
        'MORPH': {'Number': 'Sing'}
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const subject = doc[match[1]];
      const verb = doc[match[2]];
      
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

// Exemple 2: Participe passé avec COD multiple
const participePasseMultipleRule = {
  name: 'accord_participe_passe_multiple',
  description: 'Vérifie l\'accord du participe passé avec plusieurs COD',
  
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
        'MORPH': {'Tense': 'Past'}
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const auxiliary = doc[match[1]];
      const participe = doc[match[2]];
      
      // Chercher tous les COD avant le verbe
      const cods = findAllCODsBeforeVerb(doc, participe);
      
      cods.forEach(cod => {
        if (cod.morph.Number === 'Plur') {
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
    });
    
    return errors;
  }
};

// Exemple 3: Emploi des temps composés
const tempsComposesRule = {
  name: 'temps_composes',
  description: 'Détecte les erreurs dans l\'emploi des temps composés',
  
  pattern: [
    {
      'RIGHT_ID': 'auxiliary',
      'RIGHT_ATTRS': {
        'POS': 'AUX',
        'LEMMA': {'IN': ['avoir', 'être']}
      }
    },
    {
      'LEFT_ID': 'auxiliary',
      'REL_OP': '>',
      'RIGHT_ATTRS': {
        'POS': 'VERB',
        'MORPH': {'Tense': 'Inf'}
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const auxiliary = doc[match[1]];
      const participe = doc[match[2]];
      
      console.log(`🎯 Auxiliaire "${auxiliary.text}" + Participe "${participe.text}" = ERREUR!`);
      
      errors.push({
        type: 'temps_compose',
        word: auxiliary.text + ' ' + participe.text,
        correction: auxiliary.text + ' ' + getCorrectParticipe(participe.lemma),
        explanation: `Avec l'auxiliaire "${auxiliary.text}", il faut utiliser le participe passé "${getCorrectParticipe(participe.lemma)}" au lieu de l'infinitif "${participe.text}".`,
        severity: 'high',
        confidence: 0.95
      });
    });
    
    return errors;
  }
};

// Exemple 4: Emploi du subjonctif
const subjonctifRule = {
  name: 'subjonctif',
  description: 'Détecte les erreurs dans l\'emploi du subjonctif',
  
  pattern: [
    {
      'RIGHT_ID': 'subjonctif_marker',
      'RIGHT_ATTRS': {
        'TEXT': {'IN': ['que', 'pour que', 'afin que', 'bien que']}
      }
    },
    {
      'LEFT_ID': 'subjonctif_marker',
      'REL_OP': '>',
      'RIGHT_ATTRS': {
        'POS': 'VERB',
        'MORPH': {'Mood': 'Ind'}
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const marker = doc[match[1]];
      const verb = doc[match[2]];
      
      console.log(`🎯 "${marker.text}" + Verbe "${verb.text}" (indicatif) = ERREUR!`);
      
      errors.push({
        type: 'subjonctif',
        word: verb.text,
        correction: getSubjonctifForm(verb.lemma),
        explanation: `Avec "${marker.text}", il faut utiliser le subjonctif "${getSubjonctifForm(verb.lemma)}" au lieu de l'indicatif "${verb.text}".`,
        severity: 'medium',
        confidence: 0.85
      });
    });
    
    return errors;
  }
};

// Exemple 5: Emploi du conditionnel
const conditionnelRule = {
  name: 'conditionnel',
  description: 'Détecte les erreurs dans l\'emploi du conditionnel',
  
  pattern: [
    {
      'RIGHT_ID': 'conditionnel_marker',
      'RIGHT_ATTRS': {
        'TEXT': {'IN': ['si', 'quand', 'lorsque', 'dès que']}
      }
    },
    {
      'LEFT_ID': 'conditionnel_marker',
      'REL_OP': '>',
      'RIGHT_ATTRS': {
        'POS': 'VERB',
        'MORPH': {'Mood': 'Ind'}
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const marker = doc[match[1]];
      const verb = doc[match[2]];
      
      console.log(`🎯 "${marker.text}" + Verbe "${verb.text}" (indicatif) = ERREUR!`);
      
      errors.push({
        type: 'conditionnel',
        word: verb.text,
        correction: getConditionnelForm(verb.lemma),
        explanation: `Avec "${marker.text}", il faut utiliser le conditionnel "${getConditionnelForm(verb.lemma)}" au lieu de l'indicatif "${verb.text}".`,
        severity: 'medium',
        confidence: 0.85
      });
    });
    
    return errors;
  }
};

// Exemple 6: Emploi des prépositions
const prepositionsRule = {
  name: 'prepositions',
  description: 'Détecte les erreurs dans l\'emploi des prépositions',
  
  pattern: [
    {
      'RIGHT_ID': 'preposition',
      'RIGHT_ATTRS': {
        'POS': 'ADP'
      }
    },
    {
      'LEFT_ID': 'preposition',
      'REL_OP': '>',
      'RIGHT_ATTRS': {
        'POS': 'NOUN',
        'DEP': 'obj'
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const preposition = doc[match[1]];
      const noun = doc[match[2]];
      
      const correctPreposition = getCorrectPreposition(preposition.text, noun.lemma);
      
      if (correctPreposition !== preposition.text) {
        console.log(`🎯 "${preposition.text}" + "${noun.text}" = ERREUR!`);
        
        errors.push({
          type: 'preposition',
          word: preposition.text,
          correction: correctPreposition,
          explanation: `Avec "${noun.text}", il faut utiliser "${correctPreposition}" au lieu de "${preposition.text}".`,
          severity: 'low',
          confidence: 0.75
        });
      }
    });
    
    return errors;
  }
};

// Exemple 7: Emploi des déterminants
const determinantsRule = {
  name: 'determinants',
  description: 'Détecte les erreurs dans l\'emploi des déterminants',
  
  pattern: [
    {
      'RIGHT_ID': 'determinant',
      'RIGHT_ATTRS': {
        'POS': 'DET'
      }
    },
    {
      'LEFT_ID': 'determinant',
      'REL_OP': '>',
      'RIGHT_ATTRS': {
        'POS': 'NOUN',
        'MORPH': {'Gender': 'Masc'}
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const determiner = doc[match[1]];
      const noun = doc[match[2]];
      
      // Vérifier l'accord genre
      if (determiner.morph.Gender === 'Fem' && noun.morph.Gender === 'Masc') {
        console.log(`🎯 "${determiner.text}" (féminin) + "${noun.text}" (masculin) = ERREUR!`);
        
        errors.push({
          type: 'accord_genre',
          word: determiner.text,
          correction: getMasculineForm(determiner.text),
          explanation: `Le nom "${noun.text}" est masculin, il faut utiliser le déterminant masculin "${getMasculineForm(determiner.text)}" au lieu de "${determiner.text}".`,
          severity: 'medium',
          confidence: 0.85
        });
      }
    });
    
    return errors;
  }
};

// Exemple 8: Emploi des pronoms
const pronomsRule = {
  name: 'pronoms',
  description: 'Détecte les erreurs dans l\'emploi des pronoms',
  
  pattern: [
    {
      'RIGHT_ID': 'pronoun',
      'RIGHT_ATTRS': {
        'POS': 'PRON'
      }
    },
    {
      'LEFT_ID': 'pronoun',
      'REL_OP': '>',
      'RIGHT_ATTRS': {
        'POS': 'VERB',
        'MORPH': {'Number': 'Sing'}
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const pronoun = doc[match[1]];
      const verb = doc[match[2]];
      
      // Vérifier l'accord nombre
      if (pronoun.morph.Number === 'Plur' && verb.morph.Number === 'Sing') {
        console.log(`🎯 "${pronoun.text}" (pluriel) + "${verb.text}" (singulier) = ERREUR!`);
        
        errors.push({
          type: 'accord_nombre',
          word: verb.text,
          correction: getPluralForm(verb.text),
          explanation: `Le pronom "${pronoun.text}" est au pluriel, le verbe doit s'accorder: "${getPluralForm(verb.text)}".`,
          severity: 'high',
          confidence: 0.90
        });
      }
    });
    
    return errors;
  }
};

// Exemple 9: Emploi des adjectifs
const adjectifsRule = {
  name: 'adjectifs',
  description: 'Détecte les erreurs dans l\'emploi des adjectifs',
  
  pattern: [
    {
      'RIGHT_ID': 'adjective',
      'RIGHT_ATTRS': {
        'POS': 'ADJ'
      }
    },
    {
      'LEFT_ID': 'adjective',
      'REL_OP': '>',
      'RIGHT_ATTRS': {
        'POS': 'NOUN',
        'MORPH': {'Gender': 'Fem'}
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const adjective = doc[match[1]];
      const noun = doc[match[2]];
      
      // Vérifier l'accord genre
      if (adjective.morph.Gender === 'Masc' && noun.morph.Gender === 'Fem') {
        console.log(`🎯 "${adjective.text}" (masculin) + "${noun.text}" (féminin) = ERREUR!`);
        
        errors.push({
          type: 'accord_genre',
          word: adjective.text,
          correction: getFeminineForm(adjective.text),
          explanation: `Le nom "${noun.text}" est féminin, l'adjectif doit s'accorder: "${getFeminineForm(adjective.text)}".`,
          severity: 'medium',
          confidence: 0.85
        });
      }
    });
    
    return errors;
  }
};

// Exemple 10: Emploi des adverbes
const adverbesRule = {
  name: 'adverbes',
  description: 'Détecte les erreurs dans l\'emploi des adverbes',
  
  pattern: [
    {
      'RIGHT_ID': 'adverb',
      'RIGHT_ATTRS': {
        'POS': 'ADV'
      }
    },
    {
      'LEFT_ID': 'adverb',
      'REL_OP': '>',
      'RIGHT_ATTRS': {
        'POS': 'VERB'
      }
    }
  ],
  
  action: function(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const adverb = doc[match[1]];
      const verb = doc[match[2]];
      
      // Vérifier la position de l'adverbe
      if (adverb.i > verb.i) {
        console.log(`🎯 "${verb.text}" + "${adverb.text}" (après le verbe) = ERREUR!`);
        
        errors.push({
          type: 'position_adverbe',
          word: adverb.text,
          correction: adverb.text + ' ' + verb.text,
          explanation: `L'adverbe "${adverb.text}" doit généralement être placé avant le verbe "${verb.text}".`,
          severity: 'low',
          confidence: 0.70
        });
      }
    });
    
    return errors;
  }
};

// === FONCTIONS UTILITAIRES ÉTENDUES ===

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
    },
    'faire': {
      'Plur': {
        'Pres': 'font',
        'Imp': 'faisaient',
        'Fut': 'feront'
      }
    }
  };
  
  return conjugations[lemma]?.[number]?.['Pres'] || lemma;
}

function getCorrectParticipe(lemma) {
  const participes = {
    'aller': 'allé',
    'venir': 'venu',
    'voir': 'vu',
    'savoir': 'su',
    'pouvoir': 'pu',
    'vouloir': 'voulu',
    'devoir': 'dû',
    'recevoir': 'reçu',
    'croire': 'cru',
    'mourir': 'mort',
    'courir': 'couru',
    'ouvrir': 'ouvert',
    'offrir': 'offert',
    'couvrir': 'couvert',
    'souffrir': 'souffert'
  };
  
  return participes[lemma] || lemma + 'é';
}

function getSubjonctifForm(lemma) {
  const subjonctif = {
    'être': 'soit',
    'avoir': 'ait',
    'aller': 'aille',
    'faire': 'fasse',
    'voir': 'voie',
    'savoir': 'sache',
    'pouvoir': 'puisse',
    'vouloir': 'veuille',
    'devoir': 'doive',
    'recevoir': 'reçoive'
  };
  
  return subjonctif[lemma] || lemma;
}

function getConditionnelForm(lemma) {
  const conditionnel = {
    'être': 'serait',
    'avoir': 'aurait',
    'aller': 'irait',
    'faire': 'ferait',
    'voir': 'verrait',
    'savoir': 'saurait',
    'pouvoir': 'pourrait',
    'vouloir': 'voudrait',
    'devoir': 'devrait',
    'recevoir': 'recevrait'
  };
  
  return conditionnel[lemma] || lemma + 'rait';
}

function getCorrectPreposition(currentPreposition, nounLemma) {
  const prepositionRules = {
    'aller': 'à',
    'venir': 'de',
    'penser': 'à',
    'parler': 'de',
    'réfléchir': 'à',
    'décider': 'de',
    'rêver': 'de',
    'croire': 'en',
    'espérer': 'en',
    'attendre': 'pour',
    'participer': 'à',
    'assister': 'à',
    's\'intéresser': 'à',
    'obéir': 'à',
    'désobéir': 'à',
    'ressembler': 'à',
    'plaire': 'à',
    'manquer': 'à',
    'échapper': 'de',
    'sortir': 'de',
    'entrer': 'dans',
    'monter': 'sur',
    'descendre': 'de'
  };
  
  return prepositionRules[nounLemma] || currentPreposition;
}

function getMasculineForm(feminineWord) {
  const masculineForms = {
    'une': 'un',
    'la': 'le',
    'cette': 'ce',
    'ma': 'mon',
    'ta': 'ton',
    'sa': 'son'
  };
  
  return masculineForms[feminineWord] || feminineWord;
}

function getPluralForm(singularWord) {
  const pluralForms = {
    'est': 'sont',
    'a': 'ont',
    'va': 'vont',
    'fait': 'font',
    'dit': 'disent',
    'faisait': 'faisaient',
    'allait': 'allaient',
    'avait': 'avaient'
  };
  
  return pluralForms[singularWord] || singularWord + 's';
}

function getFeminineForm(masculineWord) {
  const feminineForms = {
    'beau': 'belle',
    'nouveau': 'nouvelle',
    'vieux': 'vieille',
    'gentil': 'gentille',
    'grand': 'grande',
    'petit': 'petite',
    'bon': 'bonne',
    'joli': 'jolie',
    'gros': 'grosse',
    'long': 'longue',
    'blanc': 'blanche',
    'noir': 'noire',
    'rouge': 'rouge',
    'vert': 'verte',
    'bleu': 'bleue',
    'jaune': 'jaune',
    'gris': 'grise',
    'chaud': 'chaude',
    'froid': 'froide',
    'jeune': 'jeune',
    'vieux': 'vieille',
    'nouveau': 'nouvelle',
    'beau': 'belle'
  };
  
  return feminineForms[masculineWord] || masculineWord + 'e';
}

function findAllCODsBeforeVerb(doc, verb) {
  const cods = [];
  
  for (let i = verb.i - 1; i >= 0; i--) {
    const token = doc[i];
    if (token.dep === 'obj' && token.head === verb) {
      cods.push(token);
    }
  }
  
  return cods;
}

// === UTILISATION DES RÈGLES ÉTENDUES ===

function applyExtendedCustomRules(doc) {
  console.log('🔧 Application des règles personnalisées étendues...');
  
  const allErrors = [];
  const rules = [
    accordSujetVerbeRule,
    participePasseMultipleRule,
    tempsComposesRule,
    subjonctifRule,
    conditionnelRule,
    prepositionsRule,
    determinantsRule,
    pronomsRule,
    adjectifsRule,
    adverbesRule
  ];
  
  rules.forEach(rule => {
    console.log(`📝 Vérification: ${rule.description}`);
    
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
      const ruleErrors = rule.action(doc);
      allErrors.push(...ruleErrors);
    }
  });
  
  console.log(`✅ ${allErrors.length} erreurs trouvées au total`);
  return allErrors;
}

function findMatches(doc, pattern) {
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

// Export des exemples étendus
window.SpacyRuleExamples = {
  accordSujetVerbeRule,
  participePasseMultipleRule,
  tempsComposesRule,
  subjonctifRule,
  conditionnelRule,
  prepositionsRule,
  determinantsRule,
  pronomsRule,
  adjectifsRule,
  adverbesRule,
  applyExtendedCustomRules
};

console.log('📚 Exemples de règles spaCy étendus chargés');
