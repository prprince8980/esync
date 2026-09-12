import { Router } from 'express'
import { getRecommendation } from '../controllers/weatherController.js'
import { requireAuth, requireHousehold } from '../middleware/authMiddleware.js'

const router = Router()
router.use(requireAuth, requireHousehold)
router.get('/recommendations', getRecommendation)
export default router
