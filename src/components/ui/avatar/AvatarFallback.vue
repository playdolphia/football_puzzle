<script setup lang="ts">
import type { AvatarFallbackProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { AvatarFallback } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<AvatarFallbackProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()

const delegatedProps = reactiveOmit(props, "class", "variant")
</script>

<template>
  <AvatarFallback
    data-slot="avatar-fallback"
    v-bind="delegatedProps"
    :class="cn(
      'flex size-full items-center justify-center font-medium text-sm',
      // Default variant
      props.variant !== 'game' && 'bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300',
      // MV3 game variant
      props.variant === 'game' && 'bg-white/10 text-white/70',
      props.class
    )"
  >
    <slot />
  </AvatarFallback>
</template>
