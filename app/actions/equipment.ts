'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { equipment, userRole } from '@/lib/db/schema'
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
 * Create new equipment
 */
export async function createEquipment(data: {
  code: string
  name: string
  type: 'CRANE' | 'FORKLIFT' | 'MANLIFT' | 'OTHER'
  description?: string
  site: string
  capacity?: number
  capacityUnit?: string
  nextMaintenanceDate?: Date
}) {
  await checkAdminAccess()
  const userId = await getUserId()

  const id = randomUUID()
  await db.insert(equipment).values({
    id,
    code: data.code,
    name: data.name,
    type: data.type,
    description: data.description,
    site: data.site,
    status: 'AVAILABLE',
    capacity: data.capacity,
    capacityUnit: data.capacityUnit,
    nextMaintenanceDate: data.nextMaintenanceDate,
    createdBy: userId,
  })

  revalidatePath('/admin/equipment')
  return { id, code: data.code }
}

/**
 * Update equipment
 */
export async function updateEquipment(
  id: string,
  data: {
    name?: string
    description?: string
    site?: string
    status?: 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED'
    capacity?: number
    capacityUnit?: string
    lastMaintenanceDate?: Date
    nextMaintenanceDate?: Date
  }
) {
  await checkAdminAccess()

  await db
    .update(equipment)
    .set(data)
    .where(eq(equipment.id, id))

  revalidatePath('/admin/equipment')
  return { success: true }
}

/**
 * Delete equipment
 */
export async function deleteEquipment(id: string) {
  await checkAdminAccess()

  await db.delete(equipment).where(eq(equipment.id, id))

  revalidatePath('/admin/equipment')
  return { success: true }
}

/**
 * Get all equipment with filters
 */
export async function getAllEquipmentWithStatus(filters?: {
  type?: string
  site?: string
  status?: string
}) {
  let query = db.select().from(equipment)

  if (filters?.type) {
    query = query.where(eq(equipment.type, filters.type))
  }
  if (filters?.site) {
    query = query.where(eq(equipment.site, filters.site))
  }
  if (filters?.status) {
    query = query.where(eq(equipment.status, filters.status))
  }

  return query
}

/**
 * Get equipment by ID
 */
export async function getEquipmentById(id: string) {
  const result = await db
    .select()
    .from(equipment)
    .where(eq(equipment.id, id))
    .limit(1)

  return result.length > 0 ? result[0] : null
}
