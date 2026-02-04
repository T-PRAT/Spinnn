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

### Backend Server
```bash
cd server
bun install          # Install backend dependencies
bun run dev          # Start backend dev server with hot reload
bun run build        # Build TypeScript to JavaScript
bun run start        # Start production server
```

**Environment Variables (Backend):**
- `STRAVA_CLIENT_ID` - Strava OAuth application ID
- `STRAVA_CLIENT_SECRET` - Strava OAuth secret
- `FRONTEND_URL` - Frontend origin for CORS (default: http://localhost:5173)
- `SESSION_SECRET` - Session encryption key

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
- **Internationalization:** vue-i18n 10.x (French + English)
- **Icons:** @heroicons/vue 2.x
- **E2E Testing:** Playwright 1.50.1 (smoke tests only)

### Backend Server
- **Framework:** Hono 4.x (lightweight web framework)
- **Runtime:** Bun (Node.js-compatible)
- **Language:** TypeScript
- **Purpose:** OAuth 2.0 flow for Strava integration

### State Management Pattern

This application uses **singleton composables** for state management instead of Vuex or Pinia. Each composable maintains module-level reactive state that is shared across all component instances.

**Key Composables:**

- `useAppState()` - Global application state and workflow orchestration
  - Manages current step (1: Setup, 2: Workout, 3: Summary)
  - Stores selected workout, FTP, and power zones
  - Persists FTP and zones via useStorage
  - Validates workout readiness via `canStartWorkout` computed property

- `useStorage()` - Centralized localStorage abstraction layer
  - Type-safe getter/setter methods for all storage keys
  - Validation and error handling
  - Exports `STORAGE_KEYS` constant object
  - Enforced abstraction: all composables use this instead of direct localStorage calls

- `useWorkoutSession()` - Active workout execution state
  - Tracks timing, elapsed duration, and completion status
  - Manages pause/resume functionality with automatic persistence
  - Split in Phase 3 refactoring into useWorkoutSession, useWorkoutData, useWorkoutStats
  - Auto-saves session every 10 data points via useStorage

- `useWorkoutData()` - Data point recording
  - Records data points (power, HR, cadence, speed) every second
  - Manages session data array
  - Separated from useWorkoutSession in Phase 3 refactoring

- `useWorkoutStats()` - Statistics calculations
  - Calculates normalized power (NP) and energy expenditure (kJ)
  - Computes average/max values for all metrics
  - Separated from useWorkoutSession in Phase 3 refactoring

- `usePowerAdjustments()` - Real-time power offset adjustments
  - Tracks interval-specific and global power offsets
  - Auto-resets interval offset when moving to next interval
  - Provides formatted offset percentages (+5%, -10%, etc.)
  - Used during active workouts for intensity adjustment

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

- `useStrava()` - Strava integration and OAuth management
  - Backend-dependent OAuth 2.0 flow
  - Activity upload with FIT file conversion
  - Auto-upload toggle setting
  - Polls upload status until completion
  - CSRF protection via state parameter

- `useMockDevices()` - Simulated device data
  - Generates mock power, HR, cadence, and speed data
  - Essential for development without BLE hardware

- `useAudioSettings()` - Audio cue configuration
  - Manages audio preferences for workout announcements

- `useI18n()` - Internationalization management
  - Supports locales: French (default), English
  - Auto-detects browser language on first visit
  - Syncs with vue-i18n instance
  - Persists locale preference via useStorage

- `useTheme()` - Dark/light theme management
  - Persists theme preference via useStorage
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
   - Connect/disconnect Strava account
   - Manage auto-upload preferences

5. **History View** (`/history`)
   - View past workout sessions (placeholder - coming soon)

6. **Strava Callback View** (`/strava-callback`)
   - OAuth callback handler for Strava integration
   - Exchanges authorization code for access tokens
   - Redirects to settings after successful authentication

### Directory Structure

```
src/
├── main.js                      # Entry point - creates Vue app
├── App.vue                      # Root component with routing and theme
├── router/index.js              # Route definitions (6 routes)
├── style.css                    # Global styles with Tailwind + CSS variables
├── constants/                   # NEW
│   ├── bluetooth.js            # BLE config (UUIDs, timeouts, wheel circumference)
│   └── zones.js                # Default FTP and power zone definitions
├── locales/                     # NEW
│   ├── en.js                   # English translations
│   ├── fr.js                   # French translations (default)
│   ├── index.js
│   └── modules/
│       ├── common.js           # Standard UI labels
│       ├── device.js           # Bluetooth device strings
│       ├── history.en.js       # History view (English)
│       ├── history.js          # History view (French)
│       ├── metrics.js          # Metrics labels
│       ├── navigation.js       # Navigation strings
│       ├── settings.js         # Settings pages
│       └── workout.js          # Workout terminology
├── composables/                 # Singleton state management
│   ├── useAppState.js           # Global app state
│   ├── useStorage.js           # NEW - Centralized localStorage
│   ├── useWorkoutSession.js     # Workout execution & persistence
│   ├── useWorkoutData.js       # NEW - Data point recording
│   ├── useWorkoutStats.js      # NEW - Statistics calculations
│   ├── usePowerAdjustments.js  # NEW - Power offset adjustments
│   ├── useBluetoothHRM.js       # HR monitor connectivity
│   ├── useBluetoothTrainer.js   # Smart trainer connectivity
│   ├── useIntervalsIcu.js       # API integration
│   ├── useStrava.js            # NEW - Strava OAuth + upload
│   ├── useMockDevices.js        # Simulated device data
│   ├── useAudioSettings.js      # Audio cue configuration
│   ├── useI18n.js              # NEW - Locale management
│   └── useTheme.js              # Theme management
├── components/                  # Reusable Vue components
│   ├── layout/
│   │   ├── Sidebar.vue          # Responsive navigation (collapses during workout)
│   │   ├── StepIndicator.vue    # Progress indicator (legacy)
│   │   ├── FTPInput.vue        # NEW - FTP configuration
│   │   ├── IntervalsTodayWorkout.vue # NEW - Fetch today's workout
│   │   └── LiveDashboard.vue   # NEW - Real-time metrics display
│   ├── device/
│   │   ├── DeviceConnector.vue  # BLE device management UI
│   │   └── BluetoothDebug.vue  # NEW - BLE debugging tool
│   ├── workout/
│   │   ├── WorkoutSelector.vue  # Workout selection UI
│   │   ├── WorkoutPreviewChart.vue # D3 workout preview
│   │   ├── WorkoutChart.vue     # Main workout execution chart
│   │   ├── MetricCard.vue      # NEW - Individual metric display
│   │   ├── MetricConfigModal.vue # NEW - Metrics configuration
│   │   └── MetricsGrid.vue     # NEW - Customizable metrics grid
│   ├── charts/
│   │   ├── PowerChart.vue       # Power visualization
│   │   └── HeartRateChart.vue   # HR visualization
│   └── settings/
│       ├── IntervalsSettings.vue # API configuration UI
│       └── StravaSettings.vue  # NEW - Strava connection UI
├── views/                       # Page-level components
│   ├── SetupView.vue            # Setup/landing page
│   ├── WorkoutView.vue          # Active workout page
│   ├── SummaryView.vue          # Workout completion summary
│   ├── SettingsView.vue         # Settings page
│   ├── HistoryView.vue          # Workout history (placeholder)
│   └── StravaCallbackView.vue  # NEW - OAuth callback handler
├── utils/
│   ├── bluetoothParser.js       # BLE GATT data parsing utilities
│   ├── web-ble.js               # Web Bluetooth filters
│   ├── EventDispatcher.js       # Event system for pub/sub
│   ├── Connectable.js           # Bluetooth connection wrapper
│   ├── fitExporter.js           # FIT file export for Garmin/Strava
│   └── logger.js               # NEW - Environment-aware logging
└── data/
    └── sampleWorkouts.js        # Built-in workout templates

server/                          # NEW ENTIRE DIRECTORY
├── src/
│   ├── config/env.ts           # Environment configuration
│   ├── middleware/cors.ts      # CORS middleware
│   ├── routes/
│   │   ├── health.ts           # Health check endpoint
│   │   ├── index.ts            # Route aggregation
│   │   └── strava.ts           # Strava OAuth endpoints
│   ├── services/strava.service.ts # Strava API service
│   ├── storage/session.ts      # Session management
│   ├── types/strava.ts         # TypeScript types
│   └── index.ts                # Server entry point
├── Dockerfile                   # Container configuration
├── package.json
└── tsconfig.json
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

### Bluetooth Constants

Centralized BLE configuration in `/src/constants/bluetooth.js`:

**Key Constants:**
- `BLE_TIME_RESOLUTION` - 1/1024 second units (GATT spec)
- `DEFAULT_WHEEL_CIRCUMFERENCE` - 2.105m (700x25c tire)
- `RECONNECT_DELAY` - 3000ms exponential backoff
- `CONNECTION_TIMEOUT` - 30000ms
- Service UUIDs: HRM (0x180D), Cycling Power (0x1818), CSC (0x1816), FTMS (0x1826)

### Strava Integration

The app supports automatic workout upload to Strava via OAuth 2.0 authentication.

**Backend Server (Required):**
- Built with Hono framework on Bun runtime
- Handles OAuth 2.0 flow and token management
- Provides endpoints for upload and status checking
- Session-based authentication with secure cookies
- Automatic token refresh mechanism

**API Endpoints:**
- `GET /api/strava/status` - Check connection status
- `GET /api/strava/oauth/authorize` - Initiate OAuth flow
- `GET /api/strava/oauth/exchange` - Handle OAuth callback
- `POST /api/strava/deauthorize` - Disconnect Strava
- `POST /api/strava/upload` - Upload FIT file
- `GET /api/strava/upload/:id` - Check upload status

**Frontend Integration:**
- `useStrava()` composable manages OAuth state
- Auto-upload toggle in Settings view
- Upload polling with 30s timeout (1s intervals)
- CSRF protection via state parameter

### Internationalization (i18n)

The app supports multiple languages via vue-i18n.

**Supported Locales:**
- French (fr) - Default
- English (en)

**Features:**
- Auto-detects browser language on first visit
- Locale preference persists via useStorage
- Organized translation modules: common, navigation, workout, metrics, device, settings, history
- Fallback to French if translation missing
- `useI18n()` composable provides `t()` function and `currentLocale` ref

**Translation Structure:**
- `/src/locales/fr.js` and `/src/locales/en.js` - Main locale files
- `/src/locales/modules/` - Modular translations by feature area

### Centralized Logging

The app uses a custom logger utility for environment-aware logging.

**Logger Methods:**
- `debug()` - Development only (suppressed in production)
- `info()`, `warn()`, `error()` - Always logged
- Auto-prefixes messages with `[Spinnn]`

**Usage:**
```javascript
import { logger } from '@/utils/logger'
logger.debug('BLE data received:', data)
logger.error('Upload failed:', error)
```

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

The application persists data with the `spinnn_` prefix (all keys managed via `useStorage.js`):
- `spinnn_ftp` - User's Functional Threshold Power
- `spinnn_power_zones` - Custom power zone definitions
- `spinnn_theme` - Dark/light theme preference
- `spinnn_locale` - Selected language (fr/en)
- `spinnn_intervals_api_key` - Intervals.icu API credentials
- `spinnn_intervals_athlete_id` - Intervals.icu athlete ID
- `spinnn_strava_auto_upload` - Auto-upload to Strava toggle
- `spinnn_metrics_config` - Customizable metrics display configuration
- `spinnn_workout_session` - Active workout session (auto-saved)

**Note:** All localStorage operations MUST go through `useStorage.js` (enforced abstraction layer)

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
- Internationalization API (for vue-i18n)

### Recommended Setup
- **IDE:** VS Code with Vue Official extension (Volar)
- **Browser:** Chromium-based browser with Vue.js DevTools
- Enable Custom Object Formatters in DevTools for better Vue debugging

### Browser Compatibility Notes
- **Firefox:** Does NOT support Web Bluetooth API (use Chromium-based browser)
- **Safari:** Limited Web Bluetooth support (use Chrome/Edge for development)

## Important Constraints

1. **Backend Dependency:** Strava integration requires the backend server running for OAuth flow. All other features work client-side only.

2. **Singleton Composables:** State management uses singleton pattern - composables instantiate module-level reactive state that is shared across the app. Do NOT create new instances inside components.

3. **Centralized Storage:** All localStorage operations MUST go through `useStorage.js` (enforced abstraction layer). Never use localStorage directly.

4. **BLE Data Rate:** Device data is collected at ~1 second intervals during workouts. This is the expected cadence for data recording.

5. **FTP-Relative Workouts:** Power zones and workout intensities are calculated as percentages of user's FTP value.

6. **Mock Mode:** Always provide mock mode for development without hardware. The `useMockDevices()` composable generates realistic device data.

7. **Session Recovery:** Active workouts persist across page refreshes. The app attempts to recover sessions automatically.

8. **Locale Detection:** First-time users get browser language (fr/en), returning users get saved preference from useStorage.

## Recent Refactoring (7 Phases)

The codebase underwent significant architectural improvements:

**Phase 1:** Extract shared utilities and constants
**Phase 2:** Centralize localStorage with useStorage composable
**Phase 3:** Split useWorkoutSession into 3 composables (useWorkoutSession, useWorkoutData, useWorkoutStats)
**Phase 5:** Simplify defensive code in Sidebar.vue
**Phase 6:** Organize D3 chart state with clear comments
**Phase 7:** Cleanup and polish - logger + remove dead code + i18n

Focus: Code organization, modularity, state management centralization, removal of dead code, improved i18n support.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension (disable Vetur if installed).

### VS Code Extensions (Recommended)
- Vue - Official (Volar)
- Tailwind CSS IntelliSense
- ES Lint
- Prettier
