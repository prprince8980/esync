async function request(path, payload) {
  let response
  try {
    response = await fetch(`/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch {
    throw new Error('The server is unavailable. Please try again.')
  }

  const data = await response.json().catch(() => ({ success: false, message: 'Unexpected server response.' }))
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Something went wrong.')
  }
  return data
}

export const signup = (payload) => request('signup', payload)
export const signin = (payload) => request('signin', payload)
