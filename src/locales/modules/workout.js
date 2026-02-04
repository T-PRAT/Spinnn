export default {
  title: 'Entraînement',
  predefined: 'Entraînements prédéfinis',
  importFile: 'Importer un fichier',
  importZwo: 'Fichiers .ZWO',
  intervalsIntegration: 'Intervals.icu',
  intervalsToday: "(entraînement du jour)",
  preview: 'Aperçu de l\'entraînement',
  startButton: 'Démarrer l\'entraînement',
  resumeButton: 'Reprendre l\'entraînement',
  newWorkoutButton: 'Nouvel entraînement',
  inProgress: 'Entraînement en cours',
  progress: 'Progression',
  completed: 'terminé',
  skipToNext: 'Interval suivant',
  stopConfirmation: 'Arrêter l\'entraînement ?',
  stopConfirmMessage: 'Êtes-vous sûr de vouloir arrêter la séance ? Vos données seront sauvegardées.',
  stopButton: 'Arrêter la séance',
  dismissButton: 'Ignorer et recommencer',
  pedalToStart: 'Pédalez pour démarrer',
  waitingForPedaling: 'En attente de pédalage',
  // Intervals.icu messages
  intervalsNotConnected: 'Connectez-vous à Intervals.icu dans les',
  intervalsSettingsLink: 'paramètres',
  intervalsNotConnectedSuffix: 'pour voir votre entraînement du jour',
  loading: 'Chargement...',
  retry: 'Réessayer',
  noWorkoutToday: 'Pas d\'entraînement aujourd\'hui',
  // Categories
  categories: {
    endurance: 'Endurance',
    tempo: 'Tempo',
    vo2max: 'VO2 Max',
    test: 'Test'
  },
  // Summary messages
  summaryTitle: 'Entraînement terminé !',
  summaryComplete: 'terminé',
  // Summary stats labels
  summaryStats: {
    duration: 'Durée',
    distance: 'Distance',
    avgPower: 'Puissance moy.',
    avgHeartRate: 'FC moyenne',
    maxPower: 'Puissance max',
    maxHeartRate: 'FC max',
    avgCadence: 'Cadence moy.',
    normalizedPower: 'Puissance normalisée',
    intensityFactor: 'Facteur d\'intensité',
    tss: 'TSS'
  },
  summaryDetailedStats: 'Statistiques détaillées',
  summaryExportData: 'Exporter les données',
  summaryDownloadCSV: 'Télécharger CSV',
  summaryDownloadFIT: 'Télécharger FIT',
  summaryNewWorkout: 'Nouvel entraînement',
  // Setup view
  dismissAndRestart: 'Ignorer et recommencer',
  selectWorkoutBelow: 'Sélectionnez un entraînement ci-dessus',
  connectSensorsOrSim: 'Connectez vos capteurs ou activez le mode simulation',
  activateSimulation: 'Activer la simulation',
  goodSession: 'Bonne séance !',
  // Workout names
  workouts: {
    enduranceEasy: {
      name: 'Sortie facile',
      description: '45min @ 65% FTP - Récupération active'
    },
    enduranceModerate: {
      name: 'Endurance classique',
      description: '60min @ 70% FTP - Base aérobique'
    },
    enduranceLong: {
      name: 'Sortie longue',
      description: '90min @ 68% FTP - Endurance fondamentale'
    },
    tempoSweetSpot: {
      name: 'Sweet Spot',
      description: '3x10min @ 88% FTP - Seuil inférieur'
    },
    tempoThreshold: {
      name: 'Seuil continu',
      description: '2x20min @ 95% FTP - Travail au seuil'
    },
    tempoPyramid: {
      name: 'Pyramide tempo',
      description: '8-12-8min @ 90% FTP - Progression pyramidale'
    },
    vo2Classic: {
      name: 'VO2 classique',
      description: '5x3min @ 120% FTP - Intensité maximale'
    },
    vo2Short: {
      name: 'VO2 court',
      description: '8x2min @ 125% FTP - Intervalles courts'
    },
    vo2Long: {
      name: 'VO2 long',
      description: '4x4min @ 115% FTP - Intervalles prolongés'
    },
    testShort: {
      name: 'Test 3min',
      description: '3min - Rampe + intervalles pour tests'
    }
  },
  // Interval names
  intervals: {
    warmup: 'Échauffement',
    cooldown: 'Retour au calme',
    work: 'Travail',
    recovery: 'Récupération',
    rest: 'Repos',
    steady: 'Régime',
    ramp: 'Rampe',
    repeat: 'Répétition'
  },
  // Metrics
  powerLabel: 'Puissance',
  powerTarget: 'Cible',
  powerMax: 'Max',
  powerInterval: 'Tour',
  powerAvg: 'Puissance moy.',
  powerNormalized: 'Puissance normalisée',
  heartRateLabel: 'FC',
  heartRateMax: 'Max',
  heartRateInterval: 'Tour',
  heartRateAvg: 'FC moyenne',
  cadenceLabel: 'Cadence',
  cadenceAvg: 'Cadence moy.',
  speedLabel: 'Vitesse',
  distanceLabel: 'Distance',
  energyLabel: 'Énergie',
  // Control modes
  controlModes: {
    erg: 'ERG',
    sim: 'SIM',
    res: 'RES',
    passive: 'OFF'
  },
  controlModeDescriptions: {
    erg: 'Puissance cible',
    sim: 'Simulation pente',
    res: 'Résistance fixe',
    passive: 'Libre'
  },
  // Interval progress text
  intervalPowerConnector: 'à',
  intervalPowerConnectorRamp: 'de',
  intervalPowerRangeTo: 'à',
  // Strava upload
  strava: {
    upload: 'Envoyer vers Strava',
    uploading: 'Envoi en cours...',
    success: 'Envoyé vers Strava !',
    error: 'Erreur lors de l\'envoi',
    viewActivity: 'Voir sur Strava',
    connect: 'Connecter Strava'
  },
  // Power adjustments
  intervalLabel: 'Tour',
  globalLabel: 'Global',
  adjustCurrentUp: 'Augmenter ce tour (+5%)',
  adjustCurrentDown: 'Diminuer ce tour (-5%)',
  adjustGlobalUp: 'Augmenter globalement (+5%)',
  adjustGlobalDown: 'Diminuer globalement (-5%)',
  currentOffset: 'Ajustement tour',
  globalOffset: 'Ajustement global',
  // Free ride mode
  freeRide: {
    name: 'Sortie Libre',
    description: 'Roulez librement sans intervalles structurés',
    startButton: 'Démarrer Sortie Libre',
    targetPower: 'Puissance Cible',
    quickAdjust: 'Ajustement Rapide',
    adjustDown10: '-10W',
    adjustUp10: '+10W',
    adjustDown5: '-5W',
    adjustUp5: '+5W',
    setPower: 'Définir Puissance',
    powerRange: '{min}W - {max}W',
    transitioned: '🚴 Mode Libre activé',
    infinity: '∞',
  },
};
