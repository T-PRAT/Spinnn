<script setup>
const props = defineProps({
	show: {
		type: Boolean,
		required: true,
	},
	availableMetrics: {
		type: Array,
		required: true,
	},
	selectedMetricId: {
		type: String,
		required: true,
	},
});

const emit = defineEmits(['close', 'select']);

function selectMetric(metricId) {
	emit('select', metricId);
}
</script>

<template>
	<div
		v-if="show"
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4"
		@click.self="emit('close')"
	>
		<div
			class="bg-card border border-border rounded-lg shadow-xl max-w-md w-full max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col"
		>
			<div
				class="flex items-center justify-between p-3 md:p-4 border-b border-border"
			>
				<h3 class="text-base md:text-lg font-semibold text-foreground">
					Configurer la métrique
				</h3>
				<button
					@click="emit('close')"
					class="p-1.5 md:p-2 rounded-lg hover:bg-accent transition-colors"
				>
					<svg
						class="w-4 h-4 md:w-5 md:h-5 text-muted-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<div class="flex-1 overflow-y-auto p-3 md:p-4">
				<div class="grid grid-cols-2 gap-2">
					<button
						v-for="metric in availableMetrics"
						:key="metric.id"
						@click="selectMetric(metric.id)"
						class="flex flex-col items-center p-2 md:p-3 rounded-lg border transition-all text-left"
						:class="
							selectedMetricId === metric.id
								? 'border-primary bg-primary/10 ring-1 ring-primary'
								: 'border-border hover:border-primary/50 hover:bg-accent'
						"
					>
						<span class="text-xs md:text-sm font-medium">{{
							metric.label
						}}</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
