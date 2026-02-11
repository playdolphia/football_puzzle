<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen w-full bg-background flex items-center justify-center px-4">
    <div class="max-w-lg w-full space-y-12 text-center">
      <!-- 404 Number - Large and artistic -->
      <div class="space-y-6">
        <div class="relative">
          <h1 class="text-[12rem] font-bold text-[#8ba888]/10 leading-none select-none">
            404
          </h1>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-20 h-20 rounded-full bg-[#8ba888]/5 flex items-center justify-center">
              <div class="w-12 h-12 rounded-full border-2 border-[#8ba888]/30"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="space-y-4">
        <h2 class="text-2xl font-semibold text-foreground tracking-tight">
          Page Not Found
        </h2>
        <p class="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
          The page you're looking for seems to have wandered off.
          Let's get you back on track.
        </p>
      </div>

      <!-- Separator -->
      <div class="flex items-center justify-center gap-3 py-2">
        <div class="h-px w-16 bg-border"></div>
        <div class="w-2 h-2 rounded-full bg-[#8ba888]/20"></div>
        <div class="h-px w-16 bg-border"></div>
      </div>

      <!-- Action -->
      <div>
        <button
          @click="goHome"
          class="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-[#8ba888] text-white font-medium shadow-sm hover:bg-[#7a9777] active:bg-[#6a8667] transition-all duration-300"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
      </div>
    </div>
  </div>
</template>
