<script setup>
import { ref, computed } from 'vue';
import { useAppState } from '@/composables/useAppState';
import { useI18n } from '@/composables/useI18n';
import { parseFtp, FTP_MIN, FTP_MAX } from '@/utils/ftp';
import { preparationText } from '@/utils/preparationMessages';

const appState = useAppState();
const { t, currentLocale } = useI18n();

const draft = ref(String(appState.ftp.value));
const showTooltip = ref(false);
const errorCode = ref('');
const justSaved = ref(false);

const errorMessage = computed(() =>
  errorCode.value ? preparationText(errorCode.value, { min: FTP_MIN, max: FTP_MAX }, currentLocale.value) : ''
);
const savedMessage = computed(() =>
  justSaved.value ? preparationText('ftp.saved', { ftp: appState.ftp.value }, currentLocale.value) : ''
);

/**
 * Enregistre la valeur saisie. Appelée à la validation du champ (Entrée, perte de focus)
 * comme au clic sur « Enregistrer » : une FTP modifiée n'est ainsi jamais perdue en silence.
 */
function saveFtp() {
  justSaved.value = false;

  const ftp = parseFtp(draft.value);
  if (ftp === null) {
    errorCode.value = 'ftp.invalid';
    return;
  }

  if (!appState.setFtp(ftp)) {
    errorCode.value = 'ftp.storageFailed';
    return;
  }

  errorCode.value = '';
  draft.value = String(ftp);
  justSaved.value = true;
}

function clearFeedback() {
  errorCode.value = '';
  justSaved.value = false;
}
</script>

<template>
  <div>
    <h4 class="text-base font-medium text-foreground mb-4">{{ t('settings.athlete.ftp') }}</h4>
    <div class="flex items-center gap-2 mb-2">
      <button
        @mouseenter="showTooltip = true"
        @mouseleave="showTooltip = false"
        @click="showTooltip = !showTooltip"
        type="button"
        class="text-muted-foreground hover:text-foreground relative"
        :aria-label="t('settings.athlete.ftpTooltip')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div
          v-if="showTooltip"
          class="absolute left-6 top-0 w-64 p-3 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border z-10 text-left"
        >
          {{ t('settings.athlete.ftpTooltip') }}
        </div>
      </button>
    </div>
    <div class="flex items-center gap-3">
      <input
        id="ftp-input"
        type="number"
        inputmode="numeric"
        step="1"
        :min="FTP_MIN"
        :max="FTP_MAX"
        v-model="draft"
        @input="clearFeedback"
        @change="saveFtp"
        @keydown.enter="saveFtp"
        :aria-invalid="errorCode ? 'true' : 'false'"
        aria-describedby="ftp-feedback"
        data-testid="ftp-input"
        class="w-32 px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-lg text-foreground"
      />
      <span class="text-muted-foreground">{{ t('settings.athlete.ftpUnit') }}</span>
      <button
        @click="saveFtp"
        type="button"
        data-testid="ftp-save"
        class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
      >
        {{ t('common.buttons.save') }}
      </button>
    </div>
    <div id="ftp-feedback" aria-live="polite">
      <p v-if="errorMessage" class="text-sm text-destructive mt-2" data-testid="ftp-error">{{ errorMessage }}</p>
      <p v-else-if="savedMessage" class="text-sm text-muted-foreground mt-2" data-testid="ftp-confirmation">{{ savedMessage }}</p>
    </div>
    <p class="text-xs text-muted-foreground mt-2" data-testid="ftp-current">
      {{ t('settings.athlete.ftpSaved') }} : {{ appState.ftp.value }}W
    </p>
  </div>
</template>
