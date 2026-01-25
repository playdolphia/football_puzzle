<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Bell, Lightbulb, User, Building2, X, CheckCircle, AlertCircle, Info, AlertTriangle, Zap } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { useClubStore } from '@/stores/clubStore'
import { useNotificationStore, type ActionNotification } from '@/stores/notificationStore'
import type { ClubHint, PlayerHint } from '@/services/clubApi'

const clubStore = useClubStore()
const notificationStore = useNotificationStore()
const isOpen = ref(false)

// Storage key for read hints
const STORAGE_KEY = 'dolphia_read_hints'

// Track read hint codes
const readHintCodes = ref<Set<string>>(new Set())

// Load read hints from localStorage on mount
onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      readHintCodes.value = new Set(parsed)
    }
  } catch {
    // Ignore parse errors
  }
})

// Save read hints to localStorage
const saveReadHints = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...readHintCodes.value]))
  } catch {
    // Ignore storage errors
  }
}

// Generate unique key for a hint
const getHintKey = (hint: ClubHint | (PlayerHint & { playerId?: number }), type: 'club' | 'player'): string => {
  if (type === 'player' && 'playerId' in hint && hint.playerId) {
    return `player:${hint.playerId}:${hint.code}`
  }
  return `club:${hint.code}`
}

// Combined notifications from club_hints, player hints, and action notifications
interface Notification {
  id: string
  category: 'hint' | 'action'
  type: 'club' | 'player' | 'success' | 'error' | 'info' | 'warning'
  code?: string
  text: string
  priority: number
  playerId?: number
  position?: string
  isRead: boolean
  timestamp?: number
}

// Hint notifications from clubStore
const hintNotifications = computed<Notification[]>(() => {
  const items: Notification[] = []

  // Add club hints
  const clubHints = clubStore.club?.club_hints ?? []
  clubHints.forEach(hint => {
    const key = getHintKey(hint, 'club')
    items.push({
      id: key,
      category: 'hint',
      type: 'club',
      code: hint.code,
      text: hint.text,
      priority: hint.priority,
      isRead: readHintCodes.value.has(key)
    })
  })

  // Add player hints
  clubStore.players.forEach(player => {
    if (player.hints?.length) {
      player.hints.forEach(hint => {
        const key = getHintKey({ ...hint, playerId: player.id }, 'player')
        items.push({
          id: key,
          category: 'hint',
          type: 'player',
          code: hint.code,
          text: hint.text,
          priority: hint.priority,
          playerId: player.id,
          position: player.position,
          isRead: readHintCodes.value.has(key)
        })
      })
    }
  })

  return items
})

// Action notifications from notificationStore
const actionNotifications = computed<Notification[]>(() => {
  return notificationStore.allNotifications.map(n => ({
    id: n.id,
    category: 'action' as const,
    type: n.type,
    text: n.message,
    priority: n.type === 'error' ? 80 : n.type === 'warning' ? 60 : n.type === 'success' ? 40 : 20,
    isRead: n.isRead,
    timestamp: n.timestamp
  }))
})

// Combined and sorted notifications
const notifications = computed<Notification[]>(() => {
  const all = [...hintNotifications.value, ...actionNotifications.value]

  // Sort: unread first, then by timestamp (newest) or priority
  return all.sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
    // For action notifications, sort by timestamp
    if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp
    // Otherwise by priority
    return b.priority - a.priority
  })
})

// Count unread notifications
const unreadCount = computed(() =>
  notifications.value.filter(n => !n.isRead).length
)

// Pulse animation when new notifications arrive
const shouldPulse = ref(false)
let pulseTimeout: ReturnType<typeof setTimeout> | null = null

watch(unreadCount, (newCount, oldCount) => {
  if (newCount > oldCount) {
    // New notification arrived - trigger pulse
    shouldPulse.value = true
    if (pulseTimeout) clearTimeout(pulseTimeout)
    pulseTimeout = setTimeout(() => {
      shouldPulse.value = false
    }, 2000)
  }
})

// Mark a notification as read
const markAsRead = (notification: Notification) => {
  if (!notification.isRead) {
    if (notification.category === 'hint') {
      readHintCodes.value.add(notification.id)
      saveReadHints()
    } else {
      notificationStore.markAsRead(notification.id)
    }
  }
}

// Mark all as read
const markAllAsRead = () => {
  // Mark hint notifications
  hintNotifications.value.forEach(n => {
    readHintCodes.value.add(n.id)
  })
  saveReadHints()

  // Mark action notifications
  notificationStore.markAllAsRead()
}

// When sheet opens, mark visible notifications as read after a delay
watch(isOpen, (open) => {
  if (open && notifications.value.length > 0) {
    // Mark all as read after viewing
    setTimeout(() => {
      markAllAsRead()
    }, 1500)
  }
})

// Get notification color based on type
const getNotificationColor = (notification: Notification): string => {
  if (notification.category === 'action') {
    switch (notification.type) {
      case 'success': return 'text-emerald-400'
      case 'error': return 'text-red-400'
      case 'warning': return 'text-amber-400'
      case 'info': return 'text-[#4fd4d4]'
    }
  }
  // Hint notifications - use priority
  if (notification.priority >= 70) return 'text-amber-400'
  if (notification.priority >= 50) return 'text-[#4fd4d4]'
  return 'text-white/60'
}

