import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

// Badge - Monument Valley 3 style: minimal, text-only with subtle accents
export const badgeVariants = cva(
  "inline-flex items-center justify-center px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 tracking-wide uppercase",
  {
    variants: {
      variant: {
        default:
          "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 [a&]:hover:bg-emerald-200 dark:[a&]:hover:bg-emerald-800/50 border rounded-full",
        secondary:
          "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-900/50 dark:text-sky-300 [a&]:hover:bg-sky-200 dark:[a&]:hover:bg-sky-800/50 border rounded-full",
        destructive:
          "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-900/50 dark:text-rose-300 [a&]:hover:bg-rose-200 dark:[a&]:hover:bg-rose-800/50 border rounded-full",
        outline:
          "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 [a&]:hover:bg-slate-200 dark:[a&]:hover:bg-slate-700/50 border rounded-full",
        // MV3 style - no background, text only
        game:
          "border-0 bg-transparent text-white/70",
        "game-primary":
          "border-0 bg-transparent text-[#4fd4d4]",
        "game-muted":
          "border-0 bg-transparent text-white/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
