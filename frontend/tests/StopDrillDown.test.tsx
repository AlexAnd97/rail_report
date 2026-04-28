import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StopDrillDown } from '../src/components/StopDrillDown'
import type { StopReport, Line } from '../src/types'

const mockLine: Line = { id: '1', name: 'Linje 1', type: 'stadsbuss' }

function makeStop(id: string, name: string): StopReport {
  return {
    stop: { id, name, lat: 59.86, lon: 17.64 },
    kpi: {
      scheduledDepartures: 10,
      actualDepartures: 9,
      cancelledDepartures: 0,
      onTimeCount: 8,
      delayedCount: 1,
      missingDataCount: 1,
      onTimePercent: 88.9,
      delayedPercent: 11.1,
      avgDelayMinutes: 3.2,
      confidence: 'Hög',
      confidenceNote: '',
    },
    trend: [],
    timeOfDay: [],
  }
}

// Mock the api module so tests don't make real HTTP calls
vi.mock('../src/services/api', () => ({
  api: {
    getStopReport: vi.fn().mockResolvedValue(makeStop('s2', 'Stop Two')),
  },
}))

describe('StopDrillDown', () => {
  it('renders stop names', () => {
    render(
      <StopDrillDown
        stops={[makeStop('s1', 'Uppsala C'), makeStop('s2', 'Gottsunda')]}
        line={mockLine}
        startDate="2026-04-21"
        endDate="2026-04-27"
      />
    )
    expect(screen.getByText('Uppsala C')).toBeTruthy()
    expect(screen.getByText('Gottsunda')).toBeTruthy()
  })
})
