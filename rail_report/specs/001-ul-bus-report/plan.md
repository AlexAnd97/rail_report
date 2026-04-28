# Implementation Plan: UL Bus Operations Report

**Branch**: `001-ul-bus-report` | **Date**: 2026-04-28 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/001-ul-bus-report/spec.md`

## Summary

An internal web tool for UL bus operators in Uppsala. Operators select a bus line and a time period (yesterday, last week, or custom up to 31 days) and receive a full performance report: scheduled vs actual departures, on-time share, delayed share with average delay, a delay trend chart, a time-of-day breakdown, a stop-level drill-down, a Leaflet heat map of Uppsala stops coloured by delay intensity, and an auto-generated 100–300 word Swedish narrative summary.

Tech approach: Node.js/TypeScript backend exposes a REST API backed by bundled mock JSON fixtures (real KoDa API behind `USE_REAL_KODA` env flag). React + Tailwind CSS frontend renders Chart.js charts and a Leaflet map. Narrative generated via Anthropic Claude API. Report generation target: ≤ 10 seconds end-to-end.

## Technical Context

**Language/Version**: TypeScript 5.x (backend: Node.js 20 LTS; frontend: browser via Vite)  
**Primary Dependencies**: Express (backend API), React 18, Tailwind CSS, Chart.js 4, Leaflet 1.x, Anthropic SDK (`@anthropic-ai/sdk`), Vitest, React Testing Library  
**Storage**: No database — data sourced from KoDa API or mock JSON fixtures at request time  
**Testing**: Vitest + React Testing Library; Constitution Principle IV mandates unit tests for all metric/calculation logic before implementation  
**Target Platform**: Desktop browser (local dev machine); served via `vite dev` (frontend) + `ts-node` or compiled Node.js (backend)  
**Project Type**: Web application (React SPA + Node.js/Express REST API)  
**Performance Goals**: End-to-end report generation ≤ 10 seconds (FR-016, SC-007)  
**Constraints**: No auth/login; no real-time data; desktop browser only (mobile out of scope for v1)  
**Scale/Scope**: PoC — single operator, single session at a time; UL Uppsala bus network only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Data Fidelity | ✅ PASS | All KPIs calculated directly from departure records; narrative bounded to displayed metrics (FR-010, SC-003) |
| II. Operator-Centric Output | ✅ PASS | Swedish narrative, KPI cards, drill-down — all oriented to operator action |
| III. Drill-Down Integrity | ✅ PASS | FR-012 mandates stop-level metrics derivable from line-level; SC-002 enforces zero discrepancy |
| IV. Test-First for Data Pipelines | ✅ PASS | Vitest unit tests required for all metric functions before implementation (delay calc, on-time ratio, trend aggregation) |
| V. Simplicity and Incremental Scope | ✅ PASS | Mock-first data strategy; phase order (KPIs → charts → drill-down → map → narrative) respects incremental delivery |

No violations. Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-ul-bus-report/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api.md           # REST API contract
│   └── narrative.md     # Claude prompt contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/          # Shared TypeScript types (Line, Stop, Departure, Period, Report)
│   ├── services/
│   │   ├── data/        # DataService: mock loader + KoDa API client (USE_REAL_KODA flag)
│   │   ├── metrics/     # MetricsService: KPI calc, trend, time-of-day aggregation
│   │   └── narrative/   # NarrativeService: Anthropic Claude API integration
│   └── api/             # Express route handlers
│       ├── lines.ts     # GET /api/lines
│       └── reports.ts   # GET /api/lines/:id/report, GET /api/lines/:id/stops/:stopId/report
├── data/
│   └── mock/            # Mock JSON fixtures — 14-day UL bus data
│       ├── lines.json
│       ├── stops.json
│       └── departures/  # One file per line per day: {lineId}-{date}.json
├── tests/
│   ├── unit/            # MetricsService, DataService unit tests (Vitest)
│   └── integration/     # API route integration tests
├── package.json
└── tsconfig.json

frontend/
├── src/
│   ├── components/
│   │   ├── LineSelector.tsx
│   │   ├── PeriodPicker.tsx
│   │   ├── KpiSummary.tsx
│   │   ├── ConfidenceIndicator.tsx
│   │   ├── DelayTrendChart.tsx
│   │   ├── TimeOfDayChart.tsx
│   │   ├── StopDrillDown.tsx
│   │   ├── HeatMap.tsx
│   │   └── NarrativeSummary.tsx
│   ├── pages/
│   │   └── ReportPage.tsx
│   ├── services/
│   │   └── api.ts       # Typed HTTP client to backend
│   └── types/
│       └── index.ts     # Re-exports from backend/src/models (or duplicated for build isolation)
├── tests/               # Vitest + React Testing Library
├── index.html
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

**Structure Decision**: Web application (Option 2) — separate `backend/` and `frontend/` packages at repo root. Backend owns all data access and metric logic; frontend is a pure presentation layer that calls the backend API. This keeps data pipeline logic (Constitution Principle IV test requirement) isolated and independently testable without a browser.
