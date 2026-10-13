<script setup>
import { watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/layout/Sidebar.vue';
import { useAppState } from './composables/useAppState';
import { useTheme } from './composables/useTheme';
import { useWorkoutSession } from './composables/useWorkoutSession';
import { mountWorkoutEngine } from './composables/useWorkoutEngine';
import { storageUnavailable } from './composables/useStorage';
import { useI18n } from './composables/useI18n';

const appState = useAppState();
const route = useRoute();
const theme = useTheme();
const session = useWorkoutSession();
const { t } = useI18n();
mountWorkoutEngine();

const defaultTitle = 'Spinnn - Entraînement Cyclisme';

// Update page title
function updateTitle() {
  if (route.name === 'workout' && session.isPaused.value) {
    document.title = `⏸ PAUSE - ${defaultTitle}`;
  } else {
    document.title = defaultTitle;
  }
}

onMounted(() => {
  updateTitle();
});

watch(() => route.name, (routeName) => {
  if (routeName === 'setup') appState.goToStep(1);
  else if (routeName === 'workout') appState.goToStep(2);
  else if (routeName === 'summary') appState.goToStep(3);
  updateTitle();
}, { immediate: true });

// Watch session pause state to update title
watch(() => session.isPaused.value, () => {
  updateTitle();
});
</script>

<template>
  <div class="app-shell bg-background text-foreground font-sans flex overflow-x-hidden" :class="{ 'training': route.name === 'workout' }">
    <Sidebar />
    <main class="app-main flex-1 min-w-0 p-3 md:p-6 overflow-y-auto">
      <p v-if="storageUnavailable" role="alert" class="text-destructive text-sm p-2">{{ t('review.storageError') }}</p>
      <router-view />
    </main>
  </div>
</template>
