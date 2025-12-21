<script setup lang="ts">
import type { DropdownMenuSeparatorProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  DropdownMenuSeparator,

} from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<DropdownMenuSeparatorProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()

const delegatedProps = reactiveOmit(props, "class", "variant")
</script>

<template>
  <DropdownMenuSeparator
    data-slot="dropdown-menu-separator"
    v-bind="delegatedProps"
    :class="cn(
      '-mx-1 my-1 h-px',
      props.variant !== 'game' && 'bg-slate-200/50 dark:bg-slate-700/50',
      props.variant === 'game' && 'bg-white/10',
      props.class
    )"
  />
</template>
