<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import WorkoutChart from "../components/workout/WorkoutChart.vue";
import MetricsGrid from "../components/workout/MetricsGrid.vue";
import MetricConfigModal from "../components/workout/MetricConfigModal.vue";
import DeviceStatusButton from "../components/device/DeviceStatusButton.vue";
import { useAppState } from "../composables/useAppState";
import { useWorkoutSession } from "../composables/useWorkoutSession";
import { useBluetoothHRM } from "../composables/useBluetoothHRM";
import { useBluetoothTrainer, ControlMode } from "../composables/useBluetoothTrainer";
import { useMockDevices } from "../composables/useMockDevices";
import { useAudioSettings } from "../composables/useAudioSettings";
import { getTargetPowerAtTime } from "../data/sampleWorkouts";

const router = useRouter();
const appState = useAppState();
const session = useWorkoutSession();
const hrm = useBluetoothHRM();
const trainer = useBluetoothTrainer();
const mockDevices = useMockDevices();
const audioSettings = useAudioSettings();

const showStopConfirmation = ref(false);
const showReconnectMenu = ref(false);
const currentIntervalIndex = ref(-1);
const showMetricConfig = ref(false);
const selectedSlotId = ref(null);
let dataInterval = null;
let ergInterval = null;
let lastTargetPower = 0;

// Auto-pause/start based on power
const autoPauseEnabled = ref(true);
const powerActiveSeconds = ref(0);
const powerInactiveSeconds = ref(0);
const POWER_START_THRESHOLD = 3; // seconds of power > 0 to auto-start
const POWER_PAUSE_THRESHOLD = 5; // seconds of power = 0 to auto-pause

// Configuration des métriques par slot
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

const metricsConfig = ref({ ...defaultMetricsConfig });

// Charger la configuration depuis localStorage
const savedMetricsConfig = localStorage.getItem("spinnn_metrics_config");
if (savedMetricsConfig) {
	try {
		metricsConfig.value = {
			...defaultMetricsConfig,
			...JSON.parse(savedMetricsConfig),
		};
	} catch (e) {
		console.warn("Failed to load metrics config", e);
	}
}

// Métriques disponibles
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

// ERG mode control - available modes
const controlModes = [
	{ id: ControlMode.ERG, label: "ERG", description: "Puissance cible" },
	{ id: ControlMode.SIM, label: "SIM", description: "Simulation pente" },
	{ id: ControlMode.RESISTANCE, label: "RES", description: "Résistance fixe" },
	{ id: ControlMode.PASSIVE, label: "OFF", description: "Libre" },
];

// Current target power based on workout interval
const currentTargetPower = computed(() => {
	if (!appState.selectedWorkout.value) return 0;
	return getTargetPowerAtTime(
		appState.selectedWorkout.value,
		session.elapsedSeconds.value,
		appState.ftp.value
	);
});

// Update trainer ERG target power
async function updateERGPower() {
	if (appState.mockModeActive.value) return;
	if (!trainer.hasControl.value) return;
	if (trainer.controlMode.value !== ControlMode.ERG) return;
	if (session.isPaused.value) return;

	const target = currentTargetPower.value;
	if (target > 0 && target !== lastTargetPower) {
		await trainer.setTargetPower(target);
		lastTargetPower = target;
	}
}

// Start ERG control loop (updates every second for ramps)
function startERGControl() {
	if (ergInterval) return;
	ergInterval = setInterval(updateERGPower, 1000);
	// Initial update
	updateERGPower();
}

// Stop ERG control loop
function stopERGControl() {
	if (ergInterval) {
		clearInterval(ergInterval);
		ergInterval = null;
	}
}

// Change control mode
async function changeControlMode(mode) {
	trainer.setControlMode(mode);

	if (mode === ControlMode.ERG) {
		lastTargetPower = 0; // Force update
		await updateERGPower();
	} else if (mode === ControlMode.SIM) {
		// Default to 0% grade
		await trainer.setSimulation(0);
	} else if (mode === ControlMode.RESISTANCE) {
		// Default to 50% resistance
		await trainer.setResistance(50);
	}
}

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
		localStorage.setItem(
			"spinnn_metrics_config",
			JSON.stringify(metricsConfig.value),
		);
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

