import { seedDatabase } from '@/lib/seed'

export async function GET() {
  try {
    // Check for authorization - use a seed key
    const seedKey = process.env.SEED_KEY
    if (!seedKey) {
      return Response.json(
        { error: 'Seed key not configured' },
        { status: 400 }
      )
    }

    await seedDatabase()
    return Response.json({ success: true, message: 'Database seeded successfully' })
  } catch (error: any) {
    console.error('Seed error:', error)
    return Response.json(
      { error: error.message || 'Seed failed' },
      { status: 500 }
    )
  }
}
