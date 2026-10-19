<script setup>
import { computed, ref } from "vue";
import RingBackdrop from "@/components/workout/layouts/ring/RingBackdrop.vue";
import RingControlBar from "@/components/workout/layouts/ring/RingControlBar.vue";
import RingDeviceStatus from "@/components/workout/layouts/ring/RingDeviceStatus.vue";
import RingProgress from "@/components/workout/layouts/ring/RingProgress.vue";
import { useElementSize } from "@/composables/useElementSize";
import { useRingWorkoutView } from "@/composables/useRingWorkoutView";

// Vue « Anneau » : un grand compte à rebours du bloc en cours au centre d'un anneau de
// progression, sur un fond qui prend la couleur de la zone de puissance. Tout ce qui est
// affiché vient de useRingWorkoutView, les actions du contrôleur partagé avec la vue classique.
const props = defineProps({
	ctrl: {
		type: Object,
		required: true,
	},
});

const { t, session, currentTargetPower } = props.ctrl;
const view = useRingWorkoutView(props.ctrl);
const {
	isFreeRide,
	title,
	accent,
	motionSpeed,
	sparkSpeed,
	nextAccent,
	timerText,
	fraction,
	sessionRemaining,
	pulseKey,
	pauseState,
	seriesView,
	nextView,
	power,
	cadence,
	heartRate,
	totals,
} = view;

const isPaused = computed(() => session.isPaused.value);

// ============================================================================
// Géométrie
// ============================================================================

// Diamètre de l'anneau dans la maquette : toutes les tailles en sont déduites par proportion
const DESIGN_RING_SIZE = 760;
// Marge minimale entre l'anneau et les côtés, et entre l'anneau et la barre de contrôle (px)
const EDGE_MARGIN = 16;
const BAR_GAP = 6;
// Part maximale de la hauteur de la vue occupée par l'anneau (760 sur 900 dans la maquette)
const MAX_HEIGHT_SHARE = 0.84;
const MIN_RING_SIZE = 210;
const MAX_RING_SIZE = 1200;
// Sous ce diamètre (petit écran), le disque est trop petit pour loger les métriques avec des
// textes lisibles : elles en sortent, à droite de l'anneau s'il reste de la largeur (téléphone
// en paysage) ou sous l'anneau s'il reste de la hauteur (téléphone en portrait).
const COMPACT_BELOW = 420;
const SIDE_PANEL_WIDTH = 150;
const SIDE_PANEL_GAP = 20;
const BELOW_ROW_HEIGHT = 80;
const BELOW_GAP = 12;

const rootRef = ref(null);
const stageRef = ref(null);
const { height: rootHeight } = useElementSize(rootRef);
const { width: stageWidth, height: stageHeight } = useElementSize(stageRef);

// Diamètre qui tient dans la place donnée, sans dépasser la part de hauteur de la maquette
function fitRing(width, height) {
	const size = Math.min(width, height, rootHeight.value * MAX_HEIGHT_SHARE);
	return Math.round(Math.min(MAX_RING_SIZE, Math.max(MIN_RING_SIZE, size)));
}

// Diamètre de l'anneau et place des métriques : dans le disque, à sa droite ou en dessous
const layout = computed(() => {
	const width = stageWidth.value;
	const height = stageHeight.value;
	if (!width || !height) return { size: 0, metrics: "inside" };

	const size = fitRing(width - 2 * EDGE_MARGIN, height - BAR_GAP);
	if (size >= COMPACT_BELOW) return { size, metrics: "inside" };

	if (width - size - 2 * EDGE_MARGIN >= SIDE_PANEL_GAP + SIDE_PANEL_WIDTH) {
		return { size, metrics: "side" };
	}

	// En dessous, l'anneau cède au besoin un peu de hauteur à la rangée de métriques
	const roomAbove = height - BAR_GAP - BELOW_GAP - BELOW_ROW_HEIGHT;
	if (roomAbove >= MIN_RING_SIZE) {
		return { size: fitRing(width - 2 * EDGE_MARGIN, roomAbove), metrics: "below" };
	}

	// Écran trop petit pour l'un comme pour l'autre : le disque garde les métriques, à l'étroit
	return { size, metrics: "inside" };
});

