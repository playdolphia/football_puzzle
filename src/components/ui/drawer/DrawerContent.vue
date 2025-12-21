<script lang="ts" setup>
import type { DialogContentEmits, DialogContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { useForwardPropsEmits } from "reka-ui"
import { DrawerContent, DrawerPortal } from "vaul-vue"
import { cn } from "@/lib/utils"
import DrawerOverlay from "./DrawerOverlay.vue"

const props = defineProps<DialogContentProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, "class", "variant")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay :variant="props.variant" />
    <DrawerContent
      data-slot="drawer-content"
      v-bind="forwarded"
      :class="cn(
        // Base positioning
        'group/drawer-content fixed z-50 flex h-auto flex-col',
        // Default variant
        props.variant !== 'game' && [
          'bg-gradient-to-b from-slate-50/98 to-slate-100/98 dark:from-slate-800/98 dark:to-slate-900/98',
          'border border-slate-200/50 dark:border-slate-700/50',
          'shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.15)] backdrop-blur-md',
          'text-slate-700 dark:text-slate-200 rounded-t-3xl'
        ],
        // MV3 game variant - transparent, no background
        props.variant === 'game' && [
          'bg-transparent',
          'text-white'
        ],
        // Direction styles
        'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh]',
        props.variant !== 'game' && 'data-[vaul-drawer-direction=top]:rounded-t-none data-[vaul-drawer-direction=top]:rounded-b-3xl',
        'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh]',
        'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:sm:max-w-sm',
        props.variant !== 'game' && 'data-[vaul-drawer-direction=right]:rounded-l-3xl data-[vaul-drawer-direction=right]:rounded-r-none',
        'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:sm:max-w-sm',
        props.variant !== 'game' && 'data-[vaul-drawer-direction=left]:rounded-r-3xl data-[vaul-drawer-direction=left]:rounded-l-none',
        props.class,
      )"
    >
      <!-- Handle bar - different styles -->
      <div
        v-if="props.variant !== 'game'"
        class="bg-slate-300 dark:bg-slate-600 mx-auto mt-4 hidden h-1.5 w-12 shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block"
      />
      <div
        v-else
        class="bg-white/20 mx-auto mt-4 hidden h-[2px] w-12 shrink-0 group-data-[vaul-drawer-direction=bottom]/drawer-content:block"
      />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
