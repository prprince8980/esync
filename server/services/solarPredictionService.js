const ratingFor = (score) => score >= 76 ? 'Excellent' : score >= 51 ? 'Good' : score >= 26 ? 'Moderate' : 'Low'

export function calculateSolarPotential(weather) {
  const shortwave = Math.min(100, Math.max(0, (weather.shortwaveRadiation ?? 0) / 10))
  const direct = Math.min(100, Math.max(0, (weather.directRadiation ?? 0) / 8))
  const diffuse = Math.min(100, Math.max(0, (weather.diffuseRadiation ?? 0) / 4))
  const cloudScore = Math.max(0, 100 - (weather.cloudCover ?? 100))
  const precipitationScore = Math.max(0, 100 - (weather.precipitationProbability ?? 0))
  const daylightScore = weather.isDaylight ? 100 : 0
  const score = Math.round(Math.max(0, Math.min(100, shortwave * 0.4 + direct * 0.25 + cloudScore * 0.15 + diffuse * 0.08 + daylightScore * 0.07 + precipitationScore * 0.05)))
  return { score, rating: ratingFor(score), reason: score >= 76 ? 'High solar radiation and low cloud cover are expected.' : score >= 51 ? 'Favorable renewable energy conditions are expected.' : score >= 26 ? 'Solar potential is moderate; a clearer window may be ahead.' : 'Solar radiation is currently limited.' }
}

export function bestSolarWindow(forecast = []) {
  const daylight = forecast.filter((item) => item.isDaylight && item.score >= 51)
  if (!daylight.length) return null
  const sorted = [...daylight].sort((a, b) => new Date(a.date) - new Date(b.date))
  let bestRun = [], run = []
  sorted.forEach((item, index) => {
    const previous = sorted[index - 1]
    if (!previous || new Date(item.date) - new Date(previous.date) <= 3600000 * 1.5) run.push(item)
    else { if (run.length > bestRun.length) bestRun = run; run = [item] }
  })
  if (run.length > bestRun.length) bestRun = run
  const best = [...bestRun].sort((a, b) => b.score - a.score)[0]
  return { start: bestRun[0].date, end: new Date(new Date(bestRun[bestRun.length - 1].date).getTime() + 3600000), peakScore: best.score }
}

export function buildRecommendation({ solarPotential, rating, window, isDaylight, reason }) {
  const start = window?.start ? new Date(window.start) : null
  const end = window?.end ? new Date(window.end) : null
  const daylightHours = start && end ? Math.max(1, Math.round((end - start) / 3600000)) : 0
  if (!isDaylight) return { summary: 'Solar potential is tracked for the next daylight window.', recommendation: 'Plan flexible appliance use during the next recommended daylight period.', daylightHours, reason }
  if (solarPotential >= 76) return { summary: 'Excellent solar opportunity.', recommendation: 'High solar potential is predicted. Use flexible appliances to maximize renewable energy usage.', daylightHours, reason }
  if (solarPotential >= 51) return { summary: 'Good solar opportunity.', recommendation: 'Favorable renewable energy conditions are expected. Consider using flexible appliances now.', daylightHours, reason }
  if (solarPotential >= 26) return { summary: 'Moderate solar opportunity.', recommendation: 'Solar potential is moderate. Consider waiting for a better renewable window if usage is flexible.', daylightHours, reason }
  return { summary: 'Low solar opportunity.', recommendation: 'Solar potential is currently low. Consider postponing flexible energy usage when possible.', daylightHours, reason }
}

export { ratingFor }
