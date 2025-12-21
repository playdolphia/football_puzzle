<script setup lang="ts">
import type { TabsTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<TabsTriggerProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()

const delegatedProps = reactiveOmit(props, "class", "variant")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    v-bind="forwardedProps"
    :class="cn(
      'inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
      // Default variant
      props.variant !== 'game' && [
        'h-full flex-1 px-3 py-1.5 rounded-lg',
        'text-slate-500 dark:text-slate-400',
        'hover:text-slate-700 dark:hover:text-slate-200',
        'data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700',
        'data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100',
        'data-[state=active]:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.1)]'
      ],
      // MV3 game variant - minimal, text only
      props.variant === 'game' && [
        'px-0 py-2',
        'text-white/50 tracking-wide uppercase text-xs',
        'hover:text-white/70',
        'data-[state=active]:text-[#4fd4d4]',
        'data-[state=active]:border-b-2 data-[state=active]:border-[#4fd4d4]',
        'data-[state=active]:-mb-[2px]'
      ],
      props.class,
    )"
  >
    <slot />
  </TabsTrigger>
</template>
