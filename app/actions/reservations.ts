'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  reservation,
  equipment,
  user,
  reservationConflict,
  alternativeEquipment,
  approvalAudit,
  notification,
  userRole,
} from '@/lib/db/schema'
import { headers } from 'next/headers'
import { and, eq, desc, asc, gte, lte, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  checkReservationConflicts,
  findAlternativeEquipment,
  generateRequestNumber,
} from '@/lib/reservation-utils'
import { randomUUID } from 'crypto'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

/**
 * Get user's role permissions
 */
export async function getUserRoles() {
  const userId = await getUserId()
  return db
    .select()
    .from(userRole)
    .where(eq(userRole.userId, userId))
}

/**
 * Create a new reservation request
 */
export async function createReservation(data: {
  equipmentId: string
  startDate: Date
  endDate: Date
  purpose: string
  costCode?: string
  notes?: string
}) {
  const userId = await getUserId()

  // Check for conflicts
  const conflictCheck = await checkReservationConflicts(
    data.equipmentId,
    data.startDate,
    data.endDate
  )

  let status: 'PENDING' | 'APPROVED' = 'PENDING'
  let conflictId: string | null = null

  // Create the reservation
  const reservationId = randomUUID()
  const requestNumber = generateRequestNumber()

  await db.insert(reservation).values({
    id: reservationId,
    requestNumber,
    equipmentId: data.equipmentId,
    requestorId: userId,
    status,
    startDate: data.startDate,
    endDate: data.endDate,
    purpose: data.purpose,
    costCode: data.costCode,
    notes: data.notes,
  })

  // If there are conflicts, create conflict records
  if (conflictCheck.hasConflict) {
    for (const conflictingRes of conflictCheck.conflictingReservations) {
      const conflictId = randomUUID()
      await db.insert(reservationConflict).values({
        id: conflictId,
        reservationId,
        conflictingReservationId: conflictingRes.id,
        overlapType: conflictCheck.overlapType,
      })
    }

    // Find and suggest alternatives
    const equip = await db
      .select()
      .from(equipment)
      .where(eq(equipment.id, data.equipmentId))
      .limit(1)

    if (equip.length > 0) {
      const alternatives = await findAlternativeEquipment(
        data.equipmentId,
        equip[0].type,
        equip[0].site,
        data.startDate,
        data.endDate
      )

      for (const alt of alternatives) {
        const altId = randomUUID()
        await db.insert(alternativeEquipment).values({
          id: altId,
          originalReservationId: reservationId,
          suggestedEquipmentId: alt.equipment.id,
          availableStartDate: alt.availableStartDate,
          availableEndDate: alt.availableEndDate,
        })
      }
    }
  }

  // Create audit log
  const auditId = randomUUID()
  await db.insert(approvalAudit).values({
    id: auditId,
    reservationId,
    action: 'SUBMITTED',
    actorId: userId,
    newStatus: status,
  })

  // Create notification for requestor
  const notifId = randomUUID()
  await db.insert(notification).values({
    id: notifId,
    userId,
    reservationId,
    type: 'APPROVAL_PENDING',
    title: 'Reservation Request Submitted',
    message: `Your reservation request ${requestNumber} has been submitted for approval.`,
  })

  revalidatePath('/dashboard')

  return {
    id: reservationId,
    requestNumber,
    hasConflict: conflictCheck.hasConflict,
    alternatives: conflictCheck.hasConflict
      ? await db.select().from(alternativeEquipment).where(eq(alternativeEquipment.originalReservationId, reservationId))
      : [],
  }
}

/**
 * Get all reservations for current user
 */
export async function getUserReservations() {
  const userId = await getUserId()

  return db
    .select({
      id: reservation.id,
      requestNumber: reservation.requestNumber,
      equipmentId: reservation.equipmentId,
      equipmentName: equipment.name,
      equipmentType: equipment.type,
      status: reservation.status,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      purpose: reservation.purpose,
      costCode: reservation.costCode,
      createdAt: reservation.createdAt,
    })
    .from(reservation)
    .innerJoin(equipment, eq(reservation.equipmentId, equipment.id))
    .where(eq(reservation.requestorId, userId))
    .orderBy(desc(reservation.createdAt))
}

/**
 * Get pending reservations for approvers
 */
