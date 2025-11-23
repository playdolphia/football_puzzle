<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <tfoot
    data-slot="table-footer"
    :class="cn('bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200/50 dark:border-slate-700/50 font-medium [&>tr]:last:border-b-0', props.class)"
  >
    <slot />
  </tfoot>
</template>
