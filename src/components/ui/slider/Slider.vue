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
    style="font-family: 'Courier New', monospace;"
  >
    <SliderTrack
      data-slot="slider-track"
      class="bg-gray-800 relative grow overflow-hidden border-2 border-gray-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] data-[orientation=horizontal]:h-3 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-3"
      style="border-radius: 0;"
    >
      <SliderRange
        data-slot="slider-range"
        class="bg-blue-700 absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
      />
    </SliderTrack>

    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      data-slot="slider-thumb"
      class="border-blue-950 bg-white block size-5 shrink-0 border-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] transition-all hover:scale-110 focus-visible:scale-110 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
      style="border-radius: 0;"
    />
  </SliderRoot>
</template>
