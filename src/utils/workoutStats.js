// Zero watts are valid samples; missing HR/cadence are excluded.
export function calculateWorkoutStats(points, ftp = 200, activeDuration) {
  const weight = p => Number.isFinite(p.duration) ? p.duration : 1;
  const duration = activeDuration ?? points.reduce((sum, p) => sum + weight(p), 0);
  const average = (key, excludeZero = false) => {
    let total = 0, seconds = 0;
    for (const p of points) {
      if (!Number.isFinite(p[key]) || (excludeZero && p[key] <= 0)) continue;
      total += p[key] * weight(p); seconds += weight(p);
    }
    return seconds ? total / seconds : 0;
  };
  const maximum = key => points.reduce((max, p) => Math.max(max, p[key] || 0), 0);
  const window = [];
  let windowSeconds = 0, windowWork = 0, fourthPower = 0, windows = 0;
  for (const p of points) {
    let remaining = weight(p);
    while (remaining > 0) {
      const seconds = Math.min(1, remaining);
      window.push({ seconds, power: p.power || 0 });
      windowSeconds += seconds; windowWork += (p.power || 0) * seconds;
      while (windowSeconds > 30 + 1e-8) {
        const first = window[0];
        const removed = Math.min(first.seconds, windowSeconds - 30);
        windowSeconds -= removed; windowWork -= first.power * removed;
        first.seconds -= removed;
        if (first.seconds < 1e-8) window.shift();
      }
      if (windowSeconds >= 30 - 1e-8) {
        fourthPower += (windowWork / 30) ** 4 * seconds; windows += seconds;
      }
      remaining -= seconds;
    }
  }
  const normalizedPower = windows ? (fourthPower / windows) ** 0.25 : 0;
  const intensityFactor = ftp > 0 ? normalizedPower / ftp : 0;
  const workKj = points.reduce((sum, p) => sum + (p.power || 0) * weight(p), 0) / 1000;
  return {
    durationSeconds: duration, distanceMeters: points.at(-1)?.distance || 0,
    avgPower: Math.round(average('power')), maxPower: maximum('power'),
    avgHeartRate: Math.round(average('heartRate', true)), maxHeartRate: maximum('heartRate'),
    avgCadence: Math.round(average('cadence', true)), avgSpeed: average('speed'), maxSpeed: maximum('speed'),
    workKj: Math.round(workKj),
    // Metabolic estimate at 24% gross efficiency; UI displays measured mechanical work.
    totalCalories: Math.round(workKj / (4.184 * 0.24)),
    normalizedPower: Math.round(normalizedPower), intensityFactor,
    trainingStressScore: Math.round(duration / 3600 * intensityFactor ** 2 * 100),
  };
}
