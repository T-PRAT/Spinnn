<script setup>
import { computed } from "vue";
import MetricCard from "./MetricCard.vue";
import { useAppState } from "@/composables/useAppState";
import { useI18n } from "@/composables/useI18n";
import { getIntervalColor as getIntervalColorHelper, getCurrentIntervalIndex } from "@/utils/workoutHelpers";

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

const emit = defineEmits(["configure"]);

// Function to find current interval
const currentInterval = computed(() => {
	if (!props.workout) return null;
	const result = getCurrentIntervalIndex(props.elapsedSeconds, props.workout);
	return result === -1 ? null : result.interval;
});

// Progress bar color (based on current interval)
const progressColor = computed(() => {
	if (!currentInterval.value) return "var(--primary)";

	let power = currentInterval.value.power;

	// For ramp intervals, use average of start and end power
	if (
		currentInterval.value.powerStart !== undefined &&
		currentInterval.value.powerEnd !== undefined
	) {
		power =
			(currentInterval.value.powerStart +
				currentInterval.value.powerEnd) /
			2;
	}

	return getIntervalColorHelper(currentInterval.value.type, power, appState.powerZones.value);
});

// Calculate current interval progress (using elapsed for smooth animation)
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

// Elapsed time in current interval in seconds (using elapsed for smooth animation)
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

const intervalDurationText = computed(() => {
	const duration = currentIntervalDuration.value;
	const totalMinutes = Math.floor(duration / 60);
	const seconds = duration % 60;

	if (totalMinutes > 0 && seconds > 0) {
		return `${totalMinutes}m${seconds}s`;
	} else if (totalMinutes > 0) {
		return `${totalMinutes}m`;
	} else {
		return `${seconds}s`;
	}
});

// Check if current interval is a ramp
const isRampInterval = computed(() => {
	const interval = currentInterval.value;
	return (
		interval &&
		interval.powerStart !== undefined &&
		interval.powerEnd !== undefined
	);
});

// For ramp intervals: start power
const rampPowerStart = computed(() => {
	if (!isRampInterval.value) return null;
	const interval = currentInterval.value;
	return Math.round(interval.powerStart * appState.ftp.value);
});

// For ramp intervals: end power
const rampPowerEnd = computed(() => {
	if (!isRampInterval.value) return null;
	const interval = currentInterval.value;
	return Math.round(interval.powerEnd * appState.ftp.value);
});

// For normal intervals: target power
const intervalPowerText = computed(() => {
	if (isRampInterval.value) return null; // Not used for ramps
	return `${props.currentTargetPower || 0}W`;
});

const intervalConnector = computed(() => {
	if (isRampInterval.value) {
		return t("workout.intervalPowerConnectorRamp");
	}
	return t("workout.intervalPowerConnector");
});
</script>

