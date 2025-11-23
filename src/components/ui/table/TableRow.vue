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
    :class="cn('hover:bg-gray-800 data-[state=selected]:bg-gray-700 border-b-2 border-gray-950 transition-colors', props.class)"
  >
    <slot />
  </tr>
</template>