onMounted(() => {
	// Try to load saved workout state if session is not active
	if (!session.isActive.value) {
		const wasLoaded = session.loadWorkoutState();

		if (!wasLoaded) {
			// No saved workout, redirect to setup
			router.push({ name: "setup" });
			return;
		}
	}

	// Use workout from session (loaded from localStorage) if appState is empty
	if (!appState.selectedWorkout.value && session.workout.value) {
		appState.setWorkout(session.workout.value);
	}

	// Verify we have a workout before continuing
	if (!appState.selectedWorkout.value) {
		router.push({ name: "setup" });
		return;
	}

	if (appState.mockModeActive.value && !mockDevices.isActive.value) {
		mockDevices.start(appState.selectedWorkout.value, appState.ftp.value);
	}

	// Start paused if auto-pause is enabled (waiting for pedaling)
	if (autoPauseEnabled.value && !session.isPaused.value) {
		session.pause();
	}

	startDataCollection();
	startERGControl();
});

onBeforeUnmount(() => {
	stopDataCollection();
	stopERGControl();

	if (appState.mockModeActive.value && mockDevices.isActive.value) {
		mockDevices.stop();
	}
});

function startDataCollection() {
	dataInterval = setInterval(() => {
		const currentPower = appState.mockModeActive.value
			? mockDevices.power.value
			: trainer.power.value;

		// Auto-pause/start logic
		if (autoPauseEnabled.value && session.isActive.value) {
			if (currentPower > 0) {
				powerActiveSeconds.value++;
				powerInactiveSeconds.value = 0;
				// Auto-start after POWER_START_THRESHOLD seconds of power
				if (session.isPaused.value && powerActiveSeconds.value >= POWER_START_THRESHOLD) {
					session.resume();
					powerActiveSeconds.value = 0;
				}
			} else {
				powerActiveSeconds.value = 0;
				powerInactiveSeconds.value++;
				// Auto-pause after POWER_PAUSE_THRESHOLD seconds without power
				if (!session.isPaused.value && powerInactiveSeconds.value >= POWER_PAUSE_THRESHOLD) {
					session.pause();
				}
			}
		}

		// Record data only when not paused
		if (!session.isPaused.value && session.isActive.value) {
			const data = appState.mockModeActive.value
				? {
						heartRate: mockDevices.heartRate.value,
						power: mockDevices.power.value,
						cadence: mockDevices.cadence.value,
						speed: mockDevices.speed.value,
					}
				: {
						heartRate: hrm.heartRate.value,
						power: trainer.power.value,
						cadence: trainer.cadence.value,
						speed: trainer.speed.value,
					};
			session.recordDataPoint(data);
		}
	}, 1000);
}

function stopDataCollection() {
	if (dataInterval) {
		clearInterval(dataInterval);
		dataInterval = null;
	}
}

function togglePause() {
	// Disable auto-pause when user manually controls
	autoPauseEnabled.value = false;

	if (session.isPaused.value) {
		session.resume();
	} else {
		session.pause();
	}
}

// Re-enable auto-pause
function enableAutoPause() {
	autoPauseEnabled.value = true;
	powerActiveSeconds.value = 0;
	powerInactiveSeconds.value = 0;
}

// Check if waiting for pedaling
const isWaitingForPedaling = computed(() => {
	return autoPauseEnabled.value && session.isPaused.value && session.isActive.value;
});

function confirmStop() {
	showStopConfirmation.value = true;
}

function cancelStop() {
	showStopConfirmation.value = false;
}

function proceedStop() {
	showStopConfirmation.value = false;
	stopWorkout();
}

function stopWorkout() {
	session.stop();
	stopDataCollection();
	appState.finishWorkout();
	router.push({ name: "summary" });
}

// Helper function to find next interval start time
function findNextIntervalStartTime() {
	if (!appState.selectedWorkout.value) return null;

	const intervals = appState.selectedWorkout.value.intervals;
	let currentTime = 0;
	const elapsed = session.elapsedSeconds.value;

	// Find which interval we're currently in
	for (const interval of intervals) {
		if (elapsed < currentTime + interval.duration) {
			// We're in this interval, return the start of the next one
			return currentTime + interval.duration;
		}
		currentTime += interval.duration;
	}

	// We're past all intervals
	return null;
}

