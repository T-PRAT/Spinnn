<script setup>
import { ref, computed } from "vue";
import WorkoutChart from "@/components/workout/WorkoutChart.vue";
import MetricsGrid from "@/components/workout/MetricsGrid.vue";
import MetricConfigModal from "@/components/workout/MetricConfigModal.vue";
import DeviceStatusButton from "@/components/device/DeviceStatusButton.vue";
import FreeRidePowerControl from "@/components/workout/FreeRidePowerControl.vue";
import WorkoutLayoutSwitcher from "@/components/workout/WorkoutLayoutSwitcher.vue";
import { useStorage } from "@/composables/useStorage";

// Vue classique : en-tête de progression, grille de métriques configurable, graphique et
// pied de page de contrôle. Toute la logique de séance vient du contrôleur partagé
// (useWorkoutController), ce layout ne fait qu'afficher son état et appeler ses actions.
const props = defineProps({
	ctrl: {
		type: Object,
		required: true,
	},
});

const storage = useStorage();

// On garde les noms du template d'origine
const {
	t,
	appState,
	session,
	trainer,
	powerAdjustments,
	currentMetrics,
	currentTargetPower,
	progressPercentage,
	isWaitingForPedaling,
	canSkipInterval,
	controlModes,
	deviceStatus,
	togglePause,
	skipToNextInterval,
	confirmStop,
	changeControlMode,
	handleFreeRidePowerChange,
	adjustCurrentIntervalUp,
	adjustCurrentIntervalDown,
	resetCurrentInterval,
	adjustGlobalWorkoutUp,
	adjustGlobalWorkoutDown,
	resetGlobalWorkout,
	reconnectHRM,
	reconnectTrainer,
} = props.ctrl;

// Configuration des métriques : propre à la vue classique
const showMetricConfig = ref(false);
const selectedSlotId = ref(null);

const defaultMetricsConfig = {
	1: "speed",
	2: "distance",
	3: "energy",
	4: "power",
	5: "intervalPower",
	6: "heartRate",
	7: "intervalHeartRate",
	8: "cadence",
	9: "intervalRemainingTime",
	10: "energy",
};

// Load metrics config from storage
const savedMetricsConfig = storage.getMetricsConfig();
const metricsConfig = ref({
	...defaultMetricsConfig,
	...(savedMetricsConfig || {})
});

const availableMetrics = [
	{ id: "power", label: "Puissance" },
	{ id: "heartRate", label: "FC" },
	{ id: "cadence", label: "Cadence" },
	{ id: "speed", label: "Vitesse" },
	{ id: "distance", label: "Distance" },
	{ id: "energy", label: "Énergie" },
	{ id: "intervalPower", label: "Puissance Tour" },
	{ id: "intervalHeartRate", label: "FC Tour" },
	{ id: "intervalRemainingTime", label: "Temps Restant" },
	{ id: "elapsedTime", label: "Temps Écoulé" },
	{ id: "avgPower", label: "Puissance Moy" },
	{ id: "avgHeartRate", label: "FC Moy" },
	{ id: "avgCadence", label: "Cadence Moy" },
];

function openMetricConfig(slotId) {
	selectedSlotId.value = slotId;
	showMetricConfig.value = true;
}

function closeMetricConfig() {
	showMetricConfig.value = false;
	selectedSlotId.value = null;
}

const selectedMetricId = computed(() => {
	if (selectedSlotId.value && metricsConfig.value[selectedSlotId.value]) {
		return metricsConfig.value[selectedSlotId.value];
	}
	return "power";
});

function selectMetric(metricId) {
	if (selectedSlotId.value) {
		metricsConfig.value[selectedSlotId.value] = metricId;
		storage.setMetricsConfig(metricsConfig.value);
	}
	showMetricConfig.value = false;
}

function getMetricLabel(slotId) {
	const metricId = metricsConfig.value[slotId];
	const metric = availableMetrics.find((m) => m.id === metricId);
	return metric?.label || "---";
}

