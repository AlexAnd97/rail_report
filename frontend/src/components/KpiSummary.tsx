import React from 'react'
import type { KpiSummary as KpiSummaryType } from '../types'

interface Props {
  kpi: KpiSummaryType
}

interface CardProps {
  label: string
  value: string | null
  sub?: string
  badgeClass?: string
}

function KpiCard({ label, value, sub, badgeClass }: CardProps) {
  if (value === null) return null
  return (
    <div className="ul-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      {badgeClass
        ? <p className="mt-2"><span className={badgeClass}>{value}</span></p>
        : <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      }
      {sub && <p className="mt-1 text-sm text-gray-500">{sub}</p>}
    </div>
  )
}

function fmt(n: number | null, decimals = 1): string | null {
  if (n === null) return null
  return n.toFixed(decimals)
}

function onTimeBadge(pct: number | null): string | undefined {
  if (pct === null) return undefined
  if (pct >= 90) return 'ul-badge-green'
  if (pct >= 75) return 'ul-badge-amber'
  return 'ul-badge-red'
}

export function KpiSummary({ kpi }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <KpiCard
        label="Avgångar"
        value={String(kpi.scheduledDepartures)}
        sub={`Faktiska: ${kpi.actualDepartures} | Inställda: ${kpi.cancelledDepartures}`}
      />
      <KpiCard
        label="I tid"
        value={kpi.onTimePercent !== null ? `${fmt(kpi.onTimePercent)}%` : null}
        badgeClass={onTimeBadge(kpi.onTimePercent)}
      />
      <KpiCard
        label="Försenade"
        value={kpi.delayedPercent !== null ? `${fmt(kpi.delayedPercent)}%` : null}
        sub={kpi.avgDelayMinutes !== null ? `Snitt: ${fmt(kpi.avgDelayMinutes)} min` : undefined}
      />
      <KpiCard
        label="Inställda"
        value={String(kpi.cancelledDepartures)}
      />
    </div>
  )
}
