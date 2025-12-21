<script setup lang="ts">
import type { VariantProps } from "class-variance-authority"
import type { ToggleGroupItemProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ToggleGroupItem, useForwardProps } from "reka-ui"
import { inject } from "vue"
import { cn } from "@/lib/utils"
import { toggleVariants } from '@/components/ui/toggle'

type ToggleGroupVariants = VariantProps<typeof toggleVariants>

const props = defineProps<ToggleGroupItemProps & {
  class?: HTMLAttributes["class"]
  variant?: ToggleGroupVariants["variant"]
  size?: ToggleGroupVariants["size"]
}>()

const context = inject<ToggleGroupVariants>("toggleGroup")
const effectiveVariant = context?.variant || props.variant

const delegatedProps = reactiveOmit(props, "class", "size", "variant")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <ToggleGroupItem
    v-slot="slotProps"
    data-slot="toggle-group-item"
    :data-variant="effectiveVariant"
    :data-size="context?.size || size"
    v-bind="forwardedProps"
    :class="cn(
      toggleVariants({
        variant: effectiveVariant,
        size: context?.size || size,
      }),
      'min-w-0 flex-1 shrink-0 shadow-none border-0 focus:z-10 focus-visible:z-10',
      // Default variant
      effectiveVariant !== 'game' && 'rounded-none first:rounded-l-lg last:rounded-r-lg',
      // MV3 game variant
      effectiveVariant === 'game' && 'rounded-none',
      props.class)"
  >
    <slot v-bind="slotProps" />
  </ToggleGroupItem>
</template>