function getMetricValue(slotId) {
	const metricId = metricsConfig.value[slotId];
	const m = currentMetrics.value;
	const s = session;

	switch (metricId) {
		case "power":
			return `${m.power} W`;
		case "heartRate":
			return `${m.heartRate} bpm`;
		case "cadence":
			return `${m.cadence} rpm`;
		case "speed":
			return `${(m.speed * 3.6).toFixed(1)} km/h`;
		case "distance":
			return `${(m.distance / 1000).toFixed(2)} km`;
		case "energy":
			return `${s.energy.value} kcal`;
		case "intervalPower":
			return `${s.intervalPower.value} W`;
		case "intervalHeartRate":
			return `${s.intervalHeartRate.value} bpm`;
		case "intervalRemainingTime":
			return s.formattedIntervalRemainingTime.value;
		case "elapsedTime":
			return s.formattedElapsedTime.value;
		case "avgPower":
			return `${Math.round(s.avgPower.value)} W`;
		case "avgHeartRate":
			return `${Math.round(s.avgHeartRate.value)} bpm`;
		case "avgCadence":
			return `${Math.round(s.avgCadence.value)} rpm`;
		default:
			return "---";
	}
}

// Computed properties for slots
const leftSlots = computed(() => [
	{ id: 1, label: getMetricLabel(1), value: getMetricValue(1) },
	{ id: 2, label: getMetricLabel(2), value: getMetricValue(2) },
]);

const rightSlots = computed(() => [
	{ id: 3, label: getMetricLabel(3), value: getMetricValue(3) },
	{ id: 8, label: getMetricLabel(8), value: getMetricValue(8) },
]);
</script>

