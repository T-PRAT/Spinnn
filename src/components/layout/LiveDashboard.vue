<script setup>
import { computed } from 'vue';
import HeartRateChart from './HeartRateChart.vue';
import PowerChart from './PowerChart.vue';

const props = defineProps({
  dataPoints: {
    type: Array,
    default: () => []
  },
  ftp: {
    type: Number,
    default: 200
  },
  isActive: {
    type: Boolean,
    default: false
  }
});

const currentMetrics = computed(() => {
  if (props.dataPoints.length === 0) {
    return {
      power: 0,
      heartRate: 0,
      cadence: 0,
      speed: 0,
      distance: 0
    };
  }
  return props.dataPoints[props.dataPoints.length - 1];
});

const averageMetrics = computed(() => {
  if (props.dataPoints.length === 0) {
    return {
      avgPower: 0,
      avgHeartRate: 0,
      avgCadence: 0,
      avgSpeed: 0
    };
  }

  const sum = props.dataPoints.reduce((acc, point) => {
    acc.power += point.power || 0;
    acc.heartRate += point.heartRate || 0;
    acc.cadence += point.cadence || 0;
    acc.speed += point.speed || 0;
    return acc;
  }, { power: 0, heartRate: 0, cadence: 0, speed: 0 });

  const count = props.dataPoints.length;

  return {
    avgPower: Math.round(sum.power / count),
    avgHeartRate: Math.round(sum.heartRate / count),
    avgCadence: Math.round(sum.cadence / count),
    avgSpeed: (sum.speed / count).toFixed(1)
  };
});

const ftpPercentage = computed(() => {
  if (!props.ftp || currentMetrics.value.power === 0) return 0;
  return Math.round((currentMetrics.value.power / props.ftp) * 100);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Current Metrics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">Power</span>
          <span class="text-xs text-gray-500">{{ ftpPercentage }}% FTP</span>
        </div>
        <div class="text-3xl font-bold text-amber-600">
          {{ currentMetrics.power }}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          Avg: {{ averageMetrics.avgPower }}W
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <div class="text-sm text-gray-600 mb-2">Heart Rate</div>
        <div class="text-3xl font-bold text-red-500">
          {{ currentMetrics.heartRate }}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          Avg: {{ averageMetrics.avgHeartRate }} bpm
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <div class="text-sm text-gray-600 mb-2">Cadence</div>
        <div class="text-3xl font-bold text-violet-600">
          {{ currentMetrics.cadence }}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          Avg: {{ averageMetrics.avgCadence }} rpm
        </div>
      </div>

      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <div class="text-sm text-gray-600 mb-2">Distance</div>
        <div class="text-3xl font-bold text-blue-600">
          {{ (currentMetrics.distance / 1000).toFixed(2) }}
        </div>
        <div class="text-xs text-gray-500 mt-1">
          km
        </div>
      </div>
    </div>

    <!-- Live Status Indicator -->
    <div v-if="isActive" class="bg-green-50 border border-green-200 rounded-lg p-3">
      <div class="flex items-center justify-center gap-2">
        <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span class="text-green-800 font-medium">Recording Live Data</span>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <HeartRateChart :data-points="dataPoints" />
      <PowerChart :data-points="dataPoints" :ftp="ftp" />
    </div>

    <!-- Additional Stats -->
    <div v-if="dataPoints.length > 0" class="bg-white rounded-lg p-6 border border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Session Summary</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div class="text-sm text-gray-600">Data Points</div>
          <div class="text-xl font-semibold text-gray-900">{{ dataPoints.length }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Avg Speed</div>
          <div class="text-xl font-semibold text-gray-900">{{ averageMetrics.avgSpeed }} km/h</div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Max Power</div>
          <div class="text-xl font-semibold text-gray-900">{{ Math.max(...dataPoints.map(d => d.power)) }}W</div>
        </div>
        <div>
          <div class="text-sm text-gray-600">Max HR</div>
          <div class="text-xl font-semibold text-gray-900">{{ Math.max(...dataPoints.map(d => d.heartRate)) }} bpm</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
