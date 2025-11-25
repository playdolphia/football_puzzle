<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Dices, Loader2 } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'vue-sonner'

const router = useRouter()
const globalStore = useGlobalStore()

// Game states
const gamePhase = ref<'loading' | 'field-select' | 'playing' | 'finished'>('loading')
const showBackDialog = ref(false)
const showResultDialog = ref(false)
const isAnimating = ref(false)
const diceValue = ref<number | null>(null)
const diceRolling = ref(false)

// Animation state for dolphin movement
const animatedPosition = ref<number>(0) // Current animated position
const isMovingDolphin = ref(false)

// Countdown to next challenge (12 AM UTC)
const nextChallengeCountdown = ref('')
let countdownInterval: ReturnType<typeof setInterval> | null = null
let countdownSecondsRemaining = 0

const updateCountdown = () => {
  // Decrement the remaining seconds
  if (countdownSecondsRemaining <= 0) {
    nextChallengeCountdown.value = 'New challenge available!'
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
    return
  }

  const hours = Math.floor(countdownSecondsRemaining / 3600)
  const minutes = Math.floor((countdownSecondsRemaining % 3600) / 60)
  const seconds = countdownSecondsRemaining % 60

  nextChallengeCountdown.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  countdownSecondsRemaining--
}

const startCountdown = () => {
  // Use server-provided countdown if available
  const serverCountdown = ladderGame.value.grid?.countdown
  if (serverCountdown) {
    // Parse HH:MM:SS format
    const parts = serverCountdown.split(':')
    if (parts.length === 3) {
      countdownSecondsRemaining = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
    }
  } else {
    // Fallback: calculate time until next midnight UTC
    const now = new Date()
    const nextMidnightUTC = new Date(now)
    nextMidnightUTC.setUTCHours(24, 0, 0, 0)
    countdownSecondsRemaining = Math.floor((nextMidnightUTC.getTime() - now.getTime()) / 1000)
  }

  updateCountdown()
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(updateCountdown, 1000)
}

// Field/Stadium options with theme colors for Monument Valley style
const fields = [
  {
    id: 'grass',
    name: 'Grass Field',
    emoji: '🌿',
    color: 'from-emerald-600 to-emerald-800',
    borderColor: 'border-emerald-400',
    bgPattern: 'grass',
    // Theme colors for UI elements
    accentColor: 'rgb(52, 211, 153)', // emerald-400
    accentColorLight: 'rgba(52, 211, 153, 0.3)',
    ladderColor: 'rgb(134, 239, 172)', // green-300
    botColor: 'rgb(252, 165, 165)', // red-300
    cellBorder: 'rgba(52, 211, 153, 0.2)',
    buttonGradient: 'from-emerald-500 to-emerald-600',
    buttonHover: 'from-emerald-400 to-emerald-500',
  },
  {
    id: 'sand',
    name: 'Desert Arena',
    emoji: '🏜️',
    color: 'from-amber-600 to-amber-800',
    borderColor: 'border-amber-400',
    bgPattern: 'sand',
    accentColor: 'rgb(251, 191, 36)', // amber-400
    accentColorLight: 'rgba(251, 191, 36, 0.3)',
    ladderColor: 'rgb(253, 224, 71)', // yellow-300
    botColor: 'rgb(252, 165, 165)', // red-300
    cellBorder: 'rgba(251, 191, 36, 0.2)',
    buttonGradient: 'from-amber-500 to-amber-600',
    buttonHover: 'from-amber-400 to-amber-500',
  },
  {
    id: 'ice',
    name: 'Ice Stadium',
    emoji: '❄️',
    color: 'from-sky-600 to-sky-800',
    borderColor: 'border-sky-400',
    bgPattern: 'ice',
    accentColor: 'rgb(56, 189, 248)', // sky-400
    accentColorLight: 'rgba(56, 189, 248, 0.3)',
    ladderColor: 'rgb(125, 211, 252)', // sky-300
    botColor: 'rgb(253, 186, 116)', // orange-300
    cellBorder: 'rgba(56, 189, 248, 0.2)',
    buttonGradient: 'from-sky-500 to-sky-600',
    buttonHover: 'from-sky-400 to-sky-500',
  },
  {
    id: 'lava',
    name: 'Lava Pit',
    emoji: '🔥',
    color: 'from-rose-600 to-rose-800',
    borderColor: 'border-rose-400',
    bgPattern: 'lava',
    accentColor: 'rgb(251, 113, 133)', // rose-400
    accentColorLight: 'rgba(251, 113, 133, 0.3)',
    ladderColor: 'rgb(253, 224, 71)', // yellow-300
    botColor: 'rgb(253, 164, 175)', // rose-300
    cellBorder: 'rgba(251, 113, 133, 0.2)',
    buttonGradient: 'from-rose-500 to-rose-600',
    buttonHover: 'from-rose-400 to-rose-500',
  },
]

