<script setup>
import { ref, onMounted, watch } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
  dataPoints: {
    type: Array,
    default: () => []
  },
  ftp: {
    type: Number,
    default: 200
  }
});

const chartRef = ref(null);
let svg = null;
let xScale = null;
let yScale = null;
let powerLine = null;
let cadenceLine = null;
let powerPath = null;
let cadencePath = null;
let xAxisGroup = null;
let yAxisLeftGroup = null;
let yAxisRightGroup = null;

const margin = { top: 20, right: 60, bottom: 40, left: 50 };
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

watch(() => props.ftp, () => {
  if (svg && props.dataPoints.length > 0) {
    updateChart(props.dataPoints);
  }
});

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

  // Power scale (left Y axis)
  yScale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, props.ftp * 1.5]); // Show up to 150% FTP

  // Cadence scale (right Y axis)
  const cadenceScale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, 120]); // Typical cadence range

  // Create line generators
  powerLine = d3.line()
    .x(d => xScale(d.timestamp))
    .y(d => yScale(d.power))
    .curve(d3.curveMonotoneX);

  cadenceLine = d3.line()
    .x(d => xScale(d.timestamp))
    .y(d => cadenceScale(d.cadence))
    .curve(d3.curveMonotoneX);

  // Add X axis
  xAxisGroup = svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .attr('class', 'x-axis');

  // Add left Y axis (Power)
  yAxisLeftGroup = svg.append('g')
    .attr('class', 'y-axis-left');

  // Add right Y axis (Cadence)
  yAxisRightGroup = svg.append('g')
    .attr('class', 'y-axis-right')
    .attr('transform', `translate(${width},0)`);

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
    .style('fill', '#f59e0b')
    .text('Power (watts)');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', width + margin.right - 10)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#8b5cf6')
    .text('Cadence (rpm)');

  // Add FTP reference line
  svg.append('line')
    .attr('class', 'ftp-line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', yScale(props.ftp))
    .attr('y2', yScale(props.ftp))
    .attr('stroke', '#10b981')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '5,5')
    .attr('opacity', 0.5);

  svg.append('text')
    .attr('class', 'ftp-label')
    .attr('x', width - 5)
    .attr('y', yScale(props.ftp) - 5)
    .attr('text-anchor', 'end')
    .style('font-size', '10px')
    .style('fill', '#10b981')
    .text(`FTP (${props.ftp}W)`);

  // Add the power line path
  powerPath = svg.append('path')
    .attr('fill', 'none')
    .attr('stroke', '#f59e0b')
    .attr('stroke-width', 2.5);

  // Add the cadence line path
  cadencePath = svg.append('path')
    .attr('fill', 'none')
    .attr('stroke', '#8b5cf6')
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

  // Update power scale based on max power or FTP
  const maxPower = d3.max(data, d => d.power) || props.ftp;
  yScale.domain([0, Math.max(maxPower * 1.2, props.ftp * 1.5)]);

  // Cadence scale
  const cadenceScale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, 120]);

  // Update cadence line generator
  cadenceLine = d3.line()
    .x(d => xScale(d.timestamp))
    .y(d => cadenceScale(d.cadence))
    .curve(d3.curveMonotoneX);

  // Update axes
  const xAxis = d3.axisBottom(xScale).ticks(6);
  const yAxisLeft = d3.axisLeft(yScale).ticks(8);
  const yAxisRight = d3.axisRight(cadenceScale).ticks(8);

  xAxisGroup.call(xAxis);
  yAxisLeftGroup.call(yAxisLeft);
  yAxisRightGroup.call(yAxisRight);

  // Update FTP line position
  svg.select('.ftp-line')
    .attr('y1', yScale(props.ftp))
    .attr('y2', yScale(props.ftp));

  svg.select('.ftp-label')
    .attr('y', yScale(props.ftp) - 5)
    .text(`FTP (${props.ftp}W)`);

  // Filter data to show only last 2 minutes
  const visibleData = data.filter(d => d.timestamp >= Math.max(0, maxTime - 120));

  // Update power line path
  powerPath
    .datum(visibleData)
    .transition()
    .duration(100)
    .attr('d', powerLine);

  // Update cadence line path
  cadencePath
    .datum(visibleData)
    .transition()
    .duration(100)
    .attr('d', cadenceLine);

  // Add current value indicators
  const currentValue = data[data.length - 1];
  
  // Remove old indicators
  svg.selectAll('.current-indicator').remove();

  if (currentValue) {
    // Power indicator
    if (currentValue.power > 0) {
      svg.append('circle')
        .attr('class', 'current-indicator')
        .attr('cx', xScale(currentValue.timestamp))
        .attr('cy', yScale(currentValue.power))
        .attr('r', 4)
        .attr('fill', '#f59e0b');

      svg.append('text')
        .attr('class', 'current-indicator')
        .attr('x', xScale(currentValue.timestamp))
        .attr('y', yScale(currentValue.power) - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#f59e0b')
        .text(`${currentValue.power}W`);
    }

    // Cadence indicator
    if (currentValue.cadence > 0) {
      svg.append('circle')
        .attr('class', 'current-indicator')
        .attr('cx', xScale(currentValue.timestamp))
        .attr('cy', cadenceScale(currentValue.cadence))
        .attr('r', 4)
        .attr('fill', '#8b5cf6');

      svg.append('text')
        .attr('class', 'current-indicator')
        .attr('x', xScale(currentValue.timestamp))
        .attr('y', cadenceScale(currentValue.cadence) + 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#8b5cf6')
        .text(`${currentValue.cadence} rpm`);
    }
  }
}
</script>

<template>
  <div class="bg-white rounded-lg p-6 border border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">⚡ Power & Cadence</h3>
    <div ref="chartRef" class="flex justify-center"></div>
    <div v-if="dataPoints.length === 0" class="text-center text-gray-500 py-12">
      No power/cadence data yet
    </div>
    <div class="flex justify-center gap-6 mt-4 text-sm">
      <div class="flex items-center gap-2">
        <div class="w-4 h-0.5 bg-amber-500"></div>
        <span class="text-gray-600">Power</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-0.5 bg-violet-500"></div>
        <span class="text-gray-600">Cadence</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-0.5 bg-green-500 border-dashed border-t"></div>
        <span class="text-gray-600">FTP</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.x-axis),
:deep(.y-axis-left),
:deep(.y-axis-right) {
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