export async function getPendingApprovals() {
  const userId = await getUserId()

  // Check if user is an approver
  const roles = await getUserRoles()
  const isApprover = roles.some((r) => r.role === 'APPROVER')

  if (!isApprover) {
    throw new Error('User is not an approver')
  }

  return db
    .select({
      id: reservation.id,
      requestNumber: reservation.requestNumber,
      equipmentId: reservation.equipmentId,
      equipmentName: equipment.name,
      equipmentType: equipment.type,
      requestorName: user.name,
      requestorEmail: user.email,
      status: reservation.status,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      purpose: reservation.purpose,
      costCode: reservation.costCode,
      createdAt: reservation.createdAt,
    })
    .from(reservation)
    .innerJoin(equipment, eq(reservation.equipmentId, equipment.id))
    .innerJoin(user, eq(reservation.requestorId, user.id))
    .where(eq(reservation.status, 'PENDING'))
    .orderBy(asc(reservation.createdAt))
}

/**
 * Approve a reservation
 */
export async function approveReservation(
  reservationId: string,
  approvalNotes?: string
) {
  const userId = await getUserId()

  // Verify user is an approver
  const roles = await getUserRoles()
  const isApprover = roles.some((r) => r.role === 'APPROVER')
  if (!isApprover) {
    throw new Error('User is not an approver')
  }

  const existingReservation = await db
    .select()
    .from(reservation)
    .where(eq(reservation.id, reservationId))
    .limit(1)

  if (existingReservation.length === 0) {
    throw new Error('Reservation not found')
  }

  const res = existingReservation[0]

  // Update reservation
  await db
    .update(reservation)
    .set({
      status: 'APPROVED',
      approverId: userId,
      approvalDate: new Date(),
      approvalNotes,
    })
    .where(eq(reservation.id, reservationId))

  // Create audit log
  const auditId = randomUUID()
  await db.insert(approvalAudit).values({
    id: auditId,
    reservationId,
    action: 'APPROVED',
    actorId: userId,
    oldStatus: res.status,
    newStatus: 'APPROVED',
    comments: approvalNotes,
  })

  // Notify requestor
  const notifId = randomUUID()
  await db.insert(notification).values({
    id: notifId,
    userId: res.requestorId,
    reservationId,
    type: 'APPROVED',
    title: 'Reservation Approved',
    message: `Your reservation request ${res.requestNumber} has been approved.`,
  })

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Reject a reservation
 */
export async function rejectReservation(
  reservationId: string,
  rejectionReason: string
) {
  const userId = await getUserId()

  // Verify user is an approver
  const roles = await getUserRoles()
  const isApprover = roles.some((r) => r.role === 'APPROVER')
  if (!isApprover) {
    throw new Error('User is not an approver')
  }

  const existingReservation = await db
    .select()
    .from(reservation)
    .where(eq(reservation.id, reservationId))
    .limit(1)

  if (existingReservation.length === 0) {
    throw new Error('Reservation not found')
  }

  const res = existingReservation[0]

  // Update reservation
  await db
    .update(reservation)
    .set({
      status: 'REJECTED',
      approverId: userId,
      approvalDate: new Date(),
      approvalNotes: rejectionReason,
    })
    .where(eq(reservation.id, reservationId))

  // Create audit log
  const auditId = randomUUID()
  await db.insert(approvalAudit).values({
    id: auditId,
    reservationId,
    action: 'REJECTED',
    actorId: userId,
    oldStatus: res.status,
    newStatus: 'REJECTED',
    comments: rejectionReason,
  })

  // Notify requestor
  const notifId = randomUUID()
  await db.insert(notification).values({
    id: notifId,
    userId: res.requestorId,
    reservationId,
    type: 'REJECTED',
    title: 'Reservation Rejected',
    message: `Your reservation request ${res.requestNumber} has been rejected. Reason: ${rejectionReason}`,
  })

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Get all equipment
 */
export async function getAllEquipment() {
  return db
    .select({
      id: equipment.id,
      code: equipment.code,
      name: equipment.name,
      type: equipment.type,
      description: equipment.description,
      site: equipment.site,
      status: equipment.status,
      capacity: equipment.capacity,
      capacityUnit: equipment.capacityUnit,
    })
    .from(equipment)
    .where(eq(equipment.status, 'AVAILABLE'))
    .orderBy(asc(equipment.name))
}