// Color palette for ladder/pass connections
const ladderColors = [
  { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-400', emoji: '🟩' },
  { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-400', emoji: '🟧' },
  { bg: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-400', emoji: '🟪' },
  { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-400', emoji: '🟦' },
  { bg: 'bg-yellow-500', border: 'border-yellow-400', text: 'text-yellow-400', emoji: '🟨' },
  { bg: 'bg-pink-500', border: 'border-pink-400', text: 'text-pink-400', emoji: '🩷' },
  { bg: 'bg-cyan-500', border: 'border-cyan-400', text: 'text-cyan-400', emoji: '🩵' },
  { bg: 'bg-lime-500', border: 'border-lime-400', text: 'text-lime-400', emoji: '🟩' },
]

// Game board ref for scrolling
const gameBoardRef = ref<HTMLElement | null>(null)
const gridContainerRef = ref<HTMLElement | null>(null)

// Computed
const ladderGame = computed(() => globalStore.ladderGame)
const currentPosition = computed(() => ladderGame.value.position?.start ?? 0)
const isRolling = computed(() => ladderGame.value.isRolling)
const lastRoll = computed(() => ladderGame.value.lastRoll)
const gridCells = computed(() => ladderGame.value.grid?.grid ?? [])
const isFinished = computed(() => ladderGame.value.position?.finished ?? false)

// Build ladder color mapping (source cell -> color index)
const ladderColorMap = computed(() => {
  const map = new Map<number, number>()
  let colorIndex = 0

  gridCells.value.forEach((cell: any) => {
    if (cell.type === 'pass') {
      // Assign same color to source and destination
      map.set(cell.cell, colorIndex)
      map.set(cell.value, colorIndex)
      colorIndex = (colorIndex + 1) % ladderColors.length
    }
  })

  return map
})

const botColorMap = computed(() => {
  const map = new Map<number, number>()
  let colorIndex = 0

  gridCells.value.forEach((cell: any) => {
    if (cell.type === 'bot') {
      map.set(cell.cell, colorIndex)
      map.set(cell.value, colorIndex)
      colorIndex = (colorIndex + 1) % 4 // Simple modulo for grouping
    }
  })

  return map
})

// Get selected field info
const selectedField = computed(() => {
  return fields.find(f => f.id === ladderGame.value.selectedField) || fields[0]
})

// Generate connection lines data for ladders and bots
const connectionLines = computed(() => {
  const lines: Array<{
    from: number
    to: number
    type: 'ladder' | 'bot'
    colorIndex: number
  }> = []

  gridCells.value.forEach((cell: any) => {
    if (cell.type === 'pass') {
      const colorIdx = ladderColorMap.value.get(cell.cell) ?? 0
      lines.push({
        from: cell.cell,
        to: cell.value,
        type: 'ladder',
        colorIndex: colorIdx
      })
    } else if (cell.type === 'bot') {
      const colorIdx = botColorMap.value.get(cell.cell) ?? 0
      lines.push({
        from: cell.cell,
        to: cell.value,
        type: 'bot',
        colorIndex: colorIdx
      })
    }
  })

  return lines
})

// Get cell position in grid (row, col) from cell number
const getCellGridPosition = (cellNumber: number): { row: number; col: number } => {
  // Cell 100 is top-left, cell 1 is bottom-right (snake pattern)
  const rowFromTop = Math.floor((100 - cellNumber) / 10)
  const posInRow = (100 - cellNumber) % 10

  // Alternate direction for snake pattern
  const col = rowFromTop % 2 === 0 ? posInRow : 9 - posInRow

  return { row: rowFromTop, col }
}

// Get cell type info with field-themed colors
// For pass cells: value = destination cell (ladder goes UP)
// For bot cells: value = destination cell (snake goes DOWN)
const getCellInfo = (cell: any, cellNumber: number) => {
  // Check if this cell is a ladder destination (not source)
  const isLadderDestination = gridCells.value.some((c: any) => c.type === 'pass' && c.value === cellNumber)
  const ladderSourceCell = gridCells.value.find((c: any) => c.type === 'pass' && c.value === cellNumber)

  // Check if this cell is a bot destination
  const isBotDestination = gridCells.value.some((c: any) => c.type === 'bot' && c.value === cellNumber)
  const botSourceCell = gridCells.value.find((c: any) => c.type === 'bot' && c.value === cellNumber)

  switch (cell?.type) {
    case 'pass':
      // Ladder source - goes UP to cell.value (use ⚽ emoji)
      const ladderDest = cell.value
      const colorIdx = ladderColorMap.value.get(cellNumber) ?? 0
      return {
        emoji: '⚽',
        label: `→${ladderDest}`,
        destination: ladderDest,
        isLadder: true,
        colorIndex: colorIdx,
        class: 'cell-pass',
        glow: 'shadow-[0_0_15px_rgba(34,197,94,0.6)]'
      }
    case 'bot':
      // Bot - goes DOWN to cell.value (use 🤖 emoji)
      const botDest = cell.value
      const botColorIdx = botColorMap.value.get(cellNumber) ?? 0
      return {
        emoji: '🤖',
        label: `→${botDest}`,
        destination: botDest,
        isBot: true,
        colorIndex: botColorIdx,
        class: 'cell-bot',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.6)]'
      }
    case 'reward':
      return {
        emoji: '🎁',
        label: `+${cell.value}`,
        destination: null,
        class: 'cell-reward',
        glow: 'shadow-[0_0_15px_rgba(234,179,8,0.6)]'
      }
    default:
      // Check if this is a ladder destination cell - NO emoji, only SVG line endpoint shows here
      if (isLadderDestination && ladderSourceCell) {
        const destColorIdx = ladderColorMap.value.get(cellNumber) ?? 0
        return {
          emoji: '', // No emoji on destination - line endpoint circle is enough
          label: `←${ladderSourceCell.cell}`,
          destination: null,
          isLadderDest: true,
          sourceCell: ladderSourceCell.cell,
          colorIndex: destColorIdx,
          class: 'cell-ladder-dest',
          glow: ''
        }
      }
      // Check if this is a bot destination cell - NO emoji, only SVG line endpoint shows here
      if (isBotDestination && botSourceCell) {
        const destBotColorIdx = botColorMap.value.get(cellNumber) ?? 0
        return {
          emoji: '', // No emoji on destination - line endpoint circle is enough
          label: `←${botSourceCell.cell}`,
          destination: null,
          isBotDest: true,
          sourceCell: botSourceCell.cell,
          colorIndex: destBotColorIdx,
          class: 'cell-bot-dest',
          glow: ''
        }
      }
      return {
        emoji: '',
        label: '',
        destination: null,
        class: 'cell-empty',
        glow: ''
      }
  }
}

// Row-based grid for snake pattern (bottom to top, alternating direction)
const gridRows = computed(() => {
  const rows = []
  for (let row = 0; row < 10; row++) {
    const rowCells = []
    const startNum = 100 - (row * 10)

    for (let col = 0; col < 10; col++) {
      // Alternate direction for snake pattern
      const cellNum = row % 2 === 0
        ? startNum - col
        : startNum - 9 + col

      const gridCell = gridCells.value.find((c: any) => c.cell === cellNum)
      const cellInfo = getCellInfo(gridCell, cellNum)
      rowCells.push({
        number: cellNum,
        ...cellInfo,
        rawCell: gridCell
      })
    }
    rows.push(rowCells)
  }
  return rows
})

// Dice faces using unicode
const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

// Initialize game
const initializeGame = async () => {
  try {
    gamePhase.value = 'loading'

    // Ensure user is authenticated
    if (!globalStore.userProfile || !globalStore.apiToken) {
      router.push('/')
      return
    }

    // Check if there's an existing game
    const result = await globalStore.joinLadderGame()

    if (result && result.ok) {
      // Check if user already finished today's challenge
      if (ladderGame.value.position?.finished) {
        // User already completed today's challenge - show result
        gamePhase.value = 'finished'
        animatedPosition.value = currentPosition.value
        showResultDialog.value = true
        startCountdown()
        return
      }

      // Load players
      await globalStore.getLadderPlayers()

      // Initialize animated position
      animatedPosition.value = currentPosition.value

      if (ladderGame.value.selectedField) {
        // Resume existing game
        gamePhase.value = 'playing'
        setTimeout(() => scrollToPlayer(), 500)
      } else {
        // Need to select field
        gamePhase.value = 'field-select'
      }
    } else {
      // New game - select field
      gamePhase.value = 'field-select'
    }
  } catch (error) {
    console.error('Failed to initialize game:', error)
    toast.error('Failed to load game')
    gamePhase.value = 'field-select'
  }
}

// Select field and start game
const selectField = async (fieldId: string) => {
  try {
    globalStore.setLadderField(fieldId)

    // Join game if not already joined
    const result = await globalStore.joinLadderGame()

    if (result && result.ok) {
      // Check if user already finished today's challenge
      if (ladderGame.value.position?.finished) {
        // User already completed today's challenge - show result
        gamePhase.value = 'finished'
        animatedPosition.value = currentPosition.value
        showResultDialog.value = true
        startCountdown()
        return
      }

      await globalStore.getLadderPlayers()

      // Initialize animated position to current position
      animatedPosition.value = currentPosition.value

      gamePhase.value = 'playing'

      // Scroll to player position after a short delay
      setTimeout(() => scrollToPlayer(), 500)

      toast.success('Game started!')
    } else {
      toast.error('Failed to join game')
    }
  } catch (error) {
    console.error('Failed to start game:', error)
    toast.error('Failed to start game')
  }
}

// Animate dolphin moving step by step
const animateDolphinMovement = async (from: number, to: number, event: string): Promise<void> => {
  return new Promise((resolve) => {
    isMovingDolphin.value = true

    // Determine movement direction and steps
    const steps: number[] = []
    let specialCellIndex = -1 // Track where the special cell (bot/pass) is in the steps

    if (event === 'pass' || event === 'bot') {
      // For ladder/bot, first move normally to the trigger cell, then jump to destination
      const triggerCell = from + diceValue.value! // The cell where user lands (bot or pass cell)

      // Move step by step to the trigger cell first
      for (let i = from + 1; i <= Math.min(triggerCell, 100); i++) {
        steps.push(i)
      }

      // Mark where the special cell is (last step before the jump)
      specialCellIndex = steps.length - 1

      // Then add the final destination (ladder up or bot down)
      if (steps[steps.length - 1] !== to) {
        steps.push(to)
      }
    } else {
      // Normal move - step by step
      const isGoingUp = to > from
      if (isGoingUp) {
        for (let i = from + 1; i <= to; i++) steps.push(i)
      } else {
        for (let i = from - 1; i >= to; i--) steps.push(i)
      }
    }

    if (steps.length === 0) {
      isMovingDolphin.value = false
      resolve()
      return
    }

    let stepIndex = 0
    const processStep = () => {
      if (stepIndex >= steps.length) {
        isMovingDolphin.value = false
        animatedPosition.value = to
        resolve()
        return
      }

      const nextCell = steps[stepIndex]
      animatedPosition.value = nextCell

      // Scroll to keep dolphin visible
      const cellEl = gameBoardRef.value?.querySelector(`[data-cell="${nextCell}"]`)
      if (cellEl) {
        cellEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      stepIndex++

      // Check if we just landed on the special cell (bot/pass trigger)
      // If so, pause for 1 second so user can see they landed on it
      if (specialCellIndex >= 0 && stepIndex === specialCellIndex + 1 && stepIndex < steps.length) {
        // Show toast immediately when landing on special cell
        if (event === 'pass') {
          toast.success('⚽ Pass! Climbing up...', { duration: 2000 })
        } else if (event === 'bot') {
          toast.error('🤖 Bot caught you! Sliding down...', { duration: 2000 })
        }
        // Wait 1 second before moving to destination
        setTimeout(processStep, 1000)
      } else {
        // Normal step timing
        setTimeout(processStep, 200)
      }
    }

    // Start the animation
    processStep()
  })
}

// Roll dice
const rollDice = async () => {
  if (isRolling.value || isAnimating.value || isFinished.value || diceRolling.value) return

  try {
    diceRolling.value = true
    isAnimating.value = true

    // IMPORTANT: Capture the current position BEFORE any state changes
    const fromPosition = currentPosition.value

    // Set animatedPosition to current position and start animation mode BEFORE API call
    // This ensures the dolphin stays at the current position even when store updates
    animatedPosition.value = fromPosition
    isMovingDolphin.value = true

    // Animate dice rolling
    let rollCount = 0
    const rollAnimation = setInterval(() => {
      diceValue.value = Math.floor(Math.random() * 6) + 1
      rollCount++
    }, 80)

    // Make API call - this will update the store's position.start immediately
    const result = await globalStore.rollLadderDice()

    // Continue dice animation for at least 1 second
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        clearInterval(rollAnimation)
        diceRolling.value = false

        // Always show the actual dice value from the response (even if roll was invalid)
        if (result && result.dice) {
          diceValue.value = result.dice
        }
        resolve()
      }, Math.max(1000, 1000 - rollCount * 80))
    })

    if (result && result.ok) {
      // Now animate the dolphin movement AFTER dice is shown
      // The dolphin is still showing at fromPosition due to isMovingDolphin being true
      await animateDolphinMovement(fromPosition, result.to, result.event)

      // Show event toast after movement
      animateMovementToast(result)

      // Check if finished
      if (result.finished) {
        setTimeout(() => {
          gamePhase.value = 'finished'
          showResultDialog.value = true
          startCountdown() // Start countdown to next challenge
        }, 500)
      }
    } else {
      toast.error(result?.reason || 'Failed to roll dice')
      // Reset animation state on error
      isMovingDolphin.value = false
    }

    isAnimating.value = false
  } catch (error) {
    console.error('Failed to roll dice:', error)
    toast.error('Failed to roll dice')
    isAnimating.value = false
    diceRolling.value = false
    isMovingDolphin.value = false
  }
}

