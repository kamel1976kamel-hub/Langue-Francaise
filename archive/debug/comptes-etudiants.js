/**
 * =================================================================
 * SYSTÈME DE GESTION DES COMPTES UTILISATEURS
 * Enseignants et étudiants - Version optimisée
 * Généré le : 04/03/2026
 * =================================================================
 */

// Configuration
const CONFIG = {
    EMAIL_DOMAINS: {
        teacher: 'enseignant.fr',
        student: 'etudiant.fr'
    },
    PASSWORD_FORMAT: {
        teacher: (prenom) => `${prenom}@2024!`,
        student: (prenom) => `${prenom}2024!`
    }
};

// Base de données des utilisateurs
const utilisateurs = [
    {
        id: 'teacher_001',
        nom: "CHELLOUAI",
        prenom: "KAMEL",
        username: "kamel.chellouai",
        password: "Kamel@2024!",
        email: "kamel.chellouai@enseignant.fr",
        role: "teacher",
        displayName: "KAMEL CHELLOUAI",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_001',
        nom: "HAMDAOUI",
        prenom: "AMIRA CHAHD",
        username: "amira.hamdaoui",
        password: "Amira2024!",
        email: "amira.hamdaoui@etudiant.fr",
        role: "student",
        displayName: "AMIRA CHAHD HAMDAOUI",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_002',
        nom: "HAMZA",
        prenom: "WISSAL",
        username: "wissal.hamza",
        password: "Wissal2024!",
        email: "wissal.hamza@etudiant.fr",
        role: "student",
        displayName: "WISSAL HAMZA",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_003',
        nom: "HERZALLAH",
        prenom: "ISRA",
        username: "isra.herzallah",
        password: "Isra2024!",
        email: "isra.herzallah@etudiant.fr",
        role: "student",
        displayName: "ISRA HERZALLAH",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_004',
        nom: "KABOUCHE",
        prenom: "RYM",
        username: "rym.kabouche",
        password: "Rym2024!",
        email: "rym.kabouche@etudiant.fr",
        role: "student",
        displayName: "RYM KABOUCHE",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_005',
        nom: "LAIB",
        prenom: "LOUBNA HIBATERRAHMANE",
        username: "loubna.laib",
        password: "Loubna2024!",
        email: "loubna.laib@etudiant.fr",
        role: "student",
        displayName: "LOUBNA HIBATERRAHMANE LAIB",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_006',
        nom: "MAGHNI",
        prenom: "HIBAT ERRAHMANE",
        username: "hibat.maghi",
        password: "Hibat2024!",
        email: "hibat.maghi@etudiant.fr",
        role: "student",
        displayName: "HIBAT ERRAHMANE MAGHNI",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_007',
        nom: "METLOUG",
        prenom: "CHOUROUK",
        username: "chourouk.metlou",
        password: "Chourouk2024!",
        email: "chourouk.metlou@etudiant.fr",
        role: "student",
        displayName: "CHOUROUK METLOUG",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_008',
        nom: "OUAMANE",
        prenom: "ALAIE",
        username: "alaie.ouamane",
        password: "Alaie2024!",
        email: "alaie.ouamane@etudiant.fr",
        role: "student",
        displayName: "ALAIE OUAMANE",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_009',
        nom: "REHOUMA",
        prenom: "CHAHD",
        username: "chahd.rehouma",
        password: "Chahd2024!",
        email: "chahd.rehouma@etudiant.fr",
        role: "student",
        displayName: "CHAHD REHOUMA",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_010',
        nom: "SAADI",
        prenom: "SALSABIL",
        username: "salsabil.saadi",
        password: "Salsabil2024!",
        email: "salsabil.saadi@etudiant.fr",
        role: "student",
        displayName: "SALSABIL SAADI",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_011',
        nom: "SASSOUI",
        prenom: "FATMA ZOHRA AROUA",
        username: "fatma.sassoui",
        password: "Fatma2024!",
        email: "fatma.sassoui@etudiant.fr",
        role: "student",
        displayName: "FATMA ZOHRA AROUA SASSOUI",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_012',
        nom: "SEID",
        prenom: "DJAMILA",
        username: "djamila.seid",
        password: "Djamila2024!",
        email: "djamila.seid@etudiant.fr",
        role: "student",
        displayName: "DJAMILA SEID",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_013',
        nom: "SERRAOUI",
        prenom: "AYAT ERRAHMANE",
        username: "ayat.serraoui",
        password: "Ayat2024!",
        email: "ayat.serraoui@etudiant.fr",
        role: "student",
        displayName: "AYAT ERRAHMANE SERRAOUI",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_014',
        nom: "TAGHZOUT",
        prenom: "CHAIMA",
        username: "chaima.taghzout",
        password: "Chaima2024!",
        email: "chaima.taghzout@etudiant.fr",
        role: "student",
        displayName: "CHAIMA TAGHZOUT",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_015',
        nom: "TOUAMI",
        prenom: "SERINE LEILA",
        username: "serine.touami",
        password: "Serine2024!",
        email: "serine.touami@etudiant.fr",
        role: "student",
        displayName: "SERINE LEILA TOUAMI",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_016',
        nom: "ZEGAR",
        prenom: "SARA",
        username: "sara.zegar",
        password: "Sara2024!",
        email: "sara.zegar@etudiant.fr",
        role: "student",
        displayName: "SARA ZEGAR",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_017',
        nom: "ZERROUAK",
        prenom: "SAFAA NOUR ELYAKINE",
        username: "safaa.zerrouak",
        password: "Safaa2024!",
        email: "safaa.zerrouak@etudiant.fr",
        role: "student",
        displayName: "SAFAA NOUR ELYAKINE ZERROUAK",
        actif: true,
        dateCreation: new Date('2024-01-01')
    },
    {
        id: 'student_018',
        nom: "ZIOUCHI",
        prenom: "FATIMA",
        username: "fatima.ziouchi",
        password: "Fatima2024!",
        email: "fatima.ziouchi@etudiant.fr",
        role: "student",
        displayName: "FATIMA ZIOUCHI",
        actif: true,
        dateCreation: new Date('2024-01-01')
    }
];

