import mongoose from 'mongoose'
import EvTelemetry from '../models/EvTelemetry.js'
import EnergyReading from '../models/EnergyReading.js'

const STALE_AFTER_MS = 15_000
const TARIFF = Number(process.env.ENERGY_TARIFF_PER_KWH) || 8

const Vehicle = mongoose.models.Vehicle || mongoose.model(
  'Vehicle',
  new mongoose.Schema(
    {
      vehicleName: { type: String, trim: true },
      vehicleNumber: { type: String, trim: true, uppercase: true },
      vehicleType: { type: String, trim: true },
      battery: Number,
      power: Number,
      energyConsumed: Number,
      chargingStatus: String,
      createdAt: Date
    },
    { collection: 'vehicles', timestamps: true }
  ),
  'vehicles'
)

export function normalizeVehicleIdentifier(value) {
  const normalized = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (!normalized) return ''
  return normalized.toUpperCase()
}

export function buildVehicleLookupQuery(value) {
  const normalized = normalizeVehicleIdentifier(value)
  if (!normalized) return { _id: null }

  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return {
    $or: [
      { vehicleNumber: normalized },
      { vehicleNumber: { $regex: `^${escaped}$`, $options: 'i' } },
      { vehicleName: normalized },
      { vehicleName: { $regex: `^${escaped}$`, $options: 'i' } },
      { vehicleName: { $regex: escaped, $options: 'i' } }
    ]
  }
}

function validNumber(value, min = 0, max = Number.POSITIVE_INFINITY) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function formatTelemetry(record) {
  if (!record) return { connected: false, status: 'offline', message: 'Connect your EV device to see live battery data.' }
  const isFresh = Date.now() - new Date(record.recordedAt).getTime() <= STALE_AFTER_MS
  return { ...record, connected: isFresh, status: isFresh ? record.chargingStatus : 'offline', lastSync: record.recordedAt, staleAfterSeconds: STALE_AFTER_MS / 1000 }
}

function buildForecast(vehicle) {
  const share = Number(vehicle?.renewableShare ?? vehicle?.battery ?? 45)
  const peak = Math.max(share, 72)
  return [8, 10, 12, 14, 16, 18, 20].map((hour) => ({ hour, availability: Math.round(Math.max(12, peak - Math.abs(14 - hour) * 9)) }))
}

function buildVehicleSummary(vehicle) {
  if (!vehicle) return null

  const battery = Number(vehicle.battery ?? 0)
  const power = Number(vehicle.power ?? 0)
  const energyConsumed = Number(vehicle.energyConsumed ?? 0)
  const renewableShare = Math.min(95, Math.max(20, Math.round(40 + (power / 80) * 45)))
  const chargingStatus = String(vehicle.chargingStatus || 'idle').toLowerCase()
  const vehicleType = String(vehicle.vehicleType || '2W').toUpperCase()
  const vehicleNumber = normalizeVehicleIdentifier(vehicle.vehicleNumber || vehicle.vehicleName || 'EV')

  return {
    _id: vehicle._id,
    vehicleName: vehicle.vehicleName || 'EV',
    vehicleNumber,
    vehicleType,
    batteryPercent: battery,
    powerKw: power,
    energyConsumedKwh: energyConsumed,
    chargingStatus,
    connected: true,
    status: chargingStatus,
    rangeKm: Math.max(0, Math.round(energyConsumed * 2.2)),
    targetPercent: 80,
    renewableShare,
    lastSync: vehicle.createdAt || new Date(),
    powerFrequency: power >= 55 ? 'High' : power >= 30 ? 'Moderate' : 'Low',
    recommendation: renewableShare >= 65 ? 'Favorable' : 'Wait'
  }
}

