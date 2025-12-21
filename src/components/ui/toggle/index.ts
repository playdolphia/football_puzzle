import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Toggle } from "./Toggle.vue"

export const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none transition-all duration-200 whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100 data-[state=on]:bg-slate-100 dark:data-[state=on]:bg-slate-700/50 data-[state=on]:text-slate-900 dark:data-[state=on]:text-slate-100",
        outline:
          "bg-transparent hover:bg-slate-100/50 dark:hover:bg-slate-700/30 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl data-[state=on]:bg-slate-100 dark:data-[state=on]:bg-slate-700/50 data-[state=on]:text-slate-900 dark:data-[state=on]:text-slate-100",
        // MV3 game variant - minimal, text only
        game: "bg-transparent border-0 text-white/50 rounded-none hover:text-white/70 data-[state=on]:text-[#4fd4d4] data-[state=on]:border-b-2 data-[state=on]:border-[#4fd4d4]",
      },
      size: {
        default: "h-10 px-3 min-w-10",
        sm: "h-9 px-2 min-w-9",
        lg: "h-12 px-4 min-w-12",
        game: "h-auto px-0 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ToggleVariants = VariantProps<typeof toggleVariants>
