# Research: Design System & Expanded Mock Data

**Feature**: 002-design-system-mock-data  
**Phase**: 0 — Unknowns resolved

---

## Decision 1: Design Token Strategy

**Decision**: Tailwind CSS `theme.extend` tokens only — no runtime CSS custom properties library, no third-party design token tool (Style Dictionary, Theo, etc.).

**Rationale**: The project already uses Tailwind CSS 3.x with a `tailwind.config.ts`. Extending `theme.extend.colors` and `theme.extend.fontFamily` is the idiomatic Tailwind approach. It provides compile-time class generation (`.bg-ul-yellow`, `.text-ul-yellow`, etc.), tree-shaking, and zero runtime overhead. JIT mode in Tailwind 3 means any token defined in config immediately generates all utility variants.

**Alternatives considered**:
- *CSS custom properties (`--color-ul-yellow: #f1c800`)* — would allow runtime theming, but the feature spec explicitly chose Tailwind-only (Q1:A). No runtime theming requirement exists.
- *Style Dictionary / Theo* — industry-grade token pipelines for multi-platform output. Overkill for a single-app project with one brand palette.

**Resolution**: No NEEDS CLARIFICATION. Extend existing `tailwind.config.ts`.

---

## Decision 2: UL Brand Token Inventory

**Decision**: Extend token set beyond the current `ul.yellow` / `ul.yellow-hover` to include:

| Token name | Value | Usage |
|---|---|---|
| `ul.yellow` | `#f1c800` | Primary action, headers, active states |
| `ul.yellow-hover` | `#d4af00` | Hover state for yellow elements |
| `ul.yellow-light` | `#fef9d9` | Subtle background tints (banners, highlights) |
| `ul.black` | `#1a1a1a` | Body text, headings |
| `ul.gray` | `#6b7280` | Secondary / muted text (same as Tailwind `gray-500`) |
| `ul.gray-light` | `#f3f4f6` | Page background alternative (same as `gray-100`) |
| `ul.white` | `#ffffff` | Card backgrounds, inputs |

**Rationale**: The spec (FR-001) requires a "full UL colour palette". The current tokens cover yellow + hover only. Adding semantic complementary tokens (light-yellow, blacks, grays, white) lets component classes be expressed purely in token names without mixing Tailwind base-palette classes. The values chosen are either the official UL yellow variants or aliases of existing Tailwind gray values — no invention.

**Alternatives considered**:
- *Keep only yellow + hover* — doesn't satisfy FR-003 (audit components to replace inline classes with token classes). Non-yellow elements (text, backgrounds) would still use raw Tailwind values.
- *Add red/green for status colours* — spec does not require status colour tokens; existing Tailwind red/green/amber names are fine for delay indicators.

---

## Decision 3: CSS Component Class Scope

**Decision**: Define component classes in `@layer components` in `frontend/src/index.css` for the following recurring patterns:

| Class | Applied to |
|---|---|
| `.btn-ul` | Primary action buttons (yellow pill, black text) |
| `.btn-pill-active` | Active period-picker pills |
| `.btn-pill-inactive` | Inactive period-picker pills |
| `.ul-card` | White rounded-2xl shadow wrapper used by all metric/chart/narrative panels |
| `.ul-input` | `<select>` and `<input>` with yellow focus ring |
| `.ul-badge-green` | On-time percentage badge |
| `.ul-badge-amber` | Moderate delay percentage badge |
| `.ul-badge-red` | High delay percentage badge |

**Rationale**: `btn-ul`, `btn-pill-*`, `ul-card`, `ul-input` are already present (FR-001 partially met). Adding `ul-badge-*` classes standardises the three-colour KPI badge pattern currently inline in `KpiSummary.tsx`.

**Alternatives considered**:
- *Inline Tailwind classes everywhere* — already the status quo; creates drift between components (FR-003 specifically rejects this).
- *Headless UI / Radix primitives* — new npm dependency, out of scope for this feature.

---

## Decision 4: TokenPreview Component Strategy

