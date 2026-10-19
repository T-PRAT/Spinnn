<script setup>
import { computed, ref } from "vue";
import { useAnchoredMenu } from "@/composables/useAnchoredMenu";
import { ControlMode } from "@/composables/useBluetoothTrainer";

// Pastille de mode (ERG / SIM / RES / OFF) de la vue Anneau. Le point de couleur résume l'état
// du home trainer ; un clic ouvre le détail : choix du mode, état des appareils, reconnexion.
const props = defineProps({
	ctrl: {
		type: Object,
		required: true,
	},
});

const {
	t,
	appState,
	trainer,
	controlModes,
	deviceStatus,
	changeControlMode,
	reconnectHRM,
	reconnectTrainer,
} = props.ctrl;

const isMock = computed(() => appState.mockModeActive.value);

// Home trainer connecté en FTMS mais qui n'a pas (encore) la main sur la résistance
const awaitingControl = computed(
	() =>
		trainer.ftmsSupported.value &&
		trainer.controlMode.value !== ControlMode.PASSIVE &&
		!trainer.hasControl.value,
);

// 'ok' (vert) | 'pending' (ambre) | 'offline' (rouge)
const trainerTone = computed(() => {
	if (isMock.value) return "ok";
	const status = deviceStatus.value.trainer;
	if (status.connected) return awaitingControl.value ? "pending" : "ok";
	return status.connecting ? "pending" : "offline";
});

const label = computed(() => {
	if (isMock.value) return t("workout.ring.mock");

	const status = deviceStatus.value.trainer;
	if (!status.connected) {
		return t(status.connecting ? "workout.ring.connecting" : "workout.ring.offline");
	}
	return controlModes.value.find((mode) => mode.id === trainer.controlMode.value)?.label ?? "";
});

// Le choix du mode n'a de sens que sur un vrai home trainer qui accepte les commandes FTMS
const showModes = computed(() => !isMock.value && trainer.ftmsSupported.value);

function describeDevice(status, { awaiting = false } = {}) {
	if (isMock.value) return { tone: "ok", text: t("workout.ring.devices.simulated") };
	if (status.connected) {
		return awaiting
			? { tone: "pending", text: t("workout.ring.devices.awaitingControl") }
			: { tone: "ok", text: t("common.states.connected") };
	}
	return status.connecting
		? { tone: "pending", text: t("common.states.connecting") }
		: { tone: "offline", text: t("common.states.disconnected") };
}

const devices = computed(() => {
	const { trainer: trainerStatus, hrm: hrmStatus } = deviceStatus.value;
	return [
		{
			key: "trainer",
			name: t("workout.ring.devices.trainer"),
			...describeDevice(trainerStatus, { awaiting: awaitingControl.value }),
			detail: trainerStatus.connected && !isMock.value ? trainer.deviceName.value : "",
			canReconnect: !isMock.value && !trainerStatus.connected && !trainerStatus.connecting,
			reconnect: reconnectTrainer,
		},
		{
			key: "hrm",
			name: t("workout.ring.devices.hrm"),
			...describeDevice(hrmStatus),
			detail: "",
			canReconnect: !isMock.value && !hrmStatus.connected && !hrmStatus.connecting,
			reconnect: reconnectHRM,
		},
	];
});

const triggerRef = ref(null);
const menuRef = ref(null);
const { isOpen, menuStyle, toggle, onMenuKeydown } = useAnchoredMenu({
	triggerRef,
	menuRef,
	placement: "bottom",
	align: "center",
});
</script>

<template>
	<button
		ref="triggerRef"
		type="button"
		class="mode-pill"
		:aria-expanded="isOpen"
		aria-haspopup="dialog"
		:aria-label="`${label} · ${t('workout.ring.devices.title')}`"
		@click="toggle"
	>
		<span class="dot" :class="`is-${trainerTone}`"></span>
		<span>{{ label }}</span>
	</button>

	<Teleport to="body">
		<div
			v-if="isOpen"
			ref="menuRef"
			class="device-menu"
			role="dialog"
			:aria-label="t('workout.ring.devices.title')"
			:style="menuStyle"
			@keydown="onMenuKeydown"
		>
			<section v-if="showModes" class="device-menu__section">
				<h2 class="device-menu__title">{{ t("workout.ring.devices.mode") }}</h2>
				<div class="device-menu__modes" role="radiogroup">
					<button
						v-for="mode in controlModes"
						:key="mode.id"
						type="button"
						role="radio"
						class="device-menu__mode"
						:class="{ 'is-active': trainer.controlMode.value === mode.id }"
						:aria-checked="trainer.controlMode.value === mode.id"
						:title="mode.description || undefined"
						@click="changeControlMode(mode.id)"
					>
						{{ mode.label }}
					</button>
				</div>
			</section>

			<section class="device-menu__section">
				<h2 class="device-menu__title">{{ t("workout.ring.devices.title") }}</h2>
				<ul class="device-menu__list">
					<li v-for="device in devices" :key="device.key" class="device-row">
						<span class="dot" :class="`is-${device.tone}`"></span>
						<span class="device-row__text">
							<strong>{{ device.name }}</strong>
							<small>{{ device.detail || device.text }}</small>
						</span>
						<button
							v-if="device.canReconnect"
							type="button"
							class="device-row__action"
							@click="device.reconnect()"
						>
							{{ t("common.buttons.reconnect") }}
						</button>
					</li>
				</ul>
				<p v-if="isMock" class="device-menu__note">
					{{ t("workout.ring.devices.mockNote") }}
				</p>
				<p v-else-if="trainer.error.value" class="device-menu__note is-error">
					{{ trainer.error.value }}
				</p>
			</section>
		</div>
	</Teleport>
