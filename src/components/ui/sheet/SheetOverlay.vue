<script setup lang="ts">
import type { DialogOverlayProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { DialogOverlay } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<DialogOverlayProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()

const delegatedProps = reactiveOmit(props, "class", "variant")
</script>

<template>
  <DialogOverlay
    data-slot="sheet-overlay"
    :class="cn(
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 backdrop-blur-sm',
      props.variant !== 'game' && 'bg-slate-900/60',
      props.variant === 'game' && 'bg-[#1a1025]/85',
      props.class
    )"
    v-bind="delegatedProps"
  >
    <slot />
  </DialogOverlay>
</template>
