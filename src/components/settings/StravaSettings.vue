<script setup>
import { computed, onMounted } from 'vue';
import { useStrava } from '../../composables/useStrava';
import { useI18n } from '@/composables/useI18n';

const strava = useStrava();
const { t } = useI18n();

const stravaColor = '#FC4C02';
const stravaDarkColor = '#E03E01';

// Check connection status on mount
onMounted(async () => {
  await strava.checkStatus();
});

function handleConnect() {
  strava.connect();
}

function handleDisconnect() {
  strava.disconnect();
}

function toggleAutoUpload() {
  strava.setAutoUpload(!strava.autoUploadEnabled.value);
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- Strava Logo -->
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
        </svg>
        <div>
          <h3 class="text-lg font-semibold text-foreground">{{ t('settings.strava.title') }}</h3>
          <p class="text-sm text-muted-foreground">
            {{ t('settings.strava.description') }}
          </p>
        </div>
      </div>
      <div v-if="strava.isConnected.value" class="flex items-center gap-2">
        <span class="text-sm font-medium" style="color: #FC4C02">{{ t('settings.strava.connected') }}</span>
        <button
          @click="handleDisconnect"
          class="text-sm text-destructive hover:text-destructive/80 underline"
        >
          {{ t('settings.strava.disconnect') }}
        </button>
      </div>
    </div>

    <!-- Not connected state -->
    <div v-if="!strava.isConnected.value" class="p-6 bg-muted/50 rounded-lg text-center">
      <p class="text-sm text-muted-foreground mb-4">
        {{ t('settings.strava.helpText') }}
        <a href="https://developers.strava.com/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
          {{ t('settings.strava.helpLink') }}
        </a>
      </p>
      <button
        @click="handleConnect"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
        :style="{ backgroundColor: stravaColor }"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
        </svg>
        {{ t('settings.strava.connectButton') }}
      </button>
    </div>

    <!-- Connected state -->
    <div v-else class="space-y-4">
      <div class="p-4 rounded-lg" style="background-color: rgba(252, 76, 2, 0.1); border: 1px solid rgba(252, 76, 2, 0.2)">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 mt-0.5" style="color: #FC4C02" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <div>
            <p class="text-sm font-medium" style="color: #FC4C02">
              {{ t('settings.strava.connectedMessage') }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              {{ strava.username.value }} <span class="text-muted-foreground">(ID: {{ strava.athleteId.value }})</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Auto-upload toggle -->
      <div class="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div>
          <div class="text-sm font-medium text-foreground">{{ t('settings.strava.autoUpload') }}</div>
          <div class="text-xs text-muted-foreground mt-1">{{ t('settings.strava.autoUploadDescription') }}</div>
        </div>
        <button
          @click="toggleAutoUpload"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          :class="strava.autoUploadEnabled.value ? 'bg-primary' : 'bg-muted'"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            :class="strava.autoUploadEnabled.value ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
      </div>

      <!-- Strava info -->
      <div class="pt-2 border-t border-border">
        <p class="text-xs text-muted-foreground">
          {{ t('settings.strava.helpText') }}
          <a href="https://developers.strava.com/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
            {{ t('settings.strava.helpLink') }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>
