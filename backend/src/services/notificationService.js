import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';

/**
 * In-App and Email-Ready Notification Service
 */
export async function createNotification({ userId, title, message, type = 'system', linkUrl = null }) {
  try {
    const id = uuidv4();
    await db.query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, $6, CURRENT_TIMESTAMP)`,
      [id, userId, title, message, type, linkUrl]
    );
    console.log(`[Notification] Created for User ${userId}: "${title}"`);
    return { id, userId, title, message, type, linkUrl };
  } catch (error) {
    console.error('[Notification] Error creating notification:', error);
    return null;
  }
}

export async function getUserNotifications(userId) {
  const rows = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return rows;
}

export async function markNotificationAsRead(notificationId, userId) {
  await db.query(
    `UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
  return true;
}

export default {
  createNotification,
  getUserNotifications,
  markNotificationAsRead
};
