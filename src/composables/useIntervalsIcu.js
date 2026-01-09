import { ref, readonly } from 'vue';

const API_BASE_URL = 'https://intervals.icu/api/v1';

// Singleton state
const apiKey = ref(null);
const athleteId = ref(null);
const isConnected = ref(false);

// Load from localStorage on module init
const storedApiKey = localStorage.getItem('spinnn_intervals_api_key');
const storedAthleteId = localStorage.getItem('spinnn_intervals_athlete_id');
if (storedApiKey && storedAthleteId) {
  apiKey.value = storedApiKey;
  athleteId.value = storedAthleteId;
  isConnected.value = true;
}

export function useIntervalsIcu() {
  function setCredentials(key, id) {
    apiKey.value = key;
    athleteId.value = id;
    isConnected.value = true;
    localStorage.setItem('spinnn_intervals_api_key', key);
    localStorage.setItem('spinnn_intervals_athlete_id', id);
  }

  function disconnect() {
    apiKey.value = null;
    athleteId.value = null;
    isConnected.value = false;
    localStorage.removeItem('spinnn_intervals_api_key');
    localStorage.removeItem('spinnn_intervals_athlete_id');
  }

  async function makeRequest(endpoint) {
    if (!apiKey.value) {
      throw new Error('API key not configured');
    }

    const auth = btoa(`API_KEY:${apiKey.value}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed. Please check your API key.');
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  async function getTodayWorkouts() {
    if (!athleteId.value) {
      throw new Error('Athlete ID not configured');
    }

    const today = new Date().toISOString().split('T')[0];
    const events = await makeRequest(`/athlete/${athleteId.value}/events?oldest=${today}&newest=${today}`);

    // Filter WORKOUT events with steps
    const workoutEvents = events.filter(event =>
      event.category === 'WORKOUT' &&
      event.start_date_local?.startsWith(today) &&
      event.workout_doc?.steps?.length > 0
    );

    if (workoutEvents.length === 0) {
      return [];
    }

    // Use workout_doc directly (already embedded)
    const validWorkouts = workoutEvents.map(event => ({
      ...event,
      workout: event.workout_doc
    }));

    // Convert all workouts to our format
    return validWorkouts.map(workout => convertIntervalsWorkout(workout));
  }

  function convertIntervalsWorkout(intervalsWorkout) {
    const intervals = [];
    let totalDuration = 0;

    console.log('=== Converting Intervals.icu workout ===');
    console.log('Workout:', intervalsWorkout.name);
    console.log('Steps:', intervalsWorkout.workout?.steps);

    // Parse workout steps if available
    if (intervalsWorkout.workout?.steps) {
      intervalsWorkout.workout.steps.forEach((step, index) => {
        console.log(`\nStep ${index}:`, step);

        // Handle repeat steps (contains sub-steps)
        if (step.steps && Array.isArray(step.steps)) {
          const repeat = step.reps || step.repeat || 1;
          console.log(`This is a REPEAT block, repeating ${repeat} times`);

          for (let r = 0; r < repeat; r++) {
            step.steps.forEach(subStep => {
              const processedInterval = processStep(subStep);
              if (processedInterval) {
                intervals.push(processedInterval);
                totalDuration += processedInterval.duration;
              }
            });
          }
        } else {
          // Regular step
          const processedInterval = processStep(step);
          if (processedInterval) {
            intervals.push(processedInterval);
            totalDuration += processedInterval.duration;
          }
        }
      });
    }

    const result = {
      id: `intervals-${intervalsWorkout.id}`,
      name: intervalsWorkout.name || 'Workout from Intervals.icu',
      description: intervalsWorkout.description || 'Imported from Intervals.icu',
      duration: totalDuration,
      difficulty: 'Custom',
      intervals: [...intervals], // Ensure it's a real array
      source: 'intervals.icu'
    };

    console.log('=== Final converted workout ===');
    console.log('Total duration:', totalDuration);
    console.log('Intervals count:', intervals.length);
    console.log('Is intervals array?', Array.isArray(intervals));
    console.log('Is result.intervals array?', Array.isArray(result.intervals));
    console.log('Full workout:', result);

    return result;
  }

  function processStep(step) {
    const duration = step.duration || 0;
    if (duration === 0) return null;

    let intervalData = {
      duration: duration
    };

    // Extract power from step (can be in power, watts, or power_low/high)
    // Handle both object format {value: X, units: "%"} and direct numbers
    const extractPower = (val) => {
      if (typeof val === 'object' && val !== null) {
        return val.value;
      }
      return val;
    };

    let power = extractPower(step.power) || extractPower(step.watts);
    let powerLow = extractPower(step.power_low) || power;
    let powerHigh = extractPower(step.power_high) || power;

    // For ramps, extract from power.low and power.high
    if (step.ramp && step.power && typeof step.power === 'object') {
      powerLow = extractPower(step.power.low) || powerLow;
      powerHigh = extractPower(step.power.high) || powerHigh;
      if (!power) power = (powerLow + powerHigh) / 2;
    }

    // Convert percentage values (like 67) to decimal (like 0.67)
    if (power && power > 2) power = power / 100;
    if (powerLow && powerLow > 2) powerLow = powerLow / 100;
    if (powerHigh && powerHigh > 2) powerHigh = powerHigh / 100;

    console.log(`Power: ${power}, Low: ${powerLow}, High: ${powerHigh}`);

    // Determine interval type
    const stepType = step.type || (step.ramp ? 'RAMP' : 'STEADY');

    if (stepType === 'WARMUP') {
      intervalData.type = 'warmup';
      intervalData.powerStart = powerLow || 0.5;
      intervalData.powerEnd = powerHigh || 0.7;
    } else if (stepType === 'COOLDOWN') {
      intervalData.type = 'cooldown';
      intervalData.powerStart = powerHigh || 0.7;
      intervalData.powerEnd = powerLow || 0.5;
    } else if (stepType === 'RAMP') {
      intervalData.type = 'ramp';
      intervalData.powerStart = powerLow || 0.5;
      intervalData.powerEnd = powerHigh || 0.7;
    } else if (stepType === 'REST' || stepType === 'RECOVERY') {
      intervalData.type = 'recovery';
      intervalData.power = power || 0.4;
    } else if (stepType === 'WORK') {
      intervalData.type = 'work';
      intervalData.power = power || 1.0;
    } else if (stepType === 'INTERVAL') {
      intervalData.type = power && power > 0.85 ? 'work' : 'steady';
      intervalData.power = power || 0.9;
    } else {
      // STEADY or no type specified
      intervalData.type = 'steady';
      intervalData.power = power || 0.7;
    }

    // Ensure we always have some power value
    if (!intervalData.power && !intervalData.powerStart) {
      intervalData.power = 0.7;
    }

    console.log('Converted interval:', intervalData);
    return intervalData;
  }

  return {
    isConnected: readonly(isConnected),
    apiKey: readonly(apiKey),
    athleteId: readonly(athleteId),
    setCredentials,
    disconnect,
    getTodayWorkouts
  };
}
