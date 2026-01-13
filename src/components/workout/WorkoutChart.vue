<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import * as d3 from "d3";
import { useAppState } from "../../composables/useAppState";

const appState = useAppState();

const props = defineProps({
  dataPoints: { type: Array, default: () => [] },
  ftp: { type: Number, default: 200 },
  workout: { type: Object, default: null },
  elapsedSeconds: { type: Number, default: 0 },
});

const chartRef = ref(null);
let svg = null;
let xScale = null;
let yScalePower = null;
let yScaleHR = null;
let yScaleCadence = null;
let resizeObserver = null;
let isChartInitialized = false;

const margin = { top: 8, right: 8, bottom: 8, left: 8 };
let width = 800;
let height = 500;

function getResponsiveHeight() {
  return 250;
}

onMounted(() => {
  // Use ResizeObserver to detect when container has valid dimensions
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.contentRect.width > 0) {
        initChart();
        if (props.dataPoints.length > 0) {
          updateChart(props.dataPoints);
        }
      }
    }
  });

  if (chartRef.value) {
    resizeObserver.observe(chartRef.value);
  }

  // Also try to init immediately in case dimensions are already available
  setTimeout(() => {
    if (!isChartInitialized && chartRef.value && chartRef.value.clientWidth > 0) {
      initChart();
    }
  }, 50);
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

watch(
  () => props.dataPoints,
  (newData) => {
    if (svg && newData.length > 0) {
      updateChart(newData);
    }
  },
  { deep: true }
);

watch(
  () => props.elapsedSeconds,
  () => {
    if (svg) {
      updateCurrentPosition();
    }
  }
);

