<script setup>
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold text-foreground mb-6">{{ t('history.title') }}</h2>
    <div class="bg-card rounded-lg p-8 text-center border border-border">
      <svg class="w-16 h-16 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-muted-foreground text-lg">
        {{ t('history.comingSoon') }}
      </p>
      <p class="text-muted-foreground text-sm mt-2">
        {{ t('history.description') }}
      </p>
    </div>
  </div>
</template>
