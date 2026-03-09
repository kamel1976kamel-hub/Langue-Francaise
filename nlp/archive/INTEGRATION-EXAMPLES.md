# 🔧 GUIDE D'INTÉGRATION - SYSTÈME NLP

## 📋 INTÉGRATION RAPIDE

### **1. Ajout des Scripts (Méthode Recommandée)**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Votre Application</title>
</head>
<body>
    <!-- Votre contenu existant -->
    
    <!-- Scripts NLP (ajouter à la fin du body) -->
    <script src="nlp/spacy-rules-style-simple.js"></script>
    <script src="nlp/spacy-rules-vocabulaire-simple.js"></script>
    <script src="nlp/spacy-rules-conjugaison-simple.js"></script>
    <script src="nlp/spacy-rules-orthographe-simple.js"></script>
    <script src="nlp/rules-validator.js"></script>
    <script src="nlp/groq-ai-analyzer.js"></script>
    <script src="nlp/advanced-text-corrector.js"></script>
    <script src="nlp/spacy-analyzer.js"></script>
    
    <!-- Votre script d'application -->
    <script src="app.js"></script>
</body>
</html>
```

---

## 🚀 EXEMPLES D'INTÉGRATION

### **1. Application Web Simple**

```javascript
// app.js
class TextCorrector {
    constructor() {
        this.isReady = false;
        this.initialize();
    }
    
    async initialize() {
        // Attendre que les scripts NLP soient chargés
        if (typeof window.analyzeTextLocal === 'undefined') {
            console.log('⏳ Attente du système NLP...');
            await this.waitForNLP();
        }
        this.isReady = true;
        console.log('✅ Système NLP prêt');
    }
    