const ringSize = computed(() => layout.value.size);

// Échelle de la maquette : 1 = anneau de 760 px
const unit = computed(() => ringSize.value / DESIGN_RING_SIZE);

// L'anneau (et la rangée de métriques sous lui, s'il y en a une) est centré dans la vue,
// mais jamais plus bas que la barre de contrôle ne le permet
const ringTop = computed(() => {
	const below = layout.value.metrics === "below" ? BELOW_GAP + BELOW_ROW_HEIGHT : 0;
	const block = ringSize.value + below;
	const centered = (rootHeight.value - block) / 2;
	const aboveBar = stageHeight.value - block - BAR_GAP;
	return Math.max(0, Math.round(Math.min(centered, aboveBar)));
});

// Centré, avec le panneau de métriques quand il est à droite du disque
const ringLeft = computed(() => {
	const panel = layout.value.metrics === "side" ? SIDE_PANEL_GAP + SIDE_PANEL_WIDTH : 0;
	return Math.round((stageWidth.value - ringSize.value - panel) / 2);
});

// Teinte, échelle et centre de l'anneau passent par des variables CSS : le fond, l'anneau et
// le texte s'y accrochent sans que ce composant ait à les connaître.
const rootStyle = computed(() => ({
	"--u": unit.value.toFixed(4),
	"--ring-accent": accent.value,
	"--ring-next": nextAccent.value,
	"--ring-size": `${ringSize.value}px`,
	"--ring-cx": `${ringLeft.value + ringSize.value / 2}px`,
	"--ring-cy": `${ringTop.value + ringSize.value / 2}px`,
	"--side-width": `${SIDE_PANEL_WIDTH}px`,
	"--side-gap": `${SIDE_PANEL_GAP}px`,
	"--below-gap": `${BELOW_GAP}px`,
	// La rangée sous l'anneau prend toute la largeur utile, même quand l'anneau a rapetissé
	"--below-width": `${Math.max(0, stageWidth.value - 2 * EDGE_MARGIN)}px`,
	// Les lueurs du bloc suivant gagnent en intensité à mesure que le bloc touche à sa fin
	"--ring-glow": isFreeRide.value ? "0.3" : (0.2 + 0.25 * (1 - fraction.value)).toFixed(3),
}));

const figureStyle = computed(() => ({
	width: `${ringSize.value}px`,
	height: `${ringSize.value}px`,
	left: `${ringLeft.value}px`,
	top: `${ringTop.value}px`,
}));

// ============================================================================
// Contenu
// ============================================================================

// « 1:02:03 » est presque deux fois plus large que « 2:41 » : le minuteur rapetisse un peu
const isLongTimer = computed(() => timerText.value.length > 5);

const timerLabel = computed(() =>
	t(isFreeRide.value ? "workout.ring.timerElapsed" : "workout.ring.timerRemaining", {
		time: timerText.value,
	}),
);

const freeRideTarget = computed(() => Math.round(currentTargetPower.value));

// Répétitions faites (blanc), répétition en cours (couleur du bloc), à venir (estompées)
function dotState(index) {
	const info = seriesView.value;
	if (index <= info.done) return "is-done";
	if (index === info.current) return "is-active";
	return "";
}
</script>

