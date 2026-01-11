<script setup>
import { watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import { useAppState } from './composables/useAppState';
import { useTheme } from './composables/useTheme';

const appState = useAppState();
const route = useRoute();
const theme = useTheme();

// Initialiser le thème au montage
onMounted(() => {
  // Le thème est déjà appliqué par le composable useTheme
});

watch(() => route.name, (routeName) => {
  if (routeName === 'setup') appState.goToStep(1);
  else if (routeName === 'workout') appState.goToStep(2);
  else if (routeName === 'summary') appState.goToStep(3);
}, { immediate: true });
</script>

<template>
  <div class="min-h-screen bg-background text-foreground font-sans flex overflow-x-hidden">
    <Sidebar />
    <main class="flex-1 p-2 md:p-6 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>
