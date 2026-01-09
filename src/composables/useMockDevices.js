import { ref } from 'vue';

export function useMockDevices() {
  const heartRate = ref(0);
  const power = ref(0);
  const cadence = ref(0);
  const speed = ref(0);
  const isActive = ref(false);
  
  let intervalId = null;
  let time = 0;

  function start() {
    isActive.value = true;
    intervalId = setInterval(() => {
      time += 0.1;
      
      heartRate.value = Math.round(120 + Math.sin(time * 0.5) * 20);
      power.value = Math.round(200 + Math.sin(time * 0.3) * 50);
      cadence.value = Math.round(85 + Math.sin(time * 0.7) * 10);
      speed.value = 7.5 + Math.sin(time * 0.4) * 1.5;
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
    time = 0;
  }

  return {
    heartRate,
    power,
    cadence,
    speed,
    isActive,
    start,
    stop
  };
}
