/**
 * =================================================================
 * WEB WORKERS POUR LES CALCULS LOURDS
 * Pool de workers pour traitement non-bloquant
 * =================================================================
 */

'use strict';

class SpacyWorkerPool {
    constructor(workerCount = 2) {
        this.workers = [];
        this.availableWorkers = [];
        this.busyWorkers = new Set();
        this.taskQueue = [];
        this.taskResults = new Map();
        this.workerScripts = new Map();
        this.stats = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            averageTaskTime: 0,
            totalTaskTime: 0
        };
        
        this.initializeWorkers(workerCount);
    }

    /**
     * Initialise les workers
     * @private
     */
    initializeWorkers(workerCount) {
        for (let i = 0; i < workerCount; i++) {
            const worker = this.createWorker(i);
            this.workers.push(worker);
            this.availableWorkers.push(worker);
        }
        
        console.log(`👥 Pool de ${workerCount} workers initialisé`);
    }

    /**
     * Crée un worker individuel
     * @private
     */
    createWorker(index) {
        // Créer le code du worker inline
        const workerCode = `
            // Worker SPAcy pour traitement non-bloquant
            let rules = null;
            let confusions = null;

            // Fonctions utilitaires
            function getLemma(token) {
                return token.lemma || token.text.toLowerCase();
            }

            function isVowel(char) {
                return 'aeiouéèêëàâäîïôöùûüÿ'.includes(char.toLowerCase());
            }

            function escapeHtml(text) {
                // Version simplifiée pour le worker (pas de DOM)
                const div = {
                    textContent: text,
                    innerHTML: text.replace(/[&<>"']/g, m => ({
                        '&': '&amp;', '<': '&lt;', '>': '&gt;',
                        '"': '&quot;', "'": '&#039;'
                    })[m])
                };
                return div.innerHTML;
            }

            // Charger les règles
            self.onmessage = function(e) {
                const { id, type, data } = e.data;

                switch (type) {
                    case 'load-rules':
                        try {
                            rules = data.rules;
                            confusions = data.confusions || {};
                            self.postMessage({ id, type: 'rules-loaded', success: true });
                        } catch (error) {
                            self.postMessage({ id, type: 'rules-loaded', success: false, error: error.message });
                        }
                        break;

                    case 'process-text':
                        try {
                            const result = processTextWithRules(data.text, data.options);
                            self.postMessage({ id, type: 'process-result', success: true, result });
                        } catch (error) {
                            self.postMessage({ id, type: 'process-result', success: false, error: error.message });
                        }
                        break;

                    case 'check-spelling':
                        try {
                            const result = checkSpellingErrors(data.text);
                            self.postMessage({ id, type: 'spell-check-result', success: true, result });
                        } catch (error) {
                            self.postMessage({ id, type: 'spell-check-result', success: false, error: error.message });
                        }
                        break;

                    default:
                        self.postMessage({ id, type: 'error', error: 'Type de message inconnu: ' + type });
                }
            };

            function processTextWithRules(text, options = {}) {
                if (!rules) {
                    throw new Error('Règles non chargées');
                }

                const errors = [];
                const tokens = tokenizeText(text);
                const doc = createDocWithMatch(tokens, text);

                // Appliquer chaque règle
                for (const rule of rules) {
                    try {
                        if (rule.enabled === false) continue;

                        let ruleErrors;
                        if (rule.pattern && typeof doc.match === 'function') {
                            // Règle avec pattern
                            const matches = doc.match(rule.pattern);
                            ruleErrors = rule.action(doc, matches);
                        } else {
                            // Règle avec texte direct
                            ruleErrors = rule.action(doc);
                        }

                        if (Array.isArray(ruleErrors)) {
                            errors.push(...ruleErrors.map(error => ({
                                ...error,
                                ruleName: rule.name || rule.id,
                                ruleCategory: rule.category,
                                timestamp: Date.now()
                            })));
                        }
                    } catch (error) {
                        console.warn('Erreur dans la règle', rule.name, error.message);
                    }
                }

                return {
                    errors: errors.slice(0, options.maxErrors || 100),
                    totalErrors: errors.length,
                    processingTime: Date.now()
                };
            }

            function checkSpellingErrors(text) {
                if (!confusions) {
                    throw new Error('Confusions non chargées');
                }

                const errors = [];
                const words = text.toLowerCase().match(/\\b[a-zA-Zàâäéèêëïîôöùûüÿçñ]+\\b/g) || [];

                for (const word of words) {
                    if (confusions[word]) {
                        const confusion = confusions[word];
                        const regex = new RegExp('\\\\b' + word + '\\\\b', 'gi');
                        let match;
                        while ((match = regex.exec(text)) !== null) {
                            errors.push({
                                type: 'spelling',
                                word: match[0],
                                position: match.index,
                                correction: confusion.correction,
                                explanation: confusion.explanation,
                                ruleName: 'orthographe_confusion'
                            });
                        }
                    }
                }

                return errors;
            }

            function tokenizeText(text) {
                // Tokenisation simple
                return text.split(/\\s+/).map((token, index) => ({
                    text: token,
                    index,
                    lemma: getLemma({ text: token }),
                    pos: 'UNKNOWN'
                }));
            }

            // Simuler doc.match pour les patterns
            function createDocWithMatch(tokens, text) {
                const doc = { tokens, text };
                doc.match = function(pattern) {
                    // Simulation basique de matching
                    return [];
                };
                return doc;
            }
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        
        worker.id = index;
        worker.isAvailable = true;
        worker.currentTask = null;
        
        // Configurer les handlers
        worker.addEventListener('message', (event) => {
            this.handleWorkerMessage(worker, event);
        });

        worker.addEventListener('error', (error) => {
            console.error(`❌ Erreur Worker ${index}:`, error);
            this.handleWorkerError(worker, error);
        });

        return worker;
    }

    /**
     * Gère les messages des workers
     * @private
     */
    handleWorkerMessage(worker, event) {
        const { id, type, success, result, error } = event.data;
        
        if (this.taskResults.has(id)) {
            const taskData = this.taskResults.get(id);
            
            if (success) {
                const endTime = Date.now();
                const duration = endTime - taskData.startTime;
                
                // Mettre à jour les statistiques
                this.stats.completedTasks++;
                this.stats.totalTaskTime += duration;
                this.stats.averageTaskTime = this.stats.totalTaskTime / this.stats.completedTasks;
                
                // Résoudre la promesse
                taskData.resolve(result);
            } else {
                this.stats.failedTasks++;
                taskData.reject(new Error(error));
            }
            
            // Nettoyer
            this.taskResults.delete(id);
            worker.currentTask = null;
            this.busyWorkers.delete(worker);
            this.availableWorkers.push(worker);
            
            // Traiter la tâche suivante
            this.processNextTask();
        }
    }

    /**
     * Gère les erreurs des workers
     * @private
     */
    handleWorkerError(worker, error) {
        if (worker.currentTask) {
            const taskData = this.taskResults.get(worker.currentTask);
            if (taskData) {
                taskData.reject(error);
                this.taskResults.delete(worker.currentTask);
            }
        }
        
        worker.currentTask = null;
        this.busyWorkers.delete(worker);
        
        // Recréer le worker en cas d'erreur fatale
        this.recreateWorker(worker);
    }

    /**
     * Recrée un worker défaillant
     * @private
     */
    recreateWorker(oldWorker) {
        const index = oldWorker.id;
        console.log(`🔄 Recréation du Worker ${index}`);
        
        // Supprimer l'ancien worker
        const workerIndex = this.workers.indexOf(oldWorker);
        if (workerIndex > -1) {
            this.workers.splice(workerIndex, 1);
        }
        
        const availableIndex = this.availableWorkers.indexOf(oldWorker);
        if (availableIndex > -1) {
            this.availableWorkers.splice(availableIndex, 1);
        }
        
        oldWorker.terminate();
        
        // Créer le nouveau worker
        const newWorker = this.createWorker(index);
        this.workers.push(newWorker);
        this.availableWorkers.push(newWorker);
    }

    /**
     * Traite le texte avec les règles SPAcy
     * @param {string} text - Texte à analyser
     * @param {Array} rules - Règles à appliquer
     * @param {Object} options - Options de traitement
     * @returns {Promise} Résultat de l'analyse
     */
    async processText(text, rules, options = {}) {
        return new Promise((resolve, reject) => {
            const taskId = Date.now().toString();
            
            const task = {
                id: taskId,
                text,
                rules,
                options,
                resolve,
                reject,
                startTime: Date.now()
            };

            this.taskQueue.push(task);
            this.stats.totalTasks++;
            this.processNextTask();
        });
    }

    /**
     * Traite la prochaine tâche dans la file
     * @private
     */
    async processNextTask() {
        if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
            return;
        }

        const worker = this.availableWorkers.pop();
        const task = this.taskQueue.shift();
        
        this.busyWorkers.add(worker);
        worker.currentTask = task.id;
        this.taskResults.set(task.id, task);

        // Envoyer la tâche au worker
        worker.postMessage({
            id: task.id,
            type: 'process-text',
            data: {
                text: task.text,
                options: task.options
            }
        });

        // Envoyer les règles si nécessaire
        if (task.rules) {
            worker.postMessage({
                id: task.id,
                type: 'load-rules',
                data: {
                    rules: task.rules,
                    confusions: window.orthoConfusions || {}
                }
            });
        }
    }

    /**
     * Vérifie l'orthographe du texte
     * @param {string} text - Texte à vérifier
     * @returns {Promise} Erreurs d'orthographe trouvées
     */
    async checkSpelling(text) {
        return new Promise((resolve, reject) => {
            const taskId = 'spell_' + Date.now().toString();
            
            const task = {
                id: taskId,
                resolve,
                reject,
                startTime: Date.now()
            };

            this.taskQueue.push(task);
            this.stats.totalTasks++;
            this.processNextTask();
        });
    }

    /**
     * Charge les règles dans tous les workers
     * @param {Array} rules - Règles à charger
     * @param {Object} confusions - Confusions orthographiques
     * @returns {Promise} Promesse de chargement
     */
    async loadRulesInAllWorkers(rules, confusions = {}) {
        const promises = this.workers.map(worker => {
            return new Promise((resolve) => {
                const taskId = 'load_' + Date.now().toString() + '_' + worker.id;
                
                const handleMessage = (event) => {
                    if (event.data.id === taskId && event.data.type === 'rules-loaded') {
                        worker.removeEventListener('message', handleMessage);
                        resolve(event.data.success);
                    }
                };
                
                worker.addEventListener('message', handleMessage);
                
                worker.postMessage({
                    id: taskId,
                    type: 'load-rules',
                    data: { rules, confusions }
                });
            });
        });

        return Promise.all(promises);
    }

    /**
     * Récupère les statistiques du pool
     * @returns {Object} Statistiques
     */
    getStats() {
        return {
            ...this.stats,
            totalWorkers: this.workers.length,
            availableWorkers: this.availableWorkers.length,
            busyWorkers: this.busyWorkers.size,
            queuedTasks: this.taskQueue.length,
            utilizationRate: this.workers.length > 0 ? 
                ((this.busyWorkers.size / this.workers.length) * 100).toFixed(2) + '%' : '0%'
        };
    }

    /**
     * Vide la file d'attente des tâches
     */
    clearQueue() {
        // Rejeter toutes les tâches en attente
        for (const task of this.taskQueue) {
            task.reject(new Error('Tâche annulée - file vidée'));
        }
        
        this.taskQueue = [];
        console.log('🗑️ File d\'attente des tâches vidée');
    }

    /**
     * Termine tous les workers
     */
    terminate() {
        this.clearQueue();
        
        for (const worker of this.workers) {
            worker.terminate();
        }
        
        this.workers = [];
        this.availableWorkers = [];
        this.busyWorkers.clear();
        
        console.log('👋 Pool de workers terminé');
    }

    /**
     * Redémarre le pool avec un nouveau nombre de workers
     * @param {number} newCount - Nouveau nombre de workers
     */
    restart(newCount) {
        this.terminate();
        this.initializeWorkers(newCount);
    }
}

// Export global
window.SpacyWorkerPool = SpacyWorkerPool;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpacyWorkerPool;
}
