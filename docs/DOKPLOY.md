# 🚀 Déploiement Spinnn avec Dokploy

Guide complet pour déployer Spinnn (frontend + backend) sur votre propre VPS avec Dokploy.

## 🎯 Architecture cible

```
Votre VPS (DigitalOcean/Hetzner/OVH)
├── Dokply (port 3000)     # Interface web de déploiement
├── Spinnn Frontend       # Vue + Vite (port 5173)
└── Spinnn API             # Hono + Bun (port 3001)
```

## 📋 Prérequis

1. **Un VPS avec minimum 512MB RAM** (~$4-6/mois)
   - DigitalOcean: https://www.digitalocean.com (droplet)
   - Hetzner: https://www.hetzner.com (cloud server)
   - OVH: https://www.ovh.com (VPS)

2. **Nom de domaine** (optionnel mais recommandé)
   - Pointe vers l'IP de votre VPS

3. **Compte GitHub** avec le repo Spinnn

---

## 🔧 Étape 1: Préparer le VPS

### Se connecter au VPS

```bash
ssh root@ip-de-votre-vps
```

### Mettre à jour le système

```bash
apt update && apt upgrade -y
```

### Installer Docker et Docker Compose

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Installer Caddy (reverse proxy + HTTPS automatique)

```bash
# Add Caddy repository
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sS 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sS 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list

# Install Caddy
apt update
apt install caddy
```

---

## 🐳 Étape 2: Installer Dokploy

### Installer Docker Compose (si non inclus)

```bash
# Add Docker Compose repository
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d '"' -f 4)
curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-Linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Créer les dossiers nécessaires

```bash
mkdir -p /root/dokploy
```

### Lancer Dokploy

```bash
docker run -d \
  --name dokploy \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /root/dokploy:/app/data \
  dokploy/dokploy:latest
```

### Accéder à Dokply

Ouvrez votre navigateur: `http://ip-de-votre-vps:3000`

---

## ⚙️ Étape 3: Configuration dans Dokploy

### 3.1 Connecter votre compte GitHub

1. Cliquez sur **"Connect GitHub"**
2. Autorisez l'application Dokploy
3. Sélectionnez votre repo `spinnn`

---

### 3.2 Créer l'application Spinnn

Cliquez sur **"Create Application"** et configurez :

#### Frontend (Vue)
```
Name: spinnn-frontend
Repository: spinnn
Branch: main
Root Directory: /
Type: Vite
Build Command: bun install && bun run build
Start Command: bun run preview
Port: 5173
Environment Variables:
  - VITE_API_URL: https://spinnn-api.votre-domaine.com
Domains:
  - spinnn.votre-domaine.com
```

#### Backend (Hono)
```
Name: spinnn-api
Repository: spinnn
Branch: main
Root Directory: /server
Type: Bun
Build Command: bun install
Start Command: bun run start
Port: 3001
Working Directory: /server
Environment Variables:
  - STRAVA_CLIENT_ID: (votre_strava_client_id)
  - STRAVA_CLIENT_SECRET: (votre_strava_client_secret)
  - FRONTEND_URL: https://spinnn.votre-domaine.com
  - NODE_ENV: production
Domains:
  - spinnn-api.votre-domaine.com
```

---

## 🔐 Étape 4: Configurer Strava

### 4.1 Créer une application Strava

1. Allez sur https://www.strava.com/settings/api
2. Cliquez sur **"Create Application"**
3. Remplissez :
   - **Application Name**: Spinnn
   - **Category**: Cycling
   - **Website**: https://spinnn.votre-domaine.com
   - **Callback Domain**: votre-domaine.com
   - **Description**: Indoor cycling workout tracker

### 4.2 Récupérer les identifiants

Depuis la page de votre app Strava :
- **Client ID**: Copiez-le
- **Client Secret**: Cliquez sur "View" pour le voir

### 4.3 Ajouter dans Dokploy

Dans **spinnn-api → Environment Variables**:
```
STRAVA_CLIENT_ID=votre_client_id
STRAVA_CLIENT_SECRET=votre_client_secret
```

---

## 🌐 Étape 5: Configurer votre domaine

### Option A: Sans domaine (avec IP)

Dans Dokply, utilisez l'IP de votre VPS comme "domain" :
```
spinnn-api.123.45.67.89.nip.io
```

### Option B: Avec propre domaine

