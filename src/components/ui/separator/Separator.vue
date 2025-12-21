<script setup lang="ts">
import type { SeparatorProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { Separator } from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<
  SeparatorProps & {
    class?: HTMLAttributes["class"]
    variant?: 'default' | 'game'
  }
>(), {
  orientation: "horizontal",
  decorative: true,
})

const delegatedProps = reactiveOmit(props, "class", "variant")
</script>

<template>
  <Separator
    data-slot="separator-root"
    v-bind="delegatedProps"
    :class="
      cn(
        'shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        // Default variant
        props.variant !== 'game' && 'bg-slate-200/50 dark:bg-slate-700/50',
        // MV3 game variant - subtle white line
        props.variant === 'game' && 'bg-white/10',
        props.class,
      )
    "
  />
</template>
