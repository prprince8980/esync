import { Router } from 'express'
import { getProfile, updateProfile } from '../controllers/profileController.js'
import { requireAuth, requireHousehold } from '../middleware/authMiddleware.js'

const router = Router()
router.use(requireAuth, requireHousehold)
router.get('/', getProfile)
router.patch('/', updateProfile)
export default router
