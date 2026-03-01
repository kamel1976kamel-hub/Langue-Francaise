// Gestion des activités pédagogiques

// Fonction pour générer les entrées de tableau selon le type
window.generateTableInput = function(chapterId, activityId, tableType) {
  let tableRows = 3;
  let tableCols = 2;
  let headers = ['Colonne 1', 'Colonne 2'];
  let placeholders = ['Saisissez votre réponse...', 'Saisissez votre réponse...'];
  
  // Adaptation selon le type de tableau
  if (tableType === 'tri-inductif') {
    tableRows = 4;
    tableCols = 4;
    headers = ['Texte', 'Question principale', 'Intention de l\'auteur', 'Indices linguistiques'];
    placeholders = ['A (Récit), B (Description), C (Explicatif)...', 'Que s\'est-il passé ?', 'Raconter, Décrire, Expliquer...', 'Passé simple, adjectifs, connecteurs...'];
  } else if (tableType === 'definir-sujet') {
    tableRows = 4;
    tableCols = 2;
    headers = ['Élément', 'Détail'];
    placeholders = ['Sujet principal...', 'Phénomène, concept, objet...'];
  } else if (tableType === 'causes-consequences') {
    tableRows = 4;
    tableCols = 2;
    headers = ['Catégorie', 'Détail'];
    placeholders = ['Cause(s) principales...', 'Conséquence(s) directes...'];
  } else if (tableType === 'exemples-analogies') {
    tableRows = 4;
    tableCols = 2;
    headers = ['Type', 'Exemple / Analogie'];
    placeholders = ['Exemple concret...', 'Faites une analogie...'];
  } else if (tableType === 'synthese-claire') {
    tableRows = 4;
    tableCols = 2;
    headers = ['Élément', 'Contenu'];
    placeholders = ['Idée principale...', 'Points clés...'];
  }
  
  let html = '<div class="overflow-x-auto">';
  html += '<table class="min-w-full divide-y divide-slate-200">';
  
  // En-tête du tableau
  html += '<thead class="bg-slate-50">';
  html += '<tr>';
  for (let j = 0; j < tableCols; j++) {
    html += `<th scope="col" class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">${headers[j]}</th>`;
  }
  html += '</tr>';
  html += '</thead>';
  
  // Corps du tableau
  html += '<tbody class="bg-white divide-y divide-slate-200">';
  for (let i = 0; i < tableRows; i++) {
    html += '<tr>';
    for (let j = 0; j < tableCols; j++) {
      html += `<td class="px-3 py-2 whitespace-nowrap">
        <input 
          type="text" 
          class="table-input-${chapterId}-${activityId} w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-slate-500 focus:border-slate-500" 
          data-row="${i}" 
          data-col="${j}"
          placeholder="${placeholders[j]}"
        />
      </td>`;
    }
    html += '</tr>';
  }
  html += '</tbody>';
  
  html += '</table>';
  html += '</div>';
  
  return html;
};

// Fonction pour récupérer le contenu du tableau ou du textarea
window.getActivityAnswer = function(chapterId, activityId, hasTable) {
  if (hasTable) {
    const inputs = document.querySelectorAll(`.table-input-${chapterId}-${activityId}`);
    let result = {};
    let filledCount = 0;
    inputs.forEach(input => {
      const row = input.dataset.row;
      const col = input.dataset.col;
      const value = input.value.trim();
      if (!result[row]) result[row] = {};
      result[row][col] = value;
      if (value) filledCount++;
    });
    // Retourner null si aucun champ n'est rempli
    if (filledCount === 0) return null;
    return JSON.stringify(result, null, 2);
  } else {
    const textarea = document.getElementById(`activity-answer-${chapterId}-${activityId}`);
    const value = textarea ? textarea.value.trim() : '';
    // Retourner null si le textarea est vide
    if (!value) return null;
    return value;
  }
};

