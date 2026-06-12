'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { createReservation, getAllEquipment } from '@/app/actions/reservations'
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Equipment {
  id: string
  code: string
  name: string
  type: string
  site: string
  capacity?: number
  capacityUnit?: string
}

export default function ReservationForm() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<any>(null)

  const [formData, setFormData] = useState({
    equipmentId: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    purpose: '',
    costCode: '',
    notes: '',
  })

  useEffect(() => {
    async function loadEquipment() {
      try {
        const equip = await getAllEquipment()
        setEquipment(equip)
      } catch (err) {
        setError('Failed to load equipment list')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadEquipment()
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // Validate form
      if (!formData.equipmentId || !formData.startDate || !formData.endDate) {
        setError('Please fill in all required fields')
        return
      }

      // Parse dates
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime || '00:00'}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime || '23:59'}`)

      if (startDateTime >= endDateTime) {
        setError('End date/time must be after start date/time')
        return
      }

      setSubmitting(true)

      const result = await createReservation({
        equipmentId: formData.equipmentId,
        startDate: startDateTime,
        endDate: endDateTime,
        purpose: formData.purpose,
        costCode: formData.costCode || undefined,
        notes: formData.notes || undefined,
      })

      setSuccess(result)

      // Reset form
      setFormData({
        equipmentId: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        purpose: '',
        costCode: '',
        notes: '',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading equipment...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Request {success.requestNumber} submitted successfully.
            {success.hasConflict && ' Conflicts detected - alternative equipment suggestions provided.'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Equipment Reservation Request</CardTitle>
          <CardDescription>
            Fill in the details below to request equipment. The system will check for conflicts and suggest alternatives if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Equipment Selection */}
              <div className="md:col-span-2">
                <Label htmlFor="equipment">Equipment Type *</Label>
                <Select
                  value={formData.equipmentId}
                  onValueChange={(value) => handleSelectChange('equipmentId', value)}
                >
                  <SelectTrigger id="equipment">
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((equip) => (
                      <SelectItem key={equip.id} value={equip.id}>
                        {equip.name} ({equip.code}) - {equip.site}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date & Time */}
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                />
              </div>

              {/* End Date & Time */}
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                />
              </div>

              {/* Purpose */}
              <div className="md:col-span-2">
                <Label htmlFor="purpose">Purpose of Use *</Label>
                <Input
                  id="purpose"
                  type="text"
                  name="purpose"
                  placeholder="e.g., Lifting tower section, material transport"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Cost Code */}
              <div>
                <Label htmlFor="costCode">Cost Code (Optional)</Label>
                <Input
                  id="costCode"
                  type="text"
                  name="costCode"
                  placeholder="e.g., CC-2024-001"
                  value={formData.costCode}
                  onChange={handleInputChange}
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any special requirements or details..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full md:w-auto">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {success && success.alternatives && success.alternatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Alternative Equipment Available
            </CardTitle>
            <CardDescription>
              Your requested equipment has a conflict, but these alternatives are available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {success.alternatives.map((alt: any) => (
                <div key={alt.id} className="p-4 border rounded-lg bg-amber-50">
                  <p className="font-semibold text-sm">
                    {alt.suggestedEquipmentName || 'Equipment'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Available: {new Date(alt.availableStartDate).toLocaleDateString()} to{' '}
                    {new Date(alt.availableEndDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
