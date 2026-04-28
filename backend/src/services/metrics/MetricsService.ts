import type { Departure, Period, KpiSummary, TrendPoint, TimeOfDayBucket, ConfidenceLevel } from '../../models'

export class MetricsService {
  // ---------------------------------------------------------------------------
  // computeKpi
  // ---------------------------------------------------------------------------
  static computeKpi(departures: Departure[]): KpiSummary {
    const scheduled = departures.length
    const cancelled = departures.filter(d => d.cancelled).length
    const missing = departures.filter(d => !d.cancelled && d.actualTime === null).length
    const actual = departures.filter(d => !d.cancelled && d.actualTime !== null)
    const onTime = actual.filter(d => (d.delayMinutes ?? 0) <= 0)
    const delayed = actual.filter(d => (d.delayMinutes ?? 0) > 0)

    const reportedCount = actual.length + cancelled
    const reportedRatio = scheduled > 0 ? reportedCount / scheduled : 1

    const confidence: ConfidenceLevel =
      reportedRatio >= 0.95 ? 'Hög' : reportedRatio >= 0.7 ? 'Medium' : 'Låg'

    const confidenceNote =
      confidence === 'Hög'
        ? ''
        : confidence === 'Medium'
          ? 'Data saknas för en del av perioden — resultaten är preliminära.'
          : 'Stor andel data saknas — resultaten bör tolkas med försiktighet.'

    const onTimePercent =
      scheduled > 0 && actual.length > 0
        ? (onTime.length / actual.length) * 100
        : null

    const delayedPercent =
      scheduled > 0 && actual.length > 0
        ? (delayed.length / actual.length) * 100
        : null

    const avgDelayMinutes =
      delayed.length > 0
        ? delayed.reduce((sum, d) => sum + (d.delayMinutes ?? 0), 0) / delayed.length
        : null

    return {
      scheduledDepartures: scheduled,
      actualDepartures: actual.length,
      cancelledDepartures: cancelled,
      onTimeCount: onTime.length,
      delayedCount: delayed.length,
      missingDataCount: missing,
      onTimePercent,
      delayedPercent,
      avgDelayMinutes,
      confidence,
      confidenceNote,
    }
  }

  // ---------------------------------------------------------------------------
  // computeTrend
  // ---------------------------------------------------------------------------
  static computeTrend(departures: Departure[], period: Period): TrendPoint[] {
    const { granularity } = period

    if (granularity === 'hourly') {
      return this._buildHourlyTrend(departures)
    } else if (granularity === 'daily') {
      return this._buildDailyTrend(departures, period)
    } else {
      return this._buildWeeklyTrend(departures, period)
    }
  }

  private static _buildHourlyTrend(departures: Departure[]): TrendPoint[] {
    const points: TrendPoint[] = []
    for (let h = 5; h <= 23; h++) {
      const label = `${String(h).padStart(2, '0')}:00`
      const bucket = departures.filter(d => {
        const hour = new Date(d.scheduledTime).getUTCHours()
        return hour === h
      })
      points.push(this._trendPoint(label, bucket))
    }
    return points
  }

  private static _buildDailyTrend(departures: Departure[], period: Period): TrendPoint[] {
    const points: TrendPoint[] = []
    const cursor = new Date(period.start + 'T00:00:00Z')
    const end = new Date(period.end + 'T00:00:00Z')

    while (cursor <= end) {
      const label = cursor.toISOString().slice(0, 10)
      const bucket = departures.filter(d => d.scheduledTime.startsWith(label))
      points.push(this._trendPoint(label, bucket))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    return points
  }

  private static _buildWeeklyTrend(departures: Departure[], period: Period): TrendPoint[] {
    // Group by ISO week number
    const weekMap = new Map<string, Departure[]>()

    for (const d of departures) {
      const key = this._isoWeekLabel(new Date(d.scheduledTime))
      const existing = weekMap.get(key) ?? []
      existing.push(d)
      weekMap.set(key, existing)
    }

    // Build week range from period
    const cursor = new Date(period.start + 'T00:00:00Z')
    const end = new Date(period.end + 'T00:00:00Z')
    const seen = new Set<string>()
    const points: TrendPoint[] = []

    while (cursor <= end) {
      const label = this._isoWeekLabel(cursor)
      if (!seen.has(label)) {
        seen.add(label)
        const bucket = weekMap.get(label) ?? []
        points.push(this._trendPoint(label, bucket))
      }
      cursor.setUTCDate(cursor.getUTCDate() + 7)
    }
    return points
  }

  private static _trendPoint(label: string, bucket: Departure[]): TrendPoint {
    if (bucket.length === 0) {
      return { label, delayedPercent: null, departureCount: 0 }
    }
    const actual = bucket.filter(d => !d.cancelled && d.actualTime !== null)
    const delayed = actual.filter(d => (d.delayMinutes ?? 0) > 0)
    const delayedPercent = actual.length > 0 ? (delayed.length / actual.length) * 100 : null
    return { label, delayedPercent, departureCount: bucket.length }
  }

  private static _isoWeekLabel(date: Date): string {
    // Returns e.g. "Vecka 17"
    const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `Vecka ${weekNo}`
  }

  // ---------------------------------------------------------------------------
  // computeTimeOfDay
  // ---------------------------------------------------------------------------
  static computeTimeOfDay(departures: Departure[]): TimeOfDayBucket[] {
    const buckets: TimeOfDayBucket[] = []

    for (let h = 5; h <= 23; h++) {
      const label = `${String(h).padStart(2, '0')}:00`
      const bucket = departures.filter(d => new Date(d.scheduledTime).getUTCHours() === h)
      const actual = bucket.filter(d => !d.cancelled && d.actualTime !== null)
      const delayed = actual.filter(d => (d.delayMinutes ?? 0) > 0)

      buckets.push({
        hour: h,
        label,
        delayedPercent: actual.length > 0 ? (delayed.length / actual.length) * 100 : null,
        departureCount: bucket.length,
        statisticallyLimited: bucket.length > 0 && bucket.length < 3,
      })
    }

    return buckets
  }
}
