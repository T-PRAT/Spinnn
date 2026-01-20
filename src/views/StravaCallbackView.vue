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
const error = ref('');

onMounted(async () => {
  // Check for error in URL params
  if (route.query.error) {
    status.value = 'error';
    error.value = route.query.error_description || t('settings.strava.oauthError') || 'OAuth authorization failed';
    setTimeout(() => {
      router.push({ name: 'settings', hash: '#integrations' });
    }, 3000);
    return;
  }

  const code = route.query.code;
  const state = route.query.state;

  if (!code || !state) {
    status.value = 'error';
    error.value = t('settings.strava.missingParams') || 'Missing authorization parameters';
    setTimeout(() => {
      router.push({ name: 'settings', hash: '#integrations' });
    }, 3000);
    return;
  }

  try {
    status.value = 'loading';
    message.value = t('settings.strava.processing') || 'Processing authorization...';

    await strava.handleCallback(code, state);

    status.value = 'success';
    message.value = t('settings.strava.connectSuccess') || 'Successfully connected to Strava!';

    setTimeout(() => {
      router.push({ name: 'settings', hash: '#integrations' });
    }, 2000);
  } catch (err) {
    status.value = 'error';
    error.value = err.message || t('settings.strava.connectError') || 'Failed to connect to Strava';
    setTimeout(() => {
      router.push({ name: 'settings', hash: '#integrations' });
    }, 3000);
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="max-w-md w-full">
      <!-- Loading state -->
      <div v-if="status === 'loading'" class="bg-card rounded-lg p-8 shadow-lg border border-border text-center">
        <div class="flex justify-center mb-4">
          <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 class="text-xl font-semibold text-foreground mb-2">
          {{ t('settings.strava.connecting') || 'Connecting to Strava...' }}
        </h2>
        <p class="text-sm text-muted-foreground">{{ message }}</p>
      </div>

      <!-- Success state -->
      <div v-else-if="status === 'success'" class="bg-card rounded-lg p-8 shadow-lg border border-border text-center">
        <div class="flex justify-center mb-4">
          <svg class="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-foreground mb-2">
          {{ t('settings.strava.successTitle') || 'Success!' }}
        </h2>
        <p class="text-sm text-muted-foreground">{{ message }}</p>
        <p class="text-xs text-muted-foreground mt-4">
          {{ t('settings.strava.redirecting') || 'Redirecting to settings...' }}
        </p>
      </div>

      <!-- Error state -->
      <div v-else-if="status === 'error'" class="bg-card rounded-lg p-8 shadow-lg border border-border text-center">
        <div class="flex justify-center mb-4">
          <svg class="w-16 h-16 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-foreground mb-2">
          {{ t('settings.strava.errorTitle') || 'Connection Failed' }}
        </h2>
        <p class="text-sm text-destructive">{{ error }}</p>
        <p class="text-xs text-muted-foreground mt-4">
          {{ t('settings.strava.redirecting') || 'Redirecting to settings...' }}
        </p>
      </div>
    </div>
  </div>
</template>
