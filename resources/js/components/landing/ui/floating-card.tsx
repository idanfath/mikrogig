import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const floatingCardVariants = cva('rounded-2xl border', {
    variants: {
        variant: {
            default: 'border-border bg-card shadow-lg',
            glass: 'border-white/60 bg-white/80 shadow-lg backdrop-blur-xl',
            dark: 'border-white/10 bg-foreground text-background shadow-lg',
            orange: 'border-primary/20 bg-accent text-foreground',
            success: 'border-success/20 bg-success-soft text-foreground',
        },
        size: { sm: 'p-4', md: 'p-5', lg: 'p-6' },
        interactive: {
            true: 'transition-transform duration-200 hover:-translate-y-1',
            false: '',
        },
    },
    defaultVariants: { variant: 'default', size: 'md', interactive: false },
});

export interface FloatingCardProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof floatingCardVariants> {
    icon?: React.ReactNode;
    heading?: React.ReactNode;
    subtitle?: React.ReactNode;
    value?: React.ReactNode;
}

function FloatingCard({ className, variant, size, interactive, icon, heading, subtitle, value, children, ...props }: FloatingCardProps) {
    return (
        <div className={cn(floatingCardVariants({ variant, size, interactive }), className)} {...props}>
            {(icon || heading || value) && (
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        {icon && <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">{icon}</div>}
                        <div>
                            {heading && <h4 className="text-sm font-extrabold">{heading}</h4>}
                            {subtitle && <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>}
                        </div>
                    </div>
                    {value && <div className="text-right text-lg font-extrabold tracking-tight">{value}</div>}
                </div>
            )}
            {children && <div className={cn((icon || heading || value) && 'mt-5')}>{children}</div>}
        </div>
    );
}

export { FloatingCard, floatingCardVariants };