export async function lookupVehicle(req, res) {
  const candidate = req.body?.evNumber || req.body?.vehicleNumber || req.body?.vehicleId
  if (!candidate) {
    return res.status(400).json({ success: false, message: 'Please enter an EV Number.' })
  }

  const vehicle = await Vehicle.findOne(buildVehicleLookupQuery(candidate)).lean()
  if (!vehicle) {
    return res.status(404).json({ success: false, code: 'EV_NOT_FOUND', message: 'EV NOT FOUND' })
  }

  return res.json({ success: true, vehicle: buildVehicleSummary(vehicle) })
}

export async function getEvDashboard(req, res) {
  const requestedVehicle = req.query.vehicleNumber || req.query.evNumber || req.query.vehicleId
  const match = requestedVehicle ? buildVehicleLookupQuery(requestedVehicle) : {}
  const vehicle = await Vehicle.findOne(match).sort({ createdAt: -1 }).lean()

  if (!vehicle) {
    return res.status(404).json({ success: false, code: 'EV_NOT_FOUND', message: 'EV NOT FOUND' })
  }

  const dashboardVehicle = buildVehicleSummary(vehicle)
  const availability = dashboardVehicle.renewableShare
  const state = availability >= 70 ? 'good' : availability >= 45 ? 'wait' : 'low'
  const bestWindow = availability >= 70 ? 'Now' : '14:00 - 16:00'

  const telemetry = { ...dashboardVehicle, connected: true, status: dashboardVehicle.chargingStatus || 'charging' }
  const forecast = buildForecast(dashboardVehicle)
  const smartCharging = {
    availability,
    state,
    bestWindow,
    expectedRenewableKwh: Math.round((availability / 100) * 8 * 10) / 10,
    estimatedSaving: Math.round((availability / 100) * 8 * TARIFF),
    carbonAvoided: Math.round((availability / 100) * 8 * 0.7 * 10) / 10,
    ecoTokens: Math.round(availability * 0.28),
    favorable: state === 'good',
    recommendation: state === 'good' ? 'A favorable charging window is available now for your EV.' : 'Charging is moderately favorable; consider scheduling for the next strong renewable window.'
  }

  return res.json({
    success: true,
    vehicle: dashboardVehicle,
    telemetry,
    forecast,
    smartCharging,
    stations: [],
    history: [],
    summary: {
      savedToday: Math.round((availability / 100) * 8 * TARIFF),
      ecoTokens: Math.round(availability * 0.28),
      carbonAvoided: Math.round((availability / 100) * 8 * 0.7 * 10) / 10
    }
  })
}

export async function recordEvTelemetry(req, res) {
  const { deviceId, vehicleName, batteryPercent, targetPercent, rangeKm, chargingStatus, powerKw, energyDeliveredKwh, renewableShare, recordedAt } = req.body ?? {}
  if (!deviceId || !validNumber(batteryPercent, 0, 100) || !validNumber(targetPercent, 1, 100) || !validNumber(rangeKm) || !validNumber(powerKw) || !validNumber(energyDeliveredKwh) || !validNumber(renewableShare, 0, 100) || !['charging', 'complete', 'idle'].includes(chargingStatus)) return res.status(400).json({ success: false, message: 'Provide valid EV telemetry values.' })
  const telemetry = await EvTelemetry.create({ userId: req.user._id, deviceId, vehicleName, batteryPercent, targetPercent, rangeKm, chargingStatus, powerKw, energyDeliveredKwh, renewableShare, recordedAt: recordedAt ? new Date(recordedAt) : new Date() })
  if (chargingStatus === 'charging' || chargingStatus === 'complete') await EnergyReading.create({ userId: req.user._id, deviceId, source: 'ev_charger', renewableKwh: energyDeliveredKwh * renewableShare / 100, gridKwh: energyDeliveredKwh * (1 - renewableShare / 100), loadKwh: energyDeliveredKwh, cost: energyDeliveredKwh * (1 - renewableShare / 100) * TARIFF, carbonKg: energyDeliveredKwh * (1 - renewableShare / 100) * 0.7, recordedAt: telemetry.recordedAt })
  return res.status(201).json({ success: true, telemetry: formatTelemetry(telemetry.toObject()) })
}
