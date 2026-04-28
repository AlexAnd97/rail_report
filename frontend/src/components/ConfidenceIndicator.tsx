import React from 'react'
import type { ConfidenceLevel } from '../types'

interface Props {
  confidence: ConfidenceLevel
  note: string
}

const colours: Record<ConfidenceLevel, string> = {
  Hög: 'bg-green-50 text-green-800 ring-green-200',
  Medium: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
  Låg: 'bg-red-50 text-red-800 ring-red-200',
}

export function ConfidenceIndicator({ confidence, note }: Props) {
  if (confidence === 'Hög' && !note) return null

  return (
    <div className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ring-1 ${colours[confidence]}`}>
      <span className="font-semibold">Datakvalitet: {confidence}</span>
      {note && <span>— {note}</span>}
    </div>
  )
}
