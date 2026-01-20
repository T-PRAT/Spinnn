# Spinnn Backend API

Backend sécurisé pour l'intégration OAuth Strava de Spinnn.

## Pourquoi un backend ?

Le backend garde le `client_secret` Strava côté serveur, ce qui est beaucoup plus sécurisé que de l'exposer dans le bundle JavaScript du frontend.

**Architecture:**
```
Frontend (PWA) → Backend API → Strava API
```

## Installation

1. Installer les dépendances:
```bash
cd server
npm install
```

2. Configurer les variables d'environnement:
```bash
cp .env.example .env
```

3. Éditer `.env` avec vos vraies valeurs:
```bash
STRAVA_CLIENT_ID=votre_client_id
STRAVA_CLIENT_SECRET=votre_client_secret
SESSION_SECRET=une_chaine_aleatoire_longue
```

## Développement

Démarrer le serveur en mode développement (auto-reload):
```bash
npm run dev
```

Le serveur démarre sur http://localhost:3001

## Production

```bash
npm start
```

## API Endpoints

### `GET /health`
Health check du serveur

### `GET /api/strava/status`
Vérifier si l'utilisateur est connecté à Strava

**Response:**
```json
{
  "connected": true,
  "athlete": {
    "id": 12345,
    "username": "athlete",
    "firstname": "John",
    "lastname": "Doe"
  }
}
```

### `POST /api/strava/oauth/exchange`
Échanger le code d'autorisation contre un access token

**Body:**
```json
{
  "code": "authorization_code_from_strava",
  "state": "optional_state_parameter"
}
```

**Response:**
```json
{
  "success": true,
  "athlete": {
    "id": 12345,
    "username": "athlete",
    "firstname": "John",
    "lastname": "Doe"
  }
}
```

### `POST /api/strava/deauthorize`
Déconnecter de Strava

**Response:**
```json
{
  "success": true
}
```

### `POST /api/strava/upload`
Uploader un fichier FIT vers Strava

**Content-Type:** `multipart/form-data`

**Form fields:**
- `file` - Le fichier FIT
- `name` - Nom de l'activité
- `description` - Description (optionnel)
- `trainer` - 1 ou 0 (optionnel)
- `sport_type` - Type d'activité (optionnel)

**Response:**
```json
{
  "id": 123456,
  "id_str": "123456",
  "activity_id": null,
  "status": "Your activity is still being processed."
}
```

### `GET /api/strava/upload/:uploadId`
Vérifier le statut d'un upload

**Response:**
```json
{
  "id": 123456,
  "activity_id": 789012,
  "status": "Your activity is ready."
}
```

## Sécurité

- ✅ Client Secret reste côté serveur (jamais exposé au frontend)
- ✅ Tokens stockés dans la session serveur (httpOnly cookies)
- ✅ CORS configuré pour accepter uniquement le frontend
- ✅ Auto-refresh des tokens expirés
- ✅ Sessions sécurisées avec cookies httpOnly

## Déploiement

Le serveur peut être déployé sur:
- **Railway** - Déploiement facile avec Git
- **Render** - Service gratuit pour les petits projets
- **Vercel/Netlify** - Avec des Serverless Functions
- **VPS** - Avec PM2 pour la gestion des processus

### Variables d'environnement requises:
```
PORT=3001
NODE_ENV=production
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
SESSION_SECRET=...
FRONTEND_URL=https://votre-domaine.com
```

## Notes

- Le serveur utilise des sessions pour stocker les tokens Strava
- Par défaut, les sessions expirent après 30 jours
- En production, utilisez HTTPS et configurez `SESSION_SECRET`
- Les tokens Strava sont automatiquement rafraîchis quand ils expirent
