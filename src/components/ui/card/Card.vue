<script setup lang="ts">
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
        'bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col gap-6 border-8 border-gray-950 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.9)]',
        props.hoverable ? 'hover:scale-105 transition-all duration-200 cursor-pointer hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.9)]' : '',
        props.class,
      )
    "
    style="border-radius: 0; font-family: 'Courier New', monospace;"
  >
    <slot />
  </div>
</template>
