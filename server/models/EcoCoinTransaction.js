import mongoose from 'mongoose'

const ecocoinTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['EARN', 'REDEEM'],
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: ['HOUSEHOLD_SAVING', 'EV_SMART_CHARGING', 'INDUSTRY_LOAD_SHIFT', 'RENEWABLE_USAGE', 'VOUCHER_REDEMPTION', 'MANUAL_ADJUSTMENT'],
      index: true
    },
    description: {
      type: String,
      required: true
    },
    eventId: {
      type: String,
      sparse: true,
      unique: true,
      index: true
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
)

// Index for efficient querying of user transactions
ecocoinTransactionSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('EcoCoinTransaction', ecocoinTransactionSchema)
