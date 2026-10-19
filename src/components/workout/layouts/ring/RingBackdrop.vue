<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

// Fond animé de la vue Anneau : aurore de la couleur du bloc, lueurs de la couleur du bloc
// suivant, particules qui montent, et un éclat bref à chaque changement de bloc.
//
// Tout se pilote par variables CSS héritées du layout : --ring-accent / --ring-next (couleurs),
// --ring-cx / --ring-cy / --ring-size (centre et taille de l'anneau), --u / --px (échelle),
// --ring-glow (intensité des lueurs).
//
// Coût : aucun filtre `blur()`. Les taches sont des dégradés radiaux dont le profil imite un
// flou gaussien, portés par un point de pivot minuscule qui tourne : le navigateur ne fait que
// faire pivoter des calques déjà dessinés. Les particules n'animent que transform et opacity.
const props = defineProps({
	// Incrémenté à chaque changement de bloc ; reste à 0 tant qu'aucun changement n'a eu lieu
	pulseKey: {
		type: Number,
		default: 0,
	},
	// Séance en pause : les animations s'arrêtent
	halted: {
		type: Boolean,
		default: false,
	},
	// Vitesse des cercles (aurore et lueurs) : 1 = vitesse d'origine. Suit la zone de puissance
	// (voir RING_MOTION_SPEED).
	speed: {
		type: Number,
		default: 1,
	},
	// Vitesse des étincelles (particules) : 1 = vitesse d'origine. Suit la cadence
	// (voir RING_SPARK_PER_RPM).
	sparkSpeed: {
		type: Number,
		default: 1,
	},
});

// La vitesse passe par la lecture des animations (playbackRate) plutôt que par leur durée :
// changer une durée en cours de route fait sauter l'animation à une autre position, alors que
// la cadence se change sans à-coup. Le rythme glisse vers la nouvelle valeur en ~1 s.
// Vue suffixe les noms de keyframes d'un style scopé (« orbit-turn-1a2b3c ») : on compare au préfixe.
const root = ref(null);
const SPEED_EASING = 0.04;
const GROUPS = {
	circles: { names: ["orbit-turn"], target: () => props.speed, rate: props.speed, frame: 0 },
	sparks: { names: ["particle-rise", "particle-sway"], target: () => props.sparkSpeed, rate: props.sparkSpeed, frame: 0 },
};

function applyRate(group) {
	if (!root.value?.getAnimations) return;
	for (const animation of root.value.getAnimations({ subtree: true })) {
		if (group.names.some((name) => animation.animationName?.startsWith(name))) {
			animation.updatePlaybackRate(group.rate);
		}
	}
}

function glide(group) {
	cancelAnimationFrame(group.frame);
	const step = () => {
		const target = group.target();
		group.rate += (target - group.rate) * SPEED_EASING;
		if (Math.abs(target - group.rate) < 0.005) group.rate = target;
		applyRate(group);
		if (group.rate !== target) group.frame = requestAnimationFrame(step);
	};
	group.frame = requestAnimationFrame(step);
}

onMounted(() => Object.values(GROUPS).forEach(applyRate));
watch(() => props.speed, () => glide(GROUPS.circles));
watch(() => props.sparkSpeed, () => glide(GROUPS.sparks));
onBeforeUnmount(() => Object.values(GROUPS).forEach((group) => cancelAnimationFrame(group.frame)));

const PARTICLE_COUNT = 24;

