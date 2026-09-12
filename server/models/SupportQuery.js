import mongoose from 'mongoose'

const supportQuerySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
  category: { type: String, required: true, enum: ['Account', 'Energy Management', 'EV & Charging', 'Solar & Renewable Energy', 'Payments', 'Technical Issues', 'Getting started', 'Energy & analytics', 'Account & privacy', 'EV charging', 'Other'] },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  matchedQuestion: { type: String, default: null },
  suggestedSolution: { type: String, default: null },
  matchConfidence: { type: Number, default: 0 },
  status: { type: String, enum: ['suggested', 'escalated'], default: 'suggested' },
}, { timestamps: true })

export default mongoose.model('SupportQuery', supportQuerySchema)