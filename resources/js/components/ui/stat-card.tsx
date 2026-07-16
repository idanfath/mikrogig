import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const statCardVariants = cva('relative overflow-hidden rounded-2xl border', {
    variants: {
        variant: {
            default: 'border-border bg-card',
            orange: 'border-brand/20 bg-brand-soft/50',
            success: 'border-success/20 bg-success-soft',
            dark: 'border-white/10 bg-foreground text-background',
        },
        size: { sm: 'p-4', md: 'p-5', lg: 'p-7' },
    },
    defaultVariants: { variant: 'default', size: 'md' },
});

export interface StatCardProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof statCardVariants> {
    icon?: React.ReactNode;
    value: React.ReactNode;
    label: React.ReactNode;
    description?: React.ReactNode;
    trend?: React.ReactNode;
}

function StatCard({ className, variant, size, icon, value, label, description, trend, ...props }: StatCardProps) {
    return (
        <div className={cn(statCardVariants({ variant, size }), className)} {...props}>
            <div className="flex items-start justify-between gap-4">
                {icon && <div className="grid size-10 place-items-center rounded-xl bg-brand-soft text-primary">{icon}</div>}
                {trend && <div className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success">{trend}</div>}
            </div>
            <div className="mt-5">
                <div className="text-2xl font-extrabold tracking-[-0.04em]">{value}</div>
                <div className="mt-1 text-sm font-bold">{label}</div>
                {description && <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>}
            </div>
        </div>
    );
}

export { StatCard };
