# Quickstart: Design System & Expanded Mock Data

**Feature**: 002-design-system-mock-data

---

## Prerequisites

- Node.js 20 LTS installed
- Dependencies already installed (`npm install` run in both `frontend/` and `backend/`)
- Backend dev server accessible at http://localhost:3001 (or restart with `npm run dev` in `backend/`)
- Frontend dev server accessible at http://localhost:5173 (or restart with `npm run dev` in `frontend/`)

---

## 1. Generate expanded mock data

From the repository root:

```bash
cd backend
npx ts-node scripts/generate-mock-departures.ts
```

Expected output:

```
Written: .../departures/1-2026-04-14.json (136 departures)
...
Written: .../departures/811-2026-04-27.json (36 departures)
Done. Generated 6 lines × 14 days = 84 files
```

> **Note**: Line 1 files are regenerated in place. The content pattern (delay ratios) is preserved.

---

## 2. Restart the backend

If the backend was already running, stop it (`Ctrl+C`) and restart:

```bash
cd backend
npm run dev
```

Verify all 6 lines appear:

```bash
curl http://localhost:3001/api/lines
# Expected: [{id:"1",...}, {id:"2",...}, {id:"4",...}, {id:"8",...}, {id:"801",...}, {id:"811",...}]
```

---

## 3. Verify design tokens compile

The Tailwind tokens are applied at build time. Vite hot-reloads on config changes:

1. Open http://localhost:5173 — the UI should appear with the UL yellow header, white background, and styled components.
2. Verify no raw hex colours are visible in the browser DevTools "Computed" styles for buttons, cards, or inputs.

---

## 4. View the token smoke test

Open the browser and navigate to:

```
http://localhost:5173?tokens=1
```

This renders the `TokenPreview` component showing every `ul.*` colour token as a named swatch grid. Confirm:

- All 7 `ul.*` tokens appear as swatches with their hex value label
- Token names match the Tailwind config keys

---

## 5. Run all tests

```bash
# Backend (35 tests expected to pass, 3 KoDa smoke tests skipped)
cd backend
npm test

# Frontend (18 tests expected to pass)
cd frontend
npm test
```

---

## 6. Verify line reports in the UI

1. Open http://localhost:5173
2. Select each of the 6 lines from the line dropdown
3. Select "Föregående vecka" as the period
4. Click "Visa"
5. Confirm that each line shows non-empty KPIs (departure count > 0, on-time ratio visible)

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `/api/lines` returns only line 1 | Backend not restarted after generating mock data | Restart backend with `npm run dev` |
| Line 801/811 shows "Inga data" | Departure files not yet generated | Run the generate script (step 1) |
| Token swatches don't appear at `?tokens=1` | `TokenPreview` not wired | Verify `App.tsx` conditional renders `<TokenPreview />` when `?tokens=1` |
| Tailwind class `bg-ul-yellow-light` has no effect | Token not in `tailwind.config.ts` | Add `'yellow-light': '#fef9d9'` under `ul:` in `theme.extend.colors` |
