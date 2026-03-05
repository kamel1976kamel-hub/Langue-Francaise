# 🚀 Guide de Déploiement Auto-hébergé

## 📋 Prérequis

- **VPS Ubuntu** (8-16 Go RAM, 4 CPU minimum)
- **Docker & Docker Compose** installés
- **Clé API Groq** configurée

## 🔧 Installation Rapide

### 1. Cloner le projet
```bash
git clone https://github.com/votre-username/Langue-Francaise.git
cd Langue-Francaise
```

### 2. Configurer l'environnement
```bash
cp .env.example .env
# Éditer .env avec votre clé API Groq
```

### 3. Installer les dépendances
```bash
npm install
```

### 4. Démarrer avec Docker
```bash
# Construire les images
npm run docker:build

# Démarrer tous les services
npm run docker:up
```

## 🌐 Accès aux Services

- **Application web** : http://localhost:3000
- **API Backend** : http://localhost:8080
- **Weaviate (RAG)** : http://localhost:8081
- **Redis (Cache)** : localhost:6379

## 🛠️ Commandes Utiles

```bash
# Démarrer le serveur local (sans Docker)
npm start

# Arrêter tous les conteneurs
npm run docker:down

# Reconstruire les images
npm run docker:build

# Voir les logs des conteneurs
docker-compose logs -f
```

## 📊 Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Weaviate   │
│   (Port 3000)│◄──►│   (Port 8080)│◄──►│  (Port 8081)│
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                  ┌─────────────┐
                  │    Redis    │
                  │ (Port 6379) │
                  └─────────────┘
```

## 🔧 Configuration

### Variables d'environnement (.env)
```bash
GROQ_API_KEY=votre_cle_api_groq
NODE_ENV=production
PORT=8080
WEAVIATE_URL=http://localhost:8081
REDIS_URL=redis://localhost:6379
```

## 🚀 Déploiement en Production

### 1. Sur VPS Ubuntu
```bash
# Installer Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker

# Cloner et démarrer
git clone https://github.com/votre-username/Langue-Francaise.git
cd Langue-Francaise
npm run docker:up
```

### 2. Avec Nginx (Optionnel)
```bash
# Installer Nginx
sudo apt install nginx -y

# Configurer le reverse proxy
sudo cp nginx.conf /etc/nginx/sites-available/langue-francaise
sudo ln -s /etc/nginx/sites-available/langue-francaise /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

## 🔍 Monitoring

### Vérifier l'état des services
```bash
# Vérifier les conteneurs
docker-compose ps

# Vérifier les logs
docker-compose logs backend

# Tester l'API
curl http://localhost:8080/health
```

## 🛡️ Sécurité

- **Mettre à jour** régulièrement les conteneurs
- **Utiliser** des clés API fortes
- **Configurer** un firewall (UFW)
- **Activer** HTTPS avec Let's Encrypt

## 📈 Performance

- **Scaling horizontal** : `docker-compose up --scale backend=3`
- **Cache Redis** : Réponses rapides
- **Weaviate** : Recherche RAG optimisée

## 🆘 Dépannage

### Problèmes courants
1. **Port déjà utilisé** : Changer les ports dans docker-compose.yml
2. **Clé API invalide** : Vérifier le fichier .env
3. **Mémoire insuffisante** : Augmenter la RAM du VPS

### Logs utiles
```bash
# Logs du backend
docker-compose logs backend

# Logs de Weaviate
docker-compose logs weaviate

# Logs du frontend
docker-compose logs frontend
```

## 🎉 Résultat Attendu

- **Temps de réponse** : 1-3 secondes
- **Disponibilité** : 99.9%
- **Scalabilité** : Plusieurs centaines d'utilisateurs
- **Coût** : 0€ (auto-hébergé)
