# Tasks: UL Bus Operations Report

**Input**: Design documents from `specs/001-ul-bus-report/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Unit tests are required for all metric/calculation logic (Constitution Principle IV). Test tasks are included for every service that touches data transformation.

**Organization**: Tasks grouped by user story. Each phase is independently deployable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US6)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize both packages, shared types, mock fixtures, and dev tooling.

- [x] T001 Initialize `backend/` Node.js/TypeScript package — create `backend/package.json`, `backend/tsconfig.json`, install `express`, `typescript`, `ts-node`, `@types/express`, `@types/node`, `dotenv`, `vitest`
- [x] T002 Initialize `frontend/` React/Vite/Tailwind package — create `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tailwind.config.ts`, `frontend/index.html`, install `react`, `react-dom`, `tailwindcss`, `@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
- [x] T003 [P] Create shared TypeScript types in `backend/src/models/index.ts` — `Line`, `Stop`, `Departure`, `Period`, `KpiSummary`, `TrendPoint`, `TimeOfDayBucket`, `StopReport`, `Report` per `data-model.md`
- [x] T004 [P] Create `backend/.env.example` with `ANTHROPIC_API_KEY=`, `USE_REAL_KODA=false`, `KODA_API_KEY=`, `PORT=3001`
- [x] T005 [P] Create `frontend/src/types/index.ts` re-exporting types from `backend/src/models/index.ts`
- [x] T006 [P] Create mock fixture files: `backend/data/mock/lines.json` (≥5 UL lines), `backend/data/mock/stops.json` (stops with lat/lon for each line), `backend/data/mock/departures/` (14 days of departure data per line, covering on-time, delayed, cancelled, and missing-actualTime cases)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data layer, metric engine, and Express API shell — required by all user stories.

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete.

- [x] T007 Write unit tests for `MetricsService` in `backend/tests/unit/metrics.test.ts` — cover `computeKpi`, `computeTrend`, `computeTimeOfDay`, `computeConfidence` with edge cases: zero departures, all on-time, all delayed, null `actualTime`, cancelled departures (Constitution Principle IV — tests BEFORE implementation)
- [x] T008 Implement `backend/src/services/metrics/MetricsService.ts` — `computeKpi(departures, period): KpiSummary`, `computeTrend(departures, period): TrendPoint[]`, `computeTimeOfDay(departures): TimeOfDayBucket[]`, `computeConfidence(departures): 'Hög'|'Medium'|'Låg'` — make T007 tests pass
- [x] T009 Write unit tests for `DataService` in `backend/tests/unit/data.test.ts` — mock loader returns correct shape; `USE_REAL_KODA` flag switches implementation
- [x] T010 Implement `backend/src/services/data/DataService.ts` — `getLines(): Line[]`, `getStopsForLine(lineId): Stop[]`, `getDepartures(lineId, period): Departure[]`; mock mode loads from `backend/data/mock/`; real mode stub (KoDa client, behind `USE_REAL_KODA` flag)
- [x] T011 Implement Express app entry point `backend/src/index.ts` — configure Express, JSON middleware, CORS for `localhost:5173`, error handler; start on `PORT` from env
- [x] T012 [P] Implement `backend/src/api/lines.ts` — `GET /api/lines` handler calling `DataService.getLines()`
- [x] T013 [P] Implement `backend/src/api/reports.ts` — route stubs for `GET /api/lines/:lineId/report`, `GET /api/lines/:lineId/stops`, `GET /api/lines/:lineId/stops/:stopId/report`; validation middleware for `startDate`, `endDate` (parse, enforce max 31 days, return typed errors per `contracts/api.md`)
- [x] T014 Write integration tests for API validation in `backend/tests/integration/reports.test.ts` — `PERIOD_TOO_LONG`, `INVALID_DATE`, `END_BEFORE_START`, `LINE_NOT_FOUND` error codes
- [x] T015 Implement `frontend/src/services/api.ts` — typed HTTP client: `getLines()`, `getReport(lineId, startDate, endDate)`, `getStops(lineId)`, `getStopReport(lineId, stopId, startDate, endDate)` — all returning the shared TypeScript types

**Checkpoint**: Data pipeline and API shell ready. All US phases can now proceed.

---

## Phase 3: US1 — Line Performance Overview (Priority: P1) 🎯 MVP

**Goal**: Operator selects a line and period, sees KPI summary (departures, on-time %, delayed %, avg delay, confidence indicator) within 10 seconds.

