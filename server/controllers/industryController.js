import Industry from '../models/Industry.js'
import IndustryTelemetry from '../models/IndustryTelemetry.js'
import User from '../models/User.js'

const TARIFF_PER_KWH = Number(process.env.ENERGY_TARIFF_PER_KWH) || 8
const GRID_CARBON_FACTOR = Number(process.env.GRID_CARBON_KG_PER_KWH) || 0.7

function normalizeIndustryNumber(value) {
  const text = typeof value === 'string' ? value.trim().toUpperCase() : ''
  // Existing installations may use either a legacy numeric ID (for example 8980)
  // or the newer IND- prefixed format.
  return text && /^[A-Z0-9][A-Z0-9-]{0,39}$/i.test(text) ? text : null
}

function industryDisplayName(industry) {
  return industry?.name || industry?.industryName || 'Industry'
}

function safeNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function buildRecommendation(snapshot) {
  const renewable = safeNumber(snapshot?.renewableShare, 0)
  const window = renewable >= 72 ? '12:00 PM - 2:00 PM' : renewable >= 55 ? '11:30 AM - 2:30 PM' : '1:00 PM - 3:00 PM'
  const renewableEnergy = renewable >= 72 ? 320 : renewable >= 55 ? 240 : 180
  const savings = renewable >= 72 ? 2560 : renewable >= 55 ? 1920 : 1200
  const co2 = Math.round(renewableEnergy * 0.7 * 10) / 10
  const ecoTokens = renewable >= 72 ? 120 : renewable >= 55 ? 80 : 50
  return {
    headline: renewable >= 65 ? '☀️ Renewable peak detected' : '⚡ Renewable availability increased',
    window,
    shiftWindow: window,
    renewableEnergy,
    savings: `₹${savings}`,
    co2,
    ecoTokens,
    message: `High renewable generation is expected between ${window}. Shift flexible industrial loads into this period to use cleaner energy and reduce grid dependence.`
  }
}

function buildLoadBreakdown(latest) {
  const total = Math.max(1, safeNumber(latest?.totalLoad, 0))
  const production = safeNumber(latest?.productionLoad, 0)
  const hvac = safeNumber(latest?.hvacLoad, 0)
  const pump = safeNumber(latest?.pumpLoad, 0)
  const lighting = safeNumber(latest?.lightingLoad, 0)
  const other = Math.max(0, total - production - hvac - pump - lighting)
  return [
    { name: 'Production', value: production, type: 'Core process', share: Math.round((production / total) * 100) },
    { name: 'HVAC', value: hvac, type: 'Cooling', share: Math.round((hvac / total) * 100) },
    { name: 'Pumps', value: pump, type: 'Water & flow', share: Math.round((pump / total) * 100) },
    { name: 'Lighting', value: lighting, type: 'Facility', share: Math.round((lighting / total) * 100) },
    { name: 'Other', value: other, type: 'Balance', share: Math.round((other / total) * 100) }
  ]
}

function buildFlexibleLoads(latest) {
  const total = Math.max(1, safeNumber(latest?.totalLoad, 0))
  const flexibleLoad = Math.max(0, Math.min(total * 0.5, safeNumber(latest?.productionLoad, 0) * 0.35 + safeNumber(latest?.pumpLoad, 0) * 0.25))
  return [
    { name: 'Machine A', current: Math.round(total * 0.22), flexible: true, shiftWindow: '12:00 PM - 2:00 PM', potential: 120 },
    { name: 'Machine B', current: Math.round(total * 0.16), flexible: true, shiftWindow: '11:45 AM - 1:30 PM', potential: 100 },
    { name: 'Machine C', current: Math.round(total * 0.15), flexible: false, shiftWindow: 'Unable to shift', potential: 0 }
  ]
}

function buildTimingChart(history) {
  const labels = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
  if (!history.length) {
    return labels.map((label) => ({ label, renewable: 20 }))
  }
  const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-6)
  return labels.map((label, index) => ({
    label,
    renewable: Math.round((sorted[index]?.solarPower || 0) + (sorted[index]?.windPower || 0) / 2 || 20)
  }))
}

export async function createIndustry(req, res) {
  const { industryNumber, name, industryType, location, installedSolarCapacity, installedWindCapacity, maximumLoad, operatingHours, renewableSources } = req.body ?? {}
  const normalizedNumber = normalizeIndustryNumber(industryNumber)

  if (!normalizedNumber || !name?.trim() || !industryType?.trim() || !location?.trim()) {
    return res.status(400).json({ success: false, message: 'Provide a valid industry number, name, type, and location.' })
  }

  try {
    const existing = await Industry.findOne({ industryNumber: normalizedNumber }).lean()
    if (existing) {
      return res.status(409).json({ success: false, message: `Industry ${normalizedNumber} already exists.` })
    }

    const industry = await Industry.create({
      industryNumber: normalizedNumber,
      name: name.trim(),
      industryType: industryType.trim(),
      location: location.trim(),
      installedSolarCapacity: safeNumber(Number(installedSolarCapacity), 0),
      installedWindCapacity: safeNumber(Number(installedWindCapacity), 0),
      maximumLoad: safeNumber(Number(maximumLoad), 0),
      operatingHours: operatingHours?.trim() || '24/7',
      renewableSources: Array.isArray(renewableSources) && renewableSources.length ? renewableSources : ['Solar'],
      createdBy: req.user?._id || undefined
    })

    return res.status(201).json({ success: true, message: `Industry ${industry.industryNumber} created successfully.`, industry: { id: industry._id.toString(), industryNumber: industry.industryNumber, name: industry.name } })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: `Industry ${normalizedNumber} already exists.` })
    }
    console.error('Create industry error:', error.message)
    return res.status(503).json({ success: false, message: 'We could not create the industry right now.' })
  }
}

