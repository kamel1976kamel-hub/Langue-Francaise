// Script de secours pour afficher l'interface si le login échoue
(function() {
  'use strict';
  
  // Attendre que le DOM soit chargé
  function init() {
    const mainApp = document.getElementById('mainApp');
    const authModal = document.getElementById('authModal');
    
    if (!mainApp || !authModal) {
      console.error('Éléments non trouvés');
      return;
    }
    
    // Vérifier s'il y a une session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        console.log('Session restaurée:', user);
        authModal.classList.add('hidden');
        mainApp.classList.remove('hidden');
      } catch (e) {
        console.error('Erreur session:', e);
        localStorage.removeItem('currentUser');
      }
    }
    
    // Intercepter le formulaire de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        setTimeout(function() {
          // Forcer l'affichage après le login
          authModal.classList.add('hidden');
          mainApp.classList.remove('hidden');
          console.log('Login forcé - interface affichée');
        }, 100);
      });
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
