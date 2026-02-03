# Tauri Desktop App Integration

This document describes the Tauri desktop integration for Spinnn, which provides a native desktop application with Bluetooth LE support while maintaining the web version.

## Architecture

The application uses a hybrid architecture:

```
spinnn/
├── src/                          # Shared frontend code
│   ├── composables/
│   │   ├── bluetooth/            # NEW: Bluetooth abstraction layer
│   │   │   ├── index.js          # Barrel export
│   │   │   ├── useWebBluetooth.js     # Web Bluetooth implementation
│   │   │   ├── useTauriBluetooth.js   # Tauri native implementation
│   │   │   └── useBluetoothFactory.js # Platform detection & factory
│   │   ├── useBluetoothHRM.js    # Original HRM composable (still works)
│   │   └── useBluetoothTrainer.js # Original Trainer composable (still works)
│   └── utils/
│       └── platform.js           # NEW: Platform detection utility
├── src-tauri/                    # NEW: Rust backend (desktop only)
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── lib.rs                # Tauri app setup + command registration
│   │   └── ble.rs                # Bluetooth commands (btleplug integration)
│   ├── Cargo.toml                # Rust dependencies
│   ├── tauri.conf.json           # App configuration
│   └── capabilities/             # Permission definitions
└── package.json                  # Scripts for both web and desktop
```

## Platform Detection

The `src/utils/platform.js` utility provides runtime detection:

```javascript
import { isTauri, platform, os } from '@/utils/platform';

if (isTauri()) {
  // Running in desktop app - use native Bluetooth
} else {
  // Running in browser - use Web Bluetooth API
}
```

## Bluetooth Implementation

### Web (Existing)

The web version uses the Web Bluetooth API:
- `navigator.bluetooth.requestDevice()` for device discovery
- GATT operations for connection and data streaming
- Works in Chrome/Edge/Opera on HTTPS or localhost

### Desktop (New with Tauri)

The desktop version uses Rust with btleplug:
- Native Bluetooth stack integration
- Cross-platform support (Windows, macOS, Linux)
- More reliable than Web Bluetooth
- FTMS control for smart trainers (ERG mode, simulation)

## Available Commands

### Tauri Commands (Rust)

The following commands are exposed to the frontend:

| Command | Description |
|---------|-------------|
| `ble_is_available` | Check if Bluetooth is available |
| `ble_scan` | Scan for BLE devices (optional service filter) |
| `ble_connect` | Connect to a device by ID |
| `ble_disconnect` | Disconnect from a device |
| `ble_subscribe_hrm` | Subscribe to heart rate measurements |
| `ble_subscribe_power` | Subscribe to power measurements |
| `ble_subscribe_csc` | Subscribe to CSC (cadence/speed) measurements |
| `ble_set_target_power` | Set target power (ERG mode) |
| `ble_set_simulation` | Set simulation parameters (grade, wind) |
| `ble_set_resistance` | Set resistance level |

### Frontend Usage

```javascript
import { useBluetoothHRM, useBluetoothTrainer } from '@/composables/bluetooth';

// Heart rate monitor
const hrm = useBluetoothHRM();
await hrm.connect();

// Smart trainer
const trainer = useBluetoothTrainer();
await trainer.connect();
await trainer.setTargetPower(200); // Set ERG mode to 200W
```

## Development Scripts

```bash
# Web development
bun dev              # Start Vite dev server at http://localhost:5173

# Desktop development
bun run dev:tauri    # Start Tauri dev mode (builds Rust + runs Vite)

# Production builds
bun run build        # Build web version to /dist
bun run build:tauri  # Build desktop app (platform-specific)
```

## System Requirements

### Linux
```bash
# Arch Linux
sudo pacman -S webkit2gtk-4.1 libdbus openssl

# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### macOS
- Xcode Command Line Tools
- No additional dependencies required

### Windows
- Microsoft C++ Build Tools
- WebView2 Runtime (usually pre-installed on Windows 10+)

## Building for Distribution

```bash
# Build for current platform
bun run build:tauri

# Build for specific target (cross-compilation)
bunx tauri build --target x86_64-pc-windows-msvc
bunx tauri build --target x86_64-apple-darwin
bunx tauri build --target x86_64-unknown-linux-gnu
```

Output bundles are in `src-tauri/target/release/bundle/`.

## Implementation Status

### Completed
- [x] Tauri project initialization
- [x] Platform detection utility
- [x] Bluetooth abstraction layer structure
- [x] Tauri command registration
- [x] Vite configuration for Tauri
- [x] Package.json scripts
- [x] Placeholder Bluetooth commands

### In Progress
- [ ] btleplug integration (requires system dependencies)
- [ ] Event streaming for real-time data
- [ ] FTMS control implementation
- [ ] Update existing composables to use factory

### TODO
- [ ] Install system dependencies
- [ ] Test Bluetooth device discovery
- [ ] Test device connection
- [ ] Test data streaming
- [ ] Test FTMS control (ERG mode)
- [ ] Test on Windows
- [ ] Test on macOS
- [ ] Create installer packages
- [ ] Update documentation with screenshots

## Bluetooth Implementation Details

### Service UUIDs

```rust
pub const HEART_RATE_SERVICE: &str = "0000180d-0000-1000-8000-00805f9b34fb";
pub const CYCLING_POWER_SERVICE: &str = "00001818-0000-1000-8000-00805f9b34fb";
pub const CSC_SERVICE: &str = "00001816-0000-1000-8000-00805f9b34fb";
pub const FTMS_SERVICE: &str = "00001826-0000-1000-8000-00805f9b34fb";
```

### Data Structures

```rust
pub struct DeviceInfo {
    pub id: String,
    pub name: Option<String>,
    pub rssi: Option<i16>,
    pub services: Vec<String>,
}

pub struct HeartRateData {
    pub bpm: u16,
    pub timestamp: u64,
    pub sensor_contact: bool,
    pub rr_intervals: Vec<u16>,
}

pub struct PowerData {
    pub watts: i16,
    pub cadence: Option<u8>,
    pub timestamp: u64,
}
```

## Troubleshooting

### "webkit2gtk-4.1 not found" (Linux)
Install webkit2gtk:
```bash
sudo pacman -S webkit2gtk-4.1  # Arch
sudo apt install libwebkit2gtk-4.1-dev  # Ubuntu
```

### "Cannot connect to Bluetooth"
- Ensure Bluetooth is enabled on your system
- Check that no other app is using the device
- Try restarting the Bluetooth service

### Development server won't start
- Ensure port 5173 is available
- Check that `node_modules` are properly installed

## Resources

- [Tauri Documentation](https://v2.tauri.app/)
- [btleplug GitHub](https://github.com/deviceplug/btleplug)
- [Web Bluetooth API](https://web.dev/bluetooth/)
- [FTMS Specification](https://www.bluetooth.com/specifications/specs/fitness-machine-service-1-0/)
