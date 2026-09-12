import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import weatherRoutes from './routes/weatherRoutes.js'
import householdRoutes from './routes/householdRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import energyRoutes from './routes/energyRoutes.js'
import evRoutes from './routes/evRoutes.js'
import industryRoutes from './routes/industryRoutes.js'
<<<<<<< HEAD
import supportRoutes from './routes/supportRoutes.js'
=======
import rewardsRoutes from './routes/rewardsRoutes.js'
>>>>>>> a940a252c19e8a401826f131995fe1b69f3a9a17

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '10kb' }))
app.use('/api/auth', authRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/household', householdRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/energy', energyRoutes)
app.use('/api/ev', evRoutes)
app.use('/api/industry', industryRoutes)
<<<<<<< HEAD
app.use('/api/support', supportRoutes)
=======
app.use('/api/rewards', rewardsRoutes)
>>>>>>> a940a252c19e8a401826f131995fe1b69f3a9a17
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'Esync auth API is online.' }))
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }))
app.use((error, _req, res, _next) => {
  console.error('Unhandled server error:', error.message)
  res.status(500).json({ success: false, message: 'Something went wrong.' })
})

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`Esync API listening on port ${port}`))
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  })
