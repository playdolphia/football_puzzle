<script setup lang="ts">
import type { TooltipContentEmits, TooltipContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TooltipArrow, TooltipContent, TooltipPortal, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TooltipContentProps & { class?: HTMLAttributes["class"] }>(), {
  sideOffset: 4,
})

const emits = defineEmits<TooltipContentEmits>()

const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      data-slot="tooltip-content"
      v-bind="{ ...forwarded, ...$attrs }"
      :class="cn('bg-slate-800 dark:bg-slate-900 text-white border border-slate-700/50 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.25)] backdrop-blur-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit px-3 py-1.5 text-xs text-balance rounded-lg', props.class)"
    >
      <slot />

      <TooltipArrow class="bg-slate-800 dark:bg-slate-900 fill-slate-800 dark:fill-slate-900 z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-sm" />
    </TooltipContent>
  </TooltipPortal>
</template>