    waitForNLP() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (typeof window.analyzeTextLocal !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
    
    async corrigerTexte(texte) {
        if (!this.isReady) {
            await this.initialize();
        }
        
        try {
            const resultat = await window.analyzeTextLocal(texte);
            
            return {
                texteOriginal: texte,
                texteCorrige: this.appliquerCorrections(texte, resultat.errors),
                corrections: resultat.errors,
                confiance: resultat.confiance,
                suggestions: resultat.suggestions
            };
        } catch (error) {
            console.error('Erreur de correction:', error);
            return {
                texteOriginal: texte,
                texteCorrige: texte,
                corrections: [],
                erreur: error.message
            };
        }
    }
    
    appliquerCorrections(texte, corrections) {
        let texteCorrige = texte;
        
        // Appliquer les corrections dans l'ordre inverse pour éviter les décalages
        corrections.sort((a, b) => b.offset - a.offset);
        
        corrections.forEach(correction => {
            if (correction.text && correction.correction) {
                texteCorrige = texteCorrige.replace(correction.text, correction.correction);
            }
        });
        
        return texteCorrige;
    }
}

// Utilisation
const correcteur = new TextCorrector();

// Exemple avec textarea
document.getElementById('corriger-btn').addEventListener('click', async () => {
    const texteOriginal = document.getElementById('texte-input').value;
    const resultat = await correcteur.corrigerTexte(texteOriginal);
    
    document.getElementById('texte-corrige').value = resultat.texteCorrige;
    document.getElementById('corrections-liste').innerHTML = afficherCorrections(resultat.corrections);
});
```

### **2. Interface HTML Complète**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Correcteur Textuel</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        textarea { width: 100%; height: 150px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin: 10px 0; }
        .btn { background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #059669; }
        .correction { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 5px 0; border-radius: 0 5px 5px 0; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-item { text-align: center; padding: 15px; background: #f8fafc; border-radius: 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #10b981; }
        .stat-label { color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Correcteur Textuel Intelligent</h1>
        
        <div>
            <h3>Texte à corriger</h3>
            <textarea id="texte-input" placeholder="Entrez votre texte ici...">L'enfant mange beaucoup et c'est quoi ce livre ? Les enfant joue dans le jardin. Il vas à l'école.</textarea>
            
            <div>
                <button id="corriger-btn" class="btn">🔍 Corriger le texte</button>
                <button id="effacer-btn" class="btn" style="background: #6b7280;">🗑️ Effacer</button>
            </div>
        </div>
        
        <div id="stats-container" style="display: none;">
            <div class="stats">
                <div class="stat-item">
                    <div id="corrections-count" class="stat-value">0</div>
                    <div class="stat-label">CORRECTIONS</div>
                </div>
                <div class="stat-item">
                    <div id="confiance-score" class="stat-value">0%</div>
                    <div class="stat-label">CONFIANCE</div>
                </div>
                <div class="stat-item">
                    <div id="suggestions-count" class="stat-value">0</div>
                    <div class="stat-label">SUGGESTIONS</div>
                </div>
            </div>
        </div>
        
        <div>
            <h3>Texte corrigé</h3>
            <textarea id="texte-corrige" readonly placeholder="Le texte corrigé apparaîtra ici..."></textarea>
        </div>
        
        <div>
            <h3>Corrections détectées</h3>
            <div id="corrections-liste">
                <p style="color: #6b7280;">Les corrections apparaîtront ici...</p>
            </div>
        </div>
    </div>

    <!-- Scripts NLP -->
    <script src="nlp/spacy-rules-style-simple.js"></script>
    <script src="nlp/spacy-rules-vocabulaire-simple.js"></script>
    <script src="nlp/spacy-rules-conjugaison-simple.js"></script>
    <script src="nlp/spacy-rules-orthographe-simple.js"></script>
    <script src="nlp/rules-validator.js"></script>
    <script src="nlp/groq-ai-analyzer.js"></script>
    <script src="nlp/advanced-text-corrector.js"></script>
    <script src="nlp/spacy-analyzer.js"></script>

    <script>
        class TextCorrector {
            constructor() {
                this.isReady = false;
                this.initialize();
            }
            
            async initialize() {
                if (typeof window.analyzeTextLocal === 'undefined') {
                    console.log('⏳ Attente du système NLP...');
                    await this.waitForNLP();
                }
                this.isReady = true;
                console.log('✅ Système NLP prêt');
            }
            
            waitForNLP() {
                return new Promise((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (typeof window.analyzeTextLocal !== 'undefined') {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                });
            }
            
            async corrigerTexte(texte) {
                if (!this.isReady) {
                    await this.initialize();
                }
                
                try {
                    const resultat = await window.analyzeTextLocal(texte);
                    return {
                        texteOriginal: texte,
                        texteCorrige: this.appliquerCorrections(texte, resultat.errors),
                        corrections: resultat.errors,
                        confiance: resultat.confidence,
                        suggestions: resultat.suggestions
                    };
                } catch (error) {
                    console.error('Erreur de correction:', error);
                    return {
                        texteOriginal: texte,
                        texteCorrige: texte,
                        corrections: [],
                        erreur: error.message
                    };
                }
            }
            
            appliquerCorrections(texte, corrections) {
                let texteCorrige = texte;
                corrections.sort((a, b) => b.offset - a.offset);
                
                corrections.forEach(correction => {
                    if (correction.text && correction.correction) {
                        texteCorrige = texteCorrige.replace(correction.text, correction.correction);
                    }
                });
                
                return texteCorrige;
            }
        }

        // Initialisation
        const correcteur = new TextCorrector();

        // Gestion des événements
        document.getElementById('corriger-btn').addEventListener('click', async () => {
            const texteOriginal = document.getElementById('texte-input').value;
            
            if (!texteOriginal.trim()) {
                alert('Veuillez entrer un texte à corriger');
                return;
            }
            
            // Indicateur de chargement
            document.getElementById('corriger-btn').textContent = '⏳ Analyse en cours...';
            document.getElementById('corriger-btn').disabled = true;
            
            try {
                const resultat = await correcteur.corrigerTexte(texteOriginal);
                
                // Afficher les résultats
                document.getElementById('texte-corrige').value = resultat.texteCorrige;
                document.getElementById('corrections-count').textContent = resultat.corrections.length;
                document.getElementById('confiance-score').textContent = resultat.confiance + '%';
                document.getElementById('suggestions-count').textContent = resultat.suggestions ? resultat.suggestions.length : 0;
                
                // Afficher les corrections
                const correctionsHTML = resultat.corrections.map((correction, index) => `
                    <div class="correction">
                        <strong>[${correction.rule || 'Règle ' + (index + 1)}]</strong><br>
                        "${correction.text}" → "${correction.correction}"<br>
                        <small>${correction.explanation || 'Aucune explication'}</small>
                    </div>
                `).join('');
                
                document.getElementById('corrections-liste').innerHTML = correctionsHTML || '<p style="color: #10b981;">✅ Aucune correction détectée</p>';
                document.getElementById('stats-container').style.display = 'block';
                
            } catch (error) {
                document.getElementById('corrections-liste').innerHTML = `<div style="color: #ef4444;">❌ Erreur: ${error.message}</div>`;
            } finally {
                document.getElementById('corriger-btn').textContent = '🔍 Corriger le texte';
                document.getElementById('corriger-btn').disabled = false;
            }
        });

        document.getElementById('effacer-btn').addEventListener('click', () => {
            document.getElementById('texte-input').value = '';
            document.getElementById('texte-corrige').value = '';
            document.getElementById('corrections-liste').innerHTML = '<p style="color: #6b7280;">Les corrections apparaîtront ici...</p>';
            document.getElementById('stats-container').style.display = 'none';
        });
    </script>
</body>
</html>
```

### **3. Intégration React/Vue/Angular**

```javascript
// Hook React personnalisé
import { useState, useEffect } from 'react';

export function useTextCorrector() {
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const initializeNLP = async () => {
            if (typeof window !== 'undefined' && window.analyzeTextLocal) {
                setIsReady(true);
                return;
            }

            // Attendre le chargement des scripts
            const checkInterval = setInterval(() => {
                if (typeof window !== 'undefined' && window.analyzeTextLocal) {
                    clearInterval(checkInterval);
                    setIsReady(true);
                }
            }, 100);

            return () => clearInterval(checkInterval);
        };

        initializeNLP();
    }, []);

    const correctText = async (text) => {
        if (!isReady) {
            throw new Error('Système NLP non prêt');
        }

        setIsLoading(true);
        try {
            const result = await window.analyzeTextLocal(text);
            return {
                originalText: text,
                correctedText: applyCorrections(text, result.errors),
                corrections: result.errors,
                confidence: result.confidence,
                suggestions: result.suggestions
            };
        } finally {
            setIsLoading(false);
        }
    };

    return { correctText, isReady, isLoading };
}

// Composant React
function TextCorrectorComponent() {
    const { correctText, isReady, isLoading } = useTextCorrector();
    const [text, setText] = useState('');
    const [result, setResult] = useState(null);

    const handleCorrect = async () => {
        if (!isReady) return;
        
        try {
            const correctionResult = await correctText(text);
            setResult(correctionResult);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    if (!isReady) {
        return <div>⏳ Chargement du système NLP...</div>;
    }

    return (
        <div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} />
            <button onClick={handleCorrect} disabled={isLoading}>
                {isLoading ? '⏳ Analyse...' : '🔍 Corriger'}
            </button>
            {result && (
                <div>
                    <h3>Corrections ({result.corrections.length})</h3>
                    <textarea value={result.correctedText} readOnly />
                    <div>
                        {result.corrections.map((corr, i) => (
                            <div key={i}>
                                <strong>{corr.text}</strong> → <strong>{corr.correction}</strong>
                                <br />
                                <small>{corr.explanation}</small>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
```

### **4. Service Node.js (avec JSDOM)**

```javascript
// textCorrectorService.js
const { JSDOM } = require('jsdom');

class TextCorrectorService {
    constructor() {
        this.dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <head><script src="file://./nlp/spacy-rules-style-simple.js"></script></head>
                <body><script src="file://./nlp/spacy-analyzer.js"></script></body>
            </html>
        `, { runScripts: "dangerously" });
        
        this.window = this.dom.window;
        this.isReady = false;
        this.initialize();
    }
    
    async initialize() {
        // Attendre que les scripts soient chargés
        await this.waitForNLP();
        this.isReady = true;
        console.log('✅ Service NLP prêt');
    }
    
    waitForNLP() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.window.analyzeTextLocal) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
    
    async corrigerTexte(texte) {
        if (!this.isReady) {
            await this.initialize();
        }
        
        try {
            const resultat = await this.window.analyzeTextLocal(texte);
            return {
                texteOriginal: texte,
                texteCorrige: this.appliquerCorrections(texte, resultat.errors),
                corrections: resultat.errors,
                confiance: resultat.confiance
            };
        } catch (error) {
            throw new Error(`Erreur de correction: ${error.message}`);
        }
    }
    
    appliquerCorrections(texte, corrections) {
        let texteCorrige = texte;
        corrections.sort((a, b) => b.offset - a.offset);
        
        corrections.forEach(correction => {
            if (correction.text && correction.correction) {
                texteCorrige = texteCorrige.replace(correction.text, correction.correction);
            }
        });
        
        return texteCorrige;
    }
}

