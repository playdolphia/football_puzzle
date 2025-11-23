<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Dices, Users, Loader2 } from 'lucide-vue-next'
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

// Field/Stadium options
const fields = [
  { id: 'grass', name: 'Grass Field', emoji: '🌿', color: 'from-green-600 to-green-800', borderColor: 'border-green-400', bgPattern: 'grass' },
  { id: 'sand', name: 'Desert Arena', emoji: '🏜️', color: 'from-amber-600 to-amber-800', borderColor: 'border-amber-400', bgPattern: 'sand' },
  { id: 'ice', name: 'Ice Stadium', emoji: '❄️', color: 'from-cyan-600 to-cyan-800', borderColor: 'border-cyan-400', bgPattern: 'ice' },
  { id: 'lava', name: 'Lava Pit', emoji: '🔥', color: 'from-red-600 to-red-800', borderColor: 'border-red-400', bgPattern: 'lava' },
]

// Game board ref for scrolling
const gameBoardRef = ref<HTMLElement | null>(null)

// Computed
const ladderGame = computed(() => globalStore.ladderGame)
const currentPosition = computed(() => ladderGame.value.position?.start ?? 0)
const isRolling = computed(() => ladderGame.value.isRolling)
const lastRoll = computed(() => ladderGame.value.lastRoll)
const gridCells = computed(() => ladderGame.value.grid?.grid ?? [])
const players = computed(() => ladderGame.value.players)
const isFinished = computed(() => ladderGame.value.position?.finished ?? false)

// Get selected field info
const selectedField = computed(() => {
  return fields.find(f => f.id === ladderGame.value.selectedField) || fields[0]
})

