#!/bin/bash

# =================================================================
# SCRIPT D'INSTALLATION AUTOMATIQUE - TUTEUR IA MULTI-AGENTS RAG
# =================================================================

echo "🚀 Installation du Tuteur IA Multi-Agents avec RAG..."

# Vérifier les prérequis
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installation en cours..."
    sudo apt update
    sudo apt install docker.io docker-compose -y
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Installation en cours..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p cours-pdf
mkdir -p logs
mkdir -p data/weaviate
mkdir -p data/redis

# Installer les dépendances Node.js
echo "📦 Installation des dépendances..."
npm install

# Vérifier la configuration
if [ ! -f .env ]; then
    echo "⚠️ Fichier .env non trouvé. Création du template..."
    cp .env.example .env
    echo "📝 Veuillez éditer le fichier .env avec votre clé API Groq"
fi

# Construire les images Docker
echo "🐳 Construction des images Docker..."
npm run docker:build

# Démarrer les services
echo "🚀 Démarrage des services..."
npm run docker:up

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier l'état des services
echo "🔍 Vérification des services..."
docker-compose ps

# Test de l'API
echo "🧪 Test de l'API..."
curl -f http://localhost:8080/health || echo "⚠️ L'API n'est pas encore prête"

# Setup RAG si des PDF sont présents
if [ "$(ls -A cours-pdf/)" ]; then
    echo "📚 PDF détectés. Lancement du setup RAG..."
    node rag-setup.js
else
    echo "📁 Aucun PDF trouvé dans cours-pdf/. Ajoutez vos PDF et lancez: node rag-setup.js"
fi

echo "✅ Installation terminée!"
echo ""
echo "🌐 Accès aux services:"
echo "   - Application: http://localhost:3000"
echo "   - API: http://localhost:8080"
echo "   - Weaviate: http://localhost:8081"
echo ""
echo "📖 Prochaines étapes:"
echo "   1. Configurez votre clé API Groq dans .env"
echo "   2. Ajoutez vos PDF de cours dans cours-pdf/"
echo "   3. Lancez: node rag-setup.js"
echo "   4. Testez l'application!"
