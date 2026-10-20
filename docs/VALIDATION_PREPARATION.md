# Préparer sa séance — validation (ZWO, Intervals.icu, FTP)

Sujet backlog : « [A][02][Préparer sa séance] Fiabiliser ZWO, Intervals.icu et la FTP ».
Rédigé le 20/10/2026. Ce document consigne ce qui a été vérifié, comment, et ce qui ne l'a **pas** été.

## Périmètre

Préparation et import uniquement : import ZWO, récupération Intervals.icu, FTP et calcul des cibles.
Rien n'a été modifié côté dashboard de séance, Bluetooth, Strava, export FIT ou exécution.

## État constaté avant correction (commit de départ)

| Sujet | Constat | Preuve |
| --- | --- | --- |
| ZWO | Les blocs `IntervalsT` (répétitions) étaient ignorés en silence | Séance de test de 2 760 s importée à 1 680 s (5 intervalles au lieu de 11) |
| ZWO | Nom toujours « Custom Workout » (lu au mauvais endroit) | Idem |
| ZWO | Fichier corrompu accepté comme séance vide de 0 s, sans erreur ; `alert()` en anglais sinon | Sonde navigateur sur le commit de départ |
| Intervals.icu | Format lu : `step.type`, `power.low/high`. Le vrai format utilise les drapeaux `warmup` / `cooldown` / `ramp` et `power: {value \| start+end, units}` | Documentation Intervals.icu (voir « Sources ») |
| Intervals.icu | Unités ignorées : des watts (`250 w`) étaient pris pour des % ; répétitions imbriquées ignorées ; étapes sans durée supprimées en silence | Revue de code |
| Intervals.icu | « Aujourd'hui » calculé en UTC : la veille entre 00 h et 02 h à Paris | Test unitaire en échec avec l'ancienne logique (`Received "2026-10-19"`) |
| Intervals.icu | Une panne réseau pendant le test de connexion effaçait les identifiants saisis ; messages bruts (« Failed to fetch ») | Revue de code |
| FTP | Enregistrée seulement par le bouton ; un test smoke existant (saisie + sortie du champ) échouait : attendu `250`, reçu `200` | `smoke.spec.js` sur le commit de départ |
| FTP | Aucune borne ; un décimal divergeait entre mémoire (`250.5`) et stockage (`250`) | Revue de code |

## Ce qui a été corrigé

- **ZWO** (`src/utils/zwoParser.js`, `src/components/workout/ZwoImport.vue`) : Warmup, Cooldown, Ramp, SteadyState, IntervalsT (aplati en travail / récupération avec cadence), nom et description du fichier, cadence. Refus explicites : XML invalide, XML qui n'est pas une séance, bloc non pris en charge (nommé), valeur manquante ou hors bornes (bloc et attribut nommés), séance non vélo, fichier > 1 Mo. Le champ fichier est vidé après chaque essai.
- **Intervals.icu** (`src/utils/intervalsWorkout.js`, `src/composables/useIntervalsIcu.js`, `IntervalsTodayWorkout.vue`, `IntervalsSettings.vue`) : format réel, unités `%ftp` et `w`, répétitions imbriquées, rampes, fourchettes (milieu), cadence, jour local, délai de 15 s, erreurs typées (authentification, limite de débit, serveur, réseau, délai, réponse illisible). Les séances du jour non importables sont listées avec leur raison, au lieu d'être masquées ou déformées. Les identifiants ne sont enregistrés qu'après vérification réussie.
- **FTP** (`src/utils/ftp.js`, `FtpSettings.vue`, `useStorage.js`, `useAppState.js`) : enregistrée à la validation du champ (Entrée, sortie) comme au clic, entier entre 50 et 600 W, message d'erreur et de confirmation, valeur corrompue → 200 W.

## Preuves

Commandes (depuis la racine du worktree) :

```bash
bun test tests/unit                                  # 31 tests, aussi sous TZ=Europe/Paris
bunx playwright test tests/e2e/preparation.spec.js   # 22 tests, API Intervals.icu simulée
bun run build
```

Résultats du 20/10/2026 : 31 / 31 tests unitaires, 22 / 22 tests navigateur (Chromium desktop, locale fr-FR), build réussi.

