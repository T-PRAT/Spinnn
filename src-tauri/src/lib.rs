// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ble;

use ble::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize BLE state
    let ble_state = BleState::new();

    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Bluetooth commands
            ble_is_available,
            ble_scan,
            ble_connect,
            ble_disconnect,
            ble_subscribe_hrm,
            ble_subscribe_power,
            ble_subscribe_csc,
            ble_set_target_power,
            ble_set_simulation,
            ble_set_resistance,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
