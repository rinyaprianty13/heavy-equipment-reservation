'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notification } from '@/lib/db/schema'
import { headers } from 'next/headers'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(limit: number = 50) {
  const userId = await getUserId()

  return db
    .select()
    .from(notification)
    .where(eq(notification.userId, userId))
    .orderBy(desc(notification.createdAt))
    .limit(limit)
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount() {
  const userId = await getUserId()

  const result = await db
    .select({ count: notification.id })
    .from(notification)
    .where(
      and(
        eq(notification.userId, userId),
        eq(notification.status, 'PENDING')
      )
    )

  return result.length || 0
}

/**
 * Mark notification as sent
 */
export async function markNotificationAsSent(notificationId: string) {
  const userId = await getUserId()

  // Verify ownership
  const notif = await db
    .select()
    .from(notification)
    .where(
      and(
        eq(notification.id, notificationId),
        eq(notification.userId, userId)
      )
    )
    .limit(1)

  if (notif.length === 0) {
    throw new Error('Notification not found')
  }

  await db
    .update(notification)
    .set({ status: 'SENT' })
    .where(eq(notification.id, notificationId))

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Mark all notifications as read/sent
 */
export async function markAllNotificationsAsSent() {
  const userId = await getUserId()

  await db
    .update(notification)
    .set({ status: 'SENT' })
    .where(
      and(
        eq(notification.userId, userId),
        eq(notification.status, 'PENDING')
      )
    )

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  const userId = await getUserId()

  // Verify ownership
  const notif = await db
    .select()
    .from(notification)
    .where(
      and(
        eq(notification.id, notificationId),
        eq(notification.userId, userId)
      )
    )
    .limit(1)

  if (notif.length === 0) {
    throw new Error('Notification not found')
  }

  await db.delete(notification).where(eq(notification.id, notificationId))

  revalidatePath('/dashboard')
  return { success: true }
}
