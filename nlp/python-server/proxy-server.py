#!/usr/bin/env python3
"""
🌐 Serveur Proxy pour spaCy Cloud (résolution CORS)
Permet d'utiliser spaCy Cloud depuis le navigateur sans problème CORS
"""

import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Active CORS pour toutes les routes

# Configuration
HUGGINGFACE_API_URL = "https://router.huggingface.co/spacy/fr_core_news_sm"
HUGGINGFACE_TOKEN = "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"

# Test de l'API Hugging Face
def test_huggingface_api():
    """Test si l'API Hugging Face fonctionne"""
    try:
        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_TOKEN}",
            "Content-Type": "application/json",
        }
        
        test_payload = {
            "inputs": "Le chat mange la souris.",
            "options": {
                "wait_for_model": True,
                "use_cache": False
            }
        }
        
        print(f"🔍 Test API Hugging Face: {HUGGINGFACE_API_URL}")
        response = requests.post(HUGGINGFACE_API_URL, headers=headers, json=test_payload, timeout=10)
        
        if response.status_code == 200:
            print("✅ API Hugging Face fonctionne!")
            return True
        else:
            print(f"❌ Erreur API: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur connexion API: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Vérification de santé du proxy"""
    return jsonify({
        "status": "healthy",
        "service": "spaCy-Cloud-Proxy",
        "target": "Hugging Face Inference API"
    })

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """Proxy pour l'analyse spaCy Cloud"""
    try:
        # Récupérer les données de la requête
        data = request.get_json()
        
        if not data or 'inputs' not in data:
            return jsonify({"error": "Missing 'inputs' field"}), 400
        
        # Préparer la requête vers Hugging Face
        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_TOKEN}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": data['inputs'],
            "options": data.get('options', {
                "wait_for_model": True,
                "use_cache": False
            })
        }
        
        print(f"🔍 Proxy: Envoi vers Hugging Face: {payload}")
        
        # Appel à l'API Hugging Face
        response = requests.post(
            HUGGINGFACE_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Proxy: Réponse Hugging Face reçue")
            return jsonify(result)
        else:
            error_msg = f"Hugging Face API Error: {response.status_code} - {response.text}"
            print(f"❌ Proxy: {error_msg}")
            return jsonify({"error": error_msg}), response.status_code
            
    except requests.exceptions.Timeout:
        error_msg = "Timeout lors de l'appel à Hugging Face"
        print(f"❌ Proxy: {error_msg}")
        return jsonify({"error": error_msg}), 504
        
    except requests.exceptions.RequestException as e:
        error_msg = f"Erreur de connexion à Hugging Face: {str(e)}"
        print(f"❌ Proxy: {error_msg}")
        return jsonify({"error": error_msg}), 502
        
    except Exception as e:
        error_msg = f"Erreur inattendue: {str(e)}"
        print(f"❌ Proxy: {error_msg}")
        return jsonify({"error": error_msg}), 500

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Endpoint de test simple - retourne statut OK"""
    return jsonify({
        "status": "test_ok",
        "service": "spaCy-Cloud-Proxy",
        "message": "Proxy fonctionne correctement",
        "target": "Hugging Face Inference API",
        "note": "Utilisez /analyze pour les vraies analyses"
    })

if __name__ == '__main__':
    print("🌐 Démarrage du serveur proxy spaCy Cloud...")
    print(f"📡 Proxy disponible sur: http://localhost:8001")
    print(f"🎯 Endpoint analyse: http://localhost:8001/analyze")
    print(f"🧪 Endpoint test: http://localhost:8001/test")
    print(f"❤️‍🔥 Endpoint santé: http://localhost:8001/health")
    print(f"🔗 Redirige vers: {HUGGINGFACE_API_URL}")
    
    # Test de connexion à Hugging Face
    print("\n🔍 Test de connexion à Hugging Face...")
    if test_huggingface_api():
        print("✅ Connexion Hugging Face OK - Démarrage du proxy")
    else:
        print("❌ Erreur de connexion Hugging Face - Le proxy ne fonctionnera pas correctement")
        print("💡 Vérifiez votre token et l'URL de l'API")
    
    print("\n🚀 Lancement du serveur proxy...")
    app.run(host='0.0.0.0', port=8001, debug=True)
