import { describe, it, expect } from 'vitest'
import { MetricsService } from '../../src/services/metrics/MetricsService'
import type { Departure, Period } from '../../src/models'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dep(overrides: Partial<Departure> = {}): Departure {
  return {
    departureId: 'test-001',
    lineId: '1',
    stopId: '740000001',
    scheduledTime: '2026-04-21T08:00:00Z',
    actualTime: '2026-04-21T08:00:00Z',
    cancelled: false,
    delayMinutes: 0,
    ...overrides,
  }
}

const PERIOD_DAILY: Period = {
  start: '2026-04-21',
  end: '2026-04-27',
  preset: 'last_week',
  granularity: 'daily',
}

const PERIOD_HOURLY: Period = {
  start: '2026-04-21',
  end: '2026-04-21',
  preset: 'yesterday',
  granularity: 'hourly',
}

const PERIOD_WEEKLY: Period = {
  start: '2026-04-01',
  end: '2026-04-28',
  preset: 'custom',
  granularity: 'weekly',
}

// ---------------------------------------------------------------------------
// computeKpi
// ---------------------------------------------------------------------------

describe('MetricsService.computeKpi', () => {
  it('returns all zeros for empty departure list', () => {
    const kpi = MetricsService.computeKpi([])
    expect(kpi.scheduledDepartures).toBe(0)
    expect(kpi.onTimePercent).toBeNull()
    expect(kpi.delayedPercent).toBeNull()
    expect(kpi.avgDelayMinutes).toBeNull()
  })

  it('counts on-time departures correctly', () => {
    const deps = [
      dep({ delayMinutes: 0, actualTime: '2026-04-21T08:00:00Z' }),
      dep({ delayMinutes: -1, actualTime: '2026-04-21T07:59:00Z' }),
    ]
    const kpi = MetricsService.computeKpi(deps)
    expect(kpi.onTimeCount).toBe(2)
    expect(kpi.delayedCount).toBe(0)
    expect(kpi.onTimePercent).toBe(100)
    expect(kpi.delayedPercent).toBe(0)
    expect(kpi.avgDelayMinutes).toBeNull() // no delayed deps
  })

  it('counts delayed departures correctly', () => {
    const deps = [
      dep({ delayMinutes: 5, actualTime: '2026-04-21T08:05:00Z' }),
      dep({ delayMinutes: 10, actualTime: '2026-04-21T08:10:00Z' }),
      dep({ delayMinutes: 0, actualTime: '2026-04-21T08:00:00Z' }),
    ]
    const kpi = MetricsService.computeKpi(deps)
    expect(kpi.delayedCount).toBe(2)
    expect(kpi.onTimeCount).toBe(1)
    expect(kpi.delayedPercent).toBeCloseTo(66.67, 1)
    expect(kpi.avgDelayMinutes).toBeCloseTo(7.5, 1)
  })

  it('treats null actualTime (not cancelled) as missing data — never zero', () => {
    const deps = [
      dep({ actualTime: null, cancelled: false, delayMinutes: null }),
    ]
    const kpi = MetricsService.computeKpi(deps)
    expect(kpi.missingDataCount).toBe(1)
    expect(kpi.onTimePercent).toBeNull()
    expect(kpi.delayedPercent).toBeNull()
  })

  it('counts cancelled departures separately', () => {
    const deps = [
      dep({ cancelled: true, actualTime: null, delayMinutes: null }),
      dep({ delayMinutes: 0 }),
    ]
    const kpi = MetricsService.computeKpi(deps)
    expect(kpi.cancelledDepartures).toBe(1)
    expect(kpi.scheduledDepartures).toBe(2)
  })

  it('assigns Hög confidence when ≥95% of deps have actualTime or are cancelled', () => {
    // 19 on-time + 1 cancelled = 100% reported
    const deps = Array.from({ length: 19 }, () => dep())
    deps.push(dep({ cancelled: true, actualTime: null, delayMinutes: null }))
    const kpi = MetricsService.computeKpi(deps)
    expect(kpi.confidence).toBe('Hög')
  })

  it('assigns Medium confidence when 70–94% reported', () => {
    const deps = [
      ...Array.from({ length: 8 }, () => dep()),
      dep({ actualTime: null, cancelled: false, delayMinutes: null }),
      dep({ actualTime: null, cancelled: false, delayMinutes: null }),
    ]
    // 8/10 = 80% → Medium
    const kpi = MetricsService.computeKpi(deps)
    expect(kpi.confidence).toBe('Medium')
  })

  it('assigns Låg confidence when <70% reported', () => {
    const deps = [
      dep(),
      dep(),
      dep({ actualTime: null, cancelled: false, delayMinutes: null }),
      dep({ actualTime: null, cancelled: false, delayMinutes: null }),
      dep({ actualTime: null, cancelled: false, delayMinutes: null }),
    ]
    // 2/5 = 40% → Låg
    const kpi = MetricsService.computeKpi(deps)
    expect(kpi.confidence).toBe('Låg')
  })
})

