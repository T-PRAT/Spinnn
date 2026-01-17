<script setup>
import { computed } from 'vue';
import MetricCard from './MetricCard.vue';
import { useAppState } from '@/composables/useAppState';
import { useI18n } from '@/composables/useI18n';

const appState = useAppState();
const { t } = useI18n();

const props = defineProps({
	currentMetrics: {
		type: Object,
		required: true,
	},
	session: {
		type: Object,
		required: true,
	},
	leftSlots: {
		type: Array,
		required: true,
	},
	rightSlots: {
		type: Array,
		required: true,
	},
	currentTargetPower: {
		type: Number,
		default: 0,
	},
	workout: {
		type: Object,
		default: null,
	},
	elapsedSeconds: {
		type: Number,
		default: 0,
	},
});

const emit = defineEmits(['configure']);

// Function to find current interval
const currentInterval = computed(() => {
	if (!props.workout) return null;

	const intervals = props.workout.intervals;
	let currentTime = 0;
	const elapsed = props.elapsedSeconds;

	for (const interval of intervals) {
		if (elapsed < currentTime + interval.duration) {
			return interval;
		}
		currentTime += interval.duration;
	}

	return null;
});

// Function to get current interval color (same logic as WorkoutChart)
function getIntervalColor(type, power) {
	// Convert power to percentage (power is in decimal, e.g., 0.67 = 67%)
	const powerPercent = (power || 0.7) * 100;
	const zones = appState.powerZones.value;

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

// Progress bar color (based on current interval)
const progressColor = computed(() => {
	if (!currentInterval.value) return 'var(--primary)';

	let power = currentInterval.value.power;

	// For ramp intervals, use average of start and end power
	if (currentInterval.value.powerStart !== undefined && currentInterval.value.powerEnd !== undefined) {
		power = (currentInterval.value.powerStart + currentInterval.value.powerEnd) / 2;
	}

	return getIntervalColor(currentInterval.value.type, power);
});

// Calculate current interval progress
const intervalProgress = computed(() => {
	if (!props.workout) return 0;

	const intervals = props.workout.intervals;
	let currentTime = 0;
	const elapsed = props.elapsedSeconds;

	// Find current interval
	for (const interval of intervals) {
		if (elapsed < currentTime + interval.duration) {
			// In this interval
			const intervalElapsed = elapsed - currentTime;
			return (intervalElapsed / interval.duration) * 100;
		}
		currentTime += interval.duration;
	}

	return 100;
});

// Elapsed time in current interval in seconds
const currentIntervalElapsed = computed(() => {
	if (!props.workout) return 0;

	const intervals = props.workout.intervals;
	let currentTime = 0;
	const elapsed = props.elapsedSeconds;

	for (const interval of intervals) {
		if (elapsed < currentTime + interval.duration) {
			return elapsed - currentTime;
		}
		currentTime += interval.duration;
	}

	return 0;
});

// Current interval duration
const currentIntervalDuration = computed(() => {
	if (!props.workout) return 0;

	const intervals = props.workout.intervals;
	let currentTime = 0;
	const elapsed = props.elapsedSeconds;

	for (const interval of intervals) {
		if (elapsed < currentTime + interval.duration) {
			return interval.duration;
		}
		currentTime += interval.duration;
	}

	return 0;
});

// Format time (e.g., 30s, 1m)
function formatTime(seconds) {
	if (seconds >= 60) {
		const mins = Math.floor(seconds / 60);
		return `${mins}m`;
	}
	return `${seconds}s`;
}
</script>

<template>
	<div
		class="grid grid-cols-6 gap-1 p-1 md:gap-2 md:p-2 flex-shrink-0 relative"
		id="metrics-grid"
	>
		<!-- Left side -->
		<div class="flex flex-col gap-1 md:gap-2 self-stretch">
			<MetricCard
				v-for="slot in leftSlots"
				:key="slot.id"
				:slot-id="slot.id"
				:label="slot.label"
				:value="slot.value"
				@configure="emit('configure', $event)"
			/>
		</div>

		<!-- Middle section: Power -->
		<div class="col-span-2 self-stretch">
			<div
				class="bg-card rounded-lg p-2 md:p-4 text-center border border-border h-full flex flex-col justify-center"
			>
				<div class="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-2">
					{{ t('workout.powerLabel') }}
				</div>
				<div class="text-4xl md:text-8xl font-bold text-chart-1 mb-1 md:mb-2 leading-none">
					{{ currentMetrics.power
					}}<span class="text-lg md:text-2xl ml-1">{{ t('metrics.watts') }}</span>
				</div>
				<hr class="border-border opacity-50" />
				<div class="grid grid-cols-3 gap-2 md:gap-4 mt-2 md:mt-3 text-center">
					<div>
						<div class="text-[10px] md:text-xs text-muted-foreground mb-1">{{ t('workout.powerTarget') }}</div>
						<div class="text-base md:text-xl lg:text-2xl font-bold text-chart-1">
							{{ currentTargetPower
							}}<span class="text-xs md:text-sm ml-1">{{ t('metrics.watts') }}</span>
						</div>
					</div>
					<div>
						<div class="text-[10px] md:text-xs text-muted-foreground mb-1">{{ t('workout.powerMax') }}</div>
						<div class="text-base md:text-xl lg:text-2xl font-bold text-chart-1">
							{{ session.maxPower.value
							}}<span class="text-xs md:text-sm ml-1">{{ t('metrics.watts') }}</span>
						</div>
					</div>
					<div>
						<div class="text-[10px] md:text-xs text-muted-foreground mb-1">{{ t('workout.powerInterval') }}</div>
						<div class="text-base md:text-xl lg:text-2xl font-bold text-chart-1">
							{{ session.intervalPower.value
							}}<span class="text-xs md:text-sm ml-1">{{ t('metrics.watts') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Middle section: Heart Rate -->
		<div class="col-span-2 self-stretch">
			<div
				class="bg-card rounded-lg p-2 md:p-4 text-center border border-border h-full flex flex-col justify-center"
			>
				<div class="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-2">{{ t('workout.heartRateLabel') }}</div>
				<div class="text-4xl md:text-8xl font-bold text-destructive mb-1 md:mb-2 leading-none">
					{{ currentMetrics.heartRate
					}}<span class="text-lg md:text-2xl ml-1">{{ t('metrics.bpm') }}</span>
				</div>
				<hr class="border-border opacity-50" />
				<div class="grid grid-cols-2 gap-2 md:gap-4 mt-2 md:mt-3 text-center">
					<div>
						<div class="text-[10px] md:text-xs text-muted-foreground mb-1">{{ t('workout.heartRateMax') }}</div>
						<div class="text-base md:text-xl lg:text-2xl font-bold text-destructive">
							{{ session.maxHeartRate.value
							}}<span class="text-xs md:text-sm ml-1">{{ t('metrics.bpm') }}</span>
						</div>
					</div>
					<div>
						<div class="text-[10px] md:text-xs text-muted-foreground mb-1">{{ t('workout.heartRateInterval') }}</div>
						<div class="text-base md:text-xl lg:text-2xl font-bold text-destructive">
							{{ session.intervalHeartRate.value
							}}<span class="text-xs md:text-sm ml-1">{{ t('metrics.bpm') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Right side -->
		<div class="flex flex-col gap-1 md:gap-2 self-stretch">
			<MetricCard
				v-for="slot in rightSlots"
				:key="slot.id"
				:slot-id="slot.id"
				:label="slot.label"
				:value="slot.value"
				@configure="emit('configure', $event)"
			/>
		</div>

		<!-- Horizontal progress bar + interval time (spans 4 middle columns) -->
		<div class="col-start-2 col-span-4 flex items-center gap-2 md:gap-3">
			<!-- Affichage du temps intervalle -->
			<div class="text-[10px] md:text-xs font-bold text-foreground text-right whitespace-nowrap min-w-fit">
				{{ formatTime(currentIntervalElapsed) }} / {{ formatTime(currentIntervalDuration) }}
			</div>
			<!-- Barre de progression horizontale avec couleur de la zone -->
			<div class="flex-1 h-3 md:h-4 bg-muted rounded-full overflow-hidden relative">
				<div
					class="absolute top-0 left-0 bottom-0 transition-all duration-300"
					:style="{ width: `${intervalProgress}%`, backgroundColor: progressColor }"
				></div>
			</div>
		</div>
	</div>
</template>
