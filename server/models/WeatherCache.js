import mongoose from 'mongoose'

const weatherCacheSchema = new mongoose.Schema({
  locationKey: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  temperature: Number,
  cloudCover: Number,
  humidity: Number,
  windSpeed: Number,
  solarRadiation: Number,
  directRadiation: Number,
  diffuseRadiation: Number,
  precipitationProbability: Number,
  condition: String,
  timezone: String,
  sunrise: Date,
  sunset: Date,
  forecast: [{
    date: Date,
    temperature: Number,
    cloudCover: Number,
    condition: String,
    sunrise: Date,
    sunset: Date,
    shortwaveRadiation: Number,
    directRadiation: Number,
    diffuseRadiation: Number,
    precipitationProbability: Number,
    score: Number,
    rating: String,
    isDaylight: Boolean
  }],
  solarPotential: Number,
  fetchedAt: { type: Date, default: Date.now, expires: 900 }
}, { timestamps: true })

export default mongoose.model('WeatherCache', weatherCacheSchema)
