<script setup>
import { ref } from 'vue';
import { sampleWorkouts, formatDuration } from '../data/sampleWorkouts';

const selectedWorkout = ref(null);
const fileInput = ref(null);

const emit = defineEmits(['workout-selected']);

function selectWorkout(workout) {
  selectedWorkout.value = workout;
  emit('workout-selected', workout);
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');

      const workout = parseZwoFile(xmlDoc);
      selectedWorkout.value = workout;
      emit('workout-selected', workout);
    } catch (error) {
      alert('Failed to parse workout file. Please ensure it is a valid .zwo file.');
      console.error(error);
    }
  };
  reader.readAsText(file);
}

function parseZwoFile(xmlDoc) {
  const workoutName = xmlDoc.querySelector('workout')?.getAttribute('name') || 'Custom Workout';
  const intervals = [];
  let totalDuration = 0;

  const elements = xmlDoc.querySelectorAll('SteadyState, Ramp, IntervalsT, FreeRide, Cooldown, Warmup');

  elements.forEach(element => {
    const duration = parseInt(element.getAttribute('Duration') || 0);
    totalDuration += duration;

    if (element.tagName === 'SteadyState') {
      intervals.push({
        type: 'steady',
        duration: duration,
        power: parseFloat(element.getAttribute('Power') || 0.5)
      });
    } else if (element.tagName === 'Ramp') {
      intervals.push({
        type: 'ramp',
        duration: duration,
        powerStart: parseFloat(element.getAttribute('PowerLow') || 0.5),
        powerEnd: parseFloat(element.getAttribute('PowerHigh') || 0.7)
      });
    } else if (element.tagName === 'Warmup') {
      intervals.push({
        type: 'warmup',
        duration: duration,
        powerStart: parseFloat(element.getAttribute('PowerLow') || 0.5),
        powerEnd: parseFloat(element.getAttribute('PowerHigh') || 0.7)
      });
    } else if (element.tagName === 'Cooldown') {
      intervals.push({
        type: 'cooldown',
        duration: duration,
        powerStart: parseFloat(element.getAttribute('PowerLow') || 0.7),
        powerEnd: parseFloat(element.getAttribute('PowerHigh') || 0.5)
      });
    }
  });

  return {
    id: 'custom',
    name: workoutName,
    description: 'Uploaded workout file',
    duration: totalDuration,
    difficulty: 'Custom',
    intervals: intervals
  };
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
    <h2 class="text-xl font-bold text-foreground">Choisir un entrainement</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        v-for="workout in sampleWorkouts"
        :key="workout.id"
        @click="selectWorkout(workout)"
        :class="[
          'p-4 border-2 rounded-lg cursor-pointer transition-all',
          selectedWorkout?.id === workout.id
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
        ]"
      >
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-semibold text-foreground">{{ workout.name }}</h3>
          <span
            :class="['px-2 py-1 rounded text-xs font-medium', getDifficultyColor(workout.difficulty)]"
          >
            {{ workout.difficulty }}
          </span>
        </div>
        <p class="text-sm text-muted-foreground mb-2">{{ workout.description }}</p>
        <p class="text-xs text-muted-foreground">Duree: {{ formatDuration(workout.duration) }}</p>
      </div>
    </div>

    <div class="border-t border-border pt-4">
      <label class="block">
        <span class="text-sm font-medium text-foreground mb-2 block">Ou importer un fichier .zwo:</span>
        <input
          ref="fileInput"
          type="file"
          accept=".zwo"
          @change="handleFileUpload"
          class="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer file:transition-colors"
        />
      </label>
    </div>

    <div v-if="selectedWorkout" class="mt-4 p-4 bg-muted rounded-lg">
      <p class="text-sm font-medium text-foreground">
        Selectionne: <span class="text-primary">{{ selectedWorkout.name }}</span>
      </p>
      <p class="text-xs text-muted-foreground mt-1">
        {{ selectedWorkout.intervals.length }} intervals · {{ formatDuration(selectedWorkout.duration) }}
      </p>
    </div>
  </div>
</template>
