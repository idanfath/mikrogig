import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Container } from '@/components/layout/container';
import { cn } from '@/lib/utils';

const sectionVariants = cva('relative w-full scroll-mt-24', {
    variants: {
        spacing: {
            none: '',
            sm: 'py-14 sm:py-18',
            default: 'py-20 sm:py-24 lg:py-28',
            lg: 'py-24 sm:py-28 lg:py-36',
        },
        background: {
            default: 'bg-background',
            muted: 'bg-muted/45',
            card: 'bg-card',
            warm: 'bg-brand-soft/35',
            dark: 'bg-foreground text-background',
            gradient: 'bg-gradient-to-b from-background via-brand-soft/25 to-background',
        },
    },
    defaultVariants: { spacing: 'default', background: 'default' },
});

export interface SectionProps
    extends React.HTMLAttributes<HTMLElement>,
        VariantProps<typeof sectionVariants> {
    container?: boolean;
    containerClassName?: string;
}

function Section({ className, spacing, background, container = true, containerClassName, children, ...props }: SectionProps) {
    return (
        <section className={cn(sectionVariants({ spacing, background }), className)} {...props}>
            {container ? <Container className={containerClassName}>{children}</Container> : children}
        </section>
    );
}

export { Section, sectionVariants };