- Les tests ont été éprouvés par mutation : retirer l'enregistrement au `change` de la FTP fait échouer 2 tests ; revenir à `toISOString()` fait échouer le test de date.
- **Fichiers ZWO réels** : 46 fichiers publics (GitHub : `bdcheung/zwift_workouts`, `robiningelbrecht/zwift-workouts`), téléchargés hors du dépôt et **non commités**. 40 importés, avec une durée identique à un calcul indépendant (Python) pour les 40. Les 6 refusés le sont pour des motifs voulus : 4 contiennent un bloc `FreeRide`, 1 un palier en plage `PowerLow ≠ PowerHigh` (0,90 → 1,05), 1 un test par paliers allant jusqu'à `Power="6"` (600 % de la FTP, au-delà de la borne de 500 %). Ce corpus a révélé deux défauts de la première version, corrigés : `SteadyState` écrit avec `PowerLow`/`PowerHigh` égaux (1 501 blocs sur 1 504) et sprints jusqu'à 400 % de la FTP.
- **API réelle Intervals.icu, sans compte** : une clé invalide renvoie bien `401` ; la préflight CORS depuis `http://localhost:5173` est acceptée pour l'en-tête `Authorization`.
- Rendu vérifié sur captures (erreurs ZWO et Intervals.icu, séance importée, erreur FTP).
- Fixtures utilisables à la main : `tests/fixtures/zwo/`, `tests/fixtures/intervals/today-events.json`.

Tests smoke historiques (`tests/e2e/smoke.spec.js`) : 3 échecs avant, 2 après. « Settings - FTP configuration » est réparé ; « navigation flow » et « Mock Mode » échouaient déjà (sélecteurs « Exemple » / « Mock » périmés), hors périmètre.

## Limites — non validé

- **Aucune séance Intervals.icu réelle n'a été récupérée** : pas d'identifiants disponibles. Le format est validé d'après la documentation officielle, des exemples publiés et des réponses simulées. À faire avec un compte réel : une séance structurée, une séance avec répétitions, une rampe, un jour sans séance, une clé volontairement fausse.
- Pas d'essai sur tablette Android ni sur un autre navigateur que Chromium desktop. Le sélecteur de fichiers Android accepte-t-il `.zwo` ? (le champ déclare aussi `application/xml` / `text/xml` par prudence.)
- Le vidage du champ fichier ne peut pas être éprouvé par Playwright (il déclenche toujours `change`) : seule la réinitialisation est vérifiée, pas le comportement du vrai navigateur.
- Pas de validation sur du matériel : les cibles sont vérifiées dans les données et l'aperçu, pas à la consigne ERG.
- `FreeRide`, `MaxEffort`, étape Intervals.icu en roue libre, en distance, cardio ou allure : **refusés** avec message (décision à confirmer, voir ci-dessous).
- Durées décimales ZWO arrondies à la seconde par bloc.
- Un palier Intervals.icu en watts absolus est converti en fraction de la FTP de Spinnn à l'import : si la FTP change après l'import, relancer la récupération (elle se refait à chaque ouverture de l'accueil).
- Unités Intervals.icu `%mmp`, zones de puissance, cardio, allure : non prises en charge (séance refusée avec raison).

## Points hors périmètre, à traiter ailleurs

- **Plafond d'exécution** : `getAdjustedTargetPowerAtTime` (`src/data/sampleWorkouts.js`) borne la consigne à `min(1,5 × FTP ; 2 000 W)` et au minimum 50 W. Un palier importé à 200 % serait piloté à 150 %. À arbitrer par le sujet Bluetooth/ERG.
- `src/components/layout/FTPInput.vue` n'est importé nulle part (code mort avec couleurs codées en dur).

## Besoins sur des fichiers partagés

- Les messages sont dans `src/utils/preparationMessages.js` (fr/en) pour ne pas toucher à `src/locales/`. À migrer plus tard dans un module de traductions (`preparation.*`).
- Modifs minimales dans des fichiers que d'autres peuvent toucher : `SetupView.vue` (bloc d'import remplacé par `<ZwoImport />`, correction de `intervals.isConnected.value`), `SettingsView.vue` (bloc FTP remplacé par `<FtpSettings />`), `useStorage.js` (bloc FTP seul), `useAppState.js` (`setFtp` seul). `App.vue`, configuration, dépendances et traductions communes n'ont pas été modifiés.

## Sources

- Documentation et OpenAPI : <https://intervals.icu/api-docs.html>, <https://intervals.icu/api/v1/docs>
- « Downloading planned workouts from the API » et exemples `workout_doc` du forum Intervals.icu
- Référence communautaire du format ZWO : <https://github.com/h4l/zwift-workout-file-reference> (`PowerLow` = début de bloc, y compris pour un `Cooldown`)
