# 📋 Modèles Groq Disponibles

## ✅ Modèles valides et testés

### `llama-3.1-8b-instant`
- **Statut**: ✅ Fonctionnel
- **Usage**: Analyse linguistique française
- **Performance**: Rapide et efficace
- **Recommandé**: ✅ Pour le pipeline NLP

### `llama-3.1-70b-versatile`
- **Statut**: ✅ Disponible
- **Usage**: Analyse complexe
- **Performance**: Plus lent mais plus précis

### `mixtral-8x7b-32768`
- **Statut**: ✅ Disponible
- **Usage**: Général
- **Performance**: Bon équilibre

## ❌ Modèles dépréciés/incorrects

### `llama3-70b-8192`
- **Statut**: ❌ Décommissionné
- **Erreur**: `model_decommissioned`

### `llama3-70b-v2`
- **Statut**: ❌ Inexistant
- **Erreur**: `model_not_found`

## 🔧 Configuration recommandée

```javascript
const GROQ_CONFIG = {
    apiKey: 'VOTRE_CLÉ',
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-8b-instant', // ✅ Recommandé
    maxTokens: 500,
    temperature: 0.3
};
```

## 📝 Notes importantes

1. **Vérifier la documentation**: https://console.groq.com/docs/models
2. **Tester avec curl** avant intégration
3. **Fallback robuste**: Le pipeline continue même si IA échoue
4. **Cache**: Éviter les appels répétés

## 🚀 Tests à effectuer

1. **Test simple**: `test-final.html`
2. **Test complet**: `pipeline-test-fixed.html`
3. **Logs console**: Vérifier les payloads et réponses
