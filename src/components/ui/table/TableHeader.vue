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
    :class="cn('bg-gray-900 [&_tr]:border-b-4 [&_tr]:border-gray-950', props.class)"
  >
    <slot />
  </thead>
</template>
