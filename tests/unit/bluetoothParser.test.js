/**
 * Unit tests for bluetoothParser utilities
 *
 * Tests BLE GATT data parsing:
 * - Heart rate measurement parsing
 * - Cycling power measurement parsing
 * - Cadence calculation
 * - Speed calculation
 * - Edge cases (rollover, missing flags, zero division)
 */

import { describe, it, expect } from 'vitest'
import {
  parseHeartRateMeasurement,
  parseCyclingPowerMeasurement,
  calculateCadence,
  calculateSpeed
} from '@/utils/bluetoothParser.js'
import { setupMocks } from './testHelpers.js'

// Setup mocks once for all tests
setupMocks()

describe('parseHeartRateMeasurement', () => {
  describe('8-bit heart rate format', () => {
    it('should parse 8-bit heart rate value', () => {
      // Flags byte: 0x00 (8-bit format, no sensor contact)
      // Heart rate: 140 bpm
      const data = new Uint8Array([0x00, 140])
      const dataView = new DataView(data.buffer)

      const result = parseHeartRateMeasurement(dataView)

      expect(result.heartRate).toBe(140)
    })

    it('should handle maximum 8-bit value (255)', () => {
      const data = new Uint8Array([0x00, 255])
      const dataView = new DataView(data.buffer)

      const result = parseHeartRateMeasurement(dataView)

      expect(result.heartRate).toBe(255)
    })

    it('should handle minimum 8-bit value (0)', () => {
      const data = new Uint8Array([0x00, 0])
      const dataView = new DataView(data.buffer)

      const result = parseHeartRateMeasurement(dataView)

      expect(result.heartRate).toBe(0)
    })
  })

  describe('16-bit heart rate format', () => {
    it('should parse 16-bit heart rate value', () => {
      // Flags byte: 0x01 (16-bit format, LSB first)
      // Heart rate: 180 bpm (0x00B4)
      const data = new Uint8Array([0x01, 0xB4, 0x00])
      const dataView = new DataView(data.buffer)

      const result = parseHeartRateMeasurement(dataView)

      expect(result.heartRate).toBe(180)
    })

    it('should handle large 16-bit value', () => {
      // Heart rate: 300 bpm (unrealistic but valid for testing)
      const data = new Uint8Array([0x01, 0x2C, 0x01])
      const dataView = new DataView(data.buffer)

      const result = parseHeartRateMeasurement(dataView)

      expect(result.heartRate).toBe(300)
    })
  })

  describe('Sensor contact detection', () => {
    it('should detect sensor contact not supported (status 0)', () => {
      // Flags: 0x00 (bits 1-2 = 00)
      const data = new Uint8Array([0x00, 140])
      const dataView = new DataView(data.buffer)

      const result = parseHeartRateMeasurement(dataView)

      expect(result.sensorContactSupported).toBe(false)
      expect(result.isContactDetected).toBe(false)
    })

    it('should detect sensor contact not supported (status 1)', () => {
      // Flags: 0x02 (bits 1-2 = 01)
      const data = new Uint8Array([0x02, 140])
      const dataView = new DataView(data.buffer)

      const result = parseHeartRateMeasurement(dataView)

      expect(result.sensorContactSupported).toBe(false)
      expect(result.isContactDetected).toBe(false)
    })

    it('should detect sensor contact supported but not detected (status 2)', () => {
      // Flags: 0x04 (bits 1-2 = 10)
      const data = new Uint8Array([0x04, 140])
      const dataView = new DataView(data.buffer)

      const result = parseHeartRateMeasurement(dataView)

      expect(result.sensorContactSupported).toBe(true)
      expect(result.isContactDetected).toBe(false)
    })

    it('should detect sensor contact supported and detected (status 3)', () => {
      // Flags: 0x06 (bits 1-2 = 11)
      const data = new Uint8Array([0x06, 140])
      const dataView = new DataView(data.buffer)

      const result = parseHeartRateMeasurement(dataView)

      expect(result.sensorContactSupported).toBe(true)
      expect(result.isContactDetected).toBe(true)
    })
  })

  describe('Combined flags', () => {
    it('should parse 16-bit HR with contact detected', () => {
      // Flags: 0x07 (16-bit + contact detected)
      // Heart rate: 165 bpm
      const data = new Uint8Array([0x07, 0xA5, 0x00])
      const dataView = new DataView(data.buffer)

      const result = parseHeartRateMeasurement(dataView)

      expect(result.heartRate).toBe(165)
      expect(result.sensorContactSupported).toBe(true)
      expect(result.isContactDetected).toBe(true)
    })
  })
})

