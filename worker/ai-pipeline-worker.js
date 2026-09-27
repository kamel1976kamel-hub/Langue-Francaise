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

function diagnosticErrorCategory(error) {
    if (error && Number.isInteger(error.status)) return 'http';
    if (error && (error.name === 'AbortError' || error.name === 'TimeoutError' || error.code === 'ETIMEDOUT' || error.code === 'ERR_TIMEOUT')) return 'timeout';
    if (error && ['parse', 'empty', 'output_limit'].includes(error.diagnosticCategory)) return error.diagnosticCategory;
    if (error instanceof SyntaxError) return 'parse';
    return 'exception';
}

function diagnosticId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    }
    return Math.random().toString(36).slice(2, 14).padEnd(12, '0');
}

function createDiagnostic(pipeline, values) {
    const data = values || {};
    const categories = ['http', 'timeout', 'parse', 'empty', 'output_limit', 'exception'];
    return {
        diagnosticId: diagnosticId(),
        pipeline: pipeline,
        failedStep: Number.isInteger(data.failedStep) ? data.failedStep : null,
        category: categories.includes(data.category) ? data.category : null,
        httpStatus: Number.isInteger(data.httpStatus) ? data.httpStatus : null,
        payloadChars: Number.isFinite(data.payloadChars) ? data.payloadChars : null,
        responseChars: Number.isFinite(data.responseChars) ? data.responseChars : null,
        messageCount: Number.isInteger(data.messageCount) ? data.messageCount : null,
        durationMs: Number.isFinite(data.durationMs) ? data.durationMs : null,
        hasChoices: typeof data.hasChoices === 'boolean' ? data.hasChoices : null,
        choicesCount: Number.isInteger(data.choicesCount) ? data.choicesCount : null,
        hasMessage: typeof data.hasMessage === 'boolean' ? data.hasMessage : null,
        hasContent: typeof data.hasContent === 'boolean' ? data.hasContent : null,
        contentType: ['string', 'null', 'number', 'boolean', 'object', 'undefined'].includes(data.contentType) ? data.contentType : null,
        contentChars: Number.isInteger(data.contentChars) ? data.contentChars : null,
        hasFinishReason: typeof data.hasFinishReason === 'boolean' ? data.hasFinishReason : null,
        finishReason: ['stop', 'length', 'tool_calls', 'function_call', 'content_filter', 'other'].includes(data.finishReason) ? data.finishReason : null
    };
}

async function groqRequest(env, messages, fetchImpl, a22bStep, callMetrics) {
    const startedAt = Date.now();
    const metrics = callMetrics || {};
    const payload = {
        model: MODEL,
        messages: messages,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.3
    };
    const payloadBody = JSON.stringify(payload);
    const payloadLength = payloadBody.length;
    let rawResponseLength = 'unknown';
    let status = 'none';
    metrics.payloadChars = payloadLength;
    metrics.responseChars = null;
    metrics.httpStatus = null;
    metrics.messageCount = messages.length;
    metrics.durationMs = null;
    try {
        const response = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + env.GROQ_API_KEY
            },
            body: payloadBody
        });
        status = response.status;
        metrics.httpStatus = Number.isInteger(status) ? status : null;
        const rawResponse = await response.text();
        rawResponseLength = rawResponse.length;
        metrics.responseChars = rawResponseLength;
        if (!response.ok) {
            const error = new Error('Groq HTTP ' + response.status);
            error.status = response.status;
            error.retryAfter = retryAfterSeconds(response);
            throw error;
        }
        let data;
        try {
            data = JSON.parse(rawResponse);
        } catch (error) {
            error.diagnosticCategory = 'parse';
            throw error;
        }
        const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        const choices = data && Array.isArray(data.choices) ? data.choices : null;
        const firstChoice = choices && choices.length > 0 ? choices[0] : null;
        const message = firstChoice && firstChoice.message && typeof firstChoice.message === 'object'
            ? firstChoice.message
            : null;
        const finishReason = firstChoice && firstChoice.finish_reason;
        const contentType = content === null
            ? 'null'
            : Array.isArray(content)
                ? 'object'
                : typeof content;
        const finishReasons = ['stop', 'length', 'tool_calls', 'function_call', 'content_filter'];
        Object.assign(metrics, {
            hasChoices: Array.isArray(data && data.choices),
            choicesCount: choices ? choices.length : null,
            hasMessage: Boolean(message),
            hasContent: Boolean(message && Object.prototype.hasOwnProperty.call(message, 'content')),
            contentType: ['string', 'null', 'number', 'boolean', 'object', 'undefined'].includes(contentType) ? contentType : 'undefined',
            contentChars: typeof content === 'string' ? content.length : null,
            hasFinishReason: finishReason !== undefined && finishReason !== null,
            finishReason: typeof finishReason === 'string'
                ? (finishReasons.includes(finishReason) ? finishReason : 'other')
                : null
        });
        if (!content) {
            const error = new Error('Réponse Groq vide');
            error.diagnosticCategory = 'empty';
            throw error;
        }
        if (typeof content !== 'string') {
            const error = new Error('Contenu Groq non parsable');
            error.diagnosticCategory = 'parse';
            throw error;
        }
        if (content.length > MAX_OUTPUT_LENGTH) {
            const error = new Error('Réponse Groq trop longue');
            error.diagnosticCategory = 'output_limit';
            throw error;
        }
        if (a22bStep) {
            console.log('A22B step ' + a22bStep + ' success status=' + status + ' category=none raw_response_length=' + rawResponseLength + ' payload_length=' + payloadLength + ' message_count=' + messages.length + ' duration_ms=' + (Date.now() - startedAt));
        }
        return content;
    } catch (error) {
        if (a22bStep) {
            console.warn('A22B step ' + a22bStep + ' failure category=' + diagnosticErrorCategory(error) + ' status=' + status + ' raw_response_length=' + rawResponseLength + ' payload_length=' + payloadLength + ' message_count=' + messages.length + ' duration_ms=' + (Date.now() - startedAt));
        }
        throw error;
    } finally {
        metrics.durationMs = Date.now() - startedAt;
    }
}

