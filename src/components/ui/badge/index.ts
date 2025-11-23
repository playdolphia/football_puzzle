import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

export const badgeVariants = cva(
  "inline-flex items-center justify-center border-2 px-2 py-0.5 text-xs font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]",
  {
    variants: {
      variant: {
        default:
          "border-blue-950 bg-blue-700 text-white [a&]:hover:bg-blue-600",
        secondary:
          "border-green-950 bg-green-700 text-white [a&]:hover:bg-green-600",
        destructive:
         "border-red-950 bg-red-700 text-white [a&]:hover:bg-red-600",
        outline:
          "border-gray-950 bg-gray-700 text-white [a&]:hover:bg-gray-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
