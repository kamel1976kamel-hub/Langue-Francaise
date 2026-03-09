#!/usr/bin/env python3
"""
🐍 Serveur Python spaCy pour l'application web
API REST avec spaCy pour analyse linguistique française
"""

import spacy
import json
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import re

# Initialisation de l'application FastAPI
app = FastAPI(title="spaCy NLP API", version="1.0.0")

# Configuration CORS pour permettre les requêtes du navigateur
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chargement du modèle spaCy français
print("🐍 Chargement du modèle spaCy français...")
try:
    nlp = spacy.load("fr_core_news_sm")
    print("✅ Modèle fr_core_news_sm chargé avec succès")
except OSError:
    print("❌ Modèle fr_core_news_sm non trouvé. Installation nécessaire:")
    print("python -m spacy download fr_core_news_sm")
    nlp = None

# Modèles de données Pydantic
class TextRequest(BaseModel):
    text: str
    include_entities: bool = True
    include_pos: bool = True
    include_dependencies: bool = True

class Correction(BaseModel):
    start: int
    end: int
    original: str
    corrected: str
    type: str
    confidence: float
    explanation: str

class SpacyResponse(BaseModel):
    text: str
    tokens: List[Dict[str, Any]]
    entities: List[Dict[str, Any]]
    corrections: List[Correction]
    processing_time: float
    language: str = "fr"

# Dictionnaire de corrections grammaticales françaises
GRAMMATICAL_RULES = {
    # Conjugaison
    r'\bil vas\b': {'correction': 'il va', 'type': 'conjugaison', 'confidence': 0.95},
    r'\bils vas\b': {'correction': 'ils vont', 'type': 'conjugaison', 'confidence': 0.95},
    r'\bel vas\b': {'correction': 'elle va', 'type': 'conjugaison', 'confidence': 0.95},
    r'\bil sont\b': {'correction': 'il est', 'type': 'conjugaison', 'confidence': 0.95},
    r'\bel sont\b': {'correction': 'elle est', 'type': 'conjugaison', 'confidence': 0.95},
    
    # Accords sujet-verbe
    r'\bles enfant joue\b': {'correction': 'les enfants jouent', 'type': 'accord_sujet_verbe', 'confidence': 0.90},
    r'\bles chat mange\b': {'correction': 'les chats mangent', 'type': 'accord_sujet_verbe', 'confidence': 0.90},
    r'\bles fille danse\b': {'correction': 'les filles dansent', 'type': 'accord_sujet_verbe', 'confidence': 0.90},
    
    # Orthographe
    r'\bcinema\b': {'correction': 'cinéma', 'type': 'orthographe', 'confidence': 0.95},
    r'\bapres\b': {'correction': 'après', 'type': 'orthographe', 'confidence': 0.95},
    r'\bparmis\b': {'correction': 'parmi', 'type': 'orthographe', 'confidence': 0.95},
    
    # Grammaire
    r"\bc'est les\b": {'correction': "ce sont les", 'type': 'grammaire', 'confidence': 0.90},
    r"\bc'est des\b": {'correction': "ce sont des", 'type': 'grammaire', 'confidence': 0.90},
}

def detect_grammatical_errors(text: str) -> List[Correction]:
    """Détecte les erreurs grammaticales avec des règles regex"""
    corrections = []
    
    for pattern, info in GRAMMATICAL_RULES.items():
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            correction = Correction(
                start=match.start(),
                end=match.end(),
                original=match.group(),
                corrected=info['correction'],
                type=info['type'],
                confidence=info['confidence'],
                explanation=f"Erreur de {info['type']}: '{match.group()}' → '{info['correction']}'"
            )
            corrections.append(correction)
    
    return corrections

@app.get("/")
async def root():
    """Route racine"""
    return {
        "message": "spaCy NLP API Server",
        "version": "1.0.0",
        "model": "fr_core_news_sm",
        "status": "ready" if nlp else "not_loaded"
    }

