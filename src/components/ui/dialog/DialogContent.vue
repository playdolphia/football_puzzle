<script setup lang="ts">
// Dialog - Monument Valley 3 style: minimal, no backgrounds
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
import DialogOverlay from "./DialogOverlay.vue"

const props = defineProps<DialogContentProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, "class", "variant")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay :variant="props.variant" />
    <DialogContent
      data-slot="dialog-content"
      v-bind="forwarded"
      :class="
        cn(
          // Animation
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          // Positioning
          'fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
          'w-full max-w-[calc(100%-2rem)] sm:max-w-md',
          'duration-300',
          // Default variant
          props.variant !== 'game' && [
            'bg-gradient-to-b from-slate-50/98 to-slate-100/98 dark:from-slate-800/98 dark:to-slate-900/98',
            'border border-slate-200/50 dark:border-slate-700/50',
            'p-6 rounded-3xl gap-4 grid',
            'shadow-[0_16px_64px_-16px_rgba(0,0,0,0.2),0_8px_24px_-8px_rgba(0,0,0,0.1)]',
            'text-slate-700 dark:text-slate-200',
            'backdrop-blur-md'
          ],
          // MV3 style - no background, just content floating on overlay
          props.variant === 'game' && [
            'bg-transparent',
            'p-6',
            'text-white'
          ],
          props.class,
        )"
    >
      <!-- Game variant - MV3 style content -->
      <div
        v-if="props.variant === 'game'"
        class="relative flex flex-col"
      >
        <slot />

        <!-- Close button - minimal X -->
        <DialogClose
          class="absolute -top-2 -right-2 transition-all duration-200 focus:outline-hidden disabled:pointer-events-none p-2 text-white/50 hover:text-[#4fd4d4]"
        >
          <X class="w-5 h-5" />
          <span class="sr-only">Close</span>
        </DialogClose>
      </div>

      <!-- Default variant content -->
      <template v-else>
        <slot />
        <DialogClose
          class="absolute top-4 right-4 opacity-60 transition-all duration-200 hover:opacity-100 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:scale-110 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full p-1.5 text-slate-500 dark:text-slate-400"
        >
          <X />
          <span class="sr-only">Close</span>
        </DialogClose>
      </template>
    </DialogContent>
  </DialogPortal>
</template>
