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
    :class="cn('relative flex size-8 shrink-0 overflow-hidden border-4 border-gray-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]', props.class)"
    style="border-radius: 0;"
  >
    <slot />
  </AvatarRoot>
</template>
