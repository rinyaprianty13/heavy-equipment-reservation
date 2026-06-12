import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl || databaseUrl.includes('@host/')) {
    console.error(
      'ERROR: Set a real DATABASE_URL in .env.local before running setup.\n' +
        'Get one from https://neon.tech (free) or use local PostgreSQL.'
    )
    process.exit(1)
  }

  const sql = readFileSync(
    join(__dirname, '../lib/db/migrations/001_initial_schema.sql'),
    'utf8'
  )

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  })

  await client.connect()
  try {
    await client.query(sql)
    console.log('Database schema created successfully (13 tables).')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Database setup failed:', err.message)
  process.exit(1)
})