1. **Configurer DNS** chez votre registrar :
   - Ajouter un enregistrement A:
     ```
     spinnn → votre-ip-vps
     spinnn-api → votre-ip-vps
     ```

2. **Attendre la propagation DNS** (5-30 minutes)

3. **Configurer dans Dokply** avec votre vrai domaine

---

## 🚀 Étape 6: Premier déploiement

### Commit et push

```bash
git add .
git commit -m "feat: add Dokploy configuration for deployment"
git push origin main
```

### Dans Dokply

Cliquez sur **"Deploy"** pour chaque service (frontend puis backend).

**Attendez que les deux services soient "Running"** (point vert).

---

## 🎉 Étape 7: Tester le déploiement

### Vérifier les services

Ouvrez dans votre navigateur :
- Frontend: `https://spinnn.votre-domaine.com`
- API: `https://spinnn-api.votre-domaine.com`

### Tester l'API

```bash
curl https://spinnn-api.votre-domaine.com/
# Doit retourner: { "status": "ok", "service": "spinnn-api", ... }
```

### Tester Strava

Dans le frontend :
1. Allez dans **Settings → Integrations → Strava**
2. Cliquez sur **"Connecter Strava"**
3. Autorisez l'app
4. Vérifiez que vous êtes connecté

---

## 🔄 Workflow de développement

### Mettre à jour l'application

```bash
# Faire vos changements
nvim src/components/StravaSettings.vue

# Commiter
git add .
git commit -m "fix: improve Strava error handling"

# Push
git push
```

**Dokply détecte automatiquement** et redéploie !

### Types de changements

| Changement | Ce qui se passe |
|-----------|----------------|
| Frontend modifié | Seulement le frontend est rebuildé |
| Backend modifié | Seulement le backend est rebuildé |
| Les deux | Les deux sont rebuildés en parallèle |
| .env changé | Le service correspondant est redémarré |

---

## 📊 Monitoring

### Voir les logs

Dans Dokply, cliquez sur **"Logs"** pour un service.

### Redémarrer un service

Dans Dokply, cliquez sur **"Restart"** pour un service.

### Mise à jour

```bash
git pull  # Sur le VPS si besoin
```

Dokploy gère ça automatiquement depuis GitHub.

---

## 🛡️ Sécurité

### HTTPS automatique

Caddy configure automatiquement les certificats SSL Let's Encrypt pour vos domaines.

### Firewall

```bash
# Ouvrir les ports nécessaires
ufw allow 80
ufw allow 443
ufw allow 22
ufw enable
```

### Mettre à jour régulièrement

```bash
# Sur le VPS
apt update && apt upgrade -y

# Mise à jour de Dokploy (clic sur "Update" dans l'interface)
```

---

## 💰 Coût mensuel estimé

| Service | Coût |
|---------|------|
| **VPS 512MB** | $4-6/mois |
| **Domaine** | $10-15/an (si acheté) |
| **Dokploy** | GRATUIT |
| **Électricité** | ~$0.50-1/mois |
| **TOTAL** | **~$6/mois** |

---

## 🐛 Problèmes courants

### Dokply ne se lance pas

```bash
# Vérifier que Docker tourne
docker ps | grep dokploy

# Vérifier les logs
docker logs dokploy
```

### Le frontend ne trouve pas l'API

Vérifiez `VITE_API_URL` dans les variables d'environnement du frontend dans Dokply.

### Strava OAuth échoue

1. Vérifiez que `STRAVA_CLIENT_ID` et `STRAVA_CLIENT_SECRET` sont corrects
2. Vérifiez le Callback Domain dans l'app Strava (doit être votre domaine)

### Erreur CORS

Vérifiez que `FRONTEND_URL` dans le backend inclut bien votre domaine frontend.

---

## 📚 Ressources

- **Dokply**: https://dokploy.com
- **Documentation**: https://github.com/Dokploy/dokploy
- **DigitalOcean**: https://www.digitalocean.com
- **Hono**: https://hono.dev
- **Bun**: https://bun.sh

---

## 🎯 Résultat

Après configuration, vous avez :

- ✅ **Déploiement automatique** depuis GitHub
- ✅ **HTTPS gratuit** avec Let's Encrypt
- ✅ **Frontend + Backend** sur le même VPS
- ✅ **Zero downtime** lors des déploiements
- **✅ Coût : ~$5/mois total**
- ✅ **Contrôle total** sur votre infrastructure

**Profitez de votre application cycliste self-hostée !** 🚴‍♂️
