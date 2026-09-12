import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowLeft, BatteryCharging, CloudSun, Coins, Factory, Gauge, Leaf, LogOut, RefreshCw, ShieldCheck, SunMedium, TrendingUp, Wind, Zap } from 'lucide-react'
import { getIndustryDashboard } from '../services/industryService.js'

function formatNumber(value = 0, digits = 0) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number(value || 0))
}

function timeAgo(dateValue) {
  const diffSeconds = Math.max(0, Math.round((Date.now() - new Date(dateValue).getTime()) / 1000))
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`
  const diffHours = Math.round(diffMinutes / 60)
  return `${diffHours} hours ago`
}

export default function IndustryDashboard({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const data = await getIndustryDashboard()
      setDashboard(data.dashboard)
      setStatus('')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])

  const cardMetrics = useMemo(() => {
    if (!dashboard) return []
    return [
      { label: 'Renewable Energy', value: `${formatNumber(dashboard.metrics.renewableEnergy, 0)} kWh`, icon: SunMedium },
      { label: 'Renewable Share', value: `${dashboard.metrics.renewableShare}%`, icon: Leaf },
      { label: 'Grid Energy', value: `${formatNumber(dashboard.metrics.gridEnergy, 0)} kWh`, icon: BatteryCharging },
      { label: 'Energy Cost Saved', value: `₹${formatNumber(dashboard.metrics.costSaved, 0)}`, icon: TrendingUp },
      { label: 'CO₂ Avoided', value: `${formatNumber(dashboard.metrics.co2Avoided, 0)} kg`, icon: ShieldCheck },
      { label: 'Eco Tokens', value: `${formatNumber(dashboard.metrics.ecoTokens, 0)}`, icon: Coins }
    ]
  }, [dashboard])

  if (!dashboard) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-content">
          <div className="dashboard-loading">{loading ? 'Loading industry dashboard...' : status || 'No data available yet.'}</div>
        </div>
      </main>
    )
  }

  const totalSource = Math.max(1, (dashboard.energySources?.solar || 0) + (dashboard.energySources?.wind || 0) + (dashboard.energySources?.grid || 0))
  const solarPercent = Math.round(((dashboard.energySources?.solar || 0) / totalSource) * 100)
  const windPercent = Math.round(((dashboard.energySources?.wind || 0) / totalSource) * 100)
  const gridPercent = Math.round(((dashboard.energySources?.grid || 0) / totalSource) * 100)

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div className="dashboard-corner-logo">
          <img src="/esync-logo-final.png" alt="EcoSync logo" />
        </div>
        <button className="menu-button" type="button" aria-label="Open navigation">
          <Activity size={18} />
          <span>Menu</span>
        </button>
        <div className="header-actions">
          <span className="header-greeting">{user?.fullName || dashboard.industry?.name}</span>
          <button className="notification-button" type="button" aria-label="Notifications">
            <Zap size={16} />
            <span>{dashboard.notifications?.length || 0}</span>
          </button>
          <button className="avatar-button" type="button" aria-label="Logout" onClick={onLogout}><LogOut size={15} /></button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-greeting">
          <div>
            <p className="eyebrow">Industrial energy command</p>
            <h1>{dashboard.industry?.name || 'Industry'} <em>performance</em></h1>
          </div>
          <button className="location-chip" type="button" onClick={loadDashboard}>
            <RefreshCw size={14} /> {loading ? 'Refreshing...' : 'Refresh data'}
          </button>
        </div>

        {status && <div className="role-status">{status}</div>}

        <section className="role-metrics" style={{ marginBottom: '18px' }}>
          {cardMetrics.map(({ label, value, icon: Icon }) => (
            <article key={label} className="role-metric">
              <Icon size={18} />
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="energy-chart-card" style={{ marginBottom: '18px' }}>
          <div className="live-measurement">
            <div className="live-indicator"><span /> Industry Status</div>
            <strong>{dashboard.liveStatus?.currentLoad || 0} kW <small>Current load</small></strong>
            <div className="live-time">Last telemetry: {timeAgo(dashboard.liveStatus?.lastTelemetry || new Date())}</div>
            <div className="live-meta">
              <span>Industry: <b>{dashboard.industry?.name}</b></span>
              <span>Industry Number: <b>{dashboard.industry?.industryNumber}</b></span>
              <span>Device: <b>{dashboard.liveStatus?.deviceStatus || 'ONLINE'}</b></span>
            </div>
          </div>
        </section>

        <div className="dashboard-grid">
          <article className="opportunity-card">
            <div className="card-kicker">
              <span><Factory size={14} /> Live Energy View</span>
              <span className="prediction-label">Today</span>
            </div>
            <div className="score-line">
              <strong>{dashboard.liveStatus?.renewableShare || 0}</strong>
              <span>% renewable</span>
            </div>
            <div className="score-rating">{dashboard.liveStatus?.renewableGeneration || 0} kW renewable generation</div>
            <div className="score-meter"><span style={{ width: `${Math.min(100, dashboard.liveStatus?.renewableShare || 0)}%` }} /></div>
            <div className="window-line">
              <span>Current load <strong>{dashboard.liveStatus?.currentLoad || 0} kW</strong></span>
              <span>Grid <strong>{dashboard.liveStatus?.gridConsumption || 0} kW</strong></span>
            </div>
            <div className="window-line" style={{ marginTop: '12px' }}>
              <span>Best window <strong>{dashboard.recommendation?.window || '11:45 AM - 2:15 PM'}</strong></span>
            </div>
          </article>

          <article className="weather-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">Energy sources</p>
                <h3>Source mix</h3>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 12px' }}>
              <div style={{ width: 170, height: 170, borderRadius: '50%', background: `conic-gradient(#4b9d5c 0 ${solarPercent}%, #9ccf70 ${solarPercent}% ${solarPercent + windPercent}%, #d9d9d9 ${solarPercent + windPercent}% ${solarPercent + windPercent + gridPercent}%, #2f2f2f ${solarPercent + windPercent + gridPercent}% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 95, height: 95, borderRadius: '50%', background: '#f1f8f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#183326' }}>{dashboard.metrics?.renewableShare || 0}%</div>
              </div>
            </div>
            <div className="weather-stats">
              <div className="weather-stat"><SunMedium size={16} /><span>Solar</span><strong>{dashboard.energySources?.solar || 0} kW</strong></div>
              <div className="weather-stat"><Wind size={16} /><span>Wind</span><strong>{dashboard.energySources?.wind || 0} kW</strong></div>
              <div className="weather-stat"><BatteryCharging size={16} /><span>Grid</span><strong>{dashboard.energySources?.grid || 0} kW</strong></div>
            </div>
          </article>

          <article className="recommendation-card">
            <div className="recommendation-top">
              <span className="spark-icon"><Zap size={18} /></span>
              <p className="eyebrow">EcoSync recommendation</p>
            </div>
            <h3>{dashboard.recommendation?.headline || 'High renewable generation is expected between 12:00 PM and 2:30 PM.'}</h3>
            <p>{dashboard.recommendation?.message || 'Move flexible production load to the renewable peak window to reduce grid dependency and maximize savings.'}</p>
            <div className="use-window">
              <span>Recommended shift <strong>{dashboard.recommendation?.shiftWindow || '12:00 PM - 2:00 PM'}</strong></span>
              <span>Expected benefit <strong>+{dashboard.recommendation?.renewableEnergy || 320} kWh</strong></span>
            </div>
          </article>

          <article className="opportunity-summary">
            <div>
              <p className="card-label">Smart load shifting</p>
              <strong>{dashboard.recommendation?.savings || '₹2,560'}</strong>
            </div>
            <p>Potential savings from shifting flexible loads into the best renewable window.</p>
            <div className="use-window">
              <span>CO₂ avoided <strong>{dashboard.recommendation?.co2 || '0'} kg</strong></span>
              <span>Eco Tokens <strong>+{dashboard.recommendation?.ecoTokens || 120}</strong></span>
            </div>
          </article>
        </div>

        <section className="hourly-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Chart</p>
              <h2>Renewable vs grid trend</h2>
            </div>
            <span>24-hour view</span>
          </div>
          <div className="energy-chart">
            <svg viewBox="0 0 700 200" preserveAspectRatio="none" role="img" aria-label="Industry renewable and grid trend chart">
              <g className="chart-grid-lines">
                {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="0" x2="700" y1={20 + line * 42} y2={20 + line * 42} />)}
              </g>
              <path className="chart-line chart-line-radiation" d="M 0 140 C 60 110, 120 90, 180 80 S 260 60, 320 85 S 420 100, 500 65 S 610 45, 700 60" />
              <path className="chart-line chart-line-score" d="M 0 150 C 60 135, 120 120, 180 125 S 260 110, 320 118 S 420 104, 500 130 S 610 95, 700 118" />
              {dashboard.timingChart?.map((point, index) => (
                <g key={`${point.label}-${index}`}>
                  <circle className="chart-point current" cx={index * 70 + 25} cy={200 - (point.renewable || 0) * 1.2} r="4" />
                  <text x={index * 70 + 10} y="190" className="chart-hour-label">{point.label}</text>
                </g>
              ))}
            </svg>
          </div>
          <div className="chart-scale">
            <span>06:00</span>
            <span>08:00</span>
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
          </div>
        </section>

        <section className="solar-stats-grid" style={{ marginTop: '22px' }}>
          <article className="award-card">
            <div className="card-kicker">
              <span><SunMedium size={14} /> Solar performance</span>
              <span className="award-status">High</span>
            </div>
            <div className="award-score">
              <strong>{dashboard.solarPerformance?.current || 0}</strong>
              <span>kW</span>
            </div>
            <p>Today: {dashboard.solarPerformance?.today || 0} kWh • Peak: {dashboard.solarPerformance?.peak || 0} kW • Peak time: {dashboard.solarPerformance?.peakTime || '12:35 PM'}</p>
            <div className="award-meter"><span style={{ width: `${dashboard.solarPerformance?.utilization || 86}%` }} /></div>
            <div className="award-foot"><span>Solar utilization</span><b>{dashboard.solarPerformance?.utilization || 86}%</b></div>
          </article>

          <article className="progress-card">
            <div className="card-kicker"><span><Wind size={14} /> Wind energy</span></div>
            <div className="progress-total">
              <strong>{dashboard.windPerformance?.current || 0}</strong>
              <span>kW</span>
            </div>
            <p>{dashboard.windPerformance?.configured ? `Today: ${dashboard.windPerformance.today || 0} kWh • Peak: ${dashboard.windPerformance.peak || 0} kW • Availability: ${dashboard.windPerformance.availability || 'High'}` : 'Wind: Not configured'}</p>
            <div className="progress-meter"><span style={{ width: `${dashboard.windPerformance?.availabilityPercent || 78}%` }} /></div>
            <div className="award-foot"><span>Wind availability</span><b>{dashboard.windPerformance?.availability || 'Not configured'}</b></div>
          </article>
        </section>

        <section className="solar-lower-grid" style={{ marginTop: '22px' }}>
          <article className="leaderboard-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Industrial loads</p>
                <h2>Current load profile</h2>
              </div>
            </div>
            <div className="leaderboard-list">
              {dashboard.loadBreakdown?.map((load) => (
                <div key={load.name} className="leaderboard-row">
                  <span className="leaderboard-rank">•</span>
                  <span className="leaderboard-name">{load.name}<small>{load.type}</small></span>
                  <span className="leaderboard-score">{load.value} kW</span>
                  <strong>{load.share}%</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="how-it-works-card">
            <p className="eyebrow">Smart recommendation</p>
            <h2>{dashboard.recommendation?.headline || 'Renewable peak detected'}</h2>
            <div className="award-rule">
              <span className="rule-dot high" />
              <div>
                <strong>Expected renewable period</strong>
                <p>{dashboard.recommendation?.window || '11:30 AM - 2:30 PM'} <b>HIGH</b></p>
              </div>
            </div>
            <div className="award-rule">
              <span className="rule-dot medium" />
              <div>
                <strong>Recommended action</strong>
                <p>Shift flexible production load to {dashboard.recommendation?.shiftWindow || '12:00 PM - 2:00 PM'}</p>
              </div>
            </div>
            <div className="next-window">
              <span>Potential renewable energy used</span>
              <strong>{dashboard.recommendation?.renewableEnergy || 320} kWh</strong>
            </div>
          </article>
        </section>

        <section className="suggestions-layout" style={{ marginTop: '22px' }}>
          <div className="suggestion-list">
            <div className="suggestions-progress">
              <div className="progress-track"><span style={{ width: `${dashboard.metrics?.renewableShare || 0}%` }} /></div>
              <div><span>Eco performance</span><strong>{dashboard.metrics?.renewableShare || 0}%</strong></div>
            </div>
            {dashboard.flexibleLoads?.map((item, index) => (
              <article key={`${item.name}-${index}`} className="suggestion-card">
                <div className="suggestion-step">0{index + 1}</div>
                <div className="suggestion-icon"><Gauge size={18} /></div>
                <div className="suggestion-copy">
                  <div className="suggestion-title">
                    <h2>{item.name}</h2>
                    <span>{item.flexible ? 'Flexible' : 'Fixed'}</span>
                  </div>
                  <p>Current: {item.current} kW • Recommended shift: {item.shiftWindow}</p>
                  <strong>Potential: {item.potential} kWh</strong>
                </div>
                <button className="suggestion-check" type="button" aria-label="Review recommendation"><span /></button>
              </article>
            ))}
          </div>

          <aside className="suggestion-summary">
            <p className="eyebrow">Revenue & impact</p>
            <h2>{dashboard.summary?.score || '87'}/100</h2>
            <p>{dashboard.summary?.status || 'Excellent renewable utilization and lower dependence on the grid.'}</p>
            <div className="summary-score">
              <span>Projected annual impact</span>
              <strong>₹{formatNumber(dashboard.summary?.annualSavings || 0, 0)}</strong>
            </div>
            <div className="summary-window">
              <span>CO₂ avoided</span>
              <strong>{formatNumber(dashboard.summary?.annualCo2 || 0, 0)} kg</strong>
            </div>
            <div className="summary-reward">
              <Coins size={16} />
              <div>
                <strong>Eco Tokens earned</strong>
                <span>{formatNumber(dashboard.metrics?.ecoTokens || 0, 0)}</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
