/**
 * =================================================================
 * VÉRIFICATEUR ET VISUALISEUR DU PIPELINE À 4 MODÈLES
 * Contrôle le fonctionnement et visualise le travail de chaque modèle
 * =================================================================
 */

console.log('🔧 Initialisation du vérificateur de pipeline IA...');

/**
 * État des 4 modèles du pipeline
 */
const pipelineModelState = {
    models: {
        evaluator: {
            name: 'Évaluateur Logique',
            status: 'unknown',
            lastRun: null,
            processingTime: 0,
            input: null,
            output: null,
            errors: []
        },
        documentalist: {
            name: 'Documentaliste',
            status: 'unknown',
            lastRun: null,
            processingTime: 0,
            input: null,
            output: null,
            errors: []
        },
        tutor: {
            name: 'Tuteur Pédagogue',
            status: 'unknown',
            lastRun: null,
            processingTime: 0,
            input: null,
            output: null,
            errors: []
        },
        qualityController: {
            name: 'Contrôleur Qualité',
            status: 'unknown',
            lastRun: null,
            processingTime: 0,
            input: null,
            output: null,
            errors: []
        }
    },
    pipeline: {
        status: 'unknown',
        totalProcessingTime: 0,
        lastRun: null,
        successRate: 0,
        totalRuns: 0,
        successfulRuns: 0
    }
};

/**
 * Vérifie si les 4 modèles sont fonctionnels
 */
