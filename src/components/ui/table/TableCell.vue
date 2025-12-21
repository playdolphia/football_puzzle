<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()
</script>

<template>
  <td
    data-slot="table-cell"
    :class="
      cn(
        'p-4 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        props.variant !== 'game' && 'text-slate-600 dark:text-slate-300',
        props.variant === 'game' && 'text-white/70',
        props.class,
      )
    "
  >
    <slot />
  </td>
</template>
