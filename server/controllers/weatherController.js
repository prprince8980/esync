import { getWeatherForLocation } from '../services/weatherService.js'
import { createRecommendation } from '../services/recommendationService.js'

function weatherError(error) {
  if (error.code === 'WEATHER_NOT_CONFIGURED') return { status: 503, message: 'Weather information is temporarily unavailable.' }
  if (error.code === 'INVALID_LOCATION') return { status: 400, message: 'We could not find that location.' }
  if (error.status === 401 || error.status === 403) return { status: 503, message: 'Weather information is temporarily unavailable.' }
  return { status: 503, message: 'Weather information is temporarily unavailable.' }
}

export async function getWeather(req, res) {
  if (!Number.isFinite(req.user.latitude) || !Number.isFinite(req.user.longitude)) return res.status(400).json({ success: false, code: 'LOCATION_REQUIRED', message: 'Add your household location to see weather recommendations.' })
  try {
    const weather = await getWeatherForLocation(req.user)
    return res.json({ success: true, weather })
  } catch (error) {
    const mapped = weatherError(error)
    console.error('Weather request failed:', error.message)
    return res.status(mapped.status).json({ success: false, message: mapped.message })
  }
}

export async function getRecommendation(req, res) {
  if (!Number.isFinite(req.user.latitude) || !Number.isFinite(req.user.longitude)) return res.status(400).json({ success: false, code: 'LOCATION_REQUIRED', message: 'Add your household location to see recommendations.' })
  try {
    const weather = await getWeatherForLocation(req.user)
    const recommendation = await createRecommendation(req.user._id, weather)
    return res.json({ success: true, weather, recommendation })
  } catch (error) {
    const mapped = weatherError(error)
    console.error('Recommendation request failed:', error.message)
    return res.status(mapped.status).json({ success: false, message: mapped.message })
  }
}
