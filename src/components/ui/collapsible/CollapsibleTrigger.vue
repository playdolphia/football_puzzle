<script setup lang="ts">
import type { CollapsibleTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { CollapsibleTrigger } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<CollapsibleTriggerProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()

const delegatedProps = reactiveOmit(props, "class", "variant")
</script>

<template>
  <CollapsibleTrigger
    data-slot="collapsible-trigger"
    v-bind="delegatedProps"
    :class="cn(
      'flex items-center justify-between transition-all duration-200 outline-none [&[data-state=open]>svg]:rotate-180',
      // MV3 game variant
      props.variant === 'game' && 'text-white hover:text-[#4fd4d4]',
      props.class
    )"
  >
    <slot />
  </CollapsibleTrigger>
</template>
