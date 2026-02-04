<script setup>
import { ref, watch, onMounted } from 'vue';
import { useStorage } from '@/composables/useStorage';
import { DEFAULT_FTP } from '@/constants/zones';

const storage = useStorage();

const ftp = ref(storage.getFtp());
const showTooltip = ref(false);

const emit = defineEmits(['update:ftp']);

onMounted(() => {
  emit('update:ftp', ftp.value);
});

watch(ftp, (newValue) => {
  if (newValue > 0 && storage.setFtp(newValue)) {
    emit('update:ftp', newValue);
  }
});

function handleInput(event) {
  const value = parseInt(event.target.value, 10);
  if (!isNaN(value) && value > 0) {
    ftp.value = value;
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <label for="ftp" class="text-sm font-medium text-gray-700">FTP:</label>
    <input
      id="ftp"
      type="number"
      :value="ftp"
      @input="handleInput"
      min="1"
      step="1"
      class="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <span class="text-sm text-gray-700">W</span>
    <button
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      type="button"
      class="text-gray-400 hover:text-gray-600"
    >
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>
    <div
      v-if="showTooltip"
      class="absolute mt-20 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg max-w-xs z-10"
    >
      FTP (Functional Threshold Power) is the maximum power you can sustain for approximately one hour.
    </div>
  </div>
</template>
