import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

// Monument Valley inspired button - soft gradients, rounded corners, subtle shadows
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer border-0 hover:scale-[1.02] active:scale-[0.98] rounded-2xl",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-emerald-400 to-emerald-500 text-emerald-50 shadow-[0_4px_0_0_rgba(16,185,129,1),0_6px_16px_-4px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_0_0_rgba(16,185,129,1),0_8px_20px_-4px_rgba(16,185,129,0.5)] active:shadow-[0_2px_0_0_rgba(16,185,129,1),0_4px_12px_-4px_rgba(16,185,129,0.3)] active:translate-y-[2px]",
        destructive:
          "bg-gradient-to-b from-rose-400 to-rose-500 text-rose-50 shadow-[0_4px_0_0_rgba(244,63,94,1),0_6px_16px_-4px_rgba(244,63,94,0.4)] hover:shadow-[0_6px_0_0_rgba(244,63,94,1),0_8px_20px_-4px_rgba(244,63,94,0.5)] active:shadow-[0_2px_0_0_rgba(244,63,94,1),0_4px_12px_-4px_rgba(244,63,94,0.3)] active:translate-y-[2px]",
        outline:
          "bg-gradient-to-b from-slate-100 to-slate-200 text-slate-600 shadow-[0_4px_0_0_rgba(148,163,184,1),0_6px_16px_-4px_rgba(148,163,184,0.3)] hover:shadow-[0_6px_0_0_rgba(148,163,184,1),0_8px_20px_-4px_rgba(148,163,184,0.4)] active:shadow-[0_2px_0_0_rgba(148,163,184,1),0_4px_12px_-4px_rgba(148,163,184,0.2)] active:translate-y-[2px]",
        secondary:
          "bg-gradient-to-b from-sky-400 to-sky-500 text-sky-50 shadow-[0_4px_0_0_rgba(14,165,233,1),0_6px_16px_-4px_rgba(14,165,233,0.4)] hover:shadow-[0_6px_0_0_rgba(14,165,233,1),0_8px_20px_-4px_rgba(14,165,233,0.5)] active:shadow-[0_2px_0_0_rgba(14,165,233,1),0_4px_12px_-4px_rgba(14,165,233,0.3)] active:translate-y-[2px]",
        ghost:
          "bg-transparent hover:bg-white/10 text-slate-600 dark:text-slate-300 shadow-none",
        link: "bg-transparent text-sky-500 underline-offset-4 hover:underline shadow-none hover:scale-100",
      },
      size: {
        default: "h-11 px-6 py-2.5 has-[>svg]:px-4",
        sm: "h-9 gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-14 px-8 has-[>svg]:px-6 text-base font-semibold",
        icon: "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
