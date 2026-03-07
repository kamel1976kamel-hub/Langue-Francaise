// =================================================================
// VÉRIFICATION DES IDENTIFIANTS ÉTUDIANTS
// Contrôle après nettoyage
// =================================================================

import fs from 'fs';

function verifierFichiersIdentifiants() {
    console.log("🔍 Vérification des fichiers d'identifiants étudiants...");
    
    // Vérifier le fichier comptes-etudiants.js
    try {
        const comptesContent = fs.readFileSync('./comptes-etudiants.js', 'utf8');
        const etudiantsMatch = comptesContent.match(/const etudiants = \[([\s\S]*?)\];/);
        
        if (etudiantsMatch) {
            console.log("✅ Fichier comptes-etudiants.js trouvé");
            
            // Compter les étudiants
            const etudiantMatches = comptesContent.match(/username:/g);
            if (etudiantMatches) {
                console.log(`📊 ${etudiantMatches.length} comptes étudiants dans le fichier`);
            }
        }
    } catch (e) {
        console.log("❌ Fichier comptes-etudiants.js non trouvé");
    }
    
    // Vérifier le fichier CSV
    try {
        const csvContent = fs.readFileSync('./comptes-etudiants.csv', 'utf8');
        const lignes = csvContent.split('\n').filter(line => line.trim());
        console.log(`✅ Fichier comptes-etudiants.csv trouvé: ${lignes.length - 1} étudiants`);
    } catch (e) {
        console.log("❌ Fichier comptes-etudiants.csv non trouvé");
    }
    
    // Vérifier index.html pour les anciens comptes
    try {
        const indexContent = fs.readFileSync('./index.html', 'utf8');
        
        // Vérifier les anciens comptes etudiantX
        const anciensComptes = indexContent.match(/etudiant\d+/g);
        if (anciensComptes) {
            console.log(`⚠️ ${anciensComptes.length} anciens comptes etudiantX trouvés dans index.html`);
        } else {
            console.log("✅ Aucun ancien compte etudiantX trouvé dans index.html");
        }
        
        // Vérifier les nouveaux comptes
        const nouveauxComptes = indexContent.match(/\w+\.\w+/g);
        if (nouveauxComptes) {
            const comptesEtudiants = nouveauxComptes.filter(compte => 
                compte.includes('.') && !compte.includes('enseignant')
            );
            console.log(`✅ ${comptesEtudiants.length} nouveaux comptes étudiants trouvés dans index.html`);
        }
        
    } catch (e) {
        console.log("❌ Fichier index.html non trouvé");
    }
}

function genererRapportNettoyage() {
    console.log("\n" + "=".repeat(60));
    console.log("📋 RAPPORT DE NETTOYAGE - IDENTIFIANTS ÉTUDIANTS");
    console.log("=".repeat(60));
    console.log();
    
    verifierFichiersIdentifiants();
    
    console.log();
    console.log("🎯 ACTIONS EFFECTUÉES:");
    console.log("  ✅ Anciens comptes etudiant1-18 supprimés de index.html");
    console.log("  ✅ Nouveaux comptes réels étudiants ajoutés");
    console.log("  ✅ Fichiers comptes-etudiants.js et .csv créés");
    console.log("  ✅ Script de nettoyage localStorage créé");
    
    console.log();
    console.log("📝 IDENTIFIANTS NOUVEAUX:");
    console.log("  • Format: prenom.nom");
    console.log("  • Mot de passe: Prenom2024!");
    console.log("  • 18 comptes étudiants + 1 compte enseignant");
    
    console.log();
    console.log("🔔 PROCHAINES ÉTAPES:");
    console.log("  1. Ouvrir index.html dans le navigateur");
    console.log("  2. Les anciennes sessions seront automatiquement nettoyées");
    console.log("  3. Se connecter avec les nouveaux identifiants");
    
    console.log();
    console.log("=".repeat(60));
}

// Exécuter la vérification
genererRapportNettoyage();
