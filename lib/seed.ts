import { db } from './db'
import {
  user,
  equipment,
  userRole,
} from './db/schema'
import { randomUUID } from 'crypto'

export async function seedDatabase() {
  try {
    console.log('Starting database seed...')

    // Create admin user
    const adminId = randomUUID()
    const adminExists = await db
      .select()
      .from(user)
      .where(function (field) {
        return field.email == 'admin@emcl.com'
      })
      .limit(1)

    if (adminExists.length === 0) {
      await db.insert(user).values({
        id: adminId,
        email: 'admin@emcl.com',
        name: 'EMCL Administrator',
        emailVerified: true,
      })
      console.log('✓ Created admin user')
    }

    // Create sample equipment
    const equipmentData = [
      {
        id: randomUUID(),
        code: 'CRN-001',
        name: 'Mobile Crane 50T',
        type: 'CRANE',
        site: 'CEPU Main',
        capacity: 50,
        capacityUnit: 'tons',
        createdBy: adminId,
      },
      {
        id: randomUUID(),
        code: 'CRN-002',
        name: 'Mobile Crane 75T',
        type: 'CRANE',
        site: 'CEPU Main',
        capacity: 75,
        capacityUnit: 'tons',
        createdBy: adminId,
      },
      {
        id: randomUUID(),
        code: 'FRK-001',
        name: 'Counterbalance Forklift 5T',
        type: 'FORKLIFT',
        site: 'CEPU Warehouse',
        capacity: 5,
        capacityUnit: 'tons',
        createdBy: adminId,
      },
      {
        id: randomUUID(),
        code: 'FRK-002',
        name: 'Counterbalance Forklift 3T',
        type: 'FORKLIFT',
        site: 'CEPU Warehouse',
        capacity: 3,
        capacityUnit: 'tons',
        createdBy: adminId,
      },
      {
        id: randomUUID(),
        code: 'MAN-001',
        name: 'Vertical Manlift 12m',
        type: 'MANLIFT',
        site: 'CEPU Main',
        capacity: 300,
        capacityUnit: 'kg',
        createdBy: adminId,
      },
      {
        id: randomUUID(),
        code: 'MAN-002',
        name: 'Vertical Manlift 8m',
        type: 'MANLIFT',
        site: 'CEPU Warehouse',
        capacity: 200,
        capacityUnit: 'kg',
        createdBy: adminId,
      },
    ]

    const existingEquipment = await db
      .select()
      .from(equipment)
      .limit(1)

    if (existingEquipment.length === 0) {
      for (const equip of equipmentData) {
        await db.insert(equipment).values(equip)
      }
      console.log(`✓ Created ${equipmentData.length} equipment items`)
    }

    console.log('Database seed completed successfully!')
  } catch (error) {
    console.error('Seed error:', error)
    throw error
  }
}
