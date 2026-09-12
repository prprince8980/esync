import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, LifeBuoy, LoaderCircle, Search, Send } from 'lucide-react'

const categories = [
  { name: 'Getting started', items: [{ question: 'How do I connect my facility data?', answer: 'Open Settings, choose Data connections, and select your utility, meter, or telemetry provider.' }, { question: 'Which teams can use Esync?', answer: 'Esync supports household, EV owner, industry, and operations teams with role-aware views.' }] },
  { name: 'Energy & analytics', items: [{ question: 'Why is my energy dashboard not updating?', answer: 'Check that the meter connection is active and that its last sync is recent. Refresh the dashboard after reconnecting.' }, { question: 'How are recommendations calculated?', answer: 'Recommendations combine your historical readings, current conditions, operating patterns, and configured targets.' }] },
  { name: 'Account & privacy', items: [{ question: 'How do I reset my password?', answer: 'Use Forgot password on the sign-in screen and follow the email link. Request a new link if it expires.' }, { question: 'Who can see my resource data?', answer: 'Only workspace members and authorized Esync support staff can access your data.' }] },
]

function FaqPanel({ open, setOpen, search, setSearch }) {
  const visible = categories.map((category) => ({ ...category, items: category.items.filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(search.toLowerCase())) })).filter((category) => category.items.length)
  return <section className="help-faq-panel"><div className="help-panel-title"><div><span className="card-label">Knowledge base</span><h2>Frequently asked questions</h2></div><CircleHelp size={22} /></div><label className="help-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search support topics" aria-label="Search support topics" /></label>{visible.length ? visible.map((category) => <div className="help-faq-category" key={category.name}><span>{category.name}</span>{category.items.map((item) => <div className="help-faq-item" key={item.question}><button onClick={() => setOpen(open === item.question ? '' : item.question)} aria-expanded={open === item.question}><strong>{item.question}</strong><ChevronDown size={16} className={open === item.question ? 'is-open' : ''} /></button><AnimatePresence initial={false}>{open === item.question && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{item.answer}</motion.p>}</AnimatePresence></div>)}</div>) : <div className="help-empty"><Search size={20} /><p>No matching answers. Send a query and we will help.</p></div>}</section>
}

function QueryPanel({ user, setOpen }) {
  const [form, setForm] = useState({ name: user?.fullName || '', email: user?.email || '', category: 'Getting started', message: '' })
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState({ type: '', message: '' })
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.email.includes('@') || !form.message.trim()) return setStatus({ type: 'error', message: 'Complete your name, email, and message first.' })
    setStatus({ type: 'loading', message: 'Searching support answers...' })
    try {
      const response = await fetch('/api/support/queries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to submit your query.')
      setResult(data)
      setStatus({ type: 'success', message: data.match ? 'We found a relevant answer.' : 'Your request is ready for support.' })
      setForm((current) => ({ ...current, message: '' }))
    } catch (error) { setStatus({ type: 'error', message: error.message }) }
  }
  const escalate = async () => {
    setStatus({ type: 'loading', message: 'Escalating your request...' })
    try {
      const response = await fetch(`/api/support/queries/${result.queryId}/escalate`, { method: 'PATCH' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setResult((current) => ({ ...current, escalated: true }))
      setStatus({ type: 'success', message: data.message })
    } catch (error) { setStatus({ type: 'error', message: error.message }) }
  }
  return <motion.section className="help-query-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><div className="help-panel-title"><div><span className="card-label">Direct support</span><h2>Raise a query</h2></div><Send size={21} /></div><p className="help-query-copy">Your question is saved securely and matched against our support library.</p><form onSubmit={submit} className="help-query-form"><label>Name<input value={form.name} onChange={update('name')} placeholder="Your name" /></label><label>Email address<input type="email" value={form.email} onChange={update('email')} placeholder="you@company.com" /></label><label>Query category<select value={form.category} onChange={update('category')}><option>Getting started</option><option>Energy & analytics</option><option>Account & privacy</option><option>EV charging</option><option>Other</option></select></label><label>Problem / message<textarea rows="5" value={form.message} onChange={update('message')} placeholder="What do you need help with?" /></label>{status.message && <div className={`help-status ${status.type}`}>{status.type === 'loading' ? <LoaderCircle size={16} className="help-spin" /> : status.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}<span>{status.message}</span></div>}<button className="primary-action help-submit" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Working...' : 'Submit Query'}<Send size={15} /></button></form>{result && <Solution result={result} setOpen={setOpen} escalate={escalate} />}</motion.section>
}

function Solution({ result, setOpen, escalate }) {
  return <motion.div className="help-solution-card" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }}><span><CheckCircle2 size={15} /> Suggested Solution</span>{result.match ? <><h3>{result.match.question}</h3><p>{result.match.answer}</p>{result.alternatives?.length > 1 && <div className="help-related"><b>Related answers</b>{result.alternatives.slice(1).map((item) => <button key={item.question} onClick={() => setOpen(item.question)}>{item.question}<ChevronRight size={14} /></button>)}</div>}</> : <><h3>We need a closer look.</h3><p>No close match was found, but your query is saved for a support specialist.</p></>}{!result.escalated && <button className="help-escalate" onClick={escalate}><LifeBuoy size={15} /> Still need help?</button>}</motion.div>
}

export default function HelpSupportView({ user }) {
  const [open, setOpen] = useState(categories[0].items[0].question)
  const [search, setSearch] = useState('')
  return <section className="help-dashboard-view"><div className="help-view-heading"><div><p className="eyebrow">Support center</p><h1>How can we help?</h1><p>Find answers quickly or tell the Esync team what is blocking your next step.</p></div><div className="help-live-badge"><span />Support online</div></div><div className="help-dashboard-grid"><FaqPanel open={open} setOpen={setOpen} search={search} setSearch={setSearch} /><QueryPanel user={user} setOpen={setOpen} /></div></section>
}
