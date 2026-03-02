// Moteur de règles personnalisées pour spaCy lg - Version corrigée
class SpacyCustomRules {
  constructor() {
    this.rules = [];
    this.matcher = null;
    this.dependencyMatcher = null;
    this.initializeRules();
  }

  // Initialisation des règles personnalisées
  initializeRules() {
    console.log('🔧 Initialisation des règles personnalisées spaCy...');
    
    // Règle 1: Accord sujet-verbe (pluriel/singulier)
    this.addRule({
      name: 'accord_sujet_verbe_pluriel',
      description: 'Détecte quand le sujet est au pluriel mais le verbe est au singulier',
      severity: 'high',
      confidence: 0.95,
      pattern: this.createSubjectVerbAgreementPattern(),
      action: this.checkSubjectVerbAgreement.bind(this)
    });

    // Règle 2: Participe passé avec avoir + COD avant
    this.addRule({
      name: 'accord_participe_passe_cod',
      description: 'Détecte l\'accord du participe passé avec avoir quand le COD est avant',
      severity: 'high',
      confidence: 0.90,
      pattern: this.createParticipePassePattern(),
      action: this.checkParticipePasseAgreement.bind(this)
    });

    // Règle 3: c'est vs ce sont
    this.addRule({
      name: 'c_est_ce_sont',
      description: 'Détecte l\'utilisation incorrecte de "c\'est" au lieu de "ce sont"',
      severity: 'medium',
      confidence: 0.85,
      pattern: this.createCEstPattern(),
      action: this.checkCEstCeSont.bind(this)
    });

    // Règle 4: Pléonasmes courants
    this.addRule({
      name: 'pleonasmes',
      description: 'Détecte les pléonasmes courants',
      severity: 'medium',
      confidence: 0.80,
      pattern: this.createPleonasmePattern(),
      action: this.checkPleonasmes.bind(this)
    });

    // Règle 5: Conjugaisons être/avoir incorrectes
    this.addRule({
      name: 'conjugaisons_etre_avoir',
      description: 'Détecte les conjugaisons incorrectes de être et avoir',
      severity: 'high',
      confidence: 0.95,
      pattern: this.createEtreAvoirPattern(),
      action: this.checkEtreAvoirConjugation.bind(this)
    });

    // Règle 6: Homophones contextuels
    this.addRule({
      name: 'homophones',
      description: 'Détecte les homophones mal utilisés selon le contexte',
      severity: 'medium',
      confidence: 0.85,
      pattern: this.createHomophonePattern(),
      action: this.checkHomophones.bind(this)
    });

    // Règle 7: Accord genre dans les groupes nominaux
    this.addRule({
      name: 'accord_genre_nominal',
      description: 'Détecte les erreurs d\'accord genre dans les groupes nominaux',
      severity: 'medium',
      confidence: 0.85,
      pattern: this.createGenreAgreementPattern(),
      action: this.checkGenreAgreement.bind(this)
    });

    // Règle 8: Emploi incorrect des prépositions
    this.addRule({
      name: 'prepositions_incorrectes',
      description: 'Détecte l\'emploi incorrect des prépositions',
      severity: 'low',
      confidence: 0.75,
      pattern: this.createPrepositionPattern(),
      action: this.checkPrepositions.bind(this)
    });

    console.log(`✅ ${this.rules.length} règles personnalisées initialisées`);
  }

