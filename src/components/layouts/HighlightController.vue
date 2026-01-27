<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Play, Pause, SkipForward, X } from 'lucide-vue-next'

const props = defineProps<{
  isPlaying: boolean
  currentMinute: number
  currentScore: { club: number; bot: number }
  clubName: string
  opponentName?: string
  isComplete: boolean
  currentEventText: string
}>()

const emit = defineEmits<{
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'skip'): void
  (e: 'close'): void
}>()
</script>

<template>
  <div class="absolute bottom-0 left-0 right-0 sm:bottom-24 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-30">
    <!-- Main Controller Card -->
    <div class="border border-white/10 backdrop-blur-md bg-[#0a0812]/90 px-6 py-4 min-w-[320px]">
      <!-- Score Display -->
      <div class="flex items-center justify-center gap-6 mb-3">
        <div class="text-center">
          <p class="text-[10px] text-white/40 uppercase tracking-wider">{{ clubName }}</p>
          <p class="text-2xl font-light text-[#4fd4d4]">{{ currentScore.club }}</p>
        </div>
        <div class="text-white/20 text-lg">-</div>
        <div class="text-center">
          <p class="text-[10px] text-white/40 uppercase tracking-wider">{{ opponentName || 'Bot Team' }}</p>
          <p class="text-2xl font-light text-rose-400">{{ currentScore.bot }}</p>
        </div>
      </div>

      <!-- Current Event Display -->
      <div class="text-center mb-3 min-h-[40px] flex flex-col items-center justify-center">
        <span v-if="!isComplete" class="px-2 py-0.5 bg-white/5 border border-white/10 text-white/60 text-xs rounded-full mb-1">
          {{ currentMinute }}'
        </span>
        <p class="text-sm text-white/80 tracking-wide">
          {{ isComplete ? 'Match highlights complete' : currentEventText }}
        </p>
      </div>

      <!-- Separator -->
      <div class="h-[1px] w-full bg-white/10 mb-3" />

      <!-- Controls -->
      <div class="flex items-center justify-center gap-3">
        <Button
          v-if="!isPlaying"
          variant="game"
          size="game"
          @click="$emit('play')"
          class="gap-2 px-6"
        >
          <Play class="w-4 h-4" />
          {{ isComplete ? 'Replay' : 'Play' }}
        </Button>

        <Button
          v-else
          variant="game-secondary"
          size="game"
          @click="$emit('pause')"
          class="gap-2"
        >
          <Pause class="w-4 h-4" />
          Pause
        </Button>

        <Button
          variant="game-secondary"
          size="game"
          @click="$emit('skip')"
          :disabled="isComplete"
          class="gap-2"
        >
          <SkipForward class="w-4 h-4" />
          Skip
        </Button>

        <Button
          variant="game-secondary"
          size="game"
          @click="$emit('close')"
          class="gap-2"
        >
          <X class="w-4 h-4" />
          Close
        </Button>
      </div>
    </div>
  </div>
</template>
