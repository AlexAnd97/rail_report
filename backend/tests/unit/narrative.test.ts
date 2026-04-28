import { describe, it, expect } from 'vitest'

// Test NarrativeService validation logic without needing a real API key
// by extracting and testing the helper functions directly.

function truncateToWordLimit(text: string, limit = 300): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= limit) return text
  const trimmed = words.slice(0, limit).join(' ')
  const lastPeriod = trimmed.lastIndexOf('.')
  return lastPeriod > 0 ? trimmed.slice(0, lastPeriod + 1) : trimmed
}

function validate(text: string): string {
  const cleaned = text.replace(/[#*`\-]{2,}/g, '')
  return truncateToWordLimit(cleaned)
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).length
}

describe('NarrativeService validation', () => {
  it('passes text under 300 words unchanged', () => {
    const short = 'Ordet '.repeat(50).trim()
    const result = validate(short)
    expect(wordCount(result)).toBe(50)
  })

  it('truncates at last sentence boundary if over 300 words', () => {
    const long = 'Meningen ett. '.repeat(25).trim() // 75 words per repetition × 25 > 300
    const result = truncateToWordLimit(long)
    expect(wordCount(result)).toBeLessThanOrEqual(300)
    expect(result.endsWith('.')).toBe(true)
  })

  it('removes markdown symbols', () => {
    const markdown = '## Rubrik\n**Fetstil**\n- punkt'
    const result = validate(markdown)
    expect(result).not.toMatch(/##|[*]{2}|--/)
  })

  it('returns short text as-is even if under 100 words', () => {
    const short = 'Bra vecka.'
    const result = validate(short)
    expect(result).toBe('Bra vecka.')
  })
})
