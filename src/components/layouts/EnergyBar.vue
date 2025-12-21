<script setup lang="ts">
// EnergyBar - Monument Valley 3 style: minimal line-based progress
import { cn } from '@/lib/utils'
import { computed } from 'vue'

interface Props {
  value: number // 0-100
  showLabel?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true
})

const barColor = computed(() => {
  if (props.value >= 70) return 'bg-[#4fd4d4]'
  if (props.value >= 40) return 'bg-amber-400'
  return 'bg-rose-400'
})
</script>

<template>
  <div :class="cn('w-full', props.class)">
    <!-- Label row -->
    <div v-if="showLabel" class="flex items-center justify-between mb-2">
      <span class="text-xs font-medium text-white/40 tracking-widest uppercase">Energy</span>
      <span class="text-sm font-light text-white">{{ value }}%</span>
    </div>

    <!-- Progress bar - minimal line -->
    <div class="relative h-[2px] overflow-hidden bg-white/10">
      <!-- Progress fill -->
      <div
        class="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
        :class="barColor"
        :style="{ width: `${Math.min(100, Math.max(0, value))}%` }"
      />
    </div>
  </div>
</template>
