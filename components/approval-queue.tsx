'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { getPendingApprovals, approveReservation, rejectReservation } from '@/app/actions/reservations'
import { format } from 'date-fns'
import { CheckCircle, XCircle } from 'lucide-react'

interface PendingApproval {
  id: string
  requestNumber: string
  equipmentName: string
  requestorName: string
  requestorEmail: string
  startDate: Date
  endDate: Date
  purpose: string
  costCode?: string
  createdAt: Date
}

export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadApprovals() {
      try {
        const data = await getPendingApprovals()
        setApprovals(data as PendingApproval[])
      } catch (err) {
        setError('Failed to load pending approvals')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadApprovals()
  }, [])

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      await approveReservation(id, notes[id])
      setApprovals((prev) => prev.filter((a) => a.id !== id))
      setNotes((prev) => {
        const newNotes = { ...prev }
        delete newNotes[id]
        return newNotes
      })
      setExpandedId(null)
    } catch (err) {
      setError('Failed to approve reservation')
      console.error(err)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!notes[id]) {
      setError('Please provide a rejection reason')
      return
    }

    setProcessingId(id)
    try {
      await rejectReservation(id, notes[id])
      setApprovals((prev) => prev.filter((a) => a.id !== id))
      setNotes((prev) => {
        const newNotes = { ...prev }
        delete newNotes[id]
        return newNotes
      })
      setExpandedId(null)
    } catch (err) {
      setError('Failed to reject reservation')
      console.error(err)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading pending approvals...</div>
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

  if (approvals.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            No pending approvals. All reservation requests are up to date.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => (
        <Card key={approval.id} className="cursor-pointer hover:shadow-md transition">
          <CardHeader
            onClick={() =>
              setExpandedId(expandedId === approval.id ? null : approval.id)
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-lg font-mono">
                    {approval.requestNumber}
                  </CardTitle>
                  <Badge variant="outline">PENDING</Badge>
                </div>
                <CardDescription>
                  <div className="space-y-1">
                    <p className="text-foreground">
                      <strong>{approval.equipmentName}</strong> requested by{' '}
                      <strong>{approval.requestorName}</strong>
                    </p>
                    <p>
                      {format(new Date(approval.startDate), 'MMM dd, yyyy HH:mm')} to{' '}
                      {format(new Date(approval.endDate), 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p>Purpose: {approval.purpose}</p>
                    {approval.costCode && (
                      <p>Cost Code: <span className="font-mono">{approval.costCode}</span></p>
                    )}
                  </div>
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(approval.createdAt), 'MMM dd, HH:mm')}
              </div>
            </div>
          </CardHeader>

          {expandedId === approval.id && (
            <CardContent className="space-y-4 border-t pt-4">
              <div>
                <Label htmlFor={`notes-${approval.id}`}>
                  {notes[approval.id] ? 'Notes / Reason' : 'Add Notes (required for rejection)'}
                </Label>
                <Textarea
                  id={`notes-${approval.id}`}
                  placeholder="Approval notes or rejection reason..."
                  value={notes[approval.id] || ''}
                  onChange={(e) =>
                    setNotes((prev) => ({
                      ...prev,
                      [approval.id]: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleApprove(approval.id)}
                  disabled={processingId === approval.id}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processingId === approval.id ? 'Processing...' : 'Approve'}
                </Button>
                <Button
                  onClick={() => handleReject(approval.id)}
                  disabled={processingId === approval.id || !notes[approval.id]}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {processingId === approval.id ? 'Processing...' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
