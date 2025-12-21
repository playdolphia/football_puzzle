<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SliderRootProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()
const emits = defineEmits<SliderRootEmits>()

const delegatedProps = reactiveOmit(props, "class", "variant")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SliderRoot
    v-slot="{ modelValue }"
    data-slot="slider"
    :class="cn(
      'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
      props.class,
    )"
    v-bind="forwarded"
  >
    <SliderTrack
      data-slot="slider-track"
      :class="cn(
        'relative grow overflow-hidden data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full',
        // Default variant
        props.variant !== 'game' && 'bg-slate-200 dark:bg-slate-700 shadow-inner data-[orientation=horizontal]:h-2 data-[orientation=vertical]:w-2 rounded-full',
        // MV3 game variant - thin line
        props.variant === 'game' && 'bg-white/20 data-[orientation=horizontal]:h-0.5 data-[orientation=vertical]:w-0.5 rounded-none'
      )"
    >
      <SliderRange
        data-slot="slider-range"
        :class="cn(
          'absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full',
          // Default variant
          props.variant !== 'game' && 'bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full',
          // MV3 game variant - cyan accent
          props.variant === 'game' && 'bg-[#4fd4d4] rounded-none'
        )"
      />
    </SliderTrack>

    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      data-slot="slider-thumb"
      :class="cn(
        'block shrink-0 transition-all duration-200 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50',
        // Default variant
        props.variant !== 'game' && 'border-2 border-emerald-500 bg-white dark:bg-slate-100 size-5 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.4)] hover:scale-110 hover:shadow-[0_4px_12px_-2px_rgba(16,185,129,0.5)] focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-emerald-400/30 rounded-full',
        // MV3 game variant - minimal circle
        props.variant === 'game' && 'bg-[#4fd4d4] size-3 rounded-full hover:scale-125 focus-visible:scale-125'
      )"
    />
  </SliderRoot>
</template>
