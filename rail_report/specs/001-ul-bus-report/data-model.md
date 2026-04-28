# Data Model: UL Bus Operations Report

**Phase**: Phase 1 — Design  
**Plan**: [plan.md](plan.md) | **Research**: [research.md](research.md)

All types defined in `backend/src/models/index.ts` and imported by the frontend.

---

## Core Entities (Source Data)

### `Line`
A UL bus route.

```typescript
interface Line {
  id: string              // KoDa routeId, e.g. "1", "801"
  name: string            // Display name, e.g. "Linje 1 Uppsala C – Gottsunda"
  type: 'stadsbuss' | 'regionbuss'
}
```

---

### `Stop`
A physical bus stop on a line.

```typescript
interface Stop {
  id: string              // KoDa stopId
  name: string            // Display name, e.g. "Uppsala C"
  lat: number             // WGS84 latitude
  lon: number             // WGS84 longitude
}
```

**Validation**: stops without `lat`/`lon` are excluded from the heat map but included in the tabular drill-down.

---

### `Departure`
A single scheduled bus departure at a stop.

```typescript
interface Departure {
  departureId: string
  lineId: string
  stopId: string
  scheduledTime: Date
  actualTime: Date | null   // null = not reported (missing data, NOT on-time)
  cancelled: boolean
  delayMinutes: number | null  // derived: actualTime - scheduledTime; null if actualTime absent
}
```

**Derivation rules**:
- `delayMinutes` is computed during normalisation from KoDa data, not stored raw.
- A departure is **on-time** if `delayMinutes !== null && delayMinutes <= 0`.
- A departure is **delayed** if `delayMinutes !== null && delayMinutes > 0`.
- A departure is **missing data** if `actualTime === null && cancelled === false`.
- A departure is **cancelled** if `cancelled === true`.

---

### `Period`
A date range selected by the operator.

```typescript
interface Period {
  start: Date             // inclusive, start of day
  end: Date               // inclusive, end of day
  preset: 'yesterday' | 'last_week' | 'custom'
  granularity: 'hourly' | 'daily' | 'weekly'  // derived from period length
}
```

**Granularity derivation**:
- 1 day → `hourly`
- 2–7 days → `daily`
- 8–31 days → `weekly`

---

## Computed Types (Report Output)

### `KpiSummary`
The top-level KPI card data for a line or stop.

```typescript
interface KpiSummary {
  scheduledDepartures: number
  actualDepartures: number        // excludes cancelled
  cancelledDepartures: number
  onTimeCount: number
  delayedCount: number
  missingDataCount: number
  onTimePercent: number | null    // null if no actual departures
  delayedPercent: number | null
  avgDelayMinutes: number | null  // null if no delayed departures
  confidence: 'Hög' | 'Medium' | 'Låg'
  confidenceNote: string          // plain Swedish explanation if Medium or Låg
}
```

---

### `TrendPoint`
One data point in the delay trend time series.

```typescript
interface TrendPoint {
  label: string           // e.g. "2026-04-21", "08:00", "Vecka 17"
  delayedPercent: number | null   // null = no data for this bucket
  departureCount: number
}
```

---

### `TimeOfDayBucket`
One hourly bucket in the time-of-day breakdown.

```typescript
interface TimeOfDayBucket {
  hour: number            // 5–23 (operational window)
  label: string           // e.g. "05:00"
  delayedPercent: number | null
  departureCount: number
  statisticallyLimited: boolean   // true if departureCount < 3
}
```

---

### `StopReport`
Stop-level metrics, returned by the drill-down endpoint.

```typescript
interface StopReport {
  stop: Stop
  kpi: KpiSummary
  trend: TrendPoint[]
  timeOfDay: TimeOfDayBucket[]
}
```

---

### `Report`
The full output for a line + period selection.

```typescript
interface Report {
  line: Line
  period: Period
  kpi: KpiSummary
  trend: TrendPoint[]
  timeOfDay: TimeOfDayBucket[]
  narrative: string           // Swedish, 100–300 words
  stops: StopReport[]         // all stops on the line for the period
  generatedAt: Date
}
```

---

## Entity Relationships

```text
Line ──< Departure >── Stop
           │
           └── Period (filter applied at query time)

Report
 ├── Line
 ├── Period
 ├── KpiSummary          ← aggregated from Departures
 ├── TrendPoint[]        ← aggregated from Departures, bucketed by Period.granularity
 ├── TimeOfDayBucket[]   ← aggregated from Departures, bucketed by hour
 ├── narrative (string)  ← generated from KpiSummary by NarrativeService
 └── StopReport[]
      ├── Stop
      ├── KpiSummary     ← same aggregation, filtered to stop
      ├── TrendPoint[]
      └── TimeOfDayBucket[]
```

**Integrity constraint (SC-002)**: `sum(stop.kpi.scheduledDepartures for all stops) === line.kpi.scheduledDepartures` for the same line and period.

---

## Validation Rules

| Field | Rule |
|-------|------|
| `Period.end - Period.start` | ≤ 31 days (FR-003) |
| `Departure.delayMinutes` | If `actualTime` is null and `cancelled` is false → `null` (never `0`) |
| `KpiSummary.onTimePercent` | Omitted (null) when `actualDepartures === 0` |
| `Stop.lat` / `Stop.lon` | Must be within Uppsala bounding box (59.7°–60.1°N, 17.4°–18.0°E) or excluded from heat map |
| `Report.narrative` | Length 100–300 words; truncated at last complete sentence if over limit |
| `TimeOfDayBucket.hour` | 5–23 only (05:00–23:00 operational window, FR-008) |
