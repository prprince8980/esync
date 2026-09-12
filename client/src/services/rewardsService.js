const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_REWARDS = `${API_BASE}/api/rewards`

function getHeaders() {
  const token = localStorage.getItem('esync_token')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

function handleResponse(response) {
  if (!response.ok) {
    throw new Error(response.statusText || 'Network error')
  }
  return response.json().then((data) => {
    if (!data.success) {
      throw new Error(data.message || 'Request failed')
    }
    return data
  })
}

export async function getBalance() {
  const response = await fetch(`${API_REWARDS}/balance`, {
    method: 'GET',
    headers: getHeaders()
  })
  return handleResponse(response)
}

export async function getHistory(limit = 50, skip = 0) {
  const response = await fetch(`${API_REWARDS}/history?limit=${limit}&skip=${skip}`, {
    method: 'GET',
    headers: getHeaders()
  })
  return handleResponse(response)
}

export async function getStats() {
  const response = await fetch(`${API_REWARDS}/stats`, {
    method: 'GET',
    headers: getHeaders()
  })
  return handleResponse(response)
}

export async function earnCoins(amount, category, description, eventId = null) {
  const response = await fetch(`${API_REWARDS}/earn`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount, category, description, eventId })
  })
  return handleResponse(response)
}

export async function getVouchers() {
  const response = await fetch(`${API_REWARDS}/vouchers`, {
    method: 'GET',
    headers: getHeaders()
  })
  return handleResponse(response)
}

export async function redeemVoucher(voucherId, coinsToSpend) {
  const response = await fetch(`${API_REWARDS}/redeem`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ voucherId, coinsToSpend })
  })
  return handleResponse(response)
}
