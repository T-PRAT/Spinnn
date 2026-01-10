 Bluetooth Architecture Documentation

Cette architecture Bluetooth est fortement inspirée de l'application [OK](https://github.com/oyvindro/ok), une application web pour cyclistes avec une gestion Bluetooth robuste.

## Vue d'ensemble

L'architecture est organisée en 3 couches :

```
┌─────────────────────────────────────────────────────────┐
│  Composables (useBluetoothHRM, useBluetoothTrainer)     │
│  - Interface Vue 3                                      │
│  - Gestion de l'état réactif                            │
│  - Abstraction de Connectable                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Connectable (utils/Connectable.js)                     │
│  - Gestion des connexions GATT                          │
│  - Auto-reconnect avec watchAdvertisements()            │
│  - Gestion des services et caractéristiques             │
│  - State machine (disconnected, connecting, etc.)       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Web Bluetooth API (navigator.bluetooth)                │
│  - requestDevice()                                      │
│  - getDevices()                                         │
│  - watchAdvertisements()                                │
└─────────────────────────────────────────────────────────┘
```

## Fichiers principaux

### 1. `src/utils/web-ble.js`
Utilitaires pour l'API Web Bluetooth :
- UUIDs des services et caractéristiques BLE
- Filtres pour requestDevice()
- Détection des capacités du navigateur
- Fonctions helper pour getDevices()

### 2. `src/utils/EventDispatcher.js`
Système d'événements pub/sub simple :
```javascript
import { xf } from '@/utils/EventDispatcher.js';

// Dispatcher des données
xf.dispatch('heartRate', { value: 120, timestamp: Date.now() });

// S'abonner à un événement
const unsub = xf.sub('heartRate', (data) => {
  console.log('HR:', data.value);
});

// Se désabonner
unsub();
```

### 3. `src/utils/Connectable.js`
Classe de base pour la gestion des connexions BLE :

**Propriétés clés :**
- `autoReconnect` : Reconnexion automatique sur déconnexion
- `reconnectDelay` : Délai avant tentative de reconnexion (ms)
- `reconnectTimeout` : Timeout pour watchAdvertisements (ms)

**Méthodes :**
- `connect({ requesting, watching, deviceId })` : Connexion à un appareil
- `disconnect()` : Déconnexion propre
- `cancelReconnect()` : Annuler l'auto-reconnect
- `cleanup()` : Nettoyage des ressources

### 4. Composables refactorisés

#### `useBluetoothHRM()`
```javascript
const hrm = useBluetoothHRM();

// Connexion avec auto-reconnect activé par défaut
await hrm.connect();

// Connexion sans auto-reconnect
await hrm.connect({ autoReconnect: false });

// Reconnexion manuelle au dernier appareil
await hrm.reconnect();

// Annuler l'auto-reconnect
hrm.cancelReconnect();

// Déconnexion
await hrm.disconnect();
```

**État exposé :**
- `heartRate` : Valeur actuelle du rythme cardiaque
- `isConnected` : État de connexion
- `isConnecting` : En cours de connexion
- `isReconnecting` : En cours de reconnexion
- `error` : Message d'erreur
- `deviceName` : Nom de l'appareil
- `status` : État détaillé (ConnectionStatus enum)

#### `useBluetoothTrainer()`
Même API que `useBluetoothHRM()`, mais avec :
- `power` : Puissance actuelle (W)
- `cadence` : Cadence (rpm)
- `speed` : Vitesse (m/s)

## Fonctionnalités clés

### Auto-Reconnect

L'auto-reconnect est activé par défaut et se déclenche automatiquement lors d'une déconnexion :

```javascript
// Mode 1 : Reconnexion directe (rapide si l'appareil est disponible)
// Mode 2 : watchAdvertisements() (attend que l'appareil réapparaisse)
```

### `getDevices()` - Appareils déjà appairés

Permet de se reconnecter à des appareils précédemment connectés sans demander à l'utilisateur :

```javascript
import { getPairedDevices } from '@/utils/web-ble.js';

const devices = await getPairedDevices();
console.log('Appareils appairés:', devices);
```

### Événements BLE

Toutes les données Bluetooth sont dispatchées via le système d'événements :

