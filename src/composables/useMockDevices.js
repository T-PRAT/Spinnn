import { ref } from 'vue';

export function useMockDevices() {
  const heartRate = ref(0);
  const power = ref(0);
  const cadence = ref(0);
  const speed = ref(0);
  const isActive = ref(false);

  let intervalId = null;
  let targetPower = 200;
  let targetHR = 140;
  let currentPower = 200;
  let currentHR = 140;

  // Configuration for workout tracking
  let workout = null;
  let ftp = 200;
  let elapsedSeconds = 0;

  function setWorkout(workoutData, ftpValue) {
    workout = workoutData;
    ftp = ftpValue;
  }

  function getCurrentInterval() {
    if (!workout || !workout.intervals) {
      return { power: 0.7, type: 'steady' }; // Default 70% FTP
    }

    let accumulatedTime = 0;
    for (const interval of workout.intervals) {
      if (elapsedSeconds >= accumulatedTime && elapsedSeconds < accumulatedTime + interval.duration) {
        return interval;
      }
      accumulatedTime += interval.duration;
    }

    // If beyond workout, return last interval
    return workout.intervals[workout.intervals.length - 1] || { power: 0.5, type: 'cooldown' };
  }

  function updateTargets() {
    const interval = getCurrentInterval();

    // Calculate target power based on current interval
    let intervalPower = interval.power;
    if (intervalPower === undefined && interval.powerStart !== undefined && interval.powerEnd !== undefined) {
      // For ramps, interpolate between start and end
      const intervalElapsed = elapsedSeconds % interval.duration;
      const progress = intervalElapsed / interval.duration;
      intervalPower = interval.powerStart + (interval.powerEnd - interval.powerStart) * progress;
    }

    targetPower = Math.round((intervalPower || 0.7) * ftp);

    // Calculate target HR based on power intensity
    const intensity = (intervalPower || 0.7);
    if (intensity <= 0.55) {
      targetHR = 110 + intensity * 100; // Z1: 110-125 bpm
    } else if (intensity <= 0.75) {
      targetHR = 125 + (intensity - 0.55) * 75; // Z2: 125-140 bpm
    } else if (intensity <= 0.90) {
      targetHR = 140 + (intensity - 0.75) * 66; // Z3: 140-150 bpm
    } else if (intensity <= 1.05) {
      targetHR = 150 + (intensity - 0.90) * 80; // Z4: 150-162 bpm
    } else if (intensity <= 1.20) {
      targetHR = 162 + (intensity - 1.05) * 60; // Z5: 162-171 bpm
    } else {
      targetHR = 171 + (intensity - 1.20) * 30; // Z6: 171-180 bpm
    }

    targetHR = Math.round(targetHR);
  }

  function start(workoutData = null, ftpValue = 200) {
    if (workoutData) {
      setWorkout(workoutData, ftpValue);
    }

    isActive.value = true;
    elapsedSeconds = 0;

    // Initialize with first interval targets
    updateTargets();
    currentPower = targetPower;
    currentHR = targetHR;

    intervalId = setInterval(() => {
      elapsedSeconds += 0.1;

      // Update targets based on current interval
      updateTargets();

      // Smoothly transition power to target (realistic inertia)
      const powerDiff = targetPower - currentPower;
      currentPower += powerDiff * 0.05; // 5% adjustment per update = smooth transition

      // Smoothly transition HR to target (HR responds slower)
      const hrDiff = targetHR - currentHR;
      currentHR += hrDiff * 0.02; // 2% adjustment = HR lags behind power

      // Add small realistic variations (±2%)
      const powerVariation = (Math.random() - 0.5) * currentPower * 0.04;
      const hrVariation = (Math.random() - 0.5) * currentHR * 0.04;

      power.value = Math.max(0, Math.round(currentPower + powerVariation));
      heartRate.value = Math.max(60, Math.round(currentHR + hrVariation));

      // Cadence stays relatively stable around 85-90 rpm with small variation
      const baseCadence = 87;
      const cadenceVariation = (Math.random() - 0.5) * 6; // ±3 rpm
      cadence.value = Math.round(baseCadence + cadenceVariation);

      // Speed correlates with power (rough approximation)
      // Average: ~30W per km/h at steady state
      const baseSpeed = (currentPower / 30) + 5; // m/s
      const speedVariation = (Math.random() - 0.5) * 0.4;
      speed.value = Math.max(0, baseSpeed + speedVariation);

    }, 100);
  }

  function stop() {
    isActive.value = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    heartRate.value = 0;
    power.value = 0;
    cadence.value = 0;
    speed.value = 0;
    elapsedSeconds = 0;
    currentPower = 200;
    currentHR = 140;
  }

  return {
    heartRate,
    power,
    cadence,
    speed,
    isActive,
    start,
    stop,
    setWorkout
  };
}
