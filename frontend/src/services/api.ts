import type { Line, Stop, Report, StopReport, ApiError } from '../types'

const BASE = '/api'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const err: ApiError = await res.json()
    throw Object.assign(new Error(err.error), { code: err.code })
  }
  return res.json() as Promise<T>
}

export const api = {
  getLines(): Promise<Line[]> {
    return get(`${BASE}/lines`)
  },

  getStops(lineId: string): Promise<Stop[]> {
    return get(`${BASE}/lines/${lineId}/stops`)
  },

  getReport(lineId: string, startDate: string, endDate: string): Promise<Report> {
    return get(`${BASE}/lines/${lineId}/report?startDate=${startDate}&endDate=${endDate}`)
  },

  getStopReport(lineId: string, stopId: string, startDate: string, endDate: string): Promise<StopReport> {
    return get(`${BASE}/lines/${lineId}/stops/${stopId}/report?startDate=${startDate}&endDate=${endDate}`)
  },
}
