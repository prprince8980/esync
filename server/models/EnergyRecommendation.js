import mongoose from 'mongoose'

const energyRecommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  location: String,
  latitude: Number,
  longitude: Number,
  solarPotential: { type: Number, required: true, min: 0, max: 100 },
  rating: String,
  summary: String,
  recommendation: String,
  weatherSummary: String,
  recommendedStart: Date,
  recommendedEnd: Date,
  daylightHours: Number,
  generatedAt: { type: Date, default: Date.now, expires: 86400 }
}, { timestamps: true })

export default mongoose.model('EnergyRecommendation', energyRecommendationSchema)
