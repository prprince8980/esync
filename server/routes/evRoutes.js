import { Router } from 'express'
import { getEvDashboard, lookupVehicle, recordEvTelemetry } from '../controllers/evController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()
router.use(requireAuth, requireRole('ev_owner'))
router.post('/verify', lookupVehicle)
router.get('/dashboard', getEvDashboard)
router.post('/telemetry', recordEvTelemetry)

export default router