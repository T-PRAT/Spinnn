import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'
import './utils/legacyStyle' // ?style=ancien : retour à l'ancien style
import './style.css'
import './theme-maquette.css'
import { fr, en } from './locales'

// Create i18n instance
const i18n = createI18n({
  legacy: false,              // Composition API mode
  locale: 'fr',               // Default (will be overridden by useI18n)
  fallbackLocale: 'fr',
  messages: { fr, en }
})

const app = createApp(App)

app.use(router)
app.use(i18n)

app.mount('#app')
