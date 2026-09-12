import EnergyRecommendation from '../models/EnergyRecommendation.js'
import Notification from '../models/Notification.js'
import { bestSolarWindow, buildRecommendation, calculateSolarPotential } from './solarPredictionService.js'

export async function createRecommendation(userId, weather) {
  const now = new Date()
  const isDaylight = weather.sunrise && weather.sunset ? now >= new Date(weather.sunrise) && now <= new Date(weather.sunset) : false
  const { score, rating, reason } = calculateSolarPotential({ shortwaveRadiation: weather.solarRadiation, directRadiation: weather.directRadiation, diffuseRadiation: weather.diffuseRadiation, cloudCover: weather.cloudCover, precipitationProbability: weather.precipitationProbability, isDaylight })
  const window = weather.bestWindow || bestSolarWindow(weather.forecast)
  const content = buildRecommendation({ solarPotential: score, rating, window, isDaylight, reason })
  const recommendation = await EnergyRecommendation.create({ userId, location: weather.location, latitude: weather.latitude, longitude: weather.longitude, solarPotential: score, rating, summary: content.summary, recommendation: content.recommendation, weatherSummary: reason, recommendedStart: window?.start, recommendedEnd: window?.end, daylightHours: content.daylightHours })
  const title = score >= 76 ? '☀️ Excellent Solar Opportunity' : score >= 51 ? '🌤 Good Solar Opportunity' : score >= 26 ? '⛅ Moderate Solar Opportunity' : '☁️ Low Solar Opportunity'
  const recent = await Notification.findOne({ userId, title, createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } })
  if (!recent) await Notification.create({ userId, type: 'solar_opportunity', title, message: content.recommendation, recommendation: content.recommendation, solarPotential: score, solarScore: score, recommendedStart: window?.start, recommendedEnd: window?.end })
  return { ...recommendation.toObject(), solarPotential: score, rating }
}