function localRequired(reason, diagnostic) {
    return json({
        source: 'local_requis',
        fallback: 'local',
        reason: reason,
        message: 'Service distant momentanément indisponible.',
        diagnostic: diagnostic || createDiagnostic('a22b')
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
        return json({ source: 'local_requis', error: 'JSON invalide', diagnostic: createDiagnostic('a22b', { category: 'parse' }) }, 400);
    }
    const studentAnswer = typeof body.studentAnswer === 'string' ? body.studentAnswer.trim() : '';
    if (!studentAnswer) return json({ source: 'local_requis', error: 'Message vide', diagnostic: createDiagnostic('a22b', { category: 'empty' }) }, 400);
    if (studentAnswer.length > MAX_INPUT_LENGTH) return json({ source: 'local_requis', error: 'Message trop long', diagnostic: createDiagnostic('a22b', { category: 'output_limit' }) }, 413);
    if (!env || !env.GROQ_API_KEY) return json({ source: 'local_requis', error: 'Configuration distante indisponible', diagnostic: createDiagnostic('a22b', { category: 'exception' }) }, 503);
    if (activePipelines >= MAX_CONCURRENT) return localRequired('instance_saturation', createDiagnostic('a22b', { category: 'exception' }));

    activePipelines += 1;
    const fetchImpl = options && options.fetchImpl ? options.fetchImpl : fetch;
    let failedA22B = null;
    let successfulA22B = null;
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
                const callMetrics = {};
                try {
                    intermediate = await groqRequest(env, messages, fetchImpl, index + 1, callMetrics);
                    successfulA22B = callMetrics;
                } catch (error) {
                    failedA22B = createDiagnostic('a22b', Object.assign({}, callMetrics, {
                        failedStep: index + 1,
                        category: diagnosticErrorCategory(error)
                    }));
                    throw error;
                }
            }
            return json({
                source: 'remote_a22b',
                result: intermediate,
                diagnostic: createDiagnostic('a22b', successfulA22B)
            });
        } catch (a22bError) {
            if (a22bError.status !== undefined && !isTransient(a22bError.status) && a22bError.name !== 'AbortError') {
                return json({ source: 'local_requis', error: 'Erreur distante permanente', diagnostic: failedA22B || createDiagnostic('a22b', { category: diagnosticErrorCategory(a22bError), httpStatus: a22bError.status }) }, 502);
            }
            if (a22bError.status === 429) {
                if (a22bError.retryAfter === null || a22bError.retryAfter > 10) return localRequired('rate_limited', failedA22B);
                await sleep(a22bError.retryAfter * 1000);
            }
            try {
                const compactMessages = [
                    { role: 'system', content: 'Réponds en français, de façon pédagogique et compacte.' },
                    { role: 'user', content: studentAnswer + '\nContexte: ' + (body.activityContext || '') }
                ];
                const content = await groqRequest(env, compactMessages, fetchImpl);
                return json({
                    source: 'remote_a22_fallback',
                    result: content,
                    diagnostic: createDiagnostic('a22_fallback', failedA22B)
                });
            } catch (a22Error) {
                return localRequired('remote_fallback_failed', createDiagnostic('a22_fallback', {
                    category: diagnosticErrorCategory(a22Error),
                    httpStatus: a22Error && a22Error.status
                }));
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
