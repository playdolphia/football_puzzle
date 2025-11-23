<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <tr
    data-slot="table-row"
    :class="cn('hover:bg-slate-50/50 dark:hover:bg-slate-700/30 data-[state=selected]:bg-slate-100/50 dark:data-[state=selected]:bg-slate-700/50 border-b border-slate-200/50 dark:border-slate-700/50 transition-colors duration-150', props.class)"
  >
    <slot />
  </tr>
</template>
