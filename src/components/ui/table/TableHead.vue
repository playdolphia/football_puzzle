<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()
</script>

<template>
  <th
    data-slot="table-head"
    :class="cn(
      'h-12 px-4 text-left align-middle font-semibold text-xs uppercase tracking-wider whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      props.variant !== 'game' && 'text-slate-500 dark:text-slate-400',
      props.variant === 'game' && 'text-white/50',
      props.class
    )"
  >
    <slot />
  </th>
</template>
