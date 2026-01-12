<script setup>
import { ref } from 'vue';
import { useIntervalsIcu } from '../../composables/useIntervalsIcu';

const intervals = useIntervalsIcu();

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
    error.value = 'Veuillez remplir tous les champs';
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
        <h3 class="text-lg font-semibold text-foreground">Intervals.icu</h3>
        <p class="text-sm text-muted-foreground">
          Importez vos entrainements depuis Intervals.icu
        </p>
      </div>
      <div v-if="intervals.isConnected.value" class="flex items-center gap-2">
        <span class="text-sm text-green-600 font-medium">Connecté</span>
        <button
          @click="handleDisconnect"
          class="text-sm text-destructive hover:text-destructive/80 underline"
        >
          Déconnecter
        </button>
      </div>
    </div>

    <div v-if="!intervals.isConnected.value || showForm" class="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div>
        <label class="block text-sm font-medium text-foreground mb-2">
          API Key
        </label>
        <input
          v-model="apiKeyInput"
          type="password"
          placeholder="Votre clé API Intervals.icu"
          class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p class="mt-1 text-xs text-muted-foreground">
          Générez une clé API dans les paramètres développeur d'Intervals.icu
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-foreground mb-2">
          Athlete ID
        </label>
        <input
          v-model="athleteIdInput"
          type="text"
          placeholder="Votre ID athlète"
          class="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p class="mt-1 text-xs text-muted-foreground">
          Trouvez votre ID dans l'URL de votre profil Intervals.icu
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
          {{ isTesting ? 'Test en cours...' : 'Tester et connecter' }}
        </button>
        <button
          v-if="intervals.isConnected.value"
          @click="toggleForm"
          class="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
        >
          Annuler
        </button>
      </div>

      <div class="pt-2 border-t border-border">
        <p class="text-xs text-muted-foreground">
          Pour obtenir votre clé API:
          <a href="https://intervals.icu/settings" target="_blank" class="text-primary hover:underline">
            Paramètres Intervals.icu
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
            Connecté à Intervals.icu
          </p>
          <p class="text-xs text-green-700 dark:text-green-200 mt-1">
            Athlete ID: {{ intervals.athleteId.value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
