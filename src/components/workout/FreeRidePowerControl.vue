<script setup>
import { computed } from 'vue';
import { useI18n } from '@/composables/useI18n';

const props = defineProps({
	currentPower: {
		type: Number,
		required: true,
	},
	ftp: {
		type: Number,
		required: true,
	},
	minPower: {
		type: Number,
		default: 50,
	},
	maxPower: {
		type: Number,
		default: null, // Will default to FTP × 1.5
	},
});

const emit = defineEmits(['power-change']);

const { t } = useI18n();

// Calculate actual max power if not provided
const actualMaxPower = computed(() => {
	return props.maxPower || Math.round(props.ftp * 1.5);
});

// Check if at limits for button states
const atMinPower = computed(() => props.currentPower <= props.minPower);
const atMaxPower = computed(() => props.currentPower >= actualMaxPower.value);

// Handle power adjustments
function adjustPower(delta) {
	const newPower = props.currentPower + delta;
	emit('power-change', Math.round(newPower));
}

// Button handlers
function adjustUp10() {
	adjustPower(10);
}

function adjustDown10() {
	adjustPower(-10);
}
</script>

<template>
	<div class="flex flex-col gap-0.5">
		<!-- Label -->
		<span
			class="text-[8px] md:text-[9px] text-muted-foreground font-semibold uppercase tracking-wide text-center"
		>
			{{ t('workout.freeRide.targetPower') }}
		</span>

		<!-- Adjustment: ±10W -->
		<div
			class="flex rounded-lg overflow-hidden border-2 border-border shadow-sm"
		>
			<button
				@click="adjustDown10"
				:disabled="atMinPower"
				class="px-2 py-1.5 text-xs md:text-sm font-bold transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
				:title="t('workout.freeRide.adjustDown10')"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
				</svg>
			</button>

			<button
				:disabled="atMinPower || atMaxPower"
				class="px-1.5 py-1.5 text-[9px] md:text-xs font-bold bg-muted hover:bg-muted/80 disabled:cursor-not-allowed cursor-pointer min-w-[3rem] text-center flex items-center justify-center transition-all"
				:class="{
					'text-chart-1': !atMinPower && !atMaxPower,
					'text-muted-foreground': atMinPower || atMaxPower
				}"
			>
				{{ Math.round(currentPower) }}W
			</button>

			<button
				@click="adjustUp10"
				:disabled="atMaxPower"
				class="px-2 py-1.5 text-xs md:text-sm font-bold transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
				:title="t('workout.freeRide.adjustUp10')"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
			</button>
		</div>
	</div>
</template>

<style scoped>
button {
	touch-action: manipulation;
	user-select: none;
	-webkit-user-select: none;
}

button:active {
	transform: scale(0.97);
}
</style>
