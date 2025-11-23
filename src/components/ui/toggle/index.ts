import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Toggle } from "./Toggle.vue"

export const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 text-sm font-bold hover:bg-gray-800 hover:text-white disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-blue-700 data-[state=on]:text-white data-[state=on]:border-blue-950 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none transition-all whitespace-nowrap border-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:scale-105 data-[state=on]:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] text-gray-300",
  {
    variants: {
      variant: {
        default: "bg-gray-700 border-gray-950",
        outline:
          "border-gray-950 bg-gray-800 hover:bg-gray-700",
      },
      size: {
        default: "h-10 px-3 min-w-10",
        sm: "h-9 px-2 min-w-9",
        lg: "h-12 px-4 min-w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ToggleVariants = VariantProps<typeof toggleVariants>
