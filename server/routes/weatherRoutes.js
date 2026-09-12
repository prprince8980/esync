import { Router } from 'express'
import { getRecommendation, getWeather } from '../controllers/weatherController.js'
import { requireAuth, requireHousehold } from '../middleware/authMiddleware.js'

const router = Router()
router.use(requireAuth, requireHousehold)
router.get('/current', getWeather)
router.get('/forecast', getWeather)
router.get('/recommendations', getRecommendation)
router.get('/solar-opportunity', getRecommendation)
export default router
