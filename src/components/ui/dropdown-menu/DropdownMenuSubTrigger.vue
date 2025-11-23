<script setup lang="ts">
import type { DropdownMenuSubTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ChevronRight } from "lucide-vue-next"
import {
  DropdownMenuSubTrigger,

  useForwardProps,
} from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<DropdownMenuSubTriggerProps & { class?: HTMLAttributes["class"], inset?: boolean }>()

const delegatedProps = reactiveOmit(props, "class", "inset")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <DropdownMenuSubTrigger
    data-slot="dropdown-menu-sub-trigger"
    v-bind="forwardedProps"
    :class="cn(
      'focus:bg-slate-100 dark:focus:bg-slate-700/50 focus:text-slate-900 dark:focus:text-slate-100 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-700/50 data-[state=open]:text-slate-900 dark:data-[state=open]:text-slate-100 text-slate-600 dark:text-slate-300 flex cursor-default items-center px-3 py-2 text-sm outline-hidden select-none data-[inset]:pl-8 rounded-lg transition-colors duration-150',
      props.class,
    )"
  >
    <slot />
    <ChevronRight class="ml-auto size-4" />
  </DropdownMenuSubTrigger>
</template>
