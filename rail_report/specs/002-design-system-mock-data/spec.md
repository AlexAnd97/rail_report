# Feature Specification: Design System & Expanded Mock Data

**Feature Branch**: `002-design-system-mock-data`
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "We need to add a better design system. Verify tailwind is working correctly. Also we need more mock data for the lines — at the moment there is only line 1."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Consistent Visual Identity Across All Screens (Priority: P1)

A developer or designer opens the UL Bus Report app and sees a coherent visual language: consistent colours, typography, spacing, and interactive states (hover, focus, disabled) on every screen element — without having to inspect individual component files.

**Why this priority**: The design system is the foundation. All other UI improvements depend on having reliable, shared tokens. Without it, every future change risks visual inconsistency.

**Independent Test**: Open the app, navigate through all states (line selected, period changed, stop drill-down open). Every button, input, card, and badge must use the same visual tokens (same yellow, same border radius, same font size scale). No element should appear with a different blue, grey, or unstyled default.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** I load the page, **Then** the header, all buttons, all cards, and all form inputs visually match the UL brand colour `#f1c800` as the primary interactive colour.
2. **Given** I hover over any button, **When** I move focus away, **Then** the hover and focus states are visible and consistent across all button instances.
3. **Given** a developer extends the design, **When** they add a new component using the token names (e.g. `ul-yellow`, `ul-card`), **Then** the component inherits the correct visual style without writing custom CSS.

---

### User Story 2 — Design Token Smoke Test (Priority: P2)

A developer wants to verify that Tailwind's custom tokens (colours, typography, spacing) are correctly compiled and applied at runtime — without running a full end-to-end test.

**Why this priority**: Token configuration mistakes (misspelled class names, purged styles, missing config entries) are silent — the page renders but styles are missing. A visual smoke test catches this immediately.

**Independent Test**: Navigate to the design token preview page (or component). All UL brand colours render as filled colour swatches with their names labelled. If a swatch is missing or shows the wrong colour, the token is broken.

**Acceptance Scenarios**:

1. **Given** the app is running, **When** I navigate to the token preview, **Then** I see a swatch for every custom colour token defined in the Tailwind config (at minimum: `ul-yellow`, `ul-yellow-hover`).
2. **Given** a token is missing from the Tailwind config, **When** the preview renders, **Then** the corresponding swatch is visually absent or shows a fallback, making the misconfiguration obvious.
3. **Given** the preview is visible, **When** I read each swatch label, **Then** each label matches the Tailwind class name so I can copy-paste it directly into a component.

---

### User Story 3 — Meaningful Data for All Lines (Priority: P3)

An operator opens the UL Bus Report app, selects any of the 6 available UL lines (1, 2, 4, 8, 801, 811), chooses a period, and sees a populated KPI report — not an empty state.

**Why this priority**: Currently only Line 1 has departure data. Selecting any other line returns a blank report, making the app unusable for demonstrating or testing multi-line scenarios.

**Independent Test**: Select each of Lines 2, 4, 8, 801, and 811. For each, pick "Föregående vecka". The report must show non-zero scheduled departures, on-time %, and a populated trend chart.

**Acceptance Scenarios**:

1. **Given** I select Line 2 and "Föregående vecka", **When** the report loads, **Then** KPI cards show scheduled departures > 0.
2. **Given** I select Line 811 (regional), **When** the report loads, **Then** the data reflects a realistic regional bus pattern (fewer stops, longer intervals than urban lines).
3. **Given** I select Line 1, **When** the report loads, **Then** the existing Line 1 data is unchanged and continues to pass all existing tests.

---

### Edge Cases

- What happens if a line has stops defined but zero departure files? → Empty report state must display "Inga avgångar under vald period" (already implemented; mock data must not trigger this for any of the 6 lines).
- What happens if the token preview is shown in production? → The preview component is development-only and must not appear in the production navigation.
- What if a new Tailwind version purges a custom token class? → The token smoke test will surface this immediately.

