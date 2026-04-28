import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { NarrativeSummary } from '../src/components/NarrativeSummary'
import { ConfidenceIndicator } from '../src/components/ConfidenceIndicator'

describe('NarrativeSummary', () => {
  it('renders narrative text', () => {
    render(<NarrativeSummary narrative="Linje 1 hade en bra vecka." />)
    expect(screen.getByText('Linje 1 hade en bra vecka.')).toBeTruthy()
  })

  it('shows spinner when loading is true', () => {
    render(<NarrativeSummary narrative={null} loading={true} />)
    expect(screen.getByText('Genererar sammanfattning…')).toBeTruthy()
  })

  it('renders nothing when narrative is null and not loading', () => {
    const { container } = render(<NarrativeSummary narrative={null} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('ConfidenceIndicator', () => {
  it('renders nothing for Hög with no note', () => {
    const { container } = render(<ConfidenceIndicator confidence="Hög" note="" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders Medium badge with note', () => {
    render(<ConfidenceIndicator confidence="Medium" note="Data saknas för en del av perioden." />)
    expect(screen.getByText(/Datakvalitet: Medium/)).toBeTruthy()
  })

  it('renders Låg badge', () => {
    render(<ConfidenceIndicator confidence="Låg" note="Stor andel data saknas." />)
    expect(screen.getByText(/Datakvalitet: Låg/)).toBeTruthy()
  })
})
