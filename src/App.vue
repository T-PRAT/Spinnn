<script setup>
import { watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/layout/Sidebar.vue';
import { useAppState } from './composables/useAppState';
import { useTheme } from './composables/useTheme';
import { useWorkoutSession } from './composables/useWorkoutSession';

const appState = useAppState();
const route = useRoute();
const theme = useTheme();
const session = useWorkoutSession();

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
  <div class="h-screen bg-background text-foreground font-sans flex overflow-x-hidden">
    <Sidebar />
    <main class="flex-1 p-2 md:p-6 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>