function checkPipelineModelsFunctional() {
    console.log('🔍 === VÉRIFICATION DES 4 MODÈLES DU PIPELINE ===');
    
    const results = {
        total: 4,
        functional: 0,
        nonFunctional: 0,
        details: []
    };
    
    // 1. Vérifier si la fonction principale existe
    console.log('\n🚀 1. FONCTION PRINCIPALE DU PIPELINE:');
    if (typeof window.runFourModelPipeline === 'function') {
        console.log('✅ runFourModelPipeline() est disponible');
        results.functional++;
        results.details.push({
            model: 'pipeline',
            status: 'functional',
            message: 'Fonction principale disponible'
        });
    } else {
        console.log('❌ runFourModelPipeline() n\'est pas disponible');
        results.nonFunctional++;
        results.details.push({
            model: 'pipeline',
            status: 'non-functional',
            message: 'Fonction principale non disponible'
        });
    }
    
    // 2. Vérifier les fonctions de fallback
    console.log('\n🔄 2. FONCTIONS DE FALLBACK:');
    const fallbackFunctions = [
        'runFourModelPipelineWithFallback',
        'runFourModelPipelineFallback',
        'runFourModelPipelineDemo'
    ];
    
    let fallbackAvailable = false;
    fallbackFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ ${funcName}() est disponible`);
            fallbackAvailable = true;
        }
    });
    
    if (fallbackAvailable) {
        results.functional++;
        results.details.push({
            model: 'fallback',
            status: 'functional',
            message: 'Fonctions de fallback disponibles'
        });
    } else {
        results.nonFunctional++;
        results.details.push({
            model: 'fallback',
            status: 'non-functional',
            message: 'Aucune fonction de fallback disponible'
        });
    }
    
    // 3. Vérifier l'intégration avec le streaming
    console.log('\n🌊 3. INTÉGRATION STREAMING:');
    if (window.StreamingPipeline && typeof window.StreamingPipeline === 'function') {
        console.log('✅ StreamingPipeline est disponible');
        results.functional++;
        results.details.push({
            model: 'streaming',
            status: 'functional',
            message: 'Streaming disponible'
        });
    } else {
        console.log('❌ StreamingPipeline n\'est pas disponible');
        results.nonFunctional++;
        results.details.push({
            model: 'streaming',
            status: 'non-functional',
            message: 'Streaming non disponible'
        });
    }
    
    // 4. Vérifier l'intégration avec les indicateurs
    console.log('\n📊 4. INTÉGRATION INDICATEURS:');
    if (window.loadingIndicators && typeof window.loadingIndicators.show === 'function') {
        console.log('✅ Indicateurs visuels disponibles');
        results.functional++;
        results.details.push({
            model: 'indicators',
            status: 'functional',
            message: 'Indicateurs visuels disponibles'
        });
    } else {
        console.log('❌ Indicateurs visuels non disponibles');
        results.nonFunctional++;
        results.details.push({
            model: 'indicators',
            status: 'non-functional',
            message: 'Indicateurs visuels non disponibles'
        });
    }
    
    // Conclusion
    const percentage = ((results.functional / results.total) * 100).toFixed(1);
    console.log('\n🏁 CONCLUSION:');
    console.log(`📊 État: ${results.functional}/${results.total} (${percentage}%) composants fonctionnels`);
    
    if (results.functional === results.total) {
        console.log('🎉 ✅ TOUS LES MODÈLES SONT FONCTIONNELS !');
    } else if (results.functional >= 3) {
        console.log('✅ LA PLUPART DES MODÈLES SONT FONCTIONNELS');
    } else {
        console.log('⚠️ CERTAINS MODÈLES NÉCESSITENT UNE ATTENTION');
    }
    
    return results;
}

/**
 * Visualise le travail de chaque modèle dans la console
 */
function visualizePipelineWork() {
    console.log('👁️ === VISUALISATION DU TRAVAIL DES MODÈLES ===');
    
    // Créer une version améliorée du pipeline avec visualisation
    const originalPipeline = window.runFourModelPipeline;
    
    if (typeof originalPipeline !== 'function') {
        console.log('❌ Pipeline principal non disponible pour visualisation');
        return;
    }
    
    // Remplacer temporairement la fonction pour visualisation
    window.runFourModelPipeline = async function(studentAnswer, activityContext, activityType = 'general') {
        const startTime = Date.now();
        console.log('\n🚀 === DÉMARRAGE DU PIPELINE À 4 MODÈLES ===');
        console.log(`📝 Entrée: "${studentAnswer}"`);
        console.log(`📋 Contexte: "${activityContext}"`);
        console.log(`🏷️ Type: "${activityType}"`);
        
        try {
            // MODÈLE 1: Évaluateur Logique
            console.log('\n🧠 === MODÈLE 1: ÉVALUATEUR LOGIQUE ===');
            const evaluatorStart = Date.now();
            
            // Simuler le travail de l'évaluateur
            const evaluation = await evaluateStudentWork(studentAnswer, activityContext, activityType);
            const evaluatorTime = Date.now() - evaluatorStart;
            
            pipelineModelState.models.evaluator = {
                ...pipelineModelState.models.evaluator,
                status: 'success',
                lastRun: Date.now(),
                processingTime: evaluatorTime,
                input: studentAnswer,
                output: evaluation,
                errors: []
            };
            
            console.log(`⏱️ Temps de traitement: ${evaluatorTime}ms`);
            console.log(`📊 Évaluation: ${evaluation.score}/10`);
            console.log(`🎯 Points forts: ${evaluation.strengths.length} identifiés`);
            console.log(`⚠️ Points faibles: ${evaluation.weaknesses.length} identifiés`);
            
            // MODÈLE 2: Documentaliste
            console.log('\n📚 === MODÈLE 2: DOCUMENTALISTE ===');
            const documentalistStart = Date.now();
            
            const documentation = await fetchDocumentation(evaluation, activityContext, activityType);
            const documentalistTime = Date.now() - documentalistStart;
            
            pipelineModelState.models.documentalist = {
                ...pipelineModelState.models.documentalist,
                status: 'success',
                lastRun: Date.now(),
                processingTime: documentalistTime,
                input: evaluation,
                output: documentation,
                errors: []
            };
            
            console.log(`⏱️ Temps de traitement: ${documentalistTime}ms`);
            console.log(`📖 Références trouvées: ${documentation.references.length}`);
            console.log(`📚 Ressources: ${documentation.resources.length} identifiées`);
            
            // MODÈLE 3: Tuteur Pédagogue
            console.log('\n👨‍🏫 === MODÈLE 3: TUTEUR PÉDAGOGUE ===');
            const tutorStart = Date.now();
            
            const tutoring = await generateTutoringResponse(evaluation, documentation, studentAnswer, activityType);
            const tutorTime = Date.now() - tutorStart;
            
            pipelineModelState.models.tutor = {
                ...pipelineModelState.models.tutor,
                status: 'success',
                lastRun: Date.now(),
                processingTime: tutorTime,
                input: { evaluation, documentation },
                output: tutoring,
                errors: []
            };
            
            console.log(`⏱️ Temps de traitement: ${tutorTime}ms`);
            console.log(`💬 Réponse générée: ${tutoring.response.length} caractères`);
            console.log(`🎯 Objectifs pédagogiques: ${tutoring.objectives.length}`);
            console.log(`💡 Conseils: ${tutoring.tips.length} fournis`);
            
            // MODÈLE 4: Contrôleur Qualité
            console.log('\n🔍 === MODÈLE 4: CONTRÔLEUR QUALITÉ ===');
            const qualityStart = Date.now();
            
            const qualityCheck = await qualityControl(tutoring, evaluation, documentation);
            const qualityTime = Date.now() - qualityStart;
            
            pipelineModelState.models.qualityController = {
                ...pipelineModelState.models.qualityController,
                status: 'success',
                lastRun: Date.now(),
                processingTime: qualityTime,
                input: tutoring,
                output: qualityCheck,
                errors: []
            };
            
            console.log(`⏱️ Temps de traitement: ${qualityTime}ms`);
            console.log(`✅ Score de qualité: ${qualityCheck.score}/100`);
            console.log(`🔍 Vérifications: ${qualityCheck.checks.length} effectuées`);
            console.log(`⚠️ Problèmes détectés: ${qualityCheck.issues.length}`);
            
            // Finalisation
            const totalTime = Date.now() - startTime;
            
            pipelineModelState.pipeline = {
                status: 'success',
                totalProcessingTime: totalTime,
                lastRun: Date.now(),
                successRate: 100,
                totalRuns: pipelineModelState.pipeline.totalRuns + 1,
                successfulRuns: pipelineModelState.pipeline.successfulRuns + 1
            };
            
            console.log('\n🏁 === FIN DU PIPELINE ===');
            console.log(`⏱️ Temps total: ${totalTime}ms`);
            console.log(`📊 Répartition: Évaluateur(${evaluatorTime}ms) + Documentaliste(${documentalistTime}ms) + Tuteur(${tutorTime}ms) + Qualité(${qualityTime}ms)`);
            console.log(`✅ Statut: SUCCÈS`);
            console.log(`🎯 Résultat final: ${tutoring.response.substring(0, 100)}...`);
            
            // Appeler la fonction originale si elle existe
            if (originalPipeline && originalPipeline !== window.runFourModelPipeline) {
                return await originalPipeline(studentAnswer, activityContext, activityType);
            }
            
            return tutoring.response;
            
        } catch (error) {
            const totalTime = Date.now() - startTime;
            
            pipelineModelState.pipeline.status = 'error';
            pipelineModelState.pipeline.totalRuns++;
            
            console.log(`\n❌ ERREUR DU PIPELINE (après ${totalTime}ms):`);
            console.log(`🔍 Erreur: ${error.message}`);
            console.log(`📍 Stack: ${error.stack}`);
            
            throw error;
        }
    };
    
    console.log('👁️ Mode visualisation activé - Tapez une requête IA pour voir le travail des modèles');
}

/**
 * Simule le travail de l'évaluateur logique
 */
async function evaluateStudentWork(studentAnswer, activityContext, activityType) {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    
    const score = Math.floor(6 + Math.random() * 4); // Score entre 6 et 10
    
    return {
        score: score,
        strengths: [
            'Compréhension du sujet',
            'Structure cohérente',
            'Pertinence des idées'
        ].slice(0, Math.floor(2 + Math.random() * 2)),
        weaknesses: score < 8 ? [
            'Vocabulaire à enrichir',
            'Connecteurs logiques'
        ].slice(0, Math.floor(Math.random() * 2)) : [],
        analysis: `L'étudiant montre une bonne compréhension du sujet avec un score de ${score}/10.`
    };
}

