<script setup lang="ts">
import type { SelectLabelProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { SelectLabel } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SelectLabelProps & { class?: HTMLAttributes["class"] }>()
</script>

<template>
  <SelectLabel
    data-slot="select-label"
    :class="cn('px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider', props.class)"
  >
    <slot />
  </SelectLabel>
</template>