<template>
	<section
		ref="rootRef"
		class="ring"
		:class="`is-metrics-${layout.metrics}`"
		:style="rootStyle"
	>
		<RingBackdrop :pulse-key="pulseKey" :halted="isPaused" :speed="motionSpeed" :spark-speed="sparkSpeed" />

		<div ref="stageRef" class="stage">
			<div class="figure" :style="figureStyle">
				<RingProgress :fraction="fraction" :muted="isPaused" />

				<div class="content">
					<RingDeviceStatus :ctrl="ctrl" />

					<!-- Toujours présente : la composition ne bouge pas en sortie libre -->
					<p
						class="session"
						:class="{ 'is-hidden': !sessionRemaining }"
						:aria-hidden="!sessionRemaining"
					>
						{{ t("workout.ring.sessionRemaining") }}
						<strong>{{ sessionRemaining }}</strong>
					</p>

					<h1 class="title" aria-live="polite">{{ title }}</h1>

					<div
						class="series"
						:role="seriesView ? 'img' : undefined"
						:aria-label="seriesView?.label"
						:aria-hidden="!seriesView"
					>
						<template v-if="seriesView">
							<template v-if="seriesView.asDots">
								<span
									v-for="index in seriesView.total"
									:key="index"
									class="dot"
									:class="dotState(index)"
								></span>
							</template>
							<span v-else class="series__text">{{ seriesView.text }}</span>
						</template>
					</div>

					<div
						class="timer"
						:class="{ 'is-long': isLongTimer, 'is-muted': isPaused }"
						role="timer"
						:aria-label="timerLabel"
					>
						{{ timerText }}
					</div>

					<div class="slot">
						<div
							v-if="pauseState"
							class="pill pill--state"
							:class="`is-${pauseState.kind}`"
						>
							<span class="pill__dot"></span>
							<span class="pill__text">{{ pauseState.label }}</span>
						</div>
						<div v-else-if="isFreeRide" class="pill">
							<span class="pill__bar" :style="{ background: accent }"></span>
							<span class="pill__text">{{
								t("workout.ring.freeRideTarget", { value: freeRideTarget })
							}}</span>
						</div>
						<div v-else-if="nextView" class="pill">
							<span class="pill__bar" :style="{ background: nextView.accent }"></span>
							<span class="pill__text pill__text--next">{{ nextView.label }}</span>
							<span class="pill__power">{{ nextView.text }}</span>
						</div>
					</div>

					<div class="metrics">
						<section class="metric">
							<span class="metric__label">rpm</span>
							<span class="metric__value">{{ cadence.amount }}</span>
							<span class="metric__sub">{{ cadence.sub }}</span>
						</section>
						<section class="metric metric--main">
							<span class="metric__label">watt</span>
							<span class="metric__value">{{ power.amount }}</span>
							<span class="metric__sub">{{ power.sub }}</span>
						</section>
						<section class="metric metric--hr">
							<span class="metric__label">bpm</span>
							<span class="metric__value">{{ heartRate }}</span>
							<!-- Ligne vide : même hauteur que la colonne rpm, donc même alignement -->
							<span class="metric__sub" aria-hidden="true"></span>
						</section>
					</div>

					<p class="totals">
						<strong>{{ totals.kj }}</strong> kJ
						<span class="totals__sep" aria-hidden="true">·</span>
						<strong>{{ totals.km }}</strong> km
					</p>
				</div>
			</div>
		</div>

		<RingControlBar :ctrl="ctrl" :view="view" />
	</section>
</template>

<style>
/* Propriétés typées : sans cette déclaration, un changement de couleur d'un bloc à l'autre
   sauterait au lieu de se fondre. Elles ne se déclarent qu'une fois et globalement, d'où ce
   bloc sans portée ; la transition elle-même est dans la feuille du composant. */
@property --ring-accent {
	syntax: "<color>";
	inherits: true;
	initial-value: #b8c0cc;
}

@property --ring-next {
	syntax: "<color>";
	inherits: true;
	initial-value: #b8c0cc;
}
</style>

