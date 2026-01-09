<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
  dataPoints: { type: Array, default: () => [] },
  ftp: { type: Number, default: 200 },
  workout: { type: Object, default: null },
  elapsedSeconds: { type: Number, default: 0 }
});

const chartRef = ref(null);
let svg = null;
let xScale = null;
let yScalePower = null;
let yScaleHR = null;

const margin = { top: 20, right: 80, bottom: 40, left: 60 };
let width = 800;
const height = 280;

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

function handleResize() {
  if (chartRef.value) {
    initChart();
    if (props.dataPoints.length > 0) {
      updateChart(props.dataPoints);
    }
  }
}

watch(() => props.dataPoints, (newData) => {
  if (svg && newData.length > 0) {
    updateChart(newData);
  }
}, { deep: true });

watch(() => props.elapsedSeconds, () => {
  if (svg) {
    updateCurrentPosition();
  }
});

function initChart() {
  if (!chartRef.value) return;

  d3.select(chartRef.value).selectAll('*').remove();

  const containerWidth = chartRef.value.clientWidth;
  width = containerWidth - margin.left - margin.right;

  svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const totalDuration = props.workout?.duration || 3600;
  xScale = d3.scaleLinear().domain([0, totalDuration]).range([0, width]);
  yScalePower = d3.scaleLinear().domain([0, props.ftp * 1.5]).range([height, 0]);
  yScaleHR = d3.scaleLinear().domain([60, 200]).range([height, 0]);

  // Draw workout profile background
  if (props.workout?.intervals) {
    drawWorkoutProfile();
  }

  // Grid
  svg.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.1)
    .call(d3.axisLeft(yScalePower).tickSize(-width).tickFormat(''));

  // Axes
  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d => {
      const mins = Math.floor(d / 60);
      const secs = d % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }).ticks(10));

  svg.append('g')
    .attr('class', 'y-axis-power')
    .call(d3.axisLeft(yScalePower).ticks(8));

  svg.append('g')
    .attr('class', 'y-axis-hr')
    .attr('transform', `translate(${width},0)`)
    .call(d3.axisRight(yScaleHR).ticks(8));

  // Axis labels
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 15)
    .attr('x', -height / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#f59e0b')
    .text('Puissance (W)');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', width + margin.right - 15)
    .attr('x', -height / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#ef4444')
    .text('FC (bpm)');

  // FTP line
  svg.append('line')
    .attr('class', 'ftp-line')
    .attr('x1', 0).attr('x2', width)
    .attr('y1', yScalePower(props.ftp))
    .attr('y2', yScalePower(props.ftp))
    .attr('stroke', '#10b981')
    .attr('stroke-dasharray', '5,5')
    .attr('stroke-width', 1.5);

  svg.append('text')
    .attr('x', 5)
    .attr('y', yScalePower(props.ftp) - 5)
    .style('font-size', '10px')
    .style('fill', '#10b981')
    .text(`FTP ${props.ftp}W`);

  // Data paths
  svg.append('path').attr('class', 'power-line').attr('fill', 'none').attr('stroke', '#f59e0b').attr('stroke-width', 2.5);
  svg.append('path').attr('class', 'hr-line').attr('fill', 'none').attr('stroke', '#ef4444').attr('stroke-width', 2);

  // Current position line
  svg.append('line')
    .attr('class', 'current-position')
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '4,2')
    .attr('y1', 0)
    .attr('y2', height);
}

function drawWorkoutProfile() {
  let currentTime = 0;
  props.workout.intervals.forEach(interval => {
    const startX = xScale(currentTime);
    const endX = xScale(currentTime + interval.duration);

    let power = interval.power;
    if (power === undefined && interval.powerStart !== undefined && interval.powerEnd !== undefined) {
      power = (interval.powerStart + interval.powerEnd) / 2;
    }
    const targetPower = (power || 0.5) * props.ftp;

    svg.append('rect')
      .attr('x', startX)
      .attr('y', yScalePower(targetPower))
      .attr('width', Math.max(0, endX - startX))
      .attr('height', Math.max(0, height - yScalePower(targetPower)))
      .attr('fill', getIntervalColor(interval.type))
      .attr('opacity', 0.2);

    currentTime += interval.duration;
  });
}

function getIntervalColor(type) {
  const colors = {
    warmup: '#22c55e',
    cooldown: '#22c55e',
    recovery: '#3b82f6',
    steady: '#f59e0b',
    work: '#ef4444',
    ramp: '#8b5cf6'
  };
  return colors[type] || '#6b7280';
}

function updateChart(data) {
  if (!svg || data.length === 0) return;

  const powerLine = d3.line()
    .x(d => xScale(d.timestamp))
    .y(d => yScalePower(d.power))
    .curve(d3.curveMonotoneX);

  const hrLine = d3.line()
    .x(d => xScale(d.timestamp))
    .y(d => yScaleHR(d.heartRate))
    .curve(d3.curveMonotoneX);

  svg.select('.power-line')
    .datum(data)
    .transition()
    .duration(100)
    .attr('d', powerLine);

  svg.select('.hr-line')
    .datum(data)
    .transition()
    .duration(100)
    .attr('d', hrLine);

  updateCurrentPosition();
}

function updateCurrentPosition() {
  if (!svg || !xScale) return;
  const currentX = xScale(props.elapsedSeconds);
  svg.select('.current-position')
    .attr('x1', currentX)
    .attr('x2', currentX);
}
</script>

<template>
  <div>
    <div ref="chartRef" class="w-full"></div>
    <div v-if="dataPoints.length === 0" class="text-center text-gray-500 py-8">
      En attente des donnees...
    </div>
    <div class="flex justify-center gap-6 mt-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="w-4 h-1 bg-amber-500 rounded"></div>
        <span class="text-gray-600">Puissance</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-1 bg-red-500 rounded"></div>
        <span class="text-gray-600">Frequence cardiaque</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-0.5 bg-green-500 border-dashed"></div>
        <span class="text-gray-600">FTP</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-0.5 bg-blue-500 border-dashed"></div>
        <span class="text-gray-600">Position actuelle</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.x-axis),
:deep(.y-axis-power),
:deep(.y-axis-hr) {
  font-size: 11px;
  color: #666;
}

:deep(.grid line) {
  stroke: #ddd;
}

:deep(.grid path) {
  stroke-width: 0;
}
</style>
