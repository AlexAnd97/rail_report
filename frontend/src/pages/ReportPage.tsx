import React, { useState, useCallback, Component, type ReactNode } from 'react'
import type { Line, Report } from '../types'
import { api } from '../services/api'
import { LineSelector } from '../components/LineSelector'
import { PeriodPicker, type DateRange } from '../components/PeriodPicker'
import { KpiSummary } from '../components/KpiSummary'
import { ConfidenceIndicator } from '../components/ConfidenceIndicator'
import { DelayTrendChart } from '../components/DelayTrendChart'
import { TimeOfDayChart } from '../components/TimeOfDayChart'
import { StopDrillDown } from '../components/StopDrillDown'
import { HeatMap } from '../components/HeatMap'
import { NarrativeSummary } from '../components/NarrativeSummary'

// ---------------------------------------------------------------------------
// T055: Global error boundary
// ---------------------------------------------------------------------------

interface EBState { hasError: boolean }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false }
  static getDerivedStateFromError(): EBState { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Ett oväntat fel uppstod. Ladda om sidan för att försöka igen.
        </div>
      )
    }
    return this.props.children
  }
}

function getPresetRange(): DateRange {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setUTCDate(end.getUTCDate() - 1)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

export function ReportPage() {
  const [selectedLine, setSelectedLine] = useState<Line | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>(getPresetRange())
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(
    async (line: Line, range: DateRange) => {
      setLoading(true)
      setError(null)
      setReport(null)
      try {
        const r = await api.getReport(line.id, range.startDate, range.endDate)
        setReport(r)
      } catch (e: unknown) {
        const err = e as Error & { code?: string }
        if (err.code === 'PERIOD_TOO_LONG') {
          setError('Perioden får inte överstiga 31 dagar.')
        } else {
          setError(err.message ?? 'Ett fel uppstod.')
        }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  function handleLineSelect(line: Line) {
    setSelectedLine(line)
    fetchReport(line, dateRange)
  }

  function handlePeriodChange(range: DateRange) {
    setDateRange(range)
    if (selectedLine) fetchReport(selectedLine, range)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* UL Header bar */}
      <header className="bg-ul-yellow px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span className="text-2xl font-bold tracking-tight text-black">UL</span>
          <span className="text-sm font-medium text-black/70">Bussrapport</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <LineSelector onSelect={handleLineSelect} selectedLineId={selectedLine?.id} />
          <PeriodPicker onChange={handlePeriodChange} />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Hämtar rapport…
          </div>
        )}

        {report && !loading && report.kpi.scheduledDepartures === 0 && (
          <p className="text-gray-500 text-sm" role="status">
            Inga avgångar under vald period.
          </p>
        )}

        {report && !loading && report.kpi.scheduledDepartures > 0 && (
          <ErrorBoundary>
            <div className="flex flex-col gap-6">
              <ConfidenceIndicator
                confidence={report.kpi.confidence}
                note={report.kpi.confidenceNote}
              />
              <KpiSummary kpi={report.kpi} />
              {report.trend && report.trend.length > 0 && (
                <DelayTrendChart trend={report.trend} />
              )}
              {report.timeOfDay && report.timeOfDay.length > 0 && (
                <TimeOfDayChart buckets={report.timeOfDay} />
              )}
              {report.stops && report.stops.length > 0 && selectedLine && (
                <>
                  <StopDrillDown
                    stops={report.stops}
                    line={selectedLine}
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                  />
                  <HeatMap stops={report.stops} />
                </>
              )}
              <NarrativeSummary narrative={report.narrative} />
            </div>
          </ErrorBoundary>
        )}

        {!report && !loading && !error && selectedLine && (
          <p className="text-gray-400 text-sm">Inga data för vald period.</p>
        )}
      </main>
    </div>
  )
}
