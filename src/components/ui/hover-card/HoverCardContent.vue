<script setup lang="ts">
import type { HoverCardContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  HoverCardContent,

  HoverCardPortal,
  useForwardProps,
} from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<HoverCardContentProps & {
    class?: HTMLAttributes["class"]
    variant?: 'default' | 'game'
  }>(),
  {
    sideOffset: 4,
  },
)

const delegatedProps = reactiveOmit(props, "class", "variant")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <HoverCardPortal>
    <HoverCardContent
      data-slot="hover-card-content"
      v-bind="forwardedProps"
      :class="
        cn(
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 p-4 backdrop-blur-md outline-hidden',
          // Default variant
          props.variant !== 'game' && 'bg-gradient-to-b from-slate-50/98 to-slate-100/98 dark:from-slate-800/98 dark:to-slate-900/98 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)] rounded-2xl',
          // MV3 game variant
          props.variant === 'game' && 'bg-[#1a1025]/95 text-white border border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] rounded-lg',
          props.class,
        )
      "
    >
      <slot />
    </HoverCardContent>
  </HoverCardPortal>
</template>
