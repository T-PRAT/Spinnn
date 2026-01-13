# Spinnn Testing Plan

## Overview

This document outlines the comprehensive testing strategy for the Spinnn cycling workout application. The plan prioritizes critical business logic, high-risk areas, and user-facing features.

---

## Priority Levels

- 🔴 **Priority 1** - Core Workout Logic (Critical)
- 🟠 **Priority 2** - Data Parsing (High Risk)
- 🟡 **Priority 3** - State Persistence (Data Loss Risk)
- 🟢 **Priority 4** - External Integration
- 🔵 **Priority 5** - Integration Tests

---

## 🔴 Priority 1 - Core Workout Logic (Critical)

### 1. Workout Session State Machine (`useWorkoutSession.js`)

**Why This Matters**: This is the heart of your app - if timing/recording fails, the workout is useless.

**Test Cases**:
- [ ] Start workout → recording starts, timer increments
- [ ] Pause → data recording stops, timer freezes
- [ ] Resume → recording continues, elapsed time correct
- [ ] Complete → all intervals processed, summary generated
- [ ] Data points recorded at ~1Hz frequency
- [ ] Workout completion detection after last interval
- [ ] Calculate correct interval averages (power, HR, cadence)
- [ ] Handle device disconnection during workout
- [ ] Track current interval index correctly
- [ ] Calculate total workout duration accurately

**Test File**: `tests/unit/useWorkoutSession.test.js`

---

### 2. Distance & Energy Calculations

**Why This Matters**: Users rely on these metrics for training progress.

**Test Cases**:
- [ ] Distance from wheel revolutions (CSC service)
- [ ] Kilojoules from power × time
- [ ] Kcal from kilojoules (human efficiency factor ~23.9%)
- [ ] Cumulative totals across intervals
- [ ] Zero division handling (no data yet)
- [ ] Unit conversions (watts → kJ, kJ → kcal)

**Test File**: `tests/unit/calculations.test.js`

---

## 🟠 Priority 2 - Data Parsing (High Risk)

### 3. Bluetooth Data Parser (`bluetoothParser.js`)

**Why This Matters**: Hardware data varies by manufacturer - bugs = wrong metrics.

**Test Cases**:
- [ ] Heart rate measurement with contact detection supported
- [ ] Heart rate measurement without contact detection
- [ ] Heart rate with 16-bit value
- [ ] Cycling power with cumulative wheel revolutions
- [ ] Cycling power with cumulative crank revolutions
- [ ] Cadence calculation (Δrevolutions / Δtime)
- [ ] Speed calculation (wheel circumference × Δrevolutions / Δtime)
- [ ] Handle 16-bit value rollover (max 65535)
- [ ] Handle missing flags gracefully
- [ ] Handle different data formats from various manufacturers
- [ ] Edge case: zero time difference (avoid division by zero)

**Test File**: `tests/unit/bluetoothParser.test.js`

---

### 4. ZWO Workout Parsing

**Why This Matters**: Complex XML structure with nested repeats - high error risk.

**Test Cases**:
- [ ] Parse valid ZWO file → workout object
- [ ] Handle simple interval structure
- [ ] Handle nested `<repeat>` blocks
- [ ] Convert FTP percentages to absolute watts
- [ ] Ramp interval power calculation (start/end power linear interpolation)
- [ ] Steady state interval parsing
- [ ] Warmup/Cooldown intervals
- [ ] Invalid/malformed ZWO files → graceful error
- [ ] Missing required XML tags
- [ ] Empty workout file
- [ ] Handle special characters in workout name/description

**Test File**: `tests/unit/zwoParser.test.js`

---

## 🟡 Priority 3 - State Persistence (Data Loss Risk)

### 5. Session Auto-Save (`useWorkoutSession.js`)

**Why This Matters**: Browser crash = lost workout data → frustrated user.

**Test Cases**:
- [ ] Auto-save triggers every X seconds during workout
- [ ] Save contains all current state (timing, data points, current interval)
- [ ] Restore session after page refresh
- [ ] Restore continues from correct elapsed time
- [ ] Restore includes all recorded data points
- [ ] Clear saved session after completion
- [ ] Expire old sessions (>24 hours)
- [ ] Handle corrupted saved data
- [ ] Multiple sessions don't overwrite each other
- [ ] Auto-save doesn't trigger when workout is paused

**Test File**: `tests/unit/sessionPersistence.test.js`

---

### 6. LocalStorage Integration (`useAppState.js`)

**Why This Matters**: User settings (FTP, zones) must persist.

