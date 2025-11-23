<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SliderRootProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<SliderRootEmits>()

const delegatedProps = reactiveOmit(props, "class")

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
      class="bg-slate-200 dark:bg-slate-700 relative grow overflow-hidden shadow-inner data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2 rounded-full"
    >
      <SliderRange
        data-slot="slider-range"
        class="bg-gradient-to-r from-emerald-400 to-emerald-500 absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full rounded-full"
      />
    </SliderTrack>

    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      data-slot="slider-thumb"
      class="border-2 border-emerald-500 bg-white dark:bg-slate-100 block size-5 shrink-0 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.4)] transition-all duration-200 hover:scale-110 hover:shadow-[0_4px_12px_-2px_rgba(16,185,129,0.5)] focus-visible:scale-110 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400/30 disabled:pointer-events-none disabled:opacity-50 rounded-full"
    />
  </SliderRoot>
</template>