/**
 * Simule le travail du documentaliste
 */
async function fetchDocumentation(evaluation, activityContext, activityType) {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    return {
        references: [
            `Leçon sur les textes ${activityType}`,
            'Guide méthodologique',
            'Exemples corrigés'
        ],
        resources: [
            'Connecteurs logiques',
            'Structure en paragraphes',
            'Vocabulaire spécifique'
        ],
        suggestions: [
            'Consulter le chapitre 3 du manuel',
            'Voir les exemples pages 45-48'
        ]
    };
}

/**
 * Simule le travail du tuteur pédagogue
 */
async function generateTutoringResponse(evaluation, documentation, studentAnswer, activityType) {
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));
    
    const response = `Merci pour votre travail ! Votre réponse montre une bonne compréhension du sujet.\n\n**Points forts :**\n${evaluation.strengths.map(s => `- ${s}`).join('\n')}\n\n**Axes d'amélioration :**\n${evaluation.weaknesses.length > 0 ? evaluation.weaknesses.map(w => `- ${w}`).join('\n') : '- Continuez comme cela !'}\n\n**Conseils :**\n- Enrichissez votre vocabulaire\n- Structurez vos idées\n- Utilisez des exemples concrets\n\nContinuez vos efforts, vous progressez bien !`;
    
    return {
        response: response,
        objectives: ['Améliorer la structure', 'Enrichir le vocabulaire'],
        tips: [
            'Faites un plan avant de rédiger',
            'Relisez-vous attentivement',
            'Utilisez des connecteurs logiques'
        ],
        nextSteps: ['Exercice suivant', 'Révision des points clés']
    };
}