**Independent Test**: Select "Linje 1" + "Föregående vecka" → KPI cards render with correct values; custom period > 31 days is rejected with a message; missing data shows confidence indicator, not zero.

- [x] T016 Implement full `GET /api/lines/:lineId/report` handler in `backend/src/api/reports.ts` — call `DataService.getDepartures`, `MetricsService.computeKpi`, assemble `Report` (trend/timeOfDay/stops/narrative set to empty/null for now), respond within 10 s (FR-016)
- [x] T017 [P] [US1] Implement `frontend/src/components/LineSelector.tsx` — dropdown populated from `GET /api/lines`; emits selected `Line`
- [x] T018 [P] [US1] Implement `frontend/src/components/PeriodPicker.tsx` — three options: *Igår*, *Föregående vecka* (default), *Anpassad*; custom date range picker enforcing max 31 days client-side (FR-002, FR-003); emits `{ startDate, endDate }` strings
- [x] T019 [US1] Implement `frontend/src/components/KpiSummary.tsx` — renders four KPI cards (Avgångar, I tid %, Försenade % + snittfördröjning, Inställda); omits cards where value is null (FR-015)
- [x] T020 [US1] Implement `frontend/src/components/ConfidenceIndicator.tsx` — shows badge "Hög" / "Medium" / "Låg" with `confidenceNote` text; hidden when `Hög` and note is empty (FR-014)
- [x] T021 [US1] Implement `frontend/src/pages/ReportPage.tsx` — compose `LineSelector` + `PeriodPicker` + `KpiSummary` + `ConfidenceIndicator`; trigger fetch on selection; show loading state during fetch
- [x] T022 [P] [US1] Write component tests in `frontend/tests/KpiSummary.test.tsx` — null values omit cards; correct label formatting
- [x] T023 [P] [US1] Write component tests in `frontend/tests/PeriodPicker.test.tsx` — 32-day custom range rejected; presets emit correct date strings

---

## Phase 4: US2 — Stop-Level Drill-Down (Priority: P2)

**Goal**: Operator drills from line view into a stop and sees the same KPIs scoped to that stop. Stop-level departure totals must sum to line total (SC-002).

**Independent Test**: Navigate line report → click a stop → stop KPIs shown; sum of all stop `scheduledDepartures` equals line-level total.

- [x] T024 Implement `GET /api/lines/:lineId/stops` handler — call `DataService.getStopsForLine`, return `Stop[]`
- [x] T025 Implement `GET /api/lines/:lineId/stops/:stopId/report` handler — filter departures to stop, call `MetricsService.computeKpi`, `computeTrend`, `computeTimeOfDay`, return `StopReport`
- [x] T026 Write unit test in `backend/tests/unit/metrics.test.ts` — sum of all stop `scheduledDepartures` equals line `scheduledDepartures` for same fixture data (SC-002 guard)
- [x] T027 [P] [US2] Implement `frontend/src/components/StopDrillDown.tsx` — stop list with clickable rows; on select, fetches `getStopReport` and renders `KpiSummary` + `ConfidenceIndicator` for the stop; "no data" state when `STOP_NO_DATA` error
- [x] T028 [P] [US2] Write component test in `frontend/tests/StopDrillDown.test.tsx` — no-data state renders message, not zeros

---

## Phase 5: US3 — Delay Trend Over Time (Priority: P3)

**Goal**: Operator sees a time-series line chart of delayed share over the period with correct granularity (hourly / daily / weekly). Missing data points show as gaps, not zeros.

**Independent Test**: Select a 7-day period → one data point per day plotted; single-day period → hourly points; day with no data shows gap.

- [x] T029 Update `GET /api/lines/:lineId/report` to include `trend: TrendPoint[]` computed by `MetricsService.computeTrend` (T016 left it empty)
- [x] T030 Write unit tests in `backend/tests/unit/metrics.test.ts` — `computeTrend` returns `null` for missing-data buckets (not 0); correct granularity per period length (1d→hourly, 2–7d→daily, 8–31d→weekly)
- [x] T031 [P] [US3] Implement `frontend/src/components/DelayTrendChart.tsx` — Chart.js line chart; `spanGaps: false`; null data points render as visible gaps; x-axis labels from `TrendPoint.label`
- [x] T032 [P] [US3] Write component test in `frontend/tests/DelayTrendChart.test.tsx` — null TrendPoint renders gap marker; correct number of data points for daily granularity
- [x] T033 [US3] Add `DelayTrendChart` to `frontend/src/pages/ReportPage.tsx`

