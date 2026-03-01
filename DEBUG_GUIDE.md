# Guide de Débogage de la Pipeline IA

## 📋 Comment vérifier si la pipeline est opérationnelle

### 1. **Vérification Visuelle**
- **Statut IA** : Regardez l'indicateur dans la barre latérale gauche
  - 🟢 **Vert** : Pipeline prête (cloud)
  - 🟡 **Jaune** : Chargement en cours
  - 🔴 **Rouge** : Erreur

### 2. **Débogage Automatique**
Cliquez sur le bouton 🐛 (icône de débogage) à côté du statut IA pour lancer un diagnostic complet.

### 3. **Débogage Manuel dans la Console**

Ouvrez la console du navigateur (F12) et utilisez ces commandes :

#### **Vérification de l'état global**
```javascript
debugPipelineStatus()
```
Cette commande affiche :
- ✅ État des modules
- ✅ Disponibilité de la pipeline
- ✅ Présence du token GitHub
- ✅ Mode d'exécution (local/cloud)
- ✅ Test de connexion API

#### **Test fonctionnel de la pipeline**
```javascript
await testPipeline()
```
Cette commande :
- Envoie un message de test
- Mesure le temps de réponse
- Affiche la réponse obtenue
- Confirme le bon fonctionnement

#### **Vérification manuelle**
```javascript
// Vérifier si la pipeline est disponible
typeof window.runFourModelPipeline === 'function'

// Vérifier le token GitHub
localStorage.getItem('github_token') || sessionStorage.getItem('github_token')

// Vérifier le mode d'exécution
location.hostname === 'localhost' || location.protocol === 'file:'
```

## 🔧 Points de Débogage Intégrés

### **Logs dans la Console**
Surveillez ces messages dans la console :

#### **Initialisation**
```
Initialisation du pipeline à 4 modèles via GitHub Models API...
Pipeline à 4 modèles via GitHub Models API prêt!
```

#### **Appels API**
```
🔄 Appel au modèle: deepseek/deepseek-r1
📝 Messages: 2 message(s)
📡 Réponse API: 200 OK
✅ Réponse reçue de deepseek/deepseek-r1: Analyse technique...
```

#### **Erreurs**
```
❌ Erreur lors de l'appel au modèle: NetworkError
❌ Erreur dans le pipeline à 4 modèles: ...
```

## 🚨 Problèmes Courants et Solutions

### **Problème 1 : Token GitHub manquant**
**Symptôme** : `Token GitHub présent: false`

**Solution** :
1. Allez dans les paramètres GitHub
2. Générez un nouveau Personal Access Token
3. Stockez-le avec : `localStorage.setItem('github_token', 'votre_token')`

### **Problème 2 : Mode Fallback activé**
**Symptôme** : `Mode fallback activé: true`

**Solution** :
- Normal si vous êtes en `localhost` ou `file://`
- Pour le mode production, déployez sur un serveur web

### **Problème 3 : Erreur API 401/403**
**Symptôme** : `❌ Erreur connexion API: 401 Unauthorized`

**Solution** :
1. Vérifiez que le token GitHub est valide
2. Assurez-vous que le token a les permissions nécessaires
3. Regénérez un nouveau token si nécessaire

### **Problème 4 : Timeout**
**Symptôme** : `❌ Erreur lors de l'appel au modèle: Timeout`

**Solution** :
1. Vérifiez votre connexion Internet
2. Les modèles peuvent être lents, patientez
3. Essayez de réduire `max_tokens` dans la configuration

## 📊 Monitoring en Temps Réel

### **Variables à surveiller**
```javascript
// État de la pipeline
window.runFourModelPipeline

// Configuration des modèles
window.modelConfiguration

// État des modules
window.areAllModulesReady()
```

### **Performance**
Utilisez `testPipeline()` pour mesurer :
- Temps de réponse total
- Temps par étape de la pipeline
- Qualité des réponses

## 🛠️ Développement et Tests

### **Mode Local**
En développement, la pipeline utilise automatiquement le mode fallback :
- Pas besoin de token GitHub
- Réponses simulées
- Tests rapides

### **Mode Production**
Pour tester en conditions réelles :
1. Déployez sur un serveur
2. Configurez un token GitHub valide
3. Utilisez `debugPipelineStatus()` pour vérifier

## 📝 Checklist de Débogage

- [ ] **Statut IA** est vert dans l'interface
- [ ] **Console** : Pas d'erreurs au chargement
- [ ] **Token GitHub** : Présent et valide
- [ ] **Connexion API** : `debugPipelineStatus()` retourne ✅
- [ ] **Test fonctionnel** : `testPipeline()` réussi
- [ ] **Réponses** : Cohérentes et pédagogiques

## 🆘 En Cas de Problème

1. **Ouvrez la console** (F12)
2. **Lancez** `debugPipelineStatus()`
3. **Notez** les erreurs affichées
4. **Consultez** ce guide pour la solution
5. **Redémarrez** l'application si nécessaire

---

*Pour toute question technique, consultez les logs détaillés dans la console du navigateur.*
