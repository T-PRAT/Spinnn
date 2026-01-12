<script setup>
const props = defineProps({
	slotId: {
		type: Number,
		required: true,
	},
	label: {
		type: String,
		required: true,
	},
	value: {
		type: String,
		required: true,
	},
});

const emit = defineEmits(["configure"]);
</script>

<template>
	<div
		class="bg-card rounded flex-1 p-1.5 md:p-3 border border-border relative group flex flex-col items-center justify-center"
	>
		<button
			@click="emit('configure', slotId)"
			class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
			title="Configurer"
		>
			<svg
				class="w-3 h-3 text-muted-foreground"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
		</button>
		<div class="text-[10px] md:text-xs text-muted-foreground">
			{{ label }}
		</div>
		<div class="text-base md:text-2xl font-semibold leading-tight">
			{{ value }}
		</div>
	</div>
</template>
