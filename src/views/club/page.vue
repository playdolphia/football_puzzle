<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'
import { useClubStore } from '@/stores/clubStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Users,
  Zap,
  Star,
  Dumbbell,
  Utensils,
  Moon,
  Swords,
  Trophy,
  Clock,
  AlertCircle,
  Plus,
  Loader2
} from 'lucide-vue-next'
import Loader from '@/components/layouts/Loader.vue'
import type { Player, TrainingOption } from '@/services/clubApi'

const router = useRouter()
const globalStore = useGlobalStore()
const clubStore = useClubStore()

const isInitializing = ref(true)
const clubName = ref('')
const createError = ref('')
const selectedPlayer = ref<Player | null>(null)
const showTrainDialog = ref(false)
const showFeedDialog = ref(false)
const showRestDialog = ref(false)
const showMatchResultDialog = ref(false)
const actionError = ref('')
const actionSuccess = ref('')

// Refresh interval for task completion
let refreshInterval: ReturnType<typeof setInterval> | null = null

const goBack = () => {
  router.push('/')
}

const goToGame = () => {
  router.push('/game')
}

// Format time remaining
const formatTimeLeft = (taskEndsAt: string | null): string => {
  if (!taskEndsAt) return ''
  const endTime = new Date(taskEndsAt).getTime()
  const now = Date.now()
  const diff = endTime - now

  if (diff <= 0) return 'Completing...'

  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

// Get position label
const getPositionLabel = (pos: string): string => {
  const labels: Record<string, string> = {
    GK: 'Goalkeeper',
    DEF: 'Defender',
    MID: 'Midfielder',
    ATT: 'Attacker'
  }
  return labels[pos] || pos
}

// Get task label
const getTaskLabel = (task: string | null): string => {
  if (!task) return 'Idle'
  const labels: Record<string, string> = {
    training: 'Training',
    resting: 'Resting',
    match: 'In Match'
  }
  return labels[task] || task
}

// Get energy color class
const getEnergyColorClass = (energy: number): string => {
  if (energy >= 70) return 'text-green-500'
  if (energy >= 40) return 'text-yellow-500'
  return 'text-red-500'
}

// Get energy bar color
const getEnergyBarColor = (energy: number): string => {
  if (energy >= 70) return 'bg-green-500'
  if (energy >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

// Create club
const handleCreateClub = async () => {
  if (!clubName.value.trim()) {
    createError.value = 'Please enter a club name'
    return
  }

  createError.value = ''
  const result = await clubStore.createClub(clubName.value.trim())

  if (!result.ok) {
    createError.value = result.message || 'Failed to create club'
  }
}

// Open train dialog
const openTrainDialog = (player: Player) => {
  if (player.current_task) {
    actionError.value = 'Player is currently busy'
    return
  }
  selectedPlayer.value = player
  showTrainDialog.value = true
  actionError.value = ''

  // Fetch training options if not loaded
  if (clubStore.trainingOptions.length === 0) {
    clubStore.fetchTrainingOptions()
  }
}

// Train player
const handleTrain = async (type: 'light' | 'balanced' | 'conditioning' | 'finishing') => {
  if (!selectedPlayer.value) return

  actionError.value = ''
  const result = await clubStore.trainPlayer(selectedPlayer.value.id, type)

  if (result.ok) {
    showTrainDialog.value = false
    selectedPlayer.value = null
    actionSuccess.value = 'Training started!'
    setTimeout(() => (actionSuccess.value = ''), 3000)
  } else {
    actionError.value = result.message || 'Failed to start training'
  }
}

// Open feed dialog
const openFeedDialog = (player: Player) => {
  selectedPlayer.value = player
  showFeedDialog.value = true
  actionError.value = ''
}

// Feed player
const handleFeed = async () => {
  if (!selectedPlayer.value) return

  actionError.value = ''
  const result = await clubStore.feedPlayers([selectedPlayer.value.id])

  if (result.ok) {
    showFeedDialog.value = false
    selectedPlayer.value = null
    actionSuccess.value = 'Player fed!'
    setTimeout(() => (actionSuccess.value = ''), 3000)
  } else {
    actionError.value = result.message || 'Failed to feed player'
  }
}

// Open rest dialog
const openRestDialog = (player: Player) => {
  if (player.current_task) {
    actionError.value = 'Player is currently busy'
    return
  }
  selectedPlayer.value = player
  showRestDialog.value = true
  actionError.value = ''
}

// Rest player
const handleRest = async (type: 'short' | 'full') => {
  if (!selectedPlayer.value) return

  actionError.value = ''
  const result = await clubStore.restPlayer(selectedPlayer.value.id, type)

  if (result.ok) {
    showRestDialog.value = false
    selectedPlayer.value = null
    actionSuccess.value = 'Player is now resting!'
    setTimeout(() => (actionSuccess.value = ''), 3000)
  } else {
    actionError.value = result.message || 'Failed to rest player'
  }
}

// Play bot match
const handlePlayBotMatch = async () => {
  actionError.value = ''
  const result = await clubStore.playBotMatch()

  if (result.ok) {
    showMatchResultDialog.value = true
  } else {
    actionError.value = result.message || 'Failed to start match'
  }
}

// Initialize
onMounted(async () => {
  try {
    // Check if authenticated
    if (!globalStore.apiToken) {
      router.push('/')
      return
    }

    // Fetch club data
    await clubStore.fetchClub()

    // If club exists, also fetch training options
    if (clubStore.hasClub) {
      clubStore.fetchTrainingOptions()
    }

    // Set up refresh interval for task completion checks
    refreshInterval = setInterval(() => {
      clubStore.checkCompletedTasks()
    }, 1000)
  } catch (err) {
    console.error('Failed to initialize club page:', err)
  } finally {
    isInitializing.value = false
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// Computed: match result message
const matchResultMessage = computed(() => {
  const result = clubStore.lastMatchResult
  if (!result) return ''

  const messages = {
    win: `Victory! Your team won ${result.score.club}-${result.score.bot}`,
    loss: `Defeat. Your team lost ${result.score.club}-${result.score.bot}`,
    draw: `Draw! The match ended ${result.score.club}-${result.score.bot}`
  }
  return messages[result.result] || ''
})
</script>

<template>
  <div class="min-h-screen bg-[#0a0812]">
    <!-- Loading State - MV3 Style -->
    <div v-if="isInitializing" class="flex items-center justify-center min-h-screen">
      <Loader variant="game" title="Loading Club" subtitle="Please wait..." />
    </div>

    <!-- Club Creation - MV3 Style -->
    <div v-else-if="!clubStore.hasClub" class="flex items-center justify-center min-h-screen p-4">
      <div class="max-w-md w-full space-y-8">
        <!-- Header -->
        <div class="text-center space-y-4">
          <div class="w-16 h-16 mx-auto border border-white/20 flex items-center justify-center">
            <Trophy class="w-8 h-8 text-[#4fd4d4]" />
          </div>
          <h1 class="text-white uppercase tracking-widest text-sm font-medium">Create Your Club</h1>
          <p class="text-white/40 text-sm">
            Start your journey by creating your football club. You'll receive 6 beginner players to start with!
          </p>
        </div>

        <!-- Separator -->
        <div class="h-[1px] w-full bg-white/10" />

        <!-- Form -->
        <div class="space-y-6">
          <div>
            <Input
              v-model="clubName"
              variant="game"
              placeholder="Enter club name..."
              class="text-center"
              :disabled="clubStore.loading.club"
              @keyup.enter="handleCreateClub"
            />
            <p v-if="createError" class="text-sm text-rose-400 mt-2 text-center">
              {{ createError }}
            </p>
          </div>

          <Button
            @click="handleCreateClub"
            variant="game-primary"
            size="game-lg"
            class="w-full gap-2"
            :disabled="clubStore.loading.club || !clubName.trim()"
          >
            <Loader2 v-if="clubStore.loading.club" class="w-4 h-4 animate-spin" />
            <Plus v-else class="w-4 h-4" />
            Create Club
          </Button>
        </div>

        <!-- Separator -->
        <div class="h-[1px] w-full bg-white/10" />

        <!-- Info -->
        <div class="text-center space-y-3">
          <p class="text-white/50 uppercase tracking-widest text-xs">Your starter squad includes</p>
          <ul class="space-y-1 text-white/40 text-sm">
            <li>1 Goalkeeper</li>
            <li>5 Outfield players</li>
            <li>All with 100% energy</li>
            <li>Ready for training!</li>
          </ul>
        </div>

        <Button @click="goBack" variant="game-ghost" size="game" class="w-full gap-2">
          <ArrowLeft class="w-4 h-4" />
          Back
        </Button>
      </div>
    </div>

    <!-- Club Dashboard -->
    <div v-else class="container mx-auto px-4 py-4 max-w-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <Button @click="goBack" variant="ghost" size="sm">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button @click="goToGame" variant="outline" size="sm">
          View Field
        </Button>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="actionSuccess" class="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm text-center">
        {{ actionSuccess }}
      </div>
      <div v-if="actionError" class="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center">
        {{ actionError }}
      </div>

      <!-- Club Info Card -->
      <Card class="mb-4">
        <CardHeader class="pb-2">
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="text-xl">{{ clubStore.clubName }}</CardTitle>
              <CardDescription>Level {{ clubStore.clubLevel }}</CardDescription>
            </div>
            <div class="text-right">
              <div class="flex items-center gap-1 text-sm text-muted-foreground">
                <Users class="w-4 h-4" />
                {{ clubStore.clubFans }} fans
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold">{{ clubStore.players.length }}</div>
              <div class="text-xs text-muted-foreground">Players</div>
            </div>
            <div>
              <div class="text-2xl font-bold">{{ clubStore.teamAverageLevel }}</div>
              <div class="text-xs text-muted-foreground">Avg Level</div>
            </div>
            <div>
              <div class="text-2xl font-bold" :class="getEnergyColorClass(clubStore.teamAverageEnergy)">
                {{ clubStore.teamAverageEnergy }}%
              </div>
              <div class="text-xs text-muted-foreground">Avg Energy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Quick Actions -->
      <Card class="mb-4">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-2">
            <Button
              @click="handlePlayBotMatch"
              :disabled="clubStore.loading.match || !clubStore.canPlayMatch"
              class="flex-col h-auto py-3"
            >
              <Loader2 v-if="clubStore.loading.match" class="w-5 h-5 animate-spin mb-1" />
              <Swords v-else class="w-5 h-5 mb-1" />
              <span class="text-xs">Play Bot Match</span>
            </Button>
            <Button @click="goToGame" variant="outline" class="flex-col h-auto py-3">
              <Trophy class="w-5 h-5 mb-1" />
              <span class="text-xs">View Field</span>
            </Button>
          </div>
          <p v-if="!clubStore.canPlayMatch" class="text-xs text-muted-foreground mt-2 text-center">
            Team needs more energy for a match
          </p>
        </CardContent>
      </Card>

      <!-- Players List -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Users class="w-4 h-4" />
            Squad
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="player in clubStore.players"
            :key="player.id"
            class="border rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <Badge variant="outline" class="text-xs">{{ player.position }}</Badge>
                <span class="text-sm font-medium">{{ getPositionLabel(player.position) }}</span>
                <Badge variant="secondary" class="text-xs">Lv.{{ player.level }}</Badge>
              </div>
              <div class="text-xs text-muted-foreground">
                {{ player.xp }} XP
              </div>
            </div>

            <!-- Energy Bar -->
            <div class="mb-2">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-muted-foreground">Energy</span>
                <span :class="getEnergyColorClass(player.energy)">{{ player.energy }}%</span>
              </div>
              <div class="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  class="h-full transition-all duration-300"
                  :class="getEnergyBarColor(player.energy)"
                  :style="{ width: `${player.energy}%` }"
                ></div>
              </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-4 gap-2 text-xs text-center mb-2">
              <div>
                <div class="text-muted-foreground">STA</div>
                <div class="font-medium">{{ player.stamina }}</div>
              </div>
              <div>
                <div class="text-muted-foreground">STR</div>
                <div class="font-medium">{{ player.strength }}</div>
              </div>
              <div>
                <div class="text-muted-foreground">AWR</div>
                <div class="font-medium">{{ player.awareness }}</div>
              </div>
              <div>
                <div class="text-muted-foreground">FIN</div>
                <div class="font-medium">{{ player.finishing }}</div>
              </div>
            </div>

            <!-- Task Status or Actions -->
            <div v-if="player.current_task" class="flex items-center justify-between bg-muted/50 rounded p-2">
              <div class="flex items-center gap-2 text-sm">
                <Clock class="w-4 h-4 text-muted-foreground animate-pulse" />
                <span>{{ getTaskLabel(player.current_task) }}</span>
              </div>
              <span class="text-xs text-muted-foreground">
                {{ formatTimeLeft(player.task_ends_at) }}
              </span>
            </div>
            <div v-else class="flex gap-2">
              <Button @click="openTrainDialog(player)" size="sm" variant="outline" class="flex-1 text-xs">
                <Dumbbell class="w-3 h-3 mr-1" />
                Train
              </Button>
              <Button @click="openFeedDialog(player)" size="sm" variant="outline" class="flex-1 text-xs">
                <Utensils class="w-3 h-3 mr-1" />
                Feed
              </Button>
              <Button @click="openRestDialog(player)" size="sm" variant="outline" class="flex-1 text-xs">
                <Moon class="w-3 h-3 mr-1" />
                Rest
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Train Dialog -->
    <Dialog v-model:open="showTrainDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Train Player</DialogTitle>
          <DialogDescription>
            Choose a training type for your {{ selectedPlayer?.position }} ({{ getPositionLabel(selectedPlayer?.position || '') }})
          </DialogDescription>
        </DialogHeader>

        <div v-if="clubStore.loading.trainingOptions" class="py-8 text-center">
          <Loader2 class="w-6 h-6 animate-spin mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">Loading options...</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="option in clubStore.trainingOptions"
            :key="option.type"
            class="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
            @click="handleTrain(option.type)"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium capitalize">{{ option.type }}</span>
              <div class="flex items-center gap-2 text-xs">
                <Badge variant="secondary">-{{ option.energy_cost }} energy</Badge>
                <Badge v-if="option.token_cost > 0" variant="outline">{{ option.token_cost }} tokens</Badge>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mb-1">{{ option.description }}</p>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-green-600">+{{ option.xp_gain }} XP</span>
              <span v-for="(value, stat) in option.stats" :key="stat" class="text-blue-600">
                +{{ value }} {{ stat }}
              </span>
              <span class="text-muted-foreground">{{ Math.round(option.duration / 60) }}min</span>
            </div>
          </div>
        </div>

        <p v-if="actionError" class="text-sm text-destructive">{{ actionError }}</p>

        <DialogFooter>
          <Button variant="ghost" @click="showTrainDialog = false">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Feed Dialog -->
    <Dialog v-model:open="showFeedDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feed Player</DialogTitle>
          <DialogDescription>
            Feed your {{ selectedPlayer?.position }} to restore energy. Costs 5 tokens.
          </DialogDescription>
        </DialogHeader>

        <div class="py-4">
          <div class="flex items-center justify-between mb-4">
            <span>Current Energy:</span>
            <span :class="getEnergyColorClass(selectedPlayer?.energy || 0)" class="font-bold">
              {{ selectedPlayer?.energy }}%
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span>After Feeding:</span>
            <span class="text-green-500 font-bold">
              {{ Math.min(100, (selectedPlayer?.energy || 0) + 20) }}%
            </span>
          </div>
        </div>

        <p v-if="actionError" class="text-sm text-destructive">{{ actionError }}</p>

        <DialogFooter>
          <Button variant="ghost" @click="showFeedDialog = false">Cancel</Button>
          <Button @click="handleFeed" :disabled="clubStore.loading.feed">
            <Loader2 v-if="clubStore.loading.feed" class="w-4 h-4 mr-2 animate-spin" />
            <Utensils v-else class="w-4 h-4 mr-2" />
            Feed (5 tokens)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Rest Dialog -->
    <Dialog v-model:open="showRestDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rest Player</DialogTitle>
          <DialogDescription>
            Let your {{ selectedPlayer?.position }} rest to recover energy.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3">
          <div
            class="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
            @click="handleRest('short')"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium">Short Rest</span>
              <Badge variant="secondary">Free</Badge>
            </div>
            <p class="text-xs text-muted-foreground">15min rest, +15 energy</p>
          </div>

          <div
            class="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
            @click="handleRest('full')"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium">Full Rest (Hotel)</span>
              <Badge variant="outline">10 tokens</Badge>
            </div>
            <p class="text-xs text-muted-foreground">60min rest, full energy recovery</p>
          </div>
        </div>

        <p v-if="actionError" class="text-sm text-destructive">{{ actionError }}</p>

        <DialogFooter>
          <Button variant="ghost" @click="showRestDialog = false">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Match Result Dialog -->
    <Dialog v-model:open="showMatchResultDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="text-center">
            <span v-if="clubStore.lastMatchResult?.result === 'win'" class="text-green-500">Victory!</span>
            <span v-else-if="clubStore.lastMatchResult?.result === 'loss'" class="text-red-500">Defeat</span>
            <span v-else class="text-yellow-500">Draw</span>
          </DialogTitle>
        </DialogHeader>

        <div v-if="clubStore.lastMatchResult" class="py-4 text-center">
          <div class="text-4xl font-bold mb-4">
            {{ clubStore.lastMatchResult.score.club }} - {{ clubStore.lastMatchResult.score.bot }}
          </div>
          <div class="text-sm text-muted-foreground mb-4">vs Bot Team</div>

          <div class="border-t pt-4">
            <p class="text-sm font-medium mb-2">Rewards</p>
            <div class="flex justify-center gap-4 text-sm">
              <div>
                <Star class="w-4 h-4 inline mr-1 text-yellow-500" />
                +{{ clubStore.lastMatchResult.rewards.xp }} XP
              </div>
              <div>
                <Users class="w-4 h-4 inline mr-1 text-blue-500" />
                +{{ clubStore.lastMatchResult.rewards.fans }} Fans
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button @click="showMatchResultDialog = false" class="w-full">Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
