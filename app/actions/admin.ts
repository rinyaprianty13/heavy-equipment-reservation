'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userRole, reservation, approvalAudit, notification } from '@/lib/db/schema'
import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function checkAdminAccess() {
  const userId = await getUserId()
  const roles = await db
    .select()
    .from(userRole)
    .where(and(eq(userRole.userId, userId), eq(userRole.role, 'ADMIN')))

  if (roles.length === 0) {
    throw new Error('Unauthorized: Admin access required')
  }
}

/**
 * Assign approver to a reservation
 */
export async function assignApprover(reservationId: string, approverId: string) {
  await checkAdminAccess()
  const userId = await getUserId()

  // Verify approver has approver role
  const approverRoles = await db
    .select()
    .from(userRole)
    .where(
      and(
        eq(userRole.userId, approverId),
        eq(userRole.role, 'APPROVER')
      )
    )

  if (approverRoles.length === 0) {
    throw new Error('Selected user is not an approver')
  }

  // Get current reservation
  const currentReservation = await db
    .select()
    .from(reservation)
    .where(eq(reservation.id, reservationId))
    .limit(1)

  if (currentReservation.length === 0) {
    throw new Error('Reservation not found')
  }

  const res = currentReservation[0]

  // Update reservation with new approver
  await db
    .update(reservation)
    .set({ approverId })
    .where(eq(reservation.id, reservationId))

  // Log the assignment
  const auditId = randomUUID()
  await db.insert(approvalAudit).values({
    id: auditId,
    reservationId,
    action: 'REASSIGNED',
    actorId: userId,
    oldStatus: res.status,
    newStatus: res.status,
    comments: `Assigned to new approver`,
  })

  revalidatePath('/admin/approvals')
  return { success: true }
}

/**
 * Reassign reservation to different equipment
 */
export async function reassignEquipment(
  reservationId: string,
  newEquipmentId: string,
  notes?: string
) {
  await checkAdminAccess()
  const userId = await getUserId()

  const currentReservation = await db
    .select()
    .from(reservation)
    .where(eq(reservation.id, reservationId))
    .limit(1)

  if (currentReservation.length === 0) {
    throw new Error('Reservation not found')
  }

  const res = currentReservation[0]

  // Update equipment
  await db
    .update(reservation)
    .set({ equipmentId: newEquipmentId })
    .where(eq(reservation.id, reservationId))

  // Log the reassignment
  const auditId = randomUUID()
  await db.insert(approvalAudit).values({
    id: auditId,
    reservationId,
    action: 'REASSIGNED',
    actorId: userId,
    oldStatus: res.status,
    newStatus: res.status,
    comments: `Equipment reassigned. ${notes || ''}`,
  })

  // Notify requestor
  const notifId = randomUUID()
  await db.insert(notification).values({
    id: notifId,
    userId: res.requestorId,
    reservationId,
    type: 'REASSIGNED',
    title: 'Reservation Equipment Changed',
    message: `Your reservation has been reassigned to different equipment.${notes ? ` Note: ${notes}` : ''}`,
  })

  revalidatePath('/admin/reservations')
  return { success: true }
}

/**
 * Get all users for role assignment
 */
export async function getAllUsers() {
  await checkAdminAccess()

  const users = await db.query.user.findMany()
  return users
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(userId: string, role: 'REQUESTOR' | 'APPROVER' | 'ADMIN') {
  await checkAdminAccess()

  // Check if role already exists
  const existing = await db
    .select()
    .from(userRole)
    .where(and(eq(userRole.userId, userId), eq(userRole.role, role)))

  if (existing.length > 0) {
    throw new Error('User already has this role')
  }

  const roleId = randomUUID()
  await db.insert(userRole).values({
    id: roleId,
    userId,
    role,
  })

  revalidatePath('/admin/users')
  return { id: roleId }
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(userId: string, role: string) {
  await checkAdminAccess()

  await db
    .delete(userRole)
    .where(and(eq(userRole.userId, userId), eq(userRole.role, role)))

  revalidatePath('/admin/users')
  return { success: true }
}

/**
 * Get all approvers
 */
export async function getAllApprovers() {
  const approvers = await db
    .select()
    .from(userRole)
    .where(eq(userRole.role, 'APPROVER'))

  return approvers
}
