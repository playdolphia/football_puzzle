<script setup lang="ts">
// StatBox - Monument Valley 3 style: minimal stat display
import { cn } from '@/lib/utils'
import { Zap, Dumbbell, Eye, Target } from 'lucide-vue-next'
import { computed } from 'vue'

interface Props {
  stat: 'stamina' | 'strength' | 'awareness' | 'finishing'
  value: number
  class?: string
}

const props = defineProps<Props>()

const statConfig = computed(() => {
  const configs = {
    stamina: { label: 'STA', icon: Zap },
    strength: { label: 'STR', icon: Dumbbell },
    awareness: { label: 'AWR', icon: Eye },
    finishing: { label: 'FIN', icon: Target }
  }
  return configs[props.stat]
})
</script>

<template>
  <div
    :class="cn(
      'flex flex-col items-center justify-center gap-1 py-2',
      props.class
    )"
  >
    <!-- Value - prominent -->
    <span class="text-2xl font-light text-white tracking-wide">
      {{ value }}
    </span>
    <!-- Label - subtle -->
    <span class="text-[10px] font-medium text-white/40 tracking-widest uppercase">
      {{ statConfig.label }}
    </span>
  </div>
</template>
