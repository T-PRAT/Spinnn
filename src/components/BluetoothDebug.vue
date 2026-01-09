<script setup>
import { ref, onMounted } from 'vue';

const debugInfo = ref({
  protocol: '',
  hostname: '',
  hasNavigator: false,
  hasBluetooth: false,
  bluetoothType: '',
  userAgent: ''
});

onMounted(() => {
  debugInfo.value = {
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    hasNavigator: !!window.navigator,
    hasBluetooth: !!navigator.bluetooth,
    bluetoothType: typeof navigator.bluetooth,
    userAgent: navigator.userAgent
  };
});
</script>

<template>
  <details class="bg-muted p-4 rounded-lg text-xs">
    <summary class="cursor-pointer font-semibold text-foreground">Bluetooth Debug Info</summary>
    <div class="mt-3 space-y-1 text-muted-foreground font-mono">
      <div><strong class="text-foreground">Protocol:</strong> {{ debugInfo.protocol }}</div>
      <div><strong class="text-foreground">Hostname:</strong> {{ debugInfo.hostname }}</div>
      <div><strong class="text-foreground">Has Navigator:</strong> {{ debugInfo.hasNavigator }}</div>
      <div><strong class="text-foreground">Has Bluetooth:</strong> {{ debugInfo.hasBluetooth }}</div>
      <div><strong class="text-foreground">Bluetooth Type:</strong> {{ debugInfo.bluetoothType }}</div>
      <div class="text-xs break-all"><strong class="text-foreground">User Agent:</strong> {{ debugInfo.userAgent }}</div>
    </div>
  </details>
</template>
