<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()
</script>

<template>
  <tr
    data-slot="table-row"
    :class="cn(
      'border-b transition-colors duration-150',
      // Default variant
      props.variant !== 'game' && 'hover:bg-slate-50/50 dark:hover:bg-slate-700/30 data-[state=selected]:bg-slate-100/50 dark:data-[state=selected]:bg-slate-700/50 border-slate-200/50 dark:border-slate-700/50',
      // MV3 game variant
      props.variant === 'game' && 'hover:bg-white/5 data-[state=selected]:bg-white/10 border-white/10',
      props.class
    )"
  >
    <slot />
  </tr>
</template>
