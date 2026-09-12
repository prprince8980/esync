<<<<<<< HEAD
import { useEffect, useRef, useState } from 'react'
import { Activity, AirVent, ArrowLeft, BarChart3, Bell, BatteryCharging, Building2, CarFront, Check, ChevronRight, CircleHelp, Cloud, Clock3, Cog, Droplets, Factory, Gauge, Home, LogOut, MapPin, Menu, Medal, RefreshCw, Save, Sparkles, Sun, Target, Trash2, Trophy, UserRound, WashingMachine, Wind, X, Zap } from 'lucide-react'
=======
import { useEffect, useState } from 'react'
import { ArrowLeft, Bell, Check, ChevronRight, CircleHelp, Cloud, Clock3, Droplets, Gauge, Home, LogOut, Menu, Medal, Sparkles, Target, Trash2, Trophy, UserRound, Wind, X, Zap, BarChart3 } from 'lucide-react'
>>>>>>> a940a252c19e8a401826f131995fe1b69f3a9a17
import { deleteNotification, getDashboard, getNotifications, getProfile, markAllNotificationsRead, markNotificationRead, updateProfile } from '../../services/householdService.js'
import { getEnergyHistory } from '../../services/energyService.js'
import HelpSupportView from '../HelpSupportView.jsx'

const ChartIcon = BarChart3

const formatTime = (value) => value ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : '--'
const formatWindow = (start, end) => start && end ? `${formatTime(start)} – ${formatTime(end)}` : 'Next daylight window'

function Stat({ icon: Icon, label, value, suffix = '' }) { return <div className="weather-stat"><Icon size={16} /><span>{label}</span><strong>{value ?? '--'}{suffix}</strong></div> }

function Drawer({ active, onNavigate, onLogout, onClose }) {
  const items = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'solar', label: 'Solar Opportunity', icon: Zap },
    { id: 'suggestions', label: 'Energy Suggestions', icon: Sparkles },
    { id: 'history', label: 'Energy History', icon: Gauge },
    { id: 'profile', label: 'Profile', icon: UserRound },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ]
  return <><div className="drawer-backdrop" onClick={onClose} /><aside className="dashboard-drawer"><div className="drawer-title"><div className="drawer-logo-frame"><img className="drawer-logo-image" src="/esync-logo-final.png" alt="Esync" /></div><button className="icon-action" onClick={onClose} aria-label="Close menu"><X size={18} /></button></div><nav>{items.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'active' : ''} onClick={() => onNavigate(id)}><Icon size={17} />{label}</button>)}</nav><button className="drawer-logout" onClick={onLogout}><LogOut size={17} />Log out</button></aside></>
}

function NotificationPanel({ notifications, onRead, onReadAll, onDelete, onClose }) {
  return <div className="notification-popover"><div className="popover-header"><div><span className="eyebrow">Your signal feed</span><h3>Notifications</h3></div><button className="icon-action" onClick={onClose} aria-label="Close notifications"><X size={17} /></button></div><button className="read-all" onClick={onReadAll}>Mark all as read</button><div className="notification-list">{notifications.length === 0 ? <p className="empty-state">No recommendations yet.</p> : notifications.map((notification) => <article className={`notification-item ${notification.isRead ? 'read' : ''}`} key={notification._id} onClick={() => onRead(notification._id)}><div className="notification-icon">☀</div><div><strong>{notification.title}</strong><time>{formatTime(notification.createdAt)}</time><p>{notification.message}</p></div><button className="delete-notification" onClick={(event) => { event.stopPropagation(); onDelete(notification._id) }} aria-label="Delete notification"><Trash2 size={14} /></button></article>)}</div></div>
}

function ProfileView({ profile, onSaved, onBack }) {
  const [city, setCity] = useState(profile.city || '')
  const [country, setCountry] = useState(profile.country || '')
  const [message, setMessage] = useState('')
<<<<<<< HEAD
  const [saving, setSaving] = useState(false)
  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const response = await updateProfile({ city, country })
      setMessage(response.message)
      onSaved(response.user)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }
  const savedLocation = [profile.city, profile.state, profile.country].filter(Boolean).join(', ')
  const coordinates = profile.latitude !== null && profile.latitude !== undefined ? `${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}` : 'Added after saving location'
  return <section className="profile-view"><div className="profile-heading"><div><p className="eyebrow">Your account</p><h2>My Profile</h2><p className="view-intro">Keep your household location current so Esync can read the right sky.</p></div><div className="profile-status"><span /><strong>Profile active</strong></div></div><div className="profile-grid"><div className="profile-summary"><div className="profile-avatar"><UserRound size={25} /></div><h3>{profile.fullName}</h3><p>{profile.email}</p><span className="profile-tag"><Home size={14} /> Household</span><div className="profile-location-card"><MapPin size={18} /><div><span>Saved location</span><strong>{savedLocation || 'Not set'}</strong></div></div><dl className="coordinates"><dt>Coordinates</dt><dd>{coordinates}</dd></dl></div><form onSubmit={save} className="profile-form"><div className="profile-form-heading"><div><span className="card-label">Location settings</span><h3>Update your energy region</h3></div><MapPin size={20} /></div><label htmlFor="profile-city">City<input id="profile-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ahmedabad" required /></label><label htmlFor="profile-country">Country <span>(optional)</span><input id="profile-country" value={country} onChange={(event) => setCountry(event.target.value)} placeholder="India" /></label>{message && <p className="profile-message" role="status">{message}</p>}<button className="primary-action" type="submit" disabled={saving}><Save size={16} />{saving ? 'Saving location...' : 'Save location'}<ChevronRight size={16} /></button></form></div></section>
}

