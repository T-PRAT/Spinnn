import { test, expect } from '@playwright/test';

test.describe('Spinnn Smoke Tests', () => {
  test('navigation flow - Setup → Workout → Summary', async ({ page }) => {
    // 1. Setup page loads
    await page.goto('/');
    await expect(page.locator('h1, h2').filter({ hasText: /setup|spinnn/i }).first()).toBeVisible();

    // 2. Select a built-in workout
    await page.click('button:has-text("Exemple")');
    await expect(page.locator('text=Power')).toBeVisible();

    // 3. Verify "Commencer" button is disabled without device
    const startButton = page.locator('button:has-text("Commencer")');
    await expect(startButton).toBeDisabled();

    // 4. Enable mock mode
    await page.click('button:has-text("Mock")');
    await expect(startButton).toBeEnabled();

    // 5. Start workout
    await startButton.click();
    await expect(page).toHaveURL(/\/workout/);

    // 6. Verify we're in workout mode (sidebar hidden)
    await expect(page.locator('[data-testid="workout-chart"]')).toBeVisible();

    // 7. Wait a few seconds for data
    await page.waitForTimeout(3000);

    // 8. Finish workout
    await page.click('button:has-text("Terminer")');
    await expect(page).toHaveURL(/\/summary/);

    // 9. Verify stats are displayed
    await expect(page.locator('text=Normalisé')).toBeVisible();
    await expect(page.locator('text=Moyenne')).toBeVisible();
  });

  test('Settings - FTP configuration', async ({ page }) => {
    await page.goto('/settings');

    // Verify FTP field
    const ftpInput = page.locator('input[type="number"]').first();
    await ftpInput.fill('250');
    await ftpInput.blur();

    // Navigate away and back to verify persistence
    await page.goto('/');
    await page.goto('/settings');

    await expect(ftpInput).toHaveValue('250');
  });

  test('Mock Mode - Simulation without devices', async ({ page }) => {
    await page.goto('/');

    // Verify mock mode is available
    const mockButton = page.locator('button:has-text("Mock")');
    await expect(mockButton).toBeVisible();

    // Enable mock mode
    await mockButton.click();
    await expect(mockButton).toHaveClass(/active/);

    // Verify we can start a workout
    const startButton = page.locator('button:has-text("Commencer")');
    await expect(startButton).toBeEnabled();
  });
});
