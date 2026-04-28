# Implementation Plan: Design System & Expanded Mock Data

**Branch**: `002-design-system-mock-data` | **Date**: 2026-04-28 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/002-design-system-mock-data/spec.md`

## Summary

Two parallel workstreams:
1. **Design Token Layer** — extend `tailwind.config.ts` with a complete UL brand token set, consolidate all recurring UI patterns into shared CSS component classes in `index.css`, and update all existing components to use the tokens. Add a visual token smoke-test page accessible in development.
2. **Expanded Mock Data** — extend `generate-mock-departures.ts` to produce 14 days of realistic departure data for all 6 UL lines (1, 2, 4, 8, 801, 811), with regional lines (801, 811) having lower frequency and fewer stops than urban lines.

## Technical Context

**Language/Version**: TypeScript 5.x (backend script), React 18 / TypeScript 5.x (frontend)  
**Primary Dependencies**: Tailwind CSS 3.x (design tokens), Vite (CSS compilation), ts-node (script execution)  
**Storage**: JSON fixture files at `backend/data/mock/departures/`  
**Testing**: Vitest (backend + frontend); existing 33 backend + 18 frontend tests must all pass  
**Target Platform**: Web browser (Vite dev server, localhost:5173)  
**Project Type**: Web application — frontend + backend  
**Performance Goals**: Design token compilation adds zero runtime cost; mock script generates ~70 files in < 5 seconds  
**Constraints**: No new npm dependencies; design tokens are CSS/config only; Line 1 data must remain unchanged

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Data Fidelity | ✅ PASS | Mock data uses the same schema as real KoDa data; regional lines use realistic frequency (8–12 dep/day vs 34 for urban). No fabricated statistics — all KPIs are computed from generated fixture data. |
| II. Operator-Centric | ✅ PASS | Design system improves operator UX consistency. Token smoke test is dev-only and not visible to operators. |
| III. Drill-Down Integrity | ✅ PASS | No changes to MetricsService or any aggregation logic. All metrics remain consistent by construction. |
| IV. Test-First (NON-NEG) | ✅ PASS | No new data transformation logic is introduced. The token smoke test is visual-only. Existing 51 tests cover all metric paths. |
| V. Simplicity | ✅ PASS | No new runtime dependencies. Design tokens are additive. Mock data script is an extension of existing `generate-mock-departures.ts`. |

**Gate result**: All principles PASS. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-design-system-mock-data/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (mock data parameters)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code Changes

```text
frontend/
├── tailwind.config.ts         # Extended UL token set
├── src/
│   ├── index.css              # Consolidated component classes
│   ├── components/
│   │   └── TokenPreview.tsx   # NEW — dev-only design token smoke test
│   ├── pages/
│   │   └── ReportPage.tsx     # Updated to use token classes
│   └── [all other components] # Updated to use token classes

backend/
├── scripts/
│   └── generate-mock-departures.ts  # Extended for all 6 lines
└── data/mock/departures/
    ├── 1-*.json   (existing, unchanged)
    ├── 2-*.json   (NEW — 14 files)
    ├── 4-*.json   (NEW — 14 files)
    ├── 8-*.json   (NEW — 14 files)
    ├── 801-*.json (NEW — 14 files)
    └── 811-*.json (NEW — 14 files)
```

## Complexity Tracking

> No constitution violations — section not required.
