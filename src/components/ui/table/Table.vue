<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div data-slot="table-container" class="relative w-full overflow-auto border border-slate-200/50 dark:border-slate-700/50 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)] backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 rounded-2xl">
    <table data-slot="table" :class="cn('w-full caption-bottom text-sm text-slate-700 dark:text-slate-200', props.class)">
      <slot />
    </table>
  </div>
</template>
