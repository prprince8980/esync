import mongoose from 'mongoose'

const evTelemetrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceId: { type: String, trim: true, maxlength: 120, required: true },
  vehicleName: { type: String, trim: true, maxlength: 120, default: 'My EV' },
  batteryPercent: { type: Number, min: 0, max: 100, required: true },
  targetPercent: { type: Number, min: 1, max: 100, default: 80 },
  rangeKm: { type: Number, min: 0, default: 0 },
  chargingStatus: { type: String, enum: ['charging', 'complete', 'idle', 'offline'], default: 'idle' },
  powerKw: { type: Number, min: 0, default: 0 },
  energyDeliveredKwh: { type: Number, min: 0, default: 0 },
  renewableShare: { type: Number, min: 0, max: 100, default: 0 },
  recordedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true })

evTelemetrySchema.index({ userId: 1, recordedAt: -1 })

export default mongoose.model('EvTelemetry', evTelemetrySchema)
