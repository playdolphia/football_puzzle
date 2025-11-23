<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { AvatarRoot } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <AvatarRoot
    data-slot="avatar"
    :class="cn('relative flex size-8 shrink-0 overflow-hidden rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-2 ring-white/50 dark:ring-slate-800/50', props.class)"
  >
    <slot />
  </AvatarRoot>
</template>
