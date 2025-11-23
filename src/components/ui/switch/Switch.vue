<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  SwitchRoot,

  SwitchThumb,
  useForwardPropsEmits,
} from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SwitchRootProps & { class?: HTMLAttributes["class"] }>()

const emits = defineEmits<SwitchRootEmits>()

const delegatedProps = reactiveOmit(props, "class")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SwitchRoot
    data-slot="switch"
    v-bind="forwarded"
    :class="cn(
      'peer data-[state=checked]:bg-blue-700 data-[state=unchecked]:bg-gray-800 inline-flex h-6 w-12 shrink-0 items-center border-4 border-gray-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50 p-0.5',
      props.class,
    )"
    style="border-radius: 0;"
  >
    <SwitchThumb
      data-slot="switch-thumb"
      :class="cn('bg-white pointer-events-none block size-4 ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%)] data-[state=unchecked]:translate-x-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)]')"
      style="border-radius: 0;"
    >
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>
