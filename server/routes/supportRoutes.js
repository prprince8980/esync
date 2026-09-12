import { Router } from 'express'
import { escalateSupportQuery, submitSupportQuery } from '../controllers/supportController.js'

const router = Router()
router.post('/queries', submitSupportQuery)
router.patch('/queries/:id/escalate', escalateSupportQuery)
export default router