<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()
</script>

<template>
  <div
    data-slot="table-container"
    :class="cn(
      'relative w-full overflow-auto',
      // Default variant
      props.variant !== 'game' && 'border border-slate-200/50 dark:border-slate-700/50 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)] backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-2xl',
      // MV3 game variant
      props.variant === 'game' && 'bg-transparent border-0'
    )"
  >
    <table
      data-slot="table"
      :class="cn(
        'w-full caption-bottom text-sm',
        props.variant !== 'game' && 'text-slate-700 dark:text-slate-200',
        props.variant === 'game' && 'text-white',
        props.class
      )"
    >
      <slot />
    </table>
  </div>
</template>
