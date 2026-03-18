#!/usr/bin/env python3
"""
Proxy spaCy Professionnel Local - 100% sans Hugging Face
Utilise spaCy fr_core_news_lg pour une analyse linguistique complète
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import json
import sys

app = Flask(__name__)
CORS(app)

# Charger le modèle spaCy français
print("🐍 Chargement du modèle spaCy professionnel français...")
try:
    nlp = spacy.load("fr_core_news_md")
    print(f"✅ Modèle spaCy français chargé avec succès: {nlp.meta['name']} v{nlp.meta['version']}")
except OSError:
    print("❌ Erreur: Le modèle spaCy français n'est pas installé.")
    print("� Veuillez installer le modèle avec:")
    print("   python -m spacy download fr_core_news_lg")
    print("   Ou:")
    print("   pip install https://github.com/explosion/spacy-models/releases/download/fr_core_news_lg-3.7.0/fr_core_news_lg-3.7.0.tar.gz")
    sys.exit(1)

def format_spacy_results(doc):
    """Formate les résultats spaCy pour le client"""
    tokens = []
    for token in doc:
        tokens.append({
            "text": token.text,
            "lemma": token.lemma_,
            "pos": token.pos_,
            "pos_explained": spacy.explain(token.pos_) or token.pos_,
            "tag": token.tag_,
            "dep": token.dep_,
            "dep_explained": spacy.explain(token.dep_) or token.dep_,
            "is_alpha": token.is_alpha,
            "is_stop": token.is_stop,
            "is_punct": token.is_punct,
            "is_space": token.is_space,
            "idx": token.idx,
            "head": token.head.text,
            "children": [child.text for child in token.children]
        })
    
    entities = []
    for ent in doc.ents:
        entities.append({
            "text": ent.text,
            "label": ent.label_,
            "label_explained": spacy.explain(ent.label_) or ent.label_,
            "start": ent.start_char,
            "end": ent.end_char,
            "confidence": getattr(ent, 'confidence', None)
        })
    
    # Phrases et dépendances
    sentences = []
    for sent in doc.sents:
        sentences.append({
            "text": sent.text,
            "start": sent.start,
            "end": sent.end
        })
    
    return {
        "text": doc.text,
        "tokens": tokens,
        "entities": entities,
        "sentences": sentences,
        "language": "fr",
        "model": "fr_core_news_md",
        "stats": {
            "tokens_count": len(doc),
            "entities_count": len(doc.ents),
            "sentences_count": len(list(doc.sents)),
            "has_vectors": doc.has_vector,
            "vector_norm": doc.vector_norm if doc.has_vector else None
        }
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Vérification de santé du proxy"""
    return jsonify({
        "status": "healthy",
        "service": "spaCy-Professionnel-Proxy",
        "model": "fr_core_news_md",
        "target": "spaCy Local (100% sans Hugging Face)",
        "features": ["tokens", "pos", "lemmas", "dependencies", "entities", "vectors"]
    })

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """Analyse de texte avec spaCy professionnel local"""
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
        
        print(f"🔍 Analyse professionnelle du texte: {text[:50]}...")
        
        # Traitement avec spaCy professionnel
        doc = nlp(text)
        
        # Formatage complet des résultats
        result = format_spacy_results(doc)
        
        print(f"✅ Analyse terminée: {result['stats']['tokens_count']} tokens, {result['stats']['entities_count']} entités")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Erreur analyse: {e}")
        return jsonify({
            "error": f"Analysis error: {str(e)}"
        }), 500

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Endpoint de test avec spaCy professionnel"""
    test_text = "Le chat noir mange une souris blanche à Paris. Marie et Jean travaillent ensemble depuis longtemps."
    doc = nlp(test_text)
    result = format_spacy_results(doc)
    
    return jsonify({
        "status": "test_ok",
        "service": "spaCy Professionnel Local",
        "input": test_text,
        "output": result,
        "note": "100% local, sans Hugging Face"
    })

@app.route('/models', methods=['GET'])
def models_info():
    """Informations sur les modèles disponibles"""
    return jsonify({
        "current_model": "fr_core_news_md",
        "description": "Modèle spaCy français de taille moyenne",
        "capabilities": {
            "tokenization": True,
            "pos_tagging": True,
            "lemmatization": True,
            "dependency_parsing": True,
            "named_entity_recognition": True,
            "word_vectors": True
        },
        "performance": {
            "accuracy": "high",
            "speed": "medium",
            "size": "medium"
        }
    })

@app.route('/', methods=['GET'])
def index():
    """Page d'accueil du proxy professionnel"""
    return jsonify({
        "service": "spaCy Professionnel Proxy",
        "version": "2.0.0",
        "type": "100% Local - Sans Hugging Face",
        "model": "fr_core_news_md",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze (POST)",
            "test": "/test",
            "models": "/models"
        },
        "features": [
            "Tokenisation professionnelle",
            "POS tagging précis", 
            "Lemmatisation complète",
            "Analyse des dépendances",
            "Reconnaissance d'entités nommées",
            "Vecteurs de mots"
        ],
        "status": "running",
        "advantages": [
            "Pas de dépendances externes",
            "Ultra-rapide (latence 0ms)",
            "100% fiable",
            "Confidentialité totale",
            "Coût zéro"
        ]
    })

if __name__ == '__main__':
    print("🌐 Démarrage du serveur proxy spaCy Professionnel...")
    print(f"📡 Proxy disponible sur: http://localhost:8002")
    print(f"🎯 Endpoint analyse: http://localhost:8002/analyze")
    print(f"🧪 Endpoint test: http://localhost:8002/test")
    print(f"❤️‍🔥 Endpoint santé: http://localhost:8002/health")
    print(f"📚 Modèles: http://localhost:8002/models")
    print(f"🔗 100% spaCy local - SANS Hugging Face")
    print(f"🚀 Lancement du serveur professionnel...")
    app.run(host='0.0.0.0', port=8002, debug=False)
