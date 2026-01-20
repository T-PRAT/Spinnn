import common from './modules/common.js';
import navigation from './modules/navigation.js';
import workout from './modules/workout.js';
import metrics from './modules/metrics.js';
import device from './modules/device.js';
import settings from './modules/settings.js';

export default {
  common: {
    buttons: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      skip: 'Skip',
      test: 'Test',
      refresh: 'Refresh',
      download: 'Download',
      upload: 'Upload',
      connect: 'Connect',
      disconnect: 'Disconnect',
      reconnect: 'Reconnect',
      start: 'Start',
      stop: 'Stop',
      pause: 'Pause',
      resume: 'Resume',
      reset: 'Reset',
      enable: 'Enable',
      disable: 'Disable'
    },
    states: {
      loading: 'Loading...',
      connected: 'Connected',
      disconnected: 'Disconnected',
      connecting: 'Connecting',
      reconnecting: 'Reconnecting...',
      enabled: 'Enabled',
      disabled: 'Disabled',
      active: 'Active',
      inactive: 'Inactive',
      ready: 'Ready',
      notReady: 'Not ready'
    },
    labels: {
      name: 'Name',
      description: 'Description',
      duration: 'Duration',
      difficulty: 'Difficulty',
      category: 'Category',
      power: 'Power',
      heartRate: 'Heart Rate',
      cadence: 'Cadence',
      speed: 'Speed',
      distance: 'Distance',
      energy: 'Energy',
      target: 'Target',
      max: 'Max',
      average: 'Average',
      interval: 'Lap',
      remainingTime: 'Remaining Time',
      elapsedTime: 'Elapsed Time'
    },
    difficulties: {
      easy: 'Easy',
      moderate: 'Moderate',
      hard: 'Hard'
    },
    messages: {
      goodSession: 'Have a great session!',
      workoutComplete: 'Workout complete!',
      selectWorkout: 'Select a workout',
      connectSensors: 'Connect your sensors',
      enableSimulation: 'Enable simulation'
    }
  },
  navigation: {
    home: 'Home',
    workout: 'Workout',
    history: 'History',
    settings: 'Settings'
  },
  workout: {
    title: 'Workout',
    predefined: 'Predefined workouts',
    importFile: 'Import a file',
    importZwo: '.ZWO files',
    intervalsIntegration: 'Intervals.icu',
    intervalsToday: "(today's workout)",
    preview: 'Workout preview',
    startButton: 'Start workout',
    resumeButton: 'Resume workout',
    newWorkoutButton: 'New workout',
    inProgress: 'Workout in progress',
    progress: 'Progress',
    completed: 'complete',
    skipToNext: 'Next interval',
    stopConfirmation: 'Stop workout?',
    stopConfirmMessage: 'Are you sure you want to stop this session? Your data will be saved.',
    stopButton: 'Stop session',
    dismissButton: 'Dismiss and restart',
    pedalToStart: 'Pedal to start',
    waitingForPedaling: 'Waiting for pedaling',
    intervalsNotConnected: 'Connect to Intervals.icu in',
    intervalsSettingsLink: 'settings',
    intervalsNotConnectedSuffix: 'to see your today\'s workout',
    loading: 'Loading...',
    retry: 'Retry',
    noWorkoutToday: 'No workout today',
    categories: {
      endurance: 'Endurance',
      tempo: 'Tempo',
      vo2max: 'VO2 Max',
      test: 'Test'
    },
    summaryTitle: 'Workout complete!',
    summaryComplete: 'complete',
    summaryStats: {
      duration: 'Duration',
      distance: 'Distance',
      avgPower: 'Avg Power',
      avgHeartRate: 'Avg HR',
      maxPower: 'Max Power',
      maxHeartRate: 'Max HR',
      avgCadence: 'Avg Cadence',
      normalizedPower: 'Normalized Power',
      intensityFactor: 'Intensity Factor',
      tss: 'TSS'
    },
    summaryDetailedStats: 'Detailed Statistics',
    summaryExportData: 'Export Data',
    summaryDownloadCSV: 'Download CSV',
    summaryDownloadFIT: 'Download FIT',
    summaryNewWorkout: 'New workout',
    dismissAndRestart: 'Dismiss and restart',
    selectWorkoutBelow: 'Select a workout above',
    connectSensorsOrSim: 'Connect your sensors or enable simulation mode',
    activateSimulation: 'Enable simulation',
    goodSession: 'Have a great session!',
    workouts: {
      enduranceEasy: {
        name: 'Easy Ride',
        description: '45min @ 65% FTP - Active recovery'
      },
      enduranceModerate: {
        name: 'Classic Endurance',
        description: '60min @ 70% FTP - Aerobic base'
      },
      enduranceLong: {
        name: 'Long Ride',
        description: '90min @ 68% FTP - Fundamental endurance'
      },
      tempoSweetSpot: {
        name: 'Sweet Spot',
        description: '3x10min @ 88% FTP - Below threshold'
      },
      tempoThreshold: {
        name: 'Continuous Threshold',
        description: '2x20min @ 95% FTP - Threshold work'
      },
      tempoPyramid: {
        name: 'Tempo Pyramid',
        description: '8-12-8min @ 90% FTP - Pyramid progression'
      },
      vo2Classic: {
        name: 'Classic VO2',
        description: '5x3min @ 120% FTP - Max intensity'
      },
      vo2Short: {
        name: 'Short VO2',
        description: '8x2min @ 125% FTP - Short intervals'
      },
      vo2Long: {
        name: 'Long VO2',
        description: '4x4min @ 115% FTP - Extended intervals'
      },
      testShort: {
        name: '3min Test',
        description: '3min - Ramp + intervals for testing'
      }
    },
    intervals: {
      warmup: 'Warmup',
      cooldown: 'Cooldown',
      work: 'Work',
      recovery: 'Recovery',
      rest: 'Rest',
      steady: 'Steady',
      ramp: 'Ramp',
      repeat: 'Repeat'
    },
    powerLabel: 'Power',
    powerTarget: 'Target',
    powerMax: 'Max',
    powerInterval: 'Lap',
    powerAvg: 'Avg Power',
    powerNormalized: 'Normalized Power',
    heartRateLabel: 'HR',
    heartRateMax: 'Max',
    heartRateInterval: 'Lap',
    heartRateAvg: 'Avg HR',
    cadenceLabel: 'Cadence',
    cadenceAvg: 'Avg Cadence',
    speedLabel: 'Speed',
    distanceLabel: 'Distance',
    energyLabel: 'Energy',
    controlModes: {
      erg: 'ERG',
      sim: 'SIM',
      res: 'RES',
      passive: 'OFF'
    },
    controlModeDescriptions: {
      erg: 'Target power',
      sim: 'Grade simulation',
      res: 'Fixed resistance',
      passive: 'Free ride'
    },
    intervalPowerConnector: 'at',
    strava: {
      upload: 'Upload to Strava',
      uploading: 'Uploading...',
      success: 'Uploaded to Strava!',
      error: 'Upload failed',
      viewActivity: 'View on Strava',
      connect: 'Connect Strava'
    }
  },
  metrics: {
    power: 'Power',
    heartRate: 'HR',
    cadence: 'Cadence',
    speed: 'Speed',
    distance: 'Distance',
    energy: 'Energy',
    intervalPower: 'Lap Power',
    intervalHeartRate: 'Lap HR',
    intervalRemainingTime: 'Time Remaining',
    elapsedTime: 'Elapsed Time',
    avgPower: 'Avg Power',
    avgHeartRate: 'Avg HR',
    avgCadence: 'Avg Cadence',
    watts: 'W',
    bpm: 'bpm',
    rpm: 'rpm',
    kmh: 'km/h',
    km: 'km',
    kcal: 'kcal',
    duration: 'Duration',
    distanceFull: 'Distance',
    avgPowerFull: 'Avg Power',
    avgHeartRateFull: 'Avg HR',
    maxPower: 'Max Power',
    maxHeartRate: 'Max HR',
    avgCadenceFull: 'Avg Cadence',
    normalizedPower: 'Normalized Power',
    intensityFactor: 'Intensity Factor',
    tss: 'TSS'
  },
  device: {
    title: 'Devices',
    bluetoothNotAvailable: 'Bluetooth not available',
    bluetoothNotAvailableHint: 'Use Chrome/Edge on HTTPS or localhost',
    heartRateMonitor: 'Heart Rate Monitor (HRM)',
    smartTrainer: 'Smart Trainer',
    mockMode: 'Simulation mode',
    mockHRM: 'Mock HR Monitor',
    mockTrainer: 'Mock Smart Trainer',
    connectHRM: 'Connect HRM',
    connectTrainer: 'Connect Trainer',
    connecting: 'Connecting',
    disconnect: 'Disconnect',
    reconnect: 'Reconnect to last device',
    reconnecting: 'Reconnecting...',
    autoReconnect: 'Attempting auto-reconnect',
    cancelReconnect: 'Cancel reconnect',
    connectionFailed: 'Connection failed',
    powerLabel: 'Power',
    cadenceLabel: 'Cadence',
    speedLabel: 'Speed'
  },
  settings: {
    title: 'Settings',
    navigation: {
      preferences: 'Preferences',
      athlete: 'Athlete',
      integrations: 'Integrations'
    },
    preferences: {
      title: 'Preferences',
      description: 'Language, appearance and sounds'
    },
    language: {
      title: 'Language',
      description: 'Choose your interface language'
    },
    appearance: {
      title: 'Appearance',
      darkMode: 'Dark mode',
      darkModeDescription: 'Toggle between light and dark mode'
    },
    audio: {
      title: 'Interval Sounds',
      description: 'Choose a sound to play at the beginning of each new interval during your workout',
      test: 'Test',
      sounds: {
        none: 'None',
        noneDescription: 'No sound',
        ding: 'Ding',
        dingDescription: 'Clear, brief sound',
        bell: 'Bell',
        bellDescription: 'Classic bell sound',
        chime: 'Chime',
        chimeDescription: 'Melodic sound'
      }
    },
    athlete: {
      title: 'Athlete Profile',
      ftp: 'FTP (Functional Threshold Power)',
      ftpTooltip: 'FTP is the maximum power you can maintain for about an hour. It is used to calculate your training zones and TSS.',
      ftpUnit: 'watts',
      ftpSaved: 'Currently saved value',
      saveFTP: 'Save'
    },
    athleteProfile: {
      description: 'FTP and power zones'
    },
    integrations: {
      title: 'Integrations',
      description: 'Intervals.icu and Strava'
    },
    zones: {
      title: 'Power Zones',
      description: 'Configure your power zones as a percentage of your FTP',
      reset: 'Reset',
      save: 'Save zones',
      z1: 'Z1 - Recovery',
      z2: 'Z2 - Endurance',
      z3: 'Z3 - Tempo',
      z4: 'Z4 - Threshold',
      z5: 'Z5 - VO2 Max',
      z6: 'Z6 - Aerobic Power',
      z7: 'Z7 - Anaerobic Power'
    },
    intervals: {
      title: 'Intervals.icu',
      description: 'Import your workouts from Intervals.icu',
      connected: 'Connected',
      disconnect: 'Disconnect',
      apiKey: 'API Key',
      apiKeyPlaceholder: 'Your Intervals.icu API key',
      apiKeyHint: 'Generate an API key in your Intervals.icu developer settings',
      athleteId: 'Athlete ID',
      athleteIdPlaceholder: 'Your athlete ID',
      athleteIdHint: 'Find your ID in your Intervals.icu profile URL',
      testButton: 'Test and connect',
      testing: 'Testing...',
      cancelButton: 'Cancel',
      errorFillFields: 'Please fill in all fields',
      helpText: 'To get your API key:',
      helpLink: 'Intervals.icu Settings',
      connectedMessage: 'Connected to Intervals.icu'
    },
    strava: {
      title: 'Strava',
      description: 'Upload your workouts to Strava',
      connected: 'Connected',
      disconnect: 'Disconnect',
      connectButton: 'Connect Strava',
      connecting: 'Connecting...',
      connectedMessage: 'Connected as',
      autoUpload: 'Auto-upload',
      autoUploadDescription: 'Automatically upload each workout to Strava',
      sportType: 'Activity Type',
      sportTypeDescription: 'Choose the activity type for your workouts',
      helpText: 'To connect Strava, create an application on',
      helpLink: 'Strava Developers',
      processing: 'Processing authorization...',
      connectSuccess: 'Successfully connected to Strava!',
      successTitle: 'Success!',
      oauthError: 'OAuth authorization failed',
      connectError: 'Failed to connect to Strava',
      missingParams: 'Missing authorization parameters',
      errorTitle: 'Connection Failed',
      redirecting: 'Redirecting to settings...',
      errorNoRefreshToken: 'No refresh token available',
      errorNotConnected: 'Not connected to Strava',
      errorInvalidState: 'Invalid OAuth state'
    },
    export: {
      title: 'Export Data',
      downloadCSV: 'Download CSV',
      downloadFIT: 'Download FIT'
    },
    statistics: {
      title: 'Detailed Statistics'
    }
  }
};
