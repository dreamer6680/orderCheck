import { create } from 'zustand'

export interface NotificationState {
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    timestamp: number
  }>
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (type, message) => {
    const id = `${Date.now()}`
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id,
          type,
          message,
          timestamp: Date.now(),
        },
      ],
    }))

    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }))
    }, 5000)
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },
}))
