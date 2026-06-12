'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getAllEquipmentWithStatus,
} from '@/app/actions/equipment'
import { AlertTriangle, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

interface Equipment {
  id: string
  code: string
  name: string
  type: string
  site: string
  status: string
  description?: string
  capacity?: number
  capacityUnit?: string
  nextMaintenanceDate?: Date
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-red-100 text-red-800',
}

const typeColors: Record<string, string> = {
  CRANE: 'bg-blue-100 text-blue-800',
  FORKLIFT: 'bg-orange-100 text-orange-800',
  MANLIFT: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-gray-100 text-gray-800',
}

export default function EquipmentManagement() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'CRANE',
    description: '',
    site: '',
    capacity: '',
    capacityUnit: '',
  })

  useEffect(() => {
    loadEquipment()
  }, [])

  const loadEquipment = async () => {
    try {
      const data = await getAllEquipmentWithStatus()
      setEquipment(data as Equipment[])
    } catch (err) {
      setError('Failed to load equipment')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      if (!formData.code || !formData.name || !formData.site) {
        setError('Please fill in all required fields')
        return
      }

      if (editingId) {
        await updateEquipment(editingId, {
          name: formData.name,
          description: formData.description,
          site: formData.site,
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
          capacityUnit: formData.capacityUnit || undefined,
        })
        setSuccess('Equipment updated successfully')
      } else {
        await createEquipment({
          code: formData.code,
          name: formData.name,
          type: formData.type as any,
          description: formData.description,
          site: formData.site,
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
          capacityUnit: formData.capacityUnit || undefined,
        })
        setSuccess('Equipment created successfully')
      }

      resetForm()
      await loadEquipment()
    } catch (err: any) {
      setError(err.message || 'Failed to save equipment')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return

    setDeleting(id)
    try {
      await deleteEquipment(id)
      setSuccess('Equipment deleted successfully')
      await loadEquipment()
    } catch (err: any) {
      setError(err.message || 'Failed to delete equipment')
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (equip: Equipment) => {
    setFormData({
      code: equip.code,
      name: equip.name,
      type: equip.type,
      description: equip.description || '',
      site: equip.site,
      capacity: equip.capacity?.toString() || '',
      capacityUnit: equip.capacityUnit || '',
    })
    setEditingId(equip.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'CRANE',
      description: '',
      site: '',
      capacity: '',
      capacityUnit: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading equipment...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Equipment Inventory</h2>
        <Button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancel' : 'Add Equipment'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Equipment' : 'Add New Equipment'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Equipment Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g., CRN-001"
                    disabled={!!editingId}
                  />
                </div>

                <div>
                  <Label htmlFor="name">Equipment Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Mobile Crane 50T"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(v) => handleSelectChange('type', v)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRANE">Crane</SelectItem>
                      <SelectItem value="FORKLIFT">Forklift</SelectItem>
                      <SelectItem value="MANLIFT">Manlift</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="site">Site *</Label>
                  <Input
                    id="site"
                    name="site"
                    value={formData.site}
                    onChange={handleInputChange}
                    placeholder="e.g., CEPU Main"
                  />
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                  />
                </div>

                <div>
                  <Label htmlFor="capacityUnit">Capacity Unit</Label>
                  <Input
                    id="capacityUnit"
                    name="capacityUnit"
                    value={formData.capacityUnit}
                    onChange={handleInputChange}
                    placeholder="e.g., tons"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit">
                  {editingId ? 'Update Equipment' : 'Create Equipment'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Equipment</CardTitle>
          <CardDescription>Total: {equipment.length} item(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((equip) => (
                  <TableRow key={equip.id}>
                    <TableCell className="font-mono text-sm">{equip.code}</TableCell>
                    <TableCell>{equip.name}</TableCell>
                    <TableCell>
                      <Badge className={typeColors[equip.type]}>
                        {equip.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{equip.site}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[equip.status]}>
                        {equip.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {equip.capacity && (
                        <span className="text-sm">
                          {equip.capacity} {equip.capacityUnit}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(equip)}
                          disabled={!!deleting}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(equip.id)}
                          disabled={deleting === equip.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {equipment.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No equipment found. Create your first equipment to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
