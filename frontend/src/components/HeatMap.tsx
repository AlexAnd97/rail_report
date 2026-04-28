import React, { useEffect, useRef } from 'react'
import type { StopReport } from '../types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Uppsala bounding box centre
const UPPSALA_LAT = 59.8586
const UPPSALA_LON = 17.6389
const DEFAULT_ZOOM = 12

interface Props {
  stops: StopReport[]
}

function delayColor(pct: number | null): string {
  if (pct === null) return '#9ca3af' // grey — insufficient data
  if (pct >= 30) return '#dc2626'    // red
  if (pct >= 15) return '#d97706'    // amber
  return '#16a34a'                   // green
}

export function HeatMap({ stops }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    if (leafletRef.current) {
      leafletRef.current.remove()
      leafletRef.current = null
    }

    const map = L.map(mapRef.current).setView([UPPSALA_LAT, UPPSALA_LON], DEFAULT_ZOOM)
    leafletRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    for (const s of stops) {
      const { lat, lon } = s.stop
      if (lat === null || lon === null) continue

      const pct = s.kpi.delayedPercent
      const color = delayColor(pct)
      const tooltip = pct !== null
        ? `${s.stop.name}\nFörsenade: ${pct.toFixed(1)}%`
        : `${s.stop.name}\nOtillräcklig data`

      L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: color,
        color: pct === null ? '#6b7280' : color,
        weight: pct === null ? 2 : 1,
        dashArray: pct === null ? '4 2' : undefined,
        fillOpacity: 0.85,
      })
        .addTo(map)
        .bindTooltip(tooltip)
    }

    return () => {
      map.remove()
      leafletRef.current = null
    }
  }, [stops])

  return (
    <div className="ul-card">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Karta — förseningsintensitet per hållplats</h2>
      <div ref={mapRef} className="h-96 rounded-xl" />
    </div>
  )
}
