import React, { useEffect, useState } from 'react'
import type { Line } from '../types'
import { api } from '../services/api'

interface Props {
  onSelect: (line: Line) => void
  selectedLineId?: string
}

export function LineSelector({ onSelect, selectedLineId }: Props) {
  const [lines, setLines] = useState<Line[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getLines()
      .then(setLines)
      .catch((e: Error) => setError(e.message))
  }, [])

  if (error) {
    return <p className="text-red-600 text-sm">Kunde inte hämta linjer: {error}</p>
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-800" htmlFor="line-select">
        Välj linje
      </label>
      <select
        id="line-select"
        className="ul-input"
        value={selectedLineId ?? ''}
        onChange={e => {
          const line = lines.find(l => l.id === e.target.value)
          if (line) onSelect(line)
        }}
      >
        <option value="" disabled>-- Välj linje --</option>
        {lines.map(line => (
          <option key={line.id} value={line.id}>
            {line.name}
          </option>
        ))}
      </select>
    </div>
  )
}
