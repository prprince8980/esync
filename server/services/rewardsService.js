import User from '../models/User.js'
import EcoCoinTransaction from '../models/EcoCoinTransaction.js'

/**
 * Award coins to a user with duplicate prevention
 * @param {string} userId - The user's MongoDB ID
 * @param {number} amount - Number of coins to award
 * @param {string} category - Reward category
 * @param {string} description - Human-readable description
 * @param {string} eventId - Optional unique event ID to prevent duplicates
 * @param {object} session - Optional MongoDB session for transactions
 * @returns {Promise<{success: boolean, balance: number, transaction: object, isDuplicate: boolean}>}
 */
export async function awardCoins(userId, amount, category, description, eventId = null, session = null) {
  try {
    // Validate inputs
    if (!userId || typeof amount !== 'number' || amount <= 0) {
      return { success: false, message: 'Invalid amount', isDuplicate: false }
    }

    const validCategories = [
      'HOUSEHOLD_SAVING',
      'EV_SMART_CHARGING',
      'INDUSTRY_LOAD_SHIFT',
      'RENEWABLE_USAGE'
    ]

    if (!validCategories.includes(category)) {
      return { success: false, message: 'Invalid category', isDuplicate: false }
    }

    if (!description || typeof description !== 'string') {
      return { success: false, message: 'Invalid description', isDuplicate: false }
    }

    // Check for duplicate event if eventId is provided
    if (eventId) {
      const existingTransaction = await EcoCoinTransaction.findOne(
        { eventId, userId },
        null,
        session ? { session } : {}
      )

      if (existingTransaction) {
        return {
          success: false,
          message: 'This event has already been rewarded',
          isDuplicate: true,
          balance: (await User.findById(userId).select('ecoCoins').session(session ? session : undefined)).ecoCoins
        }
      }
    }

    // Update user balance atomically
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { ecoCoins: amount } },
      { new: true, session },
      session ? { session } : {}
    ).select('ecoCoins')

    if (!updatedUser) {
      return { success: false, message: 'User not found', isDuplicate: false }
    }

    // Record transaction
    const transactionData = {
      userId,
      amount,
      type: 'EARN',
      category,
      description: description.trim(),
      balanceAfter: updatedUser.ecoCoins
    }

    if (eventId) {
      transactionData.eventId = eventId
    }

    const transaction = await (session
      ? EcoCoinTransaction.create([transactionData], { session })
      : EcoCoinTransaction.create(transactionData))

    return {
      success: true,
      balance: updatedUser.ecoCoins,
      transaction: session ? transaction[0] : transaction,
      isDuplicate: false
    }
  } catch (error) {
    console.error('Error awarding coins:', error)
    return { success: false, message: error.message, isDuplicate: false }
  }
}

/**
 * Award coins based on energy reading for households
 * Triggers when renewable energy is used
 */
export async function awardHouseholdRenewableCoins(userId, renewableKwh, eventId) {
  if (!renewableKwh || renewableKwh < 0.5) {
    return { success: false, isDuplicate: false }
  }

  const coins = renewableKwh >= 1 ? 10 : 5
  return awardCoins(
    userId,
    coins,
    'RENEWABLE_USAGE',
    `Used ${renewableKwh.toFixed(2)} kWh of renewable energy`,
    eventId
  )
}

/**
 * Award coins for successful load shifting
 */
export async function awardLoadShiftingCoins(userId, eventId) {
  return awardCoins(
    userId,
    10,
    'HOUSEHOLD_SAVING',
    'Successfully completed energy-saving action',
    eventId
  )
}

/**
 * Award coins for EV smart charging during renewable window
 */
export async function awardEvChargingCoins(userId, energyDeliveredKwh, renewablePercent, eventId) {
  if (renewablePercent < 50) {
    return { success: false, isDuplicate: false }
  }

  const baseCoins = 15
  const bonusCoins = renewablePercent >= 80 ? 5 : 0
  const totalCoins = baseCoins + bonusCoins

  return awardCoins(
    userId,
    totalCoins,
    'EV_SMART_CHARGING',
    `Charged during ${Math.round(renewablePercent)}% renewable energy window`,
    eventId
  )
}

/**
 * Award coins for industry load shifting
 */
export async function awardIndustryLoadShiftCoins(userId, loadShiftedKwh, eventId) {
  const coins = Math.min(50, Math.floor(loadShiftedKwh / 10) * 5 + 20)

  return awardCoins(
    userId,
    coins,
    'INDUSTRY_LOAD_SHIFT',
    `Shifted ${loadShiftedKwh.toFixed(2)} kWh of industrial load`,
    eventId
  )
}
