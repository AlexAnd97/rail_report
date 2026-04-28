import { describe, it, expect } from 'vitest'
import { DataService } from '../../src/services/data/DataService'

describe('DataService (mock mode)', () => {
  it('getLines returns an array of Line objects', async () => {
    const lines = await DataService.getLines()
    expect(Array.isArray(lines)).toBe(true)
    expect(lines.length).toBeGreaterThan(0)
    expect(lines[0]).toHaveProperty('id')
    expect(lines[0]).toHaveProperty('name')
    expect(lines[0]).toHaveProperty('type')
  })

  it('getStopsForLine returns stops for a known line', async () => {
    const stops = await DataService.getStopsForLine('1')
    expect(stops.length).toBeGreaterThan(0)
    expect(stops[0]).toHaveProperty('id')
    expect(stops[0]).toHaveProperty('lat')
    expect(stops[0]).toHaveProperty('lon')
  })

  it('getStopsForLine returns empty array for unknown line', async () => {
    const stops = await DataService.getStopsForLine('UNKNOWN')
    expect(stops).toEqual([])
  })

  it('getDepartures returns departures for line 1 over a known period', async () => {
    const deps = await DataService.getDepartures('1', '2026-04-21', '2026-04-27')
    expect(deps.length).toBeGreaterThan(0)
    deps.forEach(d => {
      expect(d).toHaveProperty('departureId')
      expect(d).toHaveProperty('lineId', '1')
      expect(d).toHaveProperty('scheduledTime')
    })
  })

  it('getDepartures returns empty for a date outside the mock range', async () => {
    const deps = await DataService.getDepartures('1', '2020-01-01', '2020-01-07')
    expect(deps).toEqual([])
  })
})