export async function loginIndustry(req, res) {
  const industryNumber = normalizeIndustryNumber(req.body?.industryNumber || req.params?.industryNumber)
  if (!industryNumber) {
    return res.status(400).json({ success: false, message: 'Please enter a valid EcoSync Industry Number.' })
  }

  const industry = await Industry.findOne({ industryNumber }).lean()
  if (!industry) {
    return res.status(404).json({ success: false, code: 'INDUSTRY_NOT_FOUND', message: '❌ Industry not found. Please enter a valid EcoSync Industry Number.' })
  }

  if (req.user?.userType !== 'industry') {
    return res.status(403).json({ success: false, message: 'This area is available to industry accounts only.' })
  }

  if (req.user.industryNumber && req.user.industryNumber !== industryNumber) {
    return res.status(403).json({ success: false, message: 'You are not authorized to access this industry.' })
  }

  await User.findByIdAndUpdate(req.user._id, { industryNumber }, { new: true })
  const user = await User.findById(req.user._id).lean()
  req.user = user

  return res.json({ success: true, message: `Welcome to ${industryDisplayName(industry)}.`, industry: { id: industry._id.toString(), industryNumber: industry.industryNumber, name: industryDisplayName(industry), location: industry.location } })
}

export async function getIndustryProfile(req, res) {
  const industryNumber = req.user?.industryNumber || normalizeIndustryNumber(req.params?.industryNumber)
  if (!industryNumber) return res.status(400).json({ success: false, message: 'Industry number is required.' })

  const industry = await Industry.findOne({ industryNumber }).lean()
  if (!industry) return res.status(404).json({ success: false, message: 'Industry not found.' })

  if (req.user?.userType !== 'industry' || req.user.industryNumber !== industryNumber) {
    return res.status(403).json({ success: false, message: 'You are not authorized to access this industry.' })
  }

  return res.json({ success: true, industry })
}

