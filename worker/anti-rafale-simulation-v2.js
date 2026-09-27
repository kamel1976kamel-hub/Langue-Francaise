/**
 * =================================================================
 * ACTION 27 — SIMULATION PROTECTION ANTI-RAFALE A22B V2
 * =================================================================
 * Simulation plus réaliste avec jitter plus long et distribution
 * =================================================================
 */

// Simulation avec jitter plus long
function simulateJitterV2(etalves, maxDelayMs) {
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

// Analyser la distribution avec fenêtres glissantes
function analyzeSlidingWindows(requests, windowSizeMs = 60000, slideStepMs = 1000) {
    const maxTimestamp = Math.max(...requests.map(r => r.timestamp));
    const windows = [];
    
    // Fenêtres glissantes
    for (let start = 0; start <= maxTimestamp; start += slideStepMs) {
        const end = start + windowSizeMs;
        const requestsInWindow = requests.filter(r => r.timestamp >= start && r.timestamp < end);
        
        if (requestsInWindow.length > 0) {
            windows.push({
                start: start,
                end: end,
                count: requestsInWindow.length
            });
        }
    }
    
    // Trouver la fenêtre la plus chargée
    const maxWindow = windows.reduce((max, w) => w.count > max.count ? w : max, { count: 0 });
    
    return {
        windows: windows,
        maxWindow: maxWindow
    };
}

// Simulation V2
function simulateScenarioV2(etalves, jitterMs, scenarioName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`SCÉNARIO : ${scenarioName}`);
    console.log(`Élèves : ${etalves}, Jitter : ${jitterMs/1000}s`);
    console.log('='.repeat(60));
    
    // Simuler le jitter
    const requests = simulateJitterV2(etalves, jitterMs);
    
    // Analyser avec fenêtres glissantes
    const analysis = analyzeSlidingWindows(requests);
    
    // Calculer les appels Groq pour la fenêtre maximale
    const groqCalls = analysis.maxWindow.count * 3;
    const rpmRisk = (groqCalls / 30) * 100;
    
    // Calculer TPM
    const step1Tokens = analysis.maxWindow.count * 608;
    const step1Risk = (step1Tokens / 8000) * 100;
    
    const step2Tokens = analysis.maxWindow.count * 595;
    const step2Risk = (step2Tokens / 8000) * 100;
    
    const step3Tokens = analysis.maxWindow.count * 518;
    const step3Risk = (step3Tokens / 8000) * 100;
    
    console.log(`\n📊 Distribution des requêtes :`);
    console.log(`   Fenêtre maximale : ${analysis.maxWindow.count} élèves`);
    console.log(`   Timestamp fenêtre : ${analysis.maxWindow.start/1000}s - ${analysis.maxWindow.end/1000}s`);
    console.log(`   Appels Groq théoriques : ${groqCalls}`);
    console.log(`   Risque RPM : ${rpmRisk.toFixed(1)}%`);
    console.log(`   Risque TPM (étape 1) : ${step1Risk.toFixed(1)}%`);
    console.log(`   Risque TPM (étape 2) : ${step2Risk.toFixed(1)}%`);
    console.log(`   Risque TPM (étape 3) : ${step3Risk.toFixed(1)}%`);
    
    const status = rpmRisk > 100 || step1Risk > 100 ? '❌ DÉPASSEMENT' : '✅ OK';
    console.log(`   Statut : ${status}`);
    
    return {
        scenario: scenarioName,
        etalves: etalves,
        jitterMs: jitterMs,
        maxWindowCount: analysis.maxWindow.count,
        groqCalls: groqCalls,
        rpmRisk: rpmRisk,
        tpmRisk: { step1: step1Risk, step2: step2Risk, step3: step3Risk },
        status: status
    };
}

// Simulations avec jitter plus long
function runExtendedSimulations() {
    console.log('🧪 SIMULATION PROTECTION ANTI-RAFALE A22B V2 (Jitter étendu)\n');
    
    const etalvesList = [20, 40];
    const jitterOptions = [0, 10000, 30000, 60000, 120000]; // 0, 10s, 30s, 60s, 120s
    
    const results = [];
    
    etalvesList.forEach(etalves => {
        jitterOptions.forEach(jitter => {
            const scenarioName = `${etalves} élèves, jitter ${jitter/1000}s`;
            const result = simulateScenarioV2(etalves, jitter, scenarioName);
            results.push(result);
        });
    });
    
    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('RÉSUMÉ DES SIMULATIONS (Jitter étendu)');
    console.log('='.repeat(60));
    
    const table = results.map(r => 
        `${r.etalves} élèves, ${r.jitterMs/1000}s jitter : ${r.status} (max ${r.maxWindowCount} élèves/fenêtre)`
    );
    
    table.forEach(line => console.log(line));
    
    return results;
}

// Exécuter les simulations
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runExtendedSimulations, simulateScenarioV2 };
} else {
    runExtendedSimulations();
}
