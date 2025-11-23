<script setup lang="ts">
import type { ScrollAreaScrollbarProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ScrollAreaScrollbar, ScrollAreaThumb } from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<ScrollAreaScrollbarProps & { class?: HTMLAttributes["class"] }>(), {
  orientation: "vertical",
})

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <ScrollAreaScrollbar
    data-slot="scroll-area-scrollbar"
    v-bind="delegatedProps"
    :class="
      cn('flex touch-none p-1 transition-colors select-none bg-gray-800',
         orientation === 'vertical'
           && 'h-full w-3 border-l-2 border-l-gray-950',
         orientation === 'horizontal'
           && 'h-3 flex-col border-t-2 border-t-gray-950',
         props.class)"
  >
    <ScrollAreaThumb
      data-slot="scroll-area-thumb"
      class="bg-gray-700 relative flex-1 border-2 border-gray-950"
      style="border-radius: 0;"
    />
  </ScrollAreaScrollbar>
</template>