export async function getIndustryDashboard(req, res) {
  const industryNumber = req.user?.industryNumber || normalizeIndustryNumber(req.params?.industryNumber)
  if (!industryNumber) return res.status(400).json({ success: false, message: 'Industry number is required.' })

  const industry = await Industry.findOne({ industryNumber }).lean()
  if (!industry) return res.status(404).json({ success: false, message: 'Industry not found.' })

  if (req.user?.userType !== 'industry' || req.user.industryNumber !== industryNumber) {
    return res.status(403).json({ success: false, message: 'You are not authorized to access this industry.' })
  }

  const latest = await IndustryTelemetry.findOne({ industryNumber }).sort({ timestamp: -1 }).lean()
  const history = await IndustryTelemetry.find({ industryNumber, timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).sort({ timestamp: 1 }).lean()

  const renewableGeneration = safeNumber(latest?.solarPower, 0) + safeNumber(latest?.windPower, 0)
  const gridConsumption = safeNumber(latest?.gridPower, 0)
  const renewableShare = Math.min(100, Math.round((renewableGeneration / Math.max(1, renewableGeneration + gridConsumption)) * 100))
  const renewableEnergy = history.reduce((sum, item) => sum + safeNumber(item.solarPower, 0) + safeNumber(item.windPower, 0), 0)
  const gridEnergy = history.reduce((sum, item) => sum + safeNumber(item.gridPower, 0), 0)
  const totalLoad = safeNumber(latest?.totalLoad, 0)
  const costSaved = renewableEnergy * TARIFF_PER_KWH * 0.5
  const co2Avoided = renewableEnergy * GRID_CARBON_FACTOR

  const dashboard = {
    industry: { ...industry, industryNumber },
    liveStatus: {
      industry: industryDisplayName(industry),
      industryNumber,
      deviceStatus: latest?.deviceStatus === 'offline' ? 'OFFLINE' : 'ONLINE',
      lastTelemetry: latest?.timestamp || new Date(),
      currentLoad: totalLoad,
      renewableGeneration,
      gridConsumption,
      renewableShare
    },
    metrics: {
      renewableEnergy: Math.round(renewableEnergy),
      renewableShare,
      gridEnergy: Math.round(gridEnergy),
      costSaved: Math.round(costSaved),
      co2Avoided: Math.round(co2Avoided),
      ecoTokens: Math.round(renewableShare * 1.8 + (costSaved / 100))
    },
    energySources: {
      solar: safeNumber(latest?.solarPower, 0),
      wind: safeNumber(latest?.windPower, 0),
      grid: safeNumber(latest?.gridPower, 0),
      other: 0
    },
    solarPerformance: {
      current: safeNumber(latest?.solarPower, 0),
      today: Math.round(renewableGeneration * 0.8),
      peak: Math.max(safeNumber(latest?.solarPower, 0), 480),
      peakTime: '12:35 PM',
      utilization: Math.min(100, Math.max(0, Math.round((safeNumber(latest?.solarPower, 0) / Math.max(1, safeNumber(industry.installedSolarCapacity, 500))) * 100)))
    },
    windPerformance: industry.installedWindCapacity > 0 ? {
      current: safeNumber(latest?.windPower, 0),
      today: Math.round((safeNumber(latest?.windPower, 0) || 0) * 8),
      peak: Math.max(safeNumber(latest?.windPower, 0), 180),
      availability: 'High',
      availabilityPercent: 78,
      configured: true
    } : { configured: false, availability: 'Not configured', current: 0 },
    loadBreakdown: buildLoadBreakdown(latest),
    flexibleLoads: buildFlexibleLoads(latest),
    recommendation: buildRecommendation({ renewableShare }),
    timingChart: buildTimingChart(history),
    notifications: [
      { title: 'Solar peak expected in 30 minutes', time: new Date() },
      { title: 'Flexible load opportunity detected', time: new Date() }
    ],
    summary: {
      score: 87,
      status: 'Excellent renewable utilization and reduced grid dependency.',
      annualSavings: Math.round(costSaved * 12),
      annualCo2: Math.round(co2Avoided * 12)
    }
  }

  return res.json({ success: true, dashboard })
}

export async function getIndustryTelemetry(req, res) {
  const industryNumber = req.user?.industryNumber || normalizeIndustryNumber(req.params?.industryNumber)
  if (!industryNumber) return res.status(400).json({ success: false, message: 'Industry number is required.' })

  const telemetry = await IndustryTelemetry.find({ industryNumber }).sort({ timestamp: -1 }).limit(48).lean()
  return res.json({ success: true, telemetry })
}

export async function getIndustryReports(req, res) {
  const dashboard = await getIndustryDashboard({ user: req.user }, { json: (payload) => payload })
  return res.json({ success: true, report: dashboard })
}

export async function getIndustryRewards(req, res) {
  const industryNumber = req.user?.industryNumber || normalizeIndustryNumber(req.params?.industryNumber)
  if (!industryNumber) return res.status(400).json({ success: false, message: 'Industry number is required.' })

  const latest = await IndustryTelemetry.findOne({ industryNumber }).sort({ timestamp: -1 }).lean()
  const ecoTokens = Math.round((safeNumber(latest?.solarPower, 0) + safeNumber(latest?.windPower, 0)) * 0.2)

  return res.json({ success: true, rewards: { balance: ecoTokens, history: [{ label: 'Renewable usage', tokens: Math.round(ecoTokens * 0.6) }, { label: 'Load shifting', tokens: Math.round(ecoTokens * 0.25) }, { label: 'CO₂ reduction', tokens: Math.round(ecoTokens * 0.15) }] } })
}

export async function recordIndustryTelemetry(req, res) {
  const payload = req.body ?? {}
  const industryNumber = normalizeIndustryNumber(payload.industryNumber)
  const solarPower = safeNumber(Number(payload.solarPower), 0)
  const windPower = safeNumber(Number(payload.windPower), 0)
  const gridPower = safeNumber(Number(payload.gridPower), 0)
  const totalLoad = safeNumber(Number(payload.totalLoad), 0)

  if (!industryNumber || !payload || solarPower < 0 || windPower < 0 || gridPower < 0 || totalLoad < 0) {
    return res.status(400).json({ success: false, message: 'Provide valid industry telemetry.' })
  }

  const industry = await Industry.findOne({ industryNumber }).lean()
  if (!industry) {
    return res.status(404).json({ success: false, message: 'Industry not found.' })
  }

  const productionLoad = safeNumber(Number(payload.productionLoad), Math.round(totalLoad * 0.6))
  const hvacLoad = safeNumber(Number(payload.hvacLoad), 0)
  const pumpLoad = safeNumber(Number(payload.pumpLoad), 0)
  const lightingLoad = safeNumber(Number(payload.lightingLoad), 0)
  const otherLoad = safeNumber(Number(payload.otherLoad), Math.max(0, totalLoad - (productionLoad + hvacLoad + pumpLoad + lightingLoad)))
  const renewableShare = totalLoad > 0 ? Math.min(100, Math.round(((solarPower + windPower) / Math.max(1, solarPower + windPower + gridPower)) * 100)) : 0

  const telemetry = await IndustryTelemetry.create({
    industryNumber,
    solarPower,
    windPower,
    gridPower,
    totalLoad,
    productionLoad,
    hvacLoad,
    pumpLoad,
    lightingLoad,
    otherLoad,
    renewableShare,
    deviceStatus: payload.deviceStatus || 'online',
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date()
  })

  return res.status(201).json({ success: true, message: 'Industry telemetry recorded.', telemetry: { id: telemetry._id.toString(), industryNumber, solarPower, windPower, gridPower, totalLoad, renewableShare } })
}
