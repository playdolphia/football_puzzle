<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div data-slot="table-container" class="relative w-full overflow-auto border-4 border-gray-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]" style="border-radius: 0;">
    <table data-slot="table" :class="cn('w-full caption-bottom text-sm text-white font-bold', props.class)" style="font-family: 'Courier New', monospace;">
      <slot />
    </table>
  </div>
</template>
