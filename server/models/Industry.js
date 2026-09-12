import mongoose from 'mongoose'

const industrySchema = new mongoose.Schema(
  {
    industryNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: /^IND-[A-Z0-9-]+$/i
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    industryType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    installedSolarCapacity: {
      type: Number,
      default: 0,
      min: 0
    },
    installedWindCapacity: {
      type: Number,
      default: 0,
      min: 0
    },
    maximumLoad: {
      type: Number,
      default: 0,
      min: 0
    },
    operatingHours: {
      type: String,
      default: '24/7',
      trim: true,
      maxlength: 40
    },
    renewableSources: {
      type: [String],
      default: ['Solar']
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'offline', 'maintenance']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
)

export default mongoose.model('Industry', industrySchema)
