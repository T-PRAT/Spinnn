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

### Build
```bash
bun run build        # Production build to /dist directory
bun run preview      # Preview production build locally
```

### Node Version Requirements
- Requires Node.js `^20.19.0` or `>=22.12.0`

## Architecture Overview

### Technology Stack
- **Framework:** Vue 3 with Composition API
- **Build Tool:** Vite 7.3.0
- **Routing:** Vue Router 4
- **Styling:** Tailwind CSS 4.1.18 with custom theme system
- **Data Visualization:** D3.js 7.9.0
- **Hardware Integration:** Web Bluetooth API + Garmin FIT SDK
- **State Management:** Singleton composables (no Vuex/Pinia)

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
  - Manages pause/resume functionality

- `useBluetoothHRM()` - Heart rate monitor BLE connectivity
  - Implements Web Bluetooth API wrapper for HR devices
  - Parses GATT Heart Rate Measurement characteristics

- `useBluetoothTrainer()` - Smart trainer BLE connectivity
  - Implements Cycling Power Service (UUID 0x1818)
  - Extracts power, cadence, and speed from BLE measurements

- `useIntervalsIcu()` - Third-party API integration
  - Authenticates with Intervals.icu API
  - Fetches and parses today's planned workout from Intervals.icu (including nested repeat blocks)

- `useTheme()` - Dark/light theme management
  - Persists theme preference to localStorage
  - Uses CSS variables and OKLch color space

### Application Flow

1. **Setup View** (`/`) - Step 1
   - Select workout (built-in samples, .ZWO import, or fetch today's workout from Intervals.icu)
   - Connect Bluetooth devices or enable mock mode
   - Configure FTP and power zones in Settings

2. **Workout View** (`/workout`) - Step 2
   - Execute workout with real-time monitoring
   - Display live charts for power, HR, cadence, speed
   - Record session data every second

3. **Summary View** (`/summary`) - Step 3
   - Review completed workout statistics
   - Visualize session data

4. **Settings View** (`/settings`)
   - Configure FTP (Functional Threshold Power)
   - Customize power zones (Z1-Z6)
   - Set Intervals.icu API credentials

### Directory Structure

```
src/
├── main.js                      # Entry point - creates Vue app
├── App.vue                      # Root component with routing and theme
├── router/index.js              # Route definitions (4 routes)
├── composables/                 # Singleton state management
│   ├── useAppState.js           # Global app state
│   ├── useWorkoutSession.js     # Workout execution
│   ├── useBluetoothHRM.js       # HR monitor connectivity
│   ├── useBluetoothTrainer.js   # Smart trainer connectivity
│   ├── useIntervalsIcu.js       # API integration
│   ├── useMockDevices.js        # Simulated device data
│   └── useTheme.js              # Theme management
├── components/                  # Reusable Vue components
│   ├── layout/                  # AppHeader, StepIndicator
│   ├── DeviceConnector.vue      # BLE device management
│   ├── WorkoutSelector.vue      # Workout selection UI
│   ├── WorkoutChart.vue         # D3-based real-time charts
│   ├── HeartRateChart.vue
│   ├── PowerChart.vue
│   └── IntervalsSettings.vue
├── views/                       # Page-level components
│   ├── SetupView.vue
│   ├── WorkoutView.vue
│   ├── SummaryView.vue
│   └── SettingsView.vue
├── utils/
│   └── bluetoothParser.js       # BLE GATT data parsing utilities
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
- Data parsing handled in `src/utils/bluetoothParser.js`
- Mock mode available via `useMockDevices()` for development without hardware

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

### Theme System

- Dual theme support (light/dark) via CSS variables
- Colors use OKLch color space for perceptual uniformity
- Theme definitions in `src/style.css`
- Custom fonts: Oxanium (headings), Merriweather (body), Fira Code (mono)

### D3.js Chart Implementation

- Charts are rendered using D3.js in Vue components
- Real-time updates during workout execution (~1Hz data rate)
- Components: `WorkoutChart.vue`, `HeartRateChart.vue`, `PowerChart.vue`
- Charts update reactively as new data points are recorded

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

1. **No Test Suite:** The project currently has no Jest/Vitest/Cypress configuration. Mock testing infrastructure exists via `useMockDevices()` composable.

2. **Client-Side Only:** Pure SPA with no backend. All state is client-side (localStorage + memory).

3. **Singleton Composables:** State management uses singleton pattern - composables instantiate module-level reactive state that is shared across the app. Do NOT create new instances inside components.

4. **BLE Data Rate:** Device data is collected at ~1 second intervals during workouts. This is the expected cadence for data recording.

5. **FTP-Relative Workouts:** Power zones and workout intensities are calculated as percentages of user's FTP value.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension (disable Vetur if installed).
