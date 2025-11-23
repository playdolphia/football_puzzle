<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <p
    data-slot="card-description"
    :class="cn('text-gray-300 text-sm drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]', props.class)"
  >
    <slot />
  </p>
</template>
