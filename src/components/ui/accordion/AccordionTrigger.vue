<script setup lang="ts">
import type { AccordionTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ChevronDown } from "lucide-vue-next"
import {
  AccordionHeader,
  AccordionTrigger,

} from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<AccordionTriggerProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()

const delegatedProps = reactiveOmit(props, "class", "variant")
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      data-slot="accordion-trigger"
      v-bind="delegatedProps"
      :class="
        cn(
          'flex flex-1 items-start justify-between gap-4 py-4 text-left text-sm font-medium transition-all duration-200 outline-none disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
          // Default variant
          props.variant !== 'game' && 'hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 rounded-xl px-2 -mx-2',
          // MV3 game variant
          props.variant === 'game' && 'text-white hover:text-[#4fd4d4] px-0',
          props.class,
        )
      "
    >
      <slot />
      <slot name="icon">
        <ChevronDown
          :class="cn(
            'pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200',
            props.variant !== 'game' && 'text-gray-300',
            props.variant === 'game' && 'text-white/50'
          )"
        />
      </slot>
    </AccordionTrigger>
  </AccordionHeader>
</template>
