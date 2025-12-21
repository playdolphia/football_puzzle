<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { X } from "lucide-vue-next"
import {
  DialogClose,
  DialogContent,

  DialogPortal,
  useForwardPropsEmits,
} from "reka-ui"
import { cn } from "@/lib/utils"
import SheetOverlay from "./SheetOverlay.vue"

interface SheetContentProps extends DialogContentProps {
  class?: HTMLAttributes["class"]
  side?: "top" | "right" | "bottom" | "left"
  variant?: 'default' | 'game'
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SheetContentProps>(), {
  side: "right",
})
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, "class", "side", "variant")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <SheetOverlay :variant="props.variant" />
    <DialogContent
      data-slot="sheet-content"
      :class="cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 backdrop-blur-md transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
        // Default variant styles
        props.variant !== 'game' && 'bg-gradient-to-b from-slate-50/98 to-slate-100/98 dark:from-slate-800/98 dark:to-slate-900/98 text-slate-700 dark:text-slate-200 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.2)]',
        // MV3 game variant styles
        props.variant === 'game' && 'bg-transparent text-white',
        // Side-specific styles - default
        props.variant !== 'game' && side === 'right'
          && 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l border-slate-200/50 dark:border-slate-700/50 sm:max-w-sm rounded-l-3xl',
        props.variant !== 'game' && side === 'left'
          && 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r border-slate-200/50 dark:border-slate-700/50 sm:max-w-sm rounded-r-3xl',
        props.variant !== 'game' && side === 'top'
          && 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b border-slate-200/50 dark:border-slate-700/50 rounded-b-3xl',
        props.variant !== 'game' && side === 'bottom'
          && 'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t border-slate-200/50 dark:border-slate-700/50 rounded-t-3xl',
        // Side-specific styles - game variant
        props.variant === 'game' && side === 'right'
          && 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l border-white/10 sm:max-w-sm rounded-none',
        props.variant === 'game' && side === 'left'
          && 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r border-white/10 sm:max-w-sm rounded-none',
        props.variant === 'game' && side === 'top'
          && 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b border-white/10 rounded-none',
        props.variant === 'game' && side === 'bottom'
          && 'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t border-white/10 rounded-none',
        props.class)"
      v-bind="{ ...forwarded, ...$attrs }"
    >
      <slot />

      <DialogClose
        :class="cn(
          'absolute top-4 right-4 opacity-70 transition-all duration-200 hover:opacity-100 focus:outline-hidden disabled:pointer-events-none p-1.5',
          props.variant !== 'game' && 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200/50 dark:border-slate-600/50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] rounded-lg text-slate-500 dark:text-slate-400',
          props.variant === 'game' && 'bg-transparent hover:bg-white/10 border border-white/20 rounded-md text-white/70'
        )"
      >
        <X class="size-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
