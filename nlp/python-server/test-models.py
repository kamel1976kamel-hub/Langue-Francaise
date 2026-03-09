#!/usr/bin/env python3
"""
Test de différents modèles NLP français sur Hugging Face
"""

import requests
import json

# Configuration
HUGGINGFACE_TOKEN = "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"

# Modèles NLP français à tester
MODELS_TO_TEST = [
    # Modèles de tokenisation/NER
    "Jean-Baptiste/camembert-ner",
    "dbmdz/bert-base-french-europeana-cased",
    "benjamin/roberta-base-french",
    "tblard/tf-allocine",
    
    # Modèles de classification
    "Cedille/paris-cased-bert-base",
    "flaubert/flaubert_base_cased",
    
    # Modèles spaCy alternatives
    "spacy/fr_core_news_sm",
    "spacy/fr_core_news_md",
    "spacy/fr_core_news_lg"
]

def test_model(model_name):
    """Test un modèle spécifique"""
    print(f"\n🔍 Test du modèle: {model_name}")
    
    try:
        # URL de l'API Inference
        url = f"https://router.huggingface.co/models/{model_name}"
        
        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_TOKEN}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "inputs": "Le chat mange la souris à Paris.",
            "options": {
                "wait_for_model": True,
                "use_cache": False
            }
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Succès!")
            print(f"Type de réponse: {type(result)}")
            if isinstance(result, list) and len(result) > 0:
                print(f"Nombre de résultats: {len(result)}")
                print(f"Aperçu: {json.dumps(result[0], indent=2, ensure_ascii=False)[:300]}...")
            return True, url
        else:
            print(f"❌ Erreur: {response.text[:200]}...")
            return False, None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False, None

if __name__ == "__main__":
    print("🧪 Test de modèles NLP français sur Hugging Face")
    print(f"Token: {HUGGINGFACE_TOKEN[:20]}...")
    
    working_models = []
    
    for model in MODELS_TO_TEST:
        works, url = test_model(model)
        if works:
            working_models.append((model, url))
    
    print(f"\n📊 Résumé:")
    print(f"Modèles fonctionnels: {len(working_models)}/{len(MODELS_TO_TEST)}")
    
    if working_models:
        print("\n✅ Modèles qui fonctionnent:")
        for model, url in working_models:
            print(f"  - {model}")
            print(f"    URL: {url}")
        
        print(f"\n💡 Utilisez ce modèle dans proxy-server.py:")
        print(f'HUGGINGFACE_API_URL = "{working_models[0][1]}"')
        print(f'# Modèle: {working_models[0][0]}')
    else:
        print("\n❌ Aucun modèle ne fonctionne!")
        print("💡 Suggestions:")
        print("  1. Vérifiez votre token Hugging Face")
        print("  2. Essayez avec un modèle plus simple")
        print("  3. Utilisez spaCy localement à la place")
