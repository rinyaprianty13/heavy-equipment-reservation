'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ReservationForm from './reservation-form'
import ReservationList from './reservation-list'
import ApprovalQueue from './approval-queue'
import EquipmentCalendar from './equipment-calendar'
import { getUserRoles } from '@/app/actions/reservations'

export default function DashboardClient() {
  const [userRoles, setUserRoles] = useState<any[]>([])
  const [isApprover, setIsApprover] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRoles() {
      try {
        const roles = await getUserRoles()
        setUserRoles(roles)
        setIsApprover(roles.some((r) => r.role === 'APPROVER' || r.role === 'ADMIN'))
      } catch (error) {
        console.error('Error loading user roles:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRoles()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-card py-16">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="requests" className="w-full">
      <TabsList
        className="grid h-auto w-full gap-1 rounded-lg border border-border bg-card p-1"
        style={{
          gridTemplateColumns: `repeat(${isApprover ? 4 : 3}, minmax(0, 1fr))`,
        }}
      >
        <TabsTrigger
          value="new"
          className="data-active:bg-primary data-active:text-primary-foreground"
        >
          New Request
        </TabsTrigger>
        <TabsTrigger
          value="requests"
          className="data-active:bg-primary data-active:text-primary-foreground"
        >
          My Requests
        </TabsTrigger>
        <TabsTrigger
          value="calendar"
          className="data-active:bg-primary data-active:text-primary-foreground"
        >
          Calendar
        </TabsTrigger>
        {isApprover && (
          <TabsTrigger
            value="approvals"
            className="data-active:bg-primary data-active:text-primary-foreground"
          >
            Approvals
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="new" className="mt-6 space-y-6">
        <div className="rounded-lg border border-border bg-card/50 p-6">
          <h2 className="mb-2 text-xl font-semibold">New Equipment Request</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Submit a reservation request. The system will detect conflicts and
            suggest alternatives automatically.
          </p>
          <ReservationForm />
        </div>
      </TabsContent>

      <TabsContent value="requests" className="mt-6 space-y-6">
        <div className="rounded-lg border border-border bg-card/50 p-6">
          <h2 className="mb-2 text-xl font-semibold">My Reservations</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            View and track your equipment reservation requests
          </p>
          <ReservationList />
        </div>
      </TabsContent>

      <TabsContent value="calendar" className="mt-6 space-y-6">
        <div className="rounded-lg border border-border bg-card/50 p-6">
          <h2 className="mb-2 text-xl font-semibold">Equipment Calendar</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            View equipment availability across all sites
          </p>
          <EquipmentCalendar />
        </div>
      </TabsContent>

      {isApprover && (
        <TabsContent value="approvals" className="mt-6 space-y-6">
          <div className="rounded-lg border border-border bg-card/50 p-6">
            <h2 className="mb-2 text-xl font-semibold">Pending Approvals</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Review and approve equipment reservation requests
            </p>
            <ApprovalQueue />
          </div>
        </TabsContent>
      )}
    </Tabs>
  )
}
