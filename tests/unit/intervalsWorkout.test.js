import { describe, expect, it } from 'bun:test';
import { convertIntervalsEvent, extractDayWorkouts, localDateString, UnsupportedWorkout } from '../../src/utils/intervalsWorkout.js';
import { PreparationError } from '../../src/utils/preparationMessages.js';

const FTP = 250;

const pct = (value) => ({ value, units: '%ftp' });
const event = (workoutDoc, extra = {}) => ({
  id: 1,
  category: 'WORKOUT',
  type: 'Ride',
  name: 'Séance test',
  start_date_local: '2026-10-20T00:00:00',
  workout_doc: workoutDoc,
  ...extra
});

describe('convertIntervalsEvent — format réel workout_doc', () => {
  // Exemple publié sur le forum Intervals.icu (6 x 2 min à 98 % / 2 min à 43 %)
  const forumExample = {
    duration: 4740,
    ftp: 235,
    steps: [
      { duration: 600, power: pct(43) },
      { duration: 900, power: pct(65) },
      { reps: 6, text: '6x', steps: [{ duration: 120, power: pct(98) }, { duration: 120, power: pct(43) }], duration: 1440 },
      { duration: 900, power: pct(65) },
      { duration: 900, power: pct(43) }
    ]
  };

  it('déplie les répétitions et garde la durée totale annoncée', () => {
    const workout = convertIntervalsEvent(event(forumExample), { ftp: FTP });

    expect(workout.intervals).toHaveLength(16);
    expect(workout.duration).toBe(4740);
    expect(workout.intervals.reduce((total, i) => total + i.duration, 0)).toBe(workout.duration);
    expect(workout.intervals[2]).toMatchObject({ duration: 120, power: 0.98 });
    expect(workout.intervals[13]).toMatchObject({ duration: 120, power: 0.43 });
    expect(workout.sourceFtp).toBe(235);
    expect(workout.source).toBe('intervals.icu');
  });

  it('calcule les cibles en watts à partir de la FTP de Spinnn', () => {
    const workout = convertIntervalsEvent(event(forumExample), { ftp: FTP });
    expect(Math.round(workout.intervals[2].power * FTP)).toBe(245);
    expect(Math.round(workout.intervals[0].power * 300)).toBe(129);
  });

  it('lit un échauffement progressif (warmup + ramp, start/end)', () => {
    const workout = convertIntervalsEvent(
      event({ steps: [{ duration: 180, warmup: true, ramp: true, power: { start: 35, end: 55, units: '%ftp' } }] }),
      { ftp: FTP }
    );
    expect(workout.intervals[0]).toEqual({ type: 'warmup', duration: 180, powerStart: 0.35, powerEnd: 0.55 });
  });

  it('garde le sens d’une rampe descendante (retour au calme)', () => {
    const workout = convertIntervalsEvent(
      event({ steps: [{ duration: 300, cooldown: true, ramp: true, power: { start: 65, end: 40, units: '%ftp' } }] }),
      { ftp: FTP }
    );
    expect(workout.intervals[0]).toEqual({ type: 'cooldown', duration: 300, powerStart: 0.65, powerEnd: 0.4 });
  });

  it('lit une rampe de travail', () => {
    const workout = convertIntervalsEvent(
      event({ steps: [{ duration: 600, ramp: true, power: { start: 60, end: 90, units: '%ftp' } }] }),
      { ftp: FTP }
    );
    expect(workout.intervals[0]).toEqual({ type: 'ramp', duration: 600, powerStart: 0.6, powerEnd: 0.9 });
  });

  it('vise le milieu d’une fourchette sans rampe (95-105 %)', () => {
    const workout = convertIntervalsEvent(
      event({ steps: [{ duration: 300, power: { start: 95, end: 105, units: '%ftp' } }] }),
      { ftp: FTP }
    );
    expect(workout.intervals[0]).toMatchObject({ type: 'steady', power: 1 });
    expect(workout.intervals[0].powerStart).toBeUndefined();
  });

  it('rapporte des watts absolus à la FTP de Spinnn en conservant les watts', () => {
    const workout = convertIntervalsEvent(
      event({ steps: [{ duration: 300, power: { value: 200, units: 'w' } }] }),
      { ftp: 250 }
    );
    expect(workout.intervals[0].power).toBe(0.8);
    expect(Math.round(workout.intervals[0].power * 250)).toBe(200);
  });

  it('gère des répétitions imbriquées', () => {
    const workout = convertIntervalsEvent(
      event({
        steps: [
          {
            reps: 2,
            steps: [
              { duration: 60, power: pct(100) },
              { reps: 3, steps: [{ duration: 10, power: pct(120) }, { duration: 5, power: pct(50) }] }
            ]
          }
        ]
      }),
      { ftp: FTP }
    );
    // 2 x (60 + 3 x 15) = 210 s, 2 x (1 + 6) = 14 intervalles
    expect(workout.intervals).toHaveLength(14);
    expect(workout.duration).toBe(210);
  });

  it('marque la récupération et lit la cadence', () => {
    const workout = convertIntervalsEvent(
      event({
        steps: [
          { duration: 120, intensity: 'rest', power: pct(45), cadence: { value: 85, units: 'rpm' } },
          { duration: 240, intensity: 'active', power: pct(105), cadence: { start: 90, end: 100, units: 'rpm' } }
        ]
      }),
      { ftp: FTP }
    );
    expect(workout.intervals[0]).toMatchObject({ type: 'recovery', power: 0.45, cadence: 85 });
    expect(workout.intervals[1]).toMatchObject({ type: 'work', power: 1.05, cadence: 95 });
  });

  it('accepte un sprint à 400 % de la FTP', () => {
    const workout = convertIntervalsEvent(event({ steps: [{ duration: 15, power: pct(400) }] }), { ftp: FTP });
    expect(workout.intervals[0].power).toBe(4);
  });

  it('ne prend plus un pourcentage inférieur à 2 pour une fraction (1 % reste 1 %)', () => {
    const workout = convertIntervalsEvent(event({ steps: [{ duration: 60, power: pct(1) }] }), { ftp: FTP });
    expect(workout.intervals[0].power).toBe(0.01);
  });
});

