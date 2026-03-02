// Moteur de règles personnalisées pour spaCy lg - Version étendue avec 15+ règles
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
    
    // === RÈGLES D'ACCORD ===
    
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

    // Règle 3: Accord genre dans les groupes nominaux
    this.addRule({
      name: 'accord_genre_nominal',
      description: 'Détecte les erreurs d\'accord genre dans les groupes nominaux',
      severity: 'medium',
      confidence: 0.85,
      pattern: this.createGenreAgreementPattern(),
      action: this.checkGenreAgreement.bind(this)
    });

    // === RÈGLES DE CONJUGAISON ===
    
    // Règle 4: Conjugaisons être/avoir incorrectes
    this.addRule({
      name: 'conjugaisons_etre_avoir',
      description: 'Détecte les conjugaisons incorrectes de être et avoir',
      severity: 'high',
      confidence: 0.95,
      pattern: this.createEtreAvoirPattern(),
      action: this.checkEtreAvoirConjugation.bind(this)
    });

    // Règle 5: Conjugaisons verbes du 3ème groupe
    this.addRule({
      name: 'conjugaisons_troisieme_groupe',
      description: 'Détecte les conjugaisons incorrectes des verbes du 3ème groupe',
      severity: 'high',
      confidence: 0.90,
      pattern: this.createTroisiemeGroupePattern(),
      action: this.checkTroisiemeGroupeConjugation.bind(this)
    });

    // Règle 6: Conjugaisons conditionnel présent
    this.addRule({
      name: 'conjugaisons_conditionnel',
      description: 'Détecte les erreurs de conjugaison au conditionnel présent',
      severity: 'medium',
      confidence: 0.85,
      pattern: this.createConditionnelPattern(),
      action: this.checkConditionnelConjugation.bind(this)
    });

    // === RÈGLES DE VOCABULAIRE ===
    
    // Règle 7: c'est vs ce sont
    this.addRule({
      name: 'c_est_ce_sont',
      description: 'Détecte l\'utilisation incorrecte de "c\'est" au lieu de "ce sont"',
      severity: 'medium',
      confidence: 0.85,
      pattern: this.createCEstPattern(),
      action: this.checkCEstCeSont.bind(this)
    });

    // Règle 8: Pléonasmes courants
    this.addRule({
      name: 'pleonasmes',
      description: 'Détecte les pléonasmes courants',
      severity: 'medium',
      confidence: 0.80,
      pattern: this.createPleonasmePattern(),
      action: this.checkPleonasmes.bind(this)
    });

    // Règle 9: Homophones contextuels
    this.addRule({
      name: 'homophones',
      description: 'Détecte les homophones mal utilisés selon le contexte',
      severity: 'medium',
      confidence: 0.85,
      pattern: this.createHomophonePattern(),
      action: this.checkHomophones.bind(this)
    });

    // Règle 10: Emploi incorrect des prépositions
    this.addRule({
      name: 'prepositions_incorrectes',
      description: 'Détecte l\'emploi incorrect des prépositions',
      severity: 'low',
      confidence: 0.75,
      pattern: this.createPrepositionPattern(),
      action: this.checkPrepositions.bind(this)
    });

    // === RÈGLES DE SYNTAXE ===
    
    // Règle 11: Inversion sujet-verbe incorrecte
    this.addRule({
      name: 'inversion_sujet_verbe',
      description: 'Détecte les inversions sujet-verbe incorrectes',
      severity: 'medium',
      confidence: 0.80,
      pattern: this.createInversionPattern(),
      action: this.checkInversion.bind(this)
    });

    // Règle 12: Construction impersonnelle incorrecte
    this.addRule({
      name: 'construction_impersonnelle',
      description: 'Détecte les erreurs dans les constructions impersonnelles',
      severity: 'medium',
      confidence: 0.85,
      pattern: this.createImpersonnellePattern(),
      action: this.checkImpersonnelle.bind(this)
    });

    // === RÈGLES DE STYLE ===
    
    // Règle 13: Répétitions de mots
    this.addRule({
      name: 'repetitions_mots',
      description: 'Détecte les répétitions inutiles de mots',
      severity: 'low',
      confidence: 0.70,
      pattern: this.createRepetitionPattern(),
      action: this.checkRepetitions.bind(this)
    });

    // Règle 14: Emploi des temps verbaux
    this.addRule({
      name: 'temps_verbaux',
      description: 'Détecte les incohérences dans l\'emploi des temps verbaux',
      severity: 'medium',
      confidence: 0.80,
      pattern: this.createTempsVerbauxPattern(),
      action: this.checkTempsVerbaux.bind(this)
    });

    // Règle 15: Emploi des modes
    this.addRule({
      name: 'modes_verbaux',
      description: 'Détecte les erreurs dans l\'emploi des modes (indicatif, subjonctif, conditionnel)',
      severity: 'medium',
      confidence: 0.85,
      pattern: this.createModesPattern(),
      action: this.checkModes.bind(this)
    });

    console.log(`✅ ${this.rules.length} règles personnalisées initialisées`);
  }

  // === PATTERNS SPA CY ===

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

  createTroisiemeGroupePattern() {
    return [
      {
        'RIGHT_ID': 'subject',
        'RIGHT_ATTRS': {'POS': 'PRON'}
      },
      {
        'LEFT_ID': 'subject',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'POS': 'VERB', 'MORPH': {'VerbForm': 'Inf'}}
      }
    ];
  }

  createConditionnelPattern() {
    return [
      {
        'RIGHT_ID': 'conditionnel_marker',
        'RIGHT_ATTRS': {'TEXT': {'IN': ['si', 'quand', 'lorsque', 'dès que']}}
      },
      {
        'LEFT_ID': 'conditionnel_marker',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'POS': 'VERB', 'MORPH': {'Mood': 'Ind'}}
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

  createHomophonePattern() {
    return [
      {
        'RIGHT_ID': 'homophone',
        'RIGHT_ATTRS': {'TEXT': {'IN': ['et', 'est', 'son', 'sont', 'a', 'à']}}
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

  createInversionPattern() {
    return [
      {
        'RIGHT_ID': 'verb',
        'RIGHT_ATTRS': {'POS': 'VERB', 'MORPH': {'Mood': 'Ind'}}
      },
      {
        'LEFT_ID': 'verb',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'POS': 'PRON', 'DEP': 'nsubj'}}
      }
    ];
  }

  createImpersonnellePattern() {
    return [
      {
        'RIGHT_ID': 'impersonal_marker',
        'RIGHT_ATTRS': {'LEMMA': 'il', 'POS': 'PRON'}
      },
      {
        'LEFT_ID': 'impersonal_marker',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'POS': 'VERB', 'MORPH': {'Number': 'Sing'}}
      }
    ];
  }

  createRepetitionPattern() {
    return [
      {
        'RIGHT_ID': 'word1',
        'RIGHT_ATTRS': {'POS': {'IN': ['NOUN', 'VERB', 'ADJ', 'ADV']}}
      },
      {
        'LEFT_ID': 'word1',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'TEXT': 'word1.text', 'POS': 'word1.pos'}}
      }
    ];
  }

  createTempsVerbauxPattern() {
    return [
      {
        'RIGHT_ID': 'verb1',
        'RIGHT_ATTRS': {'POS': 'VERB', 'MORPH': {'Tense': 'Past'}}
      },
      {
        'LEFT_ID': 'verb1',
        'REL_OP': 'nsubj',
        'RIGHT_ATTRS': {'POS': 'VERB', 'MORPH': {'Tense': 'Pres'}}
      }
    ];
  }

  createModesPattern() {
    return [
      {
        'RIGHT_ID': 'subjunctive_marker',
        'RIGHT_ATTRS': {'TEXT': {'IN': ['que', 'pour que', 'afin que', 'bien que']}}
      },
      {
        'LEFT_ID': 'subjunctive_marker',
        'REL_OP': '>',
        'RIGHT_ATTRS': {'POS': 'VERB', 'MORPH': {'Mood': 'Ind'}}
      }
    ];
  }

  // === ACTIONS DES RÈGLES ===

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
            explanation: `Erreur d'accord sujet-verbe : le sujet "${subject.text}" est au pluriel mais le verbe "${verb.text}" est au singulier. Le verbe doit s'accorder en nombre avec le sujet.`,
            offset: verb.idx,
            length: verb.text.length,
            severity: 'high',
            confidence: 0.95,
            rule: 'accord_sujet_verbe_pluriel',
            details: {
              subject: subject.text,
              subjectNumber: subjectNumber,
              verb: verb.text,
              verbNumber: verbNumber,
              correctForm: correctForm
            }
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
            rule: 'accord_participe_passe_cod',
            details: {
              auxiliary: auxiliary.text,
              participe: participe.text,
              cod: cod.text,
              corrected: correctedParticipe
            }
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
            explanation: `Erreur d'accord genre : le déterminant "${determinant.text}" est féminin mais l'adjectif "${adjective.text}" est masculin. L'adjectif doit s'accorder en genre avec le déterminant.`,
            offset: adjective.idx,
            length: adjective.text.length,
            severity: 'medium',
            confidence: 0.85,
            rule: 'accord_genre_nominal',
            details: {
              determinant: determinant.text,
              adjective: adjective.text,
              corrected: correctedAdj
            }
          });
        }
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
            rule: 'conjugaisons_etre_avoir',
            details: {
              subject: subject.text,
              verb: verb.lemma,
              incorrect: verb.text,
              correct: correctConjugation
            }
          });
        }
      }
    });
    
    return errors;
  }

  checkTroisiemeGroupeConjugation(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const subject = doc[match[1]];
      const verb = doc[match[2]];
      
      if (subject && verb && this.isTroisiemeGroupe(verb.lemma)) {
        const correctConjugation = this.getTroisiemeGroupeConjugation(subject.text, verb.lemma);
        
        if (correctConjugation !== verb.text) {
          errors.push({
            type: 'conjugaison_troisieme_groupe',
            word: verb.text,
            correction: correctConjugation,
            explanation: `Erreur de conjugaison : le verbe "${verb.lemma}" (3ème groupe) se conjugue "${correctConjugation}" avec le sujet "${subject.text}".`,
            offset: verb.idx,
            length: verb.text.length,
            severity: 'high',
            confidence: 0.90,
            rule: 'conjugaisons_troisieme_groupe',
            details: {
              subject: subject.text,
              verb: verb.lemma,
              incorrect: verb.text,
              correct: correctConjugation
            }
          });
        }
      }
    });
    
    return errors;
  }

  checkConditionnelConjugation(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const marker = doc[match[1]];
      const verb = doc[match[2]];
      
      if (marker && verb && verb.morph.Mood === 'Ind') {
        const correctConjugation = this.getConditionnelConjugation(verb.lemma);
        
        errors.push({
          type: 'conjugaison_conditionnel',
          word: verb.text,
          correction: correctConjugation,
          explanation: `Erreur de temps : avec "${marker.text}", il faut utiliser le conditionnel présent "${correctConjugation}" au lieu de l'indicatif "${verb.text}".`,
          offset: verb.idx,
          length: verb.text.length,
          severity: 'medium',
          confidence: 0.85,
          rule: 'conjugaisons_conditionnel',
          details: {
            marker: marker.text,
            verb: verb.lemma,
            incorrect: verb.text,
            correct: correctConjugation
          }
        });
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
          rule: 'c_est_ce_sont',
          details: {
            determinant: determinant.text,
            incorrect: verb.text,
            correct: 'sont'
          }
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
          rule: 'pleonasmes',
          details: {
            verb: verb.text,
            adverb: adverb.text,
            pleonasme: pleonasme,
            correction: correction
          }
        });
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
            rule: 'homophones',
            details: {
              incorrect: token.text,
              correct: correction,
              context: this.getContext(doc, token)
            }
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
            rule: 'prepositions_incorrectes',
            details: {
              noun: noun.text,
              incorrect: preposition.text,
              correct: correctPreposition
            }
          });
        }
      }
    });
    
    return errors;
  }

  checkInversion(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const verb = doc[match[1]];
      const subject = doc[match[2]];
      
      if (verb && subject && !this.isCorrectInversion(verb, subject)) {
        errors.push({
          type: 'inversion',
          word: verb.text + ' ' + subject.text,
          correction: subject.text + ' ' + verb.text,
          explanation: `Erreur d'inversion : l'ordre normal sujet-verbe "${subject.text} ${verb.text}" est attendu ici.`,
          offset: verb.idx,
          length: verb.text.length + subject.text.length + 1,
          severity: 'medium',
          confidence: 0.80,
          rule: 'inversion_sujet_verbe',
          details: {
            verb: verb.text,
            subject: subject.text,
            incorrect: verb.text + ' ' + subject.text,
            correct: subject.text + ' ' + verb.text
          }
        });
      }
    });
    
    return errors;
  }

  checkImpersonnelle(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const marker = doc[match[1]];
      const verb = doc[match[2]];
      
      if (marker && verb && verb.morph.Number !== 'Sing') {
        errors.push({
          type: 'construction_impersonnelle',
          word: verb.text,
          correction: this.getSingularForm(verb.text),
          explanation: `Erreur de construction impersonnelle : avec "il", le verbe doit être au singulier "${this.getSingularForm(verb.text)}" au lieu de "${verb.text}".`,
          offset: verb.idx,
          length: verb.text.length,
          severity: 'medium',
          confidence: 0.85,
          rule: 'construction_impersonnelle',
          details: {
            marker: marker.text,
            verb: verb.text,
            incorrect: verb.text,
            correct: this.getSingularForm(verb.text)
          }
        });
      }
    });
    
    return errors;
  }

  checkRepetitions(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const word1 = doc[match[1]];
      const word2 = doc[match[2]];
      
      if (word1 && word2 && word1.text === word2.text && !this.isAcceptableRepetition(word1.text)) {
        errors.push({
          type: 'repetition',
          word: word1.text + ' ' + word2.text,
          correction: word1.text,
          explanation: `Répétition inutile : le mot "${word1.text}" est répété. Évitez les répétitions dans la même phrase.`,
          offset: word1.idx,
          length: word1.text.length + word2.text.length + 1,
          severity: 'low',
          confidence: 0.70,
          rule: 'repetitions_mots',
          details: {
            word: word1.text,
            repetition: word1.text + ' ' + word2.text,
            correction: word1.text
          }
        });
      }
    });
    
    return errors;
  }

  checkTempsVerbaux(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const verb1 = doc[match[1]];
      const verb2 = doc[match[2]];
      
      if (verb1 && verb2 && this.isIncoherentTenses(verb1, verb2)) {
        errors.push({
          type: 'temps_verbaux',
          word: verb1.text + ' ' + verb2.text,
          correction: verb2.text,
          explanation: `Incohérence temporelle : le passage du passé "${verb1.text}" au présent "${verb2.text}" peut être incohérent selon le contexte.`,
          offset: verb1.idx,
          length: verb1.text.length + verb2.text.length + 1,
          severity: 'medium',
          confidence: 0.80,
          rule: 'temps_verbaux',
          details: {
            past: verb1.text,
            present: verb2.text,
            incoherence: verb1.text + ' ' + verb2.text
          }
        });
      }
    });
    
    return errors;
  }

  checkModes(doc, matches) {
    const errors = [];
    
    matches.forEach(match => {
      const marker = doc[match[1]];
      const verb = doc[match[2]];
      
      if (marker && verb && verb.morph.Mood === 'Ind') {
        const correctConjugation = this.getSubjonctifConjugation(verb.lemma);
        
        errors.push({
          type: 'mode_verbal',
          word: verb.text,
          correction: correctConjugation,
          explanation: `Erreur de mode : avec "${marker.text}", il faut utiliser le subjonctif "${correctConjugation}" au lieu de l'indicatif "${verb.text}".`,
          offset: verb.idx,
          length: verb.text.length,
          severity: 'medium',
          confidence: 0.85,
          rule: 'modes_verbaux',
          details: {
            marker: marker.text,
            verb: verb.lemma,
            incorrect: verb.text,
            correct: correctConjugation
          }
        });
      }
    });
    
    return errors;
  }

  // === MÉTHODES UTILITAIRES ===

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
          'Fut': 'seront',
          'Cond': 'seraient'
        }
      },
      'avoir': {
        'Plur': {
          'Pres': 'ont',
          'Imp': 'avaient',
          'Fut': 'auront',
          'Cond': 'auraient'
        }
      },
      'aller': {
        'Plur': {
          'Pres': 'vont',
          'Imp': 'allaient',
          'Fut': 'iront',
          'Cond': 'iraient'
        }
      },
      'faire': {
        'Plur': {
          'Pres': 'font',
          'Imp': 'faisaient',
          'Fut': 'feront',
          'Cond': 'feraient'
        }
      },
      'dire': {
        'Plur': {
          'Pres': 'disent',
          'Imp': 'disaient',
          'Fut': 'diront',
          'Cond': 'diraient'
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
    
    return conjugations[pronoun]?.[verbLemma] || verbLemma;
  }

  isTroisiemeGroupe(lemma) {
    const troisiemeGroupe = [
      'aller', 'venir', 'tenir', 'venir', 'devenir', 'revenir',
      'voir', 'savoir', 'pouvoir', 'vouloir', 'valoir', 'falloir',
      'recevoir', 'devoir', 'croire', 'mourir', 'courir', 'ouvrir',
      'offrir', 'couvrir', 'souffrir', 'asservir', 'guérir', 'vieillir',
      'enrichir', 'appauvrir', 'rougir', 'verdir', 'blanchir', 'noircir'
    ];
    
    return troisiemeGroupe.includes(lemma);
  }

  getTroisiemeGroupeConjugation(pronoun, lemma) {
    const conjugations = {
      'nous': {
        'aller': 'allons',
        'venir': 'venons',
        'voir': 'voyons',
        'savoir': 'savons',
        'pouvoir': 'pouvons',
        'vouloir': 'voulons',
        'devoir': 'devons',
        'recevoir': 'recevons'
      },
      'vous': {
        'aller': 'allez',
        'venir': 'venez',
        'voir': 'voyez',
        'savoir': 'savez',
        'pouvoir': 'pouvez',
        'vouloir': 'voulez',
        'devoir': 'devez',
        'recevoir': 'recevez'
      },
      'ils': {
        'aller': 'vont',
        'venir': 'viennent',
        'voir': 'voient',
        'savoir': 'savent',
        'pouvoir': 'peuvent',
        'vouloir': 'veulent',
        'devoir': 'doivent',
        'recevoir': 'reçoivent'
      },
      'elles': {
        'aller': 'vont',
        'venir': 'viennent',
        'voir': 'voient',
        'savoir': 'savent',
        'pouvoir': 'peuvent',
        'vouloir': 'veulent',
        'devoir': 'doivent',
        'recevoir': 'reçoivent'
      }
    };
    
    return conjugations[pronoun]?.[lemma] || lemma;
  }

  getConditionnelConjugation(lemma) {
    const conjugations = {
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
    
    return conjugations[lemma] || lemma;
  }

  getSubjonctifConjugation(lemma) {
    const conjugations = {
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
    
    return conjugations[lemma] || lemma;
  }

  getHomophoneCorrection(word, token, doc) {
    const corrections = {
      'et': 'est',
      'est': 'et',
      'son': 'sont',
      'sont': 'son',
      'a': 'à',
      'à': 'a'
    };
    
    // Logique contextuelle pour déterminer la bonne correction
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
    
    return feminineForms[masculineAdj] || masculineAdj + 'e';
  }

  getCorrectPreposition(currentPreposition, nounLemma) {
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
      'penser': 'à',
      'réfléchir': 'à',
      'obéir': 'à',
      'désobéir': 'à',
      'ressembler': 'à',
      'plaire': 'à',
      'manquer': 'à',
      'échapper': 'de',
      'sortir': 'de',
      'entrer': 'dans',
      'sortir': 'de',
      'monter': 'sur',
      'descendre': 'de'
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

  isCorrectInversion(verb, subject) {
    // Logique pour déterminer si l'inversion est correcte
    // Pour les questions, l'inversion est acceptable
    return verb.dep === 'aux' || verb.dep === 'cop';
  }

  getSingularForm(word) {
    const singularForms = {
      'sont': 'est',
      'ont': 'a',
      'font': 'fait',
      'vont': 'va',
      'disent': 'dit',
      'faisaient': 'faisait',
      'allaient': 'allait',
      'avaient': 'avait'
    };
    
    return singularForms[word] || word;
  }

  isAcceptableRepetition(word) {
    const acceptableRepetitions = ['plus', 'moins', 'très', 'bien', 'tout', 'tous', 'toutes'];
    return acceptableRepetitions.includes(word.toLowerCase());
  }

  isIncoherentTenses(verb1, verb2) {
    // Logique simplifiée pour détecter les incohérences temporelles
    const pastTenses = ['Imp', 'Past', 'Pqp'];
    const presentTenses = ['Pres'];
    
    return pastTenses.includes(verb1.morph.Tense) && presentTenses.includes(verb2.morph.Tense);
  }

  getContext(doc, token, windowSize = 3) {
    const start = Math.max(0, token.i - windowSize);
    const end = Math.min(doc.length, token.i + windowSize + 1);
    
    let context = '';
    for (let i = start; i < end; i++) {
      if (i === token.i) {
        context += `[${doc[i].text}]`;
      } else {
        context += doc[i].text;
      }
      context += ' ';
    }
    
    return context.trim();
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
