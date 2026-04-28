import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { linesRouter } from './api/lines'
import { reportsRouter } from './api/reports'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/lines', linesRouter)
app.use('/api/lines', reportsRouter)

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

export { app }