// Get badge text
const getBadgeText = (notification: Notification): string => {
  if (notification.category === 'action') {
    switch (notification.type) {
      case 'success': return 'Success'
      case 'error': return 'Error'
      case 'warning': return 'Warning'
      case 'info': return 'Info'
    }
  }
  // Hint notifications
  if (notification.priority >= 70) return 'Important'
  if (notification.priority >= 50) return 'Tip'
  return 'Info'
}

// Get badge class
const getBadgeClass = (notification: Notification): string => {
  if (notification.category === 'action') {
    switch (notification.type) {
      case 'success': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'warning': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'info': return 'bg-[#4fd4d4]/20 text-[#4fd4d4] border-[#4fd4d4]/30'
    }
  }
  // Hint notifications
  if (notification.priority >= 70) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (notification.priority >= 50) return 'bg-[#4fd4d4]/20 text-[#4fd4d4] border-[#4fd4d4]/30'
  return 'bg-white/10 text-white/50 border-white/20'
}

// Get icon border class
const getIconBorderClass = (notification: Notification): string => {
  if (notification.category === 'action') {
    switch (notification.type) {
      case 'success': return 'border-emerald-500/30'
      case 'error': return 'border-red-500/30'
      case 'warning': return 'border-amber-500/30'
      case 'info': return 'border-[#4fd4d4]/30'
    }
  }
  return notification.type === 'club' ? 'border-white/20' : 'border-white/10'
}
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetTrigger as-child>
      <Button
        variant="game-icon"
        size="game-icon"
        class="relative w-10 h-10 border border-white/10 hover:border-[#4fd4d4]/50 backdrop-blur-md bg-[#0a0812]/80"
      >
        <Bell class="w-5 h-5" />
        <!-- Unread badge -->
        <span
          v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-medium bg-[#4fd4d4] text-[#0a0812] rounded-full px-1"
          :class="{ 'animate-notification-pulse': shouldPulse }"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </Button>
    </SheetTrigger>

    <SheetContent variant="game" side="right" class="bg-[#0a0812]/95 p-0">
      <SheetHeader class="px-6 pt-6 pb-4 border-b border-white/10">
        <div class="flex items-center justify-between">
          <SheetTitle class="text-white text-sm font-medium tracking-wider uppercase flex items-center gap-2">
            <Bell class="w-4 h-4 text-[#4fd4d4]" />
            Notifications
          </SheetTitle>
          <span
            v-if="unreadCount > 0"
            class="text-[10px] text-[#4fd4d4] uppercase tracking-wider"
          >
            {{ unreadCount }} new
          </span>
        </div>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto">
        <!-- Empty state -->
        <div
          v-if="notifications.length === 0"
          class="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
          <div class="w-12 h-12 border border-white/10 flex items-center justify-center mb-4">
            <Bell class="w-6 h-6 text-white/30" />
          </div>
          <p class="text-white/40 text-sm">No notifications</p>
          <p class="text-white/20 text-xs mt-1">You're all caught up!</p>
        </div>

        <!-- Notifications list -->
        <div v-else class="divide-y divide-white/5">
          <button
            v-for="notification in notifications"
            :key="notification.id"
            class="w-full text-left px-6 py-4 hover:bg-white/5 transition-colors"
            :class="{ 'opacity-60': notification.isRead }"
            @click="markAsRead(notification)"
          >
            <div class="flex items-start gap-3">
              <!-- Icon -->
              <div
                class="w-8 h-8 shrink-0 flex items-center justify-center border"
                :class="getIconBorderClass(notification)"
              >
                <!-- Action notification icons -->
                <template v-if="notification.category === 'action'">
                  <CheckCircle v-if="notification.type === 'success'" class="w-4 h-4 text-emerald-400" />
                  <AlertCircle v-else-if="notification.type === 'error'" class="w-4 h-4 text-red-400" />
                  <AlertTriangle v-else-if="notification.type === 'warning'" class="w-4 h-4 text-amber-400" />
                  <Info v-else class="w-4 h-4 text-[#4fd4d4]" />
                </template>
                <!-- Hint notification icons -->
                <template v-else>
                  <Building2 v-if="notification.type === 'club'" class="w-4 h-4 text-white/50" />
                  <User v-else class="w-4 h-4 text-white/50" />
                </template>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <!-- Type badge -->
                  <span
                    class="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border"
                    :class="getBadgeClass(notification)"
                  >
                    {{ getBadgeText(notification) }}
                  </span>

                  <!-- Player position badge (for player hints) -->
                  <span
                    v-if="notification.position"
                    class="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-white/5 text-white/40 border border-white/10"
                  >
                    {{ notification.position }}
                  </span>

                  <!-- Unread dot -->
                  <span
                    v-if="!notification.isRead"
                    class="w-1.5 h-1.5 rounded-full bg-[#4fd4d4] ml-auto"
                  />
                </div>

                <p
                  class="text-sm leading-relaxed"
                  :class="getNotificationColor(notification)"
                >
                  {{ notification.text }}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Footer with mark all read -->
      <div
        v-if="notifications.length > 0 && unreadCount > 0"
        class="px-6 py-4 border-t border-white/10"
      >
        <Button
          variant="game-ghost"
          size="game"
          class="w-full text-xs"
          @click="markAllAsRead"
        >
          <X class="w-3 h-3 mr-2" />
          Mark all as read
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>

<style scoped>
.animate-notification-pulse {
  animation: notification-pulse 0.5s ease-in-out 3;
}

@keyframes notification-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(79, 212, 212, 0.7);
  }
  50% {
    transform: scale(1.2);
    box-shadow: 0 0 0 8px rgba(79, 212, 212, 0);
  }
}
</style>