describe('parseCyclingPowerMeasurement', () => {
  describe('Basic power measurement', () => {
    it('should parse instantaneous power (minimum data)', () => {
      // Flags: 0x0000 (no optional fields)
      // Power: 200W (0x00C8 as signed 16-bit)
      const data = new Uint8Array([0x00, 0x00, 0xC8, 0x00])
      const dataView = new DataView(data.buffer)

      const result = parseCyclingPowerMeasurement(dataView)

      expect(result.power).toBe(200)
      expect(result.crankRevolutions).toBeNull()
      expect(result.lastCrankEventTime).toBeNull()
      expect(result.wheelRevolutions).toBeNull()
      expect(result.lastWheelEventTime).toBeNull()
    })

    it('should parse negative power as zero', () => {
      // Power: -50W (should be clamped to 0)
      const data = new Uint8Array([0x00, 0x00, 0xCE, 0xFF])
      const dataView = new DataView(data.buffer)

      const result = parseCyclingPowerMeasurement(dataView)

      expect(result.power).toBe(0)
    })

    it('should handle maximum realistic power (2000W)', () => {
      // Power: 2000W (0x07D0)
      const data = new Uint8Array([0x00, 0x00, 0xD0, 0x07])
      const dataView = new DataView(data.buffer)

      const result = parseCyclingPowerMeasurement(dataView)

      expect(result.power).toBe(2000)
    })
  })

  describe('Crank revolutions', () => {
    it('should parse cumulative crank revolutions', () => {
      // Flags: 0x0020 (has cumulative crank revolutions)
      // Power: 200W
      // Crank revolutions: 1000 (0x03E8)
      // Last crank event time: 5000 (0x1388)
      const data = new Uint8Array([
        0x20, 0x00,  // Flags
        0xC8, 0x00,  // Power: 200W
        0xE8, 0x03,  // Crank revolutions: 1000
        0x88, 0x13   // Last crank event time: 5000
      ])
      const dataView = new DataView(data.buffer)

      const result = parseCyclingPowerMeasurement(dataView)

      expect(result.power).toBe(200)
      expect(result.crankRevolutions).toBe(1000)
      expect(result.lastCrankEventTime).toBe(5000)
      expect(result.wheelRevolutions).toBeNull()
      expect(result.lastWheelEventTime).toBeNull()
    })
  })

  describe('Wheel revolutions', () => {
    it('should parse cumulative wheel revolutions', () => {
      // Flags: 0x0010 (has cumulative wheel revolutions)
      // Power: 200W
      // Wheel revolutions: 10000 (0x00002710)
      // Last wheel event time: 10000 (0x2710)
      const data = new Uint8Array([
        0x10, 0x00,  // Flags
        0xC8, 0x00,  // Power: 200W
        0x10, 0x27, 0x00, 0x00,  // Wheel revolutions: 10000
        0x10, 0x27   // Last wheel event time: 10000
      ])
      const dataView = new DataView(data.buffer)

      const result = parseCyclingPowerMeasurement(dataView)

      expect(result.power).toBe(200)
      expect(result.wheelRevolutions).toBe(10000)
      expect(result.lastWheelEventTime).toBe(10000)
      expect(result.crankRevolutions).toBeNull()
      expect(result.lastCrankEventTime).toBeNull()
    })
  })

  describe('Combined data', () => {
    it('should parse power with both crank and wheel data', () => {
      // Flags: 0x0030 (has both crank and wheel revolutions)
      const data = new Uint8Array([
        0x30, 0x00,  // Flags
        0xC8, 0x00,  // Power: 200W
        0x10, 0x27, 0x00, 0x00,  // Wheel revolutions: 10000
        0x10, 0x27,              // Last wheel event time: 10000
        0xE8, 0x03,              // Crank revolutions: 1000
        0x88, 0x13               // Last crank event time: 5000
      ])
      const dataView = new DataView(data.buffer)

      const result = parseCyclingPowerMeasurement(dataView)

      expect(result.power).toBe(200)
      expect(result.wheelRevolutions).toBe(10000)
      expect(result.lastWheelEventTime).toBe(10000)
      expect(result.crankRevolutions).toBe(1000)
      expect(result.lastCrankEventTime).toBe(5000)
    })
  })

  describe('Optional fields', () => {
    it('should parse pedal power balance', () => {
      // Flags: 0x0001 (has pedal power balance)
      // Power: 200W
      // Pedal power balance: 48% (right leg)
      const data = new Uint8Array([
        0x01, 0x00,  // Flags
        0xC8, 0x00,  // Power: 200W
        0x30         // Pedal power balance: 48%
      ])
      const dataView = new DataView(data.buffer)

      const result = parseCyclingPowerMeasurement(dataView)

      expect(result.power).toBe(200)
    })

    it('should parse accumulated torque', () => {
      // Flags: 0x0004 (has accumulated torque)
      // Power: 200W
      // Accumulated torque: 1000 (0x03E8)
      const data = new Uint8Array([
        0x04, 0x00,  // Flags
        0xC8, 0x00,  // Power: 200W
        0xE8, 0x03   // Accumulated torque: 1000
      ])
      const dataView = new DataView(data.buffer)

      const result = parseCyclingPowerMeasurement(dataView)

      expect(result.power).toBe(200)
    })
  })
})

