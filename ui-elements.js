// Gestion des éléments d'interface utilisateur
// Fonctions pour les menus, panneaux, et interactions UI

// ============ PANEL ACCESSIBILITÉ ============
window.toggleAccessibilityPanel = function() {
  const panel = document.getElementById('accessibilityPanel');
  const settingsPanel = document.getElementById('settingsPanel');
  const progressionPanel = document.getElementById('progressionPanel');
  settingsPanel.classList.add('hidden');
  progressionPanel.classList.add('hidden');
  panel.classList.toggle('hidden');
};

// ============ PANEL DE PARAMÈTRES ============
window.toggleSettingsPanel = function() {
  const panel = document.getElementById('settingsPanel');
  const accessibilityPanel = document.getElementById('accessibilityPanel');
  const progressionPanel = document.getElementById('progressionPanel');
  accessibilityPanel.classList.add('hidden');
  progressionPanel.classList.add('hidden');
  panel.classList.toggle('hidden');
  
  // Mettre à jour les infos utilisateur
  if (currentUser) {
    document.getElementById('settingsInitial').textContent = currentUser.displayName.charAt(0).toUpperCase();
  }
};

// ============ PANEL PROGRESSION ============
window.toggleProgressionPanel = function() {
  const panel = document.getElementById('progressionPanel');
  const accessibilityPanel = document.getElementById('accessibilityPanel');
  const settingsPanel = document.getElementById('settingsPanel');
  accessibilityPanel.classList.add('hidden');
  settingsPanel.classList.add('hidden');
  panel.classList.toggle('hidden');
};

// ============ PANEL BASE DE DONNÉES ============
window.toggleDatabasePanel = function() {
  const panel = document.getElementById('databasePanel');
  const accessibilityPanel = document.getElementById('accessibilityPanel');
  const settingsPanel = document.getElementById('settingsPanel');
  const progressionPanel = document.getElementById('progressionPanel');
  accessibilityPanel.classList.add('hidden');
  settingsPanel.classList.add('hidden');
  progressionPanel.classList.add('hidden');
  panel.classList.toggle('hidden');
};

// ============ PANEL DEVOIRS ============
window.toggleHomeworkPanel = function() {
  const panel = document.getElementById('homeworkPanel');
  const accessibilityPanel = document.getElementById('accessibilityPanel');
  const settingsPanel = document.getElementById('settingsPanel');
  const progressionPanel = document.getElementById('progressionPanel');
  const databasePanel = document.getElementById('databasePanel');
  
  accessibilityPanel.classList.add('hidden');
  settingsPanel.classList.add('hidden');
  progressionPanel.classList.add('hidden');
  databasePanel.classList.add('hidden');
  panel.classList.toggle('hidden');
  
  // Adapter le contenu selon le rôle
  const subtitle = document.getElementById('homeworkSubtitle');
  const uploadSection = document.getElementById('studentHomeworkSection');
  
  if (currentUser && currentUser.role === 'teacher') {
    subtitle.textContent = 'Consulter les devoirs des étudiants';
    uploadSection.classList.add('hidden');
    document.querySelector('#homeworkPanel h4').textContent = 'Sélectionnez un étudiant dans Progression';
  } else {
    subtitle.textContent = 'Déposer vos travaux';
    uploadSection.classList.remove('hidden');
    if (typeof loadMyHomeworkList !== 'undefined') {
      loadMyHomeworkList();
    }
  }
};

// ============ PANEL ANNONCES ============
window.toggleAnnouncementsPanel = function() {
  const panel = document.getElementById('announcementsPanel');
  const homeworkPanel = document.getElementById('homeworkPanel');
  const accessibilityPanel = document.getElementById('accessibilityPanel');
  const settingsPanel = document.getElementById('settingsPanel');
  const progressionPanel = document.getElementById('progressionPanel');
  const databasePanel = document.getElementById('databasePanel');
  
  homeworkPanel.classList.add('hidden');
  accessibilityPanel.classList.add('hidden');
  settingsPanel.classList.add('hidden');
  progressionPanel.classList.add('hidden');
  databasePanel.classList.add('hidden');
  panel.classList.toggle('hidden');
  
  // Adapter le contenu selon le rôle
  const teacherSection = document.getElementById('teacherAnnouncementsSection');
  if (currentUser && currentUser.role === 'teacher') {
    teacherSection.classList.remove('hidden');
  } else {
    teacherSection.classList.add('hidden');
    // Marquer les annonces comme lues quand l'étudiant ouvre le panel
    if (typeof markAllAsRead !== 'undefined') {
      markAllAsRead();
    }
  }
  
  // Charger les annonces
  if (typeof loadAnnouncements !== 'undefined') {
    loadAnnouncements();
  }
};

