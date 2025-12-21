<script setup lang="ts">
import type { DropdownMenuLabelProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { DropdownMenuLabel, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<DropdownMenuLabelProps & {
  class?: HTMLAttributes["class"]
  inset?: boolean
  variant?: 'default' | 'game'
}>()

const delegatedProps = reactiveOmit(props, "class", "inset", "variant")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <DropdownMenuLabel
    data-slot="dropdown-menu-label"
    :data-inset="inset ? '' : undefined"
    v-bind="forwardedProps"
    :class="cn(
      'px-3 py-2 text-xs font-semibold uppercase tracking-wider data-[inset]:pl-8',
      props.variant !== 'game' && 'text-slate-500 dark:text-slate-400',
      props.variant === 'game' && 'text-white/50',
      props.class
    )"
  >
    <slot />
  </DropdownMenuLabel>
</template>
