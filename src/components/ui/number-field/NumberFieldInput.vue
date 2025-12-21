<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { NumberFieldInput } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()
</script>

<template>
  <NumberFieldInput
    data-slot="input"
    :class="cn(
      'flex h-11 w-full py-2 text-sm text-center transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 font-medium',
      // Default variant
      props.variant !== 'game' && 'border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] placeholder:text-slate-400 focus-visible:border-emerald-400 focus-visible:shadow-[0_4px_12px_-2px_rgba(16,185,129,0.2)] focus-visible:ring-2 focus-visible:ring-emerald-400/20 text-slate-700 dark:text-slate-200 rounded-xl backdrop-blur-sm',
      // MV3 game variant
      props.variant === 'game' && 'border-0 border-b border-white/20 bg-transparent placeholder:text-white/30 focus-visible:border-[#4fd4d4] text-white rounded-none',
      props.class
    )"
  />
</template>
