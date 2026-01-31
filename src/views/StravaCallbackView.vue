<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStrava } from '../composables/useStrava';
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const route = useRoute();
const strava = useStrava();
const { t } = useI18n();

const status = ref('loading');
const message = ref('');

// Icon components for each state
const icons = {
  loading: '⏳',
  success: '✅',
  error: '❌'
};

onMounted(async () => {
  // Check for error in URL params
  if (route.query.error) {
    status.value = 'error';
    message.value = route.query.error_description || t('settings.strava.oauthError') || 'OAuth authorization failed';
    setTimeout(() => router.push({ name: 'settings', hash: '#integrations' }), 3000);
    return;
  }

  const { code, state } = route.query;

  if (!code || !state) {
    status.value = 'error';
    message.value = t('settings.strava.missingParams') || 'Missing authorization parameters';
    setTimeout(() => router.push({ name: 'settings', hash: '#integrations' }), 3000);
    return;
  }

  try {
    await strava.handleCallback(code, state);
    status.value = 'success';
    message.value = t('settings.strava.connectSuccess') || 'Successfully connected to Strava!';
    setTimeout(() => router.push({ name: 'settings', hash: '#integrations' }), 2000);
  } catch (err) {
    status.value = 'error';
    message.value = err.message || t('settings.strava.connectError') || 'Failed to connect to Strava';
    setTimeout(() => router.push({ name: 'settings', hash: '#integrations' }), 3000);
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="max-w-md w-full bg-card rounded-lg p-8 shadow-lg border border-border text-center">
      <div class="text-4xl mb-4">{{ icons[status] }}</div>
      <h2 class="text-xl font-semibold text-foreground mb-2">
        {{ status === 'loading'
          ? (t('settings.strava.connecting') || 'Connecting to Strava...')
          : status === 'success'
            ? (t('settings.strava.successTitle') || 'Success!')
            : (t('settings.strava.errorTitle') || 'Connection Failed')
        }}
      </h2>
      <p class="text-sm" :class="status === 'error' ? 'text-destructive' : 'text-muted-foreground'">
        {{ message }}
      </p>
      <p class="text-xs text-muted-foreground mt-4">
        {{ t('settings.strava.redirecting') || 'Redirecting to settings...' }}
      </p>
    </div>
  </div>
</template>
