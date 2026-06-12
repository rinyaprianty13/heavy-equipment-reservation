import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { userRole } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { AppShell } from '@/components/app-shell'
import { EmSectionHeader } from '@/components/em-section-header'
import DashboardClient from '@/components/dashboard-client'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const adminRoles = await db
    .select()
    .from(userRole)
    .where(
      and(eq(userRole.userId, session.user.id), eq(userRole.role, 'ADMIN'))
    )

  return (
    <AppShell
      userEmail={session.user.email}
      showAdmin={adminRoles.length > 0}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <EmSectionHeader
          label="Dashboard"
          title="Equipment Reservations"
          description={`Welcome, ${session.user.name || session.user.email}. Submit requests, track approvals, and view equipment availability.`}
          className="mb-10"
        />
        <DashboardClient />
      </div>
    </AppShell>
  )
}
