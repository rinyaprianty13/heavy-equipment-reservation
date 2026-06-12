import { db } from './db'
import {
  user,
  equipment,
  userRole,
} from './db/schema'
import { randomUUID } from 'crypto'
import { sql } from 'drizzle-orm'

export async function seedDatabase() {
  try {
    console.log('Starting database seed...')

    // Create admin user
    let adminId: string
    const adminExists = await db
      .select()
      .from(user)
      .where(function (field) {
        return field.email == 'admin@emcl.com'
      })
      .limit(1)

    if (adminExists.length === 0) {
      adminId = randomUUID()
      await db.insert(user).values({
        id: adminId,
        email: 'admin@emcl.com',
        name: 'EMCL Administrator',
        emailVerified: true,
      })
      console.log('✓ Created admin user')
    } else {
      adminId = adminExists[0].id
    }

    // Create sample equipment using raw SQL for better control of camelCase fields
    const equipmentData = [
      { code: 'CRN-001', name: 'Mobile Crane 50T', type: 'CRANE', description: 'Heavy-duty mobile crane with 50-ton capacity', site: 'CEPU Main', capacity: 50, capacityUnit: 'tons' },
      { code: 'CRN-002', name: 'Mobile Crane 75T', type: 'CRANE', description: 'Heavy-duty mobile crane with 75-ton capacity', site: 'CEPU Main', capacity: 75, capacityUnit: 'tons' },
      { code: 'FRK-001', name: 'Counterbalance Forklift 5T', type: 'FORKLIFT', description: 'Counterbalance forklift for warehouse operations', site: 'CEPU Warehouse', capacity: 5, capacityUnit: 'tons' },
      { code: 'FRK-002', name: 'Counterbalance Forklift 3T', type: 'FORKLIFT', description: 'Compact counterbalance forklift', site: 'CEPU Warehouse', capacity: 3, capacityUnit: 'tons' },
      { code: 'MAN-001', name: 'Vertical Manlift 12m', type: 'MANLIFT', description: 'Vertical manlift for elevated work operations', site: 'CEPU Main', capacity: 300, capacityUnit: 'kg' },
      { code: 'MAN-002', name: 'Vertical Manlift 8m', type: 'MANLIFT', description: 'Compact vertical manlift for elevated work', site: 'CEPU Warehouse', capacity: 200, capacityUnit: 'kg' },
    ]

    const existingEquipment = await db
      .select()
      .from(equipment)
      .limit(1)

    if (existingEquipment.length === 0) {
      // Use raw SQL with proper quoting for camelCase columns
      for (const equip of equipmentData) {
        await db.execute(sql`
          INSERT INTO equipment (id, code, name, type, description, site, status, capacity, "capacityUnit", "createdAt", "updatedAt", "createdBy")
          VALUES (${randomUUID()}, ${equip.code}, ${equip.name}, ${equip.type}, ${equip.description}, ${equip.site}, 'AVAILABLE', ${equip.capacity}, ${equip.capacityUnit}, NOW(), NOW(), ${adminId})
        `)
      }
      console.log(`✓ Created ${equipmentData.length} equipment items`)
    }

    console.log('Database seed completed successfully!')
  } catch (error) {
    console.error('Seed error:', error)
    throw error
  }
}