// Utilisation
const correcteur = new TextCorrectorService();

module.exports = async (req, res) => {
    try {
        const { texte } = req.body;
        const resultat = await correcteur.corrigerTexte(texte);
        res.json(resultat);
    } catch (error) {
        res.status(500).json({ erreur: error.message });
    }
};
```

---

## 🔧 CONFIGURATION AVANCÉE

### **1. Configuration de la Clé API Groq**

```javascript
// groq-ai-analyzer.js
const GROQ_CONFIG = {
    apiKey: process.env.GROQ_API_KEY || 'votre-cle-ici',
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama3-70b-8192',
    maxTokens: 500,
    temperature: 0.3
};
```

### **2. Personnalisation des Règles**

```javascript
// Ajouter des règles personnalisées
window.styleRules.push({
    id: 'regle_personnalisee',
    name: 'regle_personnalisee',
    pattern: /votre_pattern/g,
    correction: 'votre_correction',
    explanation: 'Votre explication',
    type: 'style',
    priority: 90
});
```

---

## 📋 CHECKLIST D'INTÉGRATION

- [ ] Ajouter les scripts NLP dans le bon ordre
- [ ] Attendre le chargement du système (`window.analyzeTextLocal`)
- [ ] Gérer les erreurs avec try/catch
- [ ] Afficher les corrections de manière conviviale
- [ ] Configurer la clé API Groq (optionnel)
- [ ] Tester avec différents types de texte

---

## 🚀 DÉMARRAGE RAPIDE

1. **Copiez les scripts NLP** dans votre projet
2. **Ajoutez-les à votre HTML** avant votre script principal
3. **Utilisez `window.analyzeTextLocal()`** pour corriger les textes
4. **Personnalisez l'interface** selon vos besoins

Le système est maintenant **prêt pour l'intégration** ! 🎉
