'use strict';

const MAX_CONCURRENT = 10;
const MAX_INPUT_LENGTH = 12000;
const MAX_OUTPUT_TOKENS = 500;
const MAX_OUTPUT_LENGTH = 4000;
const MAX_INTERMEDIATE_LENGTH = 6000;
const MODEL = 'openai/gpt-oss-20b';
let activePipelines = 0;

function json(data, status, headers) {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: Object.assign({
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }, headers || {})
    });
}

function isTransient(status) {
    return status === 429 || status >= 500;
}

function retryAfterSeconds(response) {
    const value = response.headers.get('Retry-After');
    if (!value) return null;
    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function errorCategory(error) {
    if (error && ['parse', 'empty', 'output_limit'].includes(error.category)) return error.category;
    if (error && Number.isInteger(error.status)) return 'http';
    if (error && (error.name === 'AbortError' || error.name === 'TimeoutError' || error.code === 'ETIMEDOUT')) return 'timeout';
    if (error instanceof SyntaxError) return 'parse';
    return 'exception';
}

async function groqRequest(env, messages, fetchImpl) {
    const response = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + env.GROQ_API_KEY
        },
        body: JSON.stringify({
            model: MODEL,
            messages: messages,
            max_tokens: MAX_OUTPUT_TOKENS,
            temperature: 0.3
        })
    });
    if (!response.ok) {
        const error = new Error('Groq HTTP ' + response.status);
        error.status = response.status;
        error.retryAfter = retryAfterSeconds(response);
        throw error;
    }
    let data;
    try {
        data = await response.json();
    } catch (error) {
        error.category = 'parse';
        throw error;
    }
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) {
        const error = new Error('Réponse Groq vide');
        error.category = 'empty';
        throw error;
    }
    if (content.length > MAX_OUTPUT_LENGTH) {
        const error = new Error('Réponse Groq trop longue');
        error.category = 'output_limit';
        throw error;
    }
    return content;
}

function localRequired(reason) {
    return json({
        source: 'local_requis',
        fallback: 'local',
        reason: reason,
        message: 'Service distant momentanément indisponible.'
    }, 503);
}

async function handleRequest(request, env, options) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }
    if (request.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return json({ source: 'local_requis', error: 'JSON invalide' }, 400);
    }
    const studentAnswer = typeof body.studentAnswer === 'string' ? body.studentAnswer.trim() : '';
    if (!studentAnswer) return json({ source: 'local_requis', error: 'Message vide' }, 400);
    if (studentAnswer.length > MAX_INPUT_LENGTH) return json({ source: 'local_requis', error: 'Message trop long' }, 413);
    if (!env || !env.GROQ_API_KEY) return json({ source: 'local_requis', error: 'Configuration distante indisponible' }, 503);
    if (activePipelines >= MAX_CONCURRENT) return localRequired('instance_saturation');

    activePipelines += 1;
    const fetchImpl = options && options.fetchImpl ? options.fetchImpl : fetch;
    try {
        try {
            const stages = [
                'Analyse les erreurs et les points forts de la réponse.',
                'Transforme cette analyse en explication pédagogique claire.',
                'Rédige la réponse finale, concise et encourageante.'
            ];
            let intermediate = body.userPrompt || studentAnswer;
            for (let index = 0; index < stages.length; index += 1) {
                const stage = stages[index];
                const messages = [
                    { role: 'system', content: body.systemPrompt || 'Tu es un tuteur de français concis et pédagogique.' },
                    { role: 'user', content: stage + '\n\nDonnées:\n' + intermediate.slice(0, MAX_INTERMEDIATE_LENGTH) }
                ];
                try {
                    intermediate = await groqRequest(env, messages, fetchImpl);
                    const responseLength = typeof intermediate === 'string' ? intermediate.length : 'unknown';
                    console.log('A22B step ' + (index + 1) + ' success response_length=' + responseLength);
                } catch (error) {
                    const status = error && Number.isInteger(error.status) ? error.status : 'none';
                    console.warn('A22B step ' + (index + 1) + ' failure category=' + errorCategory(error) + ' status=' + status);
                    throw error;
                }
            }
            return json({ source: 'remote_a22b', result: intermediate });
        } catch (a22bError) {
            if (a22bError.status !== undefined && !isTransient(a22bError.status) && a22bError.name !== 'AbortError') {
                return json({ source: 'local_requis', error: 'Erreur distante permanente' }, 502);
            }
            if (a22bError.status === 429) {
                if (a22bError.retryAfter === null || a22bError.retryAfter > 10) return localRequired('rate_limited');
                await sleep(a22bError.retryAfter * 1000);
            }
            try {
                const compactMessages = [
                    { role: 'system', content: 'Réponds en français, de façon pédagogique et compacte.' },
                    { role: 'user', content: studentAnswer + '\nContexte: ' + (body.activityContext || '') }
                ];
                const content = await groqRequest(env, compactMessages, fetchImpl);
                const responseLength = typeof content === 'string' ? content.length : 'unknown';
                console.log('A22 fallback success response_length=' + responseLength);
                return json({ source: 'remote_a22_fallback', result: content });
            } catch (a22Error) {
                const status = a22Error && Number.isInteger(a22Error.status) ? a22Error.status : 'none';
                console.warn('A22 fallback failure category=' + errorCategory(a22Error) + ' status=' + status);
                return localRequired('remote_fallback_failed');
            }
        }
    } finally {
        activePipelines -= 1;
    }
}

async function fetchHandler(request, env) {
    return handleRequest(request, env || {}, {});
}

if (typeof module !== 'undefined') {
    module.exports = {
        handleRequest: handleRequest,
        getActivePipelines: function() { return activePipelines; },
        MAX_CONCURRENT: MAX_CONCURRENT
    };
}

if (typeof addEventListener === 'function') {
    addEventListener('fetch', event => {
        const bindingEnv = typeof GROQ_API_KEY !== 'undefined' ? { GROQ_API_KEY: GROQ_API_KEY } : {};
        event.respondWith(fetchHandler(event.request, bindingEnv));
    });
}
