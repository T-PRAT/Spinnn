<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
  dataPoints: {
    type: Array,
    default: () => []
  }
});

const chartRef = ref(null);
let svg = null;
let xScale = null;
let yScale = null;
let line = null;
let path = null;
let xAxis = null;
let yAxis = null;
let xAxisGroup = null;
let yAxisGroup = null;

const margin = { top: 20, right: 20, bottom: 40, left: 50 };
const width = 600 - margin.left - margin.right;
const height = 300 - margin.top - margin.bottom;

onMounted(() => {
  initChart();
});

watch(() => props.dataPoints, (newData) => {
  if (svg && newData.length > 0) {
    updateChart(newData);
  }
}, { deep: true });

function initChart() {
  if (!chartRef.value) return;

  // Clear any existing SVG
  d3.select(chartRef.value).selectAll('*').remove();

  // Create SVG
  svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create scales
  xScale = d3.scaleLinear()
    .range([0, width]);

  yScale = d3.scaleLinear()
    .range([height, 0])
    .domain([40, 200]); // Typical HR range

  // Create line generator
  line = d3.line()
    .x(d => xScale(d.timestamp))
    .y(d => yScale(d.heartRate))
    .curve(d3.curveMonotoneX);

  // Add X axis
  xAxisGroup = svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .attr('class', 'x-axis');

  // Add Y axis
  yAxisGroup = svg.append('g')
    .attr('class', 'y-axis');

  // Add axis labels
  svg.append('text')
    .attr('transform', `translate(${width / 2},${height + margin.bottom - 5})`)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#666')
    .text('Time (seconds)');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#666')
    .text('Heart Rate (bpm)');

  // Add the line path
  path = svg.append('path')
    .attr('fill', 'none')
    .attr('stroke', '#ef4444')
    .attr('stroke-width', 2);

  // Add grid lines
  svg.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.1)
    .call(d3.axisLeft(yScale)
      .tickSize(-width)
      .tickFormat('')
    );
}

function updateChart(data) {
  if (!svg || data.length === 0) return;

  // Update X scale domain
  const maxTime = d3.max(data, d => d.timestamp) || 0;
  xScale.domain([Math.max(0, maxTime - 120), maxTime]); // Show last 2 minutes

  // Update axes
  xAxis = d3.axisBottom(xScale).ticks(6);
  yAxis = d3.axisLeft(yScale).ticks(8);

  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);

  // Filter data to show only last 2 minutes
  const visibleData = data.filter(d => d.timestamp >= Math.max(0, maxTime - 120));

  // Update line path with smooth transition
  path
    .datum(visibleData)
    .transition()
    .duration(100)
    .attr('d', line);

  // Add current value indicator
  const currentValue = data[data.length - 1];
  
  // Remove old indicator
  svg.selectAll('.current-indicator').remove();

  if (currentValue && currentValue.heartRate > 0) {
    // Add circle at current point
    svg.append('circle')
      .attr('class', 'current-indicator')
      .attr('cx', xScale(currentValue.timestamp))
      .attr('cy', yScale(currentValue.heartRate))
      .attr('r', 4)
      .attr('fill', '#ef4444');

    // Add value label
    svg.append('text')
      .attr('class', 'current-indicator')
      .attr('x', xScale(currentValue.timestamp))
      .attr('y', yScale(currentValue.heartRate) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#ef4444')
      .text(`${currentValue.heartRate} bpm`);
  }
}
</script>

<template>
  <div class="bg-white rounded-lg p-6 border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">❤️ Heart Rate</h3>
    <div ref="chartRef" class="flex justify-center"></div>
    <div v-if="dataPoints.length === 0" class="text-center text-gray-500 py-12">
      No heart rate data yet
    </div>
  </div>
</template>

<style scoped>
:deep(.x-axis),
:deep(.y-axis) {
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
