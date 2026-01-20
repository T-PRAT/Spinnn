# Quick Start - Strava Integration Sécurisée

Guide rapide pour démarrer avec l'intégration Strava sécurisée.

## 🎯 Architecture

- **Frontend (PWA)** → Vue 3 sur http://localhost:5173
- **Backend (API)** → Express sur http://localhost:3001
- **Strava API** → OAuth + Upload

Le backend garde le `client_secret` en sécurité et gère les tokens dans des sessions serveur.

## 📋 Prérequis

1. Node.js 18+ installé
2. Compte Strava
3. Application Strava créée sur https://www.strava.com/settings/api

## ⚡ Installation (2 minutes)

### Étape 1: Configuration Strava

1. Aller sur https://www.strava.com/settings/api
2. Créer une application:
   - **Callback Domain**: `localhost` (juste le domaine, rien d'autre)
3. Noter **Client ID** et **Client Secret**

### Étape 2: Backend

```bash
# Installer les dépendances
cd server
npm install

# Configurer l'environnement
cp .env.example .env

# Éditer server/.env avec vos vraies valeurs:
# STRAVA_CLIENT_ID=votre_client_id
# STRAVA_CLIENT_SECRET=votre_client_secret
# SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Démarrer le serveur
npm run dev
```

Le serveur démarre sur http://localhost:3001 ✅

### Étape 3: Frontend

```bash
# Dans un nouveau terminal, retour à la racine
cd ..

# Configurer l'environnement
cp .env.example .env.local

# Éditer .env.local:
# VITE_STRAVA_CLIENT_ID=votre_client_id
# VITE_API_URL=http://localhost:3001

# Démarrer le frontend
bun dev
```

L'app démarre sur http://localhost:5173 ✅

### Étape 4: Test

1. Ouvrir http://localhost:5173
2. Aller dans **Paramètres** → **Intégrations** → **Strava**
3. Cliquer sur **Connecter Strava**
4. Autoriser l'app sur Strava
5. Vous devriez être redirigé et voir "Connecté" ✅

## 🎮 Utilisation

1. **Faire un entraînement** sur la page principale
2. **Terminer l'entraînement**
3. **Page Summary**: Cliquer sur "Envoyer vers Strava"
4. Vérifier sur Strava que l'activité est bien uploadée! 🚴

## 🐛 Dépannage Express

### Backend ne démarre pas

```bash
cd server
npm install
npm run dev
```

Vérifier que le port 3001 n'est pas déjà utilisé:
```bash
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows
```

### Frontend ne se connecte pas au backend

1. Vérifier que le backend tourne sur http://localhost:3001
2. Vérifier `VITE_API_URL` dans `.env.local`
3. Ouvrir DevTools → Console pour voir les erreurs

### "Failed to check Strava status"

- Backend pas démarré → `cd server && npm run dev`
- CORS bloqué → Vérifier `FRONTEND_URL` dans `server/.env`

### Connexion Strava échoue

- Vérifier **Callback Domain** dans les settings Strava: doit être `localhost`
- Vérifier **Client ID** dans `.env.local` ET `server/.env`
- Vérifier **Client Secret** dans `server/.env`

## 📂 Structure des fichiers

```
Spinnn/
├── server/                 # Backend API (Express)
│   ├── index.js           # Serveur principal
│   ├── routes/strava.js   # Routes Strava
│   ├── .env               # Config serveur (SECRET!)
│   └── package.json
├── src/                    # Frontend (Vue)
│   └── composables/
│       └── useStrava.js   # Client Strava
├── .env.local             # Config frontend (SECRET!)
└── docs/
    └── STRAVA_SETUP_SECURE.md  # Doc complète
```

## 🔒 Sécurité

- ✅ `client_secret` reste sur le serveur
- ✅ Tokens dans session serveur (cookies httpOnly)
- ✅ `.env` et `server/.env` dans .gitignore
- ⚠️ Ne JAMAIS commit les fichiers `.env`

## 📚 Documentation Complète

Voir `docs/STRAVA_SETUP_SECURE.md` pour:
- Déploiement en production
- API endpoints détaillés
- Troubleshooting avancé
- Options de déploiement (Railway, Render, VPS)

## 💡 Commandes Utiles

```bash
# Backend
cd server
npm run dev        # Mode développement (auto-reload)
npm start          # Mode production

# Frontend
bun dev            # Développement
bun run build      # Build production
bun run preview    # Preview build

# Vérifier que tout fonctionne
curl http://localhost:3001/health
# → {"status":"ok","service":"spinnn-api"}

curl http://localhost:3001/api/strava/status
# → {"connected":false,"athlete":null}
```

## 🎉 Prêt!

Vous avez maintenant une intégration Strava sécurisée et prête pour la production! 🚀

Pour toute question, voir `docs/STRAVA_SETUP_SECURE.md` ou `server/README.md`.
