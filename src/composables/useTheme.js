import { ref, watch } from 'vue';
import { useStorage } from './useStorage';

const storage = useStorage();
const storedTheme = storage.getTheme();
const isDark = ref(storedTheme !== 'light'); // Default to dark if no preference

// Initialize theme in localStorage if not set
if (!storedTheme) {
  storage.setTheme('dark');
}

if (typeof document !== 'undefined') {
  if (isDark.value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value;
    const theme = isDark.value ? 'dark' : 'light';

    storage.setTheme(theme);

    if (isDark.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function setTheme(dark) {
    isDark.value = dark;
    const theme = dark ? 'dark' : 'light';

    storage.setTheme(theme);

    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    isDark,
    toggleTheme,
    setTheme
  };
}
