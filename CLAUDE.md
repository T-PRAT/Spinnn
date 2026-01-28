# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Spinnn** is a Vue 3 web application for managing and executing cycling workouts with real-time monitoring via Bluetooth fitness devices. It integrates with Intervals.icu for workout synchronization and provides live power, heart rate, and cadence tracking during training sessions.

## Development Commands

### Package Management
```bash
bun install          # Install dependencies (primary package manager)
npm install          # Alternative if bun is not available
```

### Development
```bash
bun dev              # Start Vite dev server with HMR at http://localhost:5173
```

### E2E Testing (Smoke Tests)
```bash
bun test:e2e         # Run Playwright smoke tests
bun test:e2e:ui      # Run Playwright tests with UI
bun test:e2e:debug   # Run Playwright tests in debug mode
```

### Build
```bash
bun run build        # Production build to /dist directory
bun run preview      # Preview production build locally
```

### Node Version Requirements
- Requires Node.js `^20.19.0` or `>=22.12.0`

## Architecture Overview

### Technology Stack
- **Framework:** Vue 3.5.26 with Composition API
- **Build Tool:** Vite 7.3.0
- **Routing:** Vue Router 4
- **Styling:** Tailwind CSS 4.1.18 with custom theme system
- **Data Visualization:** D3.js 7.9.0
- **Hardware Integration:** Web Bluetooth API + Garmin FIT SDK 21.178.0
- **State Management:** Singleton composables (no Vuex/Pinia)
- **E2E Testing:** Playwright 1.50.1 (smoke tests only)

### State Management Pattern

This application uses **singleton composables** for state management instead of Vuex or Pinia. Each composable maintains module-level reactive state that is shared across all component instances.

**Key Composables:**

- `useAppState()` - Global application state and workflow orchestration
  - Manages current step (1: Setup, 2: Workout, 3: Summary)
  - Stores selected workout, FTP, and power zones
  - Persists FTP and zones to localStorage with `spinnn_` prefix
  - Validates workout readiness via `canStartWorkout` computed property

- `useWorkoutSession()` - Active workout execution state
  - Tracks timing, elapsed duration, and completion status
  - Records data points (power, HR, cadence, speed) every second
  - Manages pause/resume functionality with automatic persistence
  - Calculates normalized power (NP) and energy expenditure (kJ)
  - Auto-saves session every 10 data points to localStorage

- `useBluetoothHRM()` - Heart rate monitor BLE connectivity
  - Implements Web Bluetooth API wrapper for HR devices
  - Parses GATT Heart Rate Measurement characteristics (UUID 0x180D)
  - Auto-reconnect with exponential backoff

- `useBluetoothTrainer()` - Smart trainer BLE connectivity
  - Implements Cycling Power Service (UUID 0x1818)
  - Implements Cycling Speed and Cadence Service (UUID 0x1816)
  - Implements Fitness Machine Service (FTMS - UUID 0x1826)
  - Supports ERG mode, simulation mode, and resistance control
  - Extracts power, cadence, and speed from BLE measurements
  - Auto-reconnect with exponential backoff

- `useIntervalsIcu()` - Third-party API integration
  - Authenticates with Intervals.icu API
  - Fetches and parses today's planned workout from Intervals.icu (including nested repeat blocks)

- `useMockDevices()` - Simulated device data
  - Generates mock power, HR, cadence, and speed data
  - Essential for development without BLE hardware

- `useAudioSettings()` - Audio cue configuration
  - Manages audio preferences for workout announcements

- `useTheme()` - Dark/light theme management
  - Persists theme preference to localStorage
  - Uses CSS variables and OKLch color space

### Application Flow

