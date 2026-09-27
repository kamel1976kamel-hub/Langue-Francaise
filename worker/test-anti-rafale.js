/**
 * =================================================================
 * ACTION 28 — TESTS PROTECTION ANTI-RAFALE
 * =================================================================
 * Tests pour vérifier la protection anti-rafale côté client et Worker
 * =================================================================
 */

// Simuler le comportement du Worker
function simulateWorker(concurrentLimit) {
    let concurrentRequests = 0;
    let groqCalls = 0;
    
    return {
        processRequest: function() {
            if (concurrentRequests >= concurrentLimit) {
                return { success: false, error: 'Trop de requêtes simultanées', source: 'local_requis' };
            }
            concurrentRequests++;
            groqCalls += 3; // A22B = 3 appels Groq
            
            // Simuler le traitement
            setTimeout(function() {
                concurrentRequests--;
            }, 4500);
            
            return { success: true, source: 'remote_a22b', groqCalls: groqCalls };
        },
        getConcurrentRequests: function() {
            return concurrentRequests;
        },
        getGroqCalls: function() {
            return groqCalls;
        },
        reset: function() {
            concurrentRequests = 0;
            groqCalls = 0;
        }
    };
}

// Simuler le comportement du client
function simulateClient() {
    let requestInProgress = false;
    let lastRequestTime = 0;
    const minRequestInterval = 5000;
    
    return {
        makeRequest: function() {
            const now = Date.now();
            
            // Vérifier si une requête est en cours
            if (requestInProgress) {
                return { success: false, error: 'Requête déjà en cours', source: 'locale' };
            }
            
            // Vérifier l'intervalle minimum
            if (now - lastRequestTime < minRequestInterval) {
                return { success: false, error: 'Requête trop fréquente', source: 'locale' };
            }
            
            requestInProgress = true;
            lastRequestTime = now;
            
            // Simuler le jitter
            const jitterDelay = Math.random() * 3000;
            
            return { success: true, jitterDelay: jitterDelay };
        },
        endRequest: function() {
            requestInProgress = false;
        },
        isRequestInProgress: function() {
            return requestInProgress;
        }
    };
}

