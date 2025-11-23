<script setup lang="ts">
import type { DropdownMenuRadioItemEmits, DropdownMenuRadioItemProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { Circle } from "lucide-vue-next"
import {
  DropdownMenuItemIndicator,
  DropdownMenuRadioItem,

  useForwardPropsEmits,
} from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<DropdownMenuRadioItemProps & { class?: HTMLAttributes["class"] }>()

const emits = defineEmits<DropdownMenuRadioItemEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DropdownMenuRadioItem
    data-slot="dropdown-menu-radio-item"
    v-bind="forwarded"
    :class="cn(
      `focus:bg-slate-100 dark:focus:bg-slate-700/50 focus:text-slate-900 dark:focus:text-slate-100 text-slate-600 dark:text-slate-300 relative flex cursor-default items-center gap-2 py-2 pr-3 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 rounded-lg transition-colors duration-150`,
      props.class,
    )"
  >
    <span class="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
      <DropdownMenuItemIndicator>
        <Circle class="size-2 fill-current text-emerald-500" />
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </DropdownMenuRadioItem>
</template>
