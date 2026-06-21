import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Root layout variants. `default` keeps the original shadcn sizing (no extra
 * padding) so existing sliders such as the FilterPanel ones are unchanged.
 * `compact` insets the entire Radix root with margin instead of padding. Radix
 * computes pointer positions from the root box, so padding would make the
 * visible track endpoints map to interior values.
 */
const sliderRootVariants = cva(
  'relative flex w-full touch-none select-none items-center',
  {
    variants: {
      size: {
        default: '',
        compact: 'mx-5 w-[calc(100%-2.5rem)]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

// Visible track height per variant.
const sliderTrackSizes = {
  default: 'h-2',
  compact: 'h-1.5',
} as const

/**
 * Thumb classes per variant.
 *
 * `default` — original shadcn knob (h-5 w-5).
 * `compact` — a slimmer visible knob (16px) drawn via a ::before pseudo-element
 * inside a larger transparent touch target (40px) so the handle stays easy to
 * grab on touch screens while taking up less visual space. The transparent
 * element also carries the focus ring, surfacing the full touch target when
 * focused via keyboard. Edge visibility of the handle is provided by the
 * compact root margin, keeping Radix's pointer math aligned with the visible
 * track.
 */
const sliderThumbSizes = {
  default:
    'block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  compact:
    'relative block h-10 w-10 cursor-grab touch-none rounded-full bg-transparent ring-offset-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:cursor-grabbing disabled:pointer-events-none disabled:opacity-50 before:content-[""] before:absolute before:left-1/2 before:top-1/2 before:block before:h-4 before:w-4 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:border-2 before:border-primary before:bg-background before:shadow-sm before:transition-transform hover:before:scale-110',
} as const

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & VariantProps<typeof sliderRootVariants>
>(({ className, size = 'default', ...props }, ref) => {
  const resolvedSize = size ?? 'default'
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(sliderRootVariants({ size }), className)}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          'relative w-full grow overflow-hidden rounded-full bg-secondary',
          sliderTrackSizes[resolvedSize]
        )}
      >
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={sliderThumbSizes[resolvedSize]} />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider, sliderRootVariants }
