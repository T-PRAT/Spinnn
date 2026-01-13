# Spinnn Test Suite

This directory contains the complete test suite for the Spinnn cycling workout application.

## Test Structure

```
tests/
├── setup.js                    # Global test configuration and mocks
├── unit/                       # Unit tests with Vitest
│   ├── useWorkoutSession.test.js
│   └── bluetoothParser.test.js
├── e2e/                        # End-to-end tests with Playwright
│   └── workoutFlow.spec.js
└── README.md                   # This file
```

---

## Quick Start

### Install Dependencies

```bash
bun install
```

### Run Unit Tests

```bash
# Watch mode (recommended during development)
bun test

# Run once
bun test:run

# With UI
bun test:ui

# With coverage report
bun test:coverage
```

### Run E2E Tests

```bash
# Run all E2E tests
bun test:e2e

# With UI mode
bun test:e2e:ui

# Debug mode
bun test:e2e:debug
```

---

## Test Coverage

### Unit Tests (Vitest)

- **`useWorkoutSession.test.js`** - Core workout session state machine
  - Start, pause, resume, stop workflow
  - Timer management and elapsed time tracking
  - Data point recording (power, HR, cadence, speed)
  - Session calculations (averages, maximums, energy)
  - Interval tracking (nested repeats, current interval detection)
  - Session persistence (auto-save, restore, expiration)

- **`bluetoothParser.test.js`** - BLE GATT data parsing
  - Heart rate measurement parsing (8-bit and 16-bit)
  - Sensor contact detection
  - Cycling power measurement parsing
  - Crank and wheel revolution calculations
  - Cadence calculation with time rollover handling
  - Speed calculation with custom wheel circumference
  - Edge cases (16-bit rollover, division by zero, missing flags)

### E2E Tests (Playwright)

- **`workoutFlow.spec.js`** - Complete user journey testing
  - Workout selection and navigation
  - Device connection (mock mode)
  - Workout execution with real-time metrics
  - Pause/resume functionality
  - Workout completion and summary
  - Session persistence across page refresh
  - Settings configuration (FTP)
  - Responsive design (mobile viewport)
  - Workout chart rendering
  - Error handling (invalid file import)

---

## Running Specific Tests

### Run a Single Test File

```bash
# Unit test
bun test useWorkoutSession

# E2E test
bun test:e2e workoutFlow
```

### Run Tests Matching a Pattern

```bash
# Unit tests
bun test -- bluetooth

# E2E tests
bun test:e2e --grep "workflow"
```

### Run Tests in Watch Mode

```bash
bun test --watch
```

---

## Test Configuration

### Vitest Configuration

Located in `vitest.config.js`:
- Test environment: Happy DOM
- Coverage with v8
- Global test utilities
- Path aliases (`@/` → `./src/`)

### Playwright Configuration

Located in `playwright.config.js`:
- Base URL: `http://localhost:5173`
- Automatic dev server startup
- Chromium browser (default)
- HTML reporter with traces/screenshots on failure

---

## Global Test Utilities

The `tests/setup.js` file provides:

- **Web Bluetooth API Mock** - Mocks `navigator.bluetooth` for unit tests
- **LocalStorage Mock** - In-memory localStorage implementation
- **Request Animation Frame Mock** - For D3.js animations
- **Performance.now Mock** - For consistent timing tests
- **`advanceTime(ms)`** - Helper to advance mock time

---

## Writing New Tests

### Unit Test Example

```javascript
import { describe, it, expect } from 'vitest'
import { myComposable } from '@/composables/myComposable.js'

describe('myComposable', () => {
  it('should do something', () => {
    const result = myComposable()
    expect(result).toBe('expected value')
  })
})
```

### E2E Test Example

```javascript
import { test, expect } from '@playwright/test'

test('my e2e test', async ({ page }) => {
  await page.goto('/')

  await page.click('text=/button text/i')
  await expect(page.locator('[data-testid="result"]')).toBeVisible()
})
```

---

## Test Data and Fixtures

### Mock Workout Data

Located in `tests/fixtures/mockWorkout.js` (create as needed):

```javascript
export const mockWorkout = {
  name: 'Test Workout',
  duration: 300,
  intervals: [
    { type: 'warmup', duration: 60, power: 100 },
    { type: 'steady', duration: 120, power: 200 }
  ]
}
```

---

## Troubleshooting

### Tests Fail with "Cannot find module"

Ensure you've installed dependencies:
```bash
bun install
```

### E2E Tests Fail with "Server not running"

The tests automatically start the dev server. If it's already running:
```bash
# Kill existing process or let tests reuse it
export CI=true  # Force tests to start their own server
bun test:e2e
```

### Port Already in Use (5173)

Change the port in `playwright.config.js`:
```javascript
use: {
  baseURL: 'http://localhost:3000',
},
webServer: {
  url: 'http://localhost:3000',
}
```

### Tests Timing Out

Increase timeout in `playwright.config.js`:
```javascript
webServer: {
  timeout: 180 * 1000,  // 3 minutes
}
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test:run
      - run: bun test:e2e
```

---

## Coverage Goals

- **Composables**: 80%+ coverage
- **Utilities**: 90%+ coverage
- **Components**: 60%+ coverage
- **E2E**: All critical user paths

---

## Next Steps

1. ✅ Unit tests for `useWorkoutSession` - **COMPLETE**
2. ✅ Unit tests for `bluetoothParser` - **COMPLETE**
3. ✅ E2E tests for workout flow - **COMPLETE**
4. ⏳ Unit tests for remaining composables
5. ⏳ Component tests for complex UI components
6. ⏳ Visual regression tests for charts

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Plan](../docs/TEST_PLAN.md) - Detailed testing strategy
