import mongoose from 'mongoose'

const energyReadingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceId: { type: String, trim: true, maxlength: 120 },
  source: { type: String, enum: ['esp32', 'inverter', 'ev_charger', 'meter', 'manual'], default: 'manual' },
  renewableKwh: { type: Number, min: 0, required: true },
  gridKwh: { type: Number, min: 0, required: true },
  loadKwh: { type: Number, min: 0, required: true },
  cost: { type: Number, min: 0, default: 0 },
  carbonKg: { type: Number, min: 0, default: 0 },
  recordedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true })

energyReadingSchema.index({ userId: 1, recordedAt: -1 })

export default mongoose.model('EnergyReading', energyReadingSchema)
