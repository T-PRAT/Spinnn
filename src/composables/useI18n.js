import { ref, watch } from 'vue';
import { useI18n as useVueI18n } from 'vue-i18n';

// Module-level state for locale (singleton pattern)
const currentLocale = ref('fr');
const supportedLocales = ['fr', 'en'];

// Load locale from localStorage or detect from browser
const storedLocale = localStorage.getItem('spinnn_locale');
if (storedLocale && supportedLocales.includes(storedLocale)) {
  currentLocale.value = storedLocale;
} else {
  // Auto-detect browser language
  const browserLang = navigator.language || navigator.languages?.[0] || 'fr';
  const detectedLocale = browserLang.split('-')[0]; // 'en-US' -> 'en'
  if (supportedLocales.includes(detectedLocale)) {
    currentLocale.value = detectedLocale;
  } else {
    currentLocale.value = 'fr'; // fallback to French
  }
  // Save the detected/fallback locale
  localStorage.setItem('spinnn_locale', currentLocale.value);
}

export function useI18n() {
  let t;
  let locale;

  try {
    // Get vue-i18n instance
    const i18n = useVueI18n();
    t = i18n?.t || ((key) => key);
    locale = i18n?.locale;

    // Watch our locale and sync with vue-i18n when it changes
    watch(currentLocale, (newLocale) => {
      if (locale) {
        locale.value = newLocale;
      }
    }, { immediate: true });
  } catch (e) {
    // Fallback if vue-i18n is not ready yet
    console.warn('vue-i18n not ready yet, using fallback translations');
    t = (key) => key;
    locale = { value: currentLocale.value };

    watch(currentLocale, (newLocale) => {
      locale.value = newLocale;
    });
  }

  const setLocale = (newLocale) => {
    if (!supportedLocales.includes(newLocale)) {
      console.warn(`Unsupported locale: ${newLocale}. Supported: ${supportedLocales.join(', ')}`);
      return false;
    }
    currentLocale.value = newLocale;
    localStorage.setItem('spinnn_locale', newLocale);
    return true;
  };

  const getLocale = () => {
    return currentLocale.value;
  };

  return {
    currentLocale,
    supportedLocales,
    setLocale,
    getLocale,
    t
  };
}
