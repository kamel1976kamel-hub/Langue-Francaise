# =================================================================
# SCRIPT D'INSTALLATION WINDOWS - TEST LOCAL UNIQUEMENT
# =================================================================

Write-Host "🚀 Installation Windows du Tuteur IA (Test local)..."

# Vérifier si Node.js est installé
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js n'est pas installé. Téléchargez-le depuis https://nodejs.org"
    exit 1
}

# Vérifier si Git est installé
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git n'est pas installé. Téléchargez-le depuis https://git-scm.com"
    exit 1
}

# Créer les répertoires nécessaires
Write-Host "📁 Création des répertoires..."
New-Item -ItemType Directory -Force -Path "cours-pdf" | Out-Null
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

# Installer les dépendances
Write-Host "📦 Installation des dépendances..."
npm install

# Vérifier la configuration
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ Fichier .env non trouvé. Création du template..."
    Copy-Item ".env.example" ".env"
    Write-Host "📝 Veuillez éditer le fichier .env avec votre clé API Groq"
}

# Démarrer le serveur local (sans Docker)
Write-Host "🚀 Démarrage du serveur local..."
npm start

Write-Host "✅ Installation terminée!"
Write-Host ""
Write-Host "🌐 Accès local:"
Write-Host "   - Application: http://localhost:8080"
Write-Host ""
Write-Host "📖 Prochaines étapes:"
Write-Host "   1. Configurez votre clé API Groq dans .env"
Write-Host "   2. Ajoutez vos PDF de cours dans cours-pdf/"
Write-Host "   3. Testez l'application localement"
