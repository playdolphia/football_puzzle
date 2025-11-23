<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <thead
    data-slot="table-header"
    :class="cn('bg-slate-50/80 dark:bg-slate-800/80 [&_tr]:border-b [&_tr]:border-slate-200/50 dark:[&_tr]:border-slate-700/50', props.class)"
  >
    <slot />
  </thead>
</template>
