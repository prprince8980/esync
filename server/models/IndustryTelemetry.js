import mongoose from 'mongoose'

const industryTelemetrySchema = new mongoose.Schema(
  {
    industryNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    solarPower: {
      type: Number,
      default: 0,
      min: 0
    },
    windPower: {
      type: Number,
      default: 0,
      min: 0
    },
    gridPower: {
      type: Number,
      default: 0,
      min: 0
    },
    totalLoad: {
      type: Number,
      default: 0,
      min: 0
    },
    productionLoad: {
      type: Number,
      default: 0,
      min: 0
    },
    hvacLoad: {
      type: Number,
      default: 0,
      min: 0
    },
    pumpLoad: {
      type: Number,
      default: 0,
      min: 0
    },
    lightingLoad: {
      type: Number,
      default: 0,
      min: 0
    },
    otherLoad: {
      type: Number,
      default: 0,
      min: 0
    },
    renewableShare: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    deviceStatus: {
      type: String,
      default: 'online',
      enum: ['online', 'offline']
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
)

export default mongoose.model('IndustryTelemetry', industryTelemetrySchema)
