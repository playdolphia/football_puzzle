<script setup lang="ts">
// Card - Monument Valley 3 style: minimal, no backgrounds, lines only
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<{
  class?: HTMLAttributes["class"],
  hoverable?: boolean,
  variant?: 'default' | 'game'
}>(), {
  hoverable: false,
  variant: 'default'
})
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        // Base styles
        'relative flex flex-col',
        // Variant: default (original style)
        variant === 'default' && [
          'bg-gradient-to-b from-slate-50/95 to-slate-100/95 dark:from-slate-800/95 dark:to-slate-900/95',
          'text-slate-700 dark:text-slate-200',
          'border border-slate-200/50 dark:border-slate-700/50',
          'py-6 rounded-3xl',
          'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1),0_4px_8px_-4px_rgba(0,0,0,0.05)]',
          'backdrop-blur-sm'
        ],
        // Variant: game - Monument Valley 3 style (no background, minimal)
        variant === 'game' && [
          'bg-transparent',
          'text-white',
          'py-4'
        ],
        props.hoverable && 'hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
