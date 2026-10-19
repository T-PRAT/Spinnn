<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { FREE_RIDE_STEP } from "@/composables/useRingWorkoutView";

// Barre de contrôle de la vue Anneau : pause, ajustements de puissance, bloc suivant, arrêt,
// et accès aux paramètres (le changement de vue s'y fait aussi). En sortie libre, les ajustements en % laissent la place à un réglage
// direct de la puissance cible.
const props = defineProps({
	ctrl: {
		type: Object,
		required: true,
	},
	// Modèle d'affichage de la vue (useRingWorkoutView)
	view: {
		type: Object,
		required: true,
	},
});

const {
	t,
	session,
	powerAdjustments,
	canSkipInterval,
	currentTargetPower,
	togglePause,
	skipToNextInterval,
	confirmStop,
	adjustCurrentIntervalDown,
	adjustCurrentIntervalUp,
	resetCurrentInterval,
	adjustGlobalWorkoutDown,
	adjustGlobalWorkoutUp,
	resetGlobalWorkout,
} = props.ctrl;
const router = useRouter();
const { isFreeRide, canStepFreeRideDown, canStepFreeRideUp, stepFreeRidePower } = props.view;

const isPaused = computed(() => session.isPaused.value);

// Deux ajustements en % : celui du bloc en cours (remis à zéro au bloc suivant) et celui de
// toute la séance. Cliquer sur la valeur remet l'ajustement à zéro.
const groups = computed(() => [
	{
		key: "block",
		label: t("workout.ring.adjustBlock"),
		resetTitle: t("workout.currentOffset"),
		downLabel: t("workout.adjustCurrentDown"),
		upLabel: t("workout.adjustCurrentUp"),
		offset: powerAdjustments.currentIntervalOffset.value,
		text: powerAdjustments.formattedCurrentOffset.value,
		down: adjustCurrentIntervalDown,
		up: adjustCurrentIntervalUp,
		reset: resetCurrentInterval,
	},
	{
		key: "session",
		label: t("workout.ring.adjustSession"),
		resetTitle: t("workout.globalOffset"),
		downLabel: t("workout.adjustGlobalDown"),
		upLabel: t("workout.adjustGlobalUp"),
		offset: powerAdjustments.globalOffset.value,
		text: powerAdjustments.formattedGlobalOffset.value,
		down: adjustGlobalWorkoutDown,
		up: adjustGlobalWorkoutUp,
		reset: resetGlobalWorkout,
	},
]);

// Les ajustements n'ont plus de sens une fois la séance terminée (la sortie libre prend le relais)
const adjustDisabled = computed(() => session.isWorkoutComplete.value);
const freeRideTarget = computed(() => Math.round(currentTargetPower.value));
</script>

