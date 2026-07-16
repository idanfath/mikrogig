import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const cardVariants = cva('rounded-[1.5rem] border text-card-foreground', {
    variants: {
        variant: {
            default: 'border-border bg-card shadow-[0_1px_0_rgb(26_23_20/0.03)]',
            elevated: 'border-border/80 bg-card shadow-soft',
            outline: 'border-border bg-transparent',
            ghost: 'border-transparent bg-transparent',
            glass: 'border-white/60 bg-white/75 shadow-soft backdrop-blur-xl',
            warm: 'border-brand/15 bg-brand-soft/45',
            dark: 'border-white/10 bg-foreground text-background shadow-soft',
        },
        padding: {
            none: 'p-0',
            sm: 'p-4',
            default: 'p-6',
            lg: 'p-7 sm:p-8',
        },
        hover: {
            true: 'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-soft',
            false: '',
        },
    },
    defaultVariants: {
        variant: 'default',
        padding: 'default',
        hover: false,
    },
});

function Card({ className, variant, padding, hover, ...props }: React.ComponentProps<'div'> & VariantProps<typeof cardVariants>) {
    return <div data-slot="card" className={cn(cardVariants({ variant, padding, hover }), className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-header" className={cn('flex flex-col gap-2', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
    return <h3 data-slot="card-title" className={cn('text-lg font-extrabold tracking-[-0.02em]', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
    return <p data-slot="card-description" className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-content" className={cn('pt-5', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-footer" className={cn('flex items-center gap-3 pt-6', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants };
