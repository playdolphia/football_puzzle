<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePuzzleStore, type GridOption } from '@/stores/puzzleStore'
import { useGlobalStore } from '@/stores'
import PuzzleGrid from '@/components/puzzle/PuzzleGrid.vue'
import TileTray from '@/components/puzzle/TileTray.vue'
import CompletionOverlay from '@/components/puzzle/CompletionOverlay.vue'

const router = useRouter()
const puzzleStore = usePuzzleStore()
const globalStore = useGlobalStore()

const selectedTileId = ref<number | null>(null)

// ── Constants ──

const BASE_TILE = 40
const TRAY_TILE_SIZE = 64
const MIN_SCALE = 0.2
const MAX_SCALE = 3
const ZOOM_STEP = 0.25
const PAN_THRESHOLD = 8

// ── Pan & Zoom State ──

const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
const containerRef = ref<HTMLElement | null>(null)

const gridNaturalWidth = computed(() => {
  const cols = puzzleStore.gridCols
  return cols * BASE_TILE + Math.max(0, cols - 1) * 2
})

const gridNaturalHeight = computed(() => {
  const rows = puzzleStore.gridRows
  return rows * BASE_TILE + Math.max(0, rows - 1) * 2
})

const transformStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${scale.value})`,
  transformOrigin: '0 0',
}))

function centerGrid(): boolean {
  if (!containerRef.value) return false
  const cw = containerRef.value.clientWidth
  const ch = containerRef.value.clientHeight
  const gw = gridNaturalWidth.value
  const gh = gridNaturalHeight.value
  if (gw === 0 || gh === 0) return false

  const fitScale = Math.min((cw - 24) / gw, (ch - 24) / gh, 1.5)
  scale.value = Math.max(MIN_SCALE, fitScale)
  panX.value = (cw - gw * scale.value) / 2
  panY.value = (ch - gh * scale.value) / 2
  return true
}

function clampPan() {
  if (!containerRef.value) return
  const cw = containerRef.value.clientWidth
  const ch = containerRef.value.clientHeight
  const gw = gridNaturalWidth.value * scale.value
  const gh = gridNaturalHeight.value * scale.value

  // Grid must overlap at least half the container in each axis
  panX.value = Math.max(cw / 2 - gw, Math.min(cw / 2, panX.value))
  panY.value = Math.max(ch / 2 - gh, Math.min(ch / 2, panY.value))
}

function zoomToward(screenX: number, screenY: number, newScale: number) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const localX = (screenX - rect.left - panX.value) / scale.value
  const localY = (screenY - rect.top - panY.value) / scale.value
  scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))
  panX.value = screenX - rect.left - localX * scale.value
  panY.value = screenY - rect.top - localY * scale.value
  clampPan()
}

function zoomTowardCenter(delta: number) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  zoomToward(rect.left + rect.width / 2, rect.top + rect.height / 2, scale.value + delta)
}

// ── Mouse Wheel Zoom ──

function onWheel(e: WheelEvent) {
  e.preventDefault()
  const factor = e.deltaY > 0 ? 0.92 : 1.08
  zoomToward(e.clientX, e.clientY, scale.value * factor)
}

// ── Mouse Drag Pan ──

let isMousePanning = false

function onMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  const startX = e.clientX
  const startY = e.clientY
  isMousePanning = false

  const onMove = (ev: MouseEvent) => {
    if (!isMousePanning && Math.hypot(ev.clientX - startX, ev.clientY - startY) > PAN_THRESHOLD) {
      isMousePanning = true
    }
    if (isMousePanning) {
      panX.value += ev.movementX
      panY.value += ev.movementY
      clampPan()
    }
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    if (isMousePanning) {
      suppressGridClick = true
      setTimeout(() => { suppressGridClick = false }, 200)
    }
    isMousePanning = false
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// ── Touch Gestures ──

let touchStartDist = 0
let touchStartScale = 1
let touchStartPanX = 0
let touchStartPanY = 0
let touchStartMidX = 0
let touchStartMidY = 0
let lastSingleX = 0
let lastSingleY = 0
let singleTouchStartX = 0
let singleTouchStartY = 0
let isTouchPanning = false
let isTouchPinching = false

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    e.preventDefault()
    isTouchPinching = true
    isTouchPanning = false
    const t0 = e.touches[0]
    const t1 = e.touches[1]
    touchStartDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
    touchStartScale = scale.value
    touchStartMidX = (t0.clientX + t1.clientX) / 2
    touchStartMidY = (t0.clientY + t1.clientY) / 2
    touchStartPanX = panX.value
    touchStartPanY = panY.value
  } else if (e.touches.length === 1) {
    isTouchPanning = false
    isTouchPinching = false
    lastSingleX = e.touches[0].clientX
    lastSingleY = e.touches[0].clientY
    singleTouchStartX = lastSingleX
    singleTouchStartY = lastSingleY
  }
}

function onTouchMove(e: TouchEvent) {
  if (isTouchPinching && e.touches.length >= 2) {
    e.preventDefault()
    const t0 = e.touches[0]
    const t1 = e.touches[1]
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY)
    const midX = (t0.clientX + t1.clientX) / 2
    const midY = (t0.clientY + t1.clientY) / 2

    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, touchStartScale * (dist / touchStartDist)))

    if (!containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    const localX = (touchStartMidX - rect.left - touchStartPanX) / touchStartScale
    const localY = (touchStartMidY - rect.top - touchStartPanY) / touchStartScale

    scale.value = newScale
    panX.value = midX - rect.left - localX * newScale
    panY.value = midY - rect.top - localY * newScale
    clampPan()
  } else if (e.touches.length === 1 && !isTouchPinching) {
    const x = e.touches[0].clientX
    const y = e.touches[0].clientY

    if (!isTouchPanning) {
      if (Math.hypot(x - singleTouchStartX, y - singleTouchStartY) > PAN_THRESHOLD) {
        isTouchPanning = true
      }
    }

    if (isTouchPanning) {
      e.preventDefault()
      panX.value += x - lastSingleX
      panY.value += y - lastSingleY
      clampPan()
    }

    lastSingleX = x
    lastSingleY = y
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length === 0) {
    if (isTouchPanning || isTouchPinching) {
      suppressGridClick = true
      setTimeout(() => { suppressGridClick = false }, 300)
    }
    isTouchPanning = false
    isTouchPinching = false
  } else if (e.touches.length === 1 && isTouchPinching) {
    // Transitioned from pinch to single finger
    isTouchPinching = false
    isTouchPanning = false
    lastSingleX = e.touches[0].clientX
    lastSingleY = e.touches[0].clientY
    singleTouchStartX = lastSingleX
    singleTouchStartY = lastSingleY
  }
}

// ── Event Listener Setup ──

watch(containerRef, (newEl, oldEl) => {
  if (oldEl) {
    oldEl.removeEventListener('wheel', onWheel)
    oldEl.removeEventListener('mousedown', onMouseDown)
    oldEl.removeEventListener('touchstart', onTouchStart)
    oldEl.removeEventListener('touchmove', onTouchMove)
    oldEl.removeEventListener('touchend', onTouchEnd)
  }
  if (newEl) {
    newEl.addEventListener('wheel', onWheel, { passive: false })
    newEl.addEventListener('mousedown', onMouseDown)
    newEl.addEventListener('touchstart', onTouchStart, { passive: false })
    newEl.addEventListener('touchmove', onTouchMove, { passive: false })
    newEl.addEventListener('touchend', onTouchEnd, { passive: false })
  }
})

// Center grid when playing starts (use rAF to ensure layout is computed)
let hasCentered = false

watch(() => puzzleStore.phase, async (phase) => {
  if (phase === 'playing') {
    hasCentered = false
    await nextTick()
    requestAnimationFrame(() => {
      hasCentered = centerGrid()
    })
  }
})

// Also center when containerRef becomes available (handles case where loading hides the container)
watch(containerRef, async (el) => {
  if (el && puzzleStore.phase === 'playing' && !hasCentered) {
    await nextTick()
    requestAnimationFrame(() => {
      hasCentered = centerGrid()
    })
  }
})

// ── Timer & Progress ──

const formattedTime = computed(() => {
  const minutes = Math.floor(puzzleStore.elapsedSeconds / 60)
  const seconds = puzzleStore.elapsedSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const progress = computed(() => {
  if (!puzzleStore.puzzleData) return 0
  const total = puzzleStore.totalTiles
  if (total === 0) return 0
  let correct = 0

  const rows = puzzleStore.puzzleData.grid_rows
  const cols = puzzleStore.puzzleData.grid_cols

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = puzzleStore.grid[row]?.[col]
      if (cell?.tile && puzzleStore.isTileCorrect(cell.tile, row, col)) {
        correct++
      }
    }
  }

  return Math.round((correct / total) * 100)
})

// ── Drag & Drop from Tray ──

const isDragging = ref(false)
const dragTile = ref<{ id: number; correctRow: number; correctCol: number } | null>(null)
const dragPos = ref({ x: 0, y: 0 })
let suppressDragSelect = false
let suppressGridClick = false

const DRAG_THRESHOLD = 8

function handleTilePointerDown(payload: { tile: any; event: PointerEvent }) {
  const tile = payload.tile
  const startX = payload.event.clientX
  const startY = payload.event.clientY
  dragTile.value = tile
  dragPos.value = { x: startX, y: startY }
  let hasDragged = false

  const onMove = (e: PointerEvent) => {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (!hasDragged && dist > DRAG_THRESHOLD) {
      if (Math.abs(dy) > Math.abs(dx)) {
        hasDragged = true
        isDragging.value = true
        selectedTileId.value = null
      } else {
        cleanup()
        dragTile.value = null
        return
      }
    }

    if (hasDragged) {
      e.preventDefault()
      dragPos.value = { x: e.clientX, y: e.clientY }
    }
  }

  const onUp = (e: PointerEvent) => {
    cleanup()

    if (hasDragged && dragTile.value) {
      suppressDragSelect = true
      setTimeout(() => { suppressDragSelect = false }, 100)

      const cell = getCellAtPosition(e.clientX, e.clientY)
      if (cell !== null) {
        const gridCell = puzzleStore.grid[cell.row]?.[cell.col]
        if (gridCell && !gridCell.tile) {
          puzzleStore.placeTile(dragTile.value.id, cell.row, cell.col)
        }
      }
    }

    isDragging.value = false
    dragTile.value = null
  }

  const cleanup = () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
  }

  document.addEventListener('pointermove', onMove, { passive: false })
  document.addEventListener('pointerup', onUp)
}

function getCellAtPosition(clientX: number, clientY: number): { row: number; col: number } | null {
  const gridEl = document.querySelector('[data-puzzle-grid]')
  if (!gridEl) return null

  const rect = gridEl.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null

  // Visual cell step accounts for CSS transform scale (2px gap)
  const visualCellStep = (BASE_TILE + 2) * scale.value
  const col = Math.floor(x / visualCellStep)
  const row = Math.floor(y / visualCellStep)

  if (row < 0 || row >= puzzleStore.gridRows || col < 0 || col >= puzzleStore.gridCols) {
    return null
  }

  return { row, col }
}

// ── Grid Interaction Handlers ──

const handleGridSelect = async (option: GridOption) => {
  puzzleStore.savePreferredDifficulty(option.label)
  await puzzleStore.startWithGridSize(option.cols, option.rows)
}

const handleTileSelect = (tileId: number) => {
  if (suppressDragSelect) return
  selectedTileId.value = tileId
}

const handleGridCellClick = async (payload: { row: number; col: number }) => {
  if (suppressGridClick) return
  if (selectedTileId.value !== null) {
    await puzzleStore.placeTile(selectedTileId.value, payload.row, payload.col)
    selectedTileId.value = null
  }
}

const handleGridTileClick = async (payload: { row: number; col: number; tile: any }) => {
  if (suppressGridClick) return
  if (puzzleStore.isTileCorrect(payload.tile, payload.row, payload.col)) return
  await puzzleStore.removeTile(payload.row, payload.col)
}

const handleBack = () => {
  router.push('/')
}

onMounted(async () => {
  await puzzleStore.fetchPuzzle()
})

onUnmounted(() => {
  puzzleStore.stopTimer()
  containerRef.value?.removeEventListener('wheel', onWheel)
  containerRef.value?.removeEventListener('mousedown', onMouseDown)
  containerRef.value?.removeEventListener('touchstart', onTouchStart)
  containerRef.value?.removeEventListener('touchmove', onTouchMove)
  containerRef.value?.removeEventListener('touchend', onTouchEnd)
})
</script>

<template>
  <div class="h-screen bg-background flex flex-col overflow-hidden">
    <!-- Header Bar -->
    <header class="shrink-0 bg-background/95 backdrop-blur-sm border-b border-border/40">
      <div class="flex items-center justify-between px-4 py-3">
        <button
          @click="handleBack"
          class="flex items-center gap-2 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <template v-if="puzzleStore.phase === 'playing'">
          <div class="text-center">
            <p class="text-xs tracking-wide text-muted-foreground/60 uppercase">Time</p>
            <p class="text-sm tracking-wide text-foreground/80 font-mono">{{ formattedTime }}</p>
          </div>
          <div class="text-center min-w-[60px]">
            <p class="text-xs tracking-wide text-muted-foreground/60 uppercase">Moves</p>
            <p class="text-sm tracking-wide text-foreground/80 font-mono">{{ puzzleStore.moves }}</p>
          </div>
        </template>
        <template v-else>
          <p class="text-xs tracking-[0.2em] text-muted-foreground/50 uppercase">Daily Challenge</p>
          <div class="w-5" />
        </template>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow flex flex-col overflow-hidden">

      <!-- Loading State -->
      <div v-if="puzzleStore.loading" class="flex-grow flex items-center justify-center">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style="animation-delay: 0ms" />
          <div class="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style="animation-delay: 150ms" />
          <div class="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style="animation-delay: 300ms" />
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="puzzleStore.error" class="flex-grow flex items-center justify-center p-6">
        <div class="text-center space-y-4">
          <p class="text-xs tracking-widest text-muted-foreground/60 uppercase">Error</p>
          <p class="text-sm text-muted-foreground">{{ puzzleStore.error }}</p>
          <button
            @click="handleBack"
            class="text-xs tracking-widest text-primary/70 hover:text-primary transition-colors uppercase"
          >
            Go Back
          </button>
        </div>
      </div>

      <!-- Grid Size Picker -->
      <div v-else-if="puzzleStore.phase === 'picking'" class="flex-grow flex items-center justify-center p-6">
        <div class="w-full max-w-sm mx-auto space-y-8">
          <div class="flex justify-center">
            <img
              :src="puzzleStore.puzzleImage"
              alt="Today's puzzle"
              class="w-48 h-auto rounded-xl shadow-lg object-cover"
            />
          </div>
          <div class="text-center space-y-2">
            <h2 class="text-lg tracking-[0.15em] text-foreground/80 font-light uppercase">
              Choose Difficulty
            </h2>
            <p class="text-xs tracking-wide text-muted-foreground/40">
              Grid size adapts to the image shape
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="option in puzzleStore.gridOptions"
              :key="option.label"
              @click="handleGridSelect(option)"
              class="flex flex-col items-center gap-1 p-4 rounded-xl border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
            >
              <p class="text-sm tracking-wide text-foreground/70 font-medium">{{ option.label }}</p>
              <p class="text-xs text-muted-foreground/40 font-mono">{{ option.cols }} x {{ option.rows }}</p>
              <p class="text-xs text-muted-foreground/30">{{ option.total }} pieces</p>
            </button>
          </div>
        </div>
      </div>

      <!-- Game Playing State -->
      <template v-else-if="puzzleStore.phase === 'playing'">
        <!-- Progress Bar -->
        <div class="shrink-0 px-4 pt-3 pb-2">
          <div class="max-w-md mx-auto">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs tracking-wide text-muted-foreground/50 uppercase">Progress</span>
              <span class="text-xs tracking-wide text-muted-foreground/60 font-mono">{{ progress }}%</span>
            </div>
            <div class="h-1 bg-muted/20 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary/50 transition-all duration-500 ease-out"
                :style="{ width: `${progress}%` }"
              />
            </div>
          </div>
        </div>

        <!-- Pan/Zoom Grid Area -->
        <div
          ref="containerRef"
          class="flex-grow overflow-hidden relative select-none"
          style="touch-action: none"
        >
          <!-- Transformed Grid Wrapper -->
          <div :style="transformStyle" class="will-change-transform">
            <PuzzleGrid
              :grid="puzzleStore.grid"
              :tile-size="BASE_TILE"
              :image="puzzleStore.puzzleImage"
              :grid-cols="puzzleStore.gridCols"
              :grid-rows="puzzleStore.gridRows"
              :selected-tile-id="selectedTileId"
              @cell-click="handleGridCellClick"
              @tile-click="handleGridTileClick"
            />
          </div>

          <!-- Zoom Controls -->
          <div class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <div class="inline-flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full border border-border/40 shadow-sm px-1 py-1">
              <button
                @click="zoomTowardCenter(-ZOOM_STEP)"
                class="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-width="2" d="M5 12h14" />
                </svg>
              </button>
              <span class="text-xs font-mono text-muted-foreground/60 w-10 text-center">{{ Math.round(scale * 100) }}%</span>
              <button
                @click="zoomTowardCenter(ZOOM_STEP)"
                class="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-width="2" d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Bottom Tray -->
    <div
      v-if="puzzleStore.phase === 'playing'"
      class="shrink-0 bg-background/95 backdrop-blur-sm border-t border-border/40 py-3 px-4"
    >
      <TileTray
        :tiles="puzzleStore.tray"
        :tile-size="TRAY_TILE_SIZE"
        :image="puzzleStore.puzzleImage"
        :grid-cols="puzzleStore.gridCols"
        :grid-rows="puzzleStore.gridRows"
        :selected-tile-id="selectedTileId"
        @tile-select="handleTileSelect"
        @tile-pointer-down="handleTilePointerDown"
      />
    </div>

    <!-- Completion Overlay -->
    <CompletionOverlay
      :visible="puzzleStore.phase === 'completed'"
      :image="puzzleStore.puzzleImage"
      :moves="puzzleStore.moves"
      :time="formattedTime"
    />

    <!-- Drag Ghost -->
    <div
      v-if="isDragging && dragTile"
      class="fixed z-50 pointer-events-none rounded-sm shadow-xl"
      :style="{
        left: `${dragPos.x - BASE_TILE * scale * 0.4}px`,
        top: `${dragPos.y - BASE_TILE * scale * 0.4}px`,
        width: `${BASE_TILE * scale * 0.8}px`,
        height: `${BASE_TILE * scale * 0.8}px`,
        backgroundImage: `url(${puzzleStore.puzzleImage})`,
        backgroundSize: `${puzzleStore.gridCols * 100}% ${puzzleStore.gridRows * 100}%`,
        backgroundPosition: `${(dragTile.correctCol / (puzzleStore.gridCols - 1)) * 100}% ${(dragTile.correctRow / (puzzleStore.gridRows - 1)) * 100}%`,
        filter: 'grayscale(80%)',
        opacity: 0.85,
      }"
    />
  </div>
</template>
