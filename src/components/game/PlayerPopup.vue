<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Dumbbell, Utensils, BedDouble, Clock, ChevronRight } from 'lucide-vue-next'
import type { Player } from '@/services/clubApi'

interface Props {
  player: Player | null
  visible: boolean
  anchorX: number
  anchorY: number
  containerWidth: number
  containerHeight: number
  timerTick: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  train: []
  feed: []
  rest: []
  details: []
}>()

const popupEl = ref<HTMLElement | null>(null)
const popupHeight = ref(280) // estimated default

// Measure actual height after render
const updateHeight = () => {
  if (popupEl.value) {
    popupHeight.value = popupEl.value.offsetHeight
  }
}

watch(() => props.visible, (v) => {
  if (v) nextTick(updateHeight)
})

watch(() => props.player, () => {
  if (props.visible) nextTick(updateHeight)
}, { deep: true })

// Position names
const positionNames: Record<string, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  ATT: 'Attacker'
}

const POPUP_WIDTH = 260
const MARGIN = 12
const ARROW_SIZE = 8
const ANCHOR_OFFSET = 30 // offset from sprite center

// Smart placement
const placement = computed(() => {
  const { anchorX, anchorY, containerWidth, containerHeight } = props
  const h = popupHeight.value

  // Default: above the anchor
  let top = anchorY - ANCHOR_OFFSET - h - ARROW_SIZE
  let arrowDir: 'down' | 'up' = 'down'

  // If would overflow top, flip to below
  if (top < MARGIN) {
    top = anchorY + ANCHOR_OFFSET + ARROW_SIZE
    arrowDir = 'up'
  }

  // If would overflow bottom after flip, force above anyway
  if (arrowDir === 'up' && top + h > containerHeight - MARGIN) {
    top = anchorY - ANCHOR_OFFSET - h - ARROW_SIZE
    arrowDir = 'down'
  }

  // Horizontal: center on anchor, clamp to edges
  let left = anchorX - POPUP_WIDTH / 2
  left = Math.max(MARGIN, Math.min(left, containerWidth - POPUP_WIDTH - MARGIN))

  // Arrow horizontal position relative to popup
  const arrowLeft = Math.max(16, Math.min(anchorX - left, POPUP_WIDTH - 16))

  // Off-screen detection
  const offScreen = anchorX < -50 || anchorX > containerWidth + 50 ||
    anchorY < -50 || anchorY > containerHeight + 50

  return { top, left, arrowDir, arrowLeft, offScreen }
})

const transformOrigin = computed(() => {
  return placement.value.arrowDir === 'down' ? 'bottom center' : 'top center'
})

// Energy bar color
const energyColor = computed(() => {
  if (!props.player) return 'bg-rose-400'
  if (props.player.energy >= 70) return 'bg-[#4fd4d4]'
  if (props.player.energy >= 40) return 'bg-amber-400'
  return 'bg-rose-400'
})

// XP progress
const xpProgress = computed(() => {
  if (!props.player) return 0
  const needed = props.player.level * 100
  if (needed === 0) return 100
  return Math.min(100, (props.player.xp / needed) * 100)
})

const xpLabel = computed(() => {
  if (!props.player) return ''
  const needed = props.player.level * 100
  return `${props.player.xp} / ${needed} XP`
})

// Stat bars (max assumed ~100)
const stats = computed(() => {
  if (!props.player) return []
  return [
    { label: 'STM', value: props.player.stamina, key: 'stamina' },
    { label: 'STR', value: props.player.strength, key: 'strength' },
    { label: 'AWR', value: props.player.awareness, key: 'awareness' },
    { label: 'FIN', value: props.player.finishing, key: 'finishing' }
  ]
})

// Task formatting
const parseTaskEndTime = (taskEndsAt: string): Date => {
  if (!taskEndsAt.includes('Z') && !taskEndsAt.includes('+')) {
    return new Date(taskEndsAt.replace(' ', 'T') + 'Z')
  }
  return new Date(taskEndsAt)
}

const isTaskExpired = computed(() => {
  if (!props.player?.task_ends_at) return true
  return parseTaskEndTime(props.player.task_ends_at) <= new Date()
})

const hasActiveTask = computed(() => {
  return props.player?.current_task && !isTaskExpired.value
})

