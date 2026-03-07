/**
 * =================================================================
 * SYSTÈME UNIFIÉ DE GESTION DES PROFILS ÉTUDIANTS
 * Authentification + Profil d'apprentissage adaptatif
 * Version intégrée et optimisée
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

// Base de données des utilisateurs avec profils intégrés
const utilisateurs = [
    {
        // === DONNÉES AUTHENTIFICATION ===
        id: 'teacher_001',
        nom: "CHELLOUAI",
        prenom: "KAMEL",
        username: "kamel.chellouai",
        password: "Kamel@2024!",
        email: "kamel.chellouai@enseignant.fr",
        role: "teacher",
        displayName: "KAMEL CHELLOUAI",
        actif: true,
        dateCreation: new Date('2024-01-01'),
        
        // === PROFIL D'APPRENTISSAGE ===
        profile: {
            errors: {},
            strengths: ['pédagogie', 'grammaire'],
            weaknesses: ['technologie'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'advanced',
                preferredFeedbackType: 'detailed',
                exerciseFrequency: 'high',
                focusAreas: ['pédagogie', 'grammaire']
            }
        }
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
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['lecture', 'vocabulaire'],
            weaknesses: ['conjugaison', 'orthographe'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'detailed',
                exerciseFrequency: 'normal',
                focusAreas: ['conjugaison', 'orthographe']
            }
        }
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
        dateCreation: new Date('2024-01-01'),
        
        profile: {
            errors: {},
            strengths: ['expression écrite'],
            weaknesses: ['grammaire', 'syntaxe'],
            learningHistory: [],
            lastActivity: null,
            statistics: {
                totalActivities: 0,
                correctAnswers: 0,
                errorRate: 0,
                improvementRate: 0,
                averageConfidence: 0
            },
            adaptiveSettings: {
                difficultyLevel: 'intermediate',
                preferredFeedbackType: 'pedagogical',
                exerciseFrequency: 'normal',
                focusAreas: ['grammaire', 'syntaxe']
            }
        }
    }
];

// =================================================================
// SYSTÈME UNIFIÉ DE GESTION DES PROFILS
// =================================================================

class StudentProfileManager {
    constructor() {
        this.utilisateurs = utilisateurs;
        this.profiles = new Map();
        this.initialiser();
    }
    
    /**
     * Initialise le système
     */
    initialiser() {
        console.log('🚀 Système unifié de profils étudiants initialisé');
        console.log(`📊 ${this.getStatistiques().total} utilisateurs chargés`);
        
        // Initialiser les profils dans la Map
        this.utilisateurs.forEach(utilisateur => {
            if (!this.profiles.has(utilisateur.id)) {
                this.profiles.set(utilisateur.id, {
                    ...utilisateur.profile,
                    id: utilisateur.id,
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                });
            }
        });
    }
    
    /**
     * Statistiques du système
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
    
    // ======== FONCTIONS AUTHENTIFICATION ========
    
    /**
     * Vérifie la connexion
     */
    verifierConnexion(username, password) {
        const utilisateur = this.utilisateurs.find(u => u.username === username);
        
        if (!utilisateur) {
            return {
                success: false,
                message: "Nom d'utilisateur incorrect",
                utilisateur: null
            };
        }
        
        if (utilisateur.password !== password) {
            return {
                success: false,
                message: "Mot de passe incorrect",
                utilisateur: null
            };
        }
        
        if (!utilisateur.actif) {
            return {
                success: false,
                message: "Compte désactivé",
                utilisateur: null
            };
        }
        
        return {
            success: true,
            message: "Connexion réussie",
            utilisateur: utilisateur
        };
    }
    
    /**
     * Recherche un utilisateur
     */
    rechercherUtilisateur(critere) {
        return this.utilisateurs.find(u => 
            u.username.toLowerCase() === critere.toLowerCase() ||
            u.email.toLowerCase() === critere.toLowerCase() ||
            u.id.toLowerCase() === critere.toLowerCase()
        ) || null;
    }
    
    // ======== FONCTIONS PROFIL D'APPRENTISSAGE ========
    
    /**
     * Récupère le profil d'un étudiant
     */
    getProfile(studentId = 'anonymous') {
        if (!this.profiles.has(studentId)) {
            // Créer un profil par défaut
            this.profiles.set(studentId, {
                id: studentId,
                errors: {},
                strengths: [],
                weaknesses: [],
                learningHistory: [],
                lastActivity: null,
                statistics: {
                    totalActivities: 0,
                    correctAnswers: 0,
                    errorRate: 0,
                    improvementRate: 0,
                    averageConfidence: 0
                },
                adaptiveSettings: {
                    difficultyLevel: 'intermediate',
                    preferredFeedbackType: 'detailed',
                    exerciseFrequency: 'normal',
                    focusAreas: []
                },
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
        }
        
        return this.profiles.get(studentId);
    }
    
    /**
     * Enregistre une erreur dans le profil
     */
    recordError(studentId, error) {
        const profile = this.getProfile(studentId);
        
        if (!profile.errors[error.type]) {
            profile.errors[error.type] = [];
        }
        
        profile.errors[error.type].push({
            ...error,
            timestamp: new Date().toISOString()
        });
        
        // Mettre à jour les statistiques
        profile.statistics.totalActivities = (profile.statistics.totalActivities || 0) + 1;
        profile.statistics.errorRate = this.calculateErrorRate(profile);
        
        profile.lastUpdated = new Date().toISOString();
        
        console.log(`📝 Erreur enregistrée pour ${studentId}: ${error.type}`);
    }
    
    /**
     * Enregistre une activité réussie
     */
    recordSuccess(studentId, activity) {
        const profile = this.getProfile(studentId);
        
        profile.learningHistory.push({
            type: 'success',
            activity: activity,
            timestamp: new Date().toISOString()
        });
        
        profile.statistics.totalActivities = (profile.statistics.totalActivities || 0) + 1;
        profile.statistics.correctAnswers = (profile.statistics.correctAnswers || 0) + 1;
        profile.statistics.errorRate = this.calculateErrorRate(profile);
        profile.statistics.improvementRate = this.calculateImprovementRate(profile);
        
        profile.lastActivity = new Date().toISOString();
        profile.lastUpdated = new Date().toISOString();
        
        console.log(`✅ Succès enregistré pour ${studentId}`);
    }
    
    /**
     * Calcule le taux d'erreur
     */
    calculateErrorRate(profile) {
        if (profile.statistics.totalActivities === 0) return 0;
        
        const totalErrors = Object.values(profile.errors).reduce((sum, errors) => sum + errors.length, 0);
        return (totalErrors / profile.statistics.totalActivities) * 100;
    }
    
    /**
     * Calcule le taux d'amélioration
     */
    calculateImprovementRate(profile) {
        const recentHistory = profile.learningHistory.slice(-10);
        if (recentHistory.length < 5) return 0;
        
        const recentSuccesses = recentHistory.filter(h => h.type === 'success').length;
        return (recentSuccesses / recentHistory.length) * 100;
    }
    
    /**
     * Met à jour les préférences adaptatives
     */
    updateAdaptiveSettings(studentId, settings) {
        const profile = this.getProfile(studentId);
        profile.adaptiveSettings = { ...profile.adaptiveSettings, ...settings };
        profile.lastUpdated = new Date().toISOString();
        
        console.log(`⚙️ Paramètres adaptatifs mis à jour pour ${studentId}`);
    }
    
    /**
     * Génère un rapport d'apprentissage
     */
    generateLearningReport(studentId) {
        const profile = this.getProfile(studentId);
        const utilisateur = this.utilisateurs.find(u => u.id === studentId);
        
        return {
            student: utilisateur ? {
                id: utilisateur.id,
                displayName: utilisateur.displayName,
                role: utilisateur.role
            } : { id: studentId, displayName: 'Anonymous', role: 'student' },
            
            statistics: profile.statistics,
            strengths: profile.strengths,
            weaknesses: profile.weaknesses,
            recommendations: this.generateRecommendations(profile),
            lastActivity: profile.lastActivity,
            generatedAt: new Date().toISOString()
        };
    }
    
    /**
     * Génère des recommandations personnalisées
     */
    generateRecommendations(profile) {
        const recommendations = [];
        
        // Basé sur les faiblesses
        if (profile.weaknesses.includes('conjugaison')) {
            recommendations.push("Pratiquer les exercices de conjugaison au présent");
        }
        
        if (profile.weaknesses.includes('orthographe')) {
            recommendations.push("Revoir les règles d'orthographe grammaticale");
        }
        
        // Basé sur le taux d'erreur
        if (profile.statistics.errorRate > 30) {
            recommendations.push("Revenir aux exercices de base pour consolider les fondations");
        }
        
        // Basé sur le taux d'amélioration
        if (profile.statistics.improvementRate > 80) {
            recommendations.push("Excellent progrès ! Passer au niveau supérieur");
        }
        
        return recommendations;
    }
    
    // ======== UTILITAIRES ========
    
    /**
     * Exporte les données au format CSV
     */
    genererCSV() {
        const headers = ['ID', 'Nom', 'Prénom', 'Email', 'Username', 'Password', 'Role', 'Actif', 'TotalActivities', 'ErrorRate', 'ImprovementRate'];
        let csv = headers.join(',') + '\n';
        
        this.utilisateurs.forEach(u => {
            const profile = this.profiles.get(u.id);
            const stats = profile?.statistics || {};
            
            csv += [
                u.id,
                u.nom,
                u.prenom,
                u.email,
                u.username,
                u.password,
                u.role,
                u.actif,
                stats.totalActivities || 0,
                (stats.errorRate || 0).toFixed(2),
                (stats.improvementRate || 0).toFixed(2)
            ].join(',') + '\n';
        });
        
        return csv;
    }
    
    /**
     * Exporte les profils au format JSON
     */
    exportProfiles() {
        return JSON.stringify({
            metadata: {
                dateGeneration: new Date().toISOString(),
                totalUtilisateurs: this.utilisateurs.length,
                version: '3.0-unified'
            },
            utilisateurs: this.utilisateurs.map(u => ({
                id: u.id,
                displayName: u.displayName,
                username: u.username,
                role: u.role,
                profile: this.profiles.get(u.id)
            }))
        }, null, 2);
    }
}

// =================================================================
// INSTANCE PRINCIPALE
// =================================================================

const studentProfileManager = new StudentProfileManager();

// Export pour compatibilité
window.StudentProfileManager = studentProfileManager;
window.StudentProfile = {
    getProfile: studentProfileManager.getProfile.bind(studentProfileManager),
    recordError: studentProfileManager.recordError.bind(studentProfileManager),
    recordSuccess: studentProfileManager.recordSuccess.bind(studentProfileManager),
    updateAdaptiveSettings: studentProfileManager.updateAdaptiveSettings.bind(studentProfileManager),
    generateLearningReport: studentProfileManager.generateLearningReport.bind(studentProfileManager)
};

// Compatibilité avec l'ancien système de comptes
window.gestionUtilisateurs = studentProfileManager;
window.GestionUtilisateurs = StudentProfileManager;
window.etudiants = studentProfileManager.utilisateurs;
window.verifierConnexion = studentProfileManager.verifierConnexion.bind(studentProfileManager);
window.rechercherUtilisateur = studentProfileManager.rechercherUtilisateur.bind(studentProfileManager);

console.log('✅ Système unifié de profils étudiants chargé');
console.log(`📊 ${studentProfileManager.getStatistiques().total} profils intégrés`);
