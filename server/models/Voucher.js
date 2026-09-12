import mongoose from 'mongoose'

const voucherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: '₹'
    },
    coinsRequired: {
      type: Number,
      required: true
    },
    available: {
      type: Boolean,
      default: true,
      index: true
    },
    category: {
      type: String,
      default: 'general'
    },
    icon: {
      type: String,
      default: '🎁'
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
)

export default mongoose.model('Voucher', voucherSchema)
