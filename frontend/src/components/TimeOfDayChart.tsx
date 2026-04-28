import React, { useEffect, useRef } from 'react'
import type { TimeOfDayBucket } from '../types'
import { Chart, BarController, BarElement, LinearScale, CategoryScale, Tooltip } from 'chart.js'

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip)

interface Props {
  buckets: TimeOfDayBucket[]
}

export function TimeOfDayChart({ buckets }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    chartRef.current?.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: buckets.map(b => b.label),
        datasets: [
          {
            label: 'Försenade (%)',
            data: buckets.map(b => b.delayedPercent),
            backgroundColor: buckets.map(b =>
              b.statisticallyLimited ? 'rgba(156,163,175,0.6)' : 'rgba(37,99,235,0.7)'
            ),
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const bucket = buckets[ctx.dataIndex]
                const base = ctx.parsed.y !== null ? `${(ctx.parsed.y as number).toFixed(1)}%` : 'Ingen data'
                return bucket.statisticallyLimited ? `${base} (statistiskt begränsad)` : base
              },
            },
          },
        },
        scales: {
          y: { min: 0, max: 100, ticks: { callback: v => `${v}%` } },
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [buckets])

  return (
    <div className="ul-card">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Förseningar per timme</h2>
      <canvas ref={canvasRef} />
    </div>
  )
}
