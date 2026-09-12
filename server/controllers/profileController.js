import User from '../models/User.js'
import { geocodeLocation } from '../services/weatherService.js'

function publicProfile(user) {
  return { id: user._id.toString(), fullName: user.fullName, email: user.email, userType: user.userType, city: user.city || '', state: user.state || '', country: user.country || '', latitude: user.latitude ?? null, longitude: user.longitude ?? null }
}

export function getProfile(req, res) {
  return res.json({ success: true, user: publicProfile(req.user) })
}

export async function updateProfile(req, res) {
  const latitude = Number(req.body?.latitude)
  const longitude = Number(req.body?.longitude)
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return res.status(400).json({ success: false, message: 'Invalid live location coordinates.' })
    const updated = await User.findByIdAndUpdate(req.user._id, { latitude, longitude }, { new: true, runValidators: true }).lean()
    return res.json({ success: true, user: publicProfile(updated), message: 'Live location updated.' })
  }

  const city = typeof req.body?.city === 'string' ? req.body.city.trim() : ''
  const country = typeof req.body?.country === 'string' ? req.body.country.trim() : ''
  if (!city || city.length > 100) return res.status(400).json({ success: false, message: 'Please enter a valid city.' })
  try {
    const place = await geocodeLocation({ city, country })
    const updated = await User.findByIdAndUpdate(req.user._id, { city: place.city, state: place.state, country: place.country.slice(0, 80), latitude: place.latitude, longitude: place.longitude }, { new: true, runValidators: true }).lean()
    return res.json({ success: true, user: publicProfile(updated), message: 'Location updated.' })
  } catch (error) {
    return res.status(error.code === 'INVALID_LOCATION' ? 400 : 503).json({ success: false, message: error.code === 'INVALID_LOCATION' ? 'We could not find that location.' : 'Location information is temporarily unavailable.' })
  }
}
