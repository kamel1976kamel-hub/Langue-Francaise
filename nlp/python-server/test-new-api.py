#!/usr/bin/env python3
"""
Test du nouveau format d'API Hugging Face
"""

import requests
import json

# Configuration
HUGGINGFACE_TOKEN = "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"

# Nouveaux formats d'URL à tester
URL_FORMATS = [
    # Format router avec /models/
    "https://router.huggingface.co/models/Jean-Baptiste/camembert-ner",
    "https://router.huggingface.co/models/dbmdz/bert-base-french-europeana-cased",
    "https://router.huggingface.co/models/benjamin/roberta-base-french",
    
    # Format router direct
    "https://router.huggingface.co/Jean-Baptiste/camembert-ner",
    "https://router.huggingface.co/dbmdz/bert-base-french-europeana-cased",
    "https://router.huggingface.co/benjamin/roberta-base-french",
    
    # Format API inference (ancien)
    "https://api-inference.huggingface.co/models/Jean-Baptiste/camembert-ner",
    "https://api-inference.huggingface.co/models/dbmdz/bert-base-french-europeana-cased",
    
    # Format inference direct
    "https://api-inference.huggingface.co/Jean-Baptiste/camembert-ner",
    "https://api-inference.huggingface.co/dbmdz/bert-base-french-europeana-cased",
]

def test_api_format(url):
    """Test un format d'API spécifique"""
    print(f"\n🔍 Test: {url}")
    
    try:
        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_TOKEN}",
            "Content-Type": "application/json",
        }
        
        # Test avec un simple texte
        payload = {
            "inputs": "Le chat mange la souris à Paris."
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Succès!")
            print(f"Type: {type(result)}")
            
            if isinstance(result, list):
                print(f"Résultats: {len(result)}")
                if len(result) > 0:
                    print(f"Aperçu: {str(result[0])[:200]}...")
            elif isinstance(result, dict):
                print(f"Clés: {list(result.keys())[:5]}")
            
            return True, url
        else:
            print(f"❌ Erreur: {response.text[:200]}...")
            return False, None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False, None

if __name__ == "__main__":
    print("🧪 Test des formats d'API Hugging Face")
    print(f"Token: {HUGGINGFACE_TOKEN[:20]}...")
    
    working_formats = []
    
    for url in URL_FORMATS:
        works, working_url = test_api_format(url)
        if works:
            working_formats.append((url, working_url))
            break  # On s'arrête au premier qui fonctionne
    
    print(f"\n📊 Résumé:")
    print(f"Formats fonctionnels: {len(working_formats)}/{len(URL_FORMATS)}")
    
    if working_formats:
        print("\n✅ Format qui fonctionne:")
        print(f"URL: {working_formats[0][1]}")
        
        print(f"\n💡 Configuration pour proxy-server.py:")
        print(f'HUGGINGFACE_API_URL = "{working_formats[0][1]}"')
    else:
        print("\n❌ Aucun format ne fonctionne!")
        print("\n🔧 Solution alternative:")
        print("1. Utiliser spaCy localement (recommandé)")
        print("2. Créer un serveur FastAPI avec spaCy installé")
        print("3. Utiliser une autre API NLP")