---

## Requirements *(mandatory)*

### Functional Requirements

**Design Token Layer**

- **FR-001**: The design system MUST define all UL brand colours as named Tailwind tokens in `tailwind.config.ts`, including primary yellow (`#f1c800`), hover yellow (`#d4af00`), and any supporting neutrals used across the app.
- **FR-002**: The design system MUST define shared typography tokens (font family, base size, heading sizes) consistent with UL's visual identity.
- **FR-003**: The design system MUST define reusable CSS component classes in `index.css` for all recurring UI patterns: primary button, secondary button, period picker pill (active/inactive), card container, and form input.
- **FR-004**: All existing components MUST be updated to use the shared token classes rather than inline Tailwind utility strings where a token class exists.
- **FR-005**: The design token layer MUST NOT introduce any new runtime JavaScript dependencies — it is CSS/config only.

**Token Smoke Test**

- **FR-006**: A visual token preview MUST be accessible within the running app that renders every custom Tailwind colour token as a named colour swatch.
- **FR-007**: The token preview MUST display each swatch with its Tailwind class name so developers can verify and copy-paste class names.
- **FR-008**: The token preview component MUST be clearly marked as a development aid and not appear in the main report navigation.

**Expanded Mock Data**

- **FR-009**: Mock departure data MUST exist for all 6 lines: 1, 2, 4, 8, 801, 811.
- **FR-010**: Each line MUST have at least 14 consecutive days of departure data, covering a realistic mix of on-time, delayed, cancelled, and missing-actualTime departures.
- **FR-011**: Lines 801 and 811 (regional) MUST have fewer departures per day and fewer stops than urban lines (1, 2, 4, 8), reflecting realistic regional bus patterns.
- **FR-012**: The departure data for each line MUST be generated by the existing `generate-mock-departures.ts` script (or an extension of it), not hand-authored, to ensure consistent schema.
- **FR-013**: All existing Line 1 departure data MUST remain unchanged so existing tests continue to pass.

### Key Entities

- **Design Token**: A named value (colour, font, spacing) defined once in `tailwind.config.ts` and referenced by name in all components. No direct hex values in component files.
- **Token Swatch**: A visual representation of a single design token — coloured rectangle + label — used in the smoke test preview.
- **Mock Departure File**: A JSON file at `backend/data/mock/departures/<lineId>-<YYYY-MM-DD>.json` containing an array of `Departure` objects for one line on one day.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 6 lines return a non-empty KPI report when "Föregående vecka" is selected — zero empty-state renders for any configured line.
- **SC-002**: The token preview renders a swatch for every custom colour token defined in `tailwind.config.ts` — 100% token coverage with zero missing swatches.
- **SC-003**: No component file contains a raw hex colour value or a hardcoded Tailwind colour class that has a corresponding design token (e.g. no `bg-[#f1c800]` or `bg-blue-600` in a component that should use `btn-ul`).
- **SC-004**: All 33 existing backend tests and 18 existing frontend tests continue to pass after the changes — zero regression.
- **SC-005**: A developer can add a new UI element using only the documented token class names and have it visually consistent with the rest of the app, with no custom CSS required.

---

## Assumptions

- The UL brand primary colour is `#f1c800` (confirmed by user).
- The target font is Inter (already loaded from Google Fonts in `index.html`).
- "Development only" for the token preview means it is accessible via a route or toggle in dev mode — it does not need to be hidden behind an env flag.
- Mock data date range: 14 days ending on 2026-04-27 (matching existing Line 1 data range).
- Regional lines (801, 811) serve 3–4 stops with ~8–12 departures per day; urban lines (2, 4, 8) serve 4–6 stops with ~30–36 departures per day, matching Line 1's pattern.
- The `generate-mock-departures.ts` script will be extended (or re-run with different parameters) to produce data for all lines — no manual JSON authoring.
