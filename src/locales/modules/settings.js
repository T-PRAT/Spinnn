export default {
  title: 'Paramètres',
  // Language
  language: {
    title: 'Langue',
    description: 'Choisissez la langue de l\'interface'
  },
  // Appearance
  appearance: {
    title: 'Apparence',
    darkMode: 'Mode sombre',
    darkModeDescription: 'Basculer entre le mode clair et sombre'
  },
  // Audio
  audio: {
    title: 'Sons d\'intervalle',
    description: 'Choisissez un son qui sera joué au début de chaque nouvel intervalle pendant l\'entraînement',
    test: 'Tester',
    sounds: {
      none: 'Aucun',
      noneDescription: 'Pas de son',
      ding: 'Ding',
      dingDescription: 'Son clair et bref',
      bell: 'Cloche',
      bellDescription: 'Son de cloche classique',
      chime: 'Carillon',
      chimeDescription: 'Son mélodique'
    }
  },
  // Athlete profile
  athlete: {
    title: 'Profil athlète',
    ftp: 'FTP (Functional Threshold Power)',
    ftpTooltip: 'Le FTP est la puissance maximale que vous pouvez maintenir pendant environ une heure. Il est utilisé pour calculer vos zones d\'entraînement et le TSS.',
    ftpUnit: 'watts',
    ftpSaved: 'Valeur actuelle sauvegardée',
    saveFTP: 'Enregistrer'
  },
  // Power zones
  zones: {
    title: 'Zones de puissance',
    description: 'Configurez vos zones de puissance en pourcentage de votre FTP',
    reset: 'Réinitialiser',
    save: 'Enregistrer les zones',
    z1: 'Z1 - Récupération',
    z2: 'Z2 - Endurance',
    z3: 'Z3 - Tempo',
    z4: 'Z4 - Seuil',
    z5: 'Z5 - VO2 Max',
    z6: 'Z6 - Puissance aérobie',
    z7: 'Z7 - Puissance anaérobie'
  },
  // Intervals.icu
  intervals: {
    title: 'Intervals.icu',
    description: 'Importez vos entraînements depuis Intervals.icu',
    connected: 'Connecté',
    disconnect: 'Déconnecter',
    apiKey: 'API Key',
    apiKeyPlaceholder: 'Votre clé API Intervals.icu',
    apiKeyHint: 'Générez une clé API dans les paramètres développeur d\'Intervals.icu',
    athleteId: 'Athlete ID',
    athleteIdPlaceholder: 'Votre ID athlète',
    athleteIdHint: 'Trouvez votre ID dans l\'URL de votre profil Intervals.icu',
    testButton: 'Tester et connecter',
    testing: 'Test en cours...',
    cancelButton: 'Annuler',
    errorFillFields: 'Veuillez remplir tous les champs',
    helpText: 'Pour obtenir votre clé API:',
    helpLink: 'Paramètres Intervals.icu',
    connectedMessage: 'Connecté à Intervals.icu'
  },
  // Export
  export: {
    title: 'Exporter les données',
    downloadCSV: 'Télécharger CSV',
    downloadFIT: 'Télécharger FIT'
  },
  // Statistics
  statistics: {
    title: 'Statistiques détaillées'
  }
};
