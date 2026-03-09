#!/usr/bin/env python3
"""
Proxy spaCy Local - Solution sans dépendances externes
Utilise spaCy installé localement au lieu de Hugging Face API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import json

app = Flask(__name__)
CORS(app)

# Charger spaCy localement
print("🐍 Chargement du modèle spaCy français...")
try:
    nlp = spacy.load("fr_core_news_sm")
    print("✅ Modèle spaCy français chargé avec succès")
except Exception as e:
    print(f"❌ Erreur chargement spaCy: {e}")
    print("💡 Installez le modèle avec: python -m spacy download fr_core_news_sm")
    exit(1)

def spacy_to_hf_format(doc):
    """Convertit les résultats spaCy au format Hugging Face"""
    tokens = []
    for token in doc:
        tokens.append({
            "text": token.text,
            "lemma": token.lemma_,
            "pos": token.pos_,
            "tag": token.tag_,
            "dep": token.dep_,
            "is_alpha": token.is_alpha,
            "is_stop": token.is_stop,
            "idx": token.idx
        })
    
    entities = []
    for ent in doc.ents:
        entities.append({
            "text": ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char
        })
    
    return {
        "tokens": tokens,
        "entities": entities,
        "text": doc.text,
        "language": "fr"
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Vérification de santé du proxy"""
    return jsonify({
        "status": "healthy",
        "service": "spaCy-Local-Proxy",
        "target": "spaCy Local",
        "model": "fr_core_news_sm"
    })

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """Analyse de texte avec spaCy local"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "error": "Missing JSON data"
            }), 400
        
        # Accepter les deux formats : "inputs" ou "text"
        text = data.get('inputs') or data.get('text')
        
        if not text:
            return jsonify({
                "error": "Missing 'inputs' or 'text' field"
            }), 400
        
        print(f"🔍 Analyse du texte: {text[:50]}...")
        
        # Traitement avec spaCy
        doc = nlp(text)
        
        # Conversion au format compatible
        result = spacy_to_hf_format(doc)
        
        print(f"✅ Analyse terminée: {len(result['tokens'])} tokens, {len(result['entities'])} entités")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Erreur analyse: {e}")
        return jsonify({
            "error": f"Analysis error: {str(e)}"
        }), 500

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Endpoint de test simple"""
    test_text = "Le chat mange la souris à Paris."
    doc = nlp(test_text)
    result = spacy_to_hf_format(doc)
    
    return jsonify({
        "status": "test_ok",
        "input": test_text,
        "output": result
    })

@app.route('/', methods=['GET'])
def index():
    """Page d'accueil du proxy"""
    return jsonify({
        "service": "spaCy Local Proxy",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze (POST)",
            "test": "/test"
        },
        "model": "fr_core_news_sm",
        "status": "running"
    })

if __name__ == '__main__':
    print("🌐 Démarrage du serveur proxy spaCy Local...")
    print(f"📡 Proxy disponible sur: http://localhost:8001")
    print(f"🎯 Endpoint analyse: http://localhost:8001/analyze")
    print(f"🧪 Endpoint test: http://localhost:8001/test")
    print(f"❤️‍🔥 Endpoint santé: http://localhost:8001/health")
    print(f"🔗 Utilise spaCy local (pas de dépendances externes)")
    print(f"🚀 Lancement du serveur...")
    app.run(host='0.0.0.0', port=8001, debug=True)
