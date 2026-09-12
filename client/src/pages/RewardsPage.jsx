import { useEffect, useState } from 'react'
import { ArrowLeft, Check, TrendingUp, TrendingDown, Gift, AlertCircle, X, Zap } from 'lucide-react'
import { getBalance, getHistory, getStats, getVouchers, redeemVoucher } from '../../services/rewardsService.js'

const categoryColors = {
  HOUSEHOLD_SAVING: { bg: 'bg-blue-50', icon: '🏠', label: 'Energy Saving' },
  EV_SMART_CHARGING: { bg: 'bg-green-50', icon: '⚡', label: 'Smart Charging' },
  INDUSTRY_LOAD_SHIFT: { bg: 'bg-purple-50', icon: '🏭', label: 'Load Shifting' },
  RENEWABLE_USAGE: { bg: 'bg-yellow-50', icon: '☀', label: 'Renewable Energy' },
  VOUCHER_REDEMPTION: { bg: 'bg-red-50', icon: '🎁', label: 'Voucher Redeemed' }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupTransactionsByDate(transactions) {
  const groups = {}
  transactions.forEach((t) => {
    const date = formatDate(t.createdAt)
    if (!groups[date]) groups[date] = []
    groups[date].push(t)
  })
  return groups
}

function BalanceOverview({ stats, loading }) {
  if (loading) {
    return (
      <section className="rewards-overview-loading">
        <div className="balance-skeleton" />
      </section>
    )
  }

  return (
    <section className="rewards-overview">
      <div className="overview-card primary">
        <div className="card-content">
          <span className="coin-icon">🪙</span>
          <div className="balance-info">
            <span className="label">Current Balance</span>
            <strong className="balance">{stats.current} Eco Coins</strong>
          </div>
        </div>
      </div>

      <div className="overview-grid">
        <article className="stat-card">
          <div className="stat-icon earned">
            <TrendingUp size={18} />
          </div>
          <div className="stat-content">
            <span>Earned</span>
            <strong>+{stats.earned}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon spent">
            <TrendingDown size={18} />
          </div>
          <div className="stat-content">
            <span>Redeemed</span>
            <strong>−{stats.redeemed}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon available">
            <Gift size={18} />
          </div>
          <div className="stat-content">
            <span>Available</span>
            <strong>{stats.available}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon weekly">
            <Zap size={18} />
          </div>
          <div className="stat-content">
            <span>This Week</span>
            <strong>+{stats.thisWeekEarned}</strong>
          </div>
        </article>
      </div>
    </section>
  )
}

function HowToEarn() {
  const rules = [
    { icon: '☀', title: 'Use renewable energy', coins: '+10 coins', desc: 'Record renewable energy usage in your profile' },
    { icon: '⚡', title: 'Shift EV charging to recommended time', coins: '+15 coins', desc: 'Charge during high renewable availability windows' },
    { icon: '🏠', title: 'Reduce/shift household energy usage', coins: '+10 coins', desc: 'Complete energy-saving actions and load shifting' },
    { icon: '🏭', title: 'Industry load shifting', coins: '+50 coins', desc: 'Shift industrial loads during renewable peaks' },
    { icon: '🌱', title: 'Complete an energy-saving action', coins: '+5 coins', desc: 'Participate in recommended energy optimizations' }
  ]

  return (
    <section className="how-to-earn">
      <div className="section-header">
        <h2>How to Earn Eco Coins</h2>
        <p>Maximize your rewards by taking eco-friendly actions</p>
      </div>

      <div className="earn-rules">
        {rules.map((rule, i) => (
          <article key={i} className="earn-rule">
            <span className="rule-icon">{rule.icon}</span>
            <div className="rule-content">
              <h4>{rule.title}</h4>
              <p>{rule.desc}</p>
            </div>
            <span className="rule-coins">{rule.coins}</span>
          </article>
        ))}
      </div>

      <div className="earn-flow">
        <h3>The Eco Coin Journey</h3>
        <div className="flow-steps">
          <div className="flow-step">
            <span className="step-number">1</span>
            <p>Save or shift energy</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <span className="step-number">2</span>
            <p>EcoSync detects action</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <span className="step-number">3</span>
            <p>Coins awarded</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <span className="step-number">4</span>
            <p>Redeem vouchers</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function TransactionHistory({ transactions, loading }) {
  if (loading) {
    return <div className="history-loading">Loading transaction history...</div>
  }

  if (!transactions.length) {
    return (
      <section className="transaction-history">
        <h2>Transaction History</h2>
        <div className="empty-history">
          <AlertCircle size={32} />
          <p>No transactions yet. Start earning by using renewable energy!</p>
        </div>
      </section>
    )
  }

  const grouped = groupTransactionsByDate(transactions)

  return (
    <section className="transaction-history">
      <h2>Transaction History</h2>
      <div className="transaction-groups">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="transaction-group">
            <h3 className="group-date">{date}</h3>
            <div className="transaction-list">
              {items.map((t) => {
                const category = categoryColors[t.category] || categoryColors.RENEWABLE_USAGE
                const isEarn = t.type === 'EARN'
                return (
                  <article key={t._id} className={`transaction-item ${t.type.toLowerCase()}`}>
                    <div className="transaction-icon-wrapper">
                      <span className="transaction-icon">{category.icon}</span>
                    </div>
                    <div className="transaction-details">
                      <strong>{category.label}</strong>
                      <p>{t.description}</p>
                    </div>
                    <span className={`transaction-amount ${isEarn ? 'earn' : 'spend'}`}>
                      {isEarn ? '+' : '−'}{t.amount}
                    </span>
                  </article>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function VoucherCard({ voucher, onRedeem, userBalance, loading }) {
  const canRedeem = userBalance >= voucher.coinsRequired
  const [isRedeeming, setIsRedeeming] = useState(false)

  const handleRedeem = async () => {
    if (!canRedeem || isRedeeming) return
    setIsRedeeming(true)
    try {
      await onRedeem(voucher._id, voucher.coinsRequired)
    } finally {
      setIsRedeeming(false)
    }
  }

  return (
    <article className={`voucher-card ${canRedeem ? '' : 'disabled'}`}>
      <div className="voucher-icon">{voucher.icon}</div>
      <div className="voucher-content">
        <h3>{voucher.currency}{voucher.value}</h3>
        <p>{voucher.name}</p>
        {voucher.description && <span className="voucher-desc">{voucher.description}</span>}
      </div>
      <div className="voucher-cost">
        <span className="cost-label">Costs</span>
        <strong>{voucher.coinsRequired}</strong>
        <small>coins</small>
      </div>
      <button
        className={`redeem-btn ${canRedeem ? '' : 'insufficient'}`}
        onClick={handleRedeem}
        disabled={!canRedeem || isRedeeming || loading}
      >
        {isRedeeming ? 'Redeeming...' : canRedeem ? 'Redeem' : `Need ${voucher.coinsRequired - userBalance} more`}
      </button>
    </article>
  )
}

function VoucherStore({ vouchers, userBalance, onRedeem, loading, redeemError, onClearError }) {
  if (!vouchers.length) {
    return (
      <section className="voucher-store">
        <h2>🎁 Redeem Eco Coins</h2>
        <div className="store-empty">
          <p>No vouchers available yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="voucher-store">
      <div className="store-header">
        <h2>🎁 Redeem Eco Coins</h2>
        <p>Use your Eco Coins to get real vouchers</p>
      </div>

      {redeemError && (
        <div className="redeem-error">
          <AlertCircle size={18} />
          <span>{redeemError}</span>
          <button onClick={onClearError} aria-label="Close error">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="voucher-grid">
        {vouchers.map((voucher) => (
          <VoucherCard
            key={voucher._id}
            voucher={voucher}
            onRedeem={onRedeem}
            userBalance={userBalance}
            loading={loading}
          />
        ))}
      </div>

      <div className="store-note">
        <p>💡 Tip: Complete more energy-saving actions to earn more coins and unlock premium vouchers!</p>
      </div>
    </section>
  )
}

export default function RewardsPage({ user, onBack }) {
  const [stats, setStats] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [redeemError, setRedeemError] = useState('')
  const [redeemSuccess, setRedeemSuccess] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsRes, historyRes, vouchersRes] = await Promise.all([
        getStats(),
        getHistory(50, 0),
        getVouchers()
      ])
      setStats(statsRes.stats)
      setTransactions(historyRes.transactions)
      setVouchers(vouchersRes.vouchers)
      setRedeemError('')
    } catch (error) {
      console.error('Failed to load rewards:', error)
      setRedeemError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRedeem = async (voucherId, coinsRequired) => {
    try {
      setRedeemError('')
      const result = await redeemVoucher(voucherId, coinsRequired)
      setRedeemSuccess(`Successfully redeemed ${result.voucher.currency}${result.voucher.value} voucher!`)
      setTimeout(() => setRedeemSuccess(''), 3000)
      await loadData()
    } catch (error) {
      setRedeemError(error.message)
    }
  }

  return (
    <main className="rewards-page">
      <div className="rewards-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="header-content">
          <h1>🪙 Eco Coins & Rewards</h1>
          <p>Earn coins by saving energy, get rewarded</p>
        </div>
      </div>

      {redeemSuccess && (
        <div className="success-banner">
          <Check size={18} />
          {redeemSuccess}
        </div>
      )}

      <div className="rewards-container">
        <BalanceOverview stats={stats} loading={loading} />

        <HowToEarn />

        <TransactionHistory transactions={transactions} loading={loading} />

        <VoucherStore
          vouchers={vouchers}
          userBalance={stats?.current || 0}
          onRedeem={handleRedeem}
          loading={loading}
          redeemError={redeemError}
          onClearError={() => setRedeemError('')}
        />
      </div>
    </main>
  )
}
