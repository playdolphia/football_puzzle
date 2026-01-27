<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Trophy, ChevronRight, Loader2 } from 'lucide-vue-next'
import { useLeagueStore } from '@/stores/leagueStore'
import { useClubStore } from '@/stores/clubStore'

const emit = defineEmits<{
  (e: 'view-full-table'): void
  (e: 'join-league'): void
}>()

const leagueStore = useLeagueStore()
const clubStore = useClubStore()

// Get current club ID for highlighting
const clubId = computed(() => clubStore.club?.id)

// Check if a row is the user's club
const isUserClub = (entryClubId: number): boolean => {
  return entryClubId === clubId.value
}

// Get top 5 entries plus user's position if outside top 5
const displayEntries = computed(() => {
  const table = leagueStore.leagueTable
  if (table.length <= 5) return table

  const top5 = table.slice(0, 5)
  const userEntry = table.find(e => e.club.id === clubId.value)

  // If user is in top 5, just return top 5
  if (userEntry && userEntry.rank <= 5) {
    return top5
  }

  // If user is outside top 5, add their entry at the end
  if (userEntry) {
    return [...top5, userEntry]
  }

  return top5
})

// Check if we need to show a gap indicator (user outside top 5)
const showGap = computed(() => {
  const userEntry = leagueStore.leagueTable.find(e => e.club.id === clubId.value)
  return userEntry && userEntry.rank > 5
})
</script>

<template>
  <!-- Not in League State -->
  <div v-if="!leagueStore.isInLeague" class="border border-white/10 bg-white/5 p-4 space-y-3">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
        <Trophy class="w-5 h-5 text-amber-400" />
      </div>
      <div>
        <h3 class="text-white font-medium text-sm">Join a League</h3>
        <p class="text-white/40 text-xs">Compete against other clubs!</p>
      </div>
    </div>
    <Button
      variant="game"
      size="game"
      class="w-full gap-2 shadow-lg shadow-[#4fd4d4]/20 border border-[#4fd4d4]/30"
      @click="emit('join-league')"
    >
      <Trophy class="w-4 h-4" />
      Join League
    </Button>
  </div>

  <!-- In League - Show Table Widget -->
  <div v-else class="border border-white/10 bg-white/5 space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 pb-0">
      <div class="flex items-center gap-2">
        <Trophy class="w-4 h-4 text-[#4fd4d4]" />
        <span class="text-white/60 text-xs uppercase tracking-wider">League Table</span>
      </div>
      <button
        class="flex items-center gap-1 text-[#4fd4d4] text-xs hover:text-[#7fe5e5] transition-colors"
        @click="emit('view-full-table')"
      >
        View All
        <ChevronRight class="w-3 h-3" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="leagueStore.loading.table && leagueStore.leagueTable.length === 0" class="py-6 flex justify-center">
      <Loader2 class="w-5 h-5 animate-spin text-[#4fd4d4]" />
    </div>

    <!-- Table -->
    <div v-else-if="leagueStore.leagueTable.length > 0" class="px-4 pb-4">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-white/30 uppercase tracking-wider">
            <th class="py-1 text-left w-6">#</th>
            <th class="py-1 text-left">Club</th>
            <th class="py-1 text-center w-8">P</th>
            <th class="py-1 text-center w-8">GD</th>
            <th class="py-1 text-right w-8">Pts</th>
          </tr>
        </thead>
        <tbody>
          <!-- Gap indicator if user is outside top 5 -->
          <template v-for="(entry, index) in displayEntries" :key="entry.club.id">
            <!-- Show ellipsis before user's row if they're outside top 5 -->
            <tr v-if="showGap && index === displayEntries.length - 1">
              <td colspan="5" class="py-1 text-center text-white/20">...</td>
            </tr>
            <tr
              class="border-t border-white/5"
              :class="isUserClub(entry.club.id) ? 'bg-[#4fd4d4]/10' : ''"
            >
              <td class="py-1.5 text-white/40">{{ entry.rank }}</td>
              <td class="py-1.5">
                <span
                  class="truncate max-w-20 inline-block"
                  :class="isUserClub(entry.club.id) ? 'text-[#4fd4d4] font-medium' : 'text-white/80'"
                >
                  {{ entry.club.name }}
                </span>
              </td>
              <td class="py-1.5 text-center text-white/40">{{ entry.played }}</td>
              <td
                class="py-1.5 text-center"
                :class="entry.goal_diff > 0 ? 'text-emerald-400' : entry.goal_diff < 0 ? 'text-rose-400' : 'text-white/40'"
              >
                {{ entry.goal_diff > 0 ? '+' : '' }}{{ entry.goal_diff }}
              </td>
              <td class="py-1.5 text-right font-medium text-white">{{ entry.points }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="py-4 text-center text-white/40 text-xs">
      No standings yet
    </div>
  </div>
</template>
