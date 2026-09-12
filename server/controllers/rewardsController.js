import mongoose from 'mongoose'
import User from '../models/User.js'
import EcoCoinTransaction from '../models/EcoCoinTransaction.js'
import Voucher from '../models/Voucher.js'

export async function getBalance(req, res) {
  try {
    const user = await User.findById(req.user._id).select('ecoCoins').lean()
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    return res.json({ success: true, balance: user.ecoCoins ?? 0 })
  } catch (error) {
    console.error('Error fetching balance:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch balance.' })
  }
}

export async function getHistory(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const skip = Math.max(Number(req.query.skip) || 0, 0)

    const transactions = await EcoCoinTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()

    const total = await EcoCoinTransaction.countDocuments({ userId: req.user._id })

    return res.json({
      success: true,
      transactions,
      pagination: { total, limit, skip, hasMore: skip + limit < total }
    })
  } catch (error) {
    console.error('Error fetching history:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch transaction history.' })
  }
}

export async function earnCoins(req, res) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { amount, category, description, eventId } = req.body ?? {}

    // Validate input
    if (typeof amount !== 'number' || amount <= 0) {
      await session.abortTransaction()
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' })
    }

    if (!['HOUSEHOLD_SAVING', 'EV_SMART_CHARGING', 'INDUSTRY_LOAD_SHIFT', 'RENEWABLE_USAGE'].includes(category)) {
      await session.abortTransaction()
      return res.status(400).json({ success: false, message: 'Invalid category.' })
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      await session.abortTransaction()
      return res.status(400).json({ success: false, message: 'Description is required.' })
    }

    if (eventId) {
      // Check if this event has already been rewarded
      const existingReward = await EcoCoinTransaction.findOne({ eventId, userId: req.user._id }).session(session)
      if (existingReward) {
        await session.abortTransaction()
        return res.status(400).json({
          success: false,
          message: 'This event has already been rewarded.',
          duplicate: true
        })
      }
    }

    // Update user balance atomically
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { ecoCoins: amount } },
      { new: true, session }
    ).select('ecoCoins')

    // Record transaction
    const transaction = await EcoCoinTransaction.create(
      [
        {
          userId: req.user._id,
          amount,
          type: 'EARN',
          category,
          description: description.trim(),
          eventId: eventId || null,
          balanceAfter: updatedUser.ecoCoins
        }
      ],
      { session }
    )

    await session.commitTransaction()

    return res.status(201).json({
      success: true,
      message: `Earned ${amount} Eco Coins!`,
      balance: updatedUser.ecoCoins,
      transaction: transaction[0]
    })
  } catch (error) {
    await session.abortTransaction()
    console.error('Error earning coins:', error)
    return res.status(500).json({ success: false, message: 'Failed to process coin reward.' })
  } finally {
    await session.endSession()
  }
}

export async function redeemCoins(req, res) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { voucherId, coinsToSpend } = req.body ?? {}

    if (!voucherId || !mongoose.Types.ObjectId.isValid(voucherId)) {
      await session.abortTransaction()
      return res.status(400).json({ success: false, message: 'Invalid voucher ID.' })
    }

    if (typeof coinsToSpend !== 'number' || coinsToSpend <= 0) {
      await session.abortTransaction()
      return res.status(400).json({ success: false, message: 'Invalid coin amount.' })
    }

    // Fetch voucher
    const voucher = await Voucher.findById(voucherId).session(session)
    if (!voucher) {
      await session.abortTransaction()
      return res.status(404).json({ success: false, message: 'Voucher not found.' })
    }

    if (!voucher.available) {
      await session.abortTransaction()
      return res.status(400).json({ success: false, message: 'This voucher is no longer available.' })
    }

    if (voucher.coinsRequired !== coinsToSpend) {
      await session.abortTransaction()
      return res.status(400).json({ success: false, message: 'Coin amount does not match voucher requirement.' })
    }

    // Fetch current user balance
    const user = await User.findById(req.user._id).session(session)
    if (!user) {
      await session.abortTransaction()
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    if (user.ecoCoins < coinsToSpend) {
      await session.abortTransaction()
      const needed = coinsToSpend - user.ecoCoins
      return res.status(400).json({
        success: false,
        message: 'Insufficient Eco Coins.',
        balance: user.ecoCoins,
        needed,
        shortfall: needed
      })
    }

    // Deduct coins atomically
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { ecoCoins: -coinsToSpend } },
      { new: true, session }
    ).select('ecoCoins')

    // Record redemption transaction
    const transaction = await EcoCoinTransaction.create(
      [
        {
          userId: req.user._id,
          amount: coinsToSpend,
          type: 'REDEEM',
          category: 'VOUCHER_REDEMPTION',
          description: `Redeemed ${voucher.currency}${voucher.value} voucher`,
          voucherId: voucher._id,
          balanceAfter: updatedUser.ecoCoins
        }
      ],
      { session }
    )

    await session.commitTransaction()

    return res.json({
      success: true,
      message: `Successfully redeemed ${voucher.currency}${voucher.value} voucher!`,
      balance: updatedUser.ecoCoins,
      transaction: transaction[0],
      voucher: {
        name: voucher.name,
        value: voucher.value,
        currency: voucher.currency
      }
    })
  } catch (error) {
    await session.abortTransaction()
    console.error('Error redeeming coins:', error)
    return res.status(500).json({ success: false, message: 'Failed to redeem voucher.' })
  } finally {
    await session.endSession()
  }
}

export async function getVouchers(req, res) {
  try {
    const vouchers = await Voucher.find({ available: true })
      .sort({ order: 1, coinsRequired: 1 })
      .lean()

    return res.json({ success: true, vouchers })
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch vouchers.' })
  }
}

export async function getStats(req, res) {
  try {
    const transactions = await EcoCoinTransaction.find({ userId: req.user._id }).lean()

    const earned = transactions
      .filter(t => t.type === 'EARN')
      .reduce((sum, t) => sum + t.amount, 0)

    const redeemed = transactions
      .filter(t => t.type === 'REDEEM')
      .reduce((sum, t) => sum + t.amount, 0)

    const user = await User.findById(req.user._id).select('ecoCoins').lean()
    const current = user?.ecoCoins ?? 0

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const thisWeekEarned = transactions
      .filter(t => t.type === 'EARN' && t.createdAt >= weekAgo)
      .reduce((sum, t) => sum + t.amount, 0)

    return res.json({
      success: true,
      stats: {
        current,
        earned,
        redeemed,
        available: current,
        thisWeekEarned,
        totalTransactions: transactions.length
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch statistics.' })
  }
}