<template>
	<div class="flex flex-col h-full overflow-hidden">
		<!-- 1. Barre principale avec progression intégrée -->
		<div class="mx-0.5 mt-0.5 md:mx-2 md:mt-2 shrink-0">
			<div
				class="relative bg-card rounded-lg border border-border px-1.5 py-1 md:px-4 md:py-3 overflow-hidden"
			>
				<div
					class="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500 rounded-bl-lg"
					:class="{ 'rounded-br-lg': progressPercentage >= 100 }"
					:style="{ width: `${progressPercentage}%` }"
				></div>

				<div class="flex items-center justify-between relative z-10">
					<div class="flex-1 min-w-0">
						<h2
							class="text-[11px] md:text-lg font-bold text-foreground truncate"
						>
							{{ appState.selectedWorkout.value?.name }}
						</h2>
						<p
							class="text-[9px] md:text-xs text-muted-foreground truncate hidden sm:block"
						>
							{{ appState.selectedWorkout.value?.description }}
						</p>
					</div>

					<div class="text-right ml-1.5 md:ml-4">
						<div
							class="text-base md:text-2xl font-bold leading-tight"
							:class="
								session.isWorkoutComplete.value
									? 'text-orange-500'
									: 'text-primary'
							"
						>
							{{ session.formattedElapsedTime.value }}
						</div>
						<div
							class="text-[9px] md:text-xs text-muted-foreground hidden sm:block"
						>
							{{
								session.isWorkoutComplete.value
									? "(Entraînement terminé)"
									: `/ ${session.formattedWorkoutDuration.value}`
							}}
						</div>
					</div>

					<div class="ml-1.5 md:ml-3 shrink-0">
						<WorkoutLayoutSwitcher />
					</div>
				</div>
			</div>
		</div>

		<!-- 2. Zone métriques -->
		<MetricsGrid
			:current-metrics="currentMetrics"
			:session="session"
			:left-slots="leftSlots"
			:right-slots="rightSlots"
			:current-target-power="currentTargetPower"
			:workout="appState.selectedWorkout.value"
			:elapsed-seconds="session.elapsedSeconds.value"
			@configure="openMetricConfig"
		/>

		<!-- Modal de configuration des métriques -->
		<MetricConfigModal
			:show="showMetricConfig"
			:available-metrics="availableMetrics"
			:selected-metric-id="selectedMetricId"
			@close="closeMetricConfig"
			@select="selectMetric"
		/>

		<!-- 3. Graphique principal -->
		<div class="px-0.5 pb-0.5 md:px-2 md:pb-2 flex-1 min-h-0 flex flex-col">
			<div
				class="bg-card rounded-lg border border-border flex-1 min-h-[80px] md:min-h-[120px]"
			>
				<WorkoutChart
					:data-points="session.dataPoints.value"
					:ftp="appState.ftp.value"
					:workout="appState.selectedWorkout.value"
					:elapsed-seconds="session.elapsedSeconds.value"
					:target-power="currentTargetPower"
				/>
			</div>
		</div>

		<!-- Waiting for pedaling indicator -->
		<div
			v-if="isWaitingForPedaling"
			class="mx-0.5 md:mx-2 mb-0.5 md:mb-2 shrink-0"
		>
			<div
				class="bg-primary/10 border border-primary/30 rounded-lg px-2 py-1.5 md:px-4 md:py-3 flex items-center justify-center gap-2 md:gap-3"
			>
				<span class="text-base md:text-xl animate-bounce">🚴</span>
				<span class="text-[11px] md:text-sm font-medium text-primary">{{
					t("workout.pedalToStart")
				}}</span>
			</div>
		</div>

		<!-- Workout complete - continuation message - NOT shown in free ride mode -->
		<div
			v-if="session.isWorkoutComplete.value && session.isActive.value && !appState.selectedWorkout.value?.isFreeRide"
			class="mx-0.5 md:mx-2 mb-0.5 md:mb-2 shrink-0"
		>
			<div
				class="bg-muted/50 border border-border rounded-lg px-2 py-1.5 md:px-4 md:py-2 flex items-center justify-center gap-2"
			>
				<span class="text-xs md:text-sm text-muted-foreground"
					>Entraînement terminé • Continuez à pédaler ou arrêtez</span
				>
			</div>
		</div>

		<!-- 4. Footer -->
		<div class="mx-0.5 mb-0.5 md:mx-2 md:mb-2 shrink-0">
			<div
				class="flex items-center px-1.5 py-2 md:px-4 md:py-8 bg-card rounded-lg border border-border gap-1 md:gap-4"
			>
				<!-- Left: ERG mode and target power -->
				<div class="flex items-center gap-2 md:gap-3 flex-shrink-0">
					<!-- Mode selector -->
					<div
						v-if="
							!appState.mockModeActive.value &&
							trainer.ftmsSupported.value
						"
						class="flex rounded-lg overflow-hidden border-2 border-border shadow-sm"
					>
						<button
							v-for="mode in controlModes"
							:key="mode.id"
							@click="changeControlMode(mode.id)"
							:class="[
								'px-3 py-1.5 text-xs md:text-sm font-bold transition-all',
								trainer.controlMode.value === mode.id
									? 'bg-primary text-primary-foreground shadow-inner'
									: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
							]"
							:title="mode.description || undefined"
						>
							{{ mode.label }}
						</button>
					</div>
					<!-- Connection buttons -->
					<div
						v-if="!appState.mockModeActive.value"
						class="flex flex-col gap-0.5"
					>
						<DeviceStatusButton
							type="hrm"
							:connected="deviceStatus.hrm.connected"
							:connecting="deviceStatus.hrm.connecting"
							@reconnect="reconnectHRM"
						/>
						<DeviceStatusButton
							type="trainer"
							:connected="deviceStatus.trainer.connected"
							:connecting="deviceStatus.trainer.connecting"
							@reconnect="reconnectTrainer"
						/>
					</div>
				</div>

				<!-- Power adjustment buttons - ONLY for structured workouts -->
				<div
					v-if="!appState.selectedWorkout.value?.isFreeRide"
					class="flex gap-1 md:gap-2 flex-shrink-0"
				>
					<!-- Current interval adjustment -->
					<div class="flex flex-col items-center gap-0.5">
						<span
							class="text-[8px] md:text-[9px] text-muted-foreground font-semibold uppercase tracking-wide"
							>{{ t("workout.intervalLabel") }}</span
						>
						<div
							class="flex rounded-lg overflow-hidden border-2 border-border shadow-sm"
						>
							<button
								@click="adjustCurrentIntervalDown"
								:disabled="session.isWorkoutComplete.value"
								class="px-2 py-1.5 text-xs md:text-sm font-bold transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
								:title="t('workout.adjustCurrentDown')"
							>
								<svg
									class="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M20 12H4"
									/>
								</svg>
							</button>
							<button
								@click="resetCurrentInterval"
								:disabled="
									session.isWorkoutComplete.value ||
									powerAdjustments.currentIntervalOffset
										.value === 0
								"
								class="px-1.5 py-1.5 text-[9px] md:text-xs font-bold bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[2rem] text-center flex items-center justify-center transition-all"
								:class="{
									'text-muted-foreground':
										powerAdjustments.currentIntervalOffset
											.value > 0,
									'text-destructive':
										powerAdjustments.currentIntervalOffset
											.value < 0,
									'text-muted-foreground':
										powerAdjustments.currentIntervalOffset
											.value === 0,
								}"
								:title="t('workout.currentOffset')"
							>
								{{
									powerAdjustments.formattedCurrentOffset
										.value
								}}
							</button>
							<button
								@click="adjustCurrentIntervalUp"
								:disabled="session.isWorkoutComplete.value"
								class="px-2 py-1.5 text-xs md:text-sm font-bold transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
								:title="t('workout.adjustCurrentUp')"
							>
								<svg
									class="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</button>
						</div>
					</div>

					<!-- Global workout adjustment -->
					<div class="flex flex-col items-center gap-0.5">
						<span
							class="text-[8px] md:text-[9px] text-muted-foreground font-semibold uppercase tracking-wide"
							>{{ t("workout.globalLabel") }}</span
						>
						<div
							class="flex rounded-lg overflow-hidden border-2 border-border shadow-sm"
						>
							<button
								@click="adjustGlobalWorkoutDown"
								:disabled="session.isWorkoutComplete.value"
								class="px-2 py-1.5 text-xs md:text-sm font-bold transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
								:title="t('workout.adjustGlobalDown')"
							>
								<svg
									class="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M20 12H4"
									/>
								</svg>
							</button>
							<button
								@click="resetGlobalWorkout"
								:disabled="
									session.isWorkoutComplete.value ||
									powerAdjustments.globalOffset.value === 0
								"
								class="px-1.5 py-1.5 text-[9px] md:text-xs font-bold bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-[2rem] text-center flex items-center justify-center transition-all"
								:class="{
									'text-accent-foreground':
										powerAdjustments.globalOffset.value > 0,
									'text-destructive':
										powerAdjustments.globalOffset.value < 0,
									'text-muted-foreground':
										powerAdjustments.globalOffset.value ===
										0,
								}"
								:title="t('workout.globalOffset')"
							>
								{{
									powerAdjustments.formattedGlobalOffset.value
								}}
							</button>
							<button
								@click="adjustGlobalWorkoutUp"
								:disabled="session.isWorkoutComplete.value"
								class="px-2 py-1.5 text-xs md:text-sm font-bold transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
								:title="t('workout.adjustGlobalUp')"
							>
								<svg
									class="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>

				<!-- Free Ride Power Control - ONLY for free ride mode -->
				<div
					v-if="appState.selectedWorkout.value?.isFreeRide"
					class="flex gap-2 md:gap-3 flex-shrink-0 items-center"
				>
					<FreeRidePowerControl
						:current-power="currentTargetPower"
						:ftp="appState.ftp.value"
						:min-power="50"
						:max-power="appState.ftp.value * 1.5"
						@power-change="handleFreeRidePowerChange"
					/>
				</div>

				<!-- Center: Empty space -->
				<div class="flex-1"></div>

				<!-- Right: Control buttons -->
				<div class="flex gap-1 md:gap-2 flex-shrink-0">
					<button
						@click="togglePause"
						:class="[
							'px-3 md:px-6 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1 md:gap-2',
							session.isPaused.value
								? 'bg-chart-3 hover:bg-chart-3/90 text-primary-foreground'
								: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
						]"
					>
						<svg
							v-if="session.isPaused.value"
							class="w-3 h-3 md:w-4 md:h-4"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
								clip-rule="evenodd"
							/>
						</svg>
						<svg
							v-else
							class="w-3 h-3 md:w-4 md:h-4"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="hidden sm:inline">{{
							session.isPaused.value
								? t("common.buttons.resume")
								: t("common.buttons.pause")
						}}</span>
					</button>

					<button
						v-if="!appState.selectedWorkout.value?.isFreeRide"
						@click="skipToNextInterval"
						:disabled="!canSkipInterval"
						class="px-3 md:px-6 py-1.5 md:py-2 bg-chart-4 hover:bg-chart-4/90 text-primary-foreground rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg
							class="w-3 h-3 md:w-4 md:h-4"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								d="M4.5 4.5a.75.75 0 011.06 0l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 01-1.06-1.06L7.69 8.5l-3.19-3.19a.75.75 0 010-1.06z"
							/>
							<path
								d="M9.5 4.5a.75.75 0 011.06 0l3.75 3.75a.75.75 0 010 1.06l-3.75 3.75a.75.75 0 11-1.06-1.06L12.69 8.5l-3.19-3.19a.75.75 0 010-1.06z"
							/>
						</svg>
						<span class="hidden sm:inline">{{
							t("workout.skipToNext")
						}}</span>
					</button>

					<button
						@click="confirmStop"
						class="px-3 md:px-6 py-1.5 md:py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1 md:gap-2"
					>
						<svg
							class="w-3 h-3 md:w-4 md:h-4"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								,
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="hidden sm:inline">{{
							t("common.buttons.stop")
						}}</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