// Skip to next interval
function skipToNextInterval() {
	const nextIntervalStart = findNextIntervalStartTime();

	if (nextIntervalStart === null || nextIntervalStart >= appState.selectedWorkout.value.duration) {
		return; // Already at last interval or workout complete
	}

	// Jump to next interval start time
	session.elapsedSeconds.value = nextIntervalStart;

	// Resume if paused to get ERG updates
	if (session.isPaused.value) {
		session.resume();
	}

	// Update ERG power immediately
	updateERGPower();
}

watch(
	() => session.isWorkoutComplete.value,
	(isComplete) => {
		if (isComplete && session.isActive.value) {
			stopWorkout();
		}
	},
);

const progressPercentage = computed(() => {
	if (
		!appState.selectedWorkout.value ||
		appState.selectedWorkout.value.duration === 0
	)
		return 0;
	return (
		(session.elapsedSeconds.value /
			appState.selectedWorkout.value.duration) *
		100
	);
});

const currentMetrics = computed(() => {
	if (session.dataPoints.value.length === 0) {
		return { power: 0, heartRate: 0, cadence: 0, speed: 0, distance: 0 };
	}
	return session.dataPoints.value[session.dataPoints.value.length - 1];
});

const hasDisconnectedDevices = computed(() => {
	if (appState.mockModeActive.value) return false;
	return !hrm.isConnected.value || !trainer.isConnected.value;
});

const deviceStatus = computed(() => {
	return {
		hrm: {
			connected: hrm.isConnected.value || appState.mockModeActive.value,
			connecting: hrm.isConnecting.value,
		},
		trainer: {
			connected:
				trainer.isConnected.value || appState.mockModeActive.value,
			connecting: trainer.isConnecting.value,
		},
	};
});

async function reconnectHRM() {
	await hrm.connect();
}

async function reconnectTrainer() {
	await trainer.connect();
}

