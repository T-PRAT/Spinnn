<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppState } from '../composables/useAppState';
import { useTheme } from '../composables/useTheme';

const router = useRouter();
const appState = useAppState();
const theme = useTheme();

const localFtp = ref(200);
const showTooltip = ref(false);

onMounted(() => {
  localFtp.value = appState.ftp.value;
});

function saveFtp() {
  if (localFtp.value > 0) {
    appState.setFtp(localFtp.value);
  }
}

function goBack() {
  router.back();
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="flex items-center gap-4 mb-8">
      <button
        @click="goBack"
        class="p-2 hover:bg-accent rounded-lg transition-colors"
      >
        <svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 class="text-2xl font-bold text-foreground tracking-tight">Parametres</h2>
    </div>

    <!-- Theme Toggle -->
    <div class="bg-card rounded-lg p-6 shadow border border-border">
      <h3 class="text-lg font-semibold text-foreground mb-4">Apparence</h3>
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-medium text-foreground">Mode sombre</div>
          <div class="text-xs text-muted-foreground mt-1">Basculer entre le mode clair et sombre</div>
        </div>
        <button
          @click="theme.toggleTheme()"
          :class="[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            theme.isDark.value ? 'bg-primary' : 'bg-muted'
          ]"
        >
          <span
            :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              theme.isDark.value ? 'translate-x-6' : 'translate-x-1'
            ]"
          />
        </button>
      </div>
    </div>

    <!-- FTP Settings -->
    <div class="bg-card rounded-lg p-6 shadow border border-border">
      <div class="flex items-center gap-2 mb-4">
        <h3 class="text-lg font-semibold text-foreground">Profil athlete</h3>
      </div>

      <div class="space-y-4">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <label for="ftp" class="text-sm font-medium text-foreground">
              FTP (Functional Threshold Power)
            </label>
            <button
              @mouseenter="showTooltip = true"
              @mouseleave="showTooltip = false"
              type="button"
              class="text-muted-foreground hover:text-foreground relative"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div
                v-if="showTooltip"
                class="absolute left-6 top-0 w-64 p-3 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border z-10"
              >
                Le FTP est la puissance maximale que vous pouvez maintenir pendant environ une heure.
                Il est utilise pour calculer vos zones d'entrainement et le TSS.
              </div>
            </button>
          </div>
          <div class="flex items-center gap-3">
            <input
              id="ftp"
              type="number"
              v-model.number="localFtp"
              min="1"
              max="500"
              class="w-32 px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-lg text-foreground"
            />
            <span class="text-muted-foreground">watts</span>
            <button
              @click="saveFtp"
              class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
            >
              Enregistrer
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            Valeur actuelle sauvegardee : {{ appState.ftp.value }}W
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
