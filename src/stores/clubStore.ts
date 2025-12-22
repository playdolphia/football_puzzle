import { defineStore } from 'pinia'
import { clubApi, type Club, type Player, type TrainingOption, type BotMatchResult } from '@/services/clubApi'
import { useGlobalStore } from '@/stores/index'

interface ClubState {
  club: Club | null
  players: Player[]
  trainingOptions: TrainingOption[]
  lastMatchResult: BotMatchResult | null
  loading: {
    club: boolean
    players: boolean
    training: boolean
    match: boolean
    feed: boolean
    rest: boolean
    trainingOptions: boolean
  }
  error: string | null
}

export const useClubStore = defineStore('club', {
  state: (): ClubState => ({
    club: null,
    players: [],
    trainingOptions: [],
    lastMatchResult: null,
    loading: {
      club: false,
      players: false,
      training: false,
      match: false,
      feed: false,
      rest: false,
      trainingOptions: false
    },
    error: null
  }),

  getters: {
    hasClub: (state): boolean => state.club !== null,

    clubLevel: (state): number => state.club?.level ?? 0,

    clubFans: (state): number => state.club?.fans ?? 0,

    clubName: (state): string => state.club?.name ?? '',

    // Get players by position
    goalkeeper: (state): Player | undefined =>
      state.players.find(p => p.position === 'GK'),

    defenders: (state): Player[] =>
      state.players.filter(p => p.position === 'DEF'),

    midfielders: (state): Player[] =>
      state.players.filter(p => p.position === 'MID'),

    attackers: (state): Player[] =>
      state.players.filter(p => p.position === 'ATT'),

    // Get players currently in a task
    busyPlayers: (state): Player[] =>
      state.players.filter(p => p.current_task !== null),

    // Get available (idle) players
    availablePlayers: (state): Player[] =>
      state.players.filter(p => p.current_task === null),

    // Get players with low energy (< 30%)
    tiredPlayers: (state): Player[] =>
      state.players.filter(p => p.energy < 30),

    // Check if team has enough energy for a match (average energy > 40)
    canPlayMatch: (state): boolean => {
      if (state.players.length === 0) return false
      const avgEnergy = state.players.reduce((sum, p) => sum + p.energy, 0) / state.players.length
      return avgEnergy >= 40
    },

    // Get average team energy
    teamAverageEnergy: (state): number => {
      if (state.players.length === 0) return 0
      return Math.round(state.players.reduce((sum, p) => sum + p.energy, 0) / state.players.length)
    },

    // Get average team level
    teamAverageLevel: (state): number => {
      if (state.players.length === 0) return 0
      return Math.round(state.players.reduce((sum, p) => sum + p.level, 0) / state.players.length)
    },

    // Check if any loading is in progress
    isLoading: (state): boolean =>
      Object.values(state.loading).some(v => v)
  },

  actions: {
    getToken(): string {
      const globalStore = useGlobalStore()
      return globalStore.apiToken || ''
    },

    clearError() {
      this.error = null
    },

    // Create a new club
    async createClub(name: string) {
      this.loading.club = true
      this.error = null
      try {
        const response = await clubApi.createClub(name, this.getToken())
        if (response.ok && response.data) {
          this.club = response.data
          // Normalize players to clear expired tasks
          this.players = this.normalizeExpiredTasks(response.data.players || [])
          return { ok: true, data: response.data }
        }
        return { ok: false, message: response.message || 'Failed to create club' }
      } catch (err: any) {
        const message = err.message || 'Failed to create club'
        this.error = message
        // Parse error response for specific messages
        try {
          const errorData = JSON.parse(err.message)
          return { ok: false, message: errorData.message || message }
        } catch {
          return { ok: false, message }
        }
      } finally {
        this.loading.club = false
      }
    },

    // Parse task_ends_at timestamp - server returns UTC times without 'Z' suffix
    parseTaskEndTime(taskEndsAt: string): Date {
      // If the timestamp doesn't have timezone info, treat it as UTC
      if (!taskEndsAt.includes('Z') && !taskEndsAt.includes('+')) {
        return new Date(taskEndsAt.replace(' ', 'T') + 'Z')
      }
      return new Date(taskEndsAt)
    },

    // Normalize players - clear expired tasks to prevent animation flicker
    normalizeExpiredTasks(players: Player[]): Player[] {
      const now = new Date()
      return players.map(player => {
        if (player.task_ends_at) {
          const endTime = this.parseTaskEndTime(player.task_ends_at)
          if (endTime <= now) {
            console.log(`[normalizeExpiredTasks] Clearing expired task for player ${player.id}: ${player.current_task} ended at ${player.task_ends_at} (parsed: ${endTime.toISOString()}, now: ${now.toISOString()})`)
            return { ...player, current_task: null, task_ends_at: null }
          }
        }
        return player
      })
    },

    // Fetch user's club
    async fetchClub() {
      this.loading.club = true
      this.error = null
      try {
        const response = await clubApi.getMyClub(this.getToken())
        if (response.ok && response.data) {
          this.club = response.data
          // Normalize players to clear expired tasks
          this.players = this.normalizeExpiredTasks(response.data.players || [])
          return { ok: true, data: response.data }
        }
        // Club not found is not an error, just means user needs to create one
        this.club = null
        this.players = []
        return { ok: false, message: response.message || 'Club not found' }
      } catch (err: any) {
        // 404 means no club exists yet
        if (err.status === 404) {
          this.club = null
          this.players = []
          return { ok: false, message: 'Club not found', notFound: true }
        }
        this.error = err.message || 'Failed to fetch club'
        return { ok: false, message: this.error }
      } finally {
        this.loading.club = false
      }
    },

    // Update club name
    async updateClubName(name: string) {
      this.loading.club = true
      this.error = null
      try {
        const response = await clubApi.updateClubName(name, this.getToken())
        if (response.ok && response.data) {
          if (this.club) {
            this.club.name = response.data.name
          }
          return { ok: true, data: response.data }
        }
        return { ok: false, message: response.message || 'Failed to update club name' }
      } catch (err: any) {
        this.error = err.message || 'Failed to update club name'
        return { ok: false, message: this.error }
      } finally {
        this.loading.club = false
      }
    },

    // Fetch players list
    async fetchPlayers() {
      this.loading.players = true
      this.error = null
      try {
        const response = await clubApi.getPlayers(this.getToken())
        if (response.ok && response.data) {
          // Normalize players to clear expired tasks
          const normalizedPlayers = this.normalizeExpiredTasks(response.data)
          this.players = normalizedPlayers
          return { ok: true, data: normalizedPlayers }
        }
        return { ok: false, message: response.message || 'Failed to fetch players' }
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch players'
        return { ok: false, message: this.error }
      } finally {
        this.loading.players = false
      }
    },

    // Fetch training options
    async fetchTrainingOptions() {
      this.loading.trainingOptions = true
      try {
        const response = await clubApi.getTrainingOptions(this.getToken())
        if (response.ok && response.data) {
          this.trainingOptions = response.data
          return { ok: true, data: response.data }
        }
        return { ok: false, message: response.message || 'Failed to fetch training options' }
      } catch (err: any) {
        return { ok: false, message: err.message || 'Failed to fetch training options' }
      } finally {
        this.loading.trainingOptions = false
      }
    },

    // Train a player
    async trainPlayer(playerId: number, type: 'light' | 'balanced' | 'conditioning' | 'finishing') {
      this.loading.training = true
      this.error = null
      try {
        const response = await clubApi.trainPlayer(playerId, type, this.getToken())
        if (response.ok && response.data) {
          // Update player in local state
          const idx = this.players.findIndex(p => p.id === playerId)
          if (idx !== -1) {
            this.players[idx] = response.data
          }
          return { ok: true, data: response.data }
        }
        return { ok: false, message: response.message || 'Failed to train player' }
      } catch (err: any) {
        // Parse error for busy/energy messages
        let message = err.message || 'Failed to train player'
        try {
          const errorData = JSON.parse(err.message)
          message = errorData.message || message
          return { ok: false, message, ...errorData }
        } catch {
          return { ok: false, message }
        }
      } finally {
        this.loading.training = false
      }
    },

    // Play bot match
    async playBotMatch() {
      this.loading.match = true
      this.error = null
      try {
        const response = await clubApi.playBotMatch(this.getToken())
        if (response.ok && response.data) {
          this.lastMatchResult = response.data
          // Update players with new stats
          if (response.data.players) {
            this.players = response.data.players
          }
          // Update club fans if club exists
          if (this.club && response.data.rewards?.fans) {
            this.club.fans += response.data.rewards.fans
          }
          return { ok: true, data: response.data }
        }
        return { ok: false, message: response.message || 'Failed to start match' }
      } catch (err: any) {
        let message = err.message || 'Failed to start match'
        try {
          const errorData = JSON.parse(err.message)
          message = errorData.message || message
          return { ok: false, message, ...errorData }
        } catch {
          return { ok: false, message }
        }
      } finally {
        this.loading.match = false
      }
    },

    // Feed players
    async feedPlayers(playerIds: number[]) {
      this.loading.feed = true
      this.error = null
      try {
        const response = await clubApi.feedPlayers(playerIds, this.getToken())
        if (response.ok && response.data) {
          // Check if there are errors in the response data
          if (response.data.errors && response.data.errors.length > 0) {
            // Extract error message from the first error
            const errorMsg = response.data.errors[0].message || 'Failed to feed player'
            return { ok: false, message: errorMsg, data: response.data }
          }
          // Update player energy in local state
          response.data.processed.forEach(result => {
            const idx = this.players.findIndex(p => p.id === result.player_id)
            if (idx !== -1) {
              this.players[idx].energy = result.energy_after
            }
          })
          return { ok: true, data: response.data }
        }
        // Handle case where response.ok is false but data might have errors
        if (response.data?.errors && response.data.errors.length > 0) {
          const errorMsg = response.data.errors[0].message || 'Failed to feed player'
          return { ok: false, message: errorMsg }
        }
        return { ok: false, message: response.message || 'Failed to feed players' }
      } catch (err: any) {
        let message = err.message || 'Failed to feed players'
        try {
          const errorData = JSON.parse(err.message)
          // Check for nested error structure
          if (errorData.data?.errors && errorData.data.errors.length > 0) {
            message = errorData.data.errors[0].message
          } else {
            message = errorData.message || message
          }
          return { ok: false, message }
        } catch {
          return { ok: false, message }
        }
      } finally {
        this.loading.feed = false
      }
    },

    // Rest player
    async restPlayer(playerId: number, type: 'short' | 'full') {
      this.loading.rest = true
      this.error = null
      try {
        const response = await clubApi.restPlayer(playerId, type, this.getToken())
        if (response.ok && response.data) {
          // Update player task state with correct format: rest:type:duration:energy
          const idx = this.players.findIndex(p => p.id === playerId)
          if (idx !== -1) {
            // Format matches backend: rest:type:duration:energy_gain
            this.players[idx].current_task = `rest:${response.data.type}:${response.data.duration}:${response.data.energy_gain}`
            this.players[idx].task_ends_at = response.data.task_ends_at
          }
          return { ok: true, data: response.data }
        }
        return { ok: false, message: response.message || 'Failed to rest player' }
      } catch (err: any) {
        let message = err.message || 'Failed to rest player'
        try {
          const errorData = JSON.parse(err.message)
          message = errorData.message || message
          return { ok: false, message }
        } catch {
          return { ok: false, message }
        }
      } finally {
        this.loading.rest = false
      }
    },

    // Update a single player in local state (for task completion)
    updatePlayer(playerId: number, updates: Partial<Player>) {
      const idx = this.players.findIndex(p => p.id === playerId)
      if (idx !== -1) {
        this.players[idx] = { ...this.players[idx], ...updates }
      }
    },

    // Check and clear completed tasks locally
    checkCompletedTasks() {
      const now = new Date()
      this.players.forEach((player, idx) => {
        if (player.task_ends_at) {
          const endTime = this.parseTaskEndTime(player.task_ends_at)
          if (endTime <= now) {
            // Task should be complete, clear it locally
            // Note: actual stats update should come from API refresh
            this.players[idx].current_task = null
            this.players[idx].task_ends_at = null
          }
        }
      })
    },

    // Reset store state
    reset() {
      this.club = null
      this.players = []
      this.trainingOptions = []
      this.lastMatchResult = null
      this.error = null
    }
  }
})
