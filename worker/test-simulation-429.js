/**
 * =================================================================
 * ACTION 23 — TEST DE SIMULATION DE SATURATION 429
 * =================================================================
 * Ce test simule une erreur 429 (quota dépassé) sans consommer
 * réellement le quota Groq, en utilisant des mocks.
 * =================================================================
 */

// Mock de l'API Groq pour simuler une erreur 429
function mockGroqAPI429() {
    return new Promise((resolve, reject) => {
        // Simuler un délai réseau réaliste
        setTimeout(() => {
            const error = new Error('Groq: quota atteint');
            error.statut = 429;
            error.retryAfter = 60; // Retry-After header simulé
            reject(error);
        }, 100);
    });
}

// Mock de l'API Groq pour simuler une réponse normale
function mockGroqAPISuccess(responseData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                contenu: JSON.stringify(responseData),
                usage: {
                    prompt_tokens: 150,
                    completion_tokens: 100,
                    total_tokens: 250
                }
            });
        }, 100);
    });
}

// Simulation du comportement du Worker avec fallback A22
async function simulateWorkerWith429Fallback() {
    console.log('🔄 Simulation du Worker avec erreur 429...\n');
    
    const startTime = Date.now();
    
    try {
        // Tentative A22B (pipeline 3 étapes)
        console.log('📡 Tentative A22B (pipeline 3 étapes)...');
        await mockGroqAPI429();
        
        // Si on arrive ici, c'est que A22B a réussi (ne devrait pas arriver dans ce test)
        return {
            success: true,
            source: 'remote_a22b',
            message: 'A22B a réussi (inattendu dans ce test)'
        };
        
    } catch (errA22B) {
        console.log(`❌ A22B échoué: ${errA22B.message} (statut: ${errA22B.statut})`);
        
        // Vérifier si l'erreur est transitoire
        const isTransient = errA22B.statut === 429 || errA22B.statut >= 500;
        
        if (isTransient) {
            console.log('🔄 Erreur transitoire détectée, activation du fallback A22...\n');
            
            try {
                // Tentative A22 (fallback)
                console.log('📡 Tentative A22 (fallback, 1 appel unique)...');
                const a22Response = await mockGroqAPISuccess({
                    analyse: 'Analyse compacte simulée',
                    pedagogie: 'Explication pédagogique simulée',
                    reference: 'Référence au cours simulée'
                });
                
                const processingTime = Date.now() - startTime;
                
                console.log('✅ A22 fallback réussi !');
                console.log(`⏱️ Temps de traitement: ${processingTime}ms`);
                console.log(`📊 Tokens utilisés: ${a22Response.usage.total_tokens}`);
                
                return {
                    success: true,
                    source: 'remote_a22_fallback',
                    message: 'Fallback A22 activé avec succès après erreur 429',
                    bascule: `a22b_vers_a22:${errA22B.statut}`,
                    retryAfter: errA22B.retryAfter,
                    traitementMs: processingTime,
                    usage: a22Response.usage,
                    quotaConsumed: 0 // IMPORTANT: 0 quota réel consommé
                };
                
            } catch (errA22) {
                console.log(`❌ A22 fallback échoué: ${errA22.message}`);
                
                // Si A22 échoue aussi, retourner local_requis
                return {
                    success: false,
                    source: 'local_requis',
                    message: 'A22B et A22 ont échoué, fallback local requis',
                    erreur: 'Service IA saturé, réessayez plus tard',
                    statut: errA22.statut || 502,
                    retryAfter: errA22.retryAfter || errA22B.retryAfter || null,
                    quotaConsumed: 0
                };
            }
        } else {
            // Erreur permanente, pas de fallback
            console.log('⚠️ Erreur permanente détectée, pas de fallback');
            return {
                success: false,
                source: 'local_requis',
                message: 'Erreur permanente, pas de fallback A22',
                erreur: 'Service IA indisponible',
                statut: errA22B.statut,
                quotaConsumed: 0
            };
        }
    }
}

// Test de validation
async function validate429Simulation() {
    console.log('🧪 Test de simulation de saturation 429\n');
    console.log('='.repeat(60));
    
    const result = await simulateWorkerWith429Fallback();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Résultat du test:\n');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Validation:\n');
    
    const validations = [];
    
    // Validation 1: Le fallback A22 a été activé
    if (result.source === 'remote_a22_fallback') {
        console.log('✅ Fallback A22 activé correctement');
        validations.push(true);
    } else {
        console.log('❌ Fallback A22 non activé');
        validations.push(false);
    }
    
    // Validation 2: Aucun quota réel n'a été consommé
    if (result.quotaConsumed === 0) {
        console.log('✅ Aucun quota réel consommé (simulation)');
        validations.push(true);
    } else {
        console.log('❌ Quota consommé (ne devrait pas arriver)');
        validations.push(false);
    }
    
    // Validation 3: Le marqueur de bascule est présent
    if (result.bascule && result.bascule.includes('429')) {
        console.log('✅ Marqueur de bascule correct');
        validations.push(true);
    } else {
        console.log('❌ Marqueur de bascule manquant ou incorrect');
        validations.push(false);
    }
    
    // Validation 4: Retry-After est présent
    if (result.retryAfter !== null && result.retryAfter !== undefined) {
        console.log('✅ Retry-After présent (60 secondes)');
        validations.push(true);
    } else {
        console.log('❌ Retry-After manquant');
        validations.push(false);
    }
    
    // Validation 5: Le temps de traitement est mesuré
    if (result.traitementMs && result.traitementMs > 0) {
        console.log(`✅ Temps de traitement mesuré: ${result.traitementMs}ms`);
        validations.push(true);
    } else {
        console.log('❌ Temps de traitement non mesuré');
        validations.push(false);
    }
    
    console.log('\n' + '='.repeat(60));
    const allValidationsPassed = validations.every(v => v === true);
    
    if (allValidationsPassed) {
        console.log('🎉 TEST RÉUSSI: Simulation 429 fonctionnelle sans consommation de quota');
    } else {
        console.log('❌ TEST ÉCHOUÉ: Certaines validations ont échoué');
    }
    
    console.log('='.repeat(60));
    
    return {
        success: allValidationsPassed,
        validations: validations,
        result: result
    };
}

// Exécuter le test
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { validate429Simulation };
} else {
    validate429Simulation().then(result => {
        console.log('\nTest terminé.');
        process.exit(result.success ? 0 : 1);
    });
}
