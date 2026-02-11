import { getTelegramData } from '@/utils/telegram'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface PuzzleData {
  id: number
  image: string
  grid_cols: number
  grid_rows: number
  seed: number
}

export interface UserPuzzleData {
  puzzle_id: number
  status: 'started' | 'in_progress' | 'finished'
  started_at: string
  finished_at: string | null
  duration_sec: number
  moves: number
  current: Record<string, any> | null
}

export interface StartPuzzleResponse {
  ok: boolean
  puzzle_data: PuzzleData
  user_data: UserPuzzleData | null
}

async function apiRequest(endpoint: string, options: { method?: string; body?: any } = {}, token: string | null) {
  const { method = 'GET', body } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  }

  const tg = getTelegramData()
  let initData = tg?.initData
  let userId = tg?.userId
  let username = tg?.username
  if (import.meta.env.VITE_TEST_CHAT_ID) {
    initData = import.meta.env.VITE_TEST_INIT_DATA
    userId = import.meta.env.VITE_TEST_CHAT_ID
    username = import.meta.env.VITE_TEST_USERNAME
  }

  let finalBody: string | null = null
  if (body && typeof body === 'object') {
    finalBody = JSON.stringify({
      ...body,
      __tlg: { init_data: initData, chat_id: userId, username }
    })
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) ? finalBody : null,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export async function startPuzzle(token: string | null, gridSize?: { grid_cols: number; grid_rows: number }): Promise<StartPuzzleResponse> {
  const params = gridSize ? `?grid_cols=${gridSize.grid_cols}&grid_rows=${gridSize.grid_rows}` : ''
  return apiRequest(`/Puzzle/Start${params}`, { method: 'GET' }, token)
}

export async function donePuzzle(token: string | null, puzzleId: number, moves: number): Promise<{ ok: boolean }> {
  return apiRequest('/Puzzle/Done', { method: 'PUT', body: { puzzle_id: puzzleId, moves } }, token)
}

export async function savePuzzleCurrent(token: string | null, current: Record<string, any>): Promise<{ ok: boolean }> {
  return apiRequest('/Puzzle/Current', { method: 'POST', body: { current } }, token)
}

export interface UserProfile {
  user_info: {
    display_name: string
    avatar: string
    nickname?: string
  }
  metadata?: {
    admin_role?: boolean
  }
}

export async function getUserProfile(token: string | null): Promise<UserProfile> {
  return apiRequest('/User/Profile', { method: 'GET' }, token)
}
