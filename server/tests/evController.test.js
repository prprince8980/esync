import test from 'node:test'
import assert from 'node:assert/strict'
import { buildVehicleLookupQuery, normalizeVehicleIdentifier } from '../controllers/evController.js'

test('normalizes EV identifiers consistently', () => {
  assert.equal(normalizeVehicleIdentifier('  ev-1002  '), 'EV-1002')
  assert.equal(normalizeVehicleIdentifier('test ev'), 'TEST EV')
})

test('builds a MongoDB query using vehicle identifiers and fallback name matches', () => {
  const query = buildVehicleLookupQuery('EV-1002')
  assert.ok(Array.isArray(query.$or))
  assert.equal(query.$or[0].vehicleNumber, 'EV-1002')
  assert.ok(query.$or.some((entry) => entry.vehicleName && entry.vehicleName.$regex === 'EV-1002'))
})
