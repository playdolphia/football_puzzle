<script setup lang="ts">
import type { DropdownMenuItemProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { DropdownMenuItem, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<DropdownMenuItemProps & {
  class?: HTMLAttributes["class"]
  inset?: boolean
  variant?: "default" | "destructive" | "game"
}>(), {
  variant: "default",
})

const delegatedProps = reactiveOmit(props, "inset", "variant", "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <DropdownMenuItem
    data-slot="dropdown-menu-item"
    :data-inset="inset ? '' : undefined"
    :data-variant="variant"
    v-bind="forwardedProps"
    :class="cn(
      'relative flex cursor-default items-center gap-2 px-3 py-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4 transition-colors duration-150',
      // Default variant
      props.variant === 'default' && 'focus:bg-slate-100 dark:focus:bg-slate-700/50 focus:text-slate-900 dark:focus:text-slate-100 text-slate-600 dark:text-slate-300 rounded-lg',
      // Destructive variant
      props.variant === 'destructive' && 'text-rose-500 focus:bg-rose-100/50 dark:focus:bg-rose-900/30 focus:text-rose-500 rounded-lg',
      // MV3 game variant
      props.variant === 'game' && 'text-white/70 focus:bg-white/5 focus:text-[#4fd4d4] hover:bg-white/5 hover:text-white rounded-md',
      props.class
    )"
  >
    <slot />
  </DropdownMenuItem>
</template>
