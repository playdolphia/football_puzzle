import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

// Button - Monument Valley 3 style: minimal, no backgrounds, cyan accent
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer border-0 rounded-2xl",
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
        // Monument Valley 3 style - minimal, no background, text only
        game:
          "bg-transparent text-white/70 font-medium tracking-wide uppercase hover:text-white active:text-[#4fd4d4] shadow-none rounded-none",
        "game-primary":
          "bg-transparent text-[#4fd4d4] font-medium tracking-wide uppercase hover:text-[#7fe5e5] active:text-white shadow-none rounded-none",
        "game-secondary":
          "bg-transparent text-white/50 font-medium tracking-wide uppercase hover:text-white/70 active:text-[#4fd4d4] shadow-none rounded-none",
        "game-outline":
          "bg-transparent text-white/70 font-medium tracking-wide uppercase border border-white/20 hover:border-[#4fd4d4] hover:text-[#4fd4d4] active:text-white shadow-none rounded-none",
        "game-ghost":
          "bg-transparent text-white/50 font-medium tracking-wide uppercase hover:bg-white/5 hover:text-white/70 active:text-[#4fd4d4] shadow-none rounded-none",
        "game-destructive":
          "bg-transparent text-rose-400/70 font-medium tracking-wide uppercase hover:text-rose-400 active:text-rose-300 shadow-none rounded-none",
        "game-icon":
          "bg-transparent text-white/50 hover:text-[#4fd4d4] active:text-white shadow-none rounded-none",
      },
      size: {
        default: "h-11 px-6 py-2.5 has-[>svg]:px-4",
        sm: "h-9 gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-14 px-8 has-[>svg]:px-6 text-base font-semibold",
        icon: "size-11 rounded-xl",
        // MV3 style sizes
        game: "h-12 px-4 py-2 text-sm",
        "game-sm": "h-9 px-3 py-1.5 text-xs",
        "game-lg": "h-14 px-6 py-3 text-base",
        "game-icon": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