1. **Setup View** (`/`) - Step 1
   - Select workout (built-in samples, .ZWO import, or fetch today's workout from Intervals.icu)
   - Connect Bluetooth devices or enable mock mode
   - Configure FTP and power zones in Settings
   - Preview workout structure and intensity profile

2. **Workout View** (`/workout`) - Step 2
   - Execute workout with real-time monitoring
   - Display live charts for power, HR, cadence, speed
   - Record session data every second
   - Support pause/resume with automatic session recovery
   - Sidebar collapses during workout for focus mode

3. **Summary View** (`/summary`) - Step 3
   - Review completed workout statistics
   - View normalized power, average/max values, energy expenditure
   - Export session as FIT file for upload to training platforms
   - Visualize session data and zone distribution

4. **Settings View** (`/settings`)
   - Configure FTP (Functional Threshold Power)
   - Customize power zones (Z1-Z7)
   - Set Intervals.icu API credentials

5. **History View** (`/history`)
   - View past workout sessions (placeholder - coming soon)

### Directory Structure

```
src/
├── main.js                      # Entry point - creates Vue app
├── App.vue                      # Root component with routing and theme
├── router/index.js              # Route definitions (5 routes)
├── style.css                    # Global styles with Tailwind + CSS variables
├── composables/                 # Singleton state management
│   ├── useAppState.js           # Global app state
│   ├── useWorkoutSession.js     # Workout execution & persistence
│   ├── useBluetoothHRM.js       # HR monitor connectivity
│   ├── useBluetoothTrainer.js   # Smart trainer connectivity
│   ├── useIntervalsIcu.js       # API integration
│   ├── useMockDevices.js        # Simulated device data
│   ├── useAudioSettings.js      # Audio cue configuration
│   └── useTheme.js              # Theme management
├── components/                  # Reusable Vue components
│   ├── layout/
│   │   ├── Sidebar.vue          # Responsive navigation (collapses during workout)
│   │   └── StepIndicator.vue    # Progress indicator (legacy)
│   ├── device/
│   │   └── DeviceConnector.vue  # BLE device management UI
│   ├── workout/
│   │   ├── WorkoutSelector.vue  # Workout selection UI
│   │   ├── WorkoutPreviewChart.vue # D3 workout preview
│   │   └── WorkoutChart.vue     # Main workout execution chart
│   ├── charts/
│   │   ├── PowerChart.vue       # Power visualization
│   │   └── HeartRateChart.vue   # HR visualization
│   └── settings/
│       └── IntervalsSettings.vue # API configuration UI
├── views/                       # Page-level components
│   ├── SetupView.vue            # Setup/landing page
│   ├── WorkoutView.vue          # Active workout page
│   ├── SummaryView.vue          # Workout completion summary
│   ├── SettingsView.vue         # Settings page
│   └── HistoryView.vue          # Workout history (placeholder)
├── utils/
│   ├── bluetoothParser.js       # BLE GATT data parsing utilities
│   ├── web-ble.js               # Web Bluetooth filters
│   ├── EventDispatcher.js       # Event system for pub/sub
│   ├── Connectable.js           # Bluetooth connection wrapper
│   └── fitExporter.js           # FIT file export for Garmin/Strava
└── data/
    └── sampleWorkouts.js        # Built-in workout templates
```

### Import Path Aliases

The codebase uses `@/` as an alias for `./src/` (configured in vite.config.js and jsconfig.json).

Example:
```javascript
import { useAppState } from '@/composables/useAppState';
```

## Key Implementation Details

### Bluetooth Device Integration

- Uses **Web Bluetooth API** for real-time device connectivity
- Requires HTTPS or localhost (browser security requirement)
- BLE GATT services:
  - Heart Rate Service: UUID 0x180D
  - Cycling Power Service: UUID 0x1818
  - Cycling Speed and Cadence: UUID 0x1816
  - Fitness Machine Service (FTMS): UUID 0x1826
- Data parsing handled in `src/utils/bluetoothParser.js`
- Mock mode available via `useMockDevices()` for development without hardware
- Auto-reconnect with exponential backoff strategy

### FTMS (Fitness Machine Service) Support

The app supports advanced trainer control via FTMS:
- **ERG Mode:** Trainer automatically adjusts resistance to match target power
- **Simulation Mode:** Simulates riding on a virtual course with grade/wind resistance
- **Resistance Mode:** Direct resistance level control

### Session Persistence

- Active workouts are automatically saved to localStorage every 10 data points
- Sessions can be recovered after browser refresh or accidental navigation
- Saved sessions expire after 24 hours
- Storage key: `spinnn_workout_session`

### FIT File Export

The app can export completed workouts as `.fit` files using the Garmin FIT SDK:
- Creates valid FIT files with File ID, Record, Lap, Session, and Activity messages
- Compatible with Garmin Connect, Strava, TrainingPeaks, etc.
- Includes power, heart rate, cadence, speed, and distance data
- Calculates normalized power (NP) for the session
- Export function: `createFitFile(sessionData, stats)` in `src/utils/fitExporter.js`

### Workout Data Format

Workouts follow a hierarchical structure:
```javascript
{
  name: "Workout Name",
  description: "Description",
  author: "Author Name",
  intervals: [
    {
      type: "warmup" | "cooldown" | "ramp" | "steady" | "rest" | "repeat",
      duration: seconds,
      power: watts or FTP percentage,
      cadence: rpm,
      repeat: count (for repeat blocks),
      intervals: [] (nested intervals for repeat blocks)
    }
  ]
}
```

### LocalStorage Keys

The application persists data with the `spinnn_` prefix:
- `spinnn_ftp` - User's Functional Threshold Power
- `spinnn_power_zones` - Custom power zone definitions
- `spinnn_theme` - Dark/light theme preference
- `spinnn_intervals_api_key` - Intervals.icu API credentials
- `spinnn_workout_session` - Active workout session (auto-saved)

### Theme System

- Dual theme support (light/dark) via CSS variables
- Colors use OKLch color space for perceptual uniformity
- Theme definitions in `src/style.css`
- Custom fonts: Oxanium (headings), Merriweather (body), Fira Code (mono)

### D3.js Chart Implementation

- Charts are rendered using D3.js in Vue components
- Real-time updates during workout execution (~1Hz data rate)
- Components: `WorkoutChart.vue`, `HeartRateChart.vue`, `PowerChart.vue`, `WorkoutPreviewChart.vue`
- Charts use ResizeObserver for responsive sizing

### Responsive Design

- Sidebar collapses during workout on desktop
- Mobile bottom navigation bar
- Touch-friendly UI elements
- Custom scrollbar styling

## E2E Testing (Smoke Tests)

The application uses Playwright for smoke testing critical user flows. This provides fast, high-value testing without the complexity of unit tests for hardware-integrated features.

### Test Coverage
- Configuration: `playwright.config.js`
- Test file: `tests/e2e/smoke.spec.js`
- 3 critical smoke tests:
  1. **Navigation flow** - Setup → Workout → Summary (core user journey)
  2. **Settings persistence** - FTP configuration saves to localStorage
  3. **Mock mode** - Device simulation works for development

### Test Execution
```bash
bun test:e2e         # Run smoke tests
bun test:e2e:ui      # Run with Playwright UI
bun test:e2e:debug   # Debug mode
```

### Test Strategy
- Smoke tests are run manually before releases
- Tests cover happy paths for critical features
- Mock mode is used to avoid hardware dependencies
- Execution time < 30 seconds

## Browser Requirements

### Required Features
- Web Bluetooth API support (Chrome, Edge, Opera)
- ES6 modules
- LocalStorage

### Recommended Setup
- **IDE:** VS Code with Vue Official extension (Volar)
- **Browser:** Chromium-based browser with Vue.js DevTools
- Enable Custom Object Formatters in DevTools for better Vue debugging

### Browser Compatibility Notes
- **Firefox:** Does NOT support Web Bluetooth API (use Chromium-based browser)
- **Safari:** Limited Web Bluetooth support (use Chrome/Edge for development)

## Important Constraints

1. **Client-Side Only:** Pure SPA with no backend. All state is client-side (localStorage + memory).

2. **Singleton Composables:** State management uses singleton pattern - composables instantiate module-level reactive state that is shared across the app. Do NOT create new instances inside components.

3. **BLE Data Rate:** Device data is collected at ~1 second intervals during workouts. This is the expected cadence for data recording.

4. **FTP-Relative Workouts:** Power zones and workout intensities are calculated as percentages of user's FTP value.

5. **Mock Mode:** Always provide mock mode for development without hardware. The `useMockDevices()` composable generates realistic device data.

6. **Session Recovery:** Active workouts persist across page refreshes. The app attempts to recover sessions automatically.

7. **French Language:** The UI uses French labels and text. When adding new UI text, maintain French language consistency.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension (disable Vetur if installed).

### VS Code Extensions (Recommended)
- Vue - Official (Volar)
- Tailwind CSS IntelliSense
- ES Lint
- Prettier
