import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { userRole } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { AppShell } from '@/components/app-shell'
import { EmSectionHeader } from '@/components/em-section-header'
import EquipmentManagement from '@/components/admin/equipment-management'

export default async function AdminEquipmentPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const roles = await db
    .select()
    .from(userRole)
    .where(and(eq(userRole.userId, session.user.id), eq(userRole.role, 'ADMIN')))

  if (roles.length === 0) {
    redirect('/dashboard')
  }

  return (
    <AppShell userEmail={session.user.email} showAdmin>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <EmSectionHeader
          label="Administration"
          title="Equipment Management"
          description="Manage heavy equipment inventory, availability, and site assignments."
          className="mb-10"
        />
        <EquipmentManagement />
      </div>
    </AppShell>
  )
}
