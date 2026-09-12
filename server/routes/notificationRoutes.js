import { Router } from 'express'
import { deleteNotification, listNotifications, markAllRead, markRead } from '../controllers/notificationController.js'
import { requireAuth, requireHousehold } from '../middleware/authMiddleware.js'

const router = Router()
router.use(requireAuth, requireHousehold)
router.get('/', listNotifications)
router.patch('/:id/read', markRead)
router.patch('/read-all', markAllRead)
router.delete('/:id', deleteNotification)
export default router
