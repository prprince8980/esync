import { Router } from 'express'
import {
  createIndustry,
  getIndustryDashboard,
  getIndustryProfile,
  getIndustryReports,
  getIndustryRewards,
  getIndustryTelemetry,
  loginIndustry,
  recordIndustryTelemetry
} from '../controllers/industryController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/register', createIndustry)
router.post('/login', requireAuth, requireRole('industry'), loginIndustry)
router.get('/profile', requireAuth, requireRole('industry'), getIndustryProfile)
router.get('/dashboard', requireAuth, requireRole('industry'), getIndustryDashboard)
router.get('/telemetry', requireAuth, requireRole('industry'), getIndustryTelemetry)
router.get('/reports', requireAuth, requireRole('industry'), getIndustryReports)
router.get('/rewards', requireAuth, requireRole('industry'), getIndustryRewards)
router.post('/telemetry', recordIndustryTelemetry)

export default router