---

## Phase 6: US4 — Time-of-Day Delay Patterns (Priority: P4)

**Goal**: Operator sees a bar chart of delayed share per hour (05:00–23:00). Hours with < 3 departures are marked as statistically limited.

**Independent Test**: Hourly breakdown totals are consistent with overall delayed share from KPI summary (SC-004).

- [x] T034 Update `GET /api/lines/:lineId/report` to include `timeOfDay: TimeOfDayBucket[]` from `MetricsService.computeTimeOfDay` (T016 left it empty)
- [x] T035 Write unit tests in `backend/tests/unit/metrics.test.ts` — `computeTimeOfDay` covers only hours 5–23; `statisticallyLimited: true` when `departureCount < 3`; multi-day averages rather than single-day totals
- [x] T036 [P] [US4] Implement `frontend/src/components/TimeOfDayChart.tsx` — Chart.js bar chart for hours 05–23; statistically limited bars rendered with a visual indicator (e.g. hatching or lower opacity + tooltip note)
- [x] T037 [P] [US4] Write component test in `frontend/tests/TimeOfDayChart.test.tsx` — limited hours have correct ARIA/title attribute
- [x] T038 [US4] Add `TimeOfDayChart` to `frontend/src/pages/ReportPage.tsx`; also add to `StopDrillDown.tsx` (US2 stop view)

---

## Phase 7: US5 — Swedish Narrative Summary (Priority: P5)

**Goal**: After metrics are computed, the tool generates a 100–300 word Swedish narrative backed only by displayed KPIs. Narrative is generated server-side; never exposes raw data or prompt internals to the client.

**Independent Test**: Generate report → narrative is Swedish, 100–300 words, every number in it matches the KPI cards exactly.

- [x] T039 Implement `backend/src/services/narrative/NarrativeService.ts` — builds `NarrativeInput` from `KpiSummary` + `TrendPoint[]` + `TimeOfDayBucket[]`; calls Anthropic Claude API with system prompt per `contracts/narrative.md`; validates response (word count 100–300, no markdown); returns Swedish string (FR-009, FR-010)
- [x] T040 Write unit tests in `backend/tests/unit/narrative.test.ts` — word count validation truncates at last sentence ≤ 300; confidenceNote injected when confidence is Medium/Låg; `NarrativeInput` fields match provided `KpiSummary` values
- [x] T041 Update `GET /api/lines/:lineId/report` handler to call `NarrativeService` and include `narrative` in response (T016 left it null)
- [x] T042 [P] [US5] Implement `frontend/src/components/NarrativeSummary.tsx` — renders narrative string in a readable prose block; shows loading spinner while narrative is pending
- [x] T043 [P] [US5] Write component test in `frontend/tests/NarrativeSummary.test.tsx` — renders narrative text; shows spinner when loading prop is true
- [x] T044 [US5] Add `NarrativeSummary` to `frontend/src/pages/ReportPage.tsx`

---

## Phase 8: US6 — Geographic Heat Map (Priority: P6)

**Goal**: Operator sees a Leaflet map of Uppsala with stops coloured green→amber→red by delayed share. Stops without coordinates are excluded from map but remain in the drill-down table. Insufficient-data stops shown in grey with tooltip.

**Independent Test**: Stop marker colours correspond to stop-level `delayedPercent` values visible in the drill-down (SC-005).

- [x] T045 Confirm `GET /api/lines/:lineId/stops` returns `lat`/`lon` for all stops with coordinates; stops missing coordinates return `lat: null, lon: null` (excluded client-side from map)
- [x] T046 Update `GET /api/lines/:lineId/report` `stops` array to include full `StopReport` entries (so the frontend has both KPIs and coordinates for the heat map without extra requests)
- [x] T047 Install Leaflet in `frontend/` — `npm install leaflet @types/leaflet`
- [x] T048 [P] [US6] Implement `frontend/src/components/HeatMap.tsx` — Leaflet map centred on Uppsala (59.86°N, 17.64°E); one `CircleMarker` per stop with `lat`/`lon`; fill colour interpolated green→amber→red by `delayedPercent`; grey dashed marker for stops with null `delayedPercent`; tooltip shows stop name + delayed % or "Otillräcklig data"
- [x] T049 [P] [US6] Write component test in `frontend/tests/HeatMap.test.tsx` — stops without coordinates are not rendered; insufficient-data stops render with grey colour class
- [x] T050 [US6] Add `HeatMap` to `frontend/src/pages/ReportPage.tsx`

