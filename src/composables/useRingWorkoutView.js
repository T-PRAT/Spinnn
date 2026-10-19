/**
 * Modèle d'affichage de la vue Anneau.
 *
 * Traduit l'état brut de la séance (temps écoulé, métriques, appareils) en valeurs prêtes à
 * être liées au template : bloc en cours, minuteur, répétitions, aperçu du bloc suivant,
 * métriques. Le composant ne garde que le rendu.
 *
 * `elapsedSeconds` est mis à jour dix fois par seconde. Tout ce qui en dépend est exposé en
 * computed dont la valeur ne change qu'à la seconde (ou au changement de bloc) : la vue
 * n'est donc redessinée qu'une fois par seconde, pas dix.
 */
import { computed, ref, watch } from 'vue';
import { ControlMode } from '@/composables/useBluetoothTrainer';
import { useFreeRide } from '@/composables/useFreeRide';
import { useI18n } from '@/composables/useI18n';
import {
  RING_TONE_COLORS,
  RING_NEUTRAL_COLOR,
  RING_MOTION_SPEED,
  RING_MOTION_SPEED_DEFAULT,
  RING_SPARK_PER_RPM,
  RING_SPARK_MIN,
  RING_SPARK_MAX
} from '@/constants/ringTones';
import { getAdjustedTargetPowerAtTime } from '@/data/sampleWorkouts';
import {
  buildTimeline,
  findBlockIndex,
  getBlockPowerAt,
  getBlockTone,
  detectSeries,
  formatClock,
  formatSpan
} from '@/utils/workoutBlocks';

// Au-delà de ce nombre de répétitions, on affiche « 3/10 » plutôt qu'une rangée de points
const MAX_SERIES_DOTS = 8;

// Pas du réglage de puissance en sortie libre, en watts
export const FREE_RIDE_STEP = 10;

/**
 * @param {object} ctrl - Contrôleur de séance (useWorkoutController)
 */
