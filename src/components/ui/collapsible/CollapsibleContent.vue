<script setup lang="ts">
import type { CollapsibleContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { CollapsibleContent } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<CollapsibleContentProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()

const delegatedProps = reactiveOmit(props, "class", "variant")
</script>

<template>
  <CollapsibleContent
    data-slot="collapsible-content"
    v-bind="delegatedProps"
    :class="cn(
      'overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
      // MV3 game variant
      props.variant === 'game' && 'text-white/70',
      props.class
    )"
  >
    <slot />
  </CollapsibleContent>
</template>
