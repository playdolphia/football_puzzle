<script setup lang="ts">
// Monument Valley inspired CardTitle - elegant typography
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <h3
    data-slot="card-title"
    :class="cn('leading-tight font-semibold text-slate-800 dark:text-slate-100 text-xl tracking-tight', props.class)"
  >
    <slot />
  </h3>
</template>
