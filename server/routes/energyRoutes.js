import { Router } from 'express'
import { getEnergyHistory, getEnergyOverview, getEnergyReport, recordEnergy } from '../controllers/energyController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()
router.use(requireAuth)
router.get('/overview', getEnergyOverview)
router.get('/history', getEnergyHistory)
router.get('/report', getEnergyReport)
router.post('/readings', recordEnergy)

export default router
