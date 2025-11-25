<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft } from 'lucide-vue-next'
import Loader from '@/components/layouts/Loader.vue'

const router = useRouter()
const globalStore = useGlobalStore()
const loading = ref(true)
const error = ref('')

const getRankEmoji = (index: number) => {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return `#${index + 1}`
}

const getRankGradient = (index: number) => {
  if (index === 0) return 'from-amber-500/30 to-yellow-500/30 border-amber-400/40'
  if (index === 1) return 'from-slate-400/30 to-gray-400/30 border-slate-400/40'
  if (index === 2) return 'from-orange-700/30 to-amber-700/30 border-orange-600/40'
  return 'from-white/5 to-white/10 border-white/10'
}

onMounted(async () => {
  try {
    // Ensure user is authenticated before accessing leaderboard
    if (!globalStore.userProfile || !globalStore.apiToken) {
      router.push('/')
      return
    }

    await globalStore.getDailyTop()
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
  <div class="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative">
    <!-- Back button - Monument Valley style (matching ladder page) -->
    <div class="absolute top-4 left-4 z-20">
      <Button @click="goBack" size="icon" class="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-xl shadow-[0_4px_12px_-4px_rgba(0,0,0,0.2)] transition-all duration-200">
        <ArrowLeft class="w-4 h-4" />
      </Button>
    </div>

    <div class="container mx-auto max-w-2xl px-4 py-6 pt-20">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
        <Loader title="Loading Leaderboard" subtitle="Fetching today's top players..." />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="flex items-center justify-center min-h-[60vh]">
        <Card class="max-w-md mx-auto bg-white/5 backdrop-blur-xl border border-red-400/20 rounded-3xl">
          <CardContent class="p-8 text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center">
              <span class="text-4xl">😕</span>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Oops!</h3>
            <p class="text-white/50 text-sm mb-6">{{ error }}</p>
            <Button @click="goBack" class="rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Leaderboard content -->
      <div v-else>
        <!-- Title Card -->
        <Card class="mb-6 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-xl border border-amber-400/20 rounded-3xl overflow-hidden">
          <CardContent class="p-6">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                <span class="text-3xl">🏆</span>
              </div>
              <div>
                <h1 class="text-xl font-semibold text-white">Today's Champions</h1>
                <p class="text-amber-200/60 text-sm">Ranked by fewest rolls to finish</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Top 3 Podium (if we have entries) -->
        <div v-if="globalStore.dailyTopPlayers.length >= 3" class="mb-6 grid grid-cols-3 gap-3">
          <!-- 2nd Place -->
          <div class="order-1">
            <Card class="bg-gradient-to-b from-slate-400/20 to-gray-500/20 backdrop-blur-xl border border-slate-400/30 rounded-2xl overflow-hidden h-full">
              <CardContent class="p-4 text-center">
                <div class="text-3xl mb-2">🥈</div>
                <Avatar class="w-12 h-12 mx-auto mb-2 ring-2 ring-slate-400/50">
                  <AvatarImage :src="globalStore.dailyTopPlayers[1].avatar" />
                  <AvatarFallback class="bg-slate-600 text-white">
                    {{ globalStore.dailyTopPlayers[1].nickname?.[0] || '?' }}
                  </AvatarFallback>
                </Avatar>
                <p class="text-white text-sm font-medium truncate">{{ globalStore.dailyTopPlayers[1].nickname }}</p>
                <p class="text-slate-300 text-xs mt-1">{{ globalStore.dailyTopPlayers[1].rolls }} rolls</p>
              </CardContent>
            </Card>
          </div>

          <!-- 1st Place -->
          <div class="order-2 -mt-4">
            <Card class="bg-gradient-to-b from-amber-500/30 to-yellow-600/30 backdrop-blur-xl border border-amber-400/40 rounded-2xl overflow-hidden h-full">
              <CardContent class="p-4 text-center">
                <div class="text-4xl mb-2">🥇</div>
                <Avatar class="w-14 h-14 mx-auto mb-2 ring-2 ring-amber-400/50">
                  <AvatarImage :src="globalStore.dailyTopPlayers[0].avatar" />
                  <AvatarFallback class="bg-amber-600 text-white">
                    {{ globalStore.dailyTopPlayers[0].nickname?.[0] || '?' }}
                  </AvatarFallback>
                </Avatar>
                <p class="text-white text-sm font-semibold truncate">{{ globalStore.dailyTopPlayers[0].nickname }}</p>
                <p class="text-amber-300 text-xs mt-1">{{ globalStore.dailyTopPlayers[0].rolls }} rolls</p>
              </CardContent>
            </Card>
          </div>

          <!-- 3rd Place -->
          <div class="order-3">
            <Card class="bg-gradient-to-b from-orange-700/20 to-amber-800/20 backdrop-blur-xl border border-orange-600/30 rounded-2xl overflow-hidden h-full">
              <CardContent class="p-4 text-center">
                <div class="text-3xl mb-2">🥉</div>
                <Avatar class="w-12 h-12 mx-auto mb-2 ring-2 ring-orange-500/50">
                  <AvatarImage :src="globalStore.dailyTopPlayers[2].avatar" />
                  <AvatarFallback class="bg-orange-700 text-white">
                    {{ globalStore.dailyTopPlayers[2].nickname?.[0] || '?' }}
                  </AvatarFallback>
                </Avatar>
                <p class="text-white text-sm font-medium truncate">{{ globalStore.dailyTopPlayers[2].nickname }}</p>
                <p class="text-orange-300 text-xs mt-1">{{ globalStore.dailyTopPlayers[2].rolls }} rolls</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Leaderboard entries list -->
        <div class="space-y-3">
          <Card
            v-for="(player, index) in globalStore.dailyTopPlayers"
            :key="player.id"
            class="backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01]"
            :class="[
              `bg-gradient-to-r ${getRankGradient(index)}`,
              'border'
            ]"
          >
            <CardContent class="p-4">
              <div class="flex items-center gap-4">
                <!-- Rank -->
                <div class="flex-shrink-0 w-10 text-center">
                  <span v-if="index < 3" class="text-2xl">{{ getRankEmoji(index) }}</span>
                  <span v-else class="text-lg font-semibold text-white/60">{{ getRankEmoji(index) }}</span>
                </div>

                <!-- Avatar -->
                <Avatar class="w-11 h-11 ring-2 ring-white/10">
                  <AvatarImage :src="player.avatar" />
                  <AvatarFallback class="bg-slate-600 text-white">
                    {{ player.nickname?.[0] || '?' }}
                  </AvatarFallback>
                </Avatar>

                <!-- Player info -->
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-semibold text-white truncate">
                    {{ player.nickname }}
                  </h3>
                  <div class="flex items-center gap-3 mt-1 text-xs">
                    <span class="text-white/50">
                      Position: <span class="text-white/80 font-medium">{{ player.position }}/100</span>
                    </span>
                    <span v-if="player.finished" class="text-emerald-400">✓ Finished</span>
                  </div>
                </div>

                <!-- Rolls count -->
                <div class="flex-shrink-0 text-right">
                  <div class="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl">
                    <p class="text-xs text-white/50">Rolls</p>
                    <p class="text-lg font-semibold text-white">{{ player.rolls }}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Empty state -->
        <Card v-if="globalStore.dailyTopPlayers.length === 0" class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
          <CardContent class="p-12 text-center">
            <div class="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center">
              <span class="text-5xl">🎲</span>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">No Players Yet</h3>
            <p class="text-white/50 mb-6">Be the first to complete today's challenge!</p>
            <Button
              @click="goBack"
              class="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 border border-white/20"
            >
              Start Playing
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
