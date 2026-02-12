<template>
  <div class="w-full bg-muted/30 rounded-xl p-4">
    <div
      v-if="tiles.length > 0"
      ref="scrollContainer"
      class="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent snap-x snap-mandatory pb-2"
      style="scroll-padding: 1rem; touch-action: pan-x; -webkit-overflow-scrolling: touch"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div
        v-for="tile in tiles"
        :key="tile.id"
        class="shrink-0 snap-start"
        @pointerdown="onTilePointerDown(tile, $event)"
      >
        <PuzzleTile
          :tile="tile"
          :image="image"
          :grid-cols="gridCols"
          :grid-rows="gridRows"
          :tile-size="tileSize * 0.8"
          :is-correct="false"
          :is-in-grid="false"
          :is-selected="selectedTileId === tile.id"
          @select="emit('tile-select', tile.id)"
        />
      </div>
    </div>

    <div
      v-else
      class="flex items-center justify-center py-8 text-muted-foreground"
      :style="{ minHeight: `${tileSize * 0.8 + 16}px` }"
    >
      <div class="text-center space-y-1">
        <p class="text-sm font-medium tracking-wide">All tiles placed</p>
        <p class="text-xs opacity-70">Complete the puzzle correctly to finish</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PuzzleTile from './PuzzleTile.vue'

interface Tile {
  id: number
  correctRow: number
  correctCol: number
}

interface Props {
  tiles: Tile[]
  image: string
  gridCols: number
  gridRows: number
  tileSize: number
  selectedTileId: number | null
}

defineProps<Props>()

const emit = defineEmits<{
  'tile-select': [tileId: number]
  'tile-pointer-down': [payload: { tile: Tile; event: PointerEvent }]
}>()

const scrollContainer = ref<HTMLElement | null>(null)

// Touch scroll handling — track whether the user is scrolling horizontally
// so we can suppress the tile drag that would otherwise fire
let touchStartX = 0
let touchStartY = 0
let isScrolling = false

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  isScrolling = false
}

function onTouchMove(e: TouchEvent) {
  const dx = Math.abs(e.touches[0].clientX - touchStartX)
  const dy = Math.abs(e.touches[0].clientY - touchStartY)
  if (dx > dy && dx > 5) {
    isScrolling = true
  }
}

function onTouchEnd() {
  isScrolling = false
}

function onTilePointerDown(tile: Tile, event: PointerEvent) {
  // On touch devices, don't start drag immediately — let the scroll handler decide
  if (event.pointerType === 'touch') {
    // Wait a short moment to see if this becomes a horizontal scroll
    const startX = event.clientX
    const startY = event.clientY

    const onMove = (e: PointerEvent) => {
      const dx = Math.abs(e.clientX - startX)
      const dy = Math.abs(e.clientY - startY)

      if (dx > 5 || dy > 5) {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)

        // Horizontal = scroll, let browser handle it
        if (dx > dy) return

        // Vertical = drag tile
        emit('tile-pointer-down', { tile, event })
      }
    }

    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      // No significant movement = tap/select
      if (!isScrolling) {
        emit('tile-pointer-down', { tile, event })
      }
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  } else {
    emit('tile-pointer-down', { tile, event })
  }
}
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  height: 6px;
}

.scrollbar-thumb-muted::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted));
  border-radius: 3px;
}

.scrollbar-thumb-muted::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.3);
}

.scrollbar-track-transparent::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>
