import SupportQuery from '../models/SupportQuery.js'

const knowledgeBase = [
  { category: 'Account', question: 'How do I reset my password?', answer: 'Use Forgot password on the sign-in screen and follow the email link. Request a new link if it expires.', terms: ['password', 'reset', 'login', 'sign', 'email', 'account'] },
  { category: 'Energy Management', question: 'Why is my energy dashboard not updating?', answer: 'Check that the meter connection is active and that its last sync is recent. Refresh the dashboard after reconnecting.', terms: ['energy', 'dashboard', 'update', 'sync', 'meter', 'refresh', 'data'] },
  { category: 'EV & Charging', question: 'My EV is not charging.', answer: 'Check whether the charging connection is properly connected and whether sufficient energy is available. If the issue continues, contact support.', terms: ['ev', 'charging', 'charge', 'charger', 'vehicle', 'connection', 'energy'] },
  { category: 'Solar & Renewable Energy', question: 'How does Esync calculate solar opportunity?', answer: 'Solar opportunity uses renewable availability, weather signals, historical readings, and your energy profile.', terms: ['solar', 'renewable', 'sun', 'opportunity', 'forecast', 'panel'] },
  { category: 'Payments', question: 'Where can I see my savings?', answer: 'Open Savings from the dashboard menu to review avoided cost, energy use, and your Eco Tokens.', terms: ['payment', 'savings', 'cost', 'bill', 'token'] },
  { category: 'Technical Issues', question: 'What should I do if a device goes offline?', answer: 'Check the device connection and power first, then refresh its dashboard status. Contact support if it stays offline.', terms: ['technical', 'device', 'offline', 'error', 'issue', 'connection'] },
]

function findBestMatch(message, category) {
  const words = new Set(message.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2))
  return knowledgeBase
    .filter((item) => category === 'Other' || item.category === category)
    .map((item) => ({ item, score: item.terms.reduce((total, term) => total + (words.has(term) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score)[0]
}

function findRelated(message, category) {
  const words = new Set(message.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2))
  return knowledgeBase.filter((item) => category === 'Other' || item.category === category).map((item) => ({ item, score: item.terms.reduce((total, term) => total + (words.has(term) ? 1 : 0), 0) })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(({ item }) => ({ question: item.question, answer: item.answer, category: item.category }))
}

export async function submitSupportQuery(req, res, next) {
  try {
    const { name, email, category, message } = req.body
    if (!name?.trim() || !email?.includes('@') || !category || !message?.trim()) return res.status(400).json({ success: false, message: 'Name, email, category, and message are required.' })

    const match = findBestMatch(message, category)
    const confidence = match ? Math.min(match.score / 3, 1) : 0
    const query = await SupportQuery.create({ name, email, category, message, matchedQuestion: confidence > 0 ? match.item.question : null, suggestedSolution: confidence > 0 ? match.item.answer : null, matchConfidence: confidence })
    return res.status(201).json({ success: true, queryId: query._id, match: confidence > 0 ? { question: match.item.question, answer: match.item.answer, category: match.item.category, confidence } : null, alternatives: findRelated(message, category), needsEscalation: confidence === 0 })
  } catch (error) {
    return next(error)
  }
}

export async function escalateSupportQuery(req, res, next) {
  try {
    const query = await SupportQuery.findByIdAndUpdate(req.params.id, { status: 'escalated' }, { new: true }).lean()
    if (!query) return res.status(404).json({ success: false, message: 'Support request not found.' })
    return res.json({ success: true, message: 'Your query has been escalated. Our support team will follow up by email.' })
  } catch (error) {
    return next(error)
  }
}