---

## Phase 9: KoDa API Integration (Real Data)

**Purpose**: Wire the real KoDa API path so `USE_REAL_KODA=true` works end-to-end.

- [x] T051 Implement `backend/src/services/data/KodaClient.ts` — HTTP client to KoDa historical API; `getLines()`, `getStops(lineId)`, `getDepartures(lineId, start, end)` — normalise KoDa response fields to `Line`, `Stop`, `Departure` types (applying `delayMinutes` derivation rules from `data-model.md`)
- [x] T052 Update `DataService.ts` to import and delegate to `KodaClient` when `USE_REAL_KODA=true`
- [x] T053 Write smoke test in `backend/tests/integration/koda.test.ts` — skipped unless `USE_REAL_KODA=true`; asserts `KodaClient.getLines()` returns at least one UL line

---

## Phase 10: Polish & Cross-Cutting Concerns

- [x] T054 [P] Add no-data empty state to `frontend/src/pages/ReportPage.tsx` — when line has zero departures in period, show "Inga avgångar under vald period" (spec edge case)
- [x] T055 [P] Add global error boundary in `frontend/src/pages/ReportPage.tsx` — catches fetch errors and renders a user-facing Swedish error message
- [x] T056 [P] Ensure `backend/src/api/reports.ts` enforces ≤ 10 s timeout: if `NarrativeService` call exceeds 8 s, abort and return partial report with `narrative: null` + a flag `narrativeTimedOut: true`
- [x] T057 [P] Validate all stop coordinates in mock fixtures fall within Uppsala bounding box (59.7°–60.1°N, 17.4°–18.0°E) per `data-model.md` validation rules
- [x] T058 Write end-to-end smoke test in `backend/tests/integration/e2e.test.ts` — `GET /api/lines/1/report?startDate=…&endDate=…` with mock data returns a complete `Report` within 10 s

---

## Dependency Graph

```
Phase 1 (Setup)
  └── Phase 2 (Foundation: types, mock data, MetricsService, DataService, API shell)
        ├── Phase 3 (US1: KPI summary) ← MVP — independently releasable
        │     └── Phase 4 (US2: Stop drill-down) ← requires P1 data layer
        ├── Phase 5 (US3: Trend chart) ← parallel with P2 after foundation
        ├── Phase 6 (US4: Time-of-day chart) ← parallel with P2, P3
        ├── Phase 7 (US5: Narrative) ← requires P1 KPI data
        └── Phase 8 (US6: Heat map) ← requires P2 stop-level data
              Phase 9 (KoDa real API) ← parallel with all US phases
              Phase 10 (Polish) ← after all US phases
```

---

## Parallel Execution Opportunities

| Group | Tasks that can run in parallel |
|-------|-------------------------------|
| Phase 1 | T003, T004, T005, T006 (after T001+T002 complete) |
| Phase 2 | T012, T013 (after T011); T009, T014 (after T007+T008) |
| Phase 3 | T017, T018 (after T016); T022, T023 (any time) |
| Phase 5+6 | US3 and US4 can be implemented simultaneously (different components, different endpoints) |
| US6 | T047, T048, T049 parallel after T046 |
| Phase 9 | T051, T052 parallel with any US phase |
| Phase 10 | T054–T058 all parallelizable |

---

## Task Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| 1 — Setup | T001–T006 | — |
| 2 — Foundation | T007–T015 | — |
| 3 — US1 Line KPI | T016–T023 | US1 (MVP) |
| 4 — US2 Stop Drill-Down | T024–T028 | US2 |
| 5 — US3 Trend Chart | T029–T033 | US3 |
| 6 — US4 Time-of-Day | T034–T038 | US4 |
| 7 — US5 Narrative | T039–T044 | US5 |
| 8 — US6 Heat Map | T045–T050 | US6 |
| 9 — KoDa Integration | T051–T053 | — |
| 10 — Polish | T054–T058 | — |
| **Total** | **58 tasks** | |

**Suggested MVP scope**: Complete Phases 1–3 (T001–T023). Delivers a working line+period KPI summary — the core value of the tool — independently testable without any other story.