<style scoped>
.ring {
	/* Échelle par défaut avant la première mesure ; la valeur réelle vient du style en ligne */
	--u: 1;
	--px: calc(var(--u) * 1px);
	--ring-bg: #08090b;
	--ring-fg: rgb(238, 240, 242);
	--ring-muted: rgba(238, 240, 242, 0.72);

	position: relative;
	isolation: isolate;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	/* <main> a un remplissage de 0,5 rem (1,5 rem dès md) : la vue le compense pour occuper
	   toute la zone. Sur mobile, le bas est laissé libre pour la barre de navigation fixe. */
	margin: -0.5rem;
	height: calc(100% + 1rem);
	padding-bottom: calc(4rem + env(safe-area-inset-bottom, 0px));
	background: var(--ring-bg);
	color: var(--ring-fg);
	color-scheme: dark;
	font-family: "Oxanium", system-ui, sans-serif;
	-webkit-user-select: none;
	user-select: none;
	touch-action: manipulation;
	transition:
		--ring-accent 0.7s ease,
		--ring-next 0.7s ease;
}

@media (min-width: 768px) {
	.ring {
		margin: -1.5rem;
		height: calc(100% + 3rem);
		padding-bottom: 0;
	}
}

.stage {
	position: relative;
	flex: 1 1 0;
	min-height: 0;
}

.figure {
	position: absolute;
}

.content {
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 0 6%;
	text-align: center;
}

.session {
	margin: calc(8 * var(--px)) 0 calc(8 * var(--px));
	color: var(--ring-muted);
	font-size: max(11px, calc(18 * var(--px)));
	line-height: 1.2;
	white-space: nowrap;
}

.session.is-hidden {
	visibility: hidden;
}

.session strong {
	color: var(--ring-fg);
	font-size: max(12px, calc(20 * var(--px)));
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}

/* overflow: hidden (nécessaire à l'ellipse) coupe sinon l'accent d'un « É » et les jambages :
   la marge intérieure leur laisse la place, la marge négative garde la mise en page intacte. */
.title {
	margin: -0.2em 0;
	padding: 0.2em 0;
	max-width: 100%;
	overflow: hidden;
	font-size: max(18px, calc(36 * var(--px)));
	font-weight: 700;
	line-height: 1.05;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.series {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: max(5px, calc(8 * var(--px)));
	height: max(10px, calc(14 * var(--px)));
	margin-top: calc(6 * var(--px));
}

.dot {
	flex: none;
	width: max(7px, calc(9 * var(--px)));
	aspect-ratio: 1;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.22);
	transition:
		background-color 0.4s ease,
		box-shadow 0.4s ease;
}

.dot.is-done {
	background: var(--ring-fg);
}

.dot.is-active {
	background: var(--ring-accent);
	box-shadow: 0 0 calc(10 * var(--px)) var(--ring-accent);
}

.series__text {
	color: var(--ring-muted);
	font-size: max(12px, calc(16 * var(--px)));
	font-weight: 600;
	font-variant-numeric: tabular-nums;
	letter-spacing: 0.04em;
}

.timer {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 1em;
	font-size: max(56px, calc(180 * var(--px)));
	font-weight: 800;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.03em;
	line-height: 0.95;
	white-space: nowrap;
	transition: opacity 0.4s ease;
}

.timer.is-long {
	font-size: max(44px, calc(140 * var(--px)));
}

.timer.is-muted {
	opacity: 0.55;
}

.slot {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	min-height: max(24px, calc(30 * var(--px)));
	margin-bottom: calc(20 * var(--px));
}

.pill {
	display: inline-flex;
	align-items: center;
	gap: max(7px, calc(12 * var(--px)));
	max-width: 100%;
	padding: max(3px, calc(5 * var(--px))) max(8px, calc(18 * var(--px)));
	font-size: max(11px, calc(19 * var(--px)));
	font-weight: 500;
	line-height: 1.23;
}

/* Dans un petit disque, la pastille est assez bas pour que le cercle se resserre autour d'elle */
:is(.is-metrics-side, .is-metrics-below) .pill {
	max-width: 82%;
}