</template>

<style scoped>
/* Le menu est téléporté dans <body> : il ne reçoit pas les variables de la vue, d'où les
   couleurs en dur (la vue Anneau est toujours sombre). */

.mode-pill {
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: max(6px, calc(10 * var(--px)));
	padding: max(3px, calc(4 * var(--px))) max(9px, calc(14 * var(--px)));
	border: 0;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.1);
	color: inherit;
	font: inherit;
	font-size: max(11px, calc(17 * var(--px)));
	font-weight: 700;
	letter-spacing: 0.08em;
	line-height: 1.27;
	white-space: nowrap;
	cursor: pointer;
	transition: background-color 0.2s ease;
}

.mode-pill:hover {
	background: rgba(255, 255, 255, 0.16);
}

.mode-pill:focus-visible {
	outline: 2px solid currentColor;
	outline-offset: 2px;
}

/* Zone de clic élargie : la pastille est petite à l'échelle d'un téléphone */
.mode-pill::after {
	content: "";
	position: absolute;
	inset: -12px -8px;
}

.dot {
	flex: none;
	width: max(7px, calc(9 * var(--px)));
	height: max(7px, calc(9 * var(--px)));
	border-radius: 50%;
	background: currentColor;
}

.dot.is-ok {
	background: #5be38a;
	box-shadow: 0 0 8px rgba(91, 227, 138, 0.7);
}

.dot.is-pending {
	background: #fbbf24;
	box-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
	animation: dot-blink 1.2s ease-in-out infinite;
}

.dot.is-offline {
	background: #ff5a5f;
	box-shadow: 0 0 8px rgba(255, 90, 95, 0.6);
}

.device-menu {
	/* Hors de la vue, l'échelle n'existe pas : les tailles à base de --px valent leur valeur de base */
	--px: 1px;
	position: fixed;
	z-index: 90;
	box-sizing: border-box;
	width: min(300px, calc(100vw - 16px));
	padding: 14px;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 14px;
	background: #12141a;
	color: #eef0f2;
	font-family: "Oxanium", system-ui, sans-serif;
	box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55);
}

.device-menu__section + .device-menu__section {
	margin-top: 14px;
	padding-top: 14px;
	border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.device-menu__title {
	margin: 0 0 8px;
	color: rgba(238, 240, 242, 0.62);
	font-family: "Fira Code", monospace;
	font-size: 11px;
	font-weight: 400;
	letter-spacing: 0.12em;
	text-transform: uppercase;
}

.device-menu__modes {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 6px;
}

.device-menu__mode {
	min-height: 36px;
	border: 0;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.08);
	color: inherit;
	font: inherit;
	font-size: 14px;
	font-weight: 600;
	letter-spacing: 0.05em;
	cursor: pointer;
}

.device-menu__mode:hover {
	background: rgba(255, 255, 255, 0.14);
}

.device-menu__mode.is-active {
	background: #ea580c;
	color: #1c1917;
	font-weight: 700;
}

.device-menu__mode:focus-visible,
.device-row__action:focus-visible {
	outline: 2px solid #eef0f2;
	outline-offset: 2px;
}

.device-menu__list {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.device-row {
	display: flex;
	align-items: center;
	gap: 10px;
}

.device-row__text {
	display: flex;
	flex: 1;
	flex-direction: column;
	min-width: 0;
}

.device-row__text strong {
	font-size: 15px;
	font-weight: 600;
}

.device-row__text small {
	overflow: hidden;
	color: rgba(238, 240, 242, 0.62);
	font-size: 13px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.device-row__action {
	min-height: 32px;
	padding: 0 12px;
	border: 0;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.1);
	color: inherit;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
}

.device-row__action:hover {
	background: rgba(255, 255, 255, 0.18);
}

.device-menu__note {
	margin: 10px 0 0;
	color: rgba(238, 240, 242, 0.62);
	font-size: 13px;
	line-height: 1.4;
}

.device-menu__note.is-error {
	color: #ff8b8b;
}

@media (pointer: coarse) {
	.device-menu__mode {
		min-height: 44px;
	}

	.device-row__action {
		min-height: 44px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.dot.is-pending {
		animation: none;
	}
}

@keyframes dot-blink {
	50% {
		opacity: 0.35;
	}
}
</style>
