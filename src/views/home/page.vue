<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, ArrowLeft, Trophy, Zap, Dices } from 'lucide-vue-next'
import Loader from '@/components/layouts/Loader.vue'

const router = useRouter()
const globalStore = useGlobalStore()
const userData = ref(null)
const error = ref('')

const startLadderGame = () => {
  // Check if user has enough energy
  if (!globalStore.canPlayGame) {
    return // Button should be disabled, but extra check
  }

  // Clear the intentionally left flag when user starts a new game
  globalStore.intentionallyLeftGame = false
  router.push('/ladder')
}

const goToProfile = () => {
  const originUrl = import.meta.env.VITE_ORIGIN_URL || 'http://localhost:5173'
  window.open(`${originUrl}/user/profile`, '_self')
}

const goToDolphia = () => {
  const originUrl = import.meta.env.VITE_ORIGIN_URL || 'http://localhost:5173'
  window.open(originUrl, '_self')
}

const goToBuyEnergy = () => {
  const originUrl = import.meta.env.VITE_ORIGIN_URL || 'http://localhost:5173'
  window.open(`${originUrl}/user/profile/marketplace`, '_self')
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

    // Check for ongoing passup game
    const gameStatus = await globalStore.getPassupGameStatus()

    // Only auto-redirect if there's an ongoing game AND user didn't intentionally leave
    // On page refresh (intentionallyLeftGame is false by default), we redirect to ongoing game
    if (gameStatus && gameStatus.ok && gameStatus.status === 'ongoing' && !globalStore.intentionallyLeftGame) {
      router.push('/game')
    }

    // Reset the flag if user is on home page (they can now start a new action)
    if (globalStore.intentionallyLeftGame) {
      globalStore.intentionallyLeftGame = false
    }
  } catch (err) {
    error.value = 'Failed to process authentication token'
    console.error('Token processing error:', err)
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto px-4 py-4">
      <!-- Error State -->
      <Card v-if="error" class="max-w-md mx-auto border-destructive">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-destructive">
            <AlertCircle class="w-5 h-5" />
            Authentication Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground mb-4">{{ error }}</p>
          <p class="text-sm mb-4">Please return to Dolphia and try again.</p>
          <Button @click="goToDolphia" variant="outline" class="w-full">
            Return to Dolphia
          </Button>
        </CardContent>
      </Card>

      <!-- Game Interface -->
      <div v-else-if="userData && globalStore.userProfile" class="max-w-2xl mx-auto space-y-4">
        <!-- Welcome Header -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-3">
              <button @click="goToProfile" class="flex items-center gap-3 text-left hover:opacity-80 transition-opacity cursor-pointer">
                <Avatar class="w-12 h-12">
                  <AvatarImage :src="globalStore.userProfile?.user_info?.avatar || globalStore.avatar" />
                  <AvatarFallback>
                    {{ globalStore.userProfile?.user_info?.display_name?.split(' ')?.map(i => i[0])?.join('') || 
                       (globalStore.user?.first_name?.[0] + (globalStore.user?.last_name?.[0] || '')) }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div class="text-lg">Welcome to Pass Up!</div>
                  <div class="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {{ globalStore.userProfile?.user_info?.display_name || 
                       (globalStore.user?.first_name + ' ' + globalStore.user?.last_name) }}
                  </div>
                </div>
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-muted-foreground">Tokens:</span>
                  <span class="font-medium ml-2">{{ globalStore.tokenSum || 0 }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">Accuracy:</span>
                  <span class="font-medium ml-2">
                    {{ globalStore.userProfile?.rate ? Math.round(globalStore.userProfile.rate.accuracy * 100) : 0 }}%
                  </span>
                </div>
              </div>

              <!-- Energy Display -->
              <div class="space-y-2 border-t pt-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Zap :class="globalStore.energyPercentage > 0 ? 'text-yellow-500' : 'text-muted-foreground'" class="w-4 h-4" />
                    <span class="text-sm font-medium">Energy</span>
                  </div>
                  <span class="text-sm font-bold" :class="globalStore.energyPercentage >= 20 ? 'text-green-500' : 'text-red-500'">
                    {{ globalStore.energyPercentage }}%
                  </span>
                </div>
                <div class="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all duration-300"
                    :class="globalStore.energyPercentage >= 20 ? 'bg-yellow-500' : 'bg-red-500'"
                    :style="{ width: `${globalStore.energyPercentage}%` }"
                  ></div>
                </div>
                <p v-if="globalStore.energyPercentage < 20" class="text-xs text-red-500">
                  ⚠️ Each game requires 20% energy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Game Area -->
        <Card>
          <CardHeader>
            <CardTitle>Ready to Play?</CardTitle>
          </CardHeader>
          <CardContent class="text-center">
            <p class="text-muted-foreground mb-6">
              Test your passing skills and earn tokens!
            </p>

            <!-- No Energy Warning -->
            <div v-if="!globalStore.canPlayGame" class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div class="flex items-center justify-center gap-2 text-red-500 mb-2">
                <AlertCircle class="w-5 h-5" />
                <span class="font-semibold">Insufficient Energy</span>
              </div>
            <p class="text-sm text-muted-foreground mb-3">
                You need at least 20% energy to play Pass Up.
              </p>
              <Button @click="goToBuyEnergy" variant="default" class="gap-2 w-full">
                <Zap class="w-4 h-4" />
                Buy Energy from Profile
              </Button>
            </div>

            <div class="flex flex-col gap-3">
              <Button
                @click="startLadderGame"
                size="lg"
                class="gap-2"
                :disabled="!globalStore.canPlayGame"
              >
                <Dices class="w-5 h-5" />
                {{ globalStore.canPlayGame ? 'Start Ladder Game' : 'Need Energy to Play' }}
              </Button>
              <Button @click="goToLeaderboard" variant="outline" size="lg" class="gap-2">
                <Trophy class="w-5 h-5" />
                View Leaderboard
              </Button>
              <Button @click="goToDolphia" variant="ghost" size="lg" class="gap-2">
                <ArrowLeft class="w-5 h-5" />
                Back to Dolphia
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Loading State -->
      <div v-else class="flex items-center justify-center min-h-[50vh]">
        <Loader title="LOADING PASS UP" subtitle="Preparing the field..." />
      </div>
    </div>
  </div>
</template>