watch(
	() => session.elapsedSeconds.value,
	(newElapsedSeconds) => {
		if (!appState.selectedWorkout.value || session.isPaused.value) return;

		const currentIntervalInfo = session.getCurrentIntervalIndex(
			newElapsedSeconds,
			appState.selectedWorkout.value,
		);
		const newIntervalIndex = currentIntervalInfo.index;

		if (
			newIntervalIndex !== currentIntervalIndex.value &&
			newIntervalIndex >= 0
		) {
			const previousIndex = currentIntervalIndex.value;
			currentIntervalIndex.value = newIntervalIndex;

			if (previousIndex >= 0) {
				audioSettings.playIntervalSound();
			}
		}
	},
);

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
		<div class="mx-1 mt-1 md:mx-2 md:mt-2 shrink-0">
			<div class="relative bg-card rounded-lg border border-border px-2 py-1.5 md:px-4 md:py-3 overflow-hidden">
			<div
				class="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-500 rounded-bl-lg"
				:class="{ 'rounded-br-lg': progressPercentage >= 100 }"
				:style="{ width: `${progressPercentage}%` }"
			></div>

			<div class="flex items-center justify-between relative z-10">
				<div class="flex-1 min-w-0">
					<h2 class="text-sm md:text-lg font-bold text-foreground truncate">
						{{ appState.selectedWorkout.value?.name }}
					</h2>
					<p class="text-[10px] md:text-xs text-muted-foreground truncate hidden sm:block">
						{{ appState.selectedWorkout.value?.description }}
					</p>
				</div>

				<div class="text-right ml-2 md:ml-4">
					<div class="text-xl md:text-2xl font-bold text-primary leading-tight">
						{{ session.formattedElapsedTime.value }}
					</div>
					<div class="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
						/ {{ session.formattedWorkoutDuration.value }}
					</div>
				</div>

			</div>
			</div>
		</div>

		<!-- Indicateur d'attente de pédalage -->
		<div
			v-if="isWaitingForPedaling"
			class="bg-primary/10 border-b border-primary/30 px-4 py-2 flex items-center justify-center gap-3"
		>
			<span class="text-xl animate-bounce">🚴</span>
			<span class="text-sm font-medium text-primary">Pédalez pour démarrer</span>
			<span class="text-xs text-primary/70">({{ powerActiveSeconds }}/{{ POWER_START_THRESHOLD }}s)</span>
		</div>

		<!-- 2. Zone métriques -->
		<MetricsGrid
			:current-metrics="currentMetrics"
			:session="session"
			:left-slots="leftSlots"
			:right-slots="rightSlots"
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
		<div class="px-1 pb-1 md:px-2 md:pb-2 shrink-0">
			<div class="bg-card rounded-lg border border-border h-[140px] md:h-[250px]">
				<WorkoutChart
					:data-points="session.dataPoints.value"
					:ftp="appState.ftp.value"
					:workout="appState.selectedWorkout.value"
					:elapsed-seconds="session.elapsedSeconds.value"
				/>
			</div>
		</div>

		<!-- 4. Pied de page -->
		<div class="mx-1 mb-1 md:mx-2 md:mb-2 shrink-0">
			<div
				class="flex items-center justify-between px-2 py-3 md:px-4 md:py-8 bg-card rounded-lg border border-border gap-2 md:gap-4"
			>
			<!-- Gauche : Mode ERG et puissance cible -->
			<div class="flex items-center gap-2 md:gap-3">
				<!-- Sélecteur de mode -->
				<div v-if="!appState.mockModeActive.value && trainer.ftmsSupported.value" class="flex rounded-lg overflow-hidden border border-border">
					<button
						v-for="mode in controlModes"
						:key="mode.id"
						@click="changeControlMode(mode.id)"
						:class="[
							'px-2 py-1 text-[10px] md:text-xs font-medium transition-colors',
							trainer.controlMode.value === mode.id
								? 'bg-primary text-primary-foreground'
								: 'bg-card text-muted-foreground hover:bg-muted'
						]"
						:title="mode.description"
					>
						{{ mode.label }}
					</button>
				</div>
				<!-- Puissance cible -->
				<div v-if="trainer.controlMode.value === 'erg' && currentTargetPower > 0" class="text-center">
					<div class="text-[10px] text-muted-foreground">Cible</div>
					<div class="text-sm md:text-base font-bold text-primary">{{ currentTargetPower }}W</div>
				</div>
				<!-- Boutons de connexion -->
				<div v-if="!appState.mockModeActive.value" class="flex gap-1 md:gap-2">
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

			<!-- Centre : Boutons de contrôle -->
			<div class="flex gap-1 md:gap-2 justify-center">
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
					<span class="hidden sm:inline">{{ session.isPaused.value ? "Reprendre" : "Pause" }}</span>
				</button>

				<button
					@click="skipToNextInterval"
					:disabled="!findNextIntervalStartTime() || findNextIntervalStartTime() >= appState.selectedWorkout.value?.duration"
					class="px-3 md:px-6 py-1.5 md:py-2 bg-chart-4 hover:bg-chart-4/90 text-primary-foreground rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<svg
						class="w-3 h-3 md:w-4 md:h-4"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path d="M4.5 4.5a1 1 0 011.414 0L8 6.586l2.086-2.086a1 1 0 111.414 1.414L9.414 8l2.086 2.086a1 1 0 11-1.414 1.414L8 9.414l-2.086 2.086a1 1 0 11-1.414-1.414L6.586 8 4.5 5.914A1 1 0 014.5 4.5zm9 0a1 1 0 011.414 0L17 6.586l2.086-2.086a1 1 0 111.414 1.414L18.414 8l2.086 2.086a1 1 0 11-1.414 1.414L17 9.414l-2.086 2.086a1 1 0 11-1.414-1.414L15.586 8 13.5 5.914a1 1 0 010-1.414z" />
					</svg>
					<span class="hidden sm:inline">Suivant</span>
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
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="hidden sm:inline">Arrêter</span>
				</button>
			</div>
			</div>
		</div>

		<!-- Modal de confirmation d'arrêt -->
		<div
			v-if="showStopConfirmation"
			class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
			@click.self="cancelStop"
		>
			<div
				class="bg-card border border-border rounded-lg p-6 max-w-md mx-4 shadow-lg"
			>
				<h3 class="text-lg font-semibold text-foreground mb-3">
					Arrêter l'entraînement ?
				</h3>
				<p class="text-muted-foreground mb-6">
					Êtes-vous sûr de vouloir arrêter la séance ? Vos données
					seront sauvegardées.
				</p>
				<div class="flex gap-3 justify-end">
					<button
						@click="cancelStop"
						class="px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
					>
						Annuler
					</button>
					<button
						@click="proceedStop"
						class="px-4 py-2 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
					>
						Arrêter la séance
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
