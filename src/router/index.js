import { createRouter, createWebHistory } from 'vue-router';
import SetupView from '../views/SetupView.vue';
import WorkoutView from '../views/WorkoutView.vue';
import SummaryView from '../views/SummaryView.vue';
import SettingsView from '../views/SettingsView.vue';
import HistoryView from '../views/HistoryView.vue';

const routes = [
  {
    path: '/',
    name: 'setup',
    component: SetupView
  },
  {
    path: '/workout',
    name: 'workout',
    component: WorkoutView
  },
  {
    path: '/summary',
    name: 'summary',
    component: SummaryView
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
