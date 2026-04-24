# Rail Report Constitution

## Core Principles

### I. Data Fidelity First
All insights and generated summaries must be traceable to source data from the KoDa API. No fabricated statistics, interpolated guesses, or unverifiable claims. Every natural language statement (e.g., "Line 801 had 23% more delays in week 16") must be backed by a calculable data point. If data is missing or ambiguous, the summary must say so explicitly.

### II. Operator-Centric Output
The primary audience is internal operators, not end users. Generated reports must be concise, actionable, and written in plain language. Avoid technical jargon. Summaries should answer: *what happened, how significant was it, and what might explain it*. Speculation about causes must be clearly marked as such.

### III. Drill-Down Integrity
Every aggregated metric (per line, per stop, per time interval) must be consistent with its constituent data. A drill-down at the stop level must never contradict the line-level summary. Filtering by week, month, or time-of-day must apply uniformly across all metrics shown on the same view.

### IV. Test-First for Data Pipelines (NON-NEGOTIABLE)
All data transformation logic — delay calculations, punctuality ratios, trend detection — must be covered by unit tests before implementation. The "red-green-refactor" cycle applies. Edge cases (no departures, 100% delays, missing stops) must have explicit test cases.

### V. Simplicity and Incremental Scope
Start with the minimum viable report. Do not build heat maps, AI narrative generation, or trend charts until the core metrics (departure count, on-time ratio, average delay) are working and tested. YAGNI applies. Each feature phase must be independently deployable and reviewable.

## Technical Constraints

- **Data source**: KoDa API (Uppsala public transport — UL bus network)
- **Scope**: Bus traffic in Uppsala; line-level and stop-level granularity
- **AI summaries**: Natural language generation is a feature layer on top of structured metrics — it must never bypass or replace the underlying data queries
- **Internal use only**: No public-facing authentication or user management required in the initial phases
- **Language**: Summaries generated for operators may be in Swedish or English; the codebase and documentation are in English

## Development Standards

- All PRs must include tests for any new metric or transformation logic
- AI-generated summaries must include the source metric values they are based on (e.g., show the number alongside the narrative)
- Data pipeline stages must be independently testable (fetch → transform → summarize)
- No hardcoded line numbers, stop names, or date ranges in business logic; all must be parameterizable

## Governance

This constitution supersedes all other project-level practices. Amendments require updating this file with an incremented version, a rationale note, and a review of affected features. All implementation plans must reference the relevant principles they uphold. Complexity beyond the stated scope must be explicitly justified against these principles before being added to any task list.

**Version**: 1.0.0 | **Ratified**: 2026-04-24 | **Last Amended**: 2026-04-24
