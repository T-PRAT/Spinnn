<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useAppState } from '../composables/useAppState';
import { useTheme } from '../composables/useTheme';
import { useAudioSettings } from '../composables/useAudioSettings';
import IntervalsSettings from '../components/IntervalsSettings.vue';

const route = useRoute();
const appState = useAppState();
const theme = useTheme();
const audioSettings = useAudioSettings();

const localFtp = ref(200);
const showTooltip = ref(false);
const localZones = ref({});

onMounted(() => {
  localFtp.value = appState.ftp.value;
  localZones.value = JSON.parse(JSON.stringify(appState.powerZones.value));

  // Scroll to section if hash is present
  nextTick(() => {
    if (route.hash) {
      const element = document.querySelector(route.hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
});

function saveFtp() {
  if (localFtp.value > 0) {
    appState.setFtp(localFtp.value);
  }
}

function saveZones() {
  appState.setPowerZones(localZones.value);
}

function resetZones() {
  appState.resetPowerZones();
  localZones.value = JSON.parse(JSON.stringify(appState.powerZones.value));
}

function getZoneColor(key) {
  const colors = {
    z1: 'var(--zone-z1)',
    z2: 'var(--zone-z2)',
    z3: 'var(--zone-z3)',
    z4: 'var(--zone-z4)',
    z5: 'var(--zone-z5)',
    z6: 'var(--zone-z6)',
    z7: 'var(--zone-z7)'
  };
  return colors[key] || '#6b7280';
}

function selectSound(soundId) {
  audioSettings.setSelectedSound(soundId);
  // Auto-disable if "none" is selected
  if (soundId === 'none') {
    audioSettings.setIntervalSoundEnabled(false);
  } else if (!audioSettings.intervalSoundEnabled.value) {
    audioSettings.setIntervalSoundEnabled(true);
  }
}

function testSound(soundId) {
  audioSettings.testSound(soundId);
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="mb-8">
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

    <!-- Audio Settings -->
    <div class="bg-card rounded-lg p-6 shadow border border-border">
      <h3 class="text-lg font-semibold text-foreground mb-4">Sons d'intervalle</h3>
      <p class="text-sm text-muted-foreground mb-4">
        Choisissez un son qui sera joue au debut de chaque nouvel intervalle pendant l'entrainement
      </p>

      <div class="space-y-2">
        <div
          v-for="sound in audioSettings.availableSounds"
          :key="sound.id"
          @click="selectSound(sound.id)"
          :class="[
            'flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all',
            audioSettings.selectedSound.value === sound.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/20'
          ]"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <div
                :class="[
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                  audioSettings.selectedSound.value === sound.id
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                ]"
              >
                <div
                  v-if="audioSettings.selectedSound.value === sound.id"
                  class="w-2 h-2 rounded-full bg-primary-foreground"
                ></div>
              </div>
              <div>
                <div class="text-sm font-medium text-foreground">{{ sound.name }}</div>
                <div class="text-xs text-muted-foreground">{{ sound.description }}</div>
              </div>
            </div>
          </div>
          <button
            v-if="sound.id !== 'none'"
            @click.stop="testSound(sound.id)"
            class="ml-3 px-3 py-1 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded transition-colors"
          >
            Tester
          </button>
        </div>
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

    <!-- Power Zones Configuration -->
    <div class="bg-card rounded-lg p-6 shadow border border-border">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-foreground">Zones de puissance</h3>
        <button
          @click="resetZones"
          class="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Réinitialiser
        </button>
      </div>
      <p class="text-sm text-muted-foreground mb-4">
        Configurez vos zones de puissance en pourcentage de votre FTP ({{ appState.ftp.value }}W)
      </p>

      <div class="space-y-2">
        <div
          v-for="(zone, key) in localZones"
          :key="key"
          class="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors"
        >
          <div
            class="w-1 h-10 rounded-full"
            :style="{ backgroundColor: getZoneColor(key) }"
          ></div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-foreground">{{ zone.name }}</div>
            <div class="text-xs text-muted-foreground">
              {{ Math.round(zone.min * appState.ftp.value / 100) }}W - {{ Math.round(zone.max * appState.ftp.value / 100) }}W
            </div>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              v-model.number="zone.min"
              min="0"
              max="200"
              class="w-14 px-2 py-1 text-xs text-center bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground">-</span>
            <input
              type="number"
              v-model.number="zone.max"
              min="0"
              max="200"
              class="w-14 px-2 py-1 text-xs text-center bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <button
        @click="saveZones"
        class="mt-4 w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
      >
        Enregistrer les zones
      </button>
    </div>

    <!-- Intervals.icu Integration -->
    <div id="intervals-icu" class="bg-card rounded-lg p-6 shadow border border-border">
      <IntervalsSettings />
    </div>
  </div>
</template>
