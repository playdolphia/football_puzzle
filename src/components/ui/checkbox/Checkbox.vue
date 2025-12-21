<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { Check } from "lucide-vue-next"
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<CheckboxRootProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = reactiveOmit(props, "class", "variant")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    data-slot="checkbox"
    v-bind="forwarded"
    :class="
      cn(
        'peer size-5 shrink-0 transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50',
        // Default variant
        props.variant !== 'game' && [
          'border border-slate-300 dark:border-slate-600',
          'data-[state=checked]:bg-gradient-to-b data-[state=checked]:from-emerald-400 data-[state=checked]:to-emerald-500',
          'data-[state=checked]:text-white data-[state=checked]:border-emerald-500',
          'bg-white dark:bg-slate-800 rounded-md',
          'shadow-[0_2px_4px_-1px_rgba(0,0,0,0.1)]',
          'hover:border-emerald-400 hover:shadow-[0_2px_8px_-2px_rgba(16,185,129,0.3)]',
          'focus-visible:ring-2 focus-visible:ring-emerald-400/20'
        ],
        // MV3 game variant - minimal
        props.variant === 'game' && [
          'border border-white/30',
          'data-[state=checked]:bg-transparent data-[state=checked]:border-[#4fd4d4]',
          'data-[state=checked]:text-[#4fd4d4]',
          'bg-transparent rounded-sm',
          'hover:border-white/50',
          'focus-visible:border-[#4fd4d4]'
        ],
        props.class
      )"
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="flex items-center justify-center text-current transition-none"
    >
      <slot>
        <Check class="size-4 font-bold stroke-[3]" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