  // PATTERNS SPA CY
  createSubjectVerbAgreementPattern() {
    return [
      {
        'RIGHT_ID': 'subject',
        'RIGHT_ATTRS': {'POS': 'NOUN', 'MORPH': {'Number': 'Plur'}}
      },
      {
        'LEFT_ID': 'subject',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'POS': 'VERB', 'MORPH': {'Number': 'Sing'}}
      }
    ];
  }

  createParticipePassePattern() {
    return [
      {
        'RIGHT_ID': 'auxiliary',
        'RIGHT_ATTRS': {'LEMMA': 'avoir', 'POS': 'AUX'}
      },
      {
        'LEFT_ID': 'auxiliary',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'POS': 'VERB', 'MORPH': {'Tense': 'Past', 'Gender': 'Masc', 'Number': 'Sing'}}
      }
    ];
  }

  createCEstPattern() {
    return [
      {
        'RIGHT_ID': 'determinant',
        'RIGHT_ATTRS': {'POS': 'DET', 'MORPH': {'Number': 'Plur'}}
      },
      {
        'LEFT_ID': 'determinant',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'LEMMA': 'être', 'POS': 'VERB', 'MORPH': {'Number': 'Sing'}}
      }
    ];
  }

  createPleonasmePattern() {
    return [
      {
        'RIGHT_ID': 'verb',
        'RIGHT_ATTRS': {'LEMMA': 'monter'}
      },
      {
        'LEFT_ID': 'verb',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'LEMMA': 'haut', 'POS': 'ADV'}
      }
    ];
  }

  createEtreAvoirPattern() {
    return [
      {
        'RIGHT_ID': 'subject',
        'RIGHT_ATTRS': {'POS': 'PRON', 'MORPH': {'Number': 'Plur', 'Person': '1'}}
      },
      {
        'LEFT_ID': 'subject',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'LEMMA': 'être', 'POS': 'VERB', 'MORPH': {'Number': 'Sing'}}
      }
    ];
  }

  createHomophonePattern() {
    return [
      {
        'RIGHT_ID': 'homophone',
        'RIGHT_ATTRS': {'TEXT': {'IN': ['et', 'est', 'son', 'sont', 'a', 'à']}}
      }
    ];
  }

  createGenreAgreementPattern() {
    return [
      {
        'RIGHT_ID': 'determinant',
        'RIGHT_ATTRS': {'POS': 'DET', 'MORPH': {'Gender': 'Fem'}}
      },
      {
        'LEFT_ID': 'determinant',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'POS': 'ADJ', 'MORPH': {'Gender': 'Masc'}}
      }
    ];
  }

  createPrepositionPattern() {
    return [
      {
        'RIGHT_ID': 'preposition',
        'RIGHT_ATTRS': {'POS': 'ADP'}
      },
      {
        'LEFT_ID': 'preposition',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'POS': 'NOUN', 'DEP': 'obj'}
      }
    ];
  }

  // ACTIONS DES RÈGLES
  checkSubjectVerbAgreement(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const subject = doc[match[1]];
      const verb = doc[match[2]];
      
      if (subject && verb) {
        const subjectNumber = subject.morph.Number;
        const verbNumber = verb.morph.Number;
        
        if (subjectNumber === 'Plur' && verbNumber === 'Sing') {
          const correctForm = this.getCorrectVerbForm(verb.lemma, 'Plur', verb.morph.Tense);
          
          errors.push({
            type: 'accord_sujet_verbe',
            word: verb.text,
            correction: correctForm,
            explanation: `Erreur d'accord sujet-verbe : le sujet "${subject.text}" est au pluriel mais le verbe "${verb.text}" est au singulier.`,
            offset: verb.idx,
            length: verb.text.length,
            severity: 'high',
            confidence: 0.95,
            rule: 'accord_sujet_verbe_pluriel'
          });
        }
      }
    });
    
    return errors;
  }

  checkParticipePasseAgreement(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const auxiliary = doc[match[1]];
      const participe = doc[match[2]];
      
      if (auxiliary && participe) {
        const cod = this.findCODBeforeVerb(doc, participe);
        
        if (cod && cod.morph.Number === 'Plur') {
          const correctedParticipe = participe.text + 's';
          
          errors.push({
            type: 'accord_participe_passe',
            word: participe.text,
            correction: correctedParticipe,
            explanation: `Erreur d'accord du participe passé : avec l'auxiliaire "avoir", le participe passé s'accorde avec le complément d'objet direct "${cod.text}" quand il est placé avant le verbe.`,
            offset: participe.idx,
            length: participe.text.length,
            severity: 'high',
            confidence: 0.90,
            rule: 'accord_participe_passe_cod'
          });
        }
      }
    });
    
    return errors;
  }

  checkCEstCeSont(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const determinant = doc[match[1]];
      const verb = doc[match[2]];
      
      if (determinant && verb && determinant.morph.Number === 'Plur') {
        errors.push({
          type: 'c_est_ce_sont',
          word: verb.text,
          correction: 'sont',
          explanation: `Erreur de démonstratif : avec un déterminant au pluriel comme "${determinant.text}", il faut utiliser "ce sont" au lieu de "${verb.text}".`,
          offset: verb.idx,
          length: verb.text.length,
          severity: 'medium',
          confidence: 0.85,
          rule: 'c_est_ce_sont'
        });
      }
    });
    
    return errors;
  }

  checkPleonasmes(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const verb = doc[match[1]];
      const adverb = doc[match[2]];
      
      if (verb && adverb) {
        const pleonasme = verb.text + ' ' + adverb.text;
        const correction = verb.text;
        
        errors.push({
          type: 'pleonasme',
          word: pleonasme,
          correction: correction,
          explanation: `Pléonasme : "${pleonasme}" est redondant. Le verbe "${verb.text}" contient déjà l'idée de "${adverb.text}".`,
          offset: verb.idx,
          length: pleonasme.length,
          severity: 'medium',
          confidence: 0.80,
          rule: 'pleonasmes'
        });
      }
    });
    
    return errors;
  }

  checkEtreAvoirConjugation(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const subject = doc[match[1]];
      const verb = doc[match[2]];
      
      if (subject && verb) {
        const correctConjugation = this.getCorrectPronounConjugation(subject.text, verb.lemma);
        
        if (correctConjugation !== verb.text) {
          errors.push({
            type: 'conjugaison',
            word: verb.text,
            correction: correctConjugation,
            explanation: `Erreur de conjugaison : avec le sujet "${subject.text}", le verbe "${verb.lemma}" devrait être "${correctConjugation}" au lieu de "${verb.text}".`,
            offset: verb.idx,
            length: verb.text.length,
            severity: 'high',
            confidence: 0.95,
            rule: 'conjugaisons_etre_avoir'
          });
        }
      }
    });
    
    return errors;
  }

  checkHomophones(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const token = doc[match[1]];
      
      if (token) {
        const correction = this.getHomophoneCorrection(token.text, token, doc);
        
        if (correction && correction !== token.text) {
          errors.push({
            type: 'homophone',
            word: token.text,
            correction: correction,
            explanation: `Erreur d'homophone : "${token.text}" devrait être "${correction}" dans ce contexte.`,
            offset: token.idx,
            length: token.text.length,
            severity: 'medium',
            confidence: 0.85,
            rule: 'homophones'
          });
        }
      }
    });
    
    return errors;
  }

  checkGenreAgreement(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const determinant = doc[match[1]];
      const adjective = doc[match[2]];
      
      if (determinant && adjective) {
        const detGender = determinant.morph.Gender;
        const adjGender = adjective.morph.Gender;
        
        if (detGender === 'Fem' && adjGender === 'Masc') {
          const correctedAdj = this.getFeminineForm(adjective.text);
          
          errors.push({
            type: 'accord_genre',
            word: adjective.text,
            correction: correctedAdj,
            explanation: `Erreur d'accord genre : le déterminant "${determinant.text}" est féminin mais l'adjectif "${adjective.text}" est masculin.`,
            offset: adjective.idx,
            length: adjective.text.length,
            severity: 'medium',
            confidence: 0.85,
            rule: 'accord_genre_nominal'
          });
        }
      }
    });
    
    return errors;
  }

  checkPrepositions(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const preposition = doc[match[1]];
      const noun = doc[match[2]];
      
      if (preposition && noun) {
        const correctPreposition = this.getCorrectPreposition(preposition.text, noun.lemma);
        
        if (correctPreposition && correctPreposition !== preposition.text) {
          errors.push({
            type: 'preposition',
            word: preposition.text,
            correction: correctPreposition,
            explanation: `Erreur de préposition : avec "${noun.text}", il faut utiliser "${correctPreposition}" au lieu de "${preposition.text}".`,
            offset: preposition.idx,
            length: preposition.text.length,
            severity: 'low',
            confidence: 0.75,
            rule: 'prepositions_incorrectes'
          });
        }
      }
    });
    
    return errors;
  }

  // MÉTHODES UTILITAIRES
  addRule(rule) {
    this.rules.push(rule);
    console.log(`📝 Règle ajoutée: ${rule.name} - ${rule.description}`);
  }

  getCorrectVerbForm(lemma, number, tense) {
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
    
    return conjugations[lemma]?.[number]?.[tense] || lemma;
  }

  getCorrectPronounConjugation(pronoun, verbLemma) {
    const conjugations = {
      'nous': {
        'être': 'sommes',
        'avoir': 'avons',
        'aller': 'allons'
      },
      'vous': {
        'être': 'êtes',
        'avoir': 'avez',
        'aller': 'allez'
      },
      'ils': {
        'être': 'sont',
        'avoir': 'ont',
        'aller': 'vont'
      },
      'elles': {
        'être': 'sont',
        'avoir': 'ont',
        'aller': 'vont'
      }
    };
    
    return conjugations[pronoun]?.[verbLemma] || verbLemma;
  }

  getHomophoneCorrection(word, token, doc) {
    const corrections = {
      'et': 'est',
      'est': 'et',
      'a': 'à',
      'à': 'a'
    };
    
    if (word === 'et' && token.pos === 'VERB') {
      return 'est';
    }
    if (word === 'est' && token.pos === 'CCONJ') {
      return 'et';
    }
    
    return corrections[word] || word;
  }

  getFeminineForm(masculineAdj) {
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
      'long': 'longue'
    };
    
    return feminineForms[masculineAdj] || masculineAdj + 'e';
  }

  getCorrectPreposition(currentPreposition, nounLemma) {
    const prepositionRules = {
      'aller': 'à',
      'venir': 'de',
      'penser': 'à',
      'parler': 'de',
      'réfléchir': 'à',
      'décider': 'de'
    };
    
    return prepositionRules[nounLemma] || currentPreposition;
  }

  findCODBeforeVerb(doc, verb) {
    for (let i = verb.i - 1; i >= 0; i--) {
      const token = doc[i];
      if (token.dep === 'obj' && token.head === verb) {
        return token;
      }
    }
    return null;
  }

  // Appliquer toutes les règles personnalisées
  applyRules(doc) {
    const allErrors = [];
    
    console.log(`🔧 Application de ${this.rules.length} règles personnalisées...`);
    
    this.rules.forEach(rule => {
      try {
        console.log(`📝 Vérification de la règle: ${rule.name}`);
        
        const matches = this.findPatternMatches(doc, rule.pattern);
        
        if (matches.length > 0) {
          console.log(`🎯 ${matches.length} correspondances trouvées pour ${rule.name}`);
          
          const ruleErrors = rule.action(doc, matches);
          
          ruleErrors.forEach(error => {
            error.rule = rule.name;
            error.ruleDescription = rule.description;
            error.severity = rule.severity;
            error.confidence = rule.confidence;
          });
          
          allErrors.push(...ruleErrors);
        }
      } catch (error) {
        console.error(`❌ Erreur dans la règle ${rule.name}:`, error);
      }
    });
    
    console.log(`✅ ${allErrors.length} erreurs trouvées avec les règles personnalisées`);
    return allErrors;
  }

  findPatternMatches(doc, pattern) {
    const matches = [];
    
    if (pattern.length === 2) {
      for (let i = 0; i < doc.length - 1; i++) {
        const token1 = doc[i];
        const token2 = doc[i + 1];
        
        if (this.matchesPattern(token1, pattern[0]) && this.matchesPattern(token2, pattern[1])) {
          matches.push([0, i, i + 1]);
        }
      }
    }
    
    return matches;
  }

  matchesPattern(token, pattern) {
    for (const [attr, value] of Object.entries(pattern.RIGHT_ATTRS)) {
      if (attr === 'POS' && token.pos !== value) return false;
      if (attr === 'LEMMA' && token.lemma !== value) return false;
      if (attr === 'TEXT' && token.text !== value) return false;
      if (attr === 'MORPH' && !this.matchesMorphology(token.morph, value)) return false;
    }
    
    return true;
  }

  matchesMorphology(tokenMorph, patternMorph) {
    for (const [attr, value] of Object.entries(patternMorph)) {
      if (tokenMorph[attr] !== value) return false;
    }
    return true;
  }

  getRulesInfo() {
    return this.rules.map(rule => ({
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      confidence: rule.confidence
    }));
  }
}

// Export pour utilisation
window.SpacyCustomRules = SpacyCustomRules;
console.log('🔧 Moteur de règles personnalisées spaCy chargé');
