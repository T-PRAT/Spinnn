import { BLE_TIME_RESOLUTION, DEFAULT_WHEEL_CIRCUMFERENCE } from '@/constants/bluetooth';

export function parseHeartRateMeasurement(dataView) {
  if (dataView.byteLength < 2) return { heartRate: 0, isContactDetected: false, sensorContactSupported: false };
  const flags = dataView.getUint8(0);
  const heartRateFormat = flags & 0x01;

  let heartRate;
  if (heartRateFormat === 0) {
    heartRate = dataView.getUint8(1);
  } else {
    heartRate = dataView.byteLength >= 3 ? dataView.getUint16(1, true) : 0;
  }

  // Bits 1-2: Sensor Contact Status
  // 0 or 1 = Not supported
  // 2 = Supported, but contact is not detected
  // 3 = Supported and contact is detected
  const sensorContactStatus = (flags & 0x06) >> 1;
  const sensorContactSupported = sensorContactStatus >= 2;
  const isContactDetected = sensorContactStatus === 3;

  return {
    heartRate,
    isContactDetected,
    sensorContactSupported
  };
}

export function parseCyclingPowerMeasurement(dataView) {
  if (dataView.byteLength < 4) return { power: 0, crankRevolutions: null, lastCrankEventTime: null, wheelRevolutions: null, lastWheelEventTime: null };
  const flags = dataView.getUint16(0, true);
  const required = 4 + ((flags & 1) ? 1 : 0) + ((flags & 4) ? 2 : 0) + ((flags & 16) ? 6 : 0) + ((flags & 32) ? 4 : 0);
  if (dataView.byteLength < required) return { power: 0, crankRevolutions: null, lastCrankEventTime: null, wheelRevolutions: null, lastWheelEventTime: null };
  
  const hasPedalPowerBalance = (flags & 0x0001) !== 0;
  const hasTorque = (flags & 0x0004) !== 0;
  const hasCumulativeWheelRevolutions = (flags & 0x0010) !== 0;
  const hasCumulativeCrankRevolutions = (flags & 0x0020) !== 0;
  
  let offset = 2;
  const instantPower = dataView.getInt16(offset, true);
  offset += 2;
  
  let pedalPowerBalance = null;
  if (hasPedalPowerBalance) {
    pedalPowerBalance = dataView.getUint8(offset);
    offset += 1;
  }
  
  let accumulatedTorque = null;
  if (hasTorque) {
    accumulatedTorque = dataView.getUint16(offset, true);
    offset += 2;
  }
  
  let wheelRevolutions = null;
  let lastWheelEventTime = null;
  if (hasCumulativeWheelRevolutions) {
    wheelRevolutions = dataView.getUint32(offset, true);
    offset += 4;
    lastWheelEventTime = dataView.getUint16(offset, true);
    offset += 2;
  }
  
  let crankRevolutions = null;
  let lastCrankEventTime = null;
  if (hasCumulativeCrankRevolutions) {
    crankRevolutions = dataView.getUint16(offset, true);
    offset += 2;
    lastCrankEventTime = dataView.getUint16(offset, true);
    offset += 2;
  }
  
  return {
    power: Math.max(0, instantPower),
    crankRevolutions,
    lastCrankEventTime,
    wheelRevolutions,
    lastWheelEventTime
  };
}

export function calculateCadence(currentRevs, lastRevs, currentTime, lastTime) {
  if (lastRevs === null || lastTime === null) return 0;
  
  const revDelta = (currentRevs - lastRevs + 65536) % 65536;
  let timeDelta = currentTime - lastTime;
  
  if (timeDelta < 0) {
    timeDelta += 65536;
  }
  
  if (timeDelta === 0) return 0;
  
  const cadence = (revDelta / timeDelta) * BLE_TIME_RESOLUTION * 60;
  
  return Math.round(Math.max(0, Math.min(255, cadence)));
}

export function calculateSpeed(currentRevs, lastRevs, currentTime, lastTime, wheelCircumference = DEFAULT_WHEEL_CIRCUMFERENCE) {
  if (lastRevs === null || lastTime === null) return 0;

  const revDelta = currentRevs - lastRevs;
  let timeDelta = currentTime - lastTime;

  if (timeDelta < 0) {
    timeDelta += 65536;
  }

  if (timeDelta === 0) return 0;

  const distanceMeters = revDelta * wheelCircumference;
  const timeSeconds = timeDelta / BLE_TIME_RESOLUTION;
  const speedMps = distanceMeters / timeSeconds;

  return Math.max(0, speedMps);
}

/**
 * Calculate speed from power using physics-based approximation
 * Formula: speed ≈ (power / coefficient)^(1/3)
 * Default: 200W ≈ 33 km/h (realistic flat road for average cyclist)
 *
 * @param {number} power - Power in watts
 * @param {number} coefficient - Adjustment coefficient (default 0.25)
 * @returns {number} Speed in m/s
 */
export function calculateSpeedFromPower(power, coefficient = 0.25) {
  if (power <= 0) return 0;

  // Cubic approximation: speed = (power / coefficient)^(1/3)
  const speedMps = Math.pow(power / coefficient, 1/3);

  return Math.max(0, speedMps);
}

export function parseCSCMeasurement(data) {
  if (data.byteLength < 1) return null;
  const flags = data.getUint8(0), wheel = Boolean(flags & 1), crank = Boolean(flags & 2);
  if (data.byteLength < 1 + (wheel ? 6 : 0) + (crank ? 4 : 0)) return null;
  let offset = 1;
  const result = {};
  if (wheel) { result.wheelRevolutions = data.getUint32(offset, true); result.wheelTime = data.getUint16(offset + 4, true); offset += 6; }
  if (crank) { result.crankRevolutions = data.getUint16(offset, true); result.crankTime = data.getUint16(offset + 2, true); }
  return result;
}
