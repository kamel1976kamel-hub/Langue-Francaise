/**
 * =================================================================
 * ACTION 27 — SIMULATION PROTECTION ANTI-RAFALE A22B
 * =================================================================
 * Simulation théorique de l'effet du jitter sur les rafales
 * =================================================================
 */

// Fonction de simulation de jitter
function simulateJitter(etalves, maxDelayMs) {
    const requests = [];
    
    for (let i = 0; i < etalves; i++) {
        // Délai aléatoire entre 0 et maxDelayMs
        const delay = Math.random() * maxDelayMs;
        requests.push({
            student: i + 1,
            delay: delay,
            timestamp: delay
        });
    }
    
    // Trier par timestamp
    requests.sort((a, b) => a.timestamp - b.timestamp);
    
    return requests;
}

// Analyser la distribution des requêtes dans une fenêtre de 60 secondes
function analyzeDistribution(requests, windowSizeMs = 60000) {
    const windows = [];
    const maxTimestamp = Math.max(...requests.map(r => r.timestamp));
    
    // Créer des fenêtres de 60 secondes
    for (let start = 0; start <= maxTimestamp; start += windowSizeMs) {
        const end = start + windowSizeMs;
        const requestsInWindow = requests.filter(r => r.timestamp >= start && r.timestamp < end);
        
        if (requestsInWindow.length > 0) {
            windows.push({
                start: start,
                end: end,
                count: requestsInWindow.length,
                requests: requestsInWindow
            });
        }
    }
    
    return windows;
}

// Calculer les appels Groq théoriques
function calculateGroqCalls(studentCount) {
    // A22B = 3 appels par élève
    return studentCount * 3;
}

// Calculer le risque RPM
function calculateRPMRisk(groqCalls, limitRPM = 30) {
    return (groqCalls / limitRPM) * 100;
}

// Calculer le risque TPM (par étape)
function calculateTPMRisk(studentCount, limitTPM = 8000) {
    // Étape 1 = 608 tokens par élève
    const step1Tokens = studentCount * 608;
    const step1Risk = (step1Tokens / limitTPM) * 100;
    
    // Étape 2 = 595 tokens par élève
    const step2Tokens = studentCount * 595;
    const step2Risk = (step2Tokens / limitTPM) * 100;
    
    // Étape 3 = 518 tokens par élève
    const step3Tokens = studentCount * 518;
    const step3Risk = (step3Tokens / limitTPM) * 100;
    
    return {
        step1: { tokens: step1Tokens, risk: step1Risk },
        step2: { tokens: step2Tokens, risk: step2Risk },
        step3: { tokens: step3Tokens, risk: step3Risk }
    };
}

// Simulation complète
function simulateScenario(etalves, jitterMs, scenarioName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`SCÉNARIO : ${scenarioName}`);
    console.log(`Élèves : ${etalves}, Jitter : ${jitterMs}ms`);
    console.log('='.repeat(60));
    
    // Simuler le jitter
    const requests = simulateJitter(etalves, jitterMs);
    
    // Analyser la distribution
    const windows = analyzeDistribution(requests);
    
    // Trouver la fenêtre la plus chargée
    const maxWindow = windows.reduce((max, w) => w.count > max.count ? w : max, { count: 0 });
    
    // Calculer les appels Groq pour la fenêtre maximale
    const groqCalls = calculateGroqCalls(maxWindow.count);
    const rpmRisk = calculateRPMRisk(groqCalls);
    const tpmRisk = calculateTPMRisk(maxWindow.count);
    
    console.log(`\n📊 Distribution des requêtes :`);
    console.log(`   Fenêtre maximale : ${maxWindow.count} élèves dans ${windows.length > 1 ? '60s' : '< 60s'}`);
    console.log(`   Appels Groq théoriques : ${groqCalls}`);
    console.log(`   Risque RPM : ${rpmRisk.toFixed(1)}%`);
    console.log(`   Risque TPM (étape 1) : ${tpmRisk.step1.risk.toFixed(1)}%`);
    console.log(`   Risque TPM (étape 2) : ${tpmRisk.step2.risk.toFixed(1)}%`);
    console.log(`   Risque TPM (étape 3) : ${tpmRisk.step3.risk.toFixed(1)}%`);
    
    // Afficher le résultat
    const status = rpmRisk > 100 || tpmRisk.step1.risk > 100 ? '❌ DÉPASSEMENT' : '✅ OK';
    console.log(`   Statut : ${status}`);
    
    return {
        scenario: scenarioName,
        etalves: etalves,
        jitterMs: jitterMs,
        maxWindowCount: maxWindow.count,
        groqCalls: groqCalls,
        rpmRisk: rpmRisk,
        tpmRisk: tpmRisk,
        status: status
    };
}

// Simulation de tous les scénarios
function runAllSimulations() {
    console.log('🧪 SIMULATION PROTECTION ANTI-RAFALE A22B\n');
    
    const etalvesList = [5, 10, 20, 40];
    const jitterOptions = [0, 2000, 5000, 10000, 15000]; // 0, 2s, 5s, 10s, 15s
    
    const results = [];
    
    etalvesList.forEach(etalves => {
        jitterOptions.forEach(jitter => {
            const scenarioName = `${etalves} élèves, jitter ${jitter/1000}s`;
            const result = simulateScenario(etalves, jitter, scenarioName);
            results.push(result);
        });
    });
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('RÉSUMÉ DES SIMULATIONS');
    console.log('='.repeat(60));
    
    const table = results.map(r => 
        `${r.etalves} élèves, ${r.jitterMs/1000}s jitter : ${r.status}`
    );
    
    table.forEach(line => console.log(line));
    
    return results;
}

// Exécuter les simulations
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllSimulations, simulateScenario };
} else {
    runAllSimulations();
}
