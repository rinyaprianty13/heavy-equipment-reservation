'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllEquipment } from '@/app/actions/reservations'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Equipment {
  id: string
  code: string
  name: string
  type: string
  site: string
  capacity?: number
  capacityUnit?: string
}

export default function EquipmentCalendar() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<string>('ALL')
  const [selectedType, setSelectedType] = useState<string>('ALL')

  const sites = Array.from(new Set(equipment.map((e) => e.site)))
  const types = Array.from(new Set(equipment.map((e) => e.type)))

  useEffect(() => {
    async function loadEquipment() {
      try {
        const data = await getAllEquipment()
        setEquipment(data as Equipment[])
        setFilteredEquipment(data as Equipment[])
      } catch (err) {
        setError('Failed to load equipment')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadEquipment()
  }, [])

  useEffect(() => {
    let filtered = equipment

    if (selectedSite !== 'ALL') {
      filtered = filtered.filter((e) => e.site === selectedSite)
    }

    if (selectedType !== 'ALL') {
      filtered = filtered.filter((e) => e.type === selectedType)
    }

    setFilteredEquipment(filtered)
  }, [selectedSite, selectedType, equipment])

  if (loading) {
    return <div className="text-muted-foreground">Loading equipment calendar...</div>
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

  const typeColors: Record<string, string> = {
    CRANE: 'bg-blue-100 text-blue-800',
    FORKLIFT: 'bg-yellow-100 text-yellow-800',
    MANLIFT: 'bg-purple-100 text-purple-800',
    OTHER: 'bg-gray-100 text-gray-800',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Availability</CardTitle>
        <CardDescription>
          View all available equipment across sites
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Site</label>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sites</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site} value={site}>
                    {site}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((equip) => (
            <div key={equip.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{equip.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{equip.code}</p>
                </div>
                <Badge className={typeColors[equip.type]}>
                  {equip.type}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <strong>Site:</strong> {equip.site}
                </p>
                {equip.capacity && (
                  <p className="text-muted-foreground">
                    <strong>Capacity:</strong> {equip.capacity} {equip.capacityUnit || 'units'}
                  </p>
                )}
                <div className="pt-2 border-t">
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    AVAILABLE
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEquipment.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No equipment found matching your filters
          </div>
        )}

        <div className="text-sm text-muted-foreground pt-4 border-t">
          <p>Total Available Equipment: <strong>{filteredEquipment.length}</strong></p>
        </div>
      </CardContent>
    </Card>
  )
}
