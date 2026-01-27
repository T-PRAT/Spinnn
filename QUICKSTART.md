# 🚀 Spinnn + Dokploy - Quick Start

Guide rapide pour déployer Spinnn avec backend sécurisé.

## 📦 Architecture

```
GitHub Repo (spinnn)
    ↓
   push
    ↓
┌──────────────┐
│   Dokploy    │  Déploiement auto
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│   Votre VPS      │
├──────────────────┤
│ 📱 Frontend      │  Vue + Vite (port 5173)
│ ⚙️ Backend       │  Hono + Bun (port 3001)
│ 🐳 Dokply        │  Interface (port 3000)
└──────────────────┘
```

## 🎯 En 5 minutes

### 1. Obtenir un VPS (2 min)

```bash
# DigitalOcean (le plus simple)
# https://www.digitalocean.com
# Choisissez: Droplet → Ubuntu 22.04 → $6/mois (1GB RAM)
# Créé → En 30 secondes c'est prêt
```

### 2. Installer Dokploy (1 min)

```bash
# SSH dans le VPS
ssh root@votre-ip

# Une seule commande !
curl -fsSL https://dokploy.com/install | sh
```

### 3. Connecter GitHub (30 secondes)

1. Ouvrez `http://votre-ip:3000`
2. Cliquez "Connect GitHub"
3. Sélectionnez le repo `spinnn`

### 4. Configurer et déployer (2 min)

1. Créez 2 apps dans Dokploy :
   - **Frontend**: Type: Vite, Port: 5173
   - **Backend**: Type: Bun, Port: 3001
2. Ajoutez vos identifiants Strava
3. Cliquez "Deploy"

### 5. Testez !

Ouvrez votre domaine et connectez Strava ✅

---

## 📝 Configuration Strava

### Dans Strava (https://www.strava.com/settings/api)

- **Application Name**: Spinnn
- **Category**: Cycling
- **Website**: https://votre-domaine.com
- **Callback Domain**: votre-domaine.com (sans http://)

### Dans Dokply (Backend → Environment Variables)

```
STRAVA_CLIENT_ID=123456
STRAVA_CLIENT_SECRET=abcdef123456
FRONTEND_URL=https://votre-domaine.com
```

---

## 💰 Coût total

| Item | Prix |
|------|------|
| VPS (512MB RAM) | $6/mois |
| Nom de domaine | $0-15/an (optionnel) |
| **Total** | **~$6/mois** |

---

## 🔄 Workflow quotidien

```bash
# Modifier du code
nvim src/components/StravaSettings.vue

# Commit et push
git add .
git commit -m "fix: better errors"
git push

# ☕️ Café...
# ✅ Déployé automatiquement !
```

---

## 📚 Documentation complète

- **Détails**: `DOKPLOY.md`
- **Backend**: `server/README.md`

---

**Need help?** Check `DOKPLOY.md` for troubleshooting! 🚀
