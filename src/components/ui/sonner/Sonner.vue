<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { Toaster as Sonner } from "vue-sonner"

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :style="{
      '--normal-bg': 'rgba(248, 250, 252, 0.98)',
      '--normal-text': 'rgb(51, 65, 85)',
      '--normal-border': 'rgba(226, 232, 240, 0.5)',
      '--border-radius': '16px',
    }"
  />
</template>
