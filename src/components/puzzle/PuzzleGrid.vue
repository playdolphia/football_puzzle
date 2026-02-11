<template>
  <div class="relative inline-block">
    <!-- Ghost background image -->
    <div
      :style="{
        width: `${gridCols * tileSize + (gridCols - 1) * 2}px`,
        height: `${gridRows * tileSize + (gridRows - 1) * 2}px`,
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }"
      class="absolute inset-0 opacity-20 rounded-lg"
    />

    <!-- Grid -->
    <div
      :style="{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, ${tileSize}px)`,
        gridTemplateRows: `repeat(${gridRows}, ${tileSize}px)`,
        gap: '2px',
      }"
      class="relative z-10"
      data-puzzle-grid
    >
      <template v-for="(row, rowIdx) in grid" :key="rowIdx">
        <template v-for="(cell, colIdx) in row" :key="`${rowIdx}-${colIdx}`">
          <!-- Cell with tile -->
          <div
            v-if="cell.tile"
            @click="emit('tile-click', { row: rowIdx, col: colIdx, tile: cell.tile })"
          >
            <PuzzleTile
              :tile="cell.tile"
              :image="image"
              :grid-cols="gridCols"
              :grid-rows="gridRows"
              :tile-size="tileSize"
              :is-correct="isTileCorrect(cell.tile, rowIdx, colIdx)"
              :is-in-grid="true"
              :is-selected="selectedTileId === cell.tile.id"
              @select="emit('tile-click', { row: rowIdx, col: colIdx, tile: cell.tile })"
            />
          </div>

          <!-- Empty cell -->
          <div
            v-else
            :style="{
              width: `${tileSize}px`,
              height: `${tileSize}px`,
            }"
            :class="[
              'rounded-sm transition-all duration-200 cursor-pointer',
              'border border-dashed border-primary/30',
              selectedTileId !== null && 'hover:border-primary/50 hover:bg-primary/10',
            ]"
            @click="emit('cell-click', { row: rowIdx, col: colIdx })"
          />
        </template>
      </template>
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

interface Cell {
  tile: Tile | null
}

interface Props {
  image: string
  gridCols: number
  gridRows: number
  grid: Cell[][]
  tileSize: number
  selectedTileId: number | null
}

defineProps<Props>()

const emit = defineEmits<{
  'cell-click': [payload: { row: number; col: number }]
  'tile-click': [payload: { row: number; col: number; tile: Tile }]
}>()

function isTileCorrect(tile: Tile, row: number, col: number): boolean {
  return tile.correctRow === row && tile.correctCol === col
}
</script>
