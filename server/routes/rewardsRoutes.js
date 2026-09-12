import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import {
  getBalance,
  getHistory,
  earnCoins,
  redeemCoins,
  getVouchers,
  getStats
} from '../controllers/rewardsController.js'

const router = express.Router()

// All reward routes require authentication
router.use(requireAuth)

// Get current balance
router.get('/balance', getBalance)

// Get transaction history
router.get('/history', getHistory)

// Get reward statistics
router.get('/stats', getStats)

// Earn coins
router.post('/earn', earnCoins)

// Redeem voucher
router.post('/redeem', redeemCoins)

// Get available vouchers
router.get('/vouchers', getVouchers)

export default router