<template>
	<div
		class="grid grid-cols-6 gap-0.5 p-0.5 md:gap-2 md:p-2 flex-shrink-0 relative"
		id="metrics-grid"
	>
		<!-- Left side -->
		<div class="flex flex-col gap-0.5 md:gap-2 self-stretch">
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
				class="bg-card rounded-lg p-1 md:p-4 text-center border border-border h-full flex flex-col justify-center"
			>
				<div
					class="text-[9px] md:text-xs text-muted-foreground mb-0.5 md:mb-2"
				>
					{{ t("workout.powerLabel") }}
				</div>
				<div
					class="text-3xl md:text-8xl font-bold text-chart-1 mb-0.5 md:mb-2 leading-none"
				>
					{{ currentMetrics.power
					}}<span class="text-sm md:text-2xl ml-0.5 md:ml-1">{{
						t("metrics.watts")
					}}</span>
				</div>
				<hr class="border-border opacity-50" />
				<div
					class="grid grid-cols-2 gap-1 md:gap-4 mt-1 md:mt-3 text-center"
				>
					<div>
						<div
							class="text-[9px] md:text-xs text-muted-foreground mb-0.5 md:mb-1"
						>
							{{ t("workout.powerInterval") }}
						</div>
						<div
							class="text-sm md:text-xl lg:text-2xl font-bold text-chart-1"
						>
							{{ session.intervalPower.value
							}}<span
								class="text-[10px] md:text-sm ml-0.5 md:ml-1"
								>{{ t("metrics.watts") }}</span
							>
						</div>
					</div>
					<div>
						<div
							class="text-[9px] md:text-xs text-muted-foreground mb-0.5 md:mb-1"
						>
							{{ t("workout.powerMax") }}
						</div>
						<div
							class="text-sm md:text-xl lg:text-2xl font-bold text-chart-1"
						>
							{{ session.maxPower.value
							}}<span
								class="text-[10px] md:text-sm ml-0.5 md:ml-1"
								>{{ t("metrics.watts") }}</span
							>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Middle section: Heart Rate -->
		<div class="col-span-2 self-stretch">
			<div
				class="bg-card rounded-lg p-1 md:p-4 text-center border border-border h-full flex flex-col justify-center"
			>
				<div
					class="text-[9px] md:text-xs text-muted-foreground mb-0.5 md:mb-2"
				>
					{{ t("workout.heartRateLabel") }}
				</div>
				<div
					class="text-3xl md:text-8xl font-bold text-destructive mb-0.5 md:mb-2 leading-none"
				>
					{{ currentMetrics.heartRate
					}}<span class="text-sm md:text-2xl ml-0.5 md:ml-1">{{
						t("metrics.bpm")
					}}</span>
				</div>
				<hr class="border-border opacity-50" />
				<div
					class="grid grid-cols-2 gap-1 md:gap-4 mt-1 md:mt-3 text-center"
				>
					<div>
						<div
							class="text-[9px] md:text-xs text-muted-foreground mb-0.5 md:mb-1"
						>
							{{ t("workout.heartRateInterval") }}
						</div>
						<div
							class="text-sm md:text-xl lg:text-2xl font-bold text-destructive"
						>
							{{ session.intervalHeartRate.value
							}}<span
								class="text-[10px] md:text-sm ml-0.5 md:ml-1"
								>{{ t("metrics.bpm") }}</span
							>
						</div>
					</div>
					<div>
						<div
							class="text-[9px] md:text-xs text-muted-foreground mb-0.5 md:mb-1"
						>
							{{ t("workout.heartRateMax") }}
						</div>
						<div
							class="text-sm md:text-xl lg:text-2xl font-bold text-destructive"
						>
							{{ session.maxHeartRate.value
							}}<span
								class="text-[10px] md:text-sm ml-0.5 md:ml-1"
								>{{ t("metrics.bpm") }}</span
							>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Right side -->
		<div class="flex flex-col gap-0.5 md:gap-2 self-stretch">
			<MetricCard
				v-for="slot in rightSlots"
				:key="slot.id"
				:slot-id="slot.id"
				:label="slot.label"
				:value="slot.value"
				@configure="emit('configure', $event)"
			/>
		</div>

		<!-- Interval progress bar row -->
		<div
			class="col-span-6 bg-card rounded-lg border border-border p-1 md:p-3"
		>
			<div class="flex items-center gap-1 md:gap-3">
				<!-- Left: Duration + Power text -->
				<div class="flex-shrink-0 text-left min-w-fit">
					<div
						class="bg-muted/50 border border-border rounded px-1.5 py-1 md:px-3 md:py-1.5"
					>
						<!-- Normal interval display -->
						<div
							v-if="!isRampInterval"
							class="text-sm md:text-lg text-foreground flex items-baseline gap-1 md:gap-1.5"
						>
							<span class="font-bold tabular-nums">{{
								intervalDurationText
							}}</span>
							<span class="font-normal text-muted-foreground">{{
								intervalConnector
							}}</span>
							<span class="font-bold tabular-nums">{{
								intervalPowerText
							}}</span>
						</div>
						<!-- Ramp interval display -->
						<div
							v-else
							class="text-sm md:text-lg text-foreground flex items-baseline gap-1 md:gap-1.5"
						>
							<span class="font-bold tabular-nums">{{
								intervalDurationText
							}}</span>
							<span class="font-normal text-muted-foreground">{{
								intervalConnector
							}}</span>
							<span class="font-bold tabular-nums">{{
								rampPowerStart
							}}</span>
							<span class="font-normal text-muted-foreground">{{
								t("workout.intervalPowerRangeTo")
							}}</span>
							<span class="font-bold tabular-nums"
								>{{ rampPowerEnd }}W</span
							>
						</div>
					</div>
				</div>

				<!-- Center: Progress bar -->
				<div
					class="flex-1 h-2 md:h-4 bg-muted rounded-full overflow-hidden relative"
				>
					<div
						class="absolute top-0 left-0 bottom-0 transition-all duration-75 ease-out"
						:style="{
							width: `${intervalProgress}%`,
							backgroundColor: progressColor,
						}"
					></div>
				</div>

				<!-- Right: Remaining seconds countdown -->
				<div class="flex-shrink-0 text-right min-w-fit">
					<div
						class="bg-muted/50 border border-border rounded px-1.5 py-1 md:px-3 md:py-1.5"
					>
						<div
							class="text-lg md:text-2xl font-bold tabular-nums text-foreground"
						>
							{{
								Math.round(
									currentIntervalDuration -
										currentIntervalElapsed,
								)
							}}s
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