// Show toast after movement animation (only for rewards, pass/bot toasts are shown during animation)
const animateMovementToast = (result: any) => {
  // Pass and bot toasts are now shown during animation when landing on the cell
  // Only show reward toast here
  if (result.reward) {
    toast.success(`🎁 Reward: +${result.reward.amount} ${result.reward.type}!`, { duration: 3000 })
  }
}

// Scroll to player position
const scrollToPlayer = () => {
  if (!gameBoardRef.value) return

  const playerCell = gameBoardRef.value.querySelector(`[data-cell="${currentPosition.value}"]`)
  if (playerCell) {
    playerCell.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// Navigation
const confirmGoBack = () => {
  showBackDialog.value = true
}

const goBackToHome = () => {
  globalStore.intentionallyLeftGame = true
  router.push('/')
}

onMounted(() => {
  initializeGame()
})

onUnmounted(() => {
  // Clean up countdown interval
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
})

// Watch for position changes to refresh players
watch(currentPosition, () => {
  globalStore.getLadderPlayers()
})
</script>

<template>
  <div class="min-h-screen w-full flex flex-col overflow-hidden" :class="`bg-gradient-to-b ${selectedField.color}`">
    <!-- Animated background pattern -->
    <div class="absolute inset-0 opacity-20 pointer-events-none">
      <div class="absolute inset-0 bg-pattern animate-float"></div>
    </div>

    <!-- Back button - Monument Valley style -->
    <div class="absolute top-4 left-4 z-20">
      <Button @click="confirmGoBack" size="icon" class="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-xl shadow-[0_4px_12px_-4px_rgba(0,0,0,0.2)] transition-all duration-200">
        <ArrowLeft class="w-4 h-4" />
      </Button>
    </div>

    <!-- Loading state - Monument Valley style -->
    <div v-if="gamePhase === 'loading'" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="relative w-36 h-36 mx-auto mb-8">
          <!-- Soft glowing background -->
          <div class="absolute inset-0 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <!-- Animated dice with soft shadow -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="relative">
              <span class="text-7xl drop-shadow-[0_4px_20px_rgba(255,255,255,0.3)] animate-float">🎲</span>
            </div>
          </div>
          <!-- Soft spinning ring -->
          <div class="absolute inset-0 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" style="animation-duration: 1.5s"></div>
        </div>
        <h2 class="text-2xl font-semibold text-white tracking-wide mb-3">LOADING</h2>
        <p class="text-white/60 text-sm">Preparing the game board...</p>
        <div class="flex justify-center gap-2 mt-6">
          <span class="w-2 h-2 bg-white/80 rounded-full animate-pulse" style="animation-delay: 0ms"></span>
          <span class="w-2 h-2 bg-white/80 rounded-full animate-pulse" style="animation-delay: 200ms"></span>
          <span class="w-2 h-2 bg-white/80 rounded-full animate-pulse" style="animation-delay: 400ms"></span>
        </div>
      </div>
    </div>

    <!-- Field Selection - Monument Valley style -->
    <div v-else-if="gamePhase === 'field-select'" class="flex-1 flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <Card class="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] rounded-3xl">
          <CardContent class="p-8">
            <div class="text-center mb-8">
              <div class="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span class="text-4xl">🎮</span>
              </div>
              <h2 class="text-2xl font-semibold text-white tracking-wide mb-2">
                Select Field
              </h2>
              <p class="text-white/50 text-sm">
                Choose your battlefield for the ladder game
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="field in fields"
                :key="field.id"
                @click="selectField(field.id)"
                class="group p-5 rounded-2xl border border-white/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] backdrop-blur-sm"
                :class="[`bg-gradient-to-br ${field.color}`, 'hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] hover:border-white/40']"
              >
                <div class="w-14 h-14 mx-auto mb-3 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                  <span class="text-3xl">{{ field.emoji }}</span>
                </div>
                <div class="text-white font-medium text-sm">{{ field.name }}</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Game Board -->
    <div v-else-if="gamePhase === 'playing'" class="flex-1 flex flex-col overflow-hidden relative mt-10">
      <!-- Scrollable Game Board -->
      <div
        ref="gameBoardRef"
        class="flex-1 overflow-hidden p-4"
      >
        <div class="max-w-lg mx-auto">
          <!-- Header - Finish line and roll count -->
          <div class="mb-4 p-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-md border border-amber-400/30 rounded-2xl relative overflow-hidden shadow-[0_4px_24px_-8px_rgba(251,191,36,0.3)]">
            <div class="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
            <div class="relative z-10 flex items-center justify-between">
              <!-- Roll count -->
              <div class="flex items-center gap-2">
                <span class="text-2xl">🎲</span>
                <div class="text-left">
                  <p class="text-amber-200/60 text-xs">Rolls</p>
                  <p class="text-xl font-semibold text-white">{{ ladderGame.position?.rolls ?? 0 }}</p>
                </div>
              </div>
              <!-- Finish line -->
              <span class="text-lg font-semibold text-amber-300 tracking-wide">🏆 FINISH 🏆</span>
              <!-- Current position -->
              <div class="flex items-center gap-2">
                <div class="text-right">
                  <p class="text-amber-200/60 text-xs">Position</p>
                  <p class="text-xl font-semibold text-white">{{ currentPosition }}/100</p>
                </div>
                <span class="text-2xl">📍</span>
              </div>
            </div>
          </div>

          <!-- Grid rows (top to bottom, which is 100 to 1) -->
          <div ref="gridContainerRef" class="grid-container">
            <!-- Grid wrapper with SVG overlay -->
            <div class="relative">
              <!-- SVG overlay for connection lines - using field theme colors -->
              <svg class="absolute inset-0 w-full h-full pointer-events-none z-10">
                <!-- Connection lines -->
                <g v-for="line in connectionLines" :key="`${line.from}-${line.to}`">
                  <line
                    :x1="`${(getCellGridPosition(line.from).col + 0.5) * 10}%`"
                    :y1="`${(getCellGridPosition(line.from).row + 0.5) * 10}%`"
                    :x2="`${(getCellGridPosition(line.to).col + 0.5) * 10}%`"
                    :y2="`${(getCellGridPosition(line.to).row + 0.5) * 10}%`"
                    :stroke="line.type === 'ladder' ? selectedField.ladderColor : selectedField.botColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    :stroke-dasharray="line.type === 'bot' ? '8,4' : 'none'"
                    opacity="0.9"
                  />
                  <!-- Circle at destination -->
                  <circle
                    :cx="`${(getCellGridPosition(line.to).col + 0.5) * 10}%`"
                    :cy="`${(getCellGridPosition(line.to).row + 0.5) * 10}%`"
                    r="5"
                    :fill="line.type === 'ladder' ? selectedField.ladderColor : selectedField.botColor"
                    opacity="1"
                  />
                </g>
              </svg>
              <!-- Grid rows -->
              <div
              v-for="(row, rowIndex) in gridRows"
              :key="rowIndex"
              class="flex"
            >
              <div
                v-for="cell in row"
                :key="cell.number"
                :data-cell="cell.number"
                class="relative w-[10%] aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-300 group backdrop-blur-sm"
                :style="{
                  border: `1px solid ${selectedField.cellBorder}`,
                  boxShadow: (isMovingDolphin ? animatedPosition : currentPosition) === cell.number
                    ? `0 0 20px ${selectedField.accentColorLight}, inset 0 1px 0 rgba(255,255,255,0.1)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }"
                :class="[
                  cell.class,
                  // Player position styling - using field accent color
                  (isMovingDolphin ? animatedPosition : currentPosition) === cell.number
                    ? (cell.number === 100 ? 'ring-2 ring-yellow-400/60 scale-110 z-20 animate-pulse-slow' : 'ring-2 scale-110 z-20 animate-pulse-slow')
                    : 'hover:scale-105 hover:z-10',
                  // Ladder/bot cell highlighting with softer borders
                  (cell.isLadder || cell.isLadderDest) ? 'cell-ladder-themed' : '',
                  (cell.isBot || cell.isBotDest) ? 'cell-bot-themed' : '',
                  // Gold finish cell
                  cell.number === 100 ? 'cell-finish' : ''
                ]"
              >
                <!-- Cell number -->
                <span class="absolute top-0.5 left-1 text-[9px] text-white/50 font-medium">{{ cell.number }}</span>

                <!-- Cell content (emoji) -->
                <span v-if="cell.emoji && (isMovingDolphin ? animatedPosition : currentPosition) !== cell.number" class="text-sm sm:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{{ cell.emoji }}</span>

                <!-- Player marker (dolphin) -->
                <div
                  v-if="(isMovingDolphin ? animatedPosition : currentPosition) === cell.number"
                  class="absolute inset-0 flex items-center justify-center"
                >
                  <span
                    class="text-xl sm:text-2xl drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)] transition-transform duration-200"
                    :class="isMovingDolphin ? 'scale-110' : 'animate-bounce'"
                  >🐬</span>
                </div>

                <!-- Hover tooltip for special cells - Monument Valley glassmorphism -->
                <div
                  v-if="cell.destination || cell.isLadderDest"
                  class="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white text-[9px] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 pointer-events-none border border-white/20 shadow-lg"
                >
                  <template v-if="cell.isLadder">⚽ Pass up to {{ cell.destination }}</template>
                  <template v-else-if="cell.isBot">🤖 Bot to {{ cell.destination }}</template>
                  <template v-else-if="cell.isLadderDest">⚽ From {{ cell.label?.replace('←', '') }}</template>
                </div>
              </div>
            </div>
            </div>
          </div>

          <!-- Player starting position indicator (when at position 0) - Monument Valley style -->
          <div v-if="currentPosition === 0" class="mt-4 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-center shadow-[0_4px_20px_-8px_rgba(0,0,0,0.2)]">
            <div class="flex items-center justify-center gap-3">
              <span class="text-2xl animate-bounce drop-shadow-lg">🐬</span>
              <span class="text-white font-medium">You are at the starting position</span>
            </div>
            <p class="text-white/50 text-sm mt-2">Roll the dice to begin!</p>
          </div>
        </div>
      </div>

      <!-- Bottom Controls - Monument Valley floating glassmorphism style -->
      <div class="flex-shrink-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div class="max-w-lg mx-auto">
          <!-- Dice and Roll button in one row - glassmorphism container -->
          <div class="flex items-center gap-4 bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)]">
            <!-- Dice display - soft rounded with field theme glow -->
            <div
              class="w-20 h-20 flex-shrink-0 bg-white/95 rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300"
              :style="{
                boxShadow: `0 4px 20px -4px ${selectedField.accentColorLight}, 0 8px 16px -8px rgba(0,0,0,0.2)`,
              }"
              :class="{ 'animate-shake': diceRolling }"
            >
              <span class="text-5xl" :class="{ 'animate-spin-fast': diceRolling }">
                {{ diceValue ? diceFaces[diceValue - 1] : '🎲' }}
              </span>
            </div>

            <!-- Roll info and button -->
            <div class="flex-1">
              <!-- Last roll info - softer styling -->
              <div v-if="lastRoll && !diceRolling" class="text-sm mb-3">
                <span class="text-white/50">Moved: </span>
                <span class="text-white font-semibold">{{ lastRoll.from }} → {{ lastRoll.to }}</span>
                <span v-if="lastRoll.event !== 'move'" class="ml-2 text-xs px-2.5 py-1 rounded-full backdrop-blur-sm" :class="{
                  'bg-white/10 text-green-300': lastRoll.event === 'pass',
                  'bg-white/10 text-red-300': lastRoll.event === 'bot'
                }">
                  {{ lastRoll.event === 'pass' ? '⬆️ Pass!' : '⬇️ Bot!' }}
                </span>
              </div>
              <div v-else-if="diceRolling" class="text-sm mb-3">
                <span class="text-white/70 animate-pulse">Rolling...</span>
              </div>

              <!-- Roll button - using field theme gradient -->
              <Button
                @click="rollDice"
                :disabled="isRolling || isAnimating || isFinished || diceRolling"
                :class="[
                  'w-full rounded-2xl text-white font-semibold py-3 text-base transition-all duration-300',
                  `bg-gradient-to-r ${selectedField.buttonGradient}`,
                  `hover:bg-gradient-to-r hover:${selectedField.buttonHover}`,
                  'disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50',
                  'border border-white/20',
                ]"
                :style="{
                  boxShadow: !isRolling && !isAnimating && !isFinished && !diceRolling
                    ? `0 4px 20px -4px ${selectedField.accentColorLight}`
                    : 'none',
                }"
                size="lg"
              >
                <Loader2 v-if="diceRolling" class="w-5 h-5 mr-2 animate-spin" />
                <Dices v-else class="w-5 h-5 mr-2" />
                {{ diceRolling ? 'ROLLING...' : isFinished ? 'FINISHED!' : 'ROLL DICE' }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Result Dialog - Monument Valley glassmorphism style -->
    <Dialog v-model:open="showResultDialog">
      <DialogContent class="max-w-md bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-amber-400/20 text-white shadow-[0_8px_48px_-12px_rgba(251,191,36,0.3)] rounded-3xl">
        <DialogHeader>
          <DialogTitle class="text-3xl font-semibold text-center mb-4 text-amber-300 tracking-wide">
            🎉 YOU FINISHED! 🎉
          </DialogTitle>
          <DialogDescription class="text-center">
            <div class="space-y-4 mt-4">
              <div class="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
                <p class="text-white/50 text-sm mb-2">Total Rolls</p>
                <p class="text-5xl font-semibold text-cyan-400">{{ ladderGame.position?.rolls ?? 0 }}</p>
              </div>

              <div class="bg-gradient-to-r from-emerald-600/20 to-green-600/20 backdrop-blur-sm border border-emerald-400/20 p-4 rounded-2xl">
                <p class="text-emerald-200/70 text-sm mb-2">Status</p>
                <p class="text-xl font-semibold text-emerald-400">🏆 Completed!</p>
              </div>

              <!-- Next Challenge Countdown -->
              <div class="bg-gradient-to-r from-violet-600/20 to-purple-600/20 backdrop-blur-sm border border-violet-400/20 p-4 rounded-2xl">
                <p class="text-violet-200/70 text-sm mb-2">⏰ Next Challenge In</p>
                <p class="text-xl font-semibold text-violet-400 font-mono">{{ nextChallengeCountdown }}</p>
                <p class="text-white/40 text-xs mt-2">New challenge daily at 12:00 AM UTC</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="mt-6">
          <Button
            @click="goBackToHome"
            :class="[
              'w-full rounded-2xl text-white font-semibold py-3 transition-all duration-300',
              `bg-gradient-to-r ${selectedField.buttonGradient}`,
              'border border-white/20',
            ]"
            :style="{
              boxShadow: `0 4px 20px -4px ${selectedField.accentColorLight}`,
            }"
          >
            GO HOME
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Back Confirmation Dialog - Monument Valley style -->
    <Dialog v-model:open="showBackDialog">
      <DialogContent class="bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle class="text-white font-semibold">Leave Game?</DialogTitle>
          <DialogDescription class="text-white/50">
            Your progress will be saved. You can continue later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="flex-col sm:flex-row gap-3 mt-4">
          <Button variant="outline" @click="showBackDialog = false" class="flex-1 rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white">
            Stay
          </Button>
          <Button @click="goBackToHome" class="flex-1 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 border border-white/20 text-white">
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* Monument Valley Design System - Soft, rounded, pastel aesthetics */

/* Cell styles - soft gradients with rounded corners */
.cell-empty {
  background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
}

.cell-pass {
  background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%);
}

.cell-bot {
  background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%);
}

.cell-reward {
  background: linear-gradient(135deg, rgba(251,191,36,0.25) 0%, rgba(251,191,36,0.12) 100%);
}

.cell-ladder-dest {
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
}

.cell-bot-dest {
  background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%);
}

/* Themed cell borders - applied via inline styles with field colors */
.cell-ladder-themed {
  border-width: 2px !important;
  border-style: solid !important;
}

.cell-bot-themed {
  border-width: 2px !important;
  border-style: solid !important;
}

/* Finish cell (cell 100) - soft gold styling */
.cell-finish {
  background: linear-gradient(135deg, rgba(251,191,36,0.3) 0%, rgba(251,191,36,0.15) 100%);
}

/* Animations */
@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  10% { transform: translateX(-5px) rotate(-5deg); }
  20% { transform: translateX(5px) rotate(5deg); }
  30% { transform: translateX(-5px) rotate(-5deg); }
  40% { transform: translateX(5px) rotate(5deg); }
  50% { transform: translateX(-5px) rotate(-5deg); }
  60% { transform: translateX(5px) rotate(5deg); }
  70% { transform: translateX(-5px) rotate(-5deg); }
  80% { transform: translateX(5px) rotate(5deg); }
  90% { transform: translateX(-5px) rotate(-5deg); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out infinite;
}

@keyframes spin-fast {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-fast {
  animation: spin-fast 0.2s linear infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.02); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 1; box-shadow: 0 0 20px rgba(6,182,212,0.6); }
  50% { opacity: 0.9; box-shadow: 0 0 40px rgba(6,182,212,0.8); }
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}

/* Background pattern */
.bg-pattern {
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2%, transparent 2%),
    radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 2%, transparent 2%);
  background-size: 60px 60px;
}

/* Custom scrollbar - soft rounded */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Grid container - Monument Valley glassmorphism */
.grid-container {
  background: rgba(255,255,255,0.05);
  border-radius: 1rem;
  padding: 6px;
  box-shadow:
    0 4px 24px -8px rgba(0,0,0,0.2),
    inset 0 1px 0 rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(8px);
}
</style>
