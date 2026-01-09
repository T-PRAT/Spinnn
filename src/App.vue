<script setup>
import { watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './components/layout/AppHeader.vue';
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
  <div class="min-h-screen bg-background text-foreground font-sans">
    <AppHeader />
    <main class="container mx-auto px-6 py-8">
      <router-view />
    </main>
  </div>
</template>
