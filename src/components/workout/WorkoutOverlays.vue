<script setup>
// Éléments flottants communs à tous les layouts de séance : toast de passage en sortie
// libre et modale de confirmation d'arrêt. Ils sont rendus une seule fois par WorkoutView,
// pour ne pas avoir à les dupliquer dans chaque layout.
const props = defineProps({
	ctrl: {
		type: Object,
		required: true,
	},
});

const { t, showFreeRideToast, showStopConfirmation, cancelStop, proceedStop } =
	props.ctrl;
</script>

<template>
	<!-- Free Ride Transition Toast -->
	<transition name="fade">
		<div
			v-if="showFreeRideToast"
			class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg pointer-events-none"
		>
			{{ t('workout.freeRide.transitioned') }}
		</div>
	</transition>

	<!-- Stop confirmation modal -->
	<div
		v-if="showStopConfirmation"
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
		@click.self="cancelStop"
	>
		<div
			class="bg-card border border-border rounded-lg p-6 max-w-md mx-4 shadow-lg"
		>
			<h3 class="text-lg font-semibold text-foreground mb-3">
				{{ t("workout.stopConfirmation") }}
			</h3>
			<p class="text-muted-foreground mb-6">
				{{ t("workout.stopConfirmMessage") }}
			</p>
			<div class="flex gap-3 justify-end">
				<button
					@click="cancelStop"
					class="px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
				>
					{{ t("common.buttons.cancel") }}
				</button>
				<button
					@click="proceedStop"
					class="px-4 py-2 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
				>
					{{ t("workout.stopButton") }}
				</button>
			</div>
		</div>
	</div>
</template>
