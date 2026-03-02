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

// Fonction pour récupérer le contenu du tableau ou du textarea est définie dans index.html

// Fonction pour charger le contexte Markdown depuis GitHub Pages
async function fetchMarkdownContext(topic) {
  try {
    // Essayer le chemin relatif d'abord
    let response = await fetch(`/contexts/${topic}.md`);
    
    // Si ça échoue, essayer le chemin complet
    if (!response.ok) {
      response = await fetch(`https://kamel1976kamel-hub.github.io/Langue-Francaise/contexts/${topic}.md`);
    }
    
    if (!response.ok) throw new Error(`Fichier ${topic}.md non trouvé (status: ${response.status})`);
    
    const mdText = await response.text();
    console.log(`✅ Contexte Markdown ${topic}.md chargé pour activité (${mdText.length} caractères)`);
    return mdText;
  } catch (error) {
    console.error('❌ Impossible de charger le contexte Markdown:', error);
    // Fallback contextuel silencieux
    const fallbackContexts = {
      techniques: "Tu es un expert en didactique du français. Aide l'étudiant à progresser dans la production écrite sans lui donner directement les réponses. Domaine : planification, structuration, connecteurs logiques, adaptation au destinataire, révision, analyse de consignes.",
      narratif: "Tu es un expert en littérature spécialisé dans le texte narratif. Aide l'étudiant à maîtriser la structure du récit, les personnages, les temps verbaux, le narrateur et l'intrigue. Guide-le dans la création d'histoires captivantes.",
      descriptif: "Tu es un expert en littérature spécialisé dans le texte descriptif. Aide l'étudiant à développer son regard descriptif, l'organisation spatiale, les perceptions sensorielles, les champs lexicaux et la création d'atmosphère.",
      explicatif: "Tu es un expert en littérature spécialisé dans le texte explicatif. Aide l'étudiant à structurer ses explications de manière logique, utiliser les connecteurs logiques, et répondre aux questions 'Pourquoi?' et 'Comment?'.",
      argumentatif: "Tu es un expert en littérature spécialisé dans le texte argumentatif. Aide l'étudiant à développer sa thèse, construire des arguments solides, utiliser des preuves et réfuter les contre-arguments.",
      resume: "Tu es un expert en littérature spécialisé dans l'art du résumé. Aide l'étudiant à identifier les idées essentielles, éliminer les superflu, reformuler avec ses propres mots et respecter la fidélité au texte."
    };
    
    return fallbackContexts[topic] || "Tu es un tuteur expert en français. Aide l'étudiant sans faire le travail à sa place.";
  }
}

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

  // Vérifier si la pipeline IA est disponible - PLUS DE FALLBACK
  if (typeof window.runFourModelPipeline !== 'function') {
    feedbackTextEl.textContent = 'Le service IA est temporairement indisponible. Veuillez réessayer plus tard.';
    feedbackEl.classList.remove('hidden');
    return;
  }

  feedbackTextEl.textContent = 'Correction en cours...';
  feedbackEl.classList.remove('hidden');

  // Récupérer le contexte depuis le fichier Markdown selon le type de texte
  let texteType = 'techniques'; // défaut
  if (chapterId.includes('explicatif')) {
    texteType = 'explicatif';
  } else if (chapterId.includes('narratif')) {
    texteType = 'narratif';
  } else if (chapterId.includes('descriptif')) {
    texteType = 'descriptif';
  } else if (chapterId.includes('argumentatif')) {
    texteType = 'argumentatif';
  } else if (chapterId.includes('resume')) {
    texteType = 'resume';
  }

  // Charger le contexte depuis le fichier Markdown
  const baseContexte = await fetchMarkdownContext(texteType);
  
  // Contexte adapté pour l'activité spécifique
  let contexte = `Activité : ${activity.title}\n\nConsigne originale : ${activity.instructions || 'Non spécifiée'}\n\nVoici la réponse de l'élève à corriger et analyser en détail :\n\n${answer}\n\nIMPORTANT : Analyse la réponse de l'élève ligne par ligne. Pour chaque élément du tableau, indique si c'est correct ou incorrect, et explique pourquoi. Donne des conseils précis pour améliorer chaque réponse. Sois spécifique et constructif.`;
  
  // Si c'est une activité avec tableau, adapter le contexte
  if (activity.hasTable) {
    contexte += `\n\nL'élève a répondu avec un tableau. Corrige chaque élément du tableau et donne des conseils précis pour améliorer sa réponse.`;
    
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
    // Combiner le contexte de base avec le contexte de l'activité
    const contexteFinal = `${baseContexte}\n\n${contexte}`;
    
    const reponse = await window.runFourModelPipeline(answer, contexteFinal);
    
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
    console.error('Erreur IA :', e);
    feedbackTextEl.textContent = 'Désolé, une erreur technique est survenue. Veuillez réessayer.';
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

