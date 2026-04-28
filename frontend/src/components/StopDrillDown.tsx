import React, { useState } from 'react'
import type { StopReport, Line } from '../types'
import { api } from '../services/api'
import { KpiSummary } from './KpiSummary'
import { ConfidenceIndicator } from './ConfidenceIndicator'

interface Props {
  stops: StopReport[]
  line: Line
  startDate: string
  endDate: string
}

export function StopDrillDown({ stops, line, startDate, endDate }: Props) {
  const [selectedStop, setSelectedStop] = useState<StopReport | null>(null)
  const [loadingStopId, setLoadingStopId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleStopSelect(stopId: string) {
    setError(null)
    setLoadingStopId(stopId)
    try {
      const report = await api.getStopReport(line.id, stopId, startDate, endDate)
      setSelectedStop(report)
    } catch (e: unknown) {
      const err = e as Error & { code?: string }
      if (err.code === 'STOP_NO_DATA') {
        setError('Inga avgångar för denna hållplats under vald period.')
        setSelectedStop(null)
      } else {
        setError(err.message)
      }
    } finally {
      setLoadingStopId(null)
    }
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Hållplatser</h2>
      <div className="divide-y divide-gray-100 rounded-xl ring-1 ring-black/5 overflow-hidden">
        {stops.map(s => (
          <button
            key={s.stop.id}
            onClick={() => handleStopSelect(s.stop.id)}
            className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors
              ${
                selectedStop?.stop.id === s.stop.id
                  ? 'bg-ul-yellow font-semibold text-black'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <span>{s.stop.name}</span>
            {loadingStopId === s.stop.id && (
              <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
      )}

      {selectedStop && !error && (
        <div className="mt-4 ul-card">
          <h3 className="mb-3 font-semibold text-gray-900">{selectedStop.stop.name}</h3>
          <ConfidenceIndicator
            confidence={selectedStop.kpi.confidence}
            note={selectedStop.kpi.confidenceNote}
          />
          <div className="mt-3">
            <KpiSummary kpi={selectedStop.kpi} />
          </div>
        </div>
      )}
    </div>
  )
}
