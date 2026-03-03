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

    // Règle 1.5: ERREUR DE GENRE - le/la devant nom
    this.addRule({
      name: 'erreur_genre_determinant',
      description: 'Détecte les erreurs de genre avec les déterminants le/la',
      severity: 'high',
      confidence: 0.90,
      pattern: this.createGenrePattern(),
      action: this.checkGenreError.bind(this)
    });

    // Règle 1.6: CONJUGAISON - qui a/qui avez
    this.addRule({
      name: 'conjugaison_qui',
      description: 'Détecte les erreurs de conjugaison avec "qui"',
      severity: 'high',
      confidence: 0.95,
      pattern: this.createQuiPattern(),
      action: this.checkQuiConjugaison.bind(this)
    });

    // Règle 1.7: DÉTECTION SIMPLE - le fille / la garçon
    this.addRule({
      name: 'genre_simple',
      description: 'Détecte les erreurs de genre évidentes (le fille, la garçon)',
      severity: 'high',
      confidence: 0.98,
      pattern: null, // Utilise regex directe
      action: this.checkSimpleGenreErrors.bind(this)
    });

    // Règle 1.8: DÉTECTION SIMPLE - qui a / qui avez
    this.addRule({
      name: 'conjugaison_simple',
      description: 'Détecte les erreurs de conjugaison évidentes (qui a au lieu de qui ont)',
      severity: 'high',
      confidence: 0.98,
      pattern: null, // Utilise regex directe
      action: this.checkSimpleConjugaisonErrors.bind(this)
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
      action: this.checkPleonasme.bind(this)
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

  createGenrePattern() {
    return [
      {
        'RIGHT_ID': 'determinant',
        'RIGHT_ATTRS': {'LEMMA': 'le', 'POS': 'DET'}
      },
      {
        'LEFT_ID': 'determinant',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'POS': 'NOUN', 'MORPH': {'Gender': 'Fem'}}
      }
    ];
  }

  createQuiPattern() {
    return [
      {
        'RIGHT_ID': 'pronoun',
        'RIGHT_ATTRS': {'LEMMA': 'qui', 'POS': 'PRON'}
      },
      {
        'LEFT_ID': 'pronoun',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'POS': 'VERB', 'MORPH': {'Person': '2'}}
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
  checkGenreError(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const determinant = doc[match[1]];
      const noun = doc[match[2]];
      
      if (determinant && noun) {
        // "le" + nom féminin = erreur
        if (determinant.lemma === 'le' && noun.morph && noun.morph.Gender === 'Fem') {
          errors.push({
            type: 'genre',
            word: determinant.text + ' ' + noun.text,
            correction: 'la ' + noun.text,
            explanation: `Erreur de genre : "${determinant.text} ${noun.text}" doit être "la ${noun.text}" car "${noun.text}" est féminin.`,
            offset: determinant.idx,
            length: determinant.text.length + noun.text.length + 1,
            severity: 'high',
            confidence: 0.90,
            rule: 'erreur_genre_determinant'
          });
        }
      }
    });
    
    return errors;
  }

  checkQuiConjugaison(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const pronoun = doc[match[1]];
      const verb = doc[match[2]];
      
      if (pronoun && verb) {
        // "qui" + verbe à la 2ème personne = erreur (devrait être 3ème personne)
        if (pronoun.lemma === 'qui' && verb.morph && verb.morph.Person === '2') {
          const correctForm = this.getCorrectVerbForm(verb.lemma, '3', verb.morph.Tense);
          
          errors.push({
            type: 'conjugaison',
            word: verb.text,
            correction: correctForm,
            explanation: `Erreur de conjugaison : après "qui", le verbe doit être à la 3ème personne du singulier, pas à la 2ème personne.`,
            offset: verb.idx,
            length: verb.text.length,
            severity: 'high',
            confidence: 0.95,
            rule: 'conjugaison_qui'
          });
        }
      }
    });
    
    return errors;
  }

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

  // NOUVELLES FONCTIONS DE DÉTECTION SIMPLE
  checkSimpleGenreErrors(text) {
    const errors = [];
    
    // Erreurs de genre évidentes
    const genreErrors = [
      { pattern: /\ble\s+fille\b/g, correction: 'la fille', explanation: '"fille" est féminin, donc on dit "la fille"' },
      { pattern: /\ble\s+femme\b/g, correction: 'la femme', explanation: '"femme" est féminin, donc on dit "la femme"' },
      { pattern: /\ble\s+soeur\b/g, correction: 'la soeur', explanation: '"soeur" est féminin, donc on dit "la soeur"' },
      { pattern: /\ble\s+mère\b/g, correction: 'la mère', explanation: '"mère" est féminin, donc on dit "la mère"' },
      { pattern: /\bla\s+garçon\b/g, correction: 'le garçon', explanation: '"garçon" est masculin, donc on dit "le garçon"' },
      { pattern: /\bla\s+père\b/g, correction: 'le père', explanation: '"père" est masculin, donc on dit "le père"' },
      { pattern: /\bla\s+frère\b/g, correction: 'le frère', explanation: '"frère" est masculin, donc on dit "le frère"' }
    ];
    
    genreErrors.forEach(error => {
      const matches = text.match(error.pattern);
      if (matches) {
        matches.forEach(match => {
          const index = text.indexOf(match);
          errors.push({
            type: 'genre',
            word: match,
            correction: error.correction,
            explanation: error.explanation,
            offset: index,
            length: match.length,
            severity: 'high',
            confidence: 0.98,
            rule: 'genre_simple'
          });
        });
      }
    });
    
    return errors;
  }

  checkSimpleConjugaisonErrors(text) {
    const errors = [];
    
    // Erreurs de conjugaison évidentes
    const conjugaisonErrors = [
      { pattern: /\bqui\s+(a|as|ont|avons|avez)\b/gi, check: (match) => {
        const verb = match.toLowerCase();
        if (verb === 'qui a' || verb === 'qui as') {
          return { correction: 'qui ont', explanation: 'Après "qui" pluriel, on utilise "ont" et non "a"' };
        }
        return null;
      }},
      { pattern: /\bles\s+(est|sont)\s+(fille|femme|soeur|mère)\b/gi, check: (match) => {
        const words = match.split(' ');
        if (words[1] === 'est') {
          return { correction: `les sont ${words[2]}`, explanation: 'Au pluriel, on dit "sont" et non "est"' };
        }
        return null;
      }},
      { pattern: /\bc'est\s+(les|des|mes|tes|ses)\b/gi, check: (match) => {
        return { correction: match.replace("c'est", "ce sont"), explanation: 'Avec un pluriel, on dit "ce sont" et non "c\'est"' };
      }}
    ];
    
    conjugaisonErrors.forEach(error => {
      const matches = text.match(error.pattern);
      if (matches) {
        matches.forEach(match => {
          const correction = error.check(match);
          if (correction) {
            const index = text.indexOf(match);
            errors.push({
              type: 'conjugaison',
              word: match,
              correction: correction.correction,
              explanation: correction.explanation,
              offset: index,
              length: match.length,
              severity: 'high',
              confidence: 0.98,
              rule: 'conjugaison_simple'
            });
          }
        });
      }
    });
    
    return errors;
  }

  // Appliquer toutes les règles personnalisées
  applyRules(doc) {
    const allErrors = [];
    
    console.log(`🔧 Application de ${this.rules.length} règles personnalisées...`);
    
    this.rules.forEach(rule => {
      try {
        console.log(`📝 Vérification de la règle: ${rule.name}`);
        
        // Pour les règles simples (pattern null), utiliser le texte brut
        if (rule.pattern === null) {
          const text = doc.map ? doc.map(token => token.text).join(' ') : doc.toString();
          const ruleErrors = rule.action(text);
          allErrors.push(...ruleErrors);
        } else {
          // Pour les règles spaCy, utiliser le pattern matcher
          const matches = this.findPatternMatches(doc, rule.pattern);
          
          if (matches.length > 0) {
            console.log(`🎯 ${matches.length} correspondances trouvées pour ${rule.name}`);
            
            const ruleErrors = rule.action(doc, matches);
            allErrors.push(...ruleErrors);
          }
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
