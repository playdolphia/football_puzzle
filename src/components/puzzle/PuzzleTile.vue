<template>
  <div
    :style="{
      width: `${tileSize}px`,
      height: `${tileSize}px`,
      backgroundImage: `url(${image})`,
      backgroundSize: `${gridCols * 100}% ${gridRows * 100}%`,
      backgroundPosition: `${(tile.correctCol / (gridCols - 1)) * 100}% ${(tile.correctRow / (gridRows - 1)) * 100}%`,
      filter: isInGrid && !isCorrect ? 'grayscale(100%)' : 'none',
    }"
    :class="[
      'rounded-sm cursor-pointer transition-all duration-300',
      isSelected ? 'ring-2 ring-primary/60 shadow-md' : 'shadow-sm hover:shadow-md',
      isInGrid && isCorrect && 'ring-2 ring-green-500',
      isInGrid && !isCorrect && 'ring-2 ring-red-500',
    ]"
    @click="emit('select')"
  />
</template>

<script setup lang="ts">
interface Tile {
  id: number
  correctRow: number
  correctCol: number
}

interface Props {
  tile: Tile
  image: string
  gridCols: number
  gridRows: number
  tileSize: number
  isCorrect: boolean
  isInGrid: boolean
  isSelected: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  select: []
}>()
</script>
