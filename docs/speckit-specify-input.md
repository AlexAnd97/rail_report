# Suggested `/speckit.specify` Input — Meeting Prep

> **Suggested by Claude** as a starting point for the team meeting where step 3
> of the Spec Kit workflow (`/speckit.specify`) will be run together.
>
> **Why this file exists:** The README already has the core ideas written down,
> and the constitution is in place. Rather than starting from a blank prompt at
> the meeting, this gives the team something concrete to react to, adjust, and
> improve — which is a faster and more focused conversation than writing from scratch.
>
> This is a suggestion, not a decision. The team should read through it, discuss,
> and modify before running the command.

---

## Ready-to-use prompt

Copy the block below and paste it into your AI coding agent at the meeting:

```
/speckit.specify

Build an internal operational reporting tool for UL (Upplandstrafiken) bus traffic
in Uppsala, using the KoDa API as the data source.

Operators need to quickly understand how a specific bus line or stop is performing
over a chosen time period — without manually crunching numbers. The tool should
let them drill down from line level to individual stops, and from weekly view down
to time-of-day patterns.

For each selected line and stop, operators should see:
- Total number of departures in the period
- Share of departures on time
- Share of departures delayed, with average delay in minutes
- How delays have developed over the selected period (trend over time)
- Which times of day have the highest share of delays
- Automatically generated natural-language insights summarising the above
- A geographic heat map over Uppsala showing where delays are concentrated

The primary audience is internal operators, not end users. The language for
generated summaries should be Swedish. The tool is for internal use only —
no login or user management is needed in the first version.

The core value is turning raw departure data into clear, actionable summaries
that an operator can read in under two minutes.
```

---

## Why this wording

- **Intentionally tech-agnostic** — `/speckit.specify` covers the *what*, not the *how*.
  Tech stack decisions happen in the next step (`/speckit.plan`).
- **Operator-centric framing** — mirrors the constitution's Principle II:
  the audience is operators, output should be actionable and concise.
- **"Under two minutes"** — gives the AI a concrete quality bar for the
  narrative summaries, consistent with the constitution's operator-centric goal.
- **No auth/user management** — explicitly scoped out to keep the first version
  focused, per the constitution's Principle V (Simplicity and Incremental Scope).
