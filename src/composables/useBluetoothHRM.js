import { ref } from 'vue';
import { parseHeartRateMeasurement } from '../utils/bluetoothParser';

const HEART_RATE_SERVICE = 0x180D;
const HEART_RATE_MEASUREMENT = 0x2A37;

export function useBluetoothHRM() {
  const heartRate = ref(0);
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const error = ref(null);
  const deviceName = ref('');
  
  let device = null;
  let characteristic = null;

  async function connect() {
    if (!navigator.bluetooth) {
      error.value = 'Web Bluetooth API is not available in this browser.';
      return false;
    }

    try {
      isConnecting.value = true;
      error.value = null;

      device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE] }],
        optionalServices: [HEART_RATE_SERVICE]
      });

      deviceName.value = device.name || 'Unknown HR Monitor';

      device.addEventListener('gattserverdisconnected', handleDisconnection);

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(HEART_RATE_SERVICE);
      characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT);

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleHeartRateUpdate);

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

  function handleHeartRateUpdate(event) {
    const value = event.target.value;
    const { heartRate: hr, isContactDetected } = parseHeartRateMeasurement(value);
    
    if (isContactDetected) {
      heartRate.value = hr;
    }
  }

  function handleDisconnection() {
    isConnected.value = false;
    heartRate.value = 0;
  }

  function cleanup() {
    if (characteristic) {
      characteristic.removeEventListener('characteristicvaluechanged', handleHeartRateUpdate);
    }
    if (device) {
      device.removeEventListener('gattserverdisconnected', handleDisconnection);
    }
    isConnected.value = false;
    heartRate.value = 0;
  }

  return {
    heartRate,
    isConnected,
    isConnecting,
    error,
    deviceName,
    connect,
    disconnect
  };
}
