import { test, expect } from '@playwright/test';

// The UI language follows the browser locale; Playwright defaults to en-US.
const ZWO_VALID = `<workout_file>
  <name>E2E Intervals</name>
  <workout>
    <Warmup Duration="60" PowerLow="0.5" PowerHigh="0.7"/>
    <IntervalsT Repeat="3" OnDuration="60" OffDuration="60" OnPower="1.1" OffPower="0.5"/>
    <Cooldown Duration="120" PowerLow="0.7" PowerHigh="0.4"/>
  </workout>
</workout_file>`;

const ZWO_INVALID = `<workout_file>
  <name>Broken</name>
  <workout>
    <SteadyState Duration="60" Power="0.6"/>
    <UnknownBlock Duration="60"/>
  </workout>
</workout_file>`;

async function startSimulationWorkout(page) {
  await page.goto('/');
  // The Endurance category is expanded by default.
  await page.getByRole('button', { name: 'Easy Ride' }).click();
  await page.getByTestId('simulation').click();
  await expect(page.getByTestId('start-workout')).toBeEnabled();
  await page.getByTestId('start-workout').click();
  await expect(page).toHaveURL(/\/workout/);
}

test.describe('Spinnn smoke tests', () => {
  test('setup → workout → summary with history archive', async ({ page }) => {
    await startSimulationWorkout(page);

    await expect(page.getByTestId('workout-chart')).toBeVisible();
    // Mock power resumes the session automatically: the elapsed clock runs.
    await expect
      .poll(() => page.getByTestId('elapsed').innerText(), { timeout: 10_000 })
      .not.toBe('0:00');

    // Finish the workout and land on the summary.
    await page.getByTestId('stop').click();
    await page.getByTestId('confirm-stop').click();
    await expect(page).toHaveURL(/\/summary\/.+/);
    await expect(page.getByText('TSS')).toBeVisible();

    // The finished workout is kept in local history.
    await page.getByRole('navigation').getByRole('button', { name: 'History' }).click();
    await expect(page).toHaveURL(/\/history/);
    const entry = page.getByRole('article').filter({ hasText: 'Easy Ride' });
    await expect(entry).toBeVisible();
    await entry.getByRole('button', { name: 'View summary' }).click();
    await expect(page).toHaveURL(/\/summary\/.+/);
    await expect(page.getByText('TSS')).toBeVisible();
  });

  test('leaving the workout page does not stop recording, reload recovers the session', async ({ page }) => {
    await startSimulationWorkout(page);
    await expect
      .poll(() => page.getByTestId('elapsed').innerText(), { timeout: 10_000 })
      .not.toBe('0:00');

    // Navigate to settings mid-workout: the engine keeps recording.
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page).toHaveURL(/\/settings/);
    await page.getByRole('button', { name: 'Return to workout' }).click();
    await expect(page).toHaveURL(/\/workout/);

    // Reload mid-workout: the session is restored and keeps running.
    const before = await page.getByTestId('elapsed').innerText();
    await page.reload();
    await expect(page).toHaveURL(/\/workout/);
    await expect
      .poll(() => page.getByTestId('elapsed').innerText(), { timeout: 10_000 })
      .not.toBe(before);

    await page.getByTestId('stop').click();
    await page.getByTestId('confirm-stop').click();
    await expect(page).toHaveURL(/\/summary\/.+/);
  });

  test('ZWO import: repeat blocks are expanded, invalid files are rejected', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('simulation').click();

    await page.locator('#zwo-file').setInputFiles({
      name: 'e2e.zwo',
      mimeType: 'application/xml',
      buffer: Buffer.from(ZWO_VALID),
    });
    // 60s warmup + 3×(60s on/60s off) + 120s cooldown = 720s total.
    await expect(page.getByText('E2E Intervals').first()).toBeVisible();
    await expect(page.getByTestId('start-workout')).toBeEnabled();

    // A file containing an unsupported block is refused with a visible error.
    await page.locator('#zwo-file').setInputFiles({
      name: 'broken.zwo',
      mimeType: 'application/xml',
      buffer: Buffer.from(ZWO_INVALID),
    });
    await expect(page.getByRole('alert').filter({ hasText: /ZWO/i })).toBeVisible();
  });

  test('FTP setting persists', async ({ page }) => {
    await page.goto('/settings');
    const ftpInput = page.locator('#ftp input[type="number"]');
    await ftpInput.fill('250');
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await page.goto('/');
    await page.goto('/settings');
    await expect(ftpInput).toHaveValue('250');
  });
});
