<script setup>
import { computed } from "vue";

// Anneau de progression du bloc : disque sombre, piste et arc de la couleur du bloc qui se
// vide dans le sens des aiguilles d'une montre à partir de midi.
// La teinte vient de la variable CSS --ring-accent, posée par le layout.
const props = defineProps({
	// Part restante du bloc, de 0 à 1
	fraction: {
		type: Number,
		default: 1,
	},
	// Atténue l'anneau (séance en pause)
	muted: {
		type: Boolean,
		default: false,
	},
});

// Circonférence du cercle de rayon 44,5 (viewBox de 100)
const CIRCUMFERENCE = 2 * Math.PI * 44.5;

const dash = computed(() => {
	const filled = Math.min(1, Math.max(0, props.fraction)) * CIRCUMFERENCE;
	return `${filled.toFixed(2)} ${CIRCUMFERENCE.toFixed(2)}`;
});

// Le bout arrondi de l'arc laisserait un point quand le bloc touche à sa fin
const isEmpty = computed(() => props.fraction < 0.004);
</script>

<template>
	<div class="ring-progress" :class="{ 'is-muted': muted }">
		<div class="ring-progress__halo"></div>
		<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
			<circle class="ring-progress__disc" cx="50" cy="50" r="46" />
			<circle class="ring-progress__track" cx="50" cy="50" r="44.5" />
			<circle
				class="ring-progress__arc"
				:class="{ 'is-empty': isEmpty }"
				cx="50"
				cy="50"
				r="44.5"
				transform="rotate(-90 50 50)"
				:style="{ strokeDasharray: dash }"
			/>
		</svg>
	</div>
</template>

<style scoped>
.ring-progress {
	position: absolute;
	inset: 0;
	transition: opacity 0.4s ease;
}

.ring-progress.is-muted {
	opacity: 0.55;
}

/* Halo statique autour du disque : un box-shadow coûte moins qu'un filtre SVG qui se
   recalculerait à chaque mise à jour de l'arc. Le flou d'un drop-shadow est un écart-type,
   celui d'un box-shadow vaut le double, d'où les 32 px pour 16 px dans la maquette. */
.ring-progress__halo {
	position: absolute;
	inset: 4%;
	border-radius: 50%;
	box-shadow: 0 0 calc(var(--u, 1) * 32px) color-mix(in srgb, var(--ring-accent) 40%, transparent);
}

svg {
	position: absolute;
	inset: 0;
	display: block;
	width: 100%;
	height: 100%;
}

.ring-progress__disc {
	fill: var(--ring-bg);
}

.ring-progress__track {
	fill: none;
	stroke: rgba(255, 255, 255, 0.12);
	stroke-width: 3.4;
}

.ring-progress__arc {
	fill: none;
	stroke: var(--ring-accent);
	stroke-width: 3.4;
	stroke-linecap: round;
	/* Une mise à jour par seconde : la transition linéaire d'une seconde donne un mouvement
	   continu, et refait le plein en douceur quand un nouveau bloc commence. */
	transition:
		stroke-dasharray 1s linear,
		opacity 0.3s ease;
}

.ring-progress__arc.is-empty {
	opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
	.ring-progress__arc {
		transition: none;
	}
}
</style>
