/**
 * Contrôleur de la séance en cours.
 *
 * Regroupe toute la logique de la vue d'entraînement (collecte des données, pilotage ERG,
 * auto-pause, passage au bloc suivant, arrêt, sortie libre, bip de fin de bloc) sans aucune
 * présentation. Les layouts (classique, anneau, ...) reçoivent ce contrôleur en prop et se
 * contentent d'afficher son état et d'appeler ses actions.
 *
 * Ce n'est PAS un singleton : il pose des timers et des hooks de cycle de vie, il doit donc
 * être instancié une seule fois, par WorkoutView. C'est ce qui permet de changer de layout en
 * pleine séance sans interrompre la collecte de données ni le pilotage du home trainer.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useAppState } from "@/composables/useAppState";
import { useWorkoutSession } from "@/composables/useWorkoutSession";
import { useBluetoothHRM } from "@/composables/useBluetoothHRM";
import {
	useBluetoothTrainer,
	ControlMode,
} from "@/composables/useBluetoothTrainer";
import { useMockDevices } from "@/composables/useMockDevices";
import { useAudioSettings } from "@/composables/useAudioSettings";
import { useI18n } from "@/composables/useI18n";
import { usePowerAdjustments } from "@/composables/usePowerAdjustments";
import { useFreeRide } from "@/composables/useFreeRide";
import { getAdjustedTargetPowerAtTime } from "@/data/sampleWorkouts";

const POWER_START_THRESHOLD = 0;
const POWER_PAUSE_THRESHOLD = 5;

export function useWorkoutController() {
	const router = useRouter();
	const appState = useAppState();
	const session = useWorkoutSession();
	const hrm = useBluetoothHRM();
	const trainer = useBluetoothTrainer();
	const mockDevices = useMockDevices();
	const audioSettings = useAudioSettings();
	const powerAdjustments = usePowerAdjustments();
	const freeRide = useFreeRide();
	const { t } = useI18n();

	const showStopConfirmation = ref(false);
	const showFreeRideToast = ref(false);
	const currentIntervalIndex = ref(-1);
	const countdownPlayedForInterval = ref(-1); // Track which interval had countdown played
	let dataInterval = null;
	let ergInterval = null;
	let lastTargetPower = 0;

	// Auto-pause/start based on power
	const autoPauseEnabled = ref(true);
	const powerActiveSeconds = ref(0);
	const powerInactiveSeconds = ref(0);

	// ERG mode control - available modes
	const controlModes = computed(() => [
		{
			id: ControlMode.ERG,
			label: t("workout.controlModes.erg"),
			description: t("workout.controlModeDescriptions.erg"),
		},
		{
			id: ControlMode.SIM,
			label: t("workout.controlModes.sim"),
			description: t("workout.controlModeDescriptions.sim"),
		},
		{
			id: ControlMode.RESISTANCE,
			label: t("workout.controlModes.res"),
			description: t("workout.controlModeDescriptions.res"),
		},
		{
			id: ControlMode.PASSIVE,
			label: t("workout.controlModes.passive"),
			description: t("workout.controlModeDescriptions.passive"),
		},
	]);

	// Current target power based on workout interval or free ride
	const currentTargetPower = computed(() => {
		if (!appState.selectedWorkout.value) return 0;

		// Free ride mode: use free ride target power
		if (appState.selectedWorkout.value.isFreeRide) {
			return freeRide.targetPower.value;
		}

		// Structured workout: use workout target power
		if (session.isWorkoutComplete.value) return 0; // Workout completed
		return getAdjustedTargetPowerAtTime(
			appState.selectedWorkout.value,
			session.elapsedSeconds.value,
			appState.ftp.value,
			powerAdjustments.currentIntervalOffset.value,
			powerAdjustments.globalOffset.value,
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

	// Handle free ride power changes
	function handleFreeRidePowerChange(newPower) {
		freeRide.setTargetPower(newPower);

		// Immediately send to trainer if ERG mode is active
		if (!appState.mockModeActive.value &&
		    trainer.controlMode.value === ControlMode.ERG &&
		    trainer.hasControl.value) {
			trainer.setTargetPower(newPower);
			lastTargetPower = newPower;
		}
	}

	// Transition to free ride after structured workout completes
	function transitionToFreeRide() {
		if (!appState.selectedWorkout.value || appState.selectedWorkout.value.isFreeRide) {
			return; // Already in free ride mode or no workout
		}

		// Calculate smart starting power from last interval
		const lastIntervalPower = session.intervalPower.value;
		const startPower = freeRide.calculateStartingPower(lastIntervalPower);

		// Create and set free ride workout
		const freeRideWorkout = freeRide.createFreeRideWorkout();
		appState.setWorkout(freeRideWorkout);

		// Set target power
		freeRide.setTargetPower(startPower);

		// Send to trainer if ERG mode is active
		if (!appState.mockModeActive.value &&
		    trainer.controlMode.value === ControlMode.ERG &&
		    trainer.hasControl.value) {
			trainer.setTargetPower(startPower);
			lastTargetPower = startPower;
		}

		// Show transition toast
		showFreeRideToast.value = true;
		setTimeout(() => {
			showFreeRideToast.value = false;
		}, 3000);
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

		// Check current power level
		const currentPower = appState.mockModeActive.value
			? mockDevices.power.value
			: trainer.power.value;

		// Start paused only if no power detected
		if (
			autoPauseEnabled.value &&
			currentPower === 0 &&
			!session.isPaused.value
		) {
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
					if (
						session.isPaused.value &&
						powerActiveSeconds.value >= POWER_START_THRESHOLD
					) {
						session.resume();
						powerActiveSeconds.value = 0;
					}
				} else {
					powerActiveSeconds.value = 0;
					powerInactiveSeconds.value++;
					// Auto-pause after POWER_PAUSE_THRESHOLD seconds without power
					if (
						!session.isPaused.value &&
						powerInactiveSeconds.value >= POWER_PAUSE_THRESHOLD
					) {
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

	function adjustCurrentIntervalUp() {
		const delta = 0.05; // +5%
		powerAdjustments.adjustCurrentInterval(delta);
		updateERGPower();
	}

	function adjustCurrentIntervalDown() {
		const delta = -0.05; // -5%
		powerAdjustments.adjustCurrentInterval(delta);
		updateERGPower();
	}

	function resetCurrentInterval() {
		powerAdjustments.resetCurrentIntervalOffset();
		updateERGPower();
	}

	function adjustGlobalWorkoutUp() {
		const delta = 0.05; // +5%
		powerAdjustments.adjustGlobalWorkout(delta);
		updateERGPower();
	}

	function adjustGlobalWorkoutDown() {
		const delta = -0.05; // -5%
		powerAdjustments.adjustGlobalWorkout(delta);
		updateERGPower();
	}

	function resetGlobalWorkout() {
		powerAdjustments.globalOffset.value = 0;
		updateERGPower();
	}

	// Check if waiting for pedaling
	const isWaitingForPedaling = computed(() => {
		return (
			autoPauseEnabled.value &&
			session.isPaused.value &&
			session.isActive.value
		);
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
		powerAdjustments.resetAll();
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

	// Le bouton "bloc suivant" est actif tant qu'il existe un bloc après l'actuel
	const canSkipInterval = computed(() => {
		const nextIntervalStart = findNextIntervalStartTime();
		if (!nextIntervalStart) return false;
		return !(nextIntervalStart >= appState.selectedWorkout.value.duration);
	});

	// Skip to next interval
	async function skipToNextInterval() {
		const nextIntervalStart = findNextIntervalStartTime();

		if (
			nextIntervalStart === null ||
			nextIntervalStart >= appState.selectedWorkout.value.duration
		) {
			return; // Already at last interval or workout complete
		}

		// Use setElapsedSeconds to properly adjust the time tracking
		session.setElapsedSeconds(nextIntervalStart);

		// Resume if paused to get ERG updates
		if (session.isPaused.value) {
			session.resume();
		}

		// Update ERG power immediately and wait for it to complete
		await updateERGPower();
	}

	const progressPercentage = computed(() => {
		if (
			!appState.selectedWorkout.value ||
			appState.selectedWorkout.value.duration === 0
		)
			return 0;
		return Math.min(
			100,
			(session.elapsedSeconds.value /
				appState.selectedWorkout.value.duration) *
				100,
		);
	});

	// Transition to free ride or switch to PASSIVE when workout completes
	watch(
		() => session.isWorkoutComplete.value,
		(isComplete) => {
			if (isComplete) {
				// Check if already in free ride mode
				if (appState.selectedWorkout.value && appState.selectedWorkout.value.isFreeRide) {
					return; // Already in free ride, do nothing
				}

				// Auto-transition to free ride mode
				transitionToFreeRide();
			}
		},
	);

	const currentMetrics = computed(() => {
		if (session.dataPoints.value.length === 0) {
			return { power: 0, heartRate: 0, cadence: 0, speed: 0, distance: 0 };
		}
		return session.dataPoints.value[session.dataPoints.value.length - 1];
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

			// Update current interval index
			if (
				newIntervalIndex !== currentIntervalIndex.value &&
				newIntervalIndex >= 0
			) {
				currentIntervalIndex.value = newIntervalIndex;
				// Reset countdown tracker when changing intervals
				if (newIntervalIndex !== countdownPlayedForInterval.value) {
					countdownPlayedForInterval.value = -1;
				}
			}

			// Play countdown 3 seconds before interval ends
			if (
				newIntervalIndex >= 0 &&
				newIntervalIndex !== countdownPlayedForInterval.value
			) {
				const intervalDuration =
					currentIntervalInfo.interval?.duration || 0;
				const intervalEndTime =
					currentIntervalInfo.startTime + intervalDuration;
				const timeUntilEnd = intervalEndTime - newElapsedSeconds;

				// Trigger countdown when 3 seconds remain (only once per interval)
				if (timeUntilEnd <= 3.0 && timeUntilEnd > 2.9) {
					audioSettings.playIntervalSound();
					countdownPlayedForInterval.value = newIntervalIndex;
				}
			}
		},
	);

	return {
		// Singletons partagés, exposés pour que les layouts n'aient pas à les ré-instancier
		t,
		appState,
		session,
		trainer,
		powerAdjustments,

		// État dérivé
		currentMetrics,
		currentTargetPower,
		progressPercentage,
		isWaitingForPedaling,
		canSkipInterval,
		controlModes,
		deviceStatus,

		// Pause, bloc suivant, arrêt
		togglePause,
		skipToNextInterval,
		confirmStop,
		cancelStop,
		proceedStop,
		showStopConfirmation,

		// Pilotage du home trainer
		changeControlMode,
		reconnectHRM,
		reconnectTrainer,

		// Ajustements de puissance (structuré) et sortie libre
		adjustCurrentIntervalUp,
		adjustCurrentIntervalDown,
		resetCurrentInterval,
		adjustGlobalWorkoutUp,
		adjustGlobalWorkoutDown,
		resetGlobalWorkout,
		handleFreeRidePowerChange,
		showFreeRideToast,
	};
}