const readingSourceLabels = { esp32: 'ESP32 meter', inverter: 'Solar inverter', ev_charger: 'EV charger', meter: 'Industrial meter', manual: 'Manual entry' }
const formatReadingTime = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Unknown time'

function EnergyHistoryView({ profile }) {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const load = async (background = false) => {
    try {
      if (background) setRefreshing(true)
      else setLoading(true)
      setError('')
      setOverview(await getEnergyHistory())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  useEffect(() => {
    load()
    const refreshTimer = window.setInterval(() => load(true), 15000)
    return () => window.clearInterval(refreshTimer)
  }, [])

  const readings = overview?.readings || []
  return <section className="energy-history-view"><div className="history-heading"><div><p className="eyebrow">Energy activity</p><h1>Energy history</h1><p>Every reading from your connected devices and manual actions, kept in one clear timeline.</p></div><button className="history-refresh" type="button" onClick={() => load(true)} disabled={refreshing} aria-label="Refresh energy history"><RefreshCw size={17} className={refreshing ? 'spinning' : ''} /><span>{refreshing ? 'Refreshing' : 'Refresh'}</span></button></div>{error && <div className="history-error" role="alert">{error}<button type="button" onClick={() => load()}>Try again</button></div>}{loading ? <div className="history-empty"><Activity size={28} /><strong>Loading energy activity...</strong><span>Checking the latest records.</span></div> : readings.length === 0 ? <div className="history-empty"><Activity size={28} /><strong>No energy readings yet</strong><span>New device or manual readings will appear here automatically.</span></div> : <div className="history-list">{readings.map((reading) => <article className="history-card" key={reading._id}><div className="history-card-top"><div className="history-source"><span className="history-source-icon"><Zap size={17} /></span><div><strong>{readingSourceLabels[reading.source] || 'Energy reading'}</strong><span>{reading.deviceId || 'User action'}</span></div></div><time>{formatReadingTime(reading.recordedAt)}</time></div><div className="history-card-user"><UserRound size={15} /><span>{profile.fullName}</span><b>{reading.source === 'manual' ? 'Recorded manually' : 'Device reported'}</b></div><div className="history-metrics"><div><span>Renewable</span><strong>{Number(reading.renewableKwh || 0).toFixed(2)} <small>kWh</small></strong></div><div><span>Grid</span><strong>{Number(reading.gridKwh || 0).toFixed(2)} <small>kWh</small></strong></div><div><span>Total load</span><strong>{Number(reading.loadKwh || 0).toFixed(2)} <small>kWh</small></strong></div><div><span>Cost</span><strong>₹{Number(reading.cost || 0).toFixed(2)}</strong></div></div></article>)}</div>}</section>
}

function SavingsView() {
  const viewRef = useRef(null)
  const playMotion = () => {
    const root = viewRef.current
    if (!root) return []
    const animations = []
    const animate = (selector, keyframes, options) => { const element = root.querySelector(selector); if (element) animations.push(element.animate(keyframes, { fill: 'both', easing: 'cubic-bezier(.22,1,.36,1)', ...options })) }
    animate('.tutorial-sun', [{ transform: 'translateY(32px) scale(.72)', opacity: .25 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], { duration: 2500, delay: 200 })
    animate('.tutorial-rays', [{ opacity: 0, transform: 'scale(.75)' }, { opacity: .55, transform: 'scale(1)' }], { duration: 1800, delay: 1100 })
    animate('.tutorial-house', [{ transform: 'translateY(10px)', opacity: .55 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 1600, delay: 1500 })
    root.querySelectorAll('.tutorial-appliance').forEach((element, index) => animations.push(element.animate([{ transform: 'translateX(0)', opacity: .45 }, { transform: 'translateX(22px)', opacity: 1 }], { duration: 1800, delay: 1900 + index * 260, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' })))
    animate('.tutorial-energy-window', [{ transform: 'scaleX(.15)', opacity: .35 }, { transform: 'scaleX(1)', opacity: 1 }], { duration: 2200, delay: 2100 })
    animate('.tutorial-demand-line', [{ strokeDashoffset: 390 }, { strokeDashoffset: 0 }], { duration: 2600, delay: 1800, easing: 'cubic-bezier(.22,1,.36,1)' })
    animate('.tutorial-result', [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 1100, delay: 5550 })
    return animations
  }
  useEffect(() => { let animations = playMotion(); const timer = window.setInterval(() => { animations.forEach((animation) => animation.cancel()); animations = playMotion() }, 7600); return () => { window.clearInterval(timer); animations.forEach((animation) => animation.cancel()) } }, [])
  return <section className="savings-grid-shell"><div className="savings-grid-heading"><div><p className="eyebrow">Energy in motion</p><h1>Smarter energy,<br /><em>shared by everyone.</em></h1><p>See how every layer of the energy system works together to reduce peaks, use cleaner power, and keep demand resilient.</p></div></div><div className="savings-grid"><div className="savings-grid-household"><section className="energy-tutorial-scene" ref={viewRef} aria-label="Household energy optimization animation"><div className="tutorial-card"><div className="tutorial-card-header"><div className="tutorial-household-icon"><Home size={21} /></div><span>HOUSEHOLD USER</span></div><div className="tutorial-sky"><div className="tutorial-sun"><Sun size={48} /></div><div className="tutorial-rays" /><div className="tutorial-house"><Home size={92} /></div><div className="tutorial-appliance tutorial-washer"><WashingMachine size={24} /></div><div className="tutorial-appliance tutorial-dishwasher"><Activity size={24} /></div><div className="tutorial-appliance tutorial-ac"><AirVent size={24} /></div></div><div className="tutorial-timeline"><span>HIGH DEMAND</span><div className="tutorial-timeline-track"><i className="tutorial-energy-window" /><b /></div><span>SOLAR WINDOW</span></div><div className="tutorial-result"><strong>24% less peak draw</strong></div><button className="tutorial-replay" type="button" onClick={playMotion} aria-label="Replay household energy animation"><RefreshCw size={16} /></button></div></section></div><EvChargingAnimation /><IndustrialEnergyAnimation /><GridStabilizationAnimation /></div><footer className="savings-page-footer"><span>Esync energy intelligence</span><strong>Better timing. Cleaner power. Stronger networks.</strong></footer></section>
}

function SavingsGridCard({ icon: Icon, label, title, copy, metric, tone }) { return <article className={`savings-grid-card ${tone}`}><div className="savings-grid-card-top"><div className="savings-grid-icon"><Icon size={22} /></div><span>{label}</span></div><h2>{title}</h2><p>{copy}</p><div className="savings-grid-flow"><span /><b /></div><strong>{metric}</strong></article> }

function EvChargingAnimation() {
  const sceneRef = useRef(null)
  const play = () => {
    const root = sceneRef.current
    if (!root) return []
    const animations = []
    const animate = (selector, keyframes, options) => { const element = root.querySelector(selector); if (element) animations.push(element.animate(keyframes, { fill: 'both', easing: 'cubic-bezier(.22,1,.36,1)', ...options })) }
    animate('.ev-tutorial-sun', [{ transform: 'translate(-34px, 25px) scale(.75)', opacity: .3 }, { transform: 'translate(0, 0) scale(1)', opacity: 1 }], { duration: 2300, delay: 150 })
    animate('.ev-tutorial-rays', [{ opacity: 0, transform: 'scale(.7)' }, { opacity: .52, transform: 'scale(1)' }], { duration: 1800, delay: 950 })
    animate('.ev-tutorial-panel', [{ transform: 'translateY(12px)', opacity: .5 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 1500, delay: 1350 })
    animate('.ev-tutorial-charger', [{ opacity: .4, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 1200, delay: 2750 })
    animate('.ev-tutorial-car', [{ transform: 'translateX(-18px)', opacity: .45 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 1600, delay: 3300 })
    animate('.ev-battery-fill', [{ transform: 'scaleX(.08)' }, { transform: 'scaleX(1)' }], { duration: 2600, delay: 3650 })
    root.querySelectorAll('.ev-energy-particle').forEach((element, index) => animations.push(element.animate([{ transform: 'translate(0, 0)', opacity: 0 }, { transform: 'translate(35px, 24px)', opacity: 1 }, { transform: 'translate(145px, 45px)', opacity: 1 }, { transform: 'translate(255px, 35px)', opacity: 0 }], { duration: 3000, delay: 1800 + index * 240, easing: 'ease-in-out', fill: 'both' })))
    animate('.ev-tutorial-result', [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 1000, delay: 5700 })
    return animations
  }
  useEffect(() => { let animations = play(); const timer = window.setInterval(() => { animations.forEach((animation) => animation.cancel()); animations = play() }, 7600); return () => { window.clearInterval(timer); animations.forEach((animation) => animation.cancel()) } }, [])
  return <section className="ev-tutorial-scene" ref={sceneRef} aria-label="Electric vehicle solar charging animation"><div className="ev-tutorial-card"><div className="ev-tutorial-header"><div className="ev-tutorial-icon"><BatteryCharging size={21} /></div><span>EV OWNER</span></div><div className="ev-tutorial-sky"><div className="ev-tutorial-sun"><Sun size={43} /></div><div className="ev-tutorial-rays" /><div className="ev-tutorial-panel"><span /><span /><span /><span /></div><div className="ev-energy-route"><i className="ev-energy-particle" /><i className="ev-energy-particle" /><i className="ev-energy-particle" /><i className="ev-energy-particle" /></div><div className="ev-tutorial-charger"><Zap size={24} /></div><div className="ev-tutorial-car"><CarFront size={70} /></div></div><div className="ev-battery"><BatteryCharging size={18} /><div><span className="ev-battery-track"><i className="ev-battery-fill" /></span></div></div><div className="ev-tutorial-result"><strong>18% cleaner charge</strong></div><button className="tutorial-replay" type="button" onClick={play} aria-label="Replay EV solar charging animation"><RefreshCw size={16} /></button></div></section>
}

function IndustrialEnergyAnimation() {
  const sceneRef = useRef(null)
  const play = () => {
    const root = sceneRef.current
    if (!root) return []
    const animations = []
    const animate = (selector, keyframes, options) => { const element = root.querySelector(selector); if (element) animations.push(element.animate(keyframes, { fill: 'both', easing: 'cubic-bezier(.22,1,.36,1)', ...options })) }
    animate('.industrial-factory', [{ transform: 'translateY(10px)', opacity: .55 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 1500, delay: 350 })
    root.querySelectorAll('.industrial-machine').forEach((element, index) => animations.push(element.animate([{ opacity: .32, transform: 'scale(.86)' }, { opacity: 1, transform: 'scale(1)' }, { opacity: .5, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 1700, delay: 1000 + index * 470, easing: 'ease-in-out', fill: 'both' })))
    root.querySelectorAll('.industrial-particle').forEach((element, index) => animations.push(element.animate([{ transform: 'translate(0, 0)', opacity: 0 }, { transform: 'translate(45px, -10px)', opacity: 1 }, { transform: 'translate(115px, 16px)', opacity: 1 }, { transform: 'translate(190px, 0)', opacity: 0 }], { duration: 2600, delay: 1450 + index * 210, easing: 'ease-in-out', fill: 'both' })))
    animate('.industrial-bar-high', [{ transform: 'scaleY(.95)' }, { transform: 'scaleY(.48)' }], { duration: 2400, delay: 1700 })
    animate('.industrial-bar-mid', [{ transform: 'scaleY(.35)' }, { transform: 'scaleY(.68)' }], { duration: 2400, delay: 2100 })
    animate('.industrial-bar-low', [{ transform: 'scaleY(.2)' }, { transform: 'scaleY(.56)' }], { duration: 2400, delay: 2500 })
    animate('.industrial-result', [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 1000, delay: 5700 })
    return animations
  }
  useEffect(() => { let animations = play(); const timer = window.setInterval(() => { animations.forEach((animation) => animation.cancel()); animations = play() }, 7600); return () => { window.clearInterval(timer); animations.forEach((animation) => animation.cancel()) } }, [])
  return <section className="industrial-tutorial-scene" ref={sceneRef} aria-label="Industrial energy management animation"><div className="industrial-tutorial-card"><div className="industrial-tutorial-header"><div className="industrial-tutorial-icon"><Building2 size={21} /></div><span>INDUSTRIAL OWNER</span></div><div className="industrial-stage"><div className="industrial-factory"><Building2 size={83} /></div><div className="industrial-machine industrial-machine-one"><Cog size={25} /></div><div className="industrial-machine industrial-machine-two"><Cog size={21} /></div><div className="industrial-machine industrial-machine-three"><Cog size={18} /></div><div className="industrial-energy-route"><i className="industrial-particle" /><i className="industrial-particle" /><i className="industrial-particle" /><i className="industrial-particle" /></div></div><div className="industrial-load-bars"><BarChart3 size={18} /><span className="industrial-bar industrial-bar-high" /><span className="industrial-bar industrial-bar-mid" /><span className="industrial-bar industrial-bar-low" /></div><div className="industrial-result"><strong>31% load optimized</strong></div><button className="tutorial-replay" type="button" onClick={play} aria-label="Replay industrial energy animation"><RefreshCw size={16} /></button></div></section>
}

function GridStabilizationAnimation() {
  const sceneRef = useRef(null)
  const play = () => {
    const root = sceneRef.current
    if (!root) return []
    const animations = []
    const animate = (selector, keyframes, options) => { const element = root.querySelector(selector); if (element) animations.push(element.animate(keyframes, { fill: 'both', easing: 'cubic-bezier(.22,1,.36,1)', ...options })) }
    animate('.grid-sun', [{ opacity: .25, transform: 'translateY(18px) scale(.72)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 2100, delay: 200 })
    animate('.grid-wind', [{ opacity: .35, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 1500, delay: 650 })
    animate('.grid-nodes', [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 1500, delay: 1200 })
    root.querySelectorAll('.grid-particle').forEach((element, index) => animations.push(element.animate([{ transform: 'translate(0, 0)', opacity: 0 }, { transform: 'translate(100px, 20px)', opacity: 1 }, { transform: 'translate(220px, 0)', opacity: 0 }], { duration: 2600, delay: 1450 + index * 230, easing: 'ease-in-out', fill: 'both' })))
    animate('.grid-supply-wave', [{ strokeDashoffset: 310 }, { strokeDashoffset: 0 }], { duration: 2800, delay: 1700 })
    animate('.grid-demand-wave', [{ strokeDashoffset: 310, opacity: .55 }, { strokeDashoffset: 0, opacity: 1 }], { duration: 2800, delay: 2300 })
    animate('.grid-result', [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 1000, delay: 5700 })
    return animations
  }
  useEffect(() => { let animations = play(); const timer = window.setInterval(() => { animations.forEach((animation) => animation.cancel()); animations = play() }, 7600); return () => { window.clearInterval(timer); animations.forEach((animation) => animation.cancel()) } }, [])
  return <section className="grid-tutorial-scene" ref={sceneRef} aria-label="Smart electricity grid stabilization animation"><div className="grid-tutorial-card"><div className="grid-tutorial-header"><div className="grid-tutorial-icon"><Zap size={21} /></div><span>ELECTRICITY SUPPLIER</span></div><div className="grid-stage"><div className="grid-sun"><Sun size={34} /></div><div className="grid-panel"><span /><span /><span /><span /></div><div className="grid-wind"><Wind size={38} /></div><div className="grid-lines"><i /><i /><i /></div><div className="grid-nodes"><b /><b /><b /><b /></div><div className="grid-particle-route"><i className="grid-particle" /><i className="grid-particle" /><i className="grid-particle" /><i className="grid-particle" /></div></div><svg className="grid-wave-chart" viewBox="0 0 520 92" preserveAspectRatio="none" aria-hidden="true"><path className="grid-supply-wave" d="M4 24 C58 3, 91 48, 140 23 S220 5, 270 38 S350 67, 410 32 S470 8, 516 27" /><path className="grid-demand-wave" d="M4 64 C58 75, 94 35, 140 60 S220 78, 270 48 S350 19, 410 54 S470 71, 516 57" /></svg><div className="grid-result"><strong>12% smoother demand</strong></div><button className="tutorial-replay" type="button" onClick={play} aria-label="Replay grid stabilization animation"><RefreshCw size={16} /></button></div></section>
=======
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    onBack?.()
  }
  const save = async (event) => { event.preventDefault(); try { const response = await updateProfile({ city, country }); onSaved(response.user); setMessage(response.message) } catch (error) { setMessage(error.message) } }
  return <section className="profile-view"><button className="back-action" type="button" onClick={handleBack}><ArrowLeft size={16} />Back to dashboard</button><p className="eyebrow">Your account</p><h2>My Profile</h2><p className="view-intro">Keep your household location current so Esync can read the right sky.</p><div className="profile-grid"><div className="profile-summary"><div className="profile-avatar"><UserRound size={25} /></div><h3>{profile.fullName}</h3><p>{profile.email}</p><span className="profile-tag">🏠 Household</span><dl className="coordinates"><dt>Saved location</dt><dd>{profile.city || 'Not set'}{profile.state ? `, ${profile.state}` : ''}{profile.country ? `, ${profile.country}` : ''}</dd><dt>Coordinates</dt><dd>{profile.latitude !== null && profile.latitude !== undefined ? `${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}` : 'Added after saving location'}</dd></dl></div><form onSubmit={save} className="profile-form"><label>City<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ahmedabad" required /></label><label>Country <span>(optional)</span><input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="India" /></label>{message && <p className="profile-message">{message}</p>}<button className="primary-action" type="submit">Save location <ChevronRight size={16} /></button></form></div></section>
>>>>>>> a940a252c19e8a401826f131995fe1b69f3a9a17
}

function HourlyForecast({ weather, recommendation }) {
  const start = recommendation?.recommendedStart || weather.bestWindow?.start
  const end = recommendation?.recommendedEnd || weather.bestWindow?.end
  const forecast = weather.forecast || []
  const points = [{ date: new Date(), shortwaveRadiation: weather.solarRadiation || 0, score: weather.solarPotential || recommendation?.solarPotential || forecast[0]?.score || 0, cloudCover: weather.cloudCover || 0 }, ...forecast].slice(0, 24)
  const maxRadiation = Math.max(100, ...points.map((hour) => Number(hour.shortwaveRadiation) || 0))
  const chartWidth = 900
  const chartHeight = 290
  const chartPadding = { top: 18, right: 18, bottom: 58, left: 42 }
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const chartPoint = (value, index, max) => `${chartPadding.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)},${chartPadding.top + plotHeight - ((Number(value) || 0) / max) * plotHeight}`
  const radiationLine = points.map((hour, index) => chartPoint(hour.shortwaveRadiation, index, maxRadiation)).join(' ')
  const scoreLine = points.map((hour, index) => chartPoint((Number(hour.score) || 0) * maxRadiation / 100, index, maxRadiation)).join(' ')
  const current = points[0]
  const currentTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date())
  return <section className="hourly-section"><div className="section-heading"><div><p className="eyebrow">Forecast intelligence</p><h2>Solar energy in motion</h2></div><span>Live + 24 hour record</span></div><div className="live-measurement"><div className="live-indicator"><span />Live measurement</div><strong>{Math.round(current.shortwaveRadiation || 0)} <small>W/m²</small></strong><span className="live-time">Updated {currentTime}</span><div className="live-meta"><span>Opportunity <b>{Math.round(current.score || 0)}/100</b></span><span>Cloud cover <b>{Math.round(weather.cloudCover || 0)}%</b></span></div></div><div className="energy-chart-card"><div className="chart-heading"><div><span className="card-label">Solar radiation frequency</span><h3>Energy intensity over time</h3></div><div className="chart-legend"><span><i className="legend-radiation" />Solar radiation (W/m²)</span><span><i className="legend-score" />Opportunity score (0–100)</span></div></div><div className="energy-chart"><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Line chart showing solar radiation and opportunity score for each hour" preserveAspectRatio="none"><g className="chart-grid-lines"><line x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={chartPadding.top} y2={chartPadding.top} /><line x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={chartPadding.top + plotHeight / 2} y2={chartPadding.top + plotHeight / 2} /><line x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={chartPadding.top + plotHeight} y2={chartPadding.top + plotHeight} /></g><polyline className="chart-line chart-line-radiation" points={radiationLine} /><polyline className="chart-line chart-line-score" points={scoreLine} />{points.map((hour, index) => { const point = chartPoint(hour.shortwaveRadiation, index, maxRadiation).split(','); const hourLabel = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(hour.date)); return <g key={hour.date || index}><circle className={index === 0 ? 'chart-point current' : 'chart-point'} cx={point[0]} cy={point[1]} r={index === 0 ? 5 : 2.5} /><text className="chart-hour-label" x={chartPadding.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)} y={chartHeight - 14} textAnchor="middle">{hourLabel}</text></g> })}</svg></div><div className="chart-scale"><span>0 W/m²</span><span>{Math.round(maxRadiation)} W/m² peak</span></div><div className="hourly-record"><div className="record-heading"><span>24-hour record</span><span>Time / radiation / cloud / score</span></div>{points.map((hour, index) => <div className={`record-row ${index === 0 ? 'current' : ''}`} key={`record-${hour.date || index}`}><time>{new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(hour.date))}</time><strong>{Math.round(hour.shortwaveRadiation || 0)} <small>W/m²</small></strong><span>Cloud {Math.round(hour.cloudCover || 0)}%</span><b>{Math.round(hour.score || 0)}/100</b></div>)}</div></div></section>
}

const awardForScore = (score) => score >= 75 ? { label: 'High award', points: 100, tone: 'high', message: 'Excellent timing. Your flexible usage is aligned with the strongest solar window.' } : score >= 45 ? { label: 'Medium award', points: 55, tone: 'medium', message: 'Good progress. Shift a little more usage toward the green window to level up.' } : { label: 'Low award', points: 20, tone: 'low', message: 'There is room to improve. Try waiting for the next recommended solar window.' }

function SolarOpportunityView({ data, onBack }) {
  if (!data) return <div className="dashboard-loading">Calculating your green points...</div>
  const { weather, recommendation } = data
  const score = Math.round(recommendation?.solarPotential ?? weather.solarPotential ?? weather.forecast?.[0]?.score ?? 0)
  const award = awardForScore(score)
  const recentScores = [62, 48, 71, 39, score]
  const personalPoints = recentScores.reduce((total, value) => total + awardForScore(value).points, 0)
  const nextTarget = Math.ceil((personalPoints + 1) / 100) * 100
  const leaderboard = [{ name: 'You', points: personalPoints, score, current: true }, { name: 'Aarav’s home', points: 570, score: 82 }, { name: 'Mira’s home', points: 525, score: 76 }, { name: 'Noah’s home', points: 460, score: 69 }, { name: 'Zoya’s home', points: 390, score: 54 }].sort((left, right) => right.points - left.points)
  const rank = leaderboard.findIndex((entry) => entry.current) + 1
  return <section className="solar-view"><button className="back-action" onClick={onBack}><ArrowLeft size={16} />Back to dashboard</button><div className="solar-view-heading"><div><p className="eyebrow">Solar opportunity</p><h1>Turn better timing<br /><em>into green points.</em></h1><p>Use energy when the grid and sunlight are working together. Every smarter choice helps your household climb.</p></div><div className={`award-orb ${award.tone}`}><Trophy size={28} /><strong>{award.points}</strong><span>points today</span></div></div><div className="solar-stats-grid"><article className={`award-card ${award.tone}`}><div className="card-kicker"><span><Trophy size={15} />Today’s award</span><span className="award-status">{award.label}</span></div><div className="award-score"><strong>{award.points}</strong><span>green points</span></div><p>{award.message}</p><div className="award-meter"><span style={{ width: `${score}%` }} /></div><div className="award-foot"><span>Optimization score</span><b>{score}/100</b></div></article><article className="progress-card"><div className="card-kicker"><span><Target size={15} />Personal growth</span><span>5 sessions</span></div><div className="progress-total"><strong>{personalPoints}</strong><span>total points</span></div><p>Your consistency is building. Reach {nextTarget} points to unlock the next personal milestone.</p><div className="progress-meter"><span style={{ width: `${Math.min(100, (personalPoints / nextTarget) * 100)}%` }} /></div><div className="award-foot"><span>Next milestone</span><b>{nextTarget} pts</b></div></article></div><div className="solar-lower-grid"><article className="leaderboard-card"><div className="section-heading"><div><p className="eyebrow">Community challenge</p><h2>Green points leaderboard</h2></div><span>Current cycle</span></div><p className="leaderboard-intro">Compete with your own best rhythm and other households making cleaner timing choices.</p><div className="leaderboard-list">{leaderboard.map((entry, index) => <div className={`leaderboard-row ${entry.current ? 'current' : ''}`} key={entry.name}><span className="leaderboard-rank">{index < 3 ? <Medal size={16} /> : index + 1}</span><span className="leaderboard-name">{entry.name}{entry.current && <small>Your household</small>}</span><span className="leaderboard-score">{entry.score}/100 <small>today</small></span><strong>{entry.points} <small>pts</small></strong></div>)}</div><div className="rank-footer"><span><Trophy size={15} />Your rank</span><strong>#{rank} of {leaderboard.length}</strong></div></article><aside className="how-it-works-card"><p className="eyebrow">How awards work</p><h2>Small shifts,<br />visible progress.</h2><div className="award-rule"><span className="rule-dot high" /><div><strong>High optimum usage</strong><p>75–100 score <b>+100 pts</b></p></div></div><div className="award-rule"><span className="rule-dot medium" /><div><strong>Mild optimum usage</strong><p>45–74 score <b>+55 pts</b></p></div></div><div className="award-rule"><span className="rule-dot low" /><div><strong>High or unnecessary usage</strong><p>0–44 score <b>+20 pts</b></p></div></div><div className="next-window"><span>Next best window</span><strong>{formatWindow(recommendation?.recommendedStart || weather.bestWindow?.start, recommendation?.recommendedEnd || weather.bestWindow?.end)}</strong></div></aside></div></section>
}

function EnergySuggestionsView({ data, onBack }) {
  const [completed, setCompleted] = useState([])
  if (!data) return <div className="dashboard-loading">Preparing your energy plan...</div>
  const { weather, recommendation } = data
  const window = formatWindow(recommendation?.recommendedStart || weather.bestWindow?.start, recommendation?.recommendedEnd || weather.bestWindow?.end)
  const score = Math.round(recommendation?.solarPotential ?? weather.solarPotential ?? weather.forecast?.[0]?.score ?? 0)
  const suggestions = [{ id: 'shift', icon: Clock3, title: 'Shift flexible usage', detail: `Move your washing, dishwasher, or charging into the ${window} window.`, reward: 35, tag: 'Highest impact' }, { id: 'reduce', icon: Zap, title: 'Reduce peak grid draw', detail: 'Avoid running several high-load appliances together while solar output is limited.', reward: 25, tag: 'Grid friendly' }, { id: 'review', icon: Target, title: 'Review your energy rhythm', detail: 'Check your 24-hour solar graph after the cycle and improve tomorrow’s timing.', reward: 15, tag: 'Build consistency' }]
  const completedCount = completed.length
  const totalReward = suggestions.filter((suggestion) => completed.includes(suggestion.id)).reduce((total, suggestion) => total + suggestion.reward, 0)
  const toggleSuggestion = (id) => setCompleted((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  return <section className="suggestions-view"><button className="back-action" onClick={onBack}><ArrowLeft size={16} />Back to dashboard</button><div className="suggestions-heading"><div><p className="eyebrow">Energy suggestions</p><h1>Your next best<br /><em>energy moves.</em></h1><p>Follow the plan, make the shift, and turn each completed action into progress on your green points journey.</p></div><div className={`process-badge ${completedCount === suggestions.length ? 'complete' : ''}`}><div><strong>{completedCount}</strong><span>of {suggestions.length}</span></div><small>{completedCount === suggestions.length ? 'Process complete' : 'Actions complete'}</small></div></div><div className="suggestions-progress"><div className="progress-track"><span style={{ width: `${(completedCount / suggestions.length) * 100}%` }} /></div><div><span>Today’s optimization process</span><strong>{completedCount === suggestions.length ? 'All actions complete' : `${suggestions.length - completedCount} actions remaining`}</strong></div></div><div className="suggestions-layout"><div className="suggestion-list">{suggestions.map((suggestion, index) => { const Icon = suggestion.icon; const isComplete = completed.includes(suggestion.id); return <article className={`suggestion-card ${isComplete ? 'complete' : ''}`} key={suggestion.id}><div className="suggestion-step">0{index + 1}</div><div className="suggestion-icon"><Icon size={19} /></div><div className="suggestion-copy"><div className="suggestion-title"><h2>{suggestion.title}</h2><span>{suggestion.tag}</span></div><p>{suggestion.detail}</p><strong>+{suggestion.reward} green points</strong></div><button className="suggestion-check" onClick={() => toggleSuggestion(suggestion.id)} aria-label={`${isComplete ? 'Undo' : 'Complete'} ${suggestion.title}`}>{isComplete ? <Check size={18} /> : <span />}</button></article> })}</div><aside className="suggestion-summary"><p className="eyebrow">Plan status</p><h2>{completedCount === suggestions.length ? 'You completed<br />the full cycle.' : 'Make the next smart move.'}</h2><p>{completedCount === suggestions.length ? 'Your actions are recorded for today. Keep the rhythm tomorrow to grow your personal streak.' : 'Each action moves your household closer to high optimum usage.'}</p><div className="summary-score"><span>Current opportunity</span><strong>{score}/100</strong></div><div className="summary-window"><span>Recommended window</span><strong>{window}</strong></div><div className="summary-reward"><Trophy size={18} /><div><strong>+{totalReward} points earned</strong><span>from completed actions</span></div></div></aside></div></section>
}

function DashboardHome({ data, onLocation }) {
  if (!data) return <div className="dashboard-loading">Analyzing weather conditions...</div>
  const { weather, recommendation } = data
  const score = recommendation?.solarPotential ?? weather.solarPotential ?? 0
  const window = formatWindow(recommendation?.recommendedStart || weather.bestWindow?.start, recommendation?.recommendedEnd || weather.bestWindow?.end)
  return <><div className="dashboard-greeting"><div><p className="eyebrow">Household overview</p><h1>Good energy starts<br /><em>with good timing.</em></h1></div><button className="location-chip" onClick={onLocation}>⌖ {weather.location} <ChevronRight size={15} /></button></div><section className="dashboard-grid overview-card-grid"><article className="opportunity-card"><div className="card-kicker"><span className="sun-glyph">☼</span><span>Solar opportunity</span><span className="prediction-label">Prediction</span></div><div className="score-line"><strong>{score}</strong><span>/ 100</span></div><div className="score-rating">{recommendation?.rating || weather.forecast?.[0]?.rating || 'Low'}</div><div className="score-meter"><span style={{ width: `${score}%` }} /></div><div className="window-line"><span>Best energy window</span><strong>{window}</strong></div><p className="prediction-footnote">Weather-based solar potential, not measured generation.</p></article><article className="weather-card"><div className="card-heading"><div><span className="card-label">Current weather</span><h3>{weather.condition}</h3></div><Cloud size={29} /></div><div className="temperature">{Math.round(weather.temperature)}<sup>°C</sup></div><div className="weather-stats"><Stat icon={Cloud} label="Cloud cover" value={weather.cloudCover} suffix="%" /><Stat icon={Wind} label="Wind" value={Math.round(weather.windSpeed)} suffix=" km/h" /><Stat icon={Zap} label="Solar radiation" value={Math.round(weather.solarRadiation)} suffix=" W/m²" /></div><button className="subtle-action" onClick={onLocation}>Change location <ChevronRight size={14} /></button></article><article className="recommendation-card"><div className="recommendation-top"><div className="spark-icon"><Sparkles size={18} /></div><span>Esync recommendation</span></div><h3>{recommendation?.summary}</h3><p>{recommendation?.recommendation}</p><div className="use-window"><span>Recommended window</span><strong>{window}</strong></div></article><article className="opportunity-summary"><span className="card-label">Today's energy opportunity</span><div><strong>{recommendation?.daylightHours || 0}</strong><span> hours of potential daylight use</span></div><p>{recommendation?.weatherSummary || 'Use flexible appliances during the brighter forecast hours. Esync never switches appliances automatically.'}</p></article></section><HourlyForecast weather={weather} recommendation={recommendation} /></>
}

export default function HouseholdDashboard({ user, onLogout }) {
  const [active, setActive] = useState('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [data, setData] = useState(null)
  const [profile, setProfile] = useState(user)
  const [error, setError] = useState('')
  const unreadCount = notifications.filter((item) => !item.isRead).length

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'solar', label: 'Solar' },
    { id: 'suggestions', label: 'Suggestions' },
    { id: 'history', label: 'History' },
    { id: 'profile', label: 'Profile' }
  ]

  const sidebarItems = [
    { id: 'overview', label: 'Household Hub', icon: Home },
    { id: 'solar', label: 'EV Smart Charging', icon: Zap },
    { id: 'suggestions', label: 'Industrial Microgrid', icon: Gauge },
    { id: 'history', label: 'Predictive Analytics & Reports', icon: ChartIcon }
  ]

  const load = async () => { try { setError(''); const [dashboard, notificationData, profileData] = await Promise.all([getDashboard(), getNotifications(), getProfile()]); setData(dashboard); setNotifications(notificationData.notifications); setProfile(profileData.user) } catch (loadError) { if (loadError.code === 'LOCATION_REQUIRED') setActive('profile'); else setError(loadError.message) } }

  useEffect(() => { load(); const refreshTimer = window.setInterval(load, 60000); return () => window.clearInterval(refreshTimer) }, [])

  const logout = () => { localStorage.removeItem('esync_token'); onLogout() }

  const scrollToSection = (view) => {
    setActive(view)
    setDrawerOpen(false)
    if (view === 'notifications') {
      setNotificationsOpen(true)
      return
    }
    setNotificationsOpen(false)
    const section = document.getElementById(view)
    if (section) {
      const offset = 110
      window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' })
    }
  }

  const navigate = (view) => {
    if (view === 'notifications') {
      setNotificationsOpen((open) => !open)
      setActive('notifications')
      return
    }
    scrollToSection(view)
  }

  const markRead = async (id) => { await markNotificationRead(id); setNotifications((items) => items.map((item) => item._id === id ? { ...item, isRead: true } : item)) }
  const markAll = async () => { await markAllNotificationsRead(); setNotifications((items) => items.map((item) => ({ ...item, isRead: true }))) }
  const remove = async (id) => { await deleteNotification(id); setNotifications((items) => items.filter((item) => item._id !== id)) }
<<<<<<< HEAD
  return <main className="dashboard-shell"><header className="dashboard-header"><div className="dashboard-corner-logo"><img src="/esync-logo-final.png" alt="Esync - A sustainable initiative" /></div><button className="menu-button" onClick={() => setDrawerOpen(true)} aria-label="Open menu"><Menu size={20} /><span>MENU</span></button><div className="header-actions"><span className="header-greeting">{profile.fullName}</span><button className="notification-button" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Open notifications"><Bell size={19} />{unreadCount > 0 && <span>{unreadCount}</span>}</button><button className="avatar-button" onClick={() => navigate('profile')} aria-label="Open profile"><UserRound size={17} /></button></div>{notificationsOpen && <NotificationPanel notifications={notifications} onRead={markRead} onReadAll={markAll} onDelete={remove} onClose={() => setNotificationsOpen(false)} />}</header>{drawerOpen && <Drawer active={active} onNavigate={navigate} onLogout={logout} onClose={() => setDrawerOpen(false)} />}<div className="dashboard-content">{error && <div className="dashboard-error">Weather data is unavailable right now.<button onClick={load}>Try again</button></div>}{active === 'profile' ? <ProfileView profile={profile} onSaved={(nextProfile) => { setProfile(nextProfile); setActive('dashboard'); load() }} /> : active === 'dashboard' ? <DashboardHome data={data} onLocation={() => navigate('profile')} /> : active === 'solar' ? <SolarOpportunityView data={data} onBack={() => navigate('dashboard')} /> : active === 'suggestions' ? <EnergySuggestionsView data={data} onBack={() => navigate('dashboard')} /> : active === 'history' ? <EnergyHistoryView profile={profile} /> : active === 'savings' ? <SavingsView /> : active === 'help' ? <HelpSupportView user={profile} /> : <section className="empty-view"><Sparkles size={30} /><p className="eyebrow">Coming into focus</p><h2>{active === 'notifications' ? 'Your signal feed' : 'Help'}</h2><p>More insights will appear here as Esync grows.</p></section>}</div></main>
=======

  return (
    <main className="dashboard-shell">
      <div className="dashboard-shell-inner">
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand-block">VoltShift</div>
          <nav className="dashboard-sidebar-nav" aria-label="Sidebar navigation">
            {sidebarItems.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" className={active === id ? 'active' : ''} onClick={() => scrollToSection(id)}>
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="dashboard-main-panel">
          <header className="dashboard-header">
            <div className="topbar-status">
              <span className="status-dot" />
              <span>VoltShift</span>
              <span className="status-separator">•</span>
              <span>Grid Status: Low</span>
              <span className="status-separator">•</span>
              <span>Solar Peak Active</span>
            </div>

            <div className="header-actions">
              <span className="header-greeting">{profile.fullName}</span>
              <button className="notification-button" onClick={() => navigate('notifications')} aria-label="Open notifications">
                <Bell size={19} />
                {unreadCount > 0 && <span>{unreadCount}</span>}
              </button>
              <button className="avatar-button" onClick={() => scrollToSection('profile')} aria-label="Open profile">
                <UserRound size={17} />
              </button>
            </div>

            {notificationsOpen && <NotificationPanel notifications={notifications} onRead={markRead} onReadAll={markAll} onDelete={remove} onClose={() => setNotificationsOpen(false)} />}
          </header>

          {drawerOpen && <Drawer active={active} onNavigate={navigate} onLogout={logout} onClose={() => setDrawerOpen(false)} />}

          <div className="dashboard-content">
            {error && <div className="dashboard-error">Weather data is unavailable right now.<button onClick={load}>Try again</button></div>}

            <section id="overview" className="page-section">
              <DashboardHome data={data} onLocation={() => scrollToSection('profile')} />
            </section>

            <section id="solar" className="page-section">
              <SolarOpportunityView data={data} onBack={() => scrollToSection('overview')} />
            </section>

            <section id="suggestions" className="page-section">
              <EnergySuggestionsView data={data} onBack={() => scrollToSection('overview')} />
            </section>

            <section id="history" className="page-section">
              {data && <HourlyForecast weather={data.weather} recommendation={data.recommendation} />}
            </section>

            <section id="profile" className="page-section">
              <ProfileView
                profile={profile}
                onSaved={(nextProfile) => { setProfile(nextProfile); setActive('overview'); load() }}
                onBack={() => scrollToSection('overview')}
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  )
>>>>>>> a940a252c19e8a401826f131995fe1b69f3a9a17
}
