<script setup>
import MetricCard from './MetricCard.vue';

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
});

const emit = defineEmits(['configure']);
</script>

<template>
	<div
		class="grid grid-cols-6 gap-1 p-1 md:gap-2 md:p-2 flex-shrink-0 relative"
		id="metrics-grid"
	>
		<!-- Left side -->
		<div class="flex flex-col gap-1 md:gap-2">
			<MetricCard
				v-for="slot in leftSlots"
				:key="slot.id"
				:slot-id="slot.id"
				:label="slot.label"
				:value="slot.value"
				@configure="emit('configure', $event)"
			/>
		</div>

		<!-- Middle cards -->
		<div class="col-span-2 self-stretch">
			<div
				class="bg-card rounded-lg p-2 md:p-4 text-center border border-border h-full flex flex-col justify-center"
			>
				<div class="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-2">
					Puissance
				</div>
				<div class="text-4xl md:text-8xl font-bold text-chart-1 mb-1 md:mb-2 leading-none">
					{{ currentMetrics.power
					}}<span class="text-lg md:text-2xl ml-1">W</span>
				</div>
				<hr class="border-border opacity-50" />
				<div class="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2">Tour</div>
				<div class="text-sm md:text-lg font-semibold text-chart-1 mt-1">
					{{ session.intervalPower.value
					}}<span class="text-xs md:text-sm ml-1">W</span>
				</div>
			</div>
		</div>

		<div class="col-span-2 self-stretch">
			<div
				class="bg-card rounded-lg p-2 md:p-4 text-center border border-border h-full flex flex-col justify-center"
			>
				<div class="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-2">FC</div>
				<div class="text-4xl md:text-8xl font-bold text-destructive mb-1 md:mb-2 leading-none">
					{{ currentMetrics.heartRate
					}}<span class="text-lg md:text-2xl ml-1">bpm</span>
				</div>
				<hr class="border-border opacity-50" />
				<div class="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2">Tour</div>
				<div class="text-sm md:text-lg font-semibold text-destructive mt-1">
					{{ session.intervalHeartRate.value
					}}<span class="text-xs md:text-sm ml-1">bpm</span>
				</div>
			</div>
		</div>

		<!-- Right side -->
		<div class="flex flex-col gap-1 md:gap-2">
			<MetricCard
				v-for="slot in rightSlots"
				:key="slot.id"
				:slot-id="slot.id"
				:label="slot.label"
				:value="slot.value"
				@configure="emit('configure', $event)"
			/>
		</div>
	</div>
</template>
