<script setup lang="ts">
import type { TabsListProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsList } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<TabsListProps & {
  class?: HTMLAttributes["class"]
  variant?: 'default' | 'game'
}>()

const delegatedProps = reactiveOmit(props, "class", "variant")
</script>

<template>
  <TabsList
    data-slot="tabs-list"
    :data-variant="props.variant"
    v-bind="delegatedProps"
    :class="cn(
      'inline-flex w-fit items-center justify-center',
      // Default variant
      props.variant !== 'game' && [
        'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300',
        'h-11 p-1 gap-1',
        'border border-slate-200/50 dark:border-slate-700/50',
        'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] backdrop-blur-sm rounded-xl'
      ],
      // MV3 game variant - minimal, no background
      props.variant === 'game' && [
        'bg-transparent text-white/50',
        'h-auto gap-6 pb-2',
        'border-b border-white/10'
      ],
      props.class,
    )"
  >
    <slot />
  </TabsList>
</template>
