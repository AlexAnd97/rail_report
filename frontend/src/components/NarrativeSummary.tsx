import React from 'react'

interface Props {
  narrative: string | null
  loading?: boolean
}

export function NarrativeSummary({ narrative, loading = false }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Genererar sammanfattning…
      </div>
    )
  }

  if (!narrative) return null

  return (
    <div className="ul-card">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Sammanfattning</h2>
      <p className="text-sm leading-relaxed text-gray-800">{narrative}</p>
    </div>
  )
}
