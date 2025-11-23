<script setup lang="ts">
import type { TabsTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    v-bind="forwardedProps"
    :class="cn(
      `data-[state=active]:bg-blue-700 data-[state=active]:text-white data-[state=active]:border-blue-950 text-gray-300 inline-flex h-full flex-1 items-center justify-center gap-1.5 border-2 border-transparent px-3 py-2 text-sm font-bold whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:bg-gray-800 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
      props.class,
    )"
    style="border-radius: 0; font-family: 'Courier New', monospace;"
  >
    <slot />
  </TabsTrigger>
</template>
