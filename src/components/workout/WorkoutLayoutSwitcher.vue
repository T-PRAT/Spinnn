<script setup>
import { ref } from "vue";
import { useAnchoredMenu } from "@/composables/useAnchoredMenu";
import { useI18n } from "@/composables/useI18n";
import { useWorkoutLayout } from "@/composables/useWorkoutLayout";

// Petit sélecteur de vue d'entraînement, utilisable en pleine séance : le contrôleur de la
// séance vit au-dessus des layouts, changer de vue ne l'interrompt pas.
const props = defineProps({
	// « ring » : habillage sombre de la vue Anneau (qui ne suit pas le thème de l'application)
	variant: {
		type: String,
		default: "default",
		validator: (value) => ["default", "ring"].includes(value),
	},
	placement: {
		type: String,
		default: "bottom",
		validator: (value) => ["top", "bottom"].includes(value),
	},
	align: {
		type: String,
		default: "end",
		validator: (value) => ["start", "center", "end"].includes(value),
	},
});

const { t } = useI18n();
const { layoutId, layouts, setLayout } = useWorkoutLayout();

const triggerRef = ref(null);
const menuRef = ref(null);
const { isOpen, menuStyle, open, close, toggle, onMenuKeydown } = useAnchoredMenu({
	triggerRef,
	menuRef,
	placement: () => props.placement,
	align: () => props.align,
});

function choose(id) {
	setLayout(id);
	close(true);
}
</script>

<template>
	<button
		ref="triggerRef"
		type="button"
		class="switcher-trigger"
		:class="`is-${variant}`"
		:aria-label="t('workout.layouts.switch')"
		:title="t('workout.layouts.switch')"
		aria-haspopup="menu"
		:aria-expanded="isOpen"
		@click="toggle"
		@keydown.down.prevent="open"
	>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.8"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
			<rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
			<rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
			<rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
		</svg>
	</button>

	<!-- Téléporté : la barre d'en-tête de la vue classique coupe ce qui dépasse -->
	<Teleport to="body">
		<div
			v-if="isOpen"
			ref="menuRef"
			class="switcher-menu"
			:class="`is-${variant}`"
			role="menu"
			:aria-label="t('workout.layouts.switch')"
			:style="menuStyle"
			@keydown="onMenuKeydown"
		>
			<button
				v-for="layout in layouts"
				:key="layout.id"
				type="button"
				role="menuitemradio"
				class="switcher-item"
				:class="{ 'is-active': layout.id === layoutId }"
				:aria-checked="layout.id === layoutId"
				@click="choose(layout.id)"
			>
				<span class="switcher-item__text">
					<span class="switcher-item__label">{{ t(layout.labelKey) }}</span>
					<span class="switcher-item__description">{{ t(layout.descriptionKey) }}</span>
				</span>
				<svg
					v-if="layout.id === layoutId"
					class="switcher-item__check"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.4"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M5 12.5l4.5 4.5L19 7.5" />
				</svg>
			</button>
		</div>
	</Teleport>
</template>

<style scoped>
/* Deux habillages par variables : « default » suit le thème de l'application, « ring » est
   toujours sombre (couleurs en dur, la vue Anneau ne dépend pas du thème). */
.is-default {
	--sw-trigger-fg: var(--muted-foreground);
	--sw-trigger-bg: transparent;
	--sw-trigger-hover-bg: var(--muted);
	--sw-trigger-hover-fg: var(--foreground);
	--sw-menu-bg: var(--popover);
	--sw-fg: var(--popover-foreground);
	--sw-muted: var(--muted-foreground);
	--sw-border: var(--border);
	--sw-hover: var(--muted);
	--sw-check: var(--primary);
	--sw-focus: var(--ring);
}

.is-ring {
	--sw-trigger-fg: #eef0f2;
	--sw-trigger-bg: rgba(255, 255, 255, 0.08);
	--sw-trigger-hover-bg: rgba(255, 255, 255, 0.16);
	--sw-trigger-hover-fg: #eef0f2;
	--sw-menu-bg: #12141a;
	--sw-fg: #eef0f2;
	--sw-muted: rgba(238, 240, 242, 0.62);
	--sw-border: rgba(255, 255, 255, 0.12);
	--sw-hover: rgba(255, 255, 255, 0.08);
	--sw-check: #fb923c;
	--sw-focus: #eef0f2;
}

.switcher-trigger {
	display: inline-flex;
	flex: none;
	align-items: center;
	justify-content: center;
	padding: 4px;
	border: 0;
	border-radius: 8px;
	background: var(--sw-trigger-bg);
	color: var(--sw-trigger-fg);
	cursor: pointer;
	transition:
		background-color 0.2s ease,
		color 0.2s ease;
}

.switcher-trigger svg {
	width: 18px;
	height: 18px;
}

.switcher-trigger:hover,
.switcher-trigger[aria-expanded="true"] {
	background: var(--sw-trigger-hover-bg);
	color: var(--sw-trigger-hover-fg);
}

.switcher-trigger:focus-visible,
.switcher-item:focus-visible {
	outline: 2px solid var(--sw-focus);
	outline-offset: 2px;
}

/* Dans la barre de contrôle, même gabarit que les autres boutons */
.switcher-trigger.is-ring {
	width: 36px;
	height: 36px;
	padding: 0;
}

.switcher-menu {
	position: fixed;
	z-index: 90;
	box-sizing: border-box;
	width: min(290px, calc(100vw - 16px));
	padding: 6px;
	border: 1px solid var(--sw-border);
	border-radius: 12px;
	background: var(--sw-menu-bg);
	color: var(--sw-fg);
	font-family: "Oxanium", system-ui, sans-serif;
	box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
}

.switcher-item {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 10px 12px;
	border: 0;
	border-radius: 8px;
	background: transparent;
	color: inherit;
	font: inherit;
	text-align: left;
	cursor: pointer;
}

.switcher-item:hover,
.switcher-item.is-active {
	background: var(--sw-hover);
}

.switcher-item__text {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.switcher-item__label {
	font-size: 15px;
	font-weight: 600;
}

.switcher-item__description {
	color: var(--sw-muted);
	font-size: 13px;
	line-height: 1.3;
}

.switcher-item__check {
	flex: none;
	width: 18px;
	height: 18px;
	color: var(--sw-check);
}

/* Cibles tactiles de 44 px sur écran tactile. L'en-tête compact de la vue classique garde sa
   hauteur : seul le bouton de la barre de contrôle de l'Anneau grandit. */
@media (pointer: coarse) {
	.switcher-trigger.is-ring {
		min-width: 44px;
		min-height: 44px;
	}

	.switcher-item {
		min-height: 52px;
	}
}
</style>