// Fonction pour soumettre une activité à l'IA
window.submitActivity = async function(chapterId, activityId) {
  const activity = window.activityContent && window.activityContent[chapterId] ? window.activityContent[chapterId][activityId] : null;
  if (!activity) return;

  const feedbackEl = document.getElementById(`activity-feedback-${chapterId}-${activityId}`);
  const feedbackTextEl = document.getElementById(`activity-feedback-text-${chapterId}-${activityId}`);
  
  // Récupérer la réponse (tableau ou textarea)
  const answer = window.getActivityAnswer(chapterId, activityId, activity.hasTable);

  // Vérifier si la réponse est vide
  if (!answer || answer === '{}') {
    feedbackTextEl.innerHTML = `
      <div style="color: #d97706;">
        <p style="font-weight: bold; margin-bottom: 8px;">⚠️ Réponse vide détectée</p>
        <p>Pour obtenir une correction de l'IA, vous devez d'abord :</p>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Lire attentivement la consigne de l'activité</li>
          <li>Compléter votre réponse de manière concrète</li>
          <li>Relire votre travail avant de soumettre</li>
        </ul>
        <p style="margin-top: 8px; font-style: italic;">💡 Une réponse vide ne permet pas à l'IA de vous aider efficacement.</p>
      </div>
    `;
    feedbackEl.classList.remove('hidden');
    return;
  }
  
  // Vérifier si la réponse est trop courte ou superficielle
  const minLength = activity.hasTable ? 50 : 30;
  if (answer.length < minLength) {
    feedbackTextEl.innerHTML = `
      <div style="color: #d97706;">
        <p style="font-weight: bold; margin-bottom: 8px;">⚠️ Réponse trop courte</p>
        <p>Votre réponse semble incomplète. Pour une correction pertinente :</p>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Développez votre réponse avec plus de détails</li>
          <li>Répondez à tous les aspects de la consigne</li>
          <li>Donnez des exemples ou des justifications</li>
        </ul>
        <p style="margin-top: 8px; font-style: italic;">💡 Une réponse développée permet à l'IA de mieux vous guider.</p>
      </div>
    `;
    feedbackEl.classList.remove('hidden');
    return;
  }

  if (!window.runFourModelPipeline) {
    feedbackTextEl.textContent = 'L\'IA n\'est pas encore chargée. Veuillez patienter.';
    feedbackEl.classList.remove('hidden');
    return;
  }

  feedbackTextEl.textContent = 'Correction en cours...';
  feedbackEl.classList.remove('hidden');

  // Contexte adapté selon le type d'activité - se concentrer sur la correction de la réponse de l'élève
  let contexte = `Activité : ${activity.title}\n\nVoici la réponse de l'élève à corriger :\n\n${answer}\n\nConsigne : Corrige la réponse de l'élève, fais des remarques constructives et donne des conseils pour améliorer.`;
  
  // Identifier le type de texte principal basé sur le chapitre pour un feedback plus ciblé
  let texteType = '';
  if (chapterId.includes('explicatif')) {
    texteType = 'explicatif';
    contexte += `\n\nCe texte est de type explicatif. Vérifie que la réponse aide à comprendre un phénomène en répondant aux questions "Pourquoi ?" et "Comment ?".`;
  } else if (chapterId.includes('narratif')) {
    texteType = 'narratif';
    contexte += `\n\nCe texte est de type narratif. Vérifie que la réponse traite d'événements dans un ordre temporel avec des personnages, une intrigue et une progression chronologique.`;
  } else if (chapterId.includes('descriptif')) {
    texteType = 'descriptif';
    contexte += `\n\nCe texte est de type descriptif. Vérifie que la réponse présente des caractéristiques statiques avec des détails sensoriels et une organisation spatiale.`;
  } else if (chapterId.includes('argumentatif')) {
    texteType = 'argumentatif';
    contexte += `\n\nCe texte est de type argumentatif. Vérifie que la réponse présente un point de vue défendu par des arguments et des exemples pour convaincre le lecteur.`;
  } else if (chapterId.includes('resume')) {
    texteType = 'résumé';
    contexte += `\n\nCe texte est de type résumé. Vérifie que la réponse synthétise les idées principales de manière concise tout en conservant l'essentiel du texte original.`;
  }
  
  // Si c'est une activité avec tableau, adapter le contexte pour corriger les éléments du tableau
  if (activity.hasTable) {
    contexte += `\n\nL'élève a répondu avec un tableau. Corrige chaque élément du tableau et donne des conseils précis pour améliorer sa réponse.`;
    
    // Adapter selon le type de tableau pour une correction spécifique
    if (activity.tableType === 'tri-inductif') {
      contexte += `\n\nFais attention à la distinction entre les différents types de textes (narratif, descriptif, explicatif) et à la pertinence des intentions et indices linguistiques.`;
    } else if (activity.tableType === 'definir-sujet') {
      contexte += `\n\nVérifie si le sujet est bien défini, avec précision sur le thème, le domaine et l'objectif de l'explication.`;
    } else if (activity.tableType === 'causes-consequences') {
      contexte += `\n\nAnalyse la pertinence des causes et conséquences identifiées, et vérifie si les relations de causalité sont bien établies.`;
    } else if (activity.tableType === 'exemples-analogies') {
      contexte += `\n\nÉvalue la pertinence des exemples et analogies proposés, et suggère des améliorations si nécessaire.`;
    } else if (activity.tableType === 'synthese-claire') {
      contexte += `\n\nVérifie si la synthèse est complète, claire et si elle reprend bien les idées essentielles avec une conclusion pertinente.`;
    }
  } else {
    contexte += `\n\nAssure-toi de commenter la qualité de la réponse, son développement et sa pertinence par rapport à la question posée.`;
  }

  try {
    if (typeof window.runFourModelPipeline !== 'function') {
      feedbackTextEl.textContent = 'Le pipeline IA n\'est pas encore prêt. Veuillez patienter.';
      return;
    }
    
    const reponse = await window.runFourModelPipeline(answer, contexte);
    // Afficher la réponse de l'IA avec un effet de frappe simulé
    if (typeof simulateTypingEffect !== 'undefined') {
      simulateTypingEffect(feedbackTextEl, reponse, activity.hasTable);
    } else {
      // Si la fonction simulateTypingEffect n'est pas disponible, afficher directement
      if (activity.hasTable) {
        feedbackTextEl.innerHTML = formatFeedbackAsTable(reponse);
      } else {
        feedbackTextEl.textContent = reponse || 'Aucun retour de l\'IA.';
      }
    }
  } catch (e) {
    feedbackTextEl.textContent = `Erreur : ${e.message}`;
  }
};

