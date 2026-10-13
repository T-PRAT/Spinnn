<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/composables/useI18n';
import { useWorkoutSession } from '@/composables/useWorkoutSession';
import { workoutHistory } from '@/utils/workoutHistory';
import { formatDuration } from '@/utils/workoutHelpers';
import AppDialog from '@/components/layout/AppDialog.vue';
const { t, currentLocale } = useI18n(), router = useRouter(), session = useWorkoutSession();
const workouts = ref([]), error = ref(false), pendingDelete = ref(null), loading = ref(true);
async function load() { try { workouts.value = await workoutHistory.list(); } catch { error.value = true; } finally { loading.value = false; } }
async function remove() { try { await workoutHistory.delete(pendingDelete.value.id); pendingDelete.value = null; await load(); } catch { error.value = true; } }
onMounted(load);
</script>
<template>
  <section class="max-w-4xl mx-auto space-y-5">
    <header><h1 class="text-2xl font-bold">{{ t('navigation.history') }}</h1><p class="text-muted-foreground text-sm mt-2">{{ t('review.historyHint') }}</p></header>
    <p v-if="session.isActive.value" role="status">{{ t('review.historyActive') }}</p>
    <p v-if="error" role="alert" class="text-destructive">{{ t('review.historyError') }}</p>
    <p v-else-if="loading">{{ t('common.states.loading') }}</p>
    <div v-else-if="!workouts.length" class="bg-card border border-border rounded-lg p-8 text-center"><p>{{ t('review.historyEmpty') }}</p><button class="touch-button mt-3 bg-primary text-primary-foreground" @click="router.push('/')">{{ t('navigation.home') }}</button></div>
    <article v-for="workout in workouts" :key="workout.id" class="bg-card border border-border rounded-lg p-4 flex flex-wrap justify-between gap-3">
      <div><h2 class="font-bold">{{ workout.workout.name }}</h2><p class="text-sm text-muted-foreground">{{ new Date(workout.startTime).toLocaleString(currentLocale) }} · {{ formatDuration(workout.activeElapsedSeconds || workout.dataPoints.length) }}</p></div>
      <div class="flex gap-2"><button class="touch-button bg-primary text-primary-foreground" :disabled="session.isActive.value" @click="router.push({ name: 'summary', params: { id: workout.id } })">{{ t('review.open') }}</button><button class="touch-button border border-border" @click="pendingDelete = workout">{{ t('common.buttons.delete') }}</button></div>
    </article>
    <AppDialog v-if="pendingDelete" :title="t('review.deleteTitle')" @close="pendingDelete = null"><p>{{ t('review.deleteHint') }}</p><button class="touch-button bg-destructive text-destructive-foreground" @click="remove">{{ t('common.buttons.delete') }}</button></AppDialog>
  </section>
</template>
