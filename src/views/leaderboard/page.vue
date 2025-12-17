<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGlobalStore } from '@/stores'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const globalStore = useGlobalStore()

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative">
    <!-- Back button -->
    <div class="absolute top-4 left-4 z-20">
      <Button @click="goBack" size="icon" class="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-xl shadow-[0_4px_12px_-4px_rgba(0,0,0,0.2)] transition-all duration-200">
        <ArrowLeft class="w-4 h-4" />
      </Button>
    </div>

    <div class="container mx-auto max-w-2xl px-4 py-6 pt-20">
      <Card class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
        <CardHeader>
          <CardTitle class="text-2xl text-white text-center">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent class="p-12 text-center">
          <div class="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center">
            <span class="text-5xl">🏆</span>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">Coming Soon</h3>
          <p class="text-white/50 mb-6">The leaderboard will be available soon!</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
