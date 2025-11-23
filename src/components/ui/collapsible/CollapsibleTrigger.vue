<script setup lang="ts">
import type { CollapsibleTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { CollapsibleTrigger } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<CollapsibleTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <CollapsibleTrigger
    data-slot="collapsible-trigger"
    v-bind="delegatedProps"
    :class="cn('flex items-center justify-between transition-all duration-200 outline-none [&[data-state=open]>svg]:rotate-180', props.class)"
  >
    <slot />
  </CollapsibleTrigger>
</template>