// ============ GESTION DES ANNONCES ============
window.saveAnnouncement = function() {
  const title = document.getElementById('announcementTitle').value.trim();
  const content = document.getElementById('announcementContent').value.trim();
  
  if (!title || !content) {
    alert('Veuillez remplir tous les champs');
    return;
  }
  
  const announcement = {
    id: Date.now(),
    title: title,
    content: content,
    author: currentUser.displayName,
    date: new Date().toISOString(),
    read: false
  };
  
  // Sauvegarder dans localStorage
  let announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
  announcements.unshift(announcement);
  localStorage.setItem('announcements', JSON.stringify(announcements));
  
  // Réinitialiser le formulaire
  if (typeof clearAnnouncementForm !== 'undefined') {
    clearAnnouncementForm();
  }
  
  // Mettre à jour l'affichage
  if (typeof loadAnnouncements !== 'undefined') {
    loadAnnouncements();
  }
  if (typeof updateAnnouncementsBadge !== 'undefined') {
    updateAnnouncementsBadge();
  }
  
  alert('Annonce publiée avec succès !');
};

window.clearAnnouncementForm = function() {
  document.getElementById('announcementTitle').value = '';
  document.getElementById('announcementContent').value = '';
};

window.loadAnnouncements = function() {
  const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
  const listElement = document.getElementById('announcementsList');
  const noMessageElement = document.getElementById('noAnnouncementsMessage');
  
  if (announcements.length === 0) {
    listElement.innerHTML = '<p class="text-xs text-center py-4" style="color: var(--bs-text-muted);" id="noAnnouncementsMessage">Aucune annonce pour le moment</p>';
    return;
  }
  
  // Cacher le message "aucune annonce"
  if (noMessageElement) {
    noMessageElement.style.display = 'none';
  }
  
  // Générer le HTML pour chaque annonce
  listElement.innerHTML = announcements.map(announcement => {
    const date = new Date(announcement.date);
    const dateStr = date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const isUnread = !announcement.read && currentUser && currentUser.role !== 'teacher';
    const unreadClass = isUnread ? 'font-bold' : '';
    
    return `
      <div class="rounded-lg p-3" style="background-color: rgba(255,255,255,0.03);">
        <div class="flex justify-between items-start mb-2">
          <h5 class="text-sm ${unreadClass}" style="color: var(--bs-white);">${escapeHtml(announcement.title)}</h5>
          ${isUnread ? '<span class="w-2 h-2 rounded-full bg-blue-500"></span>' : ''}
        </div>
        <p class="text-xs mb-2 ${unreadClass}" style="color: var(--bs-text-muted);">${escapeHtml(announcement.content)}</p>
        <div class="flex justify-between items-center text-[10px]" style="color: var(--bs-text-muted);">
          <span>Par ${escapeHtml(announcement.author)}</span>
          <span>${dateStr}</span>
        </div>
      </div>
    `;
  }).join('');
};

window.markAllAsRead = function() {
  let announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
  announcements = announcements.map(announcement => ({
    ...announcement,
    read: true
  }));
  localStorage.setItem('announcements', JSON.stringify(announcements));
  
  // Mettre à jour l'affichage
  if (typeof loadAnnouncements !== 'undefined') {
    loadAnnouncements();
  }
  if (typeof updateAnnouncementsBadge !== 'undefined') {
    updateAnnouncementsBadge();
  }
};

window.updateAnnouncementsBadge = function() {
  const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
  const unreadCount = announcements.filter(a => !a.read).length;
  const badge = document.getElementById('announcements-badge');
  
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
};