import { createRouter, createWebHistory } from 'vue-router';
import SetupView from '../views/SetupView.vue';
const WorkoutView = () => import('../views/WorkoutView.vue');
const SummaryView = () => import('../views/SummaryView.vue');
const SettingsView = () => import('../views/SettingsView.vue');
const HistoryView = () => import('../views/HistoryView.vue');
const StravaCallbackView = () => import('../views/StravaCallbackView.vue');

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
    path: '/summary/:id?',
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
  },
  {
    path: '/strava-callback',
    name: 'strava-callback',
    component: StravaCallbackView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});
router.addRoute({ path: '/:pathMatch(.*)*', redirect: '/' });

export default router;
