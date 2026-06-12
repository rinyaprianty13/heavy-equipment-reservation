'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserReservations } from '@/app/actions/reservations'
import { format } from 'date-fns'

interface Reservation {
  id: string
  requestNumber: string
  equipmentName: string
  status: string
  startDate: Date
  endDate: Date
  purpose: string
  createdAt: Date
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  NO_SHOW: 'bg-red-100 text-red-800',
}

export default function ReservationList() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReservations() {
      try {
        const data = await getUserReservations()
        setReservations(data as Reservation[])
      } catch (err) {
        setError('Failed to load reservations')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadReservations()
  }, [])

  if (loading) {
    return <div className="text-muted-foreground">Loading reservations...</div>
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            No reservations yet. Create your first reservation to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Reservations</CardTitle>
        <CardDescription>
          Total: {reservations.length} request(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((res) => (
                <TableRow key={res.id}>
                  <TableCell className="font-mono text-sm">{res.requestNumber}</TableCell>
                  <TableCell>{res.equipmentName}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[res.status]}>
                      {res.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(res.startDate), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell>{format(new Date(res.endDate), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell className="max-w-xs truncate">{res.purpose}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(res.createdAt), 'MMM dd')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
