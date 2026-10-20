/**
 * Préparation de séance : import ZWO, récupération Intervals.icu, FTP.
 *
 * L'API Intervals.icu est simulée (page.route) : ces tests valident l'interprétation du format
 * et les messages d'erreur, pas un compte réel. Les fixtures de tests/fixtures servent aussi
 * à essayer l'import à la main (par exemple sur une tablette).
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const fixture = (name) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));
const readFixture = (name) => readFileSync(fixture(name), 'utf8');

const pad = (n) => String(n).padStart(2, '0');
const localDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const eventsFixture = () =>
  readFixture('intervals/today-events.json')
    .replaceAll('__TODAY__', localDate(0))
    .replaceAll('__TOMORROW__', localDate(1));

const FTP_KEY = 'spinnn_ftp';

test.describe('Import ZWO', () => {
  async function parseInPage(page, xml) {
    await page.goto('/');
    return page.evaluate(async (content) => {
      const { parseZwo } = await import('/src/utils/zwoParser.js');
      try {
        return { workout: parseZwo(content, { fallbackName: 'repli' }) };
      } catch (error) {
        return { code: error.code, params: error.params };
      }
    }, xml);
  }

  test('séance représentative : durées, répétitions, rampes et cadence', async ({ page }) => {
    const { workout } = await parseInPage(page, readFixture('zwo/representative.zwo'));

    expect(workout.name).toBe('Séance représentative');
    expect(workout.duration).toBe(2760);
    // échauffement, palier, 3 x (travail + récupération), rampe, palier, retour au calme
    expect(workout.intervals).toHaveLength(11);
    expect(workout.intervals.reduce((total, i) => total + i.duration, 0)).toBe(2760);

    expect(workout.intervals[0]).toEqual({ type: 'warmup', duration: 600, powerStart: 0.4, powerEnd: 0.75 });
    expect(workout.intervals[1]).toEqual({ type: 'steady', duration: 300, power: 0.65, cadence: 90 });
    expect(workout.intervals.slice(2, 8).map((i) => [i.type, i.duration, i.power])).toEqual([
      ['work', 240, 1.05], ['recovery', 120, 0.5],
      ['work', 240, 1.05], ['recovery', 120, 0.5],
      ['work', 240, 1.05], ['recovery', 120, 0.5]
    ]);
    expect(workout.intervals[2].cadence).toBe(95);
    expect(workout.intervals[3].cadence).toBe(85);
    expect(workout.intervals[8]).toEqual({ type: 'ramp', duration: 300, powerStart: 0.6, powerEnd: 0.9 });
    // Une descente garde son sens : PowerLow est le début du bloc
    expect(workout.intervals[10]).toEqual({ type: 'cooldown', duration: 300, powerStart: 0.7, powerEnd: 0.35 });
  });

  test('cibles en watts calculées avec la FTP', async ({ page }) => {
    const { workout } = await parseInPage(page, readFixture('zwo/representative.zwo'));

    const targets = await page.evaluate(
      async ({ workout, ftp }) => {
        const { getTargetPowerAtTime } = await import('/src/data/sampleWorkouts.js');
        return [0, 900, 1140, 1980, 2130, 2460].map((t) => getTargetPowerAtTime(workout, t, ftp));
      },
      { workout, ftp: 250 }
    );

    // début échauffement 40 %, 1er travail 105 %, récupération 50 %, début rampe 60 %, milieu rampe 75 %, début retour au calme 70 %
    expect(targets).toEqual([100, 263, 125, 150, 188, 175]);
  });

  test('fichiers invalides : chaque cas a son code d’erreur', async ({ page }) => {
    const wrap = (inner, extra = '') => `<workout_file>${extra}<workout>${inner}</workout></workout_file>`;
    const cases = [
      ['xml cassé', readFixture('zwo/invalid-garbage.zwo'), 'zwo.invalidXml'],
      ['fichier vide', '', 'zwo.invalidXml'],
      ['xml qui n’est pas une séance', readFixture('zwo/not-a-workout.xml'), 'zwo.notZwo'],
      ['bloc FreeRide', readFixture('zwo/with-freeride.zwo'), 'zwo.unsupportedBlock'],
      ['séance sans bloc', wrap(''), 'zwo.empty'],
      ['durée absente', wrap('<SteadyState Power="0.7"/>'), 'zwo.invalidValue'],
      ['durée nulle', wrap('<SteadyState Duration="0" Power="0.7"/>'), 'zwo.invalidValue'],
      ['puissance en watts au lieu de fraction', wrap('<SteadyState Duration="300" Power="250"/>'), 'zwo.invalidValue'],
      ['puissance absente', wrap('<SteadyState Duration="300"/>'), 'zwo.invalidValue'],
      ['rampe sans PowerHigh', wrap('<Ramp Duration="300" PowerLow="0.5"/>'), 'zwo.invalidValue'],
      ['répétition à zéro', wrap('<IntervalsT Repeat="0" OnDuration="30" OffDuration="30" OnPower="1" OffPower="0.5"/>'), 'zwo.invalidValue'],
      ['séance de course à pied', wrap('<SteadyState Duration="300" Power="0.7"/>', '<sportType>run</sportType>'), 'zwo.notBike']
    ];

    await page.goto('/');
    for (const [label, xml, expectedCode] of cases) {
      const result = await page.evaluate(async (content) => {
        const { parseZwo } = await import('/src/utils/zwoParser.js');
        try {
          parseZwo(content);
          return { code: null };
        } catch (error) {
          return { code: error.code, params: error.params };
        }
      }, xml);
      expect({ label, code: result.code }).toEqual({ label, code: expectedCode });
    }
  });

  test('particularités de fichiers réels : PowerLow/PowerHigh égaux, durées décimales, sprints à 400 %', async ({ page }) => {
    // Observées sur des fichiers publics (convertis depuis d'autres outils) : 1 501 paliers sur 1 504
    // n'ont pas d'attribut Power mais PowerLow = PowerHigh, avec des durées comme « 250.2 »
    const { workout } = await parseInPage(
      page,
      `<workout_file><name>Réel</name><workout>
         <SteadyState Duration="250.2" PowerHigh="0.560" PowerLow="0.560"/>
         <SteadyState Duration="30.6" PowerHigh="1.240" PowerLow="1.240"/>
         <SteadyState Duration="150" Power="4"/>
       </workout></workout_file>`
    );

    expect(workout.intervals.map((i) => [i.duration, i.power])).toEqual([[250, 0.56], [31, 1.24], [150, 4]]);
    expect(workout.duration).toBe(431);
  });

  test('palier avec PowerLow différent de PowerHigh : refusé plutôt que deviné', async ({ page }) => {
    const result = await parseInPage(
      page,
      '<workout_file><workout><SteadyState Duration="600" PowerLow="0.90" PowerHigh="1.05"/></workout></workout_file>'
    );
    expect(result).toEqual({ code: 'zwo.invalidValue', params: { attr: 'Power', index: 1, block: 'SteadyState' } });
  });

  test('le nom vient du fichier, sinon du nom de fichier', async ({ page }) => {
    const { workout } = await parseInPage(
      page,
      '<workout_file><workout><SteadyState Duration="60" Power="0.5"/></workout></workout_file>'
    );
    expect(workout.name).toBe('repli');
  });

  test('import par l’interface : erreur lisible, puis nouvel essai avec le même champ', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('zwo-input');

    // 1) Fichier cassé : message compréhensible, pas de boîte alert()
    let dialogShown = false;
    page.on('dialog', () => { dialogShown = true; });
    await input.setInputFiles(fixture('zwo/invalid-garbage.zwo'));
    await expect(page.getByTestId('zwo-error')).toContainText('pas un document XML valide');
    await expect(page.getByTestId('zwo-error')).toContainText('Exportez de nouveau');
    expect(dialogShown).toBe(false);

    // 2) Le champ est vidé après chaque essai : un vrai navigateur ne déclenche aucun événement
    // si on resélectionne le même fichier (corrigé entre-temps) tant que le champ garde sa valeur.
    // Playwright émet toujours l'événement : on vérifie donc la réinitialisation elle-même.
    await expect(input).toHaveValue('');
    await input.setInputFiles(fixture('zwo/invalid-garbage.zwo'));
    await expect(page.getByTestId('zwo-error')).toBeVisible();

    // 3) Un bloc non pris en charge est nommé
    await input.setInputFiles(fixture('zwo/with-freeride.zwo'));
    await expect(page.getByTestId('zwo-error')).toContainText('FreeRide');

    // 4) Fichier correct : l'erreur disparaît, la séance est annoncée et prévisualisée
    await input.setInputFiles(fixture('zwo/representative.zwo'));
    await expect(page.getByTestId('zwo-error')).toHaveCount(0);
    await expect(page.getByTestId('zwo-success')).toContainText('Séance représentative');
    await expect(page.getByTestId('zwo-success')).toContainText('46 min');
    await expect(page.getByText("Aperçu de l'entraînement")).toBeVisible();
  });
});

test.describe('Intervals.icu — séance du jour', () => {
  async function connectedSetup(page, handler) {
    const requests = [];
    await page.addInitScript(() => {
      localStorage.setItem('spinnn_intervals_api_key', 'cle-de-test');
      localStorage.setItem('spinnn_intervals_athlete_id', 'i12345');
    });
    await page.route('https://intervals.icu/api/v1/**', (route) => {
      requests.push(route.request());
      return handler(route, requests.length);
    });
    return requests;
  }

  const json = (body, status = 200) => ({ status, contentType: 'application/json', body: typeof body === 'string' ? body : JSON.stringify(body) });

  test('séance structurée récupérée, séances non importables expliquées', async ({ page }) => {
    const requests = await connectedSetup(page, (route) => route.fulfill(json(eventsFixture())));
    await page.goto('/');

    await expect(page.getByTestId('intervals-workout')).toHaveCount(1);
    await expect(page.getByTestId('intervals-workout')).toContainText('Sweet Spot 2x10');

    // La séance en roue libre est signalée au lieu d'être déformée ou masquée
    await expect(page.getByTestId('intervals-skipped')).toContainText('Sortie roue libre');
    await expect(page.getByTestId('intervals-skipped')).toContainText('roue libre');
    await expect(page.getByTestId('intervals-skipped')).not.toContainText('demain');

    // FTP Intervals.icu (240 W) différente de la FTP Spinnn (200 W par défaut) : prévenu
    await expect(page.getByTestId('intervals-ftp-difference')).toContainText('240 W');

    // Authentification Basic API_KEY:<clé>, sur le jour local
    const request = requests[0];
    expect(request.headers()['authorization']).toBe(`Basic ${Buffer.from('API_KEY:cle-de-test').toString('base64')}`);
    expect(request.url()).toContain('/athlete/i12345/events');
    expect(request.url()).toContain(`oldest=${localDate()}`);
    expect(request.url()).toContain(`newest=${localDate()}`);

    // La sélection affiche l'aperçu
    await page.getByTestId('intervals-workout').click();
    await expect(page.getByText("Aperçu de l'entraînement")).toBeVisible();
  });

  test('structure et cibles de la séance récupérée', async ({ page }) => {
    await connectedSetup(page, (route) => route.fulfill(json(eventsFixture())));
    await page.goto('/');
    await expect(page.getByTestId('intervals-workout')).toHaveCount(1);

    const result = await page.evaluate(async (events) => {
      const { extractDayWorkouts } = await import('/src/utils/intervalsWorkout.js');
      const { getTargetPowerAtTime } = await import('/src/data/sampleWorkouts.js');
      const date = events[0].start_date_local.slice(0, 10);
      const { workouts } = extractDayWorkouts(events, { date, ftp: 250 });
      const [workout] = workouts;
      return {
        duration: workout.duration,
        types: workout.intervals.map((i) => i.type),
        targets: [0, 600, 1200, 1500, 2100, 2999].map((t) => getTargetPowerAtTime(workout, t, 250))
      };
    }, JSON.parse(eventsFixture()));

    // échauffement, 2 x (palier + récupération), retour au calme
    expect(result.duration).toBe(3000);
    expect(result.types).toEqual(['warmup', 'steady', 'recovery', 'steady', 'recovery', 'cooldown']);
    // à FTP 250 W : début échauffement 45 %, palier 90 %, récupération 55 %, palier 90 %,
    // récupération 55 %, fin du retour au calme (65 % vers 40 %) à 40 %
    expect(result.targets).toEqual([113, 225, 138, 225, 138, 100]);
  });

  test('authentification refusée : message clair puis réessai réussi', async ({ page }) => {
    let failing = true;
    await connectedSetup(page, (route) =>
      failing ? route.fulfill(json({ status: 401, error: 'Unauthorized' }, 401)) : route.fulfill(json(eventsFixture()))
    );
    await page.goto('/');

    await expect(page.getByTestId('intervals-error')).toContainText('refuse l’authentification');
    await expect(page.getByTestId('intervals-error')).toContainText('clé API');

    failing = false;
    await page.getByTestId('intervals-error').getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.getByTestId('intervals-error')).toHaveCount(0);
    await expect(page.getByTestId('intervals-workout')).toHaveCount(1);
  });

  test('panne du service (500) et réseau coupé : messages distincts, réessai possible', async ({ page }) => {
    let mode = 'server';
    await connectedSetup(page, (route) => {
      if (mode === 'server') return route.fulfill(json('boom', 503));
      if (mode === 'network') return route.abort('internetdisconnected');
      return route.fulfill(json(eventsFixture()));
    });
    await page.goto('/');
    const error = page.getByTestId('intervals-error');
    const retry = error.getByRole('button', { name: 'Réessayer' });

    await expect(error).toContainText('rencontre un problème (erreur 503)');

    mode = 'network';
    await retry.click();
    await expect(error).toContainText('Impossible de joindre Intervals.icu');
    await expect(error).toContainText('connexion internet');
    // Pas de texte technique de l'exception
    await expect(error).not.toContainText('Failed to fetch');

    mode = 'ok';
    await retry.click();
    await expect(page.getByTestId('intervals-workout')).toHaveCount(1);
  });

  test('réponse illisible : message dédié', async ({ page }) => {
    await connectedSetup(page, (route) => route.fulfill(json('<html>pas du json</html>')));
    await page.goto('/');
    await expect(page.getByTestId('intervals-error')).toContainText('illisible ou inattendue');
  });

  test('aucune séance aujourd’hui : message dédié, distinct d’une erreur', async ({ page }) => {
    await connectedSetup(page, (route) => route.fulfill(json([])));
    await page.goto('/');

    await expect(page.getByTestId('intervals-empty')).toContainText("Pas d'entraînement aujourd'hui");
    await expect(page.getByTestId('intervals-error')).toHaveCount(0);
  });

  test('séance du jour sans étapes structurées : signalée, pas confondue avec « aucune séance »', async ({ page }) => {
    const events = [{ id: 1, category: 'WORKOUT', type: 'Ride', name: 'Sortie libre', start_date_local: `${localDate()}T00:00:00` }];
    await connectedSetup(page, (route) => route.fulfill(json(events)));
    await page.goto('/');

    await expect(page.getByTestId('intervals-skipped')).toContainText('Sortie libre');
    await expect(page.getByTestId('intervals-skipped')).toContainText('aucune étape structurée');
  });

  test('la date interrogée est le jour local, pas le jour UTC (après minuit à Paris)', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'fr-FR', timezoneId: 'Europe/Paris' });
    const page = await context.newPage();
    // 20 octobre 2026, 00 h 30 à Paris = 19 octobre, 22 h 30 UTC
    await page.clock.setFixedTime(new Date('2026-10-19T22:30:00Z'));
    const requests = await connectedSetup(page, (route) => route.fulfill(json([])));
    await page.goto('/');
    await expect(page.getByTestId('intervals-empty')).toBeVisible();

    expect(requests[0].url()).toContain('oldest=2026-10-20');
    expect(requests[0].url()).toContain('newest=2026-10-20');
    await context.close();
  });

  test('réglages : identifiants refusés ou réseau coupé ne perdent ni la saisie ni la connexion existante', async ({ page }) => {
    const calls = [];
    await page.route('https://intervals.icu/api/v1/**', (route) => {
      calls.push(route.request().headers()['authorization']);
      const attempt = calls.length;
      if (attempt === 1) return route.fulfill(json({ status: 401 }, 401));
      if (attempt === 2) return route.abort('internetdisconnected');
      return route.fulfill(json([]));
    });
    await page.goto('/settings');

    const section = page.locator('#intervals-icu');
    const key = section.locator('input[type="password"]');
    const athlete = section.locator('input[type="text"]');
    const testButton = section.getByRole('button', { name: 'Tester et connecter' });

    await key.fill('  mauvaise-cle  ');
    await athlete.fill('i999');
    await testButton.click();
    await expect(section).toContainText('refuse l’authentification');
    await expect(key).toHaveValue('  mauvaise-cle  ');
    await expect(athlete).toHaveValue('i999');
    expect(await page.evaluate(() => localStorage.getItem('spinnn_intervals_api_key'))).toBeNull();

    // Réseau coupé : même saisie conservée, message de réseau
    await testButton.click();
    await expect(section).toContainText('Impossible de joindre Intervals.icu');
    await expect(key).toHaveValue('  mauvaise-cle  ');

    // Réessai réussi : identifiants nettoyés (espaces) puis enregistrés
    await testButton.click();
    await expect(section).toContainText('Connecté à Intervals.icu');
    expect(await page.evaluate(() => localStorage.getItem('spinnn_intervals_api_key'))).toBe('mauvaise-cle');
    expect(await page.evaluate(() => localStorage.getItem('spinnn_intervals_athlete_id'))).toBe('i999');
    expect(calls[2]).toBe(`Basic ${Buffer.from('API_KEY:mauvaise-cle').toString('base64')}`);
  });
});

test.describe('FTP', () => {
  const ftpInput = (page) => page.getByTestId('ftp-input');
  const stored = (page) => page.evaluate((key) => localStorage.getItem(key), FTP_KEY);

  test('valeur par défaut, puis FTP conservée après rechargement', async ({ page }) => {
    await page.goto('/settings');
    await expect(ftpInput(page)).toHaveValue('200');

    await ftpInput(page).fill('265');
    await page.getByTestId('ftp-save').click();
    await expect(page.getByTestId('ftp-confirmation')).toContainText('FTP enregistrée : 265 W');
    expect(await stored(page)).toBe('265');

    await page.reload();
    await expect(ftpInput(page)).toHaveValue('265');
    await expect(page.getByTestId('ftp-current')).toContainText('265W');

    // Elle est aussi active dans l'état global après rechargement
    const ftp = await page.evaluate(async () => (await import('/src/composables/useAppState.js')).useAppState().ftp.value);
    expect(ftp).toBe(265);
  });

  test('une saisie validée par Entrée ou en quittant le champ est enregistrée sans clic sur Enregistrer', async ({ page }) => {
    await page.goto('/settings');

    await ftpInput(page).fill('250');
    await ftpInput(page).blur();
    expect(await stored(page)).toBe('250');

    await ftpInput(page).fill('275');
    await ftpInput(page).press('Enter');
    expect(await stored(page)).toBe('275');

    await page.goto('/');
    await page.goto('/settings');
    await expect(ftpInput(page)).toHaveValue('275');
  });

  test('valeurs invalides refusées avec explication, sans toucher à la FTP enregistrée', async ({ page }) => {
    await page.goto('/settings');
    await ftpInput(page).fill('240');
    await ftpInput(page).blur();
    expect(await stored(page)).toBe('240');

    for (const bad of ['', '0', '-100', '20', '900']) {
      await ftpInput(page).fill(bad);
      await page.getByTestId('ftp-save').click();
      await expect(page.getByTestId('ftp-error')).toContainText('compris entre 50 et 600');
      expect(await stored(page)).toBe('240');
    }

    await ftpInput(page).fill('260');
    await page.getByTestId('ftp-save').click();
    await expect(page.getByTestId('ftp-error')).toHaveCount(0);
    expect(await stored(page)).toBe('260');
  });

  test('un décimal est arrondi aux watts entiers, partout pareil', async ({ page }) => {
    await page.goto('/settings');
    await ftpInput(page).fill('250.6');
    await page.getByTestId('ftp-save').click();

    await expect(ftpInput(page)).toHaveValue('251');
    expect(await stored(page)).toBe('251');
    await page.reload();
    await expect(ftpInput(page)).toHaveValue('251');
  });

  test('une valeur enregistrée corrompue retombe sur la FTP par défaut', async ({ page }) => {
    await page.addInitScript((key) => localStorage.setItem(key, 'abc'), FTP_KEY);
    await page.goto('/settings');
    await expect(ftpInput(page)).toHaveValue('200');
  });

  test('les cibles de la séance suivent la FTP enregistrée', async ({ page }) => {
    await page.goto('/settings');
    await ftpInput(page).fill('300');
    await page.getByTestId('ftp-save').click();

    await page.goto('/');
    await page.getByTestId('zwo-input').setInputFiles(fixture('zwo/representative.zwo'));
    await expect(page.getByTestId('zwo-success')).toBeVisible();

    const targets = await page.evaluate(async () => {
      const { useAppState } = await import('/src/composables/useAppState.js');
      const { getTargetPowerAtTime } = await import('/src/data/sampleWorkouts.js');
      const app = useAppState();
      const workout = app.selectedWorkout.value;
      return { ftp: app.ftp.value, first: getTargetPowerAtTime(workout, 0, app.ftp.value), work: getTargetPowerAtTime(workout, 900, app.ftp.value) };
    });

    expect(targets).toEqual({ ftp: 300, first: 120, work: 315 });
  });
});
