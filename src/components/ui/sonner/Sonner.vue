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
      '--normal-bg': 'rgb(31, 41, 55)',
      '--normal-text': 'rgb(255, 255, 255)',
      '--normal-border': 'rgb(0, 0, 0)',
      '--border-radius': '0px',
      fontFamily: 'Courier New, monospace',
      fontWeight: 'bold',
    }"
  />
</template>
