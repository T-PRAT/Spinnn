# Web Bluetooth Setup for Linux

## Problem
`navigator.bluetooth` is `undefined` in Chrome on Linux, preventing Bluetooth device connections.

## Solution

### Step 1: Enable Experimental Web Platform Features

1. In Chrome, navigate to:
   ```
   chrome://flags/#enable-experimental-web-platform-features
   ```

2. You'll see a dropdown menu that currently says "Default"

3. Click the dropdown and change it to **"Enabled"**

4. Scroll to the bottom and click the **"Relaunch"** button
   - IMPORTANT: You must click "Relaunch" - just closing the tab is not enough
   - This will completely restart Chrome

### Step 2: Verify It's Working

1. After Chrome restarts, return to Spinnn at `http://192.168.1.100:5173`

2. Check the "Bluetooth Debug Info" panel:

   ✅ **Before fix** (what you see now):
   ```
   Has Bluetooth: false
   Bluetooth Type: undefined
   requestDevice(): NOT Available
   ```

   ✅ **After fix** (what you should see):
   ```
   Has Bluetooth: true
   Bluetooth Type: object
   requestDevice(): Available
   ```

### Step 3: Test Connection

Once you see "Has Bluetooth: true", click "Connecter Cardio" or "Connecter Trainer" - the device selection window should now appear.

## Alternative: Use Mock Mode Immediately

If you want to test the app right now without configuring Bluetooth:

1. Click the **"Activer Mode Mock"** button in the device connector
2. This simulates Bluetooth devices with realistic data
3. All workout features will work immediately
4. You can configure real Bluetooth later

## Why This Is Required

On Linux, Web Bluetooth is an **experimental feature** and must be manually enabled via Chrome flags. This is a browser limitation, not a Spinnn issue.

Other platforms (Windows, macOS, ChromeOS) have Web Bluetooth enabled by default, but Linux requires this manual step.
