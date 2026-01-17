<div align="center">

# <img src="/public/favicon.ico" alt="Spinnn Logo" width="48"> Spinnn

*A modern web application for cycling workouts*

[Vue 3](https://vuejs.org/) · [Tailwind CSS](https://tailwindcss.com/) · [D3.js](https://d3js.org/) · [Web Bluetooth](https://webbluetoothcg.github.io/web-bluetooth/)

</div>

---

## Why Spinnn?

Spinnn is a progressive web application for executing cycling workouts with real-time monitoring. Connect your Bluetooth sensors (heart rate monitor, smart trainer) and track your power, heart rate, cadence, and speed during your sessions.

### Features

- **Structured Workouts**: Import your `.ZWO` files or sync with [Intervals.icu](https://intervals.icu/)
- **Bluetooth Connectivity**: Connect your Web Bluetooth compatible devices (HRM, power meter, smart trainer)
- **Real-time Tracking**: Visualize your metrics with interactive D3.js charts
- **ERG Mode**: Control your smart trainer in automatic resistance mode
- **FIT Export**: Export your sessions to Garmin Connect, Strava, TrainingPeaks, etc.
- **Simulation Mode**: Develop and test without Bluetooth hardware
- **Light/Dark Theme**: Interface adapted to your preferences
- **Responsive**: Works on desktop and mobile

---

## For Developers

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- A Chromium-based browser (Chrome, Edge) for Web Bluetooth

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

The application will be available at `http://localhost:5173`

### Useful Scripts

```bash
bun dev              # Development server
bun run build        # Production build
bun test             # Unit tests
bun test:e2e         # E2E tests
bun test:coverage    # Code coverage
```

### Tech Stack

- Vue 3 (Composition API)
- Vite
- Vue Router
- Tailwind CSS v4
- D3.js
- Vitest + Playwright

### Important Note

Web Bluetooth API requires HTTPS or `localhost`. Firefox does not support Web Bluetooth.

---

<div align="center">

Made with :heart: for cyclists

</div>
