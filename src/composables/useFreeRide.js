/**
 * Free Ride Mode Management
 * Handles unstructured workouts with manual power control
 */

import { ref, computed } from 'vue';
import { useStorage } from './useStorage';
import { useAppState } from './useAppState';
import { logger } from '@/utils/logger';

const storage = useStorage();
const appState = useAppState();

// Singleton state - shared across all components
const targetPower = ref(null);
let isInitialized = false;

/**
 * Initialize free ride state from storage or default
 */
function initialize() {
	if (isInitialized) return;

	const savedPower = storage.getFreeRideTargetPower();
	if (savedPower !== null) {
		targetPower.value = savedPower;
		logger.debug('Free ride: loaded saved power target:', savedPower);
	} else {
		// Default: 55% FTP (Endurance zone)
		targetPower.value = Math.round(appState.ftp.value * 0.55);
		logger.debug('Free ride: initialized with default power (55% FTP):', targetPower.value);
	}

	isInitialized = true;
}

/**
 * Clamp power to valid range [50W, FTP × 1.5]
 */
function clampPower(power) {
	const minPower = 50;
	const maxPower = Math.round(appState.ftp.value * 1.5);

	if (power < minPower) {
		logger.debug(`Free ride: power ${power}W below minimum, clamping to ${minPower}W`);
		return minPower;
	}

	if (power > maxPower) {
		logger.debug(`Free ride: power ${power}W above maximum, clamping to ${maxPower}W`);
		return maxPower;
	}

	return power;
}

/**
 * Create a free ride workout object
 */
function createFreeRideWorkout() {
	return {
		id: 'free-ride',
		name: 'Sortie Libre',
		description: 'Roulez librement sans intervalles structurés',
		duration: Infinity,
		isFreeRide: true,
		intervals: [
			{
				type: 'freeride',
				duration: Infinity,
				power: 0, // Not used in free ride, controlled via targetPower
			},
		],
	};
}

/**
 * Adjust power by delta (+10, -10, +5, -5)
 */
function adjustPower(delta) {
	initialize();

	const newPower = clampPower(targetPower.value + delta);
	targetPower.value = newPower;
	storage.setFreeRideTargetPower(newPower);

	logger.debug(`Free ride: adjusted power by ${delta}W to ${newPower}W`);
	return newPower;
}

/**
 * Set target power to exact value with validation
 */
function setTargetPower(power) {
	const clampedPower = clampPower(Math.round(power));
	targetPower.value = clampedPower;
	storage.setFreeRideTargetPower(clampedPower);

	logger.debug(`Free ride: set power to ${clampedPower}W`);
	return clampedPower;
}

/**
 * Get current target power (initializes if needed)
 */
function getTargetPower() {
	if (!isInitialized) {
		initialize();
	}
	return targetPower.value;
}

/**
 * Reset to default power (55% FTP)
 */
function resetToDefault() {
	const defaultPower = Math.round(appState.ftp.value * 0.55);
	return setTargetPower(defaultPower);
}

/**
 * Calculate smart starting power from previous workout stats
 * @param {number} lastIntervalPower - Average power from last interval
 * @returns {number} Starting power for free ride
 */
function calculateStartingPower(lastIntervalPower = null) {
	initialize();

	if (lastIntervalPower && lastIntervalPower > 0) {
		// Use last interval's average power, clamped to valid range
		return clampPower(lastIntervalPower);
	}

	// Fall back to current target or default
	return targetPower.value;
}

/**
 * Transition to free ride mode from structured workout
 * @param {Object} previousWorkout - The completed structured workout
 * @param {Object} sessionStats - Stats from the completed workout
 * @returns {Object} Free ride workout object
 */
function transitionToFreeRide(previousWorkout, sessionStats) {
	// Calculate smart starting power
	const lastIntervalPower = sessionStats?.intervalPower || null;
	const startPower = calculateStartingPower(lastIntervalPower);

	// Update target power
	setTargetPower(startPower);

	logger.info(`Free ride: transitioned from workout at ${startPower}W`);

	// Return new workout object
	return createFreeRideWorkout();
}

/**
 * Reset free ride state (clear stored power)
 */
function reset() {
	targetPower.value = Math.round(appState.ftp.value * 0.55);
	storage.setFreeRideTargetPower(targetPower.value);
	logger.debug('Free ride: reset to default');
}

/**
 * Export state for debugging
 */
function getState() {
	return {
		targetPower: targetPower.value,
		isInitialized,
		minPower: 50,
		maxPower: Math.round(appState.ftp.value * 1.5),
	};
}

// Singleton API
export function useFreeRide() {
	return {
		// State (read-only)
		targetPower: computed(() => {
			if (!isInitialized) {
				initialize();
			}
			return targetPower.value;
		}),

		// Methods
		createFreeRideWorkout,
		adjustPower,
		setTargetPower,
		getTargetPower,
		resetToDefault,
		calculateStartingPower,
		transitionToFreeRide,
		reset,
		getState,

		// Convenience methods for specific deltas
		adjustUp10: () => adjustPower(10),
		adjustDown10: () => adjustPower(-10),
		adjustUp5: () => adjustPower(5),
		adjustDown5: () => adjustPower(-5),
	};
}
