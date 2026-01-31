import { ref, watch } from 'vue';

const isDark = ref(true);

const stored = localStorage.getItem('spinnn_theme');
if (stored) {
  isDark.value = stored === 'dark';
} else {
  isDark.value = true;
  localStorage.setItem('spinnn_theme', 'dark');
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

    if (isDark.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('spinnn_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('spinnn_theme', 'light');
    }
  }

  function setTheme(dark) {
    isDark.value = dark;

    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('spinnn_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('spinnn_theme', 'light');
    }
  }

  return {
    isDark,
    toggleTheme,
    setTheme
  };
}
