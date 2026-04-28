# Narrative Contract: Swedish Summary Generation

**Phase**: Phase 1 — Design  
**Plan**: [plan.md](../plan.md) | **Research**: [research.md](../research.md)

Defines the input/output contract for `NarrativeService`, which calls the Anthropic Claude API to generate the Swedish operator summary.

---

## Input: Payload sent to Claude

`NarrativeService` constructs a structured payload from the computed `KpiSummary`, `TrendPoint[]`, and `TimeOfDayBucket[]`. It does **not** pass raw departure records or any free-text from the data source.

```typescript
interface NarrativeInput {
  lineName: string              // e.g. "Linje 1 Uppsala C – Gottsunda"
  periodDescription: string     // e.g. "21–27 april 2026 (Föregående vecka)"
  scheduledDepartures: number
  onTimePercent: number | null
  delayedPercent: number | null
  avgDelayMinutes: number | null
  cancelledDepartures: number
  peakDelayHour: string | null  // e.g. "08:00" — hour with highest delayedPercent
  confidence: 'Hög' | 'Medium' | 'Låg'
  confidenceNote: string        // empty string when Hög
}
```

**Security**: All string fields in `NarrativeInput` are sourced from computed metrics or the operator-facing line/period selection — never from free-text fields in KoDa data (see `research.md` Decision 3).

---

## System Prompt

```
You are a professional Swedish transport analyst writing a concise performance 
summary for an internal bus operator. Write in neutral, professional Swedish.

Rules:
- Use only the statistics provided in the data payload. Do not invent, estimate, 
  or infer any numbers not present in the payload.
- Length: 100–300 words. If you reach 300 words, stop at the last complete sentence.
- If confidence is "Medium" or "Låg", note the data limitation in one sentence.
- Do not include headers, bullet points, or markdown. Flowing prose only.
- Do not mention the data source, the API, or any technical implementation.
```

---

## Output Contract

| Requirement | Rule |
|-------------|------|
| Language | Swedish |
| Length | 100–300 words; truncate at last complete sentence before 300-word limit |
| Numeric accuracy | Every number in the narrative must match the corresponding field in `NarrativeInput` exactly |
| Confidence disclosure | If `confidence !== 'Hög'`, the narrative must include a sentence noting limited data |
| No fabrication | The narrative must not reference any metric not present in `NarrativeInput` |
| Format | Plain prose — no markdown, no bullet points, no headers |

---

## Validation (post-generation, in `NarrativeService`)

Before returning the narrative to the caller, `NarrativeService` checks:

1. Word count is between 100 and 300. If > 300: truncate at the last `.` before the limit.
2. If word count < 100: log a warning and return as-is (do not pad).
3. No markdown syntax (`#`, `*`, `-`, `` ` ``) present in the output.

These checks run on every response regardless of model version.
