<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { Toaster as Sonner } from "vue-sonner"
import { computed } from "vue"

const props = withDefaults(defineProps<ToasterProps & {
  variant?: 'default' | 'game'
}>(), {
  variant: 'default'
})

const styleVars = computed(() => {
  if (props.variant === 'game') {
    return {
      '--normal-bg': 'rgba(26, 16, 37, 0.95)',
      '--normal-text': 'rgba(255, 255, 255, 0.85)',
      '--normal-border': 'rgba(255, 255, 255, 0.1)',
      '--success-bg': 'rgba(26, 16, 37, 0.95)',
      '--success-text': '#4fd4d4',
      '--success-border': 'rgba(79, 212, 212, 0.3)',
      '--error-bg': 'rgba(26, 16, 37, 0.95)',
      '--error-text': 'rgba(251, 113, 133, 0.9)',
      '--error-border': 'rgba(251, 113, 133, 0.3)',
      '--border-radius': '0px',
    }
  }
  return {
    '--normal-bg': 'rgba(248, 250, 252, 0.98)',
    '--normal-text': 'rgb(51, 65, 85)',
    '--normal-border': 'rgba(226, 232, 240, 0.5)',
    '--border-radius': '16px',
  }
})
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :style="styleVars"
  />
</template>
