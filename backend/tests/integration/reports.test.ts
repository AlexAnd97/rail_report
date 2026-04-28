import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { linesRouter } from '../../src/api/lines'
import { reportsRouter } from '../../src/api/reports'

// ---------------------------------------------------------------------------
// Test app setup
// ---------------------------------------------------------------------------

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/lines', linesRouter)
  app.use('/api/lines', reportsRouter)
  return app
}

describe('API validation', () => {
  const app = buildApp()

  it('GET /api/lines returns array', async () => {
    const res = await request(app).get('/api/lines')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('GET /api/lines/:id/report — PERIOD_TOO_LONG', async () => {
    const res = await request(app)
      .get('/api/lines/1/report')
      .query({ startDate: '2026-01-01', endDate: '2026-03-01' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('PERIOD_TOO_LONG')
  })

  it('GET /api/lines/:id/report — INVALID_DATE (bad format)', async () => {
    const res = await request(app)
      .get('/api/lines/1/report')
      .query({ startDate: 'not-a-date', endDate: '2026-04-21' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_DATE')
  })

  it('GET /api/lines/:id/report — END_BEFORE_START', async () => {
    const res = await request(app)
      .get('/api/lines/1/report')
      .query({ startDate: '2026-04-27', endDate: '2026-04-21' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('END_BEFORE_START')
  })

  it('GET /api/lines/:id/report — LINE_NOT_FOUND', async () => {
    const res = await request(app)
      .get('/api/lines/9999/report')
      .query({ startDate: '2026-04-21', endDate: '2026-04-27' })
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('LINE_NOT_FOUND')
  })

  it('GET /api/lines/:id/report — returns a Report for valid inputs', async () => {
    const res = await request(app)
      .get('/api/lines/1/report')
      .query({ startDate: '2026-04-21', endDate: '2026-04-27' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('kpi')
    expect(res.body).toHaveProperty('trend')
    expect(res.body).toHaveProperty('timeOfDay')
    expect(res.body.kpi.scheduledDepartures).toBeGreaterThan(0)
  })

  it('GET /api/lines/:id/stops — returns stops array', async () => {
    const res = await request(app).get('/api/lines/1/stops')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /api/lines/:id/stops/:stopId/report — STOP_NOT_FOUND', async () => {
    const res = await request(app)
      .get('/api/lines/1/stops/UNKNOWN/report')
      .query({ startDate: '2026-04-21', endDate: '2026-04-27' })
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('STOP_NOT_FOUND')
  })
})