function initChart() {
  if (!chartRef.value) return;

  const containerWidth = chartRef.value.clientWidth;
  const containerHeight = chartRef.value.clientHeight;
  if (containerWidth <= 0 || containerHeight <= 0) return; // Guard against invalid dimensions

  // Clear previous chart
  d3.select(chartRef.value).selectAll("*").remove();

  width = Math.max(100, containerWidth - margin.left - margin.right);
  height = Math.max(50, containerHeight - margin.top - margin.bottom);

  isChartInitialized = true;

  svg = d3
    .select(chartRef.value)
    .append("svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const totalDuration = props.workout?.duration || 3600;
  xScale = d3.scaleLinear().domain([0, totalDuration]).range([0, width]);

  // Calculate max power from workout intervals to avoid capping
  let maxPowerInWorkout = props.ftp * 1.5; // default fallback
  if (props.workout?.intervals) {
    props.workout.intervals.forEach((interval) => {
      let maxPowerInInterval = 0;

      // For ramp intervals, check both powerStart and powerEnd
      if (interval.powerStart !== undefined && interval.powerEnd !== undefined) {
        maxPowerInInterval = Math.max(interval.powerStart, interval.powerEnd);
      } else {
        // For steady intervals, use powerEnd or power
        maxPowerInInterval = interval.powerEnd || interval.power || 0;
      }

      const powerInWatts = maxPowerInInterval * props.ftp;
      if (powerInWatts > maxPowerInWorkout) {
        maxPowerInWorkout = powerInWatts;
      }
    });
  }

  // Add 10% headroom above max power
  const maxPowerScale = maxPowerInWorkout * 1.1;

  // Power uses full height
  yScalePower = d3.scaleLinear().domain([0, maxPowerScale]).range([height, 0]);

  // HR uses top 60% of the chart (values 60-200 bpm mapped to top portion)
  yScaleHR = d3.scaleLinear().domain([60, 200]).range([height * 0.6, 0]);

  // Cadence uses bottom 50% of the chart (values 0-120 rpm mapped to bottom portion)
  yScaleCadence = d3.scaleLinear().domain([0, 120]).range([height, height * 0.5]);

  // Draw workout profile background
  if (props.workout?.intervals) {
    drawWorkoutProfile();
  }

  // Data paths
  svg.append("path").attr("class", "power-line").attr("fill", "none").attr("stroke", "#f59e0b").attr("stroke-width", 4);
  svg.append("path").attr("class", "hr-line").attr("fill", "none").attr("stroke", "#ef4444").attr("stroke-width", 3.5);
  svg.append("path").attr("class", "cadence-line").attr("fill", "none").attr("stroke", "#8b5cf6").attr("stroke-width", 2.5);

  // Current position line
  svg
    .append("line")
    .attr("class", "current-position")
    .attr("stroke", "#3b82f6")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,2")
    .attr("y1", 0)
    .attr("y2", height);

  // Legend (top right)
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 115}, 12)`);

  const legendItems = [
    { color: "#f59e0b", label: "W" },
    { color: "#ef4444", label: "FC" },
    { color: "#8b5cf6", label: "rpm" },
  ];

  legendItems.forEach((item, i) => {
    const g = legend.append("g").attr("transform", `translate(${i * 38}, 0)`);
    g.append("line")
      .attr("x1", 0)
      .attr("x2", 16)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", item.color)
      .attr("stroke-width", 3);
    g.append("text")
      .attr("x", 19)
      .attr("y", 4)
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("fill", "#999")
      .text(item.label);
  });
}

function drawWorkoutProfile() {
  let currentTime = 0;
  props.workout.intervals.forEach((interval) => {
    const startX = xScale(currentTime);
    const endX = xScale(currentTime + interval.duration);
    const intervalWidth = endX - startX;

    let power = interval.power;
    let isRamp = false;

    // Check if this is a ramp interval
    if (interval.powerStart !== undefined && interval.powerEnd !== undefined) {
      power = (interval.powerStart + interval.powerEnd) / 2;
      isRamp = true;
    }

    const targetPower = (power || 0.5) * props.ftp;

    // Draw ramp or rectangle based on interval type
    if (isRamp) {
      // Draw ramp as a polygon/trapezoid
      const powerStartWatts = interval.powerStart * props.ftp;
      const powerEndWatts = interval.powerEnd * props.ftp;
      const startY = yScalePower(powerStartWatts);
      const endY = yScalePower(powerEndWatts);

      svg
        .append("polygon")
        .attr("points", `${startX},${startY} ${endX},${endY} ${endX},${height} ${startX},${height}`)
        .attr("fill", getIntervalColor(interval.type, power))
        .attr("opacity", 0.2);
    } else {
      // Draw rectangle for steady power intervals
      svg
        .append("rect")
        .attr("x", startX)
        .attr("y", yScalePower(targetPower))
        .attr("width", Math.max(0, intervalWidth))
        .attr("height", Math.max(0, height - yScalePower(targetPower)))
        .attr("fill", getIntervalColor(interval.type, power))
        .attr("opacity", 0.2);
    }

    // Add labels only if interval is wide enough (> 40px)
    if (intervalWidth > 40) {
      const centerX = startX + intervalWidth / 2;
      // Position labels at the bottom of the interval
      const labelY = height - 15;

      // Format duration - add "m" for minutes, hide seconds if 0
      const minutes = Math.floor(interval.duration / 60);
      const seconds = interval.duration % 60;
      const durationText = seconds > 0 ? `${minutes}m${seconds.toString().padStart(2, "0")}` : `${minutes}m`;

      // Format power - show range for ramps
      let powerText;
      if (isRamp) {
        const powerStartWatts = Math.round(interval.powerStart * props.ftp);
        const powerEndWatts = Math.round(interval.powerEnd * props.ftp);
        powerText = `${powerStartWatts}-${powerEndWatts}W`;
      } else {
        powerText = `${Math.round(targetPower)}W`;
      }

      // Add background rectangle for better readability
      const labelGroup = svg.append("g");

      // Duration label (left)
      labelGroup
        .append("text")
        .attr("x", centerX)
        .attr("y", labelY - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .attr("fill", "#A9A9A9")
        .attr("paint-order", "stroke")
        .text(durationText);

      // Power label (right)
      labelGroup
        .append("text")
        .attr("x", centerX)
        .attr("y", labelY + 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .attr("fill", "#F5F5F4")
        .attr("paint-order", "stroke")
        .text(powerText);
    }

    currentTime += interval.duration;
  });
}

function getIntervalColor(type, power) {
  // Convert power to percentage (power is in decimal, e.g., 0.67 = 67%)
  const powerPercent = (power || 0.7) * 100;
  const zones = appState.powerZones.value;

  // Determine zone based on configured power percentages
  // Get CSS variable values from computed style
  const computedStyle = getComputedStyle(document.documentElement);
  if (powerPercent <= zones.z1.max) return computedStyle.getPropertyValue("--zone-z1").trim();
  if (powerPercent <= zones.z2.max) return computedStyle.getPropertyValue("--zone-z2").trim();
  if (powerPercent <= zones.z3.max) return computedStyle.getPropertyValue("--zone-z3").trim();
  if (powerPercent <= zones.z4.max) return computedStyle.getPropertyValue("--zone-z4").trim();
  if (powerPercent <= zones.z5.max) return computedStyle.getPropertyValue("--zone-z5").trim();
  if (powerPercent <= zones.z6.max) return computedStyle.getPropertyValue("--zone-z6").trim();
  return computedStyle.getPropertyValue("--zone-z7").trim();
}

function smoothData(data, windowSize = 3) {
  // Applique une moyenne mobile pour lisser les courbes affichées
  if (!data || data.length === 0) return [];
  if (data.length < windowSize) return data;

  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, index + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);

    const validPower = window.filter(p => typeof p.power === 'number' && !isNaN(p.power));
    const validHR = window.filter(p => typeof p.heartRate === 'number' && !isNaN(p.heartRate));
    const validCadence = window.filter(p => typeof p.cadence === 'number' && !isNaN(p.cadence));

    const avgPower = validPower.length > 0 ? validPower.reduce((sum, p) => sum + p.power, 0) / validPower.length : 0;
    const avgHR = validHR.length > 0 ? validHR.reduce((sum, p) => sum + p.heartRate, 0) / validHR.length : 0;
    const avgCadence = validCadence.length > 0 ? validCadence.reduce((sum, p) => sum + p.cadence, 0) / validCadence.length : 0;

    return {
      ...point,
      power: avgPower,
      heartRate: avgHR,
      cadence: avgCadence,
    };
  });
}

function updateChart(data) {
  if (!svg || !xScale || !yScalePower || !yScaleHR || !yScaleCadence) return;
  if (!data || data.length === 0) return;

  // Lisser les données pour l'affichage uniquement
  const smoothedData = smoothData(data, 5);
  if (smoothedData.length === 0) return;

  // Filter out invalid data points for each line
  const validPowerData = smoothedData.filter(d =>
    typeof d.timestamp === 'number' && !isNaN(d.timestamp) &&
    typeof d.power === 'number' && !isNaN(d.power)
  );
  const validHRData = smoothedData.filter(d =>
    typeof d.timestamp === 'number' && !isNaN(d.timestamp) &&
    typeof d.heartRate === 'number' && !isNaN(d.heartRate) && d.heartRate > 0
  );
  const validCadenceData = smoothedData.filter(d =>
    typeof d.timestamp === 'number' && !isNaN(d.timestamp) &&
    typeof d.cadence === 'number' && !isNaN(d.cadence)
  );

  const powerLine = d3
    .line()
    .defined(d => d.power >= 0)
    .x((d) => xScale(d.timestamp))
    .y((d) => yScalePower(d.power))
    .curve(d3.curveMonotoneX);

  const hrLine = d3
    .line()
    .defined(d => d.heartRate > 0)
    .x((d) => xScale(d.timestamp))
    .y((d) => yScaleHR(d.heartRate))
    .curve(d3.curveMonotoneX);

  const cadenceLine = d3
    .line()
    .defined(d => d.cadence >= 0)
    .x((d) => xScale(d.timestamp))
    .y((d) => yScaleCadence(d.cadence))
    .curve(d3.curveMonotoneX);

  // Update lines without transition for smoother real-time updates
  if (validPowerData.length > 0) {
    svg.select(".power-line").datum(validPowerData).attr("d", powerLine);
  }
  if (validHRData.length > 0) {
    svg.select(".hr-line").datum(validHRData).attr("d", hrLine);
  }
  if (validCadenceData.length > 0) {
    svg.select(".cadence-line").datum(validCadenceData).attr("d", cadenceLine);
  }

  updateCurrentPosition();
}

function updateCurrentPosition() {
  if (!svg || !xScale) return;
  const currentX = xScale(props.elapsedSeconds);
  svg.select(".current-position").attr("x1", currentX).attr("x2", currentX);
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div ref="chartRef" class="w-full h-full"></div>
    <div v-if="dataPoints.length === 0" class="text-center text-muted-foreground py-8">En attente des donnees...</div>
  </div>
</template>
