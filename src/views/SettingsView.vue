<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useAppState } from '../composables/useAppState';
import { useTheme } from '../composables/useTheme';
import { useAudioSettings } from '../composables/useAudioSettings';
import { useI18n } from '../composables/useI18n';
import IntervalsSettings from '../components/settings/IntervalsSettings.vue';
import StravaSettings from '../components/settings/StravaSettings.vue';

const route = useRoute();
const appState = useAppState();
const theme = useTheme();
const audioSettings = useAudioSettings();
const { currentLocale, setLocale, t } = useI18n();

const localFtp = ref(200);
const showTooltip = ref(false);
const localZones = ref({});
const activeSection = ref('');

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
];

const settingsSections = [
  { id: 'preferences', label: 'settings.navigation.preferences', icon: '⚙️' },
  { id: 'athlete', label: 'settings.navigation.athlete', icon: '🚴' },
  { id: 'integrations', label: 'settings.navigation.integrations', icon: '🔗' }
];

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

  // Setup intersection observer for active section tracking
  setupIntersectionObserver();
});

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeSection.value = sectionId;
  }
}

function setupIntersectionObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      });
    },
    {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    }
  );

  // Observe all sections
  settingsSections.forEach((section) => {
    const element = document.getElementById(section.id);
    if (element) {
      observer.observe(element);
    }
  });
}

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
      <h2 class="text-2xl font-bold text-foreground tracking-tight">{{ t('settings.title') }}</h2>
    </div>

    <!-- Sticky Navigation Menu -->
    <div class="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border mb-6 -mx-4 px-4">
      <nav class="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
        <button
          v-for="section in settingsSections"
          :key="section.id"
          @click="scrollToSection(section.id)"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
            activeSection === section.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          ]"
          :title="t(section.label) || undefined"
        >
          <span class="text-sm">{{ section.icon }}</span>
          <span class="hidden sm:inline">{{ t(section.label) }}</span>
        </button>
      </nav>
    </div>

    <!-- PREFERENCES SECTION -->
    <div id="preferences" class="space-y-6 scroll-mt-20">
      <div class="bg-card rounded-lg border border-border">
        <div class="p-4 border-b border-border">
          <h3 class="text-lg font-semibold text-foreground">{{ t('settings.preferences.title') }}</h3>
          <p class="text-sm text-muted-foreground mt-1">{{ t('settings.preferences.description') }}</p>
        </div>

        <!-- Language -->
        <div class="p-6 border-b border-border">
          <h4 class="text-base font-medium text-foreground mb-4">{{ t('settings.language.title') }}</h4>
          <div class="flex items-center gap-3">
            <button
              v-for="lang in languages"
              :key="lang.code"
              @click="setLocale(lang.code)"
              :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                currentLocale === lang.code
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              ]"
            >
              <span class="text-xl">{{ lang.flag }}</span>
              <span>{{ lang.name }}</span>
            </button>
          </div>
        </div>

        <!-- Appearance -->
        <div class="p-6 border-b border-border">
          <h4 class="text-base font-medium text-foreground mb-4">{{ t('settings.appearance.title') }}</h4>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-foreground">{{ t('settings.appearance.darkMode') }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ t('settings.appearance.darkModeDescription') }}</div>
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

        <!-- Audio -->
        <div class="p-6">
          <h4 class="text-base font-medium text-foreground mb-4">{{ t('settings.audio.title') }}</h4>
          <p class="text-sm text-muted-foreground mb-3">
            {{ t('settings.audio.description') }}
          </p>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div
              v-for="sound in audioSettings.availableSounds"
              :key="sound.id"
              @click="selectSound(sound.id)"
              @dblclick="testSound(sound.id)"
              :class="[
                'relative p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
                audioSettings.selectedSound.value === sound.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/20'
              ]"
            >
              <div class="flex flex-col items-center gap-1">
                <div class="text-xs font-semibold text-foreground">{{ sound.name }}</div>
                <div class="text-[10px] text-muted-foreground">{{ sound.description }}</div>
                <button
                  v-if="sound.id !== 'none'"
                  @click.stop="testSound(sound.id)"
                  class="mt-1 px-2 py-0.5 text-[10px] bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded transition-colors"
                  title="Test"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ATHLETE SECTION -->
    <div id="athlete" class="space-y-6 scroll-mt-20">
      <div class="bg-card rounded-lg border border-border">
        <div class="p-4 border-b border-border">
          <h3 class="text-lg font-semibold text-foreground">{{ t('settings.athlete.title') }}</h3>
          <p class="text-sm text-muted-foreground mt-1">{{ t('settings.athleteProfile.description') }}</p>
        </div>

        <!-- FTP -->
        <div class="p-6 border-b border-border">
          <h4 class="text-base font-medium text-foreground mb-4">{{ t('settings.athlete.ftp') }}</h4>
          <div class="flex items-center gap-2 mb-2">
            <label for="ftp" class="text-sm font-medium text-foreground"></label>
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
                {{ t('settings.athlete.ftpTooltip') }}
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
            <span class="text-muted-foreground">{{ t('settings.athlete.ftpUnit') }}</span>
            <button
              @click="saveFtp"
              class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
            >
              {{ t('common.buttons.save') }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            {{ t('settings.athlete.ftpSaved') }} : {{ appState.ftp.value }}W
          </p>
        </div>

        <!-- Power Zones -->
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-base font-medium text-foreground">{{ t('settings.zones.title') }}</h4>
            <button
              @click="resetZones"
              class="text-sm text-muted-foreground hover:text-foreground underline"
            >
              {{ t('common.buttons.reset') }}
            </button>
          </div>
          <p class="text-sm text-muted-foreground mb-4">
            {{ t('settings.zones.description') }} ({{ appState.ftp.value }}W)
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
            {{ t('settings.zones.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- INTEGRATIONS SECTION -->
    <div id="integrations" class="space-y-6 scroll-mt-20">
      <div class="bg-card rounded-lg border border-border">
        <div class="p-4 border-b border-border">
          <h3 class="text-lg font-semibold text-foreground">{{ t('settings.integrations.title') }}</h3>
          <p class="text-sm text-muted-foreground mt-1">{{ t('settings.integrations.description') }}</p>
        </div>

        <!-- Intervals.icu -->
        <div class="p-6 border-b border-border">
          <IntervalsSettings />
        </div>

        <!-- Strava -->
        <div class="p-6">
          <StravaSettings />
        </div>
      </div>
    </div>
  </div>
</template>
