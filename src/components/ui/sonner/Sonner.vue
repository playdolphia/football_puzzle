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
      // MV3 style: dark purple glass with sharp edges
      '--normal-bg': 'rgba(10, 8, 18, 0.95)',
      '--normal-text': 'rgba(255, 255, 255, 0.8)',
      '--normal-border': 'rgba(255, 255, 255, 0.1)',
      '--success-bg': 'rgba(10, 8, 18, 0.95)',
      '--success-text': '#4fd4d4',
      '--success-border': 'rgba(79, 212, 212, 0.3)',
      '--error-bg': 'rgba(10, 8, 18, 0.95)',
      '--error-text': '#fb7185',
      '--error-border': 'rgba(251, 113, 133, 0.3)',
      '--warning-bg': 'rgba(10, 8, 18, 0.95)',
      '--warning-text': '#fbbf24',
      '--warning-border': 'rgba(251, 191, 36, 0.3)',
      '--info-bg': 'rgba(10, 8, 18, 0.95)',
      '--info-text': '#60a5fa',
      '--info-border': 'rgba(96, 165, 250, 0.3)',
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
    :class="{ 'game-toaster': props.variant === 'game' }"
    v-bind="props"
    :style="styleVars"
    :toast-options="{
      unstyled: props.variant === 'game',
      classNames: props.variant === 'game' ? {
        toast: 'game-toast',
        title: 'game-toast-title',
        description: 'game-toast-description',
        success: 'game-toast-success',
        error: 'game-toast-error',
        warning: 'game-toast-warning',
        info: 'game-toast-info',
      } : undefined
    }"
  />
</template>

<style>
/* MV3 Game Toast Styles */
.game-toast {
  background: rgba(10, 8, 18, 0.95) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 0 !important;
  padding: 12px 16px !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4) !important;
  font-family: inherit;
}

.game-toast-title {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  letter-spacing: 0.02em;
  line-height: 1.4;
}

.game-toast-description {
  color: rgba(255, 255, 255, 0.6) !important;
  font-size: 12px !important;
  margin-top: 4px;
}

.game-toast-success {
  border-color: rgba(79, 212, 212, 0.3) !important;
}

.game-toast-success .game-toast-title {
  color: #4fd4d4 !important;
}

.game-toast-error {
  border-color: rgba(251, 113, 133, 0.3) !important;
}

.game-toast-error .game-toast-title {
  color: #fb7185 !important;
}

.game-toast-warning {
  border-color: rgba(251, 191, 36, 0.3) !important;
}

.game-toast-warning .game-toast-title {
  color: #fbbf24 !important;
}

.game-toast-info {
  border-color: rgba(96, 165, 250, 0.3) !important;
}

.game-toast-info .game-toast-title {
  color: #60a5fa !important;
}

/* Hide default sonner icons for game variant */
.game-toaster [data-sonner-toast] [data-icon] {
  display: none;
}
</style>
