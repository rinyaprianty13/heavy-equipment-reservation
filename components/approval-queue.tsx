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
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface ConflictDetail {
  conflictId: string
  overlapType: 'FULL_OVERLAP' | 'PARTIAL_OVERLAP' | 'ADJACENT'
  detectedAt: Date
  reservationId: string
  requestNumber: string
  status: string
  startDate: Date
  endDate: Date
  requestorName: string | null
  requestorEmail: string | null
}

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
  conflicts: ConflictDetail[]
}

const overlapLabel: Record<string, string> = {
  FULL_OVERLAP: 'Full overlap',
  PARTIAL_OVERLAP: 'Partial overlap',
  ADJACENT: 'Back-to-back',
}

// Severity ranking + colors so approvers can instantly categorize conflicts.
// FULL_OVERLAP = critical (red), PARTIAL_OVERLAP = warning (amber),
// ADJACENT = minor (blue).
type Severity = 'critical' | 'warning' | 'minor' | 'none'

const overlapSeverity: Record<string, Severity> = {
  FULL_OVERLAP: 'critical',
  PARTIAL_OVERLAP: 'warning',
  ADJACENT: 'minor',
}

const severityRank: Record<Severity, number> = {
  critical: 3,
  warning: 2,
  minor: 1,
  none: 0,
}

const severityStyles: Record<
  Severity,
  { card: string; badge: string; chip: string; label: string }
> = {
  critical: {
    card: 'border-red-300 bg-red-50/60',
    badge: 'bg-red-600 hover:bg-red-600 text-white',
    chip: 'border-red-400 text-red-700',
    label: 'Direct conflict',
  },
  warning: {
    card: 'border-amber-300 bg-amber-50/60',
    badge: 'bg-amber-500 hover:bg-amber-500 text-white',
    chip: 'border-amber-400 text-amber-700',
    label: 'Partial conflict',
  },
  minor: {
    card: 'border-blue-300 bg-blue-50/60',
    badge: 'bg-blue-500 hover:bg-blue-500 text-white',
    chip: 'border-blue-400 text-blue-700',
    label: 'Back-to-back',
  },
  none: {
    card: '',
    badge: '',
    chip: '',
    label: '',
  },
}

function getTopSeverity(conflicts: ConflictDetail[]): Severity {
  let top: Severity = 'none'
  for (const c of conflicts) {
    const s = overlapSeverity[c.overlapType] ?? 'warning'
    if (severityRank[s] > severityRank[top]) top = s
  }
  return top
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
      {approvals.some((a) => a.conflicts && a.conflicts.length > 0) && (
        <Card className="bg-muted/40">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="font-medium text-foreground">Conflict legend:</span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
                Direct conflict (full overlap)
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                Partial conflict
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
                Back-to-back
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {approvals.map((approval) => {
        const hasConflict = approval.conflicts && approval.conflicts.length > 0
        const severity = hasConflict ? getTopSeverity(approval.conflicts) : 'none'
        const styles = severityStyles[severity]
        return (
        <Card
          key={approval.id}
          className={`cursor-pointer hover:shadow-md transition ${styles.card}`}
        >
          <CardHeader
            onClick={() =>
              setExpandedId(expandedId === approval.id ? null : approval.id)
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <CardTitle className="text-lg font-mono">
                    {approval.requestNumber}
                  </CardTitle>
                  <Badge variant="outline">PENDING</Badge>
                  {hasConflict && (
                    <Badge className={`gap-1 ${styles.badge}`}>
                      <AlertTriangle className="h-3 w-3" />
                      {styles.label}
                      {approval.conflicts.length > 1
                        ? ` · ${approval.conflicts.length} overlaps`
                        : ''}
                    </Badge>
                  )}
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
              {hasConflict && (
                <div className={`rounded-md border p-4 ${styles.card}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-foreground" />
                    <p className="font-semibold text-foreground">
                      {approval.conflicts.length} competing reservation
                      {approval.conflicts.length > 1 ? 's' : ''} for this equipment
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    This equipment is requested for an overlapping time by other
                    requestors. Only one booking can use it — review the overlaps
                    below and approve the request that should get the equipment,
                    then reject the others.
                  </p>
                  <div className="space-y-2">
                    {approval.conflicts.map((c) => {
                      const cSeverity =
                        overlapSeverity[c.overlapType] ?? 'warning'
                      const cStyles = severityStyles[cSeverity]
                      return (
                      <div
                        key={c.conflictId}
                        className="rounded bg-background border p-2 text-sm"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-medium text-foreground">
                            {c.requestNumber}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {c.status}
                          </Badge>
                          <Badge
                            className={`text-xs text-white ${cStyles.badge}`}
                          >
                            {overlapLabel[c.overlapType] ?? c.overlapType}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">
                          {c.requestorName ?? c.requestorEmail} ·{' '}
                          {format(new Date(c.startDate), 'MMM dd, HH:mm')} to{' '}
                          {format(new Date(c.endDate), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                      )
                    })}
                  </div>
                </div>
              )}

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
        )
      })}
    </div>
  )
}
