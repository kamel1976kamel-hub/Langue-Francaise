# 🗄️ Système NLP avec Base de Données

## 📋 Vue d'ensemble

Ce dossier contient un système de correction linguistique française utilisant une base de données SQL pour éliminer complètement les erreurs de syntaxe JavaScript.

## 🚀 Démarrage Rapide

### 1. Installation
```bash
cd database
npm install
```

### 2. Initialisation de la base de données
```bash
# SQLite (recommandé pour commencer)
npm run init-sqlite

# Ou MySQL
mysql -u root -p < nlp-rules.sql
```

### 3. Démarrer le serveur
```bash
npm start
```

### 4. Intégration
Ajoutez à votre HTML:
```html
<script src="nlp/database-rules-manager.js"></script>
<script src="nlp/spacy-analyzer.js"></script>
<script src="nlp/integration-manager.js"></script>
```

## 📁 Structure des Fichiers

### Fichiers Essentiels
- `database/` - Base de données et serveur API
- `database-rules-manager.js` - Gestionnaire de base de données
- `spacy-analyzer.js` - Analyseur principal adapté
- `advanced-text-corrector.js` - Pipeline avancé
- `groq-ai-analyzer.js` - Analyse IA (optionnel)
- `text-corrector-ui.js` - Interface utilisateur
- `integration-manager.js` - Gestionnaire d'intégration

### Documentation
- `DATABASE-GUIDE.md` - Guide complet d'utilisation
- `archive/` - Tests et documentation archivés

## ✅ Avantages

- ✅ **0 erreur de syntaxe JavaScript**
- ✅ **Performance optimisée avec cache**
- ✅ **Interface d'administration**
- ✅ **Statistiques d'utilisation**
- ✅ **Scalabilité infinie**
- ✅ **Maintenance facilitée**

## 🔧 Utilisation

### Correction de texte
```javascript
const resultat = await window.correctText("Les enfant joue dans le jardin");
console.log(resultat.correctedText);
```

### Interface utilisateur
```javascript
const correcteur = new TextCorrectorUI({
    container: '#mon-conteneur',
    autoCorrect: true
});
```

### Gestion des règles
```javascript
// Ajouter une règle
await window.NLPDatabase.addRule({
    rule_id: 'nouvelle_regle',
    name: 'Ma règle',
    category: 'style',
    pattern: '\bpattern\b',
    correction: 'correction',
    explanation: 'Explication',
    priority: 75
});
```

## 📊 Statistiques

- **30 règles linguistiques** validées
- **4 catégories**: style, vocabulaire, conjugaison, orthographe
- **Cache intelligent** pour performance
- **API REST** pour intégration

## 🌐 API

- `GET /api/nlp/rules` - Toutes les règles
- `GET /api/nlp/rules/:category` - Par catégorie
- `POST /api/nlp/rules` - Ajouter une règle
- `GET /api/nlp/stats` - Statistiques

## 📈 Migration

Les règles ont été migrées depuis les fichiers JavaScript vers la base de données pour éliminer les erreurs de syntaxe et améliorer la performance.

## 🎯 Support

Pour plus d'informations, consultez:
- `DATABASE-GUIDE.md` - Guide complet
- `archive/` - Documentation et tests archivés

---

**Version:** 2.0.0 (Base de données)  
**Dernière mise à jour:** 09/03/2026
