<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Calendar, Loader2, PlayCircle, Clock } from 'lucide-vue-next'
import { useLeagueStore } from '@/stores/leagueStore'
import { useClubStore } from '@/stores/clubStore'
import type { LeagueMatch } from '@/services/clubApi'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'watch-highlights', matchId: number): void
}>()

const leagueStore = useLeagueStore()
const clubStore = useClubStore()

// Track which match is loading highlights
const loadingHighlightsFor = ref<number | null>(null)

// Get current club ID for highlighting
const clubId = computed(() => clubStore.club?.id)

// Check if club is in a match
const isClubMatch = (match: LeagueMatch): boolean => {
  return match.home_club.id === clubId.value || match.away_club.id === clubId.value
}

// Group matches by round
const matchesByRound = computed(() => {
  const grouped: Record<number, LeagueMatch[]> = {}
  leagueStore.leagueSchedule.forEach(match => {
    if (!grouped[match.round]) {
      grouped[match.round] = []
    }
    grouped[match.round].push(match)
  })
  return grouped
})

// Format date for display
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format countdown to match
const formatCountdown = (dateStr: string): string => {
  const now = new Date()
  const matchDate = new Date(dateStr)
  const diff = matchDate.getTime() - now.getTime()

  if (diff <= 0) return 'Soon'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `in ${days}d ${hours}h`
  if (hours > 0) return `in ${hours}h`

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `in ${minutes}m`
}

// Watch highlights for a match
const watchHighlights = async (matchId: number) => {
  loadingHighlightsFor.value = matchId
  const result = await leagueStore.fetchMatchEvents(matchId)
  loadingHighlightsFor.value = null

  if (result.ok) {
    emit('watch-highlights', matchId)
  }
}

// Refresh schedule data
const refreshSchedule = async () => {
  await leagueStore.fetchLeagueSchedule()
}

// Close dialog
const closeDialog = () => {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent variant="game" class="max-w-md">
      <div class="space-y-4 text-center">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-[#4fd4d4]/10 flex items-center justify-center">
            <Calendar class="w-5 h-5 text-[#4fd4d4]" />
          </div>
          <div class="text-left">
            <h2 class="text-lg font-light tracking-wide text-white">Schedule</h2>
            <p class="text-white/40 text-xs">{{ leagueStore.currentLeagueName || 'League Matches' }}</p>
          </div>
        </div>

        <!-- Horizontal line separator -->
        <div class="h-px w-full bg-white/10" />

        <!-- Loading State -->
        <div v-if="leagueStore.loading.schedule && leagueStore.leagueSchedule.length === 0" class="py-8 flex flex-col items-center gap-3">
          <Loader2 class="w-6 h-6 animate-spin text-[#4fd4d4]" />
          <span class="text-white/40 text-sm">Loading schedule...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="leagueStore.leagueSchedule.length === 0" class="py-8 text-center">
          <p class="text-white/40 text-sm">No matches scheduled yet</p>
        </div>

        <!-- Schedule by Round -->
        <div v-else class="space-y-4 max-h-96 overflow-y-auto text-left">
          <div v-for="(matches, round) in matchesByRound" :key="round" class="space-y-2">
            <!-- Round Header -->
            <div class="text-xs text-white/40 uppercase tracking-wider py-1 border-b border-white/10">
              Round {{ round }}
            </div>

            <!-- Matches -->
            <div
              v-for="match in matches"
              :key="match.match_id"
              class="p-3 border transition-all"
              :class="isClubMatch(match)
                ? 'border-[#4fd4d4]/30 bg-[#4fd4d4]/5'
                : 'border-white/10 bg-white/5'"
            >
              <!-- Teams Row -->
              <div class="flex items-center justify-between gap-2">
                <!-- Home Team -->
                <div class="flex-1 text-right">
                  <span
                    class="text-sm font-medium"
                    :class="match.home_club.id === clubId ? 'text-[#4fd4d4]' : 'text-white'"
                  >
                    {{ match.home_club.name }}
                  </span>
                  <span class="text-white/30 text-[10px] ml-1">Lv{{ match.home_club.level }}</span>
                </div>

                <!-- Score / VS -->
                <div class="px-3 text-center min-w-16">
                  <template v-if="match.status === 'finished'">
                    <span class="text-white font-medium">
                      {{ match.score.home }} - {{ match.score.away }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="text-white/40 text-xs">vs</span>
                  </template>
                </div>

                <!-- Away Team -->
                <div class="flex-1 text-left">
                  <span class="text-white/30 text-[10px] mr-1">Lv{{ match.away_club.level }}</span>
                  <span
                    class="text-sm font-medium"
                    :class="match.away_club.id === clubId ? 'text-[#4fd4d4]' : 'text-white'"
                  >
                    {{ match.away_club.name }}
                  </span>
                </div>
              </div>

              <!-- Match Info Row -->
              <div class="flex items-center justify-between mt-2 text-xs">
                <div class="text-white/40">
                  <template v-if="match.status === 'finished'">
                    {{ formatDate(match.played_at || match.scheduled_at) }}
                  </template>
                  <template v-else>
                    <div class="flex items-center gap-1">
                      <Clock class="w-3 h-3" />
                      {{ formatCountdown(match.scheduled_at) }}
                    </div>
                  </template>
                </div>

                <!-- Watch Highlights Button (only for finished matches) -->
                <Button
                  v-if="match.status === 'finished'"
                  variant="game-ghost"
                  size="sm"
                  class="h-6 px-2 text-xs gap-1"
                  :disabled="loadingHighlightsFor === match.match_id"
                  @click="watchHighlights(match.match_id)"
                >
                  <Loader2 v-if="loadingHighlightsFor === match.match_id" class="w-3 h-3 animate-spin" />
                  <PlayCircle v-else class="w-3 h-3" />
                  Highlights
                </Button>
                <span v-else class="text-amber-400/60 text-[10px] uppercase">Scheduled</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Horizontal line separator -->
        <div class="h-px w-full bg-white/10" />

        <div class="flex gap-3">
          <Button
            variant="game-ghost"
            size="game"
            class="flex-1"
            :disabled="leagueStore.loading.schedule"
            @click="refreshSchedule"
          >
            {{ leagueStore.loading.schedule ? 'Refreshing...' : 'Refresh' }}
          </Button>
          <Button variant="game-secondary" size="game" class="flex-1" @click="closeDialog">
            Close
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
