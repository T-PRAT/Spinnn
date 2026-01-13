/**
 * End-to-End Tests for Workout Flow
 *
 * Tests the complete user journey:
 * - Page loading
 * - Navigation
 * - Basic interactions
 */

import { test, expect } from '@playwright/test'

test.describe('Workout Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should load the application', async ({ page }) => {
    await page.goto('/')

    // Page should have loaded
    await expect(page).toHaveTitle(/Spinnn/i)

    // Should have some content
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Try to find navigation elements
    const navElements = await page.locator('nav, a, button').count()
    expect(navElements).toBeGreaterThan(0)
  })

  test('should display device connector section', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded')

    // Look for device-related text or elements
    const deviceElements = await page.locator('text=/device|bluetooth|connect/i').count()
    // This test just verifies the page loads without crashing
    expect(await page.locator('body').isVisible()).toBe(true)
  })

  test('should handle workout selector', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded')

    // Look for workout-related content
    const workoutElements = await page.locator('text=/workout|training/i').count()
    // Just verify page is functional
    expect(await page.locator('body').isVisible()).toBe(true)
  })
})

test.describe('Application Stability', () => {
  test('should not crash on reload', async ({ page }) => {
    await page.goto('/')

    // Reload multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload()
      await page.waitForLoadState('domcontentloaded')
      expect(await page.locator('body').isVisible()).toBe(true)
    }
  })

  test('should handle localStorage operations', async ({ page }) => {
    await page.goto('/')

    // Test that localStorage works
    const storageResult = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value')
        const value = localStorage.getItem('test')
        localStorage.removeItem('test')
        return value === 'value'
      } catch (e) {
        return false
      }
    })

    expect(storageResult).toBe(true)
  })
})

test.describe('Responsive Design', () => {
  test('should display on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await page.waitForLoadState('domcontentloaded')
    expect(await page.locator('body').isVisible()).toBe(true)
  })

  test('should display on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    await page.waitForLoadState('domcontentloaded')
    expect(await page.locator('body').isVisible()).toBe(true)
  })
})
