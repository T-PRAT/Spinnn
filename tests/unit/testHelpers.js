/**
 * Test helpers for unit tests
 * Provides mock setup utilities
 */

export function setupMocks() {
  // Mock Web Bluetooth API
  if (!global.navigator.bluetooth) {
    global.navigator.bluetooth = {
      getDevices: () => Promise.resolve([]),
      requestDevice: () => Promise.resolve({
        gatt: {
          connect: () => Promise.resolve({
            getPrimaryService: () => Promise.resolve({
              getCharacteristic: () => Promise.resolve({
                startNotifications: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                readValue: () => Promise.resolve(new DataView(new ArrayBuffer(10))),
                stopNotifications: () => {},
              }),
            }),
          }),
          disconnect: () => {},
        },
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
    }
  }

  // Mock localStorage if not already mocked
  if (!global.localStorage._isMock) {
    const store = {}

    global.localStorage = {
      _isMock: true,
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value.toString() },
      removeItem: (key) => { delete store[key] },
      clear: () => {
        Object.keys(store).forEach(key => delete store[key])
      },
      get length() { return Object.keys(store).length },
      key: (index) => Object.keys(store)[index] || null,
    }
  }

  // Mock requestAnimationFrame
  global.requestAnimationFrame = (callback) => setTimeout(callback, 16)
  global.cancelAnimationFrame = (id) => clearTimeout(id)
}

export function clearAllMocks() {
  // Clear localStorage
  if (global.localStorage) {
    global.localStorage.clear()
  }
}
