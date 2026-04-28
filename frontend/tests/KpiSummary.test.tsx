import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KpiSummary } from '../src/components/KpiSummary'
import type { KpiSummary as KpiSummaryType } from '../src/types'

const baseKpi: KpiSummaryType = {
  scheduledDepartures: 100,
  actualDepartures: 95,
  cancelledDepartures: 2,
  onTimeCount: 80,
  delayedCount: 15,
  missingDataCount: 3,
  onTimePercent: 84.2,
  delayedPercent: 15.8,
  avgDelayMinutes: 4.5,
  confidence: 'Hög',
  confidenceNote: '',
}

describe('KpiSummary', () => {
  it('renders scheduled departures', () => {
    render(<KpiSummary kpi={baseKpi} />)
    expect(screen.getByText('100')).toBeTruthy()
  })

  it('renders on-time percentage', () => {
    render(<KpiSummary kpi={baseKpi} />)
    expect(screen.getByText('84.2%')).toBeTruthy()
  })

  it('does not render on-time card when onTimePercent is null', () => {
    render(<KpiSummary kpi={{ ...baseKpi, onTimePercent: null }} />)
    expect(screen.queryByText(/I tid/)).toBeNull()
  })

  it('does not render delayed card when delayedPercent is null', () => {
    render(<KpiSummary kpi={{ ...baseKpi, delayedPercent: null }} />)
    expect(screen.queryByText(/Försenade/)).toBeNull()
  })

  it('shows average delay in sub-label', () => {
    render(<KpiSummary kpi={baseKpi} />)
    expect(screen.getByText(/Snitt: 4.5 min/)).toBeTruthy()
  })
})
