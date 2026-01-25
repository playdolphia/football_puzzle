import { defineStore } from 'pinia'
import { clubApi, type LeagueListItem, type ClubLeagueMembership, type League, type LeagueTableEntry, type LeagueMatch, type MatchEvents } from '@/services/clubApi'
import { useGlobalStore } from '@/stores/index'

interface LeagueState {
  // Available leagues to join
  availableLeagues: LeagueListItem[]

  // Current league membership
  currentMembership: ClubLeagueMembership | null

  // Current league data (when viewing)
  leagueInfo: League | null
  leagueTable: LeagueTableEntry[]
  leagueSchedule: LeagueMatch[]

  // Match highlights for viewing
  currentMatchEvents: MatchEvents | null

  // Loading states
  loading: {
    list: boolean
    membership: boolean
    join: boolean
    table: boolean
    schedule: boolean
    matchEvents: boolean
  }

  error: string | null
}

export const useLeagueStore = defineStore('league', {
  state: (): LeagueState => ({
    availableLeagues: [],
    currentMembership: null,
    leagueInfo: null,
    leagueTable: [],
    leagueSchedule: [],
    currentMatchEvents: null,
    loading: {
      list: false,
      membership: false,
      join: false,
      table: false,
      schedule: false,
      matchEvents: false
    },
    error: null
  }),

  getters: {
    // Check if club is in a league
    isInLeague: (state): boolean => state.currentMembership !== null,

    // Get current league ID
    currentLeagueId: (state): number | null => state.currentMembership?.league_id ?? null,

    // Find club's position in table
    clubRanking: (state) => (clubId: number): LeagueTableEntry | undefined => {
      return state.leagueTable.find(e => e.club.id === clubId)
    },

    // Get upcoming matches (scheduled)
    upcomingMatches: (state): LeagueMatch[] => {
      return state.leagueSchedule
        .filter(m => m.status === 'scheduled')
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    },

    // Get recent results (finished matches, most recent first)
    recentResults: (state): LeagueMatch[] => {
      return state.leagueSchedule
        .filter(m => m.status === 'finished')
        .sort((a, b) => new Date(b.played_at || b.scheduled_at).getTime() - new Date(a.played_at || a.scheduled_at).getTime())
    },

    // Get top 5 entries for widget
    topFiveTable: (state): LeagueTableEntry[] => {
      return state.leagueTable.slice(0, 5)
    },

    // Check if any loading is in progress
    isLoading: (state): boolean => Object.values(state.loading).some(v => v),

    // Get current league name
    currentLeagueName: (state): string => state.leagueInfo?.name ?? ''
  },

  actions: {
    getToken(): string {
      const globalStore = useGlobalStore()
      return globalStore.apiToken || ''
    },

    clearError() {
      this.error = null
    },

    // Fetch club's current league membership
    async fetchMyLeague() {
      this.loading.membership = true
      this.error = null
      try {
        const response = await clubApi.getMyLeague(this.getToken())
        if (response.ok) {
          this.currentMembership = response.data ?? null
          return { ok: true, data: response.data }
        }
        // Not in a league is not an error
        this.currentMembership = null
        return { ok: true, data: null }
      } catch (err: any) {
        // 404 means not in a league
        if (err.status === 404) {
          this.currentMembership = null
          return { ok: true, data: null }
        }
        this.error = err.message || 'Failed to fetch league membership'
        return { ok: false, message: this.error }
      } finally {
        this.loading.membership = false
      }
    },

    // Fetch available leagues list
    async fetchAvailableLeagues() {
      this.loading.list = true
      this.error = null
      try {
        const response = await clubApi.getLeagueList(this.getToken())
        if (response.ok && response.data) {
          this.availableLeagues = response.data
          return { ok: true, data: response.data }
        }
        return { ok: false, message: response.message || 'Failed to fetch leagues' }
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch leagues'
        return { ok: false, message: this.error }
      } finally {
        this.loading.list = false
      }
    },

    // Join a league
    async joinLeague(leagueId: number) {
      this.loading.join = true
      this.error = null
      try {
        const response = await clubApi.joinLeague(leagueId, this.getToken())
        if (response.ok && response.data) {
          // Update membership
          this.currentMembership = {
            league_id: response.data.league_id,
            member_id: response.data.member_id
          }
          // Fetch league data after joining
          await this.fetchLeagueTable(leagueId)
          await this.fetchLeagueSchedule(leagueId)
          return { ok: true, data: response.data }
        }
        return { ok: false, message: response.message || 'Failed to join league' }
      } catch (err: any) {
        let message = err.message || 'Failed to join league'
        try {
          const errorData = JSON.parse(err.message)
          message = errorData.message || message
        } catch {
          // Ignore parse error
        }
        this.error = message
        return { ok: false, message }
      } finally {
        this.loading.join = false
      }
    },

    // Fetch league table/standings
    async fetchLeagueTable(leagueId?: number) {
      const id = leagueId ?? this.currentMembership?.league_id
      if (!id) {
        return { ok: false, message: 'No league ID provided' }
      }

      this.loading.table = true
      this.error = null
      try {
        const response = await clubApi.getLeagueTable(id, this.getToken())
        if (response.ok && response.data) {
          this.leagueInfo = response.data.league
          this.leagueTable = response.data.table
          return { ok: true, data: response.data }
        }
        return { ok: false, message: response.message || 'Failed to fetch league table' }
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch league table'
        return { ok: false, message: this.error }
      } finally {
        this.loading.table = false
      }
    },

    // Fetch league schedule
    async fetchLeagueSchedule(leagueId?: number) {
      const id = leagueId ?? this.currentMembership?.league_id
      if (!id) {
        return { ok: false, message: 'No league ID provided' }
      }

      this.loading.schedule = true
      this.error = null
      try {
        const response = await clubApi.getLeagueSchedule(id, this.getToken())
        if (response.ok && response.data) {
          this.leagueInfo = response.data.league
          this.leagueSchedule = response.data.matches
          return { ok: true, data: response.data }
        }
        return { ok: false, message: response.message || 'Failed to fetch schedule' }
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch schedule'
        return { ok: false, message: this.error }
      } finally {
        this.loading.schedule = false
      }
    },

    // Fetch match events for highlights
    async fetchMatchEvents(matchId: number) {
      const leagueId = this.currentMembership?.league_id
      if (!leagueId) {
        return { ok: false, message: 'Not in a league' }
      }

      this.loading.matchEvents = true
      this.error = null
      try {
        const response = await clubApi.getLeagueMatchEvents(leagueId, matchId, this.getToken())
        if (response.ok && response.data) {
          this.currentMatchEvents = response.data
          return { ok: true, data: response.data }
        }
        return { ok: false, message: response.message || 'Failed to fetch match events' }
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch match events'
        return { ok: false, message: this.error }
      } finally {
        this.loading.matchEvents = false
      }
    },

    // Clear match events (when closing highlights viewer)
    clearMatchEvents() {
      this.currentMatchEvents = null
    },

    // Fetch both table and schedule together
    async fetchFullLeagueData(leagueId?: number) {
      const id = leagueId ?? this.currentMembership?.league_id
      if (!id) {
        return { ok: false, message: 'No league ID provided' }
      }

      const [tableResult, scheduleResult] = await Promise.all([
        this.fetchLeagueTable(id),
        this.fetchLeagueSchedule(id)
      ])

      return {
        ok: tableResult.ok && scheduleResult.ok,
        table: tableResult,
        schedule: scheduleResult
      }
    },

    // Reset store state
    reset() {
      this.availableLeagues = []
      this.currentMembership = null
      this.leagueInfo = null
      this.leagueTable = []
      this.leagueSchedule = []
      this.currentMatchEvents = null
      this.error = null
    }
  }
})
