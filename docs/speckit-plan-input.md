# Suggested `/speckit.plan` Input — Meeting Prep

> **Suggested by Claude** as a starting point for the team meeting where `/speckit.plan`
> will be run together.
>
> **Why this file exists:** The spec for the UL bus operations report is complete and every
> item on the requirements checklist passes. Rather than writing the planning prompt from
> scratch at the meeting, this gives the team something concrete to read, adjust, and
> improve — a focused discussion is faster than a blank slate.
>
> This is a suggestion, not a decision. The team should read through it, discuss any
> changes, and then copy-paste into their AI coding agent.

---

## Ready-to-use prompt

Copy the block below and paste it into your AI coding agent at the meeting:

```
/speckit.plan

Spec: rail_report/specs/001-ul-bus-report/spec.md
Requirements checklist: all items pass
  (rail_report/specs/001-ul-bus-report/checklists/requirements.md)

Greenfield codebase. Deployment target: local dev machine only (PoC).
No existing code to align with; no deployment infrastructure needed.

Tech stack:
- Frontend: React + Tailwind CSS
- Backend: Node.js / TypeScript
- Charts: Chart.js (FR-007 delay trend, FR-008 time-of-day distribution)
- Maps: Leaflet (FR-013 Uppsala stop heat map)
- LLM (Swedish narrative): Anthropic Claude API (FR-009–010)
- Tests: Vitest + React Testing Library

Data strategy:
- Default: bundled mock JSON fixtures — no network dependency during development
- Real data: KoDa API, enabled via a USE_REAL_KODA environment feature flag
- Never show 0 for absent data; show confidence indicator for incomplete periods
  (FR-014–015)

Key constraints:
- End-to-end report generation ≤ 10 seconds (FR-016)
- No authentication or login required (FR-017)
- Swedish narrative: 100–300 words, grounded only in the displayed metrics (FR-009–010)

Key entities: Line, Stop (lat/lon), Departure, Period, Report

Scope exclusions — do not plan for:
- Real-time monitoring, push notifications, scheduled reports
- Multi-operator support, user accounts, GTFS-RT, PDF export, mobile layout

Suggested phase order:
1. Data layer: mock JSON fixtures + shared TypeScript types
   (Line, Stop, Departure, Period, Report)
2. KPI calculation: departures, on-time %, delayed %, avg delay (FR-004–006)
3. UI shell: line selector + period picker
   (Igår / Föregående vecka / Anpassad, max 31 days) (FR-001–003)
4. KPI summary cards, delay trend chart (FR-007), time-of-day chart (FR-008)
5. Stop-level drill-down with line/stop consistency guarantee (FR-011–012)
6. Leaflet heat map of Uppsala stops by delay intensity (FR-013)
7. Anthropic Claude narrative integration (FR-009–010)
8. KoDa API data path wired behind USE_REAL_KODA flag
9. Test suite (Vitest + React Testing Library)
```

---

## Why this wording

- **Feature flag named explicitly** — naming `USE_REAL_KODA` signals that mock fixtures
  are the default development path and that KoDa integration is a separately gated task.
  This prevents the PoC from blocking on network access or API credentials during early
  development cycles.
- **Chart.js and Leaflet called out by name** — these are non-obvious, specialised
  choices, especially Leaflet for a geographic heat map. Without naming them the planner
  might propose an incompatible alternative that the team would then have to override.
- **≤ 10-second constraint included** — FR-016 is a hard acceptance criterion, not a
  stretch goal. The planner needs it upfront so it factors into architectural decisions:
  data pre-aggregation, avoiding blocking API calls on render, and where to place loading
  boundaries.
- **Anthropic Claude API named under LLM** — several providers could satisfy the
  narrative requirement; specifying the chosen one ensures that generated scaffolding
  (env vars, SDK imports, prompt construction) targets the right library from the start.
- **"Local dev machine only" stated explicitly** — omitting this risks the planner
  including Docker, CI/CD pipelines, or cloud deployment steps the team doesn't need for
  a PoC. It also signals that secrets can live in a `.env` file rather than a secrets
  manager.
- **Phase order suggested at the end** — the prompt doesn't prescribe every detail but
  offers a data-layer-first sequence consistent with the mock-first strategy. The planner
  can deviate, but having a sensible default reduces ambiguity at the meeting.
