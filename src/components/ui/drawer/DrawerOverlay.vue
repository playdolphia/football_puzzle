<script lang="ts" setup>
import type { DialogOverlayProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { DrawerOverlay } from "vaul-vue"
import { cn } from "@/lib/utils"

const props = defineProps<DialogOverlayProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()

const delegatedProps = reactiveOmit(props, "class", "variant")
</script>

<template>
  <DrawerOverlay
    data-slot="drawer-overlay"
    v-bind="delegatedProps"
    :class="cn(
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50',
      props.variant === 'game'
        ? 'bg-[#1a1025]/85 backdrop-blur-sm'
        : 'bg-slate-900/60 backdrop-blur-sm',
      props.class
    )"
  />
</template>
