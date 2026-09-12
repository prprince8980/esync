async function request(path, options = {}) {
  const token = localStorage.getItem('esync_token')
  let response
  try {
    response = await fetch(`/api/energy/${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } })
  } catch {
    throw new Error('The server is unavailable. Please try again.')
  }
  const data = await response.json().catch(() => ({ success: false, message: 'Unexpected server response.' }))
  if (response.status === 401) {
    localStorage.removeItem('esync_token')
    throw new Error('Your session has expired. Please sign in again.')
  }
  if (!response.ok || !data.success) throw new Error(data.message || 'Energy data request failed.')
  return data
}

export const getEnergyOverview = () => request('overview')
export const getEnergyReport = () => request('report')
export const recordEnergyReading = (payload) => request('readings', { method: 'POST', body: JSON.stringify(payload) })
