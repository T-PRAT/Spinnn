<div align="center">

# ![Spinnn Logo](https://img.icons8.com/fluency/96/cycling-road.png) Spinnn

*A modern web application for cycling workouts*

[Vue 3](https://vuejs.org/) · [Tailwind CSS](https://tailwindcss.com/) · [D3.js](https://d3js.org/) · [Web Bluetooth](https://webbluetoothcg.github.io/web-bluetooth/)

</div>

---

## Pour Spinnn ?

Spinnn est une application web progressive pour exécuter des entraînements cyclistes avec suivi en temps réel. Connectez vos capteurs Bluetooth (cardiofrequencemètre, home trainer) et suivez votre puissance, fréquence cardiaque, cadence et vitesse pendant vos sessions.

### Fonctionnalités

- **Entraînements structurés** : Importez vos fichiers `.ZWO` ou synchronisez-vous avec [Intervals.icu](https://intervals.icu/)
- **Connexion Bluetooth** : Connectez vos appareils compatibles Web Bluetooth (HRM, power meter, smart trainer)
- **Suivi en temps réel** : Visualisez vos métriques avec des graphiques D3.js interactifs
- **Mode ERG** : Contrôlez votre home trainer en mode résistance automatique
- **Export FIT** : Exportez vos sessions vers Garmin Connect, Strava, TrainingPeaks, etc.
- **Mode simulation** : Développez et testez sans matériel Bluetooth
- **Thème clair/sombre** : Interface adaptée à vos préférences
- **Responsive** : Fonctionne sur desktop et mobile

---

## Pour les développeurs

### Prérequis

- Node.js `^20.19.0` ou `>=22.12.0`
- Un navigateur Chromium (Chrome, Edge) pour le Web Bluetooth

### Installation

```bash
# Installer les dépendances
bun install

# Lancer le serveur de développement
bun dev
```

L'application sera disponible sur `http://localhost:5173`

### Scripts utiles

```bash
bun dev              # Serveur de développement
bun run build        # Build de production
bun test             # Tests unitaires
bun test:e2e         # Tests E2E
bun test:coverage    # Couverture de code
```

### Stack technique

- Vue 3 (Composition API)
- Vite
- Vue Router
- Tailwind CSS v4
- D3.js
- Vitest + Playwright

### Note importante

Le Web Bluetooth API nécessite HTTPS ou `localhost`. Firefox ne supporte pas le Web Bluetooth.

---

<div align="center">

Made with :heart: for cyclists

</div>
