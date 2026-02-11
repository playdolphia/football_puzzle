import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

// Button - Patterned by Borderleap style: serene, minimal, soft natural tones
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer border-0 rounded-xl",
  {
    variants: {
      variant: {
        default:
          "bg-[#8ba888] text-white shadow-sm hover:bg-[#7a9777] active:bg-[#6a8667] hover:shadow-md transition-colors",
        secondary:
          "bg-[#e8ede7] text-[#4a5a47] shadow-sm hover:bg-[#dae3d8] active:bg-[#ccd8ca]",
        outline:
          "bg-transparent border border-[#8ba888] text-[#8ba888] hover:bg-[#8ba888]/5 active:bg-[#8ba888]/10",
        ghost:
          "bg-transparent text-[#4a5a47] hover:bg-[#8ba888]/10 active:bg-[#8ba888]/15",
        link:
          "bg-transparent text-[#8ba888] underline-offset-4 hover:underline hover:text-[#7a9777] shadow-none",
        destructive:
          "bg-[#d4a59a] text-white shadow-sm hover:bg-[#c99488] active:bg-[#be8376]",
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
