import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow] duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_8px_24px_-12px_rgba(232,114,12,0.9)] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_12px_28px_-12px_rgba(232,114,12,0.75)]',
        outline:
          'border-border bg-background/80 text-foreground shadow-xs hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent hover:text-foreground aria-expanded:bg-muted',
        secondary:
          'bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary/75 aria-expanded:bg-secondary',
        ghost:
          'text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted',
        soft: 'bg-primary/10 text-primary hover:-translate-y-0.5 hover:bg-primary/15',
        inverse:
          'bg-background text-foreground shadow-lg hover:-translate-y-0.5 hover:bg-background/90',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20',
        link: 'h-auto rounded-none border-0 p-0 text-primary underline-offset-4 shadow-none hover:underline',
      },
      size: {
        default: 'h-10 gap-2 px-4',
        xs: 'h-7 gap-1 rounded-lg px-2.5 text-xs [&_svg:not([class*=\'size-\'])]:size-3',
        sm: 'h-9 gap-1.5 rounded-lg px-3.5 text-xs',
        lg: 'h-12 gap-2.5 rounded-xl px-6 text-sm',
        xl: 'h-14 gap-2.5 rounded-2xl px-7 text-base',
        icon: 'size-10',
        "icon-xs":
          "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          'size-9 rounded-lg',
        'icon-lg': 'size-12 rounded-xl',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
