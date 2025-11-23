import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer border-4 hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-blue-700 hover:bg-blue-600 border-blue-950 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]",
        destructive:
          "bg-red-700 hover:bg-red-600 border-red-950 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]",
        outline:
          "bg-gray-700 hover:bg-gray-600 border-gray-950 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]",
        secondary:
          "bg-green-700 hover:bg-green-600 border-green-950 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]",
        ghost:
          "bg-transparent hover:bg-gray-800 border-transparent text-white shadow-none",
        link: "bg-transparent border-transparent text-blue-400 underline-offset-4 hover:underline shadow-none hover:scale-100",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 px-6 has-[>svg]:px-4 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
