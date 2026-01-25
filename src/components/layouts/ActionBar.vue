<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Gamepad2, Trophy, Calendar, Table2, Loader2, Clock } from 'lucide-vue-next'

interface Props {
  isInLeague: boolean
  loading?: {
    match?: boolean
    join?: boolean
  }
  disabled?: boolean
  busyCountdown?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: () => ({}),
  disabled: false,
  busyCountdown: null
})

const emit = defineEmits<{
  (e: 'play-bot'): void
  (e: 'join-league'): void
  (e: 'open-schedule'): void
  (e: 'open-table'): void
}>()

// Computed: Is bot match button disabled
const isBotMatchDisabled = computed(() => {
  return props.disabled || props.loading?.match || !!props.busyCountdown
})

// Computed: Are league action buttons disabled
const isLeagueActionsDisabled = computed(() => {
  return !props.isInLeague
})
</script>

<template>
  <div class="flex flex-col items-center gap-2 py-3 border border-white/10 backdrop-blur-md bg-[#0a0812]/80 w-full">
    <!-- Horizontal Scrollable Container -->
    <div class="flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 w-full" style="-webkit-overflow-scrolling: touch;">
      <!-- Bot Match Button -->
      <Button
        variant="game"
        size="game"
        class="shrink-0 flex-col h-auto px-5 py-3 gap-1.5 shadow-lg shadow-[#4fd4d4]/20 border border-[#4fd4d4]/30 hover:shadow-xl hover:shadow-[#4fd4d4]/30 transition-all"
        :disabled="isBotMatchDisabled"
        @click="emit('play-bot')"
      >
        <Loader2 v-if="loading?.match" class="w-5 h-5 animate-spin" />
        <Clock v-else-if="busyCountdown" class="w-5 h-5" />
        <Gamepad2 v-else class="w-5 h-5" />
        <span v-if="busyCountdown" class="text-[10px] whitespace-nowrap">{{ busyCountdown }}</span>
        <span v-else class="text-[10px] whitespace-nowrap">Play Bot</span>
      </Button>

      <!-- Join League / In League Button -->
      <Button
        variant="game"
        size="game"
        class="shrink-0 flex-col h-auto px-5 py-3 gap-1.5 transition-all"
        :class="isInLeague
          ? 'opacity-50 cursor-not-allowed border border-white/20 bg-white/5'
          : 'shadow-lg shadow-[#4fd4d4]/20 border border-[#4fd4d4]/30 hover:shadow-xl hover:shadow-[#4fd4d4]/30'"
        :disabled="isInLeague || loading?.join"
        @click="!isInLeague && emit('join-league')"
      >
        <Loader2 v-if="loading?.join" class="w-5 h-5 animate-spin" />
        <Trophy v-else class="w-5 h-5" />
        <span class="text-[10px] whitespace-nowrap">{{ isInLeague ? 'In League' : 'Join League' }}</span>
      </Button>

      <!-- Schedule Button -->
      <Button
        variant="game"
        size="game"
        class="shrink-0 flex-col h-auto px-5 py-3 gap-1.5 transition-all"
        :class="isLeagueActionsDisabled
          ? 'opacity-40 cursor-not-allowed border border-white/10'
          : 'shadow-lg shadow-[#4fd4d4]/20 border border-[#4fd4d4]/30 hover:shadow-xl hover:shadow-[#4fd4d4]/30'"
        :disabled="isLeagueActionsDisabled"
        @click="emit('open-schedule')"
      >
        <Calendar class="w-5 h-5" />
        <span class="text-[10px] whitespace-nowrap">Schedule</span>
      </Button>

      <!-- Table Button -->
      <Button
        variant="game"
        size="game"
        class="shrink-0 flex-col h-auto px-5 py-3 gap-1.5 transition-all"
        :class="isLeagueActionsDisabled
          ? 'opacity-40 cursor-not-allowed border border-white/10'
          : 'shadow-lg shadow-[#4fd4d4]/20 border border-[#4fd4d4]/30 hover:shadow-xl hover:shadow-[#4fd4d4]/30'"
        :disabled="isLeagueActionsDisabled"
        @click="emit('open-table')"
      >
        <Table2 class="w-5 h-5" />
        <span class="text-[10px] whitespace-nowrap">Table</span>
      </Button>
    </div>

    <!-- League Status Indicator (when in league) -->
    <div v-if="isInLeague" class="text-[10px] uppercase tracking-wider text-[#4fd4d4]/60">
      League matches are automated
    </div>
  </div>
</template>
