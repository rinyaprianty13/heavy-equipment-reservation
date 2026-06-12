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
import { and, eq, desc, asc, gte, lte, or, sql } from 'drizzle-orm'
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

    // Alert all approvers that this request collides with existing bookings
    const approvers = await db
      .select({ userId: userRole.userId })
      .from(userRole)
      .where(or(eq(userRole.role, 'APPROVER'), eq(userRole.role, 'ADMIN')))

    const uniqueApproverIds = [...new Set(approvers.map((a) => a.userId))]
    for (const approverId of uniqueApproverIds) {
      await db.insert(notification).values({
        id: randomUUID(),
        userId: approverId,
        reservationId,
        type: 'CONFLICT_DETECTED',
        title: 'Booking Conflict Needs Review',
        message: `Request ${requestNumber} conflicts with ${conflictCheck.conflictingReservations.length} existing reservation(s) for the same equipment and overlapping time. Please review before approving.`,
      })
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

  // Build an enriched list of alternative equipment (with real names/codes)
  // and a summary of the conflicting bookings so the requestor sees exactly
  // what overlapped and what they can use instead.
  let enrichedAlternatives: Array<{
    id: string
    equipmentName: string
    equipmentCode: string
    site: string
    availableStartDate: Date
    availableEndDate: Date
  }> = []

  let conflictingBookings: Array<{
    requestNumber: string
    startDate: Date
    endDate: Date
  }> = []

  if (conflictCheck.hasConflict) {
    enrichedAlternatives = await db
      .select({
        id: alternativeEquipment.id,
        equipmentName: equipment.name,
        equipmentCode: equipment.code,
        site: equipment.site,
        availableStartDate: alternativeEquipment.availableStartDate,
        availableEndDate: alternativeEquipment.availableEndDate,
      })
      .from(alternativeEquipment)
      .innerJoin(
        equipment,
        eq(alternativeEquipment.suggestedEquipmentId, equipment.id)
      )
      .where(eq(alternativeEquipment.originalReservationId, reservationId))

    conflictingBookings = conflictCheck.conflictingReservations.map((r) => ({
      requestNumber: r.requestNumber,
      startDate: r.startDate,
      endDate: r.endDate,
    }))
  }

  return {
    id: reservationId,
    requestNumber,
    hasConflict: conflictCheck.hasConflict,
    overlapType: conflictCheck.overlapType,
    conflictCount: conflictCheck.conflictingReservations.length,
    conflictingBookings,
    alternatives: enrichedAlternatives,
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
 * Get pending reservations for approvers, with live-computed overlap conflicts.
 * Conflicts are computed directly from the pending list (not from the
 * reservation_conflict table, which can have stale/deleted rows).
 */
export async function getPendingApprovals() {
  // Check if user is an approver / admin
  const roles = await getUserRoles()
  const isApprover = roles.some((r) => r.role === 'APPROVER' || r.role === 'ADMIN')
  if (!isApprover) throw new Error('User is not an approver')

  // Fetch all pending reservations with enriched info using raw SQL
  // so camelCase column names are properly quoted.
  const result = await db.execute(sql`
    SELECT
      r.id,
      r."requestNumber",
      r."equipmentId",
      e.name   AS "equipmentName",
      e.type   AS "equipmentType",
      u.name   AS "requestorName",
      u.email  AS "requestorEmail",
      r.status,
      r."startDate",
      r."endDate",
      r.purpose,
      r."costCode",
      r."createdAt"
    FROM reservation r
    JOIN equipment e ON e.id = r."equipmentId"
    JOIN "user"    u ON u.id = r."requestorId"
    WHERE r.status = 'PENDING'
    ORDER BY r."createdAt" ASC
  `)

  type PendingRow = {
    id: string
    requestNumber: string
    equipmentId: string
    equipmentName: string
    equipmentType: string
    requestorName: string | null
    requestorEmail: string | null
    status: string
    startDate: Date
    endDate: Date
    purpose: string
    costCode: string | null
    createdAt: Date
  }

  const pending = result.rows as PendingRow[]

  // Compute conflicts live: for each pending request find all OTHER pending
  // requests for the same equipment whose date window overlaps.
  function datesOverlapLocal(
    aStart: Date, aEnd: Date,
    bStart: Date, bEnd: Date
  ): boolean {
    return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart)
  }

  function getOverlapTypeLocal(
    aStart: Date, aEnd: Date,
    bStart: Date, bEnd: Date
  ): 'FULL_OVERLAP' | 'PARTIAL_OVERLAP' | 'ADJACENT' {
    const as = new Date(aStart).getTime()
    const ae = new Date(aEnd).getTime()
    const bs = new Date(bStart).getTime()
    const be = new Date(bEnd).getTime()
    // Check adjacency first (within 1 minute)
    if (Math.abs(ae - bs) < 60_000 || Math.abs(be - as) < 60_000) return 'ADJACENT'
    // Full overlap: one window completely contains the other
    if ((as <= bs && ae >= be) || (bs <= as && be >= ae)) return 'FULL_OVERLAP'
    return 'PARTIAL_OVERLAP'
  }

  const withConflicts = pending.map((p) => {
    const conflicts = pending
      .filter((other) => {
        if (other.id === p.id) return false
        if (other.equipmentId !== p.equipmentId) return false
        return datesOverlapLocal(p.startDate, p.endDate, other.startDate, other.endDate)
      })
      .map((other) => ({
        conflictId: `live-${p.id}-${other.id}`,
        overlapType: getOverlapTypeLocal(p.startDate, p.endDate, other.startDate, other.endDate),
        reservationId: other.id,
        requestNumber: other.requestNumber,
        status: other.status,
        startDate: other.startDate,
        endDate: other.endDate,
        requestorName: other.requestorName,
        requestorEmail: other.requestorEmail,
      }))

    return { ...p, conflicts }
  })

  return withConflicts
}

/**
 * Get the list of conflicting reservations for a given reservation.
 * Uses raw SQL with quoted camelCase identifiers to avoid PostgreSQL
 * lowercasing the column names at query time.
 */
export async function getReservationConflicts(reservationId: string) {
  const rows = await db.execute(sql`
    SELECT
      rc.id                          AS "conflictId",
      rc."overlapType",
      rc."detectedAt",
      cr.id                          AS "reservationId",
      cr."requestNumber",
      cr.status,
      cr."startDate",
      cr."endDate",
      u.name                         AS "requestorName",
      u.email                        AS "requestorEmail"
    FROM reservation_conflict rc
    JOIN reservation cr ON cr.id = rc."conflictingReservationId"
    JOIN "user" u        ON u.id  = cr."requestorId"
    WHERE rc."reservationId" = ${reservationId}
    ORDER BY cr."startDate" ASC
  `)

  return rows.rows as Array<{
    conflictId: string
    overlapType: 'FULL_OVERLAP' | 'PARTIAL_OVERLAP' | 'ADJACENT'
    detectedAt: Date
    reservationId: string
    requestNumber: string
    status: string
    startDate: Date
    endDate: Date
    requestorName: string | null
    requestorEmail: string | null
  }>
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
  const isApprover = roles.some((r) => r.role === 'APPROVER' || r.role === 'ADMIN')
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
  const isApprover = roles.some((r) => r.role === 'APPROVER' || r.role === 'ADMIN')
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