// ---------------------------------------------------------------------------
// computeTrend
// ---------------------------------------------------------------------------

describe('MetricsService.computeTrend', () => {
  it('returns one point per day for a daily-granularity period', () => {
    const deps = [
      dep({ scheduledTime: '2026-04-21T08:00:00Z', delayMinutes: 5 }),
      dep({ scheduledTime: '2026-04-22T08:00:00Z', delayMinutes: 0 }),
    ]
    const trend = MetricsService.computeTrend(deps, PERIOD_DAILY)
    expect(trend.length).toBe(7) // 21–27 April
    expect(trend[0].label).toBe('2026-04-21')
    expect(trend[1].label).toBe('2026-04-22')
  })

  it('returns null delayedPercent for days with no data — not zero', () => {
    const deps = [dep({ scheduledTime: '2026-04-21T08:00:00Z', delayMinutes: 0 })]
    const trend = MetricsService.computeTrend(deps, PERIOD_DAILY)
    // Day 2026-04-22 has no departures → null
    const day22 = trend.find(t => t.label === '2026-04-22')
    expect(day22?.delayedPercent).toBeNull()
  })

  it('returns hourly buckets for a single-day (hourly) period', () => {
    const trend = MetricsService.computeTrend([], PERIOD_HOURLY)
    // 05:00 – 23:00 = 19 buckets
    expect(trend.length).toBe(19)
    expect(trend[0].label).toBe('05:00')
    expect(trend[trend.length - 1].label).toBe('23:00')
  })

  it('returns weekly buckets for an 8–31 day period', () => {
    const deps = [dep({ scheduledTime: '2026-04-01T08:00:00Z', delayMinutes: 3 })]
    const trend = MetricsService.computeTrend(deps, PERIOD_WEEKLY)
    expect(trend.length).toBeGreaterThanOrEqual(4)
    expect(trend[0].label).toMatch(/^Vecka \d+/)
  })
})

// ---------------------------------------------------------------------------
// computeTimeOfDay
// ---------------------------------------------------------------------------

describe('MetricsService.computeTimeOfDay', () => {
  it('covers only hours 5–23 (operational window)', () => {
    const buckets = MetricsService.computeTimeOfDay([])
    expect(buckets.length).toBe(19) // hours 5..23 inclusive
    expect(buckets[0].hour).toBe(5)
    expect(buckets[buckets.length - 1].hour).toBe(23)
  })

  it('marks statisticallyLimited true when departureCount < 3', () => {
    const deps = [
      dep({ scheduledTime: '2026-04-21T08:00:00Z', delayMinutes: 5 }),
      dep({ scheduledTime: '2026-04-21T08:30:00Z', delayMinutes: 3 }),
    ]
    const buckets = MetricsService.computeTimeOfDay(deps)
    const hour8 = buckets.find(b => b.hour === 8)!
    expect(hour8.departureCount).toBe(2)
    expect(hour8.statisticallyLimited).toBe(true)
  })

  it('does not mark statisticallyLimited when departureCount >= 3', () => {
    const deps = [
      dep({ scheduledTime: '2026-04-21T08:00:00Z', delayMinutes: 5 }),
      dep({ scheduledTime: '2026-04-21T08:15:00Z', delayMinutes: 0 }),
      dep({ scheduledTime: '2026-04-21T08:30:00Z', delayMinutes: 0 }),
    ]
    const buckets = MetricsService.computeTimeOfDay(deps)
    const hour8 = buckets.find(b => b.hour === 8)!
    expect(hour8.statisticallyLimited).toBe(false)
  })

  it('returns null delayedPercent for empty hours — not zero', () => {
    const buckets = MetricsService.computeTimeOfDay([])
    expect(buckets.every(b => b.delayedPercent === null)).toBe(true)
  })
})
