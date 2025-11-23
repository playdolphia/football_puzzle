<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy, Target, TrendingUp } from 'lucide-vue-next'
import Loader from '@/components/layouts/Loader.vue'

const router = useRouter()
const globalStore = useGlobalStore()
const loading = ref(true)
const error = ref('')

const getRankColor = (index: number) => {
  if (index === 0) return 'text-yellow-500' // Gold
  if (index === 1) return 'text-gray-400' // Silver
  if (index === 2) return 'text-amber-700' // Bronze
  return 'text-muted-foreground'
}

const getRankIcon = (index: number) => {
  if (index < 3) return Trophy
  return Target
}

const formatScore = (score: string) => {
  return Math.round(parseFloat(score)).toString()
}

const formatAccuracy = (accuracy: string) => {
  return parseFloat(accuracy).toFixed(2) + '%'
}

onMounted(async () => {
  try {
    // Ensure user is authenticated before accessing leaderboard
    if (!globalStore.userProfile || !globalStore.apiToken) {
      router.push('/')
      return
    }

    await globalStore.getPassupLeaderboard()
  } catch (err) {
    error.value = 'Failed to load leaderboard'
    console.error('Leaderboard error:', err)
  } finally {
    loading.value = false
  }
})

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen w-full bg-gradient-to-b from-gray-900 to-gray-800 p-4">
    <!-- Back button with Minecraft style -->
    <div class="container mx-auto max-w-4xl">
      <div class="mb-4">
        <Button @click="goBack" size="sm" class="pixel-corners bg-stone-600 hover:bg-stone-700 border-2 border-stone-800">
          <ArrowLeft class="w-4 h-4" />
          <span class="hidden sm:inline">Back to Home</span>
          <span class="sm:hidden">Back</span>
        </Button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
        <Loader title="LOADING LEADERBOARD" subtitle="Fetching top players..." />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="flex items-center justify-center min-h-[50vh]">
        <Card class="max-w-md mx-auto border-destructive pixel-corners">
          <CardHeader>
            <CardTitle class="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground mb-4">{{ error }}</p>
            <Button @click="goBack" variant="outline" class="w-full pixel-corners">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Leaderboard content -->
      <div v-else>
        <!-- Header Card with Minecraft style -->
        <Card class="mb-6 pixel-corners bg-stone-700 border-4 border-stone-900">
          <CardHeader>
            <CardTitle class="flex items-center gap-3 text-2xl text-yellow-400">
              <Trophy class="w-8 h-8" />
              Pass Up Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-stone-300">
              Top players ranked by their passing performance
            </p>
          </CardContent>
        </Card>

        <!-- Leaderboard entries -->
        <div class="space-y-3">
          <Card
            v-for="(entry, index) in globalStore.leaderboard"
            :key="entry.user_id"
            class="pixel-corners border-4 transition-all hover:scale-[1.02]"
            :class="{
              'bg-yellow-900/30 border-yellow-600': index === 0,
              'bg-gray-700/30 border-gray-500': index === 1,
              'bg-amber-900/30 border-amber-700': index === 2,
              'bg-stone-800 border-stone-600': index >= 3
            }"
          >
            <CardContent class="p-4">
              <div class="flex items-center gap-4">
                <!-- Rank -->
                <div class="flex-shrink-0 w-12 text-center">
                  <component
                    :is="getRankIcon(index)"
                    :class="[getRankColor(index), 'w-8 h-8 mx-auto']"
                  />
                  <div class="text-sm font-bold mt-1" :class="getRankColor(index)">
                    #{{ index + 1 }}
                  </div>
                </div>

                <!-- Player info -->
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-bold text-white truncate pixel-text">
                    {{ entry.nickname }}
                  </h3>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                    <div class="bg-stone-900/50 px-2 py-1 rounded pixel-corners">
                      <div class="text-stone-400">Score</div>
                      <div class="font-bold text-green-400">{{ formatScore(entry.score) }}</div>
                    </div>
                    <div class="bg-stone-900/50 px-2 py-1 rounded pixel-corners">
                      <div class="text-stone-400">Accuracy</div>
                      <div class="font-bold text-blue-400">{{ formatAccuracy(entry.accuracy) }}</div>
                    </div>
                    <div class="bg-stone-900/50 px-2 py-1 rounded pixel-corners">
                      <div class="text-stone-400">Goals</div>
                      <div class="font-bold text-yellow-400">{{ entry.total_goals }}/{{ entry.total_shots }}</div>
                    </div>
                    <div class="bg-stone-900/50 px-2 py-1 rounded pixel-corners">
                      <div class="text-stone-400">Games</div>
                      <div class="font-bold text-purple-400">{{ entry.total_games }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Empty state -->
        <Card v-if="globalStore.leaderboard.length === 0" class="pixel-corners bg-stone-800 border-4 border-stone-600">
          <CardContent class="p-8 text-center">
            <TrendingUp class="w-12 h-12 mx-auto mb-4 text-stone-500" />
            <p class="text-stone-400">No leaderboard data available yet</p>
            <Button @click="goBack" class="mt-4 pixel-corners">
              Start Playing
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pixel-corners {
  border-radius: 0;
  image-rendering: pixelated;
}

.pixel-text {
  font-family: 'Press Start 2P', monospace, system-ui, -apple-system;
  letter-spacing: 0.05em;
}

/* Minecraft-style button effects */
button.pixel-corners:active {
  transform: translateY(2px);
}
</style>
