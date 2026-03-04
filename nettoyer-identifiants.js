// =================================================================
// SCRIPT DE NETTOYAGE - ANCIENS IDENTIFIANTS ÉTUDIANTS
// Supprime les anciennes sessions et données localStorage
// =================================================================

function nettoyerAnciensIdentifiants() {
    console.log("🧹 Nettoyage des anciens identifiants étudiants...");
    
    // Clés localStorage à supprimer
    const clesASupprimer = [
        'currentUser',
        'userSession',
        'studentData',
        'homeworkData',
        'userPreferences',
        'lastLogin'
    ];
    
    let supprimees = 0;
    
    clesASupprimer.forEach(cle => {
        if (localStorage.getItem(cle)) {
            localStorage.removeItem(cle);
            console.log(`✅ Supprimé: ${cle}`);
            supprimees++;
        }
    });
    
    // Nettoyer toutes les clés contenant "etudiant" ou "user"
    for (let i = 0; i < localStorage.length; i++) {
        const cle = localStorage.key(i);
        if (cle && (cle.includes('etudiant') || cle.includes('user') || cle.includes('student'))) {
            localStorage.removeItem(cle);
            console.log(`✅ Supprimé: ${cle}`);
            supprimees++;
        }
    }
    
    console.log(`🧹 Nettoyage terminé: ${supprimees} entrées supprimées`);
    
    // Afficher le localStorage restant
    console.log("📋 localStorage restant:");
    for (let i = 0; i < localStorage.length; i++) {
        const cle = localStorage.key(i);
        console.log(`  - ${cle}: ${localStorage.getItem(cle)?.substring(0, 50)}...`);
    }
    
    return supprimees;
}

// Fonction pour réinitialiser complètement le localStorage
function reinitialiserLocalStorage() {
    console.log("🔄 Réinitialisation complète du localStorage...");
    localStorage.clear();
    console.log("✅ localStorage vidé complètement");
}

// Fonction pour vérifier les comptes actuels
function verifierComptesActuels() {
    console.log("🔍 Vérification des comptes étudiants actuels:");
    
    // Importer les comptes depuis le fichier comptes-etudiants.js si disponible
    if (typeof etudiants !== 'undefined') {
        console.log(`📊 ${etudiants.length} comptes étudiants disponibles:`);
        etudiants.forEach((etudiant, index) => {
            console.log(`  ${index + 1}. ${etudiant.username} - ${etudiant.prenom} ${etudiant.nom}`);
        });
    } else {
        console.log("⚠️ Fichier comptes-etudiants.js non chargé");
    }
    
    // Vérifier la session actuelle
    const sessionActuelle = localStorage.getItem('currentUser');
    if (sessionActuelle) {
        try {
            const user = JSON.parse(sessionActuelle);
            console.log("👤 Session actuelle:", user.displayName || user.username);
        } catch (e) {
            console.log("❌ Session corrompue, sera nettoyée");
        }
    } else {
        console.log("📭 Aucune session active");
    }
}

// Exécuter le nettoyage automatiquement
if (typeof window !== 'undefined') {
    // Environnement navigateur
    document.addEventListener('DOMContentLoaded', function() {
        console.log("🚀 Démarrage du nettoyage des anciens identifiants...");
        nettoyerAnciensIdentifiants();
        verifierComptesActuels();
    });
} else {
    // Environnement Node.js
    nettoyerAnciensIdentifiants();
    verifierComptesActuels();
}

// Export pour utilisation manuelle
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        nettoyerAnciensIdentifiants,
        reinitialiserLocalStorage,
        verifierComptesActuels
    };
}
