import { defineStore } from 'pinia'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface ActionNotification {
  id: string
  type: NotificationType
  message: string
  timestamp: number
  isRead: boolean
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as ActionNotification[],
    maxNotifications: 50 // Keep last 50 notifications
  }),

  getters: {
    unreadCount: (state): number => {
      return state.notifications.filter(n => !n.isRead).length
    },

    allNotifications: (state): ActionNotification[] => {
      return [...state.notifications].sort((a, b) => b.timestamp - a.timestamp)
    }
  },

  actions: {
    addNotification(type: NotificationType, message: string) {
      const notification: ActionNotification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: Date.now(),
        isRead: false
      }

      this.notifications.unshift(notification)

      // Trim to max notifications
      if (this.notifications.length > this.maxNotifications) {
        this.notifications = this.notifications.slice(0, this.maxNotifications)
      }
    },

    success(message: string) {
      this.addNotification('success', message)
    },

    error(message: string) {
      this.addNotification('error', message)
    },

    info(message: string) {
      this.addNotification('info', message)
    },

    warning(message: string) {
      this.addNotification('warning', message)
    },

    markAsRead(id: string) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.isRead = true
      }
    },

    markAllAsRead() {
      this.notifications.forEach(n => {
        n.isRead = true
      })
    },

    clearAll() {
      this.notifications = []
    }
  }
})