// Get cell type info with field-themed colors
// For pass cells: value = destination cell (ladder goes UP)
// For bot cells: value = destination cell (snake goes DOWN)
const getCellInfo = (cell: any, cellNumber: number) => {
  switch (cell?.type) {
    case 'pass':
      // Ladder - goes UP to cell.value
      const ladderDest = cell.value
      return {
        emoji: '🪜',
        label: `→${ladderDest}`,
        destination: ladderDest,
        isLadder: true,
        class: 'cell-pass',
        glow: 'shadow-[0_0_15px_rgba(34,197,94,0.6)]'
      }
    case 'bot':
      // Snake/Bot - goes DOWN to cell.value
      const snakeDest = cell.value
      return {
        emoji: '🐍',
        label: `→${snakeDest}`,
        destination: snakeDest,
        isSnake: true,
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
      // Load players
      await globalStore.getLadderPlayers()

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
      await globalStore.getLadderPlayers()
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

// Roll dice
const rollDice = async () => {
  if (isRolling.value || isAnimating.value || isFinished.value || diceRolling.value) return

  try {
    diceRolling.value = true
    isAnimating.value = true

    // Animate dice rolling
    let rollCount = 0
    const rollAnimation = setInterval(() => {
      diceValue.value = Math.floor(Math.random() * 6) + 1
      rollCount++
    }, 80)

    // Make API call
    const result = await globalStore.rollLadderDice()

    // Continue animation for at least 1 second
    setTimeout(() => {
      clearInterval(rollAnimation)
      diceRolling.value = false

      if (result && result.ok) {
        diceValue.value = result.dice

        // Animate movement
        animateMovement(result)
      } else {
        toast.error(result?.reason || 'Failed to roll dice')
        isAnimating.value = false
      }
    }, Math.max(1000, 1000 - rollCount * 80))
  } catch (error) {
    console.error('Failed to roll dice:', error)
    toast.error('Failed to roll dice')
    isAnimating.value = false
    diceRolling.value = false
  }
}

// Animate player movement
const animateMovement = async (result: any) => {
  // Show event toast
  if (result.event === 'pass') {
    toast.success('⚽ Pass! You climbed up!', { duration: 3000 })
  } else if (result.event === 'bot') {
    toast.error('🤖 Bot caught you! Sliding down...', { duration: 3000 })
  } else if (result.reward) {
    toast.success(`🎁 Reward: +${result.reward.amount} ${result.reward.type}!`, { duration: 3000 })
  }

  // Scroll to new position
  setTimeout(() => {
    scrollToPlayer()
    isAnimating.value = false

    // Check if finished
    if (result.finished) {
      setTimeout(() => {
        gamePhase.value = 'finished'
        showResultDialog.value = true
      }, 500)
    }
  }, 600)
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

const playAgain = () => {
  showResultDialog.value = false
  globalStore.resetLadderGame()
  gamePhase.value = 'field-select'
}

onMounted(() => {
  initializeGame()
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

    <!-- Back button -->
    <div class="absolute top-4 left-4 z-20">
      <Button @click="confirmGoBack" size="sm" class="pixel-corners bg-black/50 hover:bg-black/70 border-2 border-white/30 backdrop-blur-sm">
        <ArrowLeft class="w-4 h-4" />
        <span class="hidden sm:inline ml-1">Back</span>
      </Button>
    </div>

    <!-- Loading state - Custom animated loader -->
    <div v-if="gamePhase === 'loading'" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="relative w-32 h-32 mx-auto mb-6">
          <!-- Animated dice -->
          <div class="absolute inset-0 flex items-center justify-center animate-bounce">
            <span class="text-7xl">🎲</span>
          </div>
          <!-- Spinning ring -->
          <div class="absolute inset-0 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
        <h2 class="text-2xl font-bold text-white pixel-text mb-2">LOADING</h2>
        <p class="text-white/70">Preparing the game board...</p>
        <div class="flex justify-center gap-1 mt-4">
          <span class="w-2 h-2 bg-white rounded-full animate-pulse" style="animation-delay: 0ms"></span>
          <span class="w-2 h-2 bg-white rounded-full animate-pulse" style="animation-delay: 150ms"></span>
          <span class="w-2 h-2 bg-white rounded-full animate-pulse" style="animation-delay: 300ms"></span>
        </div>
      </div>
    </div>

    <!-- Field Selection -->
    <div v-else-if="gamePhase === 'field-select'" class="flex-1 flex items-center justify-center p-4">
      <div class="max-w-lg w-full">
        <Card class="pixel-corners bg-black/60 backdrop-blur-md border-4 border-white/20 shadow-2xl">
          <CardContent class="p-8">
            <div class="text-center mb-8">
              <span class="text-6xl mb-4 block animate-bounce">🎮</span>
              <h2 class="text-3xl font-bold text-white pixel-text mb-2">
                SELECT FIELD
              </h2>
              <p class="text-white/60 text-sm">
                Choose your battlefield for the ladder game
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <button
                v-for="field in fields"
                :key="field.id"
                @click="selectField(field.id)"
                class="group pixel-corners p-6 border-4 transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95"
                :class="[`bg-gradient-to-br ${field.color}`, field.borderColor, 'hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]']"
              >
                <div class="text-5xl mb-3 group-hover:animate-bounce transition-transform">{{ field.emoji }}</div>
                <div class="text-white font-bold text-sm pixel-text">{{ field.name }}</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Game Board -->
    <div v-else-if="gamePhase === 'playing'" class="flex-1 flex flex-col overflow-hidden relative">
      <!-- Top HUD - Glassmorphism style -->
      <div class="flex-shrink-0 p-3 bg-black/40 backdrop-blur-md border-b-2 border-white/10 z-10">
        <div class="flex items-center justify-between max-w-lg mx-auto">
          <div class="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <span class="text-white/60 text-xs">📍</span>
            <span class="text-white font-bold">{{ currentPosition }}<span class="text-white/50">/100</span></span>
          </div>
          <div class="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <span class="text-white/60 text-xs">🎲</span>
            <span class="text-white font-bold">{{ ladderGame.position?.rolls ?? 0 }}</span>
          </div>
          <div class="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <Users class="w-4 h-4 text-white/60" />
            <span class="text-white font-bold">{{ players.length }}</span>
          </div>
        </div>
      </div>

      <!-- Scrollable Game Board -->
      <div
        ref="gameBoardRef"
        class="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar"
      >
        <div class="max-w-lg mx-auto">
          <!-- Legend -->
          <div class="mb-3 flex flex-wrap justify-center gap-3 text-[10px] text-white/80">
            <div class="flex items-center gap-1 bg-green-900/30 px-2 py-1 rounded">
              <span>🪜</span>
              <span>Ladder (up)</span>
            </div>
            <div class="flex items-center gap-1 bg-red-900/30 px-2 py-1 rounded">
              <span>🐍</span>
              <span>Snake (down)</span>
            </div>
            <div class="flex items-center gap-1 bg-yellow-900/30 px-2 py-1 rounded">
              <span>🎁</span>
              <span>Reward</span>
            </div>
          </div>

          <!-- Finish zone -->
          <div class="mb-4 p-4 bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 border-4 border-yellow-400 pixel-corners text-center relative overflow-hidden">
            <div class="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[length:10px_10px]"></div>
            <span class="text-2xl font-bold text-yellow-400 pixel-text relative z-10">🏆 FINISH LINE 🏆</span>
          </div>

          <!-- Grid rows (top to bottom, which is 100 to 1) -->
          <div class="grid-container">
            <div
              v-for="(row, rowIndex) in gridRows"
              :key="rowIndex"
              class="flex"
            >
              <div
                v-for="cell in row"
                :key="cell.number"
                :data-cell="cell.number"
                class="relative w-[10%] aspect-square border border-white/10 pixel-corners flex flex-col items-center justify-center transition-all duration-300 group"
                :class="[
                  cell.class,
                  cell.glow,
                  currentPosition === cell.number ? 'ring-4 ring-cyan-400 scale-125 z-20 animate-pulse-slow' : 'hover:scale-105 hover:z-10'
                ]"
              >
                <!-- Cell number -->
                <span class="absolute top-0.5 left-1 text-[7px] text-white/40 font-mono">{{ cell.number }}</span>

                <!-- Destination indicator for ladders/snakes -->
                <span
                  v-if="cell.destination && currentPosition !== cell.number"
                  class="absolute bottom-0.5 right-1 text-[6px] font-bold px-0.5 rounded"
                  :class="cell.isLadder ? 'text-green-300 bg-green-900/50' : 'text-red-300 bg-red-900/50'"
                >
                  {{ cell.isLadder ? '↑' : '↓' }}{{ cell.destination }}
                </span>

                <!-- Cell content (emoji) -->
                <span v-if="cell.emoji && currentPosition !== cell.number" class="text-sm sm:text-base drop-shadow-lg">{{ cell.emoji }}</span>

                <!-- Player marker -->
                <div
                  v-if="currentPosition === cell.number"
                  class="absolute inset-0 flex items-center justify-center"
                >
                  <span class="text-2xl sm:text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-bounce">🐬</span>
                </div>

                <!-- Other players -->
                <div
                  v-for="(player, pIdx) in players.filter(p => p.position === cell.number && p.user_id !== globalStore.user?.id)"
                  :key="player.id"
                  class="absolute"
                  :style="{ bottom: `${pIdx * 8}px`, right: `${pIdx * 8}px` }"
                >
                  <span class="text-xs opacity-80">👤</span>
                </div>

                <!-- Hover tooltip for special cells -->
                <div
                  v-if="cell.destination"
                  class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[8px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none"
                >
                  {{ cell.isLadder ? '🪜 Ladder to ' : '🐍 Snake to ' }}{{ cell.destination }}
                </div>
              </div>
            </div>
          </div>

          <!-- Player starting position indicator (when at position 0) -->
          <div v-if="currentPosition === 0" class="mt-4 p-3 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-2 border-cyan-400 pixel-corners text-center">
            <div class="flex items-center justify-center gap-2">
              <span class="text-2xl animate-bounce">🐬</span>
              <span class="text-white font-bold">You are at the starting position</span>
            </div>
            <p class="text-white/60 text-sm mt-1">Roll the dice to begin!</p>
          </div>
        </div>
      </div>

      <!-- Bottom Controls - Floating style -->
      <div class="flex-shrink-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div class="max-w-lg mx-auto">
          <!-- Dice and Roll button in one row -->
          <div class="flex items-center gap-4 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <!-- Dice display -->
            <div
              class="w-20 h-20 flex-shrink-0 bg-white pixel-corners flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] relative overflow-hidden"
              :class="{ 'animate-shake': diceRolling }"
            >
              <span class="text-5xl" :class="{ 'animate-spin-fast': diceRolling }">
                {{ diceValue ? diceFaces[diceValue - 1] : '🎲' }}
              </span>
            </div>

            <!-- Roll info and button -->
            <div class="flex-1">
              <!-- Last roll info -->
              <div v-if="lastRoll && !diceRolling" class="text-sm mb-2">
                <span class="text-white/60">Moved: </span>
                <span class="text-white font-bold">{{ lastRoll.from }} → {{ lastRoll.to }}</span>
                <span v-if="lastRoll.event !== 'move'" class="ml-2 text-xs px-2 py-0.5 rounded-full" :class="{
                  'bg-green-500/30 text-green-400': lastRoll.event === 'pass',
                  'bg-red-500/30 text-red-400': lastRoll.event === 'bot'
                }">
                  {{ lastRoll.event === 'pass' ? '⬆️ Ladder!' : '⬇️ Snake!' }}
                </span>
              </div>
              <div v-else-if="diceRolling" class="text-sm mb-2">
                <span class="text-white animate-pulse">Rolling...</span>
              </div>

              <!-- Roll button -->
              <Button
                @click="rollDice"
                :disabled="isRolling || isAnimating || isFinished || diceRolling"
                class="w-full pixel-corners bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 border-2 border-white/30 text-white font-bold py-3 text-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] disabled:shadow-none"
                size="lg"
              >
                <Loader2 v-if="diceRolling" class="w-5 h-5 mr-2 animate-spin" />
                <Dices v-else class="w-5 h-5 mr-2" />
                {{ diceRolling ? 'ROLLING...' : isFinished ? '🎉 FINISHED!' : 'ROLL DICE' }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Result Dialog -->
    <Dialog v-model:open="showResultDialog">
      <DialogContent class="max-w-md pixel-corners bg-gradient-to-b from-gray-900 to-black border-4 border-yellow-500/50 text-white shadow-[0_0_50px_rgba(234,179,8,0.3)]">
        <DialogHeader>
          <DialogTitle class="text-4xl font-bold text-center mb-4 text-yellow-400 pixel-text animate-pulse">
            🎉 YOU FINISHED! 🎉
          </DialogTitle>
          <DialogDescription class="text-center">
            <div class="space-y-4 mt-4">
              <div class="bg-white/5 border-2 border-white/20 p-6 pixel-corners">
                <p class="text-white/60 text-sm mb-2">Total Rolls</p>
                <p class="text-5xl font-bold text-cyan-400 pixel-text">{{ ladderGame.position?.rolls ?? 0 }}</p>
              </div>

              <div class="bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-2 border-green-400 p-4 pixel-corners">
                <p class="text-green-200 text-sm mb-2">Status</p>
                <p class="text-2xl font-bold text-green-400">🏆 Completed!</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="flex-col sm:flex-row gap-3 mt-6">
          <Button
            variant="outline"
            @click="goBackToHome"
            class="flex-1 pixel-corners bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 text-white font-bold py-3"
          >
            GO HOME
          </Button>
          <Button
            @click="playAgain"
            class="flex-1 pixel-corners bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 border-2 border-cyan-400 text-white font-bold py-3"
          >
            PLAY AGAIN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Back Confirmation Dialog -->
    <Dialog v-model:open="showBackDialog">
      <DialogContent class="pixel-corners bg-gray-900 border-2 border-gray-700">
        <DialogHeader>
          <DialogTitle class="text-white">Leave Game?</DialogTitle>
          <DialogDescription class="text-gray-400">
            Your progress will be saved. You can continue later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="flex-col sm:flex-row gap-3">
          <Button variant="outline" @click="showBackDialog = false" class="flex-1 border-gray-600">
            Stay
          </Button>
          <Button variant="destructive" @click="goBackToHome" class="flex-1">
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.pixel-corners {
  border-radius: 4px;
  image-rendering: pixelated;
}

.pixel-text {
  font-family: 'Press Start 2P', monospace, system-ui;
  letter-spacing: 0.05em;
}

/* Cell styles */
.cell-empty {
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
}

.cell-pass {
  background: linear-gradient(135deg, rgba(34,197,94,0.4) 0%, rgba(22,163,74,0.2) 100%);
  border-color: rgba(34,197,94,0.6) !important;
}

.cell-bot {
  background: linear-gradient(135deg, rgba(239,68,68,0.4) 0%, rgba(220,38,38,0.2) 100%);
  border-color: rgba(239,68,68,0.6) !important;
}

.cell-reward {
  background: linear-gradient(135deg, rgba(234,179,8,0.4) 0%, rgba(202,138,4,0.2) 100%);
  border-color: rgba(234,179,8,0.6) !important;
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

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Minecraft-style button effects */
button.pixel-corners:active:not(:disabled) {
  transform: translateY(2px);
}

/* Grid container shadow */
.grid-container {
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  padding: 4px;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
}
</style>