.pill__text {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* Bloc annoncé : « puis » en retrait, puis la durée et la puissance */
.pill__text--next {
	min-width: 0;
	opacity: 0.6;
}

.pill__power {
	flex: none;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

/* Barre de la couleur du bloc annoncé : elle se fond en douceur d'un bloc à l'autre */
.pill__bar {
	flex: none;
	width: max(4px, calc(6 * var(--px)));
	height: max(14px, calc(24 * var(--px)));
	border-radius: 999px;
	transition: background-color 0.6s ease;
}

.pill__dot {
	flex: none;
	width: max(7px, calc(10 * var(--px)));
	aspect-ratio: 1;
	border-radius: 50%;
	background: #fb923c;
	box-shadow: 0 0 calc(10 * var(--px)) rgba(251, 146, 60, 0.7);
}

.pill--state.is-waiting .pill__dot {
	animation: ring-blink 1.2s ease-in-out infinite;
}

.metrics {
	display: grid;
	grid-template-columns: calc(130 * var(--px)) calc(235 * var(--px)) calc(130 * var(--px));
	gap: calc(8 * var(--px));
	/* rpm et bpm ont la même structure : centrés sur le watt, ils restent sur la même ligne */
	align-items: center;
}

/* Anneau trop petit pour contenir les métriques lisiblement : elles sortent du disque, à sa
   droite en paysage, en dessous en portrait (tailles et écarts : SIDE_PANEL_* et BELOW_*). */
.is-metrics-side .metrics {
	position: absolute;
	top: 50%;
	left: calc(100% + var(--side-gap));
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;
	width: var(--side-width);
	transform: translateY(-50%);
	text-align: left;
}

.is-metrics-below .metrics {
	position: absolute;
	top: calc(100% + var(--below-gap));
	left: 50%;
	width: var(--below-width);
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px;
	transform: translateX(-50%);
}

.metric {
	display: flex;
	flex-direction: column;
	gap: calc(2 * var(--px));
	min-width: 0;
}

.metric__label {
	color: var(--ring-muted);
	font-family: "Fira Code", monospace;
	font-size: max(11px, calc(13 * var(--px)));
	letter-spacing: 0.14em;
	line-height: 1.29;
	text-transform: uppercase;
}

.metric__value {
	font-size: max(30px, calc(68 * var(--px)));
	font-weight: 800;
	font-variant-numeric: tabular-nums;
	line-height: 1;
}

.metric--main .metric__value {
	font-size: max(46px, calc(110 * var(--px)));
}

.metric--hr .metric__value {
	color: rgb(255, 139, 139);
}

/* Hors du disque, les chiffres ont la place d'être plus grands que les planchers ci-dessus */
:is(.is-metrics-side, .is-metrics-below) .metric__value {
	font-size: 34px;
}

:is(.is-metrics-side, .is-metrics-below) .metric--main .metric__value {
	font-size: 44px;
}

/* Garde sa hauteur même vide, pour que rpm et bpm gardent exactement la même hauteur */
.metric__sub {
	min-height: 1.26em;
	color: var(--ring-muted);
	font-size: max(11px, calc(14 * var(--px)));
	line-height: 1.26;
	white-space: nowrap;
}

.totals {
	margin: calc(12 * var(--px)) 0 0;
	color: var(--ring-muted);
	font-size: max(12px, calc(17 * var(--px)));
	white-space: nowrap;
}

.totals strong {
	color: var(--ring-fg);
	font-size: max(13px, calc(19 * var(--px)));
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}

.totals__sep {
	margin: 0 max(6px, calc(10 * var(--px)));
}

@media (prefers-reduced-motion: reduce) {
	.ring,
	.timer,
	.dot,
	.pill__bar {
		transition: none;
	}

	.pill--state.is-waiting .pill__dot {
		animation: none;
	}
}

@keyframes ring-blink {
	50% {
		opacity: 0.35;
	}
}
</style>
