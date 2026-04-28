// Core domain entities and computed types for the UL Bus Operations Report.
// Single source of truth — imported by both backend services and frontend (via frontend/src/types/index.ts).

// ---------------------------------------------------------------------------
// Source entities
// ---------------------------------------------------------------------------

export interface Line {
  id: string
  name: string
  type: 'stadsbuss' | 'regionbuss'
}

export interface Stop {
  id: string
  name: string
  lat: number | null
  lon: number | null
}

export interface Departure {
  departureId: string
  lineId: string
  stopId: string
  scheduledTime: string   // ISO 8601
  actualTime: string | null
  cancelled: boolean
  delayMinutes: number | null  // derived; null when actualTime absent
}

export type PeriodPreset = 'yesterday' | 'last_week' | 'custom'
export type Granularity = 'hourly' | 'daily' | 'weekly'

export interface Period {
  start: string           // YYYY-MM-DD
  end: string             // YYYY-MM-DD
  preset: PeriodPreset
  granularity: Granularity
}

// ---------------------------------------------------------------------------
// Computed output types
// ---------------------------------------------------------------------------

export type ConfidenceLevel = 'Hög' | 'Medium' | 'Låg'

export interface KpiSummary {
  scheduledDepartures: number
  actualDepartures: number
  cancelledDepartures: number
  onTimeCount: number
  delayedCount: number
  missingDataCount: number
  onTimePercent: number | null
  delayedPercent: number | null
  avgDelayMinutes: number | null
  confidence: ConfidenceLevel
  confidenceNote: string
}

export interface TrendPoint {
  label: string
  delayedPercent: number | null
  departureCount: number
}

export interface TimeOfDayBucket {
  hour: number
  label: string
  delayedPercent: number | null
  departureCount: number
  statisticallyLimited: boolean
}

export interface StopReport {
  stop: Stop
  kpi: KpiSummary
  trend: TrendPoint[]
  timeOfDay: TimeOfDayBucket[]
}

export interface Report {
  line: Line
  period: Period
  kpi: KpiSummary
  trend: TrendPoint[]
  timeOfDay: TimeOfDayBucket[]
  narrative: string | null
  narrativeTimedOut?: boolean
  stops: StopReport[]
  generatedAt: string   // ISO 8601
}

// ---------------------------------------------------------------------------
// API error codes (matches contracts/api.md)
// ---------------------------------------------------------------------------

export type ApiErrorCode =
  | 'PERIOD_TOO_LONG'
  | 'INVALID_DATE'
  | 'END_BEFORE_START'
  | 'LINE_NOT_FOUND'
  | 'STOP_NOT_FOUND'
  | 'STOP_NO_DATA'

export interface ApiError {
  error: string
  code: ApiErrorCode
}
