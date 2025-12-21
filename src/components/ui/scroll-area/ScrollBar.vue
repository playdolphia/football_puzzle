<script setup lang="ts">
import type { ScrollAreaScrollbarProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ScrollAreaScrollbar, ScrollAreaThumb } from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<ScrollAreaScrollbarProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>(), {
  orientation: "vertical",
})

const delegatedProps = reactiveOmit(props, "class", "variant")
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
      :class="cn(
        'relative flex-1 rounded-full transition-colors',
        props.variant !== 'game' && 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500',
        props.variant === 'game' && 'bg-white/20 hover:bg-white/30'
      )"
    />
  </ScrollAreaScrollbar>
</template>
