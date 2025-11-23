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
    :class="cn('flex h-10 w-full border-4 border-gray-950 bg-gray-800 py-2 text-sm text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] disabled:cursor-not-allowed disabled:opacity-50 text-white font-bold', props.class)"
    style="border-radius: 0; font-family: 'Courier New', monospace;"
  />
</template>
