import Anthropic from '@anthropic-ai/sdk'
import type { KpiSummary, TrendPoint, TimeOfDayBucket } from '../../models/index'

export interface NarrativeInput {
  lineName: string
  periodDescription: string
  scheduledDepartures: number
  onTimePercent: number | null
  delayedPercent: number | null
  avgDelayMinutes: number | null
  cancelledDepartures: number
  peakDelayHour: string | null
  confidence: 'Hög' | 'Medium' | 'Låg'
  confidenceNote: string
}

const SYSTEM_PROMPT = `You are a professional Swedish transport analyst writing a concise performance \
summary for an internal bus operator. Write in neutral, professional Swedish.

Rules:
- Use only the statistics provided in the data payload. Do not invent, estimate, \
or infer any numbers not present in the payload.
- Length: 100–300 words. If you reach 300 words, stop at the last complete sentence.
- If confidence is "Medium" or "Låg", note the data limitation in one sentence.
- Do not include headers, bullet points, or markdown. Flowing prose only.
- Do not mention the data source, the API, or any technical implementation.`

function peakHour(timeOfDay: TimeOfDayBucket[]): string | null {
  if (!timeOfDay.length) return null
  let max: TimeOfDayBucket | null = null
  for (const b of timeOfDay) {
    if (b.delayedPercent === null || b.statisticallyLimited) continue
    if (!max || b.delayedPercent > (max.delayedPercent ?? -1)) max = b
  }
  return max?.label ?? null
}

function buildInput(
  lineName: string,
  periodDescription: string,
  kpi: KpiSummary,
  timeOfDay: TimeOfDayBucket[]
): NarrativeInput {
  return {
    lineName,
    periodDescription,
    scheduledDepartures: kpi.scheduledDepartures,
    onTimePercent: kpi.onTimePercent,
    delayedPercent: kpi.delayedPercent,
    avgDelayMinutes: kpi.avgDelayMinutes,
    cancelledDepartures: kpi.cancelledDepartures,
    peakDelayHour: peakHour(timeOfDay),
    confidence: kpi.confidence,
    confidenceNote: kpi.confidenceNote,
  }
}

function truncateToWordLimit(text: string, limit = 300): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= limit) return text
  const trimmed = words.slice(0, limit).join(' ')
  const lastPeriod = trimmed.lastIndexOf('.')
  return lastPeriod > 0 ? trimmed.slice(0, lastPeriod + 1) : trimmed
}

function validate(text: string): string {
  // Remove markdown syntax if present
  const cleaned = text.replace(/[#*`\-]{2,}/g, '')
  return truncateToWordLimit(cleaned)
}

export class NarrativeService {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async generate(
    lineName: string,
    periodDescription: string,
    kpi: KpiSummary,
    timeOfDay: TimeOfDayBucket[]
  ): Promise<string | null> {
    if (!process.env.ANTHROPIC_API_KEY) return null

    const input = buildInput(lineName, periodDescription, kpi, timeOfDay)

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: JSON.stringify(input),
          },
        ],
      })

      const block = response.content[0]
      if (block.type !== 'text') return null
      return validate(block.text)
    } catch (err) {
      console.error('[NarrativeService] error:', err)
      return null
    }
  }
}
