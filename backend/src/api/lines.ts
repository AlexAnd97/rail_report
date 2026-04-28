import { Router } from 'express'
import { DataService } from '../services/data/DataService'

export const linesRouter = Router()

linesRouter.get('/', async (_req, res, next) => {
  try {
    const lines = await DataService.getLines()
    res.json(lines)
  } catch (err) {
    next(err)
  }
})
