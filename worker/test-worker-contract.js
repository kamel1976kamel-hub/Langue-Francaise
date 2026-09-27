/**
 * =================================================================
 * TESTS D'INTÉGRATION DU WORKER IA — CONTRAT main.js
 * =================================================================
 * Tests le Worker avec le contrat exact envoyé par main.js.
 * Mocke fetch() pour simuler les réponses Groq sans quota réel.
 * =================================================================
 */

let pass = 0, fail = 0, skip = 0;
function assert(cond, label) {
    if (cond) { pass++; console.log('  ✅ PASS — ' + label); }
    else { fail++; console.error('  ❌ ÉCHEC — ' + label); }
}
function assertEq(actual, expected, label) {
    assert(actual === expected, label + ' (attendu: ' + JSON.stringify(expected) + ', obtenu: ' + JSON.stringify(actual) + ')');
}

// Compteur de requêtes concurrentes exposé pour les tests (via le module)
let workerModule = null;
let mockFetchResponses = [];
let originalFetch = globalThis.fetch;

function mockFetch(responses) {
    mockFetchResponses = Array.isArray(responses) ? responses : [responses];
    globalThis.fetch = async function(url, opts) {
        const resp = mockFetchResponses.shift() || { status: 500, ok: false, headers: new Map(), json: async () => ({}) };
        return resp;
    };
}

function makeGroqResponse(content, finishReason) {
    return {
        status: 200,
        ok: true,
        headers: { get: function() { return null; } },
        json: async function() {
            return {
                choices: [{ message: { content: content }, finish_reason: finishReason || 'stop' }],
                usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
            };
        }
    };
}

function makeErrorResponse(status, extra) {
    return {
        status: status,
        ok: false,
        headers: { get: function(h) { return (extra && extra.headers && extra.headers[h]) || null; } },
        json: async function() { return { error: 'mock error' }; }
    };
}

function makeRequest(body, method) {
    return {
        method: method || 'POST',
        json: async function() {
            if (typeof body === 'string') throw new Error('invalid json');
            return body;
        }
    };
}

function makeMainJsPayload(overrides) {
    return Object.assign({
        action: 'analyze',
        systemPrompt: 'Tu es un expert en français et en pédagogie.',
        userPrompt: 'Texte de l\'étudiant : "la texte est important"',
        context: 'activité',
        maxTokens: 300,
        temperature: 0.7
    }, overrides || {});
}

