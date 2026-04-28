/**
 * KoDa (Kollektivtrafikens Dataförvaltning) API client.
 *
 * Normalises KoDa historical departure responses to the shared internal types.
 * Activated when USE_REAL_KODA=true.
 *
 * Environment variables required:
 *   KODA_API_KEY   — API key for the KoDa data portal
 *   KODA_BASE_URL  — Base URL (default: https://api.koda.trafiklab.se/KoDa/api/v2)
 */

import type { Line, Stop, Departure } from '../../models'

const BASE_URL =
  process.env.KODA_BASE_URL ?? 'https://api.koda.trafiklab.se/KoDa/api/v2'

// ---------------------------------------------------------------------------
// Raw KoDa response shapes (subset of fields we use)
// ---------------------------------------------------------------------------

interface KodaLine {
  routeId: string
  routeShortName: string
  routeType: number // 3 = bus
}

interface KodaStop {
  stopId: string
  stopName: string
  stopLat: number | null
  stopLon: number | null
  routeIds: string[]
}

interface KodaDeparture {
  tripId: string
  routeId: string
  stopId: string
  scheduledDeparture: string // ISO 8601
  actualDeparture: string | null
  cancelled: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function kodaFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.KODA_API_KEY
  if (!apiKey) {
    throw new Error('KODA_API_KEY is not set')
  }

  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`KoDa API error ${res.status} for ${url}`)
  }

  return res.json() as Promise<T>
}

function routeTypeToLineType(routeType: number): string {
  // GTFS route_type: 3 = bus
  return routeType === 3 ? 'stadsbuss' : 'regionbuss'
}

function deriveDelayMinutes(
  scheduled: string,
  actual: string | null,
  cancelled: boolean
): number | null {
  if (cancelled) return null
  if (!actual) return null
  const diffMs = new Date(actual).getTime() - new Date(scheduled).getTime()
  return diffMs / 60_000
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class KodaClient {
  static async getLines(): Promise<Line[]> {
    const data = await kodaFetch<{ lines: KodaLine[] }>('/ul/lines')
    return data.lines.map(l => ({
      id: l.routeId,
      name: `Linje ${l.routeShortName}`,
      type: routeTypeToLineType(l.routeType) as Line['type'],
    }))
  }

  static async getStops(lineId: string): Promise<Stop[]> {
    const data = await kodaFetch<{ stops: KodaStop[] }>(`/ul/stops?routeId=${lineId}`)
    return data.stops.map(s => ({
      id: s.stopId,
      name: s.stopName,
      lat: s.stopLat,
      lon: s.stopLon,
    }))
  }

  static async getDepartures(
    lineId: string,
    startDate: string,
    endDate: string
  ): Promise<Departure[]> {
    const data = await kodaFetch<{ departures: KodaDeparture[] }>(
      `/ul/departures?routeId=${lineId}&startDate=${startDate}&endDate=${endDate}`
    )
    return data.departures.map(d => ({
      departureId: d.tripId + '_' + d.stopId + '_' + d.scheduledDeparture,
      lineId: d.routeId,
      stopId: d.stopId,
      scheduledTime: d.scheduledDeparture,
      actualTime: d.actualDeparture,
      cancelled: d.cancelled,
      delayMinutes: deriveDelayMinutes(
        d.scheduledDeparture,
        d.actualDeparture,
        d.cancelled
      ),
    }))
  }
}