export function useRingWorkoutView(ctrl) {
  const {
    t,
    appState,
    session,
    trainer,
    powerAdjustments,
    currentMetrics,
    currentTargetPower,
    isWaitingForPedaling
  } = ctrl;
  const { currentLocale } = useI18n();
  const freeRide = useFreeRide();

  // ==========================================================================
  // Découpage de la séance en blocs
  // ==========================================================================

  const workout = computed(() => appState.selectedWorkout.value);
  const isFreeRide = computed(() => Boolean(workout.value?.isFreeRide));

  const timeline = computed(() => buildTimeline(workout.value, appState.powerZones.value));
  const series = computed(() => detectSeries(timeline.value));

  // Recalculé à chaque tick mais, comme sa valeur ne change qu'au changement de bloc, rien de
  // ce qui en dépend n'est relancé entre deux blocs.
  const blockIndex = computed(() =>
    timeline.value.length === 0 ? -1 : findBlockIndex(timeline.value, session.elapsedSeconds.value)
  );
  const block = computed(() => timeline.value[blockIndex.value] ?? null);
  const nextBlock = computed(() =>
    blockIndex.value < 0 ? null : (timeline.value[blockIndex.value + 1] ?? null)
  );
  const seriesInfo = computed(() => series.value[blockIndex.value] ?? null);

  // ==========================================================================
  // Teintes et titre
  // ==========================================================================

  // Un bloc progressif (échauffement, rampe) prend la teinte de sa puissance du moment
  const toneKey = computed(() => {
    const current = block.value;
    if (!current) return null;
    if (!current.isGradual) return getBlockTone(current, appState.powerZones.value);

    const power = getBlockPowerAt(current, session.elapsedSeconds.value);
    return getBlockTone(current, appState.powerZones.value, power);
  });
  const accent = computed(() => RING_TONE_COLORS[toneKey.value] ?? RING_NEUTRAL_COLOR);

  // Cercles : plus la zone du bloc est élevée, plus ils tournent vite
  const motionSpeed = computed(() => RING_MOTION_SPEED[toneKey.value] ?? RING_MOTION_SPEED_DEFAULT);

  // Étincelles : au rythme du pédalage
  const sparkSpeed = computed(() => {
    const rpm = currentMetrics.value.cadence || 0;
    return Math.min(RING_SPARK_MAX, Math.max(RING_SPARK_MIN, rpm * RING_SPARK_PER_RPM));
  });

  // Les lueurs annoncent le bloc suivant ; sans bloc suivant, elles gardent la teinte courante
  const nextAccent = computed(() => {
    if (!nextBlock.value) return accent.value;
    return RING_TONE_COLORS[getBlockTone(nextBlock.value, appState.powerZones.value)] ?? accent.value;
  });

  const title = computed(() => {
    if (isFreeRide.value) return t('workout.ring.freeRide');
    return block.value ? t(`workout.ring.blocks.${block.value.labelKey}`) : '';
  });

  // ==========================================================================
  // Minuteur et anneau
  // ==========================================================================

  // Secondes entières restantes dans le bloc, arrondies au-dessus : le minuteur affiche
  // « 0:01 » jusqu'à la toute fin du bloc, jamais « 0:00 » avant le changement de bloc.
  const blockRemaining = computed(() => {
    if (!block.value) return 0;
    return Math.max(0, Math.ceil(block.value.end - session.elapsedSeconds.value));
  });

  // En sortie libre, le minuteur compte le temps roulé (celui du chrono de la vue classique)
  const timerText = computed(() =>
    isFreeRide.value
      ? formatClock(session.activeElapsedSeconds.value)
      : formatClock(blockRemaining.value)
  );

  // Part restante du bloc (1 = plein). Dérivée de blockRemaining pour ne bouger qu'une fois par seconde.
  const fraction = computed(() => {
    if (isFreeRide.value) return 1;
    if (!block.value || block.value.duration <= 0) return 0;
    return Math.min(1, blockRemaining.value / block.value.duration);
  });

  const sessionRemaining = computed(() => {
    const total = workout.value?.duration;
    if (isFreeRide.value || !Number.isFinite(total)) return null;
    return formatClock(Math.max(0, Math.ceil(total - session.elapsedSeconds.value)));
  });

  // Un « top » à chaque changement de bloc, qui relance les animations de transition
  const pulseKey = ref(0);
  watch(blockIndex, (index, previous) => {
    if (index >= 0 && previous >= 0 && index !== previous) pulseKey.value++;
  });

  // ==========================================================================
  // État, répétitions et bloc suivant
  // ==========================================================================

  const pauseState = computed(() => {
    if (!session.isPaused.value) return null;
    if (!isWaitingForPedaling.value) {
      return { kind: 'paused', label: t('workout.ring.paused') };
    }

    const notStarted = session.dataPoints.value.length === 0;
    return {
      kind: 'waiting',
      label: t(notStarted ? 'workout.pedalToStart' : 'workout.waitingForPedaling')
    };
  });

  const seriesView = computed(() => {
    const info = seriesInfo.value;
    if (!info) return null;

    const isWork = info.role === 'work';
    return {
      total: info.reps,
      // Pendant une répétition, les précédentes sont faites ; pendant la récupération, celle qui vient de finir l'est aussi
      done: isWork ? info.rep - 1 : info.rep,
      current: isWork ? info.rep : 0,
      asDots: info.reps <= MAX_SERIES_DOTS,
      text: `${info.rep}/${info.reps}`,
      label: t(isWork ? 'workout.ring.seriesWork' : 'workout.ring.seriesRecovery', {
        rep: info.rep,
        total: info.reps
      })
    };
  });

  // « Sweet spot 2/3 » : le numéro de répétition ne s'affiche que sur les blocs de travail
  function getBlockName(target) {
    const name = t(`workout.ring.blocks.${target.labelKey}`);
    const info = series.value[target.index];
    return info?.role === 'work' ? `${name} ${info.rep}/${info.reps}` : name;
  }

  const nextView = computed(() => {
    if (isFreeRide.value || !block.value) return null;

    const upcoming = nextBlock.value;
    if (!upcoming) {
      return { accent: accent.value, label: t('workout.ring.nextLabel'), text: t('workout.ring.nextEnd') };
    }

    // Le décalage propre au bloc est remis à zéro au changement de bloc : seul le global compte
    const offset = powerAdjustments.globalOffset.value;

    // Bloc suivant : la durée et la puissance, sans le nom, pour que la pastille reste courte
    const powerAt = (seconds) =>
      getAdjustedTargetPowerAtTime(workout.value, seconds, appState.ftp.value, 0, offset);
    const params = { duration: formatSpan(upcoming.duration) };
    const text = upcoming.isGradual
      ? t('workout.ring.nextRamp', {
          ...params,
          from: powerAt(upcoming.start),
          to: powerAt(upcoming.end - 0.001)
        })
      : t('workout.ring.nextSteady', { ...params, power: powerAt(upcoming.start) });

    // « puis » et la puissance sont deux morceaux : la puissance est dans une police chiffres
    return { accent: nextAccent.value, label: t('workout.ring.nextLabel'), text };
  });

  // ==========================================================================
  // Métriques
  // ==========================================================================

  // En ERG (ou en simulation), la puissance affichée en grand est la cible : le home trainer
  // la tient, le réel passe en sous-ligne.
  const isErgActive = computed(
    () =>
      appState.mockModeActive.value ||
      (trainer.hasControl.value && trainer.controlMode.value === ControlMode.ERG)
  );

  const hasData = computed(() => session.dataPoints.value.length > 0);

  const power = computed(() => {
    const actual = Math.round(currentMetrics.value.power || 0);
    const target = Math.round(currentTargetPower.value || 0);
    const showsTarget = isErgActive.value && target > 0;

    const parts = [];
    if (showsTarget) parts.push(t('workout.ring.actual', { value: actual }));
    else if (target > 0) parts.push(t('workout.ring.target', { value: target }));
    if (hasData.value) {
      parts.push(t('workout.ring.average', { value: Math.round(session.avgPower.value) }));
    }

    return { amount: showsTarget ? target : actual, sub: parts.join(' · ') };
  });

  const cadence = computed(() => {
    const target = block.value?.cadence;
    return {
      amount: Math.round(currentMetrics.value.cadence || 0),
      sub: target ? t('workout.ring.target', { value: Math.round(target) }) : ''
    };
  });

  const heartRate = computed(() => {
    const bpm = Math.round(currentMetrics.value.heartRate || 0);
    return bpm > 0 ? String(bpm) : '—';
  });

  const distanceFormat = computed(
    () =>
      new Intl.NumberFormat(currentLocale.value, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      })
  );

  const totals = computed(() => ({
    kj: session.energyKJ.value,
    km: distanceFormat.value.format((currentMetrics.value.distance || 0) / 1000)
  }));

  // ==========================================================================
  // Sortie libre : réglage de la puissance cible
  // ==========================================================================

  const freeRideLimits = computed(() => {
    const { minPower, maxPower } = freeRide.getState();
    return { min: minPower, max: maxPower };
  });

  const canStepFreeRideDown = computed(() => currentTargetPower.value > freeRideLimits.value.min);
  const canStepFreeRideUp = computed(() => currentTargetPower.value < freeRideLimits.value.max);

  /**
   * @param {1|-1} direction - Augmenter ou diminuer la cible d'un pas
   */
  function stepFreeRidePower(direction) {
    const { min, max } = freeRideLimits.value;
    const next = Math.round(currentTargetPower.value) + direction * FREE_RIDE_STEP;
    // La valeur envoyée au home trainer est bornée ici, le contrôleur ne le fait pas pour lui
    ctrl.handleFreeRidePowerChange(Math.min(max, Math.max(min, next)));
  }

  return {
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
    isErgActive,
    power,
    cadence,
    heartRate,
    totals,
    canStepFreeRideDown,
    canStepFreeRideUp,
    stepFreeRidePower
  };
}
