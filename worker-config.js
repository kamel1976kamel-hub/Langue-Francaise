'use strict';

// Configure uniquement après déploiement effectif du Worker.
// Laisser vide désactive les appels distants et conserve le fallback local.
window.AI_WORKER_CONFIG = window.AI_WORKER_CONFIG || {
    workerUrl: ''
};
