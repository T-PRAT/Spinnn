<script setup>
const props = defineProps({
	type: {
		type: String,
		required: true,
		validator: (value) => ['hrm', 'trainer'].includes(value),
	},
	connected: {
		type: Boolean,
		required: true,
	},
	connecting: {
		type: Boolean,
		required: true,
	},
});

const emit = defineEmits(['reconnect']);

const labels = {
	hrm: 'HRM',
	trainer: 'HT',
};

const handleClick = () => {
	if (!props.connected && !props.connecting) {
		emit('reconnect');
	}
};
</script>

<template>
	<button
		@click="handleClick"
		:class="[
			'flex items-center gap-1 md:gap-2 px-2 md:px-3 py-0.5 md:py-1 rounded-lg transition-all text-[10px] md:text-xs',
			connected
				? 'bg-green-500/10 border border-green-500/30 cursor-default'
				: connecting
				? 'bg-yellow-500/10 border border-yellow-500/30 cursor-wait'
				: 'bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 cursor-pointer',
		]"
		:disabled="connected || connecting"
	>
		<div
			:class="[
				'w-1.5 h-1.5 md:w-2 md:h-2 rounded-full',
				connected
					? 'bg-green-500'
					: connecting
					? 'bg-yellow-500 animate-pulse'
					: 'bg-destructive',
			]"
		></div>
		<span
			:class="[
				'text-[10px] md:text-xs font-medium',
				connected
					? 'text-green-600 dark:text-green-500'
					: connecting
					? 'text-yellow-600 dark:text-yellow-500'
					: 'text-destructive',
			]"
		>
			{{ connecting ? `${labels[type]}...` : labels[type] }}
		</span>
	</button>
</template>
