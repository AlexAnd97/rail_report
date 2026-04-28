import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HeatMap } from '../src/components/HeatMap'
import type { StopReport } from '../src/types'

// Leaflet requires a real DOM environment; we stub the map container.
vi.mock('leaflet', () => {
  const circleMarker = { addTo: () => circleMarker, bindTooltip: () => circleMarker }
  const tileLayer = { addTo: () => tileLayer }
  const map = {
    setView: () => map,
    remove: () => {},
  }
  return {
    default: {
      map: () => map,
      tileLayer: () => tileLayer,
      circleMarker: () => circleMarker,
    },
  }
})

function makeStop(id: string, lat: number | null, lon: number | null, delayed: number | null): StopReport {
  return {
    stop: { id, name: `Stop ${id}`, lat, lon },
    kpi: {
      scheduledDepartures: 10,
      actualDepartures: 9,
      cancelledDepartures: 0,
      onTimeCount: 8,
      delayedCount: 1,
      missingDataCount: 1,
      onTimePercent: 88,
      delayedPercent: delayed,
      avgDelayMinutes: 3,
      confidence: 'Hög',
      confidenceNote: '',
    },
    trend: [],
    timeOfDay: [],
  }
}

describe('HeatMap', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <HeatMap stops={[makeStop('1', 59.86, 17.64, 20), makeStop('2', null, null, null)]} />
    )
    expect(container).toBeTruthy()
  })
})
