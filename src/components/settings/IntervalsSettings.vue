<script setup>
import { ref } from 'vue';
import { useIntervalsIcu } from '../../composables/useIntervalsIcu';
import { useI18n } from '@/composables/useI18n';

const intervals = useIntervalsIcu();
const { t } = useI18n();

const showForm = ref(!intervals.isConnected.value);
const apiKeyInput = ref('');
const athleteIdInput = ref('');
const error = ref('');
const isTesting = ref(false);

function toggleForm() {
  showForm.value = !showForm.value;
  error.value = '';
}

async function testConnection() {
  if (!apiKeyInput.value || !athleteIdInput.value) {
    error.value = t('settings.intervals.errorFillFields');
    return;
  }

  isTesting.value = true;
  error.value = '';

  try {
    // Save credentials temporarily to test
    intervals.setCredentials(apiKeyInput.value, athleteIdInput.value);

    // Try to fetch today's workouts to verify connection
    await intervals.getTodayWorkouts();

    showForm.value = false;
    apiKeyInput.value = '';
    athleteIdInput.value = '';
  } catch (err) {
    error.value = err.message;
    intervals.disconnect();
  } finally {
    isTesting.value = false;
  }
}

function handleDisconnect() {
  intervals.disconnect();
  showForm.value = true;
  apiKeyInput.value = '';
  athleteIdInput.value = '';
  error.value = '';
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-foreground">{{ t('settings.intervals.title') }}</h3>
        <p class="text-sm text-muted-foreground">
          {{ t('settings.intervals.description') }}
        </p>
      </div>
      <div v-if="intervals.isConnected.value" class="flex items-center gap-2">
        <span class="text-sm text-green-600 font-medium">{{ t('settings.intervals.connected') }}</span>
        <button
          @click="handleDisconnect"
          class="text-sm text-destructive hover:text-destructive/80 underline"
        >
          {{ t('settings.intervals.disconnect') }}
        </button>
      </div>
    </div>

    <div v-if="!intervals.isConnected.value || showForm" class="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div>
        <label class="block text-sm font-medium text-foreground mb-2">
          {{ t('settings.intervals.apiKey') }}
        </label>
        <input
          v-model="apiKeyInput"
          type="password"
          :placeholder="t('settings.intervals.apiKeyPlaceholder') || ''"
          class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p class="mt-1 text-xs text-muted-foreground">
          {{ t('settings.intervals.apiKeyHint') }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-2">
          {{ t('settings.intervals.athleteId') }}
        </label>
        <input
          v-model="athleteIdInput"
          type="text"
          :placeholder="t('settings.intervals.athleteIdPlaceholder') || ''"
          class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p class="mt-1 text-xs text-muted-foreground">
          {{ t('settings.intervals.athleteIdHint') }}
        </p>
      </div>

      <div v-if="error" class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p class="text-sm text-destructive">{{ error }}</p>
      </div>

      <div class="flex gap-2">
        <button
          @click="testConnection"
          :disabled="isTesting"
          class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isTesting ? t('settings.intervals.testing') : t('settings.intervals.testButton') }}
        </button>
        <button
          v-if="intervals.isConnected.value"
          @click="toggleForm"
          class="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
        >
          {{ t('common.buttons.cancel') }}
        </button>
      </div>

      <div class="pt-2 border-t border-border">
        <p class="text-xs text-muted-foreground">
          {{ t('settings.intervals.helpText') }}
          <a href="https://intervals.icu/settings" target="_blank" class="text-primary hover:underline">
            {{ t('settings.intervals.helpLink') }}
          </a>
          → Developer Settings
        </p>
      </div>
    </div>

    <div v-else-if="intervals.isConnected.value" class="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="text-sm font-medium text-green-900 dark:text-green-100">
            {{ t('settings.intervals.connectedMessage') }}
          </p>
          <p class="text-xs text-green-700 dark:text-green-200 mt-1">
            Athlete ID: {{ intervals.athleteId.value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
