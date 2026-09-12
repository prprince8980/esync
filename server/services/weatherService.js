import WeatherCache from '../models/WeatherCache.js'
import { bestSolarWindow, calculateSolarPotential } from './solarPredictionService.js'

const weatherBase = 'https://api.open-meteo.com/v1/forecast'
const geoBase = 'https://geocoding-api.open-meteo.com/v1/search'

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) { const error = new Error(`Weather provider returned ${response.status}`); error.status = response.status; throw error }
  return response.json()
}

function locationKey(location) { return `${Number(location.latitude).toFixed(4)},${Number(location.longitude).toFixed(4)}` }
function asDate(value) { return value ? new Date(value) : null }

export async function geocodeLocation({ city, country }) {
  const query = encodeURIComponent(`${city}${country ? `, ${country}` : ''}`)
  const data = await fetchJson(`${geoBase}?name=${query}&count=1&language=en&format=json`)
  const place = data.results?.[0]
  if (!place) { const error = new Error('Location not found'); error.code = 'INVALID_LOCATION'; throw error }
  return { city: place.name, state: place.admin1 || '', country: place.country || country || '', latitude: Number(place.latitude), longitude: Number(place.longitude) }
}

export async function getWeatherForLocation(location) {
  if (!Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude)) || Math.abs(Number(location.latitude)) > 90 || Math.abs(Number(location.longitude)) > 180) { const error = new Error('Invalid coordinates'); error.code = 'INVALID_LOCATION'; throw error }
  const key = locationKey(location)
  const cached = await WeatherCache.findOne({ locationKey: key }).lean()
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < 15 * 60 * 1000) return { ...cached, bestWindow: bestSolarWindow(cached.forecast) }

  const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude, current: 'temperature_2m,cloud_cover,wind_speed_10m,shortwave_radiation,direct_radiation,diffuse_radiation,precipitation_probability', hourly: 'temperature_2m,cloud_cover,shortwave_radiation,direct_radiation,diffuse_radiation,precipitation_probability', daily: 'sunrise,sunset', timezone: 'auto', forecast_days: '3' })
  const response = await fetchJson(`${weatherBase}?${params}`)
  if (!response.current || !response.hourly || !response.daily) { const error = new Error('Invalid weather response'); error.code = 'WEATHER_UNAVAILABLE'; throw error }
  const sunrise = asDate(response.daily.sunrise?.[0])
  const sunset = asDate(response.daily.sunset?.[0])
  const daylightByDay = new Map((response.daily.time || []).map((day, index) => [day, { sunrise: asDate(response.daily.sunrise?.[index]), sunset: asDate(response.daily.sunset?.[index]) }]))
  const now = new Date()
  const forecast = response.hourly.time.map((time, index) => {
    const date = asDate(time)
    const daylight = daylightByDay.get(time.slice(0, 10)) || { sunrise, sunset }
    const isDaylight = date >= daylight.sunrise && date <= daylight.sunset
    const potential = calculateSolarPotential({ shortwaveRadiation: response.hourly.shortwave_radiation?.[index], directRadiation: response.hourly.direct_radiation?.[index], diffuseRadiation: response.hourly.diffuse_radiation?.[index], cloudCover: response.hourly.cloud_cover?.[index], precipitationProbability: response.hourly.precipitation_probability?.[index], isDaylight })
    return { date, temperature: response.hourly.temperature_2m?.[index], cloudCover: response.hourly.cloud_cover?.[index], shortwaveRadiation: response.hourly.shortwave_radiation?.[index], directRadiation: response.hourly.direct_radiation?.[index], diffuseRadiation: response.hourly.diffuse_radiation?.[index], precipitationProbability: response.hourly.precipitation_probability?.[index], score: potential.score, rating: potential.rating, isDaylight }
  }).filter((item) => item.date >= now).slice(0, 48)
  const current = response.current
  const currentPotential = calculateSolarPotential({ shortwaveRadiation: current.shortwave_radiation, directRadiation: current.direct_radiation, diffuseRadiation: current.diffuse_radiation, cloudCover: current.cloud_cover, precipitationProbability: current.precipitation_probability, isDaylight: now >= sunrise && now <= sunset })
  const data = { locationKey: key, location: [location.city, location.state, location.country].filter(Boolean).join(', '), latitude: Number(location.latitude), longitude: Number(location.longitude), temperature: current.temperature_2m, cloudCover: current.cloud_cover, windSpeed: current.wind_speed_10m, solarRadiation: current.shortwave_radiation, directRadiation: current.direct_radiation, diffuseRadiation: current.diffuse_radiation, precipitationProbability: current.precipitation_probability, condition: currentPotential.rating, sunrise, sunset, forecast, solarPotential: currentPotential.score, fetchedAt: new Date(), timezone: response.timezone }
  data.bestWindow = bestSolarWindow(forecast)
  await WeatherCache.findOneAndUpdate({ locationKey: key }, data, { upsert: true, new: true, setDefaultsOnInsert: true })
  return data
}