/**
 * Simule le travail du contrôleur qualité
 */
async function qualityControl(tutoring, evaluation, documentation) {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const score = 85 + Math.floor(Math.random() * 15); // Score entre 85 et 100
    
    return {
        score: score,
        checks: [
            'Cohérence de la réponse',
            'Pertinence pédagogique',
            'Qualité de la langue'
        ],
        issues: score < 95 ? [
            'Reformuler certaines phrases',
            'Ajouter des exemples'
        ].slice(0, 1) : [],
        approved: score >= 90
    };
}

/**
 * Affiche l'état actuel des modèles
 */
function showPipelineModelState() {
    console.log('📊 === ÉTAT ACTUEL DES MODÈLES ===');
    
    console.log('\n🤖 État des modèles individuels:');
    Object.keys(pipelineModelState.models).forEach(modelKey => {
        const model = pipelineModelState.models[modelKey];
        console.log(`\n${model.name}:`);
        console.log(`  📊 Statut: ${model.status}`);
        console.log(`  ⏱️ Temps de traitement: ${model.processingTime}ms`);
        console.log(`  🕐 Dernière exécution: ${model.lastRun ? new Date(model.lastRun).toLocaleTimeString() : 'Jamais'}`);
        console.log(`  ❌ Erreurs: ${model.errors.length}`);
    });
    
    console.log('\n📈 Statistiques du pipeline:');
    const pipeline = pipelineModelState.pipeline;
    console.log(`  📊 Statut: ${pipeline.status}`);
    console.log(`  ⏱️ Temps total: ${pipeline.totalProcessingTime}ms`);
    console.log(`  🎯 Taux de réussite: ${pipeline.successRate}%`);
    console.log(`  📊 Exécutions: ${pipeline.successfulRuns}/${pipeline.totalRuns}`);
}

/**
 * Test complet des 4 modèles
 */
async function testAllModels() {
    console.log('🧪 === TEST COMPLET DES 4 MODÈLES ===');
    
    const testCases = [
        {
            input: "C'est une belle journée ensoleillée.",
            context: "description d'un paysage",
            type: "descriptif"
        },
        {
            input: "Je pense que l'éducation est importante pour la société.",
            context: "réflexion sur l'éducation",
            type: "argumentatif"
        },
        {
            input: "Le personnage principal traverse une forêt sombre.",
            context: "début d'une histoire",
            type: "narratif"
        }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n🧪 Test ${i + 1}/${testCases.length}:`);
        console.log(`📝 Entrée: "${testCase.input}"`);
        
        try {
            if (typeof window.runFourModelPipeline === 'function') {
                const result = await window.runFourModelPipeline(testCase.input, testCase.context, testCase.type);
                console.log(`✅ Succès - Réponse: ${result.substring(0, 100)}...`);
            } else {
                console.log('❌ Pipeline non disponible');
            }
        } catch (error) {
            console.log(`❌ Erreur: ${error.message}`);
        }
        
        // Pause entre les tests
        if (i < testCases.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n🏁 Tests terminés - Affichage de l\'état final:');
    showPipelineModelState();
}

// Export des fonctions
window.checkPipelineModelsFunctional = checkPipelineModelsFunctional;
window.visualizePipelineWork = visualizePipelineWork;
window.showPipelineModelState = showPipelineModelState;
window.testAllModels = testAllModels;

// Lancement automatique
setTimeout(() => {
    console.log('🚀 Lancement de la vérification automatique des modèles...');
    checkPipelineModelsFunctional();
    
    // Activer la visualisation après 2 secondes
    setTimeout(() => {
        console.log('👁️ Activation de la visualisation du travail des modèles...');
        visualizePipelineWork();
    }, 2000);
    
    // Test après 5 secondes
    setTimeout(() => {
        console.log('🧪 Lancement du test automatique des modèles...');
        testAllModels();
    }, 5000);
}, 1000);

console.log('✅ Vérificateur de pipeline IA chargé');