describe('calculateCadence', () => {
  it('should calculate cadence from crank revolutions', () => {
    // Current: 1000 revolutions at 5000 time
    // Last: 900 revolutions at 4000 time
    // Delta: 100 revs in 1000 time units
    // Raw calculation = (100 / 1000) * 1024 * 60 = 6144
    // But this exceeds 255 rpm max, so it should be clamped
    const currentRevs = 1000
    const lastRevs = 900
    const currentTime = 5000
    const lastTime = 4000

    const result = calculateCadence(currentRevs, lastRevs, currentTime, lastTime)

    // Should be clamped to 255 rpm maximum
    expect(result).toBe(255)
  })

  it('should return 0 when no previous data', () => {
    const result = calculateCadence(1000, null, 5000, null)

    expect(result).toBe(0)
  })

  it('should handle 16-bit time rollover', () => {
    // Current time rolled over from 65535 to 100
    const currentRevs = 1100
    const lastRevs = 1000
    const currentTime = 100
    const lastTime = 65500

    // Time delta should be: (100 - 65500) + 65536 = 136
    const result = calculateCadence(currentRevs, lastRevs, currentTime, lastTime)

    expect(result).toBeGreaterThan(0)
  })

  it('should return 0 when time delta is 0', () => {
    const result = calculateCadence(1000, 900, 5000, 5000)

    expect(result).toBe(0)
  })

  it('should clamp cadence to 255 rpm maximum', () => {
    // Very high cadence calculation
    const currentRevs = 10000
    const lastRevs = 0
    const currentTime = 100
    const lastTime = 0

    const result = calculateCadence(currentRevs, lastRevs, currentTime, lastTime)

    expect(result).toBeLessThanOrEqual(255)
  })

  it('should return 0 for negative cadence (no progress)', () => {
    const result = calculateCadence(900, 1000, 5000, 4000)

    expect(result).toBe(0)
  })

  it('should calculate realistic cadence values', () => {
    // Typical cycling scenario: 90 rpm
    // 90 rpm = 1.5 revs per second
    // In 1 second (1024 time units): 1.5 * 1024 / 60 = 25.6 time units per rev
    // Let's say we have 15 revs in ~10 seconds
    const currentRevs = 1000
    const lastRevs = 985
    const currentTime = 10240  // 10 seconds
    const lastTime = 0

    const result = calculateCadence(currentRevs, lastRevs, currentTime, lastTime)

    expect(result).toBeGreaterThan(80)
    expect(result).toBeLessThan(100)
  })
})

