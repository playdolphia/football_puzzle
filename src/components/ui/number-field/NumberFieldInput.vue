<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { NumberFieldInput } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <NumberFieldInput
    data-slot="input"
    :class="cn('flex h-11 w-full border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 py-2 text-sm text-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] transition-all duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-emerald-400 focus-visible:shadow-[0_4px_12px_-2px_rgba(16,185,129,0.2)] focus-visible:ring-2 focus-visible:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50 text-slate-700 dark:text-slate-200 font-medium rounded-xl backdrop-blur-sm', props.class)"
  />
</template>