// =================================================================
// CLASSE DE GESTION DES UTILISATEURS
// =================================================================

class GestionUtilisateurs {
    constructor() {
        this.utilisateurs = utilisateurs;
        this.initialiser();
    }

    /**
     * Initialise le système
     */
    initialiser() {
        console.log('🚀 Système de gestion des utilisateurs initialisé');
        console.log(`📊 ${this.getStatistiques().total} utilisateurs chargés`);
    }

    /**
     * Récupère les statistiques
     */
    getStatistiques() {
        const stats = {
            total: this.utilisateurs.length,
            enseignants: this.utilisateurs.filter(u => u.role === 'teacher').length,
            etudiants: this.utilisateurs.filter(u => u.role === 'student').length,
            actifs: this.utilisateurs.filter(u => u.actif).length
        };
        return stats;
    }

    /**
     * Affiche la liste des utilisateurs
     */
    afficherListe() {
        console.log('\n📋 LISTE DES UTILISATEURS');
        console.log('='.repeat(60));
        
        this.utilisateurs.forEach((utilisateur, index) => {
            const roleIcon = utilisateur.role === 'teacher' ? '👨‍🏫' : '👩‍🎓';
            console.log(`${index + 1}. ${roleIcon} ${utilisateur.displayName}`);
            console.log(`   📧 Email: ${utilisateur.email}`);
            console.log(`   👤 Username: ${utilisateur.username}`);
            console.log(`   🔑 Password: ${utilisateur.password}`);
            console.log(`   🆔 ID: ${utilisateur.id}`);
            console.log(`   ✅ Actif: ${utilisateur.actif ? 'Oui' : 'Non'}`);
            console.log();
        });
        
        const stats = this.getStatistiques();
        console.log(`📊 Total: ${stats.total} | Enseignants: ${stats.enseignants} | Étudiants: ${stats.etudiants}`);
        console.log('='.repeat(60));
    }

    /**
     * Recherche un utilisateur
     */
    rechercherUtilisateur(critere) {
        const resultat = this.utilisateurs.find(u => 
            u.username.toLowerCase() === critere.toLowerCase() ||
            u.email.toLowerCase() === critere.toLowerCase() ||
            u.id.toLowerCase() === critere.toLowerCase() ||
            (u.nom.toLowerCase() === critere.split(' ')[0]?.toLowerCase() && 
             u.prenom.toLowerCase().includes(critere.split(' ').slice(1).join(' ').toLowerCase()))
        );
        
        return resultat || null;
    }

