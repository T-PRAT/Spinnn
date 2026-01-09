<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goToSettings() {
  router.push({ name: 'settings' });
}

function goToHome() {
  router.push({ name: 'setup' });
}
</script>

<template>
  <header class="bg-card border-b border-border px-6 py-4 shadow-sm">
    <div class="flex items-center justify-between">
      <button @click="goToHome" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <h1 class="text-2xl font-bold text-primary tracking-tight">Spinnn</h1>
      </button>
      <button
        @click="goToSettings"
        class="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-sm font-medium">Parametres</span>
      </button>
    </div>
  </header>
</template>
