<script setup lang="ts">
import type { AvatarFallbackProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { AvatarFallback } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<AvatarFallbackProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <AvatarFallback
    data-slot="avatar-fallback"
    v-bind="delegatedProps"
    :class="cn('bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex size-full items-center justify-center text-slate-600 dark:text-slate-300 font-medium text-sm', props.class)"
  >
    <slot />
  </AvatarFallback>
</template>
