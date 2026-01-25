import { apiRequest } from '@/utils/api'

// Types

// Hint action types
export interface HintActionTrain {
  type: 'train'
  player_id: number
  train_type: 'conditioning' | 'finishing' | 'defensive' | 'light' | 'balanced'
}

export interface HintActionFeed {
  type: 'feed'
  player_id: number
  cost: number
}

export interface HintActionRest {
  type: 'rest'
  player_id: number
}

export type HintAction = HintActionTrain | HintActionFeed | HintActionRest

// Player hint
export interface PlayerHint {
  code: string
  priority: number
  text: string
  action?: HintAction
}

// Club hint
export interface ClubHint {
  code: string
  priority: number
  text: string
  meta?: {
    threshold?: number
    count?: number
  }
  action?: {
    type: 'train'
    train_type: string
    suggested_player_ids?: number[]
  }
}

export interface Player {
  id: number
  position: 'GK' | 'DEF' | 'MID' | 'ATT'
  level: number
  xp: number
  energy: number
  stamina: number
  strength: number
  awareness: number
  finishing: number
  // current_task can be:
  // - 'training' for training
  // - 'match' for match
  // - 'rest:type:duration:energy' format (e.g., 'rest:full:40:0' or 'rest:short:15:0')
  // - null when idle
  current_task: string | null
  task_ends_at: string | null
  hints?: PlayerHint[]
}

export interface Club {
  id: number
  user_id?: number
  name: string
  level: number
  xp?: number
  fans: number
  created_at?: string
  players: Player[]
  club_hints?: ClubHint[]
}

export interface TrainingOption {
  type: 'light' | 'balanced' | 'conditioning' | 'finishing'
  energy_cost: number
  xp_gain: number
  duration: number
  stats: Record<string, number>
  token_cost: number
  description: string
}

export interface RestOption {
  type: 'short' | 'full'
  duration: number
  energy_gain: number
}

// Feed Options
export type FeedType = 'protein_shake' | 'pizza' | 'energy_drink' | 'salad' | 'team_meal' | 'burger'

export interface FeedOption {
  type: FeedType
  title: string
  energy_gain: number
  cost: number
  description: string
}

// Match Event Types
export interface MatchEvent {
  minute: number
  team: 'club' | 'bot'
  action: 'pass' | 'shot' | 'goal'
  player_id?: number
  from_player_id?: number
  to_player_id?: number
  assist_player_id?: number
  result: 'complete' | 'on_target' | 'scored'
}

export interface MatchScene {
  scene_type: 'goal'
  team: 'club' | 'bot'
  minute: number
  events: MatchEvent[]
}

export interface MatchEvents {
  mode: 'highlight'
  final_score: { club: number; bot: number }
  scenes: MatchScene[]
}

export interface ClubProgress {
  xp_gain: number
  xp_total: number
  level: number
}

// Match Strategy Types
export type MatchStrategy = 'attacking' | 'defensive' | 'balanced'

export interface BotMatchRequest {
  level?: 1 | 2 | 3
  club_strategy?: MatchStrategy
  bot_strategy?: MatchStrategy
}

export interface BotMatchResult {
  result: 'win' | 'loss' | 'draw'
  score: { club: number; bot: number }
  rewards: { xp: number; energy: number; fans: number }
  bot_level?: number
  players: Player[]
  match_events?: MatchEvents
  club_progress?: ClubProgress
}

export interface LeagueClub {
  id: number
  name: string
  level: number
  fans: number
  xp?: number
}

export interface LeagueTableEntry {
  rank: number
  club: LeagueClub
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_diff: number
  points: number
  joined_at: string
}

export interface League {
  id: number
  name: string
  season: string
}

export interface LeagueMatch {
  match_id: number
  round: number
  status: 'scheduled' | 'finished'
  scheduled_at: string
  played_at: string | null
  home_club: LeagueClub
  away_club: LeagueClub
  score: { home: number | null; away: number | null }
}

export interface FeedResult {
  processed: Array<{
    player_id: number
    energy_before: number
    energy_after: number
    cost: number
  }>
  errors: Array<{
    player_id: number
    message: string
  }>
  tokens_left: number
}

