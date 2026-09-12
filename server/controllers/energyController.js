import EnergyReading from '../models/EnergyReading.js'
import { awardHouseholdRenewableCoins } from '../services/rewardsService.js'

const DEFAULT_TARIFF = Number(process.env.ENERGY_TARIFF_PER_KWH) || 8
const GRID_CARBON_FACTOR = Number(process.env.GRID_CARBON_KG_PER_KWH) || 0.7

function numberValue(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function calculateMetrics(reading) {
  const total = reading.renewableKwh + reading.gridKwh
  const renewableShare = total > 0 ? (reading.renewableKwh / total) * 100 : 0
  const avoidedGridCost = reading.renewableKwh * DEFAULT_TARIFF
  const avoidedCarbon = reading.renewableKwh * GRID_CARBON_FACTOR
  const ecoTokens = Math.round(renewableShare + avoidedCarbon * 10)
  return { renewableShare: Math.round(renewableShare), avoidedGridCost: Math.round(avoidedGridCost * 100) / 100, avoidedCarbon: Math.round(avoidedCarbon * 100) / 100, ecoTokens }
}

function emptyOverview() {
  return { totals: { renewableKwh: 0, gridKwh: 0, loadKwh: 0, avoidedGridCost: 0, avoidedCarbon: 0, ecoTokens: 0, renewableShare: 0 }, readings: [], report: { periodDays: 30, message: 'Connect an ESP32, inverter, EV charger, or add a manual reading to begin your report.' } }
}

export async function recordEnergy(req, res) {
  const { deviceId, source = 'manual', renewableKwh, gridKwh, loadKwh, cost, recordedAt } = req.body ?? {}
  const values = [renewableKwh, gridKwh, loadKwh]
  if (!['esp32', 'inverter', 'ev_charger', 'meter', 'manual'].includes(source) || values.some((value) => numberValue(value) === null)) return res.status(400).json({ success: false, message: 'Provide valid renewable, grid, and load kWh values.' })
  if (renewableKwh + gridKwh > 0 && loadKwh > (renewableKwh + gridKwh) * 1.5) return res.status(400).json({ success: false, message: 'Load value is outside the expected measurement range.' })
  const reading = await EnergyReading.create({ userId: req.user._id, deviceId, source, renewableKwh, gridKwh, loadKwh, cost: numberValue(cost) ?? gridKwh * DEFAULT_TARIFF, carbonKg: gridKwh * GRID_CARBON_FACTOR, recordedAt: recordedAt ? new Date(recordedAt) : new Date() })
  
  // Award coins for renewable energy usage
  const metrics = calculateMetrics(reading)
  const eventId = `energy-${reading._id}`
  if (renewableKwh > 0) {
    await awardHouseholdRenewableCoins(req.user._id, renewableKwh, eventId)
  }
  
  return res.status(201).json({ success: true, reading: { ...reading.toObject(), metrics } })
}

export async function getEnergyOverview(req, res) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const readings = await EnergyReading.find({ userId: req.user._id, recordedAt: { $gte: since } }).sort({ recordedAt: -1 }).limit(100).lean()
  if (!readings.length) return res.json({ success: true, ...emptyOverview() })
  const totals = readings.reduce((summary, reading) => ({ renewableKwh: summary.renewableKwh + reading.renewableKwh, gridKwh: summary.gridKwh + reading.gridKwh, loadKwh: summary.loadKwh + reading.loadKwh, avoidedGridCost: summary.avoidedGridCost + calculateMetrics(reading).avoidedGridCost, avoidedCarbon: summary.avoidedCarbon + calculateMetrics(reading).avoidedCarbon, ecoTokens: summary.ecoTokens + calculateMetrics(reading).ecoTokens }), { renewableKwh: 0, gridKwh: 0, loadKwh: 0, avoidedGridCost: 0, avoidedCarbon: 0, ecoTokens: 0 })
  const totalEnergy = totals.renewableKwh + totals.gridKwh
  totals.renewableShare = totalEnergy ? Math.round((totals.renewableKwh / totalEnergy) * 100) : 0
  Object.keys(totals).forEach((key) => { if (key !== 'ecoTokens' && key !== 'renewableShare') totals[key] = Math.round(totals[key] * 100) / 100 })
  return res.json({ success: true, totals, readings, report: { periodDays: 30, tariffPerKwh: DEFAULT_TARIFF, gridCarbonFactor: GRID_CARBON_FACTOR, projectedAnnualSavings: Math.round(totals.avoidedGridCost * 12 * 100) / 100 } })
}

export async function getEnergyReport(req, res) {
  const overview = await getEnergyOverviewData(req.user._id)
  return res.json({ success: true, report: { ...overview.report, totals: overview.totals, generatedAt: new Date() } })
}

async function getEnergyOverviewData(userId) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const readings = await EnergyReading.find({ userId, recordedAt: { $gte: since } }).sort({ recordedAt: -1 }).limit(100).lean()
  const totals = readings.reduce((summary, reading) => ({ renewableKwh: summary.renewableKwh + reading.renewableKwh, gridKwh: summary.gridKwh + reading.gridKwh, loadKwh: summary.loadKwh + reading.loadKwh, avoidedGridCost: summary.avoidedGridCost + calculateMetrics(reading).avoidedGridCost, avoidedCarbon: summary.avoidedCarbon + calculateMetrics(reading).avoidedCarbon, ecoTokens: summary.ecoTokens + calculateMetrics(reading).ecoTokens }), { renewableKwh: 0, gridKwh: 0, loadKwh: 0, avoidedGridCost: 0, avoidedCarbon: 0, ecoTokens: 0 })
  const totalEnergy = totals.renewableKwh + totals.gridKwh
  totals.renewableShare = totalEnergy ? Math.round((totals.renewableKwh / totalEnergy) * 100) : 0
  Object.keys(totals).forEach((key) => { if (key !== 'ecoTokens' && key !== 'renewableShare') totals[key] = Math.round(totals[key] * 100) / 100 })
  return { totals, report: { periodDays: 30, tariffPerKwh: DEFAULT_TARIFF, gridCarbonFactor: GRID_CARBON_FACTOR, projectedAnnualSavings: Math.round(totals.avoidedGridCost * 12 * 100) / 100 } }
}