// Générateur pseudo-aléatoire à graine (mulberry32) : les particules sont les mêmes à chaque
// affichage, pas de disposition différente à chaque changement de vue
function createRandom(seed) {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const random = createRandom(7);
const between = (min, max) => min + random() * (max - min);

const particles = Array.from({ length: PARTICLE_COUNT }, (_, id) => {
	const duration = between(8, 16);
	return {
		id,
		style: {
			left: `${between(2, 98).toFixed(1)}%`,
			top: `${between(30, 92).toFixed(1)}%`,
			"--size": between(3.2, 6).toFixed(1),
			"--rise": `${duration.toFixed(1)}s`,
			// Délai négatif : chaque particule est déjà à un point différent de son cycle à l'affichage
			"--delay": `${(-between(0, 16)).toFixed(1)}s`,
			"--sway": `${between(4, 10).toFixed(1)}px`,
		},
	};
});
</script>

<template>
	<div ref="root" class="backdrop" :class="{ 'is-halted': halted }" aria-hidden="true">
		<div class="aurora">
			<div class="orbit orbit--a"><span class="blob blob--a"></span></div>
			<div class="orbit orbit--b"><span class="blob blob--b"></span></div>
			<div class="orbit orbit--c"><span class="blob blob--c"></span></div>
		</div>

		<div class="glows">
			<div class="orbit orbit--d"><span class="glow glow--d"></span></div>
			<div class="orbit orbit--e"><span class="glow glow--e"></span></div>
			<div class="orbit orbit--f"><span class="glow glow--f"></span></div>
			<div class="orbit orbit--g"><span class="glow glow--g"></span></div>
		</div>

		<div class="particles">
			<span
				v-for="particle in particles"
				:key="particle.id"
				class="particle"
				:style="particle.style"
			></span>
		</div>

		<!-- Le :key relance l'animation à chaque changement de bloc -->
		<div v-if="props.pulseKey > 0" :key="`pulse-${props.pulseKey}`" class="pulse"></div>
		<div v-if="props.pulseKey > 0" :key="`flash-${props.pulseKey}`" class="flash"></div>
	</div>
</template>

<style scoped>
.backdrop {
	position: absolute;
	inset: 0;
	overflow: hidden;
	pointer-events: none;
}

/* Pivot sans dimension, placé au centre de l'anneau : la tache qu'il porte tourne autour */
.orbit {
	position: absolute;
	left: var(--ring-cx);
	top: var(--ring-cy);
	width: 0;
	height: 0;
	will-change: transform;
	animation: orbit-turn var(--orbit-time, 60s) linear infinite;
	animation-delay: var(--orbit-delay, 0s);
}

.orbit--a { --orbit-time: 60s; --orbit-delay: -14s; }
.orbit--b { --orbit-time: 80s; --orbit-delay: -33s; animation-direction: reverse; }
.orbit--c { --orbit-time: 100s; --orbit-delay: -61s; }
.orbit--d { --orbit-time: 70s; --orbit-delay: -8s; }
.orbit--e { --orbit-time: 90s; --orbit-delay: -47s; animation-direction: reverse; }
.orbit--f { --orbit-time: 110s; --orbit-delay: -22s; }
.orbit--g { --orbit-time: 130s; --orbit-delay: -90s; animation-direction: reverse; }

/* Tache : disque flou. Le profil du dégradé suit celui d'un flou gaussien (rayon du disque R,
   écart-type σ) : plein jusqu'à R - 2σ, moitié à R, quasi nul à R + 2σ. Le diamètre de
   l'élément vaut 2 × (R + 2σ), ses offsets (--ox, --oy) sont ceux de la maquette. */
.blob,
.glow {
	--tone: var(--ring-accent);
	--peak: 85;
	position: absolute;
	left: calc(var(--ox) * var(--px));
	top: calc(var(--oy) * var(--px));
	width: calc(var(--d) * var(--px));
	height: calc(var(--d) * var(--px));
	translate: -50% -50%;
	border-radius: 50%;
	background: radial-gradient(
		closest-side,
		color-mix(in srgb, var(--tone) calc(var(--peak) * 1%), transparent) 0%,
		color-mix(in srgb, var(--tone) calc(var(--peak) * 0.98%), transparent) 19%,
		color-mix(in srgb, var(--tone) calc(var(--peak) * 0.84%), transparent) 39%,
		color-mix(in srgb, var(--tone) calc(var(--peak) * 0.69%), transparent) 49%,
		color-mix(in srgb, var(--tone) calc(var(--peak) * 0.5%), transparent) 59%,
		color-mix(in srgb, var(--tone) calc(var(--peak) * 0.31%), transparent) 70%,
		color-mix(in srgb, var(--tone) calc(var(--peak) * 0.16%), transparent) 80%,
		color-mix(in srgb, var(--tone) calc(var(--peak) * 0.07%), transparent) 90%,
		transparent 100%
	);
}

.blob--a { --d: 1180; --ox: 540; --oy: -80; }
.blob--b { --d: 1120; --ox: -190; --oy: 150; }
.blob--c { --d: 1040; --ox: 50; --oy: 510; }

/* Les lueurs annoncent le bloc suivant ; leur intensité monte quand le bloc touche à sa fin */
.glows {
	opacity: var(--ring-glow, 0.3);
	transition: opacity 0.8s ease;
}

.glow {
	--tone: var(--ring-next);
}

.glow--d { --d: 404; --ox: 540; --oy: -140; }
.glow--e { --d: 366; --ox: -395; --oy: -305; }
.glow--f { --d: 330; --ox: 55; --oy: 535; }
.glow--g { --d: 302; --ox: -355; --oy: 285; }

.particle {
	position: absolute;
	width: max(3px, calc(var(--size) * var(--px)));
	aspect-ratio: 1;
	border-radius: 50%;
	background: color-mix(in srgb, var(--ring-accent) 85%, white);
	box-shadow: 0 0 calc(10 * var(--px)) var(--ring-accent);
	opacity: 0;
	animation:
		particle-rise var(--rise) linear var(--delay) infinite,
		particle-sway calc(var(--rise) / 3) ease-in-out var(--delay) infinite alternate;
}

/* Éclat blanc très léger sur tout le fond */
.flash {
	position: absolute;
	inset: 0;
	background: #fff;
	opacity: 0;
	animation: ring-flash 0.7s ease-out forwards;
}

/* Anneau qui s'élargit depuis le bord de l'anneau de progression */
.pulse {
	position: absolute;
	left: calc(var(--ring-cx) - var(--ring-size) / 2);
	top: calc(var(--ring-cy) - var(--ring-size) / 2);
	width: var(--ring-size);
	height: var(--ring-size);
	box-sizing: border-box;
	border: max(2px, calc(2 * var(--px))) solid var(--ring-accent);
	border-radius: 50%;
	opacity: 0;
	animation: ring-pulse 0.9s ease-out forwards;
}

.is-halted .orbit,
.is-halted .particle,
.is-halted .pulse,
.is-halted .flash {
	animation-play-state: paused;
}

/* Sur petit écran : moins de particules, le fond reste lisible et économe */
@media (max-width: 767px) {
	.particle:nth-child(n + 13) {
		display: none;
	}
}

@media (prefers-reduced-motion: reduce) {
	.orbit {
		animation: none;
	}

	.particle,
	.flash,
	.pulse {
		display: none;
	}

	.glows {
		transition: none;
	}
}

@keyframes orbit-turn {
	to {
		transform: rotate(360deg);
	}
}

@keyframes particle-rise {
	0% {
		transform: translateY(0) scale(0.6);
		opacity: 0;
	}
	35% {
		opacity: 0.9;
	}
	60% {
		opacity: 0.9;
	}
	100% {
		transform: translateY(calc(-220 * var(--px))) scale(1);
		opacity: 0;
	}
}

/* Le balancement passe par la propriété `translate`, indépendante de `transform` */
@keyframes particle-sway {
	from {
		translate: calc(var(--sway) * -1) 0;
	}
	to {
		translate: var(--sway) 0;
	}
}

@keyframes ring-flash {
	0% {
		opacity: 0;
	}
	14% {
		opacity: 0.1;
	}
	100% {
		opacity: 0;
	}
}

@keyframes ring-pulse {
	0% {
		opacity: 0.7;
		transform: scale(1);
	}
	100% {
		opacity: 0;
		transform: scale(1.22);
	}
}
</style>
