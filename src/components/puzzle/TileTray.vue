<template>
  <div class="w-full bg-muted/30 rounded-xl p-4">
    <div
      v-if="tiles.length > 0"
      class="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent snap-x snap-mandatory pb-2"
      style="scroll-padding: 1rem"
    >
      <div
        v-for="tile in tiles"
        :key="tile.id"
        class="shrink-0 snap-start"
        @pointerdown="emit('tile-pointer-down', { tile, event: $event })"
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
