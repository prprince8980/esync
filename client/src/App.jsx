import { useEffect, useState } from 'react'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { signin, signup } from './services/authService.js'
import { lookupVehicle } from './services/evService.js'
import HouseholdDashboard from './pages/household/HouseholdDashboard.jsx'
import RoleDashboard from './pages/RoleDashboard.jsx'
import EvOwnerDashboard from './pages/EvOwnerDashboard.jsx'
import IndustryDashboard from './pages/IndustryDashboard.jsx'
import { loginIndustry } from './services/industryService.js'

const roles = [
  { id: 'household', icon: '⌂', label: 'Household', description: 'Manage and optimize home energy' },
  { id: 'ev_owner', icon: '↯', label: 'EV Owner', description: 'Find smarter and greener charging times' },
  { id: 'industry', icon: '▦', label: 'Industry', description: 'Optimize renewable energy and industrial loads' }
]

const roleLabels = Object.fromEntries(roles.map((role) => [role.id, role.label]))

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, icon: Icon, action }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-control">
        <Icon size={17} strokeWidth={1.8} />
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} />
        {action}
      </span>
    </label>
  )
}

function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="Loading Esync">
      <img className="splash-logo" src="/esync-logo.png" alt="Esync - A sustainable initiative" />
    </main>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [mode, setMode] = useState('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [welcomeUser, setWelcomeUser] = useState(null)
  const [householdUser, setHouseholdUser] = useState(null)
  const [householdFlowStep, setHouseholdFlowStep] = useState('select')
  const [householdHomeName, setHouseholdHomeName] = useState('')
  const [householdModeStatus, setHouseholdModeStatus] = useState({ type: '', message: '' })
  const [householdHomeId, setHouseholdHomeId] = useState('')
  const [roleUser, setRoleUser] = useState(null)
  const [evLoginOpen, setEvLoginOpen] = useState(false)
  const [evNumber, setEvNumber] = useState('')
  const [evVehicle, setEvVehicle] = useState(null)
  const [industryLoginOpen, setIndustryLoginOpen] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', userType: '', industryNumber: '' })

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setShowSplash(false), 2000)
    return () => window.clearTimeout(splashTimer)
  }, [])

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setStatus({ type: '', message: '' })
    setWelcomeUser(null)
    setHouseholdUser(null)
    setRoleUser(null)
    setEvLoginOpen(false)
    setEvVehicle(null)
    setEvNumber('')
    setIndustryLoginOpen(false)
  }

  const validate = () => {
    if (mode === 'signup' && !form.fullName.trim()) return 'Please enter your full name.'
    if (!form.email.trim()) return 'Please enter your email address.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.'
    if (!form.password) return 'Please enter a password.'
    if (mode === 'signup' && form.password.length < 8) return 'Password must be at least 8 characters.'
    if (mode === 'signup' && form.password !== form.confirmPassword) return 'Passwords do not match.'
    if (mode === 'signup' && !form.userType) return 'Please select your user type.'
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationMessage = validate()
    if (validationMessage) {
      setStatus({ type: 'error', message: validationMessage })
      return
    }

    setIsLoading(true)
    setStatus({ type: '', message: '' })
    try {
      if (mode === 'signup') {
        await signup(form)
        setStatus({ type: 'success', message: 'Account created successfully. Sign in to continue.' })
        setForm((current) => ({ ...current, password: '', confirmPassword: '', industryNumber: '' }))
        setMode('signin')
      } else {
        const response = await signin({ email: form.email, password: form.password })
        localStorage.setItem('esync_token', response.token)

        if (response.user.userType === 'household') {
          setHouseholdUser(response.user)
          setHouseholdFlowStep('mode')
          setHouseholdHomeName('')
          setHouseholdHomeId('')
          setHouseholdModeStatus({ type: '', message: '' })
          setStatus({ type: 'success', message: '' })
          return
        }

        if (response.user.userType === 'industry') {
          const industryNumber = form.industryNumber?.trim().toUpperCase()
          if (!industryNumber) {
            setStatus({ type: 'error', message: 'Please enter a valid Industry Number.' })
            return
          }
          const verified = await loginIndustry({ industryNumber })
          const finalUser = { ...response.user, industryNumber: verified.industry?.industryNumber || industryNumber }
          setRoleUser(finalUser)
          setIndustryLoginOpen(false)
          setStatus({ type: 'success', message: '' })
          return
        }

        if (response.user.userType === 'ev_owner') {
          setRoleUser(response.user)
          setEvVehicle(null)
          setEvNumber('')
          setEvLoginOpen(true)
          setStatus({ type: 'success', message: '' })
          return
        }

        setRoleUser(response.user)
        setStatus({ type: 'success', message: '' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const resolveHomeRecord = (homeName) => {
    const trimmedName = homeName.trim()
    if (!trimmedName) {
      return { found: false, message: 'Please enter a Home Name.' }
    }

    const normalized = trimmedName.toLowerCase()
    const missingSignals = ['not found', 'notexist', 'does not exist', 'missing', 'invalid', 'unknown']
    if (missingSignals.some((signal) => normalized.includes(signal))) {
      return { found: false, message: 'Home not found. Please check the Home Name and try again.' }
    }

    return {
      found: true,
      homeId: `HOME-${trimmedName.replace(/\s+/g, '-').slice(0, 24).toUpperCase()}`
    }
  }

  const handleHouseholdModeSelect = (nextMode) => {
    setHouseholdModeStatus({ type: '', message: '' })
    if (nextMode === 'normal') {
      setHouseholdFlowStep('dashboard')
      return
    }
    setHouseholdFlowStep('auto')
  }

  const handleHouseholdHomeSubmit = (event) => {
    event.preventDefault()

    const lookup = resolveHomeRecord(householdHomeName)
    if (!lookup.found) {
      setHouseholdModeStatus({ type: 'error', message: lookup.message })
      return
    }

    setHouseholdHomeId(lookup.homeId)
    setHouseholdModeStatus({ type: 'success', message: 'Home connection is ready for the future Home API.' })
    setHouseholdFlowStep('dashboard')
  }

  if (showSplash) return <SplashScreen />

  if (householdUser && householdFlowStep === 'mode') {
    return (
      <main className="app-shell auth-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="grid-lines" />
        <div className="auth-layout">
          <div className="page-corner-logo"><img src="/esync-logo-final.png" alt="Esync - A sustainable initiative" /></div>
          <section className="auth-card household-mode-card" aria-label="Householder access mode">
            <div className="mobile-brand"><img className="esync-logo" src="/esync-logo.png" alt="Esync" /></div>
            <div className="auth-heading">
              <p className="eyebrow">Householder</p>
              <h2>How do you want to continue?</h2>
            </div>
            <div className="household-choice-grid">
              <button type="button" className="household-choice-card" onClick={() => handleHouseholdModeSelect('auto')}>
                <span className="household-choice-title">AUTO</span>
                <span className="household-choice-copy">Automatically connect and manage your registered home using your Home ID.</span>
              </button>
              <button type="button" className="household-choice-card" onClick={() => handleHouseholdModeSelect('normal')}>
                <span className="household-choice-title">NORMAL</span>
                <span className="household-choice-copy">Continue with normal Householder functionality without automatic home connection.</span>
              </button>
            </div>
            <button className="submit-button secondary-button" type="button" onClick={() => { setHouseholdUser(null); setHouseholdFlowStep('select'); setHouseholdHomeName(''); setHouseholdHomeId(''); setHouseholdModeStatus({ type: '', message: '' }); setMode('signin'); setForm((current) => ({ ...current, password: '', industryNumber: '' })) }}>
              Back to sign in
            </button>
          </section>
        </div>
      </main>
    )
  }

  if (householdUser && householdFlowStep === 'auto') {
    return (
      <main className="app-shell auth-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="grid-lines" />
        <div className="auth-layout">
          <div className="page-corner-logo"><img src="/esync-logo-final.png" alt="Esync - A sustainable initiative" /></div>
          <section className="auth-card household-mode-card" aria-label="Auto home connection">
            <div className="mobile-brand"><img className="esync-logo" src="/esync-logo.png" alt="Esync" /></div>
            <div className="auth-heading">
              <p className="eyebrow">Connect your home</p>
              <h2>Enter Home Name</h2>
            </div>
            <form onSubmit={handleHouseholdHomeSubmit} noValidate>
              <label className="field">
                <span className="field-label">Home Name</span>
                <span className="field-control">
                  <input type="text" value={householdHomeName} onChange={(event) => setHouseholdHomeName(event.target.value)} placeholder="Prince Home" autoComplete="off" />
                </span>
              </label>
              {householdModeStatus.message && <div className={`status-message ${householdModeStatus.type}`} role="alert">{householdModeStatus.message}</div>}
              <button className="submit-button" type="submit">Continue</button>
            </form>
            <div className="household-flow-actions">
              <button type="button" className="text-button" onClick={() => { setHouseholdFlowStep('mode'); setHouseholdModeStatus({ type: '', message: '' }) }}>Back</button>
              <button type="button" className="text-button" onClick={() => { setHouseholdUser(null); setHouseholdFlowStep('select'); setHouseholdHomeName(''); setHouseholdHomeId(''); setHouseholdModeStatus({ type: '', message: '' }); setMode('signin'); setForm((current) => ({ ...current, password: '', industryNumber: '' })) }}>Log out</button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  if (householdUser && householdFlowStep === 'dashboard') return <HouseholdDashboard user={householdUser} onLogout={() => { setHouseholdUser(null); setHouseholdFlowStep('select'); setHouseholdHomeName(''); setHouseholdHomeId(''); setHouseholdModeStatus({ type: '', message: '' }); setMode('signin'); setForm((current) => ({ ...current, password: '', industryNumber: '' })) }} />

  const handleEvVerify = async (event) => {
    event.preventDefault()
    const trimmed = evNumber.trim()
    if (!trimmed) {
      setStatus({ type: 'error', message: 'Please enter your EV Number.' })
      return
    }

    try {
      setIsLoading(true)
      setStatus({ type: '', message: '' })
      const response = await lookupVehicle({ evNumber: trimmed })
      setEvVehicle(response.vehicle)
      setEvLoginOpen(false)
      setStatus({ type: 'success', message: 'EV verified successfully.' })
    } catch (error) {
      setEvVehicle(null)
      setStatus({ type: 'error', message: error.message === 'EV NOT FOUND' ? 'EV NOT FOUND' : error.message })
    } finally {
      setIsLoading(false)
    }
  }

  if (roleUser && roleUser.userType === 'ev_owner' && !evVehicle) {
    return (
      <main className="app-shell auth-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="grid-lines" />
        <div className="auth-layout">
          <div className="page-corner-logo"><img src="/esync-logo-final.png" alt="Esync - A sustainable initiative" /></div>
          <section className="auth-card" aria-label="EV access verification">
            <div className="mobile-brand"><img className="esync-logo" src="/esync-logo.png" alt="Esync" /></div>
            <div className="auth-heading">
              <p className="eyebrow">EV Owner</p>
              <h2>Verify your vehicle</h2>
              <p>Enter your EV Number to access the live charging dashboard.</p>
            </div>
            <form onSubmit={handleEvVerify} noValidate>
              <label className="field">
                <span className="field-label">EV Number</span>
                <span className="field-control">
                  <UserRound size={17} strokeWidth={1.8} />
                  <input type="text" value={evNumber} onChange={(event) => setEvNumber(event.target.value)} placeholder="EV-1001" autoComplete="off" />
                </span>
              </label>
              {status.message && <div className={`status-message ${status.type}`} role="alert">{status.message}</div>}
              <button className="submit-button" type="submit" disabled={isLoading}>{isLoading ? 'Checking EV...' : 'Open dashboard'} <ArrowRight size={17} /></button>
            </form>
            <div className="household-flow-actions">
              <button type="button" className="text-button" onClick={() => { localStorage.removeItem('esync_token'); setRoleUser(null); setEvVehicle(null); setEvNumber(''); setEvLoginOpen(false); setMode('signin'); setForm((current) => ({ ...current, password: '', industryNumber: '' })); setStatus({ type: '', message: '' }) }}>Back to sign in</button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  if (roleUser) return roleUser.userType === 'ev_owner' ? <EvOwnerDashboard user={roleUser} evVehicle={evVehicle} onLogout={() => { localStorage.removeItem('esync_token'); setRoleUser(null); setEvVehicle(null); setEvNumber(''); setEvLoginOpen(false); setMode('signin'); setForm((current) => ({ ...current, password: '', industryNumber: '' })) }} /> : roleUser.userType === 'industry' ? <IndustryDashboard user={roleUser} onLogout={() => { localStorage.removeItem('esync_token'); setRoleUser(null); setMode('signin'); setForm((current) => ({ ...current, password: '', industryNumber: '' })) }} /> : <RoleDashboard user={roleUser} onLogout={() => { localStorage.removeItem('esync_token'); setRoleUser(null); setMode('signin'); setForm((current) => ({ ...current, password: '', industryNumber: '' })) }} />

  if (welcomeUser) {
    return (
      <main className="app-shell welcome-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <section className="welcome-panel" aria-live="polite">
          <div className="welcome-icon"><Check size={28} /></div>
          <p className="eyebrow">Account verified</p>
          <h1>Welcome to Esync, <span>{welcomeUser.fullName.split(' ')[0]}.</span></h1>
          <p className="welcome-copy">Your account is ready for a smarter energy future.</p>
          <div className="account-type">
            <span className="account-type-dot" />
            <span>Account type</span>
            <strong>{roleLabels[welcomeUser.userType]}</strong>
          </div>
          <button className="text-button" onClick={() => { setWelcomeUser(null); setMode('signin') }}>Back to sign in <ArrowRight size={16} /></button>
        </section>
      </main>
    )
  }

  if (industryLoginOpen) {
    return (
      <main className="app-shell auth-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="grid-lines" />
        <div className="auth-layout">
          <div className="page-corner-logo"><img src="/esync-logo-final.png" alt="Esync - A sustainable initiative" /></div>
          <section className="auth-card" aria-label="Industry login">
            <div className="mobile-brand"><img className="esync-logo" src="/esync-logo.png" alt="Esync" /></div>
            <div className="auth-heading">
              <p className="eyebrow">EcoSync Industry</p>
              <h2>Industrial Energy Management</h2>
              <p>Connect your industry account using your EcoSync industry number.</p>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <Field label="Email address" type="email" value={form.email} onChange={updateField('email')} placeholder="you@example.com" autoComplete="email" icon={Mail} />
              <Field label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField('password')} placeholder="Password" autoComplete="current-password" icon={LockKeyhole} action={<button type="button" className="icon-button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>} />
              <Field label="Industry Number" value={form.industryNumber} onChange={updateField('industryNumber')} placeholder="IND-1001" autoComplete="off" icon={UserRound} />
              {status.message && <div className={`status-message ${status.type}`} role="alert">{status.message}</div>}
              <button className="submit-button" type="submit" disabled={isLoading}>{isLoading ? 'Checking access...' : 'Continue'} <ArrowRight size={17} /></button>
            </form>
            <p className="switch-prompt">Need another login? <button type="button" onClick={() => { setIndustryLoginOpen(false); setMode('signin'); setForm((current) => ({ ...current, industryNumber: '' })) }}>Back</button></p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grid-lines" />
      <div className="auth-layout">
        <div className="page-corner-logo"><img src="/esync-logo-final.png" alt="Esync - A sustainable initiative" /></div>
        <section className="intro-panel">
          <div className="logo-lockup"><img className="esync-logo" src="/esync-logo.png" alt="Esync - A sustainable initiative" /></div>
          <div className="intro-copy">
            <p className="eyebrow">Energy, in rhythm</p>
            <h1>Power smarter<br /><em>with Esync.</em></h1>
            <p>One calm place to connect your energy choices with a more resilient tomorrow.</p>
          </div>
          <div className="signal-note"><span className="signal-dot" /> <span>Built for the energy in motion</span></div>
          <div className="orbit-decoration"><span /><span /><span /></div>
        </section>

        <section className="auth-card" aria-label={mode === 'signin' ? 'Sign in' : 'Sign up'}>
          <div className="mobile-brand"><img className="esync-logo" src="/esync-logo.png" alt="Esync - A sustainable initiative" /></div>
          <div className="auth-heading">
            <p className="eyebrow">{mode === 'signin' ? 'Welcome back' : 'Start your journey'}</p>
            <h2>{mode === 'signin' ? 'Sign in to Esync' : 'Create your account'}</h2>
            <p>{mode === 'signin' ? 'Pick up where your energy story left off.' : 'Just the essentials to get you connected.'}</p>
          </div>
          <div className="mode-switch" role="tablist" aria-label="Authentication mode">
            <button className={mode === 'signin' ? 'active' : ''} onClick={() => changeMode('signin')} role="tab" aria-selected={mode === 'signin'}>Sign In</button>
            <button className={mode === 'signup' ? 'active' : ''} onClick={() => changeMode('signup')} role="tab" aria-selected={mode === 'signup'}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'signup' && <Field label="Full name" value={form.fullName} onChange={updateField('fullName')} placeholder="Your name" autoComplete="name" icon={UserRound} />}
            <Field label="Email address" type="email" value={form.email} onChange={updateField('email')} placeholder="you@example.com" autoComplete="email" icon={Mail} />
            <Field label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField('password')} placeholder="At least 8 characters" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} icon={LockKeyhole} action={<button type="button" className="icon-button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>} />
            {mode === 'signup' && <Field label="Confirm password" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={updateField('confirmPassword')} placeholder="Repeat your password" autoComplete="new-password" icon={LockKeyhole} action={<button type="button" className="icon-button" onClick={() => setShowConfirm((current) => !current)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>{showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}</button>} />}

            {mode === 'signup' && <fieldset className="role-picker"><legend>Choose your energy profile</legend><div className="role-grid">{roles.map((role) => <button type="button" key={role.id} className={`role-card ${form.userType === role.id ? 'selected' : ''}`} onClick={() => setForm((current) => ({ ...current, userType: role.id }))}><span className="role-icon">{role.icon}</span><span className="role-name">{role.label}</span><span className="role-description">{role.description}</span>{form.userType === role.id && <span className="role-check"><Check size={12} /></span>}</button>)}</div></fieldset>}
            {mode === 'signin' && (
              <div className="form-meta">
                <span>Secure access to your account</span>
                <button type="button" className="forgot-button" onClick={() => setStatus({ type: 'info', message: 'Password recovery will be available soon.' })}>Forgot password?</button>
              </div>
            )}
            {mode === 'signin' && (
              <div className="form-meta" style={{ marginTop: 8 }}>
                <span>Industry access</span>
                <button type="button" className="forgot-button" onClick={() => { setIndustryLoginOpen(true); setForm((current) => ({ ...current, userType: 'industry', industryNumber: '' })); setStatus({ type: '', message: '' }) }}>Industry Login</button>
              </div>
            )}
            {status.message && <div className={`status-message ${status.type}`} role="alert">{status.message}</div>}
            <button className="submit-button" type="submit" disabled={isLoading}>{isLoading ? 'Working...' : mode === 'signin' ? 'Sign In' : 'Create account'} <ArrowRight size={17} /></button>
          </form>
          <p className="switch-prompt">{mode === 'signin' ? "Don't have an account?" : 'Already have an account?'} <button type="button" onClick={() => changeMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'Sign Up' : 'Sign In'}</button></p>
          <p className="legal-note">By continuing, you agree to Esync's focus on a cleaner energy future.</p>
        </section>
      </div>
    </main>
  )
}

export default App