const taskName = computed(() => {
  const task = props.player?.current_task
  if (!task) return ''
  if (task === 'training') return 'Training'
  if (task === 'match') return 'In Match'
  if (task.startsWith('rest:')) return 'Resting'
  return task.charAt(0).toUpperCase() + task.slice(1)
})

const timeLeft = computed(() => {
  void props.timerTick
  if (!props.player?.task_ends_at) return ''
  const endTime = parseTaskEndTime(props.player.task_ends_at).getTime()
  const now = Date.now()
  const diff = endTime - now
  if (diff <= 0) return 'Completing...'
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
})

// Task progress (0-100)
const taskProgress = computed(() => {
  void props.timerTick
  if (!props.player?.current_task || !props.player?.task_ends_at) return 0
  const task = props.player.current_task
  const endTime = parseTaskEndTime(props.player.task_ends_at).getTime()
  const now = Date.now()
  const remaining = endTime - now

  // For rest tasks, parse duration from "rest:type:duration:energy"
  if (task.startsWith('rest:')) {
    const parts = task.split(':')
    const durationMin = parseInt(parts[2] || '15', 10)
    const totalMs = durationMin * 60 * 1000
    const elapsed = totalMs - remaining
    return Math.max(0, Math.min(100, (elapsed / totalMs) * 100))
  }

  // For training, estimate 15 min duration
  if (task === 'training') {
    const estimatedTotal = 15 * 60 * 1000
    const elapsed = estimatedTotal - remaining
    return Math.max(0, Math.min(100, (elapsed / estimatedTotal) * 100))
  }

  return 0
})

// Recommended action from hints
const recommendedAction = computed(() => {
  if (!props.player?.hints) return null
  for (const hint of props.player.hints) {
    if (hint.action?.type) return hint.action.type
  }
  return null
})

// Disable actions when player has active task
const actionsDisabled = computed(() => hasActiveTask.value)
</script>

