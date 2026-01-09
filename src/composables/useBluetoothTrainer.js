import { ref } from 'vue';
import { parseCyclingPowerMeasurement, calculateCadence, calculateSpeed } from '../utils/bluetoothParser';

const CYCLING_POWER_SERVICE = 0x1818;
const CYCLING_POWER_MEASUREMENT = 0x2A63;

export function useBluetoothTrainer() {
  const power = ref(0);
  const cadence = ref(0);
  const speed = ref(0);
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const error = ref(null);
  const deviceName = ref('');
  
  let device = null;
  let characteristic = null;
  let lastCrankRevs = null;
  let lastCrankTime = null;
  let lastWheelRevs = null;
  let lastWheelTime = null;

  async function connect() {
    if (!navigator.bluetooth) {
      error.value = 'Web Bluetooth API is not available in this browser.';
      return false;
    }

    try {
      isConnecting.value = true;
      error.value = null;

      device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [CYCLING_POWER_SERVICE] }],
        optionalServices: [CYCLING_POWER_SERVICE]
      });

      deviceName.value = device.name || 'Unknown Trainer';

      device.addEventListener('gattserverdisconnected', handleDisconnection);

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(CYCLING_POWER_SERVICE);
      characteristic = await service.getCharacteristic(CYCLING_POWER_MEASUREMENT);

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handlePowerUpdate);

      isConnected.value = true;
      isConnecting.value = false;
      return true;
    } catch (err) {
      error.value = err.message;
      isConnecting.value = false;
      isConnected.value = false;
      return false;
    }
  }

  async function disconnect() {
    if (device && device.gatt.connected) {
      await device.gatt.disconnect();
    }
    cleanup();
  }

  function handlePowerUpdate(event) {
    const value = event.target.value;
    const data = parseCyclingPowerMeasurement(value);
    
    power.value = data.power;
    
    if (data.crankRevolutions !== null && data.lastCrankEventTime !== null) {
      if (lastCrankRevs !== null && lastCrankTime !== null) {
        cadence.value = calculateCadence(
          data.crankRevolutions,
          lastCrankRevs,
          data.lastCrankEventTime,
          lastCrankTime
        );
      }
      lastCrankRevs = data.crankRevolutions;
      lastCrankTime = data.lastCrankEventTime;
    }
    
    if (data.wheelRevolutions !== null && data.lastWheelEventTime !== null) {
      if (lastWheelRevs !== null && lastWheelTime !== null) {
        speed.value = calculateSpeed(
          data.wheelRevolutions,
          lastWheelRevs,
          data.lastWheelEventTime,
          lastWheelTime
        );
      }
      lastWheelRevs = data.wheelRevolutions;
      lastWheelTime = data.lastWheelEventTime;
    }
  }

  function handleDisconnection() {
    isConnected.value = false;
    power.value = 0;
    cadence.value = 0;
    speed.value = 0;
    lastCrankRevs = null;
    lastCrankTime = null;
    lastWheelRevs = null;
    lastWheelTime = null;
  }

  function cleanup() {
    if (characteristic) {
      characteristic.removeEventListener('characteristicvaluechanged', handlePowerUpdate);
    }
    if (device) {
      device.removeEventListener('gattserverdisconnected', handleDisconnection);
    }
    isConnected.value = false;
    power.value = 0;
    cadence.value = 0;
    speed.value = 0;
    lastCrankRevs = null;
    lastCrankTime = null;
    lastWheelRevs = null;
    lastWheelTime = null;
  }

  return {
    power,
    cadence,
    speed,
    isConnected,
    isConnecting,
    error,
    deviceName,
    connect,
    disconnect
  };
}