describe('convertIntervalsEvent — séances refusées avec raison', () => {
  const reasonOf = (doc, extra) => {
    try {
      convertIntervalsEvent(event(doc, extra), { ftp: FTP });
    } catch (error) {
      expect(error).toBeInstanceOf(UnsupportedWorkout);
      return error.reason;
    }
    throw new Error('conversion inattendue');
  };

  it('refuse une séance sans étapes', () => {
    expect(reasonOf(undefined)).toBe('noStructure');
    expect(reasonOf({ steps: [] })).toBe('noStructure');
  });

  it('refuse une étape en roue libre plutôt que d’inventer une cible', () => {
    expect(reasonOf({ steps: [{ duration: 600, freeride: true }] })).toBe('freeride');
  });

  it('refuse une étape sans durée (distance ou tour)', () => {
    expect(reasonOf({ steps: [{ distance: 1000, power: pct(80) }] })).toBe('noDuration');
    expect(reasonOf({ steps: [{ until_lap_press: true, power: pct(80) }] })).toBe('noDuration');
  });

  it('refuse une cible cardio ou allure', () => {
    expect(reasonOf({ steps: [{ duration: 300, hr: { value: 70, units: '%hr' } }] })).toBe('noPowerTarget');
    expect(reasonOf({ target: 'HR', steps: [{ duration: 300, power: pct(80) }] })).toBe('noPowerTarget');
  });

  it('refuse une unité de puissance inconnue', () => {
    expect(reasonOf({ steps: [{ duration: 300, power: { value: 90, units: '%mmp' } }] })).toBe('unit');
  });

  it('refuse une séance qui n’est pas du vélo', () => {
    expect(reasonOf({ steps: [{ duration: 300, power: pct(80) }] }, { type: 'Run' })).toBe('notCycling');
  });

  it('refuse des valeurs incohérentes', () => {
    expect(reasonOf({ steps: [{ duration: 300, power: pct(0) }] })).toBe('invalidValue');
    expect(reasonOf({ steps: [{ duration: 300, power: pct(900) }] })).toBe('invalidValue');
    expect(reasonOf({ steps: [{ reps: 0, steps: [{ duration: 30, power: pct(80) }] }] })).toBe('invalidValue');
  });
});

describe('extractDayWorkouts', () => {
  const doc = { steps: [{ duration: 600, power: pct(70) }] };

  it('ne garde que les séances du jour et trie les séances refusées', () => {
    const { workouts, skipped } = extractDayWorkouts(
      [
        event(doc, { id: 1 }),
        event(doc, { id: 2, start_date_local: '2026-10-21T00:00:00' }),
        event(doc, { id: 3, category: 'NOTE' }),
        event({ steps: [{ duration: 600, freeride: true }] }, { id: 4, name: 'Roue libre' }),
        event(undefined, { id: 5, name: 'Texte seul' })
      ],
      { date: '2026-10-20', ftp: FTP }
    );

    expect(workouts.map((workout) => workout.id)).toEqual(['intervals-1']);
    expect(skipped).toEqual([
      { id: 'intervals-4', name: 'Roue libre', reason: 'intervals.skip.freeride', params: {} },
      { id: 'intervals-5', name: 'Texte seul', reason: 'intervals.skip.noStructure', params: {} }
    ]);
  });

  it('renvoie des listes vides quand rien n’est planifié', () => {
    expect(extractDayWorkouts([], { date: '2026-10-20', ftp: FTP })).toEqual({ workouts: [], skipped: [] });
  });

  it('signale une réponse qui n’est pas une liste', () => {
    expect(() => extractDayWorkouts({ error: 'x' }, { date: '2026-10-20', ftp: FTP })).toThrow(PreparationError);
  });
});

describe('localDateString', () => {
  it('donne le jour local, pas le jour UTC', () => {
    // 00h30 locale : en UTC+1 / UTC+2 (Paris), toISOString() donnerait encore la veille
    const justAfterMidnight = new Date(2026, 9, 20, 0, 30, 0);
    expect(localDateString(justAfterMidnight)).toBe('2026-10-20');
  });

  it('complète mois et jour sur deux chiffres', () => {
    expect(localDateString(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});
