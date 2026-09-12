import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' })
  if (!process.env.JWT_SECRET) return res.status(503).json({ success: false, message: 'Authentication is not configured.' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).lean()
    if (!user) return res.status(401).json({ success: false, message: 'Session is no longer valid.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Session is invalid or expired.' })
  }
}

export function requireHousehold(req, res, next) {
  if (req.user?.userType !== 'household') {
    return res.status(403).json({ success: false, message: 'This area is available to household accounts only.' })
  }
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.userType)) return res.status(403).json({ success: false, message: 'This area is not available for this account.' })
    next()
  }
}