<template>
	<div class="bar" role="toolbar" :aria-label="t('workout.ring.controls')">
		<!-- Ajustements de puissance : à gauche, ce qu'on règle à l'effort -->
		<div class="cluster cluster--adjust">
			<template v-if="!isFreeRide">
				<div
					v-for="group in groups"
					:key="group.key"
					class="group"
					role="group"
					:aria-label="group.label"
				>
					<button
						type="button"
						class="step"
						:disabled="adjustDisabled"
						:aria-label="group.downLabel"
						:title="group.downLabel"
						@click="group.down()"
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
							<path d="M6 12h12" />
						</svg>
					</button>
					<button
						type="button"
						class="value"
						:class="{ 'is-up': group.offset > 0, 'is-down': group.offset < 0 }"
						:disabled="adjustDisabled || group.offset === 0"
						:title="group.resetTitle"
						@click="group.reset()"
					>
						<span class="value__text">{{ group.text }}</span>
						<span class="group__label" aria-hidden="true">{{ group.label }}</span>
					</button>
					<button
						type="button"
						class="step"
						:disabled="adjustDisabled"
						:aria-label="group.upLabel"
						:title="group.upLabel"
						@click="group.up()"
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
							<path d="M12 6v12M6 12h12" />
						</svg>
					</button>
				</div>
			</template>

			<div v-else class="group" role="group" :aria-label="t('workout.ring.targetLabel')">
				<button
					type="button"
					class="step"
					:disabled="!canStepFreeRideDown"
					:aria-label="t('workout.ring.freeRideDown', { step: FREE_RIDE_STEP })"
					:title="t('workout.ring.freeRideDown', { step: FREE_RIDE_STEP })"
					@click="stepFreeRidePower(-1)"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
						<path d="M6 12h12" />
					</svg>
				</button>
				<span class="value value--static" aria-live="polite">
					<span class="value__text">{{ t("workout.ring.watts", { value: freeRideTarget }) }}</span>
					<span class="group__label" aria-hidden="true">{{ t("workout.ring.targetLabel") }}</span>
				</span>
				<button
					type="button"
					class="step"
					:disabled="!canStepFreeRideUp"
					:aria-label="t('workout.ring.freeRideUp', { step: FREE_RIDE_STEP })"
					:title="t('workout.ring.freeRideUp', { step: FREE_RIDE_STEP })"
					@click="stepFreeRidePower(1)"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
						<path d="M12 6v12M6 12h12" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Navigation dans la séance : au centre, sous le pouce -->
		<div class="cluster cluster--transport">
			<button
				type="button"
				class="btn"
				:class="{ 'btn--resume': isPaused }"
				:aria-label="t(isPaused ? 'common.buttons.resume' : 'common.buttons.pause')"
				:title="t(isPaused ? 'common.buttons.resume' : 'common.buttons.pause')"
				@click="togglePause"
			>
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path v-if="isPaused" d="M8 5.5v13l11-6.5z" />
					<template v-else>
						<rect x="6" y="5" width="4" height="14" rx="1" />
						<rect x="14" y="5" width="4" height="14" rx="1" />
					</template>
				</svg>
			</button>

			<button
				v-if="!isFreeRide"
				type="button"
				class="btn"
				:disabled="!canSkipInterval"
				:aria-label="t('workout.ring.nextBlock')"
				:title="t('workout.ring.nextBlock')"
				@click="skipToNextInterval"
			>
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M6 6l9 6-9 6z" />
					<rect x="16.5" y="6" width="2.5" height="12" rx="1" />
				</svg>
			</button>
		</div>

		<!-- Fin de séance et paramètres : à l'écart des gestes courants -->
		<div class="cluster cluster--end">
			<button
				type="button"
				class="btn btn--stop"
				:aria-label="t('common.buttons.stop')"
				:title="t('common.buttons.stop')"
				@click="confirmStop"
			>
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<rect x="6.5" y="6.5" width="11" height="11" rx="2" />
				</svg>
			</button>

			<button
				type="button"
				class="btn"
				:aria-label="t('navigation.settings')"
				:title="t('navigation.settings')"
				@click="router.push({ name: 'settings' })"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<circle cx="12" cy="12" r="3" />
					<path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
				</svg>
			</button>
		</div>
	</div>
</template>

<style scoped>
.bar {
	position: relative;
	z-index: 2;
	display: flex;
	flex: none;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 8px;
	box-sizing: border-box;
	width: fit-content;
	max-width: calc(100% - 16px);
	margin: 8px auto 20px;
	padding: 6px 10px;
	border-radius: 12px;
	background: rgba(8, 9, 11, 0.9);
	color: #eef0f2;
	font-family: "Oxanium", system-ui, sans-serif;
	font-size: 14px;
}

/* Trois blocs : ajustements | navigation | arrêt et vue, séparés par un filet. Chaque bloc peut
   passer à la ligne, mais les boutons d'un même bloc restent ensemble. */
.cluster {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 8px;
}

.cluster + .cluster {
	padding-left: 12px;
	border-left: 1px solid rgba(255, 255, 255, 0.1);
}

/* Écran étroit (téléphone en portrait) : navigation et arrêt sur la première ligne, les
   ajustements dessous, sans filets. */
@media (max-width: 700px) and (orientation: portrait) {
	.bar {
		display: grid;
		grid-template-columns: auto auto;
		justify-content: center;
		gap: 8px 16px;
	}

	.cluster + .cluster {
		padding-left: 0;
		border-left: 0;
	}

	.cluster--transport {
		grid-area: 1 / 1;
	}

	.cluster--end {
		grid-area: 1 / 2;
	}

	.cluster--adjust {
		grid-area: 2 / 1 / 3 / 3;
	}
}

