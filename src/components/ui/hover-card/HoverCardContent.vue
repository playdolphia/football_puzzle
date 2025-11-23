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
  defineProps<HoverCardContentProps & { class?: HTMLAttributes["class"] }>(),
  {
    sideOffset: 4,
  },
)

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <HoverCardPortal>
    <HoverCardContent
      data-slot="hover-card-content"
      v-bind="forwardedProps"
      :class="
        cn(
          'bg-gradient-to-b from-gray-800 to-gray-900 text-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 border-4 border-gray-950 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] outline-hidden font-bold',
          props.class,
        )
      "
      style="border-radius: 0; font-family: 'Courier New', monospace;"
    >
      <slot />
    </HoverCardContent>
  </HoverCardPortal>
</template>