**Decision**: `TokenPreview.tsx` is a standalone React component that renders every `ul.*` colour token as a named swatch grid. It is imported directly in `App.tsx` (or `main.tsx`) behind a `?tokens=1` URL query flag check, so it is never rendered in production builds and does not affect the normal operator view.

**Rationale**: FR-006 requires the token page to be "accessible in development but not appear in the main navigation". A query-flag guard is simpler than a separate route or a `process.env.NODE_ENV` check that could be tree-shaken differently across bundlers.

**Alternatives considered**:
- *Separate Vite dev-only route (`/tokens`)* — requires adding react-router or an equivalent, which is not present in the project. 
- *Storybook* — appropriate for a component library; overkill for a single-app brand smoke test.
- *`NODE_ENV === 'development'` conditional* — would make the component invisible in preview/staging builds where tokens still need to be checked.

---

## Decision 5: Mock Data Generation Approach

**Decision**: Extend the existing `generate-mock-departures.ts` script rather than creating separate scripts per line. Add a `LINE_CONFIG` array that parameterises stops, hourly slots, rush-hour windows, and scenario probabilities per line type. Run once; overwrites all `backend/data/mock/departures/` files including line 1.

**Line config summary**:

| Line | Type | Stops | Slots/day | Rush delay % | Off-peak delay % |
|------|------|-------|-----------|-------------|-----------------|
| 1 | stadsbuss | 4 | 34 (05:00–22:00, every 30 min) | 35% | 12% |
| 2 | stadsbuss | 4 (Uppsala C, Flogsta, Kronåsen, Stenhagen C) | 34 | 35% | 12% |
| 4 | stadsbuss | 4 (Uppsala C, Flogsta, Eriksberg, Kungsängen) | 34 | 35% | 12% |
| 8 | stadsbuss | 4 (Uppsala C, Vaksala torg, Sala backe, Sävja) | 34 | 35% | 12% |
| 801 | regionbuss | 3 (Uppsala C, Resecentrum Knivsta, + stop) | 12 (06:00–21:00, every 90 min) | 20% | 8% |
| 811 | regionbuss | 3 (Uppsala C, Resecentrum Bålsta, + stop) | 12 (06:00–21:00, every 90 min) | 20% | 8% |

**Rationale**: Regional buses (801, 811) run less frequently (~12 departures/day) and serve fewer stops (3–4) compared to urban buses. Lower delay rates reflect the less congested suburban environment. Using a config array keeps the script DRY and makes it trivial to add lines later.

**Stop selection**: Uses only stops already present in `backend/data/mock/stops.json` — no new stops needed. Lines 801/811 each need one additional intermediate stop beyond the two endpoints. Since none exist in the JSON for these lines, they will share `Uppsala C` as origin and use their respective terminal stop (Knivsta / Bålsta) as the destination, with a synthetic midpoint added to `stops.json` and `lines.json` during implementation.

**Alternatives considered**:
- *Separate script per line* — more files, same logic duplicated. Rejected for simplicity.
- *Fetch real schedule data* — requires KoDa API access and network; the mock system exists precisely to avoid this dependency.

---

## Decision 6: Intermediate Stops for Regional Lines

**Decision**: Add two new stop entries to `backend/data/mock/stops.json`: one for line 801 (Alsike, midway between Uppsala C and Knivsta) and one for line 811 (Häggvik, midway between Uppsala C and Bålsta). Update `lineIds` arrays accordingly.

| Stop | lat | lon | lineId |
|------|-----|-----|--------|
| Alsike (740025171) | 59.7800 | 17.7300 | 801 |
| Häggvik (740025172) | 59.7950 | 17.6000 | 811 |

**Rationale**: The spec requires 3–4 stops for regional lines (FR-011). Currently only the terminal stops exist for 801 and 811. All coordinates are within the Uppsala bounding box (59.7–60.1°N, 17.4–18.0°E) validated by the existing coordinate test.

---

*All NEEDS CLARIFICATION resolved. Proceeding to Phase 1.*
