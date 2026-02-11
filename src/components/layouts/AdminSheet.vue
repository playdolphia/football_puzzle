<template>
  <div v-if="globalStore.isTestEnvironment">
    <!-- Trigger Button -->
    <button
      @click="isOpen = !isOpen"
      class="fixed top-18 right-3 z-50 w-9 h-9 rounded-full bg-primary/15 hover:bg-primary/25 flex items-center justify-center transition-colors duration-200"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    </button>

    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        @click="isOpen = false"
      />
    </Transition>

    <!-- Panel -->
    <Transition name="slide">
      <div
        v-if="isOpen"
        class="fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-background border-l border-border shadow-xl overflow-y-auto"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-border">
          <h2 class="text-sm font-medium tracking-wide text-foreground">Admin Panel</h2>
          <button
            @click="isOpen = false"
            class="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="p-4 space-y-5">
          <!-- User Info -->
          <section v-if="globalStore.user" class="space-y-3">
            <h3 class="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">User Info</h3>
            <div class="flex items-center gap-3">
              <img
                v-if="profileAvatar && !avatarError"
                :src="profileAvatar"
                :alt="profileName"
                class="w-10 h-10 rounded-full object-cover border border-border"
                @error="avatarError = true"
              />
              <div
                v-else
                class="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-medium text-primary"
              >
                {{ profileName[0] }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-foreground truncate">
                  {{ profileName }}
                </p>
                <p v-if="globalStore.user.username" class="text-xs text-muted-foreground truncate">
                  @{{ globalStore.user.username }}
                </p>
              </div>
            </div>
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">ID</span>
                <span class="text-foreground font-mono">{{ globalStore.user.id || '—' }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">Language</span>
                <span class="text-foreground font-mono">{{ globalStore.user.language_code || '—' }}</span>
              </div>
            </div>
          </section>

          <hr class="border-border" />

          <!-- Puzzle State -->
          <section class="space-y-3">
            <h3 class="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Puzzle State</h3>
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">Phase</span>
                <span class="text-foreground font-mono">{{ puzzleStore.phase }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">Moves</span>
                <span class="text-foreground font-mono">{{ puzzleStore.moves }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">Elapsed</span>
                <span class="text-foreground font-mono">{{ formatTime(puzzleStore.elapsedSeconds) }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">Grid</span>
                <span class="text-foreground font-mono">{{ puzzleStore.puzzleData ? `${puzzleStore.gridCols}x${puzzleStore.gridRows}` : '—' }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">Tray</span>
                <span class="text-foreground font-mono">{{ puzzleStore.tray.length }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">Completed</span>
                <span class="text-foreground font-mono">{{ puzzleStore.isCompleted ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </section>

          <hr class="border-border" />

          <!-- Debug State -->
          <section class="space-y-3">
            <h3 class="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Debug State</h3>
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">API Token</span>
                <span class="text-foreground font-mono truncate max-w-35">{{ truncate(globalStore.apiToken || '—', 20) }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-muted-foreground">Transfer Token</span>
                <span class="text-foreground font-mono truncate max-w-35">{{ truncate(globalStore.transferToken || '—', 20) }}</span>
              </div>
            </div>
            <details class="text-xs">
              <summary class="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Decoded Token JSON
              </summary>
              <pre class="mt-2 p-2 bg-muted/50 rounded-md text-[10px] leading-relaxed text-muted-foreground overflow-x-auto max-h-48">{{ JSON.stringify(globalStore.decodedTransferToken, null, 2) }}</pre>
            </details>
          </section>

          <hr class="border-border" />

          <!-- Actions -->
          <section class="space-y-3">
            <h3 class="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium">Actions</h3>
            <div class="space-y-2">
              <button
                @click="clearDifficultyPreference"
                class="w-full text-left text-xs px-3 py-2 rounded-md bg-muted/40 hover:bg-muted/70 text-foreground transition-colors"
              >
                Clear Difficulty Preference
              </button>
              <button
                @click="resetPuzzle"
                class="w-full text-left text-xs px-3 py-2 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
              >
                Reset Puzzle State
              </button>
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlobalStore } from '@/stores'
import { usePuzzleStore } from '@/stores/puzzleStore'

const globalStore = useGlobalStore()
const puzzleStore = usePuzzleStore()

const isOpen = ref(false)
const avatarError = ref(false)

const profileName = computed(() => {
  const profile = globalStore.userProfile
  if (profile?.user_info?.display_name) return profile.user_info.display_name
  if (globalStore.user) return globalStore.user.username || 'Player'
  return 'Player'
})

const profileAvatar = computed(() => {
  return globalStore.userProfile?.user_info?.avatar || globalStore.user?.photo_url || null
})

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len) + '...'
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function clearDifficultyPreference() {
  localStorage.removeItem('puzzle_preferred_difficulty')
}

function resetPuzzle() {
  puzzleStore.resetPuzzle()
  isOpen.value = false
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
