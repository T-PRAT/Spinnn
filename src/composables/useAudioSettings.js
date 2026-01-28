import { ref, readonly } from 'vue';

const STORAGE_KEYS = {
  ENABLED: 'spinnn_interval_sound_enabled',
  SELECTED: 'spinnn_selected_sound'
};

const intervalSoundEnabled = ref(true);
const selectedSound = ref('soft');

const storedEnabled = localStorage.getItem(STORAGE_KEYS.ENABLED);
if (storedEnabled !== null) intervalSoundEnabled.value = storedEnabled === 'true';

const storedSelected = localStorage.getItem(STORAGE_KEYS.SELECTED);
if (storedSelected) selectedSound.value = storedSelected;

export const availableSounds = [
  { id: 'none', name: 'Aucun', description: 'Désactiver' },
  { id: 'soft', name: 'Soft', description: 'Doux' },
  { id: 'beep', name: 'Classic High', description: 'Aigu' },
  { id: 'digital', name: 'Digital', description: 'Synthétique' }
];

const soundConfigs = {
  soft: { freq: 350, freqFinal: 550, wave: 'triangle', duration: 0.15, durationFinal: 0.25, volume: 0.25 },
  beep: { freq: 800, freqFinal: 1200, wave: 'sine', duration: 0.15, durationFinal: 0.225, volume: 0.3 },
  digital: { freq: 600, freqFinal: 1200, wave: 'square', duration: 0.1, durationFinal: 0.2, volume: 0.15 }
};

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playBeep(startTime, frequency, waveType, duration, volume) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = waveType;
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playCountdown(soundId) {
  const config = soundConfigs[soundId];
  if (!config) return;

  const now = getAudioContext().currentTime;

  playBeep(now, config.freq, config.wave, config.duration, config.volume);
  playBeep(now + 1.0, config.freq, config.wave, config.duration, config.volume);
  playBeep(now + 2.0, config.freq, config.wave, config.duration, config.volume);
  playBeep(now + 3.0, config.freqFinal, config.wave, config.durationFinal, config.volume);
}

export function useAudioSettings() {
  function setIntervalSoundEnabled(enabled) {
    intervalSoundEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEYS.ENABLED, enabled.toString());
  }

  function setSelectedSound(soundId) {
    selectedSound.value = soundId;
    localStorage.setItem(STORAGE_KEYS.SELECTED, soundId);
  }

  function playIntervalSound() {
    if (!intervalSoundEnabled.value || selectedSound.value === 'none') return;
    try {
      playCountdown(selectedSound.value);
    } catch (error) {
      console.error('Error playing interval sound:', error);
    }
  }

  function testSound(soundId) {
    const previous = selectedSound.value;
    selectedSound.value = soundId;
    playIntervalSound();
    selectedSound.value = previous;
  }

  return {
    intervalSoundEnabled: readonly(intervalSoundEnabled),
    selectedSound: readonly(selectedSound),
    availableSounds,
    setIntervalSoundEnabled,
    setSelectedSound,
    playIntervalSound,
    testSound
  };
}
