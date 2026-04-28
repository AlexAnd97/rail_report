/**
 * Generates 14-day mock departure fixtures for all 6 UL lines.
 * Run with: npx ts-node backend/scripts/generate-mock-departures.ts
 * Output: backend/data/mock/departures/
 *
 * Covers all test cases:
 *  - on-time departures (delayMinutes <= 0)
 *  - delayed departures (delayMinutes > 0)
 *  - cancelled departures
 *  - missing actualTime (null) with cancelled=false  → missing data
 */

import * as fs from 'fs'
import * as path from 'path'

const OUT_DIR = path.join(__dirname, '../data/mock/departures')
fs.mkdirSync(OUT_DIR, { recursive: true })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUrbanSlots(): string[] {
  // 05:00–22:00, every 30 min = 34 slots
  const slots: string[] = []
  for (let h = 5; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

function buildRegionalSlots(): string[] {
  // 06:00–21:00, every 90 min = 12 slots
  const slots: string[] = []
  let minutes = 6 * 60
  while (minutes <= 21 * 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    minutes += 90
  }
  return slots
}

function addMinutes(timeStr: string, date: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const dt = new Date(`${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00Z`)
  dt.setMinutes(dt.getMinutes() + minutes)
  return dt.toISOString()
}

let idCounter = 1

function makeDeparture(
  lineId: string,
  stopId: string,
  date: string,
  slot: string,
  scenario: 'ontime' | 'delayed' | 'cancelled' | 'missing'
) {
  const departureId = `mock-${String(idCounter++).padStart(6,'0')}`
  const scheduledTime = `${date}T${slot}:00Z`

  let actualTime: string | null = null
  let cancelled = false
  let delayMinutes: number | null = null

  switch (scenario) {
    case 'ontime':
      actualTime = addMinutes(slot, date, 0)
      delayMinutes = 0
      break
    case 'delayed': {
      const delay = Math.floor(Math.random() * 15) + 2 // 2–16 min
      actualTime = addMinutes(slot, date, delay)
      delayMinutes = delay
      break
    }
    case 'cancelled':
      cancelled = true
      break
    case 'missing':
      // actualTime null, cancelled false → missing data, confidence penalty
      break
  }

  return { departureId, lineId, stopId, scheduledTime, actualTime, cancelled, delayMinutes }
}

// ---------------------------------------------------------------------------
// Line configuration
// ---------------------------------------------------------------------------

interface LineConfig {
  lineId: string
  stops: string[]
  slots: string[]
  rushHours: number[]
  rushDelayProb: number
  offPeakDelayProb: number
  cancelledProb: number
  missingProb: number
}

const URBAN_SLOTS = buildUrbanSlots()
const REGIONAL_SLOTS = buildRegionalSlots()
const URBAN_RUSH = [7, 8, 9, 16, 17, 18]

const LINE_CONFIGS: LineConfig[] = [
  {
    lineId: '1',
    stops: [
      '740000001', // Uppsala C
      '740025165', // Kungsängen
      '740025164', // Vaksala torg
      '740025160', // Gottsunda Centrum
    ],
    slots: URBAN_SLOTS,
    rushHours: URBAN_RUSH,
    rushDelayProb: 0.35,
    offPeakDelayProb: 0.12,
    cancelledProb: 0.03,
    missingProb: 0.005,
  },
  {
    lineId: '2',
    stops: [
      '740000001', // Uppsala C
      '740025168', // Flogsta
      '740025169', // Kronåsen
      '740025161', // Stenhagens Centrum
    ],
    slots: URBAN_SLOTS,
    rushHours: URBAN_RUSH,
    rushDelayProb: 0.35,
    offPeakDelayProb: 0.12,
    cancelledProb: 0.03,
    missingProb: 0.005,
  },
  {
    lineId: '4',
    stops: [
      '740000001', // Uppsala C
      '740025168', // Flogsta
      '740025162', // Eriksberg
      '740025165', // Kungsängen
    ],
    slots: URBAN_SLOTS,
    rushHours: URBAN_RUSH,
    rushDelayProb: 0.35,
    offPeakDelayProb: 0.12,
    cancelledProb: 0.03,
    missingProb: 0.005,
  },
  {
    lineId: '8',
    stops: [
      '740000001', // Uppsala C
      '740025164', // Vaksala torg
      '740025170', // Sala backe
      '740025163', // Sävja
    ],
    slots: URBAN_SLOTS,
    rushHours: URBAN_RUSH,
    rushDelayProb: 0.35,
    offPeakDelayProb: 0.12,
    cancelledProb: 0.03,
    missingProb: 0.005,
  },
  {
    lineId: '801',
    stops: [
      '740000001', // Uppsala C
      '740025171', // Alsike
      '740025166', // Resecentrum Knivsta
    ],
    slots: REGIONAL_SLOTS,
    rushHours: [7, 8, 16, 17],
    rushDelayProb: 0.20,
    offPeakDelayProb: 0.08,
    cancelledProb: 0.02,
    missingProb: 0.005,
  },
  {
    lineId: '811',
    stops: [
      '740000001', // Uppsala C
      '740025172', // Häggvik
      '740025167', // Resecentrum Bålsta
    ],
    slots: REGIONAL_SLOTS,
    rushHours: [7, 8, 16, 17],
    rushDelayProb: 0.20,
    offPeakDelayProb: 0.08,
    cancelledProb: 0.02,
    missingProb: 0.005,
  },
]

// ---------------------------------------------------------------------------
// Generate 14 days starting 2026-04-14
// ---------------------------------------------------------------------------

const BASE_DATE = new Date('2026-04-14')
let totalFiles = 0

for (const config of LINE_CONFIGS) {
  for (let day = 0; day < 14; day++) {
    const d = new Date(BASE_DATE)
    d.setDate(d.getDate() + day)
    const dateStr = d.toISOString().slice(0, 10)

    const departures = []

    for (const stopId of config.stops) {
      for (const slot of config.slots) {
        const hour = parseInt(slot.split(':')[0])
        const isRush = config.rushHours.includes(hour)

        const rand = Math.random()
        let scenario: 'ontime' | 'delayed' | 'cancelled' | 'missing'

        const delayProb = isRush ? config.rushDelayProb : config.offPeakDelayProb
        const cancelledCutoff = delayProb + config.cancelledProb
        const missingCutoff = cancelledCutoff + config.missingProb

        if (rand < delayProb) scenario = 'delayed'
        else if (rand < cancelledCutoff) scenario = 'cancelled'
        else if (rand < missingCutoff) scenario = 'missing'
        else scenario = 'ontime'

        departures.push(makeDeparture(config.lineId, stopId, dateStr, slot, scenario))
      }
    }

    const filename = path.join(OUT_DIR, `${config.lineId}-${dateStr}.json`)
    fs.writeFileSync(filename, JSON.stringify(departures, null, 2))
    console.log(`Written: ${filename} (${departures.length} departures)`)
    totalFiles++
  }
}

console.log(`\nDone. Generated ${LINE_CONFIGS.length} lines × 14 days = ${totalFiles} files`)

