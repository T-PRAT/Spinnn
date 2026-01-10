<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import * as d3 from "d3";
import { useAppState } from "../composables/useAppState";

const appState = useAppState();

const props = defineProps({
  ftp: { type: Number, default: 200 },
  workout: { type: Object, default: null },
  compact: { type: Boolean, default: false },
  tall: { type: Boolean, default: false },
});

const chartRef = ref(null);
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  interval: null,
});

let svg = null;
let xScale = null;
let yScalePower = null;

const margin = { top: 2, right: 2, bottom: 2, left: 2 };
let width = 800;
const height = props.tall ? 60 : 40;

onMounted(() => {
  initChart();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

function handleResize() {
  if (chartRef.value) {
    initChart();
  }
}

watch(
  () => props.workout,
  () => {
    if (chartRef.value) {
      initChart();
    }
  },
  { deep: true }
);

function initChart() {
  if (!chartRef.value || !props.workout) return;

  console.log("=== WorkoutPreviewChart initChart ===");
  console.log("Workout:", props.workout);
  console.log("Intervals:", props.workout.intervals);
  console.log("FTP:", props.ftp);

  d3.select(chartRef.value).selectAll("*").remove();

  const containerWidth = chartRef.value.clientWidth;
  width = containerWidth - margin.left - margin.right;

  svg = d3
    .select(chartRef.value)
    .append("svg")
    .attr("width", containerWidth)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const totalDuration = props.workout.duration;
  xScale = d3.scaleLinear().domain([0, totalDuration]).range([0, width]);
  yScalePower = d3
    .scaleLinear()
    .domain([0, props.ftp * 1.5])
    .range([height, 0]);

  // Draw workout profile
  drawWorkoutProfile();
}

function drawWorkoutProfile() {
  let currentTime = 0;

  // Ensure intervals is an array
  const intervals = Array.isArray(props.workout.intervals) ? props.workout.intervals : Object.values(props.workout.intervals);

  console.log("Drawing intervals:", intervals);

  intervals.forEach((interval, index) => {
    const startX = xScale(currentTime);
    const endX = xScale(currentTime + interval.duration);

    let power = interval.power;
    if (power === undefined && interval.powerStart !== undefined && interval.powerEnd !== undefined) {
      power = (interval.powerStart + interval.powerEnd) / 2;
    }
    const targetPower = (power || 0.5) * props.ftp;

    const rect = svg
      .append("rect")
      .attr("x", startX)
      .attr("y", yScalePower(targetPower))
      .attr("width", Math.max(0, endX - startX))
      .attr("height", Math.max(0, height - yScalePower(targetPower)))
      .attr("fill", getIntervalColor(interval.type, power))
      .attr("opacity", 0.6)
      .attr("stroke", getIntervalColor(interval.type, power))
      .attr("stroke-width", 0.5);

    // Only add tooltips if not in compact mode
    if (!props.compact) {
      rect
        .attr("cursor", "pointer")
        .on("mouseenter", function (event) {
          d3.select(this).attr("opacity", 0.9);
          showTooltip(event, interval);
        })
        .on("mouseleave", function () {
          d3.select(this).attr("opacity", 0.6);
          hideTooltip();
        });
    }

    currentTime += interval.duration;
  });
}

function showTooltip(event, interval) {
  const rect = chartRef.value.getBoundingClientRect();
  tooltip.value = {
    show: true,
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    interval: interval,
  };
}

function hideTooltip() {
  tooltip.value.show = false;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
}

function getIntervalTypeName(type) {
  const names = {
    warmup: "Echauffement",
    cooldown: "Recup",
    recovery: "Recuperation",
    steady: "Continu",
    work: "Travail",
    ramp: "Progressif",
  };
  return names[type] || type;
}

function getIntervalColor(type, power) {
  // Convert power to percentage (power is in decimal, e.g., 0.67 = 67%)
  const powerPercent = (power || 0.7) * 100;
  const zones = appState.powerZones.value;

  // Determine zone based on configured power percentages
  if (powerPercent <= zones.z1.max) return "#22c55e"; // green
  if (powerPercent <= zones.z2.max) return "#3b82f6"; // blue
  if (powerPercent <= zones.z3.max) return "#f59e0b"; // orange
  if (powerPercent <= zones.z4.max) return "#ef4444"; // red
  if (powerPercent <= zones.z5.max) return "#8b5cf6"; // purple
  return "#ec4899"; // pink (Z6)
}
</script>

<template>
  <div :class="compact ? 'space-y-1' : 'space-y-2'">
    <div v-if="!compact" class="flex items-center justify-between">
      <div class="flex-1 min-w-0">
        <h4 class="text-base font-semibold text-foreground truncate">{{ workout?.name }}</h4>
      </div>
      <div class="px-3 py-1 bg-muted/50 rounded text-sm font-medium text-foreground ml-2">
        {{ formatDuration(workout?.duration || 0) }}
      </div>
    </div>
    <div v-else class="mb-1">
      <div class="flex items-center justify-between gap-2">
        <h4 class="text-sm font-medium text-foreground truncate">{{ workout?.name }}</h4>
        <span class="px-3 py-1 bg-muted/50 rounded text-xs font-medium text-foreground">
          {{ formatDuration(workout?.duration || 0) }}
        </span>
      </div>
    </div>
    <div class="relative">
      <div ref="chartRef" class="w-full rounded"></div>

      <div
        v-if="!compact && tooltip.show && tooltip.interval"
        :style="{
          left: `${tooltip.x + 10}px`,
          top: `${tooltip.y - 10}px`,
        }"
        class="absolute pointer-events-none bg-card border border-border rounded-lg px-3 py-2 shadow-lg z-10 text-sm"
      >
        <div class="font-semibold text-foreground mb-1">
          {{ getIntervalTypeName(tooltip.interval.type) }}
        </div>
        <div class="text-muted-foreground space-y-0.5">
          <div>Duree: {{ formatDuration(tooltip.interval.duration) }}</div>
          <div v-if="tooltip.interval.power !== undefined">
            Puissance: {{ Math.round(tooltip.interval.power * ftp) }}W ({{ Math.round(tooltip.interval.power * 100) }}%)
          </div>
          <div v-else-if="tooltip.interval.powerStart !== undefined && tooltip.interval.powerEnd !== undefined">
            Puissance: {{ Math.round(tooltip.interval.powerStart * ftp) }}W → {{ Math.round(tooltip.interval.powerEnd * ftp) }}W
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