@app.get("/health")
async def health_check():
    """Vérification de santé"""
    return {
        "status": "healthy",
        "spacy_loaded": nlp is not None,
        "model": "fr_core_news_sm"
    }

@app.post("/analyze", response_model=SpacyResponse)
async def analyze_text(request: TextRequest):
    """Analyse complète du texte avec spaCy"""
    if not nlp:
        raise HTTPException(status_code=503, detail="Modèle spaCy non chargé")
    
    import time
    start_time = time.time()
    
    # Traitement avec spaCy
    doc = nlp(request.text)
    
    # Analyse des tokens
    tokens = []
    for i, token in enumerate(doc):
        token_data = {
            "index": i,
            "text": token.text,
            "lemma": token.lemma_,
            "pos": token.pos_,
            "tag": token.tag_,
            "dep": token.dep_,
            "head": token.head.text if token.head else token.head.text,
            "children": [child.text for child in token.children]
        }
        tokens.append(token_data)
    
    # Entités nommées
    entities = []
    if request.include_entities:
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
                "confidence": 0.8  # spaCy ne fournit pas de confiance par défaut
            })
    
    # Détection d'erreurs grammaticales
    corrections = detect_grammatical_errors(request.text)
    
    # Temps de traitement
    processing_time = time.time() - start_time
    
    return SpacyResponse(
        text=request.text,
        tokens=tokens,
        entities=entities,
        corrections=corrections,
        processing_time=processing_time
    )

@app.post("/tokens")
async def analyze_tokens(request: TextRequest):
    """Analyse des tokens uniquement"""
    if not nlp:
        raise HTTPException(status_code=503, detail="Modèle spaCy non chargé")
    
    doc = nlp(request.text)
    tokens = []
    
    for token in doc:
        tokens.append({
            "text": token.text,
            "lemma": token.lemma_,
            "pos": token.pos_,
            "is_alpha": token.is_alpha,
            "is_stop": token.is_stop,
            "is_punct": token.is_punct,
            "like_num": token.like_num
        })
    
    return {"tokens": tokens, "count": len(tokens)}

@app.post("/entities")
async def extract_entities(request: TextRequest):
    """Extraction des entités nommées"""
    if not nlp:
        raise HTTPException(status_code=503, detail="Modèle spaCy non chargé")
    
    doc = nlp(request.text)
    entities = []
    
    for ent in doc.ents:
        entities.append({
            "text": ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char,
            "description": f"Entité de type {ent.label_}"
        })
    
    return {"entities": entities, "count": len(entities)}

@app.post("/dependencies")
async def analyze_dependencies(request: TextRequest):
    """Analyse des dépendances syntaxiques"""
    if not nlp:
        raise HTTPException(status_code=503, detail="Modèle spaCy non chargé")
    
    doc = nlp(request.text)
    dependencies = []
    
    for token in doc:
        dependencies.append({
            "text": token.text,
            "dep": token.dep_,
            "head": token.head.text,
            "children": [{"text": child.text, "dep": child.dep} for child in token.children]
        })
    
    return {"dependencies": dependencies}

@app.post("/corrections")
async def get_corrections(request: TextRequest):
    """Corrections grammaticales uniquement"""
    corrections = detect_grammatical_errors(request.text)
    
    return {
        "corrections": corrections,
        "count": len(corrections),
        "corrected_text": apply_corrections(request.text, corrections)
    }

def apply_corrections(text: str, corrections: List[Correction]) -> str:
    """Applique les corrections au texte"""
    corrected_text = text
    
    # Appliquer les corrections dans l'ordre inverse pour ne pas perturber les indices
    for correction in sorted(corrections, key=lambda x: x.start, reverse=True):
        corrected_text = (
            corrected_text[:correction.start] + 
            correction.corrected + 
            corrected_text[correction.end:]
        )
    
    return corrected_text

if __name__ == "__main__":
    print("🚀 Démarrage du serveur spaCy API...")
    print("📡 Serveur disponible sur: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
