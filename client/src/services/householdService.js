async function request(path, options = {}) {
  const token = localStorage.getItem('esync_token')
  let response
  try {
    response = await fetch(`/api/${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } })
  } catch {
    throw new Error('The server is unavailable. Please try again.')
  }
  const data = await response.json().catch(() => ({ success: false, message: 'Unexpected server response.' }))
  if (response.status === 401) {
    localStorage.removeItem('esync_token')
    throw new Error('Your session has expired. Please sign in again.')
  }
  if (!response.ok || !data.success) { const error = new Error(data.message || 'Something went wrong.'); error.code = data.code; throw error }
  return data
}

export const getDashboard = () => request('household/recommendations')
export const getNotifications = () => request('notifications')
export const markNotificationRead = (id) => request(`notifications/${id}/read`, { method: 'PATCH' })
export const markAllNotificationsRead = () => request('notifications/read-all', { method: 'PATCH' })
export const deleteNotification = (id) => request(`notifications/${id}`, { method: 'DELETE' })
export const getProfile = () => request('profile')
export const updateProfile = (payload) => request('profile', { method: 'PATCH', body: JSON.stringify(payload) })
