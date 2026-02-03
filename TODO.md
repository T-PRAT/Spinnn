# TODO
** [Home][Workout][Summary][Settings][General]**

## A
- [Summary] fix bad strava export
- [Summary] mettre bon sport (virtual ride)

## B
- [Workout] monter baisser la puissance de l'entrainement en cours
- [Workout] monter baisser la puissance de l'intervalle en cours
- [Summary] ajouter une image(graphique) a l'export
- [Summary] export strava
- [Summary] verifier .fit (appareil, activité...)
- [General] dashboard en mode paysage mobile
- [General] dashboard en mode paysage tablette
- [Workout] séparateur dans le graphique, surtout pour intervalles même zone
- [Workout] titre fenêtre - surtout attention pause
- [Settings] ouvrir settings modal dans le workout


## C
- [Workout] indication quel capteur connecté en séance
- [General] animation diverse
- [Summary] renommer l'activité au summary
- [Summary] ajouter RPE a la summary
- [Home] modifier les entrainements (sytaxe interval ?)
- [Settings] pouvoir connecter d'autre capteurs (core,)

## Fixes
- [General] Remplacer couleurs hardcodées par variables CSS
- [Workout] Fix ramp graphique dans mauvais sense
- [Settings] Vitesse très faible pour puissance

## IRL test TODO
- [Workout] bouton aller prochain intervalle
- [Workout] Drop dans la courbe de cadence inexpliqué
- [Workout] Pause auto trop rapide


## Done
- [Workout] meilleur sons intervalle
- [General] faire un logo
- [Workout] ajouter barre de progression de l'intervalle en cours
- [Workout] mettre P cible et Pmax en dessous puissance (et pareil pour FC)
- [General] customizer le dashboard
- [General] refonte dashboard
- [Workout] Changer FTP pendant séance ✓

## Ideas

## Tauri Desktop App (In Progress)
- [x] Initialize Tauri project
- [x] Create Bluetooth module structure (src-tauri/src/ble.rs)
- [x] Add platform detection utility (src/utils/platform.js)
- [x] Create Bluetooth factory composables for web/desktop abstraction
- [x] Update Vite config for Tauri compatibility
- [x] Add Tauri dev/build scripts to package.json
- [ ] Install system dependencies for Tauri on Linux:
  ```bash
  # Arch Linux
  sudo pacman -S webkit2gtk-4.1 libdbus openssl-dev
  ```
- [ ] Implement btleplug integration for native Bluetooth on desktop
- [ ] Test Bluetooth device discovery and connection
- [ ] Add event listeners for heart rate, power, and CSC data streaming
- [ ] Update existing components to use Bluetooth factory
- [ ] Test on Windows and macOS
- [ ] Create release builds for all platforms
