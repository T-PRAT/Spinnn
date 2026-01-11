export function parseHeartRateMeasurement(dataView) {
  const flags = dataView.getUint8(0);
  const heartRateFormat = flags & 0x01;

  let heartRate;
  if (heartRateFormat === 0) {
    heartRate = dataView.getUint8(1);
  } else {
    heartRate = dataView.getUint16(1, true);
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
  const flags = dataView.getUint16(0, true);
  
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
  
  const revDelta = currentRevs - lastRevs;
  let timeDelta = currentTime - lastTime;
  
  if (timeDelta < 0) {
    timeDelta += 65536;
  }
  
  if (timeDelta === 0) return 0;
  
  const cadence = (revDelta / timeDelta) * 1024 * 60;
  
  return Math.round(Math.max(0, Math.min(255, cadence)));
}

export function calculateSpeed(currentRevs, lastRevs, currentTime, lastTime, wheelCircumference = 2.105) {
  if (lastRevs === null || lastTime === null) return 0;
  
  const revDelta = currentRevs - lastRevs;
  let timeDelta = currentTime - lastTime;
  
  if (timeDelta < 0) {
    timeDelta += 65536;
  }
  
  if (timeDelta === 0) return 0;
  
  const distanceMeters = revDelta * wheelCircumference;
  const timeSeconds = timeDelta / 1024;
  const speedMps = distanceMeters / timeSeconds;
  
  return Math.max(0, speedMps);
}
