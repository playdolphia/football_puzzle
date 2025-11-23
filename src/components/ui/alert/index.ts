import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Alert } from "./Alert.vue"
export { default as AlertDescription } from "./AlertDescription.vue"
export { default as AlertTitle } from "./AlertTitle.vue"

export const alertVariants = cva(
  "relative w-full border border-slate-200/50 dark:border-slate-700/50 px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current font-medium rounded-2xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)] backdrop-blur-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-slate-50/95 to-slate-100/95 dark:from-slate-800/95 dark:to-slate-900/95 text-slate-700 dark:text-slate-200",
        destructive:
          "bg-gradient-to-b from-rose-50/95 to-rose-100/95 dark:from-rose-900/30 dark:to-rose-950/30 text-rose-700 dark:text-rose-200 border-rose-200/50 dark:border-rose-700/50 [&>svg]:text-current *:data-[slot=alert-description]:text-rose-600/90 dark:*:data-[slot=alert-description]:text-rose-300/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export type AlertVariants = VariantProps<typeof alertVariants>
