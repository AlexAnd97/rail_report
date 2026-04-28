import * as fs from 'fs'
import * as path from 'path'
import type { Line, Stop, Departure } from '../../models'
import { KodaClient } from './KodaClient'

const MOCK_DIR = path.join(__dirname, '../../../data/mock')

export class DataService {
  static async getLines(): Promise<Line[]> {
    if (process.env.USE_REAL_KODA === 'true') {
      return KodaClient.getLines()
    }
    const raw = fs.readFileSync(path.join(MOCK_DIR, 'lines.json'), 'utf-8')
    return JSON.parse(raw) as Line[]
  }

  static async getStopsForLine(lineId: string): Promise<Stop[]> {
    if (process.env.USE_REAL_KODA === 'true') {
      return KodaClient.getStops(lineId)
    }
    const raw = fs.readFileSync(path.join(MOCK_DIR, 'stops.json'), 'utf-8')
    const all = JSON.parse(raw) as Array<Stop & { lineIds: string[] }>
    return all
      .filter(s => s.lineIds.includes(lineId))
      .map(({ lineIds: _lineIds, ...stop }) => stop)
  }

  static async getDepartures(lineId: string, startDate: string, endDate: string): Promise<Departure[]> {
    if (process.env.USE_REAL_KODA === 'true') {
      return KodaClient.getDepartures(lineId, startDate, endDate)
    }
    const result: Departure[] = []
    const cursor = new Date(startDate + 'T00:00:00Z')
    const end = new Date(endDate + 'T00:00:00Z')

    while (cursor <= end) {
      const dateStr = cursor.toISOString().slice(0, 10)
      const file = path.join(MOCK_DIR, 'departures', `${lineId}-${dateStr}.json`)
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8')
        result.push(...(JSON.parse(raw) as Departure[]))
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    return result
  }
}
