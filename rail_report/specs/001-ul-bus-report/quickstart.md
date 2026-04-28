# Quickstart: UL Bus Operations Report

**Phase**: Phase 1 — Design  
**Plan**: [plan.md](plan.md)

---

## Prerequisites

- Node.js 20 LTS (`node --version` should print `v20.x.x`)
- npm 10+

---

## Setup

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install frontend dependencies
cd ../frontend
npm install

# 3. Copy the example env file and add your Anthropic API key
cd ../backend
cp .env.example .env
# Open .env and set ANTHROPIC_API_KEY=sk-ant-...
```

`.env.example`:
```
ANTHROPIC_API_KEY=
USE_REAL_KODA=false
KODA_API_KEY=
PORT=3001
```

Leave `USE_REAL_KODA=false` during development. Mock data is loaded automatically.

---

## Run (development)

Open two terminals:

```bash
# Terminal 1 — backend
cd backend
npm run dev
# → Express server on http://localhost:3001

# Terminal 2 — frontend
cd frontend
npm run dev
# → Vite dev server on http://localhost:5173
```

Open `http://localhost:5173` in a desktop browser.

---

## Run tests

```bash
# Backend unit + integration tests
cd backend
npm test

# Frontend component tests
cd frontend
npm test
```

All metric logic (delay calculation, on-time ratio, trend aggregation, confidence) must have passing unit tests before implementation proceeds (Constitution Principle IV).

---

## Enable real KoDa data

```bash
# In backend/.env
USE_REAL_KODA=true
KODA_API_KEY=<your-koda-api-key>
```

Restart the backend. The `DataService` switches from mock fixtures to live KoDa API calls automatically.

---

## Test scenarios

Use these scenarios to manually verify key acceptance criteria after setup:

| Scenario | Steps | Expected result |
|----------|-------|-----------------|
| Line KPI summary | Select "Linje 1", period "Föregående vecka" | KPI cards show departures, on-time %, delayed %, avg delay. Confidence = Hög |
| Custom period validation | Select "Anpassad", enter a 32-day range | Tool rejects with a clear error message |
| Missing data confidence | Select any line on a date with sparse mock data | Confidence indicator shows "Medium" or "Låg" with a Swedish explanation |
| Stop drill-down | View line report → click a stop | Stop KPIs shown; sum of all stop departure counts = line total |
| Heat map | View any line report | Uppsala map renders with stops coloured by delay intensity |
| Swedish narrative | View any line report | Narrative section shows 100–300 words of Swedish prose; numbers match KPI cards |
| No-data state | Select a line with zero mock departures for a date | "no data" state shown; no zeros or errors |
