# Research: UL Bus Operations Report

**Phase**: Phase 0 — Resolve unknowns before design  
**Plan**: [plan.md](plan.md)

---

## Decision 1: KoDa API Data Model

**Decision**: Use the KoDa (Kollektivtrafikens Dataförvaltning) GTFS-RT and historical departure endpoints. The relevant fields for UL bus departures are: `tripId`, `routeId` (maps to line), `stopId`, `scheduledDeparture` (ISO 8601), `actualDeparture` (ISO 8601 or null), `cancelled` (boolean). Delay is derived as `actualDeparture - scheduledDeparture` in minutes; null `actualDeparture` on a non-cancelled trip is treated as missing data (confidence penalty, not zero).

**Rationale**: These are the fields available in the KoDa historical API for UL. `routeId` maps to the operator's line number (e.g., "1", "801"). Stop coordinates come from the GTFS static feed (`stops.txt`: `stop_lat`, `stop_lon`).

**Alternatives considered**: GTFS-RT live feed — rejected; spec explicitly excludes real-time monitoring. Direct UL open data — rejected; KoDa is the mandated data source per spec assumptions.

**Mock fixture format**: Mock JSON mirrors the derived schema (post-KoDa normalisation), not the raw KoDa response. This decouples the mock from KoDa API changes and simplifies `MetricsService` testing.

---

## Decision 2: Feature Flag Strategy (`USE_REAL_KODA`)

**Decision**: `USE_REAL_KODA=true` environment variable switches the `DataService` from the mock loader to the live KoDa API client. The `DataService` interface is identical in both modes — all callers see the same typed return values. A `KODA_API_KEY` env var holds the credential when real mode is active.

**Rationale**: Allows the full development and test cycle to run offline without credentials. The flag is checked once at startup; no runtime branching in business logic.

**Alternatives considered**: Separate mock and real implementations selectable via dependency injection — viable but over-engineered for a PoC with two modes and one developer. Env var is simpler and conventional.

---

## Decision 3: Anthropic Claude API — Narrative Prompt Design

**Decision**: Send a structured JSON object containing all computed KPIs (line name, period, departure count, on-time %, delayed %, avg delay, peak delay hour, confidence level) as the data payload alongside a system prompt that instructs Claude to write a Swedish narrative of 100–300 words using only the provided numbers. The prompt explicitly prohibits fabricating statistics not present in the payload.

**Rationale**: Grounding the prompt to a pre-computed JSON object makes the narrative verifiably traceable (Constitution Principle I). Injecting raw data from untrusted sources into the prompt is an injection risk — the payload is constructed server-side from validated departure records only (see `DATA_QUALITY.md`).

**Security note**: Free-text fields from the KoDa API (e.g., stop names, destination strings) are sanitised before inclusion in any prompt payload. No operator-supplied free text reaches the Claude API.

**Alternatives considered**: Passing raw departure records to Claude for Claude to calculate KPIs — rejected; violates Constitution Principle I (no fabricated or interpolated statistics) and increases token cost and latency.

---

## Decision 4: Chart.js — Handling Missing Data Points

**Decision**: Use `spanGaps: false` on Chart.js line datasets. Missing data points are represented as `null` in the data array; Chart.js renders a visible gap rather than interpolating. A custom plugin adds a "no data" marker at gap positions.

**Rationale**: Spec acceptance scenario for US3 explicitly requires missing points to be "visually indicated (gap or marker) rather than plotted as zero". `spanGaps: false` is the idiomatic Chart.js approach.

**Alternatives considered**: Filtering out null points entirely — rejected; this hides the gap and misrepresents continuity.

---

## Decision 5: Leaflet Heat Map — Stop Colour Encoding

**Decision**: Use Leaflet `CircleMarker` for each stop, with fill colour interpolated on a green → amber → red scale based on the stop's delayed share relative to the line-level maximum for the period. Radius is fixed. Stops with insufficient data use a neutral grey with a dashed border and a tooltip reading "Otillräcklig data".

**Rationale**: A `CircleMarker` at each stop coordinate (from KoDa GTFS static data) is simpler than a full heatmap plugin and more accurate — intensity is per-stop, not spatially interpolated. The green/amber/red encoding matches operator mental models (green = good, red = problem).

**Alternatives considered**: Leaflet.heat plugin (kernel density heatmap) — rejected; density-based heatmaps conflate stop proximity with delay intensity, which misleads operators. Per-stop markers are more honest.

---

## Decision 6: Shared TypeScript Types

**Decision**: TypeScript interfaces for `Line`, `Stop`, `Departure`, `Period`, `Report`, `KpiSummary`, `TrendPoint`, and `TimeOfDayBucket` are defined in `backend/src/models/index.ts`. The frontend imports these types at build time via a relative path import (monorepo, no published package needed for PoC).

**Rationale**: Single source of truth for the data contract between frontend and backend. Any schema change surfaces as a TypeScript error on both sides simultaneously.

**Alternatives considered**: OpenAPI-generated types — correct long-term approach, over-engineered for PoC. Duplicated type files — rejected; divergence risk.

---

## Decision 7: Confidence Indicator Calculation

**Decision**: Confidence is `Hög` when ≥ 95% of scheduled departures in the period have an `actualDeparture` value (reported or cancelled). `Medium` when 70–94%. `Låg` when < 70%. Calculated in `MetricsService.computeConfidence(departures)` and attached to every `KpiSummary` and `Report`. This mirrors the approach documented in `docs/DATA_QUALITY.md`.

**Rationale**: Makes the confidence rule explicit and testable independent of display logic. The 95%/70% thresholds are conservative enough to flag genuine data gaps while not penalising minor reporting lags.

**Alternatives considered**: Binary high/low — rejected; medium tier gives operators more nuance for borderline data quality.