<template>
  <Transition name="popup">
    <div
      v-if="visible && player && !placement.offScreen"
      ref="popupEl"
      data-player-popup
      class="absolute z-50 w-[260px] pointer-events-auto"
      :style="{
        left: `${placement.left}px`,
        top: `${placement.top}px`,
        transformOrigin
      }"
      @pointerdown.stop
    >
      <!-- Popup card -->
      <div class="bg-black/70 backdrop-blur-xl border border-white/10 p-4 space-y-3 shadow-2xl shadow-black/50">

        <!-- Header: Position + Level -->
        <div class="text-center">
          <p class="text-sm font-medium text-white tracking-wide">
            {{ positionNames[player.position] || player.position }}
            <span class="text-white/40"> · </span>
            <span class="text-[#4fd4d4]">Lv.{{ player.level }}</span>
          </p>
        </div>

        <!-- Energy bar -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] text-white/40 tracking-widest uppercase">Energy</span>
            <span class="text-[10px] text-white/60">{{ player.energy }}%</span>
          </div>
          <div class="relative h-[2px] overflow-hidden bg-white/10">
            <div
              class="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
              :class="energyColor"
              :style="{ width: `${Math.min(100, Math.max(0, player.energy))}%` }"
            />
          </div>
        </div>

        <!-- XP progress bar -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] text-white/40 tracking-widest uppercase">XP</span>
            <span class="text-[10px] text-white/60">{{ xpLabel }}</span>
          </div>
          <div class="relative h-[2px] overflow-hidden bg-white/10">
            <div
              class="absolute inset-y-0 left-0 transition-all duration-500 ease-out bg-[#4fd4d4]"
              :style="{ width: `${xpProgress}%` }"
            />
          </div>
        </div>

        <!-- Stats mini-bars (2x2 grid) -->
        <div class="grid grid-cols-2 gap-x-4 gap-y-2">
          <div v-for="stat in stats" :key="stat.key">
            <div class="flex items-center justify-between mb-0.5">
              <span class="text-[9px] text-white/30 tracking-widest">{{ stat.label }}</span>
              <span class="text-[10px] text-white/60">{{ stat.value }}</span>
            </div>
            <div class="relative h-[2px] overflow-hidden bg-white/10">
              <div
                class="absolute inset-y-0 left-0 bg-white/40 transition-all duration-300"
                :style="{ width: `${Math.min(100, stat.value)}%` }"
              />
            </div>
          </div>
        </div>

        <!-- Active task with progress -->
        <div v-if="hasActiveTask" class="bg-white/5  p-2 space-y-1.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <Clock class="w-3 h-3 text-[#4fd4d4] animate-pulse" />
              <span class="text-[10px] text-white/60 tracking-wide">{{ taskName }}</span>
            </div>
            <span class="text-xs font-light text-[#4fd4d4] tracking-wider">{{ timeLeft }}</span>
          </div>
          <div class="relative h-[2px] overflow-hidden bg-white/10">
            <div
              class="absolute inset-y-0 left-0 bg-[#4fd4d4]/60 transition-all duration-1000 ease-linear"
              :style="{ width: `${taskProgress}%` }"
            />
          </div>
        </div>

        <!-- Action buttons (3 in a row) -->
        <div class="flex gap-2">
          <button
            :disabled="actionsDisabled"
            class="flex-1 flex flex-col items-center gap-1 py-2  border transition-all"
            :class="[
              actionsDisabled
                ? 'border-white/5 text-white/20 cursor-not-allowed'
                : 'border-white/10 text-white/70 hover:border-[#4fd4d4]/40 hover:text-[#4fd4d4] active:scale-95',
              recommendedAction === 'train' && !actionsDisabled ? 'animate-subtle-pulse border-[#4fd4d4]/30' : ''
            ]"
            @click="emit('train')"
          >
            <Dumbbell class="w-4 h-4" />
            <span class="text-[9px] tracking-wider uppercase">Train</span>
          </button>
          <button
            :disabled="actionsDisabled"
            class="flex-1 flex flex-col items-center gap-1 py-2  border transition-all"
            :class="[
              actionsDisabled
                ? 'border-white/5 text-white/20 cursor-not-allowed'
                : 'border-white/10 text-white/70 hover:border-[#4fd4d4]/40 hover:text-[#4fd4d4] active:scale-95',
              recommendedAction === 'feed' && !actionsDisabled ? 'animate-subtle-pulse border-[#4fd4d4]/30' : ''
            ]"
            @click="emit('feed')"
          >
            <Utensils class="w-4 h-4" />
            <span class="text-[9px] tracking-wider uppercase">Feed</span>
          </button>
          <button
            :disabled="actionsDisabled"
            class="flex-1 flex flex-col items-center gap-1 py-2  border transition-all"
            :class="[
              actionsDisabled
                ? 'border-white/5 text-white/20 cursor-not-allowed'
                : 'border-white/10 text-white/70 hover:border-[#4fd4d4]/40 hover:text-[#4fd4d4] active:scale-95',
              recommendedAction === 'rest' && !actionsDisabled ? 'animate-subtle-pulse border-[#4fd4d4]/30' : ''
            ]"
            @click="emit('rest')"
          >
            <BedDouble class="w-4 h-4" />
            <span class="text-[9px] tracking-wider uppercase">Rest</span>
          </button>
        </div>

        <!-- Details button -->
        <button
          class="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-white/40 hover:text-white/60 tracking-widest uppercase transition-colors"
          @click="emit('details')"
        >
          Details
          <ChevronRight class="w-3 h-3" />
        </button>
      </div>

      <!-- Arrow -->
      <div
        class="absolute w-0 h-0"
        :class="placement.arrowDir === 'down' ? 'popup-arrow-down' : 'popup-arrow-up'"
        :style="{ left: `${placement.arrowLeft}px`, transform: 'translateX(-50%)' }"
      />
    </div>
  </Transition>
</template>

<style scoped>
.popup-enter-active {
  transition: all 0.2s ease-out;
}
.popup-leave-active {
  transition: all 0.15s ease-in;
}
.popup-enter-from {
  opacity: 0;
  transform: scale(0.85);
}
.popup-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.popup-arrow-down {
  bottom: -8px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(0, 0, 0, 0.7);
}

.popup-arrow-up {
  top: -8px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid rgba(0, 0, 0, 0.7);
}

@keyframes subtle-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(79, 212, 212, 0); }
  50% { box-shadow: 0 0 8px 2px rgba(79, 212, 212, 0.3); }
}

.animate-subtle-pulse {
  animation: subtle-pulse 2s ease-in-out infinite;
}
</style>
