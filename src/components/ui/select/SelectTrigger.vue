<script setup lang="ts">
import type { SelectTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ChevronDown } from "lucide-vue-next"
import { SelectIcon, SelectTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<SelectTriggerProps & {
    class?: HTMLAttributes["class"]
    size?: "sm" | "default"
    variant?: 'default' | 'game'
  }>(),
  { size: "default" },
)

const delegatedProps = reactiveOmit(props, "class", "size", "variant")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    data-slot="select-trigger"
    :data-size="size"
    v-bind="forwardedProps"
    :class="cn(
      'flex w-fit items-center justify-between gap-2 text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50',
      '*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2',
      '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
      // Default variant
      props.variant !== 'game' && [
        'px-4 py-2 data-[size=default]:h-11 data-[size=sm]:h-9',
        'border border-slate-200/50 dark:border-slate-700/50',
        'data-[placeholder]:text-slate-400 text-slate-700 dark:text-slate-200',
        'bg-white/80 dark:bg-slate-800/80',
        'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] rounded-xl backdrop-blur-sm',
        'hover:border-emerald-400 hover:shadow-[0_4px_12px_-2px_rgba(16,185,129,0.2)]',
        'focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400/20'
      ],
      // MV3 game variant - minimal, bottom border only
      props.variant === 'game' && [
        'px-0 py-2 h-auto',
        'border-0 border-b border-white/20',
        'data-[placeholder]:text-white/30 text-white',
        'bg-transparent rounded-none',
        'hover:border-[#4fd4d4]',
        'focus-visible:border-[#4fd4d4]'
      ],
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown :class="cn('size-4', props.variant === 'game' && 'text-white/50')" />
    </SelectIcon>
  </SelectTrigger>
</template>
