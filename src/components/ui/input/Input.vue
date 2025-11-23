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
      'file:text-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500 selection:bg-emerald-200 selection:text-emerald-900 bg-white/80 dark:bg-slate-800/80 flex h-11 w-full min-w-0 border border-slate-200/50 dark:border-slate-700/50 px-4 py-2 text-base shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-slate-700 dark:text-slate-200 font-medium rounded-xl backdrop-blur-sm',
      'focus-visible:border-emerald-400 focus-visible:shadow-[0_4px_12px_-2px_rgba(16,185,129,0.2)] focus-visible:ring-2 focus-visible:ring-emerald-400/20',
      'aria-invalid:border-rose-400 aria-invalid:ring-2 aria-invalid:ring-rose-400/20',
      props.class,
    )"
  >
</template>
