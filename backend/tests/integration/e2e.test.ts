import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { linesRouter } from '../../src/api/lines'
import { reportsRouter } from '../../src/api/reports'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/lines', linesRouter)
  app.use('/api/lines', reportsRouter)
  return app
}

describe('T058: E2E smoke test — GET /api/lines/1/report', () => {
  it('returns a complete Report within 10 seconds', async () => {
    const app = buildApp()
    const start = Date.now()
    const res = await request(app)
      .get('/api/lines/1/report')
      .query({ startDate: '2026-04-21', endDate: '2026-04-27' })
      .timeout(10_000)

    const elapsed = Date.now() - start

    expect(res.status).toBe(200)
    expect(elapsed).toBeLessThan(10_000)

    const body = res.body
    expect(body).toMatchObject({
      line: { id: '1' },
      kpi: expect.objectContaining({
        scheduledDepartures: expect.any(Number),
      }),
      trend: expect.any(Array),
      timeOfDay: expect.any(Array),
      stops: expect.any(Array),
      generatedAt: expect.any(String),
    })

    // narrative may be null in test env (no ANTHROPIC_API_KEY), that is OK
    expect(body).toHaveProperty('narrative')
  })
})
