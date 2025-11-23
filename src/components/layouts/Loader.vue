<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
}

defineProps<Props>()
</script>

<template>
  <div class="text-center">
    <!-- Monument Valley style loader - soft, elegant, floating -->
    <div class="relative w-32 h-32 mx-auto mb-8">
      <!-- Soft glowing background -->
      <div class="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse"></div>

      <!-- Floating dice emoji -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="relative">
          <span class="text-6xl drop-shadow-[0_4px_20px_rgba(255,255,255,0.3)] animate-float">🎲</span>
        </div>
      </div>

      <!-- Soft spinning ring -->
      <div class="absolute inset-2 border-2 border-white/10 border-t-emerald-400/60 rounded-full animate-spin" style="animation-duration: 2s;"></div>

      <!-- Outer glow ring -->
      <div class="absolute inset-0 border border-white/5 rounded-full"></div>
    </div>

    <!-- Title - Monument Valley typography -->
    <p class="text-slate-700 dark:text-slate-200 text-xl font-semibold tracking-wide mb-2">
      {{ title }}
    </p>

    <!-- Subtitle (optional) -->
    <p v-if="subtitle" class="text-slate-500 dark:text-slate-400 text-sm font-medium">
      {{ subtitle }}
    </p>

    <!-- Animated dots - soft rounded style -->
    <div class="flex justify-center gap-2 mt-6">
      <div
        class="w-2 h-2 bg-emerald-400/80 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]"
        style="animation-delay: 0s;"
      ></div>
      <div
        class="w-2 h-2 bg-emerald-400/80 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]"
        style="animation-delay: 0.2s;"
      ></div>
      <div
        class="w-2 h-2 bg-emerald-400/80 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]"
        style="animation-delay: 0.4s;"
      ></div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
