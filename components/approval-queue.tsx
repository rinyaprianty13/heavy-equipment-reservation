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
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Users } from 'lucide-react'

interface ConflictDetail {
  conflictId: string
  overlapType: 'FULL_OVERLAP' | 'PARTIAL_OVERLAP' | 'ADJACENT'
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
  equipmentId: string
  equipmentName: string
  equipmentType: string
  requestorName: string | null
  requestorEmail: string | null
  status: string
  startDate: Date
  endDate: Date
  purpose: string
  costCode: string | null
  createdAt: Date
  conflicts: ConflictDetail[]
}

// ── Severity helpers ──────────────────────────────────────────────────────────
type Severity = 'critical' | 'warning' | 'minor' | 'none'

const overlapLabel: Record<string, string> = {
  FULL_OVERLAP: 'Full overlap',
  PARTIAL_OVERLAP: 'Partial overlap',
  ADJACENT: 'Back-to-back',
}

const overlapSeverity: Record<string, Severity> = {
  FULL_OVERLAP: 'critical',
  PARTIAL_OVERLAP: 'warning',
  ADJACENT: 'minor',
}

const severityRank: Record<Severity, number> = { critical: 3, warning: 2, minor: 1, none: 0 }

const severityMeta: Record<Severity, {
  cardBorder: string
  cardBg: string
  badgeBg: string
  badgeText: string
  groupBorder: string
  groupBg: string
  groupText: string
  label: string
}> = {
  critical: {
    cardBorder: 'border-red-400',
    cardBg: 'bg-red-50 dark:bg-red-950/30',
    badgeBg: 'bg-red-600',
    badgeText: 'text-white',
    groupBorder: 'border-red-400',
    groupBg: 'bg-red-50 dark:bg-red-950/20',
    groupText: 'text-red-700 dark:text-red-400',
    label: 'Direct conflict',
  },
  warning: {
    cardBorder: 'border-amber-400',
    cardBg: 'bg-amber-50 dark:bg-amber-950/30',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
    groupBorder: 'border-amber-400',
    groupBg: 'bg-amber-50 dark:bg-amber-950/20',
    groupText: 'text-amber-700 dark:text-amber-400',
    label: 'Partial conflict',
  },
  minor: {
    cardBorder: 'border-blue-400',
    cardBg: 'bg-blue-50 dark:bg-blue-950/30',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-white',
    groupBorder: 'border-blue-400',
    groupBg: 'bg-blue-50 dark:bg-blue-950/20',
    groupText: 'text-blue-700 dark:text-blue-400',
    label: 'Back-to-back',
  },
  none: {
    cardBorder: 'border-border',
    cardBg: '',
    badgeBg: '',
    badgeText: '',
    groupBorder: '',
    groupBg: '',
    groupText: '',
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

// ── Conflict grouping ─────────────────────────────────────────────────────────
// Each "conflict group" is a set of requests that all compete for the same
// equipment. We use Union-Find to merge requests that share any overlap.
function buildConflictGroups(approvals: PendingApproval[]): {
  groups: PendingApproval[][]   // groups with 2+ competing requests
  standalone: PendingApproval[] // requests with no conflicts
} {
  const parent: Record<string, string> = {}
  approvals.forEach((a) => { parent[a.id] = a.id })

  function find(id: string): string {
    if (parent[id] !== id) parent[id] = find(parent[id])
    return parent[id]
  }
  function union(a: string, b: string) {
    parent[find(a)] = find(b)
  }

  approvals.forEach((a) => {
    a.conflicts.forEach((c) => {
      // only union if the conflicting request is also in the pending list
      if (approvals.some((x) => x.id === c.reservationId)) {
        union(a.id, c.reservationId)
      }
    })
  })

  const buckets: Record<string, PendingApproval[]> = {}
  approvals.forEach((a) => {
    const root = find(a.id)
    if (!buckets[root]) buckets[root] = []
    buckets[root].push(a)
  })

  const groups: PendingApproval[][] = []
  const standalone: PendingApproval[] = []

  Object.values(buckets).forEach((group) => {
    if (group.length > 1) groups.push(group)
    else standalone.push(group[0])
  })

  // Sort groups by worst severity (most critical first)
  groups.sort((ga, gb) => {
    const sa = Math.max(...ga.map((a) => severityRank[getTopSeverity(a.conflicts)]))
    const sb = Math.max(...gb.map((b) => severityRank[getTopSeverity(b.conflicts)]))
    return sb - sa
  })

  return { groups, standalone }
}

// ── Single request card ───────────────────────────────────────────────────────
function ReservationCard({
  approval,
  expanded,
  onToggle,
  notes,
  onNoteChange,
  onApprove,
  onReject,
  processingId,
  showConflicts = true,
}: {
  approval: PendingApproval
  expanded: boolean
  onToggle: () => void
  notes: string
  onNoteChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
  processingId: string | null
  showConflicts?: boolean
}) {
  const hasConflict = approval.conflicts.length > 0
  const severity = hasConflict ? getTopSeverity(approval.conflicts) : 'none'
  const meta = severityMeta[severity]
  const isProcessing = processingId === approval.id

  return (
    <Card className={`transition-all ${meta.cardBorder} ${meta.cardBg}`}>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CardTitle className="text-base font-mono">{approval.requestNumber}</CardTitle>
              <Badge variant="outline" className="text-xs">PENDING</Badge>
              {hasConflict && (
                <Badge className={`text-xs gap-1 ${meta.badgeBg} ${meta.badgeText} hover:${meta.badgeBg}`}>
                  <AlertTriangle className="h-3 w-3" />
                  {meta.label}
                </Badge>
              )}
            </div>
            <CardDescription className="space-y-0.5">
              <p className="text-foreground font-medium">
                {approval.equipmentName}
                <span className="text-muted-foreground font-normal"> · requested by </span>
                <span className="text-foreground">{approval.requestorName ?? approval.requestorEmail}</span>
              </p>
              <p className="text-sm">
                {format(new Date(approval.startDate), 'MMM dd, yyyy HH:mm')}
                {' '}&rarr;{' '}
                {format(new Date(approval.endDate), 'MMM dd, yyyy HH:mm')}
              </p>
              <p className="text-sm text-muted-foreground">
                Purpose: {approval.purpose}
                {approval.costCode && (
                  <span className="ml-2 font-mono">· {approval.costCode}</span>
                )}
              </p>
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">
              {format(new Date(approval.createdAt), 'MMM dd, HH:mm')}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 border-t pt-4">
          {hasConflict && showConflicts && (
            <div className={`rounded-md border p-3 ${meta.cardBorder} ${meta.cardBg}`}>
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Competing with {approval.conflicts.length} other request{approval.conflicts.length > 1 ? 's' : ''} for this equipment
              </p>
              <div className="space-y-1.5">
                {approval.conflicts.map((c) => {
                  const cMeta = severityMeta[overlapSeverity[c.overlapType] ?? 'warning']
                  return (
                    <div key={c.conflictId} className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-mono font-medium">{c.requestNumber}</span>
                      <Badge className={`text-xs ${cMeta.badgeBg} ${cMeta.badgeText} hover:${cMeta.badgeBg}`}>
                        {overlapLabel[c.overlapType]}
                      </Badge>
                      <span className="text-muted-foreground">
                        {c.requestorName ?? c.requestorEmail} ·{' '}
                        {format(new Date(c.startDate), 'MMM dd HH:mm')}–{format(new Date(c.endDate), 'HH:mm')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor={`notes-${approval.id}`} className="text-sm">
              Notes {hasConflict ? '(required for rejection)' : '(optional)'}
            </Label>
            <Textarea
              id={`notes-${approval.id}`}
              placeholder={hasConflict ? 'State your decision reason...' : 'Approval notes...'}
              value={notes}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onApprove}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              {isProcessing ? 'Processing...' : 'Approve'}
            </Button>
            <Button
              onClick={onReject}
              disabled={isProcessing || !notes}
              variant="destructive"
              className="flex-1"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              {isProcessing ? 'Processing...' : 'Reject'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    loadApprovals()
  }, [])

  async function loadApprovals() {
    setLoading(true)
    setError(null)
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

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      await approveReservation(id, notes[id])
      setApprovals((prev) => prev.filter((a) => a.id !== id))
      setNotes((prev) => { const n = { ...prev }; delete n[id]; return n })
      setExpandedId(null)
    } catch (err) {
      setError('Failed to approve reservation')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!notes[id]) { setError('Please provide a rejection reason'); return }
    setProcessingId(id)
    try {
      await rejectReservation(id, notes[id])
      setApprovals((prev) => prev.filter((a) => a.id !== id))
      setNotes((prev) => { const n = { ...prev }; delete n[id]; return n })
      setExpandedId(null)
    } catch (err) {
      setError('Failed to reject reservation')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading pending approvals...</p>

  if (error) return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <p className="text-red-800">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={loadApprovals}>Retry</Button>
      </CardContent>
    </Card>
  )

  if (approvals.length === 0) return (
    <Card>
      <CardContent className="pt-6 text-center py-12">
        <p className="text-muted-foreground">No pending approvals. All requests are up to date.</p>
      </CardContent>
    </Card>
  )

  const { groups, standalone } = buildConflictGroups(approvals)

  const sharedCardProps = (a: PendingApproval) => ({
    approval: a,
    expanded: expandedId === a.id,
    onToggle: () => setExpandedId(expandedId === a.id ? null : a.id),
    notes: notes[a.id] ?? '',
    onNoteChange: (v: string) => setNotes((prev) => ({ ...prev, [a.id]: v })),
    onApprove: () => handleApprove(a.id),
    onReject: () => handleReject(a.id),
    processingId,
  })

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground border rounded-md px-4 py-2.5 bg-muted/30">
        <span className="font-semibold text-foreground">Conflict legend:</span>
        {(['critical', 'warning', 'minor'] as Severity[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${severityMeta[s].badgeBg}`} />
            {severityMeta[s].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground/40 border border-border" />
          No conflict
        </span>
      </div>

      {/* Conflict groups — shown first, each in a colored outline box */}
      {groups.map((group, gi) => {
        const groupSeverity = (['critical', 'warning', 'minor'] as Severity[]).find(
          (s) => group.some((a) => getTopSeverity(a.conflicts) === s)
        ) ?? 'warning'
        const gMeta = severityMeta[groupSeverity]

        return (
          <div
            key={gi}
            className={`rounded-xl border-2 p-4 space-y-3 ${gMeta.groupBorder} ${gMeta.groupBg}`}
          >
            {/* Group header */}
            <div className="flex items-center gap-2">
              <Users className={`h-4 w-4 ${gMeta.groupText}`} />
              <p className={`font-semibold text-sm ${gMeta.groupText}`}>
                {group.length} requests competing for {group[0].equipmentName}
              </p>
              <Badge className={`text-xs ml-auto ${gMeta.badgeBg} ${gMeta.badgeText}`}>
                Needs decision
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Only one of these requests can be approved — the equipment cannot be double-booked. Approve the one that should proceed and reject the others.
            </p>

            {/* Cards within the group */}
            <div className="space-y-2">
              {group.map((a) => (
                <ReservationCard key={a.id} {...sharedCardProps(a)} showConflicts={false} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Standalone (no conflict) requests */}
      {standalone.length > 0 && (
        <div className="space-y-3">
          {groups.length > 0 && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              No conflict
            </p>
          )}
          {standalone.map((a) => (
            <ReservationCard key={a.id} {...sharedCardProps(a)} />
          ))}
        </div>
      )}
    </div>
  )
}
