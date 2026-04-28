# Feature Specification: UL Bus Operations Report

**Feature Branch**: `001-ul-bus-report`
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "Build an internal operational reporting tool for UL (Upplands lokaltrafik) bus traffic in Uppsala, using the KoDa API as the data source."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Line Performance Overview (Priority: P1)

An operator opens the tool, selects a UL bus line (e.g., line 1 or line 801) and a time period, and immediately sees a summary showing how many departures were scheduled, how many ran on time, how many were delayed, and the average delay in minutes.

**Why this priority**: This is the core value of the tool — converting raw departure data into a readable performance summary. Every other feature builds on this data layer.

**Independent Test**: Can be fully tested by selecting a line and period and verifying that departure count, on-time share, delayed share, and average delay are all correctly displayed.

**Acceptance Scenarios**:

1. **Given** the operator has opened the tool, **When** they select a line and a pre-set period (Igår / Föregående vecka), **Then** the tool displays total departures, on-time %, delayed %, and average delay in minutes within 10 seconds.
2. **Given** the operator selects a custom period, **When** the period is between 1 and 31 days, **Then** the same KPI summary is shown for that exact date range.
3. **Given** the operator selects a custom period longer than 31 days, **When** they attempt to confirm, **Then** the tool rejects the input with a clear message.
4. **Given** data is incomplete for part of the period, **When** the report is shown, **Then** a confidence indicator is displayed alongside the metrics — never showing "0%" where data is absent.

---

### User Story 2 — Stop-Level Drill-Down (Priority: P2)

After viewing the line-level summary, the operator clicks through to a specific stop on that line and sees the same KPIs (departures, on-time %, delayed %, avg delay) scoped to that stop.

**Why this priority**: Operators need to identify *where* on a line problems occur. Stop-level data is the first and most actionable drill-down.

**Independent Test**: Can be tested by navigating from a line view to a stop view and verifying all metrics at stop level are consistent with (and a subset of) the line-level totals.

**Acceptance Scenarios**:

1. **Given** the operator is viewing a line report, **When** they select a specific stop, **Then** all KPIs are recalculated and displayed for that stop only.
2. **Given** stop-level metrics are shown, **When** compared to line-level metrics, **Then** the sum of all stop-level departure counts must equal the line-level total for the same period.
3. **Given** a stop has no departures in the selected period, **When** the operator navigates to it, **Then** a clear "no data" message is shown rather than zeros or errors.

---

### User Story 3 — Delay Trend Over Time (Priority: P3)

The operator sees a time-series chart showing how the delayed share has changed across the selected period — broken down by day (for multi-day periods) or by hour (for single-day view).

**Why this priority**: Identifying whether delays are improving or worsening over time is the most frequent follow-up question after seeing the summary KPIs.

**Independent Test**: Can be tested by viewing the trend chart for a multi-day period and verifying that the data points match the per-day aggregates visible in the raw data table.

**Acceptance Scenarios**:

1. **Given** a period of 2–7 days is selected, **When** the trend is shown, **Then** one data point per day is displayed.
2. **Given** a single-day period is selected, **When** the trend is shown, **Then** data points represent hourly or time-block granularity (05:00–23:00).
3. **Given** a period of 8–31 days is selected, **When** the trend is shown, **Then** data points are weekly.
4. **Given** a day within the period has no data, **When** the trend renders, **Then** the missing point is visually indicated (gap or marker) rather than plotted as zero.

---

### User Story 4 — Time-of-Day Delay Patterns (Priority: P4)

The operator sees a breakdown of delay share by hour of day across the selected period, making it easy to identify which time blocks (e.g., morning rush, evening rush) have the highest concentration of delays.

**Why this priority**: Time-of-day patterns are directly actionable — they inform scheduling and resource allocation decisions.

**Independent Test**: Can be tested by confirming that the hourly breakdown totals are consistent with the overall delayed share from the KPI summary.

**Acceptance Scenarios**:

1. **Given** the time-of-day view is shown, **When** the operator reads it, **Then** delay share is displayed per hour for the operational window (05:00–23:00).
2. **Given** the operator has selected a multi-day period, **When** the time-of-day chart is shown, **Then** values represent averages across all selected days, not a single day.
3. **Given** an hour has fewer than a minimum meaningful number of departures (fewer than 3), **When** displayed, **Then** that hour is marked as statistically limited.

---

### User Story 5 — Swedish Narrative Summary (Priority: P5)

After the metrics are computed, the tool automatically generates a concise natural-language summary in Swedish — 100 to 300 words — that an operator can read in under two minutes and share with colleagues.

**Why this priority**: The narrative is the "last mile" of the tool's value — it removes the need for the operator to manually interpret charts and numbers.

**Independent Test**: Can be tested by generating a report and verifying the summary mentions the correct line, period, on-time %, peak delay hour, and is written in professional Swedish.

**Acceptance Scenarios**:

1. **Given** metrics have been computed for a line and period, **When** the summary is generated, **Then** it is in Swedish, between 100 and 300 words, and references the specific line and period.
2. **Given** a metric in the summary (e.g., "23% förseningar"), **When** cross-referenced with the displayed KPI, **Then** the numbers match exactly.
3. **Given** data confidence is Medium or Low, **When** the summary is generated, **Then** it explicitly notes the data limitation in Swedish.
4. **Given** a metric has no data (e.g., no occupancy data), **When** the summary is generated, **Then** the summary omits that metric rather than stating "0" or "okänt" without explanation.

---

### User Story 6 — Geographic Heat Map (Priority: P6)

