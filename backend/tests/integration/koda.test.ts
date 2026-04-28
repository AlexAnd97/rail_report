import { describe, it, expect } from 'vitest'
import { KodaClient } from '../../src/services/data/KodaClient'

/**
 * KoDa integration smoke test.
 *
 * Skipped unless USE_REAL_KODA=true and KODA_API_KEY is set.
 * Run with: USE_REAL_KODA=true KODA_API_KEY=<key> npm test
 */

const RUN = process.env.USE_REAL_KODA === 'true' && !!process.env.KODA_API_KEY

describe.skipIf(!RUN)('KodaClient smoke tests (USE_REAL_KODA=true)', () => {
  it('getLines returns at least one UL line', async () => {
    const lines = await KodaClient.getLines()
    expect(lines.length).toBeGreaterThan(0)
    expect(lines[0]).toMatchObject({ id: expect.any(String), name: expect.any(String) })
  })

  it('getStops returns stops for line 1', async () => {
    const stops = await KodaClient.getStops('1')
    expect(stops.length).toBeGreaterThan(0)
    expect(stops[0]).toMatchObject({ id: expect.any(String), name: expect.any(String) })
  })

  it('getDepartures returns departures for a one-day window', async () => {
    const departures = await KodaClient.getDepartures('1', '2026-04-21', '2026-04-21')
    expect(Array.isArray(departures)).toBe(true)
    if (departures.length > 0) {
      expect(departures[0]).toMatchObject({
        lineId: expect.any(String),
        stopId: expect.any(String),
        scheduledTime: expect.any(String),
      })
    }
  })
})
