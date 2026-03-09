#!/usr/bin/env python3
"""
Test de l'API Hugging Face pour spaCy
"""

import requests
import json

# Configuration
HUGGINGFACE_TOKEN = "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"

# URLs à tester
URLS_TO_TEST = [
    "https://router.huggingface.co/spacy/fr_core_news_sm",
    "https://api-inference.huggingface.co/models/spacy/fr_core_news_sm",
    "https://huggingface.co/spacy/fr_core_news_sm",
    "https://router.huggingface.co/models/spacy/fr_core_news_sm"
]

def test_url(url):
    """Test une URL spécifique"""
    print(f"\n🔍 Test de: {url}")
    
    try:
        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_TOKEN}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "inputs": "Le chat mange la souris.",
            "options": {
                "wait_for_model": True,
                "use_cache": False
            }
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Succès!")
            print(f"Type de réponse: {type(result)}")
            if isinstance(result, list) and len(result) > 0:
                print(f"Nombre de résultats: {len(result)}")
                print(f"Premier résultat: {json.dumps(result[0], indent=2, ensure_ascii=False)[:500]}...")
            return True
        else:
            print(f"❌ Erreur: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Test de l'API Hugging Face pour spaCy")
    print(f"Token: {HUGGINGFACE_TOKEN[:20]}...")
    
    working_urls = []
    
    for url in URLS_TO_TEST:
        if test_url(url):
            working_urls.append(url)
    
    print(f"\n📊 Résumé:")
    print(f"URLs fonctionnelles: {len(working_urls)}/{len(URLS_TO_TEST)}")
    
    if working_urls:
        print("\n✅ URLs qui fonctionnent:")
        for url in working_urls:
            print(f"  - {url}")
        
        print(f"\n💡 Utilisez cette URL dans proxy-server.py:")
        print(f'HUGGINGFACE_API_URL = "{working_urls[0]}"')
    else:
        print("\n❌ Aucune URL ne fonctionne!")
        print("💡 Vérifiez:")
        print("  - Votre token Hugging Face")
        print("  - Votre connexion internet")
        print("  - Le nom du modèle spaCy")
