import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    userType: {
      type: String,
      required: true,
      enum: ['household', 'ev_owner', 'industry']
    },
    rememberMe: {
      type: Boolean,
      default: false
    },
    rememberedAt: {
      type: Date,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    industryNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
      match: /^[A-Z0-9][A-Z0-9-]{0,39}$/i
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100
    },
    country: {
      type: String,
      trim: true,
      maxlength: 80
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    ecoCoins: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    }
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
