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
      cn('flex touch-none p-0.5 transition-colors select-none',
         orientation === 'vertical'
           && 'h-full w-2.5',
         orientation === 'horizontal'
           && 'h-2.5 flex-col',
         props.class)"
  >
    <ScrollAreaThumb
      data-slot="scroll-area-thumb"
      class="bg-slate-300 dark:bg-slate-600 relative flex-1 rounded-full hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors"
    />
  </ScrollAreaScrollbar>
</template>
