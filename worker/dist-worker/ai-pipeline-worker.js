var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ai-pipeline-worker.js
var ALLOWED_ORIGIN = "https://kamel1976kamel-hub.github.io";
var GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
var GROQ_MODEL = "openai/gpt-oss-20b";
var MAX_STUDENT_CHARS = 2e3;
var MAX_CONTEXT_CHARS = 4e3;
var MAX_REGLES = 8;
var MAX_REGLE_CHARS = 200;
var GROQ_TIMEOUT_MS = 15e3;
var MAX_TOKENS_MIN = 100;
var MAX_TOKENS_MAX = 1e3;
var TEMPERATURE_DEFAULT = 0.5;
var MAX_CONCURRENT_REQUESTS = 10;
var concurrentRequests = 0;
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};
function reponseJSON(corps, statut) {
  const entetes = Object.assign({ "Content-Type": "application/json" }, CORS_HEADERS);
  return new Response(JSON.stringify(corps), { status: statut, headers: entetes });
}
__name(reponseJSON, "reponseJSON");
function promptSystemeAnalyse() {
  return `Tu es un \xE9valuateur logique rigoureux pour un \xE9l\xE8ve de fran\xE7ais. R\xE9ponds UNIQUEMENT avec un JSON compact valide, sans aucun texte hors JSON, en moins de 220 tokens. Format exact : {"diagnostic":"...","erreurs":[{"extrait":"...","type":"grammaticale|lexicale|syntaxique|formulation","correction":"..."}],"priorite":"..."} . Maximum 3 erreurs. Ne d\xE9veloppe pas, n'explique pas.`;
}
__name(promptSystemeAnalyse, "promptSystemeAnalyse");
function promptSystemeTuteur() {
  return `Tu es un tuteur p\xE9dagogue empathique pour un \xE9l\xE8ve de fran\xE7ais. Explique l'erreur SANS donner directement la r\xE9ponse compl\xE8te : utilise des questions guid\xE9es si utile. R\xE9ponds UNIQUEMENT avec un JSON compact valide, en moins de 280 tokens. Format exact : {"explication":"...","conseil":"...","exemple":"..."}.`;
}
__name(promptSystemeTuteur, "promptSystemeTuteur");
function promptSystemeCours() {
  return `Tu rattaches l'erreur au point de cours correspondant. N'invente JAMAIS une r\xE8gle : si les r\xE8gles locales fournies couvrent le cas, appuie-toi dessus ; sinon reste g\xE9n\xE9rique et mets "verifie": false. R\xE9ponds UNIQUEMENT avec un JSON compact valide, en moins de 200 tokens. Format exact : {"point_cours":"...","regle":"...","exemple":"...","verifie":true}.`;
}
__name(promptSystemeCours, "promptSystemeCours");
function extraireJSON(texte) {
  try {
    return JSON.parse(texte);
  } catch (e) {
    const debut = texte.indexOf("{");
    const fin = texte.lastIndexOf("}");
    if (debut !== -1 && fin > debut) {
      try {
        return JSON.parse(texte.slice(debut, fin + 1));
      } catch (e2) {
      }
    }
    return { brut: String(texte).slice(0, 200) };
  }
}
__name(extraireJSON, "extraireJSON");
async function appelerGroq(cle, messages, maxTokens, temperature) {
  let resp;
  try {
    resp = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cle },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      }),
      signal: AbortSignal.timeout(GROQ_TIMEOUT_MS)
    });
  } catch (e) {
    e.transitoire = true;
    throw e;
  }
  if (resp.status === 429) {
    const retryAfter = resp.headers.get("retry-after");
    const err = new Error("Groq: quota atteint");
    err.statut = 429;
    err.retryAfter = retryAfter ? Number(retryAfter) : null;
    throw err;
  }
  if (resp.status === 401 || resp.status === 403) {
    const err = new Error("Groq: authentification refus\xE9e (cl\xE9 \xE0 v\xE9rifier/r\xE9voquer)");
    err.statut = 401;
    throw err;
  }
  if (!resp.ok) {
    const err = new Error("Groq: erreur " + resp.status);
    err.statut = resp.status;
    throw err;
  }
  const data = await resp.json();
  const choix = data.choices && data.choices[0];
  const finishReason = choix ? choix.finish_reason : null;
  if (finishReason === "length") {
    const err = new Error("Groq: sortie tronqu\xE9e (finish_reason=length)");
    err.transitoire = true;
    throw err;
  }
  const contenu = choix && choix.message ? choix.message.content : "";
  return { contenu, usage: data.usage || null, finish_reason: finishReason };
}
__name(appelerGroq, "appelerGroq");
function estTransitoire(err) {
  return !!(err && (err.statut === 429 || err.statut >= 500 || err.transitoire === true));
}
__name(estTransitoire, "estTransitoire");
function promptSystemeA22() {
  return 'Tu cumules quatre r\xF4les p\xE9dagogiques en une r\xE9ponse unique et compacte : 1) \xE9valuateur logique (erreurs de raisonnement et de grammaire), 2) tuteur p\xE9dagogue (explication bienveillante SANS donner la r\xE9ponse directement), 3) documentaliste (r\xE9f\xE9rence courte au point de cours), 4) contr\xF4leur qualit\xE9 (aucune hallucination, aucune r\xE8gle invent\xE9e). R\xE9ponds en fran\xE7ais, en moins de 500 tokens, au format JSON : {"analyse":"...","pedagogie":"...","reference":"..."}.';
}
__name(promptSystemeA22, "promptSystemeA22");
async function appelerA22(cle, reponseEleve, contexte, reglesLocales, systemPrompt) {
  return await appelerGroq(cle, [
    { role: "system", content: promptSystemeA22() },
    {
      role: "user",
      content: "R\xE9ponse de l'\xE9l\xE8ve : " + reponseEleve + (systemPrompt ? "\nInstructions : " + systemPrompt : "") + (contexte ? "\nContexte : " + contexte : "") + (reglesLocales.length ? "\nR\xE8gles locales d\xE9clench\xE9es : " + reglesLocales.join(" ; ") : "")
    }
  ], 500, 0.5);
}
__name(appelerA22, "appelerA22");
function synthetiserReponsePedagogique(etapes) {
  var parts = [];
  if (etapes.analyse) {
    if (etapes.analyse.diagnostic) parts.push(etapes.analyse.diagnostic);
    if (etapes.analyse.erreurs && etapes.analyse.erreurs.length) {
      var erreurs = etapes.analyse.erreurs.map(function(e) {
        return (e.extrait || "") + " \u2192 " + (e.correction || "\xE0 revoir");
      });
      parts.push("Erreurs d\xE9tect\xE9es : " + erreurs.join(" ; "));
    }
  }
  if (etapes.tuteur) {
    if (etapes.tuteur.explication) parts.push(etapes.tuteur.explication);
    if (etapes.tuteur.conseil) parts.push("Conseil : " + etapes.tuteur.conseil);
  }
  if (etapes.cours) {
    if (etapes.cours.point_cours) parts.push("Point de cours : " + etapes.cours.point_cours);
    if (etapes.cours.regle) parts.push("R\xE8gle : " + etapes.cours.regle);
  }
  if (etapes.a22) {
    if (etapes.a22.analyse) parts.push(etapes.a22.analyse);
    if (etapes.a22.pedagogie) parts.push(etapes.a22.pedagogie);
    if (etapes.a22.reference) parts.push("R\xE9f\xE9rence : " + etapes.a22.reference);
  }
  return parts.length > 0 ? parts.join("\n\n") : "Analyse effectu\xE9e.";
}
__name(synthetiserReponsePedagogique, "synthetiserReponsePedagogique");
var ai_pipeline_worker_default = {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "POST") {
      return reponseJSON({ erreur: "M\xE9thode non autoris\xE9e (POST uniquement)" }, 405);
    }
    const cle = env && env.GROQ_API_KEY;
    if (!cle) {
      return reponseJSON({ erreur: "Service IA non configur\xE9" }, 503);
    }
    let corps = null;
    try {
      corps = await request.json();
    } catch (e) {
      return reponseJSON({ erreur: "JSON invalide" }, 400);
    }
    if (!corps || typeof corps !== "object") {
      return reponseJSON({ erreur: "Corps de requ\xEAte invalide" }, 400);
    }
    if (corps.action !== void 0 && corps.action !== "analyze") {
      return reponseJSON({ erreur: "Action non support\xE9e" }, 400);
    }
    const userPrompt = typeof corps.userPrompt === "string" ? corps.userPrompt.trim() : "";
    if (!userPrompt) {
      return reponseJSON({ erreur: 'Champ "userPrompt" (cha\xEEne non vide) requis' }, 400);
    }
    if (userPrompt.length > MAX_STUDENT_CHARS) {
      return reponseJSON({ erreur: "userPrompt trop long (maximum " + MAX_STUDENT_CHARS + " caract\xE8res)" }, 413);
    }
    const systemPrompt = typeof corps.systemPrompt === "string" ? corps.systemPrompt.slice(0, MAX_CONTEXT_CHARS) : "";
    const contexte = typeof corps.context === "string" ? corps.context.slice(0, MAX_CONTEXT_CHARS) : "";
    if (corps.maxTokens !== void 0) {
      const mt = Number(corps.maxTokens);
      if (!Number.isFinite(mt) || mt < MAX_TOKENS_MIN || mt > MAX_TOKENS_MAX) {
        return reponseJSON({ erreur: "maxTokens hors limites (" + MAX_TOKENS_MIN + "\u2013" + MAX_TOKENS_MAX + ")" }, 400);
      }
    }
    let temperatureClient = TEMPERATURE_DEFAULT;
    if (corps.temperature !== void 0) {
      const t = Number(corps.temperature);
      if (!Number.isFinite(t) || t < 0 || t > 1) {
        return reponseJSON({ erreur: "temperature hors limites (0\u20131)" }, 400);
      }
      temperatureClient = t;
    }
    const reglesLocales = Array.isArray(corps.reglesLocales) ? corps.reglesLocales.filter(function(x) {
      return typeof x === "string";
    }).slice(0, MAX_REGLES).map(function(x) {
      return x.slice(0, MAX_REGLE_CHARS);
    }) : [];
    if (concurrentRequests >= MAX_CONCURRENT_REQUESTS) {
      return reponseJSON({
        erreur: "Service IA temporairement satur\xE9 (trop de requ\xEAtes simultan\xE9es)",
        source: "local_requis",
        retryAfter: 5
      }, 429);
    }
    concurrentRequests++;
    const debut = Date.now();
    const usages = [];
    try {
      const r1 = await appelerGroq(cle, [
        { role: "system", content: promptSystemeAnalyse() },
        {
          role: "user",
          content: "R\xE9ponse de l'\xE9l\xE8ve : " + userPrompt + (systemPrompt ? "\nInstructions : " + systemPrompt : "") + (contexte ? "\nContexte de l'activit\xE9 : " + contexte : "") + (reglesLocales.length ? "\nIndications des r\xE8gles locales d\xE9clench\xE9es : " + reglesLocales.join(" ; ") : "")
        }
      ], 220, 0.1);
      usages.push(r1.usage);
      const etape1 = extraireJSON(r1.contenu);
      const r2 = await appelerGroq(cle, [
        { role: "system", content: promptSystemeTuteur() },
        {
          role: "user",
          content: "R\xE9ponse originale de l'\xE9l\xE8ve : " + userPrompt + "\nAnalyse (JSON \xE9tape 1) : " + JSON.stringify(etape1)
        }
      ], 280, 0.7);
      usages.push(r2.usage);
      const etape2 = extraireJSON(r2.contenu);
      const r3 = await appelerGroq(cle, [
        { role: "system", content: promptSystemeCours() },
        {
          role: "user",
          content: "Analyse (JSON \xE9tape 1) : " + JSON.stringify(etape1) + "\nExplication (JSON \xE9tape 2) : " + JSON.stringify(etape2) + (reglesLocales.length ? "\nR\xE8gles locales d\xE9clench\xE9es : " + reglesLocales.join(" ; ") : "")
        }
      ], 200, 0.3);
      usages.push(r3.usage);
      const etape3 = extraireJSON(r3.contenu);
      const usageTotal = usages.reduce(function(acc, u) {
        if (!u) return acc;
        acc.prompt_tokens += u.prompt_tokens || 0;
        acc.completion_tokens += u.completion_tokens || 0;
        acc.total_tokens += u.total_tokens || 0;
        return acc;
      }, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
      concurrentRequests--;
      const etapesA22B = { analyse: etape1, tuteur: etape2, cours: etape3 };
      const contenuSynthetise = synthetiserReponsePedagogique(etapesA22B);
      return reponseJSON({
        source: "remote_a22b",
        modele: GROQ_MODEL,
        etapes: etapesA22B,
        usage: usageTotal,
        traitementMs: Date.now() - debut,
        choices: [{ message: { content: contenuSynthetise } }],
        analysis: contenuSynthetise
      }, 200);
    } catch (errA22B) {
      concurrentRequests--;
      if (estTransitoire(errA22B)) {
        const retryAfter = errA22B.retryAfter || 5;
        if (retryAfter <= 10) {
          await new Promise(function(resolve) {
            setTimeout(resolve, retryAfter * 1e3);
          });
          try {
            const rA = await appelerA22(cle, userPrompt, contexte, reglesLocales, systemPrompt);
            const a22 = extraireJSON(rA.contenu);
            const etapesA22 = { a22 };
            const contenuA22 = synthetiserReponsePedagogique(etapesA22);
            return reponseJSON({
              source: "remote_a22_fallback",
              modele: GROQ_MODEL,
              etapes: etapesA22,
              usage: rA.usage || null,
              traitementMs: Date.now() - debut,
              bascule: "a22b_vers_a22:" + (errA22B.statut || "transitoire"),
              choices: [{ message: { content: contenuA22 } }],
              analysis: contenuA22
            }, 200);
          } catch (errA22) {
            if (errA22 && errA22.statut === 429) {
              return reponseJSON({ erreur: "Service IA satur\xE9, r\xE9essayez plus tard", retryAfter: errA22.retryAfter || errA22B.retryAfter || null, source: "local_requis" }, 429);
            }
            return reponseJSON({ erreur: "Service IA indisponible", source: "local_requis" }, 502);
          }
        } else {
          return reponseJSON({
            erreur: "Service IA temporairement satur\xE9",
            retryAfter,
            source: "local_requis"
          }, 200);
        }
      }
      return reponseJSON({ erreur: "Service IA indisponible", source: "local_requis" }, 502);
    }
  }
};
export {
  ai_pipeline_worker_default as default
};
//# sourceMappingURL=ai-pipeline-worker.js.map
