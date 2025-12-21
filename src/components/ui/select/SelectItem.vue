<script setup lang="ts">
import type { SelectItemProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { Check } from "lucide-vue-next"
import {
  SelectItem,
  SelectItemIndicator,

  SelectItemText,
  useForwardProps,
} from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SelectItemProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()

const delegatedProps = reactiveOmit(props, "class", "variant")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectItem
    data-slot="select-item"
    v-bind="forwardedProps"
    :class="
      cn(
        'relative flex w-full cursor-default items-center gap-2 py-2 pr-8 pl-3 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 transition-colors duration-150',
        // Default variant
        props.variant !== 'game' && [
          'focus:bg-slate-100 dark:focus:bg-slate-700/50',
          'focus:text-slate-900 dark:focus:text-slate-100',
          'hover:bg-slate-100/50 dark:hover:bg-slate-700/30',
          'rounded-lg'
        ],
        // MV3 game variant
        props.variant === 'game' && [
          'focus:bg-white/5',
          'focus:text-[#4fd4d4]',
          'hover:bg-white/5 hover:text-white',
          'text-white/70',
          'rounded-md'
        ],
        props.class,
      )
    "
  >
    <span class="absolute right-2 flex size-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check :class="cn('size-4', props.variant === 'game' && 'text-[#4fd4d4]')" />
      </SelectItemIndicator>
    </span>

    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
