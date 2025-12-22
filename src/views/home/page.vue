<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, ArrowLeft, Trophy, Zap, Users } from 'lucide-vue-next'
import Loader from '@/components/layouts/Loader.vue'
import EnergyBar from '@/components/layouts/EnergyBar.vue'

const router = useRouter()
const globalStore = useGlobalStore()
const userData = ref(null)
const error = ref('')

const goToProfile = () => {
  const originUrl = import.meta.env.VITE_ORIGIN_URL || 'http://localhost:5173'
  window.open(`${originUrl}/user/profile`, '_self')
}

const goToDolphia = () => {
  const originUrl = import.meta.env.VITE_ORIGIN_URL || 'http://localhost:5173'
  window.open(originUrl, '_self')
}

const goToLeaderboard = () => {
  router.push('/leaderboard')
}

onMounted(async () => {
  try {
    const STORAGE_KEY = 'dolphia_auth'
    let token: string | null = null
    let isFromLocalStorage = false
    let isTestToken = false

    // Check if we're using test token from env (unlimited duration for dev)
    if (import.meta.env.VITE_TEST_TRANSFER_TOKEN) {
      let parsedTestToken = JSON.parse(atob(import.meta.env.VITE_TEST_TRANSFER_TOKEN) ?? '{}');
      parsedTestToken.expiry = Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year for dev
      token = btoa(JSON.stringify(parsedTestToken));
      isTestToken = true
    }

    // If not using test token, check localStorage or URL
    if (!isTestToken) {
      // First, try to get token from localStorage
      const storedAuth = localStorage.getItem(STORAGE_KEY)
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth)
          const now = Date.now()

          // Check if stored token is expired (1 hour = 3600000ms)
          if (authData.expiry && now < authData.expiry) {
            // Token is still valid
            token = authData.token
            isFromLocalStorage = true
          } else {
            // Token expired, clear it
            localStorage.removeItem(STORAGE_KEY)
          }
        } catch (e) {
          // Invalid JSON, clear it
          localStorage.removeItem(STORAGE_KEY)
        }
      }

      // If no valid token in localStorage, try URL parameter
      if (!token) {
        const urlParams = new URLSearchParams(window.location.search)
        token = urlParams.get('token')
      }
    }

    // Check if we already have tokens in the store (from previous navigation)
    if (globalStore.apiToken && globalStore.user) {
      // Already authenticated, just load the user data
      userData.value = globalStore.user

      // Fetch user profile and other data
      await Promise.all([
        globalStore.getUserProfile(),
        globalStore.getUserAvatar(),
        globalStore.getTokenSum(),
        globalStore.getPendingTasks(),
        globalStore.fetchUserEnergy()
      ])
    } else {
      if (!token) {
        error.value = 'No authentication token provided'
        return
      }

      // Store the transferToken in the global store
      globalStore.transferToken = token

      // Get decoded token data using the store getter
      const tokenData = globalStore.decodedTransferToken

      if (!tokenData) {
        error.value = 'Invalid or expired token'
        return
      }

      if (!tokenData.expiry || Date.now() > tokenData.expiry) {
        error.value = 'Token expired. Please return to the main app to get a new token.'
        return
      }

      // Store in localStorage with 1 hour expiry only if it's a new token from URL (not test token)
      if (!isFromLocalStorage && !isTestToken) {
        const authData = {
          token: token,
          expiry: tokenData.expiry || Date.now() + (60 * 60 * 1000) // 1 hour from now
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authData))
      }

      // Set API token and user in store
      globalStore.setApiToken(tokenData.apiToken)
      globalStore.setUser(tokenData.user)

      // Fetch user profile and other data
      await Promise.all([
        globalStore.getUserProfile(),
        globalStore.getUserAvatar(),
        globalStore.getTokenSum(),
        globalStore.getPendingTasks(),
        globalStore.fetchUserEnergy()
      ])

      userData.value = tokenData
    }
  } catch (err) {
    error.value = 'Failed to process authentication token'
    console.error('Token processing error:', err)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#0a0812] relative">
    <!-- Background Image with 70% transparency and subtle blur -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 blur-[1px]"
      style="background-image: url('/bg.webp');"
    ></div>

    <div class="container mx-auto px-4 py-6 relative z-10">
      <!-- Error State -->
      <div v-if="error" class="max-w-md mx-auto">
        <div class="border border-rose-400/30 bg-rose-500/5 p-6 space-y-4">
          <div class="flex items-center gap-3 text-rose-400">
            <AlertCircle class="w-5 h-5" />
            <span class="uppercase tracking-wide text-sm font-medium">Authentication Error</span>
          </div>
          <p class="text-white/60 text-sm">{{ error }}</p>
          <p class="text-white/40 text-xs">Please return to Dolphia and try again.</p>
          <Button @click="goToDolphia" variant="game-outline" size="game" class="w-full">
            Return to Dolphia
          </Button>
        </div>
      </div>

      <!-- Game Interface -->
      <div v-else-if="userData && globalStore.userProfile" class="max-w-md mx-auto space-y-8">
        <!-- Welcome Header -->
        <div class="space-y-6">
          <!-- Profile Section -->
          <button @click="goToProfile" class="w-full text-left group">
            <div class="flex items-center gap-4">
              <Avatar variant="game" class="w-14 h-14">
                <AvatarImage :src="globalStore.userProfile?.user_info?.avatar || globalStore.avatar || ''" />
                <AvatarFallback variant="game" class="text-lg">
                  {{ globalStore.userProfile?.user_info?.display_name?.split(' ')?.map((i: string) => i[0])?.join('') ||
                     ((globalStore.user as any)?.first_name?.[0] + ((globalStore.user as any)?.last_name?.[0] || '')) }}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 class="text-white text-lg font-light">Welcome to Club Management!</h1>
                <p class="text-[#4fd4d4] text-sm group-hover:text-[#7fe5e5] transition-colors">
                  {{ globalStore.userProfile?.user_info?.display_name ||
                     ((globalStore.user as any)?.first_name + ' ' + (globalStore.user as any)?.last_name) }}
                </p>
              </div>
            </div>
          </button>

          <!-- Stats Row -->
          <div class="flex items-center justify-between text-sm border-b border-white/10 pb-4">
            <div>
              <span class="text-white/40 uppercase tracking-widest text-xs">Tokens:</span>
              <span class="text-white/80 ml-2 font-medium">{{ globalStore.tokenSum || 0 }}</span>
            </div>
            <div>
              <span class="text-white/40 uppercase tracking-widest text-xs">Accuracy:</span>
              <span class="text-white/80 ml-2 font-medium">
                {{ globalStore.userProfile?.rate ? Math.round(globalStore.userProfile.rate.accuracy * 100) : 0 }}%
              </span>
            </div>
          </div>

          <!-- Energy Display - MV3 Style -->
          <EnergyBar :value="globalStore.energyPercentage" />
        </div>

        <!-- Main Actions -->
        <div class="space-y-6 pt-4">
          <div class="text-center space-y-2">
            <h2 class="text-white/70 uppercase tracking-widest text-xs font-medium">Club Management</h2>
            <p class="text-white/40 text-sm">
              Build your club, train players, and compete in leagues!
            </p>
          </div>

          <!-- Separator -->
          <div class="h-[1px] w-full bg-white/10" />

          <div class="flex flex-col gap-4">
            <Button
              @click="router.push('/game')"
              variant="game-primary"
              size="game-lg"
              class="w-full gap-3"
            >
              <Users class="w-5 h-5" />
              My Club
            </Button>
            <Button
              @click="goToLeaderboard"
              variant="game-outline"
              size="game"
              class="w-full gap-3"
            >
              <Trophy class="w-5 h-5" />
              View Leaderboard
            </Button>
            <Button
              @click="goToDolphia"
              variant="game-ghost"
              size="game"
              class="w-full gap-3"
            >
              <ArrowLeft class="w-5 h-5" />
              Back to Dolphia
            </Button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else class="flex items-center justify-center min-h-[80vh]">
        <Loader variant="game" title="LOADING CLUB MANAGEMENT" subtitle="Preparing..." />
      </div>
    </div>
  </div>
</template>
