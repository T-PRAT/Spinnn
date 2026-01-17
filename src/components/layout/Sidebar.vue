<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useWorkoutSession } from '@/composables/useWorkoutSession';
import { useI18n as useVueI18n } from 'vue-i18n';

const router = useRouter();
const route = useRoute();
const session = useWorkoutSession();

let t;
try {
  const i18n = useVueI18n();
  t = i18n.t;
} catch (e) {
  console.warn('i18n not available:', e);
  t = (key) => key;
}

const isMobileMenuOpen = ref(false);

// Collapse sidebar on desktop during workout
const isCollapsed = computed(() => route?.name === 'workout');

const navItems = computed(() => {
  try {
    return [
      { name: (t && t('navigation.home')) || 'Accueil', route: 'setup', icon: 'home', always: true },
      { name: (t && t('navigation.workout')) || 'Entraînement', route: 'workout', icon: 'play', condition: session.isActive.value },
      { name: (t && t('navigation.history')) || 'Historique', route: 'history', icon: 'history', always: true }
    ].filter(item => item.always || item.condition);
  } catch (e) {
    console.error('Error in navItems:', e);
    return [
      { name: 'Accueil', route: 'setup', icon: 'home', always: true },
      { name: 'Historique', route: 'history', icon: 'history', always: true }
    ];
  }
});

const settingsItem = computed(() => {
  try {
    return { name: (t && t('navigation.settings')) || 'Paramètres', route: 'settings', icon: 'settings' };
  } catch (e) {
    console.error('Error in settingsItem:', e);
    return { name: 'Paramètres', route: 'settings', icon: 'settings' };
  }
});

function navigate(routeName) {
  if (!routeName) {
    console.error('navigate called with undefined routeName');
    return;
  }
  router.push({ name: routeName });
  isMobileMenuOpen.value = false;
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function getIcon(iconName) {
  const icons = {
    home: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />`,
    play: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    history: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />`,
    settings: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`
  };
  return icons[iconName] || '';
}
</script>

<template>
  <!-- Mobile bottom bar -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 flex justify-around items-center h-16 px-2 safe-area-inset-bottom">
    <button
      v-for="item in [...navItems, settingsItem.value]"
      :key="item?.route"
      @click="navigate(item?.route)"
      :class="[
        'flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-all',
        route?.name === item?.route
          ? 'text-primary'
          : 'text-muted-foreground'
      ]"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIcon(item?.icon)"></svg>
      <span class="text-xs mt-1">{{ item?.name }}</span>
    </button>
  </nav>

  <!-- Desktop sidebar -->
  <aside
    :class="[
      'hidden md:flex fixed top-0 left-0 h-full bg-card border-r border-border z-40 transition-all duration-300 flex-col',
      // Desktop: collapse when in workout
      isCollapsed ? 'w-20' : 'w-64'
    ]"
  >
    <!-- Logo / Header -->
    <div class="p-6 border-b border-border flex justify-center">
      <button
        @click="navigate('setup')"
        class="hover:opacity-80 transition-opacity"
        :title="isCollapsed ? 'Spinnn' : ''"
      >
        <h1
          v-if="!isCollapsed"
          class="text-3xl font-bold text-primary tracking-tight font-heading"
        >
          Spinnn
        </h1>
        <!-- Compact logo: just "S" when collapsed -->
        <div
          v-else
          class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center"
        >
          <span class="text-2xl font-bold text-primary-foreground font-heading">S</span>
        </div>
      </button>
    </div>

    <!-- Main navigation -->
    <nav class="p-4 space-y-2 flex-1">
      <button
        v-for="item in navItems"
        :key="item.route"
        @click="navigate(item.route)"
        :class="[
          'w-full flex items-center rounded-lg transition-all',
          isCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-4 py-3',
          route?.name === item.route
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        ]"
        :title="isCollapsed ? item.name : ''"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIcon(item.icon)"></svg>
        <span v-if="!isCollapsed" class="text-sm">{{ item.name }}</span>
      </button>
    </nav>

    <!-- Settings at bottom -->
    <div class="p-4 border-t border-border">
      <button
        @click="navigate(settingsItem.value?.route)"
        :class="[
          'w-full flex items-center rounded-lg transition-all',
          isCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-4 py-3',
          route?.name === settingsItem.value?.route
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        ]"
        :title="isCollapsed ? settingsItem.value?.name : ''"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="getIcon(settingsItem.value?.icon)"></svg>
        <span v-if="!isCollapsed" class="text-sm">{{ settingsItem.value?.name || 'Paramètres' }}</span>
      </button>
    </div>
  </aside>

  <!-- Spacer for desktop sidebar -->
  <div :class="['hidden md:block flex-shrink-0', isCollapsed ? 'w-20' : 'w-64']"></div>

  <!-- Spacer for mobile bottom bar -->
  <div class="md:hidden h-16"></div>
</template>