.btn,
.step,
.value {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	height: 36px;
	border: 0;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.08);
	color: inherit;
	font: inherit;
	font-weight: 600;
	white-space: nowrap;
	cursor: pointer;
	transition:
		background-color 0.2s ease,
		color 0.2s ease,
		opacity 0.2s ease;
}

.btn:hover:not(:disabled),
.step:hover:not(:disabled),
.value:hover:not(:disabled) {
	background: rgba(255, 255, 255, 0.16);
}

.btn:focus-visible,
.step:focus-visible,
.value:focus-visible {
	outline: 2px solid #eef0f2;
	outline-offset: 2px;
}

.btn:disabled,
.step:disabled,
.value:disabled {
	opacity: 0.4;
	cursor: default;
}

.btn {
	gap: 8px;
	min-width: 36px;
	padding: 0 10px;
}

.btn svg,
.step svg {
	flex: none;
	width: 16px;
	height: 16px;
}

/* Boutons d'action sans texte : carrés, de la même hauteur que les ajustements */
.btn {
	width: 44px;
	height: 44px;
}

.btn svg {
	width: 20px;
	height: 20px;
}

/* Les libellés ne s'affichent que si la barre a la place : sinon, des icônes seules */
.btn--resume {
	background: #ea580c;
	color: #1c1917;
	font-weight: 700;
}

.btn--resume:hover:not(:disabled) {
	background: #f26a1f;
}

.btn--stop {
	background: rgba(255, 90, 95, 0.14);
	color: #ff8b8b;
}

.btn--stop:hover:not(:disabled) {
	background: rgba(255, 90, 95, 0.26);
}

.group {
	display: flex;
	align-items: center;
	gap: 0;
}

/* Libellé (« Bloc », « Séance »), rangé dans la zone centrale sous le pourcentage */
.group__label {
	color: rgba(238, 240, 242, 0.72);
	font-family: "Fira Code", monospace;
	font-size: 10px;
	font-weight: 500;
	letter-spacing: 0.08em;
	line-height: 1;
	text-transform: uppercase;
}

.step {
	width: 36px;
}

.value {
	min-width: 56px;
	padding: 0 8px;
	background: rgba(255, 255, 255, 0.04);
	font-variant-numeric: tabular-nums;
}

/* Ajustement compact : « − valeur + » forme un seul bouton segmenté, sans espace entre les
   trois parties (seuls les coins extérieurs sont arrondis). */
.group .step {
	width: 30px;
	height: 44px;
}

.group .value {
	flex-direction: column;
	gap: 4px;
	min-width: 62px;
	height: 44px;
	padding: 0 4px;
	border-radius: 0;
}

.value__text {
	line-height: 1;
}

.group .step:first-of-type {
	border-radius: 8px 0 0 8px;
}

.group .step:last-of-type {
	border-radius: 0 8px 8px 0;
}

.value.is-up {
	color: #fdba74;
}

.value.is-down {
	color: #ff8b8b;
}

.value--static {
	min-width: 64px;
	cursor: default;
}

@media (pointer: coarse) {
	.btn,
	.step,
	.value {
		height: 44px;
	}

	.btn {
		min-width: 44px;
	}

	.step {
		width: 44px;
	}
}

/* Paysage bas (téléphone couché) : boutons resserrés pour que les trois blocs tiennent sur
   une seule ligne et ne recouvrent pas l'anneau. */
@media (orientation: landscape) and (max-height: 520px) {
	.bar {
		gap: 6px;
		padding: 4px 8px;
	}

	.btn,
	.step,
	.value {
		height: 40px;
	}

	.btn {
		min-width: 40px;
	}

	.step {
		width: 40px;
	}

	.value,
	.value--static {
		min-width: 44px;
		padding: 0 4px;
	}

	.group .step,
	.group .value {
		height: 40px;
	}

	.group .value {
		min-width: 56px;
		gap: 3px;
	}

	.cluster {
		gap: 4px;
	}

	.cluster + .cluster {
		padding-left: 8px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.btn,
	.step,
	.value {
		transition: none;
	}
}
</style>
