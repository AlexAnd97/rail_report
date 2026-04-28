import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PeriodPicker } from '../src/components/PeriodPicker'

describe('PeriodPicker', () => {
  it('calls onChange when a preset is selected', () => {
    const onChange = vi.fn()
    render(<PeriodPicker onChange={onChange} />)
    fireEvent.click(screen.getByText('Igår'))
    expect(onChange).toHaveBeenCalledOnce()
    const range = onChange.mock.calls[0][0]
    expect(range.startDate).toBe(range.endDate) // yesterday is single day
  })

  it('shows custom date inputs when Anpassad is selected', () => {
    render(<PeriodPicker onChange={vi.fn()} />)
    fireEvent.click(screen.getByText('Anpassad'))
    expect(screen.getByText('Från')).toBeTruthy()
    expect(screen.getByText('Till')).toBeTruthy()
  })

  it('shows validation error for custom period > 31 days', () => {
    render(<PeriodPicker onChange={vi.fn()} />)
    fireEvent.click(screen.getByText('Anpassad'))

    const inputs = screen.getAllByDisplayValue('')
    fireEvent.change(inputs[0], { target: { value: '2026-01-01' } })
    fireEvent.change(inputs[1], { target: { value: '2026-03-15' } })
    fireEvent.click(screen.getByText('Visa'))

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(/31 dagar/)).toBeTruthy()
  })

  it('shows validation error when end is before start', () => {
    render(<PeriodPicker onChange={vi.fn()} />)
    fireEvent.click(screen.getByText('Anpassad'))

    const inputs = screen.getAllByDisplayValue('')
    fireEvent.change(inputs[0], { target: { value: '2026-04-27' } })
    fireEvent.change(inputs[1], { target: { value: '2026-04-21' } })
    fireEvent.click(screen.getByText('Visa'))

    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('calls onChange for valid custom period', () => {
    const onChange = vi.fn()
    render(<PeriodPicker onChange={onChange} />)
    fireEvent.click(screen.getByText('Anpassad'))

    const inputs = screen.getAllByDisplayValue('')
    fireEvent.change(inputs[0], { target: { value: '2026-04-21' } })
    fireEvent.change(inputs[1], { target: { value: '2026-04-27' } })
    fireEvent.click(screen.getByText('Visa'))

    expect(onChange).toHaveBeenCalledWith({ startDate: '2026-04-21', endDate: '2026-04-27' })
  })
})
