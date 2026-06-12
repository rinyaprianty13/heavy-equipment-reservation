'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckAll } from 'lucide-react'
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsSent,
  markAllNotificationsAsSent,
  deleteNotification,
} from '@/app/actions/notifications'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  status: string
  createdAt: Date
  reservationId?: string
}

const typeColors: Record<string, string> = {
  APPROVAL_PENDING: 'bg-yellow-50 border-yellow-200',
  APPROVED: 'bg-green-50 border-green-200',
  REJECTED: 'bg-red-50 border-red-200',
  CONFLICT_DETECTED: 'bg-orange-50 border-orange-200',
  REMINDER: 'bg-blue-50 border-blue-200',
  REASSIGNED: 'bg-purple-50 border-purple-200',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    loadNotifications()
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        getUserNotifications(20),
        getUnreadNotificationCount(),
      ])
      setNotifications(notifs as Notification[])
      setUnreadCount(count as any)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      await loadNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsAsSent()
      await loadNotifications()
    } catch (error) {
      console.error('Failed to mark notifications:', error)
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowPanel(!showPanel)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-background border border-border rounded-lg shadow-lg z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAll}
                className="h-6 gap-1"
              >
                <CheckAll className="h-4 w-4" />
                Mark all
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 border-l-4 flex items-start gap-2 text-sm ${typeColors[notif.type] || 'bg-gray-50'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {notif.title}
                      </p>
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-muted-foreground text-xs mt-2">
                        {format(new Date(notif.createdAt), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(notif.id)}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
