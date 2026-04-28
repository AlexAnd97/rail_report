# API Contract: UL Bus Operations Report

**Phase**: Phase 1 — Design  
**Plan**: [plan.md](../plan.md) | **Data Model**: [data-model.md](../data-model.md)

Base URL (local dev): `http://localhost:3001/api`

All responses are `application/json`. All dates are ISO 8601 strings. Errors follow the shape `{ "error": string, "code": string }`.

---

## GET /api/lines

Returns all available UL bus lines.

**Response 200**
```json
[
  { "id": "1",   "name": "Linje 1 Uppsala C – Gottsunda", "type": "stadsbuss" },
  { "id": "801", "name": "Linje 801 Uppsala C – Knivsta",  "type": "regionbuss" }
]
```

---

## GET /api/lines/:lineId/report

Generates a full report for a line and period.

**Query parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | `YYYY-MM-DD` | Yes | Inclusive start of period |
| `endDate` | `YYYY-MM-DD` | Yes | Inclusive end of period |

**Validation errors**

| Code | Condition |
|------|-----------|
| `PERIOD_TOO_LONG` | `endDate - startDate` > 31 days |
| `INVALID_DATE` | Either date is not a valid calendar date |
| `END_BEFORE_START` | `endDate` < `startDate` |
| `LINE_NOT_FOUND` | `:lineId` does not exist in the data source |

**Response 200** — `Report` object (see data-model.md)
```json
{
  "line": { "id": "1", "name": "Linje 1 Uppsala C – Gottsunda", "type": "stadsbuss" },
  "period": {
    "start": "2026-04-21T00:00:00Z",
    "end":   "2026-04-27T23:59:59Z",
    "preset": "last_week",
    "granularity": "daily"
  },
  "kpi": {
    "scheduledDepartures": 420,
    "actualDepartures": 415,
    "cancelledDepartures": 3,
    "onTimeCount": 312,
    "delayedCount": 103,
    "missingDataCount": 2,
    "onTimePercent": 75.2,
    "delayedPercent": 24.8,
    "avgDelayMinutes": 4.1,
    "confidence": "Hög",
    "confidenceNote": ""
  },
  "trend": [
    { "label": "2026-04-21", "delayedPercent": 22.1, "departureCount": 60 }
  ],
  "timeOfDay": [
    { "hour": 8, "label": "08:00", "delayedPercent": 38.5, "departureCount": 52, "statisticallyLimited": false }
  ],
  "narrative": "Linje 1 hade en utmanande vecka...",
  "stops": [ /* StopReport[] — see stop endpoint below */ ],
  "generatedAt": "2026-04-28T09:12:34Z"
}
```

**Performance**: Response MUST be delivered within 10 seconds (FR-016, SC-007).

---

## GET /api/lines/:lineId/stops

Returns all stops for a line (name, id, coordinates).

**Response 200**
```json
[
  { "id": "740000001", "name": "Uppsala C", "lat": 59.8586, "lon": 17.6389 },
  { "id": "740025160", "name": "Gottsunda C", "lat": 59.8172, "lon": 17.6018 }
]
```

---

## GET /api/lines/:lineId/stops/:stopId/report

Returns KPI, trend, and time-of-day metrics scoped to a single stop.

**Query parameters**: same as line report (`startDate`, `endDate`).

**Validation errors**: same codes as line report, plus:

| Code | Condition |
|------|-----------|
| `STOP_NOT_FOUND` | `:stopId` is not a stop on `:lineId` for the given period |
| `STOP_NO_DATA` | Stop exists but has zero departures in the period |

**Response 200** — `StopReport` object
```json
{
  "stop": { "id": "740000001", "name": "Uppsala C", "lat": 59.8586, "lon": 17.6389 },
  "kpi": { /* KpiSummary */ },
  "trend": [ /* TrendPoint[] */ ],
  "timeOfDay": [ /* TimeOfDayBucket[] */ ]
}
```

**Consistency guarantee (SC-002)**: The sum of `kpi.scheduledDepartures` across all stops for the same line and period equals the line-level `kpi.scheduledDepartures`.
