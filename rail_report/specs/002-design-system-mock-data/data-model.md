# Data Model: Design System & Expanded Mock Data

**Feature**: 002-design-system-mock-data  
**Phase**: 1 — Design

> This feature introduces no new API entities or TypeScript interfaces. It extends the existing design token configuration and the existing mock data fixtures. This file documents the design token schema and the mock data generation parameters.

---

## Design Token Schema

Tokens are defined in `frontend/tailwind.config.ts` under `theme.extend.colors.ul` and `theme.extend.fontFamily`. They generate utility classes at build time (zero runtime cost).

### Colour Token Structure

```ts
// frontend/tailwind.config.ts — theme.extend.colors.ul
{
  ul: {
    yellow:       '#f1c800',  // Primary brand colour — buttons, headers, active states
    'yellow-hover': '#d4af00', // Hover state for yellow surfaces
    'yellow-light': '#fef9d9', // Tinted backgrounds, highlight banners
    black:        '#1a1a1a',  // Body text, headings
    gray:         '#6b7280',  // Secondary / muted text
    'gray-light': '#f3f4f6',  // Subtle page background
    white:        '#ffffff',  // Card and input backgrounds
  }
}
```

Generated Tailwind utility classes (examples):
- `bg-ul-yellow`, `text-ul-yellow`, `border-ul-yellow`, `ring-ul-yellow`
- `bg-ul-yellow-light`, `bg-ul-black`, `text-ul-black`
- `bg-ul-white`, `text-ul-gray`

### Typography Token Structure

```ts
// frontend/tailwind.config.ts — theme.extend.fontFamily
{
  sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
}
```

### CSS Component Classes

Defined in `frontend/src/index.css` under `@layer components`:

| Class | Description | Key styles |
|---|---|---|
| `.btn-ul` | Primary action button | `bg-ul-yellow text-ul-black font-semibold rounded-full px-6 py-2 hover:bg-ul-yellow-hover` |
| `.btn-pill-active` | Active period selector pill | `bg-ul-yellow text-ul-black font-medium rounded-full px-4 py-1` |
| `.btn-pill-inactive` | Inactive period selector pill | `bg-white text-gray-700 border border-gray-300 rounded-full px-4 py-1 hover:bg-ul-yellow-light` |
| `.ul-card` | Metric / chart / narrative panel | `bg-ul-white rounded-2xl shadow-sm p-4 ring-1 ring-black/5` |
| `.ul-input` | Select / input field | `border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ul-yellow` |
| `.ul-badge-green` | ≥ 90% on-time badge | `inline-flex px-2 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800` |
| `.ul-badge-amber` | 75–89% on-time badge | `inline-flex px-2 py-0.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800` |
| `.ul-badge-red` | < 75% on-time badge | `inline-flex px-2 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800` |

---

## Mock Data Generation Parameters

### Existing Entities (unchanged interfaces)

```ts
// backend/src/models/index.ts — no changes needed
interface Line { id: string; name: string; type: 'stadsbuss' | 'regionbuss' }
interface Stop { id: string; name: string; lat: number; lon: number; lineIds: string[] }
interface Departure {
  departureId: string; lineId: string; stopId: string;
  scheduledTime: string; actualTime: string | null;
  cancelled: boolean; delayMinutes: number | null;
}
```

### New Stop Records

Two new stops added to `backend/data/mock/stops.json`:

| id | name | lat | lon | lineIds |
|----|------|-----|-----|---------|
| `740025171` | Alsike | 59.7800 | 17.7300 | `["801"]` |
| `740025172` | Häggvik | 59.7950 | 17.6000 | `["811"]` |

All coordinates validated within Uppsala bounding box (59.7–60.1°N, 17.4–18.0°E).

### Line Configuration Map

Used by the extended `generate-mock-departures.ts` script:

```ts
interface LineConfig {
  lineId: string;
  stops: string[];           // stop IDs in route order
  slots: string[];           // HH:MM scheduled departure times
  rushHours: number[];       // hours considered rush (e.g. [7,8,9,16,17,18])
  rushDelayProb: number;     // probability of 'delayed' scenario in rush hours
  offPeakDelayProb: number;  // probability of 'delayed' scenario off-peak
  cancelledProb: number;     // probability of 'cancelled' (same for all hours)
  missingProb: number;       // probability of 'missing' (actualTime null)
}
```

### Per-Line Parameter Values

| lineId | stops | freq | slots/day | rushDelay | offPeakDelay | cancelled | missing |
|--------|-------|------|-----------|-----------|-------------|-----------|---------|
| `1` | Uppsala C → Kungsängen → Vaksala torg → Gottsunda C | 30 min | 34 | 35% | 12% | 3% | 0.5% |
| `2` | Uppsala C → Flogsta → Kronåsen → Stenhagen C | 30 min | 34 | 35% | 12% | 3% | 0.5% |
| `4` | Uppsala C → Flogsta → Eriksberg → Kungsängen | 30 min | 34 | 35% | 12% | 3% | 0.5% |
| `8` | Uppsala C → Vaksala torg → Sala backe → Sävja | 30 min | 34 | 35% | 12% | 3% | 0.5% |
| `801` | Uppsala C → Alsike → Resecentrum Knivsta | 90 min | 12 | 20% | 8% | 2% | 0.5% |
| `811` | Uppsala C → Häggvik → Resecentrum Bålsta | 90 min | 12 | 20% | 8% | 2% | 0.5% |

### Output Files

14 JSON files per line, named `{lineId}-{YYYY-MM-DD}.json`, in `backend/data/mock/departures/`.

Total new files: 5 lines × 14 days = **70 new files** (line 1 files regenerated in place, no change to content pattern).

---

## No New API Contracts

This feature does not add new API endpoints. The existing `GET /api/lines` and `GET /api/reports/:lineId` endpoints automatically serve the new lines and their mock data through `DataService` (which already reads all files in the departures directory filtered by lineId and date range).
