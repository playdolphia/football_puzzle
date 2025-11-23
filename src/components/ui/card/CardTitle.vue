<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <h3
    data-slot="card-title"
    :class="cn('leading-none font-bold text-yellow-400 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] text-xl', props.class)"
  >
    <slot />
  </h3>
</template>
