import { Router, Request, Response, NextFunction } from 'express'
import { DataService } from '../services/data/DataService'
import { MetricsService } from '../services/metrics/MetricsService'
import { NarrativeService } from '../services/narrative/NarrativeService'
import type { Period, Report, StopReport } from '../models'

export const reportsRouter = Router()

const narrativeService = new NarrativeService()

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function parsePeriod(startDate: unknown, endDate: unknown): { period: Period } | { error: string; code: string } {
  if (typeof startDate !== 'string' || typeof endDate !== 'string') {
    return { error: 'startDate and endDate are required', code: 'INVALID_DATE' }
  }

  const ISO_RE = /^\d{4}-\d{2}-\d{2}$/
  if (!ISO_RE.test(startDate) || !ISO_RE.test(endDate)) {
    return { error: 'Dates must be in YYYY-MM-DD format', code: 'INVALID_DATE' }
  }

  const start = new Date(startDate + 'T00:00:00Z')
  const end = new Date(endDate + 'T00:00:00Z')

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: 'Invalid date value', code: 'INVALID_DATE' }
  }

  if (end < start) {
    return { error: 'endDate must be on or after startDate', code: 'END_BEFORE_START' }
  }

  const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  if (diffDays > 31) {
    return { error: 'Period may not exceed 31 days', code: 'PERIOD_TOO_LONG' }
  }

  const granularity = diffDays === 1 ? 'hourly' : diffDays <= 7 ? 'daily' : 'weekly'

  return {
    period: {
      start: startDate,
      end: endDate,
      preset: 'custom',
      granularity,
    },
  }
}

// ---------------------------------------------------------------------------
// GET /api/lines/:lineId/report
// ---------------------------------------------------------------------------

reportsRouter.get('/:lineId/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lineId } = req.params
    const parsed = parsePeriod(req.query.startDate, req.query.endDate)
    if ('error' in parsed) {
      res.status(400).json(parsed)
      return
    }
    const { period } = parsed

    const lines = await DataService.getLines()
    const line = lines.find(l => l.id === lineId)
    if (!line) {
      res.status(404).json({ error: `Line ${lineId} not found`, code: 'LINE_NOT_FOUND' })
      return
    }

    const departures = await DataService.getDepartures(lineId, period.start, period.end)
    const kpi = MetricsService.computeKpi(departures)
    const trend = MetricsService.computeTrend(departures, period)
    const timeOfDay = MetricsService.computeTimeOfDay(departures)

    // Stop-level aggregations
    const stops = await DataService.getStopsForLine(lineId)
    const stopReports: StopReport[] = stops.map(stop => {
      const stopDeps = departures.filter(d => d.stopId === stop.id)
      return {
        stop,
        kpi: MetricsService.computeKpi(stopDeps),
        trend: MetricsService.computeTrend(stopDeps, period),
        timeOfDay: MetricsService.computeTimeOfDay(stopDeps),
      }
    })

    const periodDescription = `${period.start} – ${period.end}`

    // T056: cap narrative generation at 8 s; return partial report on timeout
    let narrative: string | null = null
    let narrativeTimedOut = false
    const NARRATIVE_TIMEOUT_MS = 8_000
    const narrativeTimeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), NARRATIVE_TIMEOUT_MS)
    )
    const narrativeResult = await Promise.race([
      narrativeService.generate(line.name, periodDescription, kpi, timeOfDay),
      narrativeTimeout,
    ])
    if (narrativeResult === null && process.env.ANTHROPIC_API_KEY) {
      narrativeTimedOut = true
    } else {
      narrative = narrativeResult
    }

    const report: Report = {
      line,
      period,
      kpi,
      trend,
      timeOfDay,
      narrative,
      ...(narrativeTimedOut && { narrativeTimedOut: true }),
      stops: stopReports,
      generatedAt: new Date().toISOString(),
    }

    res.json(report)
  } catch (err) {
    next(err)
  }
})

// ---------------------------------------------------------------------------
// GET /api/lines/:lineId/stops
// ---------------------------------------------------------------------------

reportsRouter.get('/:lineId/stops', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lineId } = req.params
    const lines = await DataService.getLines()
    if (!lines.find(l => l.id === lineId)) {
      res.status(404).json({ error: `Line ${lineId} not found`, code: 'LINE_NOT_FOUND' })
      return
    }
    const stops = await DataService.getStopsForLine(lineId)
    res.json(stops)
  } catch (err) {
    next(err)
  }
})

// ---------------------------------------------------------------------------
// GET /api/lines/:lineId/stops/:stopId/report
// ---------------------------------------------------------------------------

reportsRouter.get('/:lineId/stops/:stopId/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lineId, stopId } = req.params
    const parsed = parsePeriod(req.query.startDate, req.query.endDate)
    if ('error' in parsed) {
      res.status(400).json(parsed)
      return
    }
    const { period } = parsed

    const lines = await DataService.getLines()
    if (!lines.find(l => l.id === lineId)) {
      res.status(404).json({ error: `Line ${lineId} not found`, code: 'LINE_NOT_FOUND' })
      return
    }

    const stops = await DataService.getStopsForLine(lineId)
    const stop = stops.find(s => s.id === stopId)
    if (!stop) {
      res.status(404).json({ error: `Stop ${stopId} not found on line ${lineId}`, code: 'STOP_NOT_FOUND' })
      return
    }

    const departures = await DataService.getDepartures(lineId, period.start, period.end)
    const stopDeps = departures.filter(d => d.stopId === stopId)

    if (stopDeps.length === 0) {
      res.status(404).json({ error: 'No departures for this stop in the selected period', code: 'STOP_NO_DATA' })
      return
    }

    const stopReport: StopReport = {
      stop,
      kpi: MetricsService.computeKpi(stopDeps),
      trend: MetricsService.computeTrend(stopDeps, period),
      timeOfDay: MetricsService.computeTimeOfDay(stopDeps),
    }

    res.json(stopReport)
  } catch (err) {
    next(err)
  }
})
