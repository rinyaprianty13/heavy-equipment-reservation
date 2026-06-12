import { eq, and, or, lt, gt, lte, gte } from 'drizzle-orm'
import { db } from './db'
import { reservation, reservationConflict, alternativeEquipment, equipment } from './db/schema'

export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface ConflictResult {
  hasConflict: boolean
  conflictingReservations: typeof reservation.$inferSelect[]
  overlapType: 'FULL_OVERLAP' | 'PARTIAL_OVERLAP' | 'ADJACENT'
}

/**
 * Check if two date ranges overlap
 */
export function datesOverlap(range1: DateRange, range2: DateRange): boolean {
  return range1.startDate < range2.endDate && range1.endDate > range2.startDate
}

/**
 * Calculate overlap type between two date ranges
 */
export function getOverlapType(
  range1: DateRange,
  range2: DateRange
): 'FULL_OVERLAP' | 'PARTIAL_OVERLAP' | 'ADJACENT' {
  // Check if completely overlapping
  if (
    range1.startDate <= range2.startDate &&
    range1.endDate >= range2.endDate
  ) {
    return 'FULL_OVERLAP'
  }

  // Check if adjacent (end of one is start of other)
  const timeDiff = Math.abs(
    range1.endDate.getTime() - range2.startDate.getTime()
  )
  if (timeDiff < 1000 * 60) {
    // Within 1 minute
    return 'ADJACENT'
  }

  // Otherwise partial overlap
  return 'PARTIAL_OVERLAP'
}

/**
 * Check for booking conflicts with existing approved/pending reservations
 */
export async function checkReservationConflicts(
  equipmentId: string,
  startDate: Date,
  endDate: Date,
  excludeReservationId?: string
): Promise<ConflictResult> {
  // Find all active reservations for this equipment
  const conflictingReservations = await db
    .select()
    .from(reservation)
    .where(
      and(
        eq(reservation.equipmentId, equipmentId),
        or(eq(reservation.status, 'PENDING'), eq(reservation.status, 'APPROVED')),
        excludeReservationId
          ? or(
              and(
                gt(reservation.endDate, new Date(startDate.getTime() - 1000 * 60 * 60)),
                lt(reservation.startDate, new Date(endDate.getTime() + 1000 * 60 * 60))
              ),
              eq(reservation.id, excludeReservationId)
            )
          : and(
              gt(reservation.endDate, new Date(startDate.getTime() - 1000 * 60 * 60)),
              lt(reservation.startDate, new Date(endDate.getTime() + 1000 * 60 * 60))
            )
      )
    )

  const actualConflicts = conflictingReservations.filter(
    (res) =>
      datesOverlap(
        { startDate: res.startDate, endDate: res.endDate },
        { startDate, endDate }
      ) && res.id !== excludeReservationId
  )

  if (actualConflicts.length === 0) {
    return {
      hasConflict: false,
      conflictingReservations: [],
      overlapType: 'FULL_OVERLAP',
    }
  }

  const overlapType = getOverlapType(
    { startDate: actualConflicts[0].startDate, endDate: actualConflicts[0].endDate },
    { startDate, endDate }
  )

  return {
    hasConflict: true,
    conflictingReservations: actualConflicts,
    overlapType,
  }
}

/**
 * Find alternative equipment for a failed request
 */
export async function findAlternativeEquipment(
  excludeEquipmentId: string,
  equipmentType: string,
  site: string,
  startDate: Date,
  endDate: Date,
  limit: number = 5
): Promise<any[]> {
  const availableEquipment = await db
    .select()
    .from(equipment)
    .where(
      and(
        eq(equipment.type, equipmentType),
        eq(equipment.site, site),
        eq(equipment.status, 'AVAILABLE')
      )
    )

  const alternatives = []

  for (const equip of availableEquipment) {
    if (equip.id === excludeEquipmentId) continue

    const conflict = await checkReservationConflicts(
      equip.id,
      startDate,
      endDate
    )

    if (!conflict.hasConflict) {
      alternatives.push({
        equipment: equip,
        availableStartDate: startDate,
        availableEndDate: endDate,
      })

      if (alternatives.length >= limit) break
    }
  }

  return alternatives
}

/**
 * Generate request number
 */
export function generateRequestNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `REQ-${timestamp}-${random}`
}

/**
 * Calculate duration in hours
 */
export function calculateDurationHours(startDate: Date, endDate: Date): number {
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
}
