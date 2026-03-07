// PROFIL D'APPRENTISSAGE ADAPTATIF
// ===================================

window.StudentProfile = {
    profiles: new Map(),
    
    getProfile(studentId = 'anonymous') {
        if (!this.profiles.has(studentId)) {
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
    },
    
    recordError(studentId, error) {
        const profile = this.getProfile(studentId);
        
        // Initialiser le type d'erreur si inexistant
        if (!profile.errors[error.type]) {
            profile.errors[error.type] = {
                count: 0,
                occurrences: [],
                lastOccurrence: null,
                firstOccurrence: null,
                correctionsTried: [],
                masteryLevel: 0
            };
        }
        
        // Enregistrer l'occurrence
        profile.errors[error.type].count++;
        profile.errors[error.type].occurrences.push({
            date: new Date().toISOString(),
            context: error.context,
            correction: error.correction,
            confidence: error.confidence || 0.8
        });
        
        if (!profile.errors[error.type].firstOccurrence) {
            profile.errors[error.type].firstOccurrence = new Date().toISOString();
        }
        
        profile.errors[error.type].lastOccurrence = new Date().toISOString();
        
        // Mettre à jour les corrections tentées
        if (error.correction && !profile.errors[error.type].correctionsTried.includes(error.correction)) {
            profile.errors[error.type].correctionsTried.push(error.correction);
        }
        
        // Calculer le niveau de maîtrise (inverse du nombre d'erreurs)
        const recentErrors = profile.errors[error.type].occurrences.filter(
            occ => new Date(occ.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        profile.errors[error.type].masteryLevel = Math.max(0, 100 - (recentErrors.length * 10));
        
        this.updateWeaknesses(profile);
        this.updateStatistics(profile);
        this.saveProfile(profile);
        
        console.log(`📊 Erreur enregistrée pour ${studentId}:`, error);
    },
    
    recordSuccess(studentId, activityType, confidence = 1.0) {
        const profile = this.getProfile(studentId);
        
        // Ajouter aux forces si confiance élevée
        if (confidence > 0.8) {
            if (!profile.strengths.includes(activityType)) {
                profile.strengths.push(activityType);
            }
        }
        
        // Mettre à jour les statistiques
        profile.statistics.totalActivities++;
        profile.statistics.correctAnswers++;
        profile.statistics.averageConfidence = 
            (profile.statistics.averageConfidence * (profile.statistics.totalActivities - 1) + confidence) / 
            profile.statistics.totalActivities;
        
        this.updateStatistics(profile);
        this.saveProfile(profile);
        
        console.log(`✅ Succès enregistré pour ${studentId}:`, { activityType, confidence });
    },
    
    recordActivity(studentId, activityData) {
        const profile = this.getProfile(studentId);
        
        profile.lastActivity = {
            type: activityData.type,
            timestamp: new Date().toISOString(),
            success: activityData.success,
            errors: activityData.errors || [],
            confidence: activityData.confidence || 0.8,
            timeSpent: activityData.timeSpent || 0
        };
        
        // Ajouter à l'historique
        profile.learningHistory.push(profile.lastActivity);
        
        // Limiter l'historique à 100 activités
        if (profile.learningHistory.length > 100) {
            profile.learningHistory = profile.learningHistory.slice(-100);
        }
        
        this.updateStatistics(profile);
        this.saveProfile(profile);
    },
    
    updateWeaknesses(profile) {
        profile.weaknesses = Object.entries(profile.errors)
            .filter(([_, data]) => data.count > 2)
            .map(([type, data]) => ({
                type,
                frequency: data.count,
                lastOccurrence: data.lastOccurrence,
                masteryLevel: data.masteryLevel,
                trend: this.calculateTrend(data.occurrences)
            }))
            .sort((a, b) => b.frequency - a.frequency);
    },
    
    updateStatistics(profile) {
        const total = profile.statistics.totalActivities;
        const correct = profile.statistics.correctAnswers;
        
        profile.statistics.errorRate = total > 0 ? ((total - correct) / total) * 100 : 0;
        
        // Calculer le taux d'amélioration
        if (profile.learningHistory.length > 5) {
            const recent = profile.learningHistory.slice(-5);
            const older = profile.learningHistory.slice(-10, -5);
            
            const recentSuccess = recent.filter(a => a.success).length;
            const olderSuccess = older.filter(a => a.success).length;
            
            profile.statistics.improvementRate = 
                ((recentSuccess - olderSuccess) / Math.max(1, olderSuccess)) * 100;
        }
        
        // Mettre à jour les zones de focus
        profile.adaptiveSettings.focusAreas = profile.weaknesses.slice(0, 3).map(w => w.type);
    },
    
    calculateTrend(occurrences) {
        if (occurrences.length < 3) return 'stable';
        
        const recent = occurrences.slice(-3);
        const older = occurrences.slice(-6, -3);
        
        const recentCount = recent.length;
        const olderCount = older.length;
        
        if (recentCount > olderCount) return 'worsening';
        if (recentCount < olderCount) return 'improving';
        return 'stable';
    },
    
    getAdaptiveExercise(profile) {
        if (profile.weaknesses.length > 0) {
            const mainWeakness = profile.weaknesses[0];
            return this.generateTargetedExercise(mainWeakness);
        }
        return this.generateGeneralExercise(profile);
    },
    
    generateTargetedExercise(weakness) {
        const exercises = {
            conjugaison: {
                instruction: "Conjuguez le verbe au présent : je ___, tu ___, il ___, nous ___, vous ___, ils ___",
                example: "aller → je vais, tu vas, il va, nous allons, vous allez, ils vont",
                hint: "Pensez au sujet du verbe"
            },
            anglicisme: {
                instruction: "Remplacez l'anglicisme par le terme français approprié",
                example: "shopping → achats, mail → courriel",
                hint: "Consultez un dictionnaire des anglicismes"
            },
            accord: {
                instruction: "Accordez correctement l'adjectif avec le nom",
                example: "les chat_s → les chats, la belle fleur → la belle fleur",
                hint: "Vérifiez le genre et le nombre"
            },
            orthographe: {
                instruction: "Corrigez l'erreur d'orthographe dans la phrase",
                example: "il parait → il paraît, corect → correct",
                hint: "Utilisez un correcteur orthographique"
            }
        };
        
        return exercises[weakness.type] || exercises.orthographe;
    },
    
    generateGeneralExercise(profile) {
        const level = profile.adaptiveSettings.difficultyLevel;
        const exercises = {
            beginner: "Écrivez une phrase simple en utilisant le passé composé",
            intermediate: "Rédigez un court paragraphe en utilisant 3 connecteurs logiques différents",
            advanced: "Analysez ce texte et identifiez les figures de style utilisées"
        };
        
        return exercises[level] || exercises.intermediate;
    },
    
    getRecommendations(profile) {
        const recommendations = [];
        
        // Basé sur les faiblesses
        profile.weaknesses.slice(0, 3).forEach(weakness => {
            recommendations.push({
                type: 'weakness',
                priority: 'high',
                title: `Travailler les ${weakness.type}s`,
                description: `Vous avez fait ${weakness.frequency} erreurs de ${weakness.type}. Entraînez-vous spécifiquement.`,
                action: this.generateTargetedExercise(weakness)
            });
        });
        
        // Basé sur les forces
        profile.strengths.forEach(strength => {
            recommendations.push({
                type: 'strength',
                priority: 'medium',
                title: `Continuer les ${strength}s`,
                description: `Vous excellez dans les exercices de ${strength}. Continuez dans cette voie.`,
                action: { instruction: "Continuez à vous exercer avec des activités de " + strength }
            });
        });
        
        // Basé sur les statistiques
        if (profile.statistics.improvementRate < 0) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                title: 'Attention à la performance',
                description: 'Votre taux de réussite baisse. Prenez le temps de relire vos réponses.',
                action: { instruction: "Ralentissez et vérifiez chaque réponse avant de valider." }
            });
        }
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    },
    
    exportProfile(studentId) {
        const profile = this.getProfile(studentId);
        return {
            ...profile,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    },
    
    importProfile(profileData) {
        try {
            const profile = {
                ...profileData,
                lastUpdated: new Date().toISOString()
            };
            
            this.profiles.set(profile.id, profile);
            this.saveProfile(profile);
            console.log(`✅ Profil importé pour ${profile.id}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur import profil:', error);
            return false;
        }
    },
    
    saveProfile(profile) {
        profile.lastUpdated = new Date().toISOString();
        
        // Sauvegarder dans localStorage
        try {
            localStorage.setItem(`student_profile_${profile.id}`, JSON.stringify(profile));
        } catch (error) {
            console.error('❌ Erreur sauvegarde profil:', error);
        }
        
        // Sauvegarder dans la Map en mémoire
        this.profiles.set(profile.id, profile);
    },
    
    loadProfile(studentId) {
        try {
            const data = localStorage.getItem(`student_profile_${studentId}`);
            if (data) {
                const profile = JSON.parse(data);
                this.profiles.set(studentId, profile);
                console.log(`✅ Profil chargé pour ${studentId}`);
                return profile;
            }
        } catch (error) {
            console.error('❌ Erreur chargement profil:', error);
        }
        return this.getProfile(studentId);
    },
    
    clearProfile(studentId) {
        this.profiles.delete(studentId);
        localStorage.removeItem(`student_profile_${studentId}`);
        console.log(`🗑️ Profil supprimé pour ${studentId}`);
    },
    
    getAllProfiles() {
        return Array.from(this.profiles.values());
    },
    
    getStatistics() {
        const allProfiles = this.getAllProfiles();
        const totalProfiles = allProfiles.length;
        
        if (totalProfiles === 0) return null;
        
        const totalActivities = allProfiles.reduce((sum, p) => sum + p.statistics.totalActivities, 0);
        const totalErrors = allProfiles.reduce((sum, p) => sum + Object.values(p.errors).reduce((s, e) => s + e.count, 0), 0);
        
        const errorTypes = {};
        allProfiles.forEach(profile => {
            Object.entries(profile.errors).forEach(([type, data]) => {
                errorTypes[type] = (errorTypes[type] || 0) + data.count;
            });
        });
        
        return {
            totalProfiles,
            totalActivities,
            totalErrors,
            averageActivitiesPerProfile: totalActivities / totalProfiles,
            averageErrorsPerProfile: totalErrors / totalProfiles,
            mostCommonErrors: Object.entries(errorTypes)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => ({ type, count })),
            overallImprovementRate: allProfiles.reduce((sum, p) => sum + p.statistics.improvementRate, 0) / totalProfiles
        };
    }
};

// Charger les profils sauvegardés au démarrage
document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 Initialisation profils d\'apprentissage...');
    
    // Charger le profil par défaut
    window.StudentProfile.loadProfile('anonymous');
    
    console.log('✅ Profils d\'apprentissage prêts');
});
