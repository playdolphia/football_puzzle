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
      `data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.1)] text-slate-500 dark:text-slate-400 inline-flex h-full flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 hover:text-slate-700 dark:hover:text-slate-200 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 rounded-lg`,
      props.class,
    )"
  >
    <slot />
  </TabsTrigger>
</template>
