'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { handleRequest, MAX_CONCURRENT } = require('../worker/ai-pipeline-worker');

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const clientConfigSource = fs.readFileSync(path.join(__dirname, '..', 'worker-config.js'), 'utf8');

function request(overrides) {
    return new Request('https://worker.test', {
        method: 'POST',
        body: JSON.stringify(Object.assign({
            studentAnswer: 'Une réponse suffisamment longue.',
            activityContext: 'activité',
            activityType: 'general',
            systemPrompt: 'Analyse.',
            userPrompt: 'Une réponse.'
        }, overrides || {})),
        headers: { 'Content-Type': 'application/json' }
    });
}

function groqResponse(status, content, retryAfter) {
    const headers = new Headers();
    if (retryAfter !== undefined) headers.set('Retry-After', String(retryAfter));
    return new Response(status === 200 ? JSON.stringify({
        choices: [{ message: { content: content || 'Réponse pédagogique.' } }]
    }) : JSON.stringify({ error: 'simulated' }), { status, headers });
}

function createClient(workerUrl, fetchImpl) {
    const context = {
        window: {
            AI_WORKER_CONFIG: { workerUrl: workerUrl || '' },
            APP_CONFIG: { api: { workerUrl: '' }, modules: { required: [] } }
        },
        document: { addEventListener: () => {}, getElementById: () => null },
        location: { hostname: 'test', protocol: 'https:' },
        console: { log: () => {}, warn: () => {}, error: () => {} },
        setTimeout: callback => { callback(); return 1; },
        clearTimeout: () => {},
        Math: { random: () => 0, floor: Math.floor, max: Math.max, min: Math.min, round: Math.round },
        Date,
        Promise,
        AbortController,
        Response,
        fetch: fetchImpl
    };
    context.window.window = context.window;
    vm.createContext(context);
    vm.runInContext(clientConfigSource, context);
    vm.runInContext(mainSource, context);
    context.appState = context.window.appState;
    context.window.appState.iaReady = true;
    return context;
}

async function runClientThroughWorker(workerOptions) {
    let capturedPayload;
    let targetUrl;
    let stageCalls = 0;
    const context = createClient('https://worker.test/api', async (url, options) => {
        targetUrl = url;
        capturedPayload = JSON.parse(options.body);
        const workerResponse = await handleRequest(
            new Request(url, { method: options.method, headers: options.headers, body: options.body }),
            workerOptions.env || { GROQ_API_KEY: 'test-binding' },
            {
                fetchImpl: async (_groqUrl, groqOptions) => {
                    stageCalls += 1;
                    return workerOptions.groqFetch
                        ? workerOptions.groqFetch(stageCalls, groqOptions)
                        : groqResponse(200, 'Réponse pédagogique finale.');
                }
            }
        );
        return workerResponse;
    });
    const result = await context.window.demanderIA('Réponse de l’élève.', 'chat');
    return { result, capturedPayload, targetUrl, stageCalls };
}

test('A22B succès : client → contrat → 3 étapes → affichage avec provenance', async () => {
    const output = await runClientThroughWorker({});
    assert.equal(output.targetUrl, 'https://worker.test/api');
    assert.deepEqual(Object.keys(output.capturedPayload).sort(), [
        'activityContext', 'activityType', 'studentAnswer', 'systemPrompt', 'userPrompt'
    ]);
    assert.equal(output.capturedPayload.studentAnswer, 'Réponse de l’élève.');
    assert.equal(output.stageCalls, 3);
    assert.equal(output.result.source, 'remote_a22b');
    assert.match(output.result.analysis.analysis, /Analyse IA — mode pédagogique.*Réponse pédagogique finale/);
});

test('A22 fallback : source remote_a22_fallback conservée dans la réponse client', async () => {
    const output = await runClientThroughWorker({
        groqFetch: async call => call === 1
            ? groqResponse(429, '', 0)
            : groqResponse(200, 'Réponse simplifiée.')
    });
    assert.equal(output.result.source, 'remote_a22_fallback');
    assert.match(output.result.analysis.analysis, /Analyse IA — mode simplifié.*Réponse simplifiée/);
    assert.equal(output.stageCalls, 2);
});

test('fallback local Worker : source local_requis conservée dans la réponse client', async () => {
    const output = await runClientThroughWorker({ env: {} });
    assert.equal(output.result.source, 'local_requis');
    assert.match(output.result.analysis.analysis, /Configuration distante indisponible/);
    assert.equal(output.stageCalls, 0);
});

test('URL Worker absente : fallback local sans requête réseau', async () => {
    let calls = 0;
    const context = createClient('', async () => { calls += 1; throw new Error('network should not be used'); });
    const result = await context.window.demanderIA('Réponse élève.', 'chat');
    assert.equal(calls, 0);
    assert.equal(result.source, 'local_requis');
    assert.match(result.analysis.analysis, /analyse locale/i);
});

test('intervalle client : aucun nouvel appel avant cinq secondes', async () => {
    let now = 100000;
    let calls = 0;
    const context = createClient('https://worker.test/api', async () => {
        calls += 1;
        return new Response(JSON.stringify({
            source: 'remote_a22b',
            result: 'Réponse'
        }), { status: 200 });
    });
    context.Date = class extends Date {
        static now() { return now; }
    };

    await context.window.demanderIA('Réponse 1.', 'chat');
    const blocked = await context.window.demanderIA('Réponse 2.', 'chat');
    assert.equal(blocked.source, 'local_requis');
    assert.equal(calls, 1);

    now += 5000;
    const allowed = await context.window.demanderIA('Réponse 3.', 'chat');
    assert.equal(allowed.source, 'remote_a22b');
    assert.equal(calls, 2);
});

