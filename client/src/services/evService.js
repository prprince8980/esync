async function request(path, options = {}, query = {}) {
  const token = localStorage.getItem('esync_token')
  const params = new URLSearchParams(query)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  let response
  try {
    response = await fetch(`/api/ev/${path}${suffix}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } })
  } catch {
    throw new Error('The server is unavailable. Please try again.')
  }
  const data = await response.json().catch(() => ({ success: false, message: 'Unexpected server response.' }))
  if (response.status === 401) { localStorage.removeItem('esync_token'); throw new Error('Your session has expired. Please sign in again.') }
  if (!response.ok || !data.success) throw new Error(data.message || 'EV data request failed.')
  return data
}

export const lookupVehicle = (payload) => request('verify', { method: 'POST', body: JSON.stringify(payload) })
export const getEvDashboard = (vehicleNumber) => request('dashboard', {}, vehicleNumber ? { vehicleNumber } : {})
export const recordEvTelemetry = (payload) => request('telemetry', { method: 'POST', body: JSON.stringify(payload) })
