# 🐍 spaCy Python API Server

Serveur Python avec spaCy pour analyse linguistique française avancée.

## 🚀 Installation et démarrage

### 1. Installation des dépendances
```bash
# Créer un environnement virtuel
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Installer les dépendances
pip install -r requirements.txt

# Télécharger le modèle spaCy français
python -m spacy download fr_core_news_sm
```

### 2. Démarrer le serveur
```bash
python app.py
```

Le serveur démarrera sur `http://localhost:8000`

## 📡 API Endpoints

### Analyse complète
```http
POST /analyze
{
    "text": "Les chats noirs mangent des souris blanches.",
    "include_entities": true,
    "include_pos": true,
    "include_dependencies": true
}
```

### Tokens uniquement
```http
POST /tokens
{
    "text": "Les chats noirs mangent."
}
```

### Entités nommées
```http
POST /entities
{
    "text": "Paris est la capitale de la France."
}
```

### Dépendances syntaxiques
```http
POST /dependencies
{
    "text": "Le chat mange la souris."
}
```

### Corrections grammaticales
```http
POST /corrections
{
    "text": "Il vas au cinema."
}
```

## 🔗 Intégration avec l'application web

### 1. Ajouter le client JavaScript
```html
<script src="nlp/python-server/spacy-python-client.js"></script>
```

### 2. Utilisation dans le pipeline
```javascript
// Remplacer automatiquement spaCy simulé
await window.replaceSpacyWithPython();

// Utilisation directe
const result = await window.spacyPythonClient.analyzeText("texte");
```

## 📊 Comparaison des performances

| Caractéristique | spaCy Python | Simulation JS |
|----------------|---------------|----------------|
| Précision POS | 95%+ | 60-70% |
| NER | Avancé | Basique |
| Dependency parsing | Complet | Simplifié |
| Vitesse | 10-50ms | 1-5ms |
| Mémoire | 500MB+ | <1MB |

## 🎯 Avantages de spaCy Python

- **Précision supérieure** : Analyse grammaticale beaucoup plus fiable
- **Entités nommées** : Détection de personnes, lieux, organisations
- **Lemmatisation** : Formes canoniques des mots
- **Vectors sémantiques** : Similarité entre mots
- **Dependency parsing** : Relations syntaxiques complètes

## 🔄 Fallback automatique

Si le serveur Python n'est pas disponible, le système revient automatiquement à la simulation JavaScript.

## 📝 Exemples d'utilisation

### Analyse complète
```javascript
const result = await window.spacyPythonClient.analyzeText(
    "Le chat noir mange une souris blanche à Paris."
);

console.log(result.analysis.tokens);
console.log(result.analysis.entities);
console.log(result.corrections);
```

### Corrections uniquement
```javascript
const corrections = await window.spacyPythonClient.getCorrections(
    "Il vas au cinema avec ses amis."
);

console.log(corrections.corrected_text);
// "Il va au cinéma avec ses amis."
```

## 🔧 Configuration

### Modifier les règles grammaticales
Éditer `app.py` et modifier le dictionnaire `GRAMMATICAL_RULES`.

### Changer de modèle spaCy
```python
nlp = spacy.load("fr_core_news_lg")  # Plus précis
nlp = spacy.load("fr_dep_news_trf")  # Transformeur
```

## 🚨 Dépannage

### Modèle non trouvé
```bash
python -m spacy download fr_core_news_sm
```

### Port déjà utilisé
```bash
python app.py --port 8001
```

### CORS errors
Le serveur est configuré pour accepter toutes les origines en développement.

## 📚 Documentation complète

- **spaCy** : https://spacy.io/
- **FastAPI** : https://fastapi.tiangolo.com/
- **Modèles français** : https://spacy.io/models/fr