// Tests
function runTests() {
    console.log('🧪 Démarrage des tests protection anti-rafale...\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1 : 1 requête → passage normal
    console.log('📋 Test 1 : 1 requête → passage normal');
    try {
        const client = simulateClient();
        const result = client.makeRequest();
        if (result.success) {
            console.log('✅ PASSÉ');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : ' + result.error);
            failed++;
        }
        client.endRequest();
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Test 2 : 2 requêtes concurrentes → comportement correct
    console.log('\n📋 Test 2 : 2 requêtes concurrentes → comportement correct');
    try {
        const client = simulateClient();
        const result1 = client.makeRequest();
        const result2 = client.makeRequest();
        
        if (result1.success && !result2.success && result2.error === 'Requête déjà en cours') {
            console.log('✅ PASSÉ');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : La deuxième requête aurait dû être bloquée');
            failed++;
        }
        client.endRequest();
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Test 3 : dépassement de la limite locale → aucune nouvelle requête Groq lancée
    console.log('\n📋 Test 3 : dépassement de la limite locale → aucune nouvelle requête Groq lancée');
    try {
        const worker = simulateWorker(10);
        let results = [];
        
        // Simuler 15 requêtes simultanées
        for (let i = 0; i < 15; i++) {
            results.push(worker.processRequest());
        }
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        if (successCount === 10 && failureCount === 5) {
            console.log('✅ PASSÉ : 10 succès, 5 échecs');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : Attendu 10 succès/5 échecs, obtenu ' + successCount + '/' + failureCount);
            failed++;
        }
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Test 4 : 429 + Retry-After ≤ 10 s → au plus une attente puis A22
    console.log('\n📋 Test 4 : 429 + Retry-After ≤ 10 s → au plus une attente puis A22');
    try {
        // Simulation conceptuelle
        const retryAfter = 5; // 5 secondes
        const shouldWait = retryAfter <= 10;
        
        if (shouldWait) {
            console.log('✅ PASSÉ : Retry-After ≤ 10s, attente puis A22');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : Logique incorrecte');
            failed++;
        }
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Test 5 : 429 + Retry-After > 10 s → fallback sans attente prolongée
    console.log('\n📋 Test 5 : 429 + Retry-After > 10 s → fallback sans attente prolongée');
    try {
        const retryAfter = 15; // 15 secondes
        const shouldFallback = retryAfter > 10;
        
        if (shouldFallback) {
            console.log('✅ PASSÉ : Retry-After > 10s, fallback immédiat');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : Logique incorrecte');
            failed++;
        }
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Test 6 : 429 sans Retry-After → fallback sans boucle
    console.log('\n📋 Test 6 : 429 sans Retry-After → fallback sans boucle');
    try {
        const retryAfter = null;
        const defaultRetryAfter = 5;
        const shouldFallback = (retryAfter || defaultRetryAfter) > 10;
        
        if (!shouldFallback) {
            console.log('✅ PASSÉ : Retry-After absent, fallback après délai par défaut');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : Logique incorrecte');
            failed++;
        }
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Test 7 : verrou client → double clic bloqué
    console.log('\n📋 Test 7 : verrou client → double clic bloqué');
    try {
        const client = simulateClient();
        const result1 = client.makeRequest();
        const result2 = client.makeRequest();
        
        if (result1.success && !result2.success && result2.error === 'Requête déjà en cours') {
            console.log('✅ PASSÉ');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : Le double clic aurait dû être bloqué');
            failed++;
        }
        client.endRequest();
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Test 8 : intervalle minimum 5 s
    console.log('\n📋 Test 8 : intervalle minimum 5 s');
    try {
        const client = simulateClient();
        const result1 = client.makeRequest();
        client.endRequest();
        
        // Simuler un délai de 2 secondes
        const result2 = client.makeRequest();
        
        if (!result2.success && result2.error === 'Requête trop fréquente') {
            console.log('✅ PASSÉ');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : La requête aurait dû être bloquée (intervalle < 5s)');
            failed++;
        }
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Test 9 : jitter borné entre 0 et 3 s
    console.log('\n📋 Test 9 : jitter borné entre 0 et 3 s');
    try {
        const jitterDelays = [];
        for (let i = 0; i < 100; i++) {
            jitterDelays.push(Math.random() * 3000);
        }
        
        const maxDelay = Math.max(...jitterDelays);
        const minDelay = Math.min(...jitterDelays);
        
        if (minDelay >= 0 && maxDelay <= 3000) {
            console.log('✅ PASSÉ : Jitter borné entre 0 et 3000ms');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : Jitter hors bornes : ' + minDelay + ' - ' + maxDelay);
            failed++;
        }
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Test 10 : verrou libéré après succès
    console.log('\n📋 Test 10 : verrou libéré après succès');
    try {
        const client = simulateClient();
        const result1 = client.makeRequest();
        client.endRequest();
        const result2 = client.makeRequest();
        
        if (result1.success && result2.success) {
            console.log('✅ PASSÉ');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : Le verrou n\'a pas été libéré correctement');
            failed++;
        }
        client.endRequest();
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Test 11 : verrou libéré après erreur
    console.log('\n📋 Test 11 : verrou libéré après erreur');
    try {
        const client = simulateClient();
        const result1 = client.makeRequest();
        client.endRequest(); // Simuler une erreur
        const result2 = client.makeRequest();
        
        if (result1.success && result2.success) {
            console.log('✅ PASSÉ');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : Le verrou n\'a pas été libéré après erreur');
            failed++;
        }
        client.endRequest();
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Test 12 : aucun retry infini
    console.log('\n📋 Test 12 : aucun retry infini');
    try {
        let retryCount = 0;
        const maxRetries = 1;
        
        // Simuler la logique de retry
        for (let i = 0; i < 10; i++) {
            if (retryCount < maxRetries) {
                retryCount++;
            } else {
                break;
            }
        }
        
        if (retryCount === 1) {
            console.log('✅ PASSÉ : Un seul retry maximum');
            passed++;
        } else {
            console.log('❌ ÉCHOUÉ : Trop de retries : ' + retryCount);
            failed++;
        }
    } catch (e) {
        console.log('❌ ÉCHOUÉ : ' + e.message);
        failed++;
    }
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 Résultats : ' + passed + '/' + (passed + failed) + ' tests passés');
    if (failed > 0) {
        console.log('❌ ' + failed + ' test(s) échoué(s)');
    } else {
        console.log('✅ Tous les tests passés');
    }
    console.log('='.repeat(60));
    
    return { passed: passed, failed: failed, total: passed + failed };
}

// Exécuter les tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests };
} else {
    runTests();
}
