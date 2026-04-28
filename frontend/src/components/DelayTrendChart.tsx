import React, { useEffect, useRef } from 'react'
import type { TrendPoint } from '../types'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

interface Props {
  trend: TrendPoint[]
  title?: string
}

export function DelayTrendChart({ trend, title = 'Fördröjningstrend' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    chartRef.current?.destroy()

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: trend.map(p => p.label),
        datasets: [
          {
            label: 'Försenade (%)',
            data: trend.map(p => p.delayedPercent),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.1)',
            spanGaps: false,  // null values render as visible gaps
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx =>
                ctx.parsed.y !== null ? `${ctx.parsed.y.toFixed(1)}%` : 'Ingen data',
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { callback: v => `${v}%` },
          },
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [trend])

  return (
    <div className="ul-card">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      <canvas ref={canvasRef} />
    </div>
  )
}
