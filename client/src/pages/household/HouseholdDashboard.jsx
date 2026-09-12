import { useEffect, useState } from 'react'
import { ArrowLeft, Bell, Check, ChevronRight, CircleHelp, Cloud, Clock3, Droplets, Gauge, Home, LogOut, Menu, Medal, Sparkles, Target, Trash2, Trophy, UserRound, Wind, X, Zap, BarChart3 } from 'lucide-react'
import { deleteNotification, getDashboard, getNotifications, getProfile, markAllNotificationsRead, markNotificationRead, updateProfile } from '../../services/householdService.js'

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
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    onBack?.()
  }
  const save = async (event) => { event.preventDefault(); try { const response = await updateProfile({ city, country }); onSaved(response.user); setMessage(response.message) } catch (error) { setMessage(error.message) } }
  return <section className="profile-view"><button className="back-action" type="button" onClick={handleBack}><ArrowLeft size={16} />Back to dashboard</button><p className="eyebrow">Your account</p><h2>My Profile</h2><p className="view-intro">Keep your household location current so Esync can read the right sky.</p><div className="profile-grid"><div className="profile-summary"><div className="profile-avatar"><UserRound size={25} /></div><h3>{profile.fullName}</h3><p>{profile.email}</p><span className="profile-tag">🏠 Household</span><dl className="coordinates"><dt>Saved location</dt><dd>{profile.city || 'Not set'}{profile.state ? `, ${profile.state}` : ''}{profile.country ? `, ${profile.country}` : ''}</dd><dt>Coordinates</dt><dd>{profile.latitude !== null && profile.latitude !== undefined ? `${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}` : 'Added after saving location'}</dd></dl></div><form onSubmit={save} className="profile-form"><label>City<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ahmedabad" required /></label><label>Country <span>(optional)</span><input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="India" /></label>{message && <p className="profile-message">{message}</p>}<button className="primary-action" type="submit">Save location <ChevronRight size={16} /></button></form></div></section>
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
}