test('A22B Worker exécute les étapes 1, 2, 3 séquentiellement', async () => {
    const stages = [];
    const response = await handleRequest(request(), { GROQ_API_KEY: 'test-binding' }, {
        fetchImpl: async (_url, options) => {
            const content = JSON.parse(options.body).messages[1].content;
            stages.push(content.split('\n')[0]);
            return groqResponse(200, 'Étape ' + stages.length);
        }
    });
    assert.equal((await response.json()).source, 'remote_a22b');
    assert.equal(stages.length, 3);
    assert.match(stages[0], /^Analyse/);
    assert.match(stages[1], /^Transforme/);
    assert.match(stages[2], /^Rédige/);
});

test('429 Retry-After court : un fallback A22, sans retry additionnel', async () => {
    let calls = 0;
    const response = await handleRequest(request(), { GROQ_API_KEY: 'test-binding' }, {
        fetchImpl: async () => {
            calls += 1;
            return calls === 1 ? groqResponse(429, '', 0) : groqResponse(200, 'A22');
        }
    });
    assert.equal((await response.json()).source, 'remote_a22_fallback');
    assert.equal(calls, 2);
});

test('429 Retry-After long ou absent : fallback local sans seconde requête', async () => {
    for (const retryAfter of [undefined, 11]) {
        let calls = 0;
        const response = await handleRequest(request(), { GROQ_API_KEY: 'test-binding' }, {
            fetchImpl: async () => { calls += 1; return groqResponse(429, '', retryAfter); }
        });
        assert.equal((await response.json()).source, 'local_requis');
        assert.equal(calls, 1);
    }
});

test('Worker 400, 429 et 503 avec provenance locale sont conservés au client', async () => {
    for (const status of [400, 429, 503]) {
        let calls = 0;
        const context = createClient('https://worker.test/api', async () => {
            calls += 1;
            return new Response(JSON.stringify({
                source: 'local_requis',
                message: 'Utilisation du mode local.'
            }), { status });
        });
        const result = await context.window.demanderIA('Réponse élève.', 'chat');
        assert.equal(calls, 1);
        assert.equal(result.source, 'local_requis');
        assert.match(result.analysis.analysis, /mode local/);
    }
});

test('secret absent : Worker renvoie local_requis sans appel fournisseur', async () => {
    let calls = 0;
    const response = await handleRequest(request(), {}, {
        fetchImpl: async () => { calls += 1; return groqResponse(200); }
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).source, 'local_requis');
    assert.equal(calls, 0);
});

test('concurrence par instance plafonnée à dix pipelines', async () => {
    let calls = 0;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const fetchImpl = async () => {
        calls += 1;
        await gate;
        return groqResponse(200);
    };
    const requests = Array.from({ length: MAX_CONCURRENT + 1 }, () =>
        handleRequest(request(), { GROQ_API_KEY: 'test-binding' }, { fetchImpl }));
    await new Promise(resolve => setTimeout(resolve, 5));
    const saturated = await requests[MAX_CONCURRENT];
    assert.equal((await saturated.json()).reason, 'instance_saturation');
    assert.equal(calls, MAX_CONCURRENT);
    release();
    await Promise.all(requests.slice(0, MAX_CONCURRENT));
});

test('jitter borné, verrou double appel et libération succès/erreur', async () => {
    const pending = [];
    const context = createClient('https://worker.test/api', () =>
        new Promise((resolve, reject) => pending.push({ resolve, reject })));
    const originalSetTimeout = context.setTimeout;
    const timerDelays = [];
    context.setTimeout = (callback, ms) => {
        timerDelays.push(ms);
        originalSetTimeout(callback, ms);
        return 1;
    };
    const first = context.window.demanderIA('Réponse élève.', 'chat');
    await Promise.resolve();
    const second = await context.window.demanderIA('Deuxième requête.', 'chat');
    assert.equal(second.source, 'local_requis');
    assert.equal(pending.length, 1);
    assert.ok(timerDelays[0] >= 0 && timerDelays[0] <= 3000);

    pending.shift().resolve(new Response(JSON.stringify({
        source: 'remote_a22b',
        result: 'Succès'
    }), { status: 200 }));
    await first;
    assert.equal(context.window.remoteAiGuard.active, false);

    const failedRequests = [];
    const errorContext = createClient('https://worker.test/api', () =>
        new Promise((resolve, reject) => failedRequests.push({ resolve, reject })));
    const failed = errorContext.window.demanderIA('Nouvelle réponse.', 'chat');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(failedRequests.length, 1);
    failedRequests.shift().reject(new Error('simulated network failure'));
    await failed;
    assert.equal(errorContext.window.remoteAiGuard.active, false);
});

test('aucun retry client ni appel direct Groq, secret absent du code client', () => {
    assert.doesNotMatch(mainSource, /fetch\(['"`]https:\/\/api\.groq\.com/);
    assert.doesNotMatch(mainSource, /GROQ_API_KEY/);
    assert.doesNotMatch(mainSource, /retryAttempts:\s*[1-9]/);
    assert.match(mainSource, /workerUrl/);
});
