import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive-soft text-destructive focus-visible:ring-destructive/20 [a]:hover:bg-destructive-soft/80",
        success:
          "bg-success-soft text-success focus-visible:ring-success/20 [a]:hover:bg-success-soft/80",
        warning:
          "bg-warning-soft text-warning focus-visible:ring-warning/20 [a]:hover:bg-warning-soft/80",
        accent: "bg-accent text-accent-foreground [a]:hover:bg-accent/80",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        dark: "border-white/10 bg-white/10 text-white [a]:hover:bg-white/20",
      },
      size: {
        sm: "h-4 px-1.5 text-[10px]",
        default: "h-5 px-2 py-0.5",
        lg: "h-6 px-3 py-1 font-semibold",
        xl: "h-7 px-4 py-1.5 text-sm font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
