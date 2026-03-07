// Fonction pour récupérer le contexte depuis les fichiers Markdown
async function fetchMarkdownContext(topic) {
  const fallbackContexts = {
    'techniques': "Tu es un expert en français et en pédagogie. Tu aides les élèves à maîtriser les techniques et pratiques de l'écrit. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur la production écrite, la planification, la révision, l'analyse de consignes, la recherche documentaire, la cohérence textuelle et la correction.",
    'narratif': "Tu es un expert en français et en pédagogie. Tu aides les élèves à produire des textes narratifs de qualité. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur la structure du récit (situation initiale, élément perturbateur, péripéties, dénouement), les types de narrateurs, les temps verbaux, la création de personnages et les dialogues.",
    'descriptif': "Tu es un expert en français et en pédagogie. Tu aides les élèves à produire des textes descriptifs de qualité. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur l'organisation spatiale et temporelle, les procédés descriptifs (comparaisons, métaphores), les figures de style, les champs lexicaux et les registres de description.",
    'explicatif': "Tu es un expert en français et en pédagogie. Tu aides les élèves à produire des textes explicatifs de qualité. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur la définition du sujet, l'organisation logique des idées, les connecteurs et marqueurs de relation, les causes et conséquences, les exemples et analogies.",
    'argumentatif': "Tu es un expert en français et en pédagogie. Tu aides les élèves à produire des textes argumentatifs de qualité. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur la formulation d'une thèse, la construction d'arguments solides, les preuves et exemples, la réfutation des objections, et les techniques de persuasion.",
    'resume': "Tu es un expert en français et en pédagogie. Tu aides les élèves à produire des résumés de qualité. Réponds en français correct, sans fautes grammaticales ou orthographiques. Sois pédagogue, encourageant et professionnel. Aide l'étudiant sur l'identification des idées essentielles, la hiérarchisation des informations, la reformulation, la condensation et la neutralité du point de vue."
  };
  
  return fallbackContexts[topic] || "Tu es un tuteur expert en français. Aide l'étudiant sans faire le travail à sa place.";
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
    return;
  }

  console.log('📝 Réponse récupérée:', answer);

  // Vérifier si la pipeline IA est disponible - AVEC ATTENTE
  console.log('🔍 DIAGNOSTIC ACTIVITÉS - Étape 1: Vérification demanderIA');
  console.log('📋 demanderIA disponible:', typeof window.demanderIA);
  
  // ATTEndre que demanderIA soit disponible
  const maxWaitTime = 5000; // 5 secondes max
  const startTime = Date.now();
  
  while (typeof window.demanderIA !== 'function' && (Date.now() - startTime) < maxWaitTime) {
    console.log('⏳ ACTIVITÉS - En attente de demanderIA...');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (typeof window.demanderIA !== 'function') {
    console.error('❌ ACTIVITÉS - demanderIA toujours non disponible après attente');
    if (feedbackTextEl) {
      feedbackTextEl.innerHTML = '<div class="text-red-600">❌ Le service IA met du temps à se charger. Veuillez réessayer dans quelques instants.</div>';
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
    console.log('🔍 DIAGNOSTIC ACTIVITÉS - Étape 2: Préparation appel IA');
    console.log('📝 Réponse étudiant:', answer);
    console.log('📝 Contexte final:', contexteFinal);
    
    // Combiner le contexte de base avec le contexte de l'activité
    const contexteFinal = `${baseContexte}\n\n${contexte}`;
    
    console.log('🚀 DIAGNOSTIC ACTIVITÉS - Étape 3: Appel de demanderIA');
    window.demanderIA(answer, contexteFinal).then(reponse => {
    
    console.log('✅ DIAGNOSTIC ACTIVITÉS - Étape 4: Réponse reçue');
    console.log('📨 Réponse IA:', reponse);
    console.log('📋 Type de réponse:', typeof reponse);
    console.log('📋 Longueur de réponse:', reponse ? reponse.length : 0);
    
    // Afficher la réponse de l'IA avec le même système que le chat
    if (typeof window.addChatMessage !== 'undefined') {
      // Créer un message de chat temporaire pour afficher la réponse
      const tempChatContainer = document.createElement('div');
      tempChatContainer.className = 'p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4';
      tempChatContainer.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: var(--bs-primary);">
            <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div class="flex-1">
            <div class="rounded-lg p-4" style="background-color: rgba(255,255,255,0.05);">
              <div class="flex items-start justify-between">
                <p class="text-sm flex-1" style="color: var(--bs-white);"></p>
                <button onclick="playAudio(this)" class="ml-3 p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 transition-colors" title="Lire à voix haute">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.5 5 4.5V8c0-1-.62-1.02-1.64-2.5-1.77V3.23z"/>
                  </svg>
                </button>
              </div>
              <p class="text-xs mt-1" style="color: var(--bs-text-muted);">IA • ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      `;
      
      // Remplacer le feedback par le message de chat
      feedbackTextEl.innerHTML = '';
      feedbackTextEl.appendChild(tempChatContainer);
      
      // Appliquer l'effet de frappe sur le texte
      const textElement = tempChatContainer.querySelector('p.text-sm');
      if (typeof window.simulateTypingEffect === 'function') {
        window.simulateTypingEffect(textElement, reponse);
      } else {
        textElement.textContent = reponse || 'Aucun retour de l\'IA.';
      }
    } else {
      // Fallback : afficher directement
      if (activity.hasTable) {
        feedbackTextEl.innerHTML = formatFeedbackAsTable(reponse);
      } else {
        feedbackTextEl.textContent = reponse || 'Aucun retour de l\'IA.';
      }
    }
  }).catch(e => {
    console.error('❌ DIAGNOSTIC ACTIVITÉS - Erreur dans appel IA');
    console.error('📍 Erreur:', e);
    console.error('📍 Stack trace:', e.stack);
    console.error('📍 Message erreur:', e.message);
    
    feedbackTextEl.textContent = 'Désolé, une erreur technique est survenue. Veuillez réessayer.';
  });
  });
  };
};

// Fonction pour créer un textarea avec assistant d'écriture
window.createSmartTextarea = function(chapterId, activityId, placeholder = "Votre réponse...") {
  return `
    <div class="smart-textarea-container">
      <textarea 
        id="activity-answer-${chapterId}-${activityId}"
        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows="6"
        placeholder="${placeholder}"
        oninput="window.writingAssistant && window.writingAssistant.checkText(this)"
      ></textarea>
      <div class="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>💡 L'assistant d'écriture vous aide en temps réel</span>
        <button 
          class="px-2 py-1 bg-amber-100 text-amber-600 rounded hover:bg-amber-200 transition-colors"
          onclick="window.writingAssistant && window.writingAssistant.toggleAudio()"
        >
          <svg class="h-5 w-5 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.5 5 4.5V8c0-1-.62-1.02-1.64-2.5-1.77V3.23z"/>
          </svg>
          Audio
        </button>
      </div>
    </div>
  `;
};

// Fonction pour formater la réponse de l'IA en tableau si elle contient des données tabulaires
function formatFeedbackAsTable(response) {
  // Simple formatting pour les réponses de type tableau
  if (!response) return 'Aucune réponse disponible.';
  
  // Si la réponse contient des éléments qui ressemblent à un tableau
  if (response.includes('|') && response.includes('-')) {
    const lines = response.split('\n');
    let tableHtml = '<table class="w-full border-collapse border border-gray-300">';
    
    lines.forEach(line => {
      if (line.trim()) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 0) {
          tableHtml += '<tr>';
          cells.forEach(cell => {
            tableHtml += `<td class="border border-gray-300 px-2 py-1 text-sm">${cell}</td>`;
          });
          tableHtml += '</tr>';
        }
      }
    });
    
    tableHtml += '</table>';
    return tableHtml;
  }
  
  return response;
}

// Fonction pour obtenir la réponse de l'élève (tableau ou textarea)
window.getActivityAnswer = function(chapterId, activityId, hasTable) {
  if (hasTable) {
    // Récupérer les données du tableau
    const tableData = {};
    const tableRows = document.querySelectorAll(`#activity-table-${chapterId}-${activityId} tbody tr`);
    
    tableRows.forEach((row, index) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const textType = cells[0].textContent.trim();
        const question = cells[1].textContent.trim();
        const answer = cells[2].querySelector('input, textarea')?.value?.trim() || '';
        
        tableData[`row_${index}`] = {
          textType,
          question,
          answer
        };
      }
    });
    
    return JSON.stringify(tableData);
  } else {
    // Récupérer le contenu du textarea
    const textarea = document.getElementById(`activity-answer-${chapterId}-${activityId}`);
    return textarea ? textarea.value.trim() : '';
  }
};

// Fonction pour générer les inputs de tableau
function generateTableInput(chapterId, activityId, tableType) {
  const tableData = {
    'tri-inductif': [
      { textType: 'A (Récit)', question: 'Que s\'est-il passé ?', intention: 'Raconter', indices: 'Passé simple, temps du récit' },
      { textType: 'B (Description)', question: 'Que s\'est-il passé ?', intention: 'Décrire', indices: 'Adjectifs, temps descriptifs' },
      { textType: 'C (Explicatif)', question: 'Que s\'est-il passé ?', intention: 'Expliquer', indices: 'Connecteurs logiques' }
    ],
    'definir-sujet': [
      { element: 'Thème', description: 'Domaine général du sujet' },
      { element: 'Domaine', description: 'Zone spécifique étudiée' },
      { element: 'Objectif', description: 'But de l\'explication' }
    ],
    'causes-consequences': [
      { element: 'Cause principale', description: 'Origine du phénomène' },
      { element: 'Conséquence directe', description: 'Résultat immédiat' },
      { element: 'Conséquence indirecte', description: 'Effet secondaire' }
    ],
    'exemples-analogies': [
      { element: 'Exemple 1', description: 'Premier cas concret' },
      { element: 'Exemple 2', description: 'Deuxième cas concret' },
      { element: 'Analogie', description: 'Comparaison éclairante' }
    ],
    'synthese-claire': [
      { element: 'Idée principale', description: 'Message central' },
      { element: 'Arguments clés', description: 'Points essentiels' },
      { element: 'Conclusion', description: 'Synthèse finale' }
    ]
  };

  const data = tableData[tableType] || tableData['tri-inductif'];
  
  return `
    <table id="activity-table-${chapterId}-${activityId}" class="w-full border-collapse border border-gray-300">
      <thead>
        <tr class="bg-gray-50">
          ${Object.keys(data[0]).map(key => `<th class="border border-gray-300 px-2 py-1 text-left text-xs font-medium">${key}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map((row, index) => `
          <tr>
            ${Object.values(row).map((value, cellIndex) => `
              <td class="border border-gray-300 px-2 py-1">
                ${cellIndex === 0 ? value : `
                  <input type="text" 
                    class="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="${value}">
                `}
              </td>
            `).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

console.log('✅ Activities système chargé');
