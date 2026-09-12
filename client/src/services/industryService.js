async function request(path, options = {}) {
  const token = localStorage.getItem('esync_token')
  let response
  try {
    response = await fetch(`/api/industry/${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    })
  } catch {
    throw new Error('The server is unavailable. Please try again.')
  }

  const data = await response.json().catch(() => ({ success: false, message: 'Unexpected server response.' }))
  if (response.status === 401) {
    localStorage.removeItem('esync_token')
    throw new Error('Your session has expired. Please sign in again.')
  }
  if (!response.ok || !data.success) throw new Error(data.message || 'Industry data request failed.')
  return data
}

export const registerIndustry = (payload) => request('register', { method: 'POST', body: JSON.stringify(payload) })
export const loginIndustry = (payload) => request('login', { method: 'POST', body: JSON.stringify(payload) })
export const getIndustryDashboard = () => request('dashboard')
export const getIndustryReports = () => request('reports')
export const getIndustryRewards = () => request('rewards')
export const sendIndustryTelemetry = (payload) => request('telemetry', { method: 'POST', body: JSON.stringify(payload) })
