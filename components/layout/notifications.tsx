'use client'

import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { useNotificationStore } from '@/lib/store/notificationStore'

export function Notifications() {
  const { notifications, removeNotification } = useNotificationStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => {
        const icons = {
          success: <CheckCircle2 className="h-5 w-5" />,
          error: <AlertCircle className="h-5 w-5" />,
          warning: <AlertCircle className="h-5 w-5" />,
          info: <Info className="h-5 w-5" />,
        }

        const colors = {
          success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          error: 'bg-red-50 text-red-700 border-red-200',
          warning: 'bg-amber-50 text-amber-700 border-amber-200',
          info: 'bg-blue-50 text-blue-700 border-blue-200',
        }

        return (
          <div
            key={notification.id}
            className={`flex items-center gap-3 rounded-lg border p-4 ${colors[notification.type]} animate-in fade-in slide-in-from-bottom-4`}
          >
            {icons[notification.type]}
            <p className="text-sm flex-1">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
