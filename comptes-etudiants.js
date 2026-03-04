// =================================================================
// COMPTES UTILISATEURS - ÉTUDIANTS ET ENSEIGNANT
// Généré le : 04/03/2026
// Format : nom d'utilisateur = prenom.nom / mot de passe sécurisé
// =================================================================

const etudiants = [
    {
        nom: "CHELLOUAI",
        prenom: "KAMEL",
        username: "kamel.chellouai",
        password: "Kamel@2024!",
        email: "kamel.chellouai@enseignant.fr",
        role: "teacher"
    },
    {
        nom: "HAMDAOUI",
        prenom: "AMIRA CHAHD",
        username: "amira.hamdaoui",
        password: "Amira2024!",
        email: "amira.hamdaoui@etudiant.fr"
    },
    {
        nom: "HAMZA",
        prenom: "WISSAL",
        username: "wissal.hamza",
        password: "Wissal2024!",
        email: "wissal.hamza@etudiant.fr"
    },
    {
        nom: "HERZALLAH",
        prenom: "ISRA",
        username: "isra.herzallah",
        password: "Isra2024!",
        email: "isra.herzallah@etudiant.fr"
    },
    {
        nom: "KABOUCHE",
        prenom: "RYM",
        username: "rym.kabouche",
        password: "Rym2024!",
        email: "rym.kabouche@etudiant.fr"
    },
    {
        nom: "LAIB",
        prenom: "LOUBNA HIBATERRAHMANE",
        username: "loubna.laib",
        password: "Loubna2024!",
        email: "loubna.laib@etudiant.fr"
    },
    {
        nom: "MAGHNI",
        prenom: "HIBAT ERRAHMANE",
        username: "hibat.maghi",
        password: "Hibat2024!",
        email: "hibat.maghi@etudiant.fr"
    },
    {
        nom: "METLOUG",
        prenom: "CHOUROUK",
        username: "chourouk.metlou",
        password: "Chourouk2024!",
        email: "chourouk.metlou@etudiant.fr"
    },
    {
        nom: "OUAMANE",
        prenom: "ALAIE",
        username: "alaie.ouamane",
        password: "Alaie2024!",
        email: "alaie.ouamane@etudiant.fr"
    },
    {
        nom: "REHOUMA",
        prenom: "CHAHD",
        username: "chahd.rehouma",
        password: "Chahd2024!",
        email: "chahd.rehouma@etudiant.fr"
    },
    {
        nom: "SAADI",
        prenom: "SALSABIL",
        username: "salsabil.saadi",
        password: "Salsabil2024!",
        email: "salsabil.saadi@etudiant.fr"
    },
    {
        nom: "SASSOUI",
        prenom: "FATMA ZOHRA AROUA",
        username: "fatma.sassoui",
        password: "Fatma2024!",
        email: "fatma.sassoui@etudiant.fr"
    },
    {
        nom: "SEID",
        prenom: "DJAMILA",
        username: "djamila.seid",
        password: "Djamila2024!",
        email: "djamila.seid@etudiant.fr"
    },
    {
        nom: "SERRAOUI",
        prenom: "AYAT ERRAHMANE",
        username: "ayat.serraoui",
        password: "Ayat2024!",
        email: "ayat.serraoui@etudiant.fr"
    },
    {
        nom: "TAGHZOUT",
        prenom: "CHAIMA",
        username: "chaima.taghzout",
        password: "Chaima2024!",
        email: "chaima.taghzout@etudiant.fr"
    },
    {
        nom: "TOUAMI",
        prenom: "SERINE LEILA",
        username: "serine.touami",
        password: "Serine2024!",
        email: "serine.touami@etudiant.fr"
    },
    {
        nom: "ZEGAR",
        prenom: "SARA",
        username: "sara.zegar",
        password: "Sara2024!",
        email: "sara.zegar@etudiant.fr"
    },
    {
        nom: "ZERROUAK",
        prenom: "SAFAA NOUR ELYAKINE",
        username: "safaa.zerrouak",
        password: "Safaa2024!",
        email: "safaa.zerrouak@etudiant.fr"
    },
    {
        nom: "ZIOUCHI",
        prenom: "FATIMA",
        username: "fatima.ziouchi",
        password: "Fatima2024!",
        email: "fatima.ziouchi@etudiant.fr"
    }
];

// =================================================================
// FONCTIONS UTILITAIRES
// =================================================================

function afficherListeEtudiants() {
    console.log("📋 LISTE DES ÉTUDIANTS - COMPTES UTILISATEURS");
    console.log("=" .repeat(60));
    console.log();
    
    etudiants.forEach((etudiant, index) => {
        console.log(`${index + 1}. ${etudiant.prenom} ${etudiant.nom}`);
        console.log(`   📧 Email: ${etudiant.email}`);
        console.log(`   👤 Nom d'utilisateur: ${etudiant.username}`);
        console.log(`   🔑 Mot de passe: ${etudiant.password}`);
        console.log();
    });
    
    console.log(`📊 Total: ${etudiants.length} étudiants`);
    console.log("=" .repeat(60));
}

function rechercherEtudiant(nom, prenom) {
    return etudiants.find(e => 
        e.nom.toLowerCase() === nom.toLowerCase() && 
        e.prenom.toLowerCase().includes(prenom.toLowerCase())
    );
}

function verifierConnexion(username, password) {
    const etudiant = etudiants.find(e => e.username === username);
    if (etudiant && etudiant.password === password) {
        return {
            success: true,
            etudiant: etudiant
        };
    }
    return {
        success: false,
        message: "Nom d'utilisateur ou mot de passe incorrect"
    };
}

function genererCSV() {
    let csv = "Nom,Prénom,Email,Username,Password\n";
    etudiants.forEach(e => {
        csv += `${e.nom},"${e.prenom}",${e.email},${e.username},${e.password}\n`;
    });
    return csv;
}

// =================================================================
// EXPORT
// =================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        etudiants,
        afficherListeEtudiants,
        rechercherEtudiant,
        verifierConnexion,
        genererCSV
    };
}

// Affichage automatique au chargement
if (typeof window === 'undefined') {
    // Environnement Node.js
    afficherListeEtudiants();
}
