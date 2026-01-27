<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Table2, Loader2 } from 'lucide-vue-next'
import { useLeagueStore } from '@/stores/leagueStore'
import { useClubStore } from '@/stores/clubStore'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const leagueStore = useLeagueStore()
const clubStore = useClubStore()

// Get current club ID for highlighting
const clubId = computed(() => clubStore.club?.id)

// Check if a row is the user's club
const isUserClub = (entryClubId: number): boolean => {
  return entryClubId === clubId.value
}

// Refresh table data
const refreshTable = async () => {
  await leagueStore.fetchLeagueTable()
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
            <Table2 class="w-5 h-5 text-[#4fd4d4]" />
          </div>
          <div class="text-left">
            <h2 class="text-lg font-light tracking-wide text-white">League Table</h2>
            <p class="text-white/40 text-xs">{{ leagueStore.currentLeagueName || 'League Standings' }}</p>
          </div>
        </div>

        <!-- Horizontal line separator -->
        <div class="h-px w-full bg-white/10" />

        <!-- Loading State -->
        <div v-if="leagueStore.loading.table && leagueStore.leagueTable.length === 0" class="py-8 flex flex-col items-center gap-3">
          <Loader2 class="w-6 h-6 animate-spin text-[#4fd4d4]" />
          <span class="text-white/40 text-sm">Loading standings...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="leagueStore.leagueTable.length === 0" class="py-8 text-center">
          <p class="text-white/40 text-sm">No standings available yet</p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="text-white/40 uppercase tracking-wider border-b border-white/10">
                <th class="py-2 px-1 text-left">#</th>
                <th class="py-2 px-1 text-left">Club</th>
                <th class="py-2 px-1 text-center">P</th>
                <th class="py-2 px-1 text-center">W</th>
                <th class="py-2 px-1 text-center">D</th>
                <th class="py-2 px-1 text-center">L</th>
                <th class="py-2 px-1 text-center hidden sm:table-cell">GF</th>
                <th class="py-2 px-1 text-center hidden sm:table-cell">GA</th>
                <th class="py-2 px-1 text-center">GD</th>
                <th class="py-2 px-1 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in leagueStore.leagueTable"
                :key="entry.club.id"
                class="border-b border-white/5 transition-colors"
                :class="isUserClub(entry.club.id)
                  ? 'bg-[#4fd4d4]/10 border-[#4fd4d4]/20'
                  : 'hover:bg-white/5'"
              >
                <td class="py-2 px-1 text-white/60">{{ entry.rank }}</td>
                <td class="py-2 px-1">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-medium truncate max-w-24"
                      :class="isUserClub(entry.club.id) ? 'text-[#4fd4d4]' : 'text-white'"
                    >
                      {{ entry.club.name }}
                    </span>
                    <span class="text-white/30 text-[10px]">Lv{{ entry.club.level }}</span>
                  </div>
                </td>
                <td class="py-2 px-1 text-center text-white/60">{{ entry.played }}</td>
                <td class="py-2 px-1 text-center text-emerald-400">{{ entry.wins }}</td>
                <td class="py-2 px-1 text-center text-white/40">{{ entry.draws }}</td>
                <td class="py-2 px-1 text-center text-rose-400">{{ entry.losses }}</td>
                <td class="py-2 px-1 text-center text-white/40 hidden sm:table-cell">{{ entry.goals_for }}</td>
                <td class="py-2 px-1 text-center text-white/40 hidden sm:table-cell">{{ entry.goals_against }}</td>
                <td
                  class="py-2 px-1 text-center"
                  :class="entry.goal_diff > 0 ? 'text-emerald-400' : entry.goal_diff < 0 ? 'text-rose-400' : 'text-white/40'"
                >
                  {{ entry.goal_diff > 0 ? '+' : '' }}{{ entry.goal_diff }}
                </td>
                <td class="py-2 px-1 text-right font-medium text-white">{{ entry.points }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Horizontal line separator -->
        <div class="h-px w-full bg-white/10" />

        <div class="flex gap-3">
          <Button
            variant="game-ghost"
            size="game"
            class="flex-1"
            :disabled="leagueStore.loading.table"
            @click="refreshTable"
          >
            {{ leagueStore.loading.table ? 'Refreshing...' : 'Refresh' }}
          </Button>
          <Button variant="game-secondary" size="game" class="flex-1" @click="closeDialog">
            Close
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