describe('calculateSpeed', () => {
  it('should calculate speed from wheel revolutions', () => {
    // Current: 1000 revolutions at 5000 time
    // Last: 900 revolutions at 4000 time
    // Delta: 100 revs
    // Time delta: 1000 units = 1000/1024 seconds
    // Distance: 100 * 2.105m = 210.5m
    // Speed: 210.5m / (1000/1024)s = 215.3 m/s
    const currentRevs = 1000
    const lastRevs = 900
    const currentTime = 5000
    const lastTime = 4000

    const result = calculateSpeed(currentRevs, lastRevs, currentTime, lastTime)

    const expectedSpeed = (100 * 2.105) / (1000 / 1024)
    expect(result).toBeCloseTo(expectedSpeed, 1)
  })

  it('should return 0 when no previous data', () => {
    const result = calculateSpeed(1000, null, 5000, null)

    expect(result).toBe(0)
  })

  it('should handle 16-bit time rollover', () => {
    const currentRevs = 1100
    const lastRevs = 1000
    const currentTime = 100
    const lastTime = 65500

    const result = calculateSpeed(currentRevs, lastRevs, currentTime, lastTime)

    expect(result).toBeGreaterThan(0)
  })

  it('should return 0 when time delta is 0', () => {
    const result = calculateSpeed(1000, 900, 5000, 5000)

    expect(result).toBe(0)
  })

  it('should calculate speed with custom wheel circumference', () => {
    // Mountain bike with larger wheels: 2.3m circumference
    const currentRevs = 1000
    const lastRevs = 900
    const currentTime = 5000
    const lastTime = 4000
    const wheelCircumference = 2.3

    const result = calculateSpeed(currentRevs, lastRevs, currentTime, lastTime, wheelCircumference)

    const expectedSpeed = (100 * 2.3) / (1000 / 1024)
    expect(result).toBeCloseTo(expectedSpeed, 1)
  })

  it('should return 0 for negative speed (no progress)', () => {
    const result = calculateSpeed(900, 1000, 5000, 4000)

    expect(result).toBe(0)
  })

  it('should calculate realistic speed values', () => {
    // Typical cycling: 30 km/h = 8.33 m/s
    // At 30 km/h with 2.105m wheel circumference
    // Revs per second = 8.33 / 2.105 = 3.96 rev/s
    // In 10 seconds: ~40 revs
    const currentRevs = 1000
    const lastRevs = 960
    const currentTime = 10240  // 10 seconds
    const lastTime = 0

    const result = calculateSpeed(currentRevs, lastRevs, currentTime, lastTime)

    // Should be around 8-9 m/s (28-32 km/h)
    expect(result).toBeGreaterThan(7)
    expect(result).toBeLessThan(10)
  })

  it('should handle very slow speeds', () => {
    // Walking speed: ~5 km/h = 1.4 m/s
    const currentRevs = 1000
    const lastRevs = 993  // 7 revs in 10 seconds
    const currentTime = 10240
    const lastTime = 0

    const result = calculateSpeed(currentRevs, lastRevs, currentTime, lastTime)

    // Should be around 1-2 m/s
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(3)
  })
})

describe('Edge Cases and Integration', () => {
  it('should handle maximum 16-bit revolution counter', () => {
    // Crank revolutions approaching max uint16 (65535)
    const currentRevs = 65535
    const lastRevs = 65435
    const currentTime = 5000
    const lastTime = 4000

    const result = calculateCadence(currentRevs, lastRevs, currentTime, lastTime)

    expect(result).toBeGreaterThan(0)
  })

  it('should handle revolution counter rollover', () => {
    // Revolutions rolled over from 65535 to 100
    const currentRevs = 100
    const lastRevs = 65500
    const currentTime = 5000
    const lastTime = 4000

    const result = calculateCadence(currentRevs, lastRevs, currentTime, lastTime)

    // Should handle negative delta gracefully
    expect(result).toBe(0)
  })

  it('should parse complete power measurement with all fields', () => {
    // Realistic power meter data with all fields
    const data = new Uint8Array([
      0x35, 0x00,  // Flags: pedal balance + torque + wheel + crank
      0x58, 0x02,  // Power: 600W (0x0258)
      0x30,        // Pedal power balance: 48%
      0xE8, 0x03,  // Accumulated torque: 1000
      0x10, 0x27, 0x00, 0x00,  // Wheel revolutions: 10000
      0x10, 0x27,              // Last wheel event time: 10000
      0xE8, 0x03,              // Crank revolutions: 1000
      0x88, 0x13               // Last crank event time: 5000
    ])
    const dataView = new DataView(data.buffer)

    const result = parseCyclingPowerMeasurement(dataView)

    expect(result.power).toBe(600)
    expect(result.wheelRevolutions).toBe(10000)
    expect(result.crankRevolutions).toBe(1000)
  })
})
