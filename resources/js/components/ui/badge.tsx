import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-[0.01em] [&>svg]:size-3.5',
    {
        variants: {
            variant: {
                default: 'border-primary bg-primary text-primary-foreground',
                secondary: 'border-border bg-secondary text-secondary-foreground',
                accent: 'border-brand/20 bg-brand-soft text-primary',
                outline: 'border-border bg-background text-foreground',
                success: 'border-success/20 bg-success-soft text-success',
                dark: 'border-white/10 bg-white/10 text-white',
                destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
    return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