    /**
     * Recherche par nom et prénom
     */
    rechercherParNomPrenom(nom, prenom) {
        return this.utilisateurs.find(u => 
            u.nom.toLowerCase() === nom.toLowerCase() && 
            u.prenom.toLowerCase().includes(prenom.toLowerCase())
        ) || null;
    }

    /**
     * Vérifie la connexion
     */
    verifierConnexion(username, password) {
        const utilisateur = this.utilisateurs.find(u => u.username === username);
        
        if (!utilisateur) {
            return {
                success: false,
                message: "Nom d'utilisateur incorrect",
                code: 'USER_NOT_FOUND'
            };
        }

        if (!utilisateur.actif) {
            return {
                success: false,
                message: "Compte désactivé",
                code: 'ACCOUNT_DISABLED'
            };
        }

        if (utilisateur.password !== password) {
            return {
                success: false,
                message: "Mot de passe incorrect",
                code: 'INVALID_PASSWORD'
            };
        }

        return {
            success: true,
            utilisateur: {
                id: utilisateur.id,
                username: utilisateur.username,
                displayName: utilisateur.displayName,
                email: utilisateur.email,
                role: utilisateur.role
            },
            message: "Connexion réussie"
        };
    }

    /**
     * Génère le fichier CSV
     */
    genererCSV() {
        const headers = ['ID', 'Nom', 'Prénom', 'Email', 'Username', 'Password', 'Role', 'Actif'];
        let csv = headers.join(',') + '\n';
        
        this.utilisateurs.forEach(u => {
            csv += [
                u.id,
                u.nom,
                `"${u.prenom}"`,
                u.email,
                u.username,
                u.password,
                u.role,
                u.actif
            ].join(',') + '\n';
        });
        
        return csv;
    }

    /**
     * Génère le JSON pour export
     */
    genererJSON() {
        return JSON.stringify({
            metadata: {
                dateGeneration: new Date().toISOString(),
                totalUtilisateurs: this.utilisateurs.length,
                version: '2.0'
            },
            utilisateurs: this.utilisateurs.map(u => ({
                id: u.id,
                displayName: u.displayName,
                username: u.username,
                email: u.email,
                role: u.role,
                actif: u.actif
            }))
        }, null, 2);
    }

    /**
     * Filtre les utilisateurs par rôle
     */
    filtrerParRole(role) {
        return this.utilisateurs.filter(u => u.role === role);
    }

    /**
     * Récupère les utilisateurs actifs
     */
    getUtilisateursActifs() {
        return this.utilisateurs.filter(u => u.actif);
    }
}

// =================================================================
// INSTANCES ET EXPORTS
// =================================================================

// Instance principale
const gestionUtilisateurs = new GestionUtilisateurs();

// Alias pour compatibilité avec l'ancien code
const etudiants = gestionUtilisateurs.utilisateurs;
const afficherListeEtudiants = gestionUtilisateurs.afficherListe.bind(gestionUtilisateurs);
const rechercherEtudiant = gestionUtilisateurs.rechercherParNomPrenom.bind(gestionUtilisateurs);
const verifierConnexion = gestionUtilisateurs.verifierConnexion.bind(gestionUtilisateurs);
const genererCSV = gestionUtilisateurs.genererCSV.bind(gestionUtilisateurs);

// Export moderne
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GestionUtilisateurs,
        gestionUtilisateurs,
        // Compatibilité avec l'ancien code
        etudiants,
        afficherListeEtudiants,
        rechercherEtudiant,
        verifierConnexion,
        genererCSV,
        // Nouvelles fonctionnalités
        CONFIG,
        utilisateurs
    };
}

// Export pour navigateur
if (typeof window !== 'undefined') {
    window.gestionUtilisateurs = gestionUtilisateurs;
    window.GestionUtilisateurs = GestionUtilisateurs;
    // Compatibilité
    window.etudiants = etudiants;
    window.afficherListeEtudiants = afficherListeEtudiants;
    window.rechercherEtudiant = rechercherEtudiant;
    window.verifierConnexion = verifierConnexion;
    window.genererCSV = genererCSV;
}

// Affichage automatique en environnement Node.js
if (typeof window === 'undefined' && typeof module !== 'undefined') {
    afficherListeEtudiants();
}
