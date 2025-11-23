<script setup lang="ts">
import type { TabsListProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsList } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<TabsListProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <TabsList
    data-slot="tabs-list"
    v-bind="delegatedProps"
    :class="cn(
      'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 inline-flex h-11 w-fit items-center justify-center border border-slate-200/50 dark:border-slate-700/50 p-1 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] backdrop-blur-sm rounded-xl gap-1',
      props.class,
    )"
  >
    <slot />
  </TabsList>
</template>
