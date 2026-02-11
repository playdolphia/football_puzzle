import { defineStore } from 'pinia'
import { useGlobalStore } from '@/stores'
import { startPuzzle, donePuzzle, savePuzzleCurrent, type PuzzleData, type UserPuzzleData } from '@/services/puzzleApi'
import { seededShuffle } from '@/utils/seededRandom'

export interface Tile {
  id: number
  correctRow: number
  correctCol: number
}

export interface GridCell {
  tile: Tile | null
}

export interface GridOption {
  label: string
  cols: number
  rows: number
  total: number
}

export type PuzzlePhase = 'loading' | 'picking' | 'playing' | 'completed'

export interface PuzzleState {
  phase: PuzzlePhase
  puzzleData: PuzzleData | null
  userData: UserPuzzleData | null
  grid: GridCell[][]
  tray: Tile[]
  moves: number
  elapsedSeconds: number
  isCompleted: boolean
  loading: boolean
  error: string | null
  timerInterval: number | null
  imageAspectRatio: number | null
}

const PREFERRED_DIFFICULTY_KEY = 'puzzle_preferred_difficulty'

export const usePuzzleStore = defineStore('puzzle', {
  state: (): PuzzleState => ({
    phase: 'loading',
    puzzleData: null,
    userData: null,
    grid: [],
    tray: [],
    moves: 0,
    elapsedSeconds: 0,
    isCompleted: false,
    loading: false,
    error: null,
    timerInterval: null,
    imageAspectRatio: null,
  }),

  getters: {
    gridRows: (state) => state.puzzleData?.grid_rows || 0,
    gridCols: (state) => state.puzzleData?.grid_cols || 0,
    puzzleImage: (state) => state.puzzleData?.image || '',
    totalTiles: (state) => {
      const rows = state.puzzleData?.grid_rows || 0
      const cols = state.puzzleData?.grid_cols || 0
      return rows * cols
    },

    gridOptions: (state): GridOption[] => {
      const ratio = state.imageAspectRatio
      if (!ratio) return []

      const options: GridOption[] = []
      const targets = [
        { label: 'Easy', tiles: 100 },
        { label: 'Medium', tiles: 400 },
        { label: 'Hard', tiles: 900 },
        { label: 'Expert', tiles: 1600 },
      ]

      for (const { label, tiles } of targets) {
        // cols/rows should approximate the image aspect ratio
        // cols = sqrt(tiles * ratio), rows = tiles / cols
        let cols = Math.round(Math.sqrt(tiles * ratio))
        cols = Math.max(5, Math.min(cols, 50))
        let rows = Math.round(tiles / cols)
        rows = Math.max(5, Math.min(rows, 50))
        options.push({ label, cols, rows, total: cols * rows })
      }

      return options
    },
  },

  actions: {
    async fetchPuzzle() {
      this.loading = true
      this.error = null
      this.phase = 'loading'

      try {
        const globalStore = useGlobalStore()
        const response = await startPuzzle(globalStore.apiToken)

        if (!response.ok) {
          throw new Error('Failed to start puzzle')
        }

        this.puzzleData = response.puzzle_data
        this.userData = response.user_data

        // If user has an in-progress puzzle, go straight to playing
        const status = response.user_data?.status
        if (response.user_data && (status === 'in_progress' || status === 'started')) {
          let current = response.user_data.current
          if (typeof current === 'string') {
            try { current = JSON.parse(current) } catch { current = null }
          }

          // API may not return grid dimensions — restore from saved state
          if (!this.puzzleData!.grid_cols && current?.grid_cols) {
            this.puzzleData!.grid_cols = current.grid_cols
            this.puzzleData!.grid_rows = current.grid_rows
          }

          // If we still don't have dimensions, can't resume — try saved preference or picker
          if (!this.puzzleData!.grid_cols) {
            await this.pickOrAutoStart(response.puzzle_data.image)
            return
          }

          this.setupGrid()
          if (current && Object.keys(current).length > 0) {
            this.restoreState(current)
            this.moves = current.moves ?? response.user_data.moves ?? 0
            this.elapsedSeconds = current.duration_sec ?? 0
          } else {
            this.moves = response.user_data.moves || 0
            this.initializeTiles()
          }
          this.startTimer()
          this.phase = 'playing'
          return
        }

        // If puzzle is already finished
        if (response.user_data && response.user_data.status === 'finished') {
          this.moves = response.user_data.moves
          this.isCompleted = true
          this.elapsedSeconds = response.user_data.duration_sec
          this.setupCompletedPuzzle()
          this.phase = 'completed'
          return
        }

        // user_data is null → new puzzle, try saved preference or pick
        await this.pickOrAutoStart(response.puzzle_data.image)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'An error occurred'
        console.error('Error fetching puzzle:', err)
      } finally {
        this.loading = false
      }
    },

    async pickOrAutoStart(imageUrl: string) {
      await this.loadImageAspectRatio(imageUrl)
      const savedLabel = localStorage.getItem(PREFERRED_DIFFICULTY_KEY)
      if (savedLabel) {
        const option = this.gridOptions.find((o: GridOption) => o.label === savedLabel)
        if (option) {
          await this.startWithGridSize(option.cols, option.rows)
          return
        }
      }
      this.phase = 'picking'
    },

    savePreferredDifficulty(label: string) {
      localStorage.setItem(PREFERRED_DIFFICULTY_KEY, label)
    },

    async startWithGridSize(cols: number, rows: number) {
      this.loading = true
      this.error = null

      try {
        const globalStore = useGlobalStore()
        const response = await startPuzzle(globalStore.apiToken, { grid_cols: cols, grid_rows: rows })

        if (!response.ok) {
          throw new Error('Failed to start puzzle')
        }

        // API doesn't return grid dimensions — merge them from the request params
        this.puzzleData = { ...response.puzzle_data, grid_cols: cols, grid_rows: rows }
        this.userData = response.user_data
        this.moves = response.user_data?.moves || 0

        this.setupGrid()
        this.initializeTiles()
        this.startTimer()
        this.phase = 'playing'

        // Persist initial state so dimensions are available on resume
        await this.saveCurrentState()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'An error occurred'
        console.error('Error starting puzzle:', err)
      } finally {
        this.loading = false
      }
    },

    loadImageAspectRatio(url: string): Promise<void> {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          this.imageAspectRatio = img.naturalWidth / img.naturalHeight
          resolve()
        }
        img.onerror = () => {
          // Fallback to square if image fails to load
          this.imageAspectRatio = 1
          resolve()
        }
        img.src = url
      })
    },

    setupGrid() {
      const rows = this.puzzleData!.grid_rows
      const cols = this.puzzleData!.grid_cols
      this.grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({ tile: null }))
      )
    },

    setupCompletedPuzzle() {
      const rows = this.puzzleData!.grid_rows
      const cols = this.puzzleData!.grid_cols

      this.grid = Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => ({
          tile: {
            id: row * cols + col,
            correctRow: row,
            correctCol: col,
          }
        }))
      )
      this.tray = []
    },

    initializeTiles() {
      const rows = this.puzzleData!.grid_rows
      const cols = this.puzzleData!.grid_cols
      const seed = this.puzzleData!.seed

      const tiles: Tile[] = []
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          tiles.push({
            id: row * cols + col,
            correctRow: row,
            correctCol: col,
          })
        }
      }

      this.tray = seededShuffle(tiles, seed)
    },

    restoreState(current: Record<string, any>) {
      const { grid: savedGrid, tray: savedTray } = current

      if (Array.isArray(savedGrid)) {
        const rows = this.puzzleData!.grid_rows
        const cols = this.puzzleData!.grid_cols

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const tileId = savedGrid[row]?.[col]
            if (typeof tileId === 'number') {
              const correctRow = Math.floor(tileId / cols)
              const correctCol = tileId % cols
              this.grid[row][col].tile = {
                id: tileId,
                correctRow,
                correctCol,
              }
            }
          }
        }
      }

      if (Array.isArray(savedTray)) {
        const cols = this.puzzleData!.grid_cols
        this.tray = savedTray.map((tileId: number) => {
          const correctRow = Math.floor(tileId / cols)
          const correctCol = tileId % cols
          return {
            id: tileId,
            correctRow,
            correctCol,
          }
        })
      }
    },

    async placeTile(tileId: number, row: number, col: number) {
      if (this.isCompleted) return

      const trayIndex = this.tray.findIndex(t => t.id === tileId)
      if (trayIndex === -1) return

      if (this.grid[row][col].tile !== null) return

      const tile = this.tray.splice(trayIndex, 1)[0]
      this.grid[row][col].tile = tile
      this.moves++

      await this.saveCurrentState()
      this.checkCompletion()
    },

    async removeTile(row: number, col: number) {
      if (this.isCompleted) return

      const tile = this.grid[row][col].tile
      if (!tile) return

      this.grid[row][col].tile = null
      this.tray.unshift(tile)

      await this.saveCurrentState()
    },

    isTileCorrect(tile: Tile, row: number, col: number): boolean {
      return tile.correctRow === row && tile.correctCol === col
    },

    checkCompletion() {
      if (this.isCompleted) return

      const rows = this.puzzleData!.grid_rows
      const cols = this.puzzleData!.grid_cols

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cell = this.grid[row][col]
          if (!cell.tile || !this.isTileCorrect(cell.tile, row, col)) {
            return
          }
        }
      }

      this.completePuzzle()
    },

    async completePuzzle() {
      this.isCompleted = true
      this.phase = 'completed'
      this.stopTimer()

      try {
        const globalStore = useGlobalStore()
        await donePuzzle(globalStore.apiToken, this.puzzleData!.id, this.moves)
      } catch (err) {
        console.error('Error completing puzzle:', err)
      }
    },

    async saveCurrentState() {
      try {
        const globalStore = useGlobalStore()

        const gridState = this.grid.map(row =>
          row.map(cell => cell.tile?.id ?? null)
        )
        const trayState = this.tray.map(tile => tile.id)

        const current = {
          grid: gridState,
          tray: trayState,
          grid_cols: this.puzzleData!.grid_cols,
          grid_rows: this.puzzleData!.grid_rows,
          moves: this.moves,
          duration_sec: this.elapsedSeconds,
        }

        await savePuzzleCurrent(globalStore.apiToken, current)
      } catch (err) {
        console.error('Error saving puzzle state:', err)
      }
    },

    startTimer() {
      if (this.timerInterval !== null) return

      this.timerInterval = window.setInterval(() => {
        this.elapsedSeconds++
      }, 1000)
    },

    stopTimer() {
      if (this.timerInterval !== null) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    },

    resetPuzzle() {
      this.stopTimer()
      this.phase = 'loading'
      this.puzzleData = null
      this.userData = null
      this.grid = []
      this.tray = []
      this.moves = 0
      this.elapsedSeconds = 0
      this.isCompleted = false
      this.loading = false
      this.error = null
      this.imageAspectRatio = null
    },
  },
})
