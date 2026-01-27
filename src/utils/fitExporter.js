/**
 * FIT File Exporter
 * Creates valid FIT files for cycling activities using the Garmin FIT SDK
 */
import { Encoder } from '@garmin/fitsdk';

// Device identification for Spinnn
// Using development manufacturer (255) with unique product ID
// Strava can map this device: https://developers.strava.com/docs/uploads/#device-mapping
const DEVICE = {
  MANUFACTURER: 255, // Development (not registered with ANT+)
  PRODUCT: 1001,     // Unique ID for Spinnn
  SERIAL_NUMBER: 0x5350494E4E, // "SPINN" in hex
};

// Message numbers from FIT profile
const MESG_NUM = {
  FILE_ID: 0,
  SESSION: 18,
  RECORD: 20,
  LAP: 19,
  ACTIVITY: 34,
};

// Sport types
const SPORT = {
  CYCLING: 2,
};

// Sub-sport types
const SUB_SPORT = {
  INDOOR_CYCLING: 6,
};

// Event types
const EVENT = {
  SESSION: 8,
  LAP: 9,
  ACTIVITY: 26,
};

// Event type values
const EVENT_TYPE = {
  STOP: 1,
};

/**
 * Create a FIT file from workout session data
 * @param {Object} sessionData - Session data from useWorkoutSession
 * @param {Object} stats - Computed stats from SummaryView
 * @returns {Uint8Array} - Binary FIT file data
 */
export function createFitFile(sessionData, stats) {
  const encoder = new Encoder();

  const startTime = new Date(sessionData.startTime);
  const endTime = sessionData.endTime || new Date(startTime.getTime() + stats.durationSeconds * 1000);

  // 1. File ID Message (required, must be first)
  encoder.writeMesg({
    mesgNum: MESG_NUM.FILE_ID,
    type: 'activity',
    manufacturer: DEVICE.MANUFACTURER,
    product: DEVICE.PRODUCT,
    serialNumber: DEVICE.SERIAL_NUMBER,
    timeCreated: startTime,
  });

  // 2. Record Messages (one per data point)
  for (const point of sessionData.dataPoints) {
    const recordTime = new Date(startTime.getTime() + point.timestamp * 1000);

    encoder.writeMesg({
      mesgNum: MESG_NUM.RECORD,
      timestamp: recordTime,
      heartRate: point.heartRate > 0 ? point.heartRate : undefined,
      cadence: point.cadence > 0 ? point.cadence : undefined,
      power: point.power > 0 ? point.power : undefined,
      speed: point.speed > 0 ? point.speed : undefined,
      distance: point.distance > 0 ? point.distance : undefined,
    });
  }

  // 3. Lap Message (required for valid activity)
  encoder.writeMesg({
    mesgNum: MESG_NUM.LAP,
    timestamp: endTime,
    startTime: startTime,
    event: EVENT.LAP,
    eventType: EVENT_TYPE.STOP,
    sport: SPORT.CYCLING,
    subSport: SUB_SPORT.INDOOR_CYCLING,
    totalElapsedTime: stats.durationSeconds,
    totalTimerTime: stats.durationSeconds,
    totalDistance: stats.distanceMeters || 0,
    avgHeartRate: stats.avgHeartRate > 0 ? stats.avgHeartRate : undefined,
    maxHeartRate: stats.maxHeartRate > 0 ? stats.maxHeartRate : undefined,
    avgCadence: stats.avgCadence > 0 ? stats.avgCadence : undefined,
    avgPower: stats.avgPower > 0 ? stats.avgPower : undefined,
    maxPower: stats.maxPower > 0 ? stats.maxPower : undefined,
    normalizedPower: stats.normalizedPower > 0 ? stats.normalizedPower : undefined,
  });

  // 4. Session Message (summary of the session)
  encoder.writeMesg({
    mesgNum: MESG_NUM.SESSION,
    timestamp: endTime,
    startTime: startTime,
    event: EVENT.SESSION,
    eventType: EVENT_TYPE.STOP,
    sport: SPORT.CYCLING,
    subSport: SUB_SPORT.INDOOR_CYCLING,
    totalElapsedTime: stats.durationSeconds,
    totalTimerTime: stats.durationSeconds,
    totalDistance: stats.distanceMeters || 0,
    avgHeartRate: stats.avgHeartRate > 0 ? stats.avgHeartRate : undefined,
    maxHeartRate: stats.maxHeartRate > 0 ? stats.maxHeartRate : undefined,
    avgCadence: stats.avgCadence > 0 ? stats.avgCadence : undefined,
    avgPower: stats.avgPower > 0 ? stats.avgPower : undefined,
    maxPower: stats.maxPower > 0 ? stats.maxPower : undefined,
    normalizedPower: stats.normalizedPower > 0 ? stats.normalizedPower : undefined,
    firstLapIndex: 0,
    numLaps: 1,
  });

  // 5. Activity Message (container for sessions)
  encoder.writeMesg({
    mesgNum: MESG_NUM.ACTIVITY,
    timestamp: endTime,
    totalTimerTime: stats.durationSeconds,
    numSessions: 1,
    type: 0, // manual activity
    event: EVENT.ACTIVITY,
    eventType: EVENT_TYPE.STOP,
  });

  return encoder.close();
}
