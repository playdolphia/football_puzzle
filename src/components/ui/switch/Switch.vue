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
      'peer data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-400 data-[state=checked]:to-emerald-500 data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700 inline-flex h-6 w-11 shrink-0 items-center shadow-inner transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50 p-0.5 rounded-full',
      props.class,
    )"
  >
    <SwitchThumb
      data-slot="switch-thumb"
      :class="cn('bg-white pointer-events-none block size-5 ring-0 transition-transform duration-200 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.2)] rounded-full')"
    >
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>