// Fonction pour formater la réponse de l'IA en tableau si elle contient des données tabulaires
function formatFeedbackAsTable(response) {
  // Si la réponse contient déjà des balises HTML, on les garde
  if (response.includes('<table') || response.includes('<h')) {
    return response;
  }
  
  // Convertir le markdown en HTML
  let html = response;
  
  // Convertir les titres markdown **titre** en <h4>
  html = html.replace(/\*\*([^*]+)\*\*/g, '<h4 style="color:#4f46e5;margin:15px 0 10px 0;font-size:14px;">$1</h4>');
  
  // Convertir les tableaux markdown en HTML
  // Détecter les lignes de tableau (| ... | ... |)
  const lines = html.split('\n');
  let inTable = false;
  let tableHtml = '';
  let resultHtml = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Détecter une ligne de tableau
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHtml = '<table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:12px;background:white;"><thead>';
      }
      
      // Séparer les cellules
      const cells = line.split('|').filter(c => c.trim() !== '');
      
      // Ignorer la ligne de séparation (---)
      if (cells.some(c => c.includes('---'))) {
        tableHtml += '</thead><tbody>';
        continue;
      }
      
      // Déterminer si c'est l'en-tête ou le corps
      const isHeader = tableHtml.includes('<thead>') && !tableHtml.includes('</thead>');
      const tag = isHeader ? 'th' : 'td';
      const bgStyle = isHeader ? 'background:#f8fafc;font-weight:bold;' : '';
      
      tableHtml += '<tr>';
      cells.forEach(cell => {
        tableHtml += `<${tag} style="padding:8px 12px;border:1px solid #e5e7eb;${bgStyle}">${cell.trim()}</${tag}>`;
      });
      tableHtml += '</tr>';
    } else {
      // Fermer le tableau s'il est ouvert
      if (inTable) {
        inTable = false;
        tableHtml += '</tbody></table>';
        resultHtml += tableHtml;
        tableHtml = '';
      }
      
      if (line) {
        resultHtml += `<p style="margin:5px 0;">${line}</p>`;
      }
    }
  }
  
  // Fermer le tableau s'il est encore ouvert
  if (inTable) {
    tableHtml += '</tbody></table>';
    resultHtml += tableHtml;
  }
  
  return resultHtml || response;
}

// Fonction pour simuler l'effet de frappe (comme dans un document Word)
function simulateTypingEffect(element, text, hasTable) {
  if (!text) {
    element.textContent = 'Aucun retour de l\'IA.';
    return;
  }

  // Effacer le contenu existant
  element.textContent = '';
  
  // Formater le texte en fonction du type d'activité
  let contentToType = text;
  if (hasTable) {
    contentToType = formatFeedbackAsTable(text);
  }

  // Vérifier si le contenu contient du HTML
  const containsHTML = contentToType.includes('<') && contentToType.includes('>');

  let charIndex = 0;
  const typingSpeed = 30; // ms entre chaque caractère

  const typeCharacter = () => {
    if (charIndex < contentToType.length) {
      if (containsHTML) {
        // Si le contenu contient du HTML, on l'ajoute progressivement
        element.innerHTML = contentToType.substring(0, charIndex + 1);
      } else {
        // Sinon, on ajoute simplement le texte
        element.textContent = contentToType.substring(0, charIndex + 1);
      }
      
      charIndex++;
      setTimeout(typeCharacter, typingSpeed);
    }
  };

  typeCharacter();
}

