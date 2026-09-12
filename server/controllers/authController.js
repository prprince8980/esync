import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const allowedUserTypes = new Set(['household', 'ev_owner', 'industry'])
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    userType: user.userType,
    rememberMe: Boolean(user.rememberMe),
    industryNumber: user.industryNumber || '',
    city: user.city || '',
    state: user.state || '',
    country: user.country || '',
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
    ecoCoins: user.ecoCoins ?? 0
  }
}

export async function signup(req, res) {
  const { fullName, email, password, confirmPassword, userType } = req.body ?? {}
  const normalizedEmail = normalizeEmail(email)

  if (!fullName?.trim() || !normalizedEmail || !password || !confirmPassword || !userType) {
    return res.status(400).json({ success: false, message: 'Please complete all required fields.' })
  }
  if (fullName.trim().length < 2 || fullName.trim().length > 80) {
    return res.status(400).json({ success: false, message: 'Full name must be between 2 and 80 characters.' })
  }
  if (!emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' })
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' })
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' })
  }
  if (!allowedUserTypes.has(userType)) {
    return res.status(400).json({ success: false, message: 'Please select a valid user type.' })
  }

  try {
    const existingUser = await User.findOne({ email: normalizedEmail }).lean()
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await User.create({ fullName: fullName.trim(), email: normalizedEmail, passwordHash, userType })

    return res.status(201).json({ success: true, message: 'Account created successfully.' })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' })
    }
    console.error('Signup error:', error.message)
    return res.status(503).json({ success: false, message: 'We could not create your account right now.' })
  }
}

export async function signin(req, res) {
  const { email, password, rememberMe } = req.body ?? {}
  const normalizedEmail = normalizeEmail(email)
  const shouldRemember = Boolean(rememberMe)

  if (!normalizedEmail || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' })
  }
  if (!emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' })
  }

  try {
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash')
    const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        rememberMe: shouldRemember,
        rememberedAt: shouldRemember ? new Date() : null,
        lastLoginAt: new Date()
      },
      { new: true }
    ).select('+passwordHash')

    const token = jwt.sign({ sub: user._id.toString(), userType: user.userType }, process.env.JWT_SECRET, { expiresIn: '7d' })
    return res.json({ success: true, message: 'Login successful.', token, user: publicUser(updatedUser || user) })
  } catch (error) {
    if (error.message === 'JWT_SECRET is not configured') {
      console.error(error.message)
      return res.status(503).json({ success: false, message: 'Authentication is not configured on the server.' })
    }
    console.error('Signin error:', error.message)
    return res.status(503).json({ success: false, message: 'Authentication is temporarily unavailable.' })
  }
}
