<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Trophy, AlertCircle, Loader2, Check } from 'lucide-vue-next'
import { useLeagueStore } from '@/stores/leagueStore'
import { useClubStore } from '@/stores/clubStore'
import type { LeagueListItem } from '@/services/clubApi'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'joined', leagueId: number): void
}>()

const leagueStore = useLeagueStore()
const clubStore = useClubStore()

// Selected league for confirmation
const selectedLeague = ref<LeagueListItem | null>(null)

// Reset selection when dialog closes
watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    selectedLeague.value = null
  }
})

// Get club's average level for eligibility check
const clubLevel = computed(() => clubStore.teamAverageLevel)

// Check if club is eligible for a league
const isEligible = (league: LeagueListItem): boolean => {
  return clubLevel.value >= league.min_level && clubLevel.value <= league.max_level
}

// Handle league card selection (not join)
const selectLeague = (league: LeagueListItem) => {
  if (!isEligible(league)) return
  selectedLeague.value = league
}

// Handle join confirmation
const confirmJoinLeague = async () => {
  if (!selectedLeague.value) return

  const result = await leagueStore.joinLeague(selectedLeague.value.id)
  if (result.ok) {
    emit('joined', selectedLeague.value.id)
    emit('update:open', false)
  }
}

// Close dialog
const closeDialog = () => {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent variant="game" class="max-w-sm">
      <div class="space-y-6 text-center">
        <!-- Header -->
        <div>
          <div class="flex justify-center mb-3">
            <div class="w-12 h-12 rounded-full bg-[#4fd4d4]/10 flex items-center justify-center">
              <Trophy class="w-6 h-6 text-[#4fd4d4]" />
            </div>
          </div>
          <h2 class="text-lg font-light tracking-wide text-white">Join a League</h2>
          <p class="text-white/40 text-xs mt-1">Select a league to compete in</p>
        </div>

        <!-- Warning -->
        <div class="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          <span>You can only join one league at a time</span>
        </div>

        <!-- Club Level Info -->
        <div class="text-center">
          <span class="text-white/40 text-xs uppercase tracking-wider">Your Club Level:</span>
          <span class="text-[#4fd4d4] ml-2 font-medium">{{ clubLevel }}</span>
        </div>

        <!-- Horizontal line separator -->
        <div class="h-px w-full bg-white/10" />

        <!-- Loading State -->
        <div v-if="leagueStore.loading.list" class="py-8 flex flex-col items-center gap-3">
          <Loader2 class="w-6 h-6 animate-spin text-[#4fd4d4]" />
          <span class="text-white/40 text-sm">Loading leagues...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="leagueStore.availableLeagues.length === 0" class="py-8 text-center">
          <p class="text-white/40 text-sm">No leagues available at the moment</p>
        </div>

        <!-- League List -->
        <div v-else class="space-y-3 max-h-64 overflow-y-auto">
          <button
            v-for="league in leagueStore.availableLeagues"
            :key="league.id"
            class="w-full p-4 border transition-all text-left"
            :class="[
              isEligible(league)
                ? selectedLeague?.id === league.id
                  ? 'border-[#4fd4d4] bg-[#4fd4d4]/10 cursor-pointer'
                  : 'border-white/10 hover:border-[#4fd4d4]/50 bg-white/5 hover:bg-[#4fd4d4]/5 cursor-pointer'
                : 'border-white/5 bg-white/2 opacity-50 cursor-not-allowed'
            ]"
            :disabled="!isEligible(league) || leagueStore.loading.join"
            @click="selectLeague(league)"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-white font-medium">{{ league.name }}</h3>
                <p class="text-white/40 text-xs mt-1">Season {{ league.season }}</p>
              </div>
              <div class="text-right">
                <div class="text-xs text-white/60">
                  Level {{ league.min_level }}-{{ league.max_level }}
                </div>
                <div v-if="isEligible(league)" class="text-xs text-emerald-400 flex items-center gap-1 justify-end mt-1">
                  <Check class="w-3 h-3" />
                  Eligible
                </div>
                <div v-else class="text-xs text-rose-400 mt-1">
                  Not eligible
                </div>
              </div>
            </div>
          </button>
        </div>

        <!-- Error State -->
        <div v-if="leagueStore.error" class="text-rose-400 text-xs text-center">
          {{ leagueStore.error }}
        </div>

        <!-- Horizontal line separator -->
        <div class="h-px w-full bg-white/10" />

        <div class="flex gap-3">
          <Button variant="game-secondary" size="game" class="flex-1" @click="closeDialog">
            Cancel
          </Button>
          <Button
            variant="game"
            size="game"
            class="flex-1"
            :disabled="!selectedLeague || leagueStore.loading.join"
            @click="confirmJoinLeague"
          >
            <Loader2 v-if="leagueStore.loading.join" class="w-4 h-4 animate-spin mr-2" />
            Join
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