export interface RestResult {
  player_id: number
  type: 'short' | 'full'
  duration: number
  energy_gain: number
  stamina_gain: number
  task_ends_at: string
}

export interface ApiResponse<T> {
  ok: boolean
  data?: T
  message?: string
}

export interface ApiErrorResponse {
  ok: false
  message: string
  task?: string
  task_ends_at?: string
  seconds_left?: number
  required?: number
  current?: number
}

export interface LeagueStart {
  start: string // Date string e.g. "2026-01-15"
  countdown: number // Seconds until league starts
}

// Club API Service
export const clubApi = {
  // Create a new club
  async createClub(name: string, token: string): Promise<ApiResponse<Club>> {
    return apiRequest('/Club/Create', {
      method: 'POST',
      body: { name }
    }, token)
  },

  // Get user's club
  async getMyClub(token: string): Promise<ApiResponse<Club>> {
    return apiRequest('/Club/Me', { method: 'GET' }, token)
  },

  // Update club name
  async updateClubName(name: string, token: string): Promise<ApiResponse<Club>> {
    return apiRequest('/Club/UpdateName', {
      method: 'POST',
      body: { name }
    }, token)
  },

  // Get club players
  async getPlayers(token: string): Promise<ApiResponse<Player[]>> {
    return apiRequest('/Club/Players', { method: 'GET' }, token)
  },

  // Get training options
  async getTrainingOptions(token: string): Promise<ApiResponse<TrainingOption[]>> {
    return apiRequest('/Club/Training/Options', { method: 'GET' }, token)
  },

  // Train a player
  async trainPlayer(
    playerId: number,
    type: 'light' | 'balanced' | 'conditioning' | 'finishing',
    token: string
  ): Promise<ApiResponse<Player>> {
    return apiRequest('/Club/Train', {
      method: 'POST',
      body: { player_id: playerId, type }
    }, token)
  },

  // Play bot match
  async playBotMatch(request: BotMatchRequest, token: string): Promise<ApiResponse<BotMatchResult>> {
    return apiRequest('/Club/Match/Bot', {
      method: 'POST',
      body: request
    }, token)
  },

  // Get feed options
  async getFeedOptions(token: string): Promise<ApiResponse<FeedOption[]>> {
    return apiRequest('/Club/Feed/Options', { method: 'GET' }, token)
  },

  // Feed players
  async feedPlayers(playerIds: number[], feedType: FeedType = 'protein_shake', token: string): Promise<ApiResponse<FeedResult>> {
    return apiRequest('/Club/Player/Feed', {
      method: 'POST',
      body: { player_id: playerIds, feed_type: feedType }
    }, token)
  },

  // Rest player
  async restPlayer(
    playerId: number,
    type: 'short' | 'full',
    token: string
  ): Promise<ApiResponse<RestResult>> {
    return apiRequest('/Club/Player/Rest', {
      method: 'POST',
      body: { player_id: playerId, type }
    }, token)
  },

  // Join league
  async joinLeague(leagueId: number, token: string): Promise<ApiResponse<{ member_id: number; league_id: number; club_id: number }>> {
    return apiRequest(`/Club/League/${leagueId}/Join`, {
      method: 'POST',
      body: {}
    }, token)
  },

  // Get league table
  async getLeagueTable(leagueId: number, token: string): Promise<ApiResponse<{ league: League; table: LeagueTableEntry[] }>> {
    return apiRequest(`/Club/League/${leagueId}/Table`, { method: 'GET' }, token)
  },

  // Get league schedule
  async getLeagueSchedule(leagueId: number, token: string): Promise<ApiResponse<{ league: League; matches: LeagueMatch[] }>> {
    return apiRequest(`/Club/League/${leagueId}/Schedule`, { method: 'GET' }, token)
  },

  // Get league start countdown
  async getLeagueStart(token: string): Promise<ApiResponse<LeagueStart>> {
    return apiRequest('/Club/League/Start', { method: 'GET' }, token)
  }
}
