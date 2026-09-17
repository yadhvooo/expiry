import { getUserNotifications, markNotificationAsRead } from '../services/notificationService.js';

export async function getNotifications(req, res) {
  try {
    const notifications = await getUserNotifications(req.user.id);
    return res.json({ notifications });
  } catch (error) {
    console.error('[Notification] GetNotifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    await markNotificationAsRead(id, req.user.id);
    return res.json({ success: true });
  } catch (error) {
    console.error('[Notification] MarkAsRead error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
}

export default {
  getNotifications,
  markAsRead
};