The operator views a map of Uppsala with stops colour-coded by delay intensity for the selected period, allowing them to visually identify geographic clusters of underperformance.

**Why this priority**: The heat map provides spatial context that tables and charts cannot. It is a differentiating feature but depends on stop-level metrics (P2) being fully functional.

**Independent Test**: Can be tested by verifying that stop colours on the map correspond correctly to the stop-level delayed % values in the drill-down view.

**Acceptance Scenarios**:

1. **Given** stop-level metrics are available, **When** the heat map is shown, **Then** each stop is plotted at its correct coordinates within the Uppsala area.
2. **Given** a stop has a high delayed share, **When** rendered on the map, **Then** it appears with a visually distinct high-intensity colour compared to on-time stops.
3. **Given** a stop has insufficient data, **When** rendered, **Then** it is shown in a neutral colour with a tooltip indicating insufficient data.

---

### Edge Cases

- What happens when the selected line has zero departures in the chosen period? → Show "no data" state; do not calculate or display any metric.
- What happens when all departures in a period are on time? → Delayed % = 0, average delay = N/A; the narrative acknowledges the positive performance.
- What happens when the data source returns an error for part of the period? → Report what data is available; show confidence indicator as Low or Medium with an explanation.
- What happens when a stop has no coordinates in the source data? → Exclude it from the heat map; include it in the tabular drill-down.
- What happens when the generated summary exceeds 300 words? → Truncate at the last complete sentence before the limit; do not cut mid-sentence.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST allow the operator to select from a list of available UL bus lines.
- **FR-002**: The tool MUST provide three period options: *Igår*, *Föregående vecka* (default), and *Anpassad*.
- **FR-003**: For *Anpassad* periods, the tool MUST enforce a maximum of 31 days.
- **FR-004**: The tool MUST display total scheduled departures and total actual departures for the selected line and period.
- **FR-005**: The tool MUST display on-time departure share as a percentage.
- **FR-006**: The tool MUST display delayed departure share as a percentage and average delay in minutes.
- **FR-007**: The tool MUST display a time-series trend of delayed share over the selected period, with granularity adapted to period length (hourly for 1 day, daily for 2–7 days, weekly for 8–31 days).
- **FR-008**: The tool MUST display delay share broken down by hour of day (05:00–23:00 operational window).
- **FR-009**: The tool MUST generate a natural-language summary in Swedish between 100 and 300 words.
- **FR-010**: The summary MUST only reference metrics that are present in the displayed data.
- **FR-011**: The tool MUST allow the operator to drill down from line level to individual stop level; all KPIs must be available at stop level.
- **FR-012**: Stop-level metrics MUST be consistent with and derivable from line-level data for the same period.
- **FR-013**: The tool MUST display a geographic heat map of Uppsala showing delay intensity per stop.
- **FR-014**: The tool MUST show a confidence indicator (Hög / Medium / Låg) with a plain-language explanation when data is incomplete.
- **FR-015**: The tool MUST NOT display "0%" or zero values for metrics where the underlying data is absent — those metrics must be omitted or shown as unavailable.
- **FR-016**: Report generation (from selection to displayed output) MUST complete within 10 seconds.
- **FR-017**: The tool requires no login or user account management.

### Key Entities

- **Line**: A UL bus route identified by a line number; has a name and a route type (stadsbuss / regionbuss).
- **Stop**: A physical bus stop on a line; has a name, a unique identifier, and geographic coordinates (latitude, longitude).
- **Departure**: A single scheduled bus departure at a stop; has a scheduled time, an actual time (or absence thereof), a cancelled flag, and a delay value derived from the difference.
- **Period**: A date range with a start and end date; determines the granularity used for trend and time-of-day calculations.
- **Report**: The full output for a line+period selection; contains KPIs, trend series, time-of-day distribution, narrative summary, and confidence level.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can complete a full performance review for a selected line and period — from opening the tool to reading the summary — in under 2 minutes.
- **SC-002**: Stop-level departure counts, when summed across all stops for a line and period, equal the line-level departure count for the same selection (zero discrepancy).
- **SC-003**: The Swedish narrative summary is between 100 and 300 words, written in a neutral professional tone, and every numeric claim in it matches the corresponding displayed KPI exactly.
- **SC-004**: The time-of-day chart correctly identifies the hour with the highest delayed share, consistent with the underlying departure records.
- **SC-005**: The heat map renders all stops with known coordinates within the Uppsala bounding area, coloured by their delay intensity relative to the period.
- **SC-006**: When data is missing for any part of a period, a confidence indicator is shown — no metric is displayed as zero where the true value is unknown.
- **SC-007**: Report generation completes in under 10 seconds for any valid line+period selection within the supported range (1–31 days).

---

## Assumptions

- No authentication or user management is needed; this is an internal tool used only by UL operators.
- The data source is the KoDa API (Uppsala public transport — UL bus network); historical departure data is available per line and stop.
- All auto-generated summaries are in Swedish; the codebase and documentation are in English.
- This version covers historical data only — no real-time or live data feed.
- Stop geographic coordinates are available from the data source for all active stops.
- The maximum supported custom period is 31 days; longer ranges are out of scope for v1.
- Occupancy data may be absent for some or all departures; metrics depending on it are omitted when data is unavailable rather than shown as zero.
- The tool is accessed from a desktop browser; mobile layout is not required for v1.

---

## Out of Scope (v1)

- Real-time or live traffic monitoring
- Push notifications or scheduled/automated report delivery
- User accounts, login, or role-based access control
- Support for operators or regions outside UL (Uppsala)
- GTFS-RT integration (deferred to post-PoC roadmap)
- Export to PDF or external reporting formats
