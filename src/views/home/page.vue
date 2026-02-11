<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'

const router = useRouter()
const globalStore = useGlobalStore()

const avatarError = ref(false)

onMounted(() => {
  if (globalStore.isAuthenticated) {
    globalStore.getUserProfile()
  }
})

const displayName = computed(() => {
  const profile = globalStore.userProfile
  if (profile?.user_info?.display_name) return profile.user_info.display_name
  if (globalStore.user) return globalStore.user.username || 'Player'
  return 'Player'
})

const avatarUrl = computed(() => {
  return globalStore.userProfile?.user_info?.avatar || globalStore.user?.photo_url || null
})

const avatarInitials = computed(() => {
  const profile = globalStore.userProfile
  if (profile?.user_info?.display_name) {
    return profile.user_info.display_name.split(' ').map((i: string) => i[0]).join('').slice(0, 2)
  }
  return (globalStore.user?.username || 'P')[0].toUpperCase()
})

const goToDolphia = () => {
  const originUrl = import.meta.env.VITE_ORIGIN_URL || 'http://localhost:5173'
  window.open(originUrl, '_self')
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-6">
    <!-- Error State -->
    <div v-if="globalStore.authError" class="max-w-md w-full space-y-8 text-center">
      <div class="space-y-3">
        <p class="text-xs uppercase tracking-[0.3em] text-muted-foreground/60">Authentication Required</p>
        <p class="text-sm text-muted-foreground leading-relaxed">{{ globalStore.authError }}</p>
      </div>
      <button
        @click="goToDolphia"
        class="text-xs uppercase tracking-[0.25em] text-primary/70 hover:text-primary transition-colors duration-300"
      >
        Return to Dolphia
      </button>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-2xl w-full space-y-16 text-center">
      <!-- Decorative Element (CSS-only geometric pattern) -->
      <div class="flex justify-center">
        <div class="relative w-24 h-24">
          <!-- Outer hexagon -->
          <div class="absolute inset-0 border border-primary/20" style="clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"></div>
          <!-- Middle hexagon -->
          <div class="absolute inset-3 border border-primary/30" style="clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"></div>
          <!-- Inner hexagon -->
          <div class="absolute inset-6 border border-primary/40" style="clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"></div>
          <!-- Center dot -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-primary/50"></div>
          </div>
        </div>
      </div>

      <!-- Title -->
      <div class="space-y-6">
        <h1 class="text-5xl md:text-6xl font-light tracking-[0.3em] text-foreground uppercase">
          Puzzle
        </h1>
        <div class="w-16 h-px bg-primary/30 mx-auto"></div>
      </div>

      <!-- Greeting -->
      <div v-if="globalStore.user" class="space-y-3">
        <p class="text-sm tracking-[0.2em] text-muted-foreground/60 uppercase">
          Welcome
        </p>
        <div class="flex items-center justify-center gap-3">
          <img
            v-if="avatarUrl && !avatarError"
            :src="avatarUrl"
            :alt="displayName"
            class="w-10 h-10 rounded-full object-cover border border-primary/20"
            @error="avatarError = true"
          />
          <div
            v-else
            class="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-medium text-primary"
          >
            {{ avatarInitials }}
          </div>
          <div>
            <p class="text-lg tracking-[0.15em] text-foreground/80 font-light">
              {{ displayName }}
            </p>
            <p v-if="globalStore.user.username" class="text-xs tracking-widest text-muted-foreground/50">
              @{{ globalStore.user.username }}
            </p>
          </div>
        </div>
      </div>

      <!-- Daily Challenge -->
      <div class="space-y-6">
        <p class="text-xs tracking-[0.2em] text-muted-foreground/50 uppercase">
          Today's Challenge
        </p>
        <button
          @click="router.push('/puzzle')"
          class="group relative px-10 py-4 bg-primary/10 hover:bg-primary/15 rounded-2xl transition-all duration-500 mx-auto block"
        >
          <span class="text-lg tracking-[0.2em] text-primary uppercase font-light group-hover:tracking-[0.25em] transition-all duration-500">
            Play
          </span>
        </button>
        <p class="text-xs tracking-[0.15em] text-muted-foreground/30 leading-relaxed">
          Reassemble the pattern
        </p>
      </div>

      <!-- Decorative Divider -->
      <div class="flex items-center justify-center gap-4">
        <div class="w-12 h-px bg-primary/20"></div>
        <div class="w-1 h-1 rounded-full bg-primary/20"></div>
        <div class="w-12 h-px bg-primary/20"></div>
      </div>

      <!-- Back Link -->
      <button
        @click="goToDolphia"
        class="text-xs uppercase tracking-[0.25em] text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors duration-500"
      >
        Back to Dolphia
      </button>
    </div>
  </div>
</template>
