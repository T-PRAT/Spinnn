/**
 * Vitest setup file
 * Global test configuration and mocks
 */

// Mock Web Bluetooth API
global.navigator = global.navigator || {}
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
  })),
  addEventListener: () => {},
  removeEventListener: () => {},
}

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString() },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    length: 0,
    key: (index) => Object.keys(store)[index] || null,
    _updateLength: () => { localStorageMock.length = Object.keys(store).length }
  }
})()

global.localStorage = localStorageMock

// Mock requestAnimationFrame (for D3 animations)
global.requestAnimationFrame = (callback) => setTimeout(callback, 16)
global.cancelAnimationFrame = (id) => clearTimeout(id)

// Mock performance.now() for consistent timing in tests
let mockTime = 0

// Helper to advance mock time
global.advanceTime = (ms) => {
  mockTime += ms
}

// Export helper to reset mock time (to be used in beforeEach in test files)
global.__resetMockTime = () => {
  mockTime = 0
}

// Export helper to clear localStorage
global.__clearLocalStorage = () => {
  localStorageMock.clear()
}
