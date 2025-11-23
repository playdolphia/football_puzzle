<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useVModel } from "@vueuse/core"
import { cn } from "@/lib/utils"

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes["class"]
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    data-slot="input"
    :class="cn(
      'file:text-white placeholder:text-gray-400 selection:bg-blue-600 selection:text-white bg-gray-800 flex h-10 w-full min-w-0 border-4 border-gray-950 bg-transparent px-3 py-1 text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-white font-bold',
      'focus-visible:border-blue-600 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]',
      'aria-invalid:border-red-600',
      props.class,
    )"
    style="border-radius: 0; font-family: 'Courier New', monospace;"
  >
</template>
