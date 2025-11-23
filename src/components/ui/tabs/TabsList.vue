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
      'bg-gray-900 text-gray-300 inline-flex h-12 w-fit items-center justify-center border-4 border-gray-950 p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]',
      props.class,
    )"
    style="border-radius: 0; font-family: 'Courier New', monospace;"
  >
    <slot />
  </TabsList>
</template>
