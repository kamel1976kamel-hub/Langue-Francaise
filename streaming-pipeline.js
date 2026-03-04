/**
 * =================================================================
 * PIPELINE IA AVEC STREAMING
 * Feedback temps réel pendant le traitement
 * =================================================================
 */

'use strict';

class StreamingPipeline {
    constructor() {
        this.steps = [
            { 
                name: 'Analyse logique', 
                weight: 25, 
                description: 'Analyse de la structure logique de la réponse',
                icon: '🧠'
            },
            { 
                name: 'Recherche documentaire', 
                weight: 25, 
                description: 'Recherche des références pertinentes',
                icon: '📚'
            },
            { 
                name: 'Génération pédagogique', 
                weight: 35, 
                description: 'Création de la réponse pédagogique',
                icon: '👨‍🏫'
            },
            { 
                name: 'Validation qualité', 
                weight: 15, 
                description: 'Vérification de la qualité de la réponse',
                icon: '✅'
            }
        ];
        
        this.currentStep = 0;
        this.isProcessing = false;
        this.progressCallback = null;
        this.abortController = null;
    }

    /**
     * Définit le callback de progression
     * @param {Function} callback - Fonction de callback
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Traite une réponse avec streaming
     * @param {string} studentAnswer - Réponse de l'étudiant
     * @param {string} context - Contexte de l'activité
     * @param {string} activityType - Type d'activité
     * @returns {AsyncGenerator} Générateur asynchrone
     */
    async *processWithStreaming(studentAnswer, context, activityType = 'general') {
        if (this.isProcessing) {
            throw new Error('Un traitement est déjà en cours');
        }

        this.isProcessing = true;
        this.currentStep = 0;
        this.abortController = new AbortController();

        try {
            const results = [];
            let totalProgress = 0;

            for (const step of this.steps) {
                // Vérifier si le traitement a été annulé
                if (this.abortController.signal.aborted) {
                    throw new Error('Traitement annulé');
                }

                // Notifier début de l'étape
                yield { 
                    type: 'step_start', 
                    step: step.name,
                    icon: step.icon,
                    description: step.description,
                    progress: totalProgress,
                    stepProgress: 0
                };

                // Traiter l'étape avec feedback
                const stepResult = await this.processStep(
                    step, 
                    studentAnswer, 
                    context, 
                    activityType,
                    (stepProgress) => {
                        const currentProgress = totalProgress + (step.weight * stepProgress / 100);
                        yield { 
                            type: 'step_progress', 
                            step: step.name,
                            icon: step.icon,
                            progress: currentProgress,
                            stepProgress,
                            message: `${step.name} - ${Math.round(stepProgress)}%`
                        };
                    }
                );

                results.push(stepResult);
                totalProgress += step.weight;

                // Notifier fin de l'étape
                yield { 
                    type: 'step_complete', 
                    step: step.name,
                    icon: step.icon,
                    result: stepResult,
                    progress: totalProgress,
                    stepProgress: 100,
                    message: `${step.name} terminé`
                };

                this.currentStep++;
            }

            // Notifier fin du traitement
            yield { 
                type: 'processing_complete', 
                results,
                progress: 100,
                message: 'Analyse terminée avec succès'
            };

            // Retourner le résultat final (généralement l'étape pédagogique)
            const pedagogicalResult = results.find(r => r.step === 'Génération pédagogique') || results[results.length - 1];
            return pedagogicalResult.content;

        } finally {
            this.isProcessing = false;
            this.currentStep = 0;
            this.abortController = null;
        }
    }

