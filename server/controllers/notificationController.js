import Notification from '../models/Notification.js'

export async function listNotifications(req, res) {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30).lean()
  return res.json({ success: true, notifications, unreadCount: notifications.filter((item) => !item.isRead).length })
}

export async function markRead(req, res) {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true }, { new: true }).lean()
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' })
  return res.json({ success: true, notification })
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true })
  return res.json({ success: true, message: 'Notifications marked as read.' })
}

export async function deleteNotification(req, res) {
  const deleted = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
  if (!deleted) return res.status(404).json({ success: false, message: 'Notification not found.' })
  return res.json({ success: true, message: 'Notification deleted.' })
}
