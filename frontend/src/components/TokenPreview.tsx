import React from 'react'

interface Swatch {
  name: string
  bgClass: string
  hex: string
  darkText?: boolean
}

const SWATCHES: Swatch[] = [
  { name: 'ul-yellow',       bgClass: 'bg-ul-yellow',       hex: '#f1c800', darkText: true },
  { name: 'ul-yellow-hover', bgClass: 'bg-ul-yellow-hover', hex: '#d4af00', darkText: true },
  { name: 'ul-yellow-light', bgClass: 'bg-ul-yellow-light', hex: '#fef9d9', darkText: true },
  { name: 'ul-black',        bgClass: 'bg-ul-black',        hex: '#1a1a1a' },
  { name: 'ul-gray',         bgClass: 'bg-ul-gray',         hex: '#6b7280' },
  { name: 'ul-gray-light',   bgClass: 'bg-ul-gray-light',   hex: '#f3f4f6', darkText: true },
  { name: 'ul-white',        bgClass: 'bg-ul-white',        hex: '#ffffff', darkText: true },
]

export function TokenPreview() {
  return (
    <div className="min-h-screen bg-ul-gray-light p-8">
      <h1 className="mb-2 text-2xl font-bold text-ul-black">UL Design Tokens</h1>
      <p className="mb-8 text-sm text-ul-gray">
        Colour tokens defined in <code>tailwind.config.ts</code>. Navigate to{' '}
        <code>?tokens=1</code> to view this page.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {SWATCHES.map(s => (
          <div key={s.name} className="overflow-hidden rounded-xl ring-1 ring-black/10">
            <div
              className={`${s.bgClass} flex h-24 items-end p-3`}
            >
              <span className={`text-xs font-mono font-semibold ${s.darkText ? 'text-ul-black' : 'text-white'}`}>
                {s.hex}
              </span>
            </div>
            <div className="bg-white px-3 py-2">
              <p className="text-xs font-semibold text-gray-800">{s.name}</p>
              <p className="text-xs text-gray-500">bg-{s.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
