<script setup lang="ts">
// Monument Valley inspired Card - soft pastels, rounded corners, elegant shadows
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<{
  class?: HTMLAttributes["class"],
  hoverable?: boolean
}>(), {
  hoverable: false,
})
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'bg-gradient-to-b from-slate-50/95 to-slate-100/95 dark:from-slate-800/95 dark:to-slate-900/95 text-slate-700 dark:text-slate-200 flex flex-col gap-4 border border-slate-200/50 dark:border-slate-700/50 py-6 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1),0_4px_8px_-4px_rgba(0,0,0,0.05)] backdrop-blur-sm',
        props.hoverable ? 'hover:scale-[1.02] transition-all duration-300 ease-out cursor-pointer hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15),0_6px_12px_-4px_rgba(0,0,0,0.08)]' : '',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
