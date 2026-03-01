// Import WebLLM avec gestion d'erreur
let webllm = null;
let engine = null;

async function loadWebLLM() {
  try {
    const module = await import("https://esm.run/@mlc-ai/web-llm");
    webllm = module;
    return true;
  } catch (err) {
    console.error("Erreur chargement WebLLM:", err);
    setIaUiStatus({
      text: "IA : erreur import",
      dotColorClass: "bg-rose-500",
    });
    return false;
  }
}

function setIaUiStatus({ text, dotColorClass, progress01 } = {}) {
  const statusEl = document.getElementById("ia-status");
  const dotEl = document.getElementById("ia-dot");
  const progressEl = document.getElementById("ia-progress");

  if (statusEl && typeof text === "string") statusEl.textContent = text;

  if (dotEl && typeof dotColorClass === "string") {
    dotEl.classList.remove("bg-slate-300", "bg-amber-500", "bg-emerald-500", "bg-rose-500");
    dotEl.classList.add(dotColorClass);
  }

  if (progressEl && typeof progress01 === "number" && Number.isFinite(progress01)) {
    const p = Math.max(0, Math.min(1, progress01));
    progressEl.style.width = `${Math.round(p * 100)}%`;
  }
}

export async function initWebLLM() {
  try {
    setIaUiStatus({
      text: "IA : chargement…",
      dotColorClass: "bg-amber-500",
      progress01: 0.1,
    });

    // Charger WebLLM
    const loaded = await loadWebLLM();
    if (!loaded) {
      throw new Error("Impossible de charger WebLLM");
    }

    setIaUiStatus({
      text: "IA : chargement du modèle… 0%",
      dotColorClass: "bg-amber-500",
      progress01: 0.2,
    });

    // Modèle léger supporté par la configuration par défaut de WebLLM
    const model = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
    engine = await webllm.CreateMLCEngine(model, {
      initProgressCallback: (report) => {
        const pRaw = report?.progress;
        const p = typeof pRaw === "number" ? pRaw : 0;
        const percent = Math.round(p * 100);
        setIaUiStatus({
          text: `IA : chargement du modèle… ${percent} %`,
          dotColorClass: "bg-amber-500",
          progress01: 0.2 + (p * 0.8),
        });
        console.log(report?.text || report);
      },
    });

    setIaUiStatus({
      text: "IA : prête",
      dotColorClass: "bg-emerald-500",
      progress01: 1,
    });
    console.log("IA prête !");
  } catch (err) {
    console.error("Erreur initWebLLM:", err);
    setIaUiStatus({
      text: "IA : erreur de chargement",
      dotColorClass: "bg-rose-500",
    });
  }
}

export async function demanderIA(prompt, contexte) {
  if (!engine) {
    return "L'IA n'est pas encore chargée.";
  }

  const messages = [
    {
      role: "system",
      content:
        "Tu es un tuteur expert en français. Aide l'étudiant sans faire le travail à sa place. Pose des questions, donne des indices.",
    },
    {
      role: "user",
      content: `Contexte : ${contexte}\nQuestion de l'étudiant : ${prompt}`,
    },
  ];

  const reply = await engine.chat.completions.create({ messages });
  return reply?.choices?.[0]?.message?.content || "";
}

// Expose pour les scripts non-modules et les handlers inline (onclick, etc.)
window.demanderIA = demanderIA;

// Démarrer l'initialisation
console.log("ia.js chargé, readyState:", document.readyState);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded, démarrage initWebLLM");
    initWebLLM();
  });
} else {
  console.log("DOM déjà chargé, démarrage immédiat");
  initWebLLM();
}

