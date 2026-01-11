import { ref, readonly } from 'vue';

// Singleton state - shared across all components
const intervalSoundEnabled = ref(true);
const selectedSound = ref('beep'); // 'beep', 'bell', 'chirp', 'none'

// Load settings from localStorage on module init
const storedSoundEnabled = localStorage.getItem('spinnn_interval_sound_enabled');
if (storedSoundEnabled !== null) {
  intervalSoundEnabled.value = storedSoundEnabled === 'true';
}

const storedSelectedSound = localStorage.getItem('spinnn_selected_sound');
if (storedSelectedSound) {
  selectedSound.value = storedSelectedSound;
}

// Available sounds configuration
const availableSounds = [
  { id: 'none', name: 'Aucun son', description: 'Désactiver les sons d\'intervalle' },
  { id: 'beep', name: 'Bip simple', description: 'Un bip court et clair' },
  { id: 'bell', name: 'Cloche', description: 'Son de cloche doux' },
  { id: 'chirp', name: 'Chirp', description: 'Son ascendant rapide' },
  { id: 'triple', name: 'Triple bip', description: 'Trois bips rapides' }
];

// Audio context (lazy initialization)
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

// Sound generation functions using Web Audio API
function playBeep() {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
}

function playBell() {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = 1200;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
}

function playChirp() {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.setValueAtTime(400, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
}

function playTriple() {
  const beepTimes = [0, 0.15, 0.3];
  beepTimes.forEach(time => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 900;
    oscillator.type = 'sine';

    const startTime = ctx.currentTime + time;
    gainNode.gain.setValueAtTime(0.25, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.1);
  });
}

export function useAudioSettings() {
  function setIntervalSoundEnabled(enabled) {
    intervalSoundEnabled.value = enabled;
    localStorage.setItem('spinnn_interval_sound_enabled', enabled.toString());
  }

  function setSelectedSound(soundId) {
    selectedSound.value = soundId;
    localStorage.setItem('spinnn_selected_sound', soundId);
  }

  function playIntervalSound() {
    if (!intervalSoundEnabled.value || selectedSound.value === 'none') {
      return;
    }

    try {
      switch (selectedSound.value) {
        case 'beep':
          playBeep();
          break;
        case 'bell':
          playBell();
          break;
        case 'chirp':
          playChirp();
          break;
        case 'triple':
          playTriple();
          break;
      }
    } catch (error) {
      console.error('Error playing interval sound:', error);
    }
  }

  function testSound(soundId) {
    const previousSound = selectedSound.value;
    selectedSound.value = soundId;
    playIntervalSound();
    selectedSound.value = previousSound;
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
