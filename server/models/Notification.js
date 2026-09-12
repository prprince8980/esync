import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['solar_opportunity', 'weather_update', 'energy_saving'], default: 'solar_opportunity' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  recommendation: String,
  solarPotential: Number,
  solarScore: Number,
  recommendedStart: Date,
  recommendedEnd: Date,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

export default mongoose.model('Notification', notificationSchema)