async function runTests() {
    console.log('🧪 Tests d\'intégration du Worker IA — contrat main.js\n');

    // Import dynamique du Worker (ES module)
    try {
        workerModule = await import('./ai-pipeline-worker.js');
    } catch (e) {
        console.error('FATAL: Impossible d\'importer le Worker:', e.message);
        process.exit(2);
    }
    const handler = workerModule.default;
    assert(handler && typeof handler.fetch === 'function', 'Worker importé et fetch disponible');

    const env = { GROQ_API_KEY: 'test-key-mock' };
    const ctx = {};

    // ─── TEST 1 : Requête valide avec contrat main.js ───
    console.log('\n📋 Test 1 : Requête valide (contrat main.js)');
    mockFetch([
        makeGroqResponse('{"diagnostic":"erreur article","erreurs":[{"extrait":"la texte","type":"grammaticale","correction":"le texte"}],"priorite":"haute"}'),
        makeGroqResponse('{"explication":"Le mot texte est masculin","conseil":"Revoyez les articles","exemple":"le texte est long"}'),
        makeGroqResponse('{"point_cours":"Accord article-nom","regle":"texte est masculin","exemple":"le texte","verifie":true}')
    ]);
    {
        const req = makeRequest(makeMainJsPayload());
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200');
        assertEq(data.source, 'remote_a22b', 'Source = remote_a22b');
        assert(data.choices && data.choices[0] && data.choices[0].message, 'choices[0].message présent');
        assert(typeof data.choices[0].message.content === 'string' && data.choices[0].message.content.length > 0, 'choices[0].message.content non vide');
        assert(typeof data.analysis === 'string' && data.analysis.length > 0, 'analysis non vide');
        assert(data.etapes && data.etapes.analyse && data.etapes.tuteur && data.etapes.cours, 'etapes complètes');
        assertEq(data.modele, 'openai/gpt-oss-20b', 'modèle correct');
        assert(typeof data.traitementMs === 'number', 'traitementMs présent');
    }

    // ─── TEST 2 : Compatibilité réponse → main.js ───
    console.log('\n📋 Test 2 : Compatibilité réponse → main.js');
    mockFetch([
        makeGroqResponse('{"diagnostic":"test","erreurs":[],"priorite":"basse"}'),
        makeGroqResponse('{"explication":"ok","conseil":"ok","exemple":"ok"}'),
        makeGroqResponse('{"point_cours":"ok","regle":"ok","exemple":"ok","verifie":true}')
    ]);
    {
        const req = makeRequest(makeMainJsPayload());
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        // Simuler exactement la lecture du client
        const aiResponse = data.choices?.[0]?.message?.content || data.analysis || 'Réponse IA non disponible';
        assert(aiResponse !== 'Réponse IA non disponible', 'Client lit une réponse utile (pas "Réponse IA non disponible")');
        assert(aiResponse.length > 10, 'Réponse substantielle (' + aiResponse.length + ' chars)');
    }

    // ─── TEST 3 : Méthode GET → 405 ───
    console.log('\n📋 Test 3 : Méthode GET → 405');
    {
        const req = makeRequest({}, 'GET');
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 405, 'Statut 405');
        assert(data.erreur && data.erreur.includes('Méthode'), 'Message erreur méthode');
    }

    // ─── TEST 4 : OPTIONS → 204 CORS ───
    console.log('\n📋 Test 4 : OPTIONS → 204 CORS');
    {
        const req = makeRequest({}, 'OPTIONS');
        const resp = await handler.fetch(req, env, ctx);
        assertEq(resp.status, 204, 'Statut 204');
        const corsOrigin = resp.headers.get ? resp.headers.get('Access-Control-Allow-Origin') : resp.headers['Access-Control-Allow-Origin'];
        assert(corsOrigin === 'https://kamel1976kamel-hub.github.io', 'CORS origine correcte');
    }

    // ─── TEST 5 : JSON invalide → 400 ───
    console.log('\n📋 Test 5 : JSON invalide → 400');
    {
        const req = makeRequest('not json');
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 400, 'Statut 400');
        assert(data.erreur && data.erreur.includes('JSON'), 'Message erreur JSON');
    }

    // ─── TEST 6 : userPrompt absent → 400 ───
    console.log('\n📋 Test 6 : userPrompt absent → 400');
    {
        const req = makeRequest({ action: 'analyze', systemPrompt: 'test' });
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 400, 'Statut 400');
        assert(data.erreur && data.erreur.includes('userPrompt'), 'Message erreur userPrompt');
    }

    // ─── TEST 7 : userPrompt vide → 400 ───
    console.log('\n📋 Test 7 : userPrompt vide → 400');
    {
        const req = makeRequest({ action: 'analyze', userPrompt: '   ' });
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 400, 'Statut 400');
    }

    // ─── TEST 8 : userPrompt trop long → 413 ───
    console.log('\n📋 Test 8 : userPrompt trop long → 413');
    {
        const req = makeRequest({ action: 'analyze', userPrompt: 'a'.repeat(2001) });
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 413, 'Statut 413');
    }

    // ─── TEST 9 : context trop long → tronqué (pas d'erreur) ───
    console.log('\n📋 Test 9 : context trop long → tronqué');
    mockFetch([
        makeGroqResponse('{"diagnostic":"ok","erreurs":[],"priorite":"basse"}'),
        makeGroqResponse('{"explication":"ok","conseil":"ok","exemple":"ok"}'),
        makeGroqResponse('{"point_cours":"ok","regle":"ok","exemple":"ok","verifie":true}')
    ]);
    {
        const req = makeRequest(makeMainJsPayload({ context: 'x'.repeat(5000) }));
        const resp = await handler.fetch(req, env, ctx);
        assertEq(resp.status, 200, 'Statut 200 (context tronqué accepté)');
    }

    // ─── TEST 10 : maxTokens hors limites → 400 ───
    console.log('\n📋 Test 10 : maxTokens hors limites → 400');
    {
        const req = makeRequest(makeMainJsPayload({ maxTokens: 99999 }));
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 400, 'Statut 400 pour maxTokens trop grand');
    }

    // ─── TEST 11 : temperature hors limites → 400 ───
    console.log('\n📋 Test 11 : temperature hors limites → 400');
    {
        const req = makeRequest(makeMainJsPayload({ temperature: 5.0 }));
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 400, 'Statut 400 pour temperature > 1');
    }

    // ─── TEST 12 : action non supportée → 400 ───
    console.log('\n📋 Test 12 : action non supportée → 400');
    {
        const req = makeRequest(makeMainJsPayload({ action: 'delete' }));
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 400, 'Statut 400 pour action non supportée');
    }

    // ─── TEST 13 : Clé absente → 503 ───
    console.log('\n📋 Test 13 : Clé absente → 503');
    {
        const req = makeRequest(makeMainJsPayload());
        const resp = await handler.fetch(req, {}, ctx);
        const data = await resp.json();
        assertEq(resp.status, 503, 'Statut 503 sans clé');
    }

    // ─── TEST 14 : Erreur 429 → fallback A22 ───
    console.log('\n📋 Test 14 : Erreur 429 Groq → fallback A22');
    mockFetch([
        // A22B step 1 → 429
        makeErrorResponse(429, { headers: { 'retry-after': '2' } }),
        // A22 fallback → succès
        makeGroqResponse('{"analyse":"test fallback","pedagogie":"conseil","reference":"règle"}')
    ]);
    {
        const req = makeRequest(makeMainJsPayload());
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200 (fallback A22)');
        assertEq(data.source, 'remote_a22_fallback', 'Source = remote_a22_fallback');
        assert(data.choices && data.choices[0] && data.choices[0].message, 'choices présent dans fallback');
        assert(typeof data.analysis === 'string' && data.analysis.length > 0, 'analysis présent dans fallback');
        assert(data.bascule && data.bascule.includes('429'), 'bascule mentionne 429');
    }

    // ─── TEST 15 : Timeout → fallback A22 ───
    console.log('\n📋 Test 15 : Timeout → fallback A22');
    // Simuler un timeout : fetch lève une erreur au 1er appel (step 1)
    // A22B step 1 échoue → catch → A22 fallback (2e appel) réussit
    let fetchCallCount = 0;
    globalThis.fetch = async function() {
        fetchCallCount++;
        if (fetchCallCount === 1) {
            // Step 1 : timeout simulé
            const err = new Error('Timeout simulé');
            throw err;
        }
        // A22 fallback → succès
        return makeGroqResponse('{"analyse":"timeout fallback","pedagogie":"ok","reference":"ok"}');
    };
    {
        const req = makeRequest(makeMainJsPayload());
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200 (fallback après timeout)');
        assertEq(data.source, 'remote_a22_fallback', 'Source = remote_a22_fallback après timeout');
    }
    globalThis.fetch = originalFetch;

    // ─── TEST 16 : Erreur 401 → pas de fallback (permanent) ───
    console.log('\n📋 Test 16 : Erreur 401 → pas de fallback (permanent)');
    mockFetch([makeErrorResponse(401)]);
    {
        const req = makeRequest(makeMainJsPayload());
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200 (fallback local)');
        assertEq(data.source, 'local_requis', 'Source = local_requis');
    }

    // ─── TEST 17 : finish_reason=length → fallback ───
    console.log('\n📋 Test 17 : finish_reason=length → transitoire → fallback A22');
    mockFetch([
        // A22B step 1 → finish_reason=length
        makeGroqResponse('{"diagnostic":"tronqué","erreurs":[]', 'length'),
        // A22 fallback → succès
        makeGroqResponse('{"analyse":"fallback length","pedagogie":"ok","reference":"ok"}')
    ]);
    {
        const req = makeRequest(makeMainJsPayload());
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200 (fallback après length)');
        assertEq(data.source, 'remote_a22_fallback', 'Source = remote_a22_fallback après finish_reason=length');
    }

    // ─── TEST 18 : Réponse Groq JSON invalide → extraireJSON tolérant ───
    console.log('\n📋 Test 18 : Réponse Groq JSON invalide → tolérance');
    mockFetch([
        makeGroqResponse('Voici le résultat {"diagnostic":"ok","erreurs":[],"priorite":"basse"} fin'),
        makeGroqResponse('{"explication":"ok","conseil":"ok","exemple":"ok"}'),
        makeGroqResponse('{"point_cours":"ok","regle":"ok","exemple":"ok","verifie":true}')
    ]);
    {
        const req = makeRequest(makeMainJsPayload());
        const resp = await handler.fetch(req, env, ctx);
        assertEq(resp.status, 200, 'Statut 200 (JSON invalide toléré)');
    }

    // ─── TEST 19 : Aucun secret dans les réponses ───
    console.log('\n📋 Test 19 : Aucun secret dans les réponses');
    mockFetch([
        makeGroqResponse('{"diagnostic":"ok","erreurs":[],"priorite":"basse"}'),
        makeGroqResponse('{"explication":"ok","conseil":"ok","exemple":"ok"}'),
        makeGroqResponse('{"point_cours":"ok","regle":"ok","exemple":"ok","verifie":true}')
    ]);
    {
        const req = makeRequest(makeMainJsPayload());
        const resp = await handler.fetch(req, env, ctx);
        const text = await resp.text();
        assert(!text.includes('test-key-mock'), 'Clé API absente de la réponse');
        assert(!text.includes('gsk_'), 'Pas de prefixe gsk_ dans la réponse');
    }

    // ─── TEST 20 : Compteur concurrence — succès ───
    console.log('\n📋 Test 20 : Compteur concurrence — cycle complet');
    mockFetch([
        makeGroqResponse('{"diagnostic":"ok","erreurs":[],"priorite":"basse"}'),
        makeGroqResponse('{"explication":"ok","conseil":"ok","exemple":"ok"}'),
        makeGroqResponse('{"point_cours":"ok","regle":"ok","exemple":"ok","verifie":true}')
    ]);
    {
        // Le compteur est interne au module, on vérifie indirectement
        // qu'une requête réussie ne bloque pas les suivantes
        const req1 = makeRequest(makeMainJsPayload());
        const resp1 = await handler.fetch(req1, env, ctx);
        assertEq(resp1.status, 200, 'Requête 1 réussie');

        mockFetch([
            makeGroqResponse('{"diagnostic":"ok2","erreurs":[],"priorite":"basse"}'),
            makeGroqResponse('{"explication":"ok2","conseil":"ok2","exemple":"ok2"}'),
            makeGroqResponse('{"point_cours":"ok2","regle":"ok2","exemple":"ok2","verifie":true}')
        ]);
        const req2 = makeRequest(makeMainJsPayload());
        const resp2 = await handler.fetch(req2, env, ctx);
        assertEq(resp2.status, 200, 'Requête 2 réussie (compteur libéré)');
    }

    // ─── TEST 21 : Compteur concurrence — erreur ───
    console.log('\n📋 Test 21 : Compteur concurrence — cycle erreur');
    mockFetch([makeErrorResponse(401)]);
    {
        const req = makeRequest(makeMainJsPayload());
        const resp = await handler.fetch(req, env, ctx);
        assertEq(resp.status, 200, 'Requête erreur (fallback local)');

        // Vérifier que le compteur est libéré : nouvelle requête possible
        mockFetch([
            makeGroqResponse('{"diagnostic":"ok","erreurs":[],"priorite":"basse"}'),
            makeGroqResponse('{"explication":"ok","conseil":"ok","exemple":"ok"}'),
            makeGroqResponse('{"point_cours":"ok","regle":"ok","exemple":"ok","verifie":true}')
        ]);
        const req2 = makeRequest(makeMainJsPayload());
        const resp2 = await handler.fetch(req2, env, ctx);
        assertEq(resp2.status, 200, 'Requête après erreur réussie (compteur libéré)');
    }

    // ─── TEST 22 : A22B → A22 échoue → local_requis ───
    console.log('\n📋 Test 22 : A22B → A22 échoue → local_requis');
    mockFetch([
        makeErrorResponse(429, { headers: { 'retry-after': '2' } }),
        makeErrorResponse(429, { headers: { 'retry-after': '60' } })
    ]);
    {
        const req = makeRequest(makeMainJsPayload());
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 429, 'Statut 429 (A22 aussi échoué)');
        assertEq(data.source, 'local_requis', 'Source = local_requis');
    }

    // ─── TEST 23 : Payload exact main.js (chat mode) ───
    console.log('\n📋 Test 23 : Payload exact main.js (mode chat)');
    mockFetch([
        makeGroqResponse('{"diagnostic":"question claire","erreurs":[],"priorite":"basse"}'),
        makeGroqResponse('{"explication":"bonne question","conseil":"continuez","exemple":"parfait"}'),
        makeGroqResponse('{"point_cours":"communication","regle":"poser des questions","exemple":"bravo","verifie":true}')
    ]);
    {
        const chatPayload = {
            action: 'analyze',
            systemPrompt: 'Tu es un assistant expert en français et en pédagogie.',
            userPrompt: 'Question de l\'étudiant : "Qu\'est-ce qu\'un complément d\'objet ?"',
            context: 'chat',
            maxTokens: 500,
            temperature: 0.7
        };
        const req = makeRequest(chatPayload);
        const resp = await handler.fetch(req, env, ctx);
        const data = await resp.json();
        assertEq(resp.status, 200, 'Statut 200 (mode chat)');
        const aiResponse = data.choices?.[0]?.message?.content || data.analysis || 'Réponse IA non disponible';
        assert(aiResponse !== 'Réponse IA non disponible', 'Réponse chat consommable par main.js');
    }

    // ─── Résumé ───
    console.log('\n' + '='.repeat(60));
    console.log('📊 Résultats : ' + pass + ' pass, ' + fail + ' échec(s), ' + skip + ' ignoré(s)');
    console.log('='.repeat(60));

    // Restaurer fetch
    globalThis.fetch = originalFetch;

    process.exit(fail > 0 ? 1 : 0);
}

runTests().catch(function(err) {
    console.error('FATAL:', err);
    globalThis.fetch = originalFetch;
    process.exit(2);
});
