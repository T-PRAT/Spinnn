export default {
  title: 'Workout',
  predefined: 'Predefined Workouts',
  importFile: 'Import file',
  importZwo: '.ZWO Files',
  intervalsIntegration: 'Intervals.icu',
  intervalsToday: "(today's workout)",
  preview: 'Workout Preview',
  startButton: 'Start Workout',
  resumeButton: 'Resume Workout',
  newWorkoutButton: 'New Workout',
  inProgress: 'Workout in Progress',
  progress: 'Progress',
  completed: 'completed',
  skipToNext: 'Next Interval',
  stopConfirmation: 'Stop workout?',
  stopConfirmMessage: 'Are you sure you want to stop? Your data will be saved.',
  stopButton: 'Stop Workout',
  dismissButton: 'Dismiss and Restart',
  pedalToStart: 'Pedal to start',
  waitingForPedaling: 'Waiting for pedaling',
  // Intervals.icu messages
  intervalsNotConnected: 'Connect to Intervals.icu in',
  intervalsSettingsLink: 'settings',
  intervalsNotConnectedSuffix: 'to see today\'s workout',
  loading: 'Loading...',
  retry: 'Retry',
  noWorkoutToday: 'No workout today',
  // Categories
  categories: {
    endurance: 'Endurance',
    tempo: 'Tempo',
    vo2max: 'VO2 Max',
    test: 'Test'
  },
  // Summary messages
  summaryTitle: 'Workout Complete!',
  summaryComplete: 'completed',
  // Summary stats labels
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
  summaryNewWorkout: 'New Workout',
  // Setup view
  dismissAndRestart: 'Dismiss and Restart',
  selectWorkoutBelow: 'Select a workout above',
  connectSensorsOrSim: 'Connect your sensors or enable simulation mode',
  activateSimulation: 'Enable Simulation',
  goodSession: 'Good session!',
  // Workout names
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
      description: '3x10min @ 88% FTP - Lower threshold'
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
      description: '5x3min @ 120% FTP - Maximum intensity'
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
  // Interval names
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
  // Metrics
  powerLabel: 'Power',
  powerTarget: 'Target',
  powerMax: 'Max',
  powerInterval: 'Interval',
  powerAvg: 'Avg Power',
  powerNormalized: 'Normalized Power',
  heartRateLabel: 'HR',
  heartRateMax: 'Max',
  heartRateInterval: 'Interval',
  heartRateAvg: 'Avg HR',
  cadenceLabel: 'Cadence',
  cadenceAvg: 'Avg Cadence',
  speedLabel: 'Speed',
  distanceLabel: 'Distance',
  energyLabel: 'Energy',
  // Control modes
  controlModes: {
    erg: 'ERG',
    sim: 'SIM',
    res: 'RES',
    passive: 'OFF'
  },
  controlModeDescriptions: {
    erg: 'Target Power',
    sim: 'Grade Simulation',
    res: 'Fixed Resistance',
    passive: 'Free Ride'
  },
  // Interval progress text
  intervalPowerConnector: 'at',
  intervalPowerConnectorRamp: 'from',
  intervalPowerRangeTo: 'to',
  // Strava upload
  strava: {
    upload: 'Upload to Strava',
    uploading: 'Uploading...',
    success: 'Uploaded to Strava!',
    error: 'Upload failed',
    viewActivity: 'View on Strava',
    connect: 'Connect Strava'
  },
  // Power adjustments
  intervalLabel: 'Interval',
  globalLabel: 'Global',
  adjustCurrentUp: 'Increase this interval (+5%)',
  adjustCurrentDown: 'Decrease this interval (-5%)',
  adjustGlobalUp: 'Increase globally (+5%)',
  adjustGlobalDown: 'Decrease globally (-5%)',
  currentOffset: 'Interval offset',
  globalOffset: 'Global offset',
  // Free ride mode
  freeRide: {
    name: 'Free Ride',
    description: 'Ride freely without structured intervals',
    startButton: 'Start Free Ride',
    targetPower: 'Target Power',
    quickAdjust: 'Quick Adjust',
    adjustDown10: '-10W',
    adjustUp10: '+10W',
    adjustDown5: '-5W',
    adjustUp5: '+5W',
    setPower: 'Set Power',
    powerRange: '{min}W - {max}W',
    transitioned: '🚴 Free Ride Mode Activated',
    infinity: '∞',
  },
};