    /**
     * Traite une étape spécifique avec feedback
     * @private
     */
    async processStep(step, studentAnswer, context, activityType, progressCallback) {
        const stepDuration = 2000 + Math.random() * 1000; // 2-3 secondes par étape
        const startTime = Date.now();
        let lastProgress = 0;

        // Simuler le traitement avec feedback progressif
        while (Date.now() - startTime < stepDuration) {
            if (this.abortController.signal.aborted) {
                throw new Error('Traitement annulé');
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(100, (elapsed / stepDuration) * 100);

            // Notifier seulement si la progression a changé significativement
            if (progress - lastProgress >= 5) {
                await progressCallback(progress);
                lastProgress = progress;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Simuler le résultat de l'étape
        const result = await this.generateStepResult(step, studentAnswer, context, activityType);
        
        // Progression finale
        await progressCallback(100);
        
        return result;
    }

    /**
     * Génère le résultat d'une étape
     * @private
     */
    async generateStepResult(step, studentAnswer, context, activityType) {
        switch (step.name) {
            case 'Analyse logique':
                return {
                    step: step.name,
                    content: "Analyse logique : La réponse montre une compréhension correcte du sujet. Points forts : clarté des idées. Axes d'amélioration : structure et enrichissement du vocabulaire.",
                    metadata: {
                        score: 75,
                        strengths: ['clarté', 'compréhension'],
                        improvements: ['structure', 'vocabulaire']
                    }
                };

            case 'Recherche documentaire':
                return {
                    step: step.name,
                    content: "Références : Chapitre 3 - Structure du texte, Section 2.1 - Connecteurs logiques, Exercice 4 - Enrichissement lexical.",
                    metadata: {
                        references: ['chapitre-3', 'section-2.1', 'exercice-4'],
                        relevance: 85
                    }
                };

            case 'Génération pédagogique':
                return {
                    step: step.name,
                    content: `Excellent travail ! Votre réponse sur ${activityType} montre que vous avez bien compris les concepts. Pour l'améliorer :\n\n1. Structurez votre réponse avec une introduction claire\n2. Développez vos arguments avec des exemples précis\n3. Utilisez des connecteurs logiques pour lier vos idées\n4. Enrichissez votre vocabulaire avec des synonymes variés\n\nContinuez ainsi, vous êtes sur la bonne voie !`,
                    metadata: {
                        tone: 'encourageant',
                        suggestions: 4,
                        difficulty: 'intermédiaire'
                    }
                };

            case 'Validation qualité':
                return {
                    step: step.name,
                    content: "Validation : La réponse pédagogique est cohérente, encourageante et ne contient pas d'erreurs. Qualité : Excellente.",
                    metadata: {
                        quality: 'excellente',
                        score: 95,
                        issues: []
                    }
                };

            default:
                return {
                    step: step.name,
                    content: `Résultat de l'étape ${step.name}`,
                    metadata: {}
                };
        }
    }

    /**
     * Annule le traitement en cours
     */
    abort() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    /**
     * Vérifie si un traitement est en cours
     * @returns {boolean}
     */
    isCurrentlyProcessing() {
        return this.isProcessing;
    }

    /**
     * Récupère l'étape actuelle
     * @returns {number}
     */
    getCurrentStep() {
        return this.currentStep;
    }

    /**
     * Récupère les informations sur les étapes
     * @returns {Array} Liste des étapes
     */
    getSteps() {
        return [...this.steps];
    }

    /**
     * Traite une réponse avec callback simple (compatibilité)
     * @param {string} studentAnswer - Réponse de l'étudiant
     * @param {string} context - Contexte de l'activité
     * @param {string} activityType - Type d'activité
     * @param {Function} callback - Callback de progression
     * @returns {Promise<string>} Résultat final
     */
    async processWithCallback(studentAnswer, context, activityType, callback) {
        const generator = this.processWithStreaming(studentAnswer, context, activityType);
        
        try {
            for await (const update of generator) {
                if (callback) {
                    callback(update);
                }
            }
        } catch (error) {
            if (callback) {
                callback({ type: 'error', message: error.message });
            }
            throw error;
        }
    }
}

// Export global
window.StreamingPipeline = StreamingPipeline;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamingPipeline;
}
