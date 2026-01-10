<script setup>
import { ref } from 'vue';
import { sampleWorkouts, formatDuration } from '../data/sampleWorkouts';
import { useAppState } from '../composables/useAppState';
import WorkoutPreviewChart from './WorkoutPreviewChart.vue';

const appState = useAppState();
const selectedWorkout = ref(null);

const emit = defineEmits(['workout-selected']);

function selectWorkout(workout) {
  selectedWorkout.value = workout;
  emit('workout-selected', workout);
}

function getDifficultyColor(difficulty) {
  const colors = {
    Easy: 'bg-chart-3/20 text-chart-3',
    Moderate: 'bg-chart-1/20 text-chart-1',
    Hard: 'bg-destructive/20 text-destructive',
    Custom: 'bg-primary/20 text-primary'
  };
  return colors[difficulty] || 'bg-muted text-muted-foreground';
}
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold text-foreground">Entrainements predefinis</h2>

    <div class="max-h-[500px] overflow-y-auto space-y-2">
      <div
        v-for="workout in sampleWorkouts"
        :key="workout.id"
        @click="selectWorkout(workout)"
        :class="[
          'p-3 border-2 rounded-lg cursor-pointer transition-all',
          selectedWorkout?.id === workout.id
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
        ]"
      >
        <WorkoutPreviewChart :ftp="appState.ftp.value" :workout="workout" :compact="true" />

      </div>
    </div>
  </div>
</template>
