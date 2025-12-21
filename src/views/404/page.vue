<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#0a0812] flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8 text-center">
      <!-- Icon -->
      <div class="w-16 h-16 mx-auto border border-rose-400/30 flex items-center justify-center">
        <AlertTriangle class="w-8 h-8 text-rose-400" />
      </div>

      <!-- Content -->
      <div class="space-y-3">
        <h1 class="text-white uppercase tracking-widest text-sm font-medium">404 - Page Not Found</h1>
        <p class="text-white/40 text-sm">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
      </div>

      <!-- Separator -->
      <div class="h-[1px] w-full bg-white/10" />

      <!-- Action -->
      <Button @click="goHome" variant="game-primary" size="game" class="w-full gap-2">
        <ArrowLeft class="w-4 h-4" />
        Back to Home
      </Button>
    </div>
  </div>
</template>
