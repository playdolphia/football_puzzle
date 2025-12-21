<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy } from 'lucide-vue-next'

const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#0a0812] relative">
    <!-- Back button -->
    <div class="absolute top-4 left-4 z-20">
      <Button @click="goBack" variant="game-icon" size="game-icon">
        <ArrowLeft class="w-5 h-5" />
      </Button>
    </div>

    <div class="container mx-auto max-w-md px-4 py-6 pt-20">
      <div class="space-y-8 text-center">
        <!-- Header -->
        <h1 class="text-white uppercase tracking-widest text-sm font-medium">Leaderboard</h1>

        <!-- Separator -->
        <div class="h-[1px] w-full bg-white/10" />

        <!-- Coming Soon Content -->
        <div class="py-12 space-y-6">
          <div class="w-16 h-16 mx-auto border border-white/20 flex items-center justify-center">
            <Trophy class="w-8 h-8 text-[#4fd4d4]" />
          </div>

          <div class="space-y-2">
            <h2 class="text-white text-lg font-light">Coming Soon</h2>
            <p class="text-white/40 text-sm">The leaderboard will be available soon!</p>
          </div>
        </div>

        <!-- Separator -->
        <div class="h-[1px] w-full bg-white/10" />

        <Button @click="goBack" variant="game-ghost" size="game" class="w-full gap-2">
          <ArrowLeft class="w-4 h-4" />
          Back to Home
        </Button>
      </div>
    </div>
  </div>
</template>