```javascript
// Événements de données
xf.dispatch('heartRate', { value: 120, timestamp: Date.now() });
xf.dispatch('power', { value: 250, timestamp: Date.now() });
xf.dispatch('cadence', { value: 90, timestamp: Date.now() });
xf.dispatch('speed', { value: 12.5, timestamp: Date.now() });

// Événements de connexion (hrm ou trainer)
xf.dispatch('hrm:status', ConnectionStatus.connected);
xf.dispatch('hrm:connected', { deviceId: '...', name: 'Polar H10' });
xf.dispatch('hrm:disconnected', { deviceId: '...', name: 'Polar H10' });
xf.dispatch('hrm:error', new Error('...'));
```

## Utilisation dans les composants

### Exemple : S'abonner aux données de rythme cardiaque

```vue
<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { xf } from '@/utils/EventDispatcher.js';

const heartRate = ref(0);

let unsub = null;

onMounted(() => {
  // S'abonner aux événements de rythme cardiaque
  unsub = xf.sub('heartRate', (data) => {
    heartRate.value = data.value;
    console.log('Timestamp:', data.timestamp);
  });
});

onUnmounted(() => {
  // Important : se désabonner pour éviter les fuites de mémoire
  if (unsub) {
    unsub();
  }
});
</script>

<template>
  <div>Heart Rate: {{ heartRate }} bpm</div>
</template>
```

### Exemple : Suivre l'état de connexion

```vue
<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { xf } from '@/utils/EventDispatcher.js';
import { ConnectionStatus } from '@/utils/Connectable.js';

const status = ref(ConnectionStatus.disconnected);
const statusText = ref('Disconnected');

const unsubscribers = [];

onMounted(() => {
  // S'abonner aux changements de statut HRM
  unsubscribers.push(
    xf.sub('hrm:status', (newStatus) => {
      status.value = newStatus;
      statusText.value = getStatusText(newStatus);
    })
  );
});

function getStatusText(status) {
  switch (status) {
    case ConnectionStatus.disconnected: return 'Disconnected';
    case ConnectionStatus.connecting: return 'Connecting...';
    case ConnectionStatus.connected: return 'Connected';
    case ConnectionStatus.reconnecting: return 'Reconnecting...';
    case ConnectionStatus.disconnecting: return 'Disconnecting...';
    default: return 'Unknown';
  }
}

onUnmounted(() => {
  unsubscribers.forEach(unsub => unsub());
});
</script>
```

## Compatibilité navigateur

### Requis
- **Chrome/Edge/Opera** : Support complet de Web Bluetooth
- **HTTPS** ou **localhost** : Requis par le navigateur

### Fonctionnalités spécifiques

| Fonctionnalité | Chrome 85+ | Notes |
|----------------|------------|-------|
| requestDevice() | ✅ | Requiert un geste utilisateur |
| getDevices() | ✅ | Liste les appareils appairés |
| watchAdvertisements() | ✅ | Auto-reconnect avancé |

### Linux

Sur Linux, Web Bluetooth nécessite d'activer un flag Chrome :
1. Ouvrir `chrome://flags/#enable-experimental-web-platform-features`
2. Activer "Experimental Web Platform features"
3. Redémarrer Chrome complètement

## Dépannage

### requestDevice() bloqué
**Cause** : Appelé en dehors d'un gestionnaire d'événement utilisateur
**Solution** : Déclencher depuis un clic/clavier/touche

### Déconnexions fréquentes
**Solution** : L'auto-reconnect gère ça automatiquement. Vérifiez les logs pour voir les tentatives.

### Plusieurs services sur un même appareil
**Solution** : Utiliser `optionalServices` dans le filtre `requestDevice()`

### Service non trouvé
**Cause** : L'appareil ne supporte pas ce service
**Solution** : Vérifier les UUIDs et utiliser les filtres appropriés

## Améliorations futures

Idées inspirées de OK :
- [ ] Contrôle du trainer (FTP, resistance, slope)
- [ ] Support Fitness Machine Service (FTMS) pour contrôle
- [ ] Gestion de multiple appareils du même type
- [ ] Sauvegarde des appareils appairés dans localStorage
- [ ] Indicateur de qualité du signal (RSSI)
- [ ] Gestion de la batterie des appareils

## Références

- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [OK - Cycling Workout App](https://github.com/oyvindro/ok)
- [Bluetooth GATT Specifications](https://www.bluetooth.com/specifications/gatt/)
