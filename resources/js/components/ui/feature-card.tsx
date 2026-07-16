import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const featureCardVariants = cva('relative h-full overflow-hidden rounded-[1.5rem] border p-6 sm:p-7', {
    variants: {
        tone: {
            default: 'border-border bg-card',
            orange: 'border-brand/15 bg-brand-soft/55',
            green: 'border-success/15 bg-success-soft',
            dark: 'border-white/10 bg-foreground text-background',
        },
    },
    defaultVariants: { tone: 'default' },
});

export interface FeatureCardProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
        VariantProps<typeof featureCardVariants> {
    icon: React.ReactNode;
    title: React.ReactNode;
    description: React.ReactNode;
    eyebrow?: React.ReactNode;
    visual?: React.ReactNode;
}

function FeatureCard({ icon, title, description, eyebrow, visual, tone, className, ...props }: FeatureCardProps) {
    const inverse = tone === 'dark';

    return (
        <div className={cn(featureCardVariants({ tone }), className)} {...props}>
            <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                    <span className={cn('grid size-11 place-items-center rounded-xl', inverse ? 'bg-white/10 text-brand' : 'bg-white/80 text-primary shadow-sm')}>{icon}</span>
                    {eyebrow && <span className={cn('text-[11px] font-extrabold tracking-[0.08em] uppercase', inverse ? 'text-white/55' : 'text-muted-foreground')}>{eyebrow}</span>}
                </div>
                <div className="mt-8">
                    <h3 className="text-xl font-extrabold tracking-[-0.03em]">{title}</h3>
                    <p className={cn('mt-3 text-sm leading-6', inverse ? 'text-white/65' : 'text-muted-foreground')}>{description}</p>
                </div>
                {visual && <div className="mt-auto pt-7">{visual}</div>}
            </div>
        </div>
    );
}

export { FeatureCard };
