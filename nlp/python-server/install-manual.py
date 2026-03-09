#!/usr/bin/env python3
"""
Installation manuelle de spaCy si pip a des problèmes SSL
"""

import subprocess
import sys
import os

def run_command(cmd):
    """Exécute une commande et retourne le résultat"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print(f"Commande: {cmd}")
        print(f"Sortie: {result.stdout}")
        if result.stderr:
            print(f"Erreur: {result.stderr}")
        return result.returncode == 0
    except Exception as e:
        print(f"Erreur exécution: {e}")
        return False

def install_spacy():
    """Installation de spaCy avec fallbacks"""
    print("🐍 Installation de spaCy...")
    
    # Méthode 1: pip avec trusted hosts
    if run_command("pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org spaCy"):
        print("✅ spaCy installé avec méthode 1")
        return True
    
    # Méthode 2: pip sans SSL
    if run_command("pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org --trusted-host github.com spaCy"):
        print("✅ spaCy installé avec méthode 2")
        return True
    
    # Méthode 3: conda (si disponible)
    if run_command("conda install -c conda-forge spacy"):
        print("✅ spaCy installé avec conda")
        return True
    
    print("❌ Échec de l'installation automatique")
    return False

def download_model():
    """Téléchargement du modèle français"""
    print("📚 Téléchargement du modèle français...")
    
    # Méthode 1: python -m spacy download
    if run_command("python -m spacy download fr_core_news_sm"):
        print("✅ Modèle français téléchargé")
        return True
    
    # Méthode 2: pip direct
    if run_command("pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org fr-core-news-sm"):
        print("✅ Modèle français installé directement")
        return True
    
    print("❌ Échec du téléchargement du modèle")
    return False

def test_spacy():
    """Test si spaCy fonctionne"""
    try:
        import spacy
        print("✅ spaCy importé avec succès")
        
        # Test du modèle
        nlp = spacy.load("fr_core_news_sm")
        print("✅ Modèle français chargé")
        
        # Test simple
        doc = nlp("Le chat mange la souris")
        print(f"✅ Test réussi: {len(doc)} tokens analysés")
        
        return True
    except Exception as e:
        print(f"❌ Erreur test spaCy: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Installation spaCy Python...")
    
    # Installation spaCy
    if install_spacy():
        # Téléchargement modèle
        if download_model():
            # Test
            if test_spacy():
                print("🎉 spaCy Python est prêt !")
                print("📡 Lancez le serveur avec: python app.py")
            else:
                print("❌ spaCy installé mais le test a échoué")
        else:
            print("❌ spaCy installé mais modèle non disponible")
    else:
        print("❌ Échec installation spaCy")
        print("\n📝 Instructions manuelles:")
        print("1. Téléchargez spaCy: https://pypi.org/project/spacy/#files")
        print("2. Installez avec: pip install spaCy-*.whl")
        print("3. Téléchargez le modèle: python -m spacy download fr_core_news_sm")