**Test Cases**:
- [ ] Save FTP value to localStorage
- [ ] Load FTP value from localStorage
- [ ] Save power zones (Z1-Z6)
- [ ] Load power zones from localStorage
- [ ] Handle missing/empty localStorage (use defaults)
- [ ] Handle corrupted data (fallback to defaults)
- [ ] Multiple apps don't conflict (spinnn_ prefix)
- [ ] Theme preference persistence
- [ ] Intervals.icu API key persistence

**Test File**: `tests/unit/localStorage.test.js`

---

## 🟢 Priority 4 - External Integration

### 7. Intervals.icu API (`useIntervalsIcu.js`)

**Why This Matters**: Users expect sync to work reliably.

**Test Cases**:
- [ ] Successful API call → workout parsed
- [ ] Handle 401 authentication errors
- [ ] Handle 404 not found (no workout today)
- [ ] Handle network timeout
- [ ] Handle network failure (no connection)
- [ ] Parse nested repeat blocks from Intervals.icu format
- [ ] Handle empty workout list
- [ ] Convert Intervals.icu format to Spinnn format
- [ ] API key validation
- [ ] Rate limiting handling

**Test File**: `tests/unit/intervalsIcu.test.js`

---

### 8. Mock Device Generator (`useMockDevices.js`)

**Why This Matters**: Enables testing without hardware - must be realistic.

**Test Cases**:
- [ ] Power follows workout target with inertia
- [ ] Heart rate lags behind power (physiological accuracy)
- [ ] Natural variation in power (±2%)
- [ ] Natural variation in HR (±4%)
- [ ] Cadence stays within realistic range (60-120 rpm)
- [ ] Speed matches power/cadence
- [ ] Warmup effects (lower HR initially)
- [ ] Fatigue effects over long sessions
- [ ] Ramp interval gradual transitions
- [ ] Rest interval power drop

**Test File**: `tests/unit/mockDevices.test.js`

---

## 🔵 Priority 5 - Integration Tests

### 9. End-to-End Workout Flow

**Why This Matters**: Validates the entire user journey and catches integration issues.

**Test Cases**:
- [ ] Select workout → connect device → start → finish → view summary
- [ ] Device disconnect mid-workout → auto-reconnect → data continues
- [ ] Browser refresh during workout → state restored → continue
- [ ] Power zone settings affect workout targets
- [ ] Pause/resume multiple times during workout
- [ ] Complete workout with mock devices
- [ ] Complete workout with real BLE devices (if available)
- [ ] Charts update in real-time during workout
- [ ] Summary shows accurate totals
- [ ] History saves completed workout

**Test File**: `tests/e2e/workoutFlow.spec.js`

---

## Top 3 Recommendations (Implementation Priority)

If you have limited time, start with these three:

### 1. ✅ `useWorkoutSession.js` Unit Tests
**Priority**: 🔴 Critical
**Impact**: Highest - core workout logic
**Risk**: High - bugs break entire workout experience
**File**: `tests/unit/useWorkoutSession.test.js`

### 2. ✅ `bluetoothParser.js` Unit Tests
**Priority**: 🟠 High Risk
**Impact**: High - affects all device data
**Risk**: High - complex parsing, many edge cases
**File**: `tests/unit/bluetoothParser.test.js`

### 3. ✅ E2E Workout Flow Tests
**Priority**: 🔵 Integration
**Impact**: High - validates entire user journey
**Risk**: Medium - catches integration issues unit tests miss
**File**: `tests/e2e/workoutFlow.spec.js`

---

## Testing Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Unit** | [Vitest](https://vitest.dev/) | Test composables & utilities (fast, HMR-enabled) |
| **Component** | Vitest + [@vue/test-utils](https://test-utils.vuejs.org/) | Test Vue components in isolation |
| **E2E** | [Playwright](https://playwright.dev/) | Test full user flows (device connection, workout completion) |
| **Mocking** | [MSW](https://mswjs.io/) | Mock Intervals.icu API, BLE API |

---

## Test Coverage Goals

- **Composables**: 80%+ coverage
- **Utilities**: 90%+ coverage (critical parsing logic)
- **Components**: 60%+ coverage (focus on complex components)
- **E2E**: All critical user paths covered

---

## Next Steps

1. ✅ Set up Vitest configuration
2. ✅ Create test file structure
3. ✅ Write first batch of tests (Top 3 priorities)
4. ✅ Configure CI/CD to run tests automatically
5. ✅ Add coverage reporting

---

## Notes

- All tests should be independent and can run in parallel
- Mock all external dependencies (BLE API, Intervals.icu API, localStorage)
- Use fake timers for time-dependent tests
- Clean up mocks and state after each test
- Tests should be fast (unit tests < 5ms each)
