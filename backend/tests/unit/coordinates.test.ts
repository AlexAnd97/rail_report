import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import type { Stop } from '../../src/models'

// Uppsala bounding box (from data-model.md)
const LAT_MIN = 59.7, LAT_MAX = 60.1
const LON_MIN = 17.4, LON_MAX = 18.0

const MOCK_DIR = path.join(__dirname, '../../data/mock')

describe('T057: Mock stop coordinates within Uppsala bounding box', () => {
  it('all stops with coordinates are within Uppsala bounds', () => {
    const raw = fs.readFileSync(path.join(MOCK_DIR, 'stops.json'), 'utf-8')
    const stops = JSON.parse(raw) as Array<Stop & { lineIds: string[] }>

    const outOfBounds = stops.filter(s => {
      if (s.lat === null || s.lon === null) return false
      return s.lat < LAT_MIN || s.lat > LAT_MAX || s.lon < LON_MIN || s.lon > LON_MAX
    })

    if (outOfBounds.length > 0) {
      console.error('Stops out of Uppsala bounds:', outOfBounds.map(s => s.name))
    }
    expect(outOfBounds).toHaveLength(0)
  })
})
