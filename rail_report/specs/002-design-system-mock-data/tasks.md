# Tasks: Design System & Expanded Mock Data

**Input**: Design documents from `specs/002-design-system-mock-data/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

---

## Phase 1: Setup

**Purpose**: Data prerequisites shared across user stories

- [x] T001 Add Alsike (id `740025171`, lat 59.7800, lon 17.7300, lineIds `["801"]`) and Häggvik (id `740025172`, lat 59.7950, lon 17.6000, lineIds `["811"]`) stop records to `backend/data/mock/stops.json`

**Checkpoint**: `stops.json` has 14 entries (was 12). Regional lines now have an intermediate stop each.

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Extend the Tailwind token set so all downstream component classes and swatches can reference the full `ul.*` palette

**⚠️ CRITICAL**: Phase 3 (US1 component classes) and Phase 4 (US2 swatches) both depend on this phase being complete.

- [x] T002 Extend `frontend/tailwind.config.ts` — add `'yellow-light': '#fef9d9'`, `black: '#1a1a1a'`, `gray: '#6b7280'`, `'gray-light': '#f3f4f6'`, `white: '#ffffff'` inside the existing `ul:` block under `theme.extend.colors`

**Checkpoint**: Tailwind generates `bg-ul-yellow-light`, `text-ul-black`, `bg-ul-gray-light`, `bg-ul-white`, `text-ul-gray` utility classes. Vite hot-reload confirms no compilation errors.

---

## Phase 3: User Story 1 — Consistent Visual Identity (Priority: P1) 🎯 MVP

**Goal**: Every button, card, input, and badge in the app uses a named design token class. No raw hex values or mismatched base-palette classes in any component.

**Independent Test**: Open the app, open DevTools, inspect every interactive element. All buttons have `bg-ul-yellow`, all cards have `ul-card`, all inputs have `ul-input`, and all KPI badges use `ul-badge-green/amber/red`. No `bg-[#f1c800]` raw hex or unrelated colour classes.

- [x] T003 [US1] Add `ul-badge-green`, `ul-badge-amber`, `ul-badge-red` CSS component classes to `@layer components` in `frontend/src/index.css` — use `bg-green-100 text-green-800`, `bg-amber-100 text-amber-800`, `bg-red-100 text-red-800` with `inline-flex px-2 py-0.5 rounded-full text-sm font-medium`
- [x] T004 [P] [US1] Update `frontend/src/components/KpiSummary.tsx` — replace any inline badge colour classes with the new `ul-badge-green`, `ul-badge-amber`, `ul-badge-red` classes based on the on-time percentage threshold (≥90% → green, 75–89% → amber, <75% → red)
- [x] T005 [P] [US1] Audit `frontend/src/components/ConfidenceIndicator.tsx` — replace any raw colour utilities (e.g. `bg-green-100`, `text-green-800` inline strings) with `ul-badge-green/amber/red` where applicable; ensure no raw hex values remain
- [x] T006 [P] [US1] Audit `frontend/src/pages/ReportPage.tsx` — verify the header uses `bg-ul-yellow`, body uses `bg-ul-white` or `bg-white`, and no raw hex values (e.g. `bg-[#f1c800]`) are present
- [x] T007 [P] [US1] Audit remaining components for raw hex or base-palette colour classes that have a token equivalent: `frontend/src/components/StopDrillDown.tsx`, `frontend/src/components/NarrativeSummary.tsx`, `frontend/src/components/LineSelector.tsx`, `frontend/src/components/PeriodPicker.tsx` — replace any found with their token-class equivalent

**Checkpoint**: User Story 1 complete. Grep for `#f1c800` and raw `bg-yellow-*` in `frontend/src/` returns zero matches.

---

## Phase 4: User Story 2 — Design Token Smoke Test (Priority: P2)

**Goal**: A developer can navigate to `http://localhost:5173?tokens=1` and see every `ul.*` colour token rendered as a labelled swatch.

**Independent Test**: Open `http://localhost:5173?tokens=1`. Count the swatches — there must be exactly 7 (yellow, yellow-hover, yellow-light, black, gray, gray-light, white). Each swatch shows the token name and hex value. The normal report UI does not show the preview at the default URL.

- [x] T008 [US2] Create `frontend/src/components/TokenPreview.tsx` — renders a grid of swatches for all 7 `ul.*` tokens; each swatch is a `div` with the corresponding `bg-ul-*` class, the Tailwind class name label, and the hex value below it; include a `<h1>` heading "UL Design Tokens"
- [x] T009 [US2] Update `frontend/src/App.tsx` (or `main.tsx` if App is not the entry) — read `new URLSearchParams(window.location.search).get('tokens')` and conditionally render `<TokenPreview />` instead of the normal app when the value is `'1'`

**Checkpoint**: User Story 2 complete. `?tokens=1` shows the swatch grid; default URL shows the report as normal.

---

## Phase 5: User Story 3 — Meaningful Data for All Lines (Priority: P3)

**Goal**: All 6 lines return populated KPI reports when "Föregående vecka" is selected. Line 1 data is unchanged.

**Independent Test**: With backend running, call `GET /api/reports/2`, `/api/reports/4`, `/api/reports/8`, `/api/reports/801`, `/api/reports/811` with a date range covering the last 7 days. Each response must have `scheduledCount > 0` and a non-null `onTimePercent`.

- [x] T010 [P] [US3] Extend `backend/scripts/generate-mock-departures.ts` — add a `LINE_CONFIG` array with entries for lines 2, 4, 8, 801, and 811 using the stops and slot patterns from `data-model.md`; urban lines (2, 4, 8) use 30-min slots 05:00–22:00 (34 slots/day) with their respective stops from `stops.json`; regional lines (801, 811) use 90-min slots 06:00–21:00 (12 slots/day) with 3 stops each (Uppsala C → intermediate → terminal); Line 1 config must remain identical to the existing implementation
- [x] T011 [US3] Run `npx ts-node backend/scripts/generate-mock-departures.ts` from `backend/` — confirm output shows 84 total files written (6 lines × 14 days), with no TypeScript errors
- [x] T012 [US3] Verify `backend/data/mock/departures/` contains files for all 6 line IDs (check for `2-`, `4-`, `8-`, `801-`, `811-` prefixed files); restart backend dev server if running to reload fixture files

**Checkpoint**: User Story 3 complete. All 6 lines return non-empty reports in the UI.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirm no regressions and all success criteria met

- [x] T013 Run backend test suite from `backend/` with `npm test` — confirm 33 tests pass (3 KoDa smoke tests remain skipped); zero regressions introduced by stop additions or script changes
- [x] T014 Run frontend test suite from `frontend/` with `npm test` — confirm 18 tests pass; zero regressions introduced by component class changes or new TokenPreview component

**Checkpoint**: All 47 tests pass. Feature 002 complete.

---

## Dependencies

```
T001 (new stops) ──────────────────────────────────► T010 (script uses new stop IDs)
T002 (token config) ──────────────────────────────► T003 (badge classes use new tokens)
                   ──────────────────────────────► T008 (TokenPreview renders new tokens)
T003 (badge classes) ─────────────────────────────► T004, T005 (components use new classes)
T010 (extended script) ───────────────────────────► T011 (run script)
T011 (generated files) ───────────────────────────► T012 (verify files exist)
All T001–T012 ────────────────────────────────────► T013, T014 (regression check)
```

Story completion order: **US1 → US2** (US2 swatches need T002 tokens) | **US3** (independent of US1/US2)

## Parallel Execution

Within Phase 3 (US1), tasks T004–T007 can all run simultaneously — they modify different component files with no shared state.

T008 (US2, `TokenPreview.tsx`) and T010 (US3, script extension) are in different phases but can be worked on simultaneously if two agents are available — they touch completely different parts of the codebase.

## Implementation Strategy

**MVP**: Complete Phase 1 + Phase 2 + Phase 3 (T001–T007). This delivers a fully token-consistent UI immediately.

**Increment 2**: Phase 4 (T008–T009) — the token preview is useful but non-blocking for operators.

**Increment 3**: Phase 5 (T010–T012) — expanded mock data enables all demo and QA scenarios.

**Increment 4**: Phase 6 (T013–T014) — regression verification.
