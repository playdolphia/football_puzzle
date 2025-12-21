<script setup lang="ts">
// PositionBadge - Monument Valley 3 style: minimal text-based position
import { cn } from '@/lib/utils'
import { computed } from 'vue'

interface Props {
  position: 'GK' | 'DEF' | 'MID' | 'ATT'
  showFullName?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  showFullName: true
})

const positionConfig = computed(() => {
  const configs = {
    GK: { label: 'GK', fullName: 'Goalkeeper' },
    DEF: { label: 'DEF', fullName: 'Defender' },
    MID: { label: 'MID', fullName: 'Midfielder' },
    ATT: { label: 'ATT', fullName: 'Attacker' }
  }
  return configs[props.position]
})
</script>

<template>
  <div
    :class="cn(
      'inline-flex items-center gap-3',
      props.class
    )"
  >
    <!-- Position abbreviation - cyan accent -->
    <span class="text-xs font-medium text-[#4fd4d4] tracking-widest uppercase">
      {{ positionConfig.label }}
    </span>

    <!-- Full name - white -->
    <span v-if="showFullName" class="text-lg font-light text-white tracking-wide">
      {{ positionConfig.fullName }}
    </span>
  </div>
</template>
