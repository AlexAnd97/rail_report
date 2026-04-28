import React, { useState } from 'react'

export interface DateRange {
  startDate: string
  endDate: string
}

interface Props {
  onChange: (range: DateRange) => void
}

type Preset = 'yesterday' | 'last_week' | 'custom'

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getPresetRange(preset: Preset): DateRange {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  if (preset === 'yesterday') {
    const y = new Date(today)
    y.setUTCDate(y.getUTCDate() - 1)
    return { startDate: toDateStr(y), endDate: toDateStr(y) }
  }

  if (preset === 'last_week') {
    const end = new Date(today)
    end.setUTCDate(end.getUTCDate() - 1)
    const start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 6)
    return { startDate: toDateStr(start), endDate: toDateStr(end) }
  }

  // custom — return last 7 days as default
  const end = new Date(today)
  end.setUTCDate(end.getUTCDate() - 1)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)
  return { startDate: toDateStr(start), endDate: toDateStr(end) }
}

const MAX_DAYS = 31

export function PeriodPicker({ onChange }: Props) {
  const [preset, setPreset] = useState<Preset>('last_week')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const [validationError, setValidationError] = useState<string | null>(null)

  function handlePresetChange(p: Preset) {
    setPreset(p)
    setValidationError(null)
    if (p !== 'custom') {
      onChange(getPresetRange(p))
    }
  }

  function handleCustomApply() {
    if (!customStart || !customEnd) {
      setValidationError('Välj både start- och slutdatum.')
      return
    }
    const start = new Date(customStart + 'T00:00:00Z')
    const end = new Date(customEnd + 'T00:00:00Z')

    if (end < start) {
      setValidationError('Slutdatum måste vara efter startdatum.')
      return
    }

    const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    if (diffDays > MAX_DAYS) {
      setValidationError(`Anpassad period får inte överstiga ${MAX_DAYS} dagar.`)
      return
    }

    setValidationError(null)
    onChange({ startDate: customStart, endDate: customEnd })
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-800">Period</label>
      <div className="flex gap-2">
        {(['yesterday', 'last_week', 'custom'] as Preset[]).map(p => (
          <button
            key={p}
            onClick={() => handlePresetChange(p)}
            className={preset === p ? 'btn-pill-active' : 'btn-pill-inactive'}
          >
            {p === 'yesterday' ? 'Igår' : p === 'last_week' ? 'Föregående vecka' : 'Anpassad'}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Från</label>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="ul-input w-auto"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Till</label>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="ul-input w-auto"
              />
            </div>
            <button
              onClick={handleCustomApply}
              className="btn-ul"
            >
              Visa
            </button>
          </div>
          {validationError && (
            <p className="text-sm text-red-600" role="alert">{validationError}</p>
          )}
        </div>
      )}
    </div>
  )
}